# -*- coding: utf-8 -*-
"""Mechanical grep-gate (directive step 3) — run standalone OR import from writer_wrapper.

Rules:
1. SceneShell import present ('./lib/SceneShell' or '../lib/SceneShell' style).
2. 0 hits: staticFile(
3. 0 hits: <Img
4. 0 hits: transition:
5. 0 hits: interpolate( ... 'transparent' / "transparent"
6. 0 AbsoluteFill with frame-absolute top: > 760 (SceneShell children band)
"""
from __future__ import annotations
import re
from pathlib import Path

_SCENE_SHELL_IMPORT_RE = re.compile(
    r"import\s[^;]*?\bSceneShell\b[^;]*?from\s*['\"]"
    r"(?:\.{1,2}/(?:lib|common)(?:/SceneShell)?|\.{0,2}/SceneShell|@[^'\"]+/SceneShell)"
    r"['\"]"
)
_INTERP_RE = re.compile(r"interpolate\s*\([^;]*?\)", re.DOTALL)
_TOP_EXPR_RE = re.compile(r"\btop\s*:\s*([^,}\n]+)")
_TAG_RE = re.compile(r"<([A-Za-z][A-Za-z0-9]*)")
_ARITH_RE = re.compile(r"^[0-9+\-*/(). ]+$")


def _eval_px(expr: str) -> int | None:
    """Evaluate a safe numeric JSX expression like '1010 - 320' -> 690."""
    s = expr.strip().rstrip(",")
    if not _ARITH_RE.match(s) or not s:
        return None
    try:
        return int(eval(s, {"__builtins__": {}}, {}))  # noqa: S307 - charset-validated
    except Exception:
        return None


def grep_gate_issues(scene_src: str, scene_id: str = "") -> list[str]:
    issues: list[str] = []
    if not _SCENE_SHELL_IMPORT_RE.search(scene_src):
        issues.append("missing SceneShell import ('./lib/SceneShell' or '../lib/SceneShell')")
    if "staticFile(" in scene_src:
        issues.append("forbidden staticFile( usage (no raw/generated media paths)")
    if re.search(r"<Img\b", scene_src):
        issues.append("forbidden <Img of generated media")
    if re.search(r"\btransition\s*:", scene_src):
        issues.append("forbidden CSS transition: property")
    for m in _INTERP_RE.finditer(scene_src):
        seg = m.group(0)
        if "'transparent'" in seg or '"transparent"' in seg:
            ln = scene_src[: m.start()].count("\n") + 1
            issues.append(f"forbidden interpolate outputValue 'transparent' (line {ln})")
    # AbsoluteFill frame-absolute top > 760 (owner tag must be AbsoluteFill)
    for m in _TOP_EXPR_RE.finditer(scene_src):
        val = _eval_px(m.group(1))
        if val is None or val <= 760:
            continue
        owner = _TAG_RE.findall(scene_src[: m.start()])
        tag = owner[-1] if owner else ""
        if tag == "AbsoluteFill":
            ln = scene_src[: m.start()].count("\n") + 1
            issues.append(
                f"AbsoluteFill frame-absolute top:{val} > 760 (line {ln}) — flex-column in SceneShell instead"
            )
    return issues


def check_scene_file(path: Path) -> list[str]:
    src = path.read_text(encoding="utf-8", errors="replace")
    return grep_gate_issues(src, path.stem)


if __name__ == "__main__":
    import sys
    ep = Path(sys.argv[1]) if len(sys.argv) > 1 else Path(".")
    for p in sorted(ep.glob("scenes/S*.tsx")):
        iss = check_scene_file(p)
        status = "PASS" if not iss else "FAIL"
        print(f"{p.name}: {status} ({len(iss)})")
        for i in iss:
            print(f"  - {i}")
