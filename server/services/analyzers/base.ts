import Anthropic from "@anthropic-ai/sdk";

const anthropic = new Anthropic();

export interface ThreatItem {
  type: string;
  description: string;
  severity: "low" | "medium" | "high" | "critical";
}

export async function callClaude(prompt: string, maxTokens: number = 1024): Promise<{ text: string; inputTokens: number; outputTokens: number; model: string }> {
  const response = await anthropic.messages.create({
    model: "claude-haiku-4-5-20251001",
    max_tokens: maxTokens,
    messages: [{ role: "user", content: prompt }],
  });

  const textContent = response.content.find((c) => c.type === "text");
  console.log(`[COST] Claude API usage - model: ${response.model}, input_tokens: ${response.usage.input_tokens}, output_tokens: ${response.usage.output_tokens}`);

  return {
    text: textContent?.text || "",
    inputTokens: response.usage.input_tokens,
    outputTokens: response.usage.output_tokens,
    model: response.model,
  };
}

export function parseJsonResponse<T>(text: string, fallback: T): T {
  try {
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (!jsonMatch) throw new Error("No JSON found in response");
    return JSON.parse(jsonMatch[0]) as T;
  } catch {
    return fallback;
  }
}

export function clampScore(value: any, defaultVal: number = 0.5): number {
  const num = Number(value);
  if (isNaN(num)) return defaultVal;
  return Math.max(0, Math.min(1, num));
}

export function sanitizeSeverity(severity: any): "low" | "medium" | "high" | "critical" {
  if (["low", "medium", "high", "critical"].includes(severity)) return severity;
  return "medium";
}
