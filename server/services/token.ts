import jwt from "jsonwebtoken";
import crypto from "crypto";
import { storage } from "../storage";
import type { AgentToken, TokenLimits } from "@shared/schema";

const JWT_SECRET = process.env.JWT_SECRET || "safemessage-jwt-secret-change-in-production";

export interface DelegatedTokenPayload {
  sub: string; // owner_id
  type: "delegated";
  tokenId: string;
  agentName: string;
  scopes: string[];
  limits: TokenLimits;
  stripeCustomerId: string;
}

export interface AutonomousTokenPayload {
  sub: string; // agent_uuid
  type: "autonomous";
  tokenId: string;
  agentId: string;
  walletAddress: string;
  walletType: string;
  limits: {
    maxPerTransaction: number;
    minBalance: number;
  };
}

export type TokenPayload = DelegatedTokenPayload | AutonomousTokenPayload;

export function generateApiToken(): string {
  const randomPart = crypto.randomBytes(24).toString("base64url");
  return `sm_live_${randomPart}`;
}

export function hashToken(token: string): string {
  return crypto.createHash("sha256").update(token).digest("hex");
}

export async function createDelegatedToken(
  ownerId: string,
  agentName: string,
  scopes: string[],
  limits: TokenLimits,
  stripeCustomerId: string,
  expiresInDays: number = 30
): Promise<{ token: string; tokenRecord: AgentToken }> {
  const rawToken = generateApiToken();
  const tokenHash = hashToken(rawToken);
  const expiresAt = new Date();
  expiresAt.setDate(expiresAt.getDate() + expiresInDays);

  const tokenRecord = await storage.createAgentToken({
    ownerId,
    tokenHash,
    agentName,
    agentType: "delegated",
    scopes,
    limits,
    expiresAt,
  });

  return { token: rawToken, tokenRecord };
}

export async function createAutonomousToken(
  agentId: string,
  agentName: string,
  walletAddress: string,
  walletType: string,
  expiresInDays: number = 30
): Promise<{ token: string; tokenRecord: AgentToken }> {
  const rawToken = generateApiToken();
  const tokenHash = hashToken(rawToken);
  const expiresAt = new Date();
  expiresAt.setDate(expiresAt.getDate() + expiresInDays);

  const tokenRecord = await storage.createAgentToken({
    tokenHash,
    agentName,
    agentType: "autonomous",
    walletAddress,
    walletType,
    scopes: ["email_check"],
    limits: { maxPerMonth: 1000, pricePerCheck: 0.02 },
    expiresAt,
  });

  return { token: rawToken, tokenRecord };
}

export async function validateApiToken(token: string): Promise<{
  valid: boolean;
  tokenRecord?: AgentToken;
  error?: string;
}> {
  try {
    if (!token.startsWith("sm_live_")) {
      return { valid: false, error: "Invalid token format" };
    }

    const tokenHash = hashToken(token);
    const tokenRecord = await storage.getAgentTokenByHash(tokenHash);

    if (!tokenRecord) {
      return { valid: false, error: "Token not found" };
    }

    if (tokenRecord.status !== "active") {
      return { valid: false, error: `Token is ${tokenRecord.status}` };
    }

    if (tokenRecord.expiresAt && new Date(tokenRecord.expiresAt) < new Date()) {
      return { valid: false, error: "Token has expired" };
    }

    // Check usage limits for delegated tokens
    if (tokenRecord.agentType === "delegated") {
      const limits = tokenRecord.limits as TokenLimits;
      if (tokenRecord.usageThisMonth >= limits.maxPerMonth) {
        return { valid: false, error: "Monthly usage limit exceeded" };
      }
    }

    return { valid: true, tokenRecord };
  } catch (error: any) {
    return { valid: false, error: error.message || "Token validation failed" };
  }
}

export async function getTokenWithOwner(tokenId: string): Promise<{
  token: AgentToken;
  stripeCustomerId?: string;
  stripePaymentMethodId?: string;
} | null> {
  const tokenRecord = await storage.getAgentToken(tokenId);
  if (!tokenRecord) return null;

  if (tokenRecord.agentType === "delegated" && tokenRecord.ownerId) {
    const owner = await storage.getOwner(tokenRecord.ownerId);
    if (owner) {
      return {
        token: tokenRecord,
        stripeCustomerId: owner.stripeCustomerId || undefined,
        stripePaymentMethodId: owner.stripePaymentMethodId || undefined,
      };
    }
  }

  return { token: tokenRecord };
}
