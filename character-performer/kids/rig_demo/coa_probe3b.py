import bpy, json, sys, traceback
R = {}
try:
    import addon_utils
    addon_utils.enable("coa_tools2")
    bpy.ops.coa_tools2.create_sprite_object()
    so = next(o for o in bpy.data.objects if "Sprite" in o.name)
    bpy.context.view_layer.objects.active = so
    PNG = "/Users/tuyennguyen/project/OpenMontage/character-performer/kids/rig_demo/parts/head.png"
    import os
    if not os.path.exists(PNG):
        PNG = "/Users/tuyennguyen/project/OpenMontage/character-performer/kids/assets/ep1_ai/rabbit_shock_m0.png"
    r = bpy.ops.coa_tools2.import_sprite(path=PNG, parent=so.name)
    R["import_sprite"] = str(r)
    R["objects"] = [o.name for o in bpy.data.objects][:20]
    R["types"] = {o.name: o.type for o in bpy.data.objects}
except Exception as e:
    R["fail"] = repr(e)[:200]
    R["tb"] = traceback.format_exc(limit=3)[-400:]
print("COAPROBE3B " + json.dumps(R))
