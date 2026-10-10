#!/usr/bin/env python3
"""scene_sweep — pre-render layout collision gate for OpenMontage.

Renders N stills per scene (anchor + end by default) via `npx remotion still`
and runs deterministic pixel checks on each, catching layout bug classes that
only surface after a full render:

  1. edge_clip   — bright text pixels touching a frame edge (cut-off glyphs).
  2. panel_clip  — a bright element terminating exactly at a detected panel
                   bottom border (SVG children clipped by their viewBox /
                   svg viewport clip SILENTLY, e.g. page-offset bugs).
  3. dense_overlap — suspicion-only proxy for stacked/overlapping text
                   (tall connected blob of high text-density grid cells).

No ML, no vision model: pure pixel heuristics over grayscale stills.
Thresholds below are grounded on btc-tradingagents-20261008 probe stills
(dark-fintech theme: bg #0D1117 lum~16, surface #161B22 lum~20, card border
rgba(240,246,252,.14) lum~56, accent red #F85149 lum~130, amber #D29922
lum~156, body text #E6EDF3 lum~232).

Report: <out>/scene_sweep_report.json. Verdict FAIL (any edge_clip /
panel_clip), WARN (only dense_overlap), PASS otherwise.
Exit codes: 0 = PASS/WARN, 1 = FAIL, 2 = error.
"""

from __future__ import annotations

import argparse
import json
import math
import os
import subprocess
import sys
import time
from pathlib import Path

REPO_ROOT = Path(__file__).resolve().parents[2]
REMOTION_DIR = REPO_ROOT / "remotion-composer"

# --- tunables (see module docstring for grounding) --------------------------
EDGE_STRIP_W = 12          # spec: 12px edge strip
EDGE_LUM = 150             # "bright text pixel" luminance
EDGE_GRAD = 30             # local contrast within the strip (rejects smooth bg)
EDGE_MIN_RUN = 8           # > 8 consecutive bright pixels along the edge
PANEL_EDGE_GRAD = 25       # |row[y]-row[y+1]| for a panel border line
PANEL_EDGE_COV = 0.55      # fraction of row width that must transition
PANEL_EDGE_MEAN_DROP = 10  # bottom-edge rows get darker below the border
PANEL_CONTACT_LUM = 100    # foreground brightness counts as "clipped element"
PANEL_CONTACT_ROWS = 3     # rows just above the border inspected for contact
PANEL_MIN_CLUSTER = 30     # bright px touching the border to flag
PANEL_INTERIOR_MAX_MEAN = 60
# A real panel border has a QUIET interior above it (uniform surface, row mean
# < 60 on dark themes). Decorative bright rules/dividers/bands (2-3px tall,
# contiguous 200-780px) would self-flag: the "contact strip" catches the rule
# itself. The quiet-zone test rejects those while keeping clipped elements
# (which sit as sparse bright structure on the quiet panel surface).
PANEL_BELOW_QUIET_ROWS = 13
PANEL_BELOW_MAX_MEAN = 45
PANEL_BELOW_MAX_BRIGHT = 8
# An OUTER panel bottom border sits over empty page background: the rows just
# below it stay dark and contentless. Internal divider lines (table row rules,
# axis lines) have more panel content below them — those are legitimate
# design, not clipping boundaries, so they are rejected.
PANEL_MIN_VERT_EXTENT = 10
PANEL_MIN_RUN_W = 24
PANEL_MAX_RUN_W_FRAC = 0.30   # runs wider than 30% of canvas = panel border itself
# A clipped ELEMENT (candle body, chart bar, text block) is a structure at
# least ~24px wide whose bright pixels continue >= 10px above the border it is
# cut at. Thin decorative rules are 2-3px tall; single piercing columns (a
# glyph overlapping its own divider) are < 24px wide. Both are rejected.
GRID_COLS, GRID_ROWS = 12, 8
CELL_DENSE = 0.35          # bright fraction making a grid cell "dense"
DENSE_MIN_HEIGHT = 4       # connected dense blob taller than 3 cells => warn
STEP = 2                   # pixel sampling step for full-image scans


# --- image loading (PIL primary, ffmpeg fallback) ---------------------------
def load_gray(path: Path) -> tuple[bytes, int, int]:
    """Return (grayscale bytes, width, height) for a PNG."""
    try:
        from PIL import Image
    except ImportError:
        probe = subprocess.run(
            ["ffprobe", "-v", "error", "-select_streams", "v:0",
             "-show_entries", "stream=width,height", "-of", "json", str(path)],
            capture_output=True, text=True, check=True)
        st = json.loads(probe.stdout)["streams"][0]
        w, h = int(st["width"]), int(st["height"])
        raw = subprocess.run(
            ["ffmpeg", "-v", "error", "-i", str(path), "-vf", "format=gray",
             "-f", "rawvideo", "-"], capture_output=True, check=True).stdout
        return raw, w, h
    with Image.open(path) as im:
        g = im.convert("L")
        return g.tobytes(), g.size[0], g.size[1]


# --- check 1: text cut off at frame edges ------------------------------------
def check_edge_clip(g: bytes, W: int, H: int) -> list[dict]:
    flags: list[dict] = []

    def bright_at_edge(x: int, y: int) -> bool:
        v = g[y * W + x]
        if v <= EDGE_LUM:
            return False
        # local contrast somewhere in the 12px strip (rejects smooth bg wash)
        x0, x1 = max(0, x - EDGE_STRIP_W + 1), min(W, x + EDGE_STRIP_W)
        lo = hi = v
        for xx in range(x0, x1):
            p = g[y * W + xx]
            lo = min(lo, p) if p != v else lo
            hi = max(hi, p)
        return hi - lo > EDGE_GRAD

    def runs(positions: set[int]) -> list[tuple[int, int]]:
        out = []
        for p in sorted(positions):
            if out and p == out[-1][1] + 1:
                out[-1] = (out[-1][0], p)
            else:
                out.append((p, p))
        return out

    edges: dict[str, set[int]] = {"left": set(), "right": set()}
    for y in range(H):
        for x in (0, 1):
            if bright_at_edge(x, y):
                edges["left"].add(y)
        for x in (W - 2, W - 1):
            if bright_at_edge(x, y):
                edges["right"].add(y)
    for name in ("left", "right"):
        for y0, y1 in runs(edges[name]):
            if y1 - y0 + 1 > EDGE_MIN_RUN:
                flags.append({"edge": name, "axis_pos": [y0, y1],
                              "run_px": y1 - y0 + 1})

    edges_tb: dict[str, set[int]] = {"top": set(), "bottom": set()}
    for x in range(W):
        for y in (0, 1):
            v = g[y * W + x]
            if v <= EDGE_LUM:
                continue
            y0s, y1s = max(0, y - EDGE_STRIP_W + 1), min(H, y + EDGE_STRIP_W)
            lo = hi = v
            for yy in range(y0s, y1s):
                p = g[yy * W + x]
                lo = min(lo, p) if p != v else lo
                hi = max(hi, p)
            if hi - lo > EDGE_GRAD:
                edges_tb["top" if y < H // 2 else "bottom"].add(x)
    for name in ("top", "bottom"):
        for x0, x1 in runs(edges_tb[name]):
            if x1 - x0 + 1 > EDGE_MIN_RUN:
                flags.append({"edge": name, "axis_pos": [x0, x1],
                              "run_px": x1 - x0 + 1})
    return flags


# --- check 2: element clipped at a panel bottom border -----------------------
def check_panel_clip(g: bytes, W: int, H: int) -> list[dict]:
    flags: list[dict] = []
    means = [sum(g[y * W:(y + 1) * W]) / W for y in range(H)]
    strong_counts = []
    for y in range(H - 1):
        base, nxt = y * W, (y + 1) * W
        c = 0
        for a, b in zip(g[base:base + W:STEP], g[nxt:nxt + W:STEP]):
            if a > b + PANEL_EDGE_GRAD or b > a + PANEL_EDGE_GRAD:
                c += 1
        strong_counts.append(c / math.ceil(W / STEP))
    for y in range(H - 1):
        if strong_counts[y] < PANEL_EDGE_COV:
            continue
        if means[y] - means[y + 1] <= PANEL_EDGE_MEAN_DROP:
            continue  # want: bright line with darker content below (bottom edge)
        # quiet-zone: the panel interior just above the border must be calm —
        # rejects decorative bright rules whose own band feeds the contact test
        interior = sorted(means[max(0, y - PANEL_CONTACT_ROWS):y])
        if interior and interior[len(interior) // 2] >= PANEL_INTERIOR_MAX_MEAN:
            continue
        # below-quiet: an OUTER panel border empties out underneath (page bg);
        # internal dividers keep panel content below and are rejected here
        below_ok = True
        for yy in range(y + 2, min(H, y + 2 + PANEL_BELOW_QUIET_ROWS)):
            base = yy * W
            if means[yy] >= PANEL_BELOW_MAX_MEAN or \
                    sum(1 for x in range(0, W, STEP) if g[base + x] > PANEL_CONTACT_LUM) > PANEL_BELOW_MAX_BRIGHT:
                below_ok = False
                break
        if not below_ok:
            continue
        # contact strip just above the border
        cnt = 0
        contact_cols: set[int] = set()
        for yy in range(max(0, y - PANEL_CONTACT_ROWS), y):
            base = yy * W
            for x in range(W):
                if g[base + x] > PANEL_CONTACT_LUM:
                    cnt += 1
                    contact_cols.add(x)
        if cnt < PANEL_MIN_CLUSTER:
            continue
        # horizontal runs in the contact strip; a clipped element is a run
        # >= PANEL_MIN_RUN_W wide whose columns continue >= PANEL_MIN_VERT_EXTENT
        # pixels up. Divider bands (wide but 2-3px tall) and piercing glyph
        # columns (tall but < 24px wide) are both rejected.
        runs: list[tuple[int, int]] = []
        cur_start = None
        for x in range(W + 1):
            bright = x < W and x in contact_cols
            if bright and cur_start is None:
                cur_start = x
            elif not bright and cur_start is not None:
                runs.append((cur_start, x - 1))
                cur_start = None
        flagged_run = None
        for x0, x1 in runs:
            run_w = x1 - x0 + 1
            if run_w < PANEL_MIN_RUN_W:
                continue
            if run_w > W * PANEL_MAX_RUN_W_FRAC:
                continue  # span ~ full width = the panel border/band itself, not a clipped element
            max_extent = 0
            for x in range(x0, x1 + 1, 4):
                ext = 0
                while ext < 60 and (y - ext - 1) >= 0 and g[(y - ext - 1) * W + x] > PANEL_CONTACT_LUM:
                    ext += 1
                max_extent = max(max_extent, ext)
            if max_extent >= PANEL_MIN_VERT_EXTENT:
                flagged_run = (x0, x1, max_extent)
                break
        if flagged_run is None:
            continue
        flags.append({"panel_bottom_y": y, "bright_px": cnt,
                      "clip_run": [flagged_run[0], flagged_run[1]],
                      "max_vert_extent": flagged_run[2],
                      "x_range": [min(contact_cols), max(contact_cols)]})
    return flags


# --- check 3 (WARN): dense text overlap suspicion ----------------------------
def check_dense_overlap(g: bytes, W: int, H: int) -> list[dict]:
    cw, ch = W / GRID_COLS, H / GRID_ROWS
    dense = [[False] * GRID_ROWS for _ in range(GRID_COLS)]
    for c in range(GRID_COLS):
        for r in range(GRID_ROWS):
            x0, x1 = int(c * cw), int((c + 1) * cw)
            y0, y1 = int(r * ch), int((r + 1) * ch)
            tot = brt = 0
            for y in range(y0, y1):
                base = y * W
                for x in range(x0, x1, STEP):
                    tot += 1
                    if g[base + x] > EDGE_LUM:
                        brt += 1
            if tot and brt / tot > CELL_DENSE:
                dense[c][r] = True
    seen = [[False] * GRID_ROWS for _ in range(GRID_COLS)]
    flags = []
    for c in range(GRID_COLS):
        for r in range(GRID_ROWS):
            if not dense[c][r] or seen[c][r]:
                continue
            stack, comp = [(c, r)], []
            seen[c][r] = True
            while stack:
                cc, rr = stack.pop()
                comp.append((cc, rr))
                for dc, dr in ((1, 0), (-1, 0), (0, 1), (0, -1)):
                    nc, nr = cc + dc, rr + dr
                    if 0 <= nc < GRID_COLS and 0 <= nr < GRID_ROWS \
                            and dense[nc][nr] and not seen[nc][nr]:
                        seen[nc][nr] = True
                        stack.append((nc, nr))
            rows = [rr for _, rr in comp]
            if max(rows) - min(rows) + 1 >= DENSE_MIN_HEIGHT:
                flags.append({"cells": sorted(comp),
                              "height_cells": max(rows) - min(rows) + 1})
    return flags


# --- frame plan ---------------------------------------------------------------
def scene_frames(scene: dict, fps: int, n: int) -> list[tuple[str, int]]:
    s, d = scene["start_seconds"], scene["duration_seconds"]
    anchor = math.floor((s + d * 0.6) * fps)
    end = math.floor((s + d - 0.1) * fps)
    anchor, end = max(0, anchor), max(0, end)
    if n <= 2 or end <= anchor:
        return [("anchor", anchor), ("end", end)] if end != anchor \
            else [("anchor", anchor)]
    plan = [("anchor", anchor)]
    for i in range(1, n - 1):
        plan.append((f"t{i}", anchor + round((end - anchor) * i / (n - 1))))
    plan.append(("end", end))
    return plan


def resolve_entry(entry: str) -> str:
    p = Path(entry)
    if p.is_absolute():
        if not p.exists():
            raise SystemExit(f"[scene_sweep] entry not found: {p}")
        return str(p)
    if (REPO_ROOT / p).exists():
        return os.path.relpath(REPO_ROOT / p, REMOTION_DIR)
    if (REMOTION_DIR / p).exists():
        return entry
    raise SystemExit(f"[scene_sweep] entry not found (repo/remotion-composer): {entry}")


def main() -> int:
    ap = argparse.ArgumentParser(description=__doc__.splitlines()[0])
    ap.add_argument("--entry", required=True, help="remotion entry tsx (path relative to repo root or remotion-composer/)")
    ap.add_argument("--composition", required=True)
    ap.add_argument("--scene-timing", required=True, help="scene_timing.json of the project")
    ap.add_argument("--frames-per-scene", type=int, default=2)
    ap.add_argument("--out", required=True, help="dir for stills + scene_sweep_report.json")
    ap.add_argument("--proj", default=None, help="project id (report metadata only)")
    ap.add_argument("--scenes", default=None, help="comma-separated scene_id filter (e.g. s02,s05)")
    ap.add_argument("--max-stills", type=int, default=20, help="hard cap on rendered stills per run")
    args = ap.parse_args()

    if not REMOTION_DIR.is_dir():
        print(f"[scene_sweep] remotion-composer not found: {REMOTION_DIR}", file=sys.stderr)
        return 2
    timing_path = Path(args.scene_timing)
    if not timing_path.is_absolute():
        timing_path = (REPO_ROOT / timing_path if (REPO_ROOT / timing_path).exists()
                       else timing_path)
    timing = json.loads(timing_path.read_text())
    fps = int(timing.get("fps", 30))
    scenes = timing["scenes"]
    if args.scenes:
        want = {s.strip() for s in args.scenes.split(",") if s.strip()}
        scenes = [sc for sc in scenes if sc["scene_id"] in want]
        missing = want - {sc["scene_id"] for sc in scenes}
        if missing:
            print(f"[scene_sweep] unknown scene ids in --scenes: {sorted(missing)}", file=sys.stderr)
            return 2

    plans = {sc["scene_id"]: scene_frames(sc, fps, args.frames_per_scene) for sc in scenes}
    n_stills = sum(len(v) for v in plans.values())
    if n_stills > args.max_stills:
        print(f"[scene_sweep] {n_stills} stills requested > cap {args.max_stills} "
              f"(scenes={len(scenes)}, frames/scene={args.frames_per_scene}); "
              f"raise --max-stills or filter with --scenes", file=sys.stderr)
        return 2

    out_dir = Path(args.out)
    out_dir.mkdir(parents=True, exist_ok=True)
    entry_arg = resolve_entry(args.entry)

    report: dict = {
        "tool": "scene_sweep", "version": "1.0",
        "project": args.proj or timing.get("project_id"),
        "entry": args.entry, "composition": args.composition,
        "scene_timing": str(timing_path), "fps": fps,
        "frames_per_scene": args.frames_per_scene,
        "stills_rendered": n_stills, "generated_at": time.strftime("%Y-%m-%dT%H:%M:%S"),
        "scenes": {},
    }
    any_fail, any_warn = False, False
    for sc in scenes:
        sid = sc["scene_id"]
        entry_scene = {"frames": [], "edge_clip": [], "panel_clip": [], "dense_overlap": []}
        for tag, frame in plans[sid]:
            png = out_dir / f"{sid}_{tag}_f{frame}.png"
            cmd = ["npx", "remotion", "still", entry_arg, args.composition, str(png),
                   f"--frame={frame}", "--log=error"]
            t0 = time.time()
            res = subprocess.run(cmd, cwd=REMOTION_DIR, capture_output=True, text=True)
            if res.returncode != 0 or not png.exists():
                print(f"[scene_sweep] render failed {sid}/{tag} f{frame}:\n"
                      f"{(res.stderr or res.stdout)[-1500:]}", file=sys.stderr)
                return 2
            g, W, H = load_gray(png)
            ec = check_edge_clip(g, W, H)
            pc = check_panel_clip(g, W, H)
            do = check_dense_overlap(g, W, H)
            entry_scene["frames"].append({"tag": tag, "frame": frame, "png": png.name,
                                          "render_s": round(time.time() - t0, 1)})
            for fl in ec:
                fl["frame"] = frame; fl["tag"] = tag
            for fl in pc:
                fl["frame"] = frame; fl["tag"] = tag
            for fl in do:
                fl["frame"] = frame; fl["tag"] = tag
            entry_scene["edge_clip"] += ec
            entry_scene["panel_clip"] += pc
            entry_scene["dense_overlap"] += do
            print(f"  {sid} {tag} f{frame}: edge={len(ec)} panel={len(pc)} dense={len(do)}")
        if entry_scene["edge_clip"] or entry_scene["panel_clip"]:
            any_fail = True
        if entry_scene["dense_overlap"]:
            any_warn = True
        report["scenes"][sid] = entry_scene

    verdict = "FAIL" if any_fail else ("WARN" if any_warn else "PASS")
    report["verdict"] = verdict
    report["summary"] = {
        "scenes_checked": len(scenes),
        "edge_clip": sum(len(v["edge_clip"]) for v in report["scenes"].values()),
        "panel_clip": sum(len(v["panel_clip"]) for v in report["scenes"].values()),
        "dense_overlap": sum(len(v["dense_overlap"]) for v in report["scenes"].values()),
    }
    rp = out_dir / "scene_sweep_report.json"
    rp.write_text(json.dumps(report, indent=1))
    print(f"[scene_sweep] verdict={verdict} edge={report['summary']['edge_clip']} "
          f"panel={report['summary']['panel_clip']} dense={report['summary']['dense_overlap']} "
          f"-> {rp}")
    return 1 if verdict == "FAIL" else 0


if __name__ == "__main__":
    sys.exit(main())
