import { eq, and, desc, sql, gte } from "drizzle-orm";
import { db } from "./db";
import {
  owners,
  agentTokens,
  emailChecks,
  pendingRegistrations,
  referralAgents,
  usageLogs,
  type Owner,
  type InsertOwner,
  type AgentToken,
  type InsertAgentToken,
  type EmailCheck,
  type InsertEmailCheck,
  type PendingRegistration,
  type InsertPendingRegistration,
  type ReferralAgent,
  type InsertReferralAgent,
  type UsageLog,
  type InsertUsageLog,
} from "@shared/schema";
import bcrypt from "bcryptjs";
import crypto from "crypto";

export interface IStorage {
  // Owner operations
  getOwner(id: string): Promise<Owner | undefined>;
  getOwnerByEmail(email: string): Promise<Owner | undefined>;
  createOwner(data: InsertOwner): Promise<Owner>;
  updateOwnerStripe(id: string, customerId: string, paymentMethodId?: string): Promise<Owner>;
  
  // Agent Token operations
  getAgentToken(id: string): Promise<AgentToken | undefined>;
  getAgentTokenByHash(tokenHash: string): Promise<AgentToken | undefined>;
  getAgentTokensByOwner(ownerId: string): Promise<AgentToken[]>;
  createAgentToken(data: InsertAgentToken & { tokenHash: string }): Promise<AgentToken>;
  updateAgentTokenUsage(id: string): Promise<void>;
  updateAgentTokenStatus(id: string, status: string): Promise<void>;
  revokeAgentToken(id: string): Promise<void>;
  
  // Email Check operations
  createEmailCheck(data: InsertEmailCheck): Promise<EmailCheck>;
  getEmailChecksByToken(tokenId: string, limit?: number): Promise<EmailCheck[]>;
  getEmailCheckStats(tokenId?: string): Promise<{ total: number; safe: number; suspicious: number; dangerous: number }>;
  
  // Pending Registration operations
  createPendingRegistration(data: InsertPendingRegistration): Promise<PendingRegistration>;
  getPendingRegistrationByToken(setupToken: string): Promise<PendingRegistration | undefined>;
  updatePendingRegistrationStatus(id: string, status: string): Promise<void>;
  
  // Referral Agent operations
  getReferralAgents(): Promise<ReferralAgent[]>;
  createReferralAgent(data: InsertReferralAgent): Promise<ReferralAgent>;
  
  // Usage Log operations
  createUsageLog(data: InsertUsageLog): Promise<UsageLog>;
  getUsageLogsByToken(tokenId: string, limit?: number): Promise<UsageLog[]>;
  
  // Stats
  getGlobalStats(): Promise<{ agentsServed: number; threatsBlocked: number; totalChecks: number }>;
}

export class DatabaseStorage implements IStorage {
  // Owner operations
  async getOwner(id: string): Promise<Owner | undefined> {
    const [owner] = await db.select().from(owners).where(eq(owners.id, id));
    return owner;
  }

  async getOwnerByEmail(email: string): Promise<Owner | undefined> {
    const [owner] = await db.select().from(owners).where(eq(owners.email, email.toLowerCase()));
    return owner;
  }

  async createOwner(data: InsertOwner): Promise<Owner> {
    const passwordHash = await bcrypt.hash(data.password, 10);
    const [owner] = await db
      .insert(owners)
      .values({
        email: data.email.toLowerCase(),
        passwordHash,
      })
      .returning();
    return owner;
  }

  async updateOwnerStripe(id: string, customerId: string, paymentMethodId?: string): Promise<Owner> {
    const updateData: Partial<Owner> = {
      stripeCustomerId: customerId,
      updatedAt: new Date(),
    };
    if (paymentMethodId) {
      updateData.stripePaymentMethodId = paymentMethodId;
    }
    const [owner] = await db
      .update(owners)
      .set(updateData)
      .where(eq(owners.id, id))
      .returning();
    return owner;
  }

  // Agent Token operations
  async getAgentToken(id: string): Promise<AgentToken | undefined> {
    const [token] = await db.select().from(agentTokens).where(eq(agentTokens.id, id));
    return token;
  }

  async getAgentTokenByHash(tokenHash: string): Promise<AgentToken | undefined> {
    const [token] = await db.select().from(agentTokens).where(eq(agentTokens.tokenHash, tokenHash));
    return token;
  }

  async getAgentTokensByOwner(ownerId: string): Promise<AgentToken[]> {
    return db.select().from(agentTokens).where(eq(agentTokens.ownerId, ownerId)).orderBy(desc(agentTokens.createdAt));
  }

  async createAgentToken(data: InsertAgentToken & { tokenHash: string }): Promise<AgentToken> {
    const referralCode = crypto.randomBytes(6).toString('hex');
    const [token] = await db
      .insert(agentTokens)
      .values({
        ...data,
        referralCode,
      })
      .returning();
    return token;
  }

  async updateAgentTokenUsage(id: string): Promise<void> {
    await db
      .update(agentTokens)
      .set({
        usageThisMonth: sql`${agentTokens.usageThisMonth} + 1`,
        totalUsage: sql`${agentTokens.totalUsage} + 1`,
        totalSpent: sql`${agentTokens.totalSpent} + 0.01`,
        lastUsedAt: new Date(),
      })
      .where(eq(agentTokens.id, id));
  }

  async updateAgentTokenStatus(id: string, status: string): Promise<void> {
    await db
      .update(agentTokens)
      .set({ status })
      .where(eq(agentTokens.id, id));
  }

  async revokeAgentToken(id: string): Promise<void> {
    await this.updateAgentTokenStatus(id, 'revoked');
  }

  // Email Check operations
  async createEmailCheck(data: InsertEmailCheck): Promise<EmailCheck> {
    const [check] = await db.insert(emailChecks).values(data).returning();
    return check;
  }

  async getEmailChecksByToken(tokenId: string, limit = 50): Promise<EmailCheck[]> {
    return db
      .select()
      .from(emailChecks)
      .where(eq(emailChecks.tokenId, tokenId))
      .orderBy(desc(emailChecks.createdAt))
      .limit(limit);
  }

  async getEmailCheckStats(tokenId?: string): Promise<{ total: number; safe: number; suspicious: number; dangerous: number }> {
    const whereClause = tokenId ? eq(emailChecks.tokenId, tokenId) : undefined;
    
    const [result] = await db
      .select({
        total: sql<number>`count(*)::int`,
        safe: sql<number>`count(*) filter (where ${emailChecks.verdict} = 'safe')::int`,
        suspicious: sql<number>`count(*) filter (where ${emailChecks.verdict} = 'suspicious')::int`,
        dangerous: sql<number>`count(*) filter (where ${emailChecks.verdict} = 'dangerous')::int`,
      })
      .from(emailChecks)
      .where(whereClause);
    
    return result || { total: 0, safe: 0, suspicious: 0, dangerous: 0 };
  }

  // Pending Registration operations
  async createPendingRegistration(data: InsertPendingRegistration): Promise<PendingRegistration> {
    const [reg] = await db.insert(pendingRegistrations).values(data).returning();
    return reg;
  }

  async getPendingRegistrationByToken(setupToken: string): Promise<PendingRegistration | undefined> {
    const [reg] = await db
      .select()
      .from(pendingRegistrations)
      .where(
        and(
          eq(pendingRegistrations.setupToken, setupToken),
          eq(pendingRegistrations.status, 'pending'),
          gte(pendingRegistrations.expiresAt, new Date())
        )
      );
    return reg;
  }

  async updatePendingRegistrationStatus(id: string, status: string): Promise<void> {
    await db
      .update(pendingRegistrations)
      .set({ status })
      .where(eq(pendingRegistrations.id, id));
  }

  // Referral Agent operations
  async getReferralAgents(): Promise<ReferralAgent[]> {
    return db.select().from(referralAgents).orderBy(desc(referralAgents.createdAt));
  }

  async createReferralAgent(data: InsertReferralAgent): Promise<ReferralAgent> {
    const [agent] = await db.insert(referralAgents).values(data).returning();
    return agent;
  }

  // Usage Log operations
  async createUsageLog(data: InsertUsageLog): Promise<UsageLog> {
    const [log] = await db.insert(usageLogs).values(data).returning();
    return log;
  }

  async getUsageLogsByToken(tokenId: string, limit = 100): Promise<UsageLog[]> {
    return db
      .select()
      .from(usageLogs)
      .where(eq(usageLogs.tokenId, tokenId))
      .orderBy(desc(usageLogs.createdAt))
      .limit(limit);
  }

  // Stats
  async getGlobalStats(): Promise<{ agentsServed: number; threatsBlocked: number; totalChecks: number }> {
    const [tokenCount] = await db
      .select({ count: sql<number>`count(*)::int` })
      .from(agentTokens)
      .where(eq(agentTokens.status, 'active'));

    const checkStats = await this.getEmailCheckStats();
    
    return {
      agentsServed: tokenCount?.count || 0,
      threatsBlocked: checkStats.suspicious + checkStats.dangerous,
      totalChecks: checkStats.total,
    };
  }
}

export const storage = new DatabaseStorage();
