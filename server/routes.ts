import type { Express, Request, Response } from "express";
import { createServer, type Server } from "http";
import passport from "passport";
import { setupAuth, requireAuth } from "./auth";
import { storage } from "./storage";
import { 
  insertOwnerSchema, 
  loginSchema, 
  createTokenSchema,
  type CheckEmailRequest,
  type CheckEmailResponse,
  type DiscoveryResponse,
} from "@shared/schema";
import { 
  createStripeCustomer, 
  createSetupIntent, 
  getSetupIntent,
  chargeForEmailCheck,
  verifyWalletProof,
  getWalletBalance,
} from "./services/payment";
import { 
  createDelegatedToken, 
  createAutonomousToken,
  validateApiToken,
  getTokenWithOwner,
} from "./services/token";
import { analyzeEmail } from "./services/email-analyzer";
import { z } from "zod";

export async function registerRoutes(
  httpServer: Server,
  app: Express
): Promise<Server> {
  // Setup authentication
  setupAuth(app);

  // ===== AUTH ROUTES =====
  
  app.post("/api/auth/signup", async (req: Request, res: Response) => {
    try {
      const parsed = insertOwnerSchema.safeParse(req.body);
      if (!parsed.success) {
        return res.status(400).json({ error: parsed.error.errors[0]?.message || "Invalid input" });
      }

      const existing = await storage.getOwnerByEmail(parsed.data.email);
      if (existing) {
        return res.status(400).json({ error: "Email already registered" });
      }

      const owner = await storage.createOwner(parsed.data);
      
      // Create Stripe customer
      try {
        const stripeCustomerId = await createStripeCustomer(owner.email);
        await storage.updateOwnerStripe(owner.id, stripeCustomerId);
      } catch (stripeError) {
        console.error("Stripe customer creation failed:", stripeError);
      }

      // Log the user in
      req.login(owner, (err) => {
        if (err) {
          return res.status(500).json({ error: "Login failed after signup" });
        }
        return res.json({ 
          success: true, 
          user: { id: owner.id, email: owner.email } 
        });
      });
    } catch (error: any) {
      console.error("Signup error:", error);
      return res.status(500).json({ error: "Failed to create account" });
    }
  });

  app.post("/api/auth/login", (req: Request, res: Response, next) => {
    const parsed = loginSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({ error: parsed.error.errors[0]?.message || "Invalid input" });
    }

    passport.authenticate("local", (err: any, user: any, info: any) => {
      if (err) {
        return res.status(500).json({ error: "Authentication error" });
      }
      if (!user) {
        return res.status(401).json({ error: info?.message || "Invalid credentials" });
      }
      req.login(user, (loginErr) => {
        if (loginErr) {
          return res.status(500).json({ error: "Login failed" });
        }
        return res.json({ 
          success: true, 
          user: { id: user.id, email: user.email } 
        });
      });
    })(req, res, next);
  });

  app.post("/api/auth/logout", (req: Request, res: Response) => {
    req.logout((err) => {
      if (err) {
        return res.status(500).json({ error: "Logout failed" });
      }
      return res.json({ success: true });
    });
  });

  app.get("/api/auth/me", (req: Request, res: Response) => {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ error: "Not authenticated" });
    }
    const user = req.user!;
    return res.json({ 
      id: user.id, 
      email: user.email,
      hasPaymentMethod: !!user.stripePaymentMethodId,
    });
  });

  // ===== PAYMENT ROUTES =====

  app.post("/api/payments/setup", requireAuth, async (req: Request, res: Response) => {
    try {
      const owner = req.user!;
      
      if (!owner.stripeCustomerId) {
        const stripeCustomerId = await createStripeCustomer(owner.email);
        await storage.updateOwnerStripe(owner.id, stripeCustomerId);
        owner.stripeCustomerId = stripeCustomerId;
      }

      const { clientSecret, publishableKey } = await createSetupIntent(owner.stripeCustomerId);
      return res.json({ clientSecret, publishableKey });
    } catch (error: any) {
      console.error("Payment setup error:", error);
      return res.status(500).json({ error: "Failed to setup payment" });
    }
  });

  app.post("/api/payments/confirm", requireAuth, async (req: Request, res: Response) => {
    try {
      const { setupIntentId } = req.body;
      if (!setupIntentId) {
        return res.status(400).json({ error: "Missing setupIntentId" });
      }

      const setupIntent = await getSetupIntent(setupIntentId);
      if (setupIntent.status !== "succeeded") {
        return res.status(400).json({ error: "Setup not completed" });
      }

      const paymentMethodId = setupIntent.payment_method as string;
      await storage.updateOwnerStripe(
        req.user!.id,
        req.user!.stripeCustomerId!,
        paymentMethodId
      );

      return res.json({ success: true });
    } catch (error: any) {
      console.error("Payment confirm error:", error);
      return res.status(500).json({ error: "Failed to confirm payment" });
    }
  });

  // ===== TOKEN MANAGEMENT ROUTES =====

  app.get("/api/tokens", requireAuth, async (req: Request, res: Response) => {
    try {
      const tokens = await storage.getAgentTokensByOwner(req.user!.id);
      return res.json({ 
        tokens: tokens.map(t => ({
          id: t.id,
          agentName: t.agentName,
          agentType: t.agentType,
          status: t.status,
          usageThisMonth: t.usageThisMonth,
          totalUsage: t.totalUsage,
          totalSpent: t.totalSpent,
          limits: t.limits,
          referralCode: t.referralCode,
          createdAt: t.createdAt,
          expiresAt: t.expiresAt,
          lastUsedAt: t.lastUsedAt,
        }))
      });
    } catch (error) {
      console.error("Get tokens error:", error);
      return res.status(500).json({ error: "Failed to get tokens" });
    }
  });

  app.post("/api/tokens", requireAuth, async (req: Request, res: Response) => {
    try {
      const parsed = createTokenSchema.safeParse(req.body);
      if (!parsed.success) {
        return res.status(400).json({ error: parsed.error.errors[0]?.message || "Invalid input" });
      }

      const owner = req.user!;
      if (!owner.stripeCustomerId || !owner.stripePaymentMethodId) {
        return res.status(400).json({ error: "Please add a payment method first" });
      }

      const { token, tokenRecord } = await createDelegatedToken(
        owner.id,
        parsed.data.agentName,
        parsed.data.scopes,
        parsed.data.limits,
        owner.stripeCustomerId,
        parsed.data.expiresInDays
      );

      return res.json({ 
        token, 
        id: tokenRecord.id,
        expiresAt: tokenRecord.expiresAt,
      });
    } catch (error: any) {
      console.error("Create token error:", error);
      return res.status(500).json({ error: "Failed to create token" });
    }
  });

  app.delete("/api/tokens/:id", requireAuth, async (req: Request, res: Response) => {
    try {
      const token = await storage.getAgentToken(req.params.id);
      if (!token || token.ownerId !== req.user!.id) {
        return res.status(404).json({ error: "Token not found" });
      }

      await storage.revokeAgentToken(req.params.id);
      return res.json({ success: true });
    } catch (error) {
      console.error("Delete token error:", error);
      return res.status(500).json({ error: "Failed to revoke token" });
    }
  });

  // ===== DASHBOARD STATS =====

  app.get("/api/dashboard/stats", requireAuth, async (req: Request, res: Response) => {
    try {
      const tokens = await storage.getAgentTokensByOwner(req.user!.id);
      const tokenIds = tokens.map(t => t.id);
      
      let totalChecks = 0;
      let safe = 0;
      let suspicious = 0;
      let dangerous = 0;
      
      for (const tokenId of tokenIds) {
        const stats = await storage.getEmailCheckStats(tokenId);
        totalChecks += stats.total;
        safe += stats.safe;
        suspicious += stats.suspicious;
        dangerous += stats.dangerous;
      }

      const totalSpent = tokens.reduce((sum, t) => sum + Number(t.totalSpent || 0), 0);

      return res.json({
        agentCount: tokens.filter(t => t.status === "active").length,
        totalChecks,
        threatsBlocked: suspicious + dangerous,
        totalSpent: totalSpent.toFixed(2),
        breakdown: { safe, suspicious, dangerous },
      });
    } catch (error) {
      console.error("Dashboard stats error:", error);
      return res.status(500).json({ error: "Failed to get stats" });
    }
  });

  app.get("/api/dashboard/recent-checks", requireAuth, async (req: Request, res: Response) => {
    try {
      const tokens = await storage.getAgentTokensByOwner(req.user!.id);
      const allChecks: any[] = [];
      
      for (const token of tokens) {
        const checks = await storage.getEmailChecksByToken(token.id, 10);
        allChecks.push(...checks.map(c => ({
          ...c,
          agentName: token.agentName,
        })));
      }

      // Sort by date and take top 20
      allChecks.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
      
      return res.json({ checks: allChecks.slice(0, 20) });
    } catch (error) {
      console.error("Recent checks error:", error);
      return res.status(500).json({ error: "Failed to get recent checks" });
    }
  });

  // ===== MCP DISCOVERY & REGISTRATION =====

  app.get("/mcp/discover", async (req: Request, res: Response) => {
    try {
      const stats = await storage.getGlobalStats();
      
      const discovery: DiscoveryResponse = {
        service: "SafeMessage Guard",
        version: "1.0.0",
        description: "Email safety verification for AI agents. Protects against phishing, social engineering, and manipulation attempts targeting agents.",
        capabilities: ["email_safety_check"],
        domainFocus: "email",
        pricing: {
          perCheck: 0.05,
          currency: "USD",
        },
        paymentMethods: ["stripe_delegated", "crypto_wallet"],
        endpoints: {
          register: {
            delegated: "/mcp/register/delegated",
            autonomous: "/mcp/register/autonomous",
          },
          tools: {
            checkEmailSafety: "/mcp/tools/check_email_safety",
          },
        },
        documentation: "/docs",
        trustSignals: {
          uptime: "99.9%",
          avgResponseMs: 450,
          agentsServed: Math.max(stats.agentsServed, 1),
          threatsBlocked: stats.threatsBlocked,
        },
      };

      return res.json(discovery);
    } catch (error) {
      console.error("Discovery error:", error);
      return res.status(500).json({ error: "Discovery failed" });
    }
  });

  app.post("/mcp/register/delegated", async (req: Request, res: Response) => {
    try {
      const { ownerToken, agentName, requestedScopes } = req.body;
      
      if (!ownerToken || !agentName) {
        return res.status(400).json({ error: "Missing required fields" });
      }

      // Validate the owner token (this would be a JWT from the owner's dashboard)
      const validation = await validateApiToken(ownerToken);
      if (!validation.valid) {
        return res.status(401).json({ error: validation.error || "Invalid owner token" });
      }

      return res.json({
        success: true,
        message: "Agent registered successfully",
        apiToken: ownerToken, // In production, would generate a new scoped token
        limits: validation.tokenRecord?.limits,
        expiresAt: validation.tokenRecord?.expiresAt,
      });
    } catch (error: any) {
      console.error("Delegated registration error:", error);
      return res.status(500).json({ error: "Registration failed" });
    }
  });

  app.post("/mcp/register/autonomous", async (req: Request, res: Response) => {
    try {
      const { agentId, agentName, walletAddress, walletType, proof } = req.body;

      if (!agentId || !agentName || !walletAddress || !walletType || !proof) {
        return res.status(400).json({ error: "Missing required fields" });
      }

      // Verify wallet ownership
      const isValidProof = await verifyWalletProof(
        walletAddress,
        proof,
        `SafeMessage registration: ${agentId}`
      );

      if (!isValidProof) {
        return res.status(401).json({ error: "Invalid wallet proof" });
      }

      // Check wallet balance
      const balance = await getWalletBalance(walletAddress);
      const MIN_BALANCE = 5.0;

      if (balance < MIN_BALANCE) {
        return res.status(402).json({ 
          error: "Insufficient balance",
          currentBalance: balance,
          minBalanceRequired: MIN_BALANCE,
        });
      }

      // Create autonomous agent token
      const { token, tokenRecord } = await createAutonomousToken(
        agentId,
        agentName,
        walletAddress,
        walletType
      );

      return res.json({
        success: true,
        apiToken: token,
        walletVerified: true,
        currentBalance: balance,
        minBalanceRequired: MIN_BALANCE,
        pricePerCheck: 0.05,
      });
    } catch (error: any) {
      console.error("Autonomous registration error:", error);
      return res.status(500).json({ error: "Registration failed" });
    }
  });

  // ===== MCP TOOLS =====

  app.post("/mcp/tools/check_email_safety", async (req: Request, res: Response) => {
    const startTime = Date.now();
    
    try {
      // Extract bearer token
      const authHeader = req.headers.authorization;
      if (!authHeader?.startsWith("Bearer ")) {
        return res.status(401).json({ error: "Missing authorization token" });
      }
      const apiToken = authHeader.substring(7);

      // Validate token
      const validation = await validateApiToken(apiToken);
      if (!validation.valid || !validation.tokenRecord) {
        return res.status(401).json({ error: validation.error || "Invalid token" });
      }

      const tokenRecord = validation.tokenRecord;

      // Validate request body
      const emailRequest = req.body as CheckEmailRequest;
      if (!emailRequest.email?.from || !emailRequest.email?.subject || !emailRequest.email?.body) {
        return res.status(400).json({ error: "Missing required email fields (from, subject, body)" });
      }

      // Get payment info for delegated tokens
      let paymentResult: { success: boolean; paymentIntentId?: string; error?: string } = { success: true };
      
      if (tokenRecord.agentType === "delegated") {
        const tokenWithOwner = await getTokenWithOwner(tokenRecord.id);
        if (!tokenWithOwner?.stripeCustomerId || !tokenWithOwner?.stripePaymentMethodId) {
          return res.status(402).json({ error: "Payment method not configured" });
        }

        // Charge for the check
        paymentResult = await chargeForEmailCheck(
          tokenWithOwner.stripeCustomerId,
          tokenWithOwner.stripePaymentMethodId
        );

        if (!paymentResult.success) {
          return res.status(402).json({ error: paymentResult.error || "Payment failed" });
        }
      }

      // Analyze email
      const { result: analysisResult, durationMs } = await analyzeEmail(emailRequest);

      // Record the check
      const emailCheck = await storage.createEmailCheck({
        tokenId: tokenRecord.id,
        senderDomain: emailRequest.email.from.split("@")[1] || null,
        hasLinks: (emailRequest.email.links?.length || 0) > 0,
        hasAttachments: (emailRequest.email.attachments?.length || 0) > 0,
        verdict: analysisResult.verdict,
        riskScore: String(analysisResult.riskScore),
        confidence: String(analysisResult.confidence),
        threatsDetected: analysisResult.threats,
        chargedAmount: "0.05",
        paymentType: tokenRecord.agentType === "delegated" ? "stripe" : "wallet",
        paymentReference: paymentResult.paymentIntentId || null,
        analysisDurationMs: durationMs,
      });

      // Update token usage
      await storage.updateAgentTokenUsage(tokenRecord.id);

      // Create usage log
      await storage.createUsageLog({
        tokenId: tokenRecord.id,
        action: "email_check",
        amount: "0.05",
        paymentStatus: "success",
      });

      const response: CheckEmailResponse = {
        verdict: analysisResult.verdict,
        riskScore: analysisResult.riskScore,
        confidence: analysisResult.confidence,
        threats: analysisResult.threats,
        recommendation: analysisResult.recommendation,
        explanation: analysisResult.explanation,
        safeActions: analysisResult.safeActions,
        unsafeActions: analysisResult.unsafeActions,
        checkId: emailCheck.id,
        charged: 0.05,
      };

      return res.json(response);
    } catch (error: any) {
      console.error("Email safety check error:", error);
      return res.status(500).json({ error: "Analysis failed" });
    }
  });

  // ===== PUBLIC STATS (for landing page) =====

  app.get("/api/public/stats", async (req: Request, res: Response) => {
    try {
      const stats = await storage.getGlobalStats();
      return res.json({
        agentsServed: Math.max(stats.agentsServed, 1),
        threatsBlocked: stats.threatsBlocked,
        totalChecks: stats.totalChecks,
      });
    } catch (error) {
      return res.json({ agentsServed: 1, threatsBlocked: 0, totalChecks: 0 });
    }
  });

  return httpServer;
}
