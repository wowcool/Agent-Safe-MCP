import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { useSEO } from "@/lib/seo";
import {
  Shield,
  Activity,
  DollarSign,
  AlertTriangle,
  Clock,
  Database,
  Brain,
  Globe,
  Lock,
  RefreshCw,
  TrendingUp,
  BarChart3,
  MessageCircle,
  ThumbsUp,
  ThumbsDown,
} from "lucide-react";

interface DashData {
  overview: {
    total_calls: number;
    total_revenue: string;
    dangerous: number;
    suspicious: number;
    safe: number;
    avg_risk: string;
    avg_duration_ms: number;
    first_check: string;
    last_check: string;
  };
  toolBreakdown: {
    tool_name: string;
    calls: number;
    revenue: string;
    avg_risk: string;
    dangerous: number;
    suspicious: number;
    safe: number;
  }[];
  paymentBreakdown: {
    payment_type: string;
    calls: number;
    revenue: string;
  }[];
  dailyTrend: {
    day: string;
    calls: number;
    revenue: string;
    dangerous: number;
  }[];
  recentChecks: {
    tool_name: string;
    sender_domain: string;
    verdict: string;
    risk_score: string;
    charged_amount: string;
    payment_type: string;
    analysis_duration_ms: number;
    created_at: string;
  }[];
  threatIntel: {
    total_entries: number;
    vt_entries: number;
    wr_entries: number;
  };
  scamPatterns: {
    total_patterns: number;
    domains_tracked: number;
  };
  domainReputation: {
    total_domains: number;
    avg_trust: string;
    low_trust_domains: number;
  };
  feedbackStats: {
    total_feedback: number;
    helpful: number;
    not_helpful: number;
    inaccurate: number;
    missed_threat: number;
    false_positive: number;
  };
  recentFeedback: {
    rating: string;
    comment: string | null;
    tool_name: string | null;
    agent_platform: string | null;
    check_id: string | null;
    created_at: string;
  }[];
}

function verdictColor(verdict: string) {
  if (verdict === "dangerous") return "destructive";
  if (verdict === "suspicious") return "secondary";
  return "outline";
}

function toolLabel(name: string) {
  return name
    .replace("check_", "")
    .replace("analyze_", "")
    .replace(/_/g, " ")
    .replace(/\b\w/g, (c) => c.toUpperCase());
}

function formatDate(d: string) {
  return new Date(d).toLocaleString("en-US", {
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function paymentLabel(type: string) {
  if (type === "skyfire") return "Direct (Skyfire)";
  if (type === "wallet") return "Smithery Proxy";
  return type;
}

export default function Dash() {
  useSEO({
    title: "Dashboard - Agent Safe",
    description: "Internal usage dashboard",
  });

  const [password, setPassword] = useState(() => sessionStorage.getItem("dash-pw") || "");
  const [authed, setAuthed] = useState(() => !!sessionStorage.getItem("dash-pw"));
  const [error, setError] = useState("");

  const { data, isLoading, refetch } = useQuery<DashData>({
    queryKey: ["/api/dash/stats"],
    queryFn: async () => {
      const pw = sessionStorage.getItem("dash-pw") || password;
      const res = await fetch(`/api/dash/stats`, {
        headers: { "x-dash-password": pw },
      });
      if (!res.ok) {
        sessionStorage.removeItem("dash-pw");
        setAuthed(false);
        throw new Error("Unauthorized");
      }
      return res.json();
    },
    enabled: authed,
    refetchInterval: 30000,
  });

  if (!authed) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <Card className="w-full max-w-sm">
          <CardHeader className="text-center">
            <Lock className="h-8 w-8 mx-auto text-muted-foreground mb-2" />
            <CardTitle>Dashboard Access</CardTitle>
          </CardHeader>
          <CardContent>
            <form
              onSubmit={(e) => {
                e.preventDefault();
                if (password) {
                  fetch(`/api/dash/stats`, {
                    headers: { "x-dash-password": password },
                  }).then((r) => {
                    if (r.ok) {
                      sessionStorage.setItem("dash-pw", password);
                      setAuthed(true);
                      setError("");
                    } else {
                      setError("Wrong password");
                    }
                  });
                }
              }}
              className="flex flex-col gap-3"
            >
              <Input
                type="password"
                placeholder="Enter password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                data-testid="input-dash-password"
              />
              {error && (
                <p className="text-sm text-destructive" data-testid="text-dash-error">{error}</p>
              )}
              <Button type="submit" data-testid="button-dash-login">
                Access Dashboard
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (isLoading || !data) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="flex items-center gap-2 text-muted-foreground">
          <RefreshCw className="h-5 w-5 animate-spin" />
          <span>Loading dashboard...</span>
        </div>
      </div>
    );
  }

  const o = data.overview;
  const daysActive = data.dailyTrend.length;
  const avgCallsPerDay = daysActive > 0 ? (o.total_calls / daysActive).toFixed(1) : "0";
  const revenuePerDay = daysActive > 0 ? (parseFloat(o.total_revenue) / daysActive).toFixed(2) : "0";

  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-50 bg-background/80 backdrop-blur border-b border-border/50">
        <div className="container mx-auto px-4 h-14 flex items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <Shield className="h-5 w-5 text-primary" />
            <span className="font-semibold" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>
              Agent Safe Dashboard
            </span>
          </div>
          <div className="flex items-center gap-3 flex-wrap">
            <span className="text-xs text-muted-foreground hidden sm:inline">
              Auto-refreshes every 30s
            </span>
            <Button size="sm" variant="outline" onClick={() => refetch()} data-testid="button-refresh">
              <RefreshCw className="h-3.5 w-3.5 mr-1.5" />
              Refresh
            </Button>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-6 space-y-6 max-w-7xl">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-2 text-muted-foreground text-xs mb-1">
                <Activity className="h-3.5 w-3.5" />
                Total Tool Calls
              </div>
              <div className="text-2xl font-bold" data-testid="text-total-calls">{o.total_calls}</div>
              <div className="text-xs text-muted-foreground mt-1">{avgCallsPerDay}/day avg</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-2 text-muted-foreground text-xs mb-1">
                <DollarSign className="h-3.5 w-3.5" />
                Total Revenue
              </div>
              <div className="text-2xl font-bold" data-testid="text-total-revenue">${o.total_revenue}</div>
              <div className="text-xs text-muted-foreground mt-1">${revenuePerDay}/day avg</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-2 text-muted-foreground text-xs mb-1">
                <AlertTriangle className="h-3.5 w-3.5" />
                Threats Found
              </div>
              <div className="text-2xl font-bold" data-testid="text-threats-found">
                {o.dangerous + o.suspicious}
              </div>
              <div className="text-xs text-muted-foreground mt-1">
                {o.dangerous} dangerous, {o.suspicious} suspicious
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-2 text-muted-foreground text-xs mb-1">
                <Clock className="h-3.5 w-3.5" />
                Avg Response
              </div>
              <div className="text-2xl font-bold" data-testid="text-avg-duration">
                {o.avg_duration_ms ? `${(o.avg_duration_ms / 1000).toFixed(1)}s` : "N/A"}
              </div>
              <div className="text-xs text-muted-foreground mt-1">
                Avg risk: {o.avg_risk}
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="grid md:grid-cols-2 gap-4">
          <Card>
            <CardHeader className="pb-3 flex flex-row items-center justify-between gap-2">
              <CardTitle className="text-sm font-medium flex items-center gap-2">
                <BarChart3 className="h-4 w-4" />
                Tool Usage
              </CardTitle>
            </CardHeader>
            <CardContent className="px-4 pb-4">
              <div className="space-y-3">
                {data.toolBreakdown.map((t) => {
                  const pct = o.total_calls > 0 ? (t.calls / o.total_calls) * 100 : 0;
                  return (
                    <div key={t.tool_name} data-testid={`row-tool-${t.tool_name}`}>
                      <div className="flex items-center justify-between gap-2 mb-1">
                        <span className="text-sm font-medium truncate">{toolLabel(t.tool_name)}</span>
                        <div className="flex items-center gap-2 shrink-0">
                          <span className="text-xs text-muted-foreground">{t.calls} calls</span>
                          <span className="text-xs font-medium">${t.revenue}</span>
                        </div>
                      </div>
                      <div className="h-2 bg-muted rounded-full overflow-hidden">
                        <div
                          className="h-full bg-primary rounded-full transition-all"
                          style={{ width: `${pct}%` }}
                        />
                      </div>
                      <div className="flex items-center gap-2 mt-1 flex-wrap">
                        {t.dangerous > 0 && (
                          <span className="text-[10px] text-destructive">{t.dangerous} dangerous</span>
                        )}
                        {t.suspicious > 0 && (
                          <span className="text-[10px] text-muted-foreground">{t.suspicious} suspicious</span>
                        )}
                        {t.safe > 0 && (
                          <span className="text-[10px] text-muted-foreground">{t.safe} safe</span>
                        )}
                        <span className="text-[10px] text-muted-foreground ml-auto">
                          avg risk: {t.avg_risk}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>

          <div className="space-y-4">
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium flex items-center gap-2">
                  <DollarSign className="h-4 w-4" />
                  Payment Channels
                </CardTitle>
              </CardHeader>
              <CardContent className="px-4 pb-4">
                <div className="space-y-2">
                  {data.paymentBreakdown.map((p) => (
                    <div
                      key={p.payment_type}
                      className="flex items-center justify-between gap-2"
                      data-testid={`row-payment-${p.payment_type}`}
                    >
                      <div className="flex items-center gap-2">
                        <Badge variant="outline" className="text-xs">
                          {paymentLabel(p.payment_type)}
                        </Badge>
                      </div>
                      <div className="flex items-center gap-3">
                        <span className="text-sm">{p.calls} calls</span>
                        <span className="text-sm font-medium">${p.revenue}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium flex items-center gap-2">
                  <TrendingUp className="h-4 w-4" />
                  Daily Trend
                </CardTitle>
              </CardHeader>
              <CardContent className="px-4 pb-4">
                <div className="space-y-2">
                  {data.dailyTrend.map((d) => (
                    <div key={d.day} className="flex items-center justify-between gap-2 text-sm">
                      <span className="text-muted-foreground">
                        {new Date(d.day).toLocaleDateString("en-US", {
                          month: "short",
                          day: "numeric",
                        })}
                      </span>
                      <div className="flex items-center gap-3">
                        <span>{d.calls} calls</span>
                        <span className="font-medium">${d.revenue}</span>
                        {d.dangerous > 0 && (
                          <Badge variant="destructive" className="text-[10px]">
                            {d.dangerous} threats
                          </Badge>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

        <div className="grid md:grid-cols-3 gap-3">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-2 text-muted-foreground text-xs mb-2">
                <Database className="h-3.5 w-3.5" />
                Threat Intelligence Cache
              </div>
              <div className="text-xl font-bold" data-testid="text-threat-intel-total">
                {data.threatIntel.total_entries} entries
              </div>
              <div className="text-xs text-muted-foreground mt-1 space-y-0.5">
                <div>VirusTotal: {data.threatIntel.vt_entries}</div>
                <div>Google Web Risk: {data.threatIntel.wr_entries}</div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-2 text-muted-foreground text-xs mb-2">
                <Brain className="h-3.5 w-3.5" />
                Learned Scam Patterns
              </div>
              <div className="text-xl font-bold" data-testid="text-scam-patterns">
                {data.scamPatterns.total_patterns} patterns
              </div>
              <div className="text-xs text-muted-foreground mt-1">
                Across {data.scamPatterns.domains_tracked} domains
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-2 text-muted-foreground text-xs mb-2">
                <Globe className="h-3.5 w-3.5" />
                Domain Reputations
              </div>
              <div className="text-xl font-bold" data-testid="text-domain-rep">
                {data.domainReputation.total_domains} domains
              </div>
              <div className="text-xs text-muted-foreground mt-1 space-y-0.5">
                <div>Avg trust: {data.domainReputation.avg_trust}</div>
                <div>Low trust: {data.domainReputation.low_trust_domains}</div>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="grid md:grid-cols-2 gap-4">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium flex items-center gap-2">
                <MessageCircle className="h-4 w-4" />
                Agent Feedback
              </CardTitle>
            </CardHeader>
            <CardContent className="px-4 pb-4">
              {data.feedbackStats.total_feedback === 0 ? (
                <div className="text-sm text-muted-foreground">
                  No feedback yet. Agents can call the free <code className="text-xs bg-muted px-1 py-0.5 rounded">submit_feedback</code> tool after any analysis.
                </div>
              ) : (
                <div className="space-y-3">
                  <div className="flex items-center gap-4 flex-wrap">
                    <div className="flex items-center gap-1.5">
                      <ThumbsUp className="h-4 w-4 text-green-500" />
                      <span className="text-sm font-medium">{data.feedbackStats.helpful}</span>
                      <span className="text-xs text-muted-foreground">helpful</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <ThumbsDown className="h-4 w-4 text-destructive" />
                      <span className="text-sm font-medium">{data.feedbackStats.not_helpful}</span>
                      <span className="text-xs text-muted-foreground">not helpful</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 flex-wrap text-xs">
                    {data.feedbackStats.inaccurate > 0 && (
                      <Badge variant="secondary">{data.feedbackStats.inaccurate} inaccurate</Badge>
                    )}
                    {data.feedbackStats.missed_threat > 0 && (
                      <Badge variant="destructive">{data.feedbackStats.missed_threat} missed threat</Badge>
                    )}
                    {data.feedbackStats.false_positive > 0 && (
                      <Badge variant="secondary">{data.feedbackStats.false_positive} false positive</Badge>
                    )}
                  </div>
                  {data.feedbackStats.total_feedback > 0 && (
                    <div className="text-xs text-muted-foreground">
                      Satisfaction: {((data.feedbackStats.helpful / data.feedbackStats.total_feedback) * 100).toFixed(0)}% positive ({data.feedbackStats.total_feedback} total)
                    </div>
                  )}
                </div>
              )}
            </CardContent>
          </Card>

          {data.recentFeedback.length > 0 && (
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium flex items-center gap-2">
                  <MessageCircle className="h-4 w-4" />
                  Recent Feedback
                </CardTitle>
              </CardHeader>
              <CardContent className="px-4 pb-4">
                <div className="space-y-2">
                  {data.recentFeedback.slice(0, 8).map((f, i) => (
                    <div key={i} className="flex items-start gap-2 text-sm" data-testid={`row-feedback-${i}`}>
                      {f.rating === "helpful" ? (
                        <ThumbsUp className="h-3.5 w-3.5 text-green-500 mt-0.5 shrink-0" />
                      ) : (
                        <ThumbsDown className="h-3.5 w-3.5 text-destructive mt-0.5 shrink-0" />
                      )}
                      <div className="min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <Badge variant="outline" className="text-[10px]">{f.rating}</Badge>
                          {f.tool_name && <span className="text-xs text-muted-foreground">{toolLabel(f.tool_name)}</span>}
                          {f.agent_platform && <span className="text-xs text-muted-foreground">via {f.agent_platform}</span>}
                        </div>
                        {f.comment && <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2">{f.comment}</p>}
                        <span className="text-[10px] text-muted-foreground">{formatDate(f.created_at)}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </div>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Activity className="h-4 w-4" />
              Recent Checks (last 25)
            </CardTitle>
          </CardHeader>
          <CardContent className="px-4 pb-4">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-left text-muted-foreground text-xs border-b">
                    <th className="pb-2 pr-3">Time</th>
                    <th className="pb-2 pr-3">Tool</th>
                    <th className="pb-2 pr-3">Domain</th>
                    <th className="pb-2 pr-3">Verdict</th>
                    <th className="pb-2 pr-3">Risk</th>
                    <th className="pb-2 pr-3">Payment</th>
                    <th className="pb-2 pr-3">Speed</th>
                  </tr>
                </thead>
                <tbody>
                  {data.recentChecks.map((c, i) => (
                    <tr
                      key={i}
                      className="border-b border-border/30 last:border-0"
                      data-testid={`row-check-${i}`}
                    >
                      <td className="py-2 pr-3 text-muted-foreground text-xs whitespace-nowrap">
                        {formatDate(c.created_at)}
                      </td>
                      <td className="py-2 pr-3 whitespace-nowrap">{toolLabel(c.tool_name)}</td>
                      <td className="py-2 pr-3 text-muted-foreground truncate max-w-[120px]">
                        {c.sender_domain || "-"}
                      </td>
                      <td className="py-2 pr-3">
                        <Badge variant={verdictColor(c.verdict)} className="text-[10px]">
                          {c.verdict}
                        </Badge>
                      </td>
                      <td className="py-2 pr-3 font-mono text-xs">
                        {parseFloat(c.risk_score).toFixed(2)}
                      </td>
                      <td className="py-2 pr-3 text-xs text-muted-foreground whitespace-nowrap">
                        {paymentLabel(c.payment_type)} · ${c.charged_amount}
                      </td>
                      <td className="py-2 pr-3 text-xs text-muted-foreground">
                        {c.analysis_duration_ms ? `${(c.analysis_duration_ms / 1000).toFixed(1)}s` : "-"}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>

        <div className="text-center text-xs text-muted-foreground pb-4">
          Active since {o.first_check ? formatDate(o.first_check) : "N/A"} · Last check{" "}
          {o.last_check ? formatDate(o.last_check) : "N/A"} · {daysActive} days of data
        </div>
      </main>
    </div>
  );
}
