#!/usr/bin/env python3
"""render_episode.py — THE render path for OpenMontage Remotion episodes.

Postmortem 2026-11-11 (tin-nong-3tin-20261110): renders ran 4x unchanged, episode
gate FAIL was ignored because `npx remotion render` bypasses every gate, a DRAFT
comp at the wrong canvas shipped to the owner, and a `-vn` master (audio-only)
was DM'd. This wrapper makes the happy path the ONLY path:

  1. episode_gate runs FIRST (validate_episode on the episode dir) — FAIL stops
     the render unless every failing code is explicitly passed to
     --override-codes (overrides are logged, never silent).
  2. Input hash (episode src + public assets + Root.tsx + comp id) — if the
     output already exists and nothing changed, the render is SKIPPED.
  3. Render via `npx remotion render` (cwd remotion-composer).
  4. ffprobe smoke AFTER render: video stream required (audio expected by
     default) — catches `-vn`-style mastering mistakes before delivery.
  5. `--check-file <mp4>` — standalone pre-DM smoke: run this on ANY file
     before sending it to the owner.

Usage:
  .venv/bin/python tools/qc/render_episode.py <comp-id> <out.mp4> [--force]
      [--timeout 1800] [--no-audio] [--override-codes code1,code2
      --override-issued-by <who>]
  .venv/bin/python tools/qc/render_episode.py --check-file <mp4> [--no-audio]

Override discipline (Wave1 P0-2): provenance codes (scene_provenance_*,
token/findings/binding failures) are NON-OVERRIDABLE — the render is refused.
Other codes override only when listed in RUNBOOK_OVERRIDABLE_CODES, and every
accepted override is logged to render_overrides.log together with its issuer
(--override-issued-by or OM_RENDER_OVERRIDE_ISSUED_BY — required).
"""
from __future__ import annotations
import argparse, hashlib, json, os, socket, subprocess, sys, time
from pathlib import Path

REPO_ROOT = Path(__file__).resolve().parents[2]
COMPOSER = REPO_ROOT / "remotion-composer"
if str(REPO_ROOT) not in sys.path:
    sys.path.insert(0, str(REPO_ROOT))

# Wave1 P0-2 item 6 — override discipline (frozensets, enforced).
#
# NON_OVERRIDABLE_CODES: provenance/identity codes. A render may NEVER be
# forced past these via --override-codes — that is exactly how the
# tin-nong-5tin-20261115 render shipped with writer_token:"" on all 12
# packets. Fix the underlying provenance instead (re-run writer/reviewer).
NON_OVERRIDABLE_CODES = frozenset({
    # scene-file provenance chain (episode_gate._check_scene_tsx_provenance)
    "scene_provenance_missing", "scene_provenance_corrupt",
    "scene_provenance_not_approved", "scene_provenance_unbound",
    "scene_provenance_stale",
    # editorial, fact-whitelist & source-photo quality gates (never overridable)
    "editorial_language_gate_failed", "editorial_language_gate_error",
    "fact_whitelist_failed", "source_photo_gate_failed",
    "bgm_duration_failed", "render_runtime_mismatch",
    # packet identity + review binding (scene_packet.integrate_scene_packet)
    "scene_packets_missing", "scene_packet_missing",
    "writer_token_invalid", "reviewer_token_invalid",
    "reviewer_not_independent",
    "findings_hash_invalid", "findings_hash_mismatch", "findings_not_frozen",
    "provenance_missing", "provenance_incomplete",
    "provenance_writer_mismatch", "provenance_findings_mismatch",
    "scene_file_hash_mismatch", "reviewed_scene_path_escape",
})
# RUNBOOK_OVERRIDABLE_CODES: the allowlist of gate codes an operator MAY
# override for iteration (canvas/timing/mix tuning). Anything NOT listed here
# is refused — the allowlist is closed by default (fail-closed), so a new
# code must be added here deliberately, in code, with a reason.
RUNBOOK_OVERRIDABLE_CODES = frozenset({
    "composition_dims_mismatch",   # canvas iteration (doctrine §8.6 aware)
    "timing_relock_failed",        # timing re-lock drift during edit iteration
    "mix_measurement_incomplete",  # declared-not-measured mix checks in flight
    "mix_validation_failed",       # mix tuning iteration
})
OVERRIDE_ISSUER_ENV = "OM_RENDER_OVERRIDE_ISSUED_BY"


def classify_overrides(requested: set[str]) -> tuple[set[str], list[str], list[str]]:
    """Split requested override codes into (allowed, non_overridable, unlisted).

    - allowed: in the runbook allowlist and NOT provenance (proceed, logged).
    - non_overridable: provenance codes — render is refused outright.
    - unlisted: not in the runbook allowlist — render is refused (fail-closed).
    """
    allowed = {c for c in requested if c in RUNBOOK_OVERRIDABLE_CODES and c not in NON_OVERRIDABLE_CODES}
    non_overridable = sorted(c for c in requested if c in NON_OVERRIDABLE_CODES)
    unlisted = sorted(c for c in requested if c not in RUNBOOK_OVERRIDABLE_CODES and c not in NON_OVERRIDABLE_CODES)
    return allowed, non_overridable, unlisted


def resolve_override_issuer(explicit: str, environ: dict | None = None) -> str:
    """Issuer identity for an override: --override-issued-by, else env."""
    env = os.environ if environ is None else environ
    issuer = (explicit or "").strip() or (env.get(OVERRIDE_ISSUER_ENV, "") or "").strip()
    return issuer

# Wave1-Sec W5 — override events are JSONL job-events with a rolling sha256
# chain (tamper-evident), the acting uid and the hostname. Same file
# (render_overrides.log), new line format: one JSON object per line.
OVERRIDE_CHAIN_GENESIS_HASH = "0" * 64
OVERRIDE_EVENT_TYPE = "render_override"

def _canonical_json(obj) -> str:
    """Canonical form used by the override chain hash (W5):
    sort_keys, no ascii escaping, compact separators."""
    return json.dumps(obj, sort_keys=True, ensure_ascii=False, separators=(",", ":"))

def log_override_event(log_path: Path, *, comp_id: str, issuer: str,
                       overridden: list[dict]) -> dict:
    """Append one accepted-override record as a JSONL job-event (W5).

    Reuses tools.qc.job_events.emit_job_event — envelope (event_id,
    timestamp, event_type) is owned by that module; this function only
    builds the payload. Sink stays render_overrides.log (same path as the
    legacy free-text log) so the doctrine §8.6 contract "every override is
    logged with its issuer to render_overrides.log" keeps holding.

    CHAIN SPEC: with CANON(p) = _canonical_json(p),
        entry_hash = sha256( (prev_hash + CANON(payload_without_entry_hash))
                             .encode("utf-8") ).hexdigest()
    - payload_without_entry_hash = payload with the "entry_hash" key removed.
    - prev_hash = OVERRIDE_CHAIN_GENESIS_HASH ("0"*64) for the first entry
      in a log file; every later entry chains from the previous entry's
      "entry_hash". The previous hash is read from the last parseable JSONL
      line (torn/garbage tail lines are skipped).
    Verifier: read all lines, json.loads each, recompute entry_hash over
    (prev_hash + CANON(payload minus entry_hash)) and check both the
    linkage (rec[i].payload.prev_hash == rec[i-1].payload.entry_hash) and
    each hash value.
    """
    from tools.qc.job_events import emit_job_event
    prev_hash = OVERRIDE_CHAIN_GENESIS_HASH
    if log_path.is_file():
        for line in reversed(log_path.read_text(encoding="utf-8").splitlines()):
            line = line.strip()
            if not line:
                continue
            try:
                rec = json.loads(line)
            except Exception:
                continue  # torn/garbage line — keep walking back
            payload_prev = rec.get("payload", {}).get("entry_hash") if isinstance(rec, dict) else None
            if payload_prev:
                prev_hash = str(payload_prev)
                break
    payload = {
        "comp_id": comp_id,
        "issuer": issuer,
        "codes": sorted({r["code"] for r in overridden}),
        "reasons": [{"code": r["code"], "message": r["message"]} for r in overridden],
        "uid": os.getuid() if hasattr(os, "getuid") else None,
        "hostname": socket.gethostname(),
        "prev_hash": prev_hash,
    }
    canon = _canonical_json(payload)
    payload["entry_hash"] = hashlib.sha256((prev_hash + canon).encode("utf-8")).hexdigest()
    return emit_job_event(OVERRIDE_EVENT_TYPE, payload, sink=log_path)



def comp_slug(comp_id: str) -> str:
    for suffix in ("-DRAFT", "-FINAL"):
        if comp_id.upper().endswith(suffix):
            return comp_id[: -len(suffix)]
    return comp_id


def input_fingerprint(episode_dir: Path, comp_id: str) -> str:
    h = hashlib.sha256()
    h.update(comp_id.encode())

    def absorb_dir(d: Path):
        if not d.is_dir():
            return
        for p in sorted(x for x in d.rglob("*") if x.is_file()):
            if "node_modules" in p.parts or "__pycache__" in p.parts or ".test." in p.name:
                continue
            try:
                rel = p.relative_to(REPO_ROOT)
            except ValueError:
                rel = p.relative_to(COMPOSER) if COMPOSER in p.parents else p
            h.update(str(rel).encode())
            h.update(hashlib.sha256(p.read_bytes()).digest())

    absorb_dir(episode_dir)
    absorb_dir(COMPOSER / "src" / "components")
    absorb_dir(COMPOSER / "public" / episode_dir.name)
    root_tsx = COMPOSER / "src" / "Root.tsx"
    if root_tsx.is_file():
        h.update(b"Root.tsx")
        h.update(hashlib.sha256(root_tsx.read_bytes()).digest())
    return h.hexdigest()


def ffprobe_streams(path: Path) -> dict:
    proc = subprocess.run(
        ["ffprobe", "-v", "error", "-show_streams", "-show_format", "-of", "json", str(path)],
        capture_output=True, text=True, timeout=120,
    )
    if proc.returncode != 0:
        return {"ok": False, "error": f"ffprobe failed: {proc.stderr.strip()[:300]}"}
    data = json.loads(proc.stdout)
    streams = data.get("streams", [])
    video = [s for s in streams if s.get("codec_type") == "video"]
    audio = [s for s in streams if s.get("codec_type") == "audio"]
    dur = float(data.get("format", {}).get("duration") or 0)
    return {"ok": True, "video": len(video), "audio": len(audio), "duration": dur}


def smoke_check(path: Path, expect_audio: bool = True) -> list[str]:
    problems = []
    if not path.is_file() or path.stat().st_size == 0:
        return [f"missing or empty file: {path}"]
    info = ffprobe_streams(path)
    if not info.get("ok"):
        return [info.get("error", "ffprobe error")]
    if info["video"] < 1:
        problems.append("NO VIDEO STREAM (mastering flag bug, e.g. ffmpeg -vn?) — never DM this file")
    if expect_audio and info["audio"] < 1:
        problems.append("no audio stream (narration/BGM missing)")
    if info["duration"] <= 0:
        problems.append("duration <= 0")
    return problems


def main(argv=None) -> int:
    ap = argparse.ArgumentParser(description="Gate-checked, idempotent Remotion render")
    ap.add_argument("comp_id", nargs="?", help="composition id, e.g. <slug>-DRAFT")
    ap.add_argument("out", nargs="?", help="output mp4 path")
    ap.add_argument("--force", action="store_true", help="re-render even if inputs unchanged")
    ap.add_argument("--timeout", type=int, default=1800)
    ap.add_argument("--no-audio", action="store_true", help="don't require an audio stream")
    ap.add_argument("--agy", action="store_true", help="run Antigravity-native episode gate mode (no legacy CC packet_*.json required)")
    ap.add_argument("--override-codes", default="", help="comma-separated episode_gate codes to override (LOGGED, runbook allowlist only; provenance codes are NEVER overridable)")
    ap.add_argument("--override-issued-by", default="", help="identity of whoever approved the override (required for any override; logged; env OM_RENDER_OVERRIDE_ISSUED_BY fallback)")
    ap.add_argument("--check-file", metavar="MP4", help="ffprobe smoke only — run before ANY DM/upload")
    args = ap.parse_args(argv)

    expect_audio = not args.no_audio

    if args.check_file:
        problems = smoke_check(Path(args.check_file), expect_audio)
        if problems:
            print("DELIVERY SMOKE FAIL — do not send:", file=sys.stderr)
            for p in problems:
                print(f"  - {p}", file=sys.stderr)
            return 1
        print(f"DELIVERY SMOKE PASS — {args.check_file}")
        return 0

    if not args.comp_id or not args.out:
        ap.error("comp_id and out are required (or use --check-file)")

    slug = comp_slug(args.comp_id)
    episode_dir = COMPOSER / "src" / slug
    if not episode_dir.is_dir():
        print(f"ERROR — episode dir not found: {episode_dir}", file=sys.stderr)
        return 2
    out_path = Path(args.out).resolve()
    out_path.parent.mkdir(parents=True, exist_ok=True)

    # 1. Gate first
    from tools.qc.episode_gate import validate_episode
    reasons = validate_episode(episode_dir, mode="agy") if args.agy else validate_episode(episode_dir)
    # Wave1 P0-2 item 6: enforce the runbook override discipline BEFORE any
    # gate verdict is softened — provenance codes are hard-refused, unlisted
    # codes are hard-refused, and every accepted override records WHO
    # approved it.
    requested = {c.strip() for c in args.override_codes.split(",") if c.strip()}
    overrides, non_overridable, unlisted = classify_overrides(requested)
    if non_overridable or unlisted:
        print("OVERRIDE REFUSED — provenance codes are never overridable; other codes need a runbook allowlist entry:", file=sys.stderr)
        for c in non_overridable:
            print(f"  - NON_OVERRIDABLE: {c} (fix the provenance: re-run writer/reviewer for the scene)", file=sys.stderr)
        for c in unlisted:
            print(f"  - NOT IN RUNBOOK ALLOWLIST: {c} (overridable codes: {', '.join(sorted(RUNBOOK_OVERRIDABLE_CODES)) or '-'})", file=sys.stderr)
        return 1
    issuer = resolve_override_issuer(args.override_issued_by)
    if overrides and not issuer:
        print("OVERRIDE REFUSED — every override must name its issuer: pass --override-issued-by <who> "
              f"(or set {OVERRIDE_ISSUER_ENV})", file=sys.stderr)
        return 1
    hard = [r for r in reasons if r["code"] not in overrides]
    overridden = [r for r in reasons if r["code"] in overrides]
    if hard:
        print("EPISODE GATE FAIL — render refused. Fix these first:", file=sys.stderr)
        for r in hard:
            print(f"  - {r['code']}: {r['message']}", file=sys.stderr)
        if reasons:
            print("(to iterate despite known codes: --override-codes code1,code2 --override-issued-by <who> — "
                  "runbook allowlist only, overrides are logged with their issuer)", file=sys.stderr)
        return 1
    if overridden:
        log = out_path.parent / "render_overrides.log"
        rec = log_override_event(log, comp_id=args.comp_id, issuer=issuer, overridden=overridden)
        print(f"WARNING — rendering with {len(overridden)} overridden gate code(s), issuer={issuer}, "
              f"logged to {log} ({rec['event_id']})")

    # 2. Idempotence guard
    fp = input_fingerprint(episode_dir, args.comp_id)
    marker = out_path.with_suffix(out_path.suffix + ".inputs.sha256")
    if not args.force and out_path.is_file() and marker.is_file():
        if marker.read_text(encoding="utf-8").strip() == fp:
            print(f"SKIP — inputs unchanged since last render, output exists: {out_path}")
            print("       (use --force to re-render anyway)")
            return 0

    # 3. Render (prefer per-episode index.ts/tsx entrypoint when present)
    local_entry = next(
        (p for p in (episode_dir / "index.ts", episode_dir / "index.tsx") if p.is_file()),
        None,
    )
    if local_entry is not None:
        cmd = [
            "npx", "remotion", "render",
            f"src/{slug}/{local_entry.name}",
            args.comp_id, str(out_path), "--overwrite", "--log=error",
        ]
    else:
        cmd = ["npx", "remotion", "render", args.comp_id, str(out_path), "--overwrite", "--log=error"]
    print(f"RENDER — {' '.join(cmd)}")
    t0 = time.time()
    proc = subprocess.run(cmd, cwd=str(COMPOSER), timeout=args.timeout)
    if proc.returncode != 0:
        print(f"ERROR — remotion render exit {proc.returncode}", file=sys.stderr)
        return 1
    marker.write_text(fp, encoding="utf-8")

    # 4. Post-render smoke
    problems = smoke_check(out_path, expect_audio)
    if problems:
        print("POST-RENDER SMOKE FAIL:", file=sys.stderr)
        for p in problems:
            print(f"  - {p}", file=sys.stderr)
        return 1
    info = ffprobe_streams(out_path)
    size_mb = out_path.stat().st_size / 1e6
    print(f"RENDER OK — {out_path} ({size_mb:.1f} MB, {info['duration']:.1f}s, v={info['video']} a={info['audio']}, {time.time()-t0:.0f}s)")
    return 0


if __name__ == "__main__":
    sys.exit(main())
