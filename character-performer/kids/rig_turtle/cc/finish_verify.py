#!/usr/bin/env python3
"""PHASE-A finish_verify — turtle rig structural + motion checks (headless bpy).
Adapted from rig_demo/cc/fix5_verify.py. Checks:
 (a) each leg sprite bound to its OWN leg_*_b bone (not hips)
 (b) mouth/eyelid = head-copy meshes parented like head, own mesh + M_mouth/M_eyelid,
     matrix_parent_inverse == head's
 (c) animation keys cover 1..248 (no channel stopping early)
 (d) in-plane rotations keyed on LOCAL Z euler (index 2)
 (e) head bone world-matrix residual @ frames 1/7/13/19 (<1e-4 off-plane)
 (f) sway/head rotation amplitudes from fcurve keys (body<=1deg, head<=3deg)
Writes out/qc_rig_verify.json; exit 0 all-pass else 2.
"""
import bpy, json, math, os, sys, time
from itertools import combinations

T0 = time.time()
ROOT = '/Users/tuyennguyen/project/OpenMontage/character-performer/kids/rig_turtle'
BLEND = os.path.join(ROOT, 'out', 'turtle_rig.blend')
OUTJ = os.path.join(ROOT, 'out', 'qc_rig_verify.json')

bpy.ops.wm.open_mainfile(filepath=BLEND)
scene = bpy.context.scene
res = {'blend': BLEND, 'blender': bpy.app.version_string,
       'frame_range': [scene.frame_start, scene.frame_end],
       't_open_s': round(time.time() - T0, 2), 'checks': {}}

LEGS = ['leg_near_front', 'leg_far_front', 'leg_near_hind', 'leg_far_hind']


def resolve(name):
    if name in bpy.data.objects:
        return bpy.data.objects[name]
    for o in bpy.data.objects:
        if o.type == 'MESH' and o.name.lower().startswith(name):
            return o
    for o in bpy.data.objects:
        if o.type == 'MESH' and name in o.name.lower():
            return o
    return None


arms = [o for o in bpy.data.objects if o.type == 'ARMATURE']
res['armature'] = arms[0].name if arms else None
arm = arms[0]
pose_bones = sorted(b.name for b in arm.pose.bones)
res['pose_bones'] = pose_bones
res['mesh_objects'] = sorted(o.name for o in bpy.data.objects if o.type == 'MESH')

# ---------------- (a) leg binding ----------------
ok_a = True
det_a = {}
for lg in LEGS:
    o = resolve(lg)
    bone_name = lg + '_b'
    rec = {'resolved_object': o.name if o else None}
    if o is None:
        rec['error'] = 'object not found'
        ok_a = False
        det_a[lg] = rec
        continue
    vg_weights = {}
    for g in o.vertex_groups:
        tot = sum(el.weight for v in o.data.vertices for el in v.groups
                  if el.group == g.index)
        vg_weights[g.name] = round(tot, 3)
    bone_vgs = [k for k, v in vg_weights.items() if v > 0 and k in pose_bones]
    rec.update({
        'parent': o.parent.name if o.parent else None,
        'parent_type': o.parent_type,
        'parent_bone': o.parent_bone,
        'modifiers': [m.type for m in o.modifiers],
        'vertex_group_weights': vg_weights,
        'deforming_bone_vgs': bone_vgs,
    })
    bound_ok = (rec['parent_bone'] == bone_name) or (bone_vgs == [bone_name])
    not_hips = ('hips' not in bone_vgs) and (rec['parent_bone'] != 'hips')
    rec['own_bone_only'] = bool(bound_ok and not_hips and len(bone_vgs) <= 1)
    ok_a = ok_a and rec['own_bone_only']
    det_a[lg] = rec
res['checks']['a_leg_binding'] = {'pass': bool(ok_a), 'detail': det_a}

# ---------------- (b) mouth / eyelid head-copy patches ----------------
head = resolve('head')
ok_b = True
det_b = {'head_object': head.name if head else None}
if head is None:
    ok_b = False
    det_b['error'] = 'head object not found'
else:
    for label, names, matname in (('mouth', ('mouth_open', 'mouth'), 'M_mouth'),
                                  ('eyelid', ('eyelid', 'lid'), 'M_eyelid')):
        o = None
        for n in names:
            o = resolve(n)
            if o is not None:
                break
        rec = {'resolved_object': o.name if o else None}
        if o is None:
            rec['error'] = 'object not found'
            ok_b = False
            det_b[label] = rec
            continue
        mpi_diff = max(abs(o.matrix_parent_inverse[r][c] - head.matrix_parent_inverse[r][c])
                       for r in range(4) for c in range(4))
        mats = [m.name if m else None for m in o.data.materials]
        same_parent = (o.parent == head.parent and o.parent_type == head.parent_type
                       and o.parent_bone == head.parent_bone)
        rec.update({
            'parent': o.parent.name if o.parent else None,
            'parent_type': o.parent_type,
            'parent_bone': o.parent_bone,
            'head_parent_bone': head.parent_bone,
            'same_parent_as_head': bool(same_parent),
            'mpi_max_abs_diff_vs_head': float(mpi_diff),
            'own_mesh': o.data != head.data,
            'n_verts': len(o.data.vertices),
            'head_n_verts': len(head.data.vertices),
            'materials': mats,
            'has_mat': matname in mats,
        })
        rec['ok'] = bool(same_parent and mpi_diff < 1e-7 and o.data != head.data
                         and matname in mats)
        ok_b = ok_b and rec['ok']
        det_b[label] = rec
res['checks']['b_head_copy_patches'] = {'pass': bool(ok_b), 'detail': det_b}

# ---------------- (c)+(d) fcurve coverage / euler channels ----------------
def iter_action_fcurves(action):
    """Blender 5.x slotted actions: fcurves live in layer strips' channelbags."""
    fcs = []
    for layer in action.layers:
        for strip in layer.strips:
            for cb in strip.channelbags:
                fcs.extend(cb.fcurves)
    return fcs


def collect_fcurves():
    out = []
    for ob in bpy.data.objects:
        ad = ob.animation_data
        if ad and ad.action:
            for fc in iter_action_fcurves(ad.action):
                ks = [k.co[0] for k in fc.keyframe_points]
                out.append({'object': ob.name, 'data_path': fc.data_path,
                            'array_index': fc.array_index,
                            'f_min': float(min(ks)), 'f_max': float(max(ks)),
                            'n_keys': len(ks), 'fcurve': fc})
    return out

fcs = collect_fcurves()
ok_c = True
det_c = {'n_objects_with_action': len({f['object'] for f in fcs}),
         'n_fcurves': len(fcs), 'channels': {}}
for f in fcs:
    key = "%s|%s[%d]" % (f['object'], f['data_path'], f['array_index'])
    det_c['channels'][key] = [f['f_min'], f['f_max'], f['n_keys']]
    if f['f_max'] < 248:
        ok_c = False
        det_c.setdefault('stopping_early', []).append(key)
if not fcs:
    ok_c = False
    det_c['error'] = 'no animation found'
res['checks']['c_key_coverage_1_248'] = {'pass': bool(ok_c), 'detail': det_c}

# (d) in-plane euler index per pose bone + amplitudes
arm_fcs = [f for f in fcs if f['object'] == arm.name]
det_d = {'bones': {}}
ok_d = True
amp = {}
for bname in pose_bones:
    dp = 'pose.bones["%s"].rotation_euler' % bname
    idxs = sorted({f['array_index'] for f in arm_fcs if f['data_path'] == dp})
    rec = {'euler_indices_keyed': idxs}
    for idx in idxs:
        fc = next(f['fcurve'] for f in arm_fcs
                  if f['data_path'] == dp and f['array_index'] == idx)
        cy = [fc.evaluate(fr) for fr in range(1, 25)]
        al = [fc.evaluate(fr) for fr in range(1, 249)]
        rec['idx%d_deg' % idx] = {
            'cycle_amp_deg': round((max(cy) - min(cy)) * 180 / math.pi, 4),
            'full_amp_deg': round((max(al) - min(al)) * 180 / math.pi, 4)}
        amp[(bname, idx)] = (rec['idx%d_deg' % idx]['cycle_amp_deg'],
                             rec['idx%d_deg' % idx]['full_amp_deg'])
    if bname in ('hips', 'head_b', 'tail_b'):
        rec['in_plane_local_Z_keyed'] = 2 in idxs
        ok_d = ok_d and (2 in idxs)
    det_d['bones'][bname] = rec
res['checks']['d_in_plane_local_z'] = {'pass': bool(ok_d), 'detail': det_d}

# ---------------- (f) amplitudes vs budget ----------------
sway = amp.get(('hips', 2), (None, None))
head_amp = amp.get(('head_b', 2), (None, None))
det_f = {'hips_eulerZ_cycle_deg': sway[0], 'hips_eulerZ_full_deg': sway[1],
         'head_eulerZ_cycle_deg': head_amp[0], 'head_eulerZ_full_deg': head_amp[1],
         'budget_sway_deg': 1.0, 'budget_head_deg': 3.0}
ok_f = (sway[0] is not None and sway[0] <= 1.0 and head_amp[0] is not None
        and head_amp[0] <= 3.0)
res['checks']['f_amplitudes'] = {'pass': bool(ok_f), 'detail': det_f}

# ---------------- (e) head world-matrix residual @ 1/7/13/19 ----------------
SAMPLES = (1, 7, 13, 19)
det_e = {'frames': list(SAMPLES), 'head_bone': {}, 'patch_vs_head': {}}
head_m = {}
head_obj_m = {}
patch_m = {'mouth': {}, 'eyelid': {}}
mo = resolve('mouth_open') or resolve('mouth')
eo = resolve('eyelid') or resolve('lid')
for fr in SAMPLES:
    scene.frame_set(fr)
    bpy.context.view_layer.update()
    dg = bpy.context.evaluated_depsgraph_get()
    dg.update()
    head_m[fr] = arm.matrix_world @ arm.pose.bones['head_b'].matrix
    head_obj_m[fr] = head.matrix_world.copy()
    if mo:
        patch_m['mouth'][fr] = mo.matrix_world.copy()
    if eo:
        patch_m['eyelid'][fr] = eo.matrix_world.copy()


def mat_stats(d):
    per = {}
    for r in range(4):
        for c in range(4):
            vals = [m[r][c] for m in d.values()]
            per['m%d%d' % (r, c)] = round(max(vals) - min(vals), 8)
    tr = {ax: round(max(m.to_translation()[i] for m in d.values())
                    - min(m.to_translation()[i] for m in d.values()), 8)
          for i, ax in enumerate('xyz')}
    return per, tr


per, tr = mat_stats(head_m)
det_e['head_bone']['element_spread'] = per
det_e['head_bone']['translation_spread'] = tr
det_e['head_bone']['rot3x3_spread_max'] = max(v for k, v in per.items()
                                              if 'm3' not in k)
# Out-of-plane leakage = world-Y coupling: row-1 elements (m10,m11,m12) of the
# rotation part must not vary, and translation Y must not drift. In-plane
# swing (XZ-plane elements incl. m00/m02/m20/m22 of a tilted bone) is ALLOWED.
y_row = max(per['m10'], per['m11'], per['m12'])
det_e['head_bone']['out_of_plane_leakage_max'] = y_row
ok_e = (tr['y'] < 1e-4 and y_row < 1e-4)
# rotation-axis sanity: relative motion between samples should be about world Y
f1, f2 = SAMPLES[0], SAMPLES[2]
rel = head_m[f2].inverted() @ head_m[f1]
det_e['head_bone']['sample_axis_1_13'] = [round(v, 5) for v in
                                          (list(rel.to_quaternion().axis) +
                                           [rel.to_quaternion().angle])]
for label, d in patch_m.items():
    if not d:
        continue
    rels = {}
    # patch tracks head OBJECT: LOCAL relative transform must be constant (<1e-4)
    # (world-space rel = R @ Bm @ Bh^-1 @ R^-1 rotates the offset by design)
    rel = {f: head_obj_m[f].inverted() @ d[f] for f in SAMPLES}
    rper, rtr = mat_stats(rel)
    rels['rel_element_spread'] = rper
    rels['rel_translation_spread'] = rtr
    det_e['patch_vs_head'][label] = rels
    rel_spread = max(list(rper.values()) + list(rtr.values()))
    rels['rel_spread_max'] = rel_spread
    if rel_spread >= 1e-4:
        ok_e = False
det_e['pass_detail'] = {'trans_y': tr['y'],
                        'out_of_plane_row_max': y_row,
                        'bone_plane_stability': bool(ok_e),
                        'note': 'criterion: world-Y row (m10,m11,m12) + trans Y; '
                                'in-plane XZ swing allowed'}
ok_e_all = ok_e and all(v['rel_spread_max'] < 1e-4
                        for v in det_e['patch_vs_head'].values())
det_e['patch_tracking_pass'] = all(v['rel_spread_max'] < 1e-4
                                   for v in det_e['patch_vs_head'].values())
res['checks']['e_head_stability'] = {'pass': bool(ok_e_all), 'detail': det_e}

res['t_total_s'] = round(time.time() - T0, 2)
res['all_pass'] = all(res['checks'][k]['pass'] for k in res['checks'])
json.dump(res, open(OUTJ, 'w'), indent=1)
print('[finish_verify] all_pass=%s' % res['all_pass'])
for k, v in res['checks'].items():
    print('  %s pass=%s' % (k, v['pass']))
print('FINISH_VERIFY_OK' if res['all_pass'] else 'FINISH_VERIFY_FAIL')
sys.stdout.flush(); sys.stderr.flush()
os._exit(0 if res['all_pass'] else 2)
