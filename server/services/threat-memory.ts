import { storage } from "../storage";
import type { ThreatIntel, InsertScamPattern } from "@shared/schema";
import crypto from "crypto";

const INTEL_TTL_HOURS = 24;
const INTEL_TTL_MS = INTEL_TTL_HOURS * 60 * 60 * 1000;

export interface StoredThreatIntel {
  verdict: string;
  threatTypes: string[];
  summary: string;
  confidence: number;
  hitCount: number;
  source: string;
}

export interface DomainContext {
  totalChecks: number;
  dangerousCount: number;
  suspiciousCount: number;
  safeCount: number;
  avgRiskScore: number;
  computedTrustScore: number;
  previousPatterns: string[];
  vtMaliciousCount: number;
  webRiskFlagCount: number;
}

export async function lookupStoredIntel(
  indicatorType: string,
  indicatorValue: string,
  source?: string,
): Promise<StoredThreatIntel | null> {
  try {
    const intel = await storage.getThreatIntel(indicatorType, indicatorValue, source);
    if (!intel) return null;

    return {
      verdict: intel.verdict,
      threatTypes: Array.isArray(intel.threatTypes) ? intel.threatTypes as string[] : [],
      summary: intel.summary || "",
      confidence: intel.confidence ? parseFloat(intel.confidence) : 0.5,
      hitCount: intel.hitCount,
      source: intel.source,
    };
  } catch (e) {
    console.error("[ThreatMemory] lookup error:", e);
    return null;
  }
}

export async function lookupDomainIntelFromAllSources(domain: string): Promise<StoredThreatIntel[]> {
  try {
    const results: StoredThreatIntel[] = [];
    const lookups = ["virustotal", "webrisk", "pattern"].map(async (source) => {
      const intel = await lookupStoredIntel("domain", domain, source);
      if (intel) results.push(intel);
    });
    await Promise.all(lookups);
    return results;
  } catch {
    return [];
  }
}

export function storeVTResult(
  indicatorType: string,
  indicatorValue: string,
  malicious: number,
  suspicious: number,
  totalEngines: number,
  summary: string,
): void {
  const verdict = malicious > 0 ? "malicious" : suspicious > 0 ? "suspicious" : "safe";
  const confidence = totalEngines > 0 ? Math.min(1, (malicious + suspicious + 10) / totalEngines) : 0.5;

  storage.upsertThreatIntel({
    indicatorType,
    indicatorValue,
    source: "virustotal",
    verdict,
    threatTypes: malicious > 0 ? ["malware"] : suspicious > 0 ? ["suspicious"] : [],
    rawData: { malicious, suspicious, totalEngines },
    summary,
    confidence: String(Math.round(confidence * 100) / 100),
    expiresAt: new Date(Date.now() + INTEL_TTL_MS),
  }).catch(e => console.error("[ThreatMemory] VT store error:", e));
}

export function storeWebRiskResult(
  indicatorType: string,
  indicatorValue: string,
  safe: boolean,
  threats: Array<{ threatType: string }>,
  summary: string,
): void {
  const verdict = safe ? "safe" : "malicious";
  const threatTypes = threats.map(t => t.threatType);

  storage.upsertThreatIntel({
    indicatorType,
    indicatorValue,
    source: "webrisk",
    verdict,
    threatTypes,
    rawData: { safe, threats },
    summary,
    confidence: safe ? "0.80" : "0.95",
    expiresAt: new Date(Date.now() + INTEL_TTL_MS),
  }).catch(e => console.error("[ThreatMemory] WR store error:", e));
}

export function recordScamDetection(
  patterns: Array<{
    patternType: string;
    severity: string;
    description: string;
  }>,
  senderDomain: string | null,
  verdict: string,
  riskScore: number,
  toolName: string,
  emailCheckId?: string,
  subject?: string,
): void {
  if (patterns.length === 0) return;

  const subjectFingerprint = subject
    ? crypto.createHash("sha256").update(subject.toLowerCase().trim()).digest("hex").substring(0, 16)
    : null;

  const inserts: InsertScamPattern[] = patterns.map(p => ({
    patternType: p.patternType,
    senderDomain: senderDomain?.toLowerCase() || null,
    verdict,
    riskScore: String(riskScore),
    evidence: { severity: p.severity, description: p.description },
    subjectFingerprint,
    toolName,
    emailCheckId: emailCheckId || null,
  }));

  storage.recordScamPatterns(inserts).catch(e => console.error("[ThreatMemory] pattern store error:", e));
}

export function updateDomainReputation(
  domain: string,
  verdict: string,
  riskScore: number,
  extraData?: {
    dmarcStatus?: string;
    domainAgeDays?: number;
    vtMaliciousCount?: number;
    vtSuspiciousCount?: number;
    webRiskFlagCount?: number;
  },
): void {
  storage.upsertDomainReputation(domain, verdict, riskScore, extraData)
    .catch(e => console.error("[ThreatMemory] domain rep error:", e));
}

export async function getDomainContext(domain: string): Promise<DomainContext | null> {
  try {
    const [rep, patternStats] = await Promise.all([
      storage.getDomainReputation(domain.toLowerCase()),
      storage.getScamPatternStats(domain.toLowerCase()),
    ]);

    if (!rep && patternStats.total === 0) return null;

    return {
      totalChecks: rep?.totalChecks || 0,
      dangerousCount: rep?.dangerousCount || 0,
      suspiciousCount: rep?.suspiciousCount || 0,
      safeCount: rep?.safeCount || 0,
      avgRiskScore: rep?.avgRiskScore ? parseFloat(rep.avgRiskScore) : 0,
      computedTrustScore: rep?.computedTrustScore ? parseFloat(rep.computedTrustScore) : 0.5,
      previousPatterns: Object.keys(patternStats.byType),
      vtMaliciousCount: rep?.vtMaliciousCount || 0,
      webRiskFlagCount: rep?.webRiskFlagCount || 0,
    };
  } catch (e) {
    console.error("[ThreatMemory] domain context error:", e);
    return null;
  }
}

export function buildHistoricalContextPrompt(ctx: DomainContext | null): string {
  if (!ctx || ctx.totalChecks === 0) return "";

  const lines: string[] = ["HISTORICAL INTELLIGENCE (from our database):"];
  lines.push(`- Domain checked ${ctx.totalChecks} time(s) previously`);
  lines.push(`- Previous verdicts: ${ctx.dangerousCount} dangerous, ${ctx.suspiciousCount} suspicious, ${ctx.safeCount} safe`);
  lines.push(`- Average risk score: ${(ctx.avgRiskScore * 100).toFixed(0)}%`);
  lines.push(`- Computed trust score: ${(ctx.computedTrustScore * 100).toFixed(0)}%`);

  if (ctx.vtMaliciousCount > 0) lines.push(`- VirusTotal has flagged this domain as malicious ${ctx.vtMaliciousCount} time(s)`);
  if (ctx.webRiskFlagCount > 0) lines.push(`- Google Web Risk has flagged this domain ${ctx.webRiskFlagCount} time(s)`);
  if (ctx.previousPatterns.length > 0) lines.push(`- Previous scam patterns detected: ${ctx.previousPatterns.join(", ")}`);

  if (ctx.dangerousCount > 0) {
    lines.push(`\nWARNING: This domain has been previously flagged as dangerous. Treat with extreme caution and score accordingly.`);
  }

  return "\n" + lines.join("\n");
}
