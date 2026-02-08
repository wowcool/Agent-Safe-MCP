import { useQuery, useMutation } from "@tanstack/react-query";
import { useLocation, Link } from "wouter";
import { useState, useEffect } from "react";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";
import { 
  Bot, AlertTriangle, CheckCircle2, XCircle, 
  CreditCard, Plus, Copy, Trash2, LogOut, BarChart3, Key
} from "lucide-react";
import logoImg from "@assets/mcp-logo-v2.png";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

interface User {
  id: string;
  email: string;
  hasPaymentMethod: boolean;
}

interface DashboardStats {
  agentCount: number;
  totalChecks: number;
  threatsBlocked: number;
  totalSpent: string;
  breakdown: { safe: number; suspicious: number; dangerous: number };
}

interface AgentToken {
  id: string;
  agentName: string;
  agentType: string;
  status: string;
  usageThisMonth: number;
  totalUsage: number;
  totalSpent: string;
  limits: { maxPerMonth: number; pricePerCheck: number };
  referralCode: string;
  createdAt: string;
  expiresAt: string | null;
  lastUsedAt: string | null;
}

interface EmailCheck {
  id: string;
  agentName: string;
  verdict: string;
  senderDomain: string | null;
  riskScore: string;
  createdAt: string;
}

export default function Dashboard() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const [newTokenName, setNewTokenName] = useState("");
  const [showTokenDialog, setShowTokenDialog] = useState(false);
  const [newToken, setNewToken] = useState<string | null>(null);

  const { data: user, isLoading: userLoading, error: userError } = useQuery<User>({
    queryKey: ["/api/auth/me"],
    retry: false,
  });

  const { data: stats, isLoading: statsLoading } = useQuery<DashboardStats>({
    queryKey: ["/api/dashboard/stats"],
    enabled: !!user,
  });

  const { data: tokensData, isLoading: tokensLoading } = useQuery<{ tokens: AgentToken[] }>({
    queryKey: ["/api/tokens"],
    enabled: !!user,
  });

  const { data: recentChecks } = useQuery<{ checks: EmailCheck[] }>({
    queryKey: ["/api/dashboard/recent-checks"],
    enabled: !!user,
  });

  const createTokenMutation = useMutation({
    mutationFn: async (agentName: string) => {
      const res = await apiRequest("POST", "/api/tokens", { agentName });
      return res.json();
    },
    onSuccess: (data) => {
      setNewToken(data.token);
      queryClient.invalidateQueries({ queryKey: ["/api/tokens"] });
      queryClient.invalidateQueries({ queryKey: ["/api/dashboard/stats"] });
    },
    onError: (error: Error) => {
      toast({
        title: "Failed to create token",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const deleteTokenMutation = useMutation({
    mutationFn: async (id: string) => {
      await apiRequest("DELETE", `/api/tokens/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/tokens"] });
      queryClient.invalidateQueries({ queryKey: ["/api/dashboard/stats"] });
      toast({ title: "Token revoked successfully" });
    },
  });

  const logoutMutation = useMutation({
    mutationFn: async () => {
      await apiRequest("POST", "/api/auth/logout");
    },
    onSuccess: () => {
      queryClient.clear();
      setLocation("/");
    },
  });

  useEffect(() => {
    if (userError) {
      setLocation("/login");
    }
  }, [userError, setLocation]);

  const handleCreateToken = () => {
    if (!newTokenName.trim()) return;
    createTokenMutation.mutate(newTokenName.trim());
  };

  const copyToken = (token: string) => {
    navigator.clipboard.writeText(token);
    toast({ title: "Token copied to clipboard" });
  };

  if (userLoading) {
    return (
      <div className="min-h-screen bg-background p-8">
        <div className="max-w-7xl mx-auto space-y-6">
          <Skeleton className="h-10 w-48" />
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <Skeleton className="h-32" />
            <Skeleton className="h-32" />
            <Skeleton className="h-32" />
            <Skeleton className="h-32" />
          </div>
        </div>
      </div>
    );
  }

  if (!user) return null;

  return (
    <div className="min-h-screen bg-background">
      <header className="bg-black/60 backdrop-blur-[10px] sticky top-0 z-[100]">
        <div className="container mx-auto px-6 h-16 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <Link href="/">
              <div className="flex items-center gap-2.5 cursor-pointer">
                <img src={logoImg} alt="Agent Safe" className="h-6 w-6" />
                <span className="text-white font-medium text-lg" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>Agent Safe</span>
              </div>
            </Link>
          </div>
          <div className="flex items-center gap-4 flex-wrap">
            <span className="text-sm text-muted-foreground hidden sm:block">{user.email}</span>
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={() => logoutMutation.mutate()}
              data-testid="button-logout"
            >
              <LogOut className="h-4 w-4 mr-2" />
              Logout
            </Button>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8 max-w-7xl">
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">Dashboard</h1>
          <p className="text-muted-foreground">Monitor your agents and email safety checks</p>
        </div>

        {!user.hasPaymentMethod && (
          <Card className="mb-6 border-primary/30 bg-primary/5">
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-lg">
                <CreditCard className="h-5 w-5" />
                Set Up Payment
              </CardTitle>
              <CardDescription>
                Add a payment method to enable your agents to use the email safety API. You can create tokens now, but they won't work until payment is configured.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Link href="/billing">
                <Button data-testid="button-add-payment">Set Up Payment</Button>
              </Link>
            </CardContent>
          </Card>
        )}

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <Card className="hover-elevate">
            <CardHeader className="flex flex-row items-center justify-between gap-2 pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Active Agents
              </CardTitle>
              <Bot className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              {statsLoading ? (
                <Skeleton className="h-8 w-16" />
              ) : (
                <div className="text-3xl font-bold" data-testid="text-agent-count">
                  {stats?.agentCount || 0}
                </div>
              )}
            </CardContent>
          </Card>

          <Card className="hover-elevate">
            <CardHeader className="flex flex-row items-center justify-between gap-2 pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Total Checks
              </CardTitle>
              <BarChart3 className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              {statsLoading ? (
                <Skeleton className="h-8 w-16" />
              ) : (
                <div className="text-3xl font-bold" data-testid="text-total-checks">
                  {stats?.totalChecks || 0}
                </div>
              )}
            </CardContent>
          </Card>

          <Card className="hover-elevate">
            <CardHeader className="flex flex-row items-center justify-between gap-2 pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Threats Blocked
              </CardTitle>
              <AlertTriangle className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              {statsLoading ? (
                <Skeleton className="h-8 w-16" />
              ) : (
                <div className="text-3xl font-bold text-destructive" data-testid="text-threats-blocked">
                  {stats?.threatsBlocked || 0}
                </div>
              )}
            </CardContent>
          </Card>

          <Card className="hover-elevate">
            <CardHeader className="flex flex-row items-center justify-between gap-2 pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Total Spent
              </CardTitle>
              <CreditCard className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              {statsLoading ? (
                <Skeleton className="h-8 w-16" />
              ) : (
                <div className="text-3xl font-bold" data-testid="text-total-spent">
                  ${stats?.totalSpent || "0.00"}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between gap-2">
              <div>
                <CardTitle className="flex items-center gap-2">
                  <Key className="h-5 w-5" />
                  API Tokens
                </CardTitle>
                <CardDescription>Manage tokens for your AI agents</CardDescription>
              </div>
              <Dialog open={showTokenDialog} onOpenChange={setShowTokenDialog}>
                <DialogTrigger asChild>
                  <Button 
                    size="sm" 
                    data-testid="button-new-token"
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    New Token
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Create API Token</DialogTitle>
                    <DialogDescription>
                      Create a new token for your AI agent to use Agent Safe.
                    </DialogDescription>
                  </DialogHeader>
                  {newToken ? (
                    <div className="space-y-4">
                      <div className="p-4 bg-accent rounded-lg">
                        <Label className="text-sm text-muted-foreground">Your API Token</Label>
                        <div className="flex items-center gap-2 mt-2">
                          <code className="text-xs bg-background p-2 rounded flex-1 overflow-x-auto" data-testid="text-new-token">
                            {newToken}
                          </code>
                          <Button 
                            size="icon" 
                            variant="outline" 
                            onClick={() => copyToken(newToken)}
                            data-testid="button-copy-token"
                          >
                            <Copy className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                      <p className="text-sm text-destructive">
                        Save this token now. You won't be able to see it again.
                      </p>
                      <DialogFooter>
                        <Button 
                          onClick={() => { 
                            setShowTokenDialog(false); 
                            setNewToken(null); 
                            setNewTokenName(""); 
                          }}
                          data-testid="button-done"
                        >
                          Done
                        </Button>
                      </DialogFooter>
                    </div>
                  ) : (
                    <>
                      <div className="space-y-4 py-4">
                        <div className="space-y-2">
                          <Label htmlFor="agent-name">Agent Name</Label>
                          <Input
                            id="agent-name"
                            placeholder="e.g., EmailAssistant"
                            value={newTokenName}
                            onChange={(e) => setNewTokenName(e.target.value)}
                            data-testid="input-agent-name"
                          />
                        </div>
                      </div>
                      <DialogFooter>
                        <Button 
                          onClick={handleCreateToken} 
                          disabled={!newTokenName.trim() || createTokenMutation.isPending}
                          data-testid="button-create-token"
                        >
                          Create Token
                        </Button>
                      </DialogFooter>
                    </>
                  )}
                </DialogContent>
              </Dialog>
            </CardHeader>
            <CardContent>
              {tokensLoading ? (
                <div className="space-y-2">
                  <Skeleton className="h-12 w-full" />
                  <Skeleton className="h-12 w-full" />
                </div>
              ) : (tokensData?.tokens?.length || 0) === 0 ? (
                <p className="text-muted-foreground text-center py-8">
                  No tokens yet. Create one to get started.
                </p>
              ) : (
                <div className="space-y-3">
                  {tokensData?.tokens?.map((token) => (
                    <div
                      key={token.id}
                      className="flex items-center justify-between p-3 border rounded-lg"
                      data-testid={`card-token-${token.id}`}
                    >
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="font-medium truncate">{token.agentName}</span>
                          <Badge 
                            variant={token.status === "active" ? "default" : "secondary"}
                            className="shrink-0"
                          >
                            {token.status}
                          </Badge>
                        </div>
                        <div className="text-sm text-muted-foreground mt-1">
                          {token.usageThisMonth}/{token.limits.maxPerMonth} checks this month
                        </div>
                      </div>
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button 
                            variant="ghost" 
                            size="icon"
                            data-testid={`button-delete-token-${token.id}`}
                          >
                            <Trash2 className="h-4 w-4 text-destructive" />
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>Revoke Token?</AlertDialogTitle>
                            <AlertDialogDescription>
                              This will immediately revoke access for "{token.agentName}". 
                              This action cannot be undone.
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>Cancel</AlertDialogCancel>
                            <AlertDialogAction
                              onClick={() => deleteTokenMutation.mutate(token.id)}
                              data-testid="button-confirm-delete"
                            >
                              Revoke
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <CheckCircle2 className="h-5 w-5" />
                Recent Checks
              </CardTitle>
              <CardDescription>Latest email safety verifications</CardDescription>
            </CardHeader>
            <CardContent>
              {(recentChecks?.checks?.length || 0) === 0 ? (
                <p className="text-muted-foreground text-center py-8">
                  No checks yet. Your agents will appear here when they start using Agent Safe.
                </p>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Agent</TableHead>
                      <TableHead>Domain</TableHead>
                      <TableHead>Verdict</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {recentChecks?.checks?.slice(0, 5).map((check) => (
                      <TableRow key={check.id} data-testid={`row-check-${check.id}`}>
                        <TableCell className="font-medium">{check.agentName}</TableCell>
                        <TableCell className="text-muted-foreground">
                          {check.senderDomain || "—"}
                        </TableCell>
                        <TableCell>
                          <Badge 
                            variant={
                              check.verdict === "safe" ? "default" :
                              check.verdict === "suspicious" ? "secondary" : "destructive"
                            }
                            className="gap-1"
                          >
                            {check.verdict === "safe" && <CheckCircle2 className="h-3 w-3" />}
                            {check.verdict === "suspicious" && <AlertTriangle className="h-3 w-3" />}
                            {check.verdict === "dangerous" && <XCircle className="h-3 w-3" />}
                            {check.verdict}
                          </Badge>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
}
