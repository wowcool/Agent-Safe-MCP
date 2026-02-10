# Official MCP Registry Submission

## Server Name
agent-safe

## Display Name
Agent Safe

## Description
Remote MCP Server that analyzes emails for phishing, social engineering, prompt injection, CEO fraud, financial fraud, and data exfiltration targeting AI agents. Returns verdict, risk score, threat list, and recommended action. Pay-per-use via Skyfire Network at $0.02/check.

## Transport
Streamable HTTP

## Endpoint
https://agentsafe.locationledger.com/mcp

## Tools

### check_email_safety
Analyzes an email for security threats before an AI agent acts on it.

**Input Schema:**
```json
{
  "type": "object",
  "properties": {
    "sender": { "type": "string", "description": "Email sender address" },
    "subject": { "type": "string", "description": "Email subject line" },
    "body": { "type": "string", "description": "Full email body content" }
  },
  "required": ["sender", "subject", "body"]
}
```

**Output:** JSON with verdict (safe/suspicious/dangerous), riskScore (0.0-1.0), threats array, analysis text, and recommendedAction (proceed/verify/block).

## Authentication
Skyfire PAY token via `skyfire-pay-id` header, or Bearer token via `Authorization` header.

## Pricing
$0.02 USD per email check via Skyfire Network.

## Client Configuration
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

## Discovery Endpoints
- Service discovery: `GET https://agentsafe.locationledger.com/mcp/discover`
- AI plugin manifest: `GET https://agentsafe.locationledger.com/.well-known/ai-plugin.json`
- Agent-readable docs: `GET https://agentsafe.locationledger.com/llms.txt`

## Website
https://agentsafe.locationledger.com

## Documentation
https://agentsafe.locationledger.com/docs

## Terms of Service
https://agentsafe.locationledger.com/terms

## Contact
support@locationledger.com

## Publisher
LocationLedger
