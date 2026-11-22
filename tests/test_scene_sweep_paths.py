"""Tests for tools/qc/scene_sweep.py relative path resolution."""

from __future__ import annotations

import json
import subprocess
from pathlib import Path

from PIL import Image

from tools.qc import scene_sweep


def test_scene_sweep_resolves_relative_out_to_absolute_for_remotion(tmp_path: Path, monkeypatch):
    timing_file = tmp_path / "timing.json"
    timing_file.write_text(
        json.dumps(
            {
                "fps": 30,
                "scenes": [
                    {
                        "scene_id": "scene-1",
                        "start_frame": 0,
                        "duration_frames": 90,
                        "start_seconds": 0.0,
                        "duration_seconds": 3.0,
                    }
                ],
            }
        ),
        encoding="utf-8",
    )

    monkeypatch.chdir(tmp_path)
    recorded_cmds: list[list[str]] = []

    def fake_run(cmd, cwd=None, capture_output=True, text=True):
        recorded_cmds.append(list(cmd))
        out_png = Path(cmd[5])
        assert out_png.is_absolute(), f"expected absolute png path for cwd={cwd}, got {out_png}"
        out_png.parent.mkdir(parents=True, exist_ok=True)
        Image.new("RGB", (1080, 1920), (14, 18, 28)).save(out_png, format="PNG")
        return subprocess.CompletedProcess(cmd, 0, stdout="", stderr="")

    monkeypatch.setattr(scene_sweep.subprocess, "run", fake_run)

    rc = scene_sweep.main([
        "--entry",
        "src/index.tsx",
        "--composition",
        "dummy-comp",
        "--scene-timing",
        str(timing_file),
        "--out",
        "rel_out/stills",
        "--scenes",
        "scene-1",
    ])

    assert rc == 0
    assert len(recorded_cmds) == 2
    assert (tmp_path / "rel_out" / "stills" / "scene_sweep_report.json").is_file()
