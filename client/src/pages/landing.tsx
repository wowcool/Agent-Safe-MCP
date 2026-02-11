import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Bot, Shield, Zap, Lock, Terminal, CheckCircle2, Copy, ExternalLink, Mail, Link as LinkIcon, Reply, MessageSquare, Paperclip, UserCheck, ArrowRight } from "lucide-react";
import { useState } from "react";
import { useSEO } from "@/lib/seo";
import { GlobalFooter } from "@/components/global-footer";
import { SiteHeader } from "@/components/site-header";
import heroImage from "@assets/Screenshot_2026-02-11_at_11.44.30_1770828281471.png";
import toolEmailImg from "@/assets/images/tool-email-safety.png";
import toolUrlImg from "@/assets/images/tool-url-safety.png";
import toolResponseImg from "@/assets/images/tool-response-safety.png";
import toolThreadImg from "@/assets/images/tool-thread-analysis.png";
import toolAttachmentImg from "@/assets/images/tool-attachment-safety.png";
import toolSenderImg from "@/assets/images/tool-sender-reputation.png";

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
}`;

export default function Landing() {
  useSEO({
    title: "Agent Safe - Protect Your AI from Email Scams | 6-Tool Security Suite",
    description: "Your AI reads emails — but should it trust them? Agent Safe is a 6-tool MCP security suite that protects AI agents from phishing, BEC, malware, and manipulation. $0.02 per tool call via Skyfire.",
    path: "/",
  });
  return (
    <div className="min-h-screen bg-background">
      <SiteHeader />

      <section className="relative py-28 md:py-40 px-4 overflow-visible">
        <div className="absolute inset-0 pointer-events-none" style={{
          background: "radial-gradient(ellipse 60% 50% at 50% 30%, rgba(16, 106, 243, 0.08), transparent)"
        }} />
        <div className="container mx-auto max-w-4xl text-center relative z-10">
          <Badge variant="secondary" className="mb-8" data-testid="badge-mcp">
            Remote MCP Server
          </Badge>
          <h1 className="text-5xl md:text-7xl font-bold tracking-tight mb-8 leading-[1.1]" data-testid="text-hero-headline">
            Protect Your AI<br />from Email Scams
          </h1>
          <p className="text-xl md:text-2xl text-muted-foreground mb-4 max-w-2xl mx-auto leading-relaxed" data-testid="text-hero-subtitle">
            Your AI reads emails. But should it trust them?
          </p>
          <p className="text-lg text-muted-foreground mb-10 max-w-2xl mx-auto leading-relaxed">
            <a href="#tools" className="text-primary font-bold hover:underline"><strong>6 tools</strong></a> that protect your AI agent from phishing, BEC, malware, and manipulation across emails, URLs, replies, threads, attachments, and sender identities. Connect via MCP, pay per use with Skyfire.
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
            <a href="#tools">
              <Badge variant="outline" className="text-sm py-1.5 px-4 cursor-pointer" data-testid="badge-tools">
                <Shield className="h-3.5 w-3.5 mr-1.5" />
                <strong>6 Tools</strong>
              </Badge>
            </a>
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
              $0.02 / tool call
            </Badge>
          </div>
        </div>
      </section>

      <section className="py-20 px-4 bg-card/50">
        <div className="container mx-auto max-w-4xl">
          <div className="flex justify-center mb-10">
            <img
              src={heroImage}
              alt="AI robot with shield protecting against malicious emails"
              className="w-64 h-64 md:w-80 md:h-80 object-contain"
              data-testid="img-hero-robot"
            />
          </div>

          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold tracking-tight mb-6" data-testid="text-problem-heading">
              Your AI Agent Is One Email Away From Being Compromised
            </h2>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto mb-8">
              Every day, AI agents process thousands of emails, URLs, attachments, and threads autonomously. A single malicious message, link, or file can compromise your entire operation.
            </p>
          </div>

          <p className="text-muted-foreground leading-relaxed mb-10 max-w-3xl mx-auto text-center">
            Attackers craft emails, embed malicious URLs, poison reply threads, and disguise dangerous attachments to exploit an agent's tendency to follow instructions,
            tricking it into leaking data, making unauthorized payments, or executing harmful actions.
            Agent Safe is a suite of <a href="#tools" className="text-primary font-bold hover:underline">6 tools</a> that any MCP-compatible agent can call to verify emails, URLs, replies, threads, attachments, and sender identities before acting.
          </p>

          <div className="grid sm:grid-cols-2 gap-6 max-w-2xl mx-auto">
            <div className="flex items-start gap-3">
              <CheckCircle2 className="h-5 w-5 text-primary shrink-0 mt-0.5" />
              <p className="text-sm text-muted-foreground">Detects phishing, BEC, and social engineering across emails and threads</p>
            </div>
            <div className="flex items-start gap-3">
              <CheckCircle2 className="h-5 w-5 text-primary shrink-0 mt-0.5" />
              <p className="text-sm text-muted-foreground">Scans URLs for malware, redirects, and domain spoofing</p>
            </div>
            <div className="flex items-start gap-3">
              <CheckCircle2 className="h-5 w-5 text-primary shrink-0 mt-0.5" />
              <p className="text-sm text-muted-foreground">Checks draft replies for data leakage and verifies sender reputation with live DNS</p>
            </div>
            <div className="flex items-start gap-3">
              <CheckCircle2 className="h-5 w-5 text-primary shrink-0 mt-0.5" />
              <p className="text-sm text-muted-foreground">No signup required - pay per use via Skyfire PAY tokens</p>
            </div>
          </div>
        </div>
      </section>

      <section className="py-20 px-4">
        <div className="container mx-auto max-w-4xl">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold tracking-tight mb-4" data-testid="text-mcp-heading">
              What Is MCP?
            </h2>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto mb-8">
              A standard way for AI systems to talk to tools
            </p>
          </div>

          <Card className="max-w-3xl mx-auto">
            <CardContent className="pt-6">
              <div className="space-y-4">
                <p className="text-muted-foreground leading-relaxed">
                  MCP (Model Context Protocol) is a standard connection method that lets your AI agent plug into external services. Think of it like a USB port for AI — a structured, agreed-upon way for AI systems to talk to tools.
                </p>
                <p className="text-muted-foreground leading-relaxed">
                  No custom code. No messy integration. Your agent discovers Agent Safe, connects using the MCP protocol, and can immediately start calling any of the <a href="#tools" className="text-primary font-bold hover:underline">6 security tools</a>. It works with Claude Desktop, Cursor, and any other MCP-compatible client.
                </p>
                <div className="grid sm:grid-cols-3 gap-4 pt-4">
                  <div className="flex items-start gap-3">
                    <Bot className="h-5 w-5 text-primary shrink-0 mt-0.5" />
                    <div>
                      <p className="text-sm font-semibold">Standard Protocol</p>
                      <p className="text-xs text-muted-foreground">Works with any MCP-compatible AI agent</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <Zap className="h-5 w-5 text-primary shrink-0 mt-0.5" />
                    <div>
                      <p className="text-sm font-semibold">No Custom Code</p>
                      <p className="text-xs text-muted-foreground">Just paste the config and go</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <Lock className="h-5 w-5 text-primary shrink-0 mt-0.5" />
                    <div>
                      <p className="text-sm font-semibold">Secure by Design</p>
                      <p className="text-xs text-muted-foreground">Payment and auth built into the protocol</p>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </section>

      <section id="connect" className="py-20 px-4 bg-card/50">
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
              <h3 className="font-semibold mb-1">Secure Everything</h3>
              <p className="text-sm text-muted-foreground">
                Your agent can now call any of <strong>6 email security tools</strong> to protect against threats
              </p>
            </div>
          </div>
        </div>
      </section>

      <section id="tools" className="py-20 px-4">
        <div className="container mx-auto max-w-6xl">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold tracking-tight mb-4" data-testid="text-features-heading">
              <strong>6 Tools.</strong> Complete Email Security.
            </h2>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              A purpose-built MCP tool suite that agents discover, connect to, and pay for autonomously
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            <a href="/how-it-works#tool-check_email_safety" data-testid="link-tool-check-email">
              <Card className="hover-elevate h-full cursor-pointer" data-testid="card-feature-check-email">
                <CardHeader>
                  <img src={toolEmailImg} alt="Email safety analysis" className="w-16 h-16 object-contain rounded-md mb-3" data-testid="img-card-check-email" />
                  <CardTitle className="font-semibold text-lg">check_email_safety</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground mb-3">
                    Analyze emails for phishing, social engineering, prompt injection, CEO fraud, and data exfiltration
                  </p>
                  <span className="text-xs text-primary flex items-center gap-1">
                    Learn more <ArrowRight className="h-3 w-3" />
                  </span>
                </CardContent>
              </Card>
            </a>

            <a href="/how-it-works#tool-check_url_safety" data-testid="link-tool-check-url">
              <Card className="hover-elevate h-full cursor-pointer" data-testid="card-feature-check-url">
                <CardHeader>
                  <img src={toolUrlImg} alt="URL safety scanning" className="w-16 h-16 object-contain rounded-md mb-3" data-testid="img-card-check-url" />
                  <CardTitle className="font-semibold text-lg">check_url_safety</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground mb-3">
                    Analyze URLs for phishing, malware, redirects, spoofing, and tracking
                  </p>
                  <span className="text-xs text-primary flex items-center gap-1">
                    Learn more <ArrowRight className="h-3 w-3" />
                  </span>
                </CardContent>
              </Card>
            </a>

            <a href="/how-it-works#tool-check_response_safety" data-testid="link-tool-check-response">
              <Card className="hover-elevate h-full cursor-pointer" data-testid="card-feature-check-response">
                <CardHeader>
                  <img src={toolResponseImg} alt="Response safety checking" className="w-16 h-16 object-contain rounded-md mb-3" data-testid="img-card-check-response" />
                  <CardTitle className="font-semibold text-lg">check_response_safety</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground mb-3">
                    Check draft replies BEFORE sending for data leakage and unauthorized disclosure
                  </p>
                  <span className="text-xs text-primary flex items-center gap-1">
                    Learn more <ArrowRight className="h-3 w-3" />
                  </span>
                </CardContent>
              </Card>
            </a>

            <a href="/how-it-works#tool-analyze_email_thread" data-testid="link-tool-analyze-thread">
              <Card className="hover-elevate h-full cursor-pointer" data-testid="card-feature-analyze-thread">
                <CardHeader>
                  <img src={toolThreadImg} alt="Thread analysis visualization" className="w-16 h-16 object-contain rounded-md mb-3" data-testid="img-card-analyze-thread" />
                  <CardTitle className="font-semibold text-lg">analyze_email_thread</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground mb-3">
                    Analyze full email threads for escalating social engineering and manipulation
                  </p>
                  <span className="text-xs text-primary flex items-center gap-1">
                    Learn more <ArrowRight className="h-3 w-3" />
                  </span>
                </CardContent>
              </Card>
            </a>

            <a href="/how-it-works#tool-check_attachment_safety" data-testid="link-tool-check-attachment">
              <Card className="hover-elevate h-full cursor-pointer" data-testid="card-feature-check-attachment">
                <CardHeader>
                  <img src={toolAttachmentImg} alt="Attachment safety scanning" className="w-16 h-16 object-contain rounded-md mb-3" data-testid="img-card-check-attachment" />
                  <CardTitle className="font-semibold text-lg">check_attachment_safety</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground mb-3">
                    Assess attachments for malware risk based on filename, MIME type, and size
                  </p>
                  <span className="text-xs text-primary flex items-center gap-1">
                    Learn more <ArrowRight className="h-3 w-3" />
                  </span>
                </CardContent>
              </Card>
            </a>

            <a href="/how-it-works#tool-check_sender_reputation" data-testid="link-tool-check-sender">
              <Card className="hover-elevate h-full cursor-pointer" data-testid="card-feature-check-sender">
                <CardHeader>
                  <img src={toolSenderImg} alt="Sender reputation verification" className="w-16 h-16 object-contain rounded-md mb-3" data-testid="img-card-check-sender" />
                  <CardTitle className="font-semibold text-lg">check_sender_reputation</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground mb-3">
                    Verify sender identity with live DNS DMARC and RDAP domain age checks
                  </p>
                  <span className="text-xs text-primary flex items-center gap-1">
                    Learn more <ArrowRight className="h-3 w-3" />
                  </span>
                </CardContent>
              </Card>
            </a>
          </div>
        </div>
      </section>

      <section className="py-20 px-4 bg-card/50">
        <div className="container mx-auto max-w-4xl">
          <h2 className="text-3xl md:text-4xl font-bold text-center tracking-tight mb-4" data-testid="text-pricing-heading">
            Simple, Transparent Pricing
          </h2>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto text-center mb-16">
            One price. No surprises. Every tool call costs the same.
          </p>

          <div className="grid md:grid-cols-2 gap-8 max-w-3xl mx-auto">
            <Card>
              <CardHeader className="text-center pb-2">
                <CardTitle className="text-2xl mb-4">Pay Per Unit</CardTitle>
                <div>
                  <span className="text-5xl font-bold" data-testid="text-price">$0.02</span>
                  <span className="text-muted-foreground ml-1">/ unit</span>
                </div>
              </CardHeader>
              <CardContent className="pt-6">
                <ul className="space-y-4">
                  <li className="flex items-center gap-3">
                    <CheckCircle2 className="h-5 w-5 text-chart-4 shrink-0" />
                    <span className="text-sm"><strong>6 email security tools</strong> included</span>
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
                    <span className="text-sm">Live DNS/RDAP enrichment included</span>
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

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-lg mb-2" data-testid="text-unit-heading">What Is a Unit?</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-sm text-muted-foreground leading-relaxed">
                  1 unit = up to <strong>4,000 tokens</strong> of input, which is roughly <strong>3,000 words</strong>. Each unit costs $0.02.
                </p>
                <div className="bg-muted/50 rounded-md p-4 space-y-3">
                  <p className="text-sm font-semibold" data-testid="text-why-heading">Why 4,000 tokens covers most emails</p>
                  <p className="text-xs text-muted-foreground leading-relaxed">
                    The average business email is <strong>75-100 words</strong>. Even a long, detailed email with signatures, disclaimers, and forwarded content rarely exceeds 500 words. At 3,000 words per unit, a single $0.02 unit can analyze an email that is <strong>30-40x longer than a typical one</strong>.
                  </p>
                  <p className="text-xs text-muted-foreground leading-relaxed">
                    In practice, almost every tool call costs exactly <strong>one unit ($0.02)</strong>. The only exception is unusually long email threads submitted to <strong>analyze_email_thread</strong>, where a conversation with many messages might require 2-3 units.
                  </p>
                </div>
                <div className="space-y-2 pt-2">
                  <p className="text-xs font-semibold text-muted-foreground">Typical costs:</p>
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-xs text-muted-foreground">Single email check</span>
                    <Badge variant="secondary" className="text-xs" data-testid="badge-cost-email">1 unit - $0.02</Badge>
                  </div>
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-xs text-muted-foreground">URL scan (up to 20 URLs)</span>
                    <Badge variant="secondary" className="text-xs" data-testid="badge-cost-url">1 unit - $0.02</Badge>
                  </div>
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-xs text-muted-foreground">Draft reply check</span>
                    <Badge variant="secondary" className="text-xs" data-testid="badge-cost-response">1 unit - $0.02</Badge>
                  </div>
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-xs text-muted-foreground">Attachment scan</span>
                    <Badge variant="secondary" className="text-xs" data-testid="badge-cost-attachment">1 unit - $0.02</Badge>
                  </div>
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-xs text-muted-foreground">Sender reputation</span>
                    <Badge variant="secondary" className="text-xs" data-testid="badge-cost-sender">1 unit - $0.02</Badge>
                  </div>
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-xs text-muted-foreground">Short thread (3-5 emails)</span>
                    <Badge variant="secondary" className="text-xs" data-testid="badge-cost-thread-short">1 unit - $0.02</Badge>
                  </div>
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-xs text-muted-foreground">Long thread (20+ emails)</span>
                    <Badge variant="secondary" className="text-xs" data-testid="badge-cost-thread-long">2-3 units - $0.04-0.06</Badge>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      <section className="py-16 px-4">
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

      <GlobalFooter />
    </div>
  );
}
