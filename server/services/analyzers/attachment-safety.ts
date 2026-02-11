import { callClaude, parseJsonResponse, clampScore, sanitizeSeverity, type ThreatItem } from "./base";

const PROMPT = `You are an email attachment security analyzer. Assess the risk of email attachments based on their metadata BEFORE they are opened or downloaded. You are protecting AI agents from malware and social engineering.

ATTACHMENTS TO ANALYZE:
{attachments}

Analyze EVERY attachment for ALL of these threat categories:
1. EXECUTABLE_MASQUERADE - File pretending to be one type but is executable
2. DOUBLE_EXTENSION - Using multiple extensions to hide true file type (e.g., invoice.pdf.exe)
3. MACRO_RISK - Document formats known to contain macros (.docm, .xlsm, .pptm)
4. ARCHIVE_RISK - Compressed files that could contain malware (.zip, .rar, .7z, .tar.gz)
5. SIZE_ANOMALY - File size inconsistent with claimed type
6. MIME_MISMATCH - MIME type doesn't match file extension

Respond ONLY with valid JSON in this exact format:
{
  "attachments": [
    {
      "filename": "...",
      "verdict": "safe" | "suspicious" | "dangerous",
      "riskScore": <number 0.0 to 1.0>,
      "threats": [{"type": "...", "description": "...", "severity": "low"|"medium"|"high"|"critical"}],
      "recommendation": "safe_to_open" | "do_not_open" | "open_with_caution",
      "explanation": "..."
    }
  ],
  "overallVerdict": "safe" | "suspicious" | "dangerous",
  "overallRiskScore": <number 0.0 to 1.0>,
  "safeToProcess": ["filenames safe to process"],
  "doNotProcess": ["filenames that should NOT be processed"]
}`;

export interface AttachmentInput {
  name: string;
  size: number;
  mimeType: string;
  from?: string;
}

export interface AttachmentResult {
  filename: string;
  verdict: string;
  riskScore: number;
  threats: ThreatItem[];
  recommendation: string;
  explanation: string;
}

export interface AttachmentSafetyResult {
  attachments: AttachmentResult[];
  overallVerdict: string;
  overallRiskScore: number;
  safeToProcess: string[];
  doNotProcess: string[];
}

const DANGEROUS_EXTENSIONS = [".exe", ".bat", ".cmd", ".scr", ".js", ".vbs", ".ps1", ".msi", ".com", ".pif", ".hta", ".cpl", ".wsf", ".wsh"];
const MACRO_EXTENSIONS = [".docm", ".xlsm", ".pptm", ".dotm", ".xltm"];
const ARCHIVE_EXTENSIONS = [".zip", ".rar", ".7z", ".tar", ".gz", ".tar.gz", ".cab", ".iso"];

function quickAttachmentCheck(attachments: AttachmentInput[]): { threats: ThreatItem[]; perFile: Map<string, ThreatItem[]> } {
  const threats: ThreatItem[] = [];
  const perFile = new Map<string, ThreatItem[]>();

  for (const a of attachments) {
    const fileThreats: ThreatItem[] = [];
    const lower = a.name.toLowerCase();
    const parts = lower.split(".");

    if (parts.length > 2) {
      const lastExt = "." + parts[parts.length - 1];
      const secondLastExt = "." + parts[parts.length - 2];
      if (DANGEROUS_EXTENSIONS.includes(lastExt)) {
        fileThreats.push({ type: "DOUBLE_EXTENSION", description: `Double extension detected: ${a.name}`, severity: "critical" });
      } else if (DANGEROUS_EXTENSIONS.includes(secondLastExt) && !DANGEROUS_EXTENSIONS.includes(lastExt)) {
        fileThreats.push({ type: "EXECUTABLE_MASQUERADE", description: `Suspicious extension combination: ${a.name}`, severity: "high" });
      }
    }

    if (DANGEROUS_EXTENSIONS.some(ext => lower.endsWith(ext))) {
      fileThreats.push({ type: "EXECUTABLE_MASQUERADE", description: `Executable file type: ${a.name}`, severity: "critical" });
    }
    if (MACRO_EXTENSIONS.some(ext => lower.endsWith(ext))) {
      fileThreats.push({ type: "MACRO_RISK", description: `Macro-enabled document: ${a.name}`, severity: "high" });
    }
    if (ARCHIVE_EXTENSIONS.some(ext => lower.endsWith(ext))) {
      fileThreats.push({ type: "ARCHIVE_RISK", description: `Archive file that could contain malware: ${a.name}`, severity: "medium" });
    }

    if (a.mimeType) {
      const execMimes = ["application/x-msdownload", "application/x-executable", "application/javascript", "text/javascript"];
      const imageExts = [".jpg", ".jpeg", ".png", ".gif", ".bmp", ".webp"];
      const docExts = [".pdf", ".doc", ".docx", ".txt"];
      if (execMimes.includes(a.mimeType.toLowerCase()) && !DANGEROUS_EXTENSIONS.some(ext => lower.endsWith(ext))) {
        fileThreats.push({ type: "MIME_MISMATCH", description: `Executable MIME type but non-executable extension: ${a.name}`, severity: "critical" });
      }
      if ((imageExts.some(ext => lower.endsWith(ext)) || docExts.some(ext => lower.endsWith(ext))) && execMimes.includes(a.mimeType.toLowerCase())) {
        fileThreats.push({ type: "MIME_MISMATCH", description: `MIME type doesn't match file extension: ${a.name} (${a.mimeType})`, severity: "critical" });
      }
    }

    if (fileThreats.length > 0) {
      perFile.set(a.name, fileThreats);
      threats.push(...fileThreats);
    }
  }

  return { threats, perFile };
}

export async function analyzeAttachments(attachments: AttachmentInput[]): Promise<{ result: AttachmentSafetyResult; durationMs: number }> {
  const startTime = Date.now();
  const { threats: patternThreats, perFile } = quickAttachmentCheck(attachments);

  try {
    const formatted = attachments.map((a, i) =>
      `${i + 1}. Filename: ${a.name}\n   Size: ${a.size} bytes\n   MIME Type: ${a.mimeType}\n   From: ${a.from || "Unknown"}`
    ).join("\n");

    const prompt = PROMPT.replace("{attachments}", formatted);
    const { text } = await callClaude(prompt, 1200);

    const fallback: AttachmentSafetyResult = {
      attachments: attachments.map(a => ({
        filename: a.name, verdict: "suspicious", riskScore: 0.5,
        threats: perFile.get(a.name) || [], recommendation: "open_with_caution", explanation: "Analysis issue.",
      })),
      overallVerdict: "suspicious", overallRiskScore: 0.5,
      safeToProcess: [], doNotProcess: attachments.map(a => a.name),
    };

    const parsed = parseJsonResponse(text, fallback);

    const result: AttachmentSafetyResult = {
      attachments: (parsed.attachments || []).map((a: any) => ({
        filename: String(a.filename || ""),
        verdict: ["safe", "suspicious", "dangerous"].includes(a.verdict) ? a.verdict : "suspicious",
        riskScore: clampScore(a.riskScore),
        threats: (a.threats || []).map((t: any) => ({ type: String(t.type || "UNKNOWN"), description: String(t.description || ""), severity: sanitizeSeverity(t.severity) })),
        recommendation: String(a.recommendation || "open_with_caution"),
        explanation: String(a.explanation || ""),
      })),
      overallVerdict: ["safe", "suspicious", "dangerous"].includes(parsed.overallVerdict) ? parsed.overallVerdict : "suspicious",
      overallRiskScore: clampScore(parsed.overallRiskScore),
      safeToProcess: Array.isArray(parsed.safeToProcess) ? parsed.safeToProcess.map(String) : [],
      doNotProcess: Array.isArray(parsed.doNotProcess) ? parsed.doNotProcess.map(String) : [],
    };

    if (patternThreats.some(t => t.severity === "critical")) {
      result.overallVerdict = "dangerous";
      result.overallRiskScore = Math.max(result.overallRiskScore, 0.9);
    }

    return { result, durationMs: Date.now() - startTime };
  } catch (error) {
    console.error("Claude API error (attachment-safety):", error);
    const hasCritical = patternThreats.some(t => t.severity === "critical");
    return {
      result: {
        attachments: attachments.map(a => ({
          filename: a.name,
          verdict: (perFile.get(a.name)?.some(t => t.severity === "critical")) ? "dangerous" : perFile.has(a.name) ? "suspicious" : "safe",
          riskScore: perFile.has(a.name) ? 0.7 : 0.1,
          threats: perFile.get(a.name) || [],
          recommendation: perFile.has(a.name) ? "do_not_open" : "safe_to_open",
          explanation: "Pattern-based analysis only.",
        })),
        overallVerdict: hasCritical ? "dangerous" : patternThreats.length > 0 ? "suspicious" : "safe",
        overallRiskScore: hasCritical ? 0.9 : patternThreats.length > 0 ? 0.5 : 0.1,
        safeToProcess: attachments.filter(a => !perFile.has(a.name)).map(a => a.name),
        doNotProcess: attachments.filter(a => perFile.has(a.name)).map(a => a.name),
      },
      durationMs: Date.now() - startTime,
    };
  }
}
