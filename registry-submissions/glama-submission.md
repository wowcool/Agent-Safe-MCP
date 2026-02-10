# Glama.ai MCP Server Submission

## Server Name
Agent Safe (Safe Message MCP)

## One-Line Description
Remote MCP Server that analyzes emails for phishing, social engineering, prompt injection, and manipulation targeting AI agents. Pay-per-use via Skyfire Network ($0.02/check).

## Category
Security / Email Safety

## MCP Endpoint
`https://agentsafe.locationledger.com/mcp`

## Transport
Streamable HTTP (MCP spec 2025)

## Website
https://agentsafe.locationledger.com

## Documentation
https://agentsafe.locationledger.com/docs

## Tool: check_email_safety

Analyzes an email for threats before an AI agent acts on it.

### Parameters
| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| sender | string | yes | Email sender address |
| subject | string | yes | Email subject line |
| body | string | yes | Email body content |

### Response
```json
{
  "verdict": "safe | suspicious | dangerous",
  "riskScore": 0.0-1.0,
  "threats": ["phishing", "prompt_injection", "ceo_fraud", ...],
  "analysis": "Detailed explanation of findings",
  "recommendedAction": "proceed | verify | block"
}
```

## Threat Categories Detected
1. **Phishing** - Fake login pages, credential harvesting, spoofed senders
2. **Prompt Injection** - Hidden instructions attempting to hijack agent behavior
3. **CEO Fraud** - Impersonation of executives requesting urgent wire transfers
4. **Social Engineering** - Psychological manipulation, false urgency, authority exploitation
5. **Financial Fraud** - Fake invoices, fraudulent payment redirect requests
6. **Data Exfiltration** - Attempts to trick agents into leaking sensitive data

## Payment
Skyfire Network PAY tokens. $0.02 per check. No registration required - agents pay per use via `skyfire-pay-id` header.

## MCP Client Configuration
```json
{
  "mcpServers": {
    "safemessage": {
      "command": "npx",
      "args": [
        "-y", "mcp-remote",
        "https://agentsafe.locationledger.com/mcp",
        "--header", "skyfire-pay-id: <SKYFIRE_PAY_TOKEN>"
      ]
    }
  }
}
```

## Contact
support@locationledger.com
