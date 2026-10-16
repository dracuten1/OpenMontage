#!/usr/bin/env python3
"""BUOC 4 — animate: Shot1 RUN f1-108 (stride IK + squash-stretch + bob + ear/arm lag),
Shot2 TALK f110-216 (mouth AlphaKey tu cues, blinks, nods, idle). Luu blend + anim_meta."""
import bpy, json, math, os, time

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
OUT = os.path.join(ROOT, 'out')
CUES = os.path.join(ROOT, '..', 'dialogue_v2', 'd0_cues.json')

bpy.ops.wm.open_mainfile(filepath=os.path.join(OUT, 'rabbit_rig.blend'))
scn = bpy.context.scene
arm = bpy.data.objects['SpriteObject']
scn.frame_start, scn.frame_end = 1, 216
scn.frame_set(1)
t0 = time.time()
NK = {}

def fcurves_of(action):
    """Blender 5.2 slotted action: fcurves nam trong layers.strips.channelbags."""
    out = []
    for layer in action.layers:
        for strip in layer.strips:
            for bag in strip.channelbags:
                out.extend(bag.fcurves)
    return out


# ---------- Shot 1: RUN f1-108 ----------
# IK targets: ellipse bk 0.55BU, cycle 12f, contra-phase, keys moi 2f CONSTANT
tgt = {}
for bn, tn in (('leg_far_b', 'leg_far_target'), ('leg_near_b', 'leg_near_target')):
    pb = arm.pose.bones[bn]
    mw = arm.matrix_world @ pb.matrix
    tail = mw @ __import__('mathutils').Vector((0, pb.bone.length, 0))
    tgt[tn] = bpy.data.objects[tn]
    # FIX4: base chot bang f108 baseline THUC (far 7.530179023742676, near 7.86103630065918
    # — lay tu backup bak_pre_fix1/2; PRE_CONTEXT truoc do ghi f1-evaluated location, khong phai base).
    BASES = {'leg_far_target': (7.530179023742676, 3.588193794712424e-05, 9.689030647277832),
             'leg_near_target': (7.86103630065918, -0.00025868089869618416, 9.683029174804688)}
    base = __import__('mathutils').Vector(BASES[tn])
    tgt[tn].location = base
    ph = 0.0 if 'far' in tn else math.pi
    for f in range(1, 109, 2):
        th = 2 * math.pi * (f - 1) / 12 + ph
        e = tgt[tn]
        e.location = (base.x + 0.55 * math.cos(th), e.location.y,
                      base.z - 0.18 * max(0.0, math.sin(th)))  # lift = z giam (z=canvas-y xuong)
        e.keyframe_insert('location', frame=f)
    e = tgt[tn]
    e.location = base
    e.keyframe_insert('location', frame=108)

# squash-stretch 12f LINEAR (scale hips + hop arm.location.z; z-mirror: ant +0.12 xuong, stretch -0.35 len)
poses = {1: ((1.08, 0.88, 1.0), 0.12), 5: ((0.92, 1.14, 1.0), -0.35), 8: ((1.10, 0.86, 1.0), 0.0), 12: ((1.08, 0.88, 1.0), 0.12)}
for f0 in range(1, 109, 12):
    for off, (sc, dz) in poses.items():
        f = f0 + off - 1
        if f > 108:
            break
        arm.pose.bones['hips'].scale = sc
        arm.pose.bones['hips'].keyframe_insert('scale', frame=f)
        arm.location.z = dz
        arm.keyframe_insert('location', frame=f)
NK['run_squash'] = 2 * 9 * 4

# head bob ±0.05 2× stride (period 6f); ears ±14 lag 2f; arms ±25 contra
for f in range(1, 109, 3):
    s6 = math.sin(2 * math.pi * (f - 1) / 6)
    pb = arm.pose.bones['head_b']
    pb.location[1] = 0.05 * s6
    pb.keyframe_insert('location', frame=f, index=1)
    for bn, amp, lag in (('ear_far_b', 14, 2), ('ear_near_b', 14, 2)):
        th = 2 * math.pi * (f - 1 - lag) / 12
        pb = arm.pose.bones[bn]
        pb.rotation_euler[2] = math.radians(amp) * math.sin(th)
        pb.keyframe_insert('rotation_euler', frame=f, index=2)
    for bn, ph in (('arm_far_b', 0.0), ('arm_near_b', math.pi)):
        th = 2 * math.pi * (f - 1) / 12 + ph
        pb = arm.pose.bones[bn]
        pb.rotation_euler[2] = math.radians(25) * math.sin(th)
        pb.keyframe_insert('rotation_euler', frame=f, index=2)

# interpolation: IK = CONSTANT, con lai LINEAR
for ob in (arm, tgt['leg_far_target'], tgt['leg_near_target']):
    if ob.animation_data and ob.animation_data.action:
        for fc in fcurves_of(ob.animation_data.action):
            interp = 'CONSTANT' if ob != arm else 'LINEAR'
            for kp in fc.keyframe_points:
                kp.interpolation = interp

# FIX4: transform freshly authored run keys, never the talk keys.
run_fix4 = {"frames": [1, 108], "extrema": {}, "talk_boundary_keys": []}
for path, index, label in (
        ("location", 2, "hop_z_bu"),
        ('pose.bones["hips"].scale', 1, "hips_scale_y"),
        ('pose.bones["ear_far_b"].rotation_euler', 2, "ear_far_deg"),
        ('pose.bones["ear_near_b"].rotation_euler', 2, "ear_near_deg")):
    fc = next(fc for fc in fcurves_of(arm.animation_data.action)
              if fc.data_path == path and fc.array_index == index)
    values = [kp.co.y for kp in fc.keyframe_points if 1 <= kp.co.x <= 108]
    if label == "hop_z_bu":
        gain, offset = 1.4, 0.0
    elif label == "hips_scale_y":
        gain = 9.0 / 7.0
        offset = 1.0 - gain
    else:
        low, high = min(values), max(values)
        gain = math.radians(32) / (high - low)
        offset = -math.radians(16) - gain * low
    # Z/ear curves otherwise extrapolate their changed final run key into talk.
    if label != "hips_scale_y" and not any(kp.co.x >= 110 for kp in fc.keyframe_points):
        talk_value = fc.evaluate(110)
        kp = fc.keyframe_points.insert(110, talk_value)
        kp.interpolation = "LINEAR"
        run_fix4["talk_boundary_keys"].append(label)
    for kp in fc.keyframe_points:
        if not 1 <= kp.co.x <= 108:
            continue
        y, left_y, right_y = kp.co.y, kp.handle_left.y, kp.handle_right.y
        kp.co.y = gain * y + offset
        kp.handle_left.y = gain * left_y + offset
        kp.handle_right.y = gain * right_y + offset
    fc.update()
    values = [kp.co.y for kp in fc.keyframe_points if 1 <= kp.co.x <= 108]
    if label.startswith("ear_"):
        values = [math.degrees(value) for value in values]
    run_fix4["extrema"][label] = {"min": min(values), "max": max(values)}

# ---------- Shot 2: TALK f110-216 ----------
def alpha_node(mat_name):
    m = bpy.data.materials[mat_name]
    return next(n for n in m.node_tree.nodes if n.type == 'MATH' and n.name == 'AlphaKey')

# FIX5: patches are head-copy objects with materials M_mouth2/M_eyelid2 (old
# M_mouth/M_eyelid removed by cc/fix5_patches.py).
mouth, eyelid = alpha_node('M_mouth2'), alpha_node('M_eyelid2')
for n in (mouth, eyelid):
    n.inputs[1].default_value = 0.0
    n.inputs[1].keyframe_insert('default_value', frame=110)

segs = []
try:
    raw = json.load(open(CUES)).get('mouthCues', [])
    for c in raw:
        st = c.get('start')
        du = c.get('end', (st or 0) + 0.12) - st
        v = str(c.get('value', 'A'))
        segs.append((round(float(st) * 24) + 110, round((float(st) + float(du)) * 24) + 110, v))
    segs.sort()
except Exception as ex:
    print('[cues] LOI doc cues:', ex)

opens = []
for a, b, v in segs:
    if v in ('X', 'C'):
        continue
    a = max(a, 110)
    b = max(b, a + 3)
    if opens and a <= opens[-1][1] + 1:
        opens[-1] = (opens[-1][0], max(opens[-1][1], b))
    else:
        opens.append((a, b))
for a, b in opens:
    b = min(b, 215)
    mouth.inputs[1].default_value = 0.0
    mouth.inputs[1].keyframe_insert('default_value', frame=a)
    mouth.inputs[1].default_value = 1.0
    # FIX5/B: fade 1 frame (a+1/b+1) — 2 keys 1f apart = 41.7ms @24fps (spec <=70ms)
    mouth.inputs[1].keyframe_insert('default_value', frame=a + 1)
    mouth.inputs[1].keyframe_insert('default_value', frame=b)
    mouth.inputs[1].default_value = 0.0
    mouth.inputs[1].keyframe_insert('default_value', frame=min(b + 1, 216))
NK['mouth_cues'] = len(opens)

# blinks f132-134, f178-180 (FIX5/B: fade 1f = 41.7ms each side)
for c in (132, 178):
    for f, val in ((c - 1, 0.0), (c, 1.0), (c + 1, 1.0), (c + 2, 0.0)):
        eyelid.inputs[1].default_value = val
        eyelid.inputs[1].keyframe_insert('default_value', frame=f)
NK['blinks'] = 2

# head nods ±3°, hips idle 1±0.008, arm_near ±8°
for f, deg in ((118, 0), (122, 3), (126, 0), (148, 0), (152, -3), (156, 0),
               (176, 0), (180, 3), (184, 0), (206, 0), (210, -3), (214, 0)):
    pb = arm.pose.bones['head_b']
    pb.rotation_euler[2] = math.radians(deg)
    pb.keyframe_insert('rotation_euler', frame=f, index=2)
for f in range(110, 217, 12):
    s = 1.0 + 0.008 * math.sin(2 * math.pi * (f - 110) / 48)
    arm.pose.bones['hips'].scale = (1.0, s, 1.0)
    arm.pose.bones['hips'].keyframe_insert('scale', frame=f, index=1)
for f in range(110, 217, 6):
    pb = arm.pose.bones['arm_near_b']
    pb.rotation_euler[2] = math.radians(8) * math.sin(2 * math.pi * (f - 110) / 36)
    pb.keyframe_insert('rotation_euler', frame=f, index=2)

# mouth/eyelid node keys LINEAR (FIX5/B: fade 1f)
for mat_name in ('M_mouth2', 'M_eyelid2'):
    m = bpy.data.materials[mat_name]
    if m.node_tree.animation_data and m.node_tree.animation_data.action:
        for fc in fcurves_of(m.node_tree.animation_data.action):
            for kp in fc.keyframe_points:
                kp.interpolation = 'LINEAR'

total_kf = sum(len(fc.keyframe_points) for a in bpy.data.actions for fc in fcurves_of(a))
meta = {'n_actions': len(bpy.data.actions), 'total_keyframes': total_kf,
        'n_mouth_segments': len(opens), 'cues_source': os.path.relpath(CUES, ROOT),
        'run_FIX4': run_fix4, 't_s': round(time.time() - t0, 2)}
json.dump(meta, open(os.path.join(OUT, 'anim_meta.json'), 'w'), indent=1)
bpy.ops.wm.save_as_mainfile(filepath=os.path.join(OUT, 'rabbit_rig.blend'))
print('[animate]', json.dumps(meta))
print('ANIMATE_OK' if total_kf > 200 and len(opens) > 0 else 'ANIMATE_FAIL')
