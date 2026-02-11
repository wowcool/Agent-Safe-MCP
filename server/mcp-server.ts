import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StreamableHTTPServerTransport } from "@modelcontextprotocol/sdk/server/streamableHttp.js";
import type { Express, Request, Response } from "express";
import { z } from "zod";
import { analyzeEmail } from "./services/analyzers/email-safety";
import { analyzeUrls } from "./services/analyzers/url-safety";
import { analyzeResponse } from "./services/analyzers/response-safety";
import { analyzeThread } from "./services/analyzers/thread-analysis";
import { analyzeAttachments } from "./services/analyzers/attachment-safety";
import { analyzeSender } from "./services/analyzers/sender-reputation";
import { analyzeMessage } from "./services/analyzers/message-safety";
import {
  validateSkyfireToken,
  chargeSkyfireToken,
  isSkyfireConfigured,
} from "./services/skyfire";
import { createAutonomousToken } from "./services/token";
import { storage } from "./storage";
import type { CheckEmailRequest, ToolName } from "@shared/schema";

const TERMS = "https://agentsafe.locationledger.com/terms";
const TERMS_NOTICE = "By using this service you accept the Terms of Service. Advisory service only.";
const PRICE = 0.02;

function mcpError(message: string, details?: string) {
  return {
    content: [{ type: "text" as const, text: JSON.stringify(details ? { error: message, details } : { error: message }) }],
    isError: true,
  };
}

function mcpSuccess(data: any) {
  return { content: [{ type: "text" as const, text: JSON.stringify(data, null, 2) }] };
}

let skyfireSystemTokenId: string | null = null;

async function getOrCreateSkyfireSystemToken(): Promise<string> {
  if (skyfireSystemTokenId) {
    const existing = await storage.getAgentToken(skyfireSystemTokenId);
    if (existing && existing.status === "active") return skyfireSystemTokenId;
  }
  const existingTokens = await storage.getAgentTokenByHash("skyfire_system_token_hash");
  if (existingTokens) {
    skyfireSystemTokenId = existingTokens.id;
    return skyfireSystemTokenId;
  }
  const { tokenRecord } = await createAutonomousToken("skyfire-system", "Skyfire Pay-Per-Use", "skyfire:system", "skyfire", 365);
  skyfireSystemTokenId = tokenRecord.id;
  return skyfireSystemTokenId;
}

async function recordToolCheck(
  tokenId: string, toolName: ToolName, verdict: string, riskScore: number,
  confidence: number, threats: any[], durationMs: number,
  paymentType: string, paymentReference: string | null,
  senderDomain?: string | null, hasLinks?: boolean, hasAttachments?: boolean,
): Promise<string> {
  const emailCheck = await storage.createEmailCheck({
    tokenId,
    toolName,
    senderDomain: senderDomain || null,
    hasLinks: hasLinks || false,
    hasAttachments: hasAttachments || false,
    verdict,
    riskScore: String(riskScore),
    confidence: String(confidence),
    threatsDetected: threats,
    chargedAmount: String(PRICE),
    paymentType,
    paymentReference,
    analysisDurationMs: durationMs,
  });
  await storage.updateAgentTokenUsage(tokenId);
  await storage.createUsageLog({ tokenId, action: toolName, amount: String(PRICE), paymentStatus: "success" });
  return emailCheck.id;
}

async function validateAndCharge(skyfireToken: string | undefined): Promise<{ error?: any; transactionId?: string; buyerId?: string }> {
  if (!skyfireToken) return { error: mcpError("Payment required", "Include a skyfire-pay-id header with your Skyfire PAY token. Get one at skyfire.xyz.") };
  if (!isSkyfireConfigured()) return { error: mcpError("Skyfire payments not available", "Server Skyfire integration is not configured.") };
  const validation = await validateSkyfireToken(skyfireToken);
  if (!validation.valid) return { error: mcpError("Invalid Skyfire token", validation.error) };
  const chargeResult = await chargeSkyfireToken(skyfireToken, PRICE);
  if (!chargeResult.success) return { error: mcpError("Skyfire payment failed", chargeResult.error) };
  return { transactionId: chargeResult.transactionId || undefined, buyerId: validation.claims?.sub || "unknown" };
}

const TOOL_DEFS = {
  check_email_safety: {
    description: `Analyze an email for phishing, social engineering, prompt injection, and other threats targeting AI agents. Returns verdict, risk score, threats, and recommended actions. $${PRICE}/call via skyfire-pay-id header. ${TERMS_NOTICE}`,
    schema: {
      from: z.string().describe("Sender email address"),
      subject: z.string().describe("Email subject line"),
      body: z.string().describe("Email body content"),
      links: z.array(z.string()).optional().describe("URLs found in the email"),
      attachments: z.array(z.object({ name: z.string(), size: z.number(), type: z.string().optional() })).optional().describe("Attachment metadata"),
      knownSender: z.boolean().optional().describe("Whether the sender is known/trusted"),
      previousCorrespondence: z.boolean().optional().describe("Whether there has been previous email exchange"),
    },
  },
  check_url_safety: {
    description: `Analyze one or more URLs for phishing, malware, redirects, and spoofing. Returns per-URL and overall verdicts. $${PRICE}/call via skyfire-pay-id header. ${TERMS_NOTICE}`,
    schema: {
      urls: z.array(z.string()).min(1).max(20).describe("List of URLs to analyze (max 20)"),
    },
  },
  check_response_safety: {
    description: `Check a draft email reply BEFORE sending for data leakage, social engineering compliance, and unauthorized disclosure. $${PRICE}/call via skyfire-pay-id header. ${TERMS_NOTICE}`,
    schema: {
      draftTo: z.string().describe("Recipient email address"),
      draftSubject: z.string().describe("Draft reply subject"),
      draftBody: z.string().describe("Draft reply body"),
      originalFrom: z.string().optional().describe("Original sender address"),
      originalSubject: z.string().optional().describe("Original email subject"),
      originalBody: z.string().optional().describe("Original email body for context"),
    },
  },
  analyze_email_thread: {
    description: `Analyze a full email conversation thread for escalating social engineering, scope creep, and manipulation patterns. $${PRICE}/call for <=5 units (4000 tokens each); quote-first for larger threads. Via skyfire-pay-id header. ${TERMS_NOTICE}`,
    schema: {
      messages: z.array(z.object({
        from: z.string().describe("Sender of this message"),
        subject: z.string().describe("Subject line"),
        body: z.string().describe("Message body"),
        date: z.string().optional().describe("Date of the message"),
      })).min(2).max(50).describe("Thread messages in chronological order (min 2)"),
    },
  },
  check_attachment_safety: {
    description: `Assess email attachments for malware risk based on filename, MIME type, and size BEFORE opening/downloading. $${PRICE}/call via skyfire-pay-id header. ${TERMS_NOTICE}`,
    schema: {
      attachments: z.array(z.object({
        name: z.string().describe("Filename including extension"),
        size: z.number().describe("File size in bytes"),
        mimeType: z.string().describe("MIME type of the attachment"),
        from: z.string().optional().describe("Sender of the email containing this attachment"),
      })).min(1).max(20).describe("Attachment metadata to analyze (max 20)"),
    },
  },
  check_sender_reputation: {
    description: `Verify sender identity and detect Business Email Compromise (BEC), spoofing, and impersonation. Includes live DNS DMARC and RDAP domain age checks at no extra cost. $${PRICE}/call via skyfire-pay-id header. ${TERMS_NOTICE}`,
    schema: {
      email: z.string().describe("Sender email address"),
      displayName: z.string().describe("Sender display name"),
      replyTo: z.string().optional().describe("Reply-To address if different from sender"),
      emailSubject: z.string().optional().describe("Subject of the email for context"),
      emailSnippet: z.string().optional().describe("First ~500 chars of email body for context"),
    },
  },
  check_message_safety: {
    description: `Analyze non-email messages (SMS, WhatsApp, Instagram DMs, Discord, Slack, Telegram, LinkedIn, Facebook Messenger, iMessage, Signal) for platform-specific threats including smishing, wrong-number scams, OTP interception, impersonation, and crypto fraud. $${PRICE}/call via skyfire-pay-id header. ${TERMS_NOTICE}`,
    schema: {
      platform: z.enum(["sms", "imessage", "whatsapp", "facebook_messenger", "instagram_dm", "telegram", "slack", "discord", "linkedin", "signal", "other"]).describe("Message platform"),
      sender: z.string().describe("Sender identifier — phone number, username, handle, or display name"),
      messages: z.array(z.object({
        body: z.string().describe("Message text content"),
        direction: z.enum(["inbound", "outbound"]).describe("Whether the message was received or sent"),
        timestamp: z.string().optional().describe("Message timestamp"),
      })).min(1).max(50).describe("Array of messages in chronological order (min 1, max 50)"),
      media: z.array(z.object({
        type: z.enum(["image", "video", "audio", "document", "link"]).describe("Media type"),
        filename: z.string().optional().describe("Filename if available"),
        url: z.string().optional().describe("URL if available"),
        caption: z.string().optional().describe("Caption or description"),
      })).optional().describe("Media attachments"),
      senderVerified: z.boolean().optional().describe("Whether the platform has verified the sender (blue checkmark, business account)"),
      contactKnown: z.boolean().optional().describe("Whether the sender is in the agent's/user's contacts"),
    },
  },
};

function createPerRequestMcpServer(skyfireToken: string | undefined): McpServer {
  const server = new McpServer({ name: "AgentSafe", version: "2.0.0" });

  server.tool("check_email_safety", TOOL_DEFS.check_email_safety.description, TOOL_DEFS.check_email_safety.schema, async (args) => {
    const payment = await validateAndCharge(skyfireToken);
    if (payment.error) return payment.error;

    const emailRequest: CheckEmailRequest = {
      email: { from: args.from, subject: args.subject, body: args.body, links: args.links, attachments: args.attachments },
      context: { knownSender: args.knownSender, previousCorrespondence: args.previousCorrespondence },
    };
    const { result, durationMs } = await analyzeEmail(emailRequest);

    let checkId = "mcp-" + Date.now().toString(36);
    try {
      const systemTokenId = await getOrCreateSkyfireSystemToken();
      checkId = await recordToolCheck(systemTokenId, "check_email_safety", result.verdict, result.riskScore, result.confidence, result.threats, durationMs, "skyfire", payment.transactionId || null, emailRequest.email.from.split("@")[1], (emailRequest.email.links?.length || 0) > 0, (emailRequest.email.attachments?.length || 0) > 0);
    } catch (e) { console.error("MCP: Failed to record check:", e); }

    return mcpSuccess({ ...result, checkId, charged: PRICE, termsOfService: TERMS, termsAccepted: TERMS_NOTICE });
  });

  server.tool("check_url_safety", TOOL_DEFS.check_url_safety.description, TOOL_DEFS.check_url_safety.schema, async (args) => {
    const payment = await validateAndCharge(skyfireToken);
    if (payment.error) return payment.error;

    const { result, durationMs } = await analyzeUrls(args.urls);

    let checkId = "mcp-" + Date.now().toString(36);
    try {
      const systemTokenId = await getOrCreateSkyfireSystemToken();
      checkId = await recordToolCheck(systemTokenId, "check_url_safety", result.overallVerdict, result.overallRiskScore, 0.8, [], durationMs, "skyfire", payment.transactionId || null, null, true);
    } catch (e) { console.error("MCP: Failed to record check:", e); }

    return mcpSuccess({ ...result, checkId, charged: PRICE, termsOfService: TERMS, termsAccepted: TERMS_NOTICE });
  });

  server.tool("check_response_safety", TOOL_DEFS.check_response_safety.description, TOOL_DEFS.check_response_safety.schema, async (args) => {
    const payment = await validateAndCharge(skyfireToken);
    if (payment.error) return payment.error;

    const { result, durationMs } = await analyzeResponse(args);

    let checkId = "mcp-" + Date.now().toString(36);
    try {
      const systemTokenId = await getOrCreateSkyfireSystemToken();
      checkId = await recordToolCheck(systemTokenId, "check_response_safety", result.verdict, result.riskScore, result.confidence, result.threats, durationMs, "skyfire", payment.transactionId || null);
    } catch (e) { console.error("MCP: Failed to record check:", e); }

    return mcpSuccess({ ...result, checkId, charged: PRICE, termsOfService: TERMS, termsAccepted: TERMS_NOTICE });
  });

  server.tool("analyze_email_thread", TOOL_DEFS.analyze_email_thread.description, TOOL_DEFS.analyze_email_thread.schema, async (args) => {
    const payment = await validateAndCharge(skyfireToken);
    if (payment.error) return payment.error;

    const { result, durationMs } = await analyzeThread(args.messages);

    let checkId = "mcp-" + Date.now().toString(36);
    try {
      const systemTokenId = await getOrCreateSkyfireSystemToken();
      checkId = await recordToolCheck(systemTokenId, "analyze_email_thread", result.verdict, result.riskScore, result.confidence, result.manipulationPatterns, durationMs, "skyfire", payment.transactionId || null);
    } catch (e) { console.error("MCP: Failed to record check:", e); }

    return mcpSuccess({ ...result, checkId, charged: PRICE, termsOfService: TERMS, termsAccepted: TERMS_NOTICE });
  });

  server.tool("check_attachment_safety", TOOL_DEFS.check_attachment_safety.description, TOOL_DEFS.check_attachment_safety.schema, async (args) => {
    const payment = await validateAndCharge(skyfireToken);
    if (payment.error) return payment.error;

    const { result, durationMs } = await analyzeAttachments(args.attachments);

    let checkId = "mcp-" + Date.now().toString(36);
    try {
      const systemTokenId = await getOrCreateSkyfireSystemToken();
      checkId = await recordToolCheck(systemTokenId, "check_attachment_safety", result.overallVerdict, result.overallRiskScore, 0.8, [], durationMs, "skyfire", payment.transactionId || null, null, false, true);
    } catch (e) { console.error("MCP: Failed to record check:", e); }

    return mcpSuccess({ ...result, checkId, charged: PRICE, termsOfService: TERMS, termsAccepted: TERMS_NOTICE });
  });

  server.tool("check_sender_reputation", TOOL_DEFS.check_sender_reputation.description, TOOL_DEFS.check_sender_reputation.schema, async (args) => {
    const payment = await validateAndCharge(skyfireToken);
    if (payment.error) return payment.error;

    const { result, durationMs } = await analyzeSender(args);

    let checkId = "mcp-" + Date.now().toString(36);
    try {
      const systemTokenId = await getOrCreateSkyfireSystemToken();
      checkId = await recordToolCheck(systemTokenId, "check_sender_reputation", result.senderVerdict, result.trustScore, result.confidence, result.identityIssues, durationMs, "skyfire", payment.transactionId || null, args.email.split("@")[1]);
    } catch (e) { console.error("MCP: Failed to record check:", e); }

    return mcpSuccess({ ...result, checkId, charged: PRICE, termsOfService: TERMS, termsAccepted: TERMS_NOTICE });
  });

  server.tool("check_message_safety", TOOL_DEFS.check_message_safety.description, TOOL_DEFS.check_message_safety.schema, async (args) => {
    const payment = await validateAndCharge(skyfireToken);
    if (payment.error) return payment.error;

    const { result, durationMs } = await analyzeMessage({
      platform: args.platform,
      sender: args.sender,
      messages: args.messages,
      media: args.media,
      senderVerified: args.senderVerified,
      contactKnown: args.contactKnown,
    });

    let checkId = "mcp-" + Date.now().toString(36);
    try {
      const systemTokenId = await getOrCreateSkyfireSystemToken();
      checkId = await recordToolCheck(systemTokenId, "check_message_safety", result.verdict, result.riskScore, result.confidence, result.threats, durationMs, "skyfire", payment.transactionId || null);
    } catch (e) { console.error("MCP: Failed to record check:", e); }

    return mcpSuccess({ ...result, checkId, charged: PRICE, termsOfService: TERMS, termsAccepted: TERMS_NOTICE });
  });

  return server;
}

export function mountMcpServer(app: Express): void {
  app.post("/mcp", async (req: Request, res: Response) => {
    try {
      const skyfireToken = (req.headers["skyfire-pay-id"] as string | undefined)
        || (req.query.SKYFIRE_PAY_TOKEN as string | undefined);
      const server = createPerRequestMcpServer(skyfireToken);
      const transport = new StreamableHTTPServerTransport({ sessionIdGenerator: undefined });
      res.on("close", () => { transport.close(); });
      await server.connect(transport);
      await transport.handleRequest(req, res, req.body);
    } catch (error: any) {
      console.error("MCP request error:", error);
      if (!res.headersSent) {
        res.status(500).json({ jsonrpc: "2.0", error: { code: -32603, message: "Internal server error" }, id: null });
      }
    }
  });

  app.get("/mcp", async (_req: Request, res: Response) => {
    res.writeHead(405).end(JSON.stringify({ jsonrpc: "2.0", error: { code: -32000, message: "Method not allowed. Use POST for MCP requests." }, id: null }));
  });

  app.delete("/mcp", async (_req: Request, res: Response) => {
    res.status(405).json({ jsonrpc: "2.0", error: { code: -32000, message: "Stateless server - session termination not supported" }, id: null });
  });

  console.log("MCP Remote Server mounted at /mcp (Streamable HTTP) - 7 tools registered");
}

export { TOOL_DEFS };
