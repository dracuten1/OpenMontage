#!/usr/bin/env python3
"""Numeric QC for turtle rig v4 side-view design-gate stills.

Reads the 3 rendered PNGs and writes qc_report.txt + eyeball crops.
Rig->canvas transform of TurtleStillV4: translate(540 540) scale(2.6)
translate(-572 -730)  =>  cx = 2.6*x - 947.2 , cy = 2.6*y - 1358.
"""
import os
import numpy as np
from PIL import Image
from collections import deque

RENDERS = "/Users/tuyennguyen/project/OpenMontage/character-performer/renders"
OUT = "/Users/tuyennguyen/project/OpenMontage/character-performer/kids/qc_turtle_v4"
S = 2.6

def cx(x): return int(round(S * x - 947.2))
def cy(y): return int(round(S * y - 1358))

MAI = np.array([242, 181, 60]); RIM = np.array([201, 130, 30])
CREAM = np.array([245, 230, 200]); DARK = np.array([58, 46, 42])
SKIN = np.array([148, 163, 68]); SKINL = np.array([168, 183, 85])
FAR = np.array([165, 179, 84]); SHAD = np.array([208, 215, 206])
WHITE = np.array([255, 255, 255])

def near(a, c, tol): return np.abs(a - c).max(axis=2) <= tol

def components(mask, min_px=500):
    h, w = mask.shape
    seen = np.zeros_like(mask, dtype=bool)
    comps = []
    for yy in range(h):
        for xx in range(w):
            if mask[yy, xx] and not seen[yy, xx]:
                q = deque([(yy, xx)]); seen[yy, xx] = True; n = 0
                while q:
                    a, b = q.popleft(); n += 1
                    for da, db in ((1,0),(-1,0),(0,1),(0,-1),(1,1),(1,-1),(-1,1),(-1,-1)):
                        na, nb = a+da, b+db
                        if 0 <= na < h and 0 <= nb < w and mask[na, nb] and not seen[na, nb]:
                            seen[na, nb] = True; q.append((na, nb))
                if n >= min_px: comps.append(n)
    return comps

def runs_with_gaps(cls_col, gap=2):
    """runs of True allowing gaps<=gap; returns [(start,end_inclusive_exclusive)]"""
    runs = []; i = 0; n = len(cls_col)
    while i < n:
        if cls_col[i]:
            j = i; last = i
            while j < n:
                if cls_col[j]: last = j; j += 1
                else:
                    k = j
                    while k < n and not cls_col[k]: k += 1
                    if k - j <= gap and k < n: j = k
                    else: break
            runs.append((i, last + 1)); i = last + 1
        else: i += 1
    return runs

def equator_scan(a, col, name, log):
    """scan one column through the equator: expect mai -> rim(<=16) -> cream, no dark between"""
    colpix = a[:, col]
    m_mai = np.abs(colpix - MAI).max(axis=1) <= 25
    m_rim = np.abs(colpix - RIM).max(axis=1) <= 25
    m_cre = np.abs(colpix - CREAM).max(axis=1) <= 22
    m_drk = np.abs(colpix - DARK).max(axis=1) <= 30
    y0, y1 = cy(745), cy(800)  # rows: rig 745..800 covers mai above rim .. cream below
    mai_r = [r for r in runs_with_gaps(m_mai[y0:y1]) if r[1]-r[0] >= 4]
    if not mai_r: log.append(f"    {name} col={col}: NO mai run above equator"); return None
    mai_end = y0 + mai_r[-1][1]
    rim_r = [r for r in runs_with_gaps(m_rim[mai_end:y1+40]) if r[1]-r[0] >= 1]
    if not rim_r: log.append(f"    {name} col={col}: NO rim run after mai"); return None
    rim_s, rim_e = mai_end + rim_r[0][0], mai_end + rim_r[0][1]
    rim_w = rim_e - rim_s
    cre_r = [r for r in runs_with_gaps(m_cre[rim_e:rim_e+120]) if r[1]-r[0] >= 4]
    dark_between = bool(m_drk[mai_end:rim_e].any())
    ok = (not dark_between) and rim_w <= 16 and bool(cre_r)
    cream_h = (cre_r[0][1] - cre_r[0][0]) if cre_r else 0
    log.append(f"    {name} col={col}: mai_end(y={mai_end}) -> rim run {rim_w}px (gate <=16) -> cream run {cream_h}px; dark_between_mai_rim={dark_between}")
    return {"ok": ok, "rim_w": rim_w, "dark": dark_between, "cream_h": cream_h}

def junction_scan(a, row, name, log):
    """head-over-shell junction at one row, scanning from BEHIND the face
    (rig x480: clear of glasses/eye/blush): head skin -> head stroke -> mai,
    exactly 1 dark run (no cut border, no body outline re-slice)."""
    x0 = cx(480)
    rowpix = a[row, x0:x0+220]
    m_skin = (np.abs(rowpix - SKIN).max(axis=1) <= 25) | (np.abs(rowpix - SKINL).max(axis=1) <= 25)
    m_mai = np.abs(rowpix - MAI).max(axis=1) <= 25
    m_drk = np.abs(rowpix - DARK).max(axis=1) <= 30
    skin_runs = [r for r in runs_with_gaps(m_skin) if r[1]-r[0] >= 10]
    mai_runs = [r for r in runs_with_gaps(m_mai) if r[1]-r[0] >= 10]
    if not skin_runs or not mai_runs:
        log.append(f"    {name} row={row}: skin_run={bool(skin_runs)} mai_run={bool(mai_runs)} (row miss)"); return None
    s0, s1 = skin_runs[-1]
    mai0 = mai_runs[0][0]
    if mai0 <= s1:
        log.append(f"    {name} row={row}: mai before skin end? s1={x0+s1} mai0={x0+mai0}"); return None
    zone = m_drk[s1:mai0]
    dark_runs = [r for r in runs_with_gaps(zone, gap=0) if r[1]-r[0] >= 5]
    log.append(f"    {name} row={row}: skin x{x0+s0}..{x0+s1} -> {len(dark_runs)} dark run(s) -> mai x{x0+mai0}..{x0+mai_runs[0][1]}")
    return {"ok": len(dark_runs) == 1, "n": len(dark_runs)}

def crop2x(img, ccx, ccy, size, name):
    half = size // 2
    l, t = max(0, ccx - half), max(0, ccy - half)
    r, b = min(img.width, l + size), min(img.height, t + size)
    c = img.crop((l, t, r, b))
    c = c.resize((c.width * 2, c.height * 2), Image.LANCZOS)
    c.save(os.path.join(OUT, name))

def leg_bottoms(a, log):
    """walk: per-leg TOE-TIP bottoms (outer stroke edge) = last row of
    fill-or-outline contiguous below the leg fill, per x-zone. Zones (canvas):
    near-front gripped on book (informational); near-rear swung; far-front
    swung; far-rear planted (visible sliver left of the swung near-rear)."""
    d_skin = np.abs(a - SKIN).max(axis=2); d_far = np.abs(a - FAR).max(axis=2)
    is_near = (d_skin <= 20) & (d_skin < d_far)
    is_far = (d_far <= 20) & (d_far < d_skin)
    is_dark = np.abs(a - DARK).max(axis=2) <= 40
    r0, r1 = cy(770), cy(880)
    def tip_bottom(fill, x0, x1):
        zone = fill[r0:r1, x0:x1]
        ys = np.where(zone.any(axis=1))[0]
        if not len(ys): return -1
        frow = r0 + ys.max()
        below = (fill | is_dark)[frow-2:frow+46, x0:x1]
        # outer tip = deepest row whose columns include a fill-adjacent dark run
        ccols = np.where(fill[frow-2, x0:x1])[0]
        if not len(ccols): return frow
        d = frow - 2
        while d < frow + 44 and is_dark[d, x0+ccols[len(ccols)//2]]:
            d += 1
        return d - 1
    nf = tip_bottom(is_near, 150, cx(560))
    nr = tip_bottom(is_near, cx(650), 1040)
    ff = tip_bottom(is_far, cx(520), cx(622))
    fr = tip_bottom(is_far, cx(628), cx(640))
    log.append(f"    toe-tip bottoms canvas y: near-front(grip/book)={nf} near-rear(swung)={nr} far-front(swung)={ff} far-rear(planted)={fr}")
    if min(nr, ff, fr) < 0: return {"ok": False, "diff": -1}
    swung_max = max(nr, ff)
    diff = fr - swung_max  # ground stance leg vs highest swing toe
    log.append(f"    planted(far-rear)={fr} minus max(swung)={swung_max} -> {diff}px (gate >=8)")
    return {"ok": diff >= 8, "diff": int(diff)}

def main():
    os.makedirs(OUT, exist_ok=True)
    log = []
    poses = [("idle", "turtle_v4_crawl_idle.png"), ("walk", "turtle_v4_crawl_walk.png"), ("proud", "turtle_v4_proud.png")]
    for name, fn in poses:
        img = Image.open(os.path.join(RENDERS, fn))
        log.append(f"== {name.upper()} ({fn}) ==")
        a = np.asarray(img.convert("RGB")).astype(int)

        # q1 PNG hygiene
        corners = [(2,2),(1077,2),(2,1077),(1077,1077)]
        cw = all((a[y,x] == 255).all() for x,y in corners)
        q1 = img.size == (1080,1080) and img.mode == "RGB" and cw
        log.append(f"q1 hygiene: size={img.size} mode={img.mode} corners_white={cw} -> {'PASS' if q1 else 'FAIL'}")

        # q2 silhouette one mass
        nonwhite = np.abs(a - WHITE).max(axis=2) > 12
        shadow = near(a, SHAD, 25)
        turtle = nonwhite & ~shadow
        comps = components(turtle)
        expect = "exactly 1" if name == "proud" else "1..2"
        q2 = (len(comps) == 1) if name == "proud" else (1 <= len(comps) <= 2)
        log.append(f"q2 silhouette: components>=500px = {len(comps)} sizes={comps} (expect {expect}) -> {'PASS' if q2 else 'FAIL'}")

        # q3 interior outlines
        r1 = equator_scan(a, cx(596), name, log)
        r2 = equator_scan(a, cx(606), name, log)
        jrow = cy(690) if name == "proud" else cy(700)
        j = junction_scan(a, jrow, name, log) or junction_scan(a, jrow-3, name, log)
        q3 = bool(r1 and r2 and r1["ok"] and r2["ok"] and j and j["ok"])
        log.append(f"q3 interiors: equator x{cx(596)}/{cx(606)} + junction -> {'PASS' if q3 else 'FAIL'}")

        # q4 proportions (rendered px)
        # shell extents = mai fill at row rig y740 (unobstructed by head /
        # legs / book at that height; scutes are interior holes, no effect)
        mai_band = near(a, MAI, 25)[cy(736):cy(744), :]
        mai_cols = np.where(mai_band.any(axis=0))[0]
        shell_l, shell_r = (mai_cols.min(), mai_cols.max()) if len(mai_cols) else (-1,-1)
        tcols = np.where(turtle.any(axis=0))[0]; trows = np.where(turtle.any(axis=1))[0]
        full_l, full_r = tcols.min(), tcols.max()
        ratio = (shell_r - shell_l) / (full_r - full_l) if full_r > full_l else 0
        protrude = shell_l - full_l
        m_skin_full = near(a, SKIN, 22) | near(a, SKINL, 22)
        tail_zone = m_skin_full[:, shell_r+5:full_r-3]
        tail_cols = np.where(tail_zone.any(axis=0))[0]
        tail_span = (tail_cols.max() - tail_cols.min()) if len(tail_cols) else 0
        cream_h = min(r1["cream_h"], r2["cream_h"]) if (r1 and r2) else 0
        log.append(f"q4: shell_w={shell_r-shell_l}px full_w={full_r-full_l}px ratio={ratio:.3f} (gate 0.52..0.62)")
        log.append(f"    head protrusion ahead of shell front={protrude}px (gate >=20)")
        log.append(f"    tail skin span behind shell rear={tail_span}px (gate >=15)")
        log.append(f"    belly cream band below rim={cream_h}px (gate >=25)")
        walk_ok = True; walk_line = ""
        if name == "walk":
            w = leg_bottoms(a, log); walk_ok = w["ok"]; walk_line = f" walk_legs={w['diff']}px"
        q4 = (0.52 <= ratio <= 0.62) and protrude >= 20 and tail_span >= 15 and cream_h >= 25 and walk_ok
        log.append(f"q4 proportions -> {'PASS' if q4 else 'FAIL'}{walk_line}")

        # eyeball crops (500px window, 2x LANCZOS)
        crop2x(img, cx(460), cy(700), 500, f"qc_{name}_face.png")
        crop2x(img, cx(612), cy(790), 500, f"qc_{name}_equator.png")
        if name == "walk":
            crop2x(img, cx(610), cy(815), 500, "qc_walk_legs.png")
        log.append("")

    with open(os.path.join(OUT, "qc_report.txt"), "w") as f:
        f.write("\n".join(log))
    print("\n".join(log))

if __name__ == "__main__":
    main()
