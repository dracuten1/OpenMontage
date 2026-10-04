"""Tests for the 9router web_search tool."""

from __future__ import annotations

import json
from pathlib import Path
from unittest.mock import MagicMock, patch

import pytest

from tools.analysis.web_search import WebSearch
from tools.base_tool import ToolStatus, ToolTier


def test_web_search_identity():
    tool = WebSearch()
    assert tool.name == "web_search"
    assert tool.capability == "web_search"
    assert tool.tier == ToolTier.ANALYZE
    assert tool.provider == "9router"
    assert "web_search" in tool.capabilities
    assert "research" in tool.capabilities
    assert tool.estimate_cost({"query": "anything"}) == 0.0


def test_web_search_status(monkeypatch):
    tool = WebSearch()
    monkeypatch.delenv("OPENAI_API_KEY", raising=False)
    monkeypatch.delenv("NINEROUTER_KEY", raising=False)
    assert tool.get_status() == ToolStatus.UNAVAILABLE

    monkeypatch.setenv("OPENAI_API_KEY", "test-key")
    assert tool.get_status() == ToolStatus.AVAILABLE


def test_web_search_execute_mock(monkeypatch, tmp_path):
    monkeypatch.setenv("OPENAI_API_KEY", "test-key")
    tool = WebSearch()

    mock_resp_data = {
        "provider": "antigravity",
        "query": "Vietnamese history",
        "results": [
            {
                "title": "Dong Son Culture",
                "url": "https://example.com/dong-son",
                "snippet": "Ancient Bronze Age civilization.",
                "content": "Full excerpt of Dong Son culture.",
            }
        ],
        "answer": {
            "source": "antigravity",
            "text": "The Dong Son culture was a Bronze Age civilization in Vietnam.",
        },
    }

    mock_resp = MagicMock()
    mock_resp.read.return_value = json.dumps(mock_resp_data).encode("utf-8")
    mock_resp.__enter__.return_value = mock_resp

    out_md = tmp_path / "research.md"

    with patch("urllib.request.urlopen", return_value=mock_resp):
        result = tool.execute({
            "query": "Vietnamese history",
            "max_results": 1,
            "output_path": str(out_md),
        })

    assert result.success is True
    assert result.data["query"] == "Vietnamese history"
    assert result.data["num_results"] == 1
    assert "Dong Son" in result.data["answer"]
    assert result.data["results"][0]["title"] == "Dong Son Culture"
    assert len(result.artifacts) == 1
    assert out_md.exists()
    content = out_md.read_text(encoding="utf-8")
    assert "Research Report: Vietnamese history" in content
    assert "Dong Son Culture" in content


def test_web_search_json_output(monkeypatch, tmp_path):
    monkeypatch.setenv("OPENAI_API_KEY", "test-key")
    tool = WebSearch()

    mock_resp_data = {
        "provider": "antigravity",
        "query": "test query",
        "results": [],
        "answer": "Simple text answer",
    }
    mock_resp = MagicMock()
    mock_resp.read.return_value = json.dumps(mock_resp_data).encode("utf-8")
    mock_resp.__enter__.return_value = mock_resp

    out_json = tmp_path / "research.json"

    with patch("urllib.request.urlopen", return_value=mock_resp):
        result = tool.execute({
            "query": "test query",
            "output_path": str(out_json),
        })

    assert result.success is True
    assert out_json.exists()
    saved = json.loads(out_json.read_text(encoding="utf-8"))
    assert saved["query"] == "test query"
