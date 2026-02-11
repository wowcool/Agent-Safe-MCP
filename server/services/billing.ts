export const MAX_TOKENS_PER_UNIT = 4000;
export const PRICE_PER_UNIT = 0.02;
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
