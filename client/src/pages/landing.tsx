import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Bot, Shield, Zap, Lock, Terminal, CheckCircle2, Copy, ExternalLink } from "lucide-react";
import logoImg from "@assets/mcp-logo-v4.png";
import { useState } from "react";

function CopyButton({ text }: { text: string }) {
  const [copied, setCopied] = useState(false);
  return (
    <Button
      size="icon"
      variant="ghost"
      className="text-white/50 shrink-0"
      data-testid="button-copy-config"
      onClick={() => {
        navigator.clipboard.writeText(text);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      }}
    >
      {copied ? <CheckCircle2 className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
    </Button>
  );
}

const MCP_CONFIG = `{
  "mcpServers": {
    "safemessage": {
      "command": "npx",
      "args": [
        "-y", "mcp-remote",
        "https://agentsafe-api.fly.dev/mcp",
        "--header",
        "skyfire-pay-id: <YOUR_SKYFIRE_PAY_TOKEN>"
      ]
    }
  }
}`;

export default function Landing() {
  return (
    <div className="min-h-screen bg-background">
      <header className="bg-black/60 backdrop-blur-[10px] sticky top-0 z-[999]">
        <div className="container mx-auto px-6 h-16 flex items-center justify-between gap-4">
          <Link href="/">
            <div className="flex items-center gap-2.5 cursor-pointer">
              <img src={logoImg} alt="Agent Safe" className="h-6 w-6" />
              <span className="text-white font-medium text-lg" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>Agent Safe</span>
            </div>
          </Link>
          <div className="flex items-center gap-3 flex-wrap">
            <Link href="/docs">
              <Button variant="ghost" className="text-white/80" data-testid="link-docs-header">Docs</Button>
            </Link>
            <a href="https://skyfire.xyz" target="_blank" rel="noopener">
              <Button variant="outline" data-testid="link-skyfire-header">
                <ExternalLink className="h-4 w-4 mr-1.5" />
                Skyfire
              </Button>
            </a>
          </div>
        </div>
      </header>

      <section className="relative py-28 md:py-40 px-4 overflow-visible">
        <div className="absolute inset-0 pointer-events-none" style={{
          background: "radial-gradient(ellipse 60% 50% at 50% 30%, rgba(16, 106, 243, 0.08), transparent)"
        }} />
        <div className="container mx-auto max-w-4xl text-center relative z-10">
          <Badge variant="secondary" className="mb-8" data-testid="badge-mcp">
            Remote MCP Server
          </Badge>
          <h1 className="text-5xl md:text-7xl font-bold tracking-tight mb-8 leading-[1.1]" data-testid="text-hero-headline">
            Email Safety<br />for AI Agents
          </h1>
          <p className="text-xl md:text-2xl text-muted-foreground mb-10 max-w-2xl mx-auto leading-relaxed" data-testid="text-hero-subtitle">
            A Remote MCP Server that checks every email before your agent acts on it. Connect via MCP protocol, pay per use with Skyfire.
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center flex-wrap mb-16">
            <a href="#connect">
              <Button size="lg" className="text-lg px-8" data-testid="button-connect">
                <Terminal className="h-5 w-5 mr-2" />
                Connect Your Agent
              </Button>
            </a>
            <Link href="/docs">
              <Button size="lg" variant="outline" className="text-lg px-8" data-testid="link-docs">
                View Documentation
              </Button>
            </Link>
          </div>

          <div className="flex flex-wrap items-center justify-center gap-6">
            <Badge variant="outline" className="text-sm py-1.5 px-4" data-testid="badge-skyfire">
              <Shield className="h-3.5 w-3.5 mr-1.5" />
              Listed on Skyfire
            </Badge>
            <Badge variant="outline" className="text-sm py-1.5 px-4" data-testid="badge-protocol">
              <Bot className="h-3.5 w-3.5 mr-1.5" />
              MCP Protocol
            </Badge>
            <Badge variant="outline" className="text-sm py-1.5 px-4" data-testid="badge-price">
              <Zap className="h-3.5 w-3.5 mr-1.5" />
              $0.05 / check
            </Badge>
          </div>
        </div>
      </section>

      <section className="py-20 px-4 bg-card/50">
        <div className="container mx-auto max-w-4xl">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold tracking-tight mb-6" data-testid="text-problem-heading">
              Your AI Agent Is One Email Away From Being Compromised
            </h2>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto mb-8">
              Every day, AI agents process thousands of emails autonomously. A single malicious message can compromise your entire operation.
            </p>
          </div>

          <p className="text-muted-foreground leading-relaxed mb-10 max-w-3xl mx-auto text-center">
            Attackers craft emails that exploit an agent's tendency to follow instructions,
            tricking it into leaking data, making unauthorized payments, or executing harmful actions.
            Agent Safe is a remote MCP tool that any MCP-compatible agent can call to verify an email before acting on it.
          </p>

          <div className="grid sm:grid-cols-2 gap-6 max-w-2xl mx-auto">
            <div className="flex items-start gap-3">
              <CheckCircle2 className="h-5 w-5 text-primary shrink-0 mt-0.5" />
              <p className="text-sm text-muted-foreground">Detects phishing attempts targeting autonomous agents</p>
            </div>
            <div className="flex items-start gap-3">
              <CheckCircle2 className="h-5 w-5 text-primary shrink-0 mt-0.5" />
              <p className="text-sm text-muted-foreground">Blocks social engineering and prompt injection via email</p>
            </div>
            <div className="flex items-start gap-3">
              <CheckCircle2 className="h-5 w-5 text-primary shrink-0 mt-0.5" />
              <p className="text-sm text-muted-foreground">Prevents unauthorized data exfiltration through crafted messages</p>
            </div>
            <div className="flex items-start gap-3">
              <CheckCircle2 className="h-5 w-5 text-primary shrink-0 mt-0.5" />
              <p className="text-sm text-muted-foreground">No signup required - pay per use via Skyfire PAY tokens</p>
            </div>
          </div>
        </div>
      </section>

      <section id="connect" className="py-20 px-4">
        <div className="container mx-auto max-w-4xl">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold tracking-tight mb-4" data-testid="text-connect-heading">
              Connect in 30 Seconds
            </h2>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              Add Agent Safe to any MCP-compatible client. No signup, no API keys to manage.
            </p>
          </div>

          <Card className="max-w-2xl mx-auto mb-12">
            <CardHeader className="flex flex-row items-center justify-between gap-4 pb-3">
              <CardTitle className="text-base font-medium">MCP Client Configuration</CardTitle>
              <CopyButton text={MCP_CONFIG} />
            </CardHeader>
            <CardContent>
              <pre className="text-sm text-muted-foreground overflow-x-auto leading-relaxed" data-testid="code-mcp-config">
                <code>{MCP_CONFIG}</code>
              </pre>
            </CardContent>
          </Card>

          <div className="grid md:grid-cols-3 gap-6 max-w-3xl mx-auto">
            <div className="text-center">
              <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-3">
                <span className="text-primary font-bold text-sm">1</span>
              </div>
              <h3 className="font-semibold mb-1">Get a Skyfire Token</h3>
              <p className="text-sm text-muted-foreground">
                Create a buyer account at{" "}
                <a href="https://skyfire.xyz" target="_blank" rel="noopener" className="text-primary underline">skyfire.xyz</a>
                {" "}and fund your wallet
              </p>
            </div>
            <div className="text-center">
              <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-3">
                <span className="text-primary font-bold text-sm">2</span>
              </div>
              <h3 className="font-semibold mb-1">Add MCP Config</h3>
              <p className="text-sm text-muted-foreground">
                Paste the config above into your MCP client (Claude Desktop, Cursor, etc.)
              </p>
            </div>
            <div className="text-center">
              <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-3">
                <span className="text-primary font-bold text-sm">3</span>
              </div>
              <h3 className="font-semibold mb-1">Check Emails</h3>
              <p className="text-sm text-muted-foreground">
                Your agent can now call <code className="text-xs bg-muted px-1 py-0.5 rounded">check_email_safety</code> on any email
              </p>
            </div>
          </div>
        </div>
      </section>

      <section className="py-20 px-4 bg-card/50">
        <div className="container mx-auto max-w-6xl">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold tracking-tight mb-4" data-testid="text-features-heading">
              Built for Agents, Not Humans
            </h2>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              A purpose-built MCP tool that agents discover, connect to, and pay for autonomously
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            <Card className="hover-elevate" data-testid="card-feature-mcp">
              <CardHeader>
                <div className="w-12 h-12 rounded-md bg-primary/10 flex items-center justify-center mb-3">
                  <Bot className="h-6 w-6 text-primary" />
                </div>
                <CardTitle className="font-semibold text-lg">Remote MCP Server</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">
                  Standard MCP protocol (Streamable HTTP). Any MCP-compatible agent connects natively - no custom integration code.
                </p>
              </CardContent>
            </Card>

            <Card className="hover-elevate" data-testid="card-feature-skyfire">
              <CardHeader>
                <div className="w-12 h-12 rounded-md bg-primary/10 flex items-center justify-center mb-3">
                  <Shield className="h-6 w-6 text-primary" />
                </div>
                <CardTitle className="font-semibold text-lg">Skyfire Payments</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">
                  Pay-per-use via Skyfire KYAPay. Agents send a PAY token in the header - no signup, no API keys, no subscriptions.
                </p>
              </CardContent>
            </Card>

            <Card className="hover-elevate" data-testid="card-feature-ai">
              <CardHeader>
                <div className="w-12 h-12 rounded-md bg-primary/10 flex items-center justify-center mb-3">
                  <Zap className="h-6 w-6 text-primary" />
                </div>
                <CardTitle className="font-semibold text-lg">AI-Powered Analysis</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">
                  Claude-powered threat detection specialized for agent-targeted phishing, social engineering, and prompt injection.
                </p>
              </CardContent>
            </Card>

            <Card className="hover-elevate" data-testid="card-feature-secure">
              <CardHeader>
                <div className="w-12 h-12 rounded-md bg-primary/10 flex items-center justify-center mb-3">
                  <Lock className="h-6 w-6 text-primary" />
                </div>
                <CardTitle className="font-semibold text-lg">Charge-First Security</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">
                  Payment is validated and charged before analysis runs. No free rides, no unpaid usage, ever.
                </p>
              </CardContent>
            </Card>

            <Card className="hover-elevate" data-testid="card-feature-response">
              <CardHeader>
                <div className="w-12 h-12 rounded-md bg-primary/10 flex items-center justify-center mb-3">
                  <Terminal className="h-6 w-6 text-primary" />
                </div>
                <CardTitle className="font-semibold text-lg">Structured Verdicts</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">
                  Returns verdict, risk score, threats detected, safe/unsafe actions, and a plain-language explanation your agent can act on.
                </p>
              </CardContent>
            </Card>

            <Card className="hover-elevate" data-testid="card-feature-discovery">
              <CardHeader>
                <div className="w-12 h-12 rounded-md bg-primary/10 flex items-center justify-center mb-3">
                  <ExternalLink className="h-6 w-6 text-primary" />
                </div>
                <CardTitle className="font-semibold text-lg">Directory Listed</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">
                  Discoverable on Skyfire's open directory. Agents find and use Agent Safe without human involvement.
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      <section className="py-20 px-4">
        <div className="container mx-auto max-w-4xl">
          <h2 className="text-3xl md:text-4xl font-bold text-center tracking-tight mb-16" data-testid="text-pricing-heading">
            Simple, Transparent Pricing
          </h2>
          <Card className="max-w-md mx-auto">
            <CardHeader className="text-center pb-2">
              <CardTitle className="text-2xl mb-4">Pay Per Check</CardTitle>
              <div>
                <span className="text-5xl font-bold" data-testid="text-price">$0.05</span>
                <span className="text-muted-foreground ml-1">/check</span>
              </div>
            </CardHeader>
            <CardContent className="pt-6">
              <ul className="space-y-4">
                <li className="flex items-center gap-3">
                  <CheckCircle2 className="h-5 w-5 text-chart-4 shrink-0" />
                  <span className="text-sm">AI-powered email safety analysis</span>
                </li>
                <li className="flex items-center gap-3">
                  <CheckCircle2 className="h-5 w-5 text-chart-4 shrink-0" />
                  <span className="text-sm">No signup or API keys required</span>
                </li>
                <li className="flex items-center gap-3">
                  <CheckCircle2 className="h-5 w-5 text-chart-4 shrink-0" />
                  <span className="text-sm">Pay via Skyfire PAY tokens</span>
                </li>
                <li className="flex items-center gap-3">
                  <CheckCircle2 className="h-5 w-5 text-chart-4 shrink-0" />
                  <span className="text-sm">Detailed threat reports with actionable verdicts</span>
                </li>
                <li className="flex items-center gap-3">
                  <CheckCircle2 className="h-5 w-5 text-chart-4 shrink-0" />
                  <span className="text-sm">Standard MCP protocol - works with any agent</span>
                </li>
              </ul>
              <a href="https://skyfire.xyz" target="_blank" rel="noopener">
                <Button className="w-full mt-8" size="lg" data-testid="button-get-skyfire">
                  Get Skyfire Tokens
                </Button>
              </a>
            </CardContent>
          </Card>
        </div>
      </section>

      <section className="py-16 px-4 bg-card/50">
        <div className="container mx-auto max-w-4xl text-center">
          <h2 className="text-2xl md:text-3xl font-bold tracking-tight mb-4" data-testid="text-where-heading">
            Where to Find Us
          </h2>
          <p className="text-muted-foreground mb-10 max-w-xl mx-auto">
            Agent Safe is available on these platforms and directories
          </p>
          <div className="flex flex-wrap justify-center gap-6">
            <a href="https://skyfire.xyz" target="_blank" rel="noopener">
              <Card className="hover-elevate p-6 min-w-[200px]" data-testid="card-listing-skyfire">
                <div className="flex flex-col items-center gap-3">
                  <Shield className="h-8 w-8 text-primary" />
                  <span className="font-semibold">Skyfire Directory</span>
                  <span className="text-xs text-muted-foreground">Agent payment network</span>
                </div>
              </Card>
            </a>
            <Card className="p-6 min-w-[200px] opacity-60" data-testid="card-listing-mcp-registry">
              <div className="flex flex-col items-center gap-3">
                <Bot className="h-8 w-8 text-muted-foreground" />
                <span className="font-semibold text-muted-foreground">MCP Registry</span>
                <span className="text-xs text-muted-foreground">Coming soon</span>
              </div>
            </Card>
            <Card className="p-6 min-w-[200px] opacity-60" data-testid="card-listing-pulsemcp">
              <div className="flex flex-col items-center gap-3">
                <Terminal className="h-8 w-8 text-muted-foreground" />
                <span className="font-semibold text-muted-foreground">PulseMCP</span>
                <span className="text-xs text-muted-foreground">Coming soon</span>
              </div>
            </Card>
          </div>
        </div>
      </section>

      <footer className="relative py-16 px-6" style={{ background: "linear-gradient(180deg, #0a1628 0%, #030a14 100%)", borderTop: "1px solid rgba(16, 106, 243, 0.3)" }}>
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-4/5 h-px" style={{ background: "linear-gradient(90deg, transparent 0%, rgba(16, 106, 243, 0.6) 50%, transparent 100%)" }} />
        <div className="container mx-auto max-w-6xl">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-12 mb-12">
            <div>
              <Link href="/">
                <div className="flex items-center gap-2.5 mb-4 cursor-pointer">
                  <img src={logoImg} alt="Agent Safe" className="h-5 w-5" />
                  <span className="text-white font-semibold text-lg" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>Agent Safe</span>
                </div>
              </Link>
              <p className="text-white/80 text-sm leading-relaxed max-w-xs" data-testid="text-footer-tagline">
                A Remote MCP Server that protects AI agents from phishing, social engineering, and manipulation via email.
              </p>
            </div>
            <div>
              <h4 className="text-white font-semibold text-sm uppercase tracking-wider mb-4">MCP SERVER</h4>
              <ul className="space-y-2">
                <li><Link href="/docs" className="text-white/60 text-sm transition-colors duration-150" data-testid="link-footer-docs">Documentation</Link></li>
                <li><a href="https://agentsafe-api.fly.dev/mcp" target="_blank" rel="noopener" className="text-white/60 text-sm transition-colors duration-150" data-testid="link-footer-endpoint">MCP Endpoint</a></li>
                <li><a href="https://skyfire.xyz" target="_blank" rel="noopener" className="text-white/60 text-sm transition-colors duration-150" data-testid="link-footer-skyfire">Skyfire Network</a></li>
              </ul>
            </div>
            <div>
              <h4 className="text-white font-semibold text-sm uppercase tracking-wider mb-4">COMPANY</h4>
              <ul className="space-y-2">
                <li><a href="https://locationledger.com" target="_blank" rel="noopener" className="text-white/60 text-sm transition-colors duration-150" data-testid="link-footer-parent">Location Ledger</a></li>
                <li><a href="https://support.locationledger.com" target="_blank" rel="noopener" className="text-white/60 text-sm transition-colors duration-150" data-testid="link-footer-support">Support</a></li>
                <li><Link href="/terms" className="text-white/60 text-sm transition-colors duration-150" data-testid="link-footer-terms">Terms of Service</Link></li>
              </ul>
            </div>
          </div>
          <div className="pt-8 flex flex-wrap items-center justify-between gap-4" style={{ borderTop: "1px solid #232323" }}>
            <p className="text-white/50 text-sm" data-testid="text-copyright">Part of the Anti-Deepfake/Agent Abuse protection suite</p>
            <p className="text-white/40 text-xs">ALIBI LEDGER, LLC</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
