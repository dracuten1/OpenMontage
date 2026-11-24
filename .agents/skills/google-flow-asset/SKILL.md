---
name: google-flow-asset
description: Generate short AI video B-roll and motion assets via Google Flow (flow.google.com) in the user's real Chrome profile using agent-desktop, and ingest them into OpenMontage news/explainer projects with proper aspect ratio, provenance, and Remotion disclosure wiring.
---

# Google Flow Asset Generation (via `agent-desktop`)

Use this skill when the user wants to generate **short video clips (`4s–8s`) as B-roll or motion assets** using their **Google Flow** subscription credits (`flow.google.com` / `labs.google/fx/tools/flow`) in their real Google Chrome profile via `agent-desktop`.

**Provider Priority & Profile Fallback:**
- Prefer **`gemini-video-asset`** (`.agents/skills/gemini-video-asset/SKILL.md`) across all signed-in Chrome profiles first, unless exact `4–8s` / `360p` `Omni 1.2 Flash` control is explicitly required.
- When `google-flow-asset` is used (either as fallback after Gemini Web quotas are exhausted or by explicit selection), if the active Chrome profile runs out of Flow credits, fall back to the next signed-in Chrome profile from `Local State`.

**Scope guardrail — Assets only:**
- Google Flow clips are **supporting visual assets** for scenes inside a larger OpenMontage composition (`SceneShell`, split panels, animated backdrops) — **never** treat a raw Flow clip as a finished standalone video.
- For news explainers (`archival-editorial`), Flow clips supplement (never replace) verified real press photos/footage of actual people or events, and **must** carry an on-screen `MINH HỌA AI / <Concept>` disclosure badge.

---

## Prerequisites

| Requirement | Purpose | How to Check |
|---|---|---|
| `agent-desktop` MCP server | Native macOS accessibility-tree control of Google Chrome & Save sheet | `desktop_status` → `accessibility: "granted"` (`screen_recording` optional) |
| Signed-in Chrome profile(s) | Holds Google Flow credits | Read `~/Library/Application Support/Google/Chrome/Local State` (`profile.info_cache`) |
| `ffmpeg` / `ffprobe` | Inspect resolution/duration/fps and extract frames for Vision QA | `which ffprobe ffmpeg` |
| Target OpenMontage project (optional) | Destination for ingested asset (`projects/<slug>/assets/video/`) | `ls projects/<slug>/` |

---

## TikTok / News Asset Default Preset (Credit- & Speed-Optimized)

For TikTok / Shorts news explainers (`1080×1920`), Flow clips sit inside a compact region (Swiss Split `top-split` `1080×480–608px` or content-band frame `850×478px`, viewed on small phone screens), so **full-HD generation is unnecessary**. Default to this preset:

| Setting | Default Value | Notes |
|---|---|---|
| **Mode** | `Video` | — |
| **Video type** | `Ingredients` | Switch to `Frames` only when animating a specific start/end image |
| **Aspect ratio** | **`16:9`** | Fits `top-split` / card frames without cropping wide subjects (`9:16` only for `full-bleed` `1080×1920`) |
| **Model** | **`Omni 1.2 Flash`** | Fast generation; switches duration control from fixed pills to a continuous **Length** slider |
| **Resolution** | **`360p`** | Fast + **8 credits** (at 8s `x1`); crisp enough for mobile split/card regions under 35mm grain (`720p` only for rare `full-bleed` hero shots) |
| **Length** | **`4s–8s`** (adjust to scene beat) | Match scene duration + ~0.5–1s trim headroom |
| **Output count** | **`x1`** | Never burn `x2`–`x4` on an unverified prompt |

> **Watermark & audio note:** Flow downloads include an AAC audio stream and a small bottom-right spark mark. Always mute in Remotion (`<OffthreadVideo muted />`) or strip audio with `ffmpeg -an`, and let `top-split` framing / lower-third cinema bands (`y: 1444–1920`) or slight `objectFit: "cover"` crop mask the corner cleanly.

---

## Credit & Approval Governance

Before clicking **Start generation**, always confirm with the user (unless pre-approved for the batch):
1. **Chrome profile** (`Default` / `Profile N` — email & display name).
2. **Preset overrides (if any):** Default is **`16:9` · `Omni 1.2 Flash` · `360p` · `x1`** with **Length** matched to the scene (`4s–8s`).
3. **Credit cost** shown in Flow's Settings popover (e.g., `8 credits` for `360p` `8s` `x1` on `Omni 1.2 Flash`).

If a profile runs out of credits, stop and ask the user which other approved profile from `Local State` to switch to.

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

### Step 2: Launch Chrome & Pick the Target Profile

1. Call `desktop_launch(app="Google Chrome", activate=true)`.
2. Check windows with `desktop_list_windows(app="Google Chrome")` and run `desktop_snapshot(window_id=..., skeleton=true, compact=true)`.
3. If Chrome shows **"Who's using Chrome?"**:
   - Drill into its `webarea` ref (`desktop_snapshot(root=@ref, compact=true)`).
   - Click the matching `button` (`"Open <ProfileName> profile"`).
   - Wait `2000ms` and get the new `window_id` via `desktop_list_windows(app="Google Chrome")`.
4. If Chrome already opened a different profile window, verify the profile button in the toolbar (`name="<ProfileName>"`) or click it to switch profiles before navigating.

### Step 3: Open Google Flow

Navigate reliably in the active Chrome profile window:

```bash
open -a "Google Chrome" "https://labs.google/fx/tools/flow"
```

- Wait `4000ms` (`desktop_wait`), then `desktop_snapshot(window_id=..., skeleton=true, compact=true)`.
- Drill into the `webarea` (`"Google Flow - ..."`) via `desktop_snapshot(root=@webarea_ref, compact=true, max_depth=12)`.
- *(Why `open -a` instead of typing in the omnibox: Chromium's omnibox does not consistently submit on synthetic `CGEventPostToPid` `return`.)*

### Step 4: Create a Project & Dismiss Any Changelog Modal

1. Click `"New project"` (or open an existing Flow project). Wait `2500ms` and snapshot the new project `webarea`.
2. If `"What's new"` (`changelog-dialog`) blocks the canvas with `"Get started"` disabled:
   - Locate the `"Next"` button inside the embedded changelog iframe (`slide-1`). Note that iframe buttons often lack `AXPress` (`Click`) in `available_actions` but support `SetFocus`.
   - Call `desktop_focus` on `"Next"`, then `desktop_press(combo="space", window_id=...)` to advance to slide 2.
   - Re-snapshot the `webarea`, verify `"Get started"` is enabled, and `desktop_click` `"Get started"`.

### Step 5: Lock Generation Settings (`Settings trigger`)

Before typing a prompt, click `"Settings trigger"` and verify `cdk-overlay-*` matches the TikTok/news asset preset:
- **Mode:** `Video`
- **Video type:** `Ingredients` (Text-to-Video) or `Frames` (Image/First-Last-Frame-to-Video)
- **Aspect ratio:** `16:9` (default for split/card assets; `9:16` only for full-bleed)
- **Model (`Select model family`):** `Omni 1.2 Flash`
- **Video resolution:** `360p` (default for mobile split/card assets; `720p` only for full-bleed hero shots)
- **Length:** Adjust the `Length` slider (`desktop_set_value` or focus + Left/Right arrow keys) to match the target scene duration (`4–8s`)
- **Output count:** `x1`
- Read the `"N credits"` link to verify cost (`8 credits` at `360p` / `8 Sec` / `x1` on `Omni 1.2 Flash`).

### Step 6: Craft Prompt & Inject via `desktop_set_value`

Author prompts using the active playbook's visual constraints (`styles/archival-editorial.yaml` for news explainers):
- **Do include:** concrete subject, motion, camera trajectory (aerial tracking, slow push-in, locked telephoto), lighting (natural daylight, overcast), `35mm film grain texture`, realistic architectural/documentary detail.
- **Do exclude:** `no text, no subtitles, no logos, no watermarks, no neon glow, no glossy 3D plastic`.

**Prompt injection quirk in Chromium:**
1. `desktop_click` `"What do you want to create?"` (`textfield`) to close the Settings popover and focus the input.
2. Use **`desktop_set_value(ref_id=..., value="<prompt>")`** rather than `desktop_type` (Flow's rich-text field often rejects `desktop_type` post-action verification).
3. Re-snapshot `webarea` to confirm `"Start generation"` no longer has `states: ["disabled"]`.

### Step 7: Start Generation & Poll to Completion

1. `desktop_click` `"Start generation"`.
2. **Parallel multi-clip queueing (2+ clips):** You do **not** need to wait for Clip 1 to finish before submitting Clip 2. Wait `1500ms`, inject Clip 2's prompt into `"What do you want to create?"` via `desktop_set_value`, and click `"Start generation"` again so both clips render concurrently. For larger batches, you may also run Google Flow in one Chrome profile/tab while running `gemini-video-asset` (or another Flow tab) in a second Chrome profile simultaneously.
3. Wait in `25000–30000ms` increments (`desktop_wait`) and re-snapshot the `webarea` (`compact: true, max_depth: 15`, **omit `interactive_only: true`**) to monitor percentage (`4%` → `36%` → complete).
4. Generation is complete when the card displays `"Generated video thumbnail"` (`image` inside the prompt-titled `group`).

### Step 8: Download the Clip

1. `desktop_click` the generated video card (`group` with the short prompt title) to open the clip editor view.
2. Wait `1000ms`, snapshot the `webarea`, and `desktop_click` `"Download media"` (`combobox`).
3. Snapshot the `webarea` again and `desktop_click` the **Original size** `menuitem` (e.g., `"360p Original size"` / `"720p Original size"` — avoid paid upscaling unless explicitly requested).
4. Wait `1500–3000ms` and snapshot the **window** (`window_id=..., interactive_only=true, max_depth=10`).
   - **2nd+ download `alertdialog`:** On the second clip download in a session, Chrome may pop an `alertdialog` (`"flow.google.com wants to: Download multiple files"` with `"Block"` / `"Allow"`) *before* macOS's native `save` sheet opens. Click `"Allow"`, wait `2500ms`, then snapshot `surface="sheet"`.
5. On macOS's native **`save-panel` sheet** (`Where: Downloads`, `Save As: <filename>`), `desktop_click` `"Save"` (`OKButton`) and wait `2500–4000ms`.

### Step 9: Technical + Vision QA & Project Ingestion

1. Locate the new `.mp4` in `~/Downloads/` and inspect with `ffprobe`:
   ```bash
   ffprobe -v error -show_entries format=duration,size:stream=codec_name,width,height,r_frame_rate -of json "<file.mp4>"
   ```
2. Extract 3–4 frames (`ffmpeg -y -i "<file.mp4>" -vf "fps=0.5,scale=360:-1" ...`) into the conversation scratch directory and inspect them with `read_file` to verify subject accuracy, motion coherence, and absence of garbled text/watermarks.
3. If ingesting into an OpenMontage project:
   - Copy/move to `projects/<project-id>/assets/video/<asset-slug>.mp4` (and `remotion-composer/public/<project-id>/video/<asset-slug>.mp4` if rendering with Remotion).
   - Optionally strip audio: `ffmpeg -y -i src.mp4 -c:v copy -an dst.mp4`.
   - Record provenance (`provider: "google_flow"`, `model: "omni-1.2-flash"`, `resolution: "360p"`, `chrome_profile`, `aspect_ratio`, `duration_sec`, `credits_used`, `prompt`) in `asset_manifest.json` / `provenance.json`.
   - Render with `<OffthreadVideo muted />` and an explicit `MINH HỌA AI / <Concept>` badge.

---

## Self-Evaluation Rubric

| Criterion | 1 (Fail) | 3 (Acceptable) | 5 (Excellent) |
|---|---|---|---|
| **Aspect Ratio & Res Fit** | `9:16` for split card or `720p+` burned unnecessarily | Works after crop | `16:9` + `360p` + `Omni 1.2 Flash` for split/card assets (`9:16`/`720p` only when `full-bleed`) |
| **Credit Discipline** | Runs `x4` unapproved or guesses profile | `x1` on approved profile | Announces profile, settings, and credit cost before running `x1` |
| **Prompt Restraint** | Generates baked-in text, neon glow, or plastic 3D | Clean subject, minor style drift | Documentary 35mm texture, clean motion, zero baked-in text |
| **QA & Provenance** | Untested file left in `~/Downloads/` | `ffprobe` checked | `ffprobe` + Vision frame check + ingested with `MINH HỌA AI` badge |

---

## Common Pitfalls

- **Passing `desktop_type` to Flow's prompt box:** Fails post-action verification (`Post-action state does not match`). Always use `desktop_set_value` and verify `"Start generation"` is enabled.
- **Clicking iframe `"Next"` on the changelog modal:** `AXPress` is absent on iframe buttons. Use `desktop_focus` + `desktop_press(combo="space")`, then click `"Get started"`.
- **Missing the native Save dialog:** Chrome triggers a macOS `save-panel` sheet (`Where: Downloads`). Always snapshot the **window** (not just `webarea`) after clicking `"720p Original size"` to click `"Save"`.
- **Using `9:16` for split/card slots:** Crops left/right edges badly in `top-split` (`1080×480`–`608px`). Default to `16:9` for assets unless filling the full `1080×1920` screen.
- **Forgetting editorial disclosure:** Never ship an unbadged Flow clip in a news explainer — always label it `MINH HỌA AI / <Concept>`.
- **Completed video cards invisible with `interactive_only: true`:** `"Generated video thumbnail"` (`image`) inside each prompt `group` is filtered out when `interactive_only: true`. Always omit `interactive_only` (`compact: true, max_depth: 15`) when polling for completed cards and finding the card `group` ref to click.
- **2nd+ download blocked by `"Download multiple files"` `alertdialog`:** Click `"Allow"` on Chrome's permission prompt before looking for macOS's native `save` sheet.
- **`Length` slider rejects `desktop_set_value`:** Flow's slider (`val=5` = `8s`, `8 credits` at `360p`) often fails `desktop_set_value` post-action verification; keep default `8s` or adjust via focus + arrow keys.
- **Looping & cropping the Flow spark mark in Remotion:** `<OffthreadVideo>` has no `loop` prop — wrap it in `<Loop durationInFrames={236}>` (for an `8.0s` clip at `30fps`) and apply `objectFit: "cover"`, `transform: "scale(1.16)"`, `transformOrigin: "42% 36%"` to cleanly mask the bottom-right spark mark.
