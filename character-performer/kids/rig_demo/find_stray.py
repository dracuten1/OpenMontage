#!/usr/bin/env python3
"""Tìm blob lạc trên frames talk: connected components alpha NGOÀI ensemble puppet."""
import numpy as np
from PIL import Image, ImageFilter

for fn in ("f0147", "f0150", "f0180", "f0210"):
    p = f"out/frames/{fn}.png"
    a = np.asarray(Image.open(p).convert("RGBA"))
    al = a[..., 3] > 40
    # ensemble puppet mong đọi [392,15,997,992] (canvas 1536x1024)
    ens = np.zeros_like(al); ens[15:993, 392:998] = True
    stray = al & ~ens
    n = int(stray.sum())
    ys, xs = np.where(stray)
    print(fn, "stray_px:", n, ("bbox [%d,%d,%d,%d]" % (xs.min(), ys.min(), xs.max(), ys.max())) if n else "")
    # label components bằng filter đơn giản
    if n:
        img = Image.fromarray((stray * 255).astype(np.uint8))
        lbl = img.filter(ImageFilter.MaxFilter(9))
        arr = np.asarray(lbl) > 0
        # in vài hàng bbox thô
        col_any = arr.any(axis=0)
        runs = []
        inrun = False
        for i, v in enumerate(col_any):
            if v and not inrun: start = i; inrun = True
            elif not v and inrun: runs.append((start, i)); inrun = False
        if inrun: runs.append((start, len(col_any)))
        print("   x-runs:", runs[:8])
        # màu trung bình của vùng stray (RGB nơi alpha>40)
        m = stray
        if m.any():
            rgb = a[..., :3][m].mean(axis=0)
            print("   mean RGB của stray:", rgb.round(0))
