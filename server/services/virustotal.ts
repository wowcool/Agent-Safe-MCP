const VT_API_URL = "https://www.virustotal.com/api/v3";

const cache = new Map<string, { data: VTReputationResult; cachedAt: number }>();
const CACHE_TTL_MS = 60 * 60 * 1000;

function getApiKey(): string | null {
  return process.env.VIRUS_TOTAL || null;
}

export interface VTReputationResult {
  found: boolean;
  malicious: number;
  suspicious: number;
  harmless: number;
  undetected: number;
  totalEngines: number;
  reputation: number;
  categories: Record<string, string>;
  lastAnalysisDate: string | null;
  error?: string;
}

const EMPTY_RESULT: VTReputationResult = {
  found: false, malicious: 0, suspicious: 0, harmless: 0, undetected: 0,
  totalEngines: 0, reputation: 0, categories: {}, lastAnalysisDate: null,
};

function withTimeout<T>(promise: Promise<T>, ms: number, fallback: T): Promise<T> {
  return Promise.race([
    promise,
    new Promise<T>((resolve) => setTimeout(() => resolve(fallback), ms)),
  ]);
}

export async function lookupDomain(domain: string): Promise<VTReputationResult> {
  const cacheKey = `domain:${domain}`;
  const cached = cache.get(cacheKey);
  if (cached && Date.now() - cached.cachedAt < CACHE_TTL_MS) return cached.data;

  const apiKey = getApiKey();
  if (!apiKey) return { ...EMPTY_RESULT, error: "VIRUS_TOTAL not configured" };

  try {
    const response = await withTimeout(
      fetch(`${VT_API_URL}/domains/${domain}`, {
        headers: { "x-apikey": apiKey },
      }),
      5000,
      null,
    );

    if (!response || !response.ok) {
      if (response?.status === 404) return { ...EMPTY_RESULT, found: false };
      return { ...EMPTY_RESULT, error: `VT API error: ${response?.status || "timeout"}` };
    }

    const data = await response.json();
    const stats = data.data?.attributes?.last_analysis_stats || {};
    const result: VTReputationResult = {
      found: true,
      malicious: stats.malicious || 0,
      suspicious: stats.suspicious || 0,
      harmless: stats.harmless || 0,
      undetected: stats.undetected || 0,
      totalEngines: (stats.malicious || 0) + (stats.suspicious || 0) + (stats.harmless || 0) + (stats.undetected || 0),
      reputation: data.data?.attributes?.reputation ?? 0,
      categories: data.data?.attributes?.categories || {},
      lastAnalysisDate: data.data?.attributes?.last_analysis_date
        ? new Date(data.data.attributes.last_analysis_date * 1000).toISOString()
        : null,
    };

    cache.set(cacheKey, { data: result, cachedAt: Date.now() });
    console.log(`[VT] Domain ${domain}: ${result.malicious} malicious, ${result.suspicious} suspicious out of ${result.totalEngines} engines`);
    return result;
  } catch (error: any) {
    console.error(`[VT] Domain lookup error for ${domain}:`, error.message);
    return { ...EMPTY_RESULT, error: error.message };
  }
}

export async function lookupUrl(url: string): Promise<VTReputationResult> {
  const urlId = Buffer.from(url).toString("base64url").replace(/=+$/, "");
  const cacheKey = `url:${urlId}`;
  const cached = cache.get(cacheKey);
  if (cached && Date.now() - cached.cachedAt < CACHE_TTL_MS) return cached.data;

  const apiKey = getApiKey();
  if (!apiKey) return { ...EMPTY_RESULT, error: "VIRUS_TOTAL not configured" };

  try {
    const response = await withTimeout(
      fetch(`${VT_API_URL}/urls/${urlId}`, {
        headers: { "x-apikey": apiKey },
      }),
      5000,
      null,
    );

    if (!response || !response.ok) {
      if (response?.status === 404) return { ...EMPTY_RESULT, found: false };
      return { ...EMPTY_RESULT, error: `VT API error: ${response?.status || "timeout"}` };
    }

    const data = await response.json();
    const stats = data.data?.attributes?.last_analysis_stats || {};
    const result: VTReputationResult = {
      found: true,
      malicious: stats.malicious || 0,
      suspicious: stats.suspicious || 0,
      harmless: stats.harmless || 0,
      undetected: stats.undetected || 0,
      totalEngines: (stats.malicious || 0) + (stats.suspicious || 0) + (stats.harmless || 0) + (stats.undetected || 0),
      reputation: data.data?.attributes?.reputation ?? 0,
      categories: data.data?.attributes?.categories || {},
      lastAnalysisDate: data.data?.attributes?.last_analysis_date
        ? new Date(data.data.attributes.last_analysis_date * 1000).toISOString()
        : null,
    };

    cache.set(cacheKey, { data: result, cachedAt: Date.now() });
    console.log(`[VT] URL ${url.substring(0, 60)}: ${result.malicious} malicious, ${result.suspicious} suspicious out of ${result.totalEngines} engines`);
    return result;
  } catch (error: any) {
    console.error(`[VT] URL lookup error:`, error.message);
    return { ...EMPTY_RESULT, error: error.message };
  }
}

export function isConfigured(): boolean {
  return !!process.env.VIRUS_TOTAL;
}

export function summarizeReputation(vt: VTReputationResult): string {
  if (!vt.found) return "Not found in VirusTotal database";
  if (vt.malicious > 0) return `FLAGGED by ${vt.malicious} security engine(s) as malicious${vt.suspicious > 0 ? ` and ${vt.suspicious} as suspicious` : ""} (out of ${vt.totalEngines})`;
  if (vt.suspicious > 0) return `Flagged by ${vt.suspicious} engine(s) as suspicious (out of ${vt.totalEngines})`;
  return `Clean — 0 detections across ${vt.totalEngines} security engines`;
}
