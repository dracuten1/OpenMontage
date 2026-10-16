#!/usr/bin/env python3
"""POLISH RUN (post-FIX5, batch 2026-10-13) — 'trot' -> 'sprint' read.

3 thay đổi, CHỈ đụng khung RUN f1..108 (talk f110..216 giữ nguyên 100%):
  P1 forward lean : hips.rotation_euler[Z] = LEAN + 2.5*sin(stride) deg
                    (calibrate dấu bằng render f1: centroid nửa-trên phai = lean dung)
  P2 leg extension: IK targets ellipse moi — amp 0.55->0.85, lift 0.18->0.30,
                    pha far +60° de scissors MAX tai f5 (peak airborne),
                    keys moi 2f CONSTANT nhu cu
  P3 ear follow-through: re-author ±16° -> 26*sin + 8*sin(2θ) deg, lag 2->3f

KHÔNG đụng: hop_z, hips.scale (squash FIX4 >=1.4 giu nguyen), mouth/eyelid
keys, talk keys. Boundary key tai f110 = gia tri talk (uoc luong truoc khi sua).

Usage: blender -b out/rabbit_rig.blend --python cc/polish_run.py
"""
import bpy, json, math, os, time

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
OUT = os.path.join(ROOT, 'out')
SCR = os.path.join(OUT, 'scratch')
os.makedirs(SCR, exist_ok=True)

bpy.ops.wm.open_mainfile(filepath=os.path.join(OUT, 'rabbit_rig.blend'))
scn = bpy.context.scene
arm = bpy.data.objects['SpriteObject']
t0 = time.time()

LEAN = 12.0           # deg, base lean magnitude (sign calibrated: -Z = nose-down forward)
LEAN_OSC = 3.0        # deg, oscillation with stride
LEG_AMP = 1.00        # BU x-amplitude (was 0.55 demo, 0.85 polish-1)
LEG_LIFT = 0.34       # BU z-lift (was 0.18 demo)
PH_FAR = math.pi / 3.0  # +60deg: scissor max tai f5 (peak hop)
EAR_A1, EAR_A2, EAR_LAG = 30.0, 9.0, 3
ARM_AMP = 34.0        # deg pump (was 25 demo)


def fcurves_of(action):
    out = []
    for layer in action.layers:
        for strip in layer.strips:
            for bag in strip.channelbags:
                out.extend(bag.fcurves)
    return out


def drop_channel(ob, path, idx):
    """Xoa toan bo fcurve channel (slotted action) — keyframe_insert se tao lai
    chi voi keys moi (tranh bug keyframe_points.remove 'Keyframe not in F-Curve')."""
    act = ob.animation_data.action
    for layer in act.layers:
        for strip in layer.strips:
            for bag in strip.channelbags:
                for fc in list(bag.fcurves):
                    if fc.data_path == path and fc.array_index == idx:
                        bag.fcurves.remove(fc)
                        return True
    return False


def find_fc(ob, path, idx):
    return next(fc for fc in fcurves_of(ob.animation_data.action)
                if fc.data_path == path and fc.array_index == idx)


# ---------- FIX-0: QUATERNION -> XYZ (rotation euler chua bao gio duoc ap dung!) ----------
# dbg 2026-10-13: every bone was QUATERNION mode while rig_animate keys
# rotation_euler -> fcurve drove euler but pose matrix used identity quaternion.
# Ear flap / head nod / arm swing were DEAD in the approved demo. Switch to XYZ
# so all authored rotations finally evaluate. IK legs unaffected (constraint).
for pb in arm.pose.bones:
    pb.rotation_mode = 'XYZ'
NK_MODES = 'XYZ'

# ---------- 0. calibration dau lean ----------
def upper_centroid(png):
    import numpy as np
    img = bpy.data.images.load(png, check_existing=False)
    arr = np.array(img.pixels).reshape(1024, 1536, 4)
    bpy.data.images.remove(img)
    # render da FLIP_TOP_BOTTOM theo pipeline? render goc chua flip: row 0 = top
    am = arr[:, :, 3] > 0.1
    rows = am[:400, :]  # nua tren (dau + tai)
    ys, xs = np.nonzero(rows)
    return float(xs.mean()) if len(xs) else -1.0


def render_one(f, tag):
    scn.frame_set(f)
    scn.render.filepath = os.path.join(SCR, 'polish_cal_%s.png' % tag)
    bpy.ops.render.render(write_still=True)
    return scn.render.filepath


pb = arm.pose.bones['hips']
scn.frame_set(1)
# render re-evaluates animation -> phai key tam tai f1 (sau do P1 re-author)
pb.rotation_euler[2] = 0.0
pb.keyframe_insert('rotation_euler', frame=1, index=2)
bpy.context.view_layer.update()
render_one(1, 'base')
pb.rotation_euler[2] = math.radians(12.0)
pb.keyframe_insert('rotation_euler', frame=1, index=2)
bpy.context.view_layer.update()
render_one(1, 'lean+12')
pb.rotation_euler[2] = math.radians(-12.0)
pb.keyframe_insert('rotation_euler', frame=1, index=2)
bpy.context.view_layer.update()
render_one(1, 'lean-12')
pb.rotation_euler[2] = 0.0
c0 = upper_centroid(os.path.join(SCR, 'polish_cal_base.png'))
cp = upper_centroid(os.path.join(SCR, 'polish_cal_lean+12.png'))
cm = upper_centroid(os.path.join(SCR, 'polish_cal_lean-12.png'))
sign = 1.0 if cp > c0 else (-1.0 if cm > c0 else 0.0)
print('[polish] cal upper-cx base=%.1f +12=%.1f -12=%.1f -> sign=%.0f' % (c0, cp, cm, sign))
assert sign != 0.0, 'calibration lean FAIL'

# ---------- P1 lean ----------
HIPS_ROT = 'pose.bones["hips"].rotation_euler'
# talk khong co key hips-rotation (static rest 0) -> boundary = 0
drop_channel(arm, HIPS_ROT, 2)
pb = arm.pose.bones['hips']
pb.rotation_euler[2] = 0.0
pb.keyframe_insert('rotation_euler', frame=110, index=2)
fc_lean = find_fc(arm, HIPS_ROT, 2)
lean_talk_val = 0.0
for f in range(1, 109, 3):
    th = 2 * math.pi * (f - 1) / 12
    pb.rotation_euler[2] = math.radians(sign * (LEAN + LEAN_OSC * math.sin(th)))
    pb.keyframe_insert('rotation_euler', frame=f, index=2)
pb.rotation_euler[2] = math.radians(sign * (LEAN + LEAN_OSC * math.sin(2 * math.pi * 107 / 12)))
pb.keyframe_insert('rotation_euler', frame=108, index=2)
# boundary talk
pb.rotation_euler[2] = lean_talk_val
pb.keyframe_insert('rotation_euler', frame=110, index=2)
for kp in fc_lean.keyframe_points:
    kp.interpolation = 'LINEAR'
fc_lean.update()

# ---------- P2 leg extension ----------
BASES = {'leg_far_target': (7.530179023742676, 3.588193794712424e-05, 9.689030647277832),
         'leg_near_target': (7.86103630065918, -0.00025868089869618416, 9.683029174804688)}
tgt = {}
for tn in ('leg_far_target', 'leg_near_target'):
    e = bpy.data.objects[tn]
    tgt[tn] = e
    for idx in (0, 1, 2):
        drop_channel(e, 'location', idx)
ph_near = PH_FAR + math.pi
for tn, ph in (('leg_far_target', PH_FAR), ('leg_near_target', ph_near)):
    e = tgt[tn]
    bx, by, bz = BASES[tn]
    for f in range(1, 109, 2):
        th = 2 * math.pi * (f - 1) / 12 + ph
        e.location = (bx + LEG_AMP * math.cos(th), by, bz - LEG_LIFT * max(0.0, math.sin(th)))
        e.keyframe_insert('location', frame=f)
    e.location = (bx, by, bz)
    e.keyframe_insert('location', frame=108)
for tn in ('leg_far_target', 'leg_near_target'):
    e = tgt[tn]
    if e.animation_data and e.animation_data.action:
        for fc in fcurves_of(e.animation_data.action):
            if fc.data_path == 'location':
                for kp in fc.keyframe_points:
                    kp.interpolation = 'CONSTANT'
                fc.update()

# ---------- P3 ear follow-through ----------
for bn in ('ear_far_b', 'ear_near_b'):
    path = 'pose.bones["%s"].rotation_euler' % bn
    # talk khong co key tai (rest 0) -> boundary = 0
    drop_channel(arm, path, 2)
    fc = None
    pb = arm.pose.bones[bn]
    pb.rotation_euler[2] = 0.0
    pb.keyframe_insert('rotation_euler', frame=110, index=2)
    fc = find_fc(arm, path, 2)
    talk_val = 0.0
    for f in range(1, 109, 3):
        th = 2 * math.pi * (f - 1 - EAR_LAG) / 12
        pb.rotation_euler[2] = math.radians(EAR_A1 * math.sin(th) + EAR_A2 * math.sin(2 * th))
        pb.keyframe_insert('rotation_euler', frame=f, index=2)
    th = 2 * math.pi * (108 - 1 - EAR_LAG) / 12
    pb.rotation_euler[2] = math.radians(EAR_A1 * math.sin(th) + EAR_A2 * math.sin(2 * th))
    pb.keyframe_insert('rotation_euler', frame=108, index=2)
    pb.rotation_euler[2] = talk_val
    pb.keyframe_insert('rotation_euler', frame=110, index=2)
    for kp in fc.keyframe_points:
        kp.interpolation = 'LINEAR'
    fc.update()

# ---------- P4 arm pump (re-author ±ARM_AMP contra-phase; keep talk keys) ----------
for bn, ph0 in (('arm_far_b', 0.0), ('arm_near_b', math.pi)):
    path = 'pose.bones["%s"].rotation_euler' % bn
    fc_old = find_fc(arm, path, 2)
    talk_kps = [(kp.co.x, kp.co.y) for kp in fc_old.keyframe_points if kp.co.x >= 110]
    drop_channel(arm, path, 2)
    pb = arm.pose.bones[bn]
    pb.rotation_euler[2] = 0.0
    pb.keyframe_insert('rotation_euler', frame=110, index=2)
    fc = find_fc(arm, path, 2)
    for f in range(1, 109, 3):
        th = 2 * math.pi * (f - 1) / 12 + ph0
        pb.rotation_euler[2] = math.radians(ARM_AMP) * math.sin(th)
        pb.keyframe_insert('rotation_euler', frame=f, index=2)
    pb.rotation_euler[2] = 0.0
    pb.keyframe_insert('rotation_euler', frame=108, index=2)
    for fx, fy in talk_kps:
        kp = fc.keyframe_points.insert(fx, fy)
        kp.interpolation = 'LINEAR'
    for kp in fc.keyframe_points:
        kp.interpolation = 'LINEAR'
    fc.update()

# ---------- P5 hop boost ×1.15 (restore squash ratio ≥1.4 sau khi chan duoi ngang) ----------
HOP_PATH = 'location'
fc_hop = find_fc(arm, HOP_PATH, 2)
hop_talk_kps = [(kp.co.x, kp.co.y) for kp in fc_hop.keyframe_points if kp.co.x >= 110]
drop_channel(arm, HOP_PATH, 2)
arm.location.z = 0.0
arm.keyframe_insert('location', frame=110, index=2)
fc_hop = find_fc(arm, HOP_PATH, 2)
for f0 in range(1, 109, 12):
    for off, dz in {1: 0.193, 5: -0.50, 8: 0.0, 12: 0.193}.items():
        f = f0 + off - 1
        if f > 108:
            break
        arm.location.z = dz
        arm.keyframe_insert('location', frame=f, index=2)
for fx, fy in hop_talk_kps:
    kp = fc_hop.keyframe_points.insert(fx, fy)
    kp.interpolation = 'LINEAR'
for kp in fc_hop.keyframe_points:
    kp.interpolation = 'LINEAR'
fc_hop.update()

# ---------- P6 squash contrast (f5 1.18->1.24, f8 0.82->0.79): squash >=1.4 ----------
SC_PATH = 'pose.bones["hips"].scale'
fc_sc = find_fc(arm, SC_PATH, 1)
sc_talk_kps = [(kp.co.x, kp.co.y) for kp in fc_sc.keyframe_points if kp.co.x >= 110]
drop_channel(arm, SC_PATH, 1)
pb = arm.pose.bones['hips']
pb.scale = (1.0, 1.0, 1.0)
pb.keyframe_insert('scale', frame=110, index=1)
fc_sc = find_fc(arm, SC_PATH, 1)
for f0 in range(1, 109, 12):
    for off, sy in {1: 0.846, 5: 1.225, 8: 0.79, 12: 0.846}.items():
        f = f0 + off - 1
        if f > 108:
            break
        pb.scale = (1.0, sy, 1.0)
        pb.keyframe_insert('scale', frame=f, index=1)
for fx, fy in sc_talk_kps:
    kp = fc_sc.keyframe_points.insert(fx, fy)
    kp.interpolation = 'LINEAR'
for kp in fc_sc.keyframe_points:
    kp.interpolation = 'LINEAR'
fc_sc.update()

# ---------- P7 headroom: shift moi key arm.location.z +0.15 (15px xuong canvas).
# Tai dinh stretch vuot qua canvas top (bbox top=-1 la duong clip) -> day xuong
# de het phan an. Comp anchor theo feet (guards do lai) -> staging khong doi. ----------
fc_hop2 = find_fc(arm, HOP_PATH, 2)
for kp in fc_hop2.keyframe_points:
    kp.co.y += 0.15
    kp.handle_left.y += 0.15
    kp.handle_right.y += 0.15
fc_hop2.update()

# ---------- probes tu fcurve ----------
def curve_range(path, idx, ob=arm):
    fc = find_fc(ob, path, idx)
    vs = [fc.evaluate(f) for f in range(1, 109)]
    return min(vs), max(vs)


lean_min, lean_max = curve_range('pose.bones["hips"].rotation_euler', 2)
lean_amp = math.degrees(abs(lean_max - lean_min))
mean_lean = math.degrees((lean_min + lean_max) / 2)
earF = curve_range('pose.bones["ear_far_b"].rotation_euler', 2)
earN = curve_range('pose.bones["ear_near_b"].rotation_euler', 2)
txf = curve_range('location', 0, tgt['leg_far_target'])
txn = curve_range('location', 0, tgt['leg_near_target'])
stride_far = txf[1] - txf[0]
stride_near = txn[1] - txn[0]

total_kf = sum(len(fc.keyframe_points) for a in bpy.data.actions for fc in fcurves_of(a))
meta = {
    'lean_sign': sign, 'lean_mean_deg': round(mean_lean, 2), 'lean_osc_pkpk_deg': round(lean_amp, 2),
    'leg_amp_bu': LEG_AMP, 'leg_lift_bu': LEG_LIFT, 'ph_far_deg': round(math.degrees(PH_FAR), 1),
    'stride_far_bu': round(stride_far, 3), 'stride_near_bu': round(stride_near, 3),
    'ear_far_deg': [round(math.degrees(earF[0]), 1), round(math.degrees(earF[1]), 1)],
    'ear_near_deg': [round(math.degrees(earN[0]), 1), round(math.degrees(earN[1]), 1)],
    'ear_lag_f': EAR_LAG, 'total_keyframes': total_kf, 't_s': round(time.time() - t0, 1),
}
json.dump(meta, open(os.path.join(OUT, 'polish_meta.json'), 'w'), indent=1)
bpy.ops.wm.save_as_mainfile(filepath=os.path.join(OUT, 'rabbit_rig.blend'))
print('[polish]', json.dumps(meta))
ok = (abs(mean_lean) >= 6.0 and stride_far >= 1.5 and stride_near >= 1.5
      and abs(earF[0]) >= math.radians(20) and abs(earF[1]) >= math.radians(20))
print('POLISH_OK' if ok else 'POLISH_FAIL')
