import bpy
OUT = '/Users/tuyennguyen/project/OpenMontage/character-performer/kids/rig_demo/out'
bpy.ops.wm.open_mainfile(filepath=OUT + '/rabbit_rig.blend')
scn = bpy.context.scene
arm = bpy.data.objects['SpriteObject']
scn.frame_set(1)
scn.render.filepath = OUT + '/scratch/bisect_pre.png'
bpy.ops.render.render(write_still=True)
for pb in arm.pose.bones:
    pb.rotation_mode = 'XYZ'
scn.frame_set(1)
scn.render.filepath = OUT + '/scratch/bisect_post.png'
bpy.ops.render.render(write_still=True)
print('BISECT_DONE')
