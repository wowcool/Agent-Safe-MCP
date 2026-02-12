import dns from "dns";
import { promisify } from "util";
import { lookupDomain, type VTReputationResult, summarizeReputation } from "./virustotal";
import { lookupUrl as webRiskLookup, type WebRiskResult } from "./google-webrisk";
import { lookupStoredIntel, storeVTResult, storeWebRiskResult } from "./threat-memory";

const resolveTxt = promisify(dns.resolveTxt);

export interface DMARCResult {
  exists: boolean;
  policy: string | null;
  record: string | null;
}

export interface DomainAgeResult {
  registrationDate: string | null;
  ageInDays: number | null;
  registrar: string | null;
}

export interface VirusTotalResult {
  found: boolean;
  malicious: number;
  suspicious: number;
  harmless: number;
  totalEngines: number;
  reputation: number;
  summary: string;
  categories: Record<string, string>;
}

export interface GoogleWebRiskResult {
  safe: boolean;
  threats: string[];
  summary: string;
}

export interface DomainIntelligence {
  dmarc: DMARCResult;
  domainAge: DomainAgeResult;
  virusTotal: VirusTotalResult;
  googleWebRisk: GoogleWebRiskResult;
}

const cache = new Map<string, { data: DomainIntelligence; cachedAt: number }>();
const CACHE_TTL_MS = 60 * 60 * 1000;

function withTimeout<T>(promise: Promise<T>, ms: number, fallback: T): Promise<T> {
  return Promise.race([
    promise,
    new Promise<T>((resolve) => setTimeout(() => resolve(fallback), ms)),
  ]);
}

export async function lookupDMARC(domain: string): Promise<DMARCResult> {
  try {
    const records = await withTimeout(
      resolveTxt(`_dmarc.${domain}`),
      3000,
      null
    );
    if (!records) {
      return { exists: false, policy: null, record: null };
    }
    const dmarcRecord = records
      .map((r) => r.join(""))
      .find((r) => r.startsWith("v=DMARC1"));
    if (!dmarcRecord) {
      return { exists: false, policy: null, record: null };
    }
    const policyMatch = dmarcRecord.match(/p=(reject|quarantine|none)/i);
    return {
      exists: true,
      policy: policyMatch ? policyMatch[1].toLowerCase() : null,
      record: dmarcRecord,
    };
  } catch {
    return { exists: false, policy: null, record: null };
  }
}

export async function lookupDomainAge(domain: string): Promise<DomainAgeResult> {
  const fallback: DomainAgeResult = { registrationDate: null, ageInDays: null, registrar: null };
  try {
    const response = await withTimeout(
      fetch(`https://rdap.org/domain/${domain}`, {
        headers: { Accept: "application/rdap+json" },
      }),
      3000,
      null
    );
    if (!response || !response.ok) return fallback;

    const data = await response.json();

    let registrationDate: string | null = null;
    if (Array.isArray(data.events)) {
      const regEvent = data.events.find(
        (e: any) => e.eventAction === "registration"
      );
      if (regEvent?.eventDate) {
        registrationDate = regEvent.eventDate.split("T")[0];
      }
    }

    let registrar: string | null = null;
    if (Array.isArray(data.entities)) {
      const registrarEntity = data.entities.find(
        (e: any) => Array.isArray(e.roles) && e.roles.includes("registrar")
      );
      if (registrarEntity) {
        registrar =
          registrarEntity.vcardArray?.[1]?.find(
            (v: any) => v[0] === "fn"
          )?.[3] ||
          registrarEntity.handle ||
          null;
      }
    }

    let ageInDays: number | null = null;
    if (registrationDate) {
      const regDate = new Date(registrationDate);
      ageInDays = Math.floor(
        (Date.now() - regDate.getTime()) / (1000 * 60 * 60 * 24)
      );
    }

    return { registrationDate, ageInDays, registrar };
  } catch {
    return fallback;
  }
}

export async function getDomainIntelligence(
  domain: string
): Promise<DomainIntelligence> {
  const cached = cache.get(domain);
  if (cached && Date.now() - cached.cachedAt < CACHE_TTL_MS) {
    return cached.data;
  }

  const [storedVT, storedWR] = await Promise.all([
    lookupStoredIntel("domain", domain).catch(() => null),
    lookupStoredIntel("domain", domain).catch(() => null),
  ]);

  const skipVT = storedVT?.source === "virustotal" && storedVT.hitCount > 2;
  const skipWR = storedWR?.source === "webrisk" && storedWR.hitCount > 2;

  const [dmarc, domainAge, vtResult, wrResult] = await Promise.all([
    lookupDMARC(domain),
    lookupDomainAge(domain),
    skipVT ? Promise.resolve(null) : lookupDomain(domain).catch(() => null),
    skipWR ? Promise.resolve(null) : webRiskLookup(`https://${domain}/`).catch(() => null),
  ]);

  let virusTotal: VirusTotalResult;
  if (vtResult) {
    virusTotal = {
      found: vtResult.found,
      malicious: vtResult.malicious,
      suspicious: vtResult.suspicious,
      harmless: vtResult.harmless,
      totalEngines: vtResult.totalEngines,
      reputation: vtResult.reputation,
      summary: summarizeReputation(vtResult),
      categories: vtResult.categories,
    };
    storeVTResult("domain", domain, vtResult.malicious, vtResult.suspicious, vtResult.totalEngines, virusTotal.summary);
  } else if (skipVT && storedVT) {
    const raw = storedVT as any;
    virusTotal = {
      found: true,
      malicious: raw.threatTypes?.includes("malware") ? 1 : 0,
      suspicious: raw.verdict === "suspicious" ? 1 : 0,
      harmless: 0,
      totalEngines: 0,
      reputation: 0,
      summary: `[Cached] ${storedVT.summary}`,
      categories: {},
    };
  } else {
    virusTotal = {
      found: false, malicious: 0, suspicious: 0, harmless: 0,
      totalEngines: 0, reputation: 0, summary: "VirusTotal lookup unavailable",
      categories: {},
    };
  }

  let googleWebRisk: GoogleWebRiskResult;
  if (wrResult) {
    googleWebRisk = {
      safe: wrResult.safe,
      threats: wrResult.threats.map(t => t.threatType),
      summary: wrResult.summary,
    };
    storeWebRiskResult("domain", domain, wrResult.safe, wrResult.threats, wrResult.summary);
  } else if (skipWR && storedWR) {
    googleWebRisk = {
      safe: storedWR.verdict === "safe",
      threats: storedWR.threatTypes,
      summary: `[Cached] ${storedWR.summary}`,
    };
  } else {
    googleWebRisk = {
      safe: true, threats: [], summary: "Google Web Risk lookup unavailable",
    };
  }

  const result = { dmarc, domainAge, virusTotal, googleWebRisk };
  cache.set(domain, { data: result, cachedAt: Date.now() });
  return result;
}
