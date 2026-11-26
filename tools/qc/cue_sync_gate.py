#!/usr/bin/env python3
"""cue_sync_gate.py — Mechanical QC gate verifying speech-locked animation cues.

Checks Remotion scene TSX files (and Episode.tsx) against public/<slug>/cues.json
(or artifacts/aligned_cues.json):
  1. Every cueFrame("section", "phrase", ...) call MUST resolve to a spoken phrase
     in cues.json — unresolved cues BLOCK fail-closed (CSG-UNRESOLVED-CUE).
  2. Hardcoded numeric enter/enterFrame > 30 frames not produced by cueFrame()
     emit warnings (CSG-HARDCODED-LATE-ENTER), or block when --strict-no-magic is set.
  3. Writes audit report to <project>/qc/cue_sync.json.
"""
from __future__ import annotations

import argparse
import json
import re
import sys
import unicodedata
from pathlib import Path
from typing import Any

REPO_ROOT = Path(__file__).resolve().parents[2]
if str(REPO_ROOT) not in sys.path:
    sys.path.insert(0, str(REPO_ROOT))

CSG_UNRESOLVED_CUE = "CSG-UNRESOLVED-CUE"
CSG_HARDCODED_LATE_ENTER = "CSG-HARDCODED-LATE-ENTER"

CUE_CALL_RE = re.compile(
    r"""cueFrame\(\s*["']([^"']+)["']\s*,\s*["']([^"']+)["'](?:\s*,\s*([^,)]+))?(?:\s*,\s*([^)]+))?\s*\)"""
)
HARDCODED_ENTER_RE = re.compile(r"\b(?:enter|enterFrame)\s*[:=]\s*\{?\s*(\d+)\s*\}?")


def normalize_cue_token(raw: str) -> str:
    nfd = unicodedata.normalize("NFD", raw.lower())
    stripped = "".join(ch for ch in nfd if unicodedata.category(ch) != "Mn")
    stripped = stripped.replace("đ", "d")
    return re.sub(r"[^a-z0-9]", "", stripped)


def _tokens_match(token_norm: str, needle_norm: str) -> bool:
    if not token_norm or not needle_norm:
        return False
    if token_norm == needle_norm:
        return True
    if len(needle_norm) >= 2 and needle_norm in token_norm:
        return True
    if len(token_norm) >= 2 and token_norm in needle_norm:
        return True
    return False


def resolve_cue_token(
    cues: dict[str, list[dict[str, Any]]],
    section_id: str,
    phrase: str,
    lead_frames: int = 3,
) -> dict[str, Any] | None:
    tokens = cues.get(section_id.lower()) or cues.get(section_id)
    if not tokens:
        return None
    needles = [normalize_cue_token(p) for p in phrase.split() if normalize_cue_token(p)]
    if not needles:
        return None
    hay = [normalize_cue_token(str(t.get("word", ""))) for t in tokens]
    for i in range(0, len(hay) - len(needles) + 1):
        if all(_tokens_match(hay[i + j], needles[j]) for j in range(len(needles))):
            tok = tokens[i]
            return {
                "matched_frame": max(0, int(tok["start_frame"]) - lead_frames),
                "word_start_frame": int(tok["start_frame"]),
                "matched_seconds": float(tok["start"]),
                "matched_word": str(tok["word"]),
            }
    return None


def _resolve_cues_path(project_dir: Path) -> Path | None:
    slug = project_dir.name
    candidates = [
        REPO_ROOT / "remotion-composer" / "public" / slug / "cues.json",
        project_dir / "artifacts" / "aligned_cues.json",
    ]
    for p in candidates:
        if p.is_file():
            return p
    return None


def _resolve_comp_dir(project_dir: Path, composer_src_root: Path | None = None) -> Path:
    base = composer_src_root or (REPO_ROOT / "remotion-composer" / "src")
    return base / project_dir.name


def run_cue_sync_gate(
    project_dir: Path | str,
    *,
    strict_no_magic: bool = False,
    composer_src_root: Path | None = None,
    cues_override: Path | None = None,
) -> dict[str, Any]:
    proj = Path(project_dir).resolve()
    cues_path = cues_override or _resolve_cues_path(proj)
    if cues_path is None or not cues_path.is_file():
        return {
            "gate": "cue_sync_gate",
            "status": "skip",
            "reason": "no cues.json or aligned_cues.json found",
            "resolved": [],
            "errors": [],
            "warnings": [],
        }

    cues_data = json.loads(cues_path.read_text(encoding="utf-8"))
    cues_map: dict[str, list[dict[str, Any]]] = cues_data.get("cues") or {}

    comp_dir = _resolve_comp_dir(proj, composer_src_root)
    tsx_files: list[Path] = []
    scenes_dir = comp_dir / "scenes"
    if scenes_dir.is_dir():
        tsx_files.extend(sorted(scenes_dir.glob("*.tsx")))
    ep = comp_dir / "Episode.tsx"
    if ep.is_file():
        tsx_files.append(ep)

    resolved: list[dict[str, Any]] = []
    errors: list[dict[str, Any]] = []
    warnings: list[dict[str, Any]] = []

    for tsx in tsx_files:
        text = tsx.read_text(encoding="utf-8")
        for m in CUE_CALL_RE.finditer(text):
            sec, phrase, _fb, lead_raw = m.groups()
            lead = 3
            if lead_raw and lead_raw.strip().isdigit():
                lead = int(lead_raw.strip())
            hit = resolve_cue_token(cues_map, sec, phrase, lead_frames=lead)
            if hit is None:
                errors.append({
                    "code": CSG_UNRESOLVED_CUE,
                    "file": tsx.name,
                    "section": sec,
                    "phrase": phrase,
                    "message": f"{tsx.name}: cueFrame({sec!r}, {phrase!r}) did not match any spoken words in cues.json",
                })
            else:
                resolved.append({
                    "file": tsx.name,
                    "section": sec,
                    "phrase": phrase,
                    **hit,
                })

        for m in HARDCODED_ENTER_RE.finditer(text):
            val = int(m.group(1))
            if val > 30:
                entry = {
                    "code": CSG_HARDCODED_LATE_ENTER,
                    "file": tsx.name,
                    "frame": val,
                    "message": f"{tsx.name}: hardcoded enter/enterFrame={val} (>30f) should use cueFrame() for speech lock",
                }
                if strict_no_magic:
                    errors.append(entry)
                else:
                    warnings.append(entry)

    status = "fail" if errors else "pass"
    report = {
        "gate": "cue_sync_gate",
        "status": status,
        "cues_path": str(cues_path),
        "files_checked": [f.name for f in tsx_files],
        "resolved_count": len(resolved),
        "resolved": resolved,
        "errors": errors,
        "warnings": warnings,
    }
    qc_dir = proj / "qc"
    qc_dir.mkdir(parents=True, exist_ok=True)
    (qc_dir / "cue_sync.json").write_text(json.dumps(report, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
    return report


def main(argv: list[str] | None = None) -> int:
    ap = argparse.ArgumentParser(description="Verify Remotion cueFrame() references against aligned spoken cues.")
    ap.add_argument("--project", required=True, help="projects/<slug> or projects/<channel>/<slug> directory")
    ap.add_argument("--strict-no-magic", action="store_true", help="Fail on hardcoded enter/enterFrame > 30 frames")
    args = ap.parse_args(argv)

    rep = run_cue_sync_gate(args.project, strict_no_magic=args.strict_no_magic)
    if rep["status"] == "skip":
        print(f"SKIP — cue-sync-gate ({rep['reason']})")
        return 0
    if rep["status"] == "fail":
        print(f"FAIL — cue-sync-gate ({len(rep['errors'])} error(s), {len(rep['warnings'])} warning(s))", file=sys.stderr)
        for err in rep["errors"]:
            print(f"  ERROR [{err['code']}] {err['message']}", file=sys.stderr)
        return 1
    print(f"PASS — cue-sync-gate ({rep['resolved_count']} cue(s) verified, {len(rep['warnings'])} warning(s))")
    for w in rep["warnings"]:
        print(f"  WARN [{w['code']}] {w['message']}")
    return 0


if __name__ == "__main__":
    sys.exit(main())
