import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, Copy, CheckCircle2 } from "lucide-react";
import logoImg from "@assets/Screenshot_2026-02-06_at_09.52.49_1770389587007.png";
import { useState } from "react";
import { useToast } from "@/hooks/use-toast";

export default function Docs() {
  const { toast } = useToast();
  const [copied, setCopied] = useState<string | null>(null);

  const copyCode = (code: string, id: string) => {
    navigator.clipboard.writeText(code);
    setCopied(id);
    toast({ title: "Copied to clipboard" });
    setTimeout(() => setCopied(null), 2000);
  };

  const discoverExample = `curl https://your-domain.replit.app/mcp/discover`;

  const checkEmailExample = `curl -X POST https://your-domain.replit.app/mcp/tools/check_email_safety \\
  -H "Authorization: Bearer sm_live_your_token_here" \\
  -H "Content-Type: application/json" \\
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
  "charged": 0.05
}`;

  const pythonExample = `import requests

API_TOKEN = "sm_live_your_token_here"
BASE_URL = "https://your-domain.replit.app"

def check_email_safety(email_data):
    response = requests.post(
        f"{BASE_URL}/mcp/tools/check_email_safety",
        headers={
            "Authorization": f"Bearer {API_TOKEN}",
            "Content-Type": "application/json"
        },
        json={"email": email_data}
    )
    return response.json()

# Example usage
result = check_email_safety({
    "from": "sender@example.com",
    "subject": "Important message",
    "body": "Hello, please review this document...",
    "links": ["https://example.com/doc"],
    "attachments": [{"name": "document.pdf", "size": 1024}]
})

if result["verdict"] == "dangerous":
    print("Do not act on this email!")
elif result["verdict"] == "suspicious":
    print("Proceed with caution")
else:
    print("Email appears safe")`;

  const jsExample = `const API_TOKEN = "sm_live_your_token_here";
const BASE_URL = "https://your-domain.replit.app";

async function checkEmailSafety(email) {
  const response = await fetch(
    \`\${BASE_URL}/mcp/tools/check_email_safety\`,
    {
      method: "POST",
      headers: {
        "Authorization": \`Bearer \${API_TOKEN}\`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({ email })
    }
  );
  return response.json();
}

// Example usage
const result = await checkEmailSafety({
  from: "sender@example.com",
  subject: "Meeting request",
  body: "Can we schedule a call this week?",
  links: []
});

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

  return (
    <div className="min-h-screen bg-background">
      <header className="bg-black/60 backdrop-blur-[10px] sticky top-0 z-[100]">
        <div className="container mx-auto px-6 h-16 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <Link href="/">
              <Button variant="ghost" size="icon" data-testid="button-back">
                <ArrowLeft className="h-5 w-5" />
              </Button>
            </Link>
            <Link href="/">
              <div className="flex items-center gap-2.5 cursor-pointer">
                <img src={logoImg} alt="Safe Message" className="h-6 w-6" />
                <span className="text-white font-medium text-lg" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>Safe Message</span>
              </div>
            </Link>
            <span className="text-white/50">Documentation</span>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8 max-w-4xl">
        <h1 className="text-4xl font-bold mb-4">API Documentation</h1>
        <p className="text-xl text-muted-foreground mb-8">
          Integrate Safe Message email safety verification into your AI agents
        </p>

        <div className="space-y-8">
          <Card>
            <CardHeader>
              <CardTitle>Quick Start</CardTitle>
              <CardDescription>Get started with Safe Message in minutes</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <ol className="list-decimal list-inside space-y-2">
                <li><Link href="/signup" className="text-primary hover:underline">Create an account</Link></li>
                <li>Add a payment method in the billing section</li>
                <li>Generate an API token for your agent</li>
                <li>Call the check_email_safety endpoint before acting on emails</li>
              </ol>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Endpoints</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <Badge>GET</Badge>
                  <code className="text-sm">/mcp/discover</code>
                </div>
                <p className="text-sm text-muted-foreground mb-3">
                  Returns service information for MCP discovery. No authentication required.
                </p>
                <div className="relative">
                  <pre className="bg-accent p-4 rounded-lg text-sm overflow-x-auto">
                    {discoverExample}
                  </pre>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="absolute top-2 right-2"
                    onClick={() => copyCode(discoverExample, "discover")}
                    data-testid="button-copy-discover"
                  >
                    {copied === "discover" ? <CheckCircle2 className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                  </Button>
                </div>
              </div>

              <div>
                <div className="flex items-center gap-2 mb-2">
                  <Badge variant="secondary">POST</Badge>
                  <code className="text-sm">/mcp/tools/check_email_safety</code>
                </div>
                <p className="text-sm text-muted-foreground mb-3">
                  Analyze an email for safety. Requires Bearer token authentication.
                </p>
                <div className="relative">
                  <pre className="bg-accent p-4 rounded-lg text-sm overflow-x-auto whitespace-pre-wrap">
                    {checkEmailExample}
                  </pre>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="absolute top-2 right-2"
                    onClick={() => copyCode(checkEmailExample, "check")}
                    data-testid="button-copy-check"
                  >
                    {copied === "check" ? <CheckCircle2 className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Response Format</CardTitle>
              <CardDescription>Understanding the safety check response</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="relative mb-4">
                <pre className="bg-accent p-4 rounded-lg text-sm overflow-x-auto">
                  {responseExample}
                </pre>
                <Button
                  variant="ghost"
                  size="icon"
                  className="absolute top-2 right-2"
                  onClick={() => copyCode(responseExample, "response")}
                  data-testid="button-copy-response"
                >
                  {copied === "response" ? <CheckCircle2 className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                </Button>
              </div>

              <div className="space-y-4">
                <div>
                  <h4 className="font-semibold mb-2">Verdict Values</h4>
                  <ul className="space-y-1 text-sm">
                    <li><Badge className="bg-chart-4 mr-2">safe</Badge> Email appears legitimate</li>
                    <li><Badge variant="secondary" className="mr-2">suspicious</Badge> Contains potential threats</li>
                    <li><Badge variant="destructive" className="mr-2">dangerous</Badge> High-confidence threat detected</li>
                  </ul>
                </div>

                <div>
                  <h4 className="font-semibold mb-2">Threat Types</h4>
                  <ul className="text-sm text-muted-foreground space-y-1">
                    <li>PHISHING, SOCIAL_ENGINEERING, MALWARE, IMPERSONATION</li>
                    <li>URGENCY_MANIPULATION, AUTHORITY_ABUSE, DATA_EXFILTRATION, COMMAND_INJECTION</li>
                  </ul>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Code Examples</CardTitle>
            </CardHeader>
            <CardContent>
              <Tabs defaultValue="python">
                <TabsList>
                  <TabsTrigger value="python">Python</TabsTrigger>
                  <TabsTrigger value="javascript">JavaScript</TabsTrigger>
                </TabsList>
                <TabsContent value="python" className="relative">
                  <pre className="bg-accent p-4 rounded-lg text-sm overflow-x-auto mt-4">
                    {pythonExample}
                  </pre>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="absolute top-6 right-2"
                    onClick={() => copyCode(pythonExample, "python")}
                    data-testid="button-copy-python"
                  >
                    {copied === "python" ? <CheckCircle2 className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                  </Button>
                </TabsContent>
                <TabsContent value="javascript" className="relative">
                  <pre className="bg-accent p-4 rounded-lg text-sm overflow-x-auto mt-4">
                    {jsExample}
                  </pre>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="absolute top-6 right-2"
                    onClick={() => copyCode(jsExample, "js")}
                    data-testid="button-copy-js"
                  >
                    {copied === "js" ? <CheckCircle2 className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                  </Button>
                </TabsContent>
              </Tabs>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Authentication</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-sm">
                All API calls to protected endpoints require a Bearer token in the Authorization header:
              </p>
              <pre className="bg-accent p-4 rounded-lg text-sm">
                Authorization: Bearer sm_live_your_token_here
              </pre>
              <p className="text-sm text-muted-foreground">
                Tokens are created in your dashboard and have configurable monthly limits. 
                Each check costs $0.05 and is charged to the associated payment method.
              </p>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
}
