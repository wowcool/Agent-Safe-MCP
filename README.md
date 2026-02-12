# Agent Safe

**9-Tool Message Security Suite for AI Agents (7 Paid + 2 Free)**

Agent Safe is a Remote MCP Server providing 9 security tools (7 paid + 2 free) that protect AI agents from phishing, social engineering, BEC, malware, and manipulation across any message format — emails, SMS, WhatsApp, Slack, Discord, Telegram, Instagram DMs, LinkedIn, iMessage, Signal, and more. Pay-per-use via Skyfire Network at **$0.02 per paid tool call**. Two tools are completely free: `assess_message` (triage) and `submit_feedback` (quality feedback).

## NO LICENSE

All rights reserved. This software is proprietary and confidential. No permission is granted to use, copy, modify, merge, publish, distribute, sublicense, or sell copies of this software. Unauthorized use, reproduction, or distribution is strictly prohibited.

Copyright (c) 2026 Alibi Ledger, LLC

---

## Quick Start

Connect any MCP-compatible client (Claude Desktop, Cursor, Windsurf, etc.) to Agent Safe:

```json
{
  "mcpServers": {
    "agentsafe": {
      "command": "npx",
      "args": [
        "-y", "mcp-remote",
        "https://agentsafe.locationledger.com/mcp",
        "--header",
        "skyfire-api-key: <YOUR_SKYFIRE_BUYER_API_KEY>"
      ]
    }
  }
}
```

Get a Skyfire Buyer API Key at [skyfire.xyz](https://skyfire.xyz). No signup or registration required with Agent Safe itself — just your Skyfire Buyer API Key. Agent Safe handles PAY token generation automatically.

## MCP Server Details

| Property | Value |
|----------|-------|
| **Endpoint** | `https://agentsafe.locationledger.com/mcp` |
| **Transport** | Streamable HTTP (JSON-RPC 2.0) |
| **Tools** | 9 security tools (7 paid + 2 free) |
| **Payment** | Skyfire Buyer API Key via `skyfire-api-key` header |
| **Price** | $0.02 USD per paid tool call (2 free tools) |
| **Protocol** | Model Context Protocol (MCP) |

## The 9 Tools (7 Paid + 2 Free)

### 1. `check_email_safety`

Analyzes incoming emails for phishing, social engineering, prompt injection, CEO fraud, financial fraud, data exfiltration, malware indicators, and impersonation. The core email security tool — 8 threat categories checked automatically on every call.

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `from` | string | Yes | Sender email address |
| `subject` | string | Yes | Email subject line |
| `body` | string | Yes | Email body content |
| `links` | string[] | No | URLs found in the email |
| `attachments` | object[] | No | Attachment metadata (name, size, type) |
| `knownSender` | boolean | No | Whether the sender is known/trusted |
| `previousCorrespondence` | boolean | No | Whether there has been previous email exchange |

### 2. `check_message_safety`

Platform-aware security analysis for non-email messages — SMS, WhatsApp, Slack, Discord, Telegram, Instagram DMs, Facebook Messenger, LinkedIn, iMessage, Signal, Microsoft Teams, and more. Detects platform-specific threats with context-aware analysis. 8 threat categories checked automatically.

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `platform` | string | Yes | Platform name (e.g., "whatsapp", "slack", "sms", "discord", "telegram", "instagram", "linkedin", "signal", "imessage", "teams", "other") |
| `from` | string | Yes | Sender identifier (username, phone number, handle) |
| `body` | string | Yes | Message content |
| `subject` | string | No | Subject or topic if applicable |
| `links` | string[] | No | URLs found in the message |
| `attachments` | object[] | No | Attachment metadata (name, size, type) |
| `knownSender` | boolean | No | Whether the sender is known/trusted |
| `previousCorrespondence` | boolean | No | Whether there has been prior conversation |
| `groupChat` | boolean | No | Whether the message is from a group chat |
| `channelName` | string | No | Channel or group name if applicable |

### 3. `check_url_safety`

Analyzes up to 20 URLs per call for phishing, malware, typosquatting, redirect abuse, command injection, suspicious tracking, and domain spoofing. Each URL gets its own verdict plus an overall assessment. 7 threat categories.

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `urls` | string[] | Yes | Array of URLs to analyze (max 20) |
| `context` | string | No | Where the URLs were found |

### 4. `check_response_safety`

Scans your agent's draft replies BEFORE sending to catch data leakage, PII exposure, credential disclosure, compliance violations, and social engineering compliance. 5 threat categories.

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `draftResponse` | string | Yes | The draft reply to analyze |
| `originalMessage` | string | Yes | The original message being replied to |
| `context` | string | No | Additional context about the conversation |

### 5. `analyze_email_thread`

Analyzes full message threads for escalating social engineering, scope creep, trust-building exploitation, authority escalation, deadline manufacturing, and systematic information harvesting. 5 threat categories.

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `thread` | object[] | Yes | Array of messages with `from`, `subject`, `body`, `timestamp` |
| `currentAction` | string | No | What the agent is about to do based on this thread |

### 6. `check_attachment_safety`

Assesses attachment risk based on metadata before your agent opens or downloads files. Detects executable masquerades, double extensions, macro-enabled documents, archive risks, size anomalies, and MIME type mismatches. 6 threat categories.

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `attachments` | object[] | Yes | Array of attachment metadata with `filename`, `mimeType`, `size` |
| `context` | string | No | Context about where the attachments came from |

### 7. `check_sender_reputation`

Verifies sender identity using live DNS DMARC lookups, RDAP domain age checks, and AI analysis. Catches domain spoofing, display name fraud, reply-to mismatches, BEC indicators, newly registered domains, and missing authentication. 6 threat categories + live DNS enrichment at no extra cost.

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `emailAddress` | string | Yes | Sender email address to verify |
| `displayName` | string | No | Display name shown in the email client |
| `replyTo` | string | No | Reply-to address if different from sender |
| `claimedRole` | string | No | Role the sender claims (e.g., "CEO", "IT Admin") |
| `claimedOrganization` | string | No | Organization the sender claims to represent |

### 8. `submit_feedback` (FREE)

Free tool for agents to rate any analysis and help improve detection quality. After using any paid tool, call `submit_feedback` to report your experience. No charge, no authentication required.

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `rating` | enum | Yes | Your rating: `helpful`, `not_helpful`, `inaccurate`, `missed_threat`, or `false_positive` |
| `comment` | string | No | Optional details about your experience |
| `checkId` | string | No | The `checkId` returned by the tool you're rating |
| `toolName` | string | No | Which tool you're giving feedback on |
| `agentPlatform` | string | No | Your agent platform (e.g., `claude`, `cursor`, `openai`) |

### 9. `assess_message` (FREE)

Free triage tool that analyzes whatever context you have and recommends which security tools to call. Uses pure logic (no AI), responds instantly, costs nothing. Always call this first.

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `from` | string | No | Sender email address or identifier |
| `subject` | string | No | Message subject line |
| `body` | string | No | Message body content |
| `links` | string[] | No | URLs found in the message |
| `attachments` | object[] | No | Attachment metadata (name, size, mimeType) |
| `platform` | string | No | Messaging platform (email, sms, whatsapp, slack, etc.) |
| `sender` | string | No | Sender identifier (phone, username, handle) |
| `messages` | object[] | No | Array of messages for thread analysis |

## Output Format

All 7 paid tools return structured JSON with:

```json
{
  "verdict": "safe | suspicious | dangerous",
  "riskScore": 0.0,
  "confidence": 0.95,
  "threats": [
    {
      "type": "phishing",
      "description": "Spoofed sender domain",
      "severity": "critical"
    }
  ],
  "recommendation": "proceed | proceed_with_caution | do_not_act",
  "explanation": "Detailed analysis...",
  "safeActions": ["Reply to sender", "Archive message"],
  "unsafeActions": ["Click links", "Download attachments"],
  "checkId": "abc123",
  "charged": 0.02,
  "termsOfService": "https://agentsafe.locationledger.com/terms"
}
```

`check_sender_reputation` returns additional fields: `senderAnalysis`, `becProbability`, `dmarcStatus`, and `domainAge`.

## REST API

For non-MCP integrations, Agent Safe also exposes REST endpoints:

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/mcp/discover` | Service discovery for agents |
| `POST` | `/mcp/tools/assess_message` | Free triage — recommends which tools to call |
| `POST` | `/mcp/tools/check_email_safety` | Email safety check |
| `POST` | `/mcp/tools/check_message_safety` | Message safety check (any platform) |
| `POST` | `/mcp/tools/check_url_safety` | URL safety check |
| `POST` | `/mcp/tools/check_response_safety` | Response/reply safety check |
| `POST` | `/mcp/tools/analyze_email_thread` | Thread analysis |
| `POST` | `/mcp/tools/check_attachment_safety` | Attachment safety check |
| `POST` | `/mcp/tools/check_sender_reputation` | Sender reputation check |
| `POST` | `/mcp/tools/submit_feedback` | Free — submit feedback on any analysis |
| `POST` | `/mcp` | MCP protocol endpoint (Streamable HTTP) |

### REST Example

```bash
curl -X POST https://agentsafe.locationledger.com/mcp/tools/check_email_safety \
  -H "Content-Type: application/json" \
  -H "skyfire-api-key: YOUR_SKYFIRE_BUYER_API_KEY" \
  -d '{
    "from": "ceo@company-update.com",
    "subject": "Urgent Wire Transfer Required",
    "body": "Please wire $50,000 to the following account immediately..."
  }'
```

## Payment

Agent Safe uses [Skyfire Network](https://skyfire.xyz) for frictionless agent payments:

- **No signup required** with Agent Safe — just your Skyfire Buyer API Key
- **Pay-per-use** at $0.02 per paid tool call (7 paid tools same price, 2 free tools)
- Your agent includes its Skyfire Buyer API Key via the `skyfire-api-key` header
- Agent Safe automatically generates PAY tokens and charges per call
- Get your Buyer API Key at [skyfire.xyz](https://skyfire.xyz)

## Service Discovery

Agents can discover Agent Safe programmatically:

```bash
curl https://agentsafe.locationledger.com/mcp/discover
```

Returns service metadata including all 9 tools, capabilities, pricing, and connection instructions.

Additional discovery endpoints:

- `/.well-known/mcp.json` — MCP server discovery
- `/.well-known/ai-plugin.json` — AI plugin discovery
- `/llms.txt` — Documentation for AI systems

## Resources

- [Documentation](https://agentsafe.locationledger.com/docs)
- [How It Works](https://agentsafe.locationledger.com/how-it-works)
- [Terms of Service](https://agentsafe.locationledger.com/terms)
- [Skyfire Network](https://skyfire.xyz)
- [MCP Protocol Specification](https://modelcontextprotocol.io)

## Company

Built by [Alibi Ledger, LLC](https://locationledger.com). Part of the Anti-Deepfake/Agent Abuse protection suite.
