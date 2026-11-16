#!/usr/bin/env python
"""Director minter for faa-ground-stop-20261114 CC pipeline (doctrine §7.1).

Mints into the EPISODE dir (remotion-composer/src/faa-ground-stop-20261114):
  artifacts/scene_manifest.json        (copy, discovery source)
  artifacts/words_scene-N.json         (per-scene anchors, scene-local frames)
  assets/audio/voice_sN.wav            (staged from project)
  packets/style_contract.json          (layout/style SSOT for writers+reviewers)
  packets/packet_scene-N.json          (packet templates, schema v1)
  ../history/scene_tasks/scene-N.task.md   (CC writer TASKs)
Run from OM repo root with .venv/bin/python.
"""
from __future__ import annotations
import hashlib
import json
import shutil
from pathlib import Path

REPO = Path("/Users/tuyennguyen/project/OpenMontage")
PROJ = REPO / "projects/faa-ground-stop-20261114"
EP = REPO / "remotion-composer/src/faa-ground-stop-20261114"
TASKS = PROJ / "history/scene_tasks"
SCHEMA_VERSION = 1

manifest = json.loads((PROJ / "scene_manifest.json").read_text())
timing = json.loads((PROJ / "assets/scene_timing.json").read_text())
words = json.loads((PROJ / "assets/words.json").read_text())
script = json.loads((PROJ / "script.json").read_text())
fps = timing.get("fps", 30)

secs = {s["scene_id"]: s for s in timing["sections"]}
scripts = {s["id"]: s for s in script["sections"]}
scenes = manifest["scenes"]
scene_ids = [s["scene_id"] for s in scenes]
assert scene_ids == [f"scene-{i}" for i in range(1, 13)], scene_ids

# ---- episode skeleton -------------------------------------------------
(EP / "artifacts").mkdir(exist_ok=True)
(EP / "packets").mkdir(exist_ok=True)
(EP / "scene").mkdir(exist_ok=True)
(EP / "assets/audio").mkdir(parents=True, exist_ok=True)
TASKS.mkdir(parents=True, exist_ok=True)
shutil.copy(PROJ / "scene_manifest.json", EP / "artifacts/scene_manifest.json")

audio_dst = EP / "assets/audio"
for i in range(1, 13):
    src = PROJ / f"assets/audio/voice_s{i}.wav"
    dst = audio_dst / f"voice_s{i}.wav"
    if src.is_file() and not dst.is_file():
        shutil.copy(src, dst)

# ---- style contract ---------------------------------------------------
style_contract = {
    "packet_type": "openmontage.style-contract",
    "project_id": manifest["project_id"],
    "lane": manifest["lane"],
    "canvas": manifest["canvas"],
    "style_playbook": manifest.get("style_playbook"),
    "style_anchor": manifest.get("style_anchor"),
    "negative_prompt": manifest.get("negative_prompt"),
    "camera_rig": manifest.get("camera_rig"),
    "physics": manifest.get("physics"),
    "global_overlays": manifest.get("global_overlays"),
    "speech_lock_contract": manifest.get("speech_lock_contract"),
    "imports": {
        "theme": "./theme",
        "timing": "./timing",
        "scene_shell": "./lib/SceneShell",
        "cutout_layer": "../../components/CutoutLayer",
        "highlighter_title": "../../components/HighlighterTitle",
        "parallax_camera": "../../components/ParallaxCamera",
        "editorial_bar_chart": "../../components/charts/EditorialBarChart",
    },
    "rules": [
        "Every visible element anchor must come from artifacts/words_scene-N.json (scene-local frames).",
        "No CSS transition property in Remotion components; interpolate/spring from useCurrentFrame only.",
        "Vertical stacks: single flex column with gap; never two sibling absolute blocks with close tops.",
        "Containers must set height/minHeight >= sum of children stack heights + 30px.",
        "spring damping >= 20; translateY from positive to 0 only (no negative overshoot).",
        "Do not Read .png/.wav/.mp4 files. No image verification by CC.",
        "Layout, safe zones and typography follow this contract + per-scene overlay_note only.",
        "Safe zone v3.2: content band FULL y330–1440 — distribute blocks evenly across the WHOLE band; last block ends y1300–1440; gap between blocks 18–24px; no cramming the top half.",
        "Right rail 140px reserved: content right edge x <= 940; left margin 60; title S1 max-width 850px auto-wrap 72–96px.",
        "Minimum font 24px (1080p); label/badge text >= 27px; kicker at y>=240.",
    ],
}
(EP / "packets/style_contract.json").write_text(json.dumps(style_contract, indent=2, ensure_ascii=False))

# ---- per-scene artifacts + packets + TASKs ----------------------------
COMPONENTS_BLOCK = """Shared contracts (import paths, episode dir = cwd):
- `import { COLORS, FONTS, SAFE, MOTION } from './theme'`  (theme.ts, frozen)
- `import { FPS, SCENES } from './timing'` (timing.ts, frozen — scene windows/constants)
- `import { SceneShell, SlateBackdrop, HeroImg, KickerChip, BrandTag, SceneTitle, AiBadge } from './lib/SceneShell'` (frozen shell — HeroImg img name WITHOUT .png, base path faa-ground-stop-20261114/img)
- `import { CutoutLayer } from '../../components/CutoutLayer'`
- `import { HighlighterTitle } from '../../components/HighlighterTitle'`
- `import { ParallaxCamera } from '../../components/ParallaxCamera'`
- `import { EditorialBarChart } from '../../components/charts/EditorialBarChart'` (exported via charts/index.ts)
Use these; do not recreate or modify them."""

for idx, sc in enumerate(scenes, start=1):
    sid = sc["scene_id"]           # scene-N
    sec = secs[sid]
    sn = sec["section_id"]         # sN
    sec_script = scripts[sn]
    wl = words.get(sn, [])
    start_s = sec["start_seconds"]
    start_f = sec.get("start_frame", round(start_s * fps))
    end_f = start_f + sec.get("duration_frames", round((sec["end_seconds"] - start_s) * fps))
    win_frames = sec.get("duration_frames", end_f - start_f)

    # per-scene words artifact (scene-local frames)
    words_local = []
    for wtok in wl:
        gs = wtok.get("global_start", wtok.get("start", 0.0))
        ge = wtok.get("global_end", wtok.get("end", 0.0))
        words_local.append({
            "word": wtok.get("word", ""),
            "start_s_local": round(gs - start_s, 3),
            "end_s_local": round(ge - start_s, 3),
            "start_frame_local": round((gs - start_s) * fps),
            "end_frame_local": round((ge - start_s) * fps),
            "global_start": gs, "global_end": ge,
        })
    (EP / f"artifacts/words_{sid}.json").write_text(json.dumps({
        "scene_id": sid, "section_id": sn, "fps": fps,
        "scene_start_seconds": start_s, "scene_start_frame": start_f,
        "scene_end_frame": end_f, "window_frames": win_frames,
        "narration_text": sec_script["text"],
        "provider_text": sec_script.get("provider_text", ""),
        "words": words_local,
    }, indent=1, ensure_ascii=False))

    # packet template
    def _sha(p: Path) -> str:
        return hashlib.sha256(p.read_bytes()).hexdigest()
    voice_rel = f"assets/audio/voice_{sn}.wav"
    voice_sha = _sha(EP / voice_rel)
    style_sha = _sha(EP / "packets/style_contract.json")
    words_sha = _sha(EP / f"artifacts/words_{sid}.json")
    prev_label = scenes[idx - 2]["label"] if idx >= 2 else None
    next_label = scenes[idx]["label"] if idx < 12 else None
    packet = {
        "packet_type": "openmontage.scene-packet",
        "schema_version": SCHEMA_VERSION,
        "scene_id": sid,
        "claims": {"facts": [
            f"Section {sn} label: {sec['label']}",
            f"Narration: {sec_script['text']}",
            f"Narrative beat: {sc.get('narrative_beat', '')}",
        ]},
        "narration": {"ref": voice_rel, "sha256": voice_sha},
        "word_alignment": {"ref": f"artifacts/words_{sid}.json", "sha256": words_sha},
        "assets": [{"ref": voice_rel, "sha256": voice_sha, "rights": "owned"}],
        "style_contract": {"ref": "packets/style_contract.json", "sha256": style_sha},
        "neighbor_context": {
            "prev": prev_label or "none",
            "next": next_label or "none",
        },
        "allowed_io": ["artifacts", "assets", "packets", "scenes"],
        "frozen_inputs": {},
        "writer": {"instance_id": "", "timestamp": "", "token": ""},
        "writer_token": "",
        "reviewer": {"instance_id": "", "timestamp": "", "verdict": "approved",
                      "findings_ref": f"packets/{sid}_findings.json", "findings_hash": "",
                      "token": "", "reviewed_hashes": {}},
        "reviewer_token": "",
        "integration_status": "pending",
    }
    (EP / f"packet_{sid}.json").write_text(json.dumps(packet, indent=1, ensure_ascii=False))

    # CC writer TASK
    nn = f"{idx:02d}"
    anchors = "\n".join(
        f"  - {w['word']} | local {w['start_frame_local']}–{w['end_frame_local']}f"
        for w in words_local
    )
    task = f"""# TASK — writer {sid} (scene {idx}/14, section {sn})

**RULE ZERO — write ONLY `scenes/S{nn}.tsx`.** Creating/modifying ANY other file = attempt auto-rejected (OS-level scope check).

You are the per-scene CC writer for OpenMontage episode faa-ground-stop-20261114 (doctrine §7.1).
Write exactly ONE scene component. Orchestration, timing, theme, rendering are handled elsewhere.

## Scene window
- fps {fps}; scene-local frames [0, {win_frames}] (global {start_f}–{end_f})
- scene-local seconds [0, {round(sec['end_seconds'] - start_s, 3)}]

## Scene spec (authoritative — build exactly this)
```json
{json.dumps(sc, ensure_ascii=False, indent=1)}
```

## Narration (display text; audio already produced — DO NOT touch audio)
- text: {sec_script['text']}
- provider_text: {sec_script.get('provider_text', '')}

## Word anchors (scene-local frames; element reveal/CountUp fires when its word is spoken ±0.3s ≈ ±9f)
{anchors}
Full data: artifacts/words_{sid}.json (read it if you need more than the list above).

{COMPONENTS_BLOCK}

## OUTPUT (write EXACTLY this file, nothing else outside allowed paths)
- `scenes/S{nn}.tsx` — default-export React component `Scene{idx}` (no props), 1080x1920@{fps}fps, wrapped in SceneShell.
Allowed writes: `scenes/S{nn}.tsx` and optionally `artifacts/{sid}_notes.md`.
FORBIDDEN: theme.ts, timing.ts, lib/**, packets/**, Root.tsx, scenes/S*.tsx of OTHER scenes, any other file, any .png/.wav read.

## Hard rules (owner mandates — violations = reviewer rejection)
1. Speech-locked animation: every reveal/CountUp/highlight anchors to a word frame from the list above, ±9f max. Never proportional guesses. Anchor tail: last cue end + >=45f before scene end; if the last spoken word lands after 65% of the window, compact that reveal (shorter duration, no stagger) to end >=20f before end. Never let reveal+stagger overflow the scene window.
2. NO CSS `transition` anywhere. Animate only via interpolate()/spring() from useCurrentFrame().
3. Vertical stacks inside a card: ONE flex column with gap 18–24px; NEVER two sibling absolute blocks with tops <20px apart (spring overshoot collides).
4. Container height/minHeight MUST be >= total children stack height + 30px margin.
5. spring damping >= 20; translateY positive→0 only. Camera TĨNH — NO camera scale/translate drift.
6. Layout/safe zones/typography: packets/style_contract.json (read it, 1 read) + scene overlay_note. Content band FULL y330–1440 — distribute blocks evenly across the WHOLE band, last block ends y1300–1440; right edge x<=940 (rail 140px); min font 24px, labels >=27px; kicker y>=240. Scene 1 title max-width 850px, auto-wrap, font 72–96px.
7. Charts/lists that animate MUST be plain React (div/flex/grid), not static SVG injection. Numbers on screen EXACTLY as in the spec (whitelist) — no invented values; QA caveat labels (e.g. 'DỰ BÁO ABS — KHÔNG PHẢI HẠN MỨC NHNN') must appear when the spec includes them.
8. **CHUNKED WRITING (mandatory):** first Write <=60 lines, then Edit-append <=70 lines at a `// __APPEND__` tail marker until complete. Never one giant Write.
9. Reads capped at 2 total: packets/style_contract.json + artifacts/words_{sid}.json. Nothing else.
10. Before finishing: run `npx tsc --noEmit` from the composer root (walk up from episode dir until tsconfig.json). FIX every error located in YOUR scene file (undefined imports/components, type errors). Errors in other files: report, do not edit. Do NOT run build/render. Do NOT create test files.

## Checklist (do in order)
1. Read packets/style_contract.json
2. Read artifacts/words_{sid}.json (if anchor list above is insufficient)
3. Write scenes/S{nn}.tsx scaffold (<=60 lines) with `// __APPEND__` tail
4. Edit-append remaining sections (<=70 lines each) until complete
5. End. No report needed beyond completion.
"""
    (TASKS / f"{sid}.task.md").write_text(task, encoding="utf-8")

print("minted:", len(scenes), "packets + tasks; style_contract + manifest + audio staged")
print("episode:", EP)
