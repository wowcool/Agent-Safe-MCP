const SIGHTENGINE_API_URL = "https://api.sightengine.com/1.0";

function getSightEngineCredentials(): { apiUser: string; apiSecret: string } {
  const apiUser = process.env.SIGHT_API_USER;
  const apiSecret = process.env.SIGHT_API_SECRET;
  if (!apiUser || !apiSecret) {
    throw new Error("SightEngine API credentials not configured (SIGHT_API_USER, SIGHT_API_SECRET)");
  }
  return { apiUser, apiSecret };
}

export interface SightEngineImageResult {
  success: boolean;
  aiGeneratedScore: number;
  deepfakeScore: number;
  error?: string;
}

export interface SightEngineVideoFrame {
  position: number;
  aiGeneratedScore: number;
}

export interface SightEngineVideoResult {
  success: boolean;
  frames: SightEngineVideoFrame[];
  error?: string;
}

export async function analyzeImageWithSightEngine(imageUrl: string): Promise<SightEngineImageResult> {
  try {
    const { apiUser, apiSecret } = getSightEngineCredentials();

    const params = new URLSearchParams({
      url: imageUrl,
      models: "genai,deepfake",
      api_user: apiUser,
      api_secret: apiSecret,
    });

    const response = await fetch(`${SIGHTENGINE_API_URL}/check.json`, {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: params.toString(),
    });

    if (!response.ok) {
      const errorBody = await response.text();
      console.error("[SightEngine] Image analysis error:", response.status, errorBody);
      return { success: false, aiGeneratedScore: 0, deepfakeScore: 0, error: `API error: ${response.status}` };
    }

    const result = await response.json() as any;

    if (result.status !== "success") {
      return { success: false, aiGeneratedScore: 0, deepfakeScore: 0, error: result.error?.message || "Unknown API error" };
    }

    return {
      success: true,
      aiGeneratedScore: result.type?.ai_generated ?? 0,
      deepfakeScore: result.type?.deepfake ?? 0,
    };
  } catch (error: any) {
    console.error("[SightEngine] Image analysis exception:", error.message);
    return { success: false, aiGeneratedScore: 0, deepfakeScore: 0, error: error.message };
  }
}

export async function analyzeVideoWithSightEngine(videoUrl: string): Promise<SightEngineVideoResult> {
  try {
    const { apiUser, apiSecret } = getSightEngineCredentials();

    const params = new URLSearchParams({
      url: videoUrl,
      models: "genai",
      interval: "2",
      api_user: apiUser,
      api_secret: apiSecret,
    });

    const response = await fetch(`${SIGHTENGINE_API_URL}/video/check-sync.json`, {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: params.toString(),
    });

    if (!response.ok) {
      const errorBody = await response.text();
      console.error("[SightEngine] Video analysis error:", response.status, errorBody);
      return { success: false, frames: [], error: `API error: ${response.status}` };
    }

    const result = await response.json() as any;

    if (result.status !== "success") {
      return { success: false, frames: [], error: result.error?.message || "Unknown API error" };
    }

    const frames: SightEngineVideoFrame[] = (result.data?.frames || []).map((f: any) => ({
      position: f.info?.position ?? 0,
      aiGeneratedScore: f.type?.ai_generated ?? 0,
    }));

    return { success: true, frames };
  } catch (error: any) {
    console.error("[SightEngine] Video analysis exception:", error.message);
    return { success: false, frames: [], error: error.message };
  }
}
