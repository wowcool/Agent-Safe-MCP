# AI Image Detection Tool — Research & Planning Document

**Date:** February 13, 2026
**Status:** Research / Pre-Development

---

## Overview

We want to add a new tool to Agent Safe that allows users (via their AI agent) to submit an image and receive a **best-guess assessment** of whether that image is real or AI-generated. The tool will combine multiple analysis techniques to produce a confidence score and breakdown.

**Critical framing:** This is always presented as an *estimate*, never a definitive answer. Both in marketing copy and in the tool's response to the agent.

---

## Proposed Architecture: Multi-Layer Analysis

We run **four layers of analysis in parallel** on each submitted image, then aggregate the results into a single confidence score with a per-layer breakdown.

### Layer 1 — Metadata (EXIF) Analysis *(Local, no API cost)*

| Detail | Info |
|--------|------|
| **What it does** | Inspects the image's EXIF metadata for camera model, GPS coordinates, shutter speed, lens info, software tags, etc. |
| **Why it matters** | Real photos from cameras contain rich metadata. AI-generated images typically have none, or have metadata that reveals generation software (e.g., "Stable Diffusion", "Adobe Firefly"). |
| **Library** | `sharp` (already fast and production-ready) or `exif-reader` for detailed EXIF parsing |
| **Cost** | $0 — runs entirely on our server |
| **Server load** | Negligible — metadata extraction is extremely fast (< 50ms per image) |
| **Limitation** | Metadata can be stripped from real photos too (social media strips EXIF), so missing metadata is a *signal*, not proof. |

### Layer 2 — Error Level Analysis (ELA) *(Local, no API cost)*

| Detail | Info |
|--------|------|
| **What it does** | Re-compresses the image at a known JPEG quality level and compares the error (difference) between the original and re-compressed version. |
| **Why it matters** | Real, unedited photos show uniform error levels across the image. AI-generated or manipulated images often show inconsistent error patterns — some regions compress differently than others. |
| **Library** | `sharp` — re-compress, then compute pixel-level differences |
| **Cost** | $0 — runs entirely on our server |
| **Server load** | Moderate — requires two compressions and a pixel-by-pixel comparison. ~200-500ms per image depending on size. Memory usage: ~50-150MB per operation for a typical photo. |
| **Limitation** | ELA is better at detecting *manipulation* (photoshopping) than pure AI generation. Modern diffusion models can produce images with very uniform error levels. Still a useful supporting signal. |

### Layer 3 — AI Detection API *(External API, has cost)*

This is the most powerful layer. Purpose-built ML models trained specifically to distinguish real from AI-generated images.

#### API Options Compared

| Provider | Pricing Model | Starting Cost | Per-Image Cost (est.) | AI Detection Accuracy | Notes |
|----------|--------------|---------------|----------------------|----------------------|-------|
| **SightEngine** | Monthly subscription | $29/mo (Starter) | ~$0.003-0.01/image depending on plan | High — detects Stable Diffusion, MidJourney, DALL-E, Flux, Firefly, GPT-image, Recraft, Imagen, and more | **Best option for us.** Simple REST API, clear pricing, all models included in every plan. Free tier available for testing. |
| **Hive Moderation** | Pay-as-go / Enterprise | $50 free credits, then custom | Not publicly listed — requires sales contact | Very high — industry leader | Enterprise-focused. AI detection only on enterprise tier. Better for large-scale operations. May be overkill initially. |
| **Illuminarty** | Monthly subscription | $10/mo (Basic) | Not publicly listed | Good | Smaller company. Good for basic detection. Less documentation on supported models. |

#### Recommendation: **SightEngine**

- Clear, predictable pricing starting at $29/month
- Detects all major AI generators including the latest models
- Simple REST API — one endpoint, one model parameter (`genai`)
- Returns confidence scores we can feed into our aggregation
- Works even when EXIF metadata has been stripped (analyzes pixel content directly)
- Free tier available for development and testing

### Layer 4 — Noise & Frequency Pattern Analysis *(Local, no API cost)*

| Detail | Info |
|--------|------|
| **What it does** | Analyzes the statistical distribution of pixel noise and high-frequency details in the image. AI-generated images tend to have unnaturally smooth noise patterns or characteristic frequency artifacts. |
| **Library** | `sharp` for pixel data extraction, custom analysis logic for standard deviation, histogram, and pattern detection |
| **Cost** | $0 — runs entirely on our server |
| **Server load** | Moderate — requires extracting raw pixel data and computing statistics. ~300-600ms per image. Memory: ~100-200MB for raw pixel buffer of a large image. |
| **Limitation** | Noise analysis is probabilistic — newer AI models are getting better at mimicking natural camera noise. Works best as a supporting signal alongside the API layer. |

---

## Question 1: How Much Does Layer 3 (API) Cost Us?

### SightEngine (Recommended)

| Plan | Monthly Cost | Included Operations | Effective Per-Image Cost |
|------|-------------|---------------------|------------------------|
| Free | $0 | Limited (testing only) | N/A |
| Starter | $29/mo | ~2,000 ops | ~$0.015/image |
| Growth | $99/mo | ~10,000 ops | ~$0.01/image |
| Pro | $399/mo | ~50,000 ops | ~$0.008/image |
| Enterprise | Custom | Unlimited | Negotiable |

### Resale Economics via MCP + Skyfire

If we charge **$0.02 per tool call** (matching our existing pricing):

| Our Plan | Our Cost/Image | Our Revenue/Image | Margin/Image | Break-even (images/month) |
|----------|---------------|-------------------|-------------|--------------------------|
| Starter ($29/mo) | ~$0.015 | $0.02 | $0.005 | ~5,800 |
| Growth ($99/mo) | ~$0.01 | $0.02 | $0.01 | ~9,900 |
| Pro ($399/mo) | ~$0.008 | $0.02 | $0.012 | ~33,250 |

**Note:** These margins assume *only* the API cost. The local processing layers (1, 2, 4) add server compute cost but no API cost. See Question 2 below.

**Recommendation:** Start on the **Starter plan ($29/mo)** during beta/launch. Move to Growth when volume justifies it. The margins are thin at Starter but we're covering costs, and the local analysis layers add significant value beyond just the API call — which justifies the $0.02 price point.

**Alternative pricing consideration:** Given that this tool does more compute than our text-based tools (image processing + API call), we could justify charging **$0.03-0.05 per scan** instead of $0.02. This would make the economics much more favorable.

---

## Question 2: Server Processing Load (Local Layers)

### Per-Image Resource Usage (Layers 1, 2, 4 combined)

| Resource | Estimated Usage | Notes |
|----------|----------------|-------|
| **CPU Time** | ~500ms - 1.2 seconds total | All three local layers combined. Sharp is highly optimized with multi-threading. |
| **Memory (Peak)** | ~150-300 MB | Mostly from raw pixel buffer during noise analysis. Freed after each request. |
| **Disk I/O** | Minimal | Image is received in memory, processed in memory. Only temp writes for ELA comparison. |

### Will It Be "A Lot" for Fly.io Servers?

**Short answer: No, it's very manageable.**

- **Sharp** (the library we'd use) is built on `libvips`, which is the fastest image processing library available. It's 4-5x faster than ImageMagick and designed for production server workloads.
- Processing one image takes roughly **1 second of CPU time** — comparable to a moderately complex API request.
- Memory spikes are temporary (per-request) and Sharp handles cleanup efficiently.
- The main risk is **concurrent requests** — if 10 users scan images simultaneously, that's ~1.5-3 GB of peak memory. But this is easily managed with:
  - A concurrency limiter (max 3-5 simultaneous image analyses)
  - `sharp.cache({ files: 0 })` to prevent memory buildup
  - Input size limits (reject images over 4000x4000 pixels / 10 MB)

### Comparison to Our Existing Tools

Our current message safety tools do text analysis + DNS lookups + API calls. The image tool would be roughly **2-3x heavier per request** in terms of CPU and memory, but still well within what a standard Fly.io instance handles.

### Recommended Safeguards

1. **Max image size:** 10 MB upload limit, 4000x4000 pixel limit
2. **Concurrency:** Process max 3 images simultaneously, queue the rest
3. **Timeout:** 15-second timeout per analysis (more than enough)
4. **Sharp config:** Disable caching, limit concurrency per the production best practices

---

## How Results Would Be Presented

### Example Response to Agent

```json
{
  "verdict": "likely_ai_generated",
  "confidence": 0.82,
  "disclaimer": "This is our best estimate based on multiple analysis techniques. No detection method is 100% accurate. AI generation technology evolves rapidly and some AI images may be indistinguishable from real photos.",
  "analysis": {
    "metadata": {
      "signal": "suspicious",
      "detail": "No camera EXIF data found. Image contains software tag indicating possible AI generation tool.",
      "weight": 0.15
    },
    "error_level_analysis": {
      "signal": "moderate_concern",
      "detail": "Error levels show unusual uniformity inconsistent with typical camera sensors.",
      "weight": 0.20
    },
    "ai_detection_model": {
      "signal": "ai_generated",
      "confidence": 0.89,
      "detail": "ML model identifies patterns consistent with diffusion-based image generation.",
      "weight": 0.45
    },
    "noise_analysis": {
      "signal": "suspicious",
      "detail": "Noise distribution lacks the natural variation expected from camera sensors.",
      "weight": 0.20
    }
  }
}
```

### Marketing Language (Website)

- "Get our best guess on whether an image is AI-generated or real"
- "Multi-layer analysis using forensic techniques and machine learning"
- "Not a guarantee — a professional assessment to help you make informed decisions"
- "AI detection technology is evolving rapidly. Our tool provides the best available analysis, but no method is 100% certain."

---

## Implementation Summary

| Component | Technology | Cost | Timeline |
|-----------|-----------|------|----------|
| Image upload endpoint | Express + multer | $0 | Backend route |
| EXIF analysis | sharp + exif-reader | $0 | Server-side |
| Error Level Analysis | sharp | $0 | Server-side |
| AI Detection API | SightEngine API | $29+/mo | API integration |
| Noise analysis | sharp + custom logic | $0 | Server-side |
| Results aggregation | Custom scoring logic | $0 | Server-side |
| MCP tool definition | New tool in MCP server | $0 | Tool registration |

### Total Estimated Cost Per Scan

| Component | Cost |
|-----------|------|
| SightEngine API | ~$0.008 - $0.015 |
| Server compute (Fly.io) | ~$0.001 - $0.003 |
| **Total cost per scan** | **~$0.01 - $0.018** |
| **Revenue per scan (at $0.02)** | **$0.02** |
| **Margin per scan** | **$0.002 - $0.01** |

If we price at **$0.03 per scan** (justified by the heavier compute + API cost), margins improve to $0.012 - $0.02 per scan.

---

## Open Questions / Next Steps

1. **Pricing decision:** Charge $0.02 (same as other tools) or $0.03-0.05 (reflecting higher cost)?
2. **SightEngine vs. alternatives:** Ready to sign up for SightEngine, or want to evaluate Hive/Illuminarty further?
3. **Scope:** Image-only for now, or also include deepfake video detection later?
4. **Tool name:** Suggestions: `check_image_authenticity`, `analyze_image_origin`, `detect_ai_image`
5. **Free tier:** Should this tool have any free scans, or is it paid-only from the start?

---

*This document is for internal planning. No code changes have been made.*
