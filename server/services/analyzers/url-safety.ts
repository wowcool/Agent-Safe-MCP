import { callClaude, parseJsonResponse, clampScore, sanitizeSeverity, type ThreatItem } from "./base";

const PROMPT = `You are a URL security analyzer designed to protect AI agents from phishing, malware, and deceptive destinations. Analyze the following URLs and provide a security assessment.

URLs TO ANALYZE:
{urls}

Analyze EVERY URL for ALL of these threat categories:
1. PHISHING - Domain spoofing, typosquatting, lookalike domains
2. MALWARE - Known malicious patterns, suspicious file downloads
3. DATA_EXFILTRATION - URLs designed to capture/redirect sensitive data
4. REDIRECT_ABUSE - Open redirect exploitation
5. COMMAND_INJECTION - Path traversal, SQL injection in URLs
6. TRACKING - Excessive tracking parameters or fingerprinting

Respond ONLY with valid JSON in this exact format:
{
  "urls": [
    {
      "url": "<the URL>",
      "verdict": "safe" | "suspicious" | "dangerous",
      "riskScore": <number 0.0 to 1.0>,
      "threats": [{"type": "...", "description": "...", "severity": "low"|"medium"|"high"|"critical"}],
      "recommendation": "safe_to_visit" | "do_not_visit" | "visit_with_caution",
      "explanation": "<brief explanation>"
    }
  ],
  "overallVerdict": "safe" | "suspicious" | "dangerous",
  "overallRiskScore": <number 0.0 to 1.0>
}`;

export interface UrlResult {
  url: string;
  verdict: string;
  riskScore: number;
  threats: ThreatItem[];
  recommendation: string;
  explanation: string;
}

export interface UrlSafetyResult {
  urls: UrlResult[];
  overallVerdict: string;
  overallRiskScore: number;
}

function quickUrlCheck(urls: string[]): ThreatItem[] {
  const threats: ThreatItem[] = [];
  const suspiciousTLDs = [".tk", ".ml", ".ga", ".cf", ".gq"];
  const shorteners = ["bit.ly", "tinyurl.com", "t.co", "goo.gl", "is.gd", "buff.ly"];

  for (const url of urls) {
    const lower = url.toLowerCase();
    try {
      const parsed = new URL(url);
      if (parsed.protocol !== "https:") {
        threats.push({ type: "PHISHING", description: `Non-HTTPS URL: ${url.substring(0, 80)}`, severity: "medium" });
      }
      if (/^\d+\.\d+\.\d+\.\d+/.test(parsed.hostname)) {
        threats.push({ type: "PHISHING", description: `IP-based URL (no domain name): ${url.substring(0, 80)}`, severity: "high" });
      }
      if (suspiciousTLDs.some(tld => parsed.hostname.endsWith(tld))) {
        threats.push({ type: "PHISHING", description: `Suspicious TLD: ${parsed.hostname}`, severity: "medium" });
      }
      if (shorteners.some(s => parsed.hostname === s || parsed.hostname.endsWith(`.${s}`))) {
        threats.push({ type: "REDIRECT_ABUSE", description: `URL shortener detected: ${parsed.hostname}`, severity: "medium" });
      }
      if (lower.includes("..") || lower.includes("%2e%2e") || lower.includes("%00")) {
        threats.push({ type: "COMMAND_INJECTION", description: `Path traversal pattern in URL`, severity: "high" });
      }
    } catch {
      if (lower.startsWith("data:") || lower.startsWith("javascript:")) {
        threats.push({ type: "COMMAND_INJECTION", description: `Dangerous URI scheme: ${lower.substring(0, 30)}`, severity: "critical" });
      }
    }
  }
  return threats;
}

export async function analyzeUrls(urls: string[]): Promise<{ result: UrlSafetyResult; durationMs: number }> {
  const startTime = Date.now();
  const patternThreats = quickUrlCheck(urls);

  try {
    const prompt = PROMPT.replace("{urls}", urls.map((u, i) => `${i + 1}. ${u}`).join("\n"));
    const { text } = await callClaude(prompt, 1024);

    const fallback: UrlSafetyResult = {
      urls: urls.map(u => ({ url: u, verdict: "suspicious", riskScore: 0.5, threats: [], recommendation: "visit_with_caution", explanation: "Analysis encountered an issue." })),
      overallVerdict: "suspicious", overallRiskScore: 0.5,
    };

    const parsed = parseJsonResponse(text, fallback);

    const result: UrlSafetyResult = {
      urls: (parsed.urls || []).map((u: any) => ({
        url: String(u.url || ""),
        verdict: ["safe", "suspicious", "dangerous"].includes(u.verdict) ? u.verdict : "suspicious",
        riskScore: clampScore(u.riskScore),
        threats: (u.threats || []).map((t: any) => ({ type: String(t.type || "UNKNOWN"), description: String(t.description || ""), severity: sanitizeSeverity(t.severity) })),
        recommendation: String(u.recommendation || "visit_with_caution"),
        explanation: String(u.explanation || ""),
      })),
      overallVerdict: ["safe", "suspicious", "dangerous"].includes(parsed.overallVerdict) ? parsed.overallVerdict : "suspicious",
      overallRiskScore: clampScore(parsed.overallRiskScore),
    };

    if (patternThreats.some(t => t.severity === "critical")) {
      result.overallVerdict = "dangerous";
      result.overallRiskScore = Math.max(result.overallRiskScore, 0.9);
    }

    return { result, durationMs: Date.now() - startTime };
  } catch (error) {
    console.error("Claude API error (url-safety):", error);
    return {
      result: {
        urls: urls.map(u => ({
          url: u, verdict: patternThreats.length > 0 ? "suspicious" : "safe",
          riskScore: patternThreats.length > 0 ? 0.5 : 0.1, threats: patternThreats,
          recommendation: patternThreats.length > 0 ? "visit_with_caution" : "safe_to_visit",
          explanation: "Pattern-based analysis only. AI analysis temporarily unavailable.",
        })),
        overallVerdict: patternThreats.length > 0 ? "suspicious" : "safe",
        overallRiskScore: patternThreats.length > 0 ? 0.5 : 0.1,
      },
      durationMs: Date.now() - startTime,
    };
  }
}
