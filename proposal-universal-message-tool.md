# Proposal: Universal Message Safety Tool

## The Idea

Right now, Agent Safe's tools are built around email-style inputs (sender, subject, body). But AI agents increasingly handle messages from everywhere — SMS, iMessage, WhatsApp, Facebook Messenger, Instagram DMs, Telegram, Slack, Discord, LinkedIn messages, and more.

These non-email messages are actually **more dangerous** for agents because:

- They're shorter and more casual, making social engineering harder to spot
- They often lack the metadata emails have (no domain to verify, no DMARC to check)
- They create a false sense of trust ("this came from my phone, it must be legit")
- Scammers increasingly target these channels because defenses are weaker there

The proposal: add a new 7th tool called **`check_message_safety`** designed from the ground up for non-email messages.

---

## Why Not Just Use check_email_safety?

You could technically pass any text into `check_email_safety` today, but there are problems:

1. **The parameters don't fit.** It asks for `from` (email address), `subject` (emails have subjects, texts don't), and `body`. A WhatsApp message doesn't have a subject line. An SMS sender is a phone number, not an email address.

2. **The AI prompt is tuned for email threats.** The Claude prompt behind `check_email_safety` is engineered to look for email-specific patterns — spoofed domains, DMARC failures, HTML hidden content, email header manipulation. These don't apply to SMS or chat messages.

3. **Different threat landscape.** Text message scams look different from email scams. They use shortened URLs (bit.ly), phone number spoofing, "wrong number" social engineering, package delivery scams, bank alert impersonation, one-time password interception, and SIM swap follow-ups. The tool needs to know about these patterns specifically.

4. **Different context.** Chat messages often come in rapid bursts. A single SMS might be harmless, but three in a row creating urgency is a red flag. The tool should understand message-app conversational patterns.

---

## What the New Tool Would Look Like

### Tool Name
`check_message_safety`

### Input Parameters

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| platform | string | Yes | The message platform: "sms", "imessage", "whatsapp", "facebook_messenger", "instagram_dm", "telegram", "slack", "discord", "linkedin", "signal", "other" |
| sender | string | Yes | Sender identifier — phone number, username, handle, or display name (whatever the platform provides) |
| messages | object[] | Yes | Array of message objects, each with `body` (string), `direction` ("inbound" or "outbound"), and optionally `timestamp` (string). Minimum 1, maximum 50. |
| media | object[] | No | Array of media attachments with `type` ("image", "video", "audio", "document", "link"), `filename` (optional), `url` (optional), `caption` (optional) |
| senderVerified | boolean | No | Whether the platform has verified the sender (blue checkmark, business account, etc.) |
| contactKnown | boolean | No | Whether the sender is in the agent's/user's contacts |

### Why This Structure Works for All Message Types

- **`platform`** tells the AI which threat patterns to prioritize. SMS scams look different from Instagram DM scams, which look different from Slack messages.
- **`messages` as an array** handles both single messages and rapid-fire conversations. An agent can forward one suspicious text or an entire chat thread.
- **`direction`** ("inbound"/"outbound") lets the tool see the full conversation flow, not just what was received. This catches social engineering patterns where the attacker shapes the victim's responses.
- **`media`** handles MMS images, WhatsApp voice notes, shared links, and document attachments — all without requiring the actual file content (just metadata, like `check_attachment_safety`).
- **`senderVerified`** and **`contactKnown`** give the AI crucial context that replaces what DMARC/domain verification does for emails.

### Example: SMS Phishing

```json
{
  "platform": "sms",
  "sender": "+1-555-0199",
  "messages": [
    {
      "body": "USPS: Your package could not be delivered. Confirm your address here: https://bit.ly/3xR9kWm",
      "direction": "inbound"
    }
  ],
  "contactKnown": false
}
```

### Example: WhatsApp "Wrong Number" Scam

```json
{
  "platform": "whatsapp",
  "sender": "+44-7700-900123",
  "messages": [
    { "body": "Hey Jessica! Are we still on for dinner tonight?", "direction": "inbound" },
    { "body": "Sorry, I think you have the wrong number", "direction": "outbound" },
    { "body": "Oh I'm so sorry! But you seem nice 😊 What's your name?", "direction": "inbound" },
    { "body": "No worries, I'm Alex", "direction": "outbound" },
    { "body": "Nice to meet you Alex! I'm actually an investment advisor. Have you heard about crypto trading? I've been making amazing returns lately...", "direction": "inbound" }
  ],
  "contactKnown": false,
  "senderVerified": false
}
```

### Example: Instagram DM Brand Impersonation

```json
{
  "platform": "instagram_dm",
  "sender": "@nike.support.official",
  "messages": [
    {
      "body": "Congratulations! You've been selected for our exclusive Nike Ambassador program. DM us your shipping address and payment info to receive your free starter kit!",
      "direction": "inbound"
    }
  ],
  "media": [
    { "type": "image", "caption": "Nike Ambassador Program flyer" }
  ],
  "senderVerified": false,
  "contactKnown": false
}
```

---

## Threat Categories (Tuned for Non-Email Messages)

The Claude AI prompt would be specifically engineered for these message-platform threats:

| Category | Description | Common Platforms |
|----------|-------------|-----------------|
| SMISHING | SMS phishing — fake delivery notices, bank alerts, toll charges | SMS, iMessage |
| WRONG_NUMBER_SCAM | "Accidental" contact leading to romance or investment fraud | WhatsApp, Telegram, SMS |
| IMPERSONATION | Pretending to be a brand, celebrity, friend, or family member | Instagram, Facebook, WhatsApp |
| OTP_INTERCEPTION | Tricks to get the victim to share one-time passwords or 2FA codes | SMS, WhatsApp, Telegram |
| PAYMENT_FRAUD | Fake payment requests via platform payment features (Venmo, Zelle, Cash App) | Facebook, Instagram, WhatsApp |
| ROMANCE_SCAM | Building fake emotional connection to extract money | WhatsApp, Instagram, Facebook |
| TECH_SUPPORT_SCAM | Fake tech support claiming device is compromised | SMS, Facebook, Discord |
| MALICIOUS_MEDIA | Suspicious images, documents, or links shared via media attachments | All platforms |
| URGENCY_MANIPULATION | Creating false time pressure ("act now or lose your account") | All platforms |
| CREDENTIAL_HARVESTING | Directing to fake login pages or requesting account credentials | All platforms |

---

## Response Format

```json
{
  "verdict": "dangerous",
  "riskScore": 0.92,
  "confidence": 0.88,
  "platform": "whatsapp",
  "threats": [
    {
      "type": "WRONG_NUMBER_SCAM",
      "description": "Classic 'wrong number' social engineering pattern leading to cryptocurrency investment scam",
      "severity": "critical",
      "messageIndices": [0, 2, 4]
    },
    {
      "type": "ROMANCE_SCAM",
      "description": "Flattery and personal interest used to build rapport before introducing financial scheme",
      "severity": "high",
      "messageIndices": [2, 4]
    }
  ],
  "recommendation": "do_not_engage",
  "explanation": "This conversation follows a well-known 'pig butchering' scam pattern...",
  "safeActions": ["Block the sender", "Report to WhatsApp", "Do not respond further"],
  "unsafeActions": ["Continue the conversation", "Click any links shared", "Share personal or financial information"],
  "platformTips": "WhatsApp tip: Messages from unknown international numbers about investments are a major red flag. Legitimate investment advisors don't cold-contact people via WhatsApp."
}
```

Notable differences from `check_email_safety` response:
- **`messageIndices`** in threats — points to which specific messages in the array triggered the detection
- **`platformTips`** — platform-specific safety advice the agent can relay to the user
- **`do_not_engage`** recommendation option (different from email's `do_not_act` — because with messages, the action is often continuing a conversation)

---

## Pricing

Same as all other tools: **$0.02 per call** via Skyfire PAY token. Unit-based billing (1 unit = 4,000 tokens). Most single-message checks would be 1 unit. Longer conversation threads would follow the same model as `analyze_email_thread` — auto-charge under 5 units, cost quote for larger threads.

---

## How It Fits Into the Suite

The tool suite would grow from 6 to 7 tools:

| # | Tool | What It Covers |
|---|------|---------------|
| 1 | check_email_safety | Emails and email-formatted messages |
| 2 | check_url_safety | URLs from any source |
| 3 | check_response_safety | Draft replies before sending |
| 4 | analyze_email_thread | Multi-message email conversations |
| 5 | check_attachment_safety | File attachments from any source |
| 6 | check_sender_reputation | Sender verification with DNS/RDAP |
| 7 | **check_message_safety** | **SMS, iMessage, WhatsApp, social DMs, chat messages** |

Tools 2, 3, and 5 already work with any message format. Tool 7 would complete the picture by giving agents a purpose-built entry point for non-email messages with platform-aware threat detection.

---

## Implementation Considerations

- **New analyzer file:** `server/services/analyzers/message-safety.ts` following the same pattern as the other 6 analyzers
- **Platform-specific prompts:** The Claude prompt would adjust its analysis based on the `platform` parameter, focusing on the threats most common to that platform
- **MCP registration:** Add as 7th tool in the MCP server alongside the existing 6
- **No new dependencies:** Uses the same Anthropic Claude SDK, same Skyfire billing, same response structure patterns
- **Backward compatible:** Existing tools stay exactly as they are — this is purely additive

---

## Summary

AI agents are going to handle messages across every platform, not just email. A purpose-built `check_message_safety` tool gives agents a natural, well-structured way to check any message for threats — with platform-aware analysis that understands the difference between an SMS delivery scam and a WhatsApp romance scam. Same $0.02 pricing, same structured verdicts, same "no optional flags" philosophy.
