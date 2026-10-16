#!/usr/bin/env python3
"""Probe: matrix_world vs want (T(loc)@Ry@S) cho tung sprite."""
import bpy, json, os, math
from mathutils import Vector, Matrix

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
OUT = os.path.join(ROOT, 'out')
META = json.load(open(os.path.join(OUT, 'clean_meta.json')))
P = META['parts']
SPR = {'head':('head','head_b'),'ear_far':('ear_tilt','ear_far_b'),'ear_near':('ear_tilt','ear_near_b'),
       'body':('body','hips'),'arm_far':('arm_far','arm_far_b'),'arm_near':('arm_near','arm_near_b'),
       'leg_far':('leg_left','leg_far_b'),'leg_near':('leg_left','leg_near_b')}
bpy.ops.wm.open_mainfile(filepath=os.path.join(OUT, 'rabbit_rig.blend'))
scn = bpy.context.scene
scn.frame_set(1)
bpy.context.view_layer.update()
arm = bpy.data.objects['SpriteObject']
for name, (mkey, bn) in SPR.items():
    ob = bpy.data.objects[name]
    rec = P[mkey] if name not in ('ear_near',) else P['ear_near']
    if name == 'leg_near': rec = P['leg_right']
    if name == 'ear_far': rec = P['ear_tilt']
    scale, delta = rec['scale'], rec.get('delta_deg', 0.0) or 0.0
    want = (Matrix.Translation(ob.location)
            @ Matrix.Rotation(ob.rotation_euler.y, 4, 'Y')
            @ Matrix.Diagonal((scale, 1.0, scale, 1.0)).to_4x4())
    w = ob.matrix_world
    d = w.inverted() @ want
    tr = (w @ Vector((0,0,0))) - (want @ Vector((0,0,0)))
    pbm = arm.pose.bones[bn].matrix
    # parent matrix Blender dung luc nay:
    pm = arm.matrix_world @ pbm
    eff = ob.matrix_basis @ ob.matrix_parent_inverse @ pm
    print(f'{name:9s} dLoc=({tr.x:+.3f},{tr.z:+.3f}) world==eff_parent_chain={ (w-eff).translation.length < 1e-6 }'
          f' mpi==pm^-1={ (ob.matrix_parent_inverse - pm.inverted()).translation.length < 1e-6 }')
