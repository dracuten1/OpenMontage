#!/usr/bin/env python3
"""Gait fix: far_hind renders antiphase to its target (pixel x_min@f1 vs
target x_max@f1; other 3 legs match targets). Sprite mounts opposite the IK
bone swing for this leg. Compensate by shifting the far_hind_target location
curves 12f (half cycle): new(f) = old((f-1+12) % 24 + 1). Rendered gait then
meets diagonal NF+FH / NH+FF. Mouth/eyelid material actions untouched."""
import bpy, json, math, os, sys, time

T0 = time.time()
ROOT = '/Users/tuyennguyen/project/OpenMontage/character-performer/kids/rig_turtle'
BLEND = os.path.join(ROOT, 'out', 'turtle_rig.blend')
OUTJ = os.path.join(ROOT, 'out', 'fix_gait.json')

bpy.ops.wm.open_mainfile(filepath=BLEND)

def iter_fcurves(action):
    for layer in action.layers:
        for strip in layer.strips:
            for cb in strip.channelbags:
                for fc in cb.fcurves:
                    yield fc

tn = 'leg_far_hind_target'
t = bpy.data.objects[tn]
ad = t.animation_data
res = {'target': tn, 'shift_f': 12, 'channels': {}}
vals24 = {}
for fc in list(iter_fcurves(ad.action)):
    if fc.data_path != 'location':
        continue
    idx = fc.array_index
    vals24[idx] = [fc.evaluate(f) for f in range(1, 25)]
    interp = fc.keyframe_points[0].interpolation if len(fc.keyframe_points) else 'LINEAR'
    # clear channel
    for layer in ad.action.layers:
        for strip in layer.strips:
            for cb in strip.channelbags:
                for f2 in list(cb.fcurves):
                    if f2.data_path == 'location' and f2.array_index == idx:
                        cb.fcurves.remove(f2)
    frames = list(range(1, 249, 2)) + [248]
    for f in frames:
        v = vals24[idx][(int(f) - 1 + 12) % 24]
        t.location[idx] = v
        t.keyframe_insert(data_path='location', index=idx, frame=f)
    for layer in ad.action.layers:
        for strip in layer.strips:
            for cb in strip.channelbags:
                for f2 in cb.fcurves:
                    if f2.data_path == 'location' and f2.array_index == idx:
                        for k in f2.keyframe_points:
                            k.interpolation = interp
    res['channels'][idx] = {'n_keys': len(frames), 'interp': interp,
                            'v_f1': round(vals24[idx][12], 5), 'v_f13': round(vals24[idx][0], 5)}

# post: verify new far_hind target lag vs near_front target == 12f (i.e. old lag0 inverted)
def curve24(name, idx):
    ob = bpy.data.objects[name]
    for fc in iter_fcurves(ob.animation_data.action):
        if fc.data_path == 'location' and fc.array_index == idx:
            return [fc.evaluate(f) for f in range(1, 25)]
A = curve24('leg_near_front_target', 0)
B = curve24(tn, 0)
best = (-2, None)
for L in range(-23, 24):
    BB = (B[L:] + B[:L]) if L >= 0 else (B[L:] + B[:L])
    r = sum((a - sum(A) / 24) * (b - sum(B) / 24) for a, b in zip(A, BB)) / 24
    if r > best[0]:
        best = (r, L)
res['post_target_lag_vs_near_front'] = {'lag_f': best[1], 'sign': '+'}
res['t_s'] = round(time.time() - T0, 2)
bpy.ops.wm.save_mainfile(filepath=BLEND)
json.dump(res, open(OUTJ, 'w'), indent=1)
print(json.dumps(res, indent=1))
ok = best[1] in (11, 12, 13)
print('FIX_GAIT_OK' if ok else 'FIX_GAIT_FAIL')
sys.stdout.flush(); os._exit(0 if ok else 3)
