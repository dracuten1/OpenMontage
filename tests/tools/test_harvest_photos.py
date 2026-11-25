"""Unit tests for tools/media/harvest_photos.py."""
from __future__ import annotations

import hashlib
import io
import json
from pathlib import Path

from PIL import Image

from tools.media.harvest_photos import harvest_photos, parse_item_spec
from tools.qc.source_photo_gate import validate_source_photos


class _FakeResp:
    def __init__(self, data: bytes):
        self._buf = io.BytesIO(data)

    def read(self) -> bytes:
        return self._buf.getvalue()

    def __enter__(self):
        return self

    def __exit__(self, *args):
        return False


def test_parse_item_spec():
    spec = parse_item_spec("capitol.jpg|US Capitol;Capitol building|capitol,washington")
    assert spec == {
        "file": "capitol.jpg",
        "queries": ["US Capitol", "Capitol building"],
        "keywords": ["capitol", "washington"],
    }


def test_harvest_photos_downloads_stages_and_binds_sha256(tmp_path: Path):
    proj = tmp_path / "projects" / "demo-news-20261125"
    pub_imgs = tmp_path / "public_imgs"
    proj.mkdir(parents=True)

    img_buf = io.BytesIO()
    Image.new("RGB", (1200, 800), (20, 40, 80)).save(img_buf, format="JPEG")
    jpg_bytes = img_buf.getvalue()
    expected_sha = hashlib.sha256(jpg_bytes).hexdigest()

    def fake_opener(req, timeout=25):
        url = req.full_url
        if "w/api.php" in url:
            payload = {
                "query": {
                    "pages": {
                        "1": {
                            "title": "File:US_Capitol_West_Front_2022.jpg",
                            "imageinfo": [{
                                "width": 1600,
                                "height": 1066,
                                "mime": "image/jpeg",
                                "url": "https://upload.wikimedia.org/capitol.jpg",
                                "extmetadata": {
                                    "LicenseShortName": {"value": "CC BY-SA 4.0"},
                                    "Artist": {"value": "Jane Doe"},
                                    "DateTimeOriginal": {"value": "2022-05-10"},
                                },
                            }],
                        }
                    }
                }
            }
            return _FakeResp(json.dumps(payload).encode("utf-8"))
        return _FakeResp(jpg_bytes)

    res = harvest_photos(
        proj,
        [{"file": "us_capitol.jpg", "queries": ["US Capitol"], "keywords": ["capitol"]}],
        public_images_dir=pub_imgs,
        opener=fake_opener,
        sleep_fn=lambda _s: None,
    )
    assert res["downloaded"] == 1
    assert (proj / "assets" / "images" / "us_capitol.jpg").is_file()
    assert (pub_imgs / "us_capitol.jpg").is_file()

    prov = json.loads((proj / "assets" / "images" / "provenance.json").read_text(encoding="utf-8"))
    assert prov[0]["sha256"] == expected_sha
    assert prov[0]["vision_verified"] is False

    # After simulated vision inspection, source_photo_gate passes with sha256 verified
    prov[0]["vision_verified"] = True
    prov[0]["subject_match_note"] = "Wide photo of the US Capitol west front facade"
    (proj / "assets" / "images" / "provenance.json").write_text(json.dumps(prov), encoding="utf-8")
    spg = validate_source_photos(proj, write_report=False)
    assert spg["pass"] is True, spg["errors"]
