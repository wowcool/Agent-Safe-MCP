import type { Verdict, ThreatDetected } from "@shared/schema";
import { callClaude, parseJsonResponse, clampScore, sanitizeSeverity } from "./base";

const SUPPORTED_PLATFORMS = [
  "sms", "imessage", "whatsapp", "facebook_messenger", "instagram_dm",
  "telegram", "slack", "discord", "linkedin", "signal", "other"
] as const;

export type MessagePlatform = typeof SUPPORTED_PLATFORMS[number];

export interface MessageInput {
  body: string;
  direction: "inbound" | "outbound";
  timestamp?: string;
}

export interface MediaInput {
  type: "image" | "video" | "audio" | "document" | "link";
  filename?: string;
  url?: string;
  caption?: string;
}

export interface CheckMessageRequest {
  platform: string;
  sender: string;
  messages: MessageInput[];
  media?: MediaInput[];
  senderVerified?: boolean;
  contactKnown?: boolean;
}

export interface MessageThreat extends ThreatDetected {
  messageIndices?: number[];
}

export interface MessageAnalysisResult {
  verdict: Verdict;
  riskScore: number;
  confidence: number;
  platform: string;
  threats: MessageThreat[];
  recommendation: "proceed" | "proceed_with_caution" | "do_not_engage";
  explanation: string;
  safeActions: string[];
  unsafeActions: string[];
  platformTips: string;
}

const ANALYSIS_PROMPT = `You are a message security analyzer designed to protect AI agents from scams, social engineering, and manipulation across messaging platforms. You specialize in detecting platform-specific threats that differ from email-based attacks.

MESSAGE TO ANALYZE:
Platform: {platform}
Sender: {sender}
Sender Verified: {senderVerified}
Contact Known: {contactKnown}
Messages:
{messages}
Media Attachments: {media}

Analyze this message conversation for the following threat categories (tuned for non-email messaging platforms):

1. SMISHING - SMS/text phishing: fake delivery notices, bank alerts, toll charges, government impersonation
2. WRONG_NUMBER_SCAM - "Accidental" contact leading to romance, investment, or crypto fraud ("pig butchering")
3. IMPERSONATION - Pretending to be a brand, celebrity, friend, family member, or official account
4. OTP_INTERCEPTION - Tricks to get the victim to share one-time passwords, 2FA codes, or verification links
5. PAYMENT_FRAUD - Fake payment requests via Venmo, Zelle, Cash App, crypto wallets, or gift cards
6. ROMANCE_SCAM - Building fake emotional connection to extract money or personal information
7. TECH_SUPPORT_SCAM - Fake tech support claiming device or account is compromised
8. MALICIOUS_MEDIA - Suspicious images, documents, links, or files shared via attachments
9. URGENCY_MANIPULATION - Creating false time pressure ("act now or lose your account/money")
10. CREDENTIAL_HARVESTING - Directing to fake login pages, requesting passwords, or requesting account credentials

Platform-specific context to consider:
- SMS/iMessage: Shortened URLs, spoofed sender numbers, delivery/toll scams, government impersonation
- WhatsApp: Wrong-number scams, international number patterns, crypto/investment lures, group invite scams
- Instagram: Fake brand accounts, ambassador program scams, influencer impersonation, unverified accounts
- Facebook Messenger: Hijacked friend accounts, emergency money requests, marketplace fraud
- Telegram: Crypto pump schemes, fake bot channels, clone group scams
- Discord: Fake Nitro gifts, server raid phishing, bot impersonation, NFT scams
- LinkedIn: Fake recruiter job offers, credential theft via fake company domains, business opportunity fraud
- Slack: Internal phishing via compromised accounts, fake IT admin requests
- Signal: Number verification scams, identity theft attempts

Respond ONLY with valid JSON in this exact format:
{
  "verdict": "safe" | "suspicious" | "dangerous",
  "riskScore": <number 0.0 to 1.0>,
  "confidence": <number 0.0 to 1.0>,
  "threats": [
    {
      "type": "<threat type from list above>",
      "description": "<brief explanation>",
      "severity": "low" | "medium" | "high" | "critical",
      "messageIndices": [<indices of messages that triggered this threat, 0-based>]
    }
  ],
  "recommendation": "proceed" | "proceed_with_caution" | "do_not_engage",
  "explanation": "<2-3 sentence summary of findings>",
  "safeActions": ["<list of safe actions the agent can take>"],
  "unsafeActions": ["<list of actions the agent should NOT take>"],
  "platformTips": "<platform-specific safety tip relevant to this analysis>"
}`;

function formatMessages(messages: MessageInput[]): string {
  return messages.map((m, i) => {
    const dir = m.direction === "inbound" ? "RECEIVED" : "SENT";
    const ts = m.timestamp ? ` [${m.timestamp}]` : "";
    return `  [${i}] ${dir}${ts}: ${m.body}`;
  }).join("\n");
}

function formatMedia(media?: MediaInput[]): string {
  if (!media || media.length === 0) return "None";
  return media.map(m => {
    const parts: string[] = [m.type];
    if (m.filename) parts.push(`filename: ${m.filename}`);
    if (m.url) parts.push(`url: ${m.url.substring(0, 100)}`);
    if (m.caption) parts.push(`caption: ${m.caption}`);
    return parts.join(", ");
  }).join("; ");
}

function buildPrompt(request: CheckMessageRequest): string {
  const allBodies = request.messages.map(m => m.body).join(" ");
  const truncatedMessages = request.messages.slice(0, 50).map(m => ({
    ...m,
    body: m.body.substring(0, 3000),
  }));

  return ANALYSIS_PROMPT
    .replace("{platform}", request.platform)
    .replace("{sender}", request.sender)
    .replace("{senderVerified}", request.senderVerified ? "Yes" : "No/Unknown")
    .replace("{contactKnown}", request.contactKnown ? "Yes" : "No/Unknown")
    .replace("{messages}", formatMessages(truncatedMessages))
    .replace("{media}", formatMedia(request.media));
}

function quickPatternCheck(request: CheckMessageRequest): MessageThreat[] {
  const threats: MessageThreat[] = [];
  const allText = request.messages.map(m => m.body).join(" ").toLowerCase();
  const inboundMessages = request.messages
    .map((m, i) => ({ ...m, idx: i }))
    .filter(m => m.direction === "inbound");

  const smishingPatterns = [
    "package could not be delivered", "usps", "fedex delivery", "ups delivery",
    "toll charge", "ezpass", "confirm your address", "bank alert",
    "account suspended", "verify your identity"
  ];
  if (["sms", "imessage"].includes(request.platform) && smishingPatterns.some(p => allText.includes(p))) {
    threats.push({
      type: "SMISHING",
      description: "Message contains common smishing patterns (fake delivery, toll, or bank alerts)",
      severity: "high",
      messageIndices: inboundMessages.map(m => m.idx),
    });
  }

  const otpPatterns = [
    "verification code", "otp", "one-time password", "2fa code",
    "forward the code", "share the code", "send me the code",
    "confirmation code", "security code"
  ];
  if (otpPatterns.some(p => allText.includes(p))) {
    threats.push({
      type: "OTP_INTERCEPTION",
      description: "Message attempts to obtain verification codes or one-time passwords",
      severity: "critical",
      messageIndices: inboundMessages.map(m => m.idx),
    });
  }

  const paymentPatterns = [
    "send money", "wire transfer", "bitcoin", "crypto", "zelle",
    "venmo", "cash app", "gift card", "western union", "guaranteed returns"
  ];
  if (paymentPatterns.some(p => allText.includes(p)) && !request.contactKnown) {
    threats.push({
      type: "PAYMENT_FRAUD",
      description: "Unknown sender requesting payment or mentioning financial transactions",
      severity: "high",
      messageIndices: inboundMessages.map(m => m.idx),
    });
  }

  const shortUrlPatterns = ["bit.ly/", "tinyurl.com/", "t.co/", "goo.gl/", "is.gd/", "ow.ly/"];
  if (shortUrlPatterns.some(p => allText.includes(p))) {
    threats.push({
      type: "CREDENTIAL_HARVESTING",
      description: "Message contains shortened URLs that may redirect to phishing sites",
      severity: "medium",
      messageIndices: inboundMessages.map(m => m.idx),
    });
  }

  return threats;
}

export async function analyzeMessage(request: CheckMessageRequest): Promise<{ result: MessageAnalysisResult; durationMs: number }> {
  const startTime = Date.now();
  const patternThreats = quickPatternCheck(request);

  try {
    const prompt = buildPrompt(request);
    const { text } = await callClaude(prompt, 1024);

    const fallback: MessageAnalysisResult = {
      verdict: "suspicious",
      riskScore: 0.5,
      confidence: 0.5,
      platform: request.platform,
      threats: [{ type: "ANALYSIS_ERROR", description: "Could not fully analyze message", severity: "medium" }],
      recommendation: "proceed_with_caution",
      explanation: "Message analysis encountered an issue.",
      safeActions: ["Review manually"],
      unsafeActions: ["Do not click links without verification"],
      platformTips: "Exercise caution with messages from unknown senders.",
    };

    const parsed = parseJsonResponse(text, fallback);
    const verdict = ["safe", "suspicious", "dangerous"].includes(parsed.verdict) ? parsed.verdict as Verdict : "suspicious";

    const result: MessageAnalysisResult = {
      verdict,
      riskScore: clampScore(parsed.riskScore),
      confidence: clampScore(parsed.confidence, 0.7),
      platform: request.platform,
      threats: (parsed.threats || []).map((t: any) => ({
        type: String(t.type || "UNKNOWN"),
        description: String(t.description || ""),
        severity: sanitizeSeverity(t.severity),
        messageIndices: Array.isArray(t.messageIndices) ? t.messageIndices.filter((i: any) => typeof i === "number") : undefined,
      })),
      recommendation: ["proceed", "proceed_with_caution", "do_not_engage"].includes(parsed.recommendation) ? parsed.recommendation : "proceed_with_caution",
      explanation: String(parsed.explanation || "Analysis completed."),
      safeActions: Array.isArray(parsed.safeActions) ? parsed.safeActions.map(String) : [],
      unsafeActions: Array.isArray(parsed.unsafeActions) ? parsed.unsafeActions.map(String) : [],
      platformTips: String(parsed.platformTips || ""),
    };

    const allThreats = [...result.threats];
    for (const pt of patternThreats) {
      if (!allThreats.some(t => t.type === pt.type)) allThreats.push(pt);
    }
    result.threats = allThreats;

    if (patternThreats.some(t => t.severity === "critical")) {
      result.verdict = "dangerous";
      result.recommendation = "do_not_engage";
      result.riskScore = Math.max(result.riskScore, 0.9);
    }

    return { result, durationMs: Date.now() - startTime };
  } catch (error) {
    console.error("Claude API error (message-safety):", error);
    const hasThreats = patternThreats.length > 0;
    const hasCritical = patternThreats.some(t => t.severity === "critical");
    return {
      result: {
        verdict: hasCritical ? "dangerous" : hasThreats ? "suspicious" : "safe",
        riskScore: hasCritical ? 0.9 : hasThreats ? 0.5 : 0.1,
        confidence: 0.6,
        platform: request.platform,
        threats: patternThreats,
        recommendation: hasCritical ? "do_not_engage" : hasThreats ? "proceed_with_caution" : "proceed",
        explanation: "Analysis performed using pattern matching. AI analysis temporarily unavailable.",
        safeActions: hasThreats ? ["Verify sender manually"] : ["Proceed with normal caution"],
        unsafeActions: hasThreats ? ["Do not click links without verification"] : [],
        platformTips: "Exercise caution with messages from unknown senders.",
      },
      durationMs: Date.now() - startTime,
    };
  }
}
