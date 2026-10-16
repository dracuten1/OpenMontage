#!/usr/bin/env python3
"""BUOC 5a — render f1-216 -> out/frames/f%04d.png (1536x1024 RGBA, EEVEE)."""
import bpy, json, os, time

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
OUT = os.path.join(ROOT, 'out')
FR = os.path.join(OUT, 'frames')
os.makedirs(FR, exist_ok=True)
bpy.ops.wm.open_mainfile(filepath=os.path.join(OUT, 'rabbit_rig.blend'))
scn = bpy.context.scene
# FIX4: render mới toàn bộ 216 frames sau khi placement được xác minh.
scn.frame_start, scn.frame_end = 1, 216
scn.render.filepath = os.path.join(FR, 'f')
try:
    scn.render.engine = 'BLENDER_EEVEE_NEXT'
    ENGINE = 'BLENDER_EEVEE_NEXT'
except TypeError:
    try:
        scn.render.engine = 'BLENDER_EEVEE'
        ENGINE = 'BLENDER_EEVEE'
    except TypeError:
        scn.render.engine = 'CYCLES'
        scn.cycles.device = 'CPU'
        ENGINE = 'CYCLES_CPU'
t0 = time.time()
bpy.ops.render.render(animation=True)
dt = time.time() - t0
n = len([f for f in os.listdir(FR) if f.endswith('.png')])
json.dump({'engine': ENGINE, 't_render_s': round(dt, 1), 'n_frames': n,
           'fix4_range': [1, 216]},
          open(os.path.join(OUT, 'render_meta.json'), 'w'), indent=1)
print(f'[render] engine={ENGINE} frames={n} t={dt:.1f}s (FIX4 range 1..216)')
print('RENDER_OK' if n == 216 else 'RENDER_FAIL')
