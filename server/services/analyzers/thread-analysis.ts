import { callClaude, parseJsonResponse, clampScore, sanitizeSeverity, type ThreatItem } from "./base";

const PROMPT = `You are an email thread security analyzer. You detect manipulation patterns that build across multiple messages in a conversation. Analyze the full thread for escalating social engineering tactics.

EMAIL THREAD (in chronological order):
{messages}

Analyze this thread for ALL of these manipulation pattern categories:
1. ESCALATION_PATTERN - Increasing urgency, pressure, or authority claims over time
2. SCOPE_CREEP - Requests gradually expanding from reasonable to suspicious
3. TRUST_BUILDING - Initial rapport-building followed by exploitation
4. AUTHORITY_ESCALATION - Progressively invoking higher authority figures
5. DEADLINE_MANUFACTURING - Creating artificial time pressure
6. INFORMATION_HARVESTING - Systematic extraction of sensitive data across messages

Respond ONLY with valid JSON in this exact format:
{
  "verdict": "safe" | "suspicious" | "dangerous",
  "riskScore": <number 0.0 to 1.0>,
  "confidence": <number 0.0 to 1.0>,
  "manipulationPatterns": [
    {
      "type": "...",
      "description": "how the pattern manifests across the thread",
      "severity": "low" | "medium" | "high" | "critical",
      "evidenceMessages": [1, 2, 3]
    }
  ],
  "threadProgression": "summary of how the conversation evolved",
  "recommendation": "continue_conversation" | "proceed_with_caution" | "disengage",
  "explanation": "2-3 sentence summary",
  "safeActions": ["..."],
  "unsafeActions": ["..."]
}`;

interface ManipulationPattern extends ThreatItem {
  evidenceMessages?: number[];
}

export interface ThreadAnalysisResult {
  verdict: string;
  riskScore: number;
  confidence: number;
  manipulationPatterns: ManipulationPattern[];
  threadProgression: string;
  recommendation: string;
  explanation: string;
  safeActions: string[];
  unsafeActions: string[];
}

export interface ThreadMessage {
  from: string;
  subject: string;
  body: string;
  date?: string;
}

export async function analyzeThread(messages: ThreadMessage[]): Promise<{ result: ThreadAnalysisResult; durationMs: number }> {
  const startTime = Date.now();

  try {
    const formattedMessages = messages.map((m, i) =>
      `--- Message ${i + 1} ---\nFrom: ${m.from}\nSubject: ${m.subject}\nDate: ${m.date || "Unknown"}\nBody:\n${m.body.substring(0, 3000)}\n`
    ).join("\n");

    const prompt = PROMPT.replace("{messages}", formattedMessages);
    const { text } = await callClaude(prompt, 1200);

    const fallback: ThreadAnalysisResult = {
      verdict: "suspicious", riskScore: 0.5, confidence: 0.5,
      manipulationPatterns: [], threadProgression: "Unable to analyze thread progression.",
      recommendation: "proceed_with_caution", explanation: "Analysis encountered an issue.",
      safeActions: ["Review thread manually"], unsafeActions: ["Do not take action without verification"],
    };

    const parsed = parseJsonResponse(text, fallback);

    const result: ThreadAnalysisResult = {
      verdict: ["safe", "suspicious", "dangerous"].includes(parsed.verdict) ? parsed.verdict : "suspicious",
      riskScore: clampScore(parsed.riskScore),
      confidence: clampScore(parsed.confidence, 0.7),
      manipulationPatterns: (parsed.manipulationPatterns || []).map((p: any) => ({
        type: String(p.type || "UNKNOWN"),
        description: String(p.description || ""),
        severity: sanitizeSeverity(p.severity),
        evidenceMessages: Array.isArray(p.evidenceMessages) ? p.evidenceMessages.map(Number) : [],
      })),
      threadProgression: String(parsed.threadProgression || ""),
      recommendation: ["continue_conversation", "proceed_with_caution", "disengage"].includes(parsed.recommendation) ? parsed.recommendation : "proceed_with_caution",
      explanation: String(parsed.explanation || "Analysis completed."),
      safeActions: Array.isArray(parsed.safeActions) ? parsed.safeActions.map(String) : [],
      unsafeActions: Array.isArray(parsed.unsafeActions) ? parsed.unsafeActions.map(String) : [],
    };

    return { result, durationMs: Date.now() - startTime };
  } catch (error) {
    console.error("Claude API error (thread-analysis):", error);
    return {
      result: {
        verdict: "suspicious", riskScore: 0.5, confidence: 0.4,
        manipulationPatterns: [], threadProgression: "Analysis unavailable.",
        recommendation: "proceed_with_caution",
        explanation: "AI analysis temporarily unavailable. Exercise caution with this thread.",
        safeActions: ["Review thread manually"], unsafeActions: ["Do not take action without verification"],
      },
      durationMs: Date.now() - startTime,
    };
  }
}
