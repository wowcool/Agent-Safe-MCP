# MCP-Get Package Submission

## Package Name
agent-safe

## Display Name
Agent Safe

## Description
Remote MCP Server that analyzes emails for phishing, social engineering, prompt injection, CEO fraud, financial fraud, and data exfiltration targeting AI agents. Returns safety verdict, risk score, and recommended action. Pay-per-use via Skyfire Network at $0.02 per check.

## Type
Remote (Streamable HTTP)

## Endpoint
https://agentsafe.locationledger.com/mcp

## Tool

### check_email_safety
Analyzes an email for security threats before an AI agent acts on it.

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| sender | string | yes | Email sender address |
| subject | string | yes | Email subject line |
| body | string | yes | Full email body content |

Returns: verdict (safe/suspicious/dangerous), riskScore (0.0-1.0), threats array, analysis text, recommendedAction (proceed/verify/block).

## Authentication
Skyfire PAY token via `skyfire-pay-id` header.

## Pricing
$0.02 USD per email check.

## Installation / Configuration
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

## Keywords
email-safety, phishing, prompt-injection, social-engineering, ceo-fraud, financial-fraud, data-exfiltration, security, ai-agent, skyfire, mcp-server

## Homepage
https://agentsafe.locationledger.com

## Documentation
https://agentsafe.locationledger.com/docs

## Publisher
LocationLedger

## Contact
support@locationledger.com

## License
Proprietary
