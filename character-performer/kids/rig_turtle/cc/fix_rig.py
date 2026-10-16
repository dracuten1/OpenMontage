#!/usr/bin/env python3
"""PHASE-B fix_rig — repair turtle_rig.blend in place (backup first).
Fixes: (a) leg sprites -> own leg_*_b bones; (c) all channels keyed to f248;
(d) body rotations on LOCAL Z euler; (e) in-plane only (roll-align Z to world Y);
(f) hips sway <=1deg, head <=3deg. Mouth/eyelid material actions UNTOUCHED.
Gait: original diagonal target curves (NF+FH @0, NH+FF @12, 24f period) looped 1..248.
"""
import bpy, json, math, os, shutil, sys, time
from mathutils import Matrix

T0 = time.time()
ROOT = '/Users/tuyennguyen/project/OpenMontage/character-performer/kids/rig_turtle'
BLEND = os.path.join(ROOT, 'out', 'turtle_rig.blend')
BACKUP = os.path.join(ROOT, 'out', 'turtle_rig_pre_fix.blend')
OUTJ = os.path.join(ROOT, 'out', 'fix_rig.json')

if not os.path.exists(BACKUP):
    shutil.copy(BLEND, BACKUP)
bpy.ops.wm.open_mainfile(filepath=BLEND)
arm = next(o for o in bpy.data.objects if o.type == 'ARMATURE')
sc = bpy.context.scene
res = {'backup': BACKUP, 'steps': {}}
LEGS = ['leg_near_front', 'leg_far_front', 'leg_near_hind', 'leg_far_hind']

def fcurves_of(ob):
    r = []
    ad = ob.animation_data
    if ad and ad.action:
        for layer in ad.action.layers:
            for strip in layer.strips:
                for cb in strip.channelbags:
                    r.extend(cb.fcurves)
    return r

def find_fc(ob, path, idx):
    for fc in fcurves_of(ob):
        if fc.data_path == path and fc.array_index == idx:
            return fc
    return None

def rm_fc(ob, path, idx):
    ad = ob.animation_data
    if not (ad and ad.action):
        return
    for layer in ad.action.layers:
        for strip in layer.strips:
            for cb in strip.channelbags:
                for fc in list(cb.fcurves):
                    if fc.data_path == path and fc.array_index == idx:
                        cb.fcurves.remove(fc)

# ---- 0. capture old curve samples (pure math, valid regardless of mute) ----
cap = {}
for ob in list(bpy.data.objects):
    for fc in fcurves_of(ob):
        key = (ob.name, fc.data_path, fc.array_index)
        cap[key] = {'vals': [fc.evaluate(f) for f in range(1, 249)],
                    'interp': fc.keyframe_points[0].interpolation if len(fc.keyframe_points) else 'BEZIER',
                    'key_times': [int(k.co[0]) for k in fc.keyframe_points]}
res['steps']['captured_channels'] = len(cap)

# ---- 1. rest snapshot: disable actions + leg IK ----
saved_actions = {}
for ob in bpy.data.objects:
    ad = ob.animation_data
    if ad and ad.action:
        saved_actions[ob.name] = ad.action
        ad.action = None
ik_saved = {}
for pb in arm.pose.bones:
    for c in pb.constraints:
        if c.type == 'IK':
            ik_saved[(pb.name, c.name)] = c.influence
            c.influence = 0.0
    pb.rotation_euler = (0.0, 0.0, 0.0)   # true rest for snapshot + calibration

def flush():
    sc.frame_set(1)
    bpy.context.view_layer.update()
    bpy.context.evaluated_depsgraph_get().update()

flush()
snap = {o.name: o.matrix_world.copy() for o in bpy.data.objects if o.type == 'MESH'}

# ---- 2. empirical euler-axis calibration (rest pose) ----
def bone_world(pb):
    return arm.matrix_world @ pb.matrix

calib = {}
for bname in ('hips', 'head_b', 'tail_b'):
    pb = arm.pose.bones[bname]
    m0 = bone_world(pb).copy()
    calib[bname] = {}
    for idx in range(3):
        pb.rotation_euler = [radians5 if i == idx else 0.0 for i, radians5 in
                             [(0, math.radians(5)), (1, math.radians(5)), (2, math.radians(5))]]
        flush()
        q = (bone_world(pb) @ m0.inverted()).to_quaternion()
        ax = q.axis
        calib[bname][idx] = [round(v, 4) for v in list(ax) + [q.angle]] if q.angle > 1e-6 else [0, 0, 0, 0]
    pb.rotation_euler = (0.0, 0.0, 0.0)
    flush()
res['steps']['calib_axes_deg5'] = calib

# ---- 3. roll-align body bones so local Z -> +/- world Y ----
M_old = {b.name: b.matrix_local.copy() for b in arm.data.bones}
mpi_orig = {o.name: o.matrix_parent_inverse.copy() for o in bpy.data.objects
            if o.type == 'MESH'}
rolled = {}
for bname in ('hips', 'head_b', 'tail_b'):
    zy = arm.data.bones[bname].matrix_local.col[2].y
    sign = 1.0 if zy >= 0 else -1.0
    bpy.context.view_layer.objects.active = arm
    bpy.ops.object.mode_set(mode='EDIT')
    eb = arm.data.edit_bones[bname]
    eb.align_roll((0.0, sign, 0.0))
    bpy.ops.object.mode_set(mode='OBJECT')
    rolled[bname] = {'z_y_before': round(zy, 5),
                     'z_y_after': round(arm.data.bones[bname].matrix_local.col[2].y, 5)}
M_new = {b.name: b.matrix_local.copy() for b in arm.data.bones}
res['steps']['roll_align'] = rolled

# ---- 4. re-parent legs to their own bones (mpi=Identity, build convention) ----
for lg in LEGS:
    o = bpy.data.objects[lg]
    assert o.parent_bone == 'hips'
    o.parent = arm
    o.parent_type = 'BONE'
    o.parent_bone = lg + '_b'
    o.matrix_parent_inverse = Matrix.Identity(4)

# ---- 5. build-style solver: fix basis of every bone-parented mesh so its
#         rest world matrix equals the pre-change snapshot (convention-proof) ----
flush()
solved = {}
for o in bpy.data.objects:
    if o.type == 'MESH' and o.parent_type == 'BONE' and o.parent_bone:
        W_cur = o.matrix_world.copy()
        B_cur = o.matrix_basis.copy()
        o.matrix_basis = B_cur @ W_cur.inverted() @ snap[o.name]
        solved[o.name] = o.parent_bone

# ---- 6. rest registration verification (<1e-6) ----
flush()
reg = {}
ok_reg = True
for o in bpy.data.objects:
    if o.type == 'MESH':
        d = max(abs(o.matrix_world[r][c] - snap[o.name][r][c])
                for r in range(4) for c in range(4))
        reg[o.name] = round(d, 8)
        if d > 5e-6:   # float32 storage noise ~1.4e-6; 5e-6 = 0.0005 px @100px/BU
            ok_reg = False
res['steps']['rest_registration_residual'] = reg
res['steps']['rest_registration_ok'] = ok_reg

# ---- 7. restore actions + IK ----
for ob in bpy.data.objects:
    if ob.name in saved_actions:
        ob.animation_data.action = saved_actions[ob.name]
for (bn, cn), inf in ik_saved.items():
    arm.pose.bones[bn].constraints[cn].influence = inf

if not ok_reg:
    json.dump(res, open(OUTJ, 'w'), indent=1)
    print('FIX_RIG_FAIL registration', reg)
    sys.stdout.flush(); os._exit(3)

# ---- 8. re-author animation, euler[2], scaled, looped to 248 ----
DEG = 180.0 / math.pi
def old_vals(oname, path, idx):
    return cap.get((oname, path, idx), {}).get('vals')

def loop_pattern(vals, period):
    return lambda f: vals[(int(f) - 1) % period]

def key_seq(ob, base_path, idx, frames_vals, interp):
    for f, v in frames_vals:
        if base_path == '':      # object property e.g. location
            ob.location[idx] = v
            ob.keyframe_insert(data_path='location', index=idx, frame=f)
        else:
            pb = arm.pose.bones[base_path]
            pb.rotation_euler[idx] = v
            pb.keyframe_insert(data_path='rotation_euler', index=idx, frame=f)
    # force interpolation
    fc = find_fc(ob, ('pose.bones["%s"].rotation_euler' % base_path) if base_path else 'location', idx)
    if fc:
        for k in fc.keyframe_points:
            k.interpolation = interp

SP = 'SpriteObject'
newch = {}
SPO = bpy.data.objects[SP]
# clear any stale euler[2] channels before re-keying
for bn in ('hips', 'head_b', 'tail_b'):
    rm_fc(SPO, 'pose.bones["%s"].rotation_euler' % bn, 2)

# hips: euler[1] (P=24) -> euler[2], scale to 1.0 deg full range
v = old_vals(SP, 'pose.bones["hips"].rotation_euler', 1)
full = (max(v) - min(v)) * DEG
s_hips = 1.0 / full
pat = loop_pattern(v, 24)
rm_fc(bpy.data.objects[SP], 'pose.bones["hips"].rotation_euler', 1)
frames = list(range(1, 249, 4)) + [248]
key_seq(bpy.data.objects[SP], 'hips', 2,
        [(f, pat(f) * s_hips) for f in frames], 'LINEAR')
newch['hips_euler2'] = {'scale': round(s_hips, 4), 'n_keys': len(frames)}

# tail: euler[1] (P=12) -> euler[2], amplitude kept (14 deg budget ok)
v = old_vals(SP, 'pose.bones["tail_b"].rotation_euler', 1)
pat = loop_pattern(v, 12)
rm_fc(bpy.data.objects[SP], 'pose.bones["tail_b"].rotation_euler', 1)
frames = list(range(1, 249, 3)) + [248]
key_seq(bpy.data.objects[SP], 'tail_b', 2, [(f, pat(f)) for f in frames], 'LINEAR')
newch['tail_euler2'] = {'n_keys': len(frames)}

# head_b: euler[1] -> euler[2] at ORIGINAL key frames (nod timing), scale to <=3deg full;
# extension 235..248 from pure 24f cycle
v = old_vals(SP, 'pose.bones["head_b"].rotation_euler', 1)
full = (max(v) - min(v)) * DEG
s_head = 3.0 / full
kt = cap[(SP, 'pose.bones["head_b"].rotation_euler', 1)]['key_times']
pat = loop_pattern(v, 24)
rm_fc(bpy.data.objects[SP], 'pose.bones["head_b"].rotation_euler', 1)
frames = [(f, v[f - 1] * s_head) for f in kt]
frames += [(f, pat(f) * s_head) for f in range(237, 249, 4) if f > kt[-1]]
frames += [(248, pat(248) * s_head)]
key_seq(bpy.data.objects[SP], 'head_b', 2, frames, 'LINEAR')
newch['head_euler2'] = {'scale': round(s_head, 4), 'n_keys': len(frames)}

# SpriteObject bob location[2] (P=12) loop to 248
v = old_vals(SP, 'location', 2)
pat = loop_pattern(v, 12)
frames = list(range(1, 249, 3)) + [248]
key_seq(bpy.data.objects[SP], '', 2, [(f, pat(f)) for f in frames], 'LINEAR')
newch['body_bob_loc2'] = {'n_keys': len(frames)}

# leg targets: keep original diagonal phasing, loop 24f to 248, on-twos keys
for lg in LEGS:
    tn = lg + '_target'
    tob = bpy.data.objects[tn]
    for idx in (0, 1, 2):
        v = old_vals(tn, 'location', idx)
        interp = cap[(tn, 'location', idx)]['interp']
        pat = loop_pattern(v, 24)
        frames = list(range(1, 249, 2)) + [248]
        key_seq(tob, '', idx, [(f, pat(f)) for f in frames], interp)
    newch[tn] = {'n_keys_per_axis': 125}

res['steps']['rekey'] = newch

# ---- 9. post-checks: amplitudes + coverage + euler indices ----
def amp_deg(oname, path, idx, f0=1, f1=248):
    fc = find_fc(bpy.data.objects[oname], path, idx)
    if not fc:
        return None
    vals = [fc.evaluate(f) for f in range(f0, f1 + 1)]
    return round((max(vals) - min(vals)) * DEG, 4)

pc = {}
pc['hips_euler2_full_deg'] = amp_deg(SP, 'pose.bones["hips"].rotation_euler', 2)
pc['hips_euler2_cycle_deg'] = amp_deg(SP, 'pose.bones["hips"].rotation_euler', 2, 1, 24)
pc['head_euler2_full_deg'] = amp_deg(SP, 'pose.bones["head_b"].rotation_euler', 2)
pc['head_euler2_cycle_deg'] = amp_deg(SP, 'pose.bones["head_b"].rotation_euler', 2, 1, 24)
pc['tail_euler2_full_deg'] = amp_deg(SP, 'pose.bones["tail_b"].rotation_euler', 2)
cover = {}
ok_cov = True
for ob in bpy.data.objects:
    for fc in fcurves_of(ob):
        ks = [k.co[0] for k in fc.keyframe_points]
        cover['%s|%s[%d]' % (ob.name, fc.data_path, fc.array_index)] = \
            [float(min(ks)), float(max(ks)), len(ks)]
        if max(ks) < 248.0:
            ok_cov = False
res['steps']['post'] = {'amplitudes': pc, 'coverage_ok': ok_cov,
                        'coverage': cover}

# post-roll euler2 world-axis check (rest, actions off again)
for ob in bpy.data.objects:
    ad = ob.animation_data
    if ad and ad.action:
        ad.action = None
for pb in arm.pose.bones:
    for c in pb.constraints:
        if c.type == 'IK':
            c.influence = 0.0
post_ax = {}
for bname in ('hips', 'head_b', 'tail_b'):
    pb = arm.pose.bones[bname]
    pb.rotation_euler = (0.0, 0.0, math.radians(5))
    flush()
    rest = arm.data.bones[bname].matrix_local
    q = (arm.matrix_world.inverted() @ bone_world(pb) @ rest.inverted()).to_quaternion()
    post_ax[bname] = [round(x, 5) for x in list(q.axis) + [q.angle]]
    pb.rotation_euler = (0.0, 0.0, 0.0)
for ob in bpy.data.objects:
    if ob.name in saved_actions:
        ob.animation_data.action = saved_actions[ob.name]
for (bn, cn), inf in ik_saved.items():
    arm.pose.bones[bn].constraints[cn].influence = inf
flush()
res['steps']['post_euler2_world_axis_deg5'] = post_ax
res['t_total_s'] = round(time.time() - T0, 2)

bpy.ops.wm.save_mainfile(filepath=BLEND)
res['saved'] = BLEND
json.dump(res, open(OUTJ, 'w'), indent=1)
ok = (ok_reg and ok_cov
      and pc['hips_euler2_full_deg'] <= 1.0
      and pc['head_euler2_full_deg'] <= 3.0
      and all(abs(post_ax[b][1]) > 0.999 for b in post_ax))
print('FIX_RIG_OK' if ok else 'FIX_RIG_FAIL',
      json.dumps({'reg': ok_reg, 'cov': ok_cov, 'amp': pc, 'axis': post_ax}))
sys.stdout.flush(); os._exit(0 if ok else 3)
