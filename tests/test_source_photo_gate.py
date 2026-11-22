"""Tests for tools/qc/source_photo_gate.py."""

from __future__ import annotations

import json
from pathlib import Path

from PIL import Image

from tools.qc import source_photo_gate


def _make_jpg(path: Path, size: tuple[int, int] = (1200, 800)) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    img = Image.new("RGB", size, color=(40, 80, 120))
    img.save(path, format="JPEG")


def _valid_entry(file_rel: str = "assets/images/bridge.jpg", **overrides) -> dict:
    base = {
        "file": file_rel,
        "page": "https://commons.wikimedia.org/wiki/File:Example.jpg",
        "artist": "Example Photographer",
        "license": "CC BY-SA 4.0",
        "taken": "2022-10-11",
        "credit_line": "Ảnh: Example Photographer · Wikimedia Commons · CC BY-SA 4.0",
        "vision_verified": True,
        "visual_type": "photograph",
        "subject_match_note": "Wide daylight photograph showing twin steel arch bridge spans over water",
    }
    base.update(overrides)
    return base


def test_valid_verified_photo_passes_and_flags_archive_year(tmp_path: Path):
    proj = tmp_path / "kerch-kyiv-20261121-v2"
    _make_jpg(proj / "assets" / "images" / "bridge.jpg", (1280, 960))
    prov = proj / "assets" / "images" / "provenance.json"
    prov.write_text(json.dumps([_valid_entry()]), encoding="utf-8")

    report = source_photo_gate.validate_source_photos(proj)
    assert report["pass"] is True
    assert report["checked"] == 1
    assert report["entries"][0]["needs_archive_year_badge"] is True
    assert (proj / "qc" / "source_photo_gate.json").is_file()


def test_disallowed_stamp_visual_type_blocks(tmp_path: Path):
    proj = tmp_path / "kerch-20261121"
    _make_jpg(proj / "assets" / "images" / "stamp.jpg", (1200, 1200))
    prov = proj / "assets" / "images" / "provenance.json"
    prov.write_text(json.dumps([_valid_entry("assets/images/stamp.jpg", visual_type="stamp")]), encoding="utf-8")

    report = source_photo_gate.validate_source_photos(proj)
    assert report["pass"] is False
    codes = {e["code"] for e in report["errors"]}
    assert "SPG-VISUAL-TYPE-REJECTED" in codes


def test_unverified_photo_blocks(tmp_path: Path):
    proj = tmp_path / "proj-20261121"
    _make_jpg(proj / "assets" / "images" / "bridge.jpg", (1200, 900))
    prov = proj / "assets" / "images" / "provenance.json"
    entry = _valid_entry()
    del entry["vision_verified"]
    prov.write_text(json.dumps([entry]), encoding="utf-8")

    report = source_photo_gate.validate_source_photos(proj)
    assert report["pass"] is False
    assert any(e["code"] == "SPG-VISION-UNVERIFIED" for e in report["errors"])


def test_low_res_and_corrupt_images_block(tmp_path: Path):
    proj = tmp_path / "proj-20261121"
    _make_jpg(proj / "assets" / "images" / "tiny.jpg", (400, 300))
    corrupt = proj / "assets" / "images" / "bad.jpg"
    corrupt.parent.mkdir(parents=True, exist_ok=True)
    corrupt.write_bytes(b"not-a-valid-image")

    prov = proj / "assets" / "images" / "provenance.json"
    prov.write_text(json.dumps([
        _valid_entry("assets/images/tiny.jpg"),
        _valid_entry("assets/images/bad.jpg"),
    ]), encoding="utf-8")

    report = source_photo_gate.validate_source_photos(proj)
    assert report["pass"] is False
    codes = {e["code"] for e in report["errors"]}
    assert "SPG-LOW-RES" in codes
    assert "SPG-IMAGE-CORRUPT" in codes


def test_path_escape_blocks(tmp_path: Path):
    proj = tmp_path / "proj-20261121"
    proj.mkdir()
    outside = tmp_path / "secret.jpg"
    _make_jpg(outside, (1000, 1000))
    prov = proj / "assets" / "images" / "provenance.json"
    prov.parent.mkdir(parents=True)
    prov.write_text(json.dumps([_valid_entry("../secret.jpg")]), encoding="utf-8")

    report = source_photo_gate.validate_source_photos(proj)
    assert report["pass"] is False
    assert any(e["code"] == "SPG-PATH-ESCAPE" for e in report["errors"])
