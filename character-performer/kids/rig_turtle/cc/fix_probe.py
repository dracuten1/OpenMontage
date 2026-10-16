import bpy, json
bpy.ops.wm.open_mainfile(filepath='/Users/tuyennguyen/project/OpenMontage/character-performer/kids/rig_turtle/out/turtle_rig.blend')
arm = next(o for o in bpy.data.objects if o.type == 'ARMATURE')
out = {}
for b in arm.data.bones:
    out.setdefault('bones', {})[b.name] = {
        'parent': b.parent.name if b.parent else None, 'use_connect': b.use_connect,
        'head': [round(v,4) for v in b.head_local[:]], 'tail': [round(v,4) for v in b.tail_local[:]],
        'length': round(b.length,4),
        'matrix_local': [[round(v,4) for v in r] for r in b.matrix_local]}
for o in bpy.data.objects:
    if o.type == 'MESH':
        out.setdefault('meshes', {})[o.name] = {
            'parent': o.parent.name if o.parent else None, 'parent_type': o.parent_type,
            'parent_bone': o.parent_bone,
            'mpi': [[round(v,5) for v in r] for r in o.matrix_parent_inverse],
            'basis_tr': [round(v,4) for v in o.matrix_basis.translation[:]],
            'basis_scale': [round(v,4) for v in o.matrix_basis.to_scale()[:]],
            'dim': [round(v,3) for v in o.dimensions[:]]}
out['rot_modes'] = {b.name: b.rotation_mode for b in arm.pose.bones}
def fcs_of(ob):
    r = []
    ad = ob.animation_data
    if ad and ad.action:
        for layer in ad.action.layers:
            for strip in layer.strips:
                for cb in strip.channelbags:
                    r.extend(cb.fcurves)
    return r
for name in ('SpriteObject','leg_near_front_target','leg_far_front_target','leg_near_hind_target','leg_far_hind_target'):
    o = bpy.data.objects.get(name)
    if not o: continue
    for fc in fcs_of(o):
        ks = [k.co[0] for k in fc.keyframe_points]
        vals = [fc.evaluate(f) for f in range(1, 249)]
        out.setdefault('curves', {})['%s|%s[%d]' % (name, fc.data_path, fc.array_index)] = {
            'keys_head': [int(k) for k in ks[:36]], 'n_keys': len(ks), 'fmax': float(max(ks)),
            'min': round(min(vals),4), 'max': round(max(vals),4), 'mean': round(sum(vals)/len(vals),4),
            's1_25': [round(fc.evaluate(f),4) for f in range(1,26)]}
for fc in fcs_of(bpy.data.objects['SpriteObject']):
    if 'head_b' in fc.data_path:
        out['head_b_key_times'] = [int(k.co[0]) for k in fc.keyframe_points]
sc = bpy.context.scene
cam = sc.camera
out['scene'] = {'engine': str(sc.render.engine), 'res': [sc.render.resolution_x, sc.render.resolution_y],
                'frame': [sc.frame_start, sc.frame_end], 'fps': sc.render.fps}
if cam:
    out['cam'] = {'type': cam.data.type, 'ortho_scale': getattr(cam.data,'ortho_scale',None),
                  'lens': cam.data.lens, 'loc': [round(v,4) for v in cam.location[:]],
                  'rot': [round(v,4) for v in cam.rotation_euler[:]]}
for m in bpy.data.materials:
    if m.node_tree and m.node_tree.animation_data and m.node_tree.animation_data.action:
        fr = [k.co[0] for layer in m.node_tree.animation_data.action.layers for strip in layer.strips for cb in strip.channelbags for fcur in cb.fcurves for k in fcur.keyframe_points]
        out.setdefault('material_keys', {})[m.name] = [float(min(fr)), float(max(fr)), len(fr)]
out['actions'] = sorted(a.name for a in bpy.data.actions)
json.dump(out, open('/Users/tuyennguyen/project/OpenMontage/character-performer/kids/rig_turtle/out/fix_probe.json','w'), indent=1)
print('PROBE_OK')
