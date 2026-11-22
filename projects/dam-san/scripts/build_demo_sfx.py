#!/usr/bin/env python3
"""Generate 20.0s frame-synced procedural SFX + ducked BGM mix for dam-san-ANIM-DEMO."""
from __future__ import annotations

import math
import subprocess
import wave
from pathlib import Path

import numpy as np

OM = Path("/Users/tuyennguyen/project/OpenMontage")
BGM = OM / "remotion-composer" / "public" / "dam-san" / "background_music.mp3"
OUT_DIR = OM / "remotion-composer" / "public" / "dam-san" / "anim_demo"
OUT_WAV = OUT_DIR / "demo_sfx_mix.wav"
SR = 48000
DUR = 20.0


def add_mono(buf: np.ndarray, t0: float, sig: np.ndarray, pan: float = 0.0, gain: float = 1.0) -> None:
    i0 = max(0, int(round(t0 * SR)))
    i1 = min(buf.shape[0], i0 + len(sig))
    if i1 <= i0:
        return
    s = sig[: i1 - i0] * gain
    gl = math.sqrt(0.5 * (1.0 - max(-1.0, min(1.0, pan))))
    gr = math.sqrt(0.5 * (1.0 + max(-1.0, min(1.0, pan))))
    buf[i0:i1, 0] += s * gl
    buf[i0:i1, 1] += s * gr


def synth_thud(dur: float = 0.14, f0: float = 135.0, f1: float = 48.0) -> np.ndarray:
    t = np.linspace(0, dur, int(SR * dur), endpoint=False)
    freq = f0 * np.exp(-t * 14.0) + f1
    phase = 2 * np.pi * np.cumsum(freq) / SR
    env = np.exp(-t * 24.0) * (1.0 - np.exp(-t * 400.0))
    return (np.sin(phase) * env).astype(np.float32)


def synth_whoosh(dur: float = 0.9, peak_hz: float = 700.0, rng: np.random.Generator | None = None) -> np.ndarray:
    r = rng or np.random.default_rng(7)
    n = int(SR * dur)
    t = np.linspace(0, dur, n, endpoint=False)
    noise = r.standard_normal(n).astype(np.float32)
    # Smooth two-pole resonator sweep via FFT block shaping
    spec = np.fft.rfft(noise)
    freqs = np.fft.rfftfreq(n, 1.0 / SR)
    weight = np.exp(-0.5 * ((freqs - peak_hz) / (peak_hz * 0.55)) ** 2)
    shaped = np.fft.irfft(spec * weight, n=n)
    shaped /= max(1e-5, float(np.max(np.abs(shaped))))
    env = np.sin(np.pi * (t / dur)) ** 1.6
    return (shaped * env).astype(np.float32)


def synth_clang(dur: float = 0.95) -> np.ndarray:
    t = np.linspace(0, dur, int(SR * dur), endpoint=False)
    partials = [(620.0, 0.55, 8.5), (1095.0, 0.45, 11.0), (1680.0, 0.35, 14.0), (2490.0, 0.25, 18.0)]
    sig = np.zeros_like(t)
    for f, a, d in partials:
        sig += a * np.sin(2 * np.pi * f * t) * np.exp(-t * d)
    sig += synth_thud(min(dur, 0.12), 240.0, 70.0).tolist() + [0.0] * max(0, len(t) - int(SR * min(dur, 0.12))) if len(t) > int(SR * 0.12) else sig
    sig /= max(1e-5, float(np.max(np.abs(sig))))
    return sig.astype(np.float32)


def synth_chime(dur: float = 1.4) -> np.ndarray:
    t = np.linspace(0, dur, int(SR * dur), endpoint=False)
    sig = (
        0.5 * np.sin(2 * np.pi * 880.0 * t) * np.exp(-t * 2.8)
        + 0.35 * np.sin(2 * np.pi * 1318.5 * t) * np.exp(-t * 3.1)
        + 0.25 * np.sin(2 * np.pi * 1760.0 * t) * np.exp(-t * 3.6)
    )
    attack = 1.0 - np.exp(-t * 40.0)
    return (sig * attack).astype(np.float32)


def synth_gong(dur: float = 2.4) -> np.ndarray:
    t = np.linspace(0, dur, int(SR * dur), endpoint=False)
    partials = [(110.0, 0.70, 1.3), (166.0, 0.50, 1.8), (242.0, 0.35, 2.5), (331.0, 0.22, 3.2), (488.0, 0.12, 4.5)]
    sig = np.zeros_like(t)
    for f, a, d in partials:
        mod = 1.0 + 0.008 * np.sin(2 * np.pi * 3.2 * t)
        sig += a * np.sin(2 * np.pi * f * mod * t) * np.exp(-t * d)
    sig *= 1.0 - np.exp(-t * 60.0)
    sig /= max(1e-5, float(np.max(np.abs(sig))))
    return sig.astype(np.float32)


def synth_trumpet(dur: float = 1.3) -> np.ndarray:
    t = np.linspace(0, dur, int(SR * dur), endpoint=False)
    f = 196.0 * (1.0 + 0.08 * np.exp(-t * 6.0))
    phase = 2 * np.pi * np.cumsum(f) / SR
    raw = 0.6 * np.sin(phase) + 0.3 * np.sin(2 * phase) + 0.15 * np.sin(3 * phase)
    env = np.sin(np.pi * (t / dur)) ** 0.75 * np.exp(-t * 0.6)
    return (raw * env).astype(np.float32)


def main() -> None:
    OUT_DIR.mkdir(parents=True, exist_ok=True)
    rng = np.random.default_rng(42)
    sfx = np.zeros((int(SR * DUR), 2), dtype=np.float32)

    # Scene 1 (0..10s): Longhouse
    for st_t in [0.30, 0.72, 1.14, 1.56, 1.98, 2.42, 2.95, 3.45, 3.95, 4.45]:
        add_mono(sfx, st_t, synth_thud(0.11, 165.0, 62.0), pan=-0.15, gain=0.28)
    add_mono(sfx, 2.25, synth_whoosh(1.35, 520.0, rng), pan=0.10, gain=0.38)  # roof lift
    # Sparse warm hearth ember crackles f=72..230 (3.0..9.6s)
    for pop_t in np.linspace(3.1, 9.5, 16):
        add_mono(sfx, float(pop_t), synth_thud(0.04, 920.0, 220.0), pan=0.18, gain=float(rng.uniform(0.05, 0.11)))
    add_mono(sfx, 6.95, synth_whoosh(0.85, 320.0, rng), pan=0.25, gain=0.30)  # rear bay slide
    add_mono(sfx, 8.28, synth_thud(0.20, 115.0, 44.0), pan=0.25, gain=0.45)  # bay timber settle

    # Scene 2 (10..20s): Clash (frame offset = 10.0 + f/24)
    add_mono(sfx, 10.95, synth_whoosh(0.70, 820.0, rng), pan=-0.35, gain=0.35)  # shield spin 1
    add_mono(sfx, 11.65, synth_whoosh(0.75, 920.0, rng), pan=-0.30, gain=0.38)  # shield spin 2
    add_mono(sfx, 13.08, synth_whoosh(0.85, 680.0, rng), pan=-0.10, gain=0.42)  # leap arc
    add_mono(sfx, 14.25, synth_clang(0.95), pan=0.18, gain=0.72)              # f=102 spear vs iron armor!
    add_mono(sfx, 15.42, synth_chime(1.40), pan=-0.15, gain=0.44)             # f=130 Yang light chime
    add_mono(sfx, 16.38, synth_whoosh(0.65, 1050.0, rng), pan=0.0, gain=0.45) # pestle throw
    add_mono(sfx, 17.17, synth_thud(0.24, 150.0, 42.0), pan=0.22, gain=0.80)  # f=172 armor shatter impact
    add_mono(sfx, 17.18, synth_gong(2.40), pan=-0.05, gain=0.75)              # f=172 bronze hero gong
    add_mono(sfx, 18.15, synth_thud(0.28, 95.0, 38.0), pan=0.25, gain=0.48)   # Mtao Mxay collapse thud
    add_mono(sfx, 18.55, synth_trumpet(1.25), pan=0.32, gain=0.32)            # War elephant victory trumpet

    tmp_sfx = OUT_DIR / "_tmp_sfx.wav"
    clipped = np.clip(sfx, -0.95, 0.95)
    pcm = (clipped * 32767.0).astype(np.int16)
    with wave.open(str(tmp_sfx), "wb") as wf:
        wf.setnchannels(2)
        wf.setsampwidth(2)
        wf.setframerate(SR)
        wf.writeframes(pcm.tobytes())

    # Mix with first 20s of ducked background_music.mp3 and normalize to -14.5 LUFS
    subprocess.run(
        [
            "ffmpeg", "-y",
            "-i", str(tmp_sfx),
            "-t", f"{DUR:.1f}", "-i", str(BGM),
            "-filter_complex",
            "[1:a]aresample=48000,aformat=channel_layouts=stereo,afade=t=in:st=0:d=0.6,afade=t=out:st=18.2:d=1.8,volume=0.14[bgm];"
            "[0:a][bgm]amix=inputs=2:duration=first:normalize=0,loudnorm=I=-14.5:TP=-1.5:LRA=9[out]",
            "-map", "[out]", "-ar", "48000", "-ac", "2", "-c:a", "pcm_s16le",
            str(OUT_WAV),
        ],
        check=True,
    )
    tmp_sfx.unlink(missing_ok=True)
    print(f"PASS demo SFX mix -> {OUT_WAV} ({OUT_WAV.stat().st_size:,} B)")


if __name__ == "__main__":
    main()
