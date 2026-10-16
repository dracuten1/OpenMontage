#!/usr/bin/env python3
"""TURN4_B pacing measurement: peak vs average screen speed per beat.

Frame-sampled (30fps) polyline derivative, matching the TSX polyLin
(equal-u segments) + ease functions. BEFORE = v3 params, AFTER = v4 params.
"""
import json
import math

FPS = 30.0


def clamp01(x):
    return 0.0 if x < 0 else (1.0 if x > 1 else x)


def lerp(a, b, u):
    return a + (b - a) * u


def poly_lin(ks, u):
    n = len(ks) - 1
    uu = clamp01(u) * n
    i = min(n - 1, int(math.floor(uu)))
    return lerp(ks[i], ks[i + 1], uu - i)


def ease_in_out_quad(x):
    return 2 * x * x if x < 0.5 else 1 - ((-2 * x + 2) ** 2) / 2


def ease_in_out_cubic(x):
    return 4 * x ** 3 if x < 0.5 else 1 - ((-2 * x + 2) ** 3) / 2


def ease_out_quad(x):
    return 1 - (1 - x) * (1 - x)


def trapz(x, r=0.25):
    c = 1.0 / (1.0 - r)
    if x <= 0:
        return 0.0
    if x >= 1:
        return 1.0
    if x < r:
        return (c * x * x) / (2 * r)
    if x <= 1 - r:
        return c * (x - r / 2.0)
    return 1 - (c * (1 - x) * (1 - x)) / (2 * r)


def measure(xs, ys, ease_fn, t0, t1, name, warp=None):
    """Sample per-frame positions f0..fN; avg = arclen/T, peak = max |dP|*FPS."""
    f0, f1 = int(round(t0 * FPS)), int(round(t1 * FPS))
    pts = []
    for f in range(f0, f1 + 1):
        t = f / FPS
        u = ease_fn(clamp01((t - t0) / (t1 - t0)))
        if warp is not None:
            u = ease_fn(clamp01(warp(t - t0) / (t1 - t0)))
        pts.append((poly_lin(xs, u), poly_lin(ys, u)))
    arc = sum(math.hypot(pts[i + 1][0] - pts[i][0], pts[i + 1][1] - pts[i][1])
              for i in range(len(pts) - 1))
    dur = (f1 - f0) / FPS
    avg = arc / dur
    peak = max(math.hypot(pts[i + 1][0] - pts[i][0], pts[i + 1][1] - pts[i][1]) * FPS
               for i in range(len(pts) - 1))
    return {"beat": name, "dur_s": round(dur, 3), "arc_px": round(arc, 1),
            "avg_px_s": round(avg, 1), "peak_px_s": round(peak, 1),
            "peak_over_avg": round(peak / avg, 3)}


# ---- S4 SPRINT path (same polyline v3 -> v4) --------------------------------
SPX = [556, 524, 508, 572, 540]
SPY = [972, 810, 648, 518, 400]
# ---- S5 v3 OLD: B segment warp (tau<1.26 linear; 1.26-1.86 x0.35; -0.39) ----
BX = [505, 455, 400, 372, 365]
BY = [585, 650, 730, 800, 845]


def warp_b(tau):
    if tau < 1.26:
        return tau
    if tau < 1.86:
        return 1.26 + 0.35 * (tau - 1.26)
    return tau - 0.39


# ---- S5 v4 NEW: full-window S-curve path (approved demo) --------------------
S5X = [610, 508, 445, 510, 430, 250]
S5Y = [950, 810, 680, 540, 430, 355]

rows = [
    # BEFORE (v3)
    measure(SPX, SPY, ease_out_quad, 18.9, 20.7, "S4 v3 BEFORE (easeOutQuad 1.8s)"),
    measure([950, 640], [713, 800], ease_out_quad, 36.5, 37.9, "S7 v3 BEFORE (easeOutQuad 1.4s)"),
    measure(BX, BY, ease_in_out_cubic, 24.64, 26.70, "S5 v3 BEFORE B-seg (warp+glance)"),
    # AFTER (v4)
    measure(SPX, SPY, lambda u: trapz(u, 0.25), 18.9, 20.9, "S4 v4 AFTER (trapz r.25 2.0s)"),
    measure([950, 640], [713, 800], lambda u: trapz(u, 0.25), 36.5, 37.9, "S7 v4 AFTER (trapz r.25 1.4s)"),
    measure(S5X, S5Y, ease_in_out_quad, 22.79, 28.94, "S5 v4 AFTER (easeInOutQuad 6.15s full window)"),
]

if __name__ == "__main__":
    out = {"fps": FPS, "rows": rows}
    with open("character-performer/kids/turn4/pace_before_after.json", "w") as f:
        json.dump(out, f, indent=2)
    for r in rows:
        print(f'{r["beat"]:<44} dur={r["dur_s"]:>5}s arc={r["arc_px"]:>6}px '
              f'avg={r["avg_px_s"]:>6} peak={r["peak_px_s"]:>6} peak/avg={r["peak_over_avg"]:>6}')
