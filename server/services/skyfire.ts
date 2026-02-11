import * as jose from "jose";

const SKYFIRE_API_URL = "https://api.skyfire.xyz";
const SKYFIRE_JWKS_URL = "https://app.skyfire.xyz/.well-known/jwks.json";
const PRICE_PER_CHECK = 0.02;

let jwksCache: jose.JSONWebKeySet | null = null;
let jwksCacheTime = 0;
const JWKS_CACHE_DURATION_MS = 60 * 60 * 1000;

function getSkyfireApiKey(): string {
  const key = process.env.SKYFIRE_API;
  if (!key) {
    throw new Error("SKYFIRE_API secret is not configured");
  }
  return key;
}

async function getJWKS(): Promise<jose.JSONWebKeySet> {
  const now = Date.now();
  if (jwksCache && now - jwksCacheTime < JWKS_CACHE_DURATION_MS) {
    return jwksCache;
  }

  const response = await fetch(SKYFIRE_JWKS_URL);
  if (!response.ok) {
    throw new Error(`Failed to fetch Skyfire JWKS: ${response.status}`);
  }

  jwksCache = (await response.json()) as jose.JSONWebKeySet;
  jwksCacheTime = now;
  return jwksCache;
}

export interface SkyfireTokenClaims {
  sub?: string;
  iss?: string;
  aud?: string;
  exp?: number;
  iat?: number;
  ssi?: string;
  amount?: number;
  currency?: string;
  type?: string;
  buyerAgentId?: string;
  [key: string]: unknown;
}

export interface SkyfireValidationResult {
  valid: boolean;
  claims?: SkyfireTokenClaims;
  error?: string;
}

export interface SkyfireChargeResult {
  success: boolean;
  transactionId?: string;
  error?: string;
}

export async function validateSkyfireToken(token: string): Promise<SkyfireValidationResult> {
  try {
    const jwks = await getJWKS();
    const keyStore = jose.createLocalJWKSet(jwks);

    const { payload } = await jose.jwtVerify(token, keyStore, {
      issuer: "https://app.skyfire.xyz",
    });

    const claims = payload as unknown as SkyfireTokenClaims;

    if (claims.type && claims.type !== "pay" && claims.type !== "kya+pay") {
      return {
        valid: false,
        error: `Token type "${claims.type}" is not a payment token. Expected "pay" or "kya+pay".`,
      };
    }

    if (claims.amount !== undefined && claims.amount < PRICE_PER_CHECK) {
      return {
        valid: false,
        error: `Token amount $${claims.amount} is less than required $${PRICE_PER_CHECK}`,
      };
    }

    return {
      valid: true,
      claims,
    };
  } catch (error: any) {
    console.error("Skyfire token validation error:", error.message);
    return {
      valid: false,
      error: error.message || "Token validation failed",
    };
  }
}

export async function chargeSkyfireToken(
  token: string,
  amount: number = PRICE_PER_CHECK
): Promise<SkyfireChargeResult> {
  try {
    const apiKey = getSkyfireApiKey();

    const response = await fetch(`${SKYFIRE_API_URL}/api/v1/tokens/charge`, {
      method: "POST",
      headers: {
        "skyfire-api-key": apiKey,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        token,
        chargeAmount: String(amount),
      }),
    });

    if (!response.ok) {
      const errorBody = await response.text();
      console.error("Skyfire charge error:", response.status, errorBody);
      return {
        success: false,
        error: `Charge failed: ${response.status} - ${errorBody}`,
      };
    }

    const result = await response.json();
    return {
      success: true,
      transactionId: result.transactionId || result.id || "skyfire_charge",
    };
  } catch (error: any) {
    console.error("Skyfire charge error:", error.message);
    return {
      success: false,
      error: error.message || "Charge request failed",
    };
  }
}

export async function introspectSkyfireToken(token: string): Promise<{
  active: boolean;
  claims?: Record<string, unknown>;
  error?: string;
}> {
  try {
    const apiKey = getSkyfireApiKey();

    const response = await fetch(`${SKYFIRE_API_URL}/api/v1/tokens/introspect`, {
      method: "POST",
      headers: {
        "skyfire-api-key": apiKey,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ token }),
    });

    if (!response.ok) {
      return { active: false, error: `Introspection failed: ${response.status}` };
    }

    const result = await response.json();
    return {
      active: result.active !== false,
      claims: result,
    };
  } catch (error: any) {
    return { active: false, error: error.message };
  }
}

export async function generatePayTokenFromBuyerKey(buyerApiKey: string, sellerServiceId: string): Promise<{
  success: boolean;
  token?: string;
  error?: string;
}> {
  try {
    const response = await fetch(`${SKYFIRE_API_URL}/api/v1/tokens`, {
      method: "POST",
      headers: {
        "skyfire-api-key": buyerApiKey,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        type: "pay",
        tokenAmount: String(PRICE_PER_CHECK),
        sellerServiceId,
      }),
    });

    if (!response.ok) {
      const errorBody = await response.text();
      console.error("Skyfire token generation error:", response.status, errorBody);
      return {
        success: false,
        error: `Token generation failed: ${response.status} - ${errorBody}`,
      };
    }

    const result = await response.json();
    return {
      success: true,
      token: result.token,
    };
  } catch (error: any) {
    console.error("Skyfire token generation error:", error.message);
    return {
      success: false,
      error: error.message || "Token generation request failed",
    };
  }
}

export function isSkyfireConfigured(): boolean {
  return !!process.env.SKYFIRE_API;
}
