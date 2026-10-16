#!/usr/bin/env python3
"""Blend ground truth: leg_*_target location curves f1..24 — per-leg swing
phase (argmax/argmin x) + pairwise lags. Decides whether the TARGETS are
diagonal (rig intent) vs the rendered pixels (occlusion-contaminated)."""
import bpy, json, os, sys
import numpy as np

ROOT = '/Users/tuyennguyen/project/OpenMontage/character-performer/kids/rig_turtle'
OUTJ = os.path.join(ROOT, 'out', 'target_phase.json')

bpy.ops.wm.open_mainfile(filepath=os.path.join(ROOT, 'out', 'turtle_rig.blend'))

def iter_fcurves(action):
    for layer in action.layers:
        for strip in layer.strips:
            for cb in strip.channelbags:
                for fc in cb.fcurves:
                    yield fc

LEGS = ['leg_near_front', 'leg_near_hind', 'leg_far_front', 'leg_far_hind']
xs, zs = {}, {}
for lg in LEGS:
    t = bpy.data.objects[lg + '_target']
    for fc in iter_fcurves(t.animation_data.action):
        if fc.data_path == 'location':
            v = [fc.evaluate(f) for f in range(1, 25)]
            if fc.array_index == 0:
                xs[lg] = v
            elif fc.array_index == 2:
                zs[lg] = v

res = {'x_curves': xs, 'z_curves': zs, 'phase_x': {}, 'lag_x': {}}
for lg in xs:
    a = np.array(xs[lg]) - np.mean(xs[lg])
    res['phase_x'][lg] = {'x_max_f': int(np.argmax(a)) + 1, 'x_min_f': int(np.argmin(a)) + 1,
                          'amp_bu': round(float(a.max() - a.min()), 4)}

def lag(a, b):
    A = np.array(xs[a]) - np.mean(xs[a])
    B = np.array(xs[b]) - np.mean(xs[b])
    best = (-2, None)
    for L in range(-23, 24):
        BB = np.concatenate([B[L:], np.zeros(L)]) if L >= 0 else np.concatenate([np.zeros(-L), B[:L]])
        r = float(np.corrcoef(A, BB)[0, 1])
        if r > best[0]:
            best = (r, L)
    return best[1], round(best[0], 4)

for p in [('leg_near_front', 'leg_far_hind'), ('leg_near_hind', 'leg_far_front'),
          ('leg_near_front', 'leg_near_hind'), ('leg_far_front', 'leg_far_hind')]:
    L, r = lag(*p)
    res['lag_x']['%s_vs_%s' % p] = {'lag_f': L, 'r': r}

json.dump(res, open(OUTJ, 'w'), indent=1)
print(json.dumps(res['phase_x'], indent=1))
print(json.dumps(res['lag_x'], indent=1))
print('TARGET_PHASE_OK')
sys.stdout.flush(); os._exit(0)
