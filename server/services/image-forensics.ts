import sharp from "sharp";

sharp.cache({ files: 0 });

export interface ExifAnalysisResult {
  hasCameraExif: boolean;
  hasGps: boolean;
  softwareTag: string | null;
  cameraModel: string | null;
  exifVerdict: "authentic_camera" | "no_metadata" | "ai_software_detected" | "edited";
  layerScore: number;
}

export interface ElaAnalysisResult {
  uniformityScore: number;
  suspiciousRegions: number;
  elaVerdict: "consistent" | "minor_anomalies" | "significant_anomalies";
  layerScore: number;
}

export interface NoiseAnalysisResult {
  noiseUniformity: number;
  frequencyScore: number;
  noiseVerdict: "natural_noise" | "suspicious_patterns" | "synthetic_noise";
  layerScore: number;
}

const AI_SOFTWARE_KEYWORDS = [
  "stable diffusion", "midjourney", "dall-e", "dall·e", "openai", "comfyui",
  "automatic1111", "invoke ai", "nai diffusion", "novelai", "flux",
  "firefly", "adobe firefly", "recraft", "imagen", "playground ai",
  "leonardo ai", "civitai", "ai generated", "diffusion",
];

const EDITING_SOFTWARE_KEYWORDS = [
  "photoshop", "gimp", "lightroom", "capture one", "affinity photo",
  "pixelmator", "paint.net", "snapseed",
];

export async function analyzeExif(imageBuffer: Buffer): Promise<ExifAnalysisResult> {
  try {
    const metadata = await sharp(imageBuffer).metadata();

    let exifData: Record<string, any> = {};
    if (metadata.exif) {
      try {
        const exifReader = await import("exif-reader");
        const parsed = exifReader.default ? exifReader.default(metadata.exif) : (exifReader as any)(metadata.exif);
        if (parsed) {
          if (parsed.Image) Object.assign(exifData, parsed.Image);
          if (parsed.Photo) Object.assign(exifData, parsed.Photo);
          if (parsed.GPSInfo) exifData._gps = parsed.GPSInfo;
          if (parsed.image) Object.assign(exifData, parsed.image);
          if (parsed.exif) Object.assign(exifData, parsed.exif);
          if (parsed.gps) exifData._gps = parsed.gps;
        }
      } catch (e) {
        console.warn("[EXIF] Parser warning:", (e as Error).message);
      }
    }

    const cameraModel = exifData.Model || exifData.model || null;
    const cameraMake = exifData.Make || exifData.make || null;
    const hasCameraExif = !!(cameraModel || cameraMake);
    const hasGps = !!(exifData._gps && (exifData._gps.GPSLatitude || exifData._gps.latitude));
    const software = (exifData.Software || exifData.software || "") as string;
    const softwareTag = software || null;

    const softwareLower = software.toLowerCase();
    const isAiSoftware = AI_SOFTWARE_KEYWORDS.some(kw => softwareLower.includes(kw));
    const isEditingSoftware = EDITING_SOFTWARE_KEYWORDS.some(kw => softwareLower.includes(kw));

    let exifVerdict: ExifAnalysisResult["exifVerdict"];
    let layerScore: number;

    if (isAiSoftware) {
      exifVerdict = "ai_software_detected";
      layerScore = 0.95;
    } else if (hasCameraExif && hasGps) {
      exifVerdict = "authentic_camera";
      layerScore = 0.1;
    } else if (hasCameraExif) {
      exifVerdict = "authentic_camera";
      layerScore = 0.2;
    } else if (isEditingSoftware) {
      exifVerdict = "edited";
      layerScore = 0.5;
    } else {
      exifVerdict = "no_metadata";
      layerScore = 0.7;
    }

    return { hasCameraExif, hasGps, softwareTag, cameraModel, exifVerdict, layerScore };
  } catch (error: any) {
    console.error("[EXIF] Analysis error:", error.message);
    return {
      hasCameraExif: false, hasGps: false, softwareTag: null, cameraModel: null,
      exifVerdict: "no_metadata", layerScore: 0.5,
    };
  }
}

export async function analyzeEla(imageBuffer: Buffer): Promise<ElaAnalysisResult> {
  try {
    const original = sharp(imageBuffer);
    const meta = await original.metadata();
    const width = Math.min(meta.width || 1000, 2000);
    const height = Math.min(meta.height || 1000, 2000);

    const rawOriginal = await sharp(imageBuffer)
      .resize(width, height, { fit: "inside" })
      .raw()
      .toBuffer();

    const recompressed = await sharp(imageBuffer)
      .resize(width, height, { fit: "inside" })
      .jpeg({ quality: 75 })
      .toBuffer();

    const rawRecompressed = await sharp(recompressed)
      .raw()
      .toBuffer();

    const minLen = Math.min(rawOriginal.length, rawRecompressed.length);
    const blockSize = 16;
    const numBlocks = Math.floor(minLen / (blockSize * 3));

    if (numBlocks === 0) {
      return { uniformityScore: 0.5, suspiciousRegions: 0, elaVerdict: "consistent", layerScore: 0.5 };
    }

    const blockErrors: number[] = [];
    for (let i = 0; i < numBlocks && i * blockSize * 3 + blockSize * 3 <= minLen; i++) {
      let blockError = 0;
      const start = i * blockSize * 3;
      for (let j = 0; j < blockSize * 3; j++) {
        const diff = Math.abs(rawOriginal[start + j] - rawRecompressed[start + j]);
        blockError += diff;
      }
      blockErrors.push(blockError / (blockSize * 3));
    }

    const mean = blockErrors.reduce((a, b) => a + b, 0) / blockErrors.length;
    const variance = blockErrors.reduce((a, b) => a + (b - mean) ** 2, 0) / blockErrors.length;
    const stdDev = Math.sqrt(variance);
    const cv = mean > 0 ? stdDev / mean : 0;

    const uniformityScore = Math.max(0, Math.min(1, 1 - cv));

    const threshold = mean + 2 * stdDev;
    const suspiciousRegions = blockErrors.filter(e => e > threshold).length;
    const suspiciousRatio = suspiciousRegions / blockErrors.length;

    let elaVerdict: ElaAnalysisResult["elaVerdict"];
    let layerScore: number;

    if (suspiciousRatio > 0.15 || cv > 0.8) {
      elaVerdict = "significant_anomalies";
      layerScore = 0.8;
    } else if (suspiciousRatio > 0.05 || cv > 0.5) {
      elaVerdict = "minor_anomalies";
      layerScore = 0.55;
    } else {
      elaVerdict = "consistent";
      layerScore = 0.2;
    }

    return { uniformityScore, suspiciousRegions, elaVerdict, layerScore };
  } catch (error: any) {
    console.error("[ELA] Analysis error:", error.message);
    return { uniformityScore: 0.5, suspiciousRegions: 0, elaVerdict: "consistent", layerScore: 0.5 };
  }
}

export async function analyzeNoise(imageBuffer: Buffer): Promise<NoiseAnalysisResult> {
  try {
    const meta = await sharp(imageBuffer).metadata();
    const width = Math.min(meta.width || 1000, 1000);
    const height = Math.min(meta.height || 1000, 1000);

    const rawData = await sharp(imageBuffer)
      .resize(width, height, { fit: "inside" })
      .greyscale()
      .raw()
      .toBuffer({ resolveWithObject: true });

    const { data, info } = rawData;
    const w = info.width;
    const h = info.height;

    const patchSize = 32;
    const patchStdDevs: number[] = [];

    for (let py = 0; py + patchSize <= h; py += patchSize) {
      for (let px = 0; px + patchSize <= w; px += patchSize) {
        let sum = 0;
        let sumSq = 0;
        const count = patchSize * patchSize;

        for (let y = py; y < py + patchSize; y++) {
          for (let x = px; x < px + patchSize; x++) {
            const val = data[y * w + x];
            sum += val;
            sumSq += val * val;
          }
        }

        const mean = sum / count;
        const variance = sumSq / count - mean * mean;
        patchStdDevs.push(Math.sqrt(Math.max(0, variance)));
      }
    }

    if (patchStdDevs.length < 4) {
      return { noiseUniformity: 0.5, frequencyScore: 0.5, noiseVerdict: "natural_noise", layerScore: 0.5 };
    }

    const noiseMean = patchStdDevs.reduce((a, b) => a + b, 0) / patchStdDevs.length;
    const noiseVariance = patchStdDevs.reduce((a, b) => a + (b - noiseMean) ** 2, 0) / patchStdDevs.length;
    const noiseStdDev = Math.sqrt(noiseVariance);
    const noiseCv = noiseMean > 0 ? noiseStdDev / noiseMean : 0;

    const noiseUniformity = Math.max(0, Math.min(1, 1 - noiseCv));

    let highFreqEnergy = 0;
    let totalPixels = 0;
    for (let y = 1; y < h - 1; y++) {
      for (let x = 1; x < w - 1; x++) {
        const center = data[y * w + x];
        const laplacian = Math.abs(
          -4 * center +
          data[(y - 1) * w + x] +
          data[(y + 1) * w + x] +
          data[y * w + (x - 1)] +
          data[y * w + (x + 1)]
        );
        highFreqEnergy += laplacian;
        totalPixels++;
      }
    }
    const avgHighFreq = totalPixels > 0 ? highFreqEnergy / totalPixels : 0;
    const normalizedHighFreq = Math.min(1, avgHighFreq / 30);

    const tooUniform = noiseUniformity > 0.85;
    const tooSmooth = normalizedHighFreq < 0.15;

    let frequencyScore: number;
    if (tooSmooth) {
      frequencyScore = 0.75;
    } else if (normalizedHighFreq > 0.6) {
      frequencyScore = 0.2;
    } else {
      frequencyScore = 0.4;
    }

    let noiseVerdict: NoiseAnalysisResult["noiseVerdict"];
    let layerScore: number;

    if (tooUniform && tooSmooth) {
      noiseVerdict = "synthetic_noise";
      layerScore = 0.85;
    } else if (tooUniform || tooSmooth) {
      noiseVerdict = "suspicious_patterns";
      layerScore = 0.6;
    } else {
      noiseVerdict = "natural_noise";
      layerScore = 0.2;
    }

    return { noiseUniformity, frequencyScore, noiseVerdict, layerScore };
  } catch (error: any) {
    console.error("[Noise] Analysis error:", error.message);
    return { noiseUniformity: 0.5, frequencyScore: 0.5, noiseVerdict: "natural_noise", layerScore: 0.5 };
  }
}
