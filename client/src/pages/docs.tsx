import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, Copy, CheckCircle2 } from "lucide-react";
import logoImg from "@assets/mcp-logo-v4.png";
import { useState } from "react";
import { useToast } from "@/hooks/use-toast";
import { useSEO } from "@/lib/seo";
import { GlobalFooter } from "@/components/global-footer";

const BASE_URL = "https://agentsafe.locationledger.com";

export default function Docs() {
  useSEO({
    title: "Documentation - Agent Safe MCP Server | API Reference & Integration Guide",
    description: "Complete documentation for integrating Agent Safe into your AI agent. MCP configuration, REST API reference, Skyfire payment setup, and response format details.",
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
        "skyfire-pay-id: \${SKYFIRE_PAY_TOKEN}"
      ]
    }
  }
}`;

  const discoverExample = `curl ${BASE_URL}/mcp/discover`;

  const mcpInitExample = `curl -X POST ${BASE_URL}/mcp \\
  -H "Content-Type: application/json" \\
  -H "skyfire-pay-id: YOUR_SKYFIRE_PAY_TOKEN" \\
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
  -H "skyfire-pay-id: YOUR_SKYFIRE_PAY_TOKEN" \\
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
  -H "skyfire-pay-id: YOUR_SKYFIRE_PAY_TOKEN" \\
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
    headers = {"skyfire-pay-id": "YOUR_SKYFIRE_PAY_TOKEN"}
    
    async with streamablehttp_client(
        "${BASE_URL}/mcp",
        headers=headers
    ) as (read, write, _):
        async with ClientSession(read, write) as session:
            await session.initialize()
            
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

def check_email_safety(email_data, skyfire_token):
    response = requests.post(
        "${BASE_URL}/mcp/tools/check_email_safety",
        headers={
            "skyfire-pay-id": skyfire_token,
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
    skyfire_token="YOUR_SKYFIRE_PAY_TOKEN"
)

if result["verdict"] == "dangerous":
    print("Do not act on this email!")
elif result["verdict"] == "suspicious":
    print("Proceed with caution")
else:
    print("Email appears safe")`;

  const jsExample = `// Using MCP client (recommended)
import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { StreamableHTTPClientTransport } from "@modelcontextprotocol/sdk/client/streamableHttp.js";

const transport = new StreamableHTTPClientTransport(
  new URL("${BASE_URL}/mcp"),
  { requestInit: { headers: { "skyfire-pay-id": "YOUR_SKYFIRE_PAY_TOKEN" } } }
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
async function checkEmailSafety(email, skyfireToken) {
  const response = await fetch(
    "${BASE_URL}/mcp/tools/check_email_safety",
    {
      method: "POST",
      headers: {
        "skyfire-pay-id": skyfireToken,
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
  "YOUR_SKYFIRE_PAY_TOKEN"
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

  function CodeBlock({ code, id, label }: { code: string; id: string; label?: string }) {
    return (
      <div className="relative">
        {label && <p className="text-xs text-white/40 mb-1 font-mono">{label}</p>}
        <pre className="p-4 rounded-lg text-sm overflow-x-auto whitespace-pre-wrap" style={{ background: "#111318", border: "1px solid rgba(255,255,255,0.06)" }}>
          <code className="text-white/80">{code}</code>
        </pre>
        <Button
          variant="ghost"
          size="icon"
          className="absolute top-2 right-2 text-white/40"
          onClick={() => copyCode(code, id)}
          data-testid={`button-copy-${id}`}
        >
          {copied === id ? <CheckCircle2 className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
        </Button>
      </div>
    );
  }

  return (
    <div className="min-h-screen" style={{ background: "#0f1012", color: "#e5e5e5", fontFamily: "'Inter', system-ui, sans-serif" }}>
      <header className="sticky top-0 z-50 px-6 py-4" style={{ background: "rgba(15, 16, 18, 0.85)", backdropFilter: "blur(12px)", borderBottom: "1px solid rgba(255,255,255,0.06)" }}>
        <div className="container mx-auto max-w-4xl flex items-center gap-4">
          <Link href="/">
            <Button variant="ghost" size="icon" className="text-white/60" data-testid="button-back">
              <ArrowLeft className="h-4 w-4" />
            </Button>
          </Link>
          <Link href="/">
            <div className="flex items-center gap-2 cursor-pointer">
              <img src={logoImg} alt="Agent Safe" className="h-5 w-5" />
              <span className="text-white font-semibold" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>Agent Safe</span>
            </div>
          </Link>
          <span className="text-white/40 text-sm">Documentation</span>
        </div>
      </header>

      <main className="container mx-auto px-6 py-12 max-w-4xl">
        <h1 className="text-3xl font-bold text-white mb-2" style={{ fontFamily: "'Space Grotesk', sans-serif" }} data-testid="text-docs-title">
          MCP Server Documentation
        </h1>
        <p className="text-white/60 mb-10">
          Connect your AI agent to Agent Safe for email safety verification. No signup required — just a Skyfire PAY token.
        </p>

        <div className="space-y-8">
          <Card className="border-0" style={{ background: "#161820", border: "1px solid rgba(255,255,255,0.06)" }}>
            <CardHeader>
              <CardTitle className="text-white">Quick Start</CardTitle>
              <CardDescription className="text-white/50">Get connected in 3 steps</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <ol className="list-decimal list-inside space-y-3 text-white/80 text-sm">
                <li>Get a <a href="https://skyfire.xyz" target="_blank" rel="noopener" className="text-[hsl(200,70%,50%)] underline underline-offset-2">Skyfire PAY token</a> from the Skyfire Network</li>
                <li>Add the MCP server config to your agent's MCP settings file</li>
                <li>Your agent can now call <code className="px-1.5 py-0.5 rounded text-xs" style={{ background: "rgba(16, 106, 243, 0.15)", color: "hsl(200, 70%, 60%)" }}>check_email_safety</code> before acting on any email</li>
              </ol>

              <div className="mt-4">
                <p className="text-xs text-white/40 mb-2">MCP Client Configuration</p>
                <CodeBlock code={mcpConfigExample} id="mcp-config" />
              </div>
            </CardContent>
          </Card>

          <Card className="border-0" style={{ background: "#161820", border: "1px solid rgba(255,255,255,0.06)" }}>
            <CardHeader>
              <CardTitle className="text-white">Authentication</CardTitle>
              <CardDescription className="text-white/50">How payment and auth work</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4 text-sm text-white/80">
              <p>
                Agent Safe uses <strong className="text-white">pay-per-use</strong> pricing at <strong className="text-white">$0.02 per check</strong>. No signup, no API keys, no subscriptions.
              </p>

              <div className="space-y-3">
                <div className="p-3 rounded-lg" style={{ background: "rgba(16, 106, 243, 0.08)", border: "1px solid rgba(16, 106, 243, 0.15)" }}>
                  <p className="font-semibold text-white text-xs uppercase tracking-wider mb-1">Primary: Skyfire PAY Token</p>
                  <p className="text-white/70 text-xs">
                    Include a <code className="px-1 py-0.5 rounded text-[hsl(200,70%,60%)]" style={{ background: "rgba(16, 106, 243, 0.15)" }}>skyfire-pay-id</code> header with your Skyfire PAY token. The token is validated and charged automatically via the Skyfire Network.
                  </p>
                </div>

              </div>

              <p className="text-white/50 text-xs">
                The Skyfire token must be valid and have sufficient balance. Each call is charged $0.02 automatically via the Skyfire Network.
              </p>
            </CardContent>
          </Card>

          <Card className="border-0" style={{ background: "#161820", border: "1px solid rgba(255,255,255,0.06)" }}>
            <CardHeader>
              <CardTitle className="text-white">MCP Protocol</CardTitle>
              <CardDescription className="text-white/50">Connect via Model Context Protocol (recommended)</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div>
                <div className="flex flex-wrap items-center gap-2 mb-2">
                  <Badge variant="secondary" data-testid="badge-mcp-post">POST</Badge>
                  <code className="text-sm text-white/80">{BASE_URL}/mcp</code>
                </div>
                <p className="text-sm text-white/50 mb-4">
                  Streamable HTTP transport endpoint. Accepts JSON-RPC 2.0 messages per the MCP specification.
                </p>

                <div className="space-y-4">
                  <div>
                    <p className="text-xs text-white/40 mb-2 font-semibold uppercase tracking-wider">Initialize Connection</p>
                    <CodeBlock code={mcpInitExample} id="mcp-init" />
                  </div>

                  <div>
                    <p className="text-xs text-white/40 mb-2 font-semibold uppercase tracking-wider">Call check_email_safety</p>
                    <CodeBlock code={mcpToolCallExample} id="mcp-tool-call" />
                  </div>
                </div>
              </div>

              <div>
                <h4 className="font-semibold text-white text-sm mb-2">Available MCP Methods</h4>
                <ul className="text-sm text-white/70 space-y-1.5">
                  <li><code className="text-xs px-1.5 py-0.5 rounded" style={{ background: "rgba(255,255,255,0.06)" }}>initialize</code> — Handshake and capability negotiation</li>
                  <li><code className="text-xs px-1.5 py-0.5 rounded" style={{ background: "rgba(255,255,255,0.06)" }}>tools/list</code> — Discover available tools</li>
                  <li><code className="text-xs px-1.5 py-0.5 rounded" style={{ background: "rgba(255,255,255,0.06)" }}>tools/call</code> — Execute check_email_safety (requires payment)</li>
                </ul>
              </div>
            </CardContent>
          </Card>

          <Card className="border-0" style={{ background: "#161820", border: "1px solid rgba(255,255,255,0.06)" }}>
            <CardHeader>
              <CardTitle className="text-white">REST API</CardTitle>
              <CardDescription className="text-white/50">Alternative REST endpoints</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div>
                <div className="flex flex-wrap items-center gap-2 mb-2">
                  <Badge data-testid="badge-discover-get">GET</Badge>
                  <code className="text-sm text-white/80">/mcp/discover</code>
                </div>
                <p className="text-sm text-white/50 mb-3">
                  Service discovery endpoint. No authentication required.
                </p>
                <CodeBlock code={discoverExample} id="discover" />
              </div>

              <div>
                <div className="flex flex-wrap items-center gap-2 mb-2">
                  <Badge variant="secondary" data-testid="badge-check-post">POST</Badge>
                  <code className="text-sm text-white/80">/mcp/tools/check_email_safety</code>
                </div>
                <p className="text-sm text-white/50 mb-3">
                  REST wrapper for the email safety check. Requires <code>skyfire-pay-id</code> header.
                </p>
                <CodeBlock code={restCheckExample} id="rest-check" />
              </div>
            </CardContent>
          </Card>

          <Card className="border-0" style={{ background: "#161820", border: "1px solid rgba(255,255,255,0.06)" }}>
            <CardHeader>
              <CardTitle className="text-white">Tool: check_email_safety</CardTitle>
              <CardDescription className="text-white/50">Input parameters and response format</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div>
                <h4 className="font-semibold text-white text-sm mb-3">Input Parameters</h4>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm" style={{ borderCollapse: "separate", borderSpacing: 0 }}>
                    <thead>
                      <tr className="text-left text-white/40 text-xs uppercase tracking-wider">
                        <th className="pb-2 pr-4">Parameter</th>
                        <th className="pb-2 pr-4">Type</th>
                        <th className="pb-2 pr-4">Required</th>
                        <th className="pb-2">Description</th>
                      </tr>
                    </thead>
                    <tbody className="text-white/70">
                      <tr><td className="py-1.5 pr-4"><code className="text-xs">from</code></td><td className="pr-4">string</td><td className="pr-4">Yes</td><td>Sender email address</td></tr>
                      <tr><td className="py-1.5 pr-4"><code className="text-xs">subject</code></td><td className="pr-4">string</td><td className="pr-4">Yes</td><td>Email subject line</td></tr>
                      <tr><td className="py-1.5 pr-4"><code className="text-xs">body</code></td><td className="pr-4">string</td><td className="pr-4">Yes</td><td>Email body content</td></tr>
                      <tr><td className="py-1.5 pr-4"><code className="text-xs">links</code></td><td className="pr-4">string[]</td><td className="pr-4">No</td><td>URLs found in the email</td></tr>
                      <tr><td className="py-1.5 pr-4"><code className="text-xs">attachments</code></td><td className="pr-4">object[]</td><td className="pr-4">No</td><td>Attachment metadata (name, size, type)</td></tr>
                    </tbody>
                  </table>
                </div>
              </div>

              <div>
                <h4 className="font-semibold text-white text-sm mb-3">Response</h4>
                <CodeBlock code={responseExample} id="response" />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <h4 className="font-semibold text-white text-sm mb-2">Verdict Values</h4>
                  <ul className="space-y-1.5 text-sm">
                    <li className="flex flex-wrap items-center gap-2"><Badge className="bg-emerald-600/20 text-emerald-400 border-emerald-600/30">safe</Badge> <span className="text-white/70">Email appears legitimate</span></li>
                    <li className="flex flex-wrap items-center gap-2"><Badge className="bg-amber-600/20 text-amber-400 border-amber-600/30">suspicious</Badge> <span className="text-white/70">Contains potential threats</span></li>
                    <li className="flex flex-wrap items-center gap-2"><Badge className="bg-red-600/20 text-red-400 border-red-600/30">dangerous</Badge> <span className="text-white/70">High-confidence threat</span></li>
                  </ul>
                </div>
                <div>
                  <h4 className="font-semibold text-white text-sm mb-2">Threat Types</h4>
                  <ul className="text-xs text-white/50 space-y-1">
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

          <Card className="border-0" style={{ background: "#161820", border: "1px solid rgba(255,255,255,0.06)" }}>
            <CardHeader>
              <CardTitle className="text-white">Code Examples</CardTitle>
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

          <Card className="border-0" style={{ background: "#161820", border: "1px solid rgba(255,255,255,0.06)" }}>
            <CardHeader>
              <CardTitle className="text-white">Pricing</CardTitle>
            </CardHeader>
            <CardContent className="text-sm text-white/80 space-y-2">
              <p><strong className="text-white">$0.02 per email check</strong> — charged at time of request via Skyfire PAY token.</p>
              <p className="text-white/50">Failed requests (invalid token, insufficient balance) are not charged. Only successful analysis incurs a charge.</p>
            </CardContent>
          </Card>

          <div className="pt-4 pb-8 flex flex-wrap items-center justify-between gap-4">
            <Link href="/">
              <Button variant="ghost" className="text-white/50" data-testid="button-back-home">
                <ArrowLeft className="h-4 w-4 mr-2" /> Back to Home
              </Button>
            </Link>
            <a href="https://skyfire.xyz" target="_blank" rel="noopener">
              <Button variant="outline" className="text-white/70 border-white/10" data-testid="button-get-skyfire">
                Get a Skyfire Token
              </Button>
            </a>
          </div>
        </div>
      </main>

      <GlobalFooter />
    </div>
  );
}
