"""Unit tests for tools/qc/ship_episode.py."""
from __future__ import annotations

import json
from pathlib import Path

import pytest

from tools.qc.ship_episode import ship_episode


def test_ship_episode_executes_ordered_pipeline_and_stops_on_failure(tmp_path: Path):
    proj = tmp_path / "projects" / "demo-ep"
    (proj / "artifacts").mkdir(parents=True)
    (proj / "assets" / "images").mkdir(parents=True)
    (proj / "qc").mkdir(parents=True)
    (proj / "project.json").write_text(json.dumps({
        "id": "demo-ep",
        "lane": "news-editorial-motion",
        "style_playbook": "archival-editorial",
    }))
    (proj / "artifacts" / "fact_whitelist.json").write_text(json.dumps({"facts": []}))
    (proj / "assets" / "images" / "provenance.json").write_text("[]")
    (proj / "qc" / "gate_c_final_verify.json").write_text(json.dumps({"status": "pass"}))

    calls: list[list[str]] = []

    def ok_runner(cmd, **kw):
        calls.append(list(cmd))
        return type("P", (), {"returncode": 0, "stdout": "OK", "stderr": ""})()

    res = ship_episode(project_dir=proj, comp_id="demo-ep-DRAFT", runner=ok_runner)
    assert res["status"] == "pass"
    assert res["steps_executed"] == [
        "tsc",
        "source_photo_gate",
        "fact_whitelist_gate",
        "editorial_language_gate",
        "mixdown_premix",
        "mix_validator",
        "render_episode",
        "mixdown_mux",
        "gate_c_verify",
    ]

    # Stop immediately on first failing gate
    fail_calls: list[list[str]] = []

    def fail_on_whitelist(cmd, **kw):
        fail_calls.append(list(cmd))
        if any("fact_whitelist_gate" in part for part in cmd):
            return type("P", (), {"returncode": 1, "stdout": "", "stderr": "FWG failed"})()
        return type("P", (), {"returncode": 0, "stdout": "OK", "stderr": ""})()

    with pytest.raises(RuntimeError, match="fact_whitelist_gate"):
        ship_episode(project_dir=proj, comp_id="demo-ep-DRAFT", runner=fail_on_whitelist)
    assert len(fail_calls) == 3  # tsc, source_photo_gate, fact_whitelist_gate — stopped!
