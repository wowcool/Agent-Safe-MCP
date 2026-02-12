import { eq, and, desc, sql, gte } from "drizzle-orm";
import { db } from "./db";
import {
  owners,
  agentTokens,
  emailChecks,
  pendingRegistrations,
  referralAgents,
  usageLogs,
  threatIntel,
  scamPatterns,
  domainReputation,
  agentFeedback,
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
  type ThreatIntel,
  type InsertThreatIntel,
  type ScamPattern,
  type InsertScamPattern,
  type DomainReputation,
  type InsertDomainReputation,
  type AgentFeedback,
  type InsertAgentFeedback,
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

  // Threat Intelligence operations
  getThreatIntel(indicatorType: string, indicatorValue: string, source?: string): Promise<ThreatIntel | undefined>;
  upsertThreatIntel(data: InsertThreatIntel): Promise<ThreatIntel>;
  getExpiredThreatIntel(limit?: number): Promise<ThreatIntel[]>;

  // Scam Pattern operations
  recordScamPatterns(patterns: InsertScamPattern[]): Promise<ScamPattern[]>;
  getScamPatternsByDomain(domain: string, limit?: number): Promise<ScamPattern[]>;
  getScamPatternStats(domain: string): Promise<{ total: number; byType: Record<string, number> }>;

  // Domain Reputation operations
  getDomainReputation(domain: string): Promise<DomainReputation | undefined>;
  upsertDomainReputation(domain: string, verdict: string, riskScore: number, extraData?: Partial<InsertDomainReputation>): Promise<DomainReputation>;

  // Agent Feedback operations
  createAgentFeedback(data: InsertAgentFeedback): Promise<AgentFeedback>;
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
        totalSpent: sql`${agentTokens.totalSpent} + 0.02`,
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

  // Threat Intelligence operations
  async getThreatIntel(indicatorType: string, indicatorValue: string, source?: string): Promise<ThreatIntel | undefined> {
    const conditions = [
      eq(threatIntel.indicatorType, indicatorType),
      eq(threatIntel.indicatorValue, indicatorValue.toLowerCase()),
      gte(threatIntel.expiresAt, new Date()),
    ];
    if (source) conditions.push(eq(threatIntel.source, source));

    const [result] = await db.select().from(threatIntel)
      .where(and(...conditions))
      .orderBy(desc(threatIntel.lastSeenAt))
      .limit(1);
    return result;
  }

  async upsertThreatIntel(data: InsertThreatIntel): Promise<ThreatIntel> {
    const normalizedValue = data.indicatorValue.toLowerCase();
    const existing = await this.getThreatIntel(data.indicatorType, normalizedValue, data.source);

    if (existing) {
      const [updated] = await db.update(threatIntel)
        .set({
          verdict: data.verdict,
          threatTypes: data.threatTypes,
          rawData: data.rawData,
          summary: data.summary,
          confidence: data.confidence,
          hitCount: sql`${threatIntel.hitCount} + 1`,
          lastSeenAt: new Date(),
          expiresAt: data.expiresAt,
        })
        .where(eq(threatIntel.id, existing.id))
        .returning();
      return updated;
    }

    const [created] = await db.insert(threatIntel)
      .values({ ...data, indicatorValue: normalizedValue })
      .returning();
    return created;
  }

  async getExpiredThreatIntel(limit = 100): Promise<ThreatIntel[]> {
    return db.select().from(threatIntel)
      .where(sql`${threatIntel.expiresAt} < NOW()`)
      .limit(limit);
  }

  // Scam Pattern operations
  async recordScamPatterns(patterns: InsertScamPattern[]): Promise<ScamPattern[]> {
    if (patterns.length === 0) return [];
    const results = await db.insert(scamPatterns).values(patterns).returning();
    return results;
  }

  async getScamPatternsByDomain(domain: string, limit = 50): Promise<ScamPattern[]> {
    return db.select().from(scamPatterns)
      .where(eq(scamPatterns.senderDomain, domain.toLowerCase()))
      .orderBy(desc(scamPatterns.createdAt))
      .limit(limit);
  }

  async getScamPatternStats(domain: string): Promise<{ total: number; byType: Record<string, number> }> {
    const patterns = await db.select({
      patternType: scamPatterns.patternType,
      count: sql<number>`count(*)::int`,
    })
      .from(scamPatterns)
      .where(eq(scamPatterns.senderDomain, domain.toLowerCase()))
      .groupBy(scamPatterns.patternType);

    const byType: Record<string, number> = {};
    let total = 0;
    for (const p of patterns) {
      byType[p.patternType] = p.count;
      total += p.count;
    }
    return { total, byType };
  }

  // Domain Reputation operations
  async getDomainReputation(domain: string): Promise<DomainReputation | undefined> {
    const [result] = await db.select().from(domainReputation)
      .where(eq(domainReputation.domain, domain.toLowerCase()));
    return result;
  }

  async upsertDomainReputation(domain: string, verdict: string, riskScore: number, extraData?: Partial<InsertDomainReputation>): Promise<DomainReputation> {
    const normalizedDomain = domain.toLowerCase();
    const existing = await this.getDomainReputation(normalizedDomain);

    if (existing) {
      const newTotal = (existing.totalChecks || 0) + 1;
      const oldAvg = existing.avgRiskScore ? parseFloat(existing.avgRiskScore) : 0;
      const newAvg = ((oldAvg * (existing.totalChecks || 0)) + riskScore) / newTotal;

      const updateData: Record<string, any> = {
        totalChecks: newTotal,
        avgRiskScore: String(Math.round(newAvg * 10000) / 10000),
        lastSeenAt: new Date(),
      };

      if (verdict === "dangerous") updateData.dangerousCount = sql`${domainReputation.dangerousCount} + 1`;
      else if (verdict === "suspicious") updateData.suspiciousCount = sql`${domainReputation.suspiciousCount} + 1`;
      else updateData.safeCount = sql`${domainReputation.safeCount} + 1`;

      if (extraData?.dmarcStatus) updateData.dmarcStatus = extraData.dmarcStatus;
      if (extraData?.domainAgeDays !== undefined) updateData.domainAgeDays = extraData.domainAgeDays;
      if (extraData?.vtMaliciousCount !== undefined) updateData.vtMaliciousCount = extraData.vtMaliciousCount;
      if (extraData?.vtSuspiciousCount !== undefined) updateData.vtSuspiciousCount = extraData.vtSuspiciousCount;
      if (extraData?.webRiskFlagCount !== undefined) updateData.webRiskFlagCount = extraData.webRiskFlagCount;

      const dangerousCount = (existing.dangerousCount || 0) + (verdict === "dangerous" ? 1 : 0);
      const suspiciousCount = (existing.suspiciousCount || 0) + (verdict === "suspicious" ? 1 : 0);
      const dangerousRatio = newTotal > 0 ? (dangerousCount + suspiciousCount * 0.5) / newTotal : 0;
      updateData.computedTrustScore = String(Math.round(Math.max(0, 1 - dangerousRatio) * 100) / 100);

      const [updated] = await db.update(domainReputation)
        .set(updateData)
        .where(eq(domainReputation.id, existing.id))
        .returning();
      return updated;
    }

    const trustScore = verdict === "dangerous" ? 0.2 : verdict === "suspicious" ? 0.5 : 0.8;
    const [created] = await db.insert(domainReputation)
      .values({
        domain: normalizedDomain,
        totalChecks: 1,
        dangerousCount: verdict === "dangerous" ? 1 : 0,
        suspiciousCount: verdict === "suspicious" ? 1 : 0,
        safeCount: verdict === "safe" ? 1 : 0,
        avgRiskScore: String(riskScore),
        computedTrustScore: String(trustScore),
        ...extraData,
      })
      .returning();
    return created;
  }

  // Agent Feedback operations
  async createAgentFeedback(data: InsertAgentFeedback): Promise<AgentFeedback> {
    const [feedback] = await db.insert(agentFeedback).values(data).returning();
    return feedback;
  }
}

export const storage = new DatabaseStorage();
