#!/usr/bin/env python3
"""Probe: per-sprite world bbox (px) so voi expected tu clean_meta."""
import bpy, json, os
import numpy as np

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
OUT = os.path.join(ROOT, 'out')
META = json.load(open(os.path.join(OUT, 'clean_meta.json')))
P = META['parts']
EXPECT = {
    'head': P['head']['world_bbox'], 'ear_far': P['ear_tilt']['world_bbox'],
    'ear_near': P['ear_near']['world_bbox'], 'body': P['body']['world_bbox'],
    'arm_far': P['arm_far']['world_bbox'], 'arm_near': P['arm_near']['world_bbox'],
    'leg_far': P['leg_left']['world_bbox'], 'leg_near': P['leg_left']['world_bbox'],
}
bpy.ops.wm.open_mainfile(filepath=os.path.join(OUT, 'rabbit_rig.blend'))
print(f"{'obj':9s} {'render_bbox':26s} {'expected':26s} delta")
for name in EXPECT:
    ob = bpy.data.objects[name]
    ws = np.array([list(ob.matrix_world @ v.co) for v in ob.data.vertices])
    x = ws[:, 0] / 0.01
    y = -ws[:, 2] / 0.01
    rb = [round(float(x.min()), 1), round(float(y.min()), 1), round(float(x.max()), 1), round(float(y.max()), 1)]
    e = EXPECT[name]
    d = [round(rb[i] - e[i], 1) for i in range(4)]
    print(f"{name:9s} {str(rb):26s} {str(e):26s} {d}")
    print(f"          loc={tuple(round(v,3) for v in ob.location)} rot={tuple(round(v,4) for v in ob.rotation_euler)} scale={tuple(round(v,3) for v in ob.scale)} parent={ob.parent_bone}")
