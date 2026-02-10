import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StreamableHTTPServerTransport } from "@modelcontextprotocol/sdk/server/streamableHttp.js";
import type { Express, Request, Response } from "express";
import { z } from "zod";
import { analyzeEmail } from "./services/email-analyzer";
import {
  validateSkyfireToken,
  chargeSkyfireToken,
  isSkyfireConfigured,
} from "./services/skyfire";
import { validateApiToken, getTokenWithOwner, createAutonomousToken } from "./services/token";
import { chargeForEmailCheck } from "./services/payment";
import { storage } from "./storage";
import type { CheckEmailRequest, CheckEmailResponse } from "@shared/schema";

const TOOL_DESCRIPTION = "Analyze an email for phishing, social engineering, prompt injection, and other threats targeting AI agents. Returns a safety verdict, risk score, detected threats, and recommended actions. Costs $0.02 per check - payment via skyfire-pay-id header (Skyfire PAY token) or Authorization: Bearer <token>. By using this tool you accept the Terms of Service at https://agentsafe.locationledger.com/terms. This is an advisory service; we are not liable for undetected threats or agent actions based on results.";

const TOOL_SCHEMA = {
  from: z.string().describe("Sender email address"),
  subject: z.string().describe("Email subject line"),
  body: z.string().describe("Email body content"),
  links: z.array(z.string()).optional().describe("URLs found in the email"),
  attachments: z.array(z.object({
    name: z.string(),
    size: z.number(),
    type: z.string().optional(),
  })).optional().describe("Attachment metadata"),
  knownSender: z.boolean().optional().describe("Whether the sender is known/trusted"),
  previousCorrespondence: z.boolean().optional().describe("Whether there has been previous email exchange"),
};

function mcpError(message: string, details?: string) {
  return {
    content: [{
      type: "text" as const,
      text: JSON.stringify(details ? { error: message, details } : { error: message }),
    }],
    isError: true,
  };
}

let skyfireSystemTokenId: string | null = null;

async function getOrCreateSkyfireSystemToken(): Promise<string> {
  if (skyfireSystemTokenId) {
    const existing = await storage.getAgentToken(skyfireSystemTokenId);
    if (existing && existing.status === "active") {
      return skyfireSystemTokenId;
    }
  }

  const existingTokens = await storage.getAgentTokenByHash("skyfire_system_token_hash");
  if (existingTokens) {
    skyfireSystemTokenId = existingTokens.id;
    return skyfireSystemTokenId;
  }

  const { tokenRecord } = await createAutonomousToken(
    "skyfire-system",
    "Skyfire Pay-Per-Use",
    "skyfire:system",
    "skyfire",
    365
  );
  skyfireSystemTokenId = tokenRecord.id;
  return skyfireSystemTokenId;
}

function buildEmailRequest(args: any): CheckEmailRequest {
  return {
    email: {
      from: args.from,
      subject: args.subject,
      body: args.body,
      links: args.links,
      attachments: args.attachments,
    },
    context: {
      knownSender: args.knownSender,
      previousCorrespondence: args.previousCorrespondence,
    },
  };
}

async function recordEmailCheck(
  tokenId: string,
  emailRequest: CheckEmailRequest,
  analysisResult: any,
  durationMs: number,
  paymentType: string,
  paymentReference: string | null,
): Promise<string> {
  const emailCheck = await storage.createEmailCheck({
    tokenId,
    senderDomain: emailRequest.email.from.split("@")[1] || null,
    hasLinks: (emailRequest.email.links?.length || 0) > 0,
    hasAttachments: (emailRequest.email.attachments?.length || 0) > 0,
    verdict: analysisResult.verdict,
    riskScore: String(analysisResult.riskScore),
    confidence: String(analysisResult.confidence),
    threatsDetected: analysisResult.threats,
    chargedAmount: "0.02",
    paymentType,
    paymentReference,
    analysisDurationMs: durationMs,
  });

  await storage.updateAgentTokenUsage(tokenId);
  await storage.createUsageLog({
    tokenId,
    action: "email_check",
    amount: "0.02",
    paymentStatus: "success",
  });

  return emailCheck.id;
}

function createPerRequestMcpServer(
  skyfireToken: string | undefined,
  bearerToken: string | undefined,
): McpServer {
  const server = new McpServer({
    name: "SafeMessage",
    version: "1.0.0",
  });

  server.tool(
    "check_email_safety",
    TOOL_DESCRIPTION,
    TOOL_SCHEMA,
    async (args) => {
      if (!skyfireToken && !bearerToken) {
        return mcpError(
          "Payment required",
          "Include a skyfire-pay-id header with a Skyfire PAY token, or an Authorization: Bearer <token> header."
        );
      }

      const emailRequest = buildEmailRequest(args);

      if (skyfireToken) {
        if (!isSkyfireConfigured()) {
          return mcpError("Skyfire payments not available", "Server Skyfire integration is not configured.");
        }

        const validation = await validateSkyfireToken(skyfireToken);
        if (!validation.valid) {
          return mcpError("Invalid Skyfire token", validation.error);
        }

        const chargeResult = await chargeSkyfireToken(skyfireToken, 0.02);
        if (!chargeResult.success) {
          return mcpError("Skyfire payment failed", chargeResult.error);
        }

        const { result: analysisResult, durationMs } = await analyzeEmail(emailRequest);

        let checkId = "mcp-" + Date.now().toString(36);
        try {
          const systemTokenId = await getOrCreateSkyfireSystemToken();
          checkId = await recordEmailCheck(
            systemTokenId, emailRequest, analysisResult, durationMs,
            "skyfire", chargeResult.transactionId || null,
          );
          console.log(`MCP Skyfire: buyer=${validation.claims?.sub || "unknown"}, txn=${chargeResult.transactionId}, check=${checkId}`);
        } catch (e) {
          console.error("MCP: Failed to record Skyfire email check:", e);
        }

        return buildToolResponse(analysisResult, checkId);
      }

      if (bearerToken) {
        const tokenValidation = await validateApiToken(bearerToken);
        if (!tokenValidation.valid || !tokenValidation.tokenRecord) {
          return mcpError("Invalid token", tokenValidation.error);
        }

        const tokenRecord = tokenValidation.tokenRecord;

        if (tokenRecord.agentType === "delegated") {
          const tokenWithOwner = await getTokenWithOwner(tokenRecord.id);
          if (!tokenWithOwner?.stripeCustomerId || !tokenWithOwner?.stripePaymentMethodId) {
            return mcpError("Payment method not configured");
          }

          const paymentResult = await chargeForEmailCheck(
            tokenWithOwner.stripeCustomerId,
            tokenWithOwner.stripePaymentMethodId
          );

          if (!paymentResult.success) {
            return mcpError("Payment failed", paymentResult.error);
          }
        }

        const { result: analysisResult, durationMs } = await analyzeEmail(emailRequest);

        let checkId = "mcp-" + Date.now().toString(36);
        try {
          checkId = await recordEmailCheck(
            tokenRecord.id, emailRequest, analysisResult, durationMs,
            tokenRecord.agentType === "delegated" ? "stripe" : "wallet", null,
          );
        } catch (e) {
          console.error("MCP: Failed to record Bearer email check:", e);
        }

        return buildToolResponse(analysisResult, checkId);
      }

      return mcpError("Payment required");
    }
  );

  return server;
}

function buildToolResponse(analysisResult: any, checkId: string) {
  const response: CheckEmailResponse = {
    verdict: analysisResult.verdict,
    riskScore: analysisResult.riskScore,
    confidence: analysisResult.confidence,
    threats: analysisResult.threats,
    recommendation: analysisResult.recommendation,
    explanation: analysisResult.explanation,
    safeActions: analysisResult.safeActions,
    unsafeActions: analysisResult.unsafeActions,
    checkId,
    charged: 0.02,
    termsOfService: "https://agentsafe.locationledger.com/terms",
    termsAccepted: "By using this service you have accepted the Terms of Service. This is an advisory service only.",
  };

  return {
    content: [{
      type: "text" as const,
      text: JSON.stringify(response, null, 2),
    }],
  };
}

export function mountMcpServer(app: Express): void {
  app.post("/mcp", async (req: Request, res: Response) => {
    try {
      const skyfireToken = req.headers["skyfire-pay-id"] as string | undefined;
      const authHeader = req.headers.authorization;
      const bearerToken = authHeader?.startsWith("Bearer ") ? authHeader.substring(7) : undefined;

      const server = createPerRequestMcpServer(skyfireToken, bearerToken);

      const transport = new StreamableHTTPServerTransport({
        sessionIdGenerator: undefined,
      });

      res.on("close", () => {
        transport.close();
      });

      await server.connect(transport);
      await transport.handleRequest(req, res, req.body);
    } catch (error: any) {
      console.error("MCP request error:", error);
      if (!res.headersSent) {
        res.status(500).json({
          jsonrpc: "2.0",
          error: { code: -32603, message: "Internal server error" },
          id: null,
        });
      }
    }
  });

  app.get("/mcp", async (req: Request, res: Response) => {
    res.writeHead(405).end(JSON.stringify({
      jsonrpc: "2.0",
      error: { code: -32000, message: "Method not allowed. Use POST for MCP requests." },
      id: null,
    }));
  });

  app.delete("/mcp", async (_req: Request, res: Response) => {
    res.status(405).json({
      jsonrpc: "2.0",
      error: { code: -32000, message: "Stateless server - session termination not supported" },
      id: null,
    });
  });

  console.log("MCP Remote Server mounted at /mcp (Streamable HTTP)");
}
