# Image & Video Authenticity Tool — Final Execution Plan

**Date:** February 13, 2026
**Status:** Approved for Implementation
**Prepared after:** Full codebase audit, SightEngine API documentation review, Skyfire billing verification

---

## 1. What We're Building

A new MCP tool called `check_media_authenticity` that analyzes images (and short videos) to determine whether they are AI-generated, deepfaked, or authentic. The tool combines multiple analysis layers and returns a confidence-scored verdict with a per-layer breakdown.

**Critical framing (unchanged):** Results are always presented as a *best-guess estimate*, never a definitive answer — in the tool response, marketing copy, docs, and terms of service.

---

## 2. SightEngine API Integration (Verified)

API credentials confirmed present in secrets: `SIGHT_API_USER` and `SIGHT_API_SECRET`.

### 2.1 Image Analysis

**Endpoint:** `POST https://api.sightengine.com/1.0/check.json`

| Parameter | Value | Notes |
|-----------|-------|-------|
| `models` | `genai,deepfake` | Two models in one call. `genai` detects fully AI-generated images (Stable Diffusion, MidJourney, DALL-E, GPT-image, Firefly, Flux, Recraft, Imagen, etc.). `deepfake` detects face-swapped/modified photos. |
| `url` | Image URL | For URL-based analysis |
| `media` | Binary file | For direct upload (multipart/form-data) |
| `api_user` | `process.env.SIGHT_API_USER` | |
| `api_secret` | `process.env.SIGHT_API_SECRET` | |

**Response format (verified):**
```json
{
  "status": "success",
  "request": { "id": "req_...", "timestamp": 1709634469.399, "operations": 2 },
  "type": {
    "ai_generated": 0.99,
    "deepfake": 0.01
  },
  "media": { "id": "med_...", "uri": "image.jpg" }
}
```

- `ai_generated`: float 0-1, higher = more likely AI-generated
- `deepfake`: float 0-1, higher = more likely a deepfake (face swap)
- Using both models in one call counts as 2 operations on SightEngine's quota

### 2.2 Video Analysis (Short Videos < 60 seconds)

**Endpoint:** `POST https://api.sightengine.com/1.0/video/check-sync.json`

| Parameter | Value | Notes |
|-----------|-------|-------|
| `models` | `genai` | AI-generated video detection (Sora, Veo, Runway, Pika, Kling, etc.) |
| `media` | Binary file | Video file upload |
| `url` | Video URL | Alternative to file upload |
| `interval` | `2` | Check every 2 seconds (optional, controls frame sampling) |
| `api_user` | env | |
| `api_secret` | env | |

**Response format (verified):**
```json
{
  "status": "success",
  "request": { "id": "req_...", "operations": 40 },
  "data": {
    "frames": [
      { "info": { "id": "med_..._1", "position": 0 }, "type": { "ai_generated": 0.99 } },
      { "info": { "id": "med_..._2", "position": 2 }, "type": { "ai_generated": 0.98 } }
    ]
  }
}
```

**Important:** Video analysis uses significantly more SightEngine operations (1 per frame analyzed). A 30-second video at 2-second intervals = ~15 operations. This is why video costs more.

### 2.3 SightEngine Pricing (Our Cost)

| Plan | Monthly Cost | Operations Included | Effective Per-Op Cost |
|------|-------------|---------------------|----------------------|
| Starter | $29/mo | ~2,000 ops | ~$0.015/op |
| Growth | $99/mo | ~10,000 ops | ~$0.01/op |
| Pro | $399/mo | ~50,000 ops | ~$0.008/op |

**Per-image cost to us:** ~$0.02-0.03 (2 operations: genai + deepfake)
**Per-video cost to us:** ~$0.10-0.25 depending on length (many frames)

---

## 3. Pricing Strategy — How to Charge More via Skyfire

### 3.1 Current Billing Architecture (Audited)

The current flow for a $0.02 tool call:

1. Agent sends `skyfire-api-key` header (Buyer API Key)
2. Server calls `generatePayTokenFromBuyerKey(buyerApiKey, sellerServiceId)` — this generates a PAY token with `tokenAmount: "0.02"` hardcoded in `server/services/skyfire.ts` line 186
3. Server calls `chargeSkyfireToken(token, 0.02)` — charges the token
4. Done — $0.02 collected

**Key finding:** The `tokenAmount` in `generatePayTokenFromBuyerKey()` is currently hardcoded to `PRICE_PER_CHECK` ($0.02). To charge more, we simply need to pass a higher amount when generating the token AND when charging it.

The `chargeSkyfireToken()` function already accepts a custom `amount` parameter (line 101 of `skyfire.ts`). We just need `generatePayTokenFromBuyerKey()` to also accept a custom amount.

### 3.2 Recommended Approach: Variable Pricing per Tool

**Modify `generatePayTokenFromBuyerKey()` to accept an optional `amount` parameter** instead of hardcoding `PRICE_PER_CHECK`. Then create a new `validateAndChargeAmount()` function (or modify the existing `validateAndCharge()`) that accepts a custom price.

This is the cleanest approach and follows the existing pattern used by `analyze_email_thread` (which already describes multi-unit billing in its tool description, even though the code currently charges a flat $0.02).

### 3.3 Final Pricing

| Media Type | Price Charged | Our Cost (est.) | Margin |
|------------|--------------|-----------------|--------|
| **Image analysis** | **$0.04** (2 units) | ~$0.02-0.03 | $0.01-0.02 |
| **Video analysis (< 60s)** | **$0.08** (4 units) | ~$0.05-0.15 | Variable |

**Justification for $0.04/image:** The image tool runs 4 analysis layers (2 local + 2 SightEngine models), requires image processing compute, and calls a paid external API. This is 2x the complexity of text-based tools. Charging 2 units ($0.02 each) is consistent with the existing multi-unit pattern described for `analyze_email_thread`.

**Justification for $0.08/video:** Video analysis processes multiple frames, uses more SightEngine operations, and takes longer. 4 units is fair given the per-frame API costs.

### 3.4 Implementation in Skyfire Code

```typescript
// server/services/skyfire.ts — modify generatePayTokenFromBuyerKey
export async function generatePayTokenFromBuyerKey(
  buyerApiKey: string, 
  sellerServiceId: string,
  amount: number = PRICE_PER_CHECK  // NEW: optional amount parameter
): Promise<...> {
  // ... existing code, but use `amount` instead of PRICE_PER_CHECK
  body: JSON.stringify({
    type: "pay",
    tokenAmount: String(amount),  // was: String(PRICE_PER_CHECK)
    sellerServiceId,
  }),
}
```

```typescript
// server/mcp-server.ts — new validateAndCharge variant
async function validateAndCharge(
  skyfireToken: string | undefined, 
  buyerApiKey?: string | undefined,
  amount: number = PRICE  // NEW: default $0.02, pass $0.04 for images
): Promise<...> {
  // Same logic, but pass `amount` to generatePayTokenFromBuyerKey and chargeSkyfireToken
}
```

---

## 4. Four-Layer Analysis Architecture

### Layer 1 — EXIF/Metadata Analysis (Local, $0 cost)

| Detail | Info |
|--------|------|
| **What it does** | Extracts and inspects EXIF metadata: camera model, GPS, shutter speed, lens info, software tags |
| **Why** | Real camera photos have rich EXIF. AI images typically have none or reveal generation software |
| **Library** | `exif-reader` for detailed EXIF parsing (needs to be installed), `sharp` for basic metadata |
| **Performance** | < 50ms per image, negligible memory |
| **Limitation** | Social media strips EXIF. Missing metadata is a signal, not proof |

**Signals produced:**
- `has_camera_exif`: boolean — camera make/model present
- `has_gps`: boolean — GPS coordinates present
- `software_tag`: string | null — e.g. "Adobe Photoshop", "Stable Diffusion"
- `exif_verdict`: "authentic_camera" | "no_metadata" | "ai_software_detected" | "edited"

### Layer 2 — Error Level Analysis / ELA (Local, $0 cost)

| Detail | Info |
|--------|------|
| **What it does** | Re-compresses image at known JPEG quality, compares pixel-level differences |
| **Why** | Real photos show uniform error levels. Manipulated/AI images show inconsistent patterns |
| **Library** | `sharp` — re-compress and compute pixel differences |
| **Performance** | ~200-500ms, ~50-150MB memory per image |
| **Limitation** | Better at detecting manipulation than pure AI generation. Modern diffusion models can produce uniform error levels |

**Signals produced:**
- `uniformity_score`: 0-1 — how uniform the error levels are
- `suspicious_regions`: number — count of anomalous regions
- `ela_verdict`: "consistent" | "minor_anomalies" | "significant_anomalies"

### Layer 3 — SightEngine AI Detection (External API, paid)

| Detail | Info |
|--------|------|
| **What it does** | ML models trained on millions of images to distinguish real from AI-generated |
| **Models** | `genai` (fully AI-generated) + `deepfake` (face-swapped) |
| **API** | `POST https://api.sightengine.com/1.0/check.json` |
| **Performance** | ~500-1500ms network round-trip |
| **Cost** | 2 SightEngine operations per image call |

**Signals produced:**
- `ai_generated_score`: 0-1 — SightEngine's AI generation confidence
- `deepfake_score`: 0-1 — SightEngine's deepfake confidence  
- `api_verdict`: "likely_real" | "possibly_ai" | "likely_ai_generated" | "likely_deepfake"

### Layer 4 — Noise & Frequency Analysis (Local, $0 cost)

| Detail | Info |
|--------|------|
| **What it does** | Analyzes statistical distribution of pixel noise and high-frequency details |
| **Why** | AI images have unnaturally smooth noise or characteristic frequency artifacts |
| **Library** | `sharp` for raw pixel extraction, custom statistical analysis |
| **Performance** | ~300-600ms, ~100-200MB memory |
| **Limitation** | Newer AI models are improving at mimicking natural noise |

**Signals produced:**
- `noise_uniformity`: 0-1 — how natural the noise distribution is
- `frequency_score`: 0-1 — presence of AI-typical frequency artifacts
- `noise_verdict`: "natural_noise" | "suspicious_patterns" | "synthetic_noise"

### Aggregation Logic

Each layer produces a verdict with a weight:

| Layer | Weight | Rationale |
|-------|--------|-----------|
| EXIF/Metadata | 0.10 | Easily stripped/faked, but useful supporting signal |
| Error Level Analysis | 0.15 | Good for manipulation, weaker for pure AI |
| SightEngine API | 0.55 | Purpose-built ML models, most reliable signal |
| Noise Analysis | 0.20 | Complements the API with independent statistical analysis |

**Overall verdict mapping:**
- `likely_authentic` (score < 0.30)
- `inconclusive` (score 0.30-0.50)
- `possibly_ai_generated` (score 0.50-0.70)
- `likely_ai_generated` (score 0.70-0.90)
- `highly_likely_ai_generated` (score > 0.90)

---

## 5. Video Analysis

For video, we use SightEngine's synchronous video API (videos under 60 seconds only).

**Differences from image analysis:**
- Only SightEngine's `genai` model is used (no local layers — too expensive for video frames)
- The API returns per-frame scores; we aggregate them into an overall score
- Higher price ($0.08) due to higher API costs
- Max video size: 25 MB, max duration: 60 seconds
- Supported formats: MP4, MOV, AVI, WebM

**Video aggregation:** Average the `ai_generated` scores across all frames, with extra weight on the highest-scoring frames (max 30% weight, average 70% weight). This catches videos where only parts are AI-generated.

---

## 6. MCP Tool Definition

### Tool Name: `check_media_authenticity`

```typescript
check_media_authenticity: {
  description: `Analyze an image or short video to assess whether it is AI-generated, deepfaked, or authentic. Uses multi-layer analysis including metadata forensics, error level analysis, ML-based AI detection, and noise pattern analysis. Returns a confidence-scored verdict with per-layer breakdown. $0.04/image, $0.08/video via skyfire-api-key header. Results are best-guess estimates, not definitive. ${TERMS_NOTICE}`,
  schema: {
    mediaUrl: z.string().describe("URL of the image or video to analyze"),
    mediaType: z.enum(["image", "video"]).optional().describe("Type of media (auto-detected if omitted)"),
  },
}
```

**Design decisions:**
- Accept URL only (not base64) — simpler, avoids massive MCP payloads, and SightEngine accepts URLs directly
- Auto-detect media type from URL extension/content-type if not specified
- No optional flags — all layers run automatically (consistent with existing "no flags" philosophy)

### Response Format

```json
{
  "verdict": "likely_ai_generated",
  "confidence": 0.82,
  "mediaType": "image",
  "disclaimer": "This assessment is our best estimate using multiple analysis techniques. No detection method is 100% accurate. AI generation technology evolves rapidly.",
  "analysis": {
    "metadata": {
      "signal": "no_metadata",
      "detail": "No camera EXIF data found. No GPS, no camera model, no lens information.",
      "weight": 0.10,
      "layerScore": 0.70
    },
    "errorLevelAnalysis": {
      "signal": "minor_anomalies",
      "detail": "Error levels show unusual uniformity inconsistent with typical camera sensors.",
      "weight": 0.15,
      "layerScore": 0.60
    },
    "aiDetectionModel": {
      "signal": "likely_ai_generated",
      "detail": "ML model identifies patterns consistent with diffusion-based image generation.",
      "weight": 0.55,
      "aiGeneratedScore": 0.89,
      "deepfakeScore": 0.02,
      "layerScore": 0.89
    },
    "noiseAnalysis": {
      "signal": "suspicious_patterns",
      "detail": "Noise distribution lacks the natural variation expected from camera sensors.",
      "weight": 0.20,
      "layerScore": 0.75
    }
  },
  "recommendation": "This image is likely AI-generated. Exercise caution if authenticity matters.",
  "checkId": "chk_...",
  "charged": 0.04,
  "termsOfService": "https://agentsafe.locationledger.com/terms"
}
```

---

## 7. Code Changes Required

### 7.1 New Files

| File | Purpose |
|------|---------|
| `server/services/analyzers/media-authenticity.ts` | Main analyzer: orchestrates all 4 layers, aggregates results |
| `server/services/sightengine.ts` | SightEngine API client (image + video endpoints) |
| `server/services/image-forensics.ts` | Local analysis layers: EXIF extraction, ELA, noise analysis |

### 7.2 Modified Files

| File | Changes |
|------|---------|
| `server/services/skyfire.ts` | Add `amount` parameter to `generatePayTokenFromBuyerKey()` |
| `server/mcp-server.ts` | Add `check_media_authenticity` tool definition + handler; update `validateAndCharge()` to accept custom amount; update tool count from "9 tools" to "11 tools (8 paid + 2 free + 1 premium)" or "11 tools" |
| `server/services/analyzers/triage.ts` | Add media/image recommendation to triage logic; update `TriageInput` interface |
| `server/services/billing.ts` | Add image/video pricing constants |
| `shared/schema.ts` | Add `check_media_authenticity` to `ToolName` type; potentially add `check_video_authenticity` |
| `server/storage.ts` | No changes needed — existing `emailChecks` table already supports all tool types via `toolName` column |
| `client/src/pages/landing.tsx` | Add media authenticity tool card; update tool counts from 9 to 10+ |
| `client/src/pages/docs.tsx` | Add full documentation for new tool |
| `client/src/pages/how-it-works.tsx` | Add section explaining the multi-layer image analysis |
| `client/src/pages/terms.tsx` | Add media analysis disclaimers and liability terms |
| `README.md` | Add tool description (without exposing SightEngine as the API provider) |
| `replit.md` | Update architecture section |

### 7.3 NPM Packages to Install

| Package | Purpose |
|---------|---------|
| `exif-reader` | EXIF metadata extraction from images |
| `sharp` | Already available in the ecosystem (used by many Node.js projects) — verify if installed |

Check if `sharp` is already in `package.json`:

```bash
grep sharp package.json
```

If not installed, add `sharp` and `exif-reader` via the package installer.

---

## 8. Server Safeguards

| Safeguard | Value | Rationale |
|-----------|-------|-----------|
| Max image file size | 10 MB | Prevents memory abuse |
| Max image dimensions | 4000 x 4000 px | Prevents excessive processing |
| Max video file size | 25 MB | SightEngine sync API limits |
| Max video duration | 60 seconds | SightEngine sync API limit |
| Concurrent image analyses | Max 3 simultaneous | Prevents memory spikes (each analysis uses ~150-300 MB peak) |
| Analysis timeout | 15 seconds | More than enough for all layers |
| Sharp config | `sharp.cache({ files: 0 })` | Prevent memory buildup |

**Implementation:** Use a simple semaphore/counter to limit concurrent analyses. Queue requests that exceed the limit.

---

## 9. Triage Tool Updates

The free `assess_message` triage tool needs to recommend the new media tool when images/video are detected.

**Changes to `server/services/analyzers/triage.ts`:**

1. Add to `TriageInput` interface:
   - `imageUrl?: string` — direct image URL
   - `imageUrls?: string[]` — multiple image URLs
   - `videoUrl?: string` — direct video URL

2. Add recommendation logic:
   - If `imageUrl` or `imageUrls` present → recommend `check_media_authenticity` with `$0.04` cost
   - If `videoUrl` present → recommend `check_media_authenticity` with `$0.08` cost
   - If `media` array contains items with `type: "image"` and `url` → recommend `check_media_authenticity`

3. Update the `assess_message` MCP tool schema to include the new optional fields.

---

## 10. Frontend Updates

### 10.1 Landing Page (`client/src/pages/landing.tsx`)

- Update hero subtitle: add "images" and "videos" to the list
- Update tool count: "9 Tools" → "10 Tools" (or "11 Tools" if image and video are separate)
- Update badge: "9 Tools" → "10 Tools"  
- Update pricing badge: Add note about variable pricing
- Add new tool card for `check_media_authenticity` — featured card (similar to `check_message_safety`)
- Generate a tool image for the card (consistent with existing tool images)
- Update the rotating words array — "Photo" and "Image" are already there, consider adding "Video"

### 10.2 Documentation Page (`client/src/pages/docs.tsx`)

- Add `check_media_authenticity` to `toolDefinitions` array with full parameter docs
- Add to `restEndpoints` array
- Update Quick Start step 3 to mention the new tool
- Add pricing note: "$0.04/image, $0.08/video"
- Add code examples for image and video analysis

### 10.3 How It Works Page (`client/src/pages/how-it-works.tsx`)

- Add a new tool section explaining the 4-layer analysis
- Include diagram/explanation of how layers combine
- Show example response

### 10.4 Terms of Service (`client/src/pages/terms.tsx`)

Updates needed:

1. **Section 1 (Service Description):** Add `check_media_authenticity` (image and video AI-generation detection, deepfake detection) to the tool list. Mention it uses "multi-layer analysis including metadata forensics, statistical analysis, and machine learning models."

2. **Section 3 (Payment and Pricing):** Add variable pricing:
   - "Image authenticity analysis: $0.04 per scan (2 units)"
   - "Video authenticity analysis: $0.08 per scan (4 units)"

3. **Section 5 (Service Limitations):** Add:
   - "The media authenticity tool provides best-guess estimates of whether media is AI-generated. No detection method is 100% accurate. AI generation technology evolves rapidly, and some AI-generated media may be indistinguishable from authentic content."
   - "The tool analyzes media by URL only. We do not store submitted media beyond the time needed for analysis."
   - "Detection accuracy varies by AI model used to generate the content. Newer or less common generation methods may not be detected."

4. **Section 6 (Data Privacy):** Add:
   - "Images and videos submitted for analysis are processed by our systems and third-party analysis services. Media content is not permanently stored."

5. **Section 8 (Disclaimer):** Add:
   - "The media authenticity tool may fail to identify AI-generated images or videos (false negatives) or may incorrectly flag authentic media as AI-generated (false positives). Alibi Ledger, LLC is not responsible for any consequences arising from reliance on media authenticity assessments."

6. **Section 9 (Limitation of Liability):** Add:
   - "Damages resulting from reliance on AI-generated media detection results, including false positives and false negatives"

### 10.5 Tool Image Asset

Generate a new image for the tool card on the landing page and how-it-works page, consistent with the existing tool image style.

---

## 11. README Updates (`README.md`)

Add new tool section **without exposing SightEngine as the provider:**

```markdown
### 10. `check_media_authenticity`

Analyze images and short videos to assess whether they are AI-generated, deepfaked, or authentic. 
Uses multi-layer forensic analysis combining metadata inspection, error level analysis, 
machine learning detection models, and statistical noise pattern analysis. Returns a confidence-scored 
verdict with per-layer breakdown.

**Important:** Results are best-guess estimates. No detection method is 100% accurate.

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `mediaUrl` | string | Yes | URL of the image or video to analyze |
| `mediaType` | enum | No | `image` or `video` (auto-detected if omitted) |

**Pricing:** $0.04 per image scan, $0.08 per video scan (short videos up to 60 seconds).

**Supported formats:** JPEG, PNG, WebP, GIF (images); MP4, MOV, WebM (videos up to 60s, 25MB max).
```

Update counts throughout README:
- "9-Tool" → "10-Tool"
- "7 Paid + 2 Free" → "8 Paid + 2 Free"
- Tool table and REST endpoint table

---

## 12. `replit.md` Updates

- Update title: "10-Tool" instead of "9-Tool"
- Add `SIGHT_API_USER` and `SIGHT_API_SECRET` to Key Environment Variables
- Add `check_media_authenticity` to the tools list in MCP Server section
- Add `server/services/sightengine.ts` and `server/services/image-forensics.ts` to architecture
- Update analyzer count

---

## 13. Implementation Order

| Step | Task | Depends On |
|------|------|------------|
| 1 | Install NPM packages (`sharp`, `exif-reader`) | — |
| 2 | Create `server/services/sightengine.ts` — SightEngine API client | Step 1 |
| 3 | Create `server/services/image-forensics.ts` — local analysis layers (EXIF, ELA, noise) | Step 1 |
| 4 | Create `server/services/analyzers/media-authenticity.ts` — orchestrator + aggregation | Steps 2, 3 |
| 5 | Modify `server/services/skyfire.ts` — add `amount` parameter to `generatePayTokenFromBuyerKey` | — |
| 6 | Modify `server/mcp-server.ts` — add tool definition, handler, variable pricing | Steps 4, 5 |
| 7 | Update `shared/schema.ts` — add to ToolName type | — |
| 8 | Update `server/services/analyzers/triage.ts` — recommend media tool | Step 6 |
| 9 | Update `server/services/billing.ts` — add media pricing constants | — |
| 10 | Generate tool image asset | — |
| 11 | Update `client/src/pages/landing.tsx` — add tool card, update counts | Step 10 |
| 12 | Update `client/src/pages/docs.tsx` — full documentation | Step 6 |
| 13 | Update `client/src/pages/how-it-works.tsx` — add tool section | Step 10 |
| 14 | Update `client/src/pages/terms.tsx` — add media disclaimers | — |
| 15 | Update `README.md` — add tool, update counts, no API exposure | Step 6 |
| 16 | Update `replit.md` — architecture docs | Step 6 |
| 17 | Test end-to-end with SightEngine API | All |

---

## 14. Risk Assessment

| Risk | Mitigation |
|------|-----------|
| SightEngine rate limits | Start on Starter plan, monitor usage, upgrade to Growth when needed |
| Large images causing memory issues | Enforce 10MB / 4000x4000 limits, limit concurrency to 3 |
| SightEngine downtime | Return partial results from local layers only, with reduced confidence and a note that the ML layer was unavailable |
| New AI models not detected by SightEngine | SightEngine regularly updates their models. Our local layers provide additional signals. Disclaimer covers this |
| Video analysis costs exceeding revenue | $0.08 per video scan with careful size limits should maintain margins |

---

## 15. Verification Checklist

Before considering this feature complete:

- [ ] SightEngine image API returns valid scores for test images
- [ ] SightEngine video API returns valid frame scores for test videos
- [ ] Local EXIF analysis correctly identifies camera metadata
- [ ] Local ELA analysis produces meaningful uniformity scores
- [ ] Local noise analysis produces meaningful noise scores
- [ ] Aggregation logic produces reasonable overall verdicts
- [ ] Skyfire charges $0.04 for images and $0.08 for videos
- [ ] Triage tool recommends media analysis when images/video present
- [ ] Landing page displays new tool correctly
- [ ] Documentation page shows complete tool reference
- [ ] Terms of service include media analysis disclaimers
- [ ] README updated without exposing SightEngine
- [ ] All existing tools still function correctly (regression)

---

*This document is the final execution plan. All technical details have been verified against the live codebase and API documentation. Ready for implementation.*
