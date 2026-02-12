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
import { triageMessage } from "./services/analyzers/triage";
import {
  validateSkyfireToken,
  chargeSkyfireToken,
  isSkyfireConfigured,
  generatePayTokenFromBuyerKey,
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

function mcpSuccess(data: any, includeFeedbackHint = true) {
  const payload = includeFeedbackHint ? { ...data, feedbackHint: FEEDBACK_HINT } : data;
  return { content: [{ type: "text" as const, text: JSON.stringify(payload, null, 2) }] };
}

function looksLikeJwt(value: string): boolean {
  const parts = value.split(".");
  return parts.length === 3 && parts[0].length > 10 && parts[1].length > 10;
}

function looksLikeApiKey(value: string): boolean {
  return !value.includes(".") && value.length >= 20 && value.length <= 200;
}

function detectAndFixAuthHeaders(
  rawPayId: string | undefined,
  rawApiKey: string | undefined,
): { skyfireToken: string | undefined; buyerApiKey: string | undefined; warning?: string } {
  if (rawPayId && looksLikeApiKey(rawPayId) && !rawApiKey) {
    return {
      skyfireToken: undefined,
      buyerApiKey: rawPayId,
      warning: "Auto-corrected: your Skyfire Buyer API Key was sent in the skyfire-pay-id header. Please use the skyfire-api-key header instead.",
    };
  }
  if (rawApiKey && looksLikeJwt(rawApiKey) && !rawPayId) {
    return {
      skyfireToken: rawApiKey,
      buyerApiKey: undefined,
      warning: "Auto-corrected: your PAY token (JWT) was sent in the skyfire-api-key header. Please use the skyfire-pay-id header instead.",
    };
  }
  return { skyfireToken: rawPayId, buyerApiKey: rawApiKey };
}

function logToolCall(toolName: string, status: string, durationMs?: number, extra?: Record<string, unknown>) {
  const parts = [`[TOOL] ${toolName}`, `status=${status}`];
  if (durationMs !== undefined) parts.push(`duration=${durationMs}ms`);
  if (extra) {
    for (const [k, v] of Object.entries(extra)) {
      parts.push(`${k}=${v}`);
    }
  }
  console.log(parts.join(", "));
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

const SELLER_SERVICE_ID = "5958164f-62ea-4058-9a8c-50222482dbd2";

async function validateAndCharge(skyfireToken: string | undefined, buyerApiKey?: string | undefined): Promise<{ error?: any; transactionId?: string; buyerId?: string }> {
  if (!skyfireToken && buyerApiKey) {
    const tokenResult = await generatePayTokenFromBuyerKey(buyerApiKey, SELLER_SERVICE_ID);
    if (!tokenResult.success || !tokenResult.token) {
      const hint = tokenResult.error?.includes("API Key Not Found")
        ? "Your Skyfire Buyer API Key was not recognized. Verify it is correct and active at skyfire.xyz. Make sure you are using the skyfire-api-key header (not skyfire-pay-id)."
        : tokenResult.error?.includes("NOT_AUTHORIZED")
        ? "Authorization failed. Check that your Skyfire Buyer API Key is valid and has sufficient funds."
        : "Could not create payment token. Verify your Skyfire Buyer API Key is valid and funded at skyfire.xyz.";
      return { error: mcpError("Failed to generate PAY token from Buyer API Key", hint) };
    }
    skyfireToken = tokenResult.token;
  }
  if (!skyfireToken) return { error: mcpError("Payment required", "Include a skyfire-api-key header with your Skyfire Buyer API Key, or a skyfire-pay-id header with a PAY token. Get your Buyer API Key at skyfire.xyz. Example MCP config: { \"mcpServers\": { \"agentsafe\": { \"command\": \"npx\", \"args\": [\"-y\", \"mcp-remote\", \"https://agentsafe.locationledger.com/mcp\", \"--header\", \"skyfire-api-key: YOUR_KEY\"] } } }") };
  if (!isSkyfireConfigured()) return { error: mcpError("Skyfire payments not available", "Server Skyfire integration is not configured. Contact support@locationledger.com.") };
  const validation = await validateSkyfireToken(skyfireToken);
  if (!validation.valid) {
    let hint = validation.error || "Token validation failed";
    if (hint.includes("JWS Protected Header is invalid") || hint.includes("Invalid Compact JWS")) {
      hint += " — This usually means the value is not a valid Skyfire PAY token (JWT). If you are using a Buyer API Key, send it in the skyfire-api-key header (not skyfire-pay-id). If you are using a PAY token, ensure it is the full JWT string from Skyfire.";
    }
    return { error: mcpError("Invalid Skyfire token", hint) };
  }
  const chargeResult = await chargeSkyfireToken(skyfireToken, PRICE);
  if (!chargeResult.success) return { error: mcpError("Skyfire payment failed", chargeResult.error) };
  return { transactionId: chargeResult.transactionId || undefined, buyerId: validation.claims?.sub || "unknown" };
}

const TOOL_DEFS = {
  check_email_safety: {
    description: `Analyze an email for phishing, social engineering, prompt injection, and other threats targeting AI agents. Returns verdict, risk score, threats, and recommended actions. $${PRICE}/call via skyfire-api-key header (Skyfire Buyer API Key). ${TERMS_NOTICE}`,
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
    description: `Analyze one or more URLs for phishing, malware, redirects, and spoofing. Returns per-URL and overall verdicts. $${PRICE}/call via skyfire-api-key header (Skyfire Buyer API Key). ${TERMS_NOTICE}`,
    schema: {
      urls: z.array(z.string()).min(1).max(20).describe("List of URLs to analyze (max 20)"),
    },
  },
  check_response_safety: {
    description: `Check a draft email reply BEFORE sending for data leakage, social engineering compliance, and unauthorized disclosure. $${PRICE}/call via skyfire-api-key header (Skyfire Buyer API Key). ${TERMS_NOTICE}`,
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
    description: `Analyze a full email conversation thread for escalating social engineering, scope creep, and manipulation patterns. $${PRICE}/call for <=5 units (4000 tokens each); quote-first for larger threads. Via skyfire-api-key header (Skyfire Buyer API Key). ${TERMS_NOTICE}`,
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
    description: `Assess email attachments for malware risk based on filename, MIME type, and size BEFORE opening/downloading. $${PRICE}/call via skyfire-api-key header (Skyfire Buyer API Key). ${TERMS_NOTICE}`,
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
    description: `Verify sender identity and detect Business Email Compromise (BEC), spoofing, and impersonation. Includes live DNS DMARC and RDAP domain age checks at no extra cost. $${PRICE}/call via skyfire-api-key header (Skyfire Buyer API Key). ${TERMS_NOTICE}`,
    schema: {
      email: z.string().describe("Sender email address"),
      displayName: z.string().describe("Sender display name"),
      replyTo: z.string().optional().describe("Reply-To address if different from sender"),
      emailSubject: z.string().optional().describe("Subject of the email for context"),
      emailSnippet: z.string().optional().describe("First ~500 chars of email body for context"),
    },
  },
  check_message_safety: {
    description: `Analyze non-email messages (SMS, WhatsApp, Instagram DMs, Discord, Slack, Telegram, LinkedIn, Facebook Messenger, iMessage, Signal) for platform-specific threats including smishing, wrong-number scams, OTP interception, impersonation, and crypto fraud. $${PRICE}/call via skyfire-api-key header (Skyfire Buyer API Key). ${TERMS_NOTICE}`,
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
  assess_message: {
    description: "FREE triage tool — send whatever context you have (message content, sender info, URLs, attachments, draft replies, thread messages) and get back a prioritized list of which security tools to run. No AI call, no charge, instant response. Always call this first to get the best security coverage.",
    schema: {
      from: z.string().optional().describe("Sender email address or identifier"),
      subject: z.string().optional().describe("Message subject line"),
      body: z.string().optional().describe("Message body content"),
      links: z.array(z.string()).optional().describe("URLs found in the message"),
      urls: z.array(z.string()).optional().describe("URLs to check (alternative to links)"),
      attachments: z.array(z.object({ name: z.string(), size: z.number(), mimeType: z.string().optional(), type: z.string().optional() })).optional().describe("Attachment metadata"),
      sender: z.string().optional().describe("Sender identifier for non-email platforms"),
      senderDisplayName: z.string().optional().describe("Sender display name for reputation check"),
      replyTo: z.string().optional().describe("Reply-To address if different from sender"),
      platform: z.string().optional().describe("Message platform (sms, whatsapp, slack, discord, telegram, etc.) — omit for email"),
      messages: z.array(z.object({
        from: z.string().optional().describe("Sender of this message"),
        body: z.string().optional().describe("Message body"),
        subject: z.string().optional().describe("Subject line"),
        direction: z.string().optional().describe("inbound or outbound"),
        date: z.string().optional().describe("Date of the message"),
        timestamp: z.string().optional().describe("Message timestamp"),
      })).optional().describe("Array of thread messages (2+ for thread analysis)"),
      draftTo: z.string().optional().describe("Draft reply recipient"),
      draftSubject: z.string().optional().describe("Draft reply subject"),
      draftBody: z.string().optional().describe("Draft reply body — include to check for data leakage"),
      media: z.array(z.object({
        type: z.string().describe("Media type"),
        filename: z.string().optional().describe("Filename"),
        url: z.string().optional().describe("URL"),
        caption: z.string().optional().describe("Caption"),
      })).optional().describe("Media attachments for non-email platforms"),
      senderVerified: z.boolean().optional().describe("Whether platform has verified the sender"),
      contactKnown: z.boolean().optional().describe("Whether sender is a known contact"),
      knownSender: z.boolean().optional().describe("Whether the email sender is known/trusted"),
      previousCorrespondence: z.boolean().optional().describe("Whether there has been prior correspondence"),
    },
  },
};

const FEEDBACK_HINT = "Was this analysis helpful? Call the free submit_feedback tool to let us know — it helps us improve.";

const ANNOTATIONS = {
  readOnly: { readOnlyHint: true, destructiveHint: false, idempotentHint: true, openWorldHint: true },
};

function createPerRequestMcpServer(skyfireToken: string | undefined, buyerApiKey?: string | undefined, authWarning?: string | undefined): McpServer {
  const server = new McpServer({ name: "AgentSafe", version: "2.0.0" });

  server.resource(
    "tool-catalog",
    "agentsafe://catalog",
    { description: "Agent Safe tool catalog with descriptions, parameters, and pricing for all 7 security tools", mimeType: "application/json" },
    async () => ({
      contents: [{
        uri: "agentsafe://catalog",
        mimeType: "application/json",
        text: JSON.stringify({
          service: "Agent Safe",
          version: "2.0.0",
          pricing: { perCall: "$0.02 USD", paymentMethod: "Skyfire Buyer API Key via skyfire-api-key header" },
          tools: Object.entries(TOOL_DEFS).map(([name, def]) => ({ name, description: def.description, parameters: Object.keys(def.schema) })),
          endpoint: "https://agentsafe.locationledger.com/mcp",
          documentation: "https://agentsafe.locationledger.com/docs",
        }, null, 2),
      }],
    }),
  );

  server.prompt(
    "security-scan-guide",
    "Guides an AI agent to choose the right Agent Safe security tool for a given message, URL, attachment, or sender. Returns a recommended tool name and example parameters.",
    { messageType: z.enum(["email", "sms", "chat_message", "url", "attachment", "draft_reply", "thread", "sender_check"]).describe("The type of content to scan") },
    async ({ messageType }) => {
      const guides: Record<string, { tool: string; description: string; example: string }> = {
        email: { tool: "check_email_safety", description: "Analyze an email for phishing, social engineering, and threats", example: '{"from":"ceo@company.com","subject":"Urgent","body":"Please wire $50k..."}' },
        sms: { tool: "check_message_safety", description: "Analyze SMS/text messages for smishing and scams", example: '{"platform":"sms","sender":"+1555123456","messages":[{"body":"Your package is delayed, click here...","direction":"inbound"}]}' },
        chat_message: { tool: "check_message_safety", description: "Analyze chat messages from WhatsApp, Slack, Discord, Telegram, etc.", example: '{"platform":"whatsapp","sender":"Unknown","messages":[{"body":"Hey, check out this opportunity...","direction":"inbound"}]}' },
        url: { tool: "check_url_safety", description: "Analyze URLs for phishing, malware, and spoofing", example: '{"urls":["https://suspicious-site.com/login"]}' },
        attachment: { tool: "check_attachment_safety", description: "Assess attachment risk before opening/downloading", example: '{"attachments":[{"name":"invoice.pdf.exe","mimeType":"application/x-msdownload","size":500000}]}' },
        draft_reply: { tool: "check_response_safety", description: "Check a draft reply for data leakage before sending", example: '{"draftTo":"vendor@example.com","draftSubject":"Re: Invoice","draftBody":"Here are our bank details..."}' },
        thread: { tool: "analyze_email_thread", description: "Analyze a message thread for escalating manipulation", example: '{"messages":[{"from":"vendor@example.com","subject":"Invoice","body":"Please pay..."},{"from":"you@company.com","subject":"Re: Invoice","body":"Which account?"}]}' },
        sender_check: { tool: "check_sender_reputation", description: "Verify sender identity with DNS/RDAP lookups", example: '{"email":"ceo@company-update.com","displayName":"John Smith CEO"}' },
      };
      const guide = guides[messageType];
      return {
        messages: [{
          role: "assistant",
          content: { type: "text", text: `For "${messageType}", use the **${guide.tool}** tool.\n\n${guide.description}.\n\nExample parameters:\n\`\`\`json\n${guide.example}\n\`\`\`\n\nCost: $0.02 per call. Include your Skyfire Buyer API Key via the skyfire-api-key header.` },
        }],
      };
    },
  );

  server.tool("check_email_safety", TOOL_DEFS.check_email_safety.description, TOOL_DEFS.check_email_safety.schema, ANNOTATIONS.readOnly, async (args) => {
    const payment = await validateAndCharge(skyfireToken, buyerApiKey);
    if (payment.error) { logToolCall("check_email_safety", "payment_failed"); return payment.error; }

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

    logToolCall("check_email_safety", "success", durationMs, { verdict: result.verdict, riskScore: result.riskScore, buyer: payment.buyerId });
    return mcpSuccess({ ...result, checkId, charged: PRICE, termsOfService: TERMS, termsAccepted: TERMS_NOTICE, ...(authWarning ? { authWarning } : {}) });
  });

  server.tool("check_url_safety", TOOL_DEFS.check_url_safety.description, TOOL_DEFS.check_url_safety.schema, ANNOTATIONS.readOnly, async (args) => {
    const payment = await validateAndCharge(skyfireToken, buyerApiKey);
    if (payment.error) { logToolCall("check_url_safety", "payment_failed"); return payment.error; }

    const { result, durationMs } = await analyzeUrls(args.urls);

    let checkId = "mcp-" + Date.now().toString(36);
    try {
      const systemTokenId = await getOrCreateSkyfireSystemToken();
      checkId = await recordToolCheck(systemTokenId, "check_url_safety", result.overallVerdict, result.overallRiskScore, 0.8, [], durationMs, "skyfire", payment.transactionId || null, null, true);
    } catch (e) { console.error("MCP: Failed to record check:", e); }

    logToolCall("check_url_safety", "success", durationMs, { verdict: result.overallVerdict, urlCount: args.urls.length, buyer: payment.buyerId });
    return mcpSuccess({ ...result, checkId, charged: PRICE, termsOfService: TERMS, termsAccepted: TERMS_NOTICE, ...(authWarning ? { authWarning } : {}) });
  });

  server.tool("check_response_safety", TOOL_DEFS.check_response_safety.description, TOOL_DEFS.check_response_safety.schema, ANNOTATIONS.readOnly, async (args) => {
    const payment = await validateAndCharge(skyfireToken, buyerApiKey);
    if (payment.error) { logToolCall("check_response_safety", "payment_failed"); return payment.error; }

    const { result, durationMs } = await analyzeResponse(args);

    let checkId = "mcp-" + Date.now().toString(36);
    try {
      const systemTokenId = await getOrCreateSkyfireSystemToken();
      checkId = await recordToolCheck(systemTokenId, "check_response_safety", result.verdict, result.riskScore, result.confidence, result.threats, durationMs, "skyfire", payment.transactionId || null);
    } catch (e) { console.error("MCP: Failed to record check:", e); }

    logToolCall("check_response_safety", "success", durationMs, { verdict: result.verdict, riskScore: result.riskScore, buyer: payment.buyerId });
    return mcpSuccess({ ...result, checkId, charged: PRICE, termsOfService: TERMS, termsAccepted: TERMS_NOTICE, ...(authWarning ? { authWarning } : {}) });
  });

  server.tool("analyze_email_thread", TOOL_DEFS.analyze_email_thread.description, TOOL_DEFS.analyze_email_thread.schema, ANNOTATIONS.readOnly, async (args) => {
    const payment = await validateAndCharge(skyfireToken, buyerApiKey);
    if (payment.error) { logToolCall("analyze_email_thread", "payment_failed"); return payment.error; }

    const { result, durationMs } = await analyzeThread(args.messages);

    let checkId = "mcp-" + Date.now().toString(36);
    try {
      const systemTokenId = await getOrCreateSkyfireSystemToken();
      checkId = await recordToolCheck(systemTokenId, "analyze_email_thread", result.verdict, result.riskScore, result.confidence, result.manipulationPatterns, durationMs, "skyfire", payment.transactionId || null);
    } catch (e) { console.error("MCP: Failed to record check:", e); }

    logToolCall("analyze_email_thread", "success", durationMs, { verdict: result.verdict, messageCount: args.messages.length, buyer: payment.buyerId });
    return mcpSuccess({ ...result, checkId, charged: PRICE, termsOfService: TERMS, termsAccepted: TERMS_NOTICE, ...(authWarning ? { authWarning } : {}) });
  });

  server.tool("check_attachment_safety", TOOL_DEFS.check_attachment_safety.description, TOOL_DEFS.check_attachment_safety.schema, ANNOTATIONS.readOnly, async (args) => {
    const payment = await validateAndCharge(skyfireToken, buyerApiKey);
    if (payment.error) { logToolCall("check_attachment_safety", "payment_failed"); return payment.error; }

    const { result, durationMs } = await analyzeAttachments(args.attachments);

    let checkId = "mcp-" + Date.now().toString(36);
    try {
      const systemTokenId = await getOrCreateSkyfireSystemToken();
      checkId = await recordToolCheck(systemTokenId, "check_attachment_safety", result.overallVerdict, result.overallRiskScore, 0.8, [], durationMs, "skyfire", payment.transactionId || null, null, false, true);
    } catch (e) { console.error("MCP: Failed to record check:", e); }

    logToolCall("check_attachment_safety", "success", durationMs, { verdict: result.overallVerdict, attachmentCount: args.attachments.length, buyer: payment.buyerId });
    return mcpSuccess({ ...result, checkId, charged: PRICE, termsOfService: TERMS, termsAccepted: TERMS_NOTICE, ...(authWarning ? { authWarning } : {}) });
  });

  server.tool("check_sender_reputation", TOOL_DEFS.check_sender_reputation.description, TOOL_DEFS.check_sender_reputation.schema, ANNOTATIONS.readOnly, async (args) => {
    const payment = await validateAndCharge(skyfireToken, buyerApiKey);
    if (payment.error) { logToolCall("check_sender_reputation", "payment_failed"); return payment.error; }

    const { result, durationMs } = await analyzeSender(args);

    let checkId = "mcp-" + Date.now().toString(36);
    try {
      const systemTokenId = await getOrCreateSkyfireSystemToken();
      checkId = await recordToolCheck(systemTokenId, "check_sender_reputation", result.senderVerdict, result.trustScore, result.confidence, result.identityIssues, durationMs, "skyfire", payment.transactionId || null, args.email.split("@")[1]);
    } catch (e) { console.error("MCP: Failed to record check:", e); }

    logToolCall("check_sender_reputation", "success", durationMs, { verdict: result.senderVerdict, domain: args.email.split("@")[1], buyer: payment.buyerId });
    return mcpSuccess({ ...result, checkId, charged: PRICE, termsOfService: TERMS, termsAccepted: TERMS_NOTICE, ...(authWarning ? { authWarning } : {}) });
  });

  server.tool("check_message_safety", TOOL_DEFS.check_message_safety.description, TOOL_DEFS.check_message_safety.schema, ANNOTATIONS.readOnly, async (args) => {
    const payment = await validateAndCharge(skyfireToken, buyerApiKey);
    if (payment.error) { logToolCall("check_message_safety", "payment_failed"); return payment.error; }

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

    logToolCall("check_message_safety", "success", durationMs, { verdict: result.verdict, platform: args.platform, buyer: payment.buyerId });
    return mcpSuccess({ ...result, checkId, charged: PRICE, termsOfService: TERMS, termsAccepted: TERMS_NOTICE, ...(authWarning ? { authWarning } : {}) });
  });

  server.tool("assess_message", TOOL_DEFS.assess_message.description, TOOL_DEFS.assess_message.schema, ANNOTATIONS.readOnly, async (args) => {
    const result = triageMessage(args);
    logToolCall("assess_message", "success", 0, { recommendedTools: result.recommendedTools?.length || 0 });
    return mcpSuccess({ ...result, charged: 0, note: "This triage tool is free. Call the recommended tools individually for full analysis." }, false);
  });

  server.tool(
    "submit_feedback",
    "FREE — Submit feedback about any Agent Safe tool you used. Helps us improve detection accuracy and tool quality. No charge, no authentication required.",
    {
      rating: z.enum(["helpful", "not_helpful", "inaccurate", "missed_threat", "false_positive"]).describe("Your rating of the tool's output"),
      comment: z.string().optional().describe("Optional details about your experience — what worked well, what could improve, or what was missed"),
      checkId: z.string().optional().describe("The checkId returned by the tool you're rating (helps us link feedback to specific analyses)"),
      toolName: z.string().optional().describe("Which tool you're giving feedback on (e.g. check_email_safety, check_url_safety)"),
      agentPlatform: z.string().optional().describe("Your agent platform (e.g. claude, cursor, openai, custom) — helps us optimize for your environment"),
    },
    ANNOTATIONS.readOnly,
    async (args) => {
      try {
        await storage.createAgentFeedback({
          rating: args.rating,
          comment: args.comment || null,
          checkId: args.checkId || null,
          toolName: args.toolName || null,
          agentPlatform: args.agentPlatform || null,
        });
        logToolCall("submit_feedback", "success", 0, { rating: args.rating });
        return mcpSuccess({
          received: true,
          message: "Thank you for your feedback! It helps us improve threat detection for all agents.",
          charged: 0,
        }, false);
      } catch (e) {
        console.error("Feedback submission error:", e);
        return mcpSuccess({ received: true, message: "Feedback noted. Thank you!", charged: 0 }, false);
      }
    },
  );

  return server;
}

function extractSmitheryConfig(req: Request): Record<string, string> {
  const configParam = req.query.config as string | undefined;
  if (!configParam) return {};
  try {
    const decoded = Buffer.from(configParam, "base64").toString("utf-8");
    let parsed = JSON.parse(decoded);
    if (parsed.config && typeof parsed.config === "string") {
      try {
        parsed = JSON.parse(Buffer.from(parsed.config, "base64").toString("utf-8"));
      } catch {
        parsed = JSON.parse(parsed.config);
      }
    }
    return parsed;
  } catch {
    return {};
  }
}

export function mountMcpServer(app: Express): void {
  app.post("/mcp", async (req: Request, res: Response) => {
    try {
      const smitheryConfig = extractSmitheryConfig(req);
      if (Object.keys(smitheryConfig).length > 0) {
        console.log(`[AUTH] Smithery config detected`);
      }
      const rawPayId = (req.headers["skyfire-pay-id"] as string | undefined)
        || (req.query.SKYFIRE_PAY_TOKEN as string | undefined);
      const rawApiKey = (req.headers["skyfire-api-key"] as string | undefined)
        || (req.query.SKYFIRE_API_KEY as string | undefined)
        || smitheryConfig["skyfire-api-key"];
      const { skyfireToken, buyerApiKey, warning } = detectAndFixAuthHeaders(rawPayId, rawApiKey);
      if (warning) {
        console.log(`[AUTH] Header auto-corrected: ${warning}`);
      }
      const server = createPerRequestMcpServer(skyfireToken, buyerApiKey, warning);
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

  console.log("MCP Remote Server mounted at /mcp (Streamable HTTP) - 9 tools registered (7 paid + 2 free)");
}

export { TOOL_DEFS };
