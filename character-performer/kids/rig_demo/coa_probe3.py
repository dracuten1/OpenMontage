"""COA probe L3: import một PNG part thật vào COA SpriteObject headless."""
import bpy, json, sys, traceback

R = {}
try:
    import addon_utils
    addon_utils.enable("coa_tools2")
    R["enable"] = "ok"
except Exception as e:
    R["enable"] = repr(e)[:150]

try:
    r = bpy.ops.coa_tools2.create_sprite_object()
    R["create_sprite_object"] = str(r)
    so = next(o for o in bpy.data.objects if "Sprite" in o.name)
    R["sprite_object"] = so.name
    R["so_type"] = so.type
    R["coa_type"] = so.get("coa_tools2_type", None) if isinstance(so, dict) is False else None
    # COA2 dùng coa_tools2 property group trên object
    R["props"] = [k for k in so.keys() if "coa" in k.lower()][:10]
except Exception as e:
    R["create_sprite_object"] = "FAIL " + repr(e)[:150]
    R["tb"] = traceback.format_exc(limit=3)[-400:]

PNG = "/Users/tuyennguyen/project/OpenMontage/character-performer/kids/assets/ep1_ai/rabbit_shock_m0.png"
try:
    # operator fileselect: gọi với filepath + directory override
    r = bpy.ops.coa_tools2.import_sprite(filepath=PNG, directory="/Users/tuyennguyen/project/OpenMontage/character-performer/kids/assets/ep1_ai/", files=[{"name": "rabbit_shock_m0.png"}])
    R["import_sprite"] = str(r)
    R["objects_after"] = [o.name for o in bpy.data.objects][:20]
except Exception as e:
    R["import_sprite"] = "FAIL " + repr(e)[:200]
    R["import_tb"] = traceback.format_exc(limit=3)[-400:]

print("COAPROBE3 " + json.dumps(R))
