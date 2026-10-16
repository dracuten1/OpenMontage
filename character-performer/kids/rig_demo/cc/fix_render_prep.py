#!/usr/bin/env python3
"""FIX5 — NEUTRALIZED no-op stub.

PATCH_DELTA / per-frame patch placement is dead: since FIX5, the patch objects
(mouth/eyelid) are COPIES OF THE HEAD MESH (cc/fix5_patches.py) that follow the
head bone automatically. This file is kept only so any stale pipeline call is
harmless. Do NOT restore placement logic here.
"""
print('FIX_RENDER_PREP_NEUTRALIZED (FIX5: patches are head copies; no PATCH_DELTA, nothing to do)')
raise SystemExit(0)
