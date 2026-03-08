---
name: viraloop
description: OpenClaw AI agent skill for automated TikTok and Instagram carousel growth. Analyzes any website URL to extract brand, competitors, value proposition, then generates viral slides with auto-publishing and trending music via upload-post API. Built-in analytics feedback loop.
metadata: {"clawdbot":{"emoji":"🔄","requires":{"env":["GEMINI_API_KEY","UPLOADPOST_TOKEN"],"bins":["node","jq","uv"]}}}
---

# Viraloop

Analyze any website and generate a 6-slide carousel for TikTok/Instagram with visual coherence. Posts directly to your feed (no drafts) with auto trending music. Both APIs (Gemini + upload-post.com) have free plans — no credit card needed to start.

## Philosophy: Daily Automated Loop

The key to growth is **consistency + learning**. This skill is designed to run **every day, fully autonomous**. The agent executes the entire pipeline without asking for confirmation — from research to publishing — and only notifies you at the end with the published TikTok and Instagram URLs.

1. **Post 1 carousel per day** - Consistency beats virality
2. **Track everything** - Every post generates data
3. **Learn from data** - What hooks work? What times? What visuals?
4. **Iterate and improve** - Each carousel is better than the last

```
Day 1: Post → Analyze → Learn
Day 2: Post (improved) → Analyze → Learn  
Day 3: Post (better) → Analyze → Learn
...
Day 30: You have 30 data points and a refined strategy
```

The skill maintains a `learnings.json` that accumulates insights across all posts:
- Best performing hooks
- Optimal posting times
- Visual styles that work
- CTAs that convert

**This is not a one-shot tool. It's a growth engine.**

## Before You Start: Account Warmup

If your TikTok or Instagram accounts are brand new, **don't post carousels on day one**. Both platforms throttle reach on fresh accounts that jump straight into publishing content.

### TikTok (7-14 days warmup)

- Spend 30-60 minutes per day using TikTok normally: scroll, like (about 1 in 10 videos), follow accounts in your niche
- Wait until your For You page is dominated by content in your niche — that means the algorithm has profiled your account
- Only then start posting. Your first posts will reach the right audience instead of getting buried

### Instagram (5-7 days warmup)

- Browse Reels and the Explore page daily, engage with content in your niche
- Follow relevant accounts, like and comment genuinely
- Post 2-3 stories before your first carousel to signal the account is active

### Why this matters

Platforms flag accounts that go from zero activity to automated posting. A warmed-up account gets 5-10x more initial reach than a cold one. This step is boring but it's the difference between 500 views and 50,000 views on your first carousel.

If your accounts are already active and established, skip this and go straight to Quick Start.

## Quick Start

The agent should run the full pipeline automatically. **Do not ask for confirmation between steps.**

```bash
# 0. FIRST: Check analytics from previous posts + learn
#    (Skip this only on the very first run when there are no posts yet)
UPLOADPOST_TOKEN="your-token" bash {baseDir}/scripts/check-analytics.sh 7
node {baseDir}/scripts/learn-from-analytics.js

# 1. Full business research
node {baseDir}/scripts/analyze-web.js https://your-website.com

# 2. Read learnings.json and use best hooks/times/styles for this carousel
#    → Pick a hook style from bestHooks (or try a variation)
#    → Use recommended posting time
#    → Apply any insights from recommendations

# 3. Generate slides with visual coherence
GEMINI_API_KEY="your-key" bash {baseDir}/scripts/generate-slides.sh

# 4. Review slides with vision → auto-fix any broken ones
#    Agent uses its image-to-text model to verify each slide
#    If any slide has issues (cut text, bad quality, wrong spelling):
#      → Regenerate ONLY that slide automatically
#      → Re-verify until all 6 slides pass

# 5. Publish to TikTok + Instagram
UPLOADPOST_TOKEN="your-token" bash {baseDir}/scripts/publish-carousel.sh
```

**The agent only notifies the user at the very end**, with the published TikTok and Instagram post URLs. Everything else runs autonomously.

### How Learnings Improve Each Carousel

The `learnings.json` file grows smarter with every post. Before generating slides, the agent reads it and applies:

- **Best hooks:** Use hook styles that got the most views. Try variations of winners.
- **Best times:** Schedule publishing at the time that historically gets most reach.
- **Best days:** Prefer days that perform better.
- **Low performers:** Avoid hook styles that consistently underperform.
- **Engagement tips:** If engagement is low, use more provocative hooks or different visual styles.

This means carousel #30 will have dramatically better prompts than carousel #1.

**Agent Execution Schedule:** The agent shouldn't just run at a random time. It should read `learnings.json`, look at the `bestTimes` array, and **automatically adjust its own cron/automation schedule** so that tomorrow's execution happens right at the optimal publishing time.

**First runs (no data yet):** The first few times there won't be analytics data — that's fine. The agent uses the default hooks from `analyze-web.js` and the generic recommendations. After 5-10 posts, `learnings.json` will have enough data to start making meaningful recommendations. The more you post, the smarter it gets.

## Image Model

Uses **gemini-3.1-flash-image-preview** to generate slides.
- Local script: `{baseDir}/scripts/generate_image.py`
- Supports image-to-image for visual coherence between slides

## Step 1: Full Research (`analyze-web.js`)

Performs COMPLETE business investigation:

### 1. Brand Analysis
- Brand name (from domain or title)
- Logo (URL or SVG)
- CSS colors (background, primary, links, headings)
- Typography (body font, heading font)
- Favicon

### 2. Content Analysis
- Headline and tagline
- All headings (page structure)
- Features/benefits (title + description)
- Pricing/plans
- Testimonials
- Stats/metrics
- CTAs
- Meta tags (title, description, og:image)

### 3. Internal Pages
- Navigates pricing, features, about, testimonials
- Extracts additional content from each page

### 4. Competitor Detection
- Searches for known competitor mentions in content
- List of 20+ known SaaS competitors (Buffer, Hootsuite, Later, etc.)
- Detects "vs", "alternative", "compare" sections
- No external searches required - all from the website itself

### 5. Storytelling
- Detects business type (SaaS, ecommerce, app)
- Detects niche (social-media-tools, developer-tools, etc.)
- Generates hooks based on customer pain points
- Defines pain points from features
- Creates transformation narrative (before → after)

### 6. Visual Context
- Brand colors in CSS format
- Color description for prompts
- Typography for slides
- Image themes based on niche
- Style guide for coherence

**Output:** `/tmp/carousel/analysis.json`

## Step 2: Generate Slides (`generate-slides.sh`)

Generates 6 slides with visual coherence using image-to-image:

| Slide | Type | Content |
|-------|------|---------|
| 1 | **HOOK** | Question/problem that hooks. Establishes ALL visual style. |
| 2 | **Problem** | Agitate the pain. "You upload to TikTok... then Instagram..." |
| 3 | **Agitation** | Competition advancing. Urgency. |
| 4 | **Solution** | Present the product with its value proposition. |
| 5 | **Feature** | Main benefit. |
| 6 | **CTA** | "Link in bio 👆" + call to action. |

### Visual Coherence
- Slide 1 generates the base style (colors, typography, mood)
- Slides 2-6 use image-to-image with slide 1 as reference
- Maintains same color palette, fonts, and aesthetic

### Prompts per Slide
Each slide has:
- **Text:** The main message
- **Scene:** Detailed visual description for background
- **Style:** Based on brand analysis

**Output:** 
- `/tmp/carousel/slide-{1-6}.jpg`
- `/tmp/carousel/caption.txt`

## Step 3: Review with Vision (Autonomous)

After generating, the agent MUST review each slide using its vision/image-to-text model. **This step is fully automatic — do not ask the user to review.**

For each slide, verify:
- ✓ Text is fully legible and correct
- ✓ No words cut off at edges
- ✓ Product name spelled correctly
- ✓ Visual coherence between all slides
- ✓ No text in bottom 20% (TikTok controls area)
- ✓ Acceptable image quality (not blurry or distorted)

**If any slide fails:** Regenerate ONLY that specific slide automatically. Use the **same input image** that was used when originally generating it:
- Slide 1: no input image (it establishes the style)
- Slides 2-6: always use `slide-1.jpg` as `--input-image` (the original reference)

Re-verify after regenerating. Repeat until all 6 slides pass. Do not ask the user — fix it automatically.

## Image Format

- **Resolution:** 768x1376 (9:16 vertical ratio)
- **Format:** JPG (TikTok does NOT accept PNG)
- **Text:** Large, bold, with shadow for readability
- **Background:** Scene relevant to the business, not just solid colors

## Step 4: Publish to TikTok + Instagram (`publish-carousel.sh`)

Publishes the carousel directly to the TikTok and Instagram feed using Upload-Post API. 

```bash
UPLOADPOST_TOKEN="your-token" bash {baseDir}/scripts/publish-carousel.sh
```

**Endpoint:** `POST /api/upload_photos`
- Docs: https://docs.upload-post.com/api/upload-photo

**Parameters sent:**
- `platform[]=tiktok` + `platform[]=instagram`
- `auto_add_music=true` - Adds music on TikTok automatically
- `tiktok_title` - Short title (max 90 chars) + hashtags
- `title` - Full caption for Instagram
- `privacy_level=PUBLIC_TO_EVERYONE`
- `media_type=IMAGE` - Photo carousel on Instagram
- `async_upload=true` - Process in background
- `photos[]` - The 6 slides JPG

**⚠️ IMPORTANT Instagram:** 
After publishing, user must go to Instagram and add viral music manually:
1. Open Instagram → Profile → The post
2. Edit → Add music
3. Search for trending/viral song

**Output:** Saves `request_id` in `post-info.json` for tracking.

## Step 5: Analyze Performance (`check-analytics.sh`)

Gets TikTok and Instagram analytics to see what works.

```bash
UPLOADPOST_TOKEN="your-token" bash {baseDir}/scripts/check-analytics.sh 7
```

**Endpoints used:**

1. **Profile analytics:**
   ```
   GET /api/analytics/{user}?platforms=tiktok
   ```
   → Followers, likes, comments, shares, impressions

2. **Total impressions:**
   ```
   GET /api/uploadposts/total-impressions/{user}?platform=tiktok&breakdown=true
   ```
   → Total views per day

3. **Per-post analytics:**
   ```
   GET /api/uploadposts/post-analytics/{request_id}
   ```
   → Views, likes, comments for the specific carousel (TikTok + Instagram)

Docs: https://docs.upload-post.com/api/get-analytics

## Step 6: Learn and Improve (`learn-from-analytics.js`)

Analyzes data and saves learnings for future carousels. **This must run at the START of every daily loop**, not just at the end.

```bash
node {baseDir}/scripts/learn-from-analytics.js
```

**Generates/updates:**
- `learnings.json` - Accumulated knowledge base
- Best hooks (those generating most views)
- Optimal posting times and days
- Engagement rate tracking
- Recommendations for the next carousel

**The agent must read `learnings.json` before generating each new carousel** and use the insights to pick better hooks, avoid underperforming styles, and schedule at optimal times.

## Daily Loop (Complete Flow)

This is the exact sequence the agent runs every day, fully autonomous:

```bash
# STEP 0: Learn from previous posts (skip on first run)
UPLOADPOST_TOKEN="..." UPLOADPOST_USER="myuser" bash {baseDir}/scripts/check-analytics.sh 7
node {baseDir}/scripts/learn-from-analytics.js
# → Agent reads learnings.json and picks the best hook style
# → CRITICAL: Agent checks bestTimes and schedules ITS OWN NEXT EXECUTION for that exact hour tomorrow

# STEP 1: Research business
node {baseDir}/scripts/analyze-web.js https://my-product.com

# STEP 2: Generate slides (using insights from learnings)
GEMINI_API_KEY="..." bash {baseDir}/scripts/generate-slides.sh

# STEP 3: Review with vision → auto-fix broken slides
# Agent checks each slide, regenerates any that fail

# STEP 4: Publish
UPLOADPOST_TOKEN="..." UPLOADPOST_USER="myuser" bash {baseDir}/scripts/publish-carousel.sh

# → Notify user ONLY here, with TikTok + Instagram URLs
```

## Files

```
{baseDir}/
├── SKILL.md                      # This documentation
└── scripts/
    ├── analyze-web.js            # Full business research
    ├── generate-slides.sh        # Generate 6 slides with coherence
    ├── generate_image.py         # Gemini 3.1 flash image
    ├── review-slides.js          # Prepare slides for review
    ├── publish-carousel.sh       # Publish via Upload-Post API
    ├── check-analytics.sh        # Get analytics (TikTok + Instagram)
    ├── learn-from-analytics.js   # Learn from data
    └── search-competitors.js     # Optional external search
```

## Environment Variables

| Variable | Description |
|----------|-------------|
| `GEMINI_API_KEY` | Google API key for image generation |
| `UPLOADPOST_TOKEN` | Upload-Post token for publishing and analytics |
| `UPLOADPOST_USER` | Upload-Post username (required) |

## Hook Examples by Niche

| Niche | Hook Example |
|-------|--------------|
| Social Media Tools | "Still posting to social media ONE BY ONE? 😩" |
| SaaS General | "Still doing this MANUALLY?" |
| Ecommerce | "The product TikTok won't stop recommending" |
| App | "The app I wish I'd discovered sooner" |
| Developer Tools | "The API that's going to change your code" |

## Why Viraloop?

| | Viraloop | Other skills |
|-|----------|-------|
| Publishing | Direct to feed | Drafts only |
| Music | Auto trending music | Manual |
| Platforms | TikTok + Instagram | Single platform |
| Research | Auto URL analysis | Manual description |
| Image coherence | Image-to-image reference | Independent slides |
| Image gen | Gemini (free tier) | Paid providers |
| Posting | upload-post.com (free, no CC) | Paid or self-hosted |
| Text overlay | AI-native (Gemini renders) | External scripts |
| Prompts | Structured templates | Free-form |
| Setup | 3 env vars | Complex multi-tool setup |

## Notes

- Analysis extracts competitors from the website content itself (20+ known SaaS)
- Image-to-image maintains coherence but takes ~20s per slide
- Generated caption includes niche-relevant hashtags
- Always review slide text - sometimes it gets cut off
- `auto_add_music` on TikTok improves engagement
- Check analytics after 24-48h for meaningful data
- Learnings accumulate and improve with each published carousel
- TikTok title max 90 characters (auto-truncated with hashtags)
