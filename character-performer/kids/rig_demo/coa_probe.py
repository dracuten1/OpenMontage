"""PROBE: install + enable COA Tools 2 addon on Blender 5.2.2 headless, report exit path."""
import bpy, sys, os, json, traceback

R = {"blender": bpy.app.version_string, "python": sys.version.split()[0]}
ZIP = "/Users/tuyennguyen/project/OpenMontage/character-performer/kids/rig_demo/coa_tools2_addon.zip"

def step(name, fn):
    try:
        R[name] = fn()
    except Exception as e:
        R[name] = "FAIL: " + repr(e)[:250]
        R[name + "_tb"] = traceback.format_exc(limit=4)[-500:]

def _install():
    return str(bpy.ops.preferences.addon_install(filepath=ZIP, overwrite=True))
step("addon_install", _install)

def _enable():
    return str(bpy.ops.preferences.addon_enable(module="coa_tools2"))
step("addon_enable", _enable)

def _import():
    import coa_tools2
    from coa_tools2 import __init__ as c
    return "ok version=%s deps_module=%s" % (
        getattr(coa_tools2, "bl_info", {}).get("version", c.bl_info.get("version")),
        hasattr(coa_tools2, "dependency_manager"))
step("module_import", _import)

def _check():
    import addon_utils
    mods = [m.__name__ for m in addon_utils.modules() if "coa" in m.__name__.lower()]
    en = {m: addon_utils.check(m) for m in mods}
    return {"found": mods, "enabled_flags": {k: v for k, v in en.items()}}
step("addon_utils_check", _check)

# Level 2: try a minimal COA operator (create_sprite_object) headless
def _create_obj():
    r = bpy.ops.coa_tools2.create_sprite_object()
    objs = [o.name for o in bpy.data.objects if "Sprite" in o.name or "sprite" in o.name]
    return {"op_return": str(r), "sprite_objects": objs}
step("op_create_sprite_object", _create_obj)

print("COAPROBE_RESULT " + json.dumps(R))
sys.exit(0)
