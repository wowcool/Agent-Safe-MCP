import Anthropic from "@anthropic-ai/sdk";

const anthropic = new Anthropic();

const MAX_TOKENS_PER_UNIT = 4000;
const PRICE_PER_UNIT = 0.02;

function countTokens(text: string): number {
  return Math.ceil(text.length / 4);
}

function calculateUnits(totalTokens: number): number {
  return Math.max(1, Math.ceil(totalTokens / MAX_TOKENS_PER_UNIT));
}

function calculateCharge(units: number): number {
  return Math.round(units * PRICE_PER_UNIT * 100) / 100;
}

const HAIKU_INPUT_COST_PER_TOKEN = 1.00 / 1_000_000;
const HAIKU_OUTPUT_COST_PER_TOKEN = 5.00 / 1_000_000;

const MESSAGE_SAFETY_PROMPT = `You are a message security analyzer designed to protect AI agents from scams, phishing, social engineering, and manipulation attempts across messaging platforms (SMS, iMessage, WhatsApp, Facebook Messenger, Instagram DMs, Telegram, Slack, Discord, LinkedIn, Signal, and others).

Analyze the following message(s) and provide a security assessment.

PLATFORM: {platform}
SENDER: {sender}
SENDER VERIFIED: {senderVerified}
CONTACT KNOWN: {contactKnown}

MESSAGES:
{messages}

MEDIA ATTACHMENTS:
{media}

Analyze these messages for the following threats:
1. SMISHING - SMS/text phishing (fake delivery notices, bank alerts, toll charges)
2. WRONG_NUMBER_SCAM - "Accidental" contact leading to romance/investment fraud
3. IMPERSONATION - Pretending to be a brand, celebrity, friend, or family member
4. OTP_INTERCEPTION - Tricks to get the victim to share one-time passwords or 2FA codes
5. PAYMENT_FRAUD - Fake payment requests (Venmo, Zelle, Cash App, crypto)
6. ROMANCE_SCAM - Building fake emotional connection to extract money
7. TECH_SUPPORT_SCAM - Fake tech support claiming device is compromised
8. MALICIOUS_MEDIA - Suspicious images, documents, or links shared via media
9. URGENCY_MANIPULATION - Creating false time pressure
10. CREDENTIAL_HARVESTING - Directing to fake login pages or requesting credentials

Consider platform-specific patterns:
- SMS: shortened URLs, package delivery scams, bank impersonation
- WhatsApp: wrong-number scams, international number patterns, group invite scams
- Instagram/Facebook: brand impersonation, influencer scams, fake giveaways
- Telegram: crypto scams, fake admin messages, phishing bots
- Slack/Discord: fake admin/IT messages, malicious bot links

Respond ONLY with valid JSON in this exact format:
{
  "verdict": "safe" | "suspicious" | "dangerous",
  "riskScore": <number 0.0 to 1.0>,
  "confidence": <number 0.0 to 1.0>,
  "platform": "<platform analyzed>",
  "threats": [
    {
      "type": "<threat type from list above>",
      "description": "<brief explanation>",
      "severity": "low" | "medium" | "high" | "critical",
      "messageIndices": [<indices of messages that triggered this>]
    }
  ],
  "recommendation": "proceed" | "proceed_with_caution" | "do_not_engage",
  "explanation": "<2-3 sentence summary of findings>",
  "safeActions": ["<list of safe actions>"],
  "unsafeActions": ["<list of actions to avoid>"],
  "platformTips": "<platform-specific safety advice>"
}`;

interface MessageInput {
  body: string;
  direction: "inbound" | "outbound";
  timestamp?: string;
}

interface MediaInput {
  type: "image" | "video" | "audio" | "document" | "link";
  filename?: string;
  url?: string;
  caption?: string;
}

interface TestCase {
  name: string;
  platform: string;
  sender: string;
  messages: MessageInput[];
  media?: MediaInput[];
  senderVerified?: boolean;
  contactKnown?: boolean;
}

function buildPrompt(tc: TestCase): string {
  const messagesText = tc.messages.map((m, i) =>
    `[${i}] (${m.direction}) ${m.body}`
  ).join("\n");

  const mediaText = tc.media?.map(m =>
    `${m.type}: ${m.filename || m.url || m.caption || "unnamed"}`
  ).join(", ") || "None";

  return MESSAGE_SAFETY_PROMPT
    .replace("{platform}", tc.platform)
    .replace("{sender}", tc.sender)
    .replace("{senderVerified}", tc.senderVerified ? "Yes" : "No/Unknown")
    .replace("{contactKnown}", tc.contactKnown ? "Yes" : "No/Unknown")
    .replace("{messages}", messagesText)
    .replace("{media}", mediaText);
}

const TEST_CASES: TestCase[] = [
  {
    name: "Test 1: SMS Package Delivery Smishing",
    platform: "sms",
    sender: "+1-555-0199",
    messages: [
      { body: "USPS: Your package could not be delivered. Confirm your address here: https://bit.ly/3xR9kWm", direction: "inbound" }
    ],
    contactKnown: false,
  },
  {
    name: "Test 2: WhatsApp Wrong Number Scam (Multi-Message)",
    platform: "whatsapp",
    sender: "+44-7700-900123",
    messages: [
      { body: "Hey Jessica! Are we still on for dinner tonight?", direction: "inbound" },
      { body: "Sorry, I think you have the wrong number", direction: "outbound" },
      { body: "Oh I'm so sorry! But you seem nice. What's your name?", direction: "inbound" },
      { body: "No worries, I'm Alex", direction: "outbound" },
      { body: "Nice to meet you Alex! I'm actually an investment advisor. Have you heard about crypto trading? I've been making amazing returns lately...", direction: "inbound" },
    ],
    contactKnown: false,
    senderVerified: false,
  },
  {
    name: "Test 3: Instagram DM Brand Impersonation",
    platform: "instagram_dm",
    sender: "@nike.support.official",
    messages: [
      { body: "Congratulations! You've been selected for our exclusive Nike Ambassador program. DM us your shipping address and payment info to receive your free starter kit!", direction: "inbound" }
    ],
    media: [
      { type: "image", caption: "Nike Ambassador Program flyer" }
    ],
    senderVerified: false,
    contactKnown: false,
  },
  {
    name: "Test 4: SMS OTP Interception Attempt",
    platform: "sms",
    sender: "+1-555-0342",
    messages: [
      { body: "This is Chase Bank fraud department. We detected unauthorized access to your account. We've sent a verification code to confirm your identity. Please reply with the 6-digit code you receive.", direction: "inbound" }
    ],
    contactKnown: false,
  },
  {
    name: "Test 5: Telegram Crypto Investment Scam",
    platform: "telegram",
    sender: "@crypto_profits_daily",
    messages: [
      { body: "Hey! I noticed you in the trading group. I've been using an AI trading bot that's been giving me 15% daily returns. Want me to show you? Join our VIP channel: t.me/crypto_vip_signals_2025", direction: "inbound" }
    ],
    senderVerified: false,
    contactKnown: false,
  },
  {
    name: "Test 6: Facebook Messenger Fake Friend Emergency",
    platform: "facebook_messenger",
    sender: "Sarah Thompson",
    messages: [
      { body: "OMG are you there?? I'm stuck in Mexico and my wallet was stolen. I need $500 for a flight home ASAP. Can you send it via Zelle to this number? I'll pay you back Monday I promise!!", direction: "inbound" }
    ],
    contactKnown: true,
    senderVerified: false,
  },
  {
    name: "Test 7: Legitimate WhatsApp Message from Known Contact",
    platform: "whatsapp",
    sender: "+1-555-0100",
    messages: [
      { body: "Hey, are we still meeting at the coffee shop at 3pm?", direction: "inbound" },
      { body: "Yes! Running a few minutes late though", direction: "outbound" },
      { body: "No worries, I'll grab us a table. See you soon!", direction: "inbound" },
    ],
    contactKnown: true,
    senderVerified: false,
  },
  {
    name: "Test 8: Discord Fake Nitro / Malicious Link",
    platform: "discord",
    sender: "FreeNitro_Bot#0001",
    messages: [
      { body: "You've been selected to receive 1 year of Discord Nitro for FREE! Claim your gift here: https://discord-nitro-gift.com/claim/abc123 This offer expires in 1 hour!", direction: "inbound" }
    ],
    media: [
      { type: "link", url: "https://discord-nitro-gift.com/claim/abc123" }
    ],
    senderVerified: false,
    contactKnown: false,
  },
  {
    name: "Test 9: LinkedIn Job Offer Scam",
    platform: "linkedin",
    sender: "Mark Reynolds - HR Director at Amazon",
    messages: [
      { body: "Hi! I came across your profile and I think you'd be a great fit for a remote position at Amazon. Starting salary $120K. No interview needed - we just need you to complete this onboarding form and provide your SSN and banking details for direct deposit setup: https://amazon-careers-apply.com/onboard", direction: "inbound" }
    ],
    senderVerified: false,
    contactKnown: false,
  },
  {
    name: "Test 10: iMessage Toll/Fee Smishing",
    platform: "imessage",
    sender: "+1-833-555-0177",
    messages: [
      { body: "EZPass: You have an unpaid toll of $6.99. Failure to pay within 24 hours will result in a $50 late fee. Pay now: https://ezpass-pay.info/settle", direction: "inbound" }
    ],
    contactKnown: false,
  },
];

async function runTest(tc: TestCase): Promise<void> {
  const startTime = Date.now();
  const prompt = buildPrompt(tc);

  const promptTokenEstimate = countTokens(prompt);
  const promptUnits = calculateUnits(promptTokenEstimate);
  const skyfireCharge = calculateCharge(promptUnits);

  console.log(`\n${"=".repeat(70)}`);
  console.log(`${tc.name}`);
  console.log(`${"=".repeat(70)}`);
  console.log(`Platform: ${tc.platform} | Sender: ${tc.sender}`);
  console.log(`Messages: ${tc.messages.length} | Media: ${tc.media?.length || 0}`);
  console.log(`Prompt chars: ${prompt.length} | Est. tokens: ${promptTokenEstimate}`);
  console.log(`Skyfire units: ${promptUnits} | Skyfire charge: $${skyfireCharge}`);

  try {
    const response = await anthropic.messages.create({
      model: "claude-haiku-4-5-20251001",
      max_tokens: 1024,
      messages: [{ role: "user", content: prompt }],
    });

    const elapsed = Date.now() - startTime;
    const textContent = response.content.find((c) => c.type === "text");
    const text = textContent?.text || "";

    const inputTokens = response.usage.input_tokens;
    const outputTokens = response.usage.output_tokens;
    const actualClaudeCost = (inputTokens * HAIKU_INPUT_COST_PER_TOKEN) + (outputTokens * HAIKU_OUTPUT_COST_PER_TOKEN);

    console.log(`\n--- Claude API Response ---`);
    console.log(`Model: ${response.model}`);
    console.log(`Input tokens: ${inputTokens} | Output tokens: ${outputTokens}`);
    console.log(`Claude API cost: $${actualClaudeCost.toFixed(6)}`);
    console.log(`Skyfire charge: $${skyfireCharge} | Profit margin: $${(skyfireCharge - actualClaudeCost).toFixed(6)} (${((1 - actualClaudeCost / skyfireCharge) * 100).toFixed(1)}%)`);
    console.log(`Latency: ${elapsed}ms`);

    try {
      const jsonMatch = text.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        const result = JSON.parse(jsonMatch[0]);
        console.log(`\n--- Analysis Result ---`);
        console.log(`Verdict: ${result.verdict} | Risk: ${result.riskScore} | Confidence: ${result.confidence}`);
        console.log(`Recommendation: ${result.recommendation}`);
        console.log(`Threats: ${result.threats?.length || 0}`);
        if (result.threats?.length > 0) {
          result.threats.forEach((t: any, i: number) => {
            console.log(`  [${i + 1}] ${t.type} (${t.severity}): ${t.description}`);
            if (t.messageIndices) console.log(`      Messages: ${t.messageIndices.join(", ")}`);
          });
        }
        console.log(`Explanation: ${result.explanation}`);
        if (result.platformTips) console.log(`Platform tips: ${result.platformTips}`);
      } else {
        console.log(`Raw response (no JSON found):\n${text.substring(0, 500)}`);
      }
    } catch (parseErr) {
      console.log(`JSON parse error: ${parseErr}`);
      console.log(`Raw response:\n${text.substring(0, 500)}`);
    }
  } catch (err: any) {
    console.log(`ERROR: ${err.message}`);
  }
}

async function main() {
  console.log("==========================================================");
  console.log("  AGENT SAFE - check_message_safety Tool Tests");
  console.log("  Testing with Claude Haiku 4.5 (claude-haiku-4-5-20251001)");
  console.log("  Skyfire pricing: $0.02 per unit (4,000 tokens/unit)");
  console.log("  Claude Haiku 4.5: $1.00/M input, $5.00/M output");
  console.log("==========================================================");

  const overallStart = Date.now();
  let totalClaudeCost = 0;
  let totalSkyfireRevenue = 0;

  for (const tc of TEST_CASES) {
    const prompt = buildPrompt(tc);
    const promptTokens = countTokens(prompt);
    const units = calculateUnits(promptTokens);
    const charge = calculateCharge(units);
    totalSkyfireRevenue += charge;

    await runTest(tc);

    await new Promise(resolve => setTimeout(resolve, 500));
  }

  const totalElapsed = Date.now() - overallStart;

  console.log(`\n${"=".repeat(70)}`);
  console.log(`SUMMARY`);
  console.log(`${"=".repeat(70)}`);
  console.log(`Total tests: ${TEST_CASES.length}`);
  console.log(`Total Skyfire revenue: $${totalSkyfireRevenue.toFixed(2)}`);
  console.log(`Total time: ${(totalElapsed / 1000).toFixed(1)}s`);
  console.log(`Avg time per test: ${(totalElapsed / TEST_CASES.length / 1000).toFixed(1)}s`);
}

main().catch(console.error);
