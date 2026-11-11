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
      [--timeout 1800] [--no-audio] [--override-codes code1,code2]
  .venv/bin/python tools/qc/render_episode.py --check-file <mp4> [--no-audio]
"""
from __future__ import annotations
import argparse, hashlib, json, subprocess, sys, time
from pathlib import Path

REPO_ROOT = Path(__file__).resolve().parents[2]
COMPOSER = REPO_ROOT / "remotion-composer"
if str(REPO_ROOT) not in sys.path:
    sys.path.insert(0, str(REPO_ROOT))


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
            if "node_modules" in p.parts:
                continue
            h.update(str(p.relative_to(REPO_ROOT)).encode())
            h.update(hashlib.sha256(p.read_bytes()).digest())

    absorb_dir(episode_dir)
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
    ap.add_argument("--override-codes", default="", help="comma-separated episode_gate codes to override (LOGGED, for iteration only)")
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
    reasons = validate_episode(episode_dir)
    overrides = {c.strip() for c in args.override_codes.split(",") if c.strip()}
    hard = [r for r in reasons if r["code"] not in overrides]
    overridden = [r for r in reasons if r["code"] in overrides]
    if hard:
        print("EPISODE GATE FAIL — render refused. Fix these first:", file=sys.stderr)
        for r in hard:
            print(f"  - {r['code']}: {r['message']}", file=sys.stderr)
        if reasons:
            print("(to iterate despite known codes: --override-codes code1,code2 — overrides are logged)", file=sys.stderr)
        return 1
    if overridden:
        log = out_path.parent / "render_overrides.log"
        with log.open("a", encoding="utf-8") as f:
            f.write(f"{time.strftime('%Y-%m-%d %H:%M:%S')} {args.comp_id} overrides: " +
                    "; ".join(f"{r['code']}: {r['message']}" for r in overridden) + "\n")
        print(f"WARNING — rendering with {len(overridden)} overridden gate code(s), logged to {log}")

    # 2. Idempotence guard
    fp = input_fingerprint(episode_dir, args.comp_id)
    marker = out_path.with_suffix(out_path.suffix + ".inputs.sha256")
    if not args.force and out_path.is_file() and marker.is_file():
        if marker.read_text(encoding="utf-8").strip() == fp:
            print(f"SKIP — inputs unchanged since last render, output exists: {out_path}")
            print("       (use --force to re-render anyway)")
            return 0

    # 3. Render
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
