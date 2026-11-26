"""Unit tests for tools/qc/gate_c_verify.py and Wikimedia Commons fallback in pixabay_image.py."""
from __future__ import annotations

import requests

from tools.graphics.pixabay_image import PixabayImage
from tools.qc.gate_c_verify import check_per_section_asr, compute_sample_timestamps, parse_ebur128_summary


def test_parse_ebur128_summary_extracts_final_block():
    stderr = """
[Parsed_ebur128_0 @ 0x1] t: 117.0 M: -20.0 S: -22.8 I: -11.4 LUFS LRA: 2.3 LU TPK: -0.9 -0.9 dBFS
[Parsed_ebur128_0 @ 0x1] Summary:

  Integrated loudness:
    I:         -11.3 LUFS
    Threshold: -21.7 LUFS

  Loudness range:
    LRA:         2.3 LU
    Threshold: -31.7 LUFS

  True peak:
    Peak:       -0.8 dBFS
"""
    parsed = parse_ebur128_summary(stderr)
    assert parsed == {
        "integrated_lufs": -11.3,
        "true_peak_dbfs": -0.8,
        "lra_lu": 2.3,
    }


def test_compute_sample_timestamps_cover_and_outro():
    samples = compute_sample_timestamps(114.17, 117.17)
    names = [name for name, _ in samples]
    ts = [t for _, t in samples]
    assert names == ["f01_cover.png", "f02_early_mid.png", "f03_midpoint.png", "f04_late_mid.png", "f05_outro.png"]
    assert ts[0] == 0.05
    assert 115.0 <= ts[-1] <= 117.0


class _DummyResponse:
    def __init__(self, *, status_code=200, payload=None, content=b"", url="https://example.com"):
        self.status_code = status_code
        self._payload = payload or {}
        self.content = content
        self.url = url

    def raise_for_status(self):
        if self.status_code >= 400:
            raise requests.HTTPError(f"{self.status_code} Too Many Requests", response=self)

    def json(self):
        return self._payload


def test_pixabay_image_falls_back_to_wikimedia_on_429(tmp_path, monkeypatch):
    monkeypatch.setenv("PIXABAY_API_KEY", "dummy-key")
    out_img = tmp_path / "fallback.jpg"

    def fake_get(url, params=None, headers=None, timeout=30):
        if "pixabay.com/api/" in url:
            return _DummyResponse(status_code=429, url=url)
        if "commons.wikimedia.org/w/api.php" in url:
            assert headers and "OpenMontage" in headers.get("User-Agent", "")
            return _DummyResponse(
                status_code=200,
                url=url,
                payload={
                    "query": {
                        "pages": {
                            "123": {
                                "title": "File:Editorial_Sample.jpg",
                                "imageinfo": [
                                    {
                                        "mime": "image/jpeg",
                                        "width": 1200,
                                        "height": 800,
                                        "url": "https://upload.wikimedia.org/sample.jpg",
                                        "descriptionurl": "https://commons.wikimedia.org/wiki/File:Editorial_Sample.jpg",
                                        "extmetadata": {
                                            "LicenseShortName": {"value": "CC BY-SA 4.0"},
                                            "Artist": {"value": "<a href='#'>Reporter A</a>"},
                                        },
                                    }
                                ],
                            }
                        }
                    }
                },
            )
        if "upload.wikimedia.org/sample.jpg" in url:
            return _DummyResponse(status_code=200, content=b"\xff\xd8\xff\xe0FAKEJPEG", url=url)
        raise AssertionError(f"Unexpected URL: {url}")

    monkeypatch.setattr(requests, "get", fake_get)
    tool = PixabayImage()
    res = tool.execute({
        "query": "central vietnam flood",
        "orientation": "horizontal",
        "output_path": str(out_img),
    })
    assert res.success is True
    assert res.data["provider"] == "wikimedia_commons"
    assert res.data["license"] == "CC BY-SA 4.0"
    assert res.data["author"] == "Reporter A"
    assert "429" in res.data["fallback_reason"]
    assert out_img.is_file() and out_img.read_bytes().startswith(b"\xff\xd8\xff")


def test_check_per_section_asr_detects_section_tail_truncation():
    scene_timing = {
        "sections": [
            {"section_id": "s01", "start_seconds": 0.0, "end_seconds": 4.0},
        ]
    }
    script = {
        "sections": [
            {"id": "S01", "text": "Nhận tiền chuyển nhầm từ mấy triệu đồng thì đi tù?"},
        ]
    }
    truncated_words = [
        {"word": "Nhận", "start": 0.1, "end": 0.4},
        {"word": "tiền", "start": 0.4, "end": 0.7},
        {"word": "chuyển", "start": 0.7, "end": 1.0},
        {"word": "nhầm", "start": 1.0, "end": 1.3},
        {"word": "từ", "start": 1.3, "end": 1.5},
        {"word": "mấy", "start": 1.5, "end": 1.8},
        {"word": "triệu", "start": 1.8, "end": 2.1},
        {"word": "đồng.", "start": 2.1, "end": 2.5},
    ]
    rows, failures = check_per_section_asr(truncated_words, scene_timing, script)
    assert rows[0]["ok"] is False
    assert any(f.startswith("section_tail_truncated:s01") for f in failures)

    complete_words = truncated_words + [
        {"word": "thì", "start": 2.5, "end": 2.7},
        {"word": "đi", "start": 2.7, "end": 3.0},
        {"word": "tù", "start": 3.0, "end": 3.4},
    ]
    rows2, failures2 = check_per_section_asr(complete_words, scene_timing, script)
    assert rows2[0]["ok"] is True
    assert failures2 == []


def test_check_per_section_asr_does_not_bleed_adjacent_section_onset():
    scene_timing = {
        "sections": [
            {"section_id": "s01", "start_seconds": 0.0, "end_seconds": 6.267},
            {"section_id": "s02", "start_seconds": 6.267, "end_seconds": 12.0},
        ]
    }
    script = {
        "sections": [
            {"id": "S01", "text": "Từ mấy triệu đồng thì bị đi tù?"},
            {"id": "S02", "text": "Ngày 17 tháng 11 vừa qua đã ghi nhận vụ mới."},
        ]
    }
    words = [
        {"word": "Từ", "start": 0.0, "end": 0.4},
        {"word": "mấy", "start": 0.4, "end": 0.8},
        {"word": "triệu", "start": 0.8, "end": 1.2},
        {"word": "đồng", "start": 1.2, "end": 1.6},
        {"word": "thì", "start": 1.6, "end": 2.0},
        {"word": "bị", "start": 2.0, "end": 2.4},
        {"word": "đi", "start": 2.4, "end": 2.8},
        {"word": "tù", "start": 5.4, "end": 5.76},
        # Next section starts slightly before t1=6.267 due to frame/AAC alignment
        {"word": "Ngày", "start": 6.22, "end": 6.48},
        {"word": "17", "start": 6.48, "end": 6.80},
        {"word": "tháng", "start": 6.80, "end": 7.10},
        {"word": "11", "start": 7.10, "end": 7.40},
        {"word": "vừa", "start": 7.40, "end": 7.70},
        {"word": "qua", "start": 7.70, "end": 8.00},
        {"word": "đã", "start": 8.00, "end": 8.30},
        {"word": "ghi", "start": 8.30, "end": 8.60},
        {"word": "nhận", "start": 8.60, "end": 8.90},
        {"word": "vụ", "start": 8.90, "end": 9.20},
        {"word": "mới", "start": 9.20, "end": 9.60},
    ]
    rows, failures = check_per_section_asr(words, scene_timing, script)
    assert failures == []
    assert [r["ok"] for r in rows] == [True, True]
