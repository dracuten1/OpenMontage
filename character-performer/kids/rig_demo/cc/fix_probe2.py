#!/usr/bin/env python3
"""FIX1 diag2 — re-normalize placement sau load (chong COA rebake) roi solo head/mouth.
Quyet dinh: (a) normalization co pin duoc world=WANTS khong, (b) content upright hay vflip."""
import addon_utils, bpy, json, math, os
from mathutils import Matrix, Vector

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
OUT = os.path.join(ROOT, 'out')
DIAG = os.path.join(OUT, 'fix_diag')
META = json.load(open(os.path.join(OUT, 'clean_meta.json')))
P = META['parts']

SPRITES = {  # name -> (meta_key, zidx)  — placement y nhu rig_build (y_layer = (9-zidx)*0.01)
    'head': ('head', 4), 'ear_far': ('ear_tilt', 5), 'ear_near': ('ear_near', 7),
    'body': ('body', 2), 'arm_far': ('arm_far', 1), 'arm_near': ('arm_near', 6),
    'leg_far': ('leg_left', 0), 'leg_near': ('leg_right', 3),
    'mouth': ('head', 8), 'eyelid': ('head', 9)}

bpy.ops.wm.open_mainfile(filepath=os.path.join(OUT, 'rabbit_rig.blend'))
scn = bpy.context.scene
scn.render.resolution_x, scn.render.resolution_y = 1536, 1024
try:
    scn.render.engine = 'BLENDER_EEVEE_NEXT'
except TypeError:
    try:
        scn.render.engine = 'BLENDER_EEVEE'
    except TypeError:
        scn.render.engine = 'CYCLES'
# verify can pixel-exact: bo AgX color transform
try:
    scn.view_settings.view_transform = 'Standard'
    print('[diag2] view_transform -> Standard')
except TypeError as e:
    print('[diag2] view_transform FAIL:', e)

print('[diag2] coa_tools2 enabled:', addon_utils.check('coa_tools2')[0])
ob_head = bpy.data.objects['head']
print('[diag2] head mpi diag:', [round(v, 3) for v in ob_head.matrix_parent_inverse.col[3].to_4d()[:3]] if hasattr(ob_head.matrix_parent_inverse, 'col') else '?')
print('[diag2] head loc (pre-norm):', tuple(round(v, 4) for v in ob_head.matrix_world.translation))

# --- clear actions (rest pose) ---
actions = {}
for ob in bpy.data.objects:
    if ob.animation_data and ob.animation_data.action:
        actions[ob.name] = ob.animation_data.action
        ob.animation_data.action = None
print('[diag2] cleared actions:', {k: v.name for k, v in actions.items()})

# --- normalization pass (dung code rig_build) ---
WANTS = {}
for name, (mkey, zidx) in SPRITES.items():
    ob = bpy.data.objects.get(name)
    rec = P[mkey]
    piv_pup, scale, delta = rec['pivot_puppet'], rec['scale'], rec.get('delta_deg', 0.0) or 0.0
    ob.matrix_parent_inverse = Matrix.Identity(4)
    y_layer = (9 - zidx) * 0.01
    WANTS[name] = (Matrix.Translation(Vector((piv_pup[0] * 0.01, y_layer, piv_pup[1] * 0.01)))
                   @ Matrix.Rotation(-math.radians(delta), 4, 'Y')
                   @ Matrix.Diagonal((scale, 1.0, scale, 1.0)).to_4x4())
bpy.context.view_layer.update()
# CONG THUC DUNG cho P bat ky (bone parenting active): basis_new = basis_old @ world_old^-1 @ want
# (rig_build dung want @ world^-1 @ basis — chi dung khi P=Identity nhu build-time)
for name, ob in ((n, bpy.data.objects.get(n)) for n in SPRITES):
    ob.matrix_basis = ob.matrix_basis @ ob.matrix_world.copy().inverted() @ WANTS[name]
bpy.context.view_layer.update()
w = bpy.data.objects['head'].matrix_world.translation
print('[diag2] head loc (post-norm):', tuple(round(v, 4) for v in w), '(want ~7.70, 5.20)')

# --- solo render head + mouth ---
names = [n for n in SPRITES if n in bpy.data.objects]
scn.frame_set(1)


def iter_fcurves(ad):
    act = ad.action
    if act is None:
        return []
    if hasattr(act, 'fcurves'):
        return list(act.fcurves)
    out = []
    for layer in getattr(act, 'layers', []):
        for strip in getattr(layer, 'strips', []):
            for bag in getattr(strip, 'channelbags', []):
                out.extend(bag.fcurves)
    return out


for nm in ('mouth', 'eyelid'):  # buoc alpha = 1 de thay patch (mute fcurve, session-only)
    mat = bpy.data.materials.get(f'M_{nm}')
    ad = mat.node_tree.animation_data if mat and mat.node_tree else None
    if ad and ad.action:
        for fc in iter_fcurves(ad):
            if 'AlphaKey' in fc.data_path:
                fc.mute = True
    node = next((n for n in mat.node_tree.nodes if n.name == 'AlphaKey'), None)
    if node:
        node.inputs[1].default_value = 1.0


def solo(nm, out_png):
    for m in names:
        bpy.data.objects[m].hide_render = (m != nm)
    scn.render.filepath = out_png
    bpy.ops.render.render(write_still=True)


solo('head', os.path.join(DIAG, 'head_norm.png'))
solo('mouth', os.path.join(DIAG, 'mouth_norm.png'))
print('DIAG2_OK')
