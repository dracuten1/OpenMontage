---
name: google-flow-music
description: Generate reusable instrumental background music beds and musical stingers via Google Flow Music (flowmusic.google) in the user's real Chrome profile using agent-desktop, verify audio specs with ffprobe, and ingest them into OpenMontage's music_library/bgm/ or project assets.
---

# Google Flow Music Generation (via `agent-desktop`)

Use this skill when an OpenMontage video needs a **new instrumental background music (BGM) track or musical stinger** generated via **Google Flow Music** (`flowmusic.google`, powered by DeepMind Lyria) in the user's real Google Chrome profile using `agent-desktop`.

**Reuse-First Policy (Mandatory):**
- Always inspect `music_library/bgm/README.md` and `music_library/bgm/` **first** before generating new music.
- Only generate a new track when no existing track matches the episode's mood, genre, or rotation needs (e.g., somber/humanitarian news, melancholic folklore, or a new series).

**Scope Guardrail — Music & Musical Stingers Only:**
- **Use for:** Full-length instrumental BGM beds (`~2m40s–3m00s`) and musical transitions/stingers (news jingles, gong hits, orchestral risers — trim to `1–4s` with `ffmpeg`).
- **Do NOT use for dry foley SFX** (clicks, footsteps, paper rustles, alarms, thunder). For discrete SFX, use `music_library/sfx/`, YouTube Audio Library (`studio.youtube.com` → Audio Library → Sound Effects), `freesound_music.py`, or extract native audio (`ffmpeg -vn`) from a `google-flow-asset` clip.

---

## Prerequisites

| Requirement | Purpose | How to Check |
|---|---|---|
| `agent-desktop` MCP server | Native macOS accessibility-tree control of Google Chrome & Save sheet | `desktop_status` → `accessibility: "granted"` |
| Signed-in Chrome profile(s) | Holds the user's Google Flow Music access/credits | Read `~/Library/Application Support/Google/Chrome/Local State` (`profile.info_cache`) |
| `ffmpeg` / `ffprobe` | Inspect duration/codec/sample rate, trim stingers, or strip cover art (`-vn`) | `which ffprobe ffmpeg` |
| Reusable BGM catalog | Destination for reusable series tracks (`music_library/bgm/`) | `ls music_library/bgm/` |

---

## Verified Output Characteristics

Tracks downloaded from `flowmusic.google` have these typical technical specs (verified via `ffprobe`):

| Property | Typical Value | Notes |
|---|---|---|
| **Container** | `.m4a` | Natively supported by OpenMontage's `tools/audio/music_library.py` |
| **Audio stream** | `AAC` · `48000 Hz` · `2 ch (stereo)` · `~116 kbps` | Clean broadcast-ready sample rate |
| **Duration** | `~160s–180s` (`2:40–3:00`) | Long enough for shorts & explainers without awkward looping |
| **Cover art stream** | Embedded `mjpeg` video stream | Always pass `-vn` when trimming/converting with `ffmpeg` |

---

## Prompting Rules for OpenMontage Voiceover Beds

Every BGM prompt for narrated videos MUST follow these rules so Lyria doesn't clash with speech:
1. **Start with:** `Instrumental only, no vocals, no lyrics.` (Lyria defaults to singing unless explicitly prohibited.)
2. **Specify instruments & genre concretely:** e.g., *đàn tranh, đàn bầu, sáo trúc, Đông Sơn bronze drums* for `vn-myth`; *electronic kick, marimba synth plucks, warm analog bass* for `ky-chu-diem-tin`; *pizzicato strings, wooden marimba, felt piano* for `explainer`.
3. **Protect voiceover clarity:** Include phrases like `spacious mix`, `uncluttered mid-range designed to sit cleanly under voiceover narration`, and avoid heavy lead distortion or loud brass hits during body sections.
4. **Anchor tempo & key:** Include a target BPM (`65–115 BPM`) and key/scale (e.g., `C minor pentatonic`, `D minor`, `F major`).

### Reference Templates
- **VN-Myth (Folklore / Epic / Sacred):**  
  `Instrumental only, no vocals, no lyrics. Atmospheric Vietnamese folklore documentary soundtrack. Delicate plucked đàn tranh zither and expressive đàn bầu monochord playing a traditional Vietnamese pentatonic melody, warm sáo trúc bamboo flute, soft ambient string pads. Mysterious, reverent mood, spacious mix for voiceover narration, 78 BPM, C minor pentatonic.`
- **News / Commentary (Daily / Drama / Debate / Analysis):**  
  `Instrumental only, no vocals, no lyrics. Modern TV tech news broadcast background music. Tight electronic kick and subtle hi-hat groove, clean marimba-style synth plucks, warm analog bassline, airy pad swells. Confident, upbeat studio vibe, uncluttered mid-range for voiceover, 114 BPM, C major.`
- **Explainer (Vox-Style / Calm Breakdown):**  
  `Instrumental only, no vocals, no lyrics. Curious, playful Vox-style editorial documentary background music. Bouncy pizzicato strings, warm wooden marimba patterns, soft brushed snare groove, gentle upright bass. Engaging storytelling energy without overpowering voiceover, 100 BPM, F major.`

---

## Credit & Profile Governance

Before submitting a generation prompt, confirm with the user (unless pre-approved for the batch):
1. **Chrome profile** (`Default` / `Profile N` — email & display name from `Local State`).
2. **Track purpose & prompt** (confirming no existing track in `music_library/bgm/README.md` already fits).
3. **Destination:** reusable `music_library/bgm/<category>/` vs. single-project `projects/<project-id>/assets/music/`.

If the active profile hits a quota or credit limit, stop and ask the user which other signed-in Chrome profile from `Local State` to switch to.

---

## Step-by-Step Execution Workflow (`agent-desktop`)

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

### Step 2: Launch Chrome & Open `flowmusic.google`

1. Call `desktop_launch(app="Google Chrome", activate=true)`.
2. Check windows with `desktop_list_windows(app="Google Chrome")` and verify the active profile (or select the approved profile if Chrome shows `"Who's using Chrome?"`).
3. Navigate reliably via macOS `open` (avoid typing into Chromium's omnibox):
   ```bash
   open -a "Google Chrome" "https://flowmusic.google"
   ```
4. Wait `4000ms` (`desktop_wait`), then snapshot the window skeleton (`desktop_snapshot(window_id=..., skeleton=true, compact=true)`) and drill into the Flow Music `webarea` (`desktop_snapshot(root=@webarea_ref, compact=true, max_depth=20)`).

### Step 3: Inject Prompt & Start Generation

1. Locate the prompt input (`textfield` / `textarea`) in the `webarea` snapshot.
2. Focus/click it, then inject the prompt using **`desktop_set_value(ref_id=..., value="<prompt>")`** (prefer `desktop_set_value` over `desktop_type` for Chromium rich-text inputs).
3. Re-snapshot `webarea` to confirm the submit / generate button is enabled, then `desktop_click` it.
4. Wait in `15000–25000ms` increments (`desktop_wait`) and re-snapshot the `webarea` (`compact: true, max_depth: 20`, omit `interactive_only: true` when checking status text/cards) until the generated track card and audio player / download controls appear.

### Step 4: Iterative Refinement (Optional)

If the user wants adjustments (e.g., sparser percussion or softer melody under voiceover), use Flow Music's conversational AI Producer input to request a revision before downloading.

### Step 5: Download the `.m4a` Track

1. Locate the track's Download button or overflow menu (`...` → `Download` / audio format option) in the `webarea` snapshot and click it.
2. Wait `1500–3000ms` and snapshot the **window** (`window_id=..., interactive_only=true, max_depth=10`):
   - **2nd+ download `alertdialog`:** Chrome may pop `"flowmusic.google wants to: Download multiple files"` (`Block` / `Allow`). Click `"Allow"`, wait `2500ms`, then snapshot `surface="sheet"`.
3. On macOS's native **`save-panel` sheet** (`Where: Downloads`), click `"Save"` (`OKButton`) and wait `2500–4000ms`.

### Step 6: Technical QA, Ingestion & Catalog Update

1. Locate the newly downloaded `.m4a` in `~/Downloads/` (`ls -lt ~/Downloads/ | head -n 10`) and verify with `ffprobe`:
   ```bash
   ffprobe -v error -show_entries format=duration,bit_rate,size:stream=codec_name,sample_rate,channels -of json "<file.m4a>"
   ```
2. **Check audio cleanliness:** Confirm duration (`> 30s` for BGM), `48000 Hz` stereo AAC, and non-zero bitrate. If converting to MP3/WAV or trimming a musical stinger, always strip the embedded `mjpeg` cover art stream with `-vn`:
   ```bash
   ffmpeg -y -i "<src.m4a>" -vn -ss 0 -t 3.5 -c:a aac -b:a 192k "<stinger.m4a>"
   ```
3. **Ingest to the right destination:**
   - **Reusable series BGM (preferred):** Copy with a clean kebab-case filename to `music_library/bgm/<category>/<slug>.m4a` (e.g., `vn-myth/`, `ky-chu-diem-tin/`, `explainer/`) and add a row (file path, duration, vibe/BPM, "When to Use") to `music_library/bgm/README.md`.
   - **Project-specific BGM:** Copy to `projects/<project-id>/assets/music/<slug>.m4a` (and `remotion-composer/public/<project-id>/audio/<slug>.m4a` if used directly in Remotion) and record provenance (`provider: "google_flow_music"`, `model: "lyria"`, `chrome_profile`, `duration_sec`, `prompt`) in `asset_manifest.json`.
4. **Mixing reminder:** Duck BGM to approximately **`-18 dB` to `-22 dB`** under speech (rising to `-14 dB` in intro/outro gaps).

---

## Common Pitfalls

- **Forgetting `Instrumental only, no vocals, no lyrics`:** Lyria frequently generates sung lyrics that fight the narrator's voice.
- **Using `desktop_type` on Chromium rich-text boxes:** Fails post-action verification; always use `desktop_set_value`.
- **Missing the embedded `mjpeg` cover art stream in `ffmpeg`:** Flow Music `.m4a` files contain a JPEG artwork stream; pass `-vn` during any `ffmpeg` trim/transcode/mix command so it isn't treated as a video track.
- **2nd+ download blocked by Chrome's multi-file `alertdialog`:** Snapshot the full Chrome window, click `"Allow"`, then handle the macOS `save-panel` sheet.
- **Skipping `music_library/bgm/README.md`:** Always check existing tracks before generating and update the catalog table after ingesting a new reusable track.
