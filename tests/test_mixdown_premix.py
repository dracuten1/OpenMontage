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
    assert not (proj / "renders" / "_master_work" / "bgm_ducked.wav").exists()

    profile = json.loads((proj / "mix_profile.json").read_text(encoding="utf-8"))
    assert profile["windows"]["narration"] == [[2.5, 4.5]]
    assert len(profile["windows"]["expected_signal"]) == 2
    assert profile["windows"]["stem_windows"] == {"narration": [0.0, 4.55]}

    verdict = mix_validator.validate(proj / "audio_stems", proj / "mix_profile.json")
    assert verdict["valid"] is True, verdict["errors"]
    assert abs(verdict["loudness"] - (-11.0)) <= 0.4

    # Replacing ducked bgm.wav with an unducked bed MUST fail ducking validation
    unducked = np.column_stack((bgm, bgm))
    _write_wav(proj / "renders" / "audio_stems" / "bgm.wav", np.tile(unducked, (2, 1))[: rate * 5], rate=rate, channels=2)
    bad_verdict = mix_validator.validate(proj / "audio_stems", proj / "mix_profile.json")
    assert bad_verdict["valid"] is False
    assert any("ducking insufficient" in err for err in bad_verdict["errors"])


@pytest.mark.skipif(not shutil.which("ffmpeg"), reason="ffmpeg binary required")
def test_prepare_bgm_bed_trims_quiet_intro_and_normalizes(tmp_path: Path):
    rate = 48000
    quiet_intro = 0.002 * np.sin(2 * np.pi * 110.0 * (np.arange(rate * 16) / rate))
    active_body = 0.35 * np.sin(2 * np.pi * 110.0 * (np.arange(rate * 16) / rate))
    raw_bgm = tmp_path / "filmscore.wav"
    _write_wav(raw_bgm, np.concatenate([quiet_intro, active_body]), rate=rate)

    out_bed = mixdown.prepare_bgm_bed(raw_bgm, 6.0, tmp_path / "work")
    assert out_bed.is_file()
    lufs = mix_validator.integrated_lufs(out_bed)
    assert abs(lufs - (-16.0)) <= 1.5
    samples, sr = mix_validator.read_wav(out_bed)
    assert sr == 48000
    assert float(np.sqrt(np.mean(samples[:sr] ** 2))) > 0.05


def test_collect_sfx_cues_parses_scene_sfx_and_sfx_cues_json(tmp_path: Path):
    ep_dir = tmp_path / "comp"
    sfx_dir = tmp_path / "sfx"
    ep_dir.mkdir(parents=True)
    sfx_dir.mkdir(parents=True)
    (sfx_dir / "click-camera.mp3").write_bytes(b"ID3")
    (sfx_dir / "impact-cine.mp3").write_bytes(b"ID3")

    timing = {
        "fps": 30,
        "total_seconds": 10.0,
        "sections": [
            {"scene_id": "scene-1", "section_id": "s01", "start_seconds": 0.0, "end_seconds": 5.0},
            {"scene_id": "scene-2", "section_id": "s02", "start_seconds": 5.0, "end_seconds": 10.0},
        ],
    }
    (ep_dir / "Episode.tsx").write_text(
        'const SCENE_SFX = {\n'
        '  S01: [{ src: `${BASE}/sfx/click-camera.mp3`, delayFrames: 30, volume: 0.22 }],\n'
        '  S02: [{ src: `${BASE}/sfx/impact-cine.mp3`, delayFrames: 15, volume: 0.24 }],\n'
        '};\n',
        encoding="utf-8",
    )
    cues = mixdown._collect_sfx_cues(ep_dir, timing, sfx_dir)
    assert len(cues) == 2
    assert cues[0][0] == pytest.approx(1.0)
    assert cues[0][1].name == "click-camera.mp3"
    assert cues[1][0] == pytest.approx(5.5)
    assert cues[1][1].name == "impact-cine.mp3"


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

    # 1. Default outro places sting right after final scene end_seconds
    outro_timing = {
        "fps": 30,
        "total_seconds": 123.5,
        "sections": [{"scene_id": "scene-1", "start_seconds": 0.0, "end_seconds": 120.5}],
    }
    (ep_dir / "Episode.tsx").write_text(
        '<Sequence from={CONTENT_FRAMES} durationInFrames={90}><BrandBumper aspect="9x16" /></Sequence>\n',
        encoding="utf-8",
    )
    cues = mixdown._collect_sfx_cues(ep_dir, outro_timing, sfx_dir)
    assert len(cues) == 1
    assert cues[0][0] == pytest.approx(120.5)
    assert cues[0][1].name == "kcdt_bumper_sting.wav"
    assert cues[0][2] == pytest.approx(0.55)

    # 2. Explicit bumper_start_seconds overrides section calculation
    explicit_timing = {**outro_timing, "bumper_start_seconds": 133.622}
    cues_explicit = mixdown._collect_sfx_cues(ep_dir, explicit_timing, sfx_dir)
    assert len(cues_explicit) == 1
    assert cues_explicit[0][0] == pytest.approx(133.622)

    # 3. Explicit intro <Sequence from={0}> places sting at 0.0s
    (ep_dir / "Episode.tsx").write_text(
        '<Sequence from={0} durationInFrames={90}><BrandBumper aspect="9x16" /></Sequence>\n',
        encoding="utf-8",
    )
    cues_intro = mixdown._collect_sfx_cues(ep_dir, outro_timing, sfx_dir)
    assert len(cues_intro) == 1
    assert cues_intro[0][0] == 0.0

    # 4. stingSrc={null} suppresses cue
    (ep_dir / "Episode.tsx").write_text(
        '<Sequence from={CONTENT_FRAMES} durationInFrames={90}><BrandBumper stingSrc={null} /></Sequence>\n',
        encoding="utf-8",
    )
    assert mixdown._collect_sfx_cues(ep_dir, outro_timing, sfx_dir) == []
