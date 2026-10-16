#!/usr/bin/env python3
"""FIX2 solo — 1 talk frame (f150, mid-talk): solo mouth patch (alpha force 1)
+ ensemble head (head+ear_far+ear_near) -> out/solo_fix2/*.png cho PIL bbox verify.
Session-only alpha force (không save blend), copy logic fix_solo.py của FIX1."""
import bpy, os

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
OUT = os.path.join(ROOT, 'out')
SOLO = os.path.join(OUT, 'solo_fix2')
os.makedirs(SOLO, exist_ok=True)
F = 150  # talk frame (110..216), ~ t=6.25s trong clip

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
scn.view_settings.view_transform = 'Standard'
scn.frame_set(F)


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


# buoc alpha=1 de thay patch duoc (session-only)
for nm in ('mouth', 'eyelid'):
    mat = bpy.data.materials.get(f'M_{nm}')
    ad = mat.node_tree.animation_data if mat and mat.node_tree else None
    if ad and ad.action:
        for fc in iter_fcurves(ad):
            if 'AlphaKey' in fc.data_path:
                fc.mute = True
    node = next((n for n in mat.node_tree.nodes if n.name == 'AlphaKey'), None)
    if node:
        node.inputs[1].default_value = 1.0

ALL = ['head', 'ear_far', 'ear_near', 'body', 'arm_far', 'arm_near',
       'leg_far', 'leg_near', 'mouth', 'eyelid']
SHOTS = {'solo_mouth_f150': ['mouth'], 'solo_head_f150': ['head', 'ear_far', 'ear_near']}
for stem, vis in SHOTS.items():
    for m in ALL:
        bpy.data.objects[m].hide_render = (m not in vis)
    scn.render.filepath = os.path.join(SOLO, stem + '.png')
    bpy.ops.render.render(write_still=True)
    print(f'[fix2-solo] {stem} done')
print('FIX2_SOLO_OK')
