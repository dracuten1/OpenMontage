#!/usr/bin/env python3
"""Probe: solo-render tung part (lowres 1:4) -> content bbox px canvas, so expected."""
import bpy, json, os
import numpy as np

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
OUT = os.path.join(ROOT, 'out')
META = json.load(open(os.path.join(OUT, 'clean_meta.json')))
P = META['parts']
EXPECT = {'head': P['head']['world_bbox'], 'ear_far': P['ear_tilt']['world_bbox'],
          'ear_near': P['ear_near']['world_bbox'], 'body': P['body']['world_bbox'],
          'arm_far': P['arm_far']['world_bbox'], 'arm_near': P['arm_near']['world_bbox'],
          'leg_far': P['leg_left']['world_bbox'], 'leg_near': P['leg_left']['world_bbox']}
SOLO = ['ear_near', 'ear_far', 'leg_near', 'arm_near', 'head']

bpy.ops.wm.open_mainfile(filepath=os.path.join(OUT, 'rabbit_rig.blend'))
scn = bpy.context.scene
scn.render.resolution_x, scn.render.resolution_y = 384, 256
names = [n for n in EXPECT if n in bpy.data.objects] + ['mouth', 'eyelid']
for n in names:
    bpy.data.objects[n].hide_render = (n not in SOLO)
scn.frame_set(1)
for n in SOLO:
    for m in names:
        bpy.data.objects[m].hide_render = (m != n)
    scn.render.filepath = os.path.join(OUT, f'solo_{n}.png')
    bpy.ops.render.render(write_still=True)
    img = bpy.data.images.load(os.path.join(OUT, f'solo_{n}.png'), check_existing=False)
    arr = np.array(img.pixels).reshape(256, 384, 4)
    am = arr[:, :, 3] > 0.1
    ys, xs = np.nonzero(am)
    if len(xs) == 0:
        print(f'{n}: EMPTY (alpha key=0?)')
        continue
    rb = [int(xs.min()) * 4, int(ys.min()) * 4, int(xs.max()) * 4, int(ys.max()) * 4]
    print(f'{n}: render_bbox={rb}  expected={ [round(v) for v in EXPECT[n]] }')

# UV cua 4 vert dau cua ear_near
ob = bpy.data.objects['ear_near']
uv = ob.data.uv_layers.active
print('ear_near UV+vert:')
for i, loop in enumerate(ob.data.loops):
    if i >= 4: break
    v = ob.data.vertices[loop.vertex_index]
    print(f'  uv={tuple(round(c,3) for c in uv.data[i].uv)} vert={tuple(round(c,2) for c in v.co)}')
