const WEB_RISK_API = "https://webrisk.googleapis.com/v1/uris:search";

const cache = new Map<string, { data: WebRiskResult; expiresAt: number }>();
const CACHE_TTL_MS = 60 * 60 * 1000;

function getApiKey(): string | null {
  return process.env.GOOGLE_API__KEY || process.env.GOOGLE_API_KEY || null;
}

export interface WebRiskThreat {
  threatType: string;
  expireTime: string;
}

export interface WebRiskResult {
  safe: boolean;
  threats: WebRiskThreat[];
  summary: string;
  error?: string;
}

const SAFE_RESULT: WebRiskResult = { safe: true, threats: [], summary: "Clean — no threats found by Google Web Risk" };

function withTimeout<T>(promise: Promise<T>, ms: number, fallback: T): Promise<T> {
  return Promise.race([
    promise,
    new Promise<T>((resolve) => setTimeout(() => resolve(fallback), ms)),
  ]);
}

const THREAT_TYPES = ["MALWARE", "SOCIAL_ENGINEERING", "UNWANTED_SOFTWARE", "SOCIAL_ENGINEERING_EXTENDED_COVERAGE"];

export async function lookupUrl(url: string): Promise<WebRiskResult> {
  const cacheKey = `gwr:${url}`;
  const cached = cache.get(cacheKey);
  if (cached && Date.now() < cached.expiresAt) return cached.data;

  const apiKey = getApiKey();
  if (!apiKey) return { ...SAFE_RESULT, error: "GOOGLE_API__KEY not configured" };

  try {
    const params = new URLSearchParams();
    for (const tt of THREAT_TYPES) params.append("threatTypes", tt);
    params.set("uri", url);
    params.set("key", apiKey);

    const response = await withTimeout(
      fetch(`${WEB_RISK_API}?${params.toString()}`),
      5000,
      null,
    );

    if (!response) return { ...SAFE_RESULT, error: "Google Web Risk timeout" };

    if (!response.ok) {
      const errText = await response.text().catch(() => "");
      console.error(`[WebRisk] API error ${response.status}: ${errText.substring(0, 200)}`);
      return { ...SAFE_RESULT, error: `Web Risk API error: ${response.status}` };
    }

    const data = await response.json();

    if (!data.threat) {
      const result = { ...SAFE_RESULT };
      cache.set(cacheKey, { data: result, expiresAt: Date.now() + CACHE_TTL_MS });
      console.log(`[WebRisk] ${url.substring(0, 60)}: Safe`);
      return result;
    }

    const threats: WebRiskThreat[] = [];
    const threatTypes: string[] = Array.isArray(data.threat.threatTypes)
      ? data.threat.threatTypes
      : [data.threat.threatTypes || "UNKNOWN"].filter(Boolean);

    for (const tt of threatTypes) {
      threats.push({ threatType: tt, expireTime: data.threat.expireTime || "" });
    }

    const threatLabels = threats.map(t => formatThreatType(t.threatType));
    const summary = `DANGEROUS — Google Web Risk detected: ${threatLabels.join(", ")}`;

    const result: WebRiskResult = { safe: false, threats, summary };

    const expireTime = data.threat.expireTime ? new Date(data.threat.expireTime).getTime() : 0;
    const cacheTTL = expireTime > Date.now() ? expireTime - Date.now() : CACHE_TTL_MS;
    cache.set(cacheKey, { data: result, expiresAt: Date.now() + cacheTTL });

    console.log(`[WebRisk] ${url.substring(0, 60)}: ${summary}`);
    return result;
  } catch (error: any) {
    console.error(`[WebRisk] Lookup error for ${url.substring(0, 60)}:`, error.message);
    return { ...SAFE_RESULT, error: error.message };
  }
}

function formatThreatType(type: string): string {
  switch (type) {
    case "MALWARE": return "Malware";
    case "SOCIAL_ENGINEERING": return "Phishing/Social Engineering";
    case "UNWANTED_SOFTWARE": return "Unwanted Software";
    case "SOCIAL_ENGINEERING_EXTENDED_COVERAGE": return "Phishing (Extended)";
    default: return type;
  }
}

export function isConfigured(): boolean {
  return !!(process.env.GOOGLE_API__KEY || process.env.GOOGLE_API_KEY);
}

export function summarize(result: WebRiskResult): string {
  return result.summary;
}
