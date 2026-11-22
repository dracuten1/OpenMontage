#!/usr/bin/env python3
"""fact_whitelist_gate.py — Mechanical closed fact-whitelist gate (Research v2).

Prevents unverified or unwhitelisted numeric claims and discrepancy-excluded
strings from leaking into Remotion scene TSX files.

Sources (first available wins):
  1. ``<project>/artifacts/fact_whitelist.json``
  2. ``<project>/fact_whitelist.json``
  3. ``<project>/research/research_brief.md`` (Research v2 Markdown fact_table)

If none of these v2 whitelist surfaces exist, the gate SKIPs cleanly (exit 0)
so legacy projects are unaffected. When present, every printed numeric token in
UI text or chart data props inside ``S*.tsx`` / ``Episode.tsx`` must match a
whitelisted ``display_string`` whose ``allowed_scenes`` permits that scene.
"""

from __future__ import annotations

import argparse
import json
import re
import sys
from pathlib import Path
from typing import Any

REPO_ROOT = Path(__file__).resolve().parents[2]
if str(REPO_ROOT) not in sys.path:
    sys.path.insert(0, str(REPO_ROOT))

FWG_UNWHITELISTED_NUMBER = "FWG-UNWHITELISTED-NUMBER"
FWG_BANNED_STRING = "FWG-BANNED-STRING"
FWG_EMPTY_WHITELIST = "FWG-EMPTY-WHITELIST"
FWG_SCENE_COUNT_MISMATCH = "FWG-SCENE-COUNT-MISMATCH"

DISALLOWED_VERIFICATIONS = frozenset({"DISCREPANCY-EXCLUDED", "PULSE_ONLY", "REJECTED"})

SCENE_STEM_RE = re.compile(r"^(?:s|scene[-_]?)(\d+)$", re.IGNORECASE)
PACKET_V2_RE = re.compile(r"(?m)^\s*packet_version\s*:\s*2\b")
SCENE_COUNT_EXACT_RE = re.compile(r"(?m)^\s*scene_count_exact\s*:\s*(\d+)\b")

# Strip comments, imports, and CSS/style non-text props before extracting UI strings
COMMENT_BLOCK_RE = re.compile(r"/\*.*?\*/", re.DOTALL)
COMMENT_LINE_RE = re.compile(r"(?m)//.*$")
IMPORT_LINE_RE = re.compile(r"(?m)^\s*import\b.*?;\s*$")
STATIC_FILE_RE = re.compile(r"staticFile\([^)]*\)")
HEX_COLOR_RE = re.compile(r"#[0-9A-Fa-f]{3,8}\b")
RGBA_RE = re.compile(r"rgba?\([^)]+\)")

# CSS/layout/technical props whose string/number values are styling, not displayed facts
NON_FACT_PROP_RE = re.compile(
    r"""(?x)
    \b(?:
        fontFamily|fontSize|fontWeight|lineHeight|letterSpacing|
        color|backgroundColor|background|border(?:Top|Bottom|Left|Right)?|
        borderRadius|boxShadow|textShadow|padding(?:Top|Bottom|Left|Right)?|
        margin(?:Top|Bottom|Left|Right)?|width|height|minWidth|maxWidth|
        minHeight|maxHeight|top|left|right|bottom|inset|gap|zIndex|opacity|
        transform|transformOrigin|clipPath|objectPosition|stroke(?:Width|Dasharray|Dashoffset|Linecap|Linejoin)?|
        fill|viewBox|d|cx|cy|r|x|y|x1|x2|y1|y2|rx|refX|refY|markerWidth|markerHeight|
        gridTemplateColumns|flex|display|position|alignItems|justifyContent|
        whiteSpace|overflow|overflowWrap|pointerEvents|boxSizing|textAlign|textTransform|
        sceneId|id|key|className|name|secId|src|stingSrc|
        enterFrame|startFrame|endFrame|durationFrames|durationInFrames|from|
        drawFrames|growFrames|fadeInFrames|fadeOutFrames|quoteEnterFrame|settleAllFrame|
        fps|scale|endScale|center|endCenter|coords|waypoints|tiltDeg|detail|
        labelOffset|highlightIso|volume|stingVolume|playbackRate|
        archiveLabel|creditLine|photoCredit|source|highlightColor|accentColor|lineColor|
        trackColor|barColor|labelColor|valueColor|treatment|accent|aspect|
        data-[a-z0-9-]+
    )\s*[:=]\s*
    (?:
        \{[^}]*\}
        |"(?:\\.|[^"\\])*"
        |'(?:\\.|[^'\\])*'
        |`(?:\\.|[^`\\])*`
    )
    """
)

# Extract remaining string literals and JSX text content
STRING_LITERAL_RE = re.compile(r'"((?:\\.|[^"\\])*)"|\'((?:\\.|[^\'\\])*)\'|`((?:\\.|[^`\\])*)`')
JSX_TEXT_RE = re.compile(r">([^<>{}]+)<")
CHART_VALUE_RE = re.compile(r"\bvalue\s*:\s*(-?\d+(?:\.\d+)?)\b")

# Numeric tokens in displayed text (supports Vietnamese 136,2 or 25.920 and decimals/percents)
NUMBER_TOKEN_RE = re.compile(r"(?<![A-Za-z0-9_#])\d+(?:[.,]\d+)*(?:\s*%)?(?![A-Za-z0-9_])")

# Pure structural/CSS/formatting tokens that are not factual claims
CSS_OR_STRUCTURAL_TEXT_RE = re.compile(
    r"^(?:\d+(?:px|em|rem|%|deg|ms|s|fr|vw|vh)|"
    r"(?:solid|dashed|dotted|none|auto|center|clamp|rotate|scale|translate[XY]?)|"
    r"\d+x\d+|\d+:\d+|[23]\.?5?[Dd])$",
    re.IGNORECASE,
)
STRUCTURAL_PHRASE_RE = re.compile(
    r"\b(?:TIN|PHẦN|BƯỚC|MỤC|CẢNH|SCENE|EP|PART|STEP|TOP)\s+\d+\b|"
    r"\b(?:S\d{1,2}|9x16|16x9|3D|2\.5D|2D|KÝ CHỦ ĐIỂM TIN)\b|"
    r"(?<!\d)(?:[0-2]?\d|3[01])/(?:0?\d|1[0-2])(?!\d|/)",
    re.IGNORECASE,
)


def normalize_scene_id(raw: str) -> str:
    """Normalize scene IDs like 'S2', 'scene-2', 'S02' -> 'S02'; keep '*' unchanged."""
    s = str(raw or "").strip()
    if s == "*" or s.upper() == "ALL":
        return "*"
    m = SCENE_STEM_RE.match(s)
    if m:
        return f"S{int(m.group(1)):02d}"
    return s.upper()


def _parse_allowed_scenes(raw: Any) -> list[str]:
    if raw is None:
        return ["*"]
    if isinstance(raw, list):
        items = [normalize_scene_id(str(x)) for x in raw if str(x).strip()]
        return items or ["*"]
    text = str(raw).strip()
    if not text or text == "*":
        return ["*"]
    parts = [normalize_scene_id(p) for p in re.split(r"[,;/|\s]+", text) if p.strip()]
    return parts or ["*"]


def _clean_cell(val: str) -> str:
    s = val.strip()
    if len(s) >= 2 and s[0] == "`" and s[-1] == "`":
        s = s[1:-1].strip()
    if len(s) >= 2 and ((s[0] == '"' and s[-1] == '"') or (s[0] == "'" and s[-1] == "'")):
        s = s[1:-1].strip()
    return s


def _parse_markdown_v2_brief(brief_path: Path) -> dict[str, Any] | None:
    try:
        text = brief_path.read_text(encoding="utf-8")
    except OSError:
        return None

    is_v2 = bool(PACKET_V2_RE.search(text))
    facts: list[dict[str, Any]] = []
    banned: list[str] = []
    scene_count_exact: int | None = None

    m_sc = SCENE_COUNT_EXACT_RE.search(text)
    if m_sc:
        scene_count_exact = int(m_sc.group(1))

    # Parse markdown tables with fact_id and display_string headers
    lines = text.splitlines()
    i = 0
    while i < len(lines):
        line = lines[i].strip()
        if line.startswith("|") and "fact_id" in line.lower() and "display_string" in line.lower():
            is_v2 = True
            headers = [h.strip().lower().split("(")[0].strip() for h in line.strip("|").split("|")]
            i += 1
            if i < len(lines) and set(lines[i].strip().replace("|", "").replace("-", "").replace(":", "").strip()) == set():
                i += 1
            while i < len(lines) and lines[i].strip().startswith("|"):
                row_cells = [_clean_cell(c) for c in lines[i].strip().strip("|").split("|")]
                if len(row_cells) >= len(headers):
                    row = dict(zip(headers, row_cells))
                    disp = row.get("display_string", "").strip()
                    fid = row.get("fact_id", "").strip()
                    verif = row.get("verification", "CORROBORATED").strip().upper()
                    allowed = _parse_allowed_scenes(row.get("allowed_scenes", "*"))
                    narration_form = row.get("narration_form", "")
                    if disp and fid:
                        facts.append({
                            "fact_id": fid,
                            "display_string": disp,
                            "verification": verif,
                            "allowed_scenes": allowed,
                            "narration_form": narration_form,
                        })
                i += 1
            continue
        i += 1

    # Parse banned_strings: YAML inline list or bullet list
    banned_inline = re.search(r"(?m)^\s*banned_strings\s*:\s*\[([^\]]*)\]", text)
    if banned_inline:
        for item in banned_inline.group(1).split(","):
            cleaned = _clean_cell(item)
            if cleaned:
                banned.append(cleaned)

    banned_block = re.search(r"(?is)(?:^|\n)#{1,4}\s*banned_strings[^\n]*\n(.*?)(?=\n#{1,4}\s|\Z)", text)
    if banned_block:
        for b_line in banned_block.group(1).splitlines():
            b_line = b_line.strip()
            if b_line.startswith(("-", "*")):
                token = _clean_cell(b_line.lstrip("-* ").split("—")[0].split("(")[0].strip())
                if token and token != "—":
                    banned.append(token)

    if not is_v2 and not facts:
        return None

    return {
        "source": str(brief_path),
        "scene_count_exact": scene_count_exact,
        "facts": facts,
        "banned_strings": sorted(set(banned)),
    }


def load_fact_whitelist(project_dir: Path) -> dict[str, Any] | None:
    """Load structured whitelist from artifacts/fact_whitelist.json or v2 research_brief.md."""
    for candidate in (
        project_dir / "artifacts" / "fact_whitelist.json",
        project_dir / "fact_whitelist.json",
    ):
        if candidate.is_file():
            raw = json.loads(candidate.read_text(encoding="utf-8"))
            if isinstance(raw, list):
                facts_raw = raw
                banned = []
                scene_count_exact = None
            elif isinstance(raw, dict):
                facts_raw = raw.get("facts", [])
                banned = [str(x).strip() for x in raw.get("banned_strings", []) if str(x).strip()]
                sc = raw.get("scene_count_exact")
                scene_count_exact = int(sc) if isinstance(sc, int) else None
            else:
                raise ValueError(f"{candidate} must be a JSON object or array")
            facts: list[dict[str, Any]] = []
            for item in facts_raw:
                if not isinstance(item, dict):
                    continue
                disp = _clean_cell(str(item.get("display_string") or ""))
                if not disp:
                    continue
                facts.append({
                    "fact_id": str(item.get("fact_id") or "").strip(),
                    "display_string": disp,
                    "verification": str(item.get("verification") or "CORROBORATED").strip().upper(),
                    "allowed_scenes": _parse_allowed_scenes(item.get("allowed_scenes")),
                    "narration_form": str(item.get("narration_form") or ""),
                })
            return {
                "source": str(candidate),
                "scene_count_exact": scene_count_exact,
                "facts": facts,
                "banned_strings": sorted(set(banned)),
            }

    brief_path = project_dir / "research" / "research_brief.md"
    if brief_path.is_file():
        return _parse_markdown_v2_brief(brief_path)
    return None


def _discover_scene_files(project_dir: Path, scenes_dir: Path | None = None) -> list[tuple[str, Path]]:
    candidates: list[Path] = []
    if scenes_dir is not None:
        candidates.append(scenes_dir)
    else:
        slug = project_dir.name
        candidates.extend([
            REPO_ROOT / "remotion-composer" / "src" / slug / "scenes",
            project_dir / "scenes",
        ])

    for sdir in candidates:
        if sdir.is_dir():
            files = sorted(
                p for p in sdir.glob("*.tsx")
                if not p.name.endswith(".test.tsx") and SCENE_STEM_RE.match(p.stem)
            )
            if files:
                return [(normalize_scene_id(p.stem), p) for p in files]

    # Single-file Episode.tsx fallback
    for ep in (
        REPO_ROOT / "remotion-composer" / "src" / project_dir.name / "Episode.tsx",
        project_dir / "Episode.tsx",
    ):
        if ep.is_file():
            return [("EPISODE", ep)]
    return []


def _extract_visible_texts_and_chart_values(tsx_source: str) -> tuple[list[str], list[str]]:
    """Strip comments, imports, and CSS/layout props; return (ui_strings, chart_values)."""
    cleaned = COMMENT_BLOCK_RE.sub(" ", tsx_source)
    cleaned = COMMENT_LINE_RE.sub(" ", cleaned)
    cleaned = IMPORT_LINE_RE.sub(" ", cleaned)
    cleaned = STATIC_FILE_RE.sub(" ", cleaned)
    cleaned = HEX_COLOR_RE.sub(" ", cleaned)
    cleaned = RGBA_RE.sub(" ", cleaned)

    chart_vals = [m.group(1) for m in CHART_VALUE_RE.finditer(cleaned)]

    # Strip non-fact CSS/layout/animation props iteratively
    stripped = NON_FACT_PROP_RE.sub(" ", cleaned)

    texts: list[str] = []
    for m in STRING_LITERAL_RE.finditer(stripped):
        raw_str = next((g for g in m.groups() if g is not None), "")
        # Remove ${...} template expressions
        s = re.sub(r"\$\{[^}]*\}", " ", raw_str).strip()
        if not s or CSS_OR_STRUCTURAL_TEXT_RE.match(s):
            continue
        texts.append(s)

    for m in JSX_TEXT_RE.finditer(stripped):
        s = re.sub(r"\s+", " ", m.group(1)).strip()
        if not s or CSS_OR_STRUCTURAL_TEXT_RE.match(s):
            continue
        texts.append(s)

    return texts, chart_vals


def _token_covered_by_display(num_token: str, display_string: str, *, is_chart_value: bool = False) -> bool:
    """Check whether a printed numeric token matches a whitelisted display_string."""
    tok = num_token.strip().rstrip("%").strip()
    disp = display_string.strip()
    if not tok or not disp:
        return False

    # Direct boundary-aware match inside display_string (e.g. '136,2' in '133,2–136,2')
    pat = re.compile(rf"(?<!\d){re.escape(tok)}(?!\d)")
    if pat.search(disp):
        return True

    # Also allow '.' <-> ',' decimal equivalence (e.g. TSX chart value: 137.5 vs '137,5')
    if is_chart_value or "." in tok or "," in tok:
        tok_comma = tok.replace(".", ",")
        pat_comma = re.compile(rf"(?<!\d){re.escape(tok_comma)}(?!\d)")
        if pat_comma.search(disp):
            return True
        if is_chart_value:
            # Strip thousands dot/comma on bare JS numbers if exact integer match in disp
            disp_plain_nums = re.findall(r"\d+(?:[.,]\d+)*", disp)
            for dn in disp_plain_nums:
                if dn.replace(".", "").replace(",", ".") == tok.replace(",", "."):
                    return True
    return False


def validate_fact_whitelist(
    project_dir: Path | str,
    *,
    scenes_dir: Path | str | None = None,
    write_report: bool = True,
) -> dict[str, Any]:
    project_root = Path(project_dir)
    whitelist = load_fact_whitelist(project_root)

    if whitelist is None:
        return {
            "gate": "fact-whitelist-gate",
            "project": project_root.name,
            "activated": False,
            "skipped": True,
            "pass": True,
            "checked_scenes": 0,
            "errors": [],
            "warnings": [],
        }

    errors: list[dict[str, Any]] = []
    warnings: list[str] = []

    active_facts = [
        f for f in whitelist["facts"]
        if not any(f["verification"].startswith(dis) for dis in DISALLOWED_VERIFICATIONS)
    ]
    banned_strings = list(whitelist.get("banned_strings", []))
    for f in whitelist["facts"]:
        if any(f["verification"].startswith(dis) for dis in DISALLOWED_VERIFICATIONS):
            banned_strings.append(f["display_string"])
    banned_strings = sorted({b for b in banned_strings if b})

    if not active_facts:
        errors.append({
            "code": FWG_EMPTY_WHITELIST,
            "scene_id": None,
            "message": f"v2 fact whitelist at {whitelist['source']} contains zero active verified facts",
        })

    sdir_path = Path(scenes_dir) if scenes_dir else None
    scene_files = _discover_scene_files(project_root, sdir_path)

    expected_count = whitelist.get("scene_count_exact")
    if expected_count is not None and scene_files and scene_files[0][0] != "EPISODE":
        if len(scene_files) != expected_count:
            errors.append({
                "code": FWG_SCENE_COUNT_MISMATCH,
                "scene_id": None,
                "message": (
                    f"scene_count_exact={expected_count} in brief, "
                    f"but found {len(scene_files)} scene file(s)"
                ),
            })

    for scene_id, path in scene_files:
        try:
            source = path.read_text(encoding="utf-8")
        except OSError as exc:
            errors.append({
                "code": FWG_UNWHITELISTED_NUMBER,
                "scene_id": scene_id,
                "message": f"unable to read {path}: {exc}",
            })
            continue

        allowed_for_scene = [
            f for f in active_facts
            if scene_id == "EPISODE" or "*" in f["allowed_scenes"] or scene_id in f["allowed_scenes"]
        ]
        ui_texts, chart_vals = _extract_visible_texts_and_chart_values(source)

        for text in ui_texts:
            # 1. Check banned strings
            for banned in banned_strings:
                pat = re.compile(rf"(?<!\d){re.escape(banned)}(?!\d)", re.IGNORECASE)
                if pat.search(text):
                    errors.append({
                        "code": FWG_BANNED_STRING,
                        "scene_id": scene_id,
                        "token": banned,
                        "message": f"{scene_id} ({path.name}): printed banned/excluded string {banned!r} in {text!r}",
                    })

            # 2. Check numeric claims in displayed text
            cleaned_text = STRUCTURAL_PHRASE_RE.sub(" ", text)
            for m in NUMBER_TOKEN_RE.finditer(cleaned_text):
                tok = m.group(0).strip()
                if any(_token_covered_by_display(tok, f["display_string"]) for f in allowed_for_scene):
                    continue
                errors.append({
                    "code": FWG_UNWHITELISTED_NUMBER,
                    "scene_id": scene_id,
                    "token": tok,
                    "message": (
                        f"{scene_id} ({path.name}): printed number {tok!r} in {text!r} "
                        f"is not in fact whitelist for {scene_id}"
                    ),
                })

        for cval in chart_vals:
            if any(_token_covered_by_display(cval, f["display_string"], is_chart_value=True) for f in allowed_for_scene):
                continue
            errors.append({
                "code": FWG_UNWHITELISTED_NUMBER,
                "scene_id": scene_id,
                "token": cval,
                "message": (
                    f"{scene_id} ({path.name}): chart value {cval} "
                    f"is not in fact whitelist for {scene_id}"
                ),
            })

    report = {
        "gate": "fact-whitelist-gate",
        "project": project_root.name,
        "activated": True,
        "skipped": False,
        "source": whitelist["source"],
        "pass": len(errors) == 0,
        "checked_scenes": len(scene_files),
        "active_facts": len(active_facts),
        "blocked": len(errors),
        "errors": errors,
        "warnings": warnings,
    }
    if write_report and project_root.is_dir():
        qc_out = project_root / "qc" / "fact_whitelist.json"
        qc_out.parent.mkdir(parents=True, exist_ok=True)
        qc_out.write_text(json.dumps(report, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
    return report


def main(argv: list[str] | None = None) -> int:
    ap = argparse.ArgumentParser(description="Closed fact-whitelist gate for Research v2 episodes")
    ap.add_argument("--project", required=True, help="projects/<slug> directory")
    ap.add_argument("--scenes-dir", default=None, help="override path to scenes/*.tsx directory")
    args = ap.parse_args(argv)

    project_dir = Path(args.project)
    if not project_dir.is_dir():
        print(f"ERROR: project directory not found: {project_dir}", file=sys.stderr)
        return 2

    report = validate_fact_whitelist(
        project_dir,
        scenes_dir=args.scenes_dir,
        write_report=True,
    )
    if report["skipped"]:
        print("SKIPPED — fact-whitelist-gate (no v2 fact whitelist found)")
        return 0
    if report["pass"]:
        print(
            f"PASS — fact-whitelist-gate "
            f"({report['checked_scenes']} scenes, {report['active_facts']} whitelisted facts)"
        )
        return 0
    print(f"FAIL — fact-whitelist-gate rejected ({report['blocked']} error(s))", file=sys.stderr)
    for err in report["errors"]:
        print(f"  - {err['code']}: {err['message']}", file=sys.stderr)
    return 1


if __name__ == "__main__":
    sys.exit(main())
