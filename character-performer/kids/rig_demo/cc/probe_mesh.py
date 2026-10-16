#!/usr/bin/env python3
"""Probe: dump mesh structure cua head/leg_near/ear_near."""
import bpy, os

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
bpy.ops.wm.open_mainfile(filepath=os.path.join(ROOT, 'out', 'rabbit_rig.blend'))

for nm in ('head', 'leg_near', 'ear_near'):
    ob = bpy.data.objects[nm]
    me = ob.data
    print(f'== {nm}: n_verts={len(me.vertices)} n_loops={len(me.loops)} '
          f'mods={[m.type for m in ob.modifiers]} parent={ob.parent.name}/{ob.parent_bone} '
          f'loc={tuple(round(v,3) for v in ob.location)} scale={tuple(round(v,3) for v in ob.scale)}')
    uv = me.uv_layers.active
    for i, v in enumerate(me.vertices):
        if i >= 6: break
        print(f'   v{i}: {tuple(round(c,3) for c in v.co)}')
    if uv:
        for i in range(min(6, len(me.loops))):
            print(f'   loop{i}: v={me.loops[i].vertex_index} uv={tuple(round(c,3) for c in uv.data[i].uv)}')
    m = ob.material_slots[0].material
    print(f'   mat={m.name} nodes={[n.type for n in m.node_tree.nodes]}')
    tex = next((n for n in m.node_tree.nodes if n.type == 'TEX_IMAGE'), None)
    if tex:
        print(f'   tex img={tex.image.name} size={tex.image.size[0]}x{tex.image.size[1]} '
              f'filepath_tail={os.path.basename(tex.image.filepath)}')
        print(f'   img mapped cycles: src={tex.image.source} packed={tex.image.packed_file is not None}')
