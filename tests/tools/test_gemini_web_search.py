"""Tests for the Gemini Web Search tool (mocked, no GUI or Chrome calls)."""

from __future__ import annotations

import json
from pathlib import Path
from types import SimpleNamespace
from unittest.mock import patch

from tools.analysis import gemini_web_search as gws_mod
from tools.analysis.gemini_web_search import GeminiWebSearch
from tools.base_tool import ToolStatus, ToolTier


def _patch_prereqs(monkeypatch, tmp_path: Path, *, helper_exists: bool = True, bin_exists: bool = True):
    helper = tmp_path / "chrome_ax_helper.py"
    if helper_exists:
        helper.write_text("#!/usr/bin/env python3\n", encoding="utf-8")
    monkeypatch.setattr(gws_mod, "_default_helper_path", lambda: helper)
    monkeypatch.setattr(
        gws_mod,
        "_default_agent_desktop_bin",
        (lambda: "/opt/homebrew/bin/agent-desktop") if bin_exists else (lambda: None),
    )


def test_gemini_web_search_identity():
    tool = GeminiWebSearch()
    assert tool.name == "gemini_web_search"
    assert tool.capability == "web_search"
    assert tool.tier == ToolTier.ANALYZE
    assert tool.provider == "gemini_web"
    assert tool.agent_skills == ["gemini-web-search"]
    assert "web_search" in tool.capabilities
    assert "research" in tool.capabilities
    assert tool.estimate_cost({"query": "anything"}) == 0.0


def test_gemini_web_search_status(monkeypatch, tmp_path):
    tool = GeminiWebSearch()
    _patch_prereqs(monkeypatch, tmp_path, helper_exists=False, bin_exists=True)
    assert tool.get_status() == ToolStatus.UNAVAILABLE

    _patch_prereqs(monkeypatch, tmp_path, helper_exists=True, bin_exists=False)
    assert tool.get_status() == ToolStatus.UNAVAILABLE

    _patch_prereqs(monkeypatch, tmp_path, helper_exists=True, bin_exists=True)
    assert tool.get_status() == ToolStatus.AVAILABLE


def test_gemini_web_search_execute_and_markdown_output(monkeypatch, tmp_path):
    _patch_prereqs(monkeypatch, tmp_path)
    tool = GeminiWebSearch()
    recorded_cmds: list[list[str]] = []

    def fake_run(cmd, **_kwargs):
        recorded_cmds.append(cmd)
        out_idx = cmd.index("--out") + 1
        out_file = Path(cmd[out_idx])
        out_file.write_text(
            "Giá vàng SJC ngày 26/11/2026 biến động mạnh.\n\n"
            "```markdown\n"
            "https://vnexpress.net/gia-vang-hom-nay-123.html,\n"
            "https://reuters.com/markets/gold-456\n"
            "```\n",
            encoding="utf-8",
        )
        return SimpleNamespace(
            returncode=0,
            stdout=json.dumps({"ok": True, "window_id": "w-101"}),
            stderr="",
        )

    out_md = tmp_path / "research.md"
    with patch("subprocess.run", side_effect=fake_run):
        result = tool.execute({
            "query": "Giá vàng hôm nay",
            "freshness_anchor": "2026-11-26",
            "output_path": str(out_md),
        })

    assert result.success is True
    assert result.cost_usd == 0.0
    assert result.data["provider"] == "gemini_web"
    assert result.data["profile"] == "Default"
    assert result.data["window_id"] == "w-101"
    assert result.data["num_urls"] == 2
    assert result.data["urls"] == [
        "https://vnexpress.net/gia-vang-hom-nay-123.html",
        "https://reuters.com/markets/gold-456",
    ]
    assert "--profile-dir" in recorded_cmds[0]
    assert "Default" in recorded_cmds[0]
    assert "--new-chat" in recorded_cmds[0]
    assert "--prefer-copy-code" in recorded_cmds[0]
    assert out_md.exists()
    md_text = out_md.read_text(encoding="utf-8")
    assert "Gemini Web Research: Giá vàng hôm nay" in md_text
    assert "https://vnexpress.net/gia-vang-hom-nay-123.html" in md_text


def test_gemini_web_search_profile_rotation(monkeypatch, tmp_path):
    _patch_prereqs(monkeypatch, tmp_path)
    tool = GeminiWebSearch()
    seen_profiles: list[str] = []

    def fake_run(cmd, **_kwargs):
        prof = cmd[cmd.index("--profile-dir") + 1]
        seen_profiles.append(prof)
        out_file = Path(cmd[cmd.index("--out") + 1])
        if prof == "Default":
            out_file.write_text("You reached your limit. Please try again later.", encoding="utf-8")
            return SimpleNamespace(
                returncode=0,
                stdout=json.dumps({"ok": True, "window_id": "w-1"}),
                stderr="",
            )
        out_file.write_text(
            "Verified summary from https://baochinhphu.vn/tin-chinh-thuc-789.htm",
            encoding="utf-8",
        )
        return SimpleNamespace(
            returncode=0,
            stdout=json.dumps({"ok": True, "window_id": "w-2"}),
            stderr="",
        )

    with patch("subprocess.run", side_effect=fake_run):
        result = tool.execute({"query": "Thuế quan mới", "prompt_mode": "raw"})

    assert result.success is True
    assert seen_profiles == ["Default", "Profile 2"]
    assert result.data["profile"] == "Profile 2"
    assert len(result.data["attempts"]) == 2
    assert result.data["attempts"][0]["ok"] is False
    assert result.data["attempts"][1]["ok"] is True


def test_gemini_web_search_window_id_and_json_output(monkeypatch, tmp_path):
    _patch_prereqs(monkeypatch, tmp_path)
    tool = GeminiWebSearch()
    recorded_cmds: list[list[str]] = []

    def fake_run(cmd, **_kwargs):
        recorded_cmds.append(cmd)
        out_file = Path(cmd[cmd.index("--out") + 1])
        out_file.write_text("Output from pinned window https://example.org/doc", encoding="utf-8")
        return SimpleNamespace(
            returncode=0,
            stdout=json.dumps({"ok": True, "window_id": "w-555"}),
            stderr="",
        )

    out_json = tmp_path / "research.json"
    with patch("subprocess.run", side_effect=fake_run):
        result = tool.execute({
            "query": "Test window query",
            "window_id": "w-555",
            "new_chat": False,
            "prefer_copy_code": False,
            "output_path": str(out_json),
        })

    assert result.success is True
    assert len(recorded_cmds) == 1
    assert "--window-id" in recorded_cmds[0]
    assert "w-555" in recorded_cmds[0]
    assert "--profile-dir" not in recorded_cmds[0]
    assert "--new-chat" not in recorded_cmds[0]
    assert "--prefer-copy-code" not in recorded_cmds[0]
    assert result.data["profile"] is None
    assert result.data["window_id"] == "w-555"
    saved = json.loads(out_json.read_text(encoding="utf-8"))
    assert saved["urls"] == ["https://example.org/doc"]
