#!/usr/bin/env python3
"""FIX1 diag — solo render head + mouth (PRE-fix textures) de phan biet co che flip."""
import bpy, json, os

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
OUT = os.path.join(ROOT, 'out')
DIAG = os.path.join(OUT, 'fix_diag')
os.makedirs(DIAG, exist_ok=True)

SPRITES = ['head', 'ear_far', 'ear_near', 'body', 'arm_far', 'arm_near',
           'leg_far', 'leg_near', 'mouth', 'eyelid']

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

# packed status cua textures
info = {'images': [], 'fc_mouth': [], 'fc_eyelid': []}
for img in bpy.data.images:
    if img.filepath:
        info['images'].append({'name': img.name, 'path': os.path.basename(img.filepath),
                               'packed': bool(img.packed_file)})
def iter_fcurves(ad):
    """Blender 5.x: fcurve nam trong action layers/strips/channelbags."""
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

for nm in ('mouth', 'eyelid'):
    mat = bpy.data.materials.get(f'M_{nm}')
    ad = mat.node_tree.animation_data if mat and mat.node_tree else None
    if ad:
        for fc in iter_fcurves(ad):
            info[f'fc_{nm}'].append({'dp': fc.data_path, 'nkeys': len(fc.keyframe_points)})
print('[diag]', json.dumps(info))

names = [n for n in SPRITES if n in bpy.data.objects]
# REST POSE: bo action armature + action tren sprite objects (f=1 co squash key)
for ob in bpy.data.objects:
    if ob.type == 'ARMATURE' or ob.name in names:
        if ob.animation_data and ob.animation_data.action:
            print(f'[diag] clear action: {ob.name} <- {ob.animation_data.action.name}')
            ob.animation_data.action = None
scn.frame_set(1)

def solo(nm, out_png):
    for m in names:
        bpy.data.objects[m].hide_render = (m != nm)
    scn.render.filepath = out_png
    bpy.ops.render.render(write_still=True)

solo('head', os.path.join(DIAG, 'head_pre.png'))

# mouth: muting alpha fcurve + force AlphaKey input = 1 (session-only, khong save)
muted = []
for nm in ('mouth', 'eyelid'):
    mat = bpy.data.materials.get(f'M_{nm}')
    ad = mat.node_tree.animation_data if mat and mat.node_tree else None
    if ad:
        for fc in iter_fcurves(ad):
            if 'AlphaKey' in fc.data_path:
                fc.mute = True
                muted.append(f'{nm}:{fc.data_path}')
    node = next((n for n in mat.node_tree.nodes if n.name == 'AlphaKey'), None)
    if node:
        node.inputs[1].default_value = 1.0
print('[diag] muted:', muted)
solo('mouth', os.path.join(DIAG, 'mouth_pre.png'))
print('DIAG_OK')
