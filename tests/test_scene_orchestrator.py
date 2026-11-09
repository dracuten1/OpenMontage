"""Tests for OpenMontage Scene Workflow Orchestrator.

Covers:
- Input freeze & packet hash binding
- Bounded concurrency dispatch
- Bounded retries
- Ownership enforcement (writer scope containment & reviewer sandbox isolation)
- RED tamper-detection case: reviewer writing canonical file is caught and rejected
- Verdict-to-hash binding verified through episode gate
- Session evidence generation & persistence
- Subprocess agent runner
- Daemon agent runner adapter
- CLI entrypoint
"""

import copy
import hashlib
import json
import threading
import time
from pathlib import Path
import pytest

from tools.qc.scene_orchestrator import (
    AgentRunResult,
    CallableAgentRunner,
    DaemonAgentRunner,
    ReviewerContext,
    SubprocessAgentRunner,
    WriterContext,
    diff_snapshots,
    discover_authoritative_scenes,
    freeze_episode_inputs,
    main,
    orchestrate_episode,
    snapshot_directory_hashes,
    verify_reviewer_ownership,
    verify_writer_scope,
)
from tools.qc.scene_packet import SCHEMA_VERSION, integrate_scene_packet
from tests.test_episode_gate import packet, valid_episode, _full_gate_records


# ==============================================================================
# Helper Fixtures & Builders
# ==============================================================================

def make_test_episode(root: Path, scene_ids: list[str] = ("cut-1", "cut-2")) -> Path:
    """Build a multi-scene valid episode with required metadata."""
    from tests.test_timing_relock_validator import _write_real_wav_file
    from lib.production_validation import EvidenceRecord, ValidationStatus
    import wave

    project = root / "test_episode"
    art = project / "artifacts"
    audio = project / "assets" / "audio"
    packets_dir = project / "packets"
    stems = project / "audio_stems"

    art.mkdir(parents=True, exist_ok=True)
    audio.mkdir(parents=True, exist_ok=True)
    packets_dir.mkdir(parents=True, exist_ok=True)
    stems.mkdir(parents=True, exist_ok=True)

    # Style contract
    style_path = packets_dir / "style_contract.json"
    style_path.write_text(json.dumps({"schema": "openmontage.style-contract", "version": 1}), encoding="utf-8")
    style_hash = hashlib.sha256(style_path.read_bytes()).hexdigest()

    cuts = []
    assets = []
    words = []
    wav_hashes = {}

    for i, sid in enumerate(scene_ids):
        wav_file = audio / f"voice_{sid}.wav"
        _write_real_wav_file(wav_file, 1.0)
        h = hashlib.sha256(wav_file.read_bytes()).hexdigest()
        wav_hashes[sid] = h

        cuts.append({
            "id": sid,
            "source": f"assets/audio/voice_{sid}.wav",
            "in_seconds": 0,
            "out_seconds": 1.0,
            "layer": "primary",
        })
        assets.append({
            "id": f"voice-{sid}",
            "type": "narration",
            "scene_id": sid,
            "path": f"assets/audio/voice_{sid}.wav",
            "duration_seconds": 1.0,
        })
        words.append({
            "word": f"spoken_{sid}",
            "scene_id": sid,
            "global_start": 0.05,
            "global_end": 0.3,
        })

    edit = {
        "version": "1.0",
        "render_runtime": "remotion",
        "required_gates": ["layout"],
        "cuts": cuts,
    }
    manifest = {
        "version": "1.0",
        "assets": assets,
        "metadata": {"total_audio_speech_duration_seconds": float(len(scene_ids))},
    }
    scene_manifest = {
        "version": "1.0",
        "scenes": [{"scene_id": sid} for sid in scene_ids],
    }

    (art / "edit_decisions.json").write_text(json.dumps(edit))
    (art / "asset_manifest.json").write_text(json.dumps(manifest))
    (art / "scene_manifest.json").write_text(json.dumps(scene_manifest))
    (art / "narration_words.json").write_text(json.dumps(words))

    words_bytes = (art / "narration_words.json").read_bytes()
    words_hash = hashlib.sha256(words_bytes).hexdigest()

    # Audio stems
    for name in ("narration", "bgm", "sfx", "mix"):
        with wave.open(str(stems / f"{name}.wav"), "wb") as w:
            w.setnchannels(1)
            w.setsampwidth(2)
            w.setframerate(16000)
            w.writeframes(b"\x00\x00" * 16000 * len(scene_ids))
    (stems / "manifest.json").write_text(json.dumps({k: f"{k}.wav" for k in ("narration", "bgm", "sfx", "mix")}))

    (project / "mix_profile.json").write_text(json.dumps({
        "schema": "openmontage.mix-profile",
        "version": 1,
        "target_lufs": -60,
        "lufs_tolerance": 60,
        "ducking": {"min_reduction_db": 0},
        "windows": {},
        "declared_not_measured": ["music_masking"],
    }))

    ev = art / "layout_evidence.json"
    ev.write_text('{"verified":true}')
    # Fixture contract (review A-1 + A-2 hardening): strict pre-render validation
    # enforces the FULL required gate set and requires a content hash for every
    # evidence path. Metadata may no longer narrow the enforced gate set.
    records = _full_gate_records(art, list(scene_ids))
    (art / "production_evidence.json").write_text(json.dumps([r.to_dict() for r in records]))

    # Seed scene packet templates directly under episode root
    for sid in scene_ids:
        p = packet(project, scene_id=sid)
        p["scene_id"] = sid
        p["narration"] = {"ref": f"assets/audio/voice_{sid}.wav", "sha256": wav_hashes[sid]}
        p["word_alignment"] = {"ref": "artifacts/narration_words.json", "sha256": words_hash}
        p["style_contract"] = {"ref": "packets/style_contract.json", "sha256": style_hash}
        p["assets"] = [{"ref": f"assets/audio/voice_{sid}.wav", "sha256": wav_hashes[sid], "rights": "licensed"}]
        p["allowed_io"] = ["artifacts", "assets", "packets", "scene"]
        p["frozen_inputs"] = {}
        (project / f"packet_{sid}.json").write_text(json.dumps(p, indent=2))

    return project


# ==============================================================================
# Unit & Integration Tests
# ==============================================================================

def test_discover_authoritative_scenes(tmp_path):
    """Test discovery from scene_manifest.json and edit_decisions.json."""
    episode = make_test_episode(tmp_path, scene_ids=["s1", "s2", "s3"])
    scenes = discover_authoritative_scenes(episode)
    assert scenes == ["s1", "s2", "s3"]


def test_freeze_inputs_and_hash_binding(tmp_path):
    """Director freezes inputs into a path->sha256 map."""
    episode = make_test_episode(tmp_path, scene_ids=["s1"])
    frozen = freeze_episode_inputs(episode, {})
    assert "artifacts/edit_decisions.json" in frozen
    assert "artifacts/asset_manifest.json" in frozen
    assert "packets/style_contract.json" in frozen
    assert len(frozen["artifacts/edit_decisions.json"]) == 64


def test_ownership_writer_scope_containment(tmp_path):
    """Writer modifying out-of-scope files triggers writer_scope_violation."""
    episode = make_test_episode(tmp_path, scene_ids=["s1"])
    before = snapshot_directory_hashes(episode)

    # In-scope edit: writing inside allowed_io (e.g. scene/ or packet_s1.json)
    (episode / "packet_s1.json").write_text("{}", encoding="utf-8")
    after_ok = snapshot_directory_hashes(episode)
    valid, _, err = verify_writer_scope(before, after_ok, "s1", ["artifacts", "packets"], episode)
    assert valid is True
    assert err is None

    # Out-of-scope edit: writer touches an unauthorized root file
    (episode / "unauthorized_root_file.txt").write_text("bad data", encoding="utf-8")
    after_bad = snapshot_directory_hashes(episode)
    valid, mutated, err = verify_writer_scope(before, after_bad, "s1", ["artifacts", "packets"], episode)
    assert valid is False
    assert "writer_scope_violation" in err
    assert "unauthorized_root_file.txt" in mutated


def test_ownership_reviewer_sandbox_isolation_and_tamper_red_case(tmp_path):
    """Adversarial RED Case: Reviewer tampering with canonical tree must be detected and rejected."""
    episode = make_test_episode(tmp_path, scene_ids=["s1"])

    # 1. Honest reviewer: writes only in its sandbox copy
    before = snapshot_directory_hashes(episode)
    # simulate reviewer running in sandbox (zero canonical changes)
    after_clean = snapshot_directory_hashes(episode)
    valid, mutated, err = verify_reviewer_ownership(before, after_clean)
    assert valid is True
    assert mutated == []
    assert err is None

    # 2. Rogue reviewer: mutates canonical file directly
    rogue_file = episode / "canonical_tamper.txt"
    rogue_file.write_text("rogue write to canonical directory", encoding="utf-8")
    after_tampered = snapshot_directory_hashes(episode)

    valid, mutated, err = verify_reviewer_ownership(before, after_tampered)
    assert valid is False
    assert "reviewer_canonical_mutation" in err
    assert "canonical_tamper.txt" in mutated


def test_orchestrator_reviewer_tamper_rejection_in_attempt(tmp_path):
    """End-to-end RED case: Orchestrator catches rogue reviewer via runner and marks attempt failed."""
    episode = make_test_episode(tmp_path, scene_ids=["cut-1"])

    def rogue_reviewer_fn(ctx: ReviewerContext) -> AgentRunResult:
        # Deliberately mutate canonical episode directory!
        tamper_path = ctx.canonical_dir / "tampered_by_reviewer.txt"
        tamper_path.write_text("tamper", encoding="utf-8")
        # Also write findings in sandbox
        findings_dir = ctx.sandbox_dir / "packets"
        findings_dir.mkdir(parents=True, exist_ok=True)
        (findings_dir / f"{ctx.scene_id}_findings.json").write_text(json.dumps({
            "scene_id": ctx.scene_id,
            "verdict": "approved",
            "reviewed_hashes": ctx.output_hashes,
        }))
        return AgentRunResult(
            instance_id=ctx.instance_id,
            token=ctx.token,
            role="reviewer",
            exit_code=0,
            started_at="2026-11-09T00:00:00Z",
            finished_at="2026-11-09T00:00:01Z",
            duration_seconds=1.0,
            stdout="Reviewer attempted canonical mutation",
            stderr="",
        )

    runner = CallableAgentRunner(reviewer_fn=rogue_reviewer_fn)
    session = orchestrate_episode(episode, max_concurrency=1, max_retries=0, runner=runner)

    assert session.overall_status == "fail"
    scene_rec = session.scenes["cut-1"]
    assert scene_rec.status == "failed"
    attempt = scene_rec.attempts[0]
    assert attempt.ownership is not None
    assert attempt.ownership.reviewer_canonical_mutation is True
    assert "reviewer_canonical_mutation" in attempt.error


def test_bounded_concurrency(tmp_path):
    """Verify max_concurrency limits parallel execution count."""
    episode = make_test_episode(tmp_path, scene_ids=["cut-1", "cut-2", "cut-3", "cut-4"])

    lock = threading.Lock()
    active_count = 0
    max_observed_concurrency = 0

    def concurrent_writer(ctx: WriterContext) -> AgentRunResult:
        nonlocal active_count, max_observed_concurrency
        with lock:
            active_count += 1
            if active_count > max_observed_concurrency:
                max_observed_concurrency = active_count
        time.sleep(0.05)
        with lock:
            active_count -= 1
        return AgentRunResult(
            instance_id=ctx.instance_id,
            token=ctx.token,
            role="writer",
            exit_code=0,
            started_at="2026-11-09T00:00:00Z",
            finished_at="2026-11-09T00:00:01Z",
            duration_seconds=0.05,
            stdout="OK",
            stderr="",
        )

    runner = CallableAgentRunner(writer_fn=concurrent_writer)
    session = orchestrate_episode(episode, max_concurrency=2, max_retries=0, runner=runner)

    assert max_observed_concurrency <= 2
    assert session.config["max_concurrency"] == 2


def test_bounded_retries(tmp_path):
    """Verify bounded retry behavior: attempt fails then succeeds."""
    episode = make_test_episode(tmp_path, scene_ids=["cut-1"])
    attempt_counter = 0

    def flaky_writer(ctx: WriterContext) -> AgentRunResult:
        nonlocal attempt_counter
        attempt_counter += 1
        if attempt_counter == 1:
            return AgentRunResult(
                instance_id=ctx.instance_id,
                token=ctx.token,
                role="writer",
                exit_code=1,
                started_at="2026-11-09T00:00:00Z",
                finished_at="2026-11-09T00:00:01Z",
                duration_seconds=0.01,
                stdout="",
                stderr="Transient error on first try",
                error="Transient error",
            )
        return AgentRunResult(
            instance_id=ctx.instance_id,
            token=ctx.token,
            role="writer",
            exit_code=0,
            started_at="2026-11-09T00:00:00Z",
            finished_at="2026-11-09T00:00:01Z",
            duration_seconds=0.01,
            stdout="Success on second try",
            stderr="",
        )

    runner = CallableAgentRunner(writer_fn=flaky_writer)
    session = orchestrate_episode(episode, max_concurrency=1, max_retries=1, runner=runner)

    scene_rec = session.scenes["cut-1"]
    assert len(scene_rec.attempts) == 2
    assert scene_rec.attempts[0].success is False
    assert scene_rec.attempts[1].success is True
    assert scene_rec.status == "success"


def test_retry_bound_exhaustion(tmp_path):
    """Verify retry count does not exceed max_retries + 1."""
    episode = make_test_episode(tmp_path, scene_ids=["cut-1"])

    def failing_writer(ctx: WriterContext) -> AgentRunResult:
        return AgentRunResult(
            instance_id=ctx.instance_id,
            token=ctx.token,
            role="writer",
            exit_code=1,
            started_at="2026-11-09T00:00:00Z",
            finished_at="2026-11-09T00:00:01Z",
            duration_seconds=0.01,
            stdout="",
            stderr="Permanent failure",
            error="Permanent failure",
        )

    runner = CallableAgentRunner(writer_fn=failing_writer)
    session = orchestrate_episode(episode, max_concurrency=1, max_retries=1, runner=runner)

    scene_rec = session.scenes["cut-1"]
    assert len(scene_rec.attempts) == 2  # 1 initial + 1 retry = 2 attempts
    assert scene_rec.status == "failed"
    assert session.overall_status == "fail"


def test_verdict_hash_binding_to_episode_gate(tmp_path):
    """Reviewer verdict binds reviewed output hashes; episode gate verifies binding."""
    episode = make_test_episode(tmp_path, scene_ids=["cut-1"])

    runner = CallableAgentRunner()
    session = orchestrate_episode(episode, max_concurrency=1, max_retries=0, runner=runner)

    assert session.overall_status == "pass"
    assert session.episode_gate_result["valid"] is True
    assert session.episode_gate_result["reasons"] == []

    # Verify session evidence was persisted
    ev_file = episode / "artifacts" / "scene_workflow_evidence.json"
    assert ev_file.is_file()
    ev_data = json.loads(ev_file.read_text(encoding="utf-8"))
    assert ev_data["session_id"].startswith("session-")
    assert ev_data["overall_status"] == "pass"
    assert "ownership_model" in ev_data


def test_subprocess_agent_runner_real_os_process(tmp_path):
    """SubprocessAgentRunner executes standalone OS processes for writer and reviewer."""
    episode = make_test_episode(tmp_path, scene_ids=["cut-1"])

    runner = SubprocessAgentRunner()
    session = orchestrate_episode(episode, max_concurrency=1, max_retries=0, runner=runner)

    assert session.overall_status == "pass"
    attempt = session.scenes["cut-1"].attempts[0]
    assert attempt.writer_result.exit_code == 0
    assert "PASS — writer" in attempt.writer_result.stdout
    assert attempt.reviewer_result.exit_code == 0
    assert "PASS — reviewer" in attempt.reviewer_result.stdout
    assert attempt.writer_result.duration_seconds >= 0.0


def test_daemon_runner_health_check():
    """DaemonAgentRunner checks health endpoint."""
    runner = DaemonAgentRunner()
    # If daemon is running on 8088, check_health() returns True, else False
    is_alive = runner.check_health()
    assert isinstance(is_alive, bool)


def test_daemon_runner_mocked_turn(monkeypatch, tmp_path):
    """DaemonAgentRunner creates instances, sends messages, polls status, and cleans up."""
    import io

    class FakeHTTPResponse:
        def __init__(self, data: bytes):
            self.data = data
        def read(self):
            return self.data
        def __enter__(self):
            return self
        def __exit__(self, *args):
            pass

    calls = []
    def fake_urlopen(req, timeout=None):
        url = req.full_url if hasattr(req, "full_url") else str(req)
        method = req.get_method() if hasattr(req, "get_method") else "GET"
        calls.append((method, url))
        if "/api/instances" in url and method == "POST" and not "/messages" in url:
            return FakeHTTPResponse(b'{"instance_id": "inst-mock-123", "status": "idle"}')
        elif "/messages" in url and method == "POST":
            return FakeHTTPResponse(b'{"message_id": "msg-mock-1"}')
        elif "/api/instances/inst-mock-123" in url and method == "GET":
            return FakeHTTPResponse(b'{"instance_id": "inst-mock-123", "status": "completed"}')
        elif method == "DELETE":
            return FakeHTTPResponse(b'{"terminated": true}')
        return FakeHTTPResponse(b'{}')

    import urllib.request
    monkeypatch.setattr(urllib.request, "urlopen", fake_urlopen)

    runner = DaemonAgentRunner(daemon_url="http://mock-daemon:8088", timeout_seconds=2.0)
    ctx = WriterContext(
        scene_id="cut-1",
        instance_id="writer_cut-1_local",
        token="wt_local",
        episode_dir=tmp_path,
        allowed_io=["artifacts"],
        frozen_inputs={},
    )
    res = runner.run_writer(ctx)
    assert res.exit_code == 0
    assert "inst-mock-123" in res.stdout
    assert any(m == "POST" and "/api/instances" in u for m, u in calls)
    assert any(m == "POST" and "/messages" in u for m, u in calls)
    assert any(m == "GET" and "/api/instances/inst-mock-123" in u for m, u in calls)
    assert any(m == "DELETE" in m for m, u in calls)


def test_daemon_runner_timeout_surfaces_elapsed_and_status(tmp_path, monkeypatch):
    """Test DaemonAgentRunner timeout surfaces elapsed time and last known status."""
    class FakeHTTPResponse:
        def __init__(self, data: bytes):
            self.data = data
        def read(self):
            return self.data
        def __enter__(self):
            return self
        def __exit__(self, *args):
            pass

    def fake_urlopen(req, timeout=None):
        url = req.full_url if hasattr(req, "full_url") else str(req)
        method = req.get_method() if hasattr(req, "get_method") else "GET"
        if "/api/instances" in url and method == "POST" and "/messages" not in url:
            return FakeHTTPResponse(b'{"instance_id": "inst-timeout-1", "status": "running"}')
        elif "/messages" in url and method == "POST":
            return FakeHTTPResponse(b'{"message_id": "msg-1"}')
        elif "/api/instances/inst-timeout-1" in url and method == "GET":
            # Always return running to simulate hung turn
            return FakeHTTPResponse(b'{"instance_id": "inst-timeout-1", "status": "running"}')
        elif method == "DELETE":
            return FakeHTTPResponse(b'{"terminated": true}')
        return FakeHTTPResponse(b'{}')

    import urllib.request
    monkeypatch.setattr(urllib.request, "urlopen", fake_urlopen)

    runner = DaemonAgentRunner(
        daemon_url="http://mock-daemon:8088",
        timeout_seconds=0.1,
        poll_interval_seconds=0.02,
    )
    ctx = WriterContext(
        scene_id="cut-1",
        instance_id="writer_cut-1_timeout",
        token="wt_timeout",
        episode_dir=tmp_path,
        allowed_io=["artifacts"],
        frozen_inputs={},
    )
    res = runner.run_writer(ctx)
    assert res.exit_code == 1
    assert res.error is not None
    assert "timed out after" in res.error
    assert "running" in res.error
    assert res.outputs.get("timed_out") is True



def test_cli_main_entrypoint(tmp_path):
    """Test CLI entrypoint execution."""
    episode = make_test_episode(tmp_path, scene_ids=["cut-1"])
    exit_code = main([str(episode), "--runner", "subprocess", "--max-concurrency", "1"])
    assert exit_code == 0


def test_writer_scope_substring_bypass_rejected(tmp_path):
    """Issue 1: writer scope must not allow out-of-scope files merely matching scene_id substring."""
    episode = make_test_episode(tmp_path, scene_ids=["s1"])
    before = snapshot_directory_hashes(episode)
    # unauthorized file containing substring 's1'
    (episode / "unauthorized_s1.py").write_text("malicious code", encoding="utf-8")
    after = snapshot_directory_hashes(episode)
    valid, mutated, err = verify_writer_scope(before, after, "s1", ["artifacts", "packets"], episode)
    assert valid is False
    assert "writer_scope_violation" in err
    assert "unauthorized_s1.py" in mutated


def test_symlink_blindspot_detected(tmp_path):
    """Issue 2: directory and broken symlinks must be tracked in directory snapshots."""
    episode = make_test_episode(tmp_path, scene_ids=["s1"])
    # Create a broken symlink and a directory symlink
    broken_link = episode / "broken_link"
    broken_link.symlink_to("/nonexistent/target")
    dir_link = episode / "dir_link"
    dir_link.symlink_to(episode / "artifacts")

    hashes = snapshot_directory_hashes(episode)
    assert "broken_link" in hashes
    assert hashes["broken_link"] == "symlink:/nonexistent/target"
    assert "dir_link" in hashes
    assert hashes["dir_link"] == f"symlink:{episode / 'artifacts'}"


def test_reviewer_missing_reviewed_hashes_rejected(tmp_path):
    """Issue 3: reviewer omitting reviewed_hashes must fail and not be backfilled by orchestrator."""
    from tools.qc.scene_orchestrator import execute_scene_with_retries

    episode = make_test_episode(tmp_path, scene_ids=["s1"])

    def reviewer_without_hashes(ctx: ReviewerContext) -> AgentRunResult:
        findings_dir = ctx.sandbox_dir / "packets"
        findings_dir.mkdir(parents=True, exist_ok=True)
        findings_path = findings_dir / f"{ctx.scene_id}_findings.json"
        # Omit reviewed_hashes
        findings_payload = {
            "scene_id": ctx.scene_id,
            "verdict": "approved",
            "notes": "No reviewed_hashes provided",
        }
        findings_path.write_text(json.dumps(findings_payload, indent=2), encoding="utf-8")
        return AgentRunResult(
            instance_id=ctx.instance_id,
            token=ctx.token,
            role="reviewer",
            exit_code=0,
            started_at="2026-11-09T00:00:00Z",
            finished_at="2026-11-09T00:00:01Z",
            duration_seconds=1.0,
            stdout="Reviewer ran without hashes",
            stderr="",
        )

    runner = CallableAgentRunner(reviewer_fn=reviewer_without_hashes)
    rec = execute_scene_with_retries("s1", episode, runner=runner, max_retries=0)
    assert rec.status == "failed"
    assert any("Reviewer did not provide reviewed_hashes mapping" in (att.error or "") for att in rec.attempts)

