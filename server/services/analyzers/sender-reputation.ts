import { callClaude, parseJsonResponse, clampScore, sanitizeSeverity, type ThreatItem } from "./base";
import { getDomainIntelligence, type DomainIntelligence } from "../domain-intel";

const PROMPT = `You are a sender identity and reputation analyzer. Your job is to determine if an email sender is who they claim to be. You protect AI agents from Business Email Compromise (BEC), impersonation, and spoofing attacks.

SENDER INFORMATION:
Email: {email}
Display Name: {displayName}
Reply-To: {replyTo}
Email Subject: {emailSubject}
Email Snippet: {emailSnippet}

DOMAIN INTELLIGENCE (from live infrastructure checks):
DMARC Record Exists: {dmarcExists}
DMARC Policy: {dmarcPolicy}
DMARC Record: {dmarcRecord}
Domain Registration Date: {registrationDate}
Domain Age (days): {domainAge}
Registrar: {registrar}

VIRUSTOTAL DOMAIN REPUTATION (from 70+ security engines):
{vtSummary}
Malicious detections: {vtMalicious}
Suspicious detections: {vtSuspicious}
Total engines scanned: {vtTotal}
VirusTotal reputation score: {vtReputation}
Domain categories: {vtCategories}

Analyze this sender for ALL of these issue categories:
1. DOMAIN_SPOOFING - Email domain doesn't match claimed organization
2. REPLY_TO_MISMATCH - Reply-To differs from sender address
3. DISPLAY_NAME_FRAUD - Display name crafted to impersonate authority
4. AUTHENTICATION_FAILURE - DMARC/SPF/DKIM issues (use the DMARC data above)
5. BEC_INDICATORS - Business Email Compromise patterns
6. FIRST_CONTACT_RISK - No prior relationship with sender
7. AUTHORITY_CLAIM - Claiming executive status to pressure action
8. DOMAIN_AGE_RISK - Domain registered very recently (use the domain age data above)
9. NO_DMARC_POLICY - Domain has no DMARC record published

Respond ONLY with valid JSON in this exact format:
{
  "senderVerdict": "trusted" | "unverified" | "suspicious" | "likely_fraudulent",
  "trustScore": <number 0.0 to 1.0>,
  "confidence": <number 0.0 to 1.0>,
  "identityIssues": [
    {
      "type": "...",
      "description": "...",
      "severity": "low" | "medium" | "high" | "critical"
    }
  ],
  "becProbability": <number 0.0 to 1.0>,
  "recommendation": "trust_sender" | "verify_identity" | "do_not_trust",
  "explanation": "2-3 sentence summary",
  "verificationSteps": ["steps to verify this sender's identity"]
}`;

export interface SenderReputationResult {
  senderVerdict: string;
  trustScore: number;
  confidence: number;
  identityIssues: ThreatItem[];
  becProbability: number;
  recommendation: string;
  explanation: string;
  verificationSteps: string[];
  domainIntelligence: {
    dmarcExists: boolean;
    dmarcPolicy: string | null;
    dmarcRecord: string | null;
    domainAgeDays: number | null;
    registrationDate: string | null;
    registrar: string | null;
    virusTotal?: {
      found: boolean;
      malicious: number;
      suspicious: number;
      totalEngines: number;
      reputation: number;
      summary: string;
    };
  };
}

export async function analyzeSender(input: {
  email: string;
  displayName: string;
  replyTo?: string;
  emailSubject?: string;
  emailSnippet?: string;
}): Promise<{ result: SenderReputationResult; durationMs: number }> {
  const startTime = Date.now();

  const domain = input.email.split("@")[1] || "";
  let domainIntel: DomainIntelligence | null = null;

  try {
    domainIntel = await getDomainIntelligence(domain);
  } catch (e) {
    console.error("Domain intelligence lookup failed:", e);
  }

  const dmarcExists = domainIntel?.dmarc.exists ?? false;
  const dmarcPolicy = domainIntel?.dmarc.policy ?? null;
  const dmarcRecord = domainIntel?.dmarc.record ?? null;
  const registrationDate = domainIntel?.domainAge.registrationDate ?? null;
  const domainAgeDays = domainIntel?.domainAge.ageInDays ?? null;
  const registrar = domainIntel?.domainAge.registrar ?? null;
  const vt = domainIntel?.virusTotal ?? null;

  try {
    const prompt = PROMPT
      .replace("{email}", input.email)
      .replace("{displayName}", input.displayName)
      .replace("{replyTo}", input.replyTo || "Same as sender")
      .replace("{emailSubject}", input.emailSubject || "Not provided")
      .replace("{emailSnippet}", (input.emailSnippet || "Not provided").substring(0, 500))
      .replace("{dmarcExists}", String(dmarcExists))
      .replace("{dmarcPolicy}", dmarcPolicy || "None found")
      .replace("{dmarcRecord}", dmarcRecord || "No DMARC record")
      .replace("{registrationDate}", registrationDate || "Unknown")
      .replace("{domainAge}", domainAgeDays !== null ? String(domainAgeDays) : "Unknown")
      .replace("{registrar}", registrar || "Unknown")
      .replace("{vtSummary}", vt?.summary || "VirusTotal data unavailable")
      .replace("{vtMalicious}", String(vt?.malicious ?? "N/A"))
      .replace("{vtSuspicious}", String(vt?.suspicious ?? "N/A"))
      .replace("{vtTotal}", String(vt?.totalEngines ?? "N/A"))
      .replace("{vtReputation}", String(vt?.reputation ?? "N/A"))
      .replace("{vtCategories}", vt?.categories ? Object.entries(vt.categories).map(([k, v]) => `${k}: ${v}`).join(", ") || "None" : "N/A");

    const { text } = await callClaude(prompt, 1024);

    const fallback = {
      senderVerdict: "unverified", trustScore: 0.5, confidence: 0.5,
      identityIssues: [], becProbability: 0.3,
      recommendation: "verify_identity", explanation: "Analysis encountered an issue.",
      verificationSteps: ["Verify sender identity through an independent channel"],
    };

    const parsed = parseJsonResponse(text, fallback);

    const result: SenderReputationResult = {
      senderVerdict: ["trusted", "unverified", "suspicious", "likely_fraudulent"].includes(parsed.senderVerdict) ? parsed.senderVerdict : "unverified",
      trustScore: clampScore(parsed.trustScore),
      confidence: clampScore(parsed.confidence, 0.7),
      identityIssues: (parsed.identityIssues || []).map((i: any) => ({
        type: String(i.type || "UNKNOWN"),
        description: String(i.description || ""),
        severity: sanitizeSeverity(i.severity),
      })),
      becProbability: clampScore(parsed.becProbability, 0.3),
      recommendation: ["trust_sender", "verify_identity", "do_not_trust"].includes(parsed.recommendation) ? parsed.recommendation : "verify_identity",
      explanation: String(parsed.explanation || "Analysis completed."),
      verificationSteps: Array.isArray(parsed.verificationSteps) ? parsed.verificationSteps.map(String) : [],
      domainIntelligence: {
        dmarcExists, dmarcPolicy, dmarcRecord,
        domainAgeDays, registrationDate, registrar,
        virusTotal: vt ? { found: vt.found, malicious: vt.malicious, suspicious: vt.suspicious, totalEngines: vt.totalEngines, reputation: vt.reputation, summary: vt.summary } : undefined,
      },
    };

    if (vt && vt.malicious > 0) {
      result.senderVerdict = "likely_fraudulent";
      result.trustScore = Math.min(result.trustScore, 0.15);
      result.recommendation = "do_not_trust";
      result.identityIssues.push({
        type: "VIRUSTOTAL_MALICIOUS",
        description: `Domain flagged as malicious by ${vt.malicious} of ${vt.totalEngines} security engines on VirusTotal`,
        severity: "critical",
      });
    }

    return { result, durationMs: Date.now() - startTime };
  } catch (error) {
    console.error("Claude API error (sender-reputation):", error);
    return {
      result: {
        senderVerdict: "unverified", trustScore: 0.5, confidence: 0.4,
        identityIssues: [], becProbability: 0.3,
        recommendation: "verify_identity",
        explanation: "AI analysis temporarily unavailable. Domain intelligence was collected.",
        verificationSteps: ["Verify sender identity through an independent channel"],
        domainIntelligence: {
          dmarcExists, dmarcPolicy, dmarcRecord,
          domainAgeDays, registrationDate, registrar,
          virusTotal: vt ? { found: vt.found, malicious: vt.malicious, suspicious: vt.suspicious, totalEngines: vt.totalEngines, reputation: vt.reputation, summary: vt.summary } : undefined,
        },
      },
      durationMs: Date.now() - startTime,
    };
  }
}
