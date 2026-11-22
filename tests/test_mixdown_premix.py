"""Tests for tools/qc/mixdown.py --from-stems lossless pre-mix + mix_validator integration."""

from __future__ import annotations

import json
import shutil
import wave
from pathlib import Path

import numpy as np
import pytest

from tools.qc import mix_validator, mixdown


def _write_wav(path: Path, samples: np.ndarray, rate: int = 48000, channels: int = 1) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    clipped = (np.clip(samples, -1.0, 1.0) * 32767.0).astype("<i2")
    if channels == 2 and clipped.ndim == 1:
        clipped = np.column_stack((clipped, clipped))
    with wave.open(str(path), "wb") as w:
        w.setnchannels(channels)
        w.setsampwidth(2)
        w.setframerate(rate)
        w.writeframes(clipped.tobytes())


@pytest.mark.skipif(not shutil.which("ffmpeg"), reason="ffmpeg binary required")
def test_premix_from_stems_produces_valid_mix_and_passes_validator(tmp_path: Path):
    proj = tmp_path / "proj"
    ep_dir = tmp_path / "comp"
    pub_dir = tmp_path / "public"
    sfx_dir = tmp_path / "sfx"
    proj.mkdir()
    ep_dir.mkdir()
    (ep_dir / "scenes").mkdir()
    pub_dir.mkdir()
    sfx_dir.mkdir()

    rate = 48000
    t1 = np.arange(rate * 2) / rate
    v1 = 0.25 * np.sin(2 * np.pi * 240.0 * t1)
    v2 = 0.22 * np.sin(2 * np.pi * 310.0 * t1)
    _write_wav(pub_dir / "audio" / "voice_s1.wav", v1, rate=rate)
    _write_wav(pub_dir / "audio" / "voice_s2.wav", v2, rate=rate)

    t_bgm = np.arange(rate * 3) / rate
    bgm = 0.35 * np.sin(2 * np.pi * 110.0 * t_bgm)
    _write_wav(pub_dir / "bgm.wav", bgm, rate=rate)

    t_sfx = np.arange(int(rate * 0.25)) / rate
    sfx_tone = 0.4 * np.sin(2 * np.pi * 880.0 * t_sfx) * np.exp(-6.0 * t_sfx)
    _write_wav(sfx_dir / "pop.wav", sfx_tone, rate=rate)

    timing = {
        "version": "1.0",
        "fps": 30,
        "total_seconds": 5.0,
        "total_frames": 150,
        "sections": [
            {
                "scene_id": "scene-1",
                "section_id": "s1",
                "start_seconds": 0.0,
                "start_frame": 0,
                "duration_frames": 75,
            },
            {
                "scene_id": "scene-2",
                "section_id": "s2",
                "start_seconds": 2.5,
                "start_frame": 75,
                "duration_frames": 75,
            },
        ],
    }
    (proj / "assets").mkdir(parents=True)
    (proj / "assets" / "scene_timing.json").write_text(json.dumps(timing), encoding="utf-8")

    (ep_dir / "Episode.tsx").write_text(
        'const BLOCK_SFX = {\n  1: "pop.wav",\n};\n',
        encoding="utf-8",
    )
    (ep_dir / "scenes" / "S02.tsx").write_text(
        '<Sequence from={15}><Audio volume={0.35} src={staticFile("sfx/pop.wav")} /></Sequence>\n',
        encoding="utf-8",
    )

    summary = mixdown.premix_from_stems(
        proj,
        episode_dir=ep_dir,
        public_dir=pub_dir,
        sfx_dir=sfx_dir,
        bgm=pub_dir / "bgm.wav",
    )

    assert summary["operation"] == "premix_from_stems"
    assert summary["cues"] == 2
    assert Path(summary["mix_master"]).is_file()
    assert not (proj / "renders" / "_master_work" / "mix_base.wav").exists()
    assert not (proj / "renders" / "_master_work" / "mix_bgm.wav").exists()

    verdict = mix_validator.validate(ep_dir / "audio_stems", ep_dir / "mix_profile.json")
    assert verdict["valid"] is True, verdict["errors"]
    assert abs(verdict["loudness"] - (-11.0)) <= 0.4


def test_premix_missing_voice_stem_raises_input_error(tmp_path: Path):
    proj = tmp_path / "proj"
    (proj / "assets").mkdir(parents=True)
    (tmp_path / "bgm.wav").write_bytes(b"RIFF")
    timing = {
        "fps": 30,
        "total_seconds": 2.0,
        "sections": [{"scene_id": "scene-1", "section_id": "s1", "start_seconds": 0.0, "start_frame": 0, "duration_frames": 60}],
    }
    (proj / "assets" / "scene_timing.json").write_text(json.dumps(timing), encoding="utf-8")
    with pytest.raises(mixdown.InputError, match="voice stem missing"):
        mixdown.premix_from_stems(
            proj,
            episode_dir=tmp_path / "comp",
            public_dir=tmp_path / "pub",
            bgm=tmp_path / "bgm.wav",
        )


def test_collect_sfx_cues_detects_brand_bumper_sting(tmp_path: Path):
    ep_dir = tmp_path / "comp"
    sfx_dir = tmp_path / "sfx"
    ep_dir.mkdir(parents=True)
    sfx_dir.mkdir(parents=True)
    timing = {"fps": 30, "sections": []}

    (ep_dir / "Episode.tsx").write_text(
        '<Sequence from={0} durationInFrames={90}><BrandBumper aspect="9x16" /></Sequence>\n',
        encoding="utf-8",
    )
    cues = mixdown._collect_sfx_cues(ep_dir, timing, sfx_dir)
    assert len(cues) == 1
    assert cues[0][0] == 0.0
    assert cues[0][1].name == "kcdt_bumper_sting.wav"
    assert cues[0][2] == pytest.approx(0.55)

    (ep_dir / "Episode.tsx").write_text(
        '<Sequence from={0} durationInFrames={90}><BrandBumper stingSrc={null} /></Sequence>\n',
        encoding="utf-8",
    )
    assert mixdown._collect_sfx_cues(ep_dir, timing, sfx_dir) == []
