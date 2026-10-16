#!/usr/bin/env python3
"""FIX1 solo — render 10 sprite solo tu blend DA pin placement (dieu kien giong render:
actions active, frame 1). view_transform=Standard de so pixel-exact voi PNG nguon."""
import bpy, os

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
OUT = os.path.join(ROOT, 'out')
SOLO = os.path.join(OUT, 'solo_fix')
os.makedirs(SOLO, exist_ok=True)
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
scn.view_settings.view_transform = 'Standard'
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


for nm in ('mouth', 'eyelid'):  # buoc alpha=1 de thay patch (session-only, khong save)
    mat = bpy.data.materials.get(f'M_{nm}')
    ad = mat.node_tree.animation_data if mat and mat.node_tree else None
    if ad and ad.action:
        for fc in iter_fcurves(ad):
            if 'AlphaKey' in fc.data_path:
                fc.mute = True
    node = next((n for n in mat.node_tree.nodes if n.name == 'AlphaKey'), None)
    if node:
        node.inputs[1].default_value = 1.0

for nm in SPRITES:
    for m in SPRITES:
        bpy.data.objects[m].hide_render = (m != nm)
    scn.render.filepath = os.path.join(SOLO, f'solo_{nm}.png')
    bpy.ops.render.render(write_still=True)
    print(f'[solo] {nm} done')
print('SOLO_OK')
