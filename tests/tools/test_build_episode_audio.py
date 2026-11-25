"""Unit tests for tools/audio/build_episode_audio.py."""
from __future__ import annotations

import json
import wave
from pathlib import Path

import numpy as np

from schemas.artifacts import validate_artifact
from tools.audio.build_episode_audio import build_episode_audio
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
    assert (composer / "src" / "demo-ep" / "index.ts").is_file()
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
