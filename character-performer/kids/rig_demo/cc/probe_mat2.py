import bpy, json, os
from mathutils import Vector, Matrix
ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
META = json.load(open(os.path.join(ROOT, 'out', 'clean_meta.json')))
P = META['parts']
bpy.ops.wm.open_mainfile(filepath=os.path.join(ROOT, 'out', 'rabbit_rig.blend'))
scn = bpy.context.scene; scn.frame_set(1)
bpy.context.view_layer.update()
for name, mkey in [('head','head'),('body','body'),('leg_near','leg_right'),('arm_near','arm_near')]:
    ob = bpy.data.objects[name]; rec = P[mkey]
    scale, delta = rec['scale'], rec.get('delta_deg',0.0) or 0.0
    want = (Matrix.Translation(ob.location) @ Matrix.Rotation(ob.rotation_euler.y,4,'Y')
            @ Matrix.Diagonal((scale,1.0,scale,1.0)).to_4x4())
    w = ob.matrix_world
    tr = (w @ Vector((0,0,0))) - (want @ Vector((0,0,0)))
    print(f'{name}: dLoc=({tr.x:+.3f},{tr.z:+.3f}) mpi={tuple(round(v,3) for v in ob.matrix_parent_inverse.translation)}')
