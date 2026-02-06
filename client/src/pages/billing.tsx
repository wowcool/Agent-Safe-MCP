import { useQuery, useMutation } from "@tanstack/react-query";
import { useLocation, Link } from "wouter";
import { useState, useEffect } from "react";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { CreditCard, ArrowLeft, CheckCircle2, Loader2 } from "lucide-react";
import logoImg from "@assets/Screenshot_2026-02-06_at_09.52.49_1770389587007.png";
import { loadStripe } from "@stripe/stripe-js";
import { Elements, CardElement, useStripe, useElements } from "@stripe/react-stripe-js";

interface User {
  id: string;
  email: string;
  hasPaymentMethod: boolean;
}

interface SetupData {
  clientSecret: string;
  publishableKey: string;
}

function PaymentForm({ clientSecret, onSuccess }: { clientSecret: string; onSuccess: () => void }) {
  const stripe = useStripe();
  const elements = useElements();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const confirmMutation = useMutation({
    mutationFn: async (setupIntentId: string) => {
      await apiRequest("POST", "/api/payments/confirm", { setupIntentId });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/auth/me"] });
      toast({ title: "Payment method added successfully!" });
      onSuccess();
    },
    onError: (error: Error) => {
      setError(error.message);
    },
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!stripe || !elements) return;

    setLoading(true);
    setError(null);

    const cardElement = elements.getElement(CardElement);
    if (!cardElement) {
      setLoading(false);
      return;
    }

    const { error: stripeError, setupIntent } = await stripe.confirmCardSetup(clientSecret, {
      payment_method: {
        card: cardElement,
      },
    });

    if (stripeError) {
      setError(stripeError.message || "Failed to add card");
      setLoading(false);
      return;
    }

    if (setupIntent?.status === "succeeded") {
      confirmMutation.mutate(setupIntent.id);
    } else {
      setError("Setup did not complete. Please try again.");
    }
    setLoading(false);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="p-4 border rounded-lg bg-accent">
        <CardElement
          options={{
            style: {
              base: {
                fontSize: "16px",
                color: "#e2e2e2",
                "::placeholder": {
                  color: "#6b7280",
                },
              },
              invalid: {
                color: "#ef4444",
              },
            },
          }}
        />
      </div>
      {error && (
        <p className="text-sm text-destructive">{error}</p>
      )}
      <Button 
        type="submit" 
        className="w-full" 
        disabled={!stripe || loading || confirmMutation.isPending}
        data-testid="button-save-card"
      >
        {(loading || confirmMutation.isPending) && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
        Save Payment Method
      </Button>
    </form>
  );
}

export default function Billing() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const [stripePromise, setStripePromise] = useState<ReturnType<typeof loadStripe> | null>(null);

  const { data: user, isLoading: userLoading, error: userError } = useQuery<User>({
    queryKey: ["/api/auth/me"],
    retry: false,
  });

  const setupMutation = useMutation({
    mutationFn: async () => {
      const res = await apiRequest("POST", "/api/payments/setup");
      return res.json() as Promise<SetupData>;
    },
    onSuccess: (data) => {
      if (data.publishableKey) {
        setStripePromise(loadStripe(data.publishableKey));
      }
    },
    onError: (error: Error) => {
      toast({
        title: "Failed to initialize payment",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  useEffect(() => {
    if (userError) {
      setLocation("/login");
    }
  }, [userError, setLocation]);

  useEffect(() => {
    if (user && !user.hasPaymentMethod && !setupMutation.data && !setupMutation.isPending) {
      setupMutation.mutate();
    }
  }, [user]);

  if (userLoading || !user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <header className="bg-black/60 backdrop-blur-[10px] sticky top-0 z-[100]">
        <div className="container mx-auto px-6 h-16 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <Link href="/dashboard">
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
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8 max-w-2xl">
        <h1 className="text-3xl font-bold mb-2">Billing</h1>
        <p className="text-muted-foreground mb-8">Manage your payment method</p>

        {user.hasPaymentMethod ? (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <CheckCircle2 className="h-5 w-5 text-chart-4" />
                Payment Method Active
              </CardTitle>
              <CardDescription>
                Your payment method is set up and ready to use
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-3 p-4 bg-accent rounded-lg">
                <CreditCard className="h-6 w-6" />
                <div>
                  <p className="font-medium">Credit Card</p>
                  <p className="text-sm text-muted-foreground">
                    Your agents can now use Safe Message and you'll be charged $0.05 per check
                  </p>
                </div>
              </div>
              <Link href="/dashboard">
                <Button className="w-full mt-6" data-testid="button-go-dashboard">
                  Go to Dashboard
                </Button>
              </Link>
            </CardContent>
          </Card>
        ) : (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <CreditCard className="h-5 w-5" />
                Add Payment Method
              </CardTitle>
              <CardDescription>
                Add a credit card to enable API access for your agents. 
                You'll be charged $0.05 per email check.
              </CardDescription>
            </CardHeader>
            <CardContent>
              {setupMutation.isPending ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                </div>
              ) : setupMutation.data && stripePromise ? (
                <Elements stripe={stripePromise} options={{ clientSecret: setupMutation.data.clientSecret }}>
                  <PaymentForm 
                    clientSecret={setupMutation.data.clientSecret} 
                    onSuccess={() => setLocation("/dashboard")}
                  />
                </Elements>
              ) : (
                <div className="text-center py-8">
                  <p className="text-muted-foreground mb-4">Unable to load payment form</p>
                  <Button onClick={() => setupMutation.mutate()}>Try Again</Button>
                </div>
              )}
            </CardContent>
          </Card>
        )}

        <Card className="mt-6">
          <CardHeader>
            <CardTitle className="text-lg">Pricing</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Email Safety Check</span>
                <span className="font-medium">$0.05 / check</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Monthly Minimum</span>
                <span className="font-medium">None</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">API Access</span>
                <span className="font-medium">Included</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
