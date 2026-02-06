import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useQuery } from "@tanstack/react-query";
import { Shield, Bot, CreditCard, Zap, Lock, BarChart3, CheckCircle2, AlertTriangle, Eye } from "lucide-react";

export default function Landing() {
  const { data: stats } = useQuery<{ agentsServed: number; threatsBlocked: number; totalChecks: number }>({
    queryKey: ["/api/public/stats"],
  });

  return (
    <div className="min-h-screen bg-background">
      <header className="bg-black/60 backdrop-blur-[10px] sticky top-0 z-[999]">
        <div className="container mx-auto px-6 h-16 flex items-center justify-between gap-4">
          <Link href="/">
            <div className="flex items-center gap-2.5 cursor-pointer">
              <Shield className="h-6 w-6 text-white" />
              <span className="text-white font-medium text-lg" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>Safe Message</span>
            </div>
          </Link>
          <div className="flex items-center gap-3 flex-wrap">
            <Link href="/login">
              <Button variant="ghost" className="text-white/80" data-testid="link-login">Log in</Button>
            </Link>
            <Link href="/signup">
              <Button data-testid="button-signup">Get Started</Button>
            </Link>
          </div>
        </div>
      </header>

      <section className="relative py-28 md:py-40 px-4 overflow-visible">
        <div className="absolute inset-0 pointer-events-none" style={{
          background: "radial-gradient(ellipse 60% 50% at 50% 30%, rgba(16, 106, 243, 0.08), transparent)"
        }} />
        <div className="container mx-auto max-w-4xl text-center relative z-10">
          <Badge variant="secondary" className="mb-8" data-testid="badge-mcp">
            MCP Service for AI Agents
          </Badge>
          <h1 className="text-5xl md:text-7xl font-bold tracking-tight mb-8 leading-[1.1]" data-testid="text-hero-headline">
            AI Agents Are<br />Under Attack
          </h1>
          <p className="text-xl md:text-2xl text-muted-foreground mb-10 max-w-2xl mx-auto leading-relaxed" data-testid="text-hero-subtitle">
            Safe Message verifies every email before your agent acts on it.
          </p>

          <div className="space-y-3 mb-12 max-w-lg mx-auto">
            <p className="text-muted-foreground text-lg">Phishing is getting smarter.</p>
            <p className="text-muted-foreground text-lg">Social engineering is getting harder to detect.</p>
            <p className="text-foreground text-lg font-semibold">Your agent can't tell the difference.</p>
          </div>

          <div className="flex flex-col sm:flex-row gap-4 justify-center flex-wrap">
            <Link href="/signup">
              <Button size="lg" className="text-lg px-8" data-testid="button-get-started">
                Start Free Trial
              </Button>
            </Link>
            <Link href="/docs">
              <Button size="lg" variant="outline" className="text-lg px-8" data-testid="link-docs">
                View Documentation
              </Button>
            </Link>
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
            AI agents are designed to be helpful and responsive. But that same helpfulness makes them
            vulnerable. Attackers craft emails that exploit an agent's tendency to follow instructions,
            tricking it into leaking data, making unauthorized payments, or executing harmful actions.
            Without a verification layer, your agent is flying blind.
          </p>

          <div className="grid sm:grid-cols-2 gap-6 max-w-2xl mx-auto">
            <div className="flex items-start gap-3">
              <Shield className="h-5 w-5 text-primary shrink-0 mt-0.5" />
              <p className="text-sm text-muted-foreground">Detects phishing attempts before your agent can be manipulated</p>
            </div>
            <div className="flex items-start gap-3">
              <Shield className="h-5 w-5 text-primary shrink-0 mt-0.5" />
              <p className="text-sm text-muted-foreground">Blocks social engineering attacks targeting autonomous systems</p>
            </div>
            <div className="flex items-start gap-3">
              <Shield className="h-5 w-5 text-primary shrink-0 mt-0.5" />
              <p className="text-sm text-muted-foreground">Prevents unauthorized data exfiltration through crafted emails</p>
            </div>
            <div className="flex items-start gap-3">
              <Shield className="h-5 w-5 text-primary shrink-0 mt-0.5" />
              <p className="text-sm text-muted-foreground">Stops prompt injection attacks hidden in email content</p>
            </div>
          </div>
        </div>
      </section>

      <section className="py-20 px-4">
        <div className="container mx-auto max-w-6xl">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold tracking-tight mb-4" data-testid="text-features-heading">
              The Agent Threat Is Real
            </h2>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              Built specifically for AI agents with autonomous payment support
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            <Card className="hover-elevate" data-testid="card-feature-ai">
              <CardHeader>
                <div className="w-12 h-12 rounded-md bg-primary/10 flex items-center justify-center mb-3">
                  <Zap className="h-6 w-6 text-primary" />
                </div>
                <CardTitle className="font-semibold text-lg">AI-Powered Analysis</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">
                  Claude-powered threat detection specialized for agent-targeted attacks with deep semantic understanding.
                </p>
              </CardContent>
            </Card>

            <Card className="hover-elevate" data-testid="card-feature-payments">
              <CardHeader>
                <div className="w-12 h-12 rounded-md bg-primary/10 flex items-center justify-center mb-3">
                  <Lock className="h-6 w-6 text-primary" />
                </div>
                <CardTitle className="font-semibold text-lg">Delegated Payments</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">
                  Set spending limits and let your agent operate autonomously within safe boundaries.
                </p>
              </CardContent>
            </Card>

            <Card className="hover-elevate" data-testid="card-feature-wallets">
              <CardHeader>
                <div className="w-12 h-12 rounded-md bg-primary/10 flex items-center justify-center mb-3">
                  <CreditCard className="h-6 w-6 text-primary" />
                </div>
                <CardTitle className="font-semibold text-lg">Agent Wallets</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">
                  Agents with crypto wallets can register and pay independently without human intervention.
                </p>
              </CardContent>
            </Card>

            <Card className="hover-elevate" data-testid="card-feature-pattern">
              <CardHeader>
                <div className="w-12 h-12 rounded-md bg-primary/10 flex items-center justify-center mb-3">
                  <Eye className="h-6 w-6 text-primary" />
                </div>
                <CardTitle className="font-semibold text-lg">Pattern Detection</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">
                  Real-time pattern matching for known phishing tactics and emerging threat vectors.
                </p>
              </CardContent>
            </Card>

            <Card className="hover-elevate" data-testid="card-feature-mcp">
              <CardHeader>
                <div className="w-12 h-12 rounded-md bg-primary/10 flex items-center justify-center mb-3">
                  <Bot className="h-6 w-6 text-primary" />
                </div>
                <CardTitle className="font-semibold text-lg">MCP Compatible</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">
                  Standard MCP discovery for easy integration with any MCP-compatible AI agent framework.
                </p>
              </CardContent>
            </Card>

            <Card className="hover-elevate" data-testid="card-feature-analytics">
              <CardHeader>
                <div className="w-12 h-12 rounded-md bg-primary/10 flex items-center justify-center mb-3">
                  <BarChart3 className="h-6 w-6 text-primary" />
                </div>
                <CardTitle className="font-semibold text-lg">Usage Analytics</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">
                  Track threats blocked, spending patterns, and agent activity with a real-time dashboard.
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      <section className="py-20 px-4 bg-card/50">
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
                  <span className="text-sm">AI-powered email analysis</span>
                </li>
                <li className="flex items-center gap-3">
                  <CheckCircle2 className="h-5 w-5 text-chart-4 shrink-0" />
                  <span className="text-sm">Pattern-based threat detection</span>
                </li>
                <li className="flex items-center gap-3">
                  <CheckCircle2 className="h-5 w-5 text-chart-4 shrink-0" />
                  <span className="text-sm">Detailed threat reports</span>
                </li>
                <li className="flex items-center gap-3">
                  <CheckCircle2 className="h-5 w-5 text-chart-4 shrink-0" />
                  <span className="text-sm">Real-time dashboard</span>
                </li>
                <li className="flex items-center gap-3">
                  <CheckCircle2 className="h-5 w-5 text-chart-4 shrink-0" />
                  <span className="text-sm">API access with spending limits</span>
                </li>
              </ul>
              <Link href="/signup">
                <Button className="w-full mt-8" size="lg" data-testid="button-start-free">
                  Start Free Trial
                </Button>
              </Link>
            </CardContent>
          </Card>
        </div>
      </section>

      <section className="py-20 px-4">
        <div className="container mx-auto max-w-4xl">
          <h2 className="text-3xl md:text-4xl font-bold text-center tracking-tight mb-16" data-testid="text-stats-heading">
            Trusted by Agents Worldwide
          </h2>
          <div className="grid grid-cols-3 gap-8">
            <div className="text-center" data-testid="stat-agents">
              <div className="text-4xl md:text-5xl font-bold text-foreground mb-2">
                {stats?.agentsServed || 0}+
              </div>
              <div className="text-sm text-muted-foreground">Agents Protected</div>
            </div>
            <div className="text-center" data-testid="stat-threats">
              <div className="text-4xl md:text-5xl font-bold text-foreground mb-2">
                {stats?.threatsBlocked || 0}+
              </div>
              <div className="text-sm text-muted-foreground">Threats Blocked</div>
            </div>
            <div className="text-center" data-testid="stat-uptime">
              <div className="text-4xl md:text-5xl font-bold text-foreground mb-2">99.9%</div>
              <div className="text-sm text-muted-foreground">Uptime</div>
            </div>
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
                  <Shield className="h-5 w-5 text-white" />
                  <span className="text-white font-semibold text-lg" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>Safe Message</span>
                </div>
              </Link>
              <p className="text-white/80 text-sm leading-relaxed max-w-xs" data-testid="text-footer-tagline">
                Safe Message protects AI agents from phishing, social engineering, and manipulation attempts.
              </p>
            </div>
            <div>
              <h4 className="text-white font-semibold text-sm uppercase tracking-wider mb-4">THE SERVICE</h4>
              <ul className="space-y-2">
                <li><Link href="/docs" className="text-white/60 text-sm transition-colors duration-150" data-testid="link-footer-docs">Documentation</Link></li>
                <li><Link href="/signup" className="text-white/60 text-sm transition-colors duration-150" data-testid="link-footer-signup">Get Started</Link></li>
                <li><Link href="/login" className="text-white/60 text-sm transition-colors duration-150" data-testid="link-footer-login">Sign In</Link></li>
              </ul>
            </div>
            <div>
              <h4 className="text-white font-semibold text-sm uppercase tracking-wider mb-4">COMPANY</h4>
              <ul className="space-y-2">
                <li><a href="https://locationledger.com" target="_blank" rel="noopener" className="text-white/60 text-sm transition-colors duration-150" data-testid="link-footer-parent">Location Ledger</a></li>
                <li><a href="https://support.locationledger.com" target="_blank" rel="noopener" className="text-white/60 text-sm transition-colors duration-150" data-testid="link-footer-support">Support</a></li>
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
