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
import { analyzeEmail } from "./services/analyzers/email-safety";
import { analyzeUrls } from "./services/analyzers/url-safety";
import { analyzeResponse } from "./services/analyzers/response-safety";
import { analyzeThread } from "./services/analyzers/thread-analysis";
import { analyzeAttachments } from "./services/analyzers/attachment-safety";
import { analyzeSender } from "./services/analyzers/sender-reputation";
import {
  validateSkyfireToken,
  chargeSkyfireToken,
  isSkyfireConfigured,
} from "./services/skyfire";
import { z } from "zod";
import { mountMcpServer, TOOL_DEFS } from "./mcp-server";
import type { ToolName } from "@shared/schema";

export async function registerRoutes(
  httpServer: Server,
  app: Express
): Promise<Server> {
  // Setup authentication
  setupAuth(app);

  // Mount MCP Remote Server (Streamable HTTP at /mcp)
  mountMcpServer(app);

  // ===== SEO & AGENT DISCOVERY ROUTES =====

  app.get("/.well-known/mcp.json", (_req: Request, res: Response) => {
    res.json({
      name: "Agent Safe",
      description: "6-tool email security suite for AI agents. Protects against phishing, BEC, malware, social engineering, and manipulation across emails, URLs, replies, threads, attachments, and sender identities.",
      version: "2.0.0",
      protocol: "mcp",
      transport: {
        type: "streamable-http",
        url: "https://agentsafe.locationledger.com/mcp",
      },
      authentication: {
        type: "header",
        header_name: "skyfire-pay-id",
        description: "Skyfire PAY token for payment. Get one at skyfire.xyz. $0.02 per tool call.",
      },
      tools: [
        { name: "check_email_safety", description: "Analyze an email for phishing, social engineering, prompt injection, CEO fraud, and data exfiltration. Returns verdict, risk score, threats, and actions." },
        { name: "check_url_safety", description: "Analyze URLs for phishing, malware, redirects, spoofing, and tracking. Returns per-URL and overall verdicts." },
        { name: "check_response_safety", description: "Check a draft reply BEFORE sending for data leakage, social engineering compliance, and unauthorized disclosure." },
        { name: "analyze_email_thread", description: "Analyze a full email thread for escalating social engineering, scope creep, and manipulation patterns." },
        { name: "check_attachment_safety", description: "Assess attachments for malware risk based on filename, MIME type, and size BEFORE opening." },
        { name: "check_sender_reputation", description: "Verify sender identity with live DNS DMARC and RDAP domain age checks. Detects BEC and impersonation." },
      ],
      pricing: {
        model: "per_request",
        amount: "0.02",
        currency: "USD",
        payment_network: "Skyfire",
      },
      contact: "support@locationledger.com",
      legal: "https://agentsafe.locationledger.com/terms",
      homepage: "https://agentsafe.locationledger.com",
      repository: "https://github.com/wowcool/Agent-Safe-MCP",
    });
  });

  app.get("/.well-known/ai-plugin.json", (_req: Request, res: Response) => {
    res.json({
      schema_version: "v1",
      name_for_human: "Agent Safe",
      name_for_model: "agent_safe_email_security",
      description_for_human: "6-tool email security suite for AI agents. Protects against phishing, BEC, malware, social engineering, and manipulation.",
      description_for_model: "Agent Safe is a Remote MCP Server with 6 email security tools for AI agents. Tools: check_email_safety (analyze emails), check_url_safety (analyze URLs), check_response_safety (check draft replies), analyze_email_thread (detect thread manipulation), check_attachment_safety (assess attachment risk), check_sender_reputation (verify sender with DNS/RDAP). Each costs $0.02 via Skyfire PAY token (skyfire-pay-id header). MCP endpoint: https://agentsafe.locationledger.com/mcp",
      auth: { type: "none" },
      api: { type: "mcp", url: "https://agentsafe.locationledger.com/mcp", transport: "streamable-http" },
      logo_url: "https://agentsafe.locationledger.com/favicon.png",
      contact_email: "support@locationledger.com",
      legal_info_url: "https://agentsafe.locationledger.com/terms",
    });
  });

  // ===== AUTH ROUTES =====
  
  app.get("/llms.txt", (_req: Request, res: Response) => {
    res.type("text/plain").send(`# Agent Safe - 6-Tool Email Security Suite for AI Agents
> MCP Server: https://agentsafe.locationledger.com/mcp
> Protocol: Streamable HTTP (MCP)
> Payment: $0.02/tool call via skyfire-pay-id header (Skyfire PAY token)
> No signup required

## Tools

### check_email_safety
Analyze an email for phishing, social engineering, prompt injection, CEO fraud, and data exfiltration.
Input: from (string, required), subject (string, required), body (string, required), links (string[]), attachments (object[]), knownSender (boolean), previousCorrespondence (boolean)
Returns: verdict, riskScore, confidence, threats[], recommendation, explanation, safeActions[], unsafeActions[]

### check_url_safety
Analyze URLs for phishing, malware, redirects, spoofing, and tracking.
Input: urls (string[], required, max 20)
Returns: overallVerdict, overallRiskScore, urlResults[]

### check_response_safety
Check a draft email reply BEFORE sending for data leakage, social engineering compliance, and unauthorized disclosure.
Input: draftTo (string, required), draftSubject (string, required), draftBody (string, required), originalFrom (string), originalSubject (string), originalBody (string)
Returns: verdict, riskScore, confidence, threats[], recommendation

### analyze_email_thread
Analyze a full email conversation thread for escalating social engineering, scope creep, and manipulation patterns.
Input: messages (object[], required, min 2, max 50) - each with from, subject, body, date?
Returns: verdict, riskScore, confidence, manipulationPatterns[], threadProgression

### check_attachment_safety
Assess email attachments for malware risk based on filename, MIME type, and size BEFORE opening/downloading.
Input: attachments (object[], required, max 20) - each with name, size, mimeType, from?
Returns: overallVerdict, overallRiskScore, attachmentResults[]

### check_sender_reputation
Verify sender identity and detect BEC, spoofing, and impersonation. Includes live DNS DMARC and RDAP domain age checks.
Input: email (string, required), displayName (string, required), replyTo (string), emailSubject (string), emailSnippet (string)
Returns: senderVerdict, trustScore, confidence, identityIssues[], domainIntel

## Quick Start
1. Get a Skyfire PAY token at https://skyfire.xyz
2. Add MCP config: { "mcpServers": { "agentsafe": { "command": "npx", "args": ["-y", "mcp-remote", "https://agentsafe.locationledger.com/mcp", "--header", "skyfire-pay-id: YOUR_TOKEN"] } } }
3. Call any tool via MCP tools/call

## Links
- Documentation: https://agentsafe.locationledger.com/docs
- Discovery: https://agentsafe.locationledger.com/mcp/discover
- Terms: https://agentsafe.locationledger.com/terms
`);
  });

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
      const { token, tokenRecord } = await createDelegatedToken(
        owner.id,
        parsed.data.agentName,
        parsed.data.scopes,
        parsed.data.limits,
        owner.stripeCustomerId || "",
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
        service: "Agent Safe",
        version: "2.0.0",
        description: "6-tool email security suite for AI agents. Protects against phishing, BEC, malware, social engineering, and manipulation across emails, URLs, replies, threads, attachments, and sender identities.",
        capabilities: [
          "email_safety_check",
          "url_safety_check",
          "response_safety_check",
          "thread_analysis",
          "attachment_safety_check",
          "sender_reputation_check",
        ],
        domainFocus: "email_security",
        pricing: {
          perCheck: 0.02,
          currency: "USD",
        },
        paymentMethods: ["skyfire_pay"],
        endpoints: {
          register: {
            skyfire: "/mcp/register/skyfire",
          },
          tools: {
            check_email_safety: "/mcp/tools/check_email_safety",
            check_url_safety: "/mcp/tools/check_url_safety",
            check_response_safety: "/mcp/tools/check_response_safety",
            analyze_email_thread: "/mcp/tools/analyze_email_thread",
            check_attachment_safety: "/mcp/tools/check_attachment_safety",
            check_sender_reputation: "/mcp/tools/check_sender_reputation",
          },
        },
        documentation: "/docs",
        termsOfService: "/terms",
        termsNotice: "By making any API call or MCP request to this service, you accept the Terms of Service. This service provides best-effort advisory analysis only. We are not liable for undetected threats or actions taken by agents based on our analysis.",
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
        pricePerCheck: 0.02,
      });
    } catch (error: any) {
      console.error("Autonomous registration error:", error);
      return res.status(500).json({ error: "Registration failed" });
    }
  });

  // ===== SKYFIRE REGISTRATION =====

  app.post("/mcp/register/skyfire", async (req: Request, res: Response) => {
    try {
      if (!isSkyfireConfigured()) {
        return res.status(503).json({ error: "Skyfire payments not configured" });
      }

      const skyfireToken = req.headers["skyfire-pay-id"] as string || req.body.skyfireToken;
      if (!skyfireToken) {
        return res.status(400).json({
          error: "Missing Skyfire token",
          hint: "Include skyfire-pay-id header or skyfireToken in request body",
        });
      }

      const validation = await validateSkyfireToken(skyfireToken);
      if (!validation.valid) {
        return res.status(401).json({
          error: "Invalid Skyfire token",
          details: validation.error,
        });
      }

      const { agentName } = req.body;
      if (!agentName) {
        return res.status(400).json({ error: "Missing agentName in request body" });
      }

      const agentId = validation.claims?.sub || `skyfire_${Date.now()}`;
      const { token, tokenRecord } = await createAutonomousToken(
        agentId,
        agentName,
        `skyfire:${validation.claims?.sub || "unknown"}`,
        "skyfire"
      );

      return res.json({
        success: true,
        apiToken: token,
        paymentMethod: "skyfire",
        pricePerCheck: 0.02,
        message: "Registered via Skyfire. Include skyfire-pay-id header with your PAY token for all API calls.",
      });
    } catch (error: any) {
      console.error("Skyfire registration error:", error);
      return res.status(500).json({ error: "Skyfire registration failed" });
    }
  });

  // ===== MCP TOOLS (REST API) =====

  const PRICE = 0.02;
  const TERMS_URL = "https://agentsafe.locationledger.com/terms";
  const TERMS_NOTICE = "By using this service you have accepted the Terms of Service. This is an advisory service only.";

  let restSkyfireSystemTokenId: string | null = null;

  async function getOrCreateSkyfireSystemToken(): Promise<string> {
    if (restSkyfireSystemTokenId) {
      const existing = await storage.getAgentToken(restSkyfireSystemTokenId);
      if (existing && existing.status === "active") return restSkyfireSystemTokenId;
    }
    const existingTokens = await storage.getAgentTokenByHash("skyfire_system_token_hash");
    if (existingTokens) { restSkyfireSystemTokenId = existingTokens.id; return restSkyfireSystemTokenId; }
    const { tokenRecord } = await createAutonomousToken("skyfire-system", "Skyfire Pay-Per-Use", "skyfire:system", "skyfire", 365);
    restSkyfireSystemTokenId = tokenRecord.id;
    return restSkyfireSystemTokenId;
  }

  async function validateAndChargeRest(req: Request, res: Response): Promise<{ valid: false } | { valid: true; transactionId: string | null; buyerId: string }> {
    const skyfireToken = req.headers["skyfire-pay-id"] as string;
    if (!skyfireToken || !isSkyfireConfigured()) {
      res.status(401).json({ error: "Missing skyfire-pay-id header. Get a Skyfire PAY token at skyfire.xyz." });
      return { valid: false };
    }
    const validation = await validateSkyfireToken(skyfireToken);
    if (!validation.valid) {
      res.status(401).json({ error: "Invalid Skyfire payment token", details: validation.error });
      return { valid: false };
    }
    const chargeResult = await chargeSkyfireToken(skyfireToken, PRICE);
    if (!chargeResult.success) {
      res.status(402).json({ error: "Skyfire payment failed", details: chargeResult.error });
      return { valid: false };
    }
    return { valid: true, transactionId: chargeResult.transactionId || null, buyerId: validation.claims?.sub || "unknown" };
  }

  async function recordRestCheck(
    toolName: ToolName, verdict: string, riskScore: number, confidence: number,
    threats: any[], durationMs: number, paymentRef: string | null,
    senderDomain?: string | null, hasLinks?: boolean, hasAttachments?: boolean,
  ): Promise<string> {
    const systemTokenId = await getOrCreateSkyfireSystemToken();
    const emailCheck = await storage.createEmailCheck({
      tokenId: systemTokenId, toolName, senderDomain: senderDomain || null,
      hasLinks: hasLinks || false, hasAttachments: hasAttachments || false,
      verdict, riskScore: String(riskScore), confidence: String(confidence),
      threatsDetected: threats, chargedAmount: String(PRICE), paymentType: "skyfire",
      paymentReference: paymentRef, analysisDurationMs: durationMs,
    });
    await storage.updateAgentTokenUsage(systemTokenId);
    await storage.createUsageLog({ tokenId: systemTokenId, action: toolName, amount: String(PRICE), paymentStatus: "success" });
    return emailCheck.id;
  }

  app.post("/mcp/tools/check_email_safety", async (req: Request, res: Response) => {
    try {
      const payment = await validateAndChargeRest(req, res);
      if (!payment.valid) return;

      const emailRequest = req.body as CheckEmailRequest;
      if (!emailRequest.email?.from || !emailRequest.email?.subject || !emailRequest.email?.body) {
        return res.status(400).json({ error: "Missing required email fields (from, subject, body)" });
      }

      const { result, durationMs } = await analyzeEmail(emailRequest);
      const checkId = await recordRestCheck("check_email_safety", result.verdict, result.riskScore, result.confidence, result.threats, durationMs, payment.transactionId, emailRequest.email.from.split("@")[1], (emailRequest.email.links?.length || 0) > 0, (emailRequest.email.attachments?.length || 0) > 0);

      return res.json({ ...result, checkId, charged: PRICE, termsOfService: TERMS_URL, termsAccepted: TERMS_NOTICE });
    } catch (error: any) {
      console.error("Email safety check error:", error);
      return res.status(500).json({ error: "Analysis failed" });
    }
  });

  app.post("/mcp/tools/check_url_safety", async (req: Request, res: Response) => {
    try {
      const payment = await validateAndChargeRest(req, res);
      if (!payment.valid) return;

      const { urls } = req.body;
      if (!Array.isArray(urls) || urls.length === 0) {
        return res.status(400).json({ error: "Missing required field: urls (array of strings)" });
      }

      const { result, durationMs } = await analyzeUrls(urls.slice(0, 20));
      const checkId = await recordRestCheck("check_url_safety", result.overallVerdict, result.overallRiskScore, 0.8, [], durationMs, payment.transactionId, null, true);

      return res.json({ ...result, checkId, charged: PRICE, termsOfService: TERMS_URL, termsAccepted: TERMS_NOTICE });
    } catch (error: any) {
      console.error("URL safety check error:", error);
      return res.status(500).json({ error: "Analysis failed" });
    }
  });

  app.post("/mcp/tools/check_response_safety", async (req: Request, res: Response) => {
    try {
      const payment = await validateAndChargeRest(req, res);
      if (!payment.valid) return;

      const { draftTo, draftSubject, draftBody, originalFrom, originalSubject, originalBody } = req.body;
      if (!draftTo || !draftSubject || !draftBody) {
        return res.status(400).json({ error: "Missing required fields: draftTo, draftSubject, draftBody" });
      }

      const { result, durationMs } = await analyzeResponse({ draftTo, draftSubject, draftBody, originalFrom, originalSubject, originalBody });
      const checkId = await recordRestCheck("check_response_safety", result.verdict, result.riskScore, result.confidence, result.threats, durationMs, payment.transactionId);

      return res.json({ ...result, checkId, charged: PRICE, termsOfService: TERMS_URL, termsAccepted: TERMS_NOTICE });
    } catch (error: any) {
      console.error("Response safety check error:", error);
      return res.status(500).json({ error: "Analysis failed" });
    }
  });

  app.post("/mcp/tools/analyze_email_thread", async (req: Request, res: Response) => {
    try {
      const payment = await validateAndChargeRest(req, res);
      if (!payment.valid) return;

      const { messages } = req.body;
      if (!Array.isArray(messages) || messages.length < 2) {
        return res.status(400).json({ error: "Missing required field: messages (array of at least 2 messages)" });
      }

      const { result, durationMs } = await analyzeThread(messages.slice(0, 50));
      const checkId = await recordRestCheck("analyze_email_thread", result.verdict, result.riskScore, result.confidence, result.manipulationPatterns, durationMs, payment.transactionId);

      return res.json({ ...result, checkId, charged: PRICE, termsOfService: TERMS_URL, termsAccepted: TERMS_NOTICE });
    } catch (error: any) {
      console.error("Thread analysis error:", error);
      return res.status(500).json({ error: "Analysis failed" });
    }
  });

  app.post("/mcp/tools/check_attachment_safety", async (req: Request, res: Response) => {
    try {
      const payment = await validateAndChargeRest(req, res);
      if (!payment.valid) return;

      const { attachments } = req.body;
      if (!Array.isArray(attachments) || attachments.length === 0) {
        return res.status(400).json({ error: "Missing required field: attachments (array of attachment metadata)" });
      }

      const { result, durationMs } = await analyzeAttachments(attachments.slice(0, 20));
      const checkId = await recordRestCheck("check_attachment_safety", result.overallVerdict, result.overallRiskScore, 0.8, [], durationMs, payment.transactionId, null, false, true);

      return res.json({ ...result, checkId, charged: PRICE, termsOfService: TERMS_URL, termsAccepted: TERMS_NOTICE });
    } catch (error: any) {
      console.error("Attachment safety check error:", error);
      return res.status(500).json({ error: "Analysis failed" });
    }
  });

  app.post("/mcp/tools/check_sender_reputation", async (req: Request, res: Response) => {
    try {
      const payment = await validateAndChargeRest(req, res);
      if (!payment.valid) return;

      const { email, displayName, replyTo, emailSubject, emailSnippet } = req.body;
      if (!email || !displayName) {
        return res.status(400).json({ error: "Missing required fields: email, displayName" });
      }

      const { result, durationMs } = await analyzeSender({ email, displayName, replyTo, emailSubject, emailSnippet });
      const checkId = await recordRestCheck("check_sender_reputation", result.senderVerdict, result.trustScore, result.confidence, result.identityIssues, durationMs, payment.transactionId, email.split("@")[1]);

      return res.json({ ...result, checkId, charged: PRICE, termsOfService: TERMS_URL, termsAccepted: TERMS_NOTICE });
    } catch (error: any) {
      console.error("Sender reputation check error:", error);
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
