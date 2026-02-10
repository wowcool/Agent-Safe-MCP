# Awesome MCP Servers - Pull Request

## PR Title
Add Agent Safe - Email safety checker for AI agents

## Section
Security

## Entry to Add

Under the **Security** section (or create if it doesn't exist), add:

```markdown
- **[Agent Safe](https://agentsafe.locationledger.com)** - Remote MCP Server that analyzes emails for phishing, social engineering, prompt injection, CEO fraud, financial fraud, and data exfiltration targeting AI agents. Pay-per-use via Skyfire Network ($0.02/check). [Docs](https://agentsafe.locationledger.com/docs)
```

## PR Description

### What does this server do?

Agent Safe is a Remote MCP Server that checks emails for security threats before AI agents act on them. It analyzes across six threat categories:

- Phishing (fake logins, credential harvesting, spoofed senders)
- Prompt Injection (hidden instructions to hijack agent behavior)
- CEO Fraud (executive impersonation, urgent wire transfer requests)
- Social Engineering (psychological manipulation, false urgency)
- Financial Fraud (fake invoices, payment redirect scams)
- Data Exfiltration (tricks to leak sensitive data)

### How does it work?

Agents connect via MCP Streamable HTTP transport to `https://agentsafe.locationledger.com/mcp` and call the `check_email_safety` tool with sender, subject, and body. The response includes a verdict (safe/suspicious/dangerous), risk score (0.0-1.0), detected threats, analysis, and recommended action.

### Payment

$0.02 per check via Skyfire Network PAY tokens. No registration required.

### MCP Client Config

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

### Links
- Website: https://agentsafe.locationledger.com
- Docs: https://agentsafe.locationledger.com/docs
- How It Works: https://agentsafe.locationledger.com/how-it-works
- Terms: https://agentsafe.locationledger.com/terms
