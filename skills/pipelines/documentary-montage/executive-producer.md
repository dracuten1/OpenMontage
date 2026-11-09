# Executive Producer - Documentary Montage Pipeline

## When To Use

The user wants a short (30-180s) non-narrative piece built from existing
footage — a thematic collage, essay film, or Adam-Curtis-style tone
poem. The piece is NOT a narrated explainer, NOT a talking head, NOT a
single extended scene. It is an arranged sequence of real-world clips
whose meaning emerges from juxtaposition (Kuleshov effect,
Eisenstein's intellectual montage).

This is the right pipeline when the brief includes phrases like:

- "a montage about...",
- "show me the feeling of...",
- "like a tone poem",
- "documentary-style collage",
- "everyone who has ever..." / "the life of..." / "a portrait of...",
- "cut together from stock footage",
- "Adam Curtis", "Errol Morris", "Chris Marker",
- "no narration, just images".

If the user asks for an explainer, a trailer with generated clips, or
a talking-head video, pick a different pipeline.

## Philosophy

Documentary montage is retrieval-first, not generation-first.
The corpus is the raw material; the edit is the thinking. Your job
across all stages is to:

1. **Enlarge the search space before committing**. Build a corpus
   bigger than you think you need so the edit has room to breathe.
2. **Let juxtaposition do the talking**. Two mundane clips next to
   each other can mean something neither one means alone.
3. **Trust the footage**. If a clip shows a thing plainly, don't
   explain it with text or voice-over.
4. **Pace is the message**. Cut on beat. Hold on images that earn it.
   Short cuts = urgency, long holds = grief/weight/awe.

## Stages

| Stage | Director skill | Produces |
|-------|----------------|----------|
| `idea` | `idea-director.md` | brief (topic, tone, duration, shape) |
| `scene` | `scene-director.md` | shot_list (slot descriptions + queries) |
| `assets` | `asset-director.md` | asset_manifest (corpus built + per-slot picks) |
| `edit` | `edit-director.md` | edit_decisions (timeline + transitions + music) |
| `compose` | `compose-director.md` | render_report (final mp4) |

Each director skill has its own quality gate. Read the director skill
before starting the stage.

## Core Tools

| Tool | Role |
|------|------|
| `corpus_builder` | Fans out across Pexels/Archive.org/NASA/Wikimedia/Unsplash, downloads + embeds + indexes |
| `clip_search` | Ranks clips for a slot, finds similar sets, diversifies selections |
| `video_compose` / Remotion | Renders the final timeline |

The agent talks to the stock sources through `corpus_builder` — never
call adapter classes directly from a skill or director.

## Cross-Stage Rules

- **No generated clips** unless the user explicitly asks. This pipeline
  is about REAL footage, real texture, real grain. Generated B-roll
  breaks the aesthetic.
- **No narration** unless the user explicitly asks. The brief should
  default to image-only + music. Adding voice is a MAJOR change and
  requires user approval per the Decision Communication Contract.
- **Build the corpus before picking clips**. Do not run clip_search
  against an empty or half-built corpus. If retrieval results are
  weak (all scores < 0.25), grow the corpus with new queries.
- **Keep a decision log of rejected picks**. When you pass on a clip
  with a high score, note why (wrong era, overlit, wrong emotional
  register). This helps the review stage.

## Common Pitfalls

- Treating the corpus as a stock library to pick from sequentially
  instead of as a search index to query per slot.
- Arranging clips by score rather than by narrative beat.
- Letting visually-repetitive clips sit adjacent. Use
  `clip_search` with `operation=diversify` before locking the edit.
- Over-cutting. Documentary montage lives in the hold, not the jump.
- Quietly inserting a narration track because the edit feels "thin".
  Fix the edit; don't paper over it.

## Production Contract Binding (docs/ORCHESTRATION_DOCTRINE.md)

The canonical production contract is `docs/ORCHESTRATION_DOCTRINE.md` (ENS primary authority; this skill is a synced, subordinate reference — doctrine wins on conflict). This pipeline's manifest stages (`pipeline_defs/<pipeline>.yaml`) map the contract's 7 required phases — brief/script/facts; actual audio + alignment; sealed scene packets; scene author/review; integration; final render/mix review; delivery. Domain-specific phases (rig, localization, research, capture) are additive and never bypass the contract.

Applicable mechanical gates (commands verified in-repo; per the doctrine honesty matrix, do NOT cite a gate as enforced for a production that does not use it — state "not applicable" instead):

- Edit→compose timing re-lock (narrated cuts): `.venv/bin/python -c "from tools.qc.timing_relock_guard import check_project_timing; check_project_timing('<project_dir>', mode='strict')"` — enforced at the checkpoint edit gate in `lib/checkpoint.py`; applies when `edit_decisions.cuts` contain narrated cuts backed by narration audio.
- Production validation (compose/publish checkpoint gate): `lib/production_validation.py` runs at every `compose`/`publish` checkpoint write via `validate_checkpoint_production_gate`; strict mode is the default for new production, and the 5 evidence gates (layout, timing-audio, semantic-events, sfx-mix, provenance-freshness) must carry real detector measurements.
- Remotion layout/events validators (when this pipeline renders via Remotion): `npm run validate:layout -- <spec>` and `npm run validate:events -- <spec>` inside `remotion-composer/`.
- Mix validation (when a mix profile + stems exist): `.venv/bin/python -m tools.qc.mix_validator <stems_dir> <mix_profile.json>` — fail-closed on undeclared missing stems; intentionally absent BGM/SFX must be explicitly declared, never silently unmeasured.
- Scene-packet workflow (only when this production uses scene packets / `scene_manifest.json`): `.venv/bin/python tools/qc/scene_orchestrator.py <episode_dir> --runner subprocess --max-concurrency 2 --max-retries 1 --scenes id1,id2 --evidence-file artifacts/scene_workflow_evidence.json`, then `.venv/bin/python tools/qc/episode_gate.py <episode_root>`. Runner honesty: subprocess is verified deterministic; daemon is experimental for reviewer turns.

Strict success semantics (doctrine §8.2): completion claims are valid only with applicable gate identities, the exact scene/cut set, stage scope, existing evidence files, bound revisions, and detector measurements. `revise`, `blocked`, missing evidence, or required `not_measured` can NEVER become completion; a mechanical gate failure is `blocked`, never "PASS WITH WARNINGS". Dependency freeze (§8.3): any mutation of frozen inputs invalidates dependent verdicts and renders — re-review/re-render, never reuse stale verdicts; after re-TTS run `tools/audio/refresh_manifest.py` and re-lock cuts. Legacy compat (§8.4): a historical/legacy mode (explicitly declared `validation_mode="legacy"`) can never silently authorize new production — strict is the default. Publication separation (§8.4): render acceptance (QC PASS) authorizes nothing beyond the accepted render; publish/delivery requires its own explicit owner authorization.
