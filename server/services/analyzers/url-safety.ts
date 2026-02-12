import { callClaude, parseJsonResponse, clampScore, sanitizeSeverity, type ThreatItem } from "./base";
import { lookupUrl, lookupDomain, summarizeReputation, type VTReputationResult } from "../virustotal";
import { lookupUrl as webRiskLookup, type WebRiskResult } from "../google-webrisk";
import { storeVTResult, storeWebRiskResult, getDomainContext, buildHistoricalContextPrompt } from "../threat-memory";

const PROMPT = `You are a URL security analyzer designed to protect AI agents from phishing, malware, and deceptive destinations. Analyze the following URLs and provide a security assessment.

URLs TO ANALYZE:
{urls}

VIRUSTOTAL INTELLIGENCE (from 70+ security engines):
{vtIntel}

GOOGLE WEB RISK INTELLIGENCE (Google's commercial threat database):
{webRiskIntel}

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

interface ThreatIntelResult {
  vtResults: Map<string, VTReputationResult>;
  wrResults: Map<string, WebRiskResult>;
  vtIntelText: string;
  webRiskIntelText: string;
  intelThreats: ThreatItem[];
}

async function getThreatIntel(urls: string[]): Promise<ThreatIntelResult> {
  const vtResults = new Map<string, VTReputationResult>();
  const wrResults = new Map<string, WebRiskResult>();
  const intelThreats: ThreatItem[] = [];
  const vtLines: string[] = [];
  const wrLines: string[] = [];

  try {
    const lookups = urls.slice(0, 5).map(async (url) => {
      try {
        const parsed = new URL(url);
        const [urlResult, domainResult, wrResult] = await Promise.all([
          lookupUrl(url).catch(() => null),
          lookupDomain(parsed.hostname).catch(() => null),
          webRiskLookup(url).catch(() => null),
        ]);

        const vtResult = urlResult?.found ? urlResult : domainResult;
        if (vtResult) {
          vtResults.set(url, vtResult);
          vtLines.push(`${url.substring(0, 80)}: ${summarizeReputation(vtResult)}`);
          storeVTResult("url", url, vtResult.malicious, vtResult.suspicious, vtResult.totalEngines, summarizeReputation(vtResult));
          if (vtResult.malicious > 0) {
            intelThreats.push({ type: "MALWARE", description: `VirusTotal: ${vtResult.malicious} security engine(s) flagged ${parsed.hostname} as malicious`, severity: "critical" });
          } else if (vtResult.suspicious > 0) {
            intelThreats.push({ type: "PHISHING", description: `VirusTotal: ${vtResult.suspicious} engine(s) flagged ${parsed.hostname} as suspicious`, severity: "high" });
          }
        }

        if (wrResult) {
          wrResults.set(url, wrResult);
          wrLines.push(`${url.substring(0, 80)}: ${wrResult.summary}`);
          storeWebRiskResult("url", url, wrResult.safe, wrResult.threats, wrResult.summary);
          if (!wrResult.safe) {
            const threatTypes = wrResult.threats.map(t => t.threatType).join(", ");
            intelThreats.push({ type: "GOOGLE_WEB_RISK", description: `Google Web Risk flagged ${parsed.hostname}: ${threatTypes}`, severity: "critical" });
          }
        }
      } catch {}
    });
    await Promise.all(lookups);
  } catch {}

  return {
    vtResults,
    wrResults,
    vtIntelText: vtLines.length > 0 ? vtLines.join("\n") : "No VirusTotal data available",
    webRiskIntelText: wrLines.length > 0 ? wrLines.join("\n") : "No Google Web Risk data available",
    intelThreats,
  };
}

function enrichWithThreatIntel(result: UrlSafetyResult, vtResults: Map<string, VTReputationResult>, wrResults: Map<string, WebRiskResult>): void {
  for (const urlResult of result.urls) {
    const vtData = vtResults.get(urlResult.url);
    if (vtData?.found) {
      if (vtData.malicious > 0) {
        urlResult.verdict = "dangerous";
        urlResult.riskScore = Math.max(urlResult.riskScore, 0.95);
        urlResult.recommendation = "do_not_visit";
        if (!urlResult.threats.some(t => t.description.includes("VirusTotal"))) {
          urlResult.threats.push({ type: "MALWARE", description: `VirusTotal: ${vtData.malicious} of ${vtData.totalEngines} security engines flagged this as malicious`, severity: "critical" });
        }
      } else if (vtData.suspicious > 0) {
        if (urlResult.verdict === "safe") urlResult.verdict = "suspicious";
        urlResult.riskScore = Math.max(urlResult.riskScore, 0.7);
        urlResult.recommendation = urlResult.recommendation === "safe_to_visit" ? "visit_with_caution" : urlResult.recommendation;
        if (!urlResult.threats.some(t => t.description.includes("VirusTotal"))) {
          urlResult.threats.push({ type: "PHISHING", description: `VirusTotal: ${vtData.suspicious} of ${vtData.totalEngines} engines flagged this as suspicious`, severity: "high" });
        }
      }
    }

    const wrData = wrResults.get(urlResult.url);
    if (wrData && !wrData.safe) {
      urlResult.verdict = "dangerous";
      urlResult.riskScore = Math.max(urlResult.riskScore, 0.98);
      urlResult.recommendation = "do_not_visit";
      const threatTypes = wrData.threats.map(t => t.threatType).join(", ");
      if (!urlResult.threats.some(t => t.description.includes("Google Web Risk"))) {
        urlResult.threats.push({ type: "GOOGLE_WEB_RISK", description: `Google Web Risk: flagged as ${threatTypes}`, severity: "critical" });
      }
    }
  }

  const hasMalicious = result.urls.some(u => u.verdict === "dangerous");
  const hasSuspicious = result.urls.some(u => u.verdict === "suspicious");
  if (hasMalicious) {
    result.overallVerdict = "dangerous";
    result.overallRiskScore = Math.max(result.overallRiskScore, 0.95);
  } else if (hasSuspicious && result.overallVerdict === "safe") {
    result.overallVerdict = "suspicious";
    result.overallRiskScore = Math.max(result.overallRiskScore, 0.6);
  }
}

export async function analyzeUrls(urls: string[]): Promise<{ result: UrlSafetyResult; durationMs: number }> {
  const startTime = Date.now();
  const patternThreats = quickUrlCheck(urls);

  const { vtResults, wrResults, vtIntelText, webRiskIntelText, intelThreats } = await getThreatIntel(urls);
  patternThreats.push(...intelThreats);

  try {
    const prompt = PROMPT
      .replace("{urls}", urls.map((u, i) => `${i + 1}. ${u}`).join("\n"))
      .replace("{vtIntel}", vtIntelText)
      .replace("{webRiskIntel}", webRiskIntelText);
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

    enrichWithThreatIntel(result, vtResults, wrResults);

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
