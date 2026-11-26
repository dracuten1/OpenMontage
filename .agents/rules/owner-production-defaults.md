# OpenMontage — Owner Standing Production Defaults

These workspace-level owner preferences refine default proposal behavior while preserving full `decision_log` auditability and QC gates:

1. **Default Render Runtime = `remotion` (Do Not Re-Ask):**
   - Treat `render_runtime: "remotion"` as the owner's standing default unless the user explicitly asks for `hyperframes` or `ffmpeg`.
   - Do **not** pause proposals to re-ask the user to choose between Remotion and HyperFrames. Still record `remotion`, `hyperframes`, and `ffmpeg` in `decision_log` (`render_runtime_selection`, noting owner standing default) so governance auditability stays intact.

2. **Default Authoring Mode & Hybrid Visual Mix (News / Explainers):**
   - Default to **`atelier`** (bespoke project-local scenes in `remotion-composer/src/<slug>/`) for news and explainer work.
   - Prefer a **hybrid visual mix**: verified real press/archival photographs (`source_photo_gate`, visible `NGUỒN:` / `ẢNH TƯ LIỆU <year>` badge) **paired with** short (`~8–10s`) generated AI video B-roll (`MINH HỌA AI`, muted inside split frames) and bespoke data visuals (`EditorialBarChart`, `ComparisonSplit`, SVG diagrams).

3. **News Storytelling Hook & Natural Debate / Open-Question Standard:**
   - Never produce dry, robotic legal or press-release readouts.
   - Hook viewers in seconds 0–3 with concrete real-world friction, stakes, or contrast, deliver complete verified facts from `fact_whitelist.json`, and—whenever the topic has genuine public tension—weave in a fair two-sided perspective (steelmanning both sides) and close with a **natural, thought-provoking open question** (no gimmicky clickbait or shouty social clichés).

4. **Do Not Use Pixabay (`pixabay_image` / `pixabay_video` / `pixabay_music`):**
   - Do **not** rely on Pixabay tools or pitch Pixabay in proposals/plans — the Pixabay API consistently hits `429 Too Many Requests` on this machine.
   - For verified real/archival photographs (`source_photo_gate`), source directly from Vietnamese official portals or press articles (via `gemini_web_search` / `searxng_web_search` / `search_web` with explicit credit & citation), verified Wikimedia Commons files (using a descriptive `User-Agent` header when downloading), or previously verified CC-licensed archive assets in the workspace (preserving full provenance).
   - For conceptual visuals or motion B-roll, use `openai_image` (`MINH HỌA AI`) or Browser AI Video B-roll (`gemini-video-asset` → `google-flow-asset`, muted inside split frames).
   - For background music, use channel `assets/bgm/` or `music_library/bgm/` (or `google-flow-music`), not `pixabay_music`.

5. **Content-Driven Flexible Duration (No Hard Time Limit):**
   - Never impose an arbitrary total duration limit or scene-count ceiling (no `60s`, `90s`, `120s`, or `300s` cap) on any pipeline or channel (including TikTok).
   - Let topic depth, factual completeness, and balanced arguments determine video length and scene count; never trim essential facts or pad filler to hit a default time box.
   - Only enforce a strict duration target (`±10%`) when the **user explicitly requests a fixed time limit**.
   - Preserve technical safeguards: keep individual spoken sentences `≤ 140` chars (TTS chunk safety `≤ 150` chars), keep individual sections around `15–25s` (soft drift cap — split into additional sections rather than cutting content), and keep visual beat changes every `4–7s` so longer videos stay visually dynamic.

6. **Vietnamese-Audience-Centered Debate Framing (All 3 Active Channels):**
   - All 3 current channels (`ky-chu-diem-tin`, `ky-chu-phap-luat`, `vn-myth`) serve a **Vietnamese audience**.
   - Every debate angle, opening hook, mid-roll `friction_beats` prompt, `steelman_sides` framing, and `closing_dilemma` MUST center on **Vietnamese stakes, tradeoffs, choices, or perspectives** (Vietnamese citizens, workers, businesses, exporters, consumers, legal rights/obligations, or Vietnamese history/culture).
   - **Never** ask Vietnamese viewers to take sides on another country's domestic interests (e.g., never *"bảo vệ nhà máy Mỹ hay lo hóa đơn người dân Mỹ?"*). Present foreign internal debates or reactions strictly as factual context acting on Vietnam, and pivot every open question back to Vietnam's impact or decision.

7. **Default Research Backend = Hybrid Gemini Web Search (`gemini_web_search`) + Mandatory Primary Verification:**
   - On an unlocked macOS desktop with Chrome, default to **`gemini_web_search`** (`tools/analysis/gemini_web_search.py` → `gemini.google.com/app` via `agent-desktop` / `chrome_ax_helper.py`, rotating `Default` → `Profile 2` → `Profile 5` with `--prefer-copy-code`) for Google-grounded multi-source news & explainer discovery (~0 Antigravity tokens). Do **not** re-ask which search engine to use.
   - **Mandatory verification guardrail:** Never mark a Gemini Web summary alone as `PRIMARY_FETCHED` — always fetch and cross-verify exact figures, publication dates, and entity names on original publisher URLs via `web_url_read` (SearXNG MCP) or `curl -sL` before locking `artifacts/fact_whitelist.json`.
   - **Headless / quota fallback:** When Chrome GUI is unavailable (locked screen / headless cron) or all 3 profiles hit rate limits, fall back automatically to `searxng_web_search` + `web_url_read` (or 9Router `web_search` / native `search_web`).
