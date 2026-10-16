import bpy, json, math
from mathutils import Matrix
ROOT = '/Users/tuyennguyen/project/OpenMontage/character-performer/kids/rig_turtle'
bpy.ops.wm.open_mainfile(filepath=ROOT + '/out/turtle_rig.blend')
arm = next(o for o in bpy.data.objects if o.type == 'ARMATURE')
sc = bpy.context.scene
for ob in bpy.data.objects:
    ad = ob.animation_data
    if ad and ad.action:
        ad.action = None
for pb in arm.pose.bones:
    for c in pb.constraints:
        if c.type == 'IK':
            c.influence = 0.0
    pb.rotation_euler = (0.0, 0.0, 0.0)
sc.frame_set(1)
bpy.context.view_layer.update()
bpy.context.evaluated_depsgraph_get().update()

def m4(m):
    return [[round(v, 4) for v in r] for r in m]

out = {}
leg = 'leg_near_front'
o = bpy.data.objects[leg]
W_old = o.matrix_world.copy()
mpi_old = o.matrix_parent_inverse.copy()
M_hips = arm.data.bones['hips'].matrix_local.copy()
M_leg = arm.data.bones[leg + '_b'].matrix_local.copy()
basis = o.matrix_basis.copy()
out['W_old'] = m4(W_old)
out['formula_check_Wold'] = m4(M_hips @ mpi_old @ basis)
out['resid_formula'] = max(abs((M_hips @ mpi_old @ basis)[r][c] - W_old[r][c])
                           for r in range(4) for c in range(4))
# re-parent with my formula
mpi_formula = M_leg.inverted() @ M_hips @ mpi_old
o.parent = arm
o.parent_type = 'BONE'
o.parent_bone = leg + '_b'
o.matrix_parent_inverse = mpi_formula.copy()
sc.frame_set(1)
bpy.context.view_layer.update()
bpy.context.evaluated_depsgraph_get().update()
W_new = o.matrix_world.copy()
out['resid_after_formula'] = max(abs(W_new[r][c] - W_old[r][c])
                                 for r in range(4) for c in range(4))
# what mpi would be NEEDED to preserve W_old exactly
mpi_needed = M_leg.inverted() @ W_old @ basis.inverted()
out['mpi_formula'] = m4(mpi_formula)
out['mpi_needed'] = m4(mpi_needed)
out['mpi_delta_needed_minus_formula'] = m4(mpi_needed @ mpi_formula.inverted())
o.matrix_parent_inverse = mpi_needed.copy()
sc.frame_set(1)
bpy.context.view_layer.update()
bpy.context.evaluated_depsgraph_get().update()
out['resid_after_needed'] = max(abs(o.matrix_world[r][c] - W_old[r][c])
                                for r in range(4) for c in range(4))
json.dump(out, open(ROOT + '/out/fix_probe2.json', 'w'), indent=1)
print('PROBE2_DONE')
