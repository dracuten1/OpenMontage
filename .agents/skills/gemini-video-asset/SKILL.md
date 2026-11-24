---
name: gemini-video-asset
description: Generate short AI video B-roll and motion assets via Gemini Web (gemini.google.com) in the user's real Chrome profile using agent-desktop, and ingest them into OpenMontage news/explainer projects with proper aspect ratio, provenance, and Remotion disclosure wiring.
---

# Gemini Web Video Asset Generation (via `agent-desktop`)

Use this skill when the user wants to generate **short video clips (`~10s`, `16:9`, `720p`) as B-roll or motion assets** using **Gemini Web** (`gemini.google.com/app`) in their real Google Chrome profile via `agent-desktop`.

**Why Gemini Web in Chrome instead of the native Gemini macOS app (`com.google.GeminiMacOS`):**
- In the native macOS Gemini app, the generated video card's download control is a hover-only overlay not exposed to headless `agent-desktop` accessibility actions, and the app's local video cache (`~/Library/Caches/com.google.GeminiMacOS/.../Videos/`) is encrypted (`data`).
- In **Google Chrome** (`gemini.google.com/app`), the `"Download video"` button is directly exposed in the accessibility tree (at `max_depth: 25`) and triggers macOS's native `save` sheet to save a clean `.mp4` to `~/Downloads/`.

**Provider Priority & Profile Fallback:**
- **`gemini-video-asset` is the primary Browser AI Video B-Roll provider.** Try each signed-in Chrome profile from `Local State` first.
- If a Chrome profile hits Gemini Web video quota/rate limits, fall back to the next signed-in Chrome profile.
- Once all Chrome profiles' Gemini Web quotas are exhausted, fall back to **`google-flow-asset`** (`.agents/skills/google-flow-asset/SKILL.md`) across all Chrome profiles.
- **Parallel Multi-Profile & Hybrid Gemini + Flow Strategy (2+ Clips):** When generating multiple short clips, run jobs concurrently instead of serially — open a second signed-in Chrome profile (`open -a "Google Chrome" --args --profile-directory="Profile 2" "https://gemini.google.com/app"`) OR run Gemini Web on one tab/profile while running **Google Flow** (`labs.google/fx/tools/flow`) on another tab/profile simultaneously.
- **Fast Quota Detection:** After submitting a prompt, check the Chrome tab title in the snapshot. If it changes to `"Video Generation Limit Reached - Google Gemini"`, immediately switch to the next signed-in Chrome profile or fall back to `google-flow-asset` without waiting for a timeout.

**Scope guardrail — Assets only:**
- Gemini video clips are **supporting visual assets** for scenes inside a larger OpenMontage composition (`SceneShell`, split panels, animated backdrops) — **never** treat a raw generated clip as a finished standalone video.
- For news explainers (`archival-editorial`), generated clips supplement (never replace) verified real press photos/footage of actual people or events, and **must** carry an on-screen `MINH HỌA AI / <Concept>` disclosure badge.

---

## Prerequisites

| Requirement | Purpose | How to Check |
|---|---|---|
| `agent-desktop` MCP server | Native macOS accessibility-tree control of Google Chrome & Save sheet | `desktop_status` → `accessibility: "granted"` (`screen_recording` optional) |
| Signed-in Chrome profile(s) | Holds the user's Google/Gemini subscription | Read `~/Library/Application Support/Google/Chrome/Local State` (`profile.info_cache`) |
| `ffmpeg` / `ffprobe` | Inspect resolution/duration/fps and extract frames for Vision QA | `which ffprobe ffmpeg` |
| Target OpenMontage project (optional) | Destination for ingested asset (`projects/<slug>/assets/video/`) | `ls projects/<slug>/` |

---

## Default Output Characteristics

| Property | Typical Value | Notes |
|---|---|---|
| **Aspect ratio** | **`16:9`** (explicitly specify `16:9` in prompt) | Fits `top-split` / card frames cleanly (`9:16` only if requested for `full-bleed`) |
| **Resolution** | **`1280×720` (720p)** | Standard Gemini Web video export |
| **Frame rate / Duration** | **`24 fps` · `~10.0s`** | H.264 (`yuv420p`) + AAC audio |
| **Watermark & audio** | Small bottom-right Gemini spark mark + AAC track | Always mute in Remotion (`<OffthreadVideo muted />`) or strip audio (`ffmpeg -an`), and let `top-split` framing / slight `objectFit: "cover"` crop mask the corner |

---

## Step-by-Step Execution Workflow

### Step 1: Discover Chrome Profiles (Read-Only)

Never guess Chrome profile directories. Inspect `Local State` first:

```bash
python3 -c "
import json, os
p = os.path.expanduser('~/Library/Application Support/Google/Chrome/Local State')
data = json.load(open(p, encoding='utf-8'))
for k, v in sorted(data.get('profile', {}).get('info_cache', {}).items()):
    print(k, '|', v.get('name'), '|', v.get('user_name'))
"
```

Confirm with the user which profile (`Default`, `Profile 1`, etc.) to use if multiple accounts are signed in.

### Step 2: Launch Chrome & Open `gemini.google.com/app`

1. Call `desktop_launch(app="Google Chrome", activate=true)` (or pass `args=["--profile-directory=<Dir>", "https://gemini.google.com/app"]` if launching fresh).
2. If Chrome is already running on the target profile, verify the toolbar profile button (`name="<ProfileName>"`) or `Google Account: ...` link in the page, then navigate cleanly:
   ```bash
   open -a "Google Chrome" "https://gemini.google.com/app"
   ```
3. Wait `3000ms` (`desktop_wait`), then snapshot Chrome with **`max_depth: 25`** (`desktop_snapshot(app="Google Chrome", compact=true, interactive_only=true, max_depth=25)`).
   *(Important: Chromium's web DOM in Gemini exceeds the default `max_depth: 10`; always pass `max_depth: 25` so `"Enter a prompt for Gemini"`, `"Send message"`, and `"Download video"` appear.)*

### Step 3: Craft Prompt & Inject via `desktop_set_value`

Author prompts with explicit `16:9` framing and documentary/editorial restraint:
- **Do include:** `16:9`, concrete subject, multi-beat or camera trajectory (aerial tracking, slow push-in, locked telephoto), lighting (golden hour, natural daylight, overcast), `35mm film grain texture`, realistic architectural/documentary detail.
- **Do exclude:** `no text, no subtitles, no logos, no watermarks, no neon glow, no glossy 3D plastic`.

**Prompt injection & submission:**
1. Locate `"Enter a prompt for Gemini"` (`textfield`) and inject the prompt via **`desktop_set_value(ref_id=..., value="<prompt>")`** (rather than `desktop_type`, which often fails Chromium post-action verification).
2. Re-snapshot Chrome (`max_depth: 25`, `interactive_only: true`, `compact: true`) to find `"Send message"` (`button`) and `desktop_click` it.

### Step 4: Poll to Completion

1. Wait for `"Download video"` using `desktop_wait(app="Google Chrome", text="Download video", timeout=30000)`.
2. If it times out after `30s`, snapshot Chrome (`max_depth: 25`, `interactive_only: true`, `compact: true`) to confirm `"Stop response"` is still active, then call `desktop_wait` again (generation typically takes `30–60s`).
3. Generation is complete when `"Download video"` (`button`) appears.

### Step 5: Download via Native macOS Save Sheet

1. `desktop_click` `"Download video"`.
2. Wait `3000ms` (`desktop_wait`).
3. Snapshot Chrome (`max_depth: 25`, `interactive_only: true`, `compact: true`) to detect macOS's native **`save` sheet** (`Where:`, `Save As:`, `Save`).
4. `desktop_click` `"Save"` (`button`) and wait `3000ms`.

### Step 6: Technical + Vision QA & Project Ingestion

1. Locate the newest `.mp4` in `~/Downloads/` (`gemini_generated_video_*.mp4`) and inspect with `ffprobe`:
   ```bash
   latest=$(ls -t ~/Downloads/*.mp4 | head -n 1)
   ffprobe -v error -show_entries format=duration,size:stream=codec_name,width,height,r_frame_rate -of json "$latest"
   ```
2. Extract 3–4 frames into the conversation scratch directory and inspect them with `read_file` to verify subject accuracy, scene progression, motion coherence, and absence of garbled text:
   ```bash
   ffmpeg -y -i "$latest" -vf "fps=0.35,scale=480:-1" "<scratch_dir>/frame_%02d.jpg"
   ```
3. If ingesting into an OpenMontage project:
   - Copy/move to `projects/<project-id>/assets/video/<asset-slug>.mp4` (and `remotion-composer/public/<project-id>/video/<asset-slug>.mp4` if rendering with Remotion).
   - Strip audio if needed: `ffmpeg -y -i src.mp4 -c:v copy -an dst.mp4`.
   - Record provenance (`provider: "gemini_web"`, `chrome_profile`, `aspect_ratio: "16:9"`, `resolution: "1280x720"`, `duration_sec`, `prompt`) in `asset_manifest.json` / `provenance.json`.
   - Render with `<OffthreadVideo muted />` and an explicit `MINH HỌA AI / <Concept>` badge.

---

## Common Pitfalls

- **Using default `max_depth: 10` in `desktop_snapshot`:** Hides Gemini Web's inner prompt box, `"Send message"`, and `"Download video"` buttons. Always use `max_depth: 25`.
- **Using `desktop_type` on `"Enter a prompt for Gemini"`:** Fails Chromium post-action verification. Always use `desktop_set_value`.
- **Trying to download from the native Gemini macOS app:** The native app's video card lacks an accessible Download button in headless mode and encrypts its local cache. Always use Chrome (`gemini.google.com/app`).
- **Missing the native Save sheet:** After clicking `"Download video"`, Chrome opens a macOS `save` sheet (`Save As:` / `Save`). Always wait `3000ms`, re-snapshot, and click `"Save"`.
