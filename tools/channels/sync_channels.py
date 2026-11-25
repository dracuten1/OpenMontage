#!/usr/bin/env python3
"""sync_channels.py — Validate channel packs, stage shared/brand assets, and run cross-channel Remotion checks."""

from __future__ import annotations

import argparse
import json
import re
import shutil
import subprocess
import sys
from pathlib import Path
from typing import Any

REPO_ROOT = Path(__file__).resolve().parents[2]
if str(REPO_ROOT) not in sys.path:
    sys.path.insert(0, str(REPO_ROOT))

from lib.channels import list_channels, load_channel
from lib.paths import CHANNELS_DIR

STAGE_IGNORE_EXTS = {".blend", ".blend1", ".md", ".txt", ".py"}


def _copy_dir_files(src: Path, dst: Path) -> int:
    if not src.is_dir():
        return 0
    copied = 0
    for item in src.iterdir():
        if item.name.startswith(".") or item.is_dir():
            continue
        if item.suffix.lower() in STAGE_IGNORE_EXTS:
            continue
        dst.mkdir(parents=True, exist_ok=True)
        target = dst / item.name
        if not target.exists() or item.stat().st_mtime > target.stat().st_mtime or item.stat().st_size != target.stat().st_size:
            shutil.copy2(item, target)
            copied += 1
    return copied


def sync_channels(
    *,
    channel: str | None = None,
    check: bool = True,
    stage_assets: bool = False,
    run_tests: bool = False,
    channels_dir: Path | None = None,
    composer_dir: Path | None = None,
) -> dict[str, Any]:
    ch_root = Path(channels_dir) if channels_dir is not None else CHANNELS_DIR
    comp_root = Path(composer_dir) if composer_dir is not None else (REPO_ROOT / "remotion-composer")

    ids = [channel] if channel else list_channels(ch_root)
    if not ids:
        return {
            "status": "fail",
            "errors": [f"No channels found under {ch_root}"],
            "channels": [],
        }

    registry_path = comp_root / "src" / "channels" / "registry.ts"
    registry_text = registry_path.read_text(encoding="utf-8") if registry_path.is_file() else ""

    errors: list[str] = []
    results: list[dict[str, Any]] = []

    for cid in ids:
        ch_dir = ch_root / cid
        ch_info: dict[str, Any] = {"id": cid, "valid": False, "staged_files": 0}
        try:
            cfg = load_channel(cid, channels_dir=ch_root, validate=True)
            rules_p = ch_dir / cfg["editorial_rules"]
            if check and not rules_p.is_file():
                raise FileNotFoundError(f"Missing editorial_rules file: {rules_p}")

            theme_id = (cfg.get("theme") or {}).get("remotion_theme_id")
            if check and registry_text:
                if not re.search(rf'["\']{re.escape(str(theme_id))}["\']\s*:', registry_text):
                    raise ValueError(
                        f"Theme {theme_id!r} not registered in {registry_path}"
                    )

            if stage_assets:
                staged = 0
                pub_ch = comp_root / "public" / "channels" / cid
                for sub in ("brand", "textures", "characters"):
                    staged += _copy_dir_files(ch_dir / "assets" / sub, pub_ch / sub)
                if cid == "ky-chu-diem-tin":
                    staged += _copy_dir_files(ch_dir / "assets" / "brand", comp_root / "public" / "brand")
                ch_info["staged_files"] = staged

            ch_info["valid"] = True
            ch_info["platform"] = cfg["platform"]
            ch_info["aspect_ratio"] = cfg["canvas"]["aspect_ratio"]
        except Exception as exc:
            errors.append(f"{cid}: {exc}")
            ch_info["error"] = str(exc)
        results.append(ch_info)

    test_runs: list[dict[str, Any]] = []
    if run_tests and not errors:
        for label, cmd in (
            ("tsc", ["npx", "tsc", "--noEmit"]),
            ("vitest", ["npx", "vitest", "run"]),
        ):
            proc = subprocess.run(cmd, cwd=str(comp_root), capture_output=True, text=True)
            test_runs.append({
                "step": label,
                "returncode": proc.returncode,
            })
            if proc.returncode != 0:
                detail = (proc.stderr or proc.stdout or "").strip()[-1000:]
                errors.append(f"{label} failed: {detail}")

    return {
        "status": "ok" if not errors else "fail",
        "channels": results,
        "tests": test_runs,
        "errors": errors,
    }


def main(argv: list[str] | None = None) -> int:
    ap = argparse.ArgumentParser(description="Validate channels, stage assets, and run Remotion cross-channel checks.")
    ap.add_argument("--channel", default=None, help="Validate/sync a single channel")
    ap.add_argument("--check", action="store_true", default=True, help="Validate channel.yaml & registry (default: on)")
    ap.add_argument("--stage-assets", action="store_true", help="Stage channel brand/character/texture assets into remotion-composer/public/")
    ap.add_argument("--run-tests", action="store_true", help="Run tsc --noEmit and vitest across all channels")
    ap.add_argument("--channels-dir", default=None)
    ap.add_argument("--composer-dir", default=None)
    args = ap.parse_args(argv)

    report = sync_channels(
        channel=args.channel,
        check=args.check,
        stage_assets=args.stage_assets,
        run_tests=args.run_tests,
        channels_dir=Path(args.channels_dir) if args.channels_dir else None,
        composer_dir=Path(args.composer_dir) if args.composer_dir else None,
    )
    print(json.dumps(report, ensure_ascii=False, indent=2))
    return 0 if report["status"] == "ok" else 1


if __name__ == "__main__":
    sys.exit(main())
