# Stickman Director — High-Completion Line-Animation Direction

> Extracted from [kaomei/stickman-video-director](https://github.com/kaomei/stickman-video-director) (MIT), adapted for OpenMontage. Source skill: `directing-stickman-videos`.

## When to Use

Turning copy, notes, articles, or a bare topic into a short **stick-figure / kinetic line-animation explainer** (10-second-multiple clips: 30s/60s/90s/3min/5min, default 60s = 6 clips) optimized for completion rate — YouTube Shorts, TikTok, Reels, or YouTube knowledge videos. Pairs with `creative/prompting/omni-flash-prompting.md` (Phase B) and any synced-audio video model.

This skill is the **Phase A (direction) layer**: it converts source material into an approved director's proposal BEFORE any generation budget is spent. It is renderer-agnostic — the storyboard also drives Remotion still-motion compose or image-sequence animation when no video-gen provider is configured.

## Core contract

Turn one source into a confirmed director's proposal (Phase A), then N standalone ~10-second generation prompts (Phase B), where N = duration / 10. Preserve the source's meaning; structure it through the 5-stage engine below. Never generate prompts before the current Phase A is explicitly approved.

## Setup gate

Require these before planning (ask for all missing items in ONE message, then stop):

- source material
- aspect ratio: `16:9` or `9:16`
- target duration in 10s multiples (default 60s / 6 clips; round non-multiples to nearest 10)
- visual style:
  - Style 1 Classic Minimalist — light (white bg, black figure) or dark (black bg, white figure)
  - Style 2A Modern Studio Tech — white high-key studio, light-gray perspective grid, cyan/blue glass UI
  - Style 2B Cinematic Story — full-color narrative environments, cinematic lighting

Urgency, cost pressure, or "just pick normal settings" do NOT waive this gate. Never select ratio or style silently. Do not re-ask choices already supplied.

## 5-Stage High-Completion Heartbeat Engine

Structure every script through this emotional progression (timing scales with duration):

1. **Golden Hook** — counter-intuitive question or visual paradox, fast (2–5s in short videos; up to 10–15s in 3–5min). Never open with platitudes.
2. **Disrupt Assumptions** — state what everyone believes, shatter it in one sentence.
3. **Unveiling Insider Secrets** — reveal the hidden mechanism, friction, or systemic secret.
4. **Ultimate Truth Revelation** — deliver the underlying logic with maximum "aha" payoff.
5. **Elevation & Discussion** — punchline + an open question that forces comment-section debate.

Clip allocation: 60s → hook(1), disrupt(2), secrets(3), truth(4–5), elevation(6). 90s → hook(1), disrupt(2–3), secrets(4–6), truth(7–8), elevation(9). 3–5min → hook, assumptions 15–20%, secrets 35–40%, truth 30–35%, elevation final 1–2 clips.

## Narration budget

English VO at **~20–25 words per 10-second clip** (~120–150 words for 60s; ~360–450 for 3min). Preserve core claims, names, numbers; strengthen weak openings; cut repetition; expand short sources with examples — but never invent facts, statistics, quotes, or product claims. Prefer clear spoken English over literal translation; simplify wording before raising speed.

## Storyboard contract (Phase A output)

Exactly N rows of ~10s, each with a distinct narrative job:

| Time | Narrative purpose | Stick-figure scene | Motion, camera, transition | English VO | Reference translation | BGM / SFX |
|---|---|---|---|---|---|---|

Header before the table: title (EN + user language), core message + hook, ratio/duration/style, narrator identity + pace + word count, ≤3 accent colors with semantic roles (ordinary color names only), BGM direction and emotional arc.

## Visual-density recipe

Each row = three timed beats: `0–3s` establish/inherit premise → `3–7s` escalate/explain via physical action → `7–10s` climax + outgoing transition. At least 4 visual devices per row (character action, environment transformation, concrete metaphor, icon-only diagram, particles/energy, camera move, foreground wipe, match-cut, interaction with oversized object). **A perceptible visual change every 2–3 seconds.** Every effect must intensify the spoken idea — no unrelated spectacle. Avoid abstract liquid/shape morphing (causes latent jitter in diffusion video models).

Continuity: end each row with a visible state (pose, moving object, direction, camera motion) the next row inherits. Name both sides of every connection.

## Text policy

Generated scenes default to **no visible words, letters, numbers, or captions** — message bubbles and cards are icon-only. Optional 2–5-word overlays go in a separate post-production list with target clips and safe placement; they never enter generation prompts (compose them in Remotion/FFmpeg instead).

## Phase A checks

Source/ratio/duration/style known; 5-stage engine implemented; final clip ends with a discussion prompt; narration matches duration budget; N rows with distinct purposes; every row has 3 beats + ≥4 devices + audio + transition; visual change every 2–3s; ≤3 accent colors; no technical color notation (hex/RGB/Pantone); overlays separated; adjacent pairs have named continuity; no unsupported facts added.

**Stop after Phase A.** Request approval: approve & generate prompts / revise a named scene / change a global setting. Global change (ratio, duration, style, theme, narration structure) invalidates prior approval and requires a fresh Phase A.

Then proceed to `creative/prompting/omni-flash-prompting.md` for Phase B.
