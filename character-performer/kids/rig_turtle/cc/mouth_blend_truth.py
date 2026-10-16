#!/usr/bin/env python3
"""Blend-side mouth/eyelid ground truth: evaluate the M_mouth / M_eyelid
material node_tree action fcurves (mix Fac / alpha) for frames 1..105.
If Fac == closed value through f97 and opens at f98, the pixel guard trips
are head-nod displacement, not mouth opening. Writes out/mouth_blend_truth.json."""
import bpy, json, os, sys

ROOT = '/Users/tuyennguyen/project/OpenMontage/character-performer/kids/rig_turtle'
OUTJ = os.path.join(ROOT, 'out', 'mouth_blend_truth.json')

bpy.ops.wm.open_mainfile(filepath=os.path.join(ROOT, 'out', 'turtle_rig.blend'))

def iter_fcurves(action):
    for layer in action.layers:
        for strip in layer.strips:
            for cb in strip.channelbags:
                for fc in cb.fcurves:
                    yield fc

res = {'materials': {}}

def node_tree_ad(mat):
    if mat.node_tree and mat.node_tree.animation_data and mat.node_tree.animation_data.action:
        return mat.node_tree.animation_data
    return None

for mat in bpy.data.materials:
    ad = node_tree_ad(mat)
    if not ad:
        continue
    ch = []
    for fc in iter_fcurves(ad.action):
        ks = [k.co[0] for k in fc.keyframe_points]
        vals = {}
        for f in [1, 49, 90, 96, 97, 98, 99, 105, 150, 248]:
            vals[f] = round(fc.evaluate(f), 5)
        ch.append({'data_path': fc.data_path, 'array_index': fc.array_index,
                   'key_range': [float(min(ks)), float(max(ks))],
                   'n_keys': len(ks), 'vals': vals})
    res['materials'][mat.name] = ch

# explicit window scan: max Fac deviation from f1 value across 1..97
scan = {}
for matname, ch in res['materials'].items():
    for c in ch:
        act = node_tree_ad(bpy.data.materials[matname]).action
        fc = next(f for f in iter_fcurves(act)
                  if f.data_path == c['data_path'] and f.array_index == c['array_index'])
        v1 = fc.evaluate(1)
        dev = max(abs(fc.evaluate(f) - v1) for f in range(1, 98))
        c['max_dev_f1_f97'] = round(dev, 6)
        scan.setdefault(matname, []).append({'path': c['data_path'],
                                             'max_dev_f1_f97': round(dev, 6)})
res['window_scan_1_97'] = scan
json.dump(res, open(OUTJ, 'w'), indent=1)
print(json.dumps(scan, indent=1))
print('MOUTH_BLEND_TRUTH_OK')
sys.stdout.flush(); os._exit(0)
