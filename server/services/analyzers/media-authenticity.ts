import { analyzeImageWithSightEngine, analyzeVideoWithSightEngine } from "../sightengine";
import { analyzeExif, analyzeEla, analyzeNoise } from "../image-forensics";

const MAX_IMAGE_SIZE = 10 * 1024 * 1024;
const MAX_VIDEO_SIZE = 25 * 1024 * 1024;
const ANALYSIS_TIMEOUT_MS = 30000;

let concurrentAnalyses = 0;
const MAX_CONCURRENT = 3;

const IMAGE_EXTENSIONS = [".jpg", ".jpeg", ".png", ".webp", ".gif", ".bmp", ".tiff"];
const VIDEO_EXTENSIONS = [".mp4", ".mov", ".avi", ".webm", ".mkv"];

export type MediaType = "image" | "video";
export type MediaVerdict = "likely_authentic" | "inconclusive" | "possibly_ai_generated" | "likely_ai_generated" | "highly_likely_ai_generated";

export interface MediaAnalysisResult {
  verdict: MediaVerdict;
  confidence: number;
  mediaType: MediaType;
  disclaimer: string;
  analysis: {
    metadata?: {
      signal: string;
      detail: string;
      weight: number;
      layerScore: number;
    };
    errorLevelAnalysis?: {
      signal: string;
      detail: string;
      weight: number;
      layerScore: number;
    };
    aiDetectionModel: {
      signal: string;
      detail: string;
      weight: number;
      aiGeneratedScore?: number;
      deepfakeScore?: number;
      layerScore: number;
    };
    noiseAnalysis?: {
      signal: string;
      detail: string;
      weight: number;
      layerScore: number;
    };
  };
  recommendation: string;
}

function detectMediaType(url: string): MediaType {
  const cleanUrl = url.split("?")[0].split("#")[0].toLowerCase();
  if (VIDEO_EXTENSIONS.some(ext => cleanUrl.endsWith(ext))) return "video";
  if (IMAGE_EXTENSIONS.some(ext => cleanUrl.endsWith(ext))) return "image";
  return "image";
}

function mapVerdict(score: number): MediaVerdict {
  if (score < 0.30) return "likely_authentic";
  if (score < 0.50) return "inconclusive";
  if (score < 0.70) return "possibly_ai_generated";
  if (score < 0.90) return "likely_ai_generated";
  return "highly_likely_ai_generated";
}

function getRecommendation(verdict: MediaVerdict): string {
  switch (verdict) {
    case "likely_authentic": return "This media appears authentic based on our analysis. Standard verification practices still apply.";
    case "inconclusive": return "Our analysis could not make a strong determination. Consider additional verification if authenticity is critical.";
    case "possibly_ai_generated": return "Some indicators suggest this media may be AI-generated. Verify with additional sources if authenticity matters.";
    case "likely_ai_generated": return "This media is likely AI-generated. Exercise caution if authenticity matters.";
    case "highly_likely_ai_generated": return "Strong indicators suggest this media is AI-generated. Treat as synthetic content unless verified otherwise.";
  }
}

const DISCLAIMER = "This assessment is our best estimate using multiple analysis techniques. No detection method is 100% accurate. AI generation technology evolves rapidly.";

async function fetchImageBuffer(url: string): Promise<Buffer> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 15000);
  try {
    const response = await fetch(url, { signal: controller.signal });
    if (!response.ok) throw new Error(`Failed to fetch image: ${response.status}`);
    const contentLength = response.headers.get("content-length");
    if (contentLength && parseInt(contentLength) > MAX_IMAGE_SIZE) {
      throw new Error(`Image exceeds maximum size of ${MAX_IMAGE_SIZE / 1024 / 1024}MB`);
    }
    const arrayBuffer = await response.arrayBuffer();
    if (arrayBuffer.byteLength > MAX_IMAGE_SIZE) {
      throw new Error(`Image exceeds maximum size of ${MAX_IMAGE_SIZE / 1024 / 1024}MB`);
    }
    return Buffer.from(arrayBuffer);
  } finally {
    clearTimeout(timeout);
  }
}

export async function analyzeMediaAuthenticity(
  mediaUrl: string,
  mediaType?: MediaType,
): Promise<{ result: MediaAnalysisResult; durationMs: number }> {
  const startTime = Date.now();
  const resolvedType = mediaType || detectMediaType(mediaUrl);

  if (concurrentAnalyses >= MAX_CONCURRENT) {
    throw new Error("Too many concurrent analyses. Please try again in a moment.");
  }

  concurrentAnalyses++;
  try {
    if (resolvedType === "video") {
      return await analyzeVideo(mediaUrl, startTime);
    } else {
      return await analyzeImage(mediaUrl, startTime);
    }
  } finally {
    concurrentAnalyses--;
  }
}

async function analyzeImage(
  imageUrl: string,
  startTime: number,
): Promise<{ result: MediaAnalysisResult; durationMs: number }> {
  const [imageBufferResult, sightEngineResult] = await Promise.allSettled([
    fetchImageBuffer(imageUrl),
    analyzeImageWithSightEngine(imageUrl),
  ]);

  const imageBuffer = imageBufferResult.status === "fulfilled" ? imageBufferResult.value : null;
  const sightEngine = sightEngineResult.status === "fulfilled" ? sightEngineResult.value : null;

  let exifResult = null;
  let elaResult = null;
  let noiseResult = null;

  if (imageBuffer) {
    const [exifRes, elaRes, noiseRes] = await Promise.allSettled([
      analyzeExif(imageBuffer),
      analyzeEla(imageBuffer),
      analyzeNoise(imageBuffer),
    ]);
    exifResult = exifRes.status === "fulfilled" ? exifRes.value : null;
    elaResult = elaRes.status === "fulfilled" ? elaRes.value : null;
    noiseResult = noiseRes.status === "fulfilled" ? noiseRes.value : null;
  }

  const WEIGHTS = { metadata: 0.10, ela: 0.15, api: 0.55, noise: 0.20 };

  const metadataScore = exifResult?.layerScore ?? 0.5;
  const elaScore = elaResult?.layerScore ?? 0.5;
  const apiScore = sightEngine?.success
    ? Math.max(sightEngine.aiGeneratedScore, sightEngine.deepfakeScore)
    : 0.5;
  const noiseScore = noiseResult?.layerScore ?? 0.5;

  let totalWeight = 0;
  let weightedSum = 0;

  if (exifResult) { weightedSum += metadataScore * WEIGHTS.metadata; totalWeight += WEIGHTS.metadata; }
  if (elaResult) { weightedSum += elaScore * WEIGHTS.ela; totalWeight += WEIGHTS.ela; }
  if (sightEngine?.success) { weightedSum += apiScore * WEIGHTS.api; totalWeight += WEIGHTS.api; }
  else { totalWeight += WEIGHTS.api; weightedSum += 0.5 * WEIGHTS.api; }
  if (noiseResult) { weightedSum += noiseScore * WEIGHTS.noise; totalWeight += WEIGHTS.noise; }

  const overallScore = totalWeight > 0 ? weightedSum / totalWeight : 0.5;
  const verdict = mapVerdict(overallScore);

  let apiSignal = "unavailable";
  let apiDetail = "ML detection model was unavailable for this analysis.";
  if (sightEngine?.success) {
    if (sightEngine.aiGeneratedScore > 0.7) {
      apiSignal = "likely_ai_generated";
      apiDetail = "ML model identifies patterns consistent with AI-based image generation.";
    } else if (sightEngine.deepfakeScore > 0.7) {
      apiSignal = "likely_deepfake";
      apiDetail = "ML model detects face manipulation consistent with deepfake techniques.";
    } else if (sightEngine.aiGeneratedScore > 0.4 || sightEngine.deepfakeScore > 0.4) {
      apiSignal = "possibly_ai";
      apiDetail = "ML model detects some patterns that may indicate AI generation or manipulation.";
    } else {
      apiSignal = "likely_real";
      apiDetail = "ML model finds patterns consistent with authentic camera-captured imagery.";
    }
  }

  const durationMs = Date.now() - startTime;

  const result: MediaAnalysisResult = {
    verdict,
    confidence: Math.round(overallScore * 100) / 100,
    mediaType: "image",
    disclaimer: DISCLAIMER,
    analysis: {
      metadata: exifResult ? {
        signal: exifResult.exifVerdict,
        detail: buildExifDetail(exifResult),
        weight: WEIGHTS.metadata,
        layerScore: metadataScore,
      } : undefined,
      errorLevelAnalysis: elaResult ? {
        signal: elaResult.elaVerdict,
        detail: buildElaDetail(elaResult),
        weight: WEIGHTS.ela,
        layerScore: elaScore,
      } : undefined,
      aiDetectionModel: {
        signal: apiSignal,
        detail: apiDetail,
        weight: WEIGHTS.api,
        aiGeneratedScore: sightEngine?.success ? sightEngine.aiGeneratedScore : undefined,
        deepfakeScore: sightEngine?.success ? sightEngine.deepfakeScore : undefined,
        layerScore: apiScore,
      },
      noiseAnalysis: noiseResult ? {
        signal: noiseResult.noiseVerdict,
        detail: buildNoiseDetail(noiseResult),
        weight: WEIGHTS.noise,
        layerScore: noiseScore,
      } : undefined,
    },
    recommendation: getRecommendation(verdict),
  };

  return { result, durationMs };
}

async function analyzeVideo(
  videoUrl: string,
  startTime: number,
): Promise<{ result: MediaAnalysisResult; durationMs: number }> {
  const sightEngine = await analyzeVideoWithSightEngine(videoUrl);

  let overallScore = 0.5;
  let apiSignal = "unavailable";
  let apiDetail = "Video ML detection model was unavailable.";

  if (sightEngine.success && sightEngine.frames.length > 0) {
    const scores = sightEngine.frames.map(f => f.aiGeneratedScore);
    const avgScore = scores.reduce((a, b) => a + b, 0) / scores.length;
    const maxScore = Math.max(...scores);
    overallScore = avgScore * 0.7 + maxScore * 0.3;

    if (overallScore > 0.7) {
      apiSignal = "likely_ai_generated";
      apiDetail = `Video analysis across ${scores.length} frames identifies patterns consistent with AI-generated video content.`;
    } else if (overallScore > 0.4) {
      apiSignal = "possibly_ai";
      apiDetail = `Video analysis across ${scores.length} frames detects some patterns that may indicate AI generation.`;
    } else {
      apiSignal = "likely_real";
      apiDetail = `Video analysis across ${scores.length} frames finds patterns consistent with authentic camera-captured video.`;
    }
  }

  const verdict = mapVerdict(overallScore);
  const durationMs = Date.now() - startTime;

  const result: MediaAnalysisResult = {
    verdict,
    confidence: Math.round(overallScore * 100) / 100,
    mediaType: "video",
    disclaimer: DISCLAIMER,
    analysis: {
      aiDetectionModel: {
        signal: apiSignal,
        detail: apiDetail,
        weight: 1.0,
        aiGeneratedScore: sightEngine.success && sightEngine.frames.length > 0
          ? sightEngine.frames.reduce((a, f) => a + f.aiGeneratedScore, 0) / sightEngine.frames.length
          : undefined,
        layerScore: overallScore,
      },
    },
    recommendation: getRecommendation(verdict),
  };

  return { result, durationMs };
}

function buildExifDetail(exif: NonNullable<Awaited<ReturnType<typeof analyzeExif>>>): string {
  if (exif.exifVerdict === "ai_software_detected") {
    return `AI generation software detected in metadata: "${exif.softwareTag}".`;
  }
  if (exif.exifVerdict === "authentic_camera") {
    const parts = [`Camera: ${exif.cameraModel || "detected"}`];
    if (exif.hasGps) parts.push("GPS coordinates present");
    return parts.join(". ") + ".";
  }
  if (exif.exifVerdict === "edited") {
    return `Image editing software detected: "${exif.softwareTag}". May have been modified.`;
  }
  return "No camera EXIF data found. No GPS, no camera model, no lens information.";
}

function buildElaDetail(ela: NonNullable<Awaited<ReturnType<typeof analyzeEla>>>): string {
  if (ela.elaVerdict === "significant_anomalies") {
    return `Error levels show significant inconsistencies (${ela.suspiciousRegions} anomalous regions), suggesting manipulation or AI generation.`;
  }
  if (ela.elaVerdict === "minor_anomalies") {
    return `Error levels show some unusual patterns (${ela.suspiciousRegions} anomalous regions), minor inconsistencies detected.`;
  }
  return "Error levels are consistent across the image, typical of unmodified camera captures.";
}

function buildNoiseDetail(noise: NonNullable<Awaited<ReturnType<typeof analyzeNoise>>>): string {
  if (noise.noiseVerdict === "synthetic_noise") {
    return "Noise distribution is unnaturally uniform, lacking the natural variation expected from camera sensors. Consistent with AI-generated imagery.";
  }
  if (noise.noiseVerdict === "suspicious_patterns") {
    return "Noise patterns show some characteristics not typical of natural camera sensor noise.";
  }
  return "Noise distribution shows natural variation consistent with camera sensor capture.";
}
