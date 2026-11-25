"""Tests for multi-channel registry, asset resolution, Backlot nested discovery, and CLI tools."""

from __future__ import annotations

import json
import shutil
from pathlib import Path

import pytest
from fastapi.testclient import TestClient

from backlot import server as server_mod
from backlot import state as state_mod
from lib.channels import (
    detect_project_channel,
    list_channels,
    load_channel,
    load_merged_lexicon,
    resolve_channel_asset,
    resolve_channel_mix_profile,
)
from lib.checkpoint import init_project
from lib.paths import REPO_ROOT, iter_project_dirs, resolve_project_dir
from tools.channels.new_channel import create_channel
from tools.channels.sync_channels import sync_channels


def test_real_channels_validate_against_schema():
    channels = list_channels()
    assert "ky-chu-diem-tin" in channels
    assert "vn-myth" in channels

    kcdt = load_channel("ky-chu-diem-tin", validate=True)
    assert kcdt["platform"] == "tiktok"
    assert kcdt["canvas"]["width"] == 1080
    assert kcdt["canvas"]["height"] == 1920
    assert kcdt["theme"]["style_playbook"] == "archival-editorial"

    myth = load_channel("vn-myth", validate=True)
    assert myth["platform"] == "youtube"
    assert myth["canvas"]["width"] == 1920
    assert myth["canvas"]["height"] == 1080
    assert myth["theme"]["style_playbook"] == "ink-genome"


def test_resolve_channel_asset_precedence(tmp_path: Path):
    channels_dir = tmp_path / "channels"
    ch_assets = channels_dir / "ky-chu-diem-tin" / "assets" / "brand"
    ch_assets.mkdir(parents=True)
    ch_file = ch_assets / "bumper.mp4"
    ch_file.write_bytes(b"channel")

    proj_dir = tmp_path / "projects" / "ky-chu-diem-tin" / "ep1"
    (proj_dir / "assets" / "brand").mkdir(parents=True)

    # Channel asset wins when episode override absent
    resolved = resolve_channel_asset(
        "ky-chu-diem-tin",
        "brand/bumper.mp4",
        project_dir=proj_dir,
        channels_dir=channels_dir,
    )
    assert resolved == ch_file

    # Episode override wins over channel asset
    ep_file = proj_dir / "assets" / "brand" / "bumper.mp4"
    ep_file.write_bytes(b"episode")
    resolved_override = resolve_channel_asset(
        "ky-chu-diem-tin",
        "brand/bumper.mp4",
        project_dir=proj_dir,
        channels_dir=channels_dir,
    )
    assert resolved_override == ep_file


def test_load_merged_lexicon_merges_channel_and_episode_overrides(tmp_path: Path):
    channels_dir = tmp_path / "channels"
    ch_dir = channels_dir / "vn-myth"
    ch_dir.mkdir(parents=True)
    (ch_dir / "channel.yaml").write_text(
        (REPO_ROOT / "channels" / "vn-myth" / "channel.yaml").read_text(encoding="utf-8"),
        encoding="utf-8",
    )
    (ch_dir / "tts_lexicon.json").write_text(
        json.dumps({"version": "1.0", "replacements": {"ĐVSKTT": "Đại Việt sử ký toàn thư", "Sơn Tinh": "Sơn Tinh"}}),
        encoding="utf-8",
    )
    proj_dir = tmp_path / "projects" / "vn-myth" / "ep-1"
    proj_dir.mkdir(parents=True)
    (proj_dir / "tts_lexicon.json").write_text(
        json.dumps({"replacements": {"Sơn Tinh": "Thần Tản Viên", "Hùng Vương": "Vua Hùng"}}),
        encoding="utf-8",
    )

    merged = load_merged_lexicon("vn-myth", proj_dir, channels_dir=channels_dir)
    assert merged is not None
    assert merged["replacements"]["ĐVSKTT"] == "Đại Việt sử ký toàn thư"
    assert merged["replacements"]["Sơn Tinh"] == "Thần Tản Viên"
    assert merged["replacements"]["Hùng Vương"] == "Vua Hùng"


def test_init_project_nested_by_channel_and_defaults_playbook(tmp_path: Path):
    proj_dir = init_project(
        "ep-1",
        title="Ep 1",
        pipeline_type="animated-explainer",
        pipeline_dir=tmp_path,
        channel="ky-chu-diem-tin",
    )
    assert proj_dir == tmp_path / "ky-chu-diem-tin" / "ep-1"
    marker = json.loads((proj_dir / "project.json").read_text(encoding="utf-8"))
    assert marker["channel"] == "ky-chu-diem-tin"
    assert marker["style_playbook"] == "archival-editorial"
    assert detect_project_channel(proj_dir, projects_dir=tmp_path) == "ky-chu-diem-tin"
    assert resolve_channel_mix_profile("vn-myth").name == "mix_profile.json"


def test_backlot_discovers_both_flat_and_nested_projects(tmp_path: Path, monkeypatch):
    projects_root = tmp_path / "projects"
    projects_root.mkdir()
    monkeypatch.setattr(state_mod, "PROJECTS_DIR", projects_root)
    monkeypatch.setattr(server_mod, "PROJECTS_DIR", projects_root)
    monkeypatch.setattr(server_mod, "_summary_cache", {})
    monkeypatch.setattr(server_mod, "_PROJECTS_ROOT_STR", __import__("os").path.normcase(str(projects_root.resolve())))
    monkeypatch.setattr(server_mod, "THUMB_CACHE_DIR", tmp_path / "thumbs")

    # Flat legacy project
    flat = init_project("legacy-ep", title="Legacy", pipeline_type="animated-explainer", pipeline_dir=projects_root)
    (flat / "renders" / "final.mp4").write_bytes(b"flat")

    # Nested channel project
    nested = init_project(
        "nested-ep",
        title="Nested",
        pipeline_type="animated-explainer",
        pipeline_dir=projects_root,
        channel="ky-chu-diem-tin",
    )
    (nested / "renders" / "final.mp4").write_bytes(b"nested-media")

    pairs = iter_project_dirs(projects_root)
    ids = {p.name: ch for ch, p in pairs}
    assert ids["legacy-ep"] is None
    assert ids["nested-ep"] == "ky-chu-diem-tin"
    assert resolve_project_dir("nested-ep", projects_root) == nested

    async def no_watch():
        return None

    monkeypatch.setattr(server_mod, "_watch_projects", no_watch)
    with TestClient(server_mod.create_app()) as client:
        res = client.get("/api/projects")
        assert res.status_code == 200
        by_id = {item["project_id"]: item for item in res.json()}
        assert "legacy-ep" in by_id
        assert "nested-ep" in by_id
        assert by_id["nested-ep"]["channel"] == "ky-chu-diem-tin"

        st = client.get("/api/project/nested-ep/state")
        assert st.status_code == 200
        assert st.json()["channel"] == "ky-chu-diem-tin"

        media = client.get("/media/nested-ep/renders/final.mp4")
        assert media.status_code == 200
        assert media.content == b"nested-media"

        assert client.get("/api/project/../state").status_code == 404
        assert client.get("/api/project/C:/state").status_code == 400


def test_new_channel_and_sync_channels_end_to_end(tmp_path: Path):
    channels_dir = tmp_path / "channels"
    shutil.copytree(REPO_ROOT / "channels" / "_template", channels_dir / "_template")
    projects_dir = tmp_path / "projects"
    composer_dir = tmp_path / "remotion-composer"
    (composer_dir / "src" / "channels").mkdir(parents=True)
    shutil.copy2(
        REPO_ROOT / "remotion-composer" / "src" / "channels" / "registry.ts",
        composer_dir / "src" / "channels" / "registry.ts",
    )

    created = create_channel(
        "tech-deep-dive",
        name="Tech Deep Dive",
        platform="youtube",
        aspect="16:9",
        base_theme="clean-minimal",
        channels_dir=channels_dir,
        projects_dir=projects_dir,
        composer_dir=composer_dir,
    )
    assert created["status"] == "created"
    assert (channels_dir / "tech-deep-dive" / "channel.yaml").is_file()
    assert (projects_dir / "tech-deep-dive" / ".gitkeep").is_file()
    assert (composer_dir / "src" / "channels" / "tech-deep-dive" / "theme.ts").is_file()
    registry_txt = (composer_dir / "src" / "channels" / "registry.ts").read_text(encoding="utf-8")
    assert '"tech-deep-dive": techDeepDiveTheme' in registry_txt

    # Duplicate invocation without --force fails cleanly
    with pytest.raises(FileExistsError):
        create_channel(
            "tech-deep-dive",
            name="Tech Deep Dive",
            platform="youtube",
            channels_dir=channels_dir,
            projects_dir=projects_dir,
            composer_dir=composer_dir,
        )

    report = sync_channels(
        channel="tech-deep-dive",
        check=True,
        stage_assets=True,
        run_tests=False,
        channels_dir=channels_dir,
        composer_dir=composer_dir,
    )
    assert report["status"] == "ok"
    assert report["channels"][0]["valid"] is True
