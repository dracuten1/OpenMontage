"""Unit tests for tools/qc/cue_sync_gate.py."""
from __future__ import annotations

import json
from pathlib import Path

from tools.qc.cue_sync_gate import CSG_HARDCODED_LATE_ENTER, CSG_UNRESOLVED_CUE, run_cue_sync_gate


def _setup_project(tmp_path: Path, tsx_body: str):
    proj = tmp_path / "projects" / "ep"
    src = tmp_path / "remotion-composer" / "src" / "ep"
    scenes = src / "scenes"
    scenes.mkdir(parents=True)
    (proj / "artifacts").mkdir(parents=True)
    cues_path = proj / "artifacts" / "aligned_cues.json"
    cues_path.write_text(
        json.dumps({
            "version": "1.0",
            "fps": 30,
            "clock": "scene_local",
            "cues": {
                "s01": [
                    {"word": "Theo", "start": 0.05, "end": 0.25, "start_frame": 2, "end_frame": 8},
                    {"word": "Nghị", "start": 1.0, "end": 1.2, "start_frame": 30, "end_frame": 36},
                    {"word": "định", "start": 1.2, "end": 1.4, "start_frame": 36, "end_frame": 42},
                    {"word": "282/2025/NĐ-CP", "start": 1.4, "end": 2.1, "start_frame": 42, "end_frame": 63},
                ]
            },
        }),
        encoding="utf-8",
    )
    (scenes / "S01.tsx").write_text(tsx_body, encoding="utf-8")
    return proj, src.parent, cues_path


def test_cue_sync_gate_passes_when_all_cues_resolve(tmp_path: Path):
    proj, src_root, cues_path = _setup_project(
        tmp_path,
        'const f = cueFrame("s01", "Nghị định 282", 20);\n',
    )
    rep = run_cue_sync_gate(proj, composer_src_root=src_root, cues_override=cues_path)
    assert rep["status"] == "pass"
    assert rep["resolved_count"] == 1
    assert rep["resolved"][0]["matched_frame"] == 27
    assert (proj / "qc" / "cue_sync.json").is_file()


def test_cue_sync_gate_fails_on_unresolved_cue(tmp_path: Path):
    proj, src_root, cues_path = _setup_project(
        tmp_path,
        'const f = cueFrame("s01", "không tồn tại", 20);\n',
    )
    rep = run_cue_sync_gate(proj, composer_src_root=src_root, cues_override=cues_path)
    assert rep["status"] == "fail"
    assert rep["errors"][0]["code"] == CSG_UNRESOLVED_CUE


def test_cue_sync_gate_warns_on_hardcoded_late_enter(tmp_path: Path):
    proj, src_root, cues_path = _setup_project(
        tmp_path,
        'const ITEMS = [{ enter: 150 }];\n',
    )
    rep = run_cue_sync_gate(proj, composer_src_root=src_root, cues_override=cues_path)
    assert rep["status"] == "pass"
    assert len(rep["warnings"]) == 1
    assert rep["warnings"][0]["code"] == CSG_HARDCODED_LATE_ENTER
