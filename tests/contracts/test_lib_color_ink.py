"""Unit contract for remotion-composer/src/lib/color.ts — the ink helpers the
Explainer text-contrast fix depends on.

Built once per session with esbuild (already a remotion-composer dependency)
and exercised through node, so the TypeScript under test is the real module,
not a python port.
"""

import json
import shutil
import subprocess
from pathlib import Path

import pytest

REPO_ROOT = Path(__file__).resolve().parents[2]
COMPOSER = REPO_ROOT / "remotion-composer"
COLOR_TS = COMPOSER / "src" / "lib" / "color.ts"
BUILD_DIR = Path("/tmp/lib_color_ink_test")


@pytest.fixture(scope="module")
def color_module() -> Path:
    """Compile color.ts to a CJS module once; return its path."""
    BUILD_DIR.mkdir(parents=True, exist_ok=True)
    out = BUILD_DIR / "color.js"
    subprocess.run(
        [
            "npx", "esbuild", str(COLOR_TS),
            "--format=cjs", f"--outfile={out}",
        ],
        cwd=COMPOSER, check=True, capture_output=True,
    )
    return out


def call(color_module: Path, script: str) -> dict:
    """Evaluate a JS expression dict against the compiled module."""
    prog = f"const c = require({json.dumps(str(color_module))}); {script}"
    res = subprocess.run(
        ["node", "-e", prog], check=True, capture_output=True, text=True,
    )
    return json.loads(res.stdout)


def test_is_light_color(color_module: Path) -> None:
    out = call(color_module, (
        'console.log(JSON.stringify({'
        'w: c.isLightColor("#FFFFFF"), b: c.isLightColor("#0D1117"),'
        's: c.isLightColor("#F9FAFB"), k: c.isLightColor("#1F2937"),'
        't: c.isLightColor("#F1F5F9")}));'
    ))
    assert out == {"w": True, "b": False, "s": True, "k": False, "t": True}


def test_light_surface_ink_maps_the_two_known_accents(color_module: Path) -> None:
    out = call(color_module, (
        'console.log(JSON.stringify({'
        'a: c.lightSurfaceInk("#F59E0B"), e: c.lightSurfaceInk("#10B981"),'
        'lo: c.lightSurfaceInk("#f59e0b"), x: c.lightSurfaceInk("#22D3EE")}));'
    ))
    assert out["a"] == "#B45309"
    assert out["e"] == "#047857"
    assert out["lo"] == "#B45309"  # case-insensitive
    assert out["x"] == "#22D3EE"  # unmapped passes through unchanged


def test_ink_on_surface_dark_keeps_light_maps(color_module: Path) -> None:
    out = call(color_module, (
        'console.log(JSON.stringify({'
        'dark: c.inkOnSurface("#F59E0B", "#0D1117"),'
        'darkGreen: c.inkOnSurface("#10B981", "#0D1117"),'
        'light: c.inkOnSurface("#F59E0B", "#F9FAFB"),'
        'lightGreen: c.inkOnSurface("#10B981", "#F8F9FB")}));'
    ))
    # Dark surfaces keep the original ink (the 9:1 dark-surface pairings must
    # not regress).
    assert out["dark"] == "#F59E0B"
    assert out["darkGreen"] == "#10B981"
    # Light surfaces swap to the verified -700 variants.
    assert out["light"] == "#B45309"
    assert out["lightGreen"] == "#047857"


def test_ink_on_surface_unknowable_surface_keeps_ink(color_module: Path) -> None:
    """transparent / non-hex surfaces must not be classified as black.

    hexToRgb('transparent') -> NaN -> 0,0,0, which would silently classify a
    transparent page as dark. The guard keeps the authored ink instead.
    """
    out = call(color_module, (
        'console.log(JSON.stringify({'
        't: c.inkOnSurface("#F59E0B", "transparent"),'
        'u: c.inkOnSurface("#F59E0B", undefined),'
        'r: c.inkOnSurface("#F59E0B", "rgb(249, 250, 251)"),'
        'a: c.inkOnSurface("#F59E0B", "#F9FAFBBB")}));'
    ))
    assert out == {"t": "#F59E0B", "u": "#F59E0B", "r": "#F59E0B", "a": "#F59E0B"}


def test_covary_text_ink_flips_only_on_matching_polarity(color_module: Path) -> None:
    out = call(color_module, (
        'console.log(JSON.stringify({'
        'll: c.covaryTextInk("#F1F5F9", "#F9FAFB"),'   # light ink, light surface
        'dd: c.covaryTextInk("#1F2937", "#0D1117"),'   # dark ink, dark surface
        'dl: c.covaryTextInk("#1F2937", "#F9FAFB"),'   # already correct
        'ld: c.covaryTextInk("#F8FAFC", "#0D1117"),'   # already correct
        'm: c.covaryTextInk("#6B7280", "#F9FAFB")}));' # mid-tone kept
    ))
    assert out["ll"] == "#1F2937"
    assert out["dd"] == "#F8FAFC"
    assert out["dl"] == "#1F2937"
    assert out["ld"] == "#F8FAFC"
    assert out["m"] == "#6B7280"


def test_covary_text_ink_unknowable_surface_keeps_authored_ink(color_module: Path) -> None:
    """The transparent-surface guard: an already-correct dark title over a
    transparent (gradient-showing) page must NOT flip to light ink."""
    out = call(color_module, (
        'console.log(JSON.stringify({'
        't: c.covaryTextInk("#1F2937", "transparent"),'
        'r: c.covaryTextInk("#1F2937", "rgba(249,250,251,0.85)"),'
        'u: c.covaryTextInk("#1F2937", undefined)}));'
    ))
    assert out == {"t": "#1F2937", "r": "#1F2937", "u": "#1F2937"}


def test_ink_on_surface_warns_once_per_ink_and_surface(color_module: Path) -> None:
    """A light-surface accent with no mapping must warn visibly, once."""
    prog = (
        f'const c = require({json.dumps(str(color_module))}); '
        'const w = []; const orig = console.warn; console.warn = (...a) => w.push(a.join(" ")); '
        'c.inkOnSurface("#EF4444", "#F9FAFB"); '
        'c.inkOnSurface("#EF4444", "#F9FAFB"); '
        'c.inkOnSurface("#EF4444", "#EAECF3"); '
        'console.warn = orig; '
        'console.log(JSON.stringify({n: w.length, first: w[0] || ""}));'
    )
    res = subprocess.run(["node", "-e", prog], check=True, capture_output=True, text=True)
    out = json.loads(res.stdout)
    assert out["n"] == 2  # once per (ink, surface) pair — not per call
    assert "#EF4444" in out["first"] and "#F9FAFB" in out["first"]


def test_contrast_ratio_matches_wcag_reference_values(color_module: Path) -> None:
    out = call(color_module, (
        'console.log(JSON.stringify({'
        'r1: +c.contrastRatio("#1F2937", "#F9FAFB").toFixed(2),'
        'r2: +c.contrastRatio("#B45309", "#F9FAFB").toFixed(2),'
        'r3: +c.contrastRatio("#047857", "#F8F9FB").toFixed(2),'
        'r4: +c.contrastRatio("#6B7280", "#FBFCFC").toFixed(2)}));'
    ))
    assert out["r1"] == pytest.approx(14.05, abs=0.05)
    assert out["r2"] == pytest.approx(4.81, abs=0.05)
    assert out["r3"] == pytest.approx(5.21, abs=0.05)
    assert out["r4"] == pytest.approx(4.70, abs=0.05)
