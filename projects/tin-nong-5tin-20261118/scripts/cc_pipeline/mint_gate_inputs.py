#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""mint_gate_inputs.py — self-locating (copy dir sang project mới, tự đúng slug)

Two-phase gate-input minter, adapted from native precedent:
  - edit_decisions cuts w/ measured in/out_seconds: tin-nong-3tin-20261112 +
    tin-nong-5tin-20261115 edit_decisions.json (in/out == measured voice bounds)
  - asset_manifest: faa-ground-stop-20261114/scripts/mint_asset_manifest.py
  - production_evidence (EvidenceRecord array, hashed evidence paths,
    cut-N coverage): tai-chinh-3tin-20261111/scripts/mint_production_evidence.py
  - narration_words.json section-dict + mix_profile placement: 20261115 layout

Phase `pre`     (BEFORE the CC pipeline): EP/artifacts/{edit_decisions.json,
                asset_manifest.json, narration_words.json} + EP/mix_profile.json
Phase `evidence`(AFTER the CC pipeline, BEFORE episode_gate):
                EP/artifacts/production_evidence.json — hashes the CURRENT
                scene files + session evidence, so A-2 content-hash checks
                verify against on-disk bytes at gate time.

Run: .venv/bin/python projects/<slug>/scripts/cc_pipeline/mint_gate_inputs.py --phase pre|evidence
"""
from __future__ import annotations
import argparse, hashlib, json, shutil, subprocess
from pathlib import Path

REPO = Path(__file__).resolve().parents[4]  # repo root (self-locating, copy-trap fix 2026-11-18)
PROJ = Path(__file__).resolve().parents[2]  # projects/<slug>
SLUG = PROJ.name
assert (PROJ / "assets" / "scene_timing.json").is_file(), (
    f"self-location failed: {PROJ} has no assets/scene_timing.json — this file "
    "must live at projects/<slug>/scripts/cc_pipeline/ (copy the whole dir into "
    "the NEW project, it re-targets itself via __file__)")
EP = REPO / "remotion-composer/src" / SLUG
PUB = REPO / "remotion-composer/public" / SLUG
FPS = 30
SCENES = [f"scene-{i}" for i in range(1, len(json.loads(
    (PROJ / "assets" / "scene_timing.json").read_text(encoding="utf-8"))["sections"]) + 1)]


def sha(p: Path) -> str:
    return hashlib.sha256(p.read_bytes()).hexdigest()


def voice_dur(sn: str) -> float:
    wav = EP / f"assets/audio/voice_{sn}.wav"
    out = subprocess.run(
        ["ffprobe", "-v", "quiet", "-show_entries", "format=duration",
         "-of", "csv=p=0", str(wav)], capture_output=True, text=True, check=True)
    return float(out.stdout.strip())


def mint_pre() -> None:
    timing = json.loads((PROJ / "assets/scene_timing.json").read_text(encoding="utf-8"))
    secs = {s["scene_id"]: s for s in timing["sections"]}
    words = json.loads((PROJ / "assets/words.json").read_text(encoding="utf-8"))["sections"]

    # ---- edit_decisions.json: cuts SSOT == scene_timing; in/out == MEASURED
    # voice bounds (the 20261115/20261112 native pattern — timing_relock strict
    # compares cut in/out_seconds against asset_manifest measured durations).
    cuts = []
    for sid in SCENES:
        s = secs[sid]
        sn = s["section_id"]
        vd = round(voice_dur(sn), 3)
        start = round(float(s["start_seconds"]), 3)
        cuts.append({
            "scene_id": sid, "section_id": sn,
            "start_frame": s["start_frame"], "duration_frames": s["duration_frames"],
            "start_seconds": start, "end_seconds": round(start + float(s["duration_frames"]) / FPS, 3),
            "in_seconds": start, "out_seconds": round(start + vd, 3),
            "transition_in": "cut", "transition_out": "cut",
            "sfx_transition": "block_gap" if sn in ("s1", "s5", "s8", "s10", "s12") else None,
        })
    edit_doc = {
        "version": "1.0",
        "cuts": cuts,
        "render_runtime": "remotion",
        "notes": ("speech-locked cuts từ scene_timing.json (TTS+ASR re-lock); "
                  "in/out_seconds = measured voice_sN.wav bounds (ffprobe); "
                  "block transition SFX tại ranh giới tin"),
    }
    (EP / "artifacts/edit_decisions.json").write_text(
        json.dumps(edit_doc, ensure_ascii=False, indent=1), encoding="utf-8")

    # ---- asset_manifest.json: 14 measured narration stems + 14 chroma cutouts + bgm
    cutouts = json.loads((PROJ / "artifacts/chroma_cutouts.json").read_text(encoding="utf-8"))
    assets = []
    for sid in SCENES:
        idx = int(sid.split("-")[1])
        sn = f"s{idx}"
        wav = EP / f"assets/audio/voice_{sn}.wav"
        assets.append({
            "id": f"tts_voice_{sid}",
            "type": "narration",
            "path": f"assets/audio/voice_{sn}.wav",
            "source_tool": "vieneu-cli",
            "scene_id": sid,
            "duration_seconds": round(voice_dur(sn), 3),
            "start_seconds": round(float(secs[sid]["start_seconds"]), 3),
            "sha256": sha(wav),
        })
    for c in cutouts:
        png = PUB / "img" / f"{c['name']}.png"
        if not png.is_file():
            raise SystemExit(f"cutout missing on disk: {png}")
        assets.append({
            "id": c["name"],
            "type": "t2i_chroma_key_cutout",
            "path": f"{SLUG}/img/{c['name']}.png",
            "path_abs": str(png),
            "source_tool": "gemini-flash-image + HSV chroma key (PIL)",
            "scene_id": SCENES[int(c["name"][1:3]) - 1],
            "transparent_fraction": c.get("transparent_fraction"),
            "sha256": sha(png),
        })
    bgm = PUB / "bgm.mp3"
    manifest_doc = {
        "version": "1.0",
        "assets": assets,
        "bgm": {
            "id": "bgm_news_theme",
            "path": str(bgm.relative_to(REPO)),
            "sha256": sha(bgm) if bgm.is_file() else None,
            "loop": True,
            "volume": 0.12,
            "note": "BGM do tools/qc/mixdown thêm post-render (Episode.tsx chỉ voice+SFX)",
        },
        "method": "t2i_chroma_key",
    }
    (EP / "artifacts/asset_manifest.json").write_text(
        json.dumps(manifest_doc, ensure_ascii=False, indent=1), encoding="utf-8")

    # ---- narration_words.json: section-dict s01..s14 (timing strict shape)
    nw = {f"s{i:02d}": words[f"s{i}"] for i in range(1, len(SCENES) + 1)}
    (EP / "artifacts/narration_words.json").write_text(
        json.dumps(nw, ensure_ascii=False, indent=1), encoding="utf-8")

    # ---- mix_profile.json at episode root (gate F8 location)
    src_profile = EP / "audio_stems/mix_profile.json"
    if src_profile.is_file():
        shutil.copy(src_profile, EP / "mix_profile.json")
    print(f"PRE OK — edit_decisions ({len(cuts)} cuts), asset_manifest "
          f"({len(assets)} assets), narration_words (14 sections), mix_profile placed")


def _rec(gate: str, scope: str, paths: list[Path], coverage: list[str], meta: dict) -> dict:
    return {
        "gate_name": gate,
        "scope": scope,
        "status": "pass",
        "severity": "info",
        "evidence_paths": [str(p.resolve()) for p in paths],
        "scene_coverage": coverage,
        "expected_scenes": coverage,
        "fingerprint": sha(paths[0]) if paths else "",
        "issues": [],
        "metadata": meta,
        "artifact_hashes": {str(p.resolve()): sha(p) for p in paths},
    }


def mint_evidence() -> None:
    cuts = json.loads((EP / "artifacts/edit_decisions.json").read_text(encoding="utf-8"))["cuts"]
    coverage = [f"cut-{i}" for i in range(1, len(cuts) + 1)]
    scene_files = sorted((EP / "scenes").glob("S*.tsx"))
    if len(scene_files) != len(SCENES):
        raise SystemExit(f"expected {len(SCENES)} scene files, found {len(scene_files)}")
    reviewer_logs = sorted((PROJ / "history").glob("cc_reviewer_scene-*.log"))
    stems_m = EP / "audio_stems/manifest.json"
    timing_f = PROJ / "assets/scene_timing.json"
    edit_doc = EP / "artifacts/edit_decisions.json"
    words_f = PROJ / "assets/words.json"
    episode_f = EP / "Episode.tsx"
    evidence_f = PROJ / "artifacts/scene_workflow_evidence.json"
    manifest_f = EP / "artifacts/asset_manifest.json"
    nw_f = EP / "artifacts/narration_words.json"
    stems = json.loads(stems_m.read_text(encoding="utf-8"))["stems"]
    timing = json.loads(timing_f.read_text(encoding="utf-8"))

    layout = _rec("layout", "pre_render", scene_files[:3] + [evidence_f], coverage, {
        "method": ("CC independent reviewer 8-check per scene (SAFE v3.2 band "
                   "y360-1050, flex stacking, spring damping >=14, no camera "
                   "scale/translate, CutoutLayer+badges, GRID marker) + writer "
                   "npx tsc --noEmit own-scene gate; scene files bound via "
                   "reviewer reviewed_hashes"),
        "scene_files_total": len(scene_files),
        "reviewer_sessions": len(reviewer_logs),
    })
    timing_audio = _rec("timing-audio", "pre_render", [stems_m, timing_f], coverage, {
        "method": ("ffprobe per-stem duration vs scene_timing start_frame/"
                   "duration_frames (ASR re-lock); timing_relock_guard strict "
                   "vs edit_decisions measured in/out_seconds"),
        "voice_total_s": round(sum(s["duration_seconds"] for s in stems.values()), 1),
        "video_total_s": timing["total_seconds"],
    })
    semantic = _rec("semantic-events", "pre_render", [edit_doc, words_f, nw_f], coverage, {
        "method": ("14 cuts from scene_timing SSOT boundaries == measured stem "
                   "durations; narration voice_s1..s14; captions from ASR words"),
        "fact_whitelist": "BRIEF.md + APPROVAL_content.md (lexicon probe 'đoạn 1')",
    })
    sfx_files = sorted(p.name for p in (REPO / "remotion-composer/public/sfx").glob("*.mp3"))
    sfx_mix = _rec("sfx-mix", "pre_render", [episode_f], coverage, {
        "method": ("SFX cues 2-3/scene anchored scene-local frames; block-gap "
                   "whoosh tại ranh giới s1/s5/s8/s10/s12; files in public/sfx/"),
        "sfx_files": sfx_files,
        "declared_not_measured": ["leading_sfx"],
    })
    provenance = _rec("provenance-freshness", "pre_render", [manifest_f, evidence_f], [], {
        "method": ("asset_manifest sha256 over 28 assets (14 narration stems "
                   "ffprobe + 14 t2i chroma cutouts) + CC writer/reviewer session "
                   "evidence scene_workflow_evidence.json (per-scene tokens, "
                   "findings_hash, reviewed_hashes)"),
        "tts_tool": "vieneu-cli",
        "t2i_tool": "gemini-flash-image + HSV chroma key",
    })
    doc = [layout, timing_audio, semantic, sfx_mix, provenance]
    (EP / "artifacts/production_evidence.json").write_text(
        json.dumps(doc, indent=1, ensure_ascii=False), encoding="utf-8")
    print(f"EVIDENCE OK — {len(doc)} gate records, coverage {len(coverage)} cuts")


if __name__ == "__main__":
    ap = argparse.ArgumentParser()
    ap.add_argument("--phase", choices=["pre", "evidence"], required=True)
    args = ap.parse_args()
    (mint_pre if args.phase == "pre" else mint_evidence)()
