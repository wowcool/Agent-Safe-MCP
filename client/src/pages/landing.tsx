import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useQuery } from "@tanstack/react-query";
import { Shield, Bot, CreditCard, Zap, Lock, BarChart3, CheckCircle2 } from "lucide-react";

export default function Landing() {
  const { data: stats } = useQuery<{ agentsServed: number; threatsBlocked: number; totalChecks: number }>({
    queryKey: ["/api/public/stats"],
  });

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b bg-card/50 backdrop-blur-sm sticky top-0 z-50">
        <div className="container mx-auto px-4 h-16 flex items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <Shield className="h-8 w-8 text-primary" />
            <span className="font-bold text-xl">SafeMessage</span>
          </div>
          <div className="flex items-center gap-3">
            <Link href="/login">
              <Button variant="ghost" data-testid="link-login">Log in</Button>
            </Link>
            <Link href="/signup">
              <Button data-testid="button-signup">Get Started</Button>
            </Link>
          </div>
        </div>
      </header>

      <section className="py-20 px-4">
        <div className="container mx-auto max-w-5xl text-center">
          <Badge variant="secondary" className="mb-4">MCP Service for AI Agents</Badge>
          <h1 className="text-4xl md:text-6xl font-bold mb-6 tracking-tight">
            Email Safety for <span className="text-primary">AI Agents</span>
          </h1>
          <p className="text-xl text-muted-foreground mb-8 max-w-2xl mx-auto">
            Protect your AI agents from phishing, social engineering, and manipulation attempts. 
            One API call before any email action.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
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
          
          <div className="mt-12 flex flex-wrap justify-center gap-8 text-muted-foreground">
            <div className="text-center">
              <div className="text-3xl font-bold text-foreground">{stats?.agentsServed || 0}+</div>
              <div className="text-sm">Agents Protected</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-foreground">{stats?.threatsBlocked || 0}+</div>
              <div className="text-sm">Threats Blocked</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-foreground">99.9%</div>
              <div className="text-sm">Uptime</div>
            </div>
          </div>
        </div>
      </section>

      <section className="py-16 px-4 bg-card/50">
        <div className="container mx-auto max-w-6xl">
          <h2 className="text-3xl font-bold text-center mb-12">How It Works</h2>
          <div className="grid md:grid-cols-3 gap-8">
            <Card className="hover-elevate">
              <CardHeader>
                <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center mb-4">
                  <Bot className="h-6 w-6 text-primary" />
                </div>
                <CardTitle>1. Agent Receives Email</CardTitle>
              </CardHeader>
              <CardContent>
                <CardDescription>
                  Your AI agent receives an email through its email integration. 
                  Before taking any action, it needs to verify the email is safe.
                </CardDescription>
              </CardContent>
            </Card>

            <Card className="hover-elevate">
              <CardHeader>
                <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center mb-4">
                  <Shield className="h-6 w-6 text-primary" />
                </div>
                <CardTitle>2. Calls SafeMessage</CardTitle>
              </CardHeader>
              <CardContent>
                <CardDescription>
                  Agent sends the email to our API. We analyze it using AI and 
                  pattern matching to detect phishing, malware, and social engineering.
                </CardDescription>
              </CardContent>
            </Card>

            <Card className="hover-elevate">
              <CardHeader>
                <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center mb-4">
                  <CheckCircle2 className="h-6 w-6 text-primary" />
                </div>
                <CardTitle>3. Gets Verdict</CardTitle>
              </CardHeader>
              <CardContent>
                <CardDescription>
                  We return a verdict (safe/suspicious/dangerous) with detailed 
                  recommendations on what actions are safe to take.
                </CardDescription>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      <section className="py-16 px-4">
        <div className="container mx-auto max-w-6xl">
          <h2 className="text-3xl font-bold text-center mb-4">Features</h2>
          <p className="text-muted-foreground text-center mb-12 max-w-2xl mx-auto">
            Built specifically for AI agents with autonomous payment support
          </p>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            <div className="flex gap-4 p-4">
              <Zap className="h-6 w-6 text-primary shrink-0" />
              <div>
                <h3 className="font-semibold mb-1">AI-Powered Analysis</h3>
                <p className="text-sm text-muted-foreground">
                  Claude-powered threat detection specialized for agent-targeted attacks
                </p>
              </div>
            </div>
            <div className="flex gap-4 p-4">
              <Lock className="h-6 w-6 text-primary shrink-0" />
              <div>
                <h3 className="font-semibold mb-1">Delegated Payments</h3>
                <p className="text-sm text-muted-foreground">
                  Set spending limits and let your agent operate autonomously
                </p>
              </div>
            </div>
            <div className="flex gap-4 p-4">
              <CreditCard className="h-6 w-6 text-primary shrink-0" />
              <div>
                <h3 className="font-semibold mb-1">Agent Wallets</h3>
                <p className="text-sm text-muted-foreground">
                  Agents with crypto wallets can register and pay independently
                </p>
              </div>
            </div>
            <div className="flex gap-4 p-4">
              <BarChart3 className="h-6 w-6 text-primary shrink-0" />
              <div>
                <h3 className="font-semibold mb-1">Usage Analytics</h3>
                <p className="text-sm text-muted-foreground">
                  Track threats blocked, spending, and agent activity
                </p>
              </div>
            </div>
            <div className="flex gap-4 p-4">
              <Shield className="h-6 w-6 text-primary shrink-0" />
              <div>
                <h3 className="font-semibold mb-1">Pattern Detection</h3>
                <p className="text-sm text-muted-foreground">
                  Real-time pattern matching for known phishing tactics
                </p>
              </div>
            </div>
            <div className="flex gap-4 p-4">
              <Bot className="h-6 w-6 text-primary shrink-0" />
              <div>
                <h3 className="font-semibold mb-1">MCP Compatible</h3>
                <p className="text-sm text-muted-foreground">
                  Standard MCP discovery for easy agent integration
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="py-16 px-4 bg-card/50">
        <div className="container mx-auto max-w-4xl">
          <h2 className="text-3xl font-bold text-center mb-12">Simple Pricing</h2>
          <Card className="max-w-md mx-auto">
            <CardHeader className="text-center">
              <CardTitle className="text-2xl">Pay Per Check</CardTitle>
              <div className="mt-4">
                <span className="text-5xl font-bold">$0.05</span>
                <span className="text-muted-foreground">/check</span>
              </div>
            </CardHeader>
            <CardContent>
              <ul className="space-y-3">
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="h-5 w-5 text-chart-4" />
                  <span>AI-powered email analysis</span>
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="h-5 w-5 text-chart-4" />
                  <span>Pattern-based threat detection</span>
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="h-5 w-5 text-chart-4" />
                  <span>Detailed threat reports</span>
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="h-5 w-5 text-chart-4" />
                  <span>Real-time dashboard</span>
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="h-5 w-5 text-chart-4" />
                  <span>API access with spending limits</span>
                </li>
              </ul>
              <Link href="/signup">
                <Button className="w-full mt-6" size="lg" data-testid="button-start-free">
                  Start Free Trial
                </Button>
              </Link>
            </CardContent>
          </Card>
        </div>
      </section>

      <footer className="py-12 px-4 border-t">
        <div className="container mx-auto max-w-6xl">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-2">
              <Shield className="h-6 w-6 text-primary" />
              <span className="font-bold">SafeMessage</span>
            </div>
            <p className="text-sm text-muted-foreground">
              Part of the Anti-Deepfake/Agent Abuse protection suite
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
