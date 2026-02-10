import { sql } from "drizzle-orm";
import { pgTable, text, varchar, timestamp, decimal, integer, boolean, jsonb, index } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// Owners (humans who delegate to agents)
export const owners = pgTable("owners", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  email: varchar("email", { length: 255 }).notNull().unique(),
  passwordHash: varchar("password_hash", { length: 255 }).notNull(),
  stripeCustomerId: varchar("stripe_customer_id", { length: 255 }),
  stripePaymentMethodId: varchar("stripe_payment_method_id", { length: 255 }),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// Agent Tokens (both delegated and autonomous)
export const agentTokens = pgTable("agent_tokens", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  ownerId: varchar("owner_id").references(() => owners.id),
  tokenHash: varchar("token_hash", { length: 255 }).notNull(),
  agentName: varchar("agent_name", { length: 255 }).notNull(),
  agentType: varchar("agent_type", { length: 50 }).notNull(), // 'delegated' or 'autonomous'
  
  // For delegated agents
  scopes: jsonb("scopes").default(["email_check"]),
  limits: jsonb("limits").default({ maxPerMonth: 100, pricePerCheck: 0.01 }),
  
  // For autonomous agents
  walletAddress: varchar("wallet_address", { length: 255 }),
  walletType: varchar("wallet_type", { length: 50 }), // 'ethereum', 'solana', 'platform_credits'
  
  // Usage tracking
  usageThisMonth: integer("usage_this_month").default(0).notNull(),
  totalUsage: integer("total_usage").default(0).notNull(),
  totalSpent: decimal("total_spent", { precision: 10, scale: 4 }).default("0").notNull(),
  
  // Status
  status: varchar("status", { length: 50 }).default("active").notNull(), // 'active', 'suspended', 'revoked'
  
  // Referral tracking
  referralCode: varchar("referral_code", { length: 50 }).unique(),
  referredBy: varchar("referred_by"),
  
  createdAt: timestamp("created_at").defaultNow().notNull(),
  expiresAt: timestamp("expires_at"),
  lastUsedAt: timestamp("last_used_at"),
}, (table) => [
  index("idx_agent_tokens_owner").on(table.ownerId),
  index("idx_agent_tokens_status").on(table.status),
]);

// Email Safety Checks (audit trail and analytics)
export const emailChecks = pgTable("email_checks", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  tokenId: varchar("token_id").references(() => agentTokens.id).notNull(),
  
  // Request data (anonymized - no full email content stored)
  senderDomain: varchar("sender_domain", { length: 255 }),
  hasLinks: boolean("has_links").default(false),
  hasAttachments: boolean("has_attachments").default(false),
  
  // Results
  verdict: varchar("verdict", { length: 50 }).notNull(), // 'safe', 'suspicious', 'dangerous'
  riskScore: decimal("risk_score", { precision: 3, scale: 2 }),
  confidence: decimal("confidence", { precision: 3, scale: 2 }),
  threatsDetected: jsonb("threats_detected"), // Array of threat types
  
  // Billing
  chargedAmount: decimal("charged_amount", { precision: 10, scale: 4 }),
  paymentType: varchar("payment_type", { length: 50 }), // 'stripe', 'wallet'
  paymentReference: varchar("payment_reference", { length: 255 }),
  
  // Timing
  analysisDurationMs: integer("analysis_duration_ms"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
}, (table) => [
  index("idx_email_checks_token").on(table.tokenId),
  index("idx_email_checks_created").on(table.createdAt),
]);

// Pending Registrations (for agent-first flow)
export const pendingRegistrations = pgTable("pending_registrations", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  agentName: varchar("agent_name", { length: 255 }).notNull(),
  ownerEmail: varchar("owner_email", { length: 255 }),
  setupToken: varchar("setup_token", { length: 255 }).unique().notNull(),
  status: varchar("status", { length: 50 }).default("pending").notNull(), // 'pending', 'completed', 'expired'
  createdAt: timestamp("created_at").defaultNow().notNull(),
  expiresAt: timestamp("expires_at").default(sql`NOW() + INTERVAL '24 hours'`).notNull(),
});

// Referral Agents (our MoltBook bots)
export const referralAgents = pgTable("referral_agents", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: varchar("name", { length: 255 }).notNull(),
  moltbookHandle: varchar("moltbook_handle", { length: 255 }),
  openclawConfig: jsonb("openclaw_config"),
  lastPostAt: timestamp("last_post_at"),
  postCount: integer("post_count").default(0).notNull(),
  referralsGenerated: integer("referrals_generated").default(0).notNull(),
  status: varchar("status", { length: 50 }).default("active").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// Usage Logs (for billing reconciliation)
export const usageLogs = pgTable("usage_logs", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  tokenId: varchar("token_id").references(() => agentTokens.id).notNull(),
  action: varchar("action", { length: 50 }).notNull(), // 'email_check'
  amount: decimal("amount", { precision: 10, scale: 4 }).notNull(),
  paymentStatus: varchar("payment_status", { length: 50 }), // 'success', 'failed', 'pending'
  createdAt: timestamp("created_at").defaultNow().notNull(),
}, (table) => [
  index("idx_usage_logs_token").on(table.tokenId),
]);

// ===== Insert Schemas =====

export const insertOwnerSchema = createInsertSchema(owners).omit({
  id: true,
  passwordHash: true,
  stripeCustomerId: true,
  stripePaymentMethodId: true,
  createdAt: true,
  updatedAt: true,
}).extend({
  password: z.string().min(8, "Password must be at least 8 characters"),
});

export const insertAgentTokenSchema = createInsertSchema(agentTokens).omit({
  id: true,
  tokenHash: true,
  usageThisMonth: true,
  totalUsage: true,
  totalSpent: true,
  status: true,
  createdAt: true,
  lastUsedAt: true,
});

export const insertEmailCheckSchema = createInsertSchema(emailChecks).omit({
  id: true,
  createdAt: true,
});

export const insertPendingRegistrationSchema = createInsertSchema(pendingRegistrations).omit({
  id: true,
  status: true,
  createdAt: true,
  expiresAt: true,
});

export const insertReferralAgentSchema = createInsertSchema(referralAgents).omit({
  id: true,
  lastPostAt: true,
  postCount: true,
  referralsGenerated: true,
  status: true,
  createdAt: true,
});

export const insertUsageLogSchema = createInsertSchema(usageLogs).omit({
  id: true,
  createdAt: true,
});

// ===== Types =====

export type Owner = typeof owners.$inferSelect;
export type InsertOwner = z.infer<typeof insertOwnerSchema>;

export type AgentToken = typeof agentTokens.$inferSelect;
export type InsertAgentToken = z.infer<typeof insertAgentTokenSchema>;

export type EmailCheck = typeof emailChecks.$inferSelect;
export type InsertEmailCheck = z.infer<typeof insertEmailCheckSchema>;

export type PendingRegistration = typeof pendingRegistrations.$inferSelect;
export type InsertPendingRegistration = z.infer<typeof insertPendingRegistrationSchema>;

export type ReferralAgent = typeof referralAgents.$inferSelect;
export type InsertReferralAgent = z.infer<typeof insertReferralAgentSchema>;

export type UsageLog = typeof usageLogs.$inferSelect;
export type InsertUsageLog = z.infer<typeof insertUsageLogSchema>;

// ===== API Types =====

export type AgentType = 'delegated' | 'autonomous';
export type TokenStatus = 'active' | 'suspended' | 'revoked';
export type WalletType = 'ethereum' | 'solana' | 'platform_credits';
export type Verdict = 'safe' | 'suspicious' | 'dangerous';

export interface TokenLimits {
  maxPerMonth: number;
  pricePerCheck: number;
}

export interface ThreatDetected {
  type: string;
  description: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
}

export interface CheckEmailRequest {
  email: {
    from: string;
    subject: string;
    body: string;
    links?: string[];
    attachments?: Array<{ name: string; size: number; type?: string }>;
  };
  context?: {
    knownSender?: boolean;
    previousCorrespondence?: boolean;
    agentCapabilities?: string[];
  };
}

export interface CheckEmailResponse {
  verdict: Verdict;
  riskScore: number;
  confidence: number;
  threats: ThreatDetected[];
  recommendation: 'proceed' | 'proceed_with_caution' | 'do_not_act';
  explanation: string;
  safeActions: string[];
  unsafeActions: string[];
  checkId: string;
  charged: number;
  termsOfService?: string;
  termsAccepted?: string;
}

export interface DiscoveryResponse {
  service: string;
  version: string;
  description: string;
  capabilities: string[];
  domainFocus: string;
  pricing: {
    perCheck: number;
    currency: string;
  };
  paymentMethods: string[];
  endpoints: {
    register: {
      delegated: string;
      autonomous: string;
      skyfire?: string;
    };
    tools: {
      checkEmailSafety: string;
    };
  };
  documentation: string;
  termsOfService?: string;
  termsNotice?: string;
  trustSignals: {
    uptime: string;
    avgResponseMs: number;
    agentsServed: number;
    threatsBlocked: number;
  };
}

// Login schema
export const loginSchema = z.object({
  email: z.string().email("Invalid email address"),
  password: z.string().min(1, "Password is required"),
});

export type LoginInput = z.infer<typeof loginSchema>;

// Token creation schema
export const createTokenSchema = z.object({
  agentName: z.string().min(1, "Agent name is required"),
  scopes: z.array(z.string()).default(["email_check"]),
  limits: z.object({
    maxPerMonth: z.number().min(1).max(10000).default(100),
    pricePerCheck: z.number().min(0.001).max(1).default(0.01),
  }).default({ maxPerMonth: 100, pricePerCheck: 0.01 }),
  expiresInDays: z.number().min(1).max(365).default(30),
});

export type CreateTokenInput = z.infer<typeof createTokenSchema>;
