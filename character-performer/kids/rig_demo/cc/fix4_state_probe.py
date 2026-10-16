#!/usr/bin/env python3
"""FIX4 (lead) — read-only state probe sau animate repair: IK bases, run extrema,
talk f147 holds, patch locations. In JSON 1 dòng, KHONG save blend."""
import bpy, json, math

BASES = {'leg_far_target': (8.080179214477539, 3.588193794712424e-05, 9.689030647277832),
         'leg_near_target': (7.311036109924316, -0.00025868089869618416, 9.683029174804688)}
EXPECT_LOC = {'mouth': (0.86662, -3.51319, 0.00602),
              'eyelid': (0.11520, -4.14369, -0.00347)}
import os
bpy.ops.wm.open_mainfile(filepath=os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), 'out', 'rabbit_rig.blend'))
arm = bpy.data.objects['SpriteObject']
scn = bpy.context.scene

def fcurves_of(action):
    out = []
    for layer in action.layers:
        for strip in layer.strips:
            for bag in strip.channelbags:
                out.extend(bag.fcurves)
    return out

def evalrange(path, idx, lo, hi):
    fc = next(f for f in fcurves_of(arm.animation_data.action)
              if f.data_path == path and f.array_index == idx)
    vals = [fc.evaluate(f) for f in range(lo, hi + 1)]
    return min(vals), max(vals), fc

res = {'ik': {}, 'run': {}, 'talk147': {}, 'patch_loc': {}}
for tn, base in BASES.items():
    fc = next(f for f in fcurves_of(bpy.data.objects[tn].animation_data.action)
              if f.data_path == 'location')
    fcs = [f for f in fcurves_of(bpy.data.objects[tn].animation_data.action)
           if f.data_path == 'location']
    v1 = [next(f for f in fcs if f.array_index == i).evaluate(1) for i in range(3)]
    v108 = [next(f for f in fcs if f.array_index == i).evaluate(108) for i in range(3)]
    res['ik'][tn] = {'f1': [round(x, 6) for x in v1], 'f108': [round(x, 6) for x in v108],
                     'ok_f1': all(abs(a - b) <= 1e-5 for a, b in zip(v1, base)),
                     'ok_f108': all(abs(a - b) <= 1e-5 for a, b in zip(v108, base))}

zmin, zmax, _ = evalrange('location', 2, 1, 108)
ymin, ymax, _ = evalrange('pose.bones["hips"].scale', 1, 1, 108)
ef = evalrange('pose.bones["ear_far_b"].rotation_euler', 2, 1, 108)
en = evalrange('pose.bones["ear_near_b"].rotation_euler', 2, 1, 108)
res['run'] = {'hop_z': [round(zmin, 5), round(zmax, 5)],
              'hips_y': [round(ymin, 5), round(ymax, 5)],
              'ear_far_deg': [round(math.degrees(ef[0]), 4), round(math.degrees(ef[1]), 4)],
              'ear_near_deg': [round(math.degrees(en[0]), 4), round(math.degrees(en[1]), 4)]}
res['run']['ok'] = (abs(zmin + .49) < 1e-4 and abs(zmax - .168) < 1e-4 and
                    abs(ymin - .82) < 1e-4 and abs(ymax - 1.18) < 1e-4 and
                    abs(abs(math.degrees(ef[0])) - 16) < 1e-3 and abs(abs(math.degrees(ef[1])) - 16) < 1e-3 and
                    abs(abs(math.degrees(en[0])) - 16) < 1e-3 and abs(abs(math.degrees(en[1])) - 16) < 1e-3)

scn.frame_set(147)
res['talk147'] = {'arm_z': round(arm.location.z, 6),
                  'hips_y': round(arm.pose.bones['hips'].scale.y, 6),
                  'ear_far_deg': round(math.degrees(arm.pose.bones['ear_far_b'].rotation_euler.z), 4),
                  'ear_near_deg': round(math.degrees(arm.pose.bones['ear_near_b'].rotation_euler.z), 4)}
res['talk147']['ok'] = (abs(res['talk147']['arm_z'] - .12) < 1e-5 and
                        abs(res['talk147']['ear_far_deg'] + 7) < 1e-3 and
                        abs(res['talk147']['ear_near_deg'] + 7) < 1e-3)
for nm, exp in EXPECT_LOC.items():
    got = tuple(round(v, 5) for v in bpy.data.objects[nm].location)
    res['patch_loc'][nm] = {'v': got, 'ok': all(abs(a - b) <= 2e-5 for a, b in zip(got, exp))}
print('FIX4_STATE ' + json.dumps(res))
