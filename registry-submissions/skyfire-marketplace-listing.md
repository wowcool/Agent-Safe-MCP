# Skyfire Marketplace Listing

## Seller ID
5958164f-62ea-4058-9a8c-50222482dbd2

## Service Name
Agent Safe (Safe Message MCP)

## Category
Security / AI Agent Tools

## Short Description
Email safety checker for AI agents. Detects phishing, social engineering, prompt injection, CEO fraud, financial fraud, and data exfiltration before your agent acts.

## Long Description
Agent Safe is an email safety verification MCP server built for AI agents. Before your agent responds to, forwards, or takes action on any email, Agent Safe analyzes it across six threat categories and returns a clear safety verdict.

### What It Does
- Analyzes emails for phishing, prompt injection, CEO fraud, social engineering, financial fraud, and data exfiltration
- Returns a verdict (safe/suspicious/dangerous), risk score (0.0-1.0), detected threats, detailed analysis, and recommended action
- Powered by Anthropic Claude for deep contextual analysis

### How Agents Connect
Agents connect via MCP Streamable HTTP transport. Send a Skyfire PAY token in the `skyfire-pay-id` header. No registration, no API keys, no setup. Just connect and check.

### Pricing
$0.01 per email check.

### MCP Endpoint
`https://agentsafe.locationledger.com/mcp`

### Tool
`check_email_safety` - Pass sender, subject, and body. Get back safety verdict and threat analysis.

### MCP Client Configuration
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

## Website
https://agentsafe.locationledger.com

## Documentation
https://agentsafe.locationledger.com/docs

## Terms of Service
https://agentsafe.locationledger.com/terms

## Support Email
support@locationledger.com
