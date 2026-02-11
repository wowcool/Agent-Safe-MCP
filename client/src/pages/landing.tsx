import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Bot, Shield, Zap, Lock, Terminal, CheckCircle2, Copy, ExternalLink, Mail, Link as LinkIcon, Reply, MessageSquare, Paperclip, UserCheck, ArrowRight, Smartphone } from "lucide-react";
import { useState } from "react";
import { useSEO } from "@/lib/seo";
import { GlobalFooter } from "@/components/global-footer";
import { SiteHeader } from "@/components/site-header";
import toolEmailImg from "@/assets/images/tool-email-safety.png";
import toolUrlImg from "@/assets/images/tool-url-safety.png";
import toolResponseImg from "@/assets/images/tool-response-safety.png";
import toolThreadImg from "@/assets/images/tool-thread-analysis.png";
import toolAttachmentImg from "@/assets/images/tool-attachment-safety.png";
import toolSenderImg from "@/assets/images/tool-sender-reputation.png";
import toolMessageImg from "@/assets/images/tool-message-safety.png";
import whatItTestsForImg from "@/assets/images/what-it-tests-for.png";

function CopyButton({ text }: { text: string }) {
  const [copied, setCopied] = useState(false);
  return (
    <Button
      size="icon"
      variant="ghost"
      className="text-muted-foreground shrink-0"
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
        "skyfire-api-key: <YOUR_SKYFIRE_BUYER_API_KEY>"
      ]
    }
  }
}

// Your agent uses the Buyer API Key to auto-generate
// PAY tokens for each request. Get your key at skyfire.xyz`;

export default function Landing() {
  useSEO({
    title: "Agent Safe - Secure Every Message Your Agent Touches | 7-Tool MCP Security Suite",
    description: "Protect your AI agent on every platform — email, SMS, WhatsApp, Slack, Discord, Telegram, Instagram DMs, and more. Agent Safe is a 7-tool MCP security suite that detects phishing, BEC, smishing, and manipulation across any message. $0.02 per check via Skyfire.",
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
            Secure Every Message<br />Your Agent Touches
          </h1>
          <p className="text-xl md:text-2xl text-muted-foreground mb-4 max-w-2xl mx-auto leading-relaxed" data-testid="text-hero-subtitle">
            Email. SMS. WhatsApp. Slack. Discord. DMs. Any platform, any message.
          </p>
          <p className="text-lg text-muted-foreground mb-6 max-w-2xl mx-auto leading-relaxed">
            Your AI agent processes messages across every platform — but should it trust them? Agent Safe is a <a href="#tools" className="text-primary font-bold hover:underline"><strong>7-tool MCP security suite</strong></a> that protects against phishing, BEC, malware, and manipulation on <strong>any messaging platform</strong> your agent operates on.
          </p>
          <div className="flex flex-wrap justify-center gap-2 mb-10">
            <Badge variant="outline" className="text-xs py-1 px-3" data-testid="badge-platform-email"><Mail className="h-3 w-3 mr-1" /> Email</Badge>
            <Badge variant="outline" className="text-xs py-1 px-3" data-testid="badge-platform-sms"><Smartphone className="h-3 w-3 mr-1" /> SMS</Badge>
            <Badge variant="outline" className="text-xs py-1 px-3" data-testid="badge-platform-whatsapp"><MessageSquare className="h-3 w-3 mr-1" /> WhatsApp</Badge>
            <Badge variant="outline" className="text-xs py-1 px-3" data-testid="badge-platform-slack"><MessageSquare className="h-3 w-3 mr-1" /> Slack</Badge>
            <Badge variant="outline" className="text-xs py-1 px-3" data-testid="badge-platform-discord"><MessageSquare className="h-3 w-3 mr-1" /> Discord</Badge>
            <Badge variant="outline" className="text-xs py-1 px-3" data-testid="badge-platform-telegram"><MessageSquare className="h-3 w-3 mr-1" /> Telegram</Badge>
            <Badge variant="outline" className="text-xs py-1 px-3" data-testid="badge-platform-instagram"><MessageSquare className="h-3 w-3 mr-1" /> Instagram</Badge>
            <Badge variant="outline" className="text-xs py-1 px-3" data-testid="badge-platform-imessage"><Smartphone className="h-3 w-3 mr-1" /> iMessage</Badge>
            <Badge variant="outline" className="text-xs py-1 px-3" data-testid="badge-platform-more">+ More</Badge>
          </div>

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
                <strong>7 Tools</strong>
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
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold tracking-tight mb-6" data-testid="text-problem-heading">
              Threats Come From Every Platform
            </h2>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto mb-8">
              Your AI agent handles messages across email, SMS, WhatsApp, Slack, Discord, and more. Attackers know this — and they target every channel.
            </p>
          </div>

          <p className="text-muted-foreground leading-relaxed mb-10 max-w-3xl mx-auto text-center">
            Smishing via SMS. Wrong-number scams on WhatsApp. Fake brand DMs on Instagram. Impersonation in Slack. Phishing emails. Attackers craft platform-specific attacks designed to exploit an agent's tendency to follow instructions, tricking it into leaking data, making unauthorized payments, or executing harmful actions.
            Agent Safe gives your agent <a href="#tools" className="text-primary font-bold hover:underline">7 security tools</a> to verify <strong>any message on any platform</strong> before acting — from emails to texts to DMs to chat messages.
          </p>

          <div className="grid sm:grid-cols-2 gap-6 max-w-2xl mx-auto">
            <div className="flex items-start gap-3">
              <CheckCircle2 className="h-5 w-5 text-primary shrink-0 mt-0.5" />
              <p className="text-sm text-muted-foreground"><strong>Any platform:</strong> Email, SMS, WhatsApp, Slack, Discord, Telegram, Instagram DMs, iMessage, Signal, LinkedIn, and more</p>
            </div>
            <div className="flex items-start gap-3">
              <CheckCircle2 className="h-5 w-5 text-primary shrink-0 mt-0.5" />
              <p className="text-sm text-muted-foreground"><strong>Platform-aware:</strong> Detects platform-specific threats like smishing, OTP interception, and wrong-number crypto scams</p>
            </div>
            <div className="flex items-start gap-3">
              <CheckCircle2 className="h-5 w-5 text-primary shrink-0 mt-0.5" />
              <p className="text-sm text-muted-foreground"><strong>Full coverage:</strong> Messages, URLs, replies, threads, attachments, and sender identity — all verified</p>
            </div>
            <div className="flex items-start gap-3">
              <CheckCircle2 className="h-5 w-5 text-primary shrink-0 mt-0.5" />
              <p className="text-sm text-muted-foreground"><strong>No signup:</strong> Connect via MCP, pay $0.02 per check with your Skyfire Buyer API Key</p>
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
                  No custom code. No messy integration. Your agent discovers Agent Safe, connects using the MCP protocol, and can immediately start calling any of the <a href="#tools" className="text-primary font-bold hover:underline">7 security tools</a>. It works with Cursor, Windsurf, and any other MCP-compatible client.
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
              <h3 className="font-semibold mb-1">Get a Skyfire Buyer API Key</h3>
              <p className="text-sm text-muted-foreground">
                Create a buyer account at{" "}
                <a href="https://skyfire.xyz" target="_blank" rel="noopener" className="text-primary underline">skyfire.xyz</a>
                {" "}and get your API key
              </p>
            </div>
            <div className="text-center">
              <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-3">
                <span className="text-primary font-bold text-sm">2</span>
              </div>
              <h3 className="font-semibold mb-1">Add MCP Config</h3>
              <p className="text-sm text-muted-foreground">
                Paste the config above into your MCP client (Cursor, Windsurf, etc.)
              </p>
            </div>
            <div className="text-center">
              <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-3">
                <span className="text-primary font-bold text-sm">3</span>
              </div>
              <h3 className="font-semibold mb-1">Secure Everything</h3>
              <p className="text-sm text-muted-foreground">
                Your agent can now call any of <strong>7 message security tools</strong> to protect against threats
              </p>
            </div>
          </div>
        </div>
      </section>

      <section id="tools" className="py-20 px-4">
        <div className="container mx-auto max-w-6xl">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold tracking-tight mb-4" data-testid="text-features-heading">
              <strong>7 Tools.</strong> Complete Message Security.
            </h2>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              A purpose-built MCP tool suite that agents discover, connect to, and pay for autonomously
            </p>
          </div>

          <a href="/how-it-works#tool-check_message_safety" className="block mb-8" data-testid="link-tool-check-message-featured">
            <Card className="hover-elevate cursor-pointer border-primary/20 bg-primary/[0.03]" data-testid="card-feature-check-message-featured">
              <CardContent className="pt-6">
                <div className="flex flex-col md:flex-row items-start gap-6">
                  <img src={toolMessageImg} alt="Message safety analysis across platforms" className="w-20 h-20 object-contain rounded-md shrink-0" data-testid="img-card-check-message-featured" />
                  <div className="flex-1">
                    <div className="flex flex-wrap items-center gap-3 mb-2">
                      <span className="text-lg font-bold">check_message_safety</span>
                      <Badge variant="secondary" className="text-xs">NEW</Badge>
                    </div>
                    <p className="text-muted-foreground mb-3">
                      Purpose-built for non-email platforms. Analyzes messages from <strong>SMS, WhatsApp, Instagram DMs, Facebook Messenger, Telegram, Discord, Slack, LinkedIn, iMessage, Signal</strong>, and any other messaging platform your agent operates on. Detects smishing, wrong-number scams, OTP interception, impersonation, payment fraud, romance scams, and more with platform-specific threat intelligence.
                    </p>
                    <span className="text-sm text-primary flex items-center gap-1 font-medium">
                      See how it works <ArrowRight className="h-4 w-4" />
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </a>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            <a href="/how-it-works#tool-check_email_safety" data-testid="link-tool-check-email">
              <Card className="hover-elevate h-full cursor-pointer" data-testid="card-feature-check-email">
                <CardHeader>
                  <img src={toolEmailImg} alt="Email safety analysis" className="w-16 h-16 object-contain rounded-md mb-3" data-testid="img-card-check-email" />
                  <CardTitle className="font-semibold text-lg">check_email_safety</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground mb-3">
                    Analyze emails for phishing, social engineering, prompt injection, CEO fraud, and BEC attacks
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
                    Analyze full message threads for escalating social engineering and manipulation
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

      <section className="py-16 px-4">
        <div className="container mx-auto max-w-4xl">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold tracking-tight mb-4" data-testid="text-platforms-heading">
              Every Platform Your Agent Touches
            </h2>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto mb-8">
              Wherever your agent receives messages, Agent Safe can protect it
            </p>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4 max-w-3xl mx-auto">
            {[
              { name: "Email", desc: "Phishing, BEC, prompt injection" },
              { name: "SMS / iMessage", desc: "Smishing, fake alerts, OTP theft" },
              { name: "WhatsApp", desc: "Wrong-number scams, payment fraud" },
              { name: "Slack", desc: "Impersonation, credential harvesting" },
              { name: "Discord", desc: "Malicious links, tech support scams" },
              { name: "Telegram", desc: "Crypto scams, OTP interception" },
              { name: "Instagram DMs", desc: "Brand impersonation, romance scams" },
              { name: "Facebook Messenger", desc: "Account takeover, phishing links" },
              { name: "LinkedIn", desc: "Recruiter scams, data harvesting" },
              { name: "Signal", desc: "Social engineering, identity fraud" },
              { name: "Microsoft Teams", desc: "Corporate impersonation, BEC" },
              { name: "Any Platform", desc: "Custom platform support via 'other'" },
            ].map((p) => (
              <Card key={p.name} className="text-center" data-testid={`card-platform-${p.name.toLowerCase().replace(/[^a-z]/g, "-")}`}>
                <CardContent className="pt-4 pb-4">
                  <p className="text-sm font-semibold mb-1">{p.name}</p>
                  <p className="text-xs text-muted-foreground">{p.desc}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      <section className="py-20 px-4 bg-card/50">
        <div className="container mx-auto max-w-5xl">
          <div className="grid md:grid-cols-2 gap-10 items-center">
            <div>
              <img src={whatItTestsForImg} alt="Agent Safe threat protection visualization" className="w-full rounded-md" data-testid="img-what-it-tests-for" />
            </div>
            <div>
              <h2 className="text-3xl font-bold tracking-tight mb-4" data-testid="text-tests-for-heading">
                What It Tests For
              </h2>
              <p className="text-muted-foreground mb-6">
                All 7 tools run every security check automatically on every call. No flags, no configuration. Here is what they catch across your messages.
              </p>
              <div className="space-y-3">
                {[
                  { tool: "check_email_safety", desc: "Phishing, prompt injection, CEO fraud, social engineering, financial fraud, data exfiltration", count: "8 categories" },
                  { tool: "check_message_safety", desc: "Platform-aware threats for SMS, WhatsApp, Slack, Discord, Telegram, and more", count: "8 categories", isNew: true },
                  { tool: "check_url_safety", desc: "Phishing URLs, typosquatting, malware links, redirect abuse, tracking", count: "7 categories" },
                  { tool: "check_response_safety", desc: "Data leakage, PII exposure, compliance violations in draft replies", count: "5 categories" },
                  { tool: "analyze_email_thread", desc: "Escalating manipulation, scope creep, deadline manufacturing across threads", count: "5 categories" },
                  { tool: "check_attachment_safety", desc: "Executable masquerades, double extensions, macro risks, MIME mismatches", count: "6 categories" },
                  { tool: "check_sender_reputation", desc: "Domain spoofing, BEC indicators, DMARC + domain age via live DNS", count: "6 categories" },
                ].map((item) => (
                  <div key={item.tool} className="flex items-start gap-3">
                    <CheckCircle2 className="h-4 w-4 text-chart-4 shrink-0 mt-0.5" />
                    <div className="min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-sm font-semibold">{item.tool}</span>
                        <Badge variant="secondary" className="text-[10px]">{item.count}</Badge>
                        {item.isNew && <Badge className="text-[10px]">NEW</Badge>}
                      </div>
                      <p className="text-xs text-muted-foreground mt-0.5">{item.desc}</p>
                    </div>
                  </div>
                ))}
              </div>
              <Link href="/how-it-works#what-it-tests-for">
                <Button variant="outline" className="mt-6" data-testid="button-see-full-threats">
                  See full threat breakdown <ArrowRight className="h-4 w-4 ml-2" />
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </section>

      <section className="py-20 px-4">
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
                    <span className="text-sm"><strong>7 message security tools</strong> included</span>
                  </li>
                  <li className="flex items-center gap-3">
                    <CheckCircle2 className="h-5 w-5 text-chart-4 shrink-0" />
                    <span className="text-sm">No signup with Agent Safe required</span>
                  </li>
                  <li className="flex items-center gap-3">
                    <CheckCircle2 className="h-5 w-5 text-chart-4 shrink-0" />
                    <span className="text-sm">Pay via Skyfire Buyer API Key</span>
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
                    Get a Skyfire Buyer API Key
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
                  <p className="text-sm font-semibold" data-testid="text-why-heading">Why 4,000 tokens covers most messages</p>
                  <p className="text-xs text-muted-foreground leading-relaxed">
                    The average business message is <strong>75-100 words</strong>. Even a long, detailed message with signatures, disclaimers, and forwarded content rarely exceeds 500 words. At 3,000 words per unit, a single $0.02 unit can analyze a message that is <strong>30-40x longer than a typical one</strong>.
                  </p>
                  <p className="text-xs text-muted-foreground leading-relaxed">
                    In practice, almost every tool call costs exactly <strong>one unit ($0.02)</strong>. The only exception is unusually long threads submitted to <strong>analyze_email_thread</strong>, where a conversation with many messages might require 2-3 units.
                  </p>
                </div>
                <div className="space-y-2 pt-2">
                  <p className="text-xs font-semibold text-muted-foreground">Typical costs:</p>
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-xs text-muted-foreground">Single message check</span>
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
                    <span className="text-xs text-muted-foreground">Message safety (any platform)</span>
                    <Badge variant="secondary" className="text-xs" data-testid="badge-cost-message">1 unit - $0.02</Badge>
                  </div>
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-xs text-muted-foreground">Short thread (3-5 messages)</span>
                    <Badge variant="secondary" className="text-xs" data-testid="badge-cost-thread-short">1 unit - $0.02</Badge>
                  </div>
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-xs text-muted-foreground">Long thread (20+ messages)</span>
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
            <a href="https://smithery.ai/server/agent-safe-email/agentsafeemail" target="_blank" rel="noopener" data-testid="link-listing-smithery">
              <Card className="hover-elevate p-6 min-w-[200px]" data-testid="card-listing-smithery">
                <div className="flex flex-col items-center gap-3">
                  <Terminal className="h-8 w-8 text-primary" />
                  <span className="font-semibold">Smithery</span>
                  <span className="text-xs text-muted-foreground">MCP server registry</span>
                </div>
              </Card>
            </a>
            <a href="https://registry.modelcontextprotocol.io/v0.1/servers/io.github.wowcool%2Fagentsafe/versions/1.0.0" target="_blank" rel="noopener" data-testid="link-listing-mcp-registry">
              <Card className="hover-elevate p-6 min-w-[200px]" data-testid="card-listing-mcp-registry">
                <div className="flex flex-col items-center gap-3">
                  <Bot className="h-8 w-8 text-primary" />
                  <span className="font-semibold">Official MCP Registry</span>
                  <span className="text-xs text-muted-foreground">Model Context Protocol</span>
                </div>
              </Card>
            </a>
          </div>
        </div>
      </section>

      <GlobalFooter />
    </div>
  );
}
