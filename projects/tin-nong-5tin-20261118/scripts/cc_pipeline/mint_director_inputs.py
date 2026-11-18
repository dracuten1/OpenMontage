#!/usr/bin/env python
# -*- coding: utf-8 -*-
"""Director minter cho CC pipeline (doctrine §7.1) — tự định vị theo __file__ (copy dir này sang project mới là tự chạy đúng slug).

Mints vào EPISODE dir (remotion-composer/src/<slug>):
  artifacts/scene_manifest.json        (copy, discovery source)
  artifacts/words_scene-N.json         (per-scene anchors, scene-local frames)
  assets/audio/voice_sN.wav            (staged from project)
  packets/style_contract.json          (layout/style SSOT cho writers+reviewers)
  packet_scene-N.json                  (packet templates, schema v1)
  ../../projects/<slug>/history/scene_tasks/scene-N.task.md  (CC writer TASKs)
Cùng public/<slug>/ img+audio+words+captions+scene_timing (composer runtime).
Run: .venv/bin/python scripts/cc_pipeline/mint_director_inputs.py (repo root)
"""
from __future__ import annotations
import hashlib
import json
import shutil
from pathlib import Path

# Self-locating paths (2026-11-18 copy-trap fix): this dir is copied
# per-project — NEVER hardcode the slug. Layout: projects/<slug>/scripts/cc_pipeline/<file>.py
_HERE = Path(__file__).resolve()
PROJ = _HERE.parents[2]
REPO = _HERE.parents[4]
SLUG = PROJ.name
assert (PROJ / "scene_manifest.json").is_file(), (
    f"self-location failed: {PROJ} has no scene_manifest.json — this file must "
    "live at projects/<slug>/scripts/cc_pipeline/; copy the whole dir into the "
    "NEW project, it re-targets itself via __file__")
EP = REPO / "remotion-composer/src" / SLUG
PUB = REPO / "remotion-composer/public" / SLUG
TASKS = PROJ / "history/scene_tasks"
SCHEMA_VERSION = 1

manifest = json.loads((PROJ / "scene_manifest.json").read_text(encoding="utf-8"))
timing = json.loads((PROJ / "assets/scene_timing.json").read_text(encoding="utf-8"))
N_SCENES = len(timing["sections"])
words = json.loads((PROJ / "assets/words.json").read_text(encoding="utf-8"))["sections"]
captions = json.loads((PROJ / "assets/captions.json").read_text(encoding="utf-8"))["captions"]
script = json.loads((PROJ / "script.json").read_text(encoding="utf-8"))
fps = timing.get("fps", 30)

secs = {s["scene_id"]: s for s in timing["sections"]}
scripts = {s["id"]: s for s in script["sections"]}
scenes = manifest["scenes"]
scene_ids = [s["scene_id"] for s in scenes]
assert scene_ids == [f"scene-{i}" for i in range(1, N_SCENES + 1)], scene_ids

# ---- episode + public skeleton ----------------------------------------
for sub in ("artifacts", "packets", "scene", "assets/audio"):
    (EP / sub).mkdir(parents=True, exist_ok=True)
(PUB / "img").mkdir(parents=True, exist_ok=True)
(PUB / "audio").mkdir(parents=True, exist_ok=True)
TASKS.mkdir(parents=True, exist_ok=True)
shutil.copy(PROJ / "scene_manifest.json", EP / "artifacts/scene_manifest.json")
shutil.copy(PROJ / "assets/scene_timing.json", PUB / "scene_timing.json")
shutil.copy(PROJ / "assets/words.json", PUB / "words.json")
shutil.copy(PROJ / "assets/captions.json", PUB / "captions.json")
for i in range(1, N_SCENES + 1):
    src = PROJ / f"assets/audio/voice_s{i}.wav"
    if src.is_file():
        shutil.copy(src, EP / f"assets/audio/voice_s{i}.wav")
        shutil.copy(src, PUB / f"audio/voice_s{i}.wav")
for img in (PROJ / "assets/images").glob("*"):
    shutil.copy(img, PUB / "img" / img.name)

# ---- edit_decisions (cuts per scene) ----------------------------------
cuts = []
for s in timing["sections"]:
    cuts.append({
        "scene_id": s["scene_id"], "section_id": s["section_id"],
        "start_frame": s["start_frame"], "duration_frames": s["duration_frames"],
        "start_seconds": s["start_seconds"], "end_seconds": s["end_seconds"],
        "transition_in": "cut", "transition_out": "cut",
        "sfx_transition": "block_gap" if s["section_id"] in ("s1", "s5", "s8", "s10", "s12") else None,
    })
edit_decisions = {
    "version": "1.0",
    "cuts": cuts,
    "render_runtime": "remotion",
    "notes": "speech-locked cuts từ scene_timing.json (TTS+ASR re-lock); block transition SFX tại ranh giới tin",
}
(PROJ / "artifacts").mkdir(exist_ok=True)
(PROJ / "artifacts/edit_decisions.json").write_text(json.dumps(edit_decisions, ensure_ascii=False, indent=1), encoding="utf-8")

# ---- style contract ----------------------------------------------------
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
    "image_base_path": f"{SLUG}/img",
    "rules": [
        "Every visible element anchor must come from artifacts/words_scene-N.json (scene-local frames) ±9f.",
        "No CSS transition property in Remotion components; interpolate/spring from useCurrentFrame only.",
        "Vertical stacks: single flex column with gap 18-24px; never two sibling absolute blocks with close tops.",
        "Containers must set height/minHeight >= sum of children stack heights + 30px.",
        "Scene reveal spring = MOTION.pop {damping:14, stiffness:110} (directive); layer settle = MOTION.settle {20,140}; damping <14 FORBIDDEN; translateY positive→0 only.",
        "Camera drift đã có sẵn trong SceneShell (1.0→1.08) — writers KHÔNG tự thêm camera scale/translate.",
        "Do not Read .png/.wav/.mp4 files. No image verification by CC.",
        "Safe zones (BRIEF tin-nong-5tin Safe Zone v3.2): content band y360–1050 distribute evenly (last block ends <=y1050); TikTok rail phải 140px; subtitles band y1215–1345 via SceneShell CaptionLayer; CTA/follow band y1110–1160 chỉ dùng ở scene cuối (SceneShell CtaBand tự render); margins 90px trái; kicker tại y≈250.",
        "Scene 1 title max-width 850px auto-fit ≤2 dòng (HeroTitle), margin ≥90px.",
        "EDITORIAL GATE MARKER: scene file khai const GRID = { cols, gap } và DÙNG nó khi layout block số liệu; scene chart truyền prop maxValue. Thiếu marker = gate compose chặn.",
        "SFX scene-local 2–3 cue: Sequence from=anchorFrame bọc Audio staticFile('sfx/<file>.mp3') volume 0.12–0.16, anchor = frame từ được nói ±9f (files: pop/impact-cine/keyboard/click-camera/transition-soft/sparkle).",
        "Minimum font 24px (1080p); label/badge text >= 27px.",
        "Số liệu on-screen EXACT theo scene spec (whitelist): nhãn caveat bắt buộc khi spec có ('TÍNH TOÁN', 'ĐÃ ĐẶT/DỰ KIẾN' vs 'LỊCH SỬ', 'CHƯA thi công đại trà').",
        f"Ảnh AI chroma-keyed PNG trong suốt: CutoutLayer src RAW PATH '{SLUG}/img/<file>.png' + AiBadge; drift/Ken Burns tích hợp CutoutLayer — không ảnh đứng yên.",
    ],
}
(EP / "packets/style_contract.json").write_text(json.dumps(style_contract, indent=2, ensure_ascii=False), encoding="utf-8")

# ---- per-scene artifacts + packets + TASKs -----------------------------
COMPONENTS_BLOCK = """Shared contracts (import paths RELATIVE FROM scenes/Sxx.tsx — scenes live in scenes/, one level deep):
COORDINATE SYSTEM (critical): SceneShell renders YOUR children inside a content band container that is ALREADY positioned at top:360px, left:90px, width:850px (right rail 140px), height:690px (band y360–1050 full-screen, BRIEF tin-nong-5tin Safe Zone v3.2). Inside your JSX, use BAND-RELATIVE coordinates: top:0 means y360 full-screen; top:690 means y1050 full-screen. NEVER use full-screen values inside children — that lands off-band. Your stack must fit in 0..690 band-relative so last block ends <=y1050 full-screen. Subtitles band and HUD are rendered by SceneShell itself — do not re-create them.
- `import { COLORS, FONTS, SAFE, MOTION } from '../theme'`  (theme.ts, frozen)
- `import { FPS, SCENES, sceneRange } from '../timing'` (timing.ts, frozen — scene windows)
- `import { SceneShell, HeroTitle, CountUp, VerdictStamp, HighlightBar, KickerPill, SourceBadge, AiBadge, CtaBand } from '../lib/SceneShell'` (frozen shell)
- `import { CutoutLayer } from '../../components/CutoutLayer'` (src=staticFile path, enterFrame, width, left, top, rotate, tornEdge)
- `import { HighlighterTitle } from '../../components/HighlighterTitle'`
- `import { EditorialBarChart } from '../../components/charts/EditorialBarChart'` (exported via charts/index.ts)
Use these; do not recreate or modify them. NEVER import './theme' or './lib/SceneShell' from inside scenes/ — that path does not exist.

EXACT widget prop signatures (do not invent props):
- SceneShell: {sceneId: string, label: string, kicker?: string, accent?: 'crimson'|'amber', children, showHud?: boolean, hudText?: string, captions?: {text,start,end}[]}
- HeroTitle: {text: string, sub?: string, color?: string, align?: 'left'|'center'} — auto-fit ≤2 dòng ≤850px.
- CountUp: {to: number, startFrame: number, durationFrames?: number, decimals?: number, prefix?: string, suffix?: string, localeFormat?: boolean}
- VerdictStamp: {text: string, enterFrame: number, color?: string}
- HighlightBar: {text: string, enterFrame: number, color?: string, width?: number}
- KickerPill: {text: string, accent?: string} (đã có sẵn trong SceneShell qua kicker prop — thường không cần dùng trực tiếp)
- SourceBadge: {source: string} — hiển thị "NGUỒN: <source>"
- AiBadge: {} (no props)
- CtaBand: {text: string} — chỉ scene cuối, tự đặt tại band y1540–1750
- CutoutLayer: {src: string, enterFrame: number, width: number, left: number|string, top: number|string, rotate?: number, shadow?: boolean, tornEdge?: boolean, springConfig?: {damping?: number, stiffness?: number}}"""

for idx, sc in enumerate(scenes, start=1):
    sid = sc["scene_id"]           # scene-N
    sec = secs[sid]
    sn = sec["section_id"]         # sN
    script_key = f"S{int(sn[1:]):02d}"
    sec_script = scripts[script_key]
    wl = words.get(sn, [])
    start_s = sec["start_seconds"]
    start_f = sec["start_frame"]
    win_frames = sec["duration_frames"]
    nn = f"{idx:02d}"

    words_local = []
    for wtok in wl:
        ws, we = wtok["start"], wtok["end"]
        words_local.append({
            "word": wtok["word"],
            "start_s_local": round(ws, 3),
            "end_s_local": round(we, 3),
            "start_frame_local": round(ws * fps),
            "end_frame_local": round(we * fps),
            "global_start": round(start_s + ws, 3), "global_end": round(start_s + we, 3),
        })
    (EP / f"artifacts/words_{sid}.json").write_text(json.dumps({
        "scene_id": sid, "section_id": sn, "fps": fps,
        "scene_start_seconds": start_s, "scene_start_frame": start_f,
        "scene_end_frame": start_f + win_frames, "window_frames": win_frames,
        "speech_seconds": sec.get("speech_seconds"),
        "narration_text": sec_script["text"],
        "provider_text": (sec_script.get("delivery_cues", {}) or {}).get("provider_text", sec_script["text"]),
        "captions": captions.get(sn, []),
        "words": words_local,
    }, indent=1, ensure_ascii=False), encoding="utf-8")

    def _sha(p: Path) -> str:
        return hashlib.sha256(p.read_bytes()).hexdigest()
    voice_rel = f"assets/audio/voice_{sn}.wav"
    voice_sha = _sha(EP / voice_rel)
    style_sha = _sha(EP / "packets/style_contract.json")
    words_sha = _sha(EP / f"artifacts/words_{sid}.json")
    prev_label = scenes[idx - 2]["narrative_beat"] if idx >= 2 else None
    next_label = scenes[idx]["narrative_beat"] if idx < N_SCENES else None
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
        "neighbor_context": {"prev": prev_label or "none", "next": next_label or "none"},
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
    (EP / f"packet_{sid}.json").write_text(json.dumps(packet, indent=1, ensure_ascii=False), encoding="utf-8")

    anchors = "\n".join(
        f"  - {w['word']} | local {w['start_frame_local']}–{w['end_frame_local']}f"
        for w in words_local
    )
    task = f"""# TASK — writer {sid} (scene {idx}/{N_SCENES}, section {sn})

**RULE ZERO — write ONLY `scenes/S{nn}.tsx`.** Creating/modifying ANY other file = attempt auto-rejected (OS-level scope check).

You are the per-scene CC writer for OpenMontage episode {SLUG} (doctrine §7.1).
Write exactly ONE scene component. Orchestration, timing, theme, rendering are handled elsewhere.

## Scene window
- fps {fps}; scene-local frames [0, {win_frames}] (global {start_f}–{start_f + win_frames})
- scene-local seconds [0, {round(win_frames / fps, 3)}]

## Scene spec (authoritative — build exactly this)
```json
{json.dumps(sc, ensure_ascii=False, indent=1)}
```

## Narration (display text; audio already produced — DO NOT touch audio)
- text: {sec_script['text']}

## Word anchors (scene-local frames; element reveal/CountUp fires when its word is spoken ±0.3s ≈ ±9f)
{anchors}
Full data: artifacts/words_{sid}.json (read it if you need more than the list above).

{COMPONENTS_BLOCK}

## OUTPUT (write EXACTLY this file, nothing else outside allowed paths)
- `scenes/S{nn}.tsx` — default-export React component `Scene{idx}` (no props), 1080x1920@{fps}fps, wrapped in SceneShell (sceneId="{sid}", label theo spec).
Allowed writes: `scenes/S{nn}.tsx` and optionally `artifacts/{sid}_notes.md`.
FORBIDDEN: theme.ts, timing.ts, lib/**, packets/**, Root.tsx, scenes/S*.tsx of OTHER scenes, any other file, any .png/.wav read.

## Hard rules (owner mandates — violations = reviewer rejection)
0. SCOPE LOCK: you may ONLY create/edit `scenes/S{nn}.tsx` (+ optionally `artifacts/{sid}_notes.md`). Touching `packet_scene-*.json`, `packets/**`, `theme.ts`, `timing.ts`, `lib/**`, other scenes, Root.tsx, or any media file = instant failure. Do not read or modify other scenes' packets or findings.
0b. ONLY use the components listed above (SceneShell, HeroTitle, CountUp, VerdictStamp, HighlightBar, KickerPill, SourceBadge, AiBadge, CtaBand, CutoutLayer, HighlighterTitle, EditorialBarChart). Do NOT invent new shared components (e.g. `CreditLine`, `ChartCard`) or import from files not listed. Typography/credit text inline trong scene file.
0c. TS pitfalls: `AbsoluteFill` (capital) từ 'remotion' — KHÔNG có `absoluteFill`; KHÔNG redeclare biến trùng tên (`const fps` khai 1 lần); destructuring đủ biến dùng (`const {{ fps }} = useVideoConfig()`); import phải tồn tại trong file nguồn.
1. Speech-locked animation: every reveal/CountUp/highlight anchors to a word frame from the list above, ±9f max. Never proportional guesses. Anchor tail: last cue end + >=45f before scene end; if the last spoken word lands after 65% of the window, compact that reveal (shorter duration, no stagger) to end >=20f before end. Never let reveal+stagger overflow the scene window.
2. NO CSS `transition` anywhere. Animate only via interpolate()/spring() from useCurrentFrame().
3. Vertical stacks inside a card: ONE flex column with gap 18–24px; NEVER two sibling absolute blocks with tops <20px apart (spring overshoot collides).
4. Container height/minHeight MUST be >= total children stack height + 30px margin.
5. Scene reveal spring = MOTION.pop ({{damping:14, stiffness:110}}); chart/tile settle = MOTION.settle ({{20,140}}); translateY positive→0 only. Camera drift đã trong SceneShell — KHÔNG thêm camera scale/translate riêng.
6. Layout/safe zones: packets/style_contract.json (read it, 1 read) + theme.ts SAFE (SSOT Safe Zone v3.2). Content band y360–1050 distribute evenly, last block ends <=y1050; right margin 140px (TikTok rail); min font 24px, labels >=27px; SceneShell caption band tự render. Scene 1: HeroTitle auto-fit (≤2 dòng, ≤850px).
7. Charts/lists animate MUST be plain React (div/flex/grid) or EditorialBarChart — no static SVG injection. Numbers on screen EXACTLY as in spec (whitelist). Caveat labels bắt buộc khi spec có: 'TÍNH TOÁN' (giá trước), 'ĐÃ ĐẶT/DỰ KIẾN' vs 'LỊCH SỬ' (TBM chart), 'CHUẨN BỊ KỸ THUẬT — CHƯA PHẢI THI CÔNG ĐẠI TRÀ' (trạng thái).
8. Images: CutoutLayer với src RAW PATH (KHÔNG bọc staticFile — component tự gọi): `src='{SLUG}/img/<tên file theo spec>'` + AiBadge (ảnh AI chroma-keyed PNG trong suốt, hiển thị trực tiếp trên BackdropGrid) — Ken Burns tích hợp sẵn trong CutoutLayer drift; không ảnh đứng yên; KHÔNG đọc file ảnh.
8b. EDITORIAL GATE MARKER (bắt buộc): scene file PHẢI khai `const GRID = {{ cols: N, gap: ... }}` (tên chứa từ GRID) và DÙNG biến đó khi layout các block số liệu. Scene có EditorialBarChart PHẢI truyền prop `maxValue`. Thiếu marker = gate compose chặn tập.
8c. SFX scene-local (2–3 cue): `<Sequence from={{anchorFrame}}><Audio src={{staticFile('sfx/pop.mp3')}} volume={{0.14}} /></Sequence>` — file: pop/impact-cine/keyboard/click-camera/transition-soft/sparkle (.mp3); anchor = frame của từ được nói ±9f; volume 0.12–0.16; import {{ Audio, Sequence, staticFile }} từ 'remotion'.
9. **CHUNKED WRITING (mandatory):** first Write <=60 lines, then Edit-append <=70 lines at a `// __APPEND__` tail marker until complete. Never one giant Write.
10. Reads capped at 2 total: packets/style_contract.json + artifacts/words_{sid}.json. Nothing else.
11. Before finishing: run `npx tsc --noEmit` from the composer root (walk up from episode dir until tsconfig.json). FIX every error located in YOUR scene file (undefined imports/components, type errors). Errors in other files: report, do not edit. Do NOT run build/render. Do NOT create test files.

## Checklist (do in order)
1. Read packets/style_contract.json
2. Read artifacts/words_{sid}.json (if anchor list above is insufficient)
3. Write scenes/S{nn}.tsx scaffold (<=60 lines) with `// __APPEND__` tail
4. Edit-append remaining sections (<=70 lines each) until complete
5. End. No report needed beyond completion.
"""
    (TASKS / f"{sid}.task.md").write_text(task, encoding="utf-8")

print("minted:", len(scenes), "packets + tasks; style_contract + manifest + audio + images staged")
print("episode:", EP)
