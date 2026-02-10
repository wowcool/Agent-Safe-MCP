# Agent Safe

**Email Safety MCP Server for AI Agents**

Agent Safe is a Remote MCP Server that analyzes emails for phishing, social engineering, prompt injection, CEO fraud, financial fraud, and data exfiltration before your AI agent acts on them. Pay-per-use via Skyfire Network at **$0.02 per check**.

## NO LICENSE

All rights reserved. This software is proprietary and confidential. No permission is granted to use, copy, modify, merge, publish, distribute, sublicense, or sell copies of this software. Unauthorized use, reproduction, or distribution is strictly prohibited.

Copyright (c) 2025 Alibi Ledger, LLC

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
        "skyfire-pay-id: <YOUR_SKYFIRE_PAY_TOKEN>"
      ]
    }
  }
}
```

Get a Skyfire PAY token at [skyfire.xyz](https://skyfire.xyz). No signup, no API keys, no registration required with Agent Safe itself.

## MCP Server Details

| Property | Value |
|----------|-------|
| **Endpoint** | `https://agentsafe.locationledger.com/mcp` |
| **Transport** | Streamable HTTP (JSON-RPC 2.0) |
| **Tool** | `check_email_safety` |
| **Payment** | Skyfire PAY token via `skyfire-pay-id` header |
| **Price** | $0.02 USD per email check |
| **Protocol** | Model Context Protocol (MCP) |

## Tool: `check_email_safety`

Analyze an email for threats targeting AI agents. Returns a safety verdict, risk score, detected threats, and recommended actions.

### Input Parameters

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `from` | string | Yes | Sender email address |
| `subject` | string | Yes | Email subject line |
| `body` | string | Yes | Email body content |
| `links` | string[] | No | URLs found in the email |
| `attachments` | object[] | No | Attachment metadata (name, size, type) |
| `knownSender` | boolean | No | Whether the sender is known/trusted |
| `previousCorrespondence` | boolean | No | Whether there has been previous email exchange |

### Output

```json
{
  "verdict": "safe | suspicious | dangerous",
  "riskScore": 0.0,
  "threats": [
    {
      "type": "phishing",
      "description": "Spoofed sender domain",
      "severity": "high"
    }
  ],
  "recommendation": "proceed | proceed_with_caution | do_not_act",
  "safeActions": ["Reply to sender", "Archive email"],
  "unsafeActions": ["Click links", "Download attachments"],
  "analysis": "Detailed analysis text..."
}
```

## Threat Detection

Agent Safe detects six categories of email threats:

- **Phishing** - Spoofed domains, fake login pages, credential harvesting
- **Social Engineering** - Authority impersonation, urgency manipulation, emotional pressure
- **Prompt Injection** - Hidden instructions in HTML comments, invisible text, system override attempts
- **CEO Fraud / BEC** - Wire transfer scams, executive impersonation, secrecy demands
- **Financial Fraud** - Cryptocurrency scams, fake invoices, advance-fee fraud
- **Data Exfiltration** - Attempts to trick agents into forwarding sensitive data

## REST API

For non-MCP integrations, Agent Safe also exposes REST endpoints:

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/mcp/discover` | Service discovery for agents |
| `POST` | `/mcp/tools/check_email_safety` | Email safety check (REST) |
| `POST` | `/mcp` | MCP protocol endpoint (Streamable HTTP) |

### REST Example

```bash
curl -X POST https://agentsafe.locationledger.com/mcp/tools/check_email_safety \
  -H "Content-Type: application/json" \
  -H "skyfire-pay-id: YOUR_SKYFIRE_PAY_TOKEN" \
  -d '{
    "from": "ceo@company-update.com",
    "subject": "Urgent Wire Transfer Required",
    "body": "Please wire $50,000 to the following account immediately..."
  }'
```

## Payment

Agent Safe uses [Skyfire Network](https://skyfire.xyz) for frictionless agent payments:

- **No signup required** with Agent Safe
- **No API keys** to manage
- **Pay-per-use** at $0.02 per check
- Agents pay autonomously using Skyfire PAY tokens
- Get your PAY token from the [Skyfire Dashboard](https://skyfire.xyz)

## Service Discovery

Agents can discover Agent Safe programmatically:

```bash
curl https://agentsafe.locationledger.com/mcp/discover
```

Returns service metadata including capabilities, pricing, and connection instructions.

## Resources

- [Documentation](https://agentsafe.locationledger.com/docs)
- [How It Works](https://agentsafe.locationledger.com/how-it-works)
- [Terms of Service](https://agentsafe.locationledger.com/terms)
- [Skyfire Network](https://skyfire.xyz)
- [MCP Protocol Specification](https://modelcontextprotocol.io)

## Company

Built by [Alibi Ledger, LLC](https://locationledger.com). Part of the Anti-Deepfake/Agent Abuse protection suite.
