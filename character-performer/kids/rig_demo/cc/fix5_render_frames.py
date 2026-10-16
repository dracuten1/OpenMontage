#!/usr/bin/env python3
"""FIX5 smoke render — specific frames through the SAME render entry as the
pipeline (render_composite.py settings: open blend, engine fallback,
out/frames/f%04d.png, 1536x1024 RGBA transparent).

Usage: blender -b out/rabbit_rig.blend --python cc/fix5_render_frames.py -- 116,117,133,134
"""
import bpy, json, os, sys, time

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
OUT = os.path.join(ROOT, 'out')
FR = os.path.join(OUT, 'frames')
os.makedirs(FR, exist_ok=True)

argv = sys.argv[sys.argv.index('--') + 1:] if '--' in sys.argv else []
FRAMES = [int(x) for x in argv[0].split(',')] if argv else []

bpy.ops.wm.open_mainfile(filepath=os.path.join(OUT, 'rabbit_rig.blend'))
scn = bpy.context.scene
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
for f in FRAMES:
    scn.frame_set(f)
    scn.render.filepath = os.path.join(FR, 'f%04d.png' % f)
    bpy.ops.render.render(write_still=True)
    print('[fix5_render] wrote f%04d.png' % f)
json.dump({'engine': ENGINE, 'frames': FRAMES,
           't_render_s': round(time.time() - t0, 1)},
          open(os.path.join(OUT, 'fix5_smoke_render_meta.json'), 'w'), indent=1)
print('[fix5_render] engine=%s frames=%s t=%.1fs' % (ENGINE, FRAMES, time.time() - t0))
print('FIX5_RENDER_OK' if all(os.path.exists(os.path.join(FR, 'f%04d.png' % f)) for f in FRAMES)
      else 'FIX5_RENDER_FAIL')
