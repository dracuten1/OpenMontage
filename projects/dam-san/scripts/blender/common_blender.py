"""Shared Blender 5.2.2 LTS headless Cycles (Apple M4 Metal GPU) helpers & Central Highlands diorama material library."""
from __future__ import annotations

import math
from pathlib import Path
from typing import Iterable

import bpy
from mathutils import Euler, Vector

OUT_RENDER_DIR = Path("/Users/tuyennguyen/project/OpenMontage/remotion-composer/public/dam-san/blender")
OUT_BLEND_DIR = Path("/Users/tuyennguyen/project/OpenMontage/projects/dam-san/assets/blender")


def set_input(node, name: str, value) -> bool:
    """Safely set node input by name (handles Blender 5.x conditionally disabled inputs)."""
    for inp in node.inputs:
        if inp.name == name:
            inp.default_value = value
            return True
    return False


def clear_scene() -> None:
    """Reset Blender scene cleanly before building each diorama."""
    bpy.ops.wm.read_factory_settings(use_empty=True)
    OUT_RENDER_DIR.mkdir(parents=True, exist_ok=True)
    OUT_BLEND_DIR.mkdir(parents=True, exist_ok=True)


def setup_cycles_metal(samples: int = 64, width: int = 1920, height: int = 1080) -> None:
    """Configure Cycles on Apple Silicon Metal GPU with OpenImageDenoise & AgX tone mapping."""
    scene = bpy.context.scene
    scene.render.engine = "CYCLES"
    prefs = bpy.context.preferences.addons["cycles"].preferences
    prefs.compute_device_type = "METAL"
    prefs.get_devices()
    has_gpu = False
    for dev in prefs.devices:
        if dev.type == "METAL":
            dev.use = True
            has_gpu = True
        else:
            dev.use = False
    scene.cycles.device = "GPU" if has_gpu else "CPU"
    scene.cycles.samples = samples
    scene.cycles.use_adaptive_sampling = True
    scene.cycles.adaptive_threshold = 0.02
    scene.cycles.adaptive_min_samples = 16
    scene.cycles.use_denoising = True
    scene.cycles.denoiser = "OPENIMAGEDENOISE"
    scene.cycles.max_bounces = 8
    scene.cycles.diffuse_bounces = 3
    scene.cycles.glossy_bounces = 4
    scene.cycles.transmission_bounces = 6

    scene.render.resolution_x = width
    scene.render.resolution_y = height
    scene.render.resolution_percentage = 100
    scene.render.image_settings.file_format = "PNG"
    scene.render.image_settings.color_mode = "RGB"

    try:
        scene.view_settings.view_transform = "AgX"
        scene.view_settings.look = "AgX - Medium High Contrast"
    except Exception:
        scene.view_settings.view_transform = "Standard"
    scene.view_settings.exposure = 0.15


def setup_world(bg_rgb=(0.028, 0.022, 0.018), strength: float = 0.45) -> None:
    """Subtle dark archival basalt studio world lighting."""
    world = bpy.data.worlds.new("W-DioramaStudio")
    bpy.context.scene.world = world
    world.use_nodes = True
    nt = world.node_tree
    bg = nt.nodes.get("Background")
    if bg:
        bg.inputs["Color"].default_value = (*bg_rgb, 1.0)
        bg.inputs["Strength"].default_value = strength


def aim_at(obj, target) -> None:
    target_pos = Vector(target.location) if hasattr(target, "location") else Vector(target)
    direction = (target_pos - obj.location).normalized()
    obj.rotation_euler = direction.to_track_quat("-Z", "Y").to_euler()


def make_noise_material(
    name: str,
    base_rgb: tuple[float, float, float],
    *,
    metallic: float = 0.0,
    roughness: float = 0.55,
    bump_strength: float = 0.12,
    noise_scale: float = 18.0,
    coat_weight: float = 0.0,
    sss_weight: float = 0.0,
    sss_radius: tuple[float, float, float] = (0.4, 0.25, 0.1),
    emission_rgb: tuple[float, float, float] | None = None,
    emission_strength: float = 0.0,
    color_var: float = 0.18,
):
    """Create procedural noise-varied Principled BSDF material matching Atelier tactile diorama look."""
    if name in bpy.data.materials:
        return bpy.data.materials[name]
    mat = bpy.data.materials.new(name)
    mat.use_nodes = True
    nt = mat.node_tree
    nodes = nt.nodes
    links = nt.links
    bsdf = nodes["Principled BSDF"]

    set_input(bsdf, "Metallic", metallic)
    set_input(bsdf, "Roughness", roughness)
    set_input(bsdf, "Coat Weight", coat_weight)
    if sss_weight > 0:
        set_input(bsdf, "Subsurface Weight", sss_weight)
        set_input(bsdf, "Subsurface Radius", sss_radius)
    if emission_rgb is not None and emission_strength > 0:
        set_input(bsdf, "Emission Color", (*emission_rgb, 1.0))
        set_input(bsdf, "Emission Strength", emission_strength)

    tex_coord = nodes.new("ShaderNodeTexCoord")
    noise = nodes.new("ShaderNodeTexNoise")
    noise.inputs["Scale"].default_value = noise_scale
    noise.inputs["Detail"].default_value = 6.0
    noise.inputs["Roughness"].default_value = 0.65
    links.new(tex_coord.outputs["Object"], noise.inputs["Vector"])

    # Subtle albedo variation between darker and base_rgb
    mix = nodes.new("ShaderNodeMix")
    mix.data_type = "RGBA"
    mix.inputs["Factor"].default_value = color_var
    dark_col = tuple(max(0.0, c * 0.62) for c in base_rgb)
    light_col = tuple(min(1.0, c * 1.15) for c in base_rgb)
    mix.inputs[6].default_value = (*dark_col, 1.0)
    mix.inputs[7].default_value = (*light_col, 1.0)
    links.new(noise.outputs["Fac"], mix.inputs[0])
    links.new(mix.outputs[2], bsdf.inputs["Base Color"])

    if bump_strength > 0:
        bump = nodes.new("ShaderNodeBump")
        bump.inputs["Strength"].default_value = bump_strength
        bump.inputs["Distance"].default_value = 0.02
        links.new(noise.outputs["Fac"], bump.inputs["Height"])
        links.new(bump.outputs["Normal"], bsdf.inputs["Normal"])

    return mat


def build_palette() -> dict[str, bpy.types.Material]:
    """Central Highlands tactile clay-wood-bronze palette."""
    return {
        "basalt": make_noise_material("MAT-basalt", (0.06, 0.052, 0.048), roughness=0.72, bump_strength=0.18, noise_scale=24.0),
        "red_soil": make_noise_material("MAT-red_soil", (0.38, 0.14, 0.085), roughness=0.82, bump_strength=0.25, noise_scale=16.0),
        "ironwood": make_noise_material("MAT-ironwood", (0.14, 0.075, 0.042), roughness=0.48, bump_strength=0.16, noise_scale=32.0, coat_weight=0.15),
        "teak_carved": make_noise_material("MAT-teak_carved", (0.28, 0.155, 0.08), roughness=0.44, bump_strength=0.14, noise_scale=28.0, coat_weight=0.2),
        "thatch": make_noise_material("MAT-thatch", (0.46, 0.34, 0.19), roughness=0.88, bump_strength=0.35, noise_scale=42.0),
        "paper": make_noise_material("MAT-archival_paper", (0.86, 0.79, 0.65), roughness=0.74, bump_strength=0.06, noise_scale=40.0),
        "forest_moss": make_noise_material("MAT-forest_moss", (0.11, 0.24, 0.19), roughness=0.78, bump_strength=0.22, noise_scale=22.0),
        "brocade_red": make_noise_material("MAT-brocade_red", (0.52, 0.12, 0.08), roughness=0.75, bump_strength=0.2, noise_scale=65.0),
        "bronze_gong": make_noise_material("MAT-bronze_gong", (0.76, 0.54, 0.20), metallic=1.0, roughness=0.28, bump_strength=0.08, noise_scale=45.0, color_var=0.22),
        "iron_armor": make_noise_material("MAT-iron_armor", (0.24, 0.25, 0.27), metallic=1.0, roughness=0.36, bump_strength=0.12, noise_scale=30.0),
        "copper": make_noise_material("MAT-copper", (0.78, 0.42, 0.24), metallic=1.0, roughness=0.24, bump_strength=0.07, noise_scale=36.0),
        "black_wax": make_noise_material("MAT-black_wax", (0.045, 0.032, 0.025), roughness=0.26, coat_weight=0.5, sss_weight=0.35, sss_radius=(0.55, 0.25, 0.08), bump_strength=0.09, noise_scale=14.0),
        "amber_wax": make_noise_material("MAT-amber_wax", (0.72, 0.34, 0.06), roughness=0.22, coat_weight=0.55, sss_weight=0.85, sss_radius=(0.8, 0.35, 0.08), bump_strength=0.06, noise_scale=12.0),
        "sun_gold": make_noise_material("MAT-sun_gold", (0.98, 0.72, 0.25), roughness=0.2, emission_rgb=(1.0, 0.62, 0.18), emission_strength=4.5, bump_strength=0.03),
        "hearth_ember": make_noise_material("MAT-hearth_ember", (0.95, 0.32, 0.05), roughness=0.4, emission_rgb=(1.0, 0.34, 0.06), emission_strength=6.0, bump_strength=0.15),
        "ceramic_che": make_noise_material("MAT-ceramic_che", (0.31, 0.16, 0.09), roughness=0.28, coat_weight=0.65, bump_strength=0.08, noise_scale=25.0),
    }


def assign_mat(obj, mat) -> None:
    if obj.data.materials:
        obj.data.materials[0] = mat
    else:
        obj.data.materials.append(mat)


def add_cylinder(name: str, loc, scale=(1, 1, 1), rot=(0, 0, 0), mat=None, verts: int = 32, smooth: bool = True):
    bpy.ops.mesh.primitive_cylinder_add(vertices=verts, radius=1.0, depth=1.0, location=loc, rotation=rot)
    o = bpy.context.active_object
    o.name = name
    o.scale = scale
    if smooth:
        bpy.ops.object.shade_smooth()
    if mat:
        assign_mat(o, mat)
    return o


def add_box(name: str, loc, scale=(1, 1, 1), rot=(0, 0, 0), mat=None, bevel: float = 0.015):
    bpy.ops.mesh.primitive_cube_add(size=1.0, location=loc, rotation=rot)
    o = bpy.context.active_object
    o.name = name
    o.scale = scale
    if bevel > 0:
        b = o.modifiers.new("Bevel", "BEVEL")
        b.width = bevel
        b.segments = 2
    if mat:
        assign_mat(o, mat)
    return o


def add_cone(name: str, loc, r1=1.0, r2=0.1, depth=1.0, rot=(0, 0, 0), mat=None, verts: int = 24):
    bpy.ops.mesh.primitive_cone_add(vertices=verts, radius1=r1, radius2=r2, depth=depth, location=loc, rotation=rot)
    o = bpy.context.active_object
    o.name = name
    bpy.ops.object.shade_smooth()
    if mat:
        assign_mat(o, mat)
    return o


def add_sphere(name: str, loc, scale=(1, 1, 1), mat=None, segs: int = 24):
    bpy.ops.mesh.primitive_uv_sphere_add(segments=segs, ring_count=16, radius=1.0, location=loc)
    o = bpy.context.active_object
    o.name = name
    o.scale = scale
    bpy.ops.object.shade_smooth()
    if mat:
        assign_mat(o, mat)
    return o


def add_torus(name: str, loc, major_r=1.0, minor_r=0.1, rot=(0, 0, 0), mat=None):
    bpy.ops.mesh.primitive_torus_add(major_radius=major_r, minor_radius=minor_r, location=loc, rotation=rot)
    o = bpy.context.active_object
    o.name = name
    bpy.ops.object.shade_smooth()
    if mat:
        assign_mat(o, mat)
    return o


def add_diorama_plinth(pal: dict[str, bpy.types.Material], radius: float = 4.6) -> None:
    """Museum diorama tiered basalt + brass trim plinth & wide dark studio backdrop."""
    add_cylinder("GEO-plinth-base", (0, 0, -0.35), scale=(radius + 0.35, radius + 0.35, 0.50), mat=pal["basalt"], verts=24, smooth=False)
    add_cylinder("GEO-plinth-brass-ring", (0, 0, -0.09), scale=(radius + 0.08, radius + 0.08, 0.05), mat=pal["bronze_gong"], verts=36, smooth=True)
    add_cylinder("GEO-plinth-soil", (0, 0, -0.02), scale=(radius, radius, 0.14), mat=pal["red_soil"], verts=36, smooth=True)
    # Seamless extra-wide curved studio backdrop so side edges never clip in wide lens
    add_cylinder("GEO-backdrop-wall", (0, 1.5, 4.0), scale=(18.5, 16.0, 14.0), mat=pal["basalt"], verts=48, smooth=True)
    # Remove front/bottom occlusion: wait, a plane far behind + side wings avoids blocking lights behind cam!
    bpy.data.objects.remove(bpy.data.objects["GEO-backdrop-wall"], do_unlink=True)
    add_box("GEO-backdrop-wall", (0, 8.8, 4.5), scale=(44.0, 0.5, 22.0), mat=pal["basalt"], bevel=0.0)
    add_box("GEO-backdrop-wing-L", (-18.0, 3.0, 4.5), scale=(0.5, 24.0, 22.0), rot=(0, 0, math.radians(-22)), mat=pal["basalt"], bevel=0.0)
    add_box("GEO-backdrop-wing-R", (18.0, 3.0, 4.5), scale=(0.5, 24.0, 22.0), rot=(0, 0, math.radians(22)), mat=pal["basalt"], bevel=0.0)


def add_stylized_warrior(
    prefix: str,
    pos: tuple[float, float, float],
    rot_z: float,
    pal: dict[str, bpy.types.Material],
    *,
    armor_mat=None,
    shield_mat=None,
    pose: str = "ready",
) -> None:
    """Museum carved-wood/bronze miniature figurine with overlapping joints (no floating pieces)."""
    x, y, z = pos
    body_mat = armor_mat or pal["teak_carved"]
    s_mat = shield_mat or pal["bronze_gong"]
    parent = bpy.data.objects.new(f"Empty-{prefix}", None)
    bpy.context.collection.objects.link(parent)
    parent.location = (x, y, z)
    parent.rotation_euler = (0, 0, rot_z)

    def link_rel(obj):
        obj.parent = parent
        return obj

    # Pedestal disk + overlapping legs + loincloth + torso + chest brocade + shoulders + helmet/head + spear + shield
    link_rel(add_cylinder(f"GEO-{prefix}-base", (0, 0, 0.03), (0.28, 0.28, 0.06), mat=pal["ironwood"]))
    link_rel(add_cylinder(f"GEO-{prefix}-legL", (-0.10, 0, 0.27), (0.075, 0.075, 0.44), mat=pal["teak_carved"]))
    link_rel(add_cylinder(f"GEO-{prefix}-legR", (0.10, 0, 0.27), (0.075, 0.075, 0.44), mat=pal["teak_carved"]))
    link_rel(add_cylinder(f"GEO-{prefix}-waist", (0, 0, 0.52), (0.17, 0.13, 0.20), mat=pal["brocade_red"]))
    link_rel(add_cylinder(f"GEO-{prefix}-torso", (0, 0, 0.78), (0.20, 0.14, 0.40), mat=body_mat))
    link_rel(add_box(f"GEO-{prefix}-sash", (0, -0.02, 0.79), (0.34, 0.28, 0.12), mat=pal["brocade_red"], bevel=0.02))
    link_rel(add_sphere(f"GEO-{prefix}-head", (0, 0, 1.09), (0.14, 0.14, 0.15), mat=pal["teak_carved"]))
    link_rel(add_cylinder(f"GEO-{prefix}-headband", (0, 0, 1.13), (0.148, 0.148, 0.055), mat=pal["brocade_red"]))
    # Spear right arm — compute exact tilted tip position from shaft axis so blade stays fused to shaft
    tilt = -0.35 if pose == "attack" else 0.15
    s_rot = (tilt + 0.25, 0.1, 0.0)
    s_base = Vector((0.31, -0.10, 0.96))
    s_half = 0.84
    tip_pos = s_base + (Euler(s_rot, "XYZ").to_matrix() @ Vector((0.0, 0.0, s_half + 0.09)))
    link_rel(add_cylinder(f"GEO-{prefix}-armR", (0.24, -0.05, 0.85), (0.055, 0.055, 0.38), rot=(tilt, 0.3, 0), mat=body_mat))
    link_rel(add_cylinder(f"GEO-{prefix}-spear-shaft", tuple(s_base), (0.022, 0.022, s_half * 2), rot=s_rot, mat=pal["ironwood"]))
    link_rel(add_cone(f"GEO-{prefix}-spear-tip", tuple(tip_pos), r1=0.052, r2=0.002, depth=0.26, rot=s_rot, mat=pal["bronze_gong"]))
    # Round bronze shield left arm
    link_rel(add_cylinder(f"GEO-{prefix}-armL", (-0.23, -0.06, 0.82), (0.055, 0.055, 0.34), rot=(0.45, -0.35, 0), mat=body_mat))
    link_rel(add_cylinder(f"GEO-{prefix}-shield", (-0.28, -0.22, 0.82), (0.28, 0.28, 0.04), rot=(math.radians(82), 0, math.radians(-22)), mat=s_mat))
    link_rel(add_sphere(f"GEO-{prefix}-shield-boss", (-0.30, -0.25, 0.82), (0.075, 0.075, 0.075), mat=pal["copper"]))


def add_lighting_rig(
    *,
    key_pos=(6.5, -6.5, 7.5),
    key_energy: float = 1100.0,
    key_color=(1.0, 0.88, 0.72),
    fill_pos=(-7.0, -5.0, 5.0),
    fill_energy: float = 280.0,
    fill_color=(0.76, 0.84, 0.96),
    rim_pos=(-3.0, 6.0, 6.5),
    rim_energy: float = 700.0,
    rim_color=(1.0, 0.78, 0.48),
    target=(0.0, 0.0, 1.0),
) -> None:
    """Subject-aware three-point studio Area lighting rig."""
    specs = [
        ("LGT-Key", key_pos, key_energy, key_color, 3.5),
        ("LGT-Fill", fill_pos, fill_energy, fill_color, 5.0),
        ("LGT-Rim", rim_pos, rim_energy, rim_color, 3.0),
    ]
    for name, loc, energy, col, size in specs:
        ldata = bpy.data.lights.new(name=name, type="AREA")
        ldata.energy = energy
        ldata.color = col
        ldata.size = size
        lobj = bpy.data.objects.new(name, ldata)
        bpy.context.collection.objects.link(lobj)
        lobj.location = loc
        aim_at(lobj, target)


def render_camera(
    name: str,
    cam_pos: tuple[float, float, float],
    target: tuple[float, float, float],
    lens_mm: float,
    out_filename: str,
    *,
    fstop: float = 4.0,
) -> Path:
    """Create tracked camera with physical DoF and render PNG to Remotion public/dam-san/blender/."""
    tgt_empty = bpy.data.objects.new(f"Empty-{name}-tgt", None)
    bpy.context.collection.objects.link(tgt_empty)
    tgt_empty.location = target

    cam_data = bpy.data.cameras.new(name)
    cam_data.lens = lens_mm
    cam_data.sensor_width = 36.0
    cam_data.dof.use_dof = True
    cam_data.dof.aperture_fstop = fstop
    cam_data.dof.focus_distance = (Vector(cam_pos) - Vector(target)).length

    cam = bpy.data.objects.new(name, cam_data)
    bpy.context.collection.objects.link(cam)
    cam.location = cam_pos
    aim_at(cam, tgt_empty)

    bpy.context.scene.camera = cam
    out_path = OUT_RENDER_DIR / out_filename
    bpy.context.scene.render.filepath = str(out_path)
    bpy.ops.render.render(write_still=True)
    print(f"RENDERED: {out_path}")
    return out_path


def save_blend(slug: str) -> None:
    blend_path = OUT_BLEND_DIR / f"{slug}.blend"
    bpy.ops.wm.save_as_mainfile(filepath=str(blend_path))
    print(f"SAVED BLEND: {blend_path}")
