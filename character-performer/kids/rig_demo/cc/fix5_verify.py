#!/usr/bin/env python3
"""FIX5 verify — head-copy patch structure check (headless bpy probe)."""
import bpy, json, os, sys

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
BLEND = os.path.join(ROOT, 'out', 'rabbit_rig.blend')

bpy.ops.wm.open_mainfile(filepath=BLEND)
head = bpy.data.objects['head']
out = {'objects': sorted(o.name for o in bpy.data.objects if o.type == 'MESH'),
       'patches': {}}
ok = True
for name in ('mouth', 'eyelid'):
    ob = bpy.data.objects.get(name)
    if ob is None:
        out['patches'][name] = 'MISSING'
        ok = False
        continue
    rec = {
        'parent': ob.parent.name if ob.parent else None,
        'parent_type': ob.parent_type,
        'parent_bone': ob.parent_bone,
        'basis_y': float(ob.matrix_basis.translation.y),
        'head_basis_y': float(head.matrix_basis.translation.y),
        'mpi_equals_head': [list(r) for r in ob.matrix_parent_inverse] ==
                           [list(r) for r in head.matrix_parent_inverse],
        'own_mesh': ob.data != head.data,
        'materials': [m.name for m in ob.data.materials],
        'has_AlphaKey': any(n.type == 'MATH' and n.name == 'AlphaKey'
                            for m in ob.data.materials
                            for n in m.node_tree.nodes),
    }
    rec['ok'] = (rec['parent'] == (head.parent.name if head.parent else None)
                 and rec['parent_type'] == head.parent_type
                 and rec['parent_bone'] == head.parent_bone
                 and rec['mpi_equals_head'] and rec['own_mesh'] and rec['has_AlphaKey'])
    ok = ok and rec['ok']
    out['patches'][name] = rec
out['old_mouth_eyelid_materials_gone'] = all(
    m not in bpy.data.materials for m in ('M_mouth', 'M_eyelid'))
ok = ok and out['old_mouth_eyelid_materials_gone']
print('[fix5_verify]', json.dumps(out))
print('FIX5_VERIFY_OK' if ok else 'FIX5_VERIFY_FAIL')
sys.stdout.flush(); sys.stderr.flush()
os._exit(0 if ok else 2)
