import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Copy, CheckCircle2, ArrowLeft } from "lucide-react";
import { useState } from "react";
import { useToast } from "@/hooks/use-toast";
import { useSEO } from "@/lib/seo";
import { GlobalFooter } from "@/components/global-footer";
import { SiteHeader } from "@/components/site-header";

const BASE_URL = "https://agentsafe.locationledger.com";

export default function Docs() {
  useSEO({
    title: "Documentation - Agent Safe 9-Tool Message Security Suite | API Reference & 2 Free Tools",
    description: "Complete documentation for Agent Safe's 9-tool message security suite with 2 free tools (assess_message triage + submit_feedback). Protects AI agents across email, SMS, WhatsApp, Slack, Discord, and every messaging platform. MCP configuration, REST API reference for all 9 tools.",
    path: "/docs",
  });
  const { toast } = useToast();
  const [copied, setCopied] = useState<string | null>(null);

  const copyCode = (code: string, id: string) => {
    navigator.clipboard.writeText(code);
    setCopied(id);
    toast({ title: "Copied to clipboard" });
    setTimeout(() => setCopied(null), 2000);
  };

  const mcpConfigExample = `{
  "mcpServers": {
    "agentsafe": {
      "command": "npx",
      "args": [
        "-y", "mcp-remote",
        "${BASE_URL}/mcp",
        "--header",
        "skyfire-api-key: \${SKYFIRE_BUYER_API_KEY}"
      ]
    }
  }
}`;

  const discoverExample = `curl ${BASE_URL}/mcp/discover`;

  const mcpInitExample = `curl -X POST ${BASE_URL}/mcp \\
  -H "Content-Type: application/json" \\
  -H "skyfire-api-key: YOUR_SKYFIRE_BUYER_API_KEY" \\
  -d '{
    "jsonrpc": "2.0",
    "id": 1,
    "method": "initialize",
    "params": {
      "protocolVersion": "2025-01-01",
      "capabilities": {},
      "clientInfo": { "name": "my-agent", "version": "1.0" }
    }
  }'`;

  const mcpToolCallExample = `curl -X POST ${BASE_URL}/mcp \\
  -H "Content-Type: application/json" \\
  -H "skyfire-api-key: YOUR_SKYFIRE_BUYER_API_KEY" \\
  -d '{
    "jsonrpc": "2.0",
    "id": 2,
    "method": "tools/call",
    "params": {
      "name": "check_email_safety",
      "arguments": {
        "from": "sender@example.com",
        "subject": "Urgent: Verify your account",
        "body": "Click here to verify your account immediately...",
        "links": ["https://suspicious-link.com/verify"]
      }
    }
  }'`;

  const restCheckExample = `curl -X POST ${BASE_URL}/mcp/tools/check_email_safety \\
  -H "Content-Type: application/json" \\
  -H "skyfire-api-key: YOUR_SKYFIRE_BUYER_API_KEY" \\
  -d '{
    "email": {
      "from": "sender@example.com",
      "subject": "Urgent: Verify your account",
      "body": "Click here to verify your account immediately...",
      "links": ["https://suspicious-link.com/verify"]
    }
  }'`;

  const responseExample = `{
  "verdict": "suspicious",
  "riskScore": 0.75,
  "confidence": 0.92,
  "threats": [
    {
      "type": "PHISHING",
      "description": "Email requests account verification via external link",
      "severity": "high"
    },
    {
      "type": "URGENCY_MANIPULATION",
      "description": "Uses urgent language to pressure immediate action",
      "severity": "medium"
    }
  ],
  "recommendation": "do_not_act",
  "explanation": "This email shows signs of a phishing attempt...",
  "safeActions": ["Report as spam", "Delete email"],
  "unsafeActions": ["Click any links", "Reply with personal info"],
  "checkId": "chk_abc123",
  "charged": 0.02
}`;

  const pythonMcpExample = `# Install: pip install mcp
from mcp import ClientSession
from mcp.client.streamable_http import streamablehttp_client

async def check_email():
    headers = {"skyfire-api-key": "YOUR_SKYFIRE_BUYER_API_KEY"}
    
    async with streamablehttp_client(
        "${BASE_URL}/mcp",
        headers=headers
    ) as (read, write, _):
        async with ClientSession(read, write) as session:
            await session.initialize()
            
            # All tools are called the same way — just change the tool name and arguments
            result = await session.call_tool(
                "check_email_safety",
                arguments={
                    "from": "sender@example.com",
                    "subject": "Important message",
                    "body": "Hello, please review this document...",
                    "links": ["https://example.com/doc"]
                }
            )
            print(result)`;

  const pythonRestExample = `import requests

# All tools use the same pattern — swap the endpoint and payload
def check_email_safety(email_data, buyer_api_key):
    response = requests.post(
        "${BASE_URL}/mcp/tools/check_email_safety",
        headers={
            "skyfire-api-key": buyer_api_key,
            "Content-Type": "application/json"
        },
        json={"email": email_data}
    )
    return response.json()

result = check_email_safety(
    {
        "from": "sender@example.com",
        "subject": "Important message",
        "body": "Hello, please review this document...",
        "links": ["https://example.com/doc"],
        "attachments": [{"name": "document.pdf", "size": 1024}]
    },
    buyer_api_key="YOUR_SKYFIRE_BUYER_API_KEY"
)

if result["verdict"] == "dangerous":
    print("Do not act on this email!")
elif result["verdict"] == "suspicious":
    print("Proceed with caution")
else:
    print("Email appears safe")`;

  const jsExample = `// Using MCP client (recommended)
// All tools are called the same way — just change the tool name and arguments
import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { StreamableHTTPClientTransport } from "@modelcontextprotocol/sdk/client/streamableHttp.js";

const transport = new StreamableHTTPClientTransport(
  new URL("${BASE_URL}/mcp"),
  { requestInit: { headers: { "skyfire-api-key": "YOUR_SKYFIRE_BUYER_API_KEY" } } }
);

const client = new Client({ name: "my-agent", version: "1.0" });
await client.connect(transport);

const result = await client.callTool("check_email_safety", {
  from: "sender@example.com",
  subject: "Meeting request",
  body: "Can we schedule a call this week?",
  links: []
});

console.log(result);`;

  const jsRestExample = `// Using REST API (alternative)
// All tools follow the same pattern — swap the endpoint and payload
async function checkEmailSafety(email, buyerApiKey) {
  const response = await fetch(
    "${BASE_URL}/mcp/tools/check_email_safety",
    {
      method: "POST",
      headers: {
        "skyfire-api-key": buyerApiKey,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({ email })
    }
  );
  return response.json();
}

const result = await checkEmailSafety(
  {
    from: "sender@example.com",
    subject: "Meeting request",
    body: "Can we schedule a call this week?",
    links: []
  },
  "YOUR_SKYFIRE_BUYER_API_KEY"
);

switch (result.recommendation) {
  case "proceed":
    console.log("Safe to act on this email");
    break;
  case "proceed_with_caution":
    console.log("Verify sender before taking action");
    break;
  case "do_not_act":
    console.log("This email may be malicious!");
    break;
}`;

  const codeStyle = { background: "hsl(var(--primary) / 0.1)", color: "hsl(var(--primary))" };

  function CodeBlock({ code, id, label }: { code: string; id: string; label?: string }) {
    return (
      <div className="relative">
        {label && <p className="text-xs text-muted-foreground/70 mb-1 font-mono">{label}</p>}
        <pre className="p-4 rounded-lg text-sm overflow-x-auto whitespace-pre-wrap bg-card border border-border">
          <code className="text-foreground/80">{code}</code>
        </pre>
        <Button
          variant="ghost"
          size="icon"
          className="absolute top-2 right-2 text-muted-foreground"
          onClick={() => copyCode(code, id)}
          data-testid={`button-copy-${id}`}
        >
          {copied === id ? <CheckCircle2 className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
        </Button>
      </div>
    );
  }

  function ParamTable({ rows }: { rows: { name: string; type: string; required: boolean; description: string }[] }) {
    return (
      <div className="overflow-x-auto">
        <table className="w-full text-sm" style={{ borderCollapse: "separate", borderSpacing: 0 }}>
          <thead>
            <tr className="text-left text-muted-foreground/70 text-xs uppercase tracking-wider">
              <th className="pb-2 pr-4">Parameter</th>
              <th className="pb-2 pr-4">Type</th>
              <th className="pb-2 pr-4">Required</th>
              <th className="pb-2">Description</th>
            </tr>
          </thead>
          <tbody className="text-muted-foreground">
            {rows.map((row) => (
              <tr key={row.name}>
                <td className="py-1.5 pr-4"><code className="text-xs">{row.name}</code></td>
                <td className="pr-4">{row.type}</td>
                <td className="pr-4">{row.required ? "Yes" : "No"}</td>
                <td>{row.description}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    );
  }

  const restAssessExample = `curl -X POST ${BASE_URL}/mcp/tools/assess_message \\
  -H "Content-Type: application/json" \\
  -d '{
    "from": "ceo@company-update.com",
    "subject": "Urgent Wire Transfer",
    "body": "Please process this immediately...",
    "links": ["https://suspicious-site.com/login"],
    "attachments": [{"name": "invoice.pdf", "size": 50000, "mimeType": "application/pdf"}]
  }'`;

  const toolDefinitions = [
    {
      name: "assess_message",
      description: "Free triage tool that analyzes any message and recommends which specific security tools to call. Accepts all optional fields (from, subject, body, links, attachments, platform, sender, messages, media) and costs nothing. Use this first to determine the best tools for your message.",
      badge: "FREE",
      params: [
        { name: "from", type: "string", required: false, description: "Sender email address or identifier" },
        { name: "subject", type: "string", required: false, description: "Message subject line" },
        { name: "body", type: "string", required: false, description: "Message body content" },
        { name: "links", type: "string[]", required: false, description: "URLs found in the message" },
        { name: "attachments", type: "object[]", required: false, description: "Attachment metadata (name, size, mimeType)" },
        { name: "platform", type: "string", required: false, description: "Messaging platform (email, sms, whatsapp, slack, etc.)" },
        { name: "sender", type: "string", required: false, description: "Sender identifier (phone, username, handle)" },
        { name: "messages", type: "object[]", required: false, description: "Array of messages for thread/conversation analysis" },
        { name: "media", type: "object[]", required: false, description: "Media attachments (type, filename, url, caption)" },
      ],
      responseNote: "Returns { recommendedTools[], reasoning, riskIndicators[] }. No charge — completely free.",
    },
    {
      name: "check_email_safety",
      description: "Analyze an email for phishing, social engineering, malware, and other threats. Returns a verdict with risk score, detected threats, and recommended actions.",
      params: [
        { name: "from", type: "string", required: true, description: "Sender email address" },
        { name: "subject", type: "string", required: true, description: "Email subject line" },
        { name: "body", type: "string", required: true, description: "Email body content" },
        { name: "links", type: "string[]", required: false, description: "URLs found in the email" },
        { name: "attachments", type: "object[]", required: false, description: "Attachment metadata (name, size, type)" },
        { name: "knownSender", type: "boolean", required: false, description: "Whether the sender is known/trusted" },
        { name: "previousCorrespondence", type: "boolean", required: false, description: "Whether there has been prior email exchange" },
      ],
      responseNote: null,
    },
    {
      name: "check_url_safety",
      description: "Analyze one or more URLs for phishing, malware distribution, suspicious redirects, and domain reputation issues.",
      params: [
        { name: "urls", type: "string[]", required: true, description: "Array of URLs to analyze (max 20)" },
      ],
      responseNote: "Returns { overallVerdict, overallRiskScore, urlResults: [...] } with per-URL analysis.",
    },
    {
      name: "check_response_safety",
      description: "Check a draft email reply before sending to ensure it doesn't leak sensitive information or fall for social engineering traps.",
      params: [
        { name: "draftTo", type: "string", required: true, description: "Recipient of the draft reply" },
        { name: "draftSubject", type: "string", required: true, description: "Subject of the draft reply" },
        { name: "draftBody", type: "string", required: true, description: "Body content of the draft reply" },
        { name: "originalFrom", type: "string", required: false, description: "Sender of the original email being replied to" },
        { name: "originalSubject", type: "string", required: false, description: "Subject of the original email" },
        { name: "originalBody", type: "string", required: false, description: "Body of the original email" },
      ],
      responseNote: "Returns { verdict, riskScore, confidence, threats, recommendation }.",
    },
    {
      name: "analyze_email_thread",
      description: "Analyze an email thread for manipulation patterns, escalating social engineering, and suspicious behavior across multiple messages.",
      params: [
        { name: "messages", type: "object[]", required: true, description: "Array of thread messages (min 2, max 50). Each: { from, subject, body, date? }" },
      ],
      responseNote: "Returns { verdict, riskScore, confidence, manipulationPatterns, threadProgression }.",
    },
    {
      name: "check_attachment_safety",
      description: "Assess email attachments for potential malware, suspicious file types, and risky metadata without needing the actual file content.",
      params: [
        { name: "attachments", type: "object[]", required: true, description: "Array of attachments (max 20). Each: { name, size, mimeType, from? }" },
      ],
      responseNote: "Returns { overallVerdict, overallRiskScore, attachmentResults: [...] } with per-attachment analysis.",
    },
    {
      name: "check_sender_reputation",
      description: "Verify a sender's identity and domain reputation using live DNS DMARC lookups and RDAP domain registration data.",
      params: [
        { name: "email", type: "string", required: true, description: "Sender email address to verify" },
        { name: "displayName", type: "string", required: true, description: "Display name shown in the email" },
        { name: "replyTo", type: "string", required: false, description: "Reply-To address if different from sender" },
        { name: "emailSubject", type: "string", required: false, description: "Subject line for context" },
        { name: "emailSnippet", type: "string", required: false, description: "Brief snippet of email body for context" },
      ],
      responseNote: "Returns { senderVerdict, trustScore, confidence, identityIssues, domainIntel }.",
    },
    {
      name: "check_message_safety",
      description: "Analyze non-email messages (SMS, WhatsApp, Instagram DMs, Discord, Slack, Telegram, LinkedIn, Facebook Messenger, iMessage, Signal) for platform-specific threats.",
      params: [
        { name: "platform", type: "enum", required: true, description: "Platform: sms, imessage, whatsapp, facebook_messenger, instagram_dm, telegram, slack, discord, linkedin, signal, other" },
        { name: "sender", type: "string", required: true, description: "Sender identifier (phone number, username, handle)" },
        { name: "messages", type: "object[]", required: true, description: "Messages array (min 1, max 50). Each: { body, direction, timestamp? }" },
        { name: "media", type: "object[]", required: false, description: "Media attachments. Each: { type, filename?, url?, caption? }" },
        { name: "senderVerified", type: "boolean", required: false, description: "Whether platform verified the sender" },
        { name: "contactKnown", type: "boolean", required: false, description: "Whether sender is a known contact" },
      ],
      responseNote: "Returns { verdict, riskScore, confidence, platform, threats[] with messageIndices, recommendation, explanation, safeActions[], unsafeActions[], platformTips }.",
    },
    {
      name: "submit_feedback",
      description: "Free tool for agents to rate any analysis and help improve detection quality. No charge, no authentication required. Accepts a rating, optional comment, checkId, tool name, and agent platform.",
      badge: "FREE",
      params: [
        { name: "rating", type: "enum", required: true, description: "Your rating: helpful, not_helpful, inaccurate, missed_threat, or false_positive" },
        { name: "comment", type: "string", required: false, description: "Optional details about your experience" },
        { name: "checkId", type: "string", required: false, description: "The checkId returned by the tool you're rating" },
        { name: "toolName", type: "string", required: false, description: "Which tool you're giving feedback on" },
        { name: "agentPlatform", type: "string", required: false, description: "Your agent platform (e.g. claude, cursor, openai)" },
      ],
      responseNote: "Returns { received, message, charged: 0 }. No charge — completely free.",
    },
  ];

  const restEndpoints = [
    { path: "/mcp/tools/assess_message", description: "Free triage — recommends which tools to call", free: true },
    { path: "/mcp/tools/check_email_safety", description: "Analyze a single email for threats" },
    { path: "/mcp/tools/check_url_safety", description: "Check one or more URLs for safety" },
    { path: "/mcp/tools/check_response_safety", description: "Verify a draft reply before sending" },
    { path: "/mcp/tools/analyze_email_thread", description: "Analyze an email thread for manipulation" },
    { path: "/mcp/tools/check_attachment_safety", description: "Assess attachment safety by metadata" },
    { path: "/mcp/tools/check_sender_reputation", description: "Verify sender identity and domain reputation" },
    { path: "/mcp/tools/check_message_safety", description: "Analyze non-email messages for platform threats" },
    { path: "/mcp/tools/submit_feedback", description: "Submit feedback on any analysis — free", free: true },
  ];

  return (
    <div className="min-h-screen bg-background text-foreground">
      <SiteHeader />

      <main className="container mx-auto px-6 py-12 max-w-4xl">
        <h1 className="text-3xl font-bold mb-2" style={{ fontFamily: "'Space Grotesk', sans-serif" }} data-testid="text-docs-title">
          MCP Server Documentation
        </h1>
        <p className="text-muted-foreground mb-10">
          Connect your AI agent to Agent Safe's 9-tool message security suite — including 2 free tools (triage + feedback). Protect against threats across email, SMS, WhatsApp, Slack, Discord, and every messaging platform. No signup required — just a Skyfire Buyer API Key.
        </p>

        <div className="space-y-8">
          <Card>
            <CardHeader>
              <CardTitle>Quick Start</CardTitle>
              <CardDescription>Get connected in 3 steps</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <ol className="list-decimal list-inside space-y-3 text-foreground/80 text-sm">
                <li>Get a <a href="https://skyfire.xyz" target="_blank" rel="noopener" className="text-primary underline underline-offset-2">Skyfire Buyer API Key</a> from the Skyfire Network</li>
                <li>Add the MCP server config to your agent's MCP settings file</li>
                <li>Your agent can now use all <strong>9 message security tools</strong> — start with the free <code className="px-1.5 py-0.5 rounded text-xs" style={codeStyle}>assess_message</code> triage tool, 7 paid tools (<code className="px-1.5 py-0.5 rounded text-xs" style={codeStyle}>check_email_safety</code>, <code className="px-1.5 py-0.5 rounded text-xs" style={codeStyle}>check_url_safety</code>, <code className="px-1.5 py-0.5 rounded text-xs" style={codeStyle}>check_response_safety</code>, <code className="px-1.5 py-0.5 rounded text-xs" style={codeStyle}>analyze_email_thread</code>, <code className="px-1.5 py-0.5 rounded text-xs" style={codeStyle}>check_attachment_safety</code>, <code className="px-1.5 py-0.5 rounded text-xs" style={codeStyle}>check_sender_reputation</code>, <code className="px-1.5 py-0.5 rounded text-xs" style={codeStyle}>check_message_safety</code>), and the free <code className="px-1.5 py-0.5 rounded text-xs" style={codeStyle}>submit_feedback</code> tool</li>
              </ol>

              <div className="mt-4">
                <p className="text-xs text-muted-foreground/70 mb-2">MCP Client Configuration</p>
                <CodeBlock code={mcpConfigExample} id="mcp-config" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Authentication</CardTitle>
              <CardDescription>How payment and auth work</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4 text-sm text-foreground/80">
              <p>
                Agent Safe uses <strong>pay-per-use</strong> pricing at <strong>$0.02 per tool call</strong>. No signup with Agent Safe — just your Skyfire Buyer API Key.
              </p>

              <div className="space-y-3">
                <div className="bg-primary/10 border border-primary/20 p-3 rounded-lg">
                  <p className="font-semibold text-xs uppercase tracking-wider mb-1">Skyfire Buyer API Key (Recommended)</p>
                  <p className="text-muted-foreground text-xs">
                    Include a <code className="px-1 py-0.5 rounded text-xs" style={codeStyle}>skyfire-api-key</code> header with your Skyfire Buyer API Key. Agent Safe automatically generates a PAY token and charges $0.02 per call. Alternatively, your agent can generate its own PAY tokens and send them via the <code className="px-1 py-0.5 rounded text-xs" style={codeStyle}>skyfire-pay-id</code> header.
                  </p>
                </div>

              </div>

              <p className="text-muted-foreground text-xs">
                Your Skyfire Buyer API Key must be valid and have sufficient wallet balance. Each tool call is charged $0.02 automatically via the Skyfire Network.
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>MCP Protocol</CardTitle>
              <CardDescription>Connect via Model Context Protocol (recommended)</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div>
                <div className="flex flex-wrap items-center gap-2 mb-2">
                  <Badge variant="secondary" data-testid="badge-mcp-post">POST</Badge>
                  <code className="text-sm text-foreground/80">{BASE_URL}/mcp</code>
                </div>
                <p className="text-sm text-muted-foreground mb-4">
                  Streamable HTTP transport endpoint. Accepts JSON-RPC 2.0 messages per the MCP specification.
                </p>

                <div className="space-y-4">
                  <div>
                    <p className="text-xs text-muted-foreground/70 mb-2 font-semibold uppercase tracking-wider">Initialize Connection</p>
                    <CodeBlock code={mcpInitExample} id="mcp-init" />
                  </div>

                  <div>
                    <p className="text-xs text-muted-foreground/70 mb-2 font-semibold uppercase tracking-wider">Call check_email_safety</p>
                    <CodeBlock code={mcpToolCallExample} id="mcp-tool-call" />
                  </div>
                </div>
              </div>

              <div>
                <h4 className="font-semibold text-sm mb-2">Available MCP Methods</h4>
                <ul className="text-sm text-muted-foreground space-y-1.5">
                  <li><code className="text-xs px-1.5 py-0.5 rounded bg-muted">initialize</code> — Handshake and capability negotiation</li>
                  <li><code className="text-xs px-1.5 py-0.5 rounded bg-muted">tools/list</code> — Discover all 9 available tools</li>
                  <li className="space-y-1">
                    <span><code className="text-xs px-1.5 py-0.5 rounded bg-muted">tools/call</code> — Execute any of the 9 security tools:</span>
                    <ul className="ml-6 mt-1 space-y-0.5 text-muted-foreground text-xs">
                      <li><code style={codeStyle} className="px-1 py-0.5 rounded">assess_message</code> — <Badge className="bg-emerald-600/20 text-emerald-400 border-emerald-600/30 text-[10px] px-1 py-0">FREE</Badge> Triage tool that recommends which tools to call</li>
                      <li><code style={codeStyle} className="px-1 py-0.5 rounded">check_email_safety</code> — Analyze emails for threats</li>
                      <li><code style={codeStyle} className="px-1 py-0.5 rounded">check_url_safety</code> — Check URL safety</li>
                      <li><code style={codeStyle} className="px-1 py-0.5 rounded">check_response_safety</code> — Verify draft replies</li>
                      <li><code style={codeStyle} className="px-1 py-0.5 rounded">analyze_email_thread</code> — Analyze email threads</li>
                      <li><code style={codeStyle} className="px-1 py-0.5 rounded">check_attachment_safety</code> — Assess attachments</li>
                      <li><code style={codeStyle} className="px-1 py-0.5 rounded">check_sender_reputation</code> — Verify sender identity</li>
                      <li><code style={codeStyle} className="px-1 py-0.5 rounded">check_message_safety</code> — Analyze non-email messages</li>
                      <li><code style={codeStyle} className="px-1 py-0.5 rounded">submit_feedback</code> — <Badge className="bg-emerald-600/20 text-emerald-400 border-emerald-600/30 text-[10px] px-1 py-0">FREE</Badge> Rate analysis quality</li>
                    </ul>
                  </li>
                </ul>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>REST API</CardTitle>
              <CardDescription>Alternative REST endpoints for all 9 tools</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div>
                <div className="flex flex-wrap items-center gap-2 mb-2">
                  <Badge data-testid="badge-discover-get">GET</Badge>
                  <code className="text-sm text-foreground/80">/mcp/discover</code>
                </div>
                <p className="text-sm text-muted-foreground mb-3">
                  Service discovery endpoint. No authentication required.
                </p>
                <CodeBlock code={discoverExample} id="discover" />
              </div>

              {restEndpoints.map((endpoint, idx) => (
                <div key={endpoint.path}>
                  <div className="flex flex-wrap items-center gap-2 mb-2">
                    <Badge variant="secondary" data-testid={`badge-rest-post-${idx}`}>POST</Badge>
                    <code className="text-sm text-foreground/80">{endpoint.path}</code>
                    {endpoint.free && <Badge className="bg-emerald-600/20 text-emerald-400 border-emerald-600/30 text-[10px] px-1 py-0">FREE</Badge>}
                  </div>
                  <p className="text-sm text-muted-foreground mb-1">
                    {endpoint.free
                      ? <>{endpoint.description}. No authentication required — completely free.</>
                      : <>{endpoint.description}. Requires <code className="text-xs" style={codeStyle}>skyfire-api-key</code> or <code className="text-xs" style={codeStyle}>skyfire-pay-id</code> header.</>
                    }
                  </p>
                </div>
              ))}

              <div className="mt-2">
                <p className="text-xs text-muted-foreground/70 mb-2 font-semibold uppercase tracking-wider">Example: assess_message (free — no API key needed)</p>
                <CodeBlock code={restAssessExample} id="rest-assess" />
              </div>

              <div className="mt-2">
                <p className="text-xs text-muted-foreground/70 mb-2 font-semibold uppercase tracking-wider">Example: check_email_safety</p>
                <CodeBlock code={restCheckExample} id="rest-check" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Tool Reference</CardTitle>
              <CardDescription>Input parameters for all 9 security tools</CardDescription>
            </CardHeader>
            <CardContent className="space-y-8">
              {toolDefinitions.map((tool) => (
                <div key={tool.name} data-testid={`section-tool-${tool.name}`}>
                  <h4 className="font-semibold text-sm mb-1 flex flex-wrap items-center gap-2">
                    <code className="px-1.5 py-0.5 rounded text-sm" style={codeStyle}>{tool.name}</code>
                    {tool.badge && <Badge className="bg-emerald-600/20 text-emerald-400 border-emerald-600/30 text-[10px] px-1.5 py-0">{tool.badge}</Badge>}
                  </h4>
                  <p className="text-sm text-muted-foreground mb-3">{tool.description}</p>
                  <ParamTable rows={tool.params} />
                  {tool.responseNote && (
                    <p className="text-xs text-muted-foreground/70 mt-2 italic">{tool.responseNote}</p>
                  )}
                </div>
              ))}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Response Format</CardTitle>
              <CardDescription>Response structure and verdict values</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div>
                <h4 className="font-semibold text-sm mb-3">Example Response (check_email_safety)</h4>
                <CodeBlock code={responseExample} id="response" />
              </div>

              <div>
                <h4 className="font-semibold text-sm mb-3">Response Differences by Tool</h4>
                <div className="space-y-2 text-sm text-muted-foreground">
                  <div className="p-3 rounded-lg bg-muted/30 border border-border/50">
                    <code className="text-xs" style={codeStyle}>assess_message</code>
                    <Badge className="bg-emerald-600/20 text-emerald-400 border-emerald-600/30 text-[10px] px-1 py-0 ml-1">FREE</Badge>
                    <span className="ml-2">returns <code className="text-xs text-muted-foreground">{"{ recommendedTools[], reasoning, riskIndicators[] }"}</code></span>
                  </div>
                  <div className="p-3 rounded-lg bg-muted/30 border border-border/50">
                    <code className="text-xs" style={codeStyle}>check_url_safety</code>
                    <span className="ml-2">returns <code className="text-xs text-muted-foreground">{"{ overallVerdict, overallRiskScore, urlResults: [...] }"}</code></span>
                  </div>
                  <div className="p-3 rounded-lg bg-muted/30 border border-border/50">
                    <code className="text-xs" style={codeStyle}>check_response_safety</code>
                    <span className="ml-2">returns <code className="text-xs text-muted-foreground">{"{ verdict, riskScore, confidence, threats, recommendation }"}</code></span>
                  </div>
                  <div className="p-3 rounded-lg bg-muted/30 border border-border/50">
                    <code className="text-xs" style={codeStyle}>analyze_email_thread</code>
                    <span className="ml-2">returns <code className="text-xs text-muted-foreground">{"{ verdict, riskScore, confidence, manipulationPatterns, threadProgression }"}</code></span>
                  </div>
                  <div className="p-3 rounded-lg bg-muted/30 border border-border/50">
                    <code className="text-xs" style={codeStyle}>check_attachment_safety</code>
                    <span className="ml-2">returns <code className="text-xs text-muted-foreground">{"{ overallVerdict, overallRiskScore, attachmentResults: [...] }"}</code></span>
                  </div>
                  <div className="p-3 rounded-lg bg-muted/30 border border-border/50">
                    <code className="text-xs" style={codeStyle}>check_sender_reputation</code>
                    <span className="ml-2">returns <code className="text-xs text-muted-foreground">{"{ senderVerdict, trustScore, confidence, identityIssues, domainIntel }"}</code></span>
                  </div>
                  <div className="p-3 rounded-lg bg-muted/30 border border-border/50">
                    <code className="text-xs" style={codeStyle}>check_message_safety</code>
                    <span className="ml-2">returns <code className="text-xs text-muted-foreground">{"{ verdict, riskScore, confidence, platform, threats, recommendation, platformTips }"}</code></span>
                  </div>
                  <div className="p-3 rounded-lg bg-muted/30 border border-border/50">
                    <code className="text-xs" style={codeStyle}>submit_feedback</code>
                    <Badge className="bg-emerald-600/20 text-emerald-400 border-emerald-600/30 text-[10px] px-1 py-0 ml-1">FREE</Badge>
                    <span className="ml-2">returns <code className="text-xs text-muted-foreground">{"{ received, message, charged: 0 }"}</code></span>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <h4 className="font-semibold text-sm mb-2">Verdict Values</h4>
                  <ul className="space-y-1.5 text-sm">
                    <li className="flex flex-wrap items-center gap-2"><Badge className="bg-emerald-600/20 text-emerald-400 border-emerald-600/30">safe</Badge> <span className="text-muted-foreground">Email appears legitimate</span></li>
                    <li className="flex flex-wrap items-center gap-2"><Badge className="bg-amber-600/20 text-amber-400 border-amber-600/30">suspicious</Badge> <span className="text-muted-foreground">Contains potential threats</span></li>
                    <li className="flex flex-wrap items-center gap-2"><Badge className="bg-red-600/20 text-red-400 border-red-600/30">dangerous</Badge> <span className="text-muted-foreground">High-confidence threat</span></li>
                  </ul>
                </div>
                <div>
                  <h4 className="font-semibold text-sm mb-2">Threat Types</h4>
                  <ul className="text-xs text-muted-foreground space-y-1">
                    <li>PHISHING</li>
                    <li>SOCIAL_ENGINEERING</li>
                    <li>MALWARE</li>
                    <li>IMPERSONATION</li>
                    <li>URGENCY_MANIPULATION</li>
                    <li>AUTHORITY_ABUSE</li>
                    <li>DATA_EXFILTRATION</li>
                    <li>COMMAND_INJECTION</li>
                  </ul>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Code Examples</CardTitle>
              <CardDescription>Examples use check_email_safety — all tools are called the same way</CardDescription>
            </CardHeader>
            <CardContent>
              <Tabs defaultValue="python-mcp">
                <TabsList className="mb-4">
                  <TabsTrigger value="python-mcp" data-testid="tab-python-mcp">Python MCP</TabsTrigger>
                  <TabsTrigger value="python-rest" data-testid="tab-python-rest">Python REST</TabsTrigger>
                  <TabsTrigger value="js-mcp" data-testid="tab-js-mcp">JS MCP</TabsTrigger>
                  <TabsTrigger value="js-rest" data-testid="tab-js-rest">JS REST</TabsTrigger>
                </TabsList>
                <TabsContent value="python-mcp">
                  <CodeBlock code={pythonMcpExample} id="python-mcp" />
                </TabsContent>
                <TabsContent value="python-rest">
                  <CodeBlock code={pythonRestExample} id="python-rest" />
                </TabsContent>
                <TabsContent value="js-mcp">
                  <CodeBlock code={jsExample} id="js-mcp" />
                </TabsContent>
                <TabsContent value="js-rest">
                  <CodeBlock code={jsRestExample} id="js-rest" />
                </TabsContent>
              </Tabs>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Pricing</CardTitle>
            </CardHeader>
            <CardContent className="text-sm text-foreground/80 space-y-2">
              <p><strong>$0.02 per tool call</strong> — charged at time of request via your Skyfire Buyer API Key. Applies to all 7 paid tools. Two tools are <strong>completely free</strong>: <code className="px-1 py-0.5 rounded text-xs" style={codeStyle}>assess_message</code> (triage) and <code className="px-1 py-0.5 rounded text-xs" style={codeStyle}>submit_feedback</code> (quality feedback).</p>
              <p className="text-muted-foreground">Failed requests (invalid token, insufficient balance) are not charged. Only successful analysis incurs a charge.</p>
            </CardContent>
          </Card>

          <div className="pt-4 pb-8 flex flex-wrap items-center justify-between gap-4">
            <Link href="/">
              <Button variant="ghost" className="text-muted-foreground" data-testid="button-back-home">
                <ArrowLeft className="h-4 w-4 mr-2" /> Back to Home
              </Button>
            </Link>
            <a href="https://skyfire.xyz" target="_blank" rel="noopener">
              <Button variant="outline" className="text-muted-foreground border-border" data-testid="button-get-skyfire">
                Get a Skyfire Buyer API Key
              </Button>
            </a>
          </div>
        </div>
      </main>

      <GlobalFooter />
    </div>
  );
}
