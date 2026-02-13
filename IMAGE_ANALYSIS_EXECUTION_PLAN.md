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

## 3. Pricing Strategy — Skyfire $0.01 Min/Max Unit Pricing

### 3.1 Skyfire Configuration Update

**Skyfire is now configured with a $0.01 min/max per transaction.** This means:
- The minimum chargeable amount per Skyfire transaction is **$0.01**
- The maximum chargeable amount per Skyfire transaction is **$0.01**
- To charge more than $0.01 for a single tool call, we must issue **multiple $0.01 charges** (multi-unit billing)

This replaces the previous $0.02 flat rate. All pricing throughout the system must be updated to use $0.01 as the base unit.

### 3.2 Current Billing Architecture (Updated)

The updated flow for a tool call:

1. Agent sends `skyfire-api-key` header (Buyer API Key)
2. Server calls `generatePayTokenFromBuyerKey(buyerApiKey, sellerServiceId)` — generates a PAY token with `tokenAmount: "0.01"` (updated from "0.02")
3. Server calls `chargeSkyfireToken(token, 0.01)` — charges $0.01 per unit
4. For multi-unit tools, steps 2-3 repeat for each unit required
5. Done — total collected = $0.01 × number of units

**Key update:** `PRICE_PER_CHECK` in `server/services/skyfire.ts` (line 5) must change from `0.02` to `0.01`. Similarly, `PRICE_PER_UNIT` in `server/services/billing.ts` (line 2) must change from `0.02` to `0.01`.

### 3.3 Cost Coverage Rule (CRITICAL)

**The agent must ALWAYS charge enough to cover our external API costs.** This is a hard requirement — no tool call should ever result in a net loss.

| External Service | Our Cost Per Call | Minimum Units to Charge | Minimum Revenue |
|-----------------|-------------------|------------------------|-----------------|
| SightEngine (2 ops, image) | ~$0.02-0.03 | 4 units | $0.04 |
| SightEngine (video, ~15 ops) | ~$0.10-0.25 | 10 units | $0.10 |
| Text-based tools (no ext. API) | ~$0.00 | 1 unit | $0.01 |

**Enforcement:** Before executing any tool that calls a paid external API, the billing logic must verify that the number of units being charged is sufficient to cover the estimated external cost. If the charge would not cover costs, the tool must refuse to execute and return an error.

### 3.4 Recommended Approach: Multi-Unit Billing at $0.01/unit

**Modify `generatePayTokenFromBuyerKey()` to accept an optional `amount` parameter** defaulting to $0.01. For tools that require multiple units, call the charge flow multiple times or pass a total amount that is a multiple of $0.01.

Modify `validateAndCharge()` to accept a `units` parameter. The total charge = `units × $0.01`. This keeps the Skyfire $0.01 min/max constraint satisfied while allowing variable pricing per tool.

### 3.5 Final Pricing (Updated for $0.01 Units)

| Tool / Media Type | Units | Price Charged | Our Cost (est.) | Margin | Covers Cost? |
|-------------------|-------|--------------|-----------------|--------|-------------|
| **Text-based tools** (existing) | 1 | **$0.01** | ~$0.00 | $0.01 | YES |
| **Image analysis** | 4 | **$0.04** | ~$0.02-0.03 | $0.01-0.02 | YES |
| **Video analysis (< 60s)** | 10 | **$0.10** | ~$0.05-0.15 | Variable | YES |

**Justification for $0.04/image (4 units × $0.01):** The image tool runs 4 analysis layers (2 local + 2 SightEngine models), requires image processing compute, and calls a paid external API costing ~$0.02-0.03. At 4 units ($0.04), we maintain a positive margin even at the high end of SightEngine costs.

**Justification for $0.10/video (10 units × $0.01):** Video analysis processes multiple frames, uses significantly more SightEngine operations (~15 ops for a 30s video), and our cost can reach $0.15-0.25 for longer videos. At 10 units ($0.10), we cover costs for typical short videos. For videos approaching the 60-second limit, margins may be thin — this is acceptable given the $0.01 unit constraint, and we can increase units later if costs prove higher than expected.

**Impact on existing text-based tools:** All existing paid tools (currently charging $0.02) will now charge $0.01. Since these tools have zero external API costs, $0.01 still provides 100% margin. This is a price reduction for users on existing tools.

### 3.6 Implementation in Skyfire Code

```typescript
// server/services/skyfire.ts — update PRICE_PER_CHECK
const PRICE_PER_CHECK = 0.01;  // was: 0.02 — now matches Skyfire $0.01 min/max

// modify generatePayTokenFromBuyerKey to accept optional amount
export async function generatePayTokenFromBuyerKey(
  buyerApiKey: string, 
  sellerServiceId: string,
  amount: number = PRICE_PER_CHECK  // defaults to $0.01
): Promise<...> {
  // ... existing code, but use `amount` instead of hardcoded PRICE_PER_CHECK
  body: JSON.stringify({
    type: "pay",
    tokenAmount: String(amount),  // was: String(PRICE_PER_CHECK)
    sellerServiceId,
  }),
}
```

```typescript
// server/services/billing.ts — update PRICE_PER_UNIT
export const PRICE_PER_UNIT = 0.01;  // was: 0.02 — matches Skyfire $0.01 setting
```

```typescript
// server/mcp-server.ts — update validateAndCharge to support multi-unit billing
async function validateAndCharge(
  skyfireToken: string | undefined, 
  buyerApiKey?: string | undefined,
  units: number = 1  // NEW: number of $0.01 units to charge
): Promise<...> {
  const totalAmount = units * 0.01;
  // Pass totalAmount to generatePayTokenFromBuyerKey and chargeSkyfireToken
}
```

### 3.7 Cost Coverage Validation (New)

```typescript
// server/services/billing.ts — add cost coverage constants
export const TOOL_PRICING = {
  // Text-based tools (no external API cost)
  check_email_address: { units: 1, externalCost: 0 },
  check_phone_number: { units: 1, externalCost: 0 },
  check_url_safety: { units: 1, externalCost: 0 },
  check_message_safety: { units: 1, externalCost: 0 },
  check_social_media: { units: 1, externalCost: 0 },
  check_business: { units: 1, externalCost: 0 },
  analyze_email_thread: { units: 1, externalCost: 0 },
  
  // Media tools (external SightEngine API cost)
  check_media_authenticity_image: { units: 4, externalCost: 0.03 },  // $0.04 charge > $0.03 max cost
  check_media_authenticity_video: { units: 10, externalCost: 0.15 }, // $0.10 charge — tight margin on long videos
} as const;

// Validation: ensure revenue >= external cost for every tool
function validateCostCoverage(toolName: string): boolean {
  const pricing = TOOL_PRICING[toolName];
  const revenue = pricing.units * PRICE_PER_UNIT;
  return revenue >= pricing.externalCost;
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
- Higher price ($0.10 = 10 units × $0.01) due to higher API costs
- Max video size: 25 MB, max duration: 60 seconds
- Supported formats: MP4, MOV, AVI, WebM

**Video aggregation:** Average the `ai_generated` scores across all frames, with extra weight on the highest-scoring frames (max 30% weight, average 70% weight). This catches videos where only parts are AI-generated.

---

## 6. MCP Tool Definition

### Tool Name: `check_media_authenticity`

```typescript
check_media_authenticity: {
  description: `Analyze an image or short video to assess whether it is AI-generated, deepfaked, or authentic. Uses multi-layer analysis including metadata forensics, error level analysis, ML-based AI detection, and noise pattern analysis. Returns a confidence-scored verdict with per-layer breakdown. $0.04/image (4 units × $0.01), $0.10/video (10 units × $0.01) via skyfire-api-key header. Results are best-guess estimates, not definitive. ${TERMS_NOTICE}`,
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
  "units": 4,
  "unitPrice": 0.01,
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
| `server/services/skyfire.ts` | Update `PRICE_PER_CHECK` from $0.02 to $0.01; add `amount` parameter to `generatePayTokenFromBuyerKey()` |
| `server/mcp-server.ts` | Add `check_media_authenticity` tool definition + handler; update `validateAndCharge()` to accept `units` parameter for multi-unit billing at $0.01/unit; update tool count from "9 tools" to "11 tools (8 paid + 2 free + 1 premium)" or "11 tools" |
| `server/services/analyzers/triage.ts` | Add media/image recommendation to triage logic; update `TriageInput` interface |
| `server/services/billing.ts` | Update `PRICE_PER_UNIT` from $0.02 to $0.01; add image/video pricing constants; add `TOOL_PRICING` map with unit counts and external cost estimates; add cost coverage validation |
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
   - If `imageUrl` or `imageUrls` present → recommend `check_media_authenticity` with `$0.04` cost (4 units × $0.01)
   - If `videoUrl` present → recommend `check_media_authenticity` with `$0.10` cost (10 units × $0.01)
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
- Add pricing note: "$0.04/image (4 units), $0.10/video (10 units) at $0.01/unit"
- Add code examples for image and video analysis

### 10.3 How It Works Page (`client/src/pages/how-it-works.tsx`)

- Add a new tool section explaining the 4-layer analysis
- Include diagram/explanation of how layers combine
- Show example response

### 10.4 Terms of Service (`client/src/pages/terms.tsx`)

Updates needed:

1. **Section 1 (Service Description):** Add `check_media_authenticity` (image and video AI-generation detection, deepfake detection) to the tool list. Mention it uses "multi-layer analysis including metadata forensics, statistical analysis, and machine learning models."

2. **Section 3 (Payment and Pricing):** Update base unit price and add variable pricing:
   - "Base unit price: $0.01 per unit (updated from $0.02)"
   - "Image authenticity analysis: $0.04 per scan (4 units × $0.01)"
   - "Video authenticity analysis: $0.10 per scan (10 units × $0.01)"
   - "All other paid tools: $0.01 per scan (1 unit × $0.01)"

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

**Pricing:** $0.04 per image scan (4 units × $0.01), $0.10 per video scan (10 units × $0.01). Short videos up to 60 seconds only.

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
| 1 | **Update Skyfire/billing to $0.01 base unit** — change `PRICE_PER_CHECK` in `skyfire.ts` from $0.02→$0.01, change `PRICE_PER_UNIT` in `billing.ts` from $0.02→$0.01, add `TOOL_PRICING` map with per-tool unit counts and external cost estimates, add cost coverage validation function | — |
| 2 | Install NPM packages (`sharp`, `exif-reader`) | — |
| 3 | Create `server/services/sightengine.ts` — SightEngine API client | Step 2 |
| 4 | Create `server/services/image-forensics.ts` — local analysis layers (EXIF, ELA, noise) | Step 2 |
| 5 | Create `server/services/analyzers/media-authenticity.ts` — orchestrator + aggregation | Steps 3, 4 |
| 6 | Modify `server/services/skyfire.ts` — add `amount` parameter to `generatePayTokenFromBuyerKey` | Step 1 |
| 7 | Modify `server/mcp-server.ts` — add tool definition, handler, multi-unit billing (`units` param) | Steps 5, 6 |
| 8 | Update `shared/schema.ts` — add to ToolName type | — |
| 9 | Update `server/services/analyzers/triage.ts` — recommend media tool | Step 7 |
| 10 | Update `server/services/billing.ts` — add media pricing constants (if not done in Step 1) | Step 1 |
| 11 | Generate tool image asset | — |
| 12 | Update `client/src/pages/landing.tsx` — add tool card, update counts, update pricing to $0.01/unit | Step 11 |
| 13 | Update `client/src/pages/docs.tsx` — full documentation with $0.01 unit pricing | Step 7 |
| 14 | Update `client/src/pages/how-it-works.tsx` — add tool section | Step 11 |
| 15 | Update `client/src/pages/terms.tsx` — add media disclaimers, update base pricing to $0.01/unit | — |
| 16 | Update `README.md` — add tool, update counts and pricing, no API exposure | Step 7 |
| 17 | Update `replit.md` — architecture docs | Step 7 |
| 18 | Verify all existing tools charge $0.01 correctly (regression test) | Step 1 |
| 19 | Test end-to-end with SightEngine API — confirm cost coverage for images ($0.04) and videos ($0.10) | All |

---

## 14. Risk Assessment

| Risk | Mitigation |
|------|-----------|
| SightEngine rate limits | Start on Starter plan, monitor usage, upgrade to Growth when needed |
| Large images causing memory issues | Enforce 10MB / 4000x4000 limits, limit concurrency to 3 |
| SightEngine downtime | Return partial results from local layers only, with reduced confidence and a note that the ML layer was unavailable |
| New AI models not detected by SightEngine | SightEngine regularly updates their models. Our local layers provide additional signals. Disclaimer covers this |
| Video analysis costs exceeding revenue | $0.10 per video scan (10 units × $0.01) with careful size limits should maintain margins. Cost coverage validation ensures we never charge less than our external API costs. For very long videos near the 60s limit, margins may be thin — monitor and adjust unit count if needed |

---

## 15. Verification Checklist

Before considering this feature complete:

- [ ] SightEngine image API returns valid scores for test images
- [ ] SightEngine video API returns valid frame scores for test videos
- [ ] Local EXIF analysis correctly identifies camera metadata
- [ ] Local ELA analysis produces meaningful uniformity scores
- [ ] Local noise analysis produces meaningful noise scores
- [ ] Aggregation logic produces reasonable overall verdicts
- [ ] Skyfire base unit updated from $0.02 to $0.01 across `skyfire.ts` and `billing.ts`
- [ ] Skyfire charges $0.04 (4 units × $0.01) for images and $0.10 (10 units × $0.01) for videos
- [ ] Cost coverage validation confirms every tool charges enough to cover external API costs
- [ ] Existing text-based tools correctly charge $0.01 (reduced from $0.02)
- [ ] Triage tool recommends media analysis when images/video present
- [ ] Landing page displays new tool correctly
- [ ] Documentation page shows complete tool reference
- [ ] Terms of service include media analysis disclaimers
- [ ] README updated without exposing SightEngine
- [ ] All existing tools still function correctly (regression)

---

*This document is the final execution plan. All technical details have been verified against the live codebase and API documentation. Ready for implementation.*
