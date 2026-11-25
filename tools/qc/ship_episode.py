#!/usr/bin/env python3
"""ship_episode.py — One-command fail-closed episode build, QC, render, mux, and Gate C CLI.

Executes the deterministic Antigravity v3.0 ship pipeline in order, stopping on first failure:
  1. TypeScript check (`npx tsc --noEmit` in remotion-composer/)
  2. Source photo gate (`source_photo_gate.py`, when provenance.json exists or real photos declared)
  3. Fact whitelist gate (`fact_whitelist_gate.py`, when whitelist exists)
  4. Editorial language gate (`editorial_language_gate.py`, when editorial lane detected)
  5. Lossless audio pre-mix + mix validator (`mixdown.py --from-stems` + `tools.qc.mix_validator`)
  6. Guarded Remotion render (`render_episode.py <comp> <raw_mp4> --agy`)
  7. Lossless master audio mux + optional 720p preview (`mixdown.py --mux-only`)
  8. Gate C final verify (`gate_c_verify.py --project <proj>`)
"""
from __future__ import annotations

import argparse
import json
import subprocess
import sys
from pathlib import Path
from typing import Any, Callable

REPO_ROOT = Path(__file__).resolve().parents[2]
COMPOSER_DIR = REPO_ROOT / "remotion-composer"


def _run_step(name: str, cmd: list[str], *, cwd: Path = REPO_ROOT, runner=subprocess.run) -> dict[str, Any]:
    proc = runner(cmd, cwd=str(cwd), capture_output=True, text=True)
    if proc.returncode != 0:
        detail = (proc.stderr or proc.stdout or "").strip()[-1500:]
        raise RuntimeError(f"Step {name!r} failed (exit {proc.returncode}): {detail}")
    return {"step": name, "returncode": proc.returncode, "stdout": (proc.stdout or "").strip()}


def _has_editorial_lane(project_dir: Path) -> bool:
    for p in (
        project_dir / "scene_manifest.json",
        project_dir / "artifacts" / "scene_manifest.json",
        project_dir / "project.json",
    ):
        if not p.is_file():
            continue
        try:
            data = json.loads(p.read_text(encoding="utf-8"))
        except Exception:
            continue
        if isinstance(data, dict) and (
            data.get("lane") == "news-editorial-motion"
            or data.get("style_playbook") == "editorial-explainer-manifest"
        ):
            return True
    return False


def _has_whitelist(project_dir: Path) -> bool:
    if (project_dir / "artifacts" / "fact_whitelist.json").is_file() or (project_dir / "fact_whitelist.json").is_file():
        return True
    brief = project_dir / "research" / "research_brief.md"
    if brief.is_file():
        txt = brief.read_text(encoding="utf-8", errors="replace")
        return "fact_id" in txt and "display_string" in txt
    return False


def _has_source_photos(project_dir: Path) -> bool:
    if (project_dir / "assets" / "images" / "provenance.json").is_file():
        return True
    manifest = project_dir / "artifacts" / "asset_manifest.json"
    if manifest.is_file():
        try:
            data = json.loads(manifest.read_text(encoding="utf-8"))
            for item in data.get("assets", []):
                if str((item or {}).get("type") or "").lower() in {
                    "real_photo_spotlight", "source_photo", "archival_photo",
                }:
                    return True
        except Exception:
            pass
    return False


def ship_episode(
    *,
    project_dir: Path | str,
    comp_id: str,
    out_rel: str = "renders/final.mp4",
    raw_rel: str = "renders/raw_video.mp4",
    preview_rel: str | None = "renders/preview_720p.mp4",
    no_sfx: bool = False,
    skip_asr: bool = False,
    skip_tsc: bool = False,
    force: bool = False,
    python_exe: str = sys.executable,
    runner: Callable[..., Any] = subprocess.run,
) -> dict[str, Any]:
    from lib.channels import detect_project_channel, load_channel

    proj = Path(project_dir).resolve()
    if not proj.is_dir():
        raise FileNotFoundError(f"Project directory not found: {proj}")

    channel_id = detect_project_channel(proj)
    qc_gates: set[str] = set()
    if channel_id:
        try:
            ch_cfg = load_channel(channel_id)
            qc_gates = set((ch_cfg.get("pipeline") or {}).get("qc_gates") or [])
        except Exception:
            qc_gates = set()

    executed: list[str] = []

    if not skip_tsc:
        _run_step("tsc", ["npx", "tsc", "--noEmit"], cwd=COMPOSER_DIR, runner=runner)
        executed.append("tsc")

    if _has_source_photos(proj) or ("source_photo_gate" in qc_gates and (proj / "assets" / "images").is_dir()):
        _run_step(
            "source_photo_gate",
            [python_exe, str(REPO_ROOT / "tools/qc/source_photo_gate.py"), "--project", str(proj)],
            runner=runner,
        )
        executed.append("source_photo_gate")

    if _has_whitelist(proj):
        _run_step(
            "fact_whitelist_gate",
            [python_exe, str(REPO_ROOT / "tools/qc/fact_whitelist_gate.py"), "--project", str(proj)],
            runner=runner,
        )
        executed.append("fact_whitelist_gate")

    if _has_editorial_lane(proj) or "editorial_language_gate" in qc_gates:
        _run_step(
            "editorial_language_gate",
            [python_exe, str(REPO_ROOT / "tools/qc/editorial_language_gate.py"), "--project", str(proj)],
            runner=runner,
        )
        executed.append("editorial_language_gate")

    mix_cmd = [python_exe, str(REPO_ROOT / "tools/qc/mixdown.py"), "--from-stems", "--project", str(proj)]
    if no_sfx:
        mix_cmd.append("--no-sfx")
    _run_step("mixdown_premix", mix_cmd, runner=runner)
    executed.append("mixdown_premix")

    _run_step(
        "mix_validator",
        [python_exe, "-m", "tools.qc.mix_validator", str(proj / "audio_stems"), str(proj / "mix_profile.json")],
        runner=runner,
    )
    executed.append("mix_validator")

    raw_out = proj / raw_rel
    render_cmd = [
        python_exe, str(REPO_ROOT / "tools/qc/render_episode.py"),
        comp_id, str(raw_out), "--agy",
    ]
    if force:
        render_cmd.append("--force")
    _run_step("render_episode", render_cmd, runner=runner)
    executed.append("render_episode")

    final_out = proj / out_rel
    mux_cmd = [
        python_exe, str(REPO_ROOT / "tools/qc/mixdown.py"),
        "--mux-only", str(raw_out), "--project", str(proj), "--out", str(final_out),
    ]
    if preview_rel:
        mux_cmd.extend(["--preview-720p", str(proj / preview_rel)])
    _run_step("mixdown_mux", mux_cmd, runner=runner)
    executed.append("mixdown_mux")

    gate_c_cmd = [
        python_exe, str(REPO_ROOT / "tools/qc/gate_c_verify.py"),
        "--project", str(proj), "--video", str(final_out),
    ]
    if preview_rel:
        gate_c_cmd.extend(["--preview", str(proj / preview_rel)])
    if skip_asr:
        gate_c_cmd.append("--skip-asr")
    _run_step("gate_c_verify", gate_c_cmd, runner=runner)
    executed.append("gate_c_verify")

    gate_c_report = {}
    gc_path = proj / "qc" / "gate_c_final_verify.json"
    if gc_path.is_file():
        gate_c_report = json.loads(gc_path.read_text(encoding="utf-8"))

    return {
        "status": "pass",
        "project": proj.name,
        "channel": channel_id,
        "composition": comp_id,
        "steps_executed": executed,
        "output": str(final_out),
        "preview_720p": str(proj / preview_rel) if preview_rel else None,
        "gate_c": gate_c_report,
    }


def main(argv: list[str] | None = None) -> int:
    ap = argparse.ArgumentParser(description="Fail-closed end-to-end OpenMontage episode build, QC, render, and Gate C CLI.")
    ap.add_argument("--project", required=True, help="projects/<slug> directory")
    ap.add_argument("--comp", required=True, help="Remotion composition ID, e.g. <slug>-DRAFT")
    ap.add_argument("--out", default="renders/final.mp4", help="Final output relative to project dir")
    ap.add_argument("--raw-out", default="renders/raw_video.mp4", help="Intermediate raw render path relative to project dir")
    ap.add_argument("--preview-720p", default="renders/preview_720p.mp4", help="720p preview path (empty to disable)")
    ap.add_argument("--no-sfx", action="store_true", help="Declare no-sfx intent for mixdown")
    ap.add_argument("--skip-asr", action="store_true", help="Skip faster-whisper ASR in Gate C")
    ap.add_argument("--skip-tsc", action="store_true", help="Skip npx tsc --noEmit")
    ap.add_argument("--force", action="store_true", help="Force Remotion re-render even when fingerprint matches")
    args = ap.parse_args(argv)

    try:
        summary = ship_episode(
            project_dir=args.project,
            comp_id=args.comp,
            out_rel=args.out,
            raw_rel=args.raw_out,
            preview_rel=args.preview_720p or None,
            no_sfx=args.no_sfx,
            skip_asr=args.skip_asr,
            skip_tsc=args.skip_tsc,
            force=args.force,
        )
    except Exception as exc:
        print(json.dumps({"status": "fail", "error": str(exc)}, ensure_ascii=False, indent=2), file=sys.stderr)
        return 1

    print(json.dumps(summary, ensure_ascii=False, indent=2))
    return 0


if __name__ == "__main__":
    sys.exit(main())
