#!/usr/bin/env python3
"""PHASE-B finish_render — full overwrite f0001..f0248 from the FIXED blend.
Adapted from rig_turtle/cc/render_frames.py (same settings: EEVEE, 1536x1024,
film transparent, V-FLIPPED storage via build UVs). Writes render meta JSON.
"""
import bpy, json, os, sys, time

ROOT = '/Users/tuyennguyen/project/OpenMontage/character-performer/kids/rig_turtle'
FR = os.path.join(ROOT, 'out', 'frames_t')
os.makedirs(FR, exist_ok=True)

bpy.ops.wm.open_mainfile(filepath=os.path.join(ROOT, 'out', 'turtle_rig.blend'))
# pick up PIL-underpainted part textures from out/parts/
reloaded = []
for img in bpy.data.images:
    if 'parts' in (img.filepath or ''):
        was_packed = img.packed_file is not None
        img.reload()
        if was_packed:
            img.pack()
        reloaded.append(os.path.basename(img.filepath))
bpy.ops.wm.save_mainfile(filepath=os.path.join(ROOT, 'out', 'turtle_rig.blend'))
scn = bpy.context.scene
scn.frame_start, scn.frame_end = 1, 248
t0 = time.time()
scn.render.filepath = os.path.join(FR, 'f####.png')
bpy.ops.render.render(animation=True)
dt = time.time() - t0
n = len([f for f in os.listdir(FR) if f.endswith('.png')])
meta = {'frames': n, 'duration_s': round(dt, 1), 'dir': FR,
        'res': [scn.render.resolution_x, scn.render.resolution_y],
        'engine': str(scn.render.engine)}
json.dump(meta, open(os.path.join(ROOT, 'out', 'render_meta.json'), 'w'), indent=1)
print('[render]', json.dumps(meta))
print('RENDER_OK' if n == 248 else 'RENDER_FRAMECOUNT_FAIL')
sys.stdout.flush(); os._exit(0 if n == 248 else 4)
