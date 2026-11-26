"""Unit tests for tools/audio/build_episode_audio.py."""
from __future__ import annotations

import json
import wave
from pathlib import Path

import numpy as np

from schemas.artifacts import validate_artifact
from tools.audio.build_episode_audio import (
    _check_section_completeness,
    _split_tts_chunks,
    build_episode_audio,
)
from tools.qc.timing_relock_guard import check_project_timing


def _write_wav(path: Path, dur_s: float, rate: int = 48000) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    n = int(rate * dur_s)
    t = np.arange(n) / rate
    pcm = (0.2 * np.sin(2 * np.pi * 220.0 * t) * 32767.0).astype("<i2")
    with wave.open(str(path), "wb") as w:
        w.setnchannels(1)
        w.setsampwidth(2)
        w.setframerate(rate)
        w.writeframes(pcm.tobytes())


def test_build_episode_audio_emits_schema_valid_artifacts_and_passes_timing_guard(tmp_path: Path):
    proj = tmp_path / "projects" / "demo-ep"
    composer = tmp_path / "remotion-composer"
    (proj / "artifacts").mkdir(parents=True)
    (proj / "script.json").write_text(
        json.dumps({
            "version": "1.0",
            "title": "Demo Episode",
            "total_duration_seconds": 4.0,
            "sections": [
                {
                    "id": "s01",
                    "label": "Hook",
                    "text": "Giá vàng lập đỉnh mới",
                    "start_seconds": 0.0,
                    "end_seconds": 2.0,
                    "delivery_cues": {"provider_text": "Giá vàng lập đỉnh mới"},
                },
                {
                    "id": "s02",
                    "label": "Chi tiết",
                    "text": "Thị trường biến động mạnh",
                    "start_seconds": 2.0,
                    "end_seconds": 4.0,
                },
            ],
        }),
        encoding="utf-8",
    )

    def fake_tts(text: str, raw_out: Path) -> None:
        _write_wav(raw_out, 1.5)

    def fake_transcribe(wav_path: Path) -> list[dict]:
        if "s01" in wav_path.name:
            return [
                {"word": "Giá", "start": 0.05, "end": 0.25},
                {"word": "vàng", "start": 0.26, "end": 0.50},
                {"word": "lập", "start": 0.51, "end": 0.75},
                {"word": "đỉnh", "start": 0.76, "end": 1.00},
                {"word": "mới", "start": 1.01, "end": 1.25},
            ]
        return [
            {"word": "Thị", "start": 0.05, "end": 0.25},
            {"word": "trường", "start": 0.26, "end": 0.50},
            {"word": "biến", "start": 0.51, "end": 0.75},
            {"word": "động", "start": 0.76, "end": 1.00},
            {"word": "mạnh", "start": 1.01, "end": 1.25},
        ]

    res = build_episode_audio(
        proj,
        speed=1.0,
        tail_seconds=0.25,
        write_entry=True,
        composer_root=composer,
        tts_fn=fake_tts,
        transcribe_fn=fake_transcribe,
    )

    assert res["sections"] == 2
    assert (composer / "src" / "demo-ep" / "timing.ts").is_file()
    assert (composer / "src" / "demo-ep" / "index.tsx").is_file()
    assert not (composer / "src" / "demo-ep" / "index.ts").exists()

    timing_ts = (composer / "src" / "demo-ep" / "timing.ts").read_text(encoding="utf-8")
    assert "export function cueFrame(" in timing_ts

    cues_pub = json.loads((composer / "public" / "demo-ep" / "cues.json").read_text(encoding="utf-8"))
    cues_art = json.loads((proj / "artifacts" / "aligned_cues.json").read_text(encoding="utf-8"))
    assert cues_pub == cues_art
    assert cues_pub["clock"] == "scene_local"
    assert cues_pub["cues"]["s01"][0]["word"] == "Giá"
    assert cues_pub["cues"]["s02"][0]["start"] == 0.05

    captions = json.loads((composer / "public" / "demo-ep" / "captions.json").read_text(encoding="utf-8"))
    assert captions["clock"] == "scene_local"
    # Scene 2 local start should stay near 0.05s (not offset by scene 1)
    assert captions["captions"]["s02"][0]["start"] < 0.2

    manifest = json.loads((proj / "artifacts" / "asset_manifest.json").read_text(encoding="utf-8"))
    edit_dec = json.loads((proj / "artifacts" / "edit_decisions.json").read_text(encoding="utf-8"))
    validate_artifact("asset_manifest", manifest)
    validate_artifact("edit_decisions", edit_dec)

    timing_res = check_project_timing(proj, mode="strict")
    assert timing_res.valid is True, timing_res.errors


def test_build_episode_audio_trims_leading_silence(tmp_path: Path):
    proj = tmp_path / "projects" / "silence-ep"
    composer = tmp_path / "remotion-composer"
    (proj / "artifacts").mkdir(parents=True)
    (proj / "script.json").write_text(
        json.dumps({
            "version": "1.0",
            "title": "Silence Trim Episode",
            "total_duration_seconds": 1.0,
            "sections": [
                {"id": "s01", "label": "Hook", "text": "Xin chào", "start_seconds": 0.0, "end_seconds": 1.0},
            ],
        }),
        encoding="utf-8",
    )

    def fake_tts_with_silence(text: str, raw_out: Path) -> None:
        raw_out.parent.mkdir(parents=True, exist_ok=True)
        rate = 48000
        silence = np.zeros(int(rate * 0.4), dtype="<i2")
        t = np.arange(int(rate * 0.8)) / rate
        tone = (0.25 * np.sin(2 * np.pi * 220.0 * t) * 32767.0).astype("<i2")
        pcm = np.concatenate([silence, tone])
        with wave.open(str(raw_out), "wb") as w:
            w.setnchannels(1)
            w.setsampwidth(2)
            w.setframerate(rate)
            w.writeframes(pcm.tobytes())

    build_episode_audio(
        proj,
        speed=1.0,
        tail_seconds=0.25,
        composer_root=composer,
        tts_fn=fake_tts_with_silence,
        transcribe_fn=lambda _p: [{"word": "Xin", "start": 0.01, "end": 0.3}, {"word": "chào", "start": 0.31, "end": 0.6}],
    )
    out_wav = proj / "assets" / "audio" / "voice_s01.wav"
    with wave.open(str(out_wav), "rb") as w:
        dur = w.getnframes() / float(w.getframerate())
    assert dur < 0.95, f"Expected 0.4s leading silence to be trimmed, got dur={dur:.3f}s"


def test_split_tts_chunks_prevents_vieneu_danger_zone():
    long_text = (
        "Bỗng dưng tài khoản báo nhận tiền chuyển nhầm, thậm chí như vụ bảy trăm bốn mươi bảy phẩy năm triệu đồng "
        "mới được Bộ Công an cảnh báo ngày mười bảy tháng mười một năm hai nghìn không trăm hai sáu, "
        "tiêu xài hoặc chặn liên lạc từ mấy triệu đồng thì đi tù?"
    )
    chunks = _split_tts_chunks(long_text, max_chars=150)
    assert len(chunks) >= 2
    assert all(len(c) <= 150 for c, _ in chunks)
    assert chunks[-1][1] == 0.0
    assert "thì đi tù?" in chunks[-1][0]


def test_section_completeness_guard_catches_truncated_tail():
    disp = "Nhận tiền chuyển nhầm từ mấy triệu đồng thì đi tù?"
    prov = disp
    bad_asr = [
        {"word": "Nhận", "start": 0.0, "end": 0.3},
        {"word": "tiền", "start": 0.3, "end": 0.6},
        {"word": "chuyển", "start": 0.6, "end": 0.9},
        {"word": "nhầm", "start": 0.9, "end": 1.2},
        {"word": "từ", "start": 1.2, "end": 1.4},
        {"word": "mấy", "start": 1.4, "end": 1.6},
        {"word": "triệu", "start": 1.6, "end": 1.9},
        {"word": "đồng.", "start": 1.9, "end": 2.2},
    ]
    bad = _check_section_completeness(disp, prov, bad_asr)
    assert bad["ok"] is False
    assert any("tail_truncated" in r for r in bad["reasons"])

    good_asr = bad_asr + [
        {"word": "thì", "start": 2.2, "end": 2.4},
        {"word": "đi", "start": 2.4, "end": 2.6},
        {"word": "tù?", "start": 2.6, "end": 2.9},
    ]
    good = _check_section_completeness(disp, prov, good_asr)
    assert good["ok"] is True
