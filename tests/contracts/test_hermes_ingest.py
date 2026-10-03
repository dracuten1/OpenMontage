"""Tests for Hermes research ingest script and schema compliance."""

from pathlib import Path
import pytest
from schemas.artifacts import validate_artifact
from scripts.hermes_research_ingest import build_research_brief, ingest_to_project


def test_build_research_brief_valid():
    data = {
        "topic": "ETH-USD Market Analysis 2026-10-03",
        "data_points": [
            {
                "claim": "ETH RSI at 48.5 on 4h timeframe",
                "source_url": "https://tradingagents.local/eth",
                "credibility": "primary_source",
            },
            {
                "claim": "Support zone confirmed at 2700 USD",
                "source_url": "https://tradingagents.local/eth",
                "credibility": "primary_source",
            },
            {
                "claim": "Volume breakout confirmed on Binance spot",
                "source_url": "https://binance.com",
                "credibility": "primary_source",
            },
        ],
        "sources": [
            {
                "url": "https://tradingagents.local/eth",
                "title": "TradingAgents ETH Report",
                "used_for": "Technical analysis",
            },
            {
                "url": "https://binance.com",
                "title": "Binance Spot ETHUSDT",
                "used_for": "Volume confirmation",
            },
            {
                "url": "https://coingecko.com/eth",
                "title": "CoinGecko Market Data",
                "used_for": "Price snapshot",
            },
            {
                "url": "https://news.cointel.com/1",
                "title": "Macro Crypto News",
                "used_for": "Sentiment context",
            },
            {
                "url": "https://ethereum.org",
                "title": "Ethereum Network Stats",
                "used_for": "On-chain baseline",
            },
        ],
        "summary": "ETH is consolidating around 2700 with neutral momentum.",
    }
    brief = build_research_brief(data)
    validate_artifact("research_brief", brief)
    assert len(brief["data_points"]) >= 3
    assert len(brief["sources"]) >= 5
    assert len(brief["angles_discovered"]) >= 3


def test_ingest_to_project(tmp_path: Path):
    data = {
        "topic": "Bitcoin Macro Shift",
        "data_points": [
            {"claim": "BTC Hashrate reached new ATH", "source_url": "https://mempool.space", "credibility": "primary_source"},
            {"claim": "ETF inflows positive for 5 consecutive days", "source_url": "https://farside.co.uk", "credibility": "secondary_source"},
            {"claim": "Active addresses increased 12%", "source_url": "https://glassnode.com", "credibility": "primary_source"},
        ],
        "sources": [
            {"url": "https://mempool.space", "title": "Mempool Space", "used_for": "Hashrate metrics"},
            {"url": "https://farside.co.uk", "title": "Farside Investors", "used_for": "ETF flows"},
            {"url": "https://glassnode.com", "title": "Glassnode On-Chain", "used_for": "Active addresses"},
            {"url": "https://coingecko.com", "title": "CoinGecko", "used_for": "Spot prices"},
            {"url": "https://reuters.com", "title": "Reuters Financial", "used_for": "Macro policy"},
        ],
        "summary": "BTC shows strong institutional accumulation.",
    }
    project_id = "test-btc-ingest"
    result = ingest_to_project(data, project_id=project_id, base_dir=tmp_path)
    assert result["status"] == "ok"
    assert (tmp_path / project_id / "artifacts" / "research_brief.json").exists()
    assert (tmp_path / project_id / "checkpoint_research.json").exists()
    assert (tmp_path / project_id / "project.json").exists()
