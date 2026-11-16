#!/usr/bin/env python
"""CC reviewer wrapper — MINTED from tools/qc/cc_wrapper_templates (phase 4A.2).

Do not hand-edit: re-mint via ``python -m tools.qc.mint_project_pipeline``.
Strictly read-only toward scene files (video-slowfix phase1, tasks 1.1/1.2/1.4):

Env: OM_SCENE_ID, OM_SANDBOX_DIR, OM_CANONICAL_DIR (optional; history log dir).
1. Runs `claude` with permission-mode acceptEdits + Read,Glob,Grep allow-list
   and an explicit --disallowedTools deny-list
   (Write,Edit,MultiEdit,NotebookEdit,Bash,WebFetch,WebSearch — reviewer cannot
   write and has no shell/network egress; task 1.1). Containment contract:
   --dangerously-skip-permissions VOIDS --allowedTools scoping (CLI probe
   2026-11-14 confirmed Write/Edit/Bash still execute under the skip flag), so
   the --disallowedTools deny-list is the actual enforcement — it overrides
   the skip flag. acceptEdits stays required because plan/default modes return
   EMPTY stdout with --dangerously-skip-permissions (probe 2026-11-14);
   reviewer-timeout hotfix: planOnly left 4/4 verdicts as stamped timeout_error).
   The child env is whitelisted (system essentials + OM_* + provider API keys)
   — the full parent environment (credentials included) never reaches claude.
2. Captures stdout, tees raw output to <episode>/history/cc_reviewer_{scene_id}.log.
3. Extracts the delimited JSON verdict from stdout via tools/qc/reviewer_runner
   (code-fence stripped) — no verdict file is expected from Claude anymore.
4. Writes packets/{scene_id}_cc_verdict.json AND packets/{scene_id}_findings.json
   on Claude's behalf (task 1.1 item 5) — removes the packet-JSON mutation
   surface that consumed attempts in rounds 3-4 (phase 4A.2).
5. Findings embed "reviewed_hashes": {<scenes_dir>/<resolved filename>: sha256}
   for the reviewed scene file (task 1.2 item 4).
Watchdog expiry writes verdict "timeout_error" instead of a content rejection
(task 1.4); the orchestrator treats that as an infrastructure retry — the
activation target of phase 4A.2 (wrappers never emitted it before).
R5 (perf/cc-pipeline R1-R5): the CLI turn cap is raised 30 -> 45
(reviewer_runner.DEFAULT_REVIEW_MAX_TURNS) and a stream with NO verdict block
(turn cap exhausted / truncation) also emits "timeout_error" so the
orchestrator (R3) infra-retries in place instead of burning a content attempt.
Exit 0 always when findings file written (verdict may be 'rejected').
"""
from __future__ import annotations
import hashlib, json, os, re, subprocess, sys, threading, time
from pathlib import Path

# Task 2.4: single source of truth — static repo-root resolution
# (projects/<proj>/scripts/cc_pipeline/<file>.py -> parents[4] = repo root).
REPO_ROOT = Path(__file__).resolve().parents[4]
if str(REPO_ROOT) not in sys.path:
    sys.path.insert(0, str(REPO_ROOT))

from tools.qc.reviewer_runner import (  # noqa: E402
    DEFAULT_REVIEW_MAX_TURNS,
    DEFAULT_REVIEW_WATCHDOG_S,
    REVIEW_TIMEOUT_VERDICT,
    VERDICT_DELIMITER_RE,
    build_reviewer_cmd,
    extract_verdict,
    get_scenes_dir,
    resolve_scene_filename,
)

# Hotfix 2026-11-15 part 4 (lead): JSON-in-output verdict blocks get dropped by
# the provider (result "" — braces/brackets 0/8 vs control 5/8, 21:40-21:45),
# so the wire format is plain text @@ markers parsed locally. The shared
# <!-- --> + JSON parser (extract_verdict) stays untouched in tools/qc.
AT_VERDICT_DELIMITER_RE = re.compile(r"@@VERDICT_START@@(.*?)@@VERDICT_END@@", re.DOTALL)
_AT_VERDICT_LINE_RE = re.compile(r"VERDICT:\s*(approved|rejected)", re.IGNORECASE)
_AT_ISSUE_LINE_RE = re.compile(r"^\s*ISSUE:\s*(.+)$", re.MULTILINE)


def _extract_at_verdict(stdout_text: str) -> tuple[str, list[str], dict]:
    match = AT_VERDICT_DELIMITER_RE.search(stdout_text or "")
    if not match:
        return "rejected", ["Delimiter @@VERDICT_START@@ not found in reviewer output"], {}
    block = match.group(1)
    vm = _AT_VERDICT_LINE_RE.search(block)
    verdict = vm.group(1).lower() if vm else "rejected"
    issues = [m.group(1).strip() for m in _AT_ISSUE_LINE_RE.finditer(block)]
    if not vm:
        issues = ["Verdict line missing in @@ block"] + issues
    return verdict, issues, {"metrics": {}}


# Task 1.4: dedicated review watchdog, default 360s.
WATCHDOG_S = int(os.environ.get("OM_CC_REVIEW_WATCHDOG", str(DEFAULT_REVIEW_WATCHDOG_S)))
PROJ_ROOT = Path(__file__).resolve().parents[2]  # projects/<project>

def sha256(p: Path) -> str:
    h = hashlib.sha256()
    with open(p, "rb") as f:
        for chunk in iter(lambda: f.read(1 << 16), b""):
            h.update(chunk)
    return h.hexdigest()

def main() -> int:
    scene_id = os.environ["OM_SCENE_ID"]
    sandbox = Path(os.environ["OM_SANDBOX_DIR"]).resolve()
    # History log lives in the canonical episode's history/ dir (task 1.1);
    # the orchestrator's scoped reviewer ownership check excludes history/.
    episode = Path(os.environ.get("OM_CANONICAL_DIR") or sandbox).resolve()
    log_dir = episode / "history"
    log_dir.mkdir(parents=True, exist_ok=True)

    packets = sandbox / "packets"
    packets.mkdir(parents=True, exist_ok=True)
    findings_path = packets / f"{scene_id}_findings.json"
    verdict_path = packets / f"{scene_id}_cc_verdict.json"

    # Task 1.2 item 4: hash the reviewed scene file under its resolved name.
    scenes_dir = get_scenes_dir(sandbox)
    target_filename = resolve_scene_filename(scenes_dir, scene_id)
    scene_file = scenes_dir / target_filename
    scene_rel = f"{scenes_dir.name}/{target_filename}"

    reviewed_hashes: dict[str, str] = {}
    if scene_file.is_file():
        reviewed_hashes[scene_rel] = sha256(scene_file)
    else:
        findings_path.write_text(json.dumps({
            "scene_id": scene_id, "verdict": "rejected", "reviewed_hashes": {},
            "issues": [f"writer output {scene_rel} missing in sandbox"],
            "notes": f"writer output {scene_rel} missing in sandbox",
        }, indent=1, ensure_ascii=False))
        print(f"reviewer {scene_id}: scene file missing in sandbox -> rejected")
        return 0

    task = f"""# TASK — independent reviewer {scene_id} (read-only verification)

You are the independent scene reviewer (doctrine §7.1: fresh context, findings only).
Verify the writer output `{scene_rel}` in this sandbox. You do not have write access.

ABSOLUTE RULE — REVIEW ONLY: you must NOT create, delete, edit or patch ANY file.
Fixing syntax/layout yourself is a violation (auto-fail `reviewer_canonical_mutation`).
If you are tempted to edit, you must instead REJECT with the issue list.

Checks (each → issue list entry when violated):
1. File parses as a React/TSX component with a default export.
2. Uses shared contracts (imports from './theme' / './timing' / './lib/SceneShell' or '../../components/...') — no re-implemented copies.
3. Every animation anchor (interpolate input frame / spring condition) stays within scene window [0, window_frames] read from `artifacts/words_{scene_id}.json`; key word anchors match spoken words ±9f; last cue + reveal must end >=45f before scene end — EXCEPTION: when the final spoken-word cue lands after 65% of window_frames, >=20f tail suffices (compact the reveal: shorter duration, no multi-step stagger on the tail block). No overflow past window end.
4. No CSS `transition:` string. No `staticFile(` usage for images. No `<Img` of generated media.
5. Flex-column stacking (no sibling absolute blocks with tops <20px apart); container heights >= children stack + 30px; content lives INSIDE the episode band (theme.ts SAFE: margin 115, content band y460-1220) — generic y1300-1440 / x<=940 ranges DO NOT apply to this episode; right edge x<=965 (=1080-115) is compliant.
6. spring damping per episode tokens: MOTION.pop (damping 14, theme.ts spring directive) and MOTION.settle (damping 20) are BOTH compliant; no damping below 14; translateY positive→0; no camera scale/translate.
7. Numbers/labels on screen match the scene spec JSON exactly (whitelist values; caveat labels present when specified).

You do not have write access to scene files, and you must not create or edit ANY other file EXCEPT ONE: your findings file `packets/{scene_id}_findings.json` (path relative to this sandbox). After your silent checks, use the Write tool to create that file with EXACTLY this JSON content (no markdown fence, no extra keys):
{{
  "scene_id": "{scene_id}",
  "verdict": "approved",
  "issues": [],
  "notes": "ok"
}}
Use "rejected" instead of "approved" when any check fails, and put one string per issue into "issues". Then your entire final message must be exactly: DONE
Max 12 turns, reads <=4.
"""
    # Security containment (review 2026-11-14): whitelist the child
    # environment — the full parent process env carries credentials that a
    # reviewer session must never see. Pass only system essentials, the OM_*
    # pipeline contract vars, and the provider API keys the claude CLI needs.
    _ENV_ALLOW_KEYS = ("PATH", "HOME", "USER", "SHELL", "TMPDIR")
    _ENV_ALLOW_PREFIXES = ("OM_",)
    _ENV_ALLOW_PROVIDER_KEYS = ("ANTHROPIC_API_KEY", "OPENAI_API_KEY", "GEMINI_API_KEY")
    env = {
        k: v for k, v in os.environ.items()
        if k in _ENV_ALLOW_KEYS
        or k.startswith(_ENV_ALLOW_PREFIXES)
        or k in _ENV_ALLOW_PROVIDER_KEYS
    }
    env["MAX_THINKING_TOKENS"] = "1024"
    max_turns = os.environ.get("OM_CC_REVIEW_MAX_TURNS", DEFAULT_REVIEW_MAX_TURNS)
    cmd = build_reviewer_cmd(max_turns)
    # Hotfix 2026-11-15 (lead, env-gated): text-mode stdout from the claude CLI
    # intermittently comes back EMPTY (exit 0, no output). JSON mode is stable,
    # so OM_CC_REVIEW_OUTPUT=json switches the CLI to --output-format json and
    # unwraps {"result": "..."} before delimiter extraction. Default unchanged.
    review_output_mode = os.environ.get("OM_CC_REVIEW_OUTPUT", "text").strip().lower()
    if review_output_mode == "json":
        cmd = cmd + ["--output-format", "json"]
    # lead debug 23:37: dump effective task to scratch for offline A/B
    if os.environ.get("OM_CC_DEBUG_TASK"):
        try:
            Path(os.environ["OM_CC_DEBUG_TASK"]).write_text(task, encoding="utf-8")
        except Exception:
            pass
    # Hotfix 2026-11-15 part 3 (lead): --allowedTools / --disallowedTools make
    # the provider return an EMPTY final message (verified A/B 21:29: no-flags
    # "OK", each flag alone -> result ""; 4x4 sample 21:42 no-flags 3/4 OK,
    # allowedTools 0/4). Strip both here; containment remains via the
    # review-only task text, the whitelisted child env, and the orchestrator's
    # reviewer-ownership snapshot check (verify_reviewer_ownership).
    _strip_pairs = ("--allowedTools", "--disallowedTools")
    cleaned: list[str] = []
    skip_next = False
    for token in cmd:
        if skip_next:
            skip_next = False
            continue
        if token in _strip_pairs:
            skip_next = True
            continue
        cleaned.append(token)
    cmd = cleaned

    # Hotfix 2026-11-15 part 2 (lead): provider intermittently returns an empty
    # final message (success envelope, result "") — bursts lasting minutes.
    # Reviewers only speak via the stdout verdict block, so one empty stream =
    # one lost review. OM_CC_REVIEW_STREAM_ATTEMPTS (default 6) re-spawns the
    # CLI with a short sleep between tries until a verdict delimiter shows up
    # or the watchdog kills the run. Per-attempt watchdog, never cumulative.
    max_stream_attempts = max(1, int(os.environ.get("OM_CC_REVIEW_STREAM_ATTEMPTS", "6")))
    stream_sleep_s = max(0, int(os.environ.get("OM_CC_REVIEW_STREAM_SLEEP", "45")))
    log_path = log_dir / f"cc_reviewer_{scene_id}.log"
    # Hotfix part 5: stale findings must never masquerade as a fresh verdict.
    try:
        findings_path.unlink()
    except FileNotFoundError:
        pass
    verdict_path.unlink(missing_ok=True)
    timed_out = False
    final_rc = None
    stdout_text = ""
    verdict_seen = False
    for stream_attempt in range(1, max_stream_attempts + 1):
        try:
            proc = subprocess.Popen(cmd, cwd=str(sandbox), env=env, stdin=subprocess.PIPE,
                                    stdout=subprocess.PIPE, stderr=subprocess.STDOUT, text=True)
        except Exception as e:
            print(f"REVIEWER SPAWN FAIL {scene_id}: {e}", file=sys.stderr)
            return 1
        # Task 1.4: watchdog fires proc.kill() and flags the timeout distinctly.
        attempt_timed_out = False

        def _kill(p):
            nonlocal attempt_timed_out
            time.sleep(WATCHDOG_S)
            try:
                if p.poll() is None:
                    p.kill()
                    attempt_timed_out = True
            except Exception:
                pass
        threading.Thread(target=_kill, args=(proc,), daemon=True).start()
        out, _ = proc.communicate(task)

        # Hotfix 2026-11-15 (env-gated): unwrap JSON envelope -> inner result.
        if review_output_mode == "json":
            raw = out or ""
            try:
                envelope = json.loads(raw)
                out = envelope.get("result", "") if isinstance(envelope, dict) else raw
            except Exception:
                out = raw  # fall back to raw text; delimiter check will judge

        timed_out = attempt_timed_out
        final_rc = proc.returncode
        stdout_text = out or ""
        verdict_seen = bool(AT_VERDICT_DELIMITER_RE.search(stdout_text))
        # Hotfix part 5b: file-channel success check — the reviewer may have
        # written its findings even when the final message was dropped.
        file_ok = False
        if findings_path.is_file():
            try:
                cand = json.loads(findings_path.read_text(encoding="utf-8"))
                file_ok = isinstance(cand, dict) and cand.get("verdict") in ("approved", "rejected")
            except Exception:
                file_ok = False
        with open(log_path, "a", encoding="utf-8") as lf:
            lf.write(f"--- stream attempt {stream_attempt}/{max_stream_attempts} "
                     f"rc={final_rc} timed_out={timed_out} verdict_seen={verdict_seen} "
                     f"file_ok={file_ok} ---\n")
            lf.write(stdout_text + "\n")
        if timed_out:
            break  # watchdog expired: stop retrying this scene
        if verdict_seen or file_ok:
            break
        if stream_attempt < max_stream_attempts:
            time.sleep(stream_sleep_s)

    # Hotfix part 5 (lead): file-channel verdicts. The provider drops long
    # final messages wholesale (13/13 empty wrapper runs vs ~50% base rate on
    # short probes, 21:40-23:00) regardless of format, flags or thinking cap —
    # but tool-driven FILE writes keep succeeding (writers did all day). The
    # reviewer now writes its findings JSON itself; the wrapper prefers that
    # file over stdout parsing and re-stamps reviewed_hashes it computes.
    file_findings = None
    if findings_path.is_file():
        try:
            cand = json.loads(findings_path.read_text(encoding="utf-8"))
            if isinstance(cand, dict) and cand.get("verdict") in ("approved", "rejected"):
                file_findings = cand
        except Exception:
            file_findings = None

    if file_findings is not None:
        verdict = file_findings.get("verdict", "rejected")
        issues = [str(i) for i in file_findings.get("issues", []) or []]
        data = {"metrics": file_findings.get("metrics", {}) if isinstance(file_findings.get("metrics", {}), dict) else {}}
    elif timed_out:
        verdict = REVIEW_TIMEOUT_VERDICT
        issues = [f"Reviewer watchdog expired after {WATCHDOG_S}s"]
        data: dict = {}
    else:
        verdict, issues, data = _extract_at_verdict(stdout_text)
        # R5 (perf/cc-pipeline R1-R5): turn-cap headroom + explicit infra
        # classification. When the reviewer stream carries NO verdict
        # delimiter, it never delivered a verdict at all (--max-turns cap
        # exhausted mid-review, or the stream was truncated) — that is an
        # infrastructure failure, not a content judgment. Emit the orchestrator
        # contract string ``timeout_error`` (tools.qc.reviewer_runner.
        # REVIEW_TIMEOUT_VERDICT) so scene_orchestrator infra-retries the scene
        # in place instead of burning a content attempt / full rewrite (R3).
        if not AT_VERDICT_DELIMITER_RE.search(stdout_text or ""):
            verdict = REVIEW_TIMEOUT_VERDICT
            issues = [
                f"Reviewer delivered no verdict block (turn cap {max_turns} "
                "exhausted or stream truncated) — infra timeout, not a content rejection"
            ]
            data = {}

    # Task 1.1 item 5: wrapper writes both packet files on Claude's behalf.
    verdict_path.write_text(json.dumps({
        "scene_id": scene_id,
        "verdict": verdict,
        "issues": issues,
        "metrics": data.get("metrics", {}) if isinstance(data, dict) else {},
    }, indent=1, ensure_ascii=False))

    findings_path.write_text(json.dumps({
        "scene_id": scene_id,
        "verdict": verdict,
        "reviewed_hashes": reviewed_hashes,
        "issues": issues,
        "notes": "; ".join(issues) if issues else "ok",
    }, indent=1, ensure_ascii=False))
    print(f"reviewer {scene_id}: cc_exit={final_rc} timed_out={timed_out} verdict={verdict}")
    return 0

if __name__ == "__main__":
    sys.exit(main())
