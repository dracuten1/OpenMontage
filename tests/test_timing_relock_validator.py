"""Tests for Timing Re-lock Validator and Checkpoint Timing Gate."""

from __future__ import annotations

import json
from pathlib import Path
from typing import Any

import pytest

from lib.checkpoint import CheckpointValidationError, init_project, write_checkpoint
from lib.timing_validator import (
    CUT_BOUNDARY_TOLERANCE_SECONDS,
    WORD_ALIGNMENT_TOLERANCE_SECONDS,
    FULL_AUDIO_TOLERANCE_SECONDS,
    validate_edit_timing_against_audio,
)
from tools.audio.refresh_manifest import probe_audio_duration, refresh_asset_manifest


def _write_real_wav_file(path: Path, duration_seconds: float, rate: int = 16000) -> float:
    """Write a real, probe-able mono 16-bit WAV of the given duration; returns duration."""
    import wave
    frames = int(round(duration_seconds * rate))
    with wave.open(str(path), "wb") as w:
        w.setnchannels(1)
        w.setsampwidth(2)
        w.setframerate(rate)
        w.writeframes(b"\x00\x00" * frames)
    return frames / rate


def _create_sample_project(
    tmp_path: Path,
    project_id: str = "test-proj",
    *,
    cut_durations: list[float] | None = None,
    audio_durations: list[float] | None = None,
    narration_words: Any = None,
    with_full_wav: bool = False,
    pause_gap: float = 0.0,
) -> tuple[Path, dict[str, Any], dict[str, Any]]:
    """Helper to set up a mock project directory with edit_decisions and asset_manifest."""
    if cut_durations is None:
        cut_durations = [5.0, 6.0, 7.0]
    if audio_durations is None:
        audio_durations = [5.0, 6.0, 7.0]

    proj_dir = tmp_path / project_id
    art_dir = proj_dir / "artifacts"
    audio_dir = proj_dir / "assets" / "audio"
    art_dir.mkdir(parents=True, exist_ok=True)
    audio_dir.mkdir(parents=True, exist_ok=True)

    # Build cuts
    cuts = []
    current_time = 0.0
    for idx, c_dur in enumerate(cut_durations, start=1):
        in_s = round(current_time, 3)
        out_s = round(current_time + c_dur, 3)
        cuts.append({
            "id": f"cut-{idx}",
            "source": f"assets/audio/voice_s{idx}.wav",
            "in_seconds": in_s,
            "out_seconds": out_s,
            "layer": "primary",
        })
        current_time = out_s + pause_gap

    edit_decisions = {
        "version": "1.0",
        "render_runtime": "remotion",
        "cuts": cuts,
    }

    # Build asset manifest
    assets = []
    for idx, a_dur in enumerate(audio_durations, start=1):
        wav_file = audio_dir / f"voice_s{idx}.wav"
        # Real probe-able WAV matching the manifest duration — the validator's
        # manifest-vs-file staleness check probes these files directly.
        _write_real_wav_file(wav_file, a_dur)
        assets.append({
            "id": f"voice-s{idx}",
            "type": "narration",
            "scene_id": f"scene-{idx}",
            "path": f"assets/audio/voice_s{idx}.wav",
            "duration_seconds": a_dur,
        })

    manifest = {
        "version": "1.0",
        "assets": assets,
        "metadata": {
            "total_audio_speech_duration_seconds": sum(audio_durations),
        },
    }

    (art_dir / "edit_decisions.json").write_text(json.dumps(edit_decisions), encoding="utf-8")
    (art_dir / "asset_manifest.json").write_text(json.dumps(manifest), encoding="utf-8")

    if narration_words is not None:
        (art_dir / "narration_words.json").write_text(json.dumps(narration_words), encoding="utf-8")

    return proj_dir, edit_decisions, manifest


class TestTimingValidator:
    """Core validator unit tests covering all required cases: (a)-(f)."""

    def test_matching_case(self, tmp_path: Path):
        """(a) Matching case: cut boundaries and measured audio durations match perfectly."""
        proj_dir, edit_decisions, manifest = _create_sample_project(
            tmp_path,
            cut_durations=[8.0, 10.5, 9.2],
            audio_durations=[8.0, 10.5, 9.2],
        )
        res = validate_edit_timing_against_audio(edit_decisions, proj_dir, asset_manifest=manifest)
        assert res.valid is True
        assert len(res.errors) == 0

    def test_stale_manifest_case(self, tmp_path: Path):
        """(b) Stale manifest case: manifest has stale planned durations while cuts or audio diverged."""
        # e.g., cuts are locked to planned round integers 11.0s, but audio ran measured 8.24s
        proj_dir, edit_decisions, manifest = _create_sample_project(
            tmp_path,
            cut_durations=[11.0, 12.0],
            audio_durations=[8.24, 10.32],
        )
        res = validate_edit_timing_against_audio(edit_decisions, proj_dir, asset_manifest=manifest)
        assert res.valid is False
        assert len(res.errors) == 2
        # Error names scene index, cut id, expected vs actual boundary, and source of truth
        assert "Scene 1 (cut-1)" in res.errors[0]
        assert "11.000s" in res.errors[0]
        assert "8.240s" in res.errors[0]
        assert "manifest asset voice-s1" in res.errors[0]

    def test_tolerance_edges(self, tmp_path: Path):
        """(c) Tolerance edges: within CUT_BOUNDARY_TOLERANCE_SECONDS passes; beyond fails."""
        tol = CUT_BOUNDARY_TOLERANCE_SECONDS
        # Exact tolerance edge: +0.25s (pass)
        proj_dir_pass, ed_pass, man_pass = _create_sample_project(
            tmp_path,
            project_id="edge-pass",
            cut_durations=[10.0 + (tol - 0.05), 10.0],
            audio_durations=[10.0, 10.0],
        )
        res_pass = validate_edit_timing_against_audio(ed_pass, proj_dir_pass, asset_manifest=man_pass)
        assert res_pass.valid is True

        # Beyond tolerance: +0.45s on intermediate cut (fail)
        proj_dir_fail, ed_fail, man_fail = _create_sample_project(
            tmp_path,
            project_id="edge-fail",
            cut_durations=[10.0 + (tol + 0.15), 10.0],
            audio_durations=[10.0, 10.0],
        )
        res_fail = validate_edit_timing_against_audio(ed_fail, proj_dir_fail, asset_manifest=man_fail)
        assert res_fail.valid is False
        assert any("exceeds measured audio" in e for e in res_fail.errors)

    def test_last_cut_tail_padding_allowed(self, tmp_path: Path):
        """Honors declared tail padding on the final cut (up to 1.0s)."""
        proj_dir, edit_decisions, manifest = _create_sample_project(
            tmp_path,
            cut_durations=[10.0, 12.0 + 0.44],  # Last cut has 0.44s tail padding
            audio_durations=[10.0, 12.0],
        )
        res = validate_edit_timing_against_audio(edit_decisions, proj_dir, asset_manifest=manifest)
        assert res.valid is True
        assert len(res.errors) == 0

    def test_missing_artifact_graceful_degradation(self, tmp_path: Path):
        """(d) Missing-artifact case: graceful degradation to explicit WARNING when artifacts absent."""
        proj_dir = tmp_path / "empty-proj"
        proj_dir.mkdir(parents=True, exist_ok=True)
        ed = {
            "version": "1.0",
            "render_runtime": "remotion",
            "cuts": [{"id": "cut-1", "source": "test.png", "in_seconds": 0.0, "out_seconds": 5.0}],
        }
        # asset_manifest.json does not exist
        res = validate_edit_timing_against_audio(ed, proj_dir)
        assert res.valid is True
        assert len(res.warnings) > 0
        assert any("does not exist yet" in w for w in res.warnings)

    def test_pause_convention_case(self, tmp_path: Path):
        """(e) Pause-convention case: runs with inter-scene pauses (e.g. 0.65s silence)."""
        proj_dir, edit_decisions, manifest = _create_sample_project(
            tmp_path,
            cut_durations=[6.553, 13.338, 8.223],
            audio_durations=[6.553, 13.338, 8.223],
            pause_gap=0.65,  # Non-contiguous cut in_seconds
        )
        res = validate_edit_timing_against_audio(edit_decisions, proj_dir, asset_manifest=manifest)
        assert res.valid is True
        assert len(res.errors) == 0

    def test_word_alignment_enhanced_case(self, tmp_path: Path):
        """(f) Word-alignment enhanced case: verifies cut-in lands within tolerance of first spoken word."""
        # Case f1: Word alignment matches cut-in
        words_matching = [
            {"word": "Hello", "scene_id": "cut-1", "global_start": 0.05, "global_end": 0.3},
            {"word": "World", "scene_id": "cut-2", "global_start": 5.08, "global_end": 5.4},
        ]
        proj_dir_ok, ed_ok, man_ok = _create_sample_project(
            tmp_path,
            project_id="words-ok",
            cut_durations=[5.0, 5.0],
            audio_durations=[5.0, 5.0],
            narration_words=words_matching,
        )
        res_ok = validate_edit_timing_against_audio(ed_ok, proj_dir_ok, asset_manifest=man_ok)
        assert res_ok.valid is True
        assert any("Word-alignment artifact detected" in i for i in res_ok.info)

        # Case f2: Word alignment desynced (cut-in at 5.0s, but speech starts at 6.0s -> delta 1.0s > 0.4s)
        words_desynced = [
            {"word": "Hello", "scene_id": "cut-1", "global_start": 0.05, "global_end": 0.3},
            {"word": "World", "scene_id": "cut-2", "global_start": 6.00, "global_end": 6.4},
        ]
        proj_dir_bad, ed_bad, man_bad = _create_sample_project(
            tmp_path,
            project_id="words-bad",
            cut_durations=[5.0, 5.0],
            audio_durations=[5.0, 5.0],
            narration_words=words_desynced,
        )
        res_bad = validate_edit_timing_against_audio(ed_bad, proj_dir_bad, asset_manifest=man_bad)
        assert res_bad.valid is False
        assert any("first spoken word timestamp" in e for e in res_bad.errors)
        assert any("word alignment narration_words.json" in e for e in res_bad.errors)

    def test_cut_narration_count_mismatch_warning(self, tmp_path: Path):
        """Count mismatch between cuts and narration assets emits warning and does not hard fail."""
        # 3 cuts vs 2 narration assets
        proj_dir, edit_decisions, manifest = _create_sample_project(
            tmp_path,
            project_id="mismatch-counts",
            cut_durations=[4.0, 4.0, 4.0],
            audio_durations=[6.0, 6.0],
        )
        res = validate_edit_timing_against_audio(edit_decisions, proj_dir, asset_manifest=manifest)
        # Validation does NOT raise and valid is True (no hard errors when total audio matches or no narration_full.wav)
        assert res.valid is True
        assert len(res.errors) == 0
        assert len(res.warnings) == 1
        warn_msg = res.warnings[0]
        assert "Cut count (3) does not match narration asset count (2)" in warn_msg
        assert "asset_manifest.json" in warn_msg
        assert "Per-cut boundary check was SKIPPED" in warn_msg
        assert "only the full-audio total check applies" in warn_msg

    @staticmethod
    def _write_real_wav(path: Path, duration_seconds: float) -> float:
        """Write a real (probe-able) mono 16-bit 16 kHz WAV; returns its duration."""
        import wave
        rate = 16000
        frames = int(round(duration_seconds * rate))
        with wave.open(str(path), "wb") as w:
            w.setnchannels(1)
            w.setsampwidth(2)
            w.setframerate(rate)
            w.writeframes(b"\x00\x00" * frames)
        return frames / rate

    def test_full_wav_total_mismatch_fails_beyond_full_audio_tolerance(self, tmp_path: Path):
        """(±1.00s branch) Total edit duration vs probed narration_full.wav.

        Per-cut boundaries match the manifest; the mismatch is introduced only in
        narration_full.wav, so the error must come from the FULL_AUDIO_TOLERANCE_SECONDS
        branch naming narration_full.wav as source of truth.
        """
        # Matching per-cut setup: 2 cuts x 10.0s -> edit total 20.0s
        proj_dir, edit_decisions, manifest = _create_sample_project(
            tmp_path,
            project_id="full-wav-mismatch",
            cut_durations=[10.0, 10.0],
            audio_durations=[10.0, 10.0],
        )
        full_wav_path = proj_dir / "assets" / "audio" / "narration_full.wav"
        edit_total = sum(c["out_seconds"] - c["in_seconds"] for c in edit_decisions["cuts"])

        # Surplus: full audio SHORTER than edit total by more than the ±1.00s tail allowance
        surplus_gap = FULL_AUDIO_TOLERANCE_SECONDS + 0.5
        wav_dur_short = self._write_real_wav(full_wav_path, edit_total - surplus_gap)
        assert abs(wav_dur_short - (edit_total - surplus_gap)) < 0.05

        res_short = validate_edit_timing_against_audio(edit_decisions, proj_dir, asset_manifest=manifest)
        assert res_short.valid is False
        # edit total > audio -> the "exceeds" direction of the narration_full.wav check
        assert any(
            "narration_full.wav" in e and "Total edit duration" in e and "exceeds" in e
            for e in res_short.errors
        )
        # Failure gap exceeds the tolerance that governs this branch
        assert surplus_gap > FULL_AUDIO_TOLERANCE_SECONDS

        # Shortfall: full audio LONGER than edit total by more than the boundary tolerance.
        # edit (20.0) < audio (~22.8) -> the error must be the "shorter than actual full
        # audio" direction of the narration_full.wav check.
        shortfall_gap = CUT_BOUNDARY_TOLERANCE_SECONDS + 0.5
        wav_dur_long = self._write_real_wav(full_wav_path, edit_total + shortfall_gap)
        assert abs(wav_dur_long - (edit_total + shortfall_gap)) < 0.05

        res_long = validate_edit_timing_against_audio(edit_decisions, proj_dir, asset_manifest=manifest)
        assert res_long.valid is False
        assert any(
            "narration_full.wav" in e and "Total edit duration" in e and "shorter than" in e
            for e in res_long.errors
        )
        assert shortfall_gap > CUT_BOUNDARY_TOLERANCE_SECONDS

    def test_full_wav_tail_padding_within_tolerance_passes(self, tmp_path: Path):
        """(±1.00s branch, pass side) Edit total exceeding full audio by a legitimate
        tail pad (0.44s < FULL_AUDIO_TOLERANCE_SECONDS) stays valid."""
        proj_dir, edit_decisions, manifest = _create_sample_project(
            tmp_path,
            project_id="full-wav-tail-ok",
            cut_durations=[10.0, 10.44],  # last cut carries the 0.44s tail pad
            audio_durations=[10.0, 10.0],
        )
        full_wav_path = proj_dir / "assets" / "audio" / "narration_full.wav"
        edit_total = sum(c["out_seconds"] - c["in_seconds"] for c in edit_decisions["cuts"])
        # Full audio shorter than edit total by exactly the tail pad — within tolerance.
        self._write_real_wav(full_wav_path, edit_total - 0.44)
        assert 0.44 < FULL_AUDIO_TOLERANCE_SECONDS

        res = validate_edit_timing_against_audio(edit_decisions, proj_dir, asset_manifest=manifest)
        assert res.valid is True
        assert len(res.errors) == 0

    # ------------------------------------------------------------------
    # Fix A — manifest-vs-file staleness (probe per-scene audio directly)
    # ------------------------------------------------------------------

    def test_perturbed_scene_wav_with_stale_manifest_hard_fails(self, tmp_path: Path):
        """(Fix A, tester evasion scenario) Scene WAV re-synthesized +1.5s while the
        manifest stays stale: cuts↔manifest↔(no)full-wav all agree and would pass —
        the direct file probe must HARD-FAIL naming the asset and the fix."""
        proj_dir, edit_decisions, manifest = _create_sample_project(
            tmp_path,
            project_id="perturbed-scene",
            cut_durations=[10.0, 10.0],
            audio_durations=[10.0, 10.0],
        )
        # Perturb scene 2's actual audio +1.5s (the d-011 single-scene re-TTS shape).
        self._write_real_wav(proj_dir / "assets" / "audio" / "voice_s2.wav", 11.5)

        res = validate_edit_timing_against_audio(edit_decisions, proj_dir, asset_manifest=manifest)
        assert res.valid is False
        stale_errors = [e for e in res.errors if "manifest is stale" in e]
        assert stale_errors, f"expected staleness error, got: {res.errors}"
        err = stale_errors[0]
        assert "voice-s2" in err                                  # asset id
        assert "says 10.000s" in err and "probes 11.500s" in err  # manifest vs file
        assert "refresh_manifest" in err                          # actionable fix
        assert "ffprobe/wave probe on assets/audio/voice_s2.wav" in err  # source of truth

    def test_missing_scene_file_falls_back_with_warning(self, tmp_path: Path):
        """(Fix A, graceful) Manifest path that does not exist on disk → explicit
        warning + fallback to manifest duration; cuts matching the manifest stay valid."""
        proj_dir, edit_decisions, manifest = _create_sample_project(
            tmp_path,
            project_id="missing-file",
            cut_durations=[10.0, 10.0],
            audio_durations=[10.0, 10.0],
        )
        # Remove scene 2's file so the manifest names something unprobeable.
        (proj_dir / "assets" / "audio" / "voice_s2.wav").unlink()

        res = validate_edit_timing_against_audio(edit_decisions, proj_dir, asset_manifest=manifest)
        assert res.valid is True
        assert len(res.errors) == 0
        assert any("voice-s2" in w and "does not exist on disk" in w for w in res.warnings)
        assert any("falling back to manifest duration" in w for w in res.warnings)

    def test_clean_run_probes_pass_without_staleness_warnings(self, tmp_path: Path):
        """(Fix A, no false positives) Files matching the manifest → no staleness
        errors AND no staleness warnings."""
        proj_dir, edit_decisions, manifest = _create_sample_project(
            tmp_path,
            project_id="clean-probe",
            cut_durations=[9.28, 12.94],
            audio_durations=[9.28, 12.94],
        )
        res = validate_edit_timing_against_audio(edit_decisions, proj_dir, asset_manifest=manifest)
        assert res.valid is True
        assert len(res.errors) == 0
        assert not any("manifest is stale" in w for w in res.warnings)
        assert not any("falling back to manifest duration" in w for w in res.warnings)

    # ------------------------------------------------------------------
    # Fix B — fail-safe word-alignment check
    # ------------------------------------------------------------------

    def test_section_dict_global_timestamps_no_double_count(self, tmp_path: Path):
        """(Fix B, bach counterfactual) Section-dict shape whose word 'start' values are
        ALREADY global-timeline (per the build_transcripts.py series convention) must not
        be re-offset by the entry's global_start — zero bogus errors on aligned cuts."""
        # 3 sections, real bach-style shape; word starts are cumulative GLOBAL seconds.
        words = {
            "s01": {"duration_seconds": 9.0, "global_start": 0.0, "global_end": 9.0,
                    "pause_after": 0.8,
                    "words": [{"word": "Ngày", "start": 0.0, "end": 0.22,
                               "local_start": 0.0, "local_end": 0.22, "probability": 0.92}]},
            "s02": {"duration_seconds": 8.0, "global_start": 9.8, "global_end": 17.8,
                    "pause_after": 0.8,
                    "words": [{"word": "Xưa", "start": 9.8, "end": 10.0,
                               "local_start": 0.0, "local_end": 0.2, "probability": 0.94}]},
            "s03": {"duration_seconds": 7.0, "global_start": 18.6, "global_end": 25.6,
                    "pause_after": 0.0,
                    "words": [{"word": "Có", "start": 18.6, "end": 18.9,
                               "local_start": 0.0, "local_end": 0.3, "probability": 0.9}]},
        }
        # Pause-inclusive cut spans: cut-ins at 0.0 / 10.0 / 18.8 (0.8s inter-section pauses).
        proj_dir, edit_decisions, manifest = _create_sample_project(
            tmp_path,
            project_id="bach-shape",
            cut_durations=[10.0, 8.8, 7.0],
            audio_durations=[9.0, 8.0, 7.0],
            narration_words=words,
        )
        res = validate_edit_timing_against_audio(edit_decisions, proj_dir, asset_manifest=manifest)
        word_errors = [e for e in res.errors if "narration_words.json" in e]
        assert word_errors == [], (
            "double-count regression: word starts already global were re-offset "
            f"by section offsets: {word_errors}"
        )

    def test_aivn_flat_shape_real_ids_match(self, tmp_path: Path):
        """(Fix B / mock-fidelity MISMATCH) Real aivn flat shape: words carry
        scene_id 'scene_01' while cuts are 'cut-s01' — the enhanced check must
        actually MATCH (not silently no-op) via the documented token rule."""
        words = [
            {"word": "Một", "scene_id": "scene_01", "script_section_id": "s01",
             "global_start": 0.0, "global_end": 0.24},
            {"word": "Hai", "scene_id": "scene_02", "script_section_id": "s02",
             "global_start": 8.74, "global_end": 8.94},
        ]
        proj_dir, edit_decisions, manifest = _create_sample_project(
            tmp_path,
            project_id="aivn-flat",
            cut_durations=[8.74, 8.5],
            audio_durations=[8.74, 8.5],
            narration_words=words,
        )
        # Real aivn cut-id convention (helper emits 'cut-1'/'cut-2').
        edit_decisions["cuts"][0]["id"] = "cut-s01"
        edit_decisions["cuts"][1]["id"] = "cut-s02"
        res = validate_edit_timing_against_audio(edit_decisions, proj_dir, asset_manifest=manifest)
        assert res.valid is True
        # The check RAN (no unmapped skip-warnings for these two cuts).
        assert not any("word-alignment mapping failed" in w for w in res.warnings)

        # Desync the second cut-in by 1.0s → real hard error naming word alignment.
        edit_decisions["cuts"][1]["in_seconds"] = 9.74
        edit_decisions["cuts"][1]["out_seconds"] = 18.24
        res_bad = validate_edit_timing_against_audio(edit_decisions, proj_dir, asset_manifest=manifest)
        assert res_bad.valid is False
        word_errors = [e for e in res_bad.errors
                       if "cut-s02" in e and "first spoken word timestamp" in e
                       and "narration_words.json" in e]
        assert word_errors, f"expected aivn word-alignment error, got: {res_bad.errors}"

    def test_gh6_top_level_words_shape_skips_with_warning(self, tmp_path: Path):
        """(Fix B, gh6 shape) Top-level words dict with no per-scene attribution →
        whole word-alignment check SKIPPED with an explicit warning, never an error."""
        words = {
            "version": "1.0", "project_id": "x", "total_duration_seconds": 12.0,
            "words": [{"text": "Phô", "global_start": 0.0, "global_end": 0.14,
                       "probability": 0.3}],
        }
        proj_dir, edit_decisions, manifest = _create_sample_project(
            tmp_path,
            project_id="gh6-shape",
            cut_durations=[6.0, 6.0],
            audio_durations=[6.0, 6.0],
            narration_words=words,
        )
        res = validate_edit_timing_against_audio(edit_decisions, proj_dir, asset_manifest=manifest)
        assert res.valid is True
        assert len(res.errors) == 0
        assert any("SKIPPED" in w and "narration_words.json" in w for w in res.warnings)

    def test_unmappable_cut_skips_with_warning_not_error(self, tmp_path: Path):
        """(Fix B, mapping failure) A cut whose id matches no section is skipped with a
        warning — mapping failure must never manufacture a hard error."""
        words = {
            "s01": {"global_start": 0.0, "words": [
                {"word": "A", "start": 0.0, "end": 0.2, "local_start": 0.0, "local_end": 0.2}]},
        }
        proj_dir, edit_decisions, manifest = _create_sample_project(
            tmp_path,
            project_id="unmapped-cut",
            cut_durations=[5.0],
            audio_durations=[5.0],
            narration_words=words,
        )
        edit_decisions["cuts"][0]["id"] = "cut-x99"  # matches no section key
        res = validate_edit_timing_against_audio(edit_decisions, proj_dir, asset_manifest=manifest)
        assert res.valid is True
        assert len(res.errors) == 0
        assert any("cut-x99" in w and "SKIPPED" in w for w in res.warnings)


class TestCheckpointGateIntegration:
    """Test stage gate integration in lib/checkpoint.py."""

    def test_edit_stage_hard_fail_on_desync(self, tmp_path: Path):
        """Edit stage gate raises CheckpointValidationError on timing desync."""
        from tests.contracts.test_phase0_contracts import sample_artifact

        init_project("run-gate", title="Run Gate", pipeline_type="animated-explainer", pipeline_dir=tmp_path)
        proj_dir = tmp_path / "run-gate"
        art_dir = proj_dir / "artifacts"
        art_dir.mkdir(parents=True, exist_ok=True)

        # Write preceding completed checkpoints so prerequisites pass
        predecessors = [
            ("research", "research_brief"),
            ("proposal", "proposal_packet"),
            ("script", "script"),
            ("scene_plan", "scene_plan"),
            ("assets", "asset_manifest"),
        ]
        for st, art_name in predecessors:
            (proj_dir / f"checkpoint_{st}.json").write_text(
                json.dumps({
                    "version": "1.0",
                    "project_id": "run-gate",
                    "pipeline_type": "animated-explainer",
                    "stage": st,
                    "status": "completed",
                    "timestamp": "2026-10-08T00:00:00Z",
                    "human_approval_required": True,
                    "human_approved": True,
                    "artifacts": {art_name: sample_artifact(art_name)},
                }),
                encoding="utf-8",
            )

        # Stale manifest: audio is 7.0s but cut is 10.0s
        manifest = {
            "version": "1.0",
            "assets": [
                {
                    "id": "narr-1",
                    "type": "narration",
                    "scene_id": "scene-1",
                    "path": "assets/audio/scene_1.wav",
                    "duration_seconds": 7.0,
                }
            ],
        }
        (art_dir / "asset_manifest.json").write_text(json.dumps(manifest), encoding="utf-8")

        desynced_ed = {
            "version": "1.0",
            "render_runtime": "remotion",
            "cuts": [
                {
                    "id": "cut-1",
                    "source": "assets/audio/scene_1.wav",
                    "in_seconds": 0.0,
                    "out_seconds": 10.0,
                    "layer": "primary",
                }
            ],
        }

        with pytest.raises(CheckpointValidationError, match="TIMING RE-LOCK VALIDATION FAILED"):
            write_checkpoint(
                tmp_path,
                "run-gate",
                "edit",
                "completed",
                {"edit_decisions": desynced_ed},
                pipeline_type="animated-explainer",
                human_approved=True,
            )

    def test_script_stage_soft_cap_warning(self, tmp_path: Path, caplog):
        """Script stage with section > 25s logs a soft cap warning without blocking checkpoint."""
        from tests.contracts.test_phase0_contracts import sample_artifact

        init_project("run-script", title="Run Script", pipeline_type="animated-explainer", pipeline_dir=tmp_path)
        proj_dir = tmp_path / "run-script"

        # Predecessors
        predecessors = [
            ("research", "research_brief"),
            ("proposal", "proposal_packet"),
        ]
        for st, art_name in predecessors:
            (proj_dir / f"checkpoint_{st}.json").write_text(
                json.dumps({
                    "version": "1.0",
                    "project_id": "run-script",
                    "pipeline_type": "animated-explainer",
                    "stage": st,
                    "status": "completed",
                    "timestamp": "2026-10-08T00:00:00Z",
                    "human_approval_required": True,
                    "human_approved": True,
                    "artifacts": {art_name: sample_artifact(art_name)},
                }),
                encoding="utf-8",
            )

        long_script = {
            "version": "1.0",
            "title": "Long Script",
            "total_duration_seconds": 40.0,
            "sections": [
                {
                    "id": "s1",
                    "text": "Long narrative section that exceeds 25 seconds duration threshold.",
                    "start_seconds": 0.0,
                    "end_seconds": 35.0,  # 35s > 25s soft cap
                }
            ],
        }

        # Should write successfully (no raise), but log a warning
        with caplog.at_level("WARNING"):
            cp_path = write_checkpoint(
                tmp_path,
                "run-script",
                "script",
                "completed",
                {"script": long_script},
                pipeline_type="animated-explainer",
                human_approved=True,
            )
        assert cp_path.exists()
        assert "exceeds soft cap" in caplog.text

        # Soft-cap warnings must reach the persisted record's metadata — same
        # surface as the edit gate (metadata.timing_validation_warnings).
        record = json.loads(cp_path.read_text(encoding="utf-8"))
        attached = record["metadata"]["timing_validation_warnings"]
        assert isinstance(attached, list) and attached
        assert any("exceeds soft cap" in w for w in attached)


class TestRefreshManifestHelper:
    """Tests for tools/audio/refresh_manifest.py."""

    def test_refresh_manifest_probes_and_updates(self, tmp_path: Path):
        """Helper re-probes audio files and updates duration_seconds and metadata totals."""
        import wave
        proj_dir = tmp_path / "refresh-proj"
        art_dir = proj_dir / "artifacts"
        audio_dir = proj_dir / "assets" / "audio"
        art_dir.mkdir(parents=True, exist_ok=True)
        audio_dir.mkdir(parents=True, exist_ok=True)

        # Generate a real 1.5s WAV file
        wav_path = audio_dir / "scene_1.wav"
        with wave.open(str(wav_path), "wb") as w:
            w.setnchannels(1)
            w.setsampwidth(2)
            w.setframerate(16000)
            # 1.5s = 24000 frames
            w.writeframes(b"\x00\x00" * 24000)

        # Verify probe_audio_duration on the generated wav
        probed = probe_audio_duration(wav_path)
        assert probed is not None
        assert abs(probed - 1.5) < 0.01

        # Manifest with stale duration (e.g. 5.0s)
        manifest_path = art_dir / "asset_manifest.json"
        manifest_data = {
            "version": "1.0",
            "assets": [
                {
                    "id": "audio-s1",
                    "type": "narration",
                    "scene_id": "scene-1",
                    "path": "assets/audio/scene_1.wav",
                    "duration_seconds": 5.0,
                }
            ],
            "metadata": {
                "total_audio_speech_duration_seconds": 5.0,
            },
        }
        manifest_path.write_text(json.dumps(manifest_data), encoding="utf-8")

        # Run refresh
        res = refresh_asset_manifest(manifest_path, project_dir=proj_dir)
        assert res["updated_count"] == 1
        assert abs(res["total_speech_duration"] - 1.5) < 0.01

        # Read back updated manifest
        updated = json.loads(manifest_path.read_text(encoding="utf-8"))
        assert abs(updated["assets"][0]["duration_seconds"] - 1.5) < 0.01
        assert abs(updated["metadata"]["total_audio_speech_duration_seconds"] - 1.5) < 0.01

    def test_atomic_write_preserves_original_on_interruption(self, tmp_path: Path, monkeypatch):
        """(a) Atomic write: a crash mid-write leaves the ORIGINAL manifest intact.

        Simulates the fail-open chain this fix closes: crash between temp-file
        write and the rename. With a non-atomic direct write this truncated the
        manifest (missing durations -> silent degradation -> valid=True); with
        os.replace the original file is untouched.
        """
        import wave

        proj_dir = tmp_path / "atomic-proj"
        art_dir = proj_dir / "artifacts"
        audio_dir = proj_dir / "assets" / "audio"
        art_dir.mkdir(parents=True, exist_ok=True)
        audio_dir.mkdir(parents=True, exist_ok=True)

        wav_path = audio_dir / "scene_1.wav"
        with wave.open(str(wav_path), "wb") as w:
            w.setnchannels(1)
            w.setsampwidth(2)
            w.setframerate(16000)
            w.writeframes(b"\x00\x00" * 16000)  # 1.0s

        manifest_path = art_dir / "asset_manifest.json"
        original_data = {
            "version": "1.0",
            "assets": [
                {
                    "id": "audio-s1",
                    "type": "narration",
                    "scene_id": "scene-1",
                    "path": "assets/audio/scene_1.wav",
                    "duration_seconds": 99.0,  # stale on purpose
                }
            ],
            "metadata": {"total_audio_speech_duration_seconds": 99.0},
        }
        original_text = json.dumps(original_data, indent=2)
        manifest_path.write_text(original_text, encoding="utf-8")

        def _boom(*args, **kwargs):
            raise OSError("simulated crash mid-write (between temp write and replace)")

        monkeypatch.setattr("os.replace", _boom)

        with pytest.raises(OSError, match="simulated crash mid-write"):
            refresh_asset_manifest(manifest_path, project_dir=proj_dir)

        # The ORIGINAL manifest content is intact — no truncation, no partial write.
        assert manifest_path.read_text(encoding="utf-8") == original_text
        reloaded = json.loads(manifest_path.read_text(encoding="utf-8"))
        assert reloaded["assets"][0]["duration_seconds"] == 99.0

        # No partial temp file left behind by the failed refresh.
        assert not (art_dir / "asset_manifest.json.tmp").exists()

    def test_gate_surfaces_degradation_warnings_in_metadata_and_log(
        self, tmp_path: Path, caplog
    ):
        """(b) Gate warnings: degradation (missing asset_manifest.json) is logged AND
        attached to checkpoint metadata — no longer silently discarded."""
        import logging

        from tests.contracts.test_phase0_contracts import sample_artifact

        init_project("run-warn", title="Run Warn", pipeline_type="animated-explainer", pipeline_dir=tmp_path)
        proj_dir = tmp_path / "run-warn"

        # Predecessors (manifest deliberately MISSING from artifacts/ — degradation case)
        predecessors = [
            ("research", "research_brief"),
            ("proposal", "proposal_packet"),
            ("script", "script"),
            ("scene_plan", "scene_plan"),
            ("assets", "asset_manifest"),
        ]
        for st, art_name in predecessors:
            (proj_dir / f"checkpoint_{st}.json").write_text(
                json.dumps({
                    "version": "1.0",
                    "project_id": "run-warn",
                    "pipeline_type": "animated-explainer",
                    "stage": st,
                    "status": "completed",
                    "timestamp": "2026-10-08T00:00:00Z",
                    "human_approval_required": True,
                    "human_approved": True,
                    "artifacts": {art_name: sample_artifact(art_name)},
                }),
                encoding="utf-8",
            )

        edit_decisions = {
            "version": "1.0",
            "render_runtime": "remotion",
            "cuts": [
                {
                    "id": "cut-1",
                    "source": "assets/audio/scene_1.wav",
                    "in_seconds": 0.0,
                    "out_seconds": 10.0,
                    "layer": "primary",
                }
            ],
        }

        # Warnings stay non-fatal: the checkpoint writes successfully.
        with caplog.at_level(logging.WARNING, logger="lib.checkpoint"):
            cp_path = write_checkpoint(
                tmp_path,
                "run-warn",
                "edit",
                "completed",
                {"edit_decisions": edit_decisions},
                pipeline_type="animated-explainer",
                human_approved=True,
            )

        assert cp_path.exists()

        # (b)(a) each degradation warning is LOGGED, not swallowed
        assert "asset_manifest.json does not exist yet" in caplog.text

        # (b)(b) the warnings list is attached to the checkpoint record metadata
        record = json.loads(cp_path.read_text(encoding="utf-8"))
        attached = record["metadata"]["timing_validation_warnings"]
        assert isinstance(attached, list) and attached
        assert any("asset_manifest.json does not exist yet" in w for w in attached)
