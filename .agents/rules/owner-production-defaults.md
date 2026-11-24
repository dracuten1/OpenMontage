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
