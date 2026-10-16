#!/usr/bin/env python3
"""TURTLE BUOC 5 — render 248 frames EEVEE -> out/frames_t/ (V-FLIPPED nhu FIX1)."""
import bpy, os, time

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
FR = os.path.join(ROOT, 'out', 'frames_t')
os.makedirs(FR, exist_ok=True)

bpy.ops.wm.open_mainfile(filepath=os.path.join(ROOT, 'out', 'turtle_rig.blend'))
scn = bpy.context.scene
scn.frame_start, scn.frame_end = 1, 248
t0 = time.time()
scn.render.filepath = os.path.join(FR, 'f####.png')
bpy.ops.render.render(animation=True)
print('[render] %.1fs cho 248 frames -> %s' % (time.time() - t0, FR))
print('RENDER_OK')
