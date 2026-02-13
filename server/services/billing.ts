export const MAX_TOKENS_PER_UNIT = 4000;
export const PRICE_PER_UNIT = 0.01;

export const TOOL_PRICING: Record<string, { units: number; externalCost: number }> = {
  check_email_safety: { units: 1, externalCost: 0 },
  check_url_safety: { units: 1, externalCost: 0 },
  check_response_safety: { units: 1, externalCost: 0 },
  analyze_email_thread: { units: 1, externalCost: 0 },
  check_attachment_safety: { units: 1, externalCost: 0 },
  check_sender_reputation: { units: 1, externalCost: 0 },
  check_message_safety: { units: 1, externalCost: 0 },
  check_media_authenticity_image: { units: 4, externalCost: 0.03 },
  check_media_authenticity_video: { units: 10, externalCost: 0.15 },
};

export function getToolUnits(toolName: string): number {
  return TOOL_PRICING[toolName]?.units ?? 1;
}

export function validateCostCoverage(toolName: string): boolean {
  const pricing = TOOL_PRICING[toolName];
  if (!pricing) return true;
  const revenue = pricing.units * PRICE_PER_UNIT;
  return revenue >= pricing.externalCost;
}
export const AUTO_CHARGE_MAX_UNITS = 5;

export function countTokens(text: string): number {
  return Math.ceil(text.length / 4);
}

export function calculateUnits(totalTokens: number, maxPerUnit: number = MAX_TOKENS_PER_UNIT): number {
  return Math.max(1, Math.ceil(totalTokens / maxPerUnit));
}

export function calculateCharge(units: number, pricePerUnit: number = PRICE_PER_UNIT): number {
  return Math.round(units * pricePerUnit * 100) / 100;
}

export interface BillingInfo {
  units: number;
  totalCharge: number;
  inputTokens: number;
  maxTokensPerUnit: number;
}

export function buildBillingInfo(inputText: string): BillingInfo {
  const inputTokens = countTokens(inputText);
  const units = calculateUnits(inputTokens);
  const totalCharge = calculateCharge(units);
  return {
    units,
    totalCharge,
    inputTokens,
    maxTokensPerUnit: MAX_TOKENS_PER_UNIT,
  };
}

const quoteCache = new Map<string, { tokenCount: number; units: number; estimatedCost: number; createdAt: number }>();
const QUOTE_TTL_MS = 5 * 60 * 1000;

export function createQuote(inputText: string): { quoteId: string; units: number; estimatedCost: number; tokenCount: number } {
  const tokenCount = countTokens(inputText);
  const units = calculateUnits(tokenCount);
  const estimatedCost = calculateCharge(units);
  const quoteId = `qt_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`;

  quoteCache.set(quoteId, { tokenCount, units, estimatedCost, createdAt: Date.now() });

  return { quoteId, units, estimatedCost, tokenCount };
}

export function getQuote(quoteId: string): { tokenCount: number; units: number; estimatedCost: number } | null {
  const quote = quoteCache.get(quoteId);
  if (!quote) return null;
  if (Date.now() - quote.createdAt > QUOTE_TTL_MS) {
    quoteCache.delete(quoteId);
    return null;
  }
  return { tokenCount: quote.tokenCount, units: quote.units, estimatedCost: quote.estimatedCost };
}

export function deleteQuote(quoteId: string): void {
  quoteCache.delete(quoteId);
}

setInterval(() => {
  const now = Date.now();
  for (const [key, value] of quoteCache.entries()) {
    if (now - value.createdAt > QUOTE_TTL_MS) {
      quoteCache.delete(key);
    }
  }
}, 60 * 1000);
