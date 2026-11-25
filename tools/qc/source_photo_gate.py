#!/usr/bin/env python3
"""source_photo_gate.py — Pre-authoring verification gate for harvested source photos.

Prevents non-photographic web hits (commemorative stamps, cartoons, logos, tiny
thumbnails, unverified files) from entering editorial news scenes disguised as
authentic press/archival photography.
"""

from __future__ import annotations

import argparse
import datetime
import hashlib
import json
import re
import sys
from pathlib import Path
from typing import Any

from PIL import Image, UnidentifiedImageError

ALLOWED_VISUAL_TYPES = frozenset({
    "photograph",
    "satellite",
    "historical_document",
    "official_chart",
})
DISALLOWED_VISUAL_TYPES = frozenset({
    "stamp",
    "cartoon",
    "illustration",
    "logo",
    "meme",
    "screenshot_ui",
})
MIN_LONG_EDGE_PX = 800
MIN_SUBJECT_NOTE_LEN = 12
TAKEN_YEAR_RE = re.compile(r"^(19\d{2}|20\d{2})(?:-\d{2}-\d{2})?")
SLUG_YEAR_RE = re.compile(r"(20\d{2})\d{4}")


def _infer_episode_year(project_dir: Path, explicit_year: int | None = None) -> int:
    if explicit_year is not None:
        return int(explicit_year)
    m = SLUG_YEAR_RE.search(project_dir.name)
    if m:
        return int(m.group(1))
    return datetime.date.today().year


def _resolve_contained(project_dir: Path, rel_path: str) -> Path | None:
    if not rel_path or not isinstance(rel_path, str):
        return None
    p = Path(rel_path)
    if p.is_absolute():
        return None
    root = project_dir.resolve()
    try:
        resolved = (root / p).resolve()
        resolved.relative_to(root)
    except ValueError:
        return None
    return resolved


def validate_source_photos(
    project_dir: Path | str,
    *,
    provenance_path: Path | str | None = None,
    episode_year: int | None = None,
    write_report: bool = True,
) -> dict[str, Any]:
    project_root = Path(project_dir)
    prov_path = Path(provenance_path) if provenance_path else (project_root / "assets" / "images" / "provenance.json")
    ep_year = _infer_episode_year(project_root, episode_year)

    errors: list[dict[str, Any]] = []
    warnings: list[str] = []
    entries_report: list[dict[str, Any]] = []

    if not prov_path.is_file():
        errors.append({
            "code": "SPG-PROVENANCE-MISSING",
            "file": str(prov_path),
            "message": f"provenance.json not found: {prov_path}",
        })
    else:
        try:
            raw = json.loads(prov_path.read_text(encoding="utf-8"))
        except (OSError, UnicodeDecodeError, json.JSONDecodeError) as exc:
            errors.append({
                "code": "SPG-PROVENANCE-UNPARSEABLE",
                "file": str(prov_path),
                "message": f"failed to parse provenance.json: {exc}",
            })
            raw = None

        if raw is not None:
            if not isinstance(raw, list) or len(raw) == 0:
                errors.append({
                    "code": "SPG-PROVENANCE-EMPTY",
                    "file": str(prov_path),
                    "message": "provenance.json must be a non-empty JSON array of source photo entries",
                })
            else:
                for idx, entry in enumerate(raw):
                    if not isinstance(entry, dict):
                        errors.append({
                            "code": "SPG-ENTRY-INVALID",
                            "index": idx,
                            "message": f"provenance[{idx}] must be a JSON object",
                        })
                        continue
                    rel_file = str(entry.get("file") or "")
                    item_errors: list[dict[str, Any]] = []
                    needs_archive_badge = False
                    width = 0
                    height = 0
                    file_sha256 = ""

                    resolved = _resolve_contained(project_root, rel_file)
                    if resolved is None:
                        item_errors.append({
                            "code": "SPG-PATH-ESCAPE",
                            "file": rel_file,
                            "message": f"provenance[{idx}] file path missing or escapes project root: {rel_file!r}",
                        })
                    elif not resolved.is_file():
                        item_errors.append({
                            "code": "SPG-FILE-MISSING",
                            "file": rel_file,
                            "message": f"source photo missing on disk: {resolved}",
                        })
                    else:
                        file_sha256 = hashlib.sha256(resolved.read_bytes()).hexdigest()
                        declared_sha = str(entry.get("sha256") or "").strip().lower()
                        if declared_sha and declared_sha != file_sha256:
                            item_errors.append({
                                "code": "SPG-HASH-MISMATCH",
                                "file": rel_file,
                                "message": (
                                    f"{rel_file} sha256 mismatch: provenance {declared_sha[:12]}… "
                                    f"!= on-disk {file_sha256[:12]}… (re-verify via Vision)"
                                ),
                            })
                        try:
                            with Image.open(resolved) as im:
                                im.verify()
                            with Image.open(resolved) as im2:
                                width, height = im2.size
                        except (OSError, UnidentifiedImageError, ValueError) as exc:
                            item_errors.append({
                                "code": "SPG-IMAGE-CORRUPT",
                                "file": rel_file,
                                "message": f"failed to decode image {rel_file!r}: {exc}",
                            })
                        else:
                            if max(width, height) < MIN_LONG_EDGE_PX:
                                item_errors.append({
                                    "code": "SPG-LOW-RES",
                                    "file": rel_file,
                                    "message": f"{rel_file} resolution {width}x{height} below minimum {MIN_LONG_EDGE_PX}px long edge",
                                })

                    for req_field in ("license", "credit_line"):
                        val = str(entry.get(req_field) or "").strip()
                        if not val:
                            item_errors.append({
                                "code": "SPG-METADATA-MISSING",
                                "file": rel_file,
                                "message": f"provenance[{idx}] missing required field {req_field!r}",
                            })

                    source_url = str(entry.get("page") or entry.get("source_url") or "").strip()
                    if not source_url:
                        item_errors.append({
                            "code": "SPG-METADATA-MISSING",
                            "file": rel_file,
                            "message": f"provenance[{idx}] missing 'page' or 'source_url'",
                        })

                    taken_raw = str(entry.get("taken") or "").strip()
                    m_year = TAKEN_YEAR_RE.match(taken_raw)
                    if not m_year:
                        item_errors.append({
                            "code": "SPG-TAKEN-DATE-INVALID",
                            "file": rel_file,
                            "message": f"provenance[{idx}] 'taken' must start with YYYY or YYYY-MM-DD (got {taken_raw!r})",
                        })
                    else:
                        taken_year = int(m_year.group(1))
                        if taken_year < ep_year:
                            needs_archive_badge = True
                            warnings.append(
                                f"{rel_file}: taken in {taken_year} (< episode year {ep_year}) — requires visible archive year badge (ẢNH TƯ LIỆU {taken_year})"
                            )

                    if entry.get("vision_verified") is not True:
                        item_errors.append({
                            "code": "SPG-VISION-UNVERIFIED",
                            "file": rel_file,
                            "message": f"provenance[{idx}] requires vision_verified: true after inspecting the actual image",
                        })

                    visual_type = str(entry.get("visual_type") or "").strip().lower()
                    if visual_type in DISALLOWED_VISUAL_TYPES or visual_type not in ALLOWED_VISUAL_TYPES:
                        item_errors.append({
                            "code": "SPG-VISUAL-TYPE-REJECTED",
                            "file": rel_file,
                            "message": (
                                f"provenance[{idx}] visual_type={visual_type!r} rejected; "
                                f"real photo gate requires one of {sorted(ALLOWED_VISUAL_TYPES)}"
                            ),
                        })

                    note = str(entry.get("subject_match_note") or "").strip()
                    if len(note) < MIN_SUBJECT_NOTE_LEN:
                        item_errors.append({
                            "code": "SPG-SUBJECT-NOTE-MISSING",
                            "file": rel_file,
                            "message": f"provenance[{idx}] requires subject_match_note (>= {MIN_SUBJECT_NOTE_LEN} chars describing image contents)",
                        })

                    errors.extend(item_errors)
                    entries_report.append({
                        "file": rel_file,
                        "sha256": file_sha256,
                        "width": width,
                        "height": height,
                        "visual_type": visual_type,
                        "vision_verified": entry.get("vision_verified") is True,
                        "needs_archive_year_badge": needs_archive_badge,
                        "pass": len(item_errors) == 0,
                        "errors": item_errors,
                    })

    report = {
        "gate": "source-photo-gate",
        "project": project_root.name,
        "episode_year": ep_year,
        "pass": len(errors) == 0,
        "checked": len(entries_report),
        "blocked": len(errors),
        "warnings": warnings,
        "errors": errors,
        "entries": entries_report,
    }
    if write_report and project_root.is_dir():
        qc_out = project_root / "qc" / "source_photo_gate.json"
        qc_out.parent.mkdir(parents=True, exist_ok=True)
        qc_out.write_text(json.dumps(report, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
    return report


def main(argv: list[str] | None = None) -> int:
    ap = argparse.ArgumentParser(description="Pre-authoring vision & resolution gate for harvested source photos")
    ap.add_argument("--project", required=True, help="projects/<slug> directory")
    ap.add_argument("--provenance", default=None, help="override path to provenance.json")
    ap.add_argument("--episode-year", type=int, default=None, help="override episode year for archive badge check")
    args = ap.parse_args(argv)

    project_dir = Path(args.project)
    if not project_dir.is_dir():
        print(f"ERROR: project directory not found: {project_dir}", file=sys.stderr)
        return 2

    report = validate_source_photos(
        project_dir,
        provenance_path=args.provenance,
        episode_year=args.episode_year,
        write_report=True,
    )
    if report["pass"]:
        print(f"PASS — source-photo-gate ({report['checked']} verified, {len(report['warnings'])} warning(s))")
        for w in report["warnings"]:
            print(f"  WARN: {w}")
        return 0
    print(f"FAIL — source-photo-gate rejected ({report['blocked']} error(s))", file=sys.stderr)
    for err in report["errors"]:
        print(f"  - {err['code']}: {err['message']}", file=sys.stderr)
    return 1


if __name__ == "__main__":
    sys.exit(main())
