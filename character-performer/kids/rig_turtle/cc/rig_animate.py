#!/usr/bin/env python3
"""TURTLE BUOC 4 — animate: WALK f1-96 (4 cycle 24f, diagonal gait) +
WALK+TALK f98-245 (d5 cues offset 98, mouth AlphaKey fade 1f, blinks, nods).

Cam bien vs rabbit: cycle 24f (rua cham — tuong phan nhay thoa 12f), bien do
nho (x 0.28BU, lift 0.08), body sway hips ry +-1deg, head sway +-2.5deg,
tail wag +-7deg 12f. Walk chay LIEN TUC duoi talk (S5 can di vua noi).
"""
import bpy, json, math, os, time

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
OUT = os.path.join(ROOT, 'out')
CUES = os.path.join(ROOT, '..', 'dialogue_v2', 'd5_cues.json')
F_TALK0 = 98          # frame dau talk (cues t=0 -> f98)
F_END = 248

bpy.ops.wm.open_mainfile(filepath=os.path.join(OUT, 'turtle_rig.blend'))
scn = bpy.context.scene
arm = bpy.data.objects['SpriteObject']
scn.frame_start, scn.frame_end = 1, F_END
scn.frame_set(1)
t0 = time.time()
NK = {}


def fcurves_of(action):
    out = []
    for layer in action.layers:
        for strip in layer.strips:
            for bag in strip.channelbags:
                out.extend(bag.fcurves)
    return out


# ---------- WALK f1-245: 4 IK targets, cycle 24f, diagonal pairs ----------
BASES = {}
for bname in ('leg_far_hind_b', 'leg_far_front_b', 'leg_near_hind_b', 'leg_near_front_b'):
    tname = bname.replace('_b', '_target')
    BASES[tname] = tuple(bpy.data.objects[tname].location)

PHASES = {'leg_far_hind_target': 0.0, 'leg_near_front_target': 0.0,
          'leg_far_front_target': math.pi, 'leg_near_hind_target': math.pi}
for f in range(1, F_END - 96 + 1, 2):          # keys den f245 (cycle lien tuc)
    for tn, ph in PHASES.items():
        th = 2 * math.pi * (f - 1) / 24 + ph
        e = bpy.data.objects[tn]
        b = BASES[tn]
        e.location = (b[0] + 0.28 * math.cos(th), b[1],
                      b[2] - 0.08 * max(0.0, math.sin(th)))
        e.keyframe_insert('location', frame=f)
for tn in PHASES:
    e = bpy.data.objects[tn]
    e.location = BASES[tn]
    e.keyframe_insert('location', frame=F_END - 3)

# body: bob z +-0.03 (12f), sway hips ry +-1deg (24f); head sway +-2.5 (24f,
# tre 2f); tail wag +-7deg (12f)
for f in range(1, F_END - 96 + 1, 3):
    s12 = math.sin(2 * math.pi * (f - 1) / 12)
    arm.location.z = 0.03 * (0.5 - 0.5 * math.cos(2 * math.pi * (f - 1) / 12)) - 0.015
    arm.keyframe_insert('location', frame=f, index=2)
    pb = arm.pose.bones['tail_b']
    pb.rotation_euler[1] = math.radians(7) * s12
    pb.keyframe_insert('rotation_euler', frame=f, index=1)
for f in range(1, F_END - 96 + 1, 4):
    s24 = math.sin(2 * math.pi * (f - 1) / 24)
    pb = arm.pose.bones['hips']
    pb.rotation_euler[1] = math.radians(1.0) * s24
    pb.keyframe_insert('rotation_euler', frame=f, index=1)
    pb = arm.pose.bones['head_b']
    pb.rotation_euler[1] = math.radians(2.5) * math.sin(2 * math.pi * (f - 3) / 24)
    pb.keyframe_insert('rotation_euler', frame=f, index=1)

# interpolation: IK CONSTANT, arm location LINEAR, pose LINEAR
for ob in [arm] + [bpy.data.objects[t] for t in PHASES]:
    if ob.animation_data and ob.animation_data.action:
        for fc in fcurves_of(ob.animation_data.action):
            interp = 'CONSTANT' if ob != arm else 'LINEAR'
            for kp in fc.keyframe_points:
                kp.interpolation = interp

# ---------- TALK f98-245: mouth cues + blinks + nods ----------
def alpha_node(mat_name):
    m = bpy.data.materials[mat_name]
    return next(n for n in m.node_tree.nodes if n.type == 'MATH' and n.name == 'AlphaKey')


mouth, eyelid = alpha_node('M_mouth'), alpha_node('M_eyelid')
for n in (mouth, eyelid):
    n.inputs[1].default_value = 0.0
    n.inputs[1].keyframe_insert('default_value', frame=1)

segs = []
raw = json.load(open(CUES)).get('mouthCues', [])
for c in raw:
    st = c.get('start')
    du = c.get('end', (st or 0) + 0.12) - st
    v = str(c.get('value', 'A'))
    segs.append((round(float(st) * 24) + F_TALK0, round((float(st) + float(du)) * 24) + F_TALK0, v))
segs.sort()

opens = []
for a, b, v in segs:
    if v in ('X', 'C'):
        continue
    a = max(a, F_TALK0)
    b = max(b, a + 3)
    if opens and a <= opens[-1][1] + 1:
        opens[-1] = (opens[-1][0], max(opens[-1][1], b))
    else:
        opens.append((a, b))
for a, b in opens:
    b = min(b, F_END - 3)
    mouth.inputs[1].default_value = 0.0
    mouth.inputs[1].keyframe_insert('default_value', frame=a)
    mouth.inputs[1].default_value = 1.0
    mouth.inputs[1].keyframe_insert('default_value', frame=a + 1)  # FIX5/B fade 1f
    mouth.inputs[1].keyframe_insert('default_value', frame=b)
    mouth.inputs[1].default_value = 0.0
    mouth.inputs[1].keyframe_insert('default_value', frame=min(b + 1, F_END - 2))
NK['mouth_cues'] = len(opens)

# blinks 3 lan trong talk (fade 1f moi canh)
for c in (124, 172, 216):
    for f, val in ((c - 1, 0.0), (c, 1.0), (c + 1, 1.0), (c + 2, 0.0)):
        eyelid.inputs[1].default_value = val
        eyelid.inputs[1].keyframe_insert('default_value', frame=f)
NK['blinks'] = 3

# nods: +-3deg nhịp ~16f trong luc noi (cong them sway 2.5 da co — keys
# riengBien 6f quanh cac diem nhan)
for f, deg in ((106, 0), (112, 3), (118, 0), (140, 0), (146, -2), (152, 0),
               (178, 0), (184, 3), (190, 0), (222, 0), (228, -2), (234, 0)):
    pb = arm.pose.bones['head_b']
    pb.rotation_euler[1] = pb.rotation_euler[1] + math.radians(deg)
    pb.keyframe_insert('rotation_euler', frame=f, index=1)

# mouth/eyelid LINEAR
for mat_name in ('M_mouth', 'M_eyelid'):
    m = bpy.data.materials[mat_name]
    if m.node_tree.animation_data and m.node_tree.animation_data.action:
        for fc in fcurves_of(m.node_tree.animation_data.action):
            for kp in fc.keyframe_points:
                kp.interpolation = 'LINEAR'

total_kf = sum(len(fc.keyframe_points) for a in bpy.data.actions for fc in fcurves_of(a))
meta = {'n_actions': len(bpy.data.actions), 'total_keyframes': total_kf,
        'n_mouth_segments': len(opens), 'f_talk0': F_TALK0, 'f_end': F_END,
        'cues_source': os.path.relpath(CUES, ROOT), 't_s': round(time.time() - t0, 2)}
json.dump(meta, open(os.path.join(OUT, 'anim_meta.json'), 'w'), indent=1)
bpy.ops.wm.save_as_mainfile(filepath=os.path.join(OUT, 'turtle_rig.blend'))
print('[animate]', json.dumps(meta))
print('ANIMATE_OK' if total_kf > 200 and len(opens) > 0 else 'ANIMATE_FAIL')
