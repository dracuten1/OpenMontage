#!/usr/bin/env python3
"""Headless Blender 5.2.2 builder for the reusable 'Ký Chủ Điểm Tin' 3D brand bumper.

Usage:
    blender --background --python-exit-code 1 --python tools/brand/build_kcdt_bumper.py -- \
        --aspect 9x16 \
        --out assets/brand/kcdt-bumper/kcdt_bumper_9x16.mp4 \
        --blend assets/brand/kcdt-bumper/src/kcdt_bumper_9x16.blend
"""

from __future__ import annotations

import argparse
import math
import os
import shutil
import subprocess
import sys
from pathlib import Path

import bpy
from mathutils import Vector

FONT_TITLE_DEFAULT = "/System/Library/Fonts/Supplemental/DIN Condensed Bold.ttf"
FONT_TAGLINE_DEFAULT = "/System/Library/Fonts/Supplemental/Arial Bold.ttf"

ACCENT_PALETTES = {
    "crimson": {
        "base": (0.72, 0.008, 0.02, 1.0),
        "glow": (0.95, 0.015, 0.03, 1.0),
        "rim": (1.0, 0.02, 0.04),
    },
    "amber": {
        "base": (0.88, 0.42, 0.015, 1.0),
        "glow": (1.0, 0.52, 0.03, 1.0),
        "rim": (1.0, 0.48, 0.04),
    },
    "cold": {
        "base": (0.08, 0.36, 0.88, 1.0),
        "glow": (0.14, 0.54, 1.0, 1.0),
        "rim": (0.16, 0.52, 1.0),
    },
}


def set_input(node: bpy.types.Node, name: str, value: object) -> bool:
    """Safely assign node input by name (handles Blender 5.x conditionally disabled sockets)."""
    for inp in node.inputs:
        if inp.name == name:
            inp.default_value = value
            return True
    return False


def clear_scene() -> None:
    """Reset the Blender scene to an empty factory state without orphaned datablocks."""
    bpy.ops.wm.read_factory_settings(use_empty=True)


def set_key_ease_out(obj: bpy.types.Object, data_path: str) -> None:
    """Set Bezier handles on object animation curves for crisp ease-out motion."""
    anim = obj.animation_data
    if not anim or not anim.action:
        return
    action = anim.action
    curve_lists = []
    if hasattr(action, "fcurves") and action.fcurves is not None:
        curve_lists.append(action.fcurves)
    for layer in getattr(action, "layers", ()):
        for strip in getattr(layer, "strips", ()):
            for bag in getattr(strip, "channelbags", ()):
                if getattr(bag, "fcurves", None) is not None:
                    curve_lists.append(bag.fcurves)
    for fcurves in curve_lists:
        for fc in fcurves:
            if fc.data_path != data_path:
                continue
            for kp in fc.keyframe_points:
                kp.interpolation = "BEZIER"
                kp.easing = "EASE_OUT"


def create_brushed_pbr(
    name: str,
    base_color: tuple[float, float, float, float],
    metallic: float,
    roughness_low: float,
    roughness_high: float,
    coat_weight: float = 0.0,
    coat_roughness: float = 0.1,
    specular: float = 0.5,
    emission_color: tuple[float, float, float, float] | None = None,
    emission_strength: float = 0.0,
    brush_scale: tuple[float, float, float] = (2.0, 2.0, 75.0),
) -> bpy.types.Material:
    """Create a brushed PBR Principled BSDF material with directional roughness variation."""
    mat = bpy.data.materials.new(name=name)
    mat.use_nodes = True
    nt = mat.node_tree
    nodes = nt.nodes
    links = nt.links

    bsdf = nodes.get("Principled BSDF")
    if bsdf is None:
        bsdf = nodes.new("ShaderNodeBsdfPrincipled")

    set_input(bsdf, "Base Color", base_color)
    set_input(bsdf, "Metallic", metallic)
    set_input(bsdf, "Coat Weight", coat_weight)
    set_input(bsdf, "Coat Roughness", coat_roughness)
    set_input(bsdf, "Specular IOR Level", specular)
    if emission_color is not None:
        set_input(bsdf, "Emission Color", emission_color)
    set_input(bsdf, "Emission Strength", emission_strength)

    tex_coord = nodes.new("ShaderNodeTexCoord")
    mapping = nodes.new("ShaderNodeMapping")
    mapping.inputs["Scale"].default_value = brush_scale
    noise = nodes.new("ShaderNodeTexNoise")
    noise.inputs["Scale"].default_value = 6.0
    noise.inputs["Detail"].default_value = 8.0
    noise.inputs["Roughness"].default_value = 0.65

    ramp = nodes.new("ShaderNodeMapRange")
    ramp.inputs["From Min"].default_value = 0.25
    ramp.inputs["From Max"].default_value = 0.75
    ramp.inputs["To Min"].default_value = roughness_low
    ramp.inputs["To Max"].default_value = roughness_high

    links.new(tex_coord.outputs["Object"], mapping.inputs["Vector"])
    links.new(mapping.outputs["Vector"], noise.inputs["Vector"])
    links.new(noise.outputs["Fac"], ramp.inputs["Value"])
    links.new(ramp.outputs["Result"], bsdf.inputs["Roughness"])
    return mat


def assign_material(obj: bpy.types.Object, mat: bpy.types.Material) -> None:
    if obj.data.materials:
        obj.data.materials[0] = mat
    else:
        obj.data.materials.append(mat)


def add_bevel_and_smooth(obj: bpy.types.Object, width: float = 0.02, segments: int = 4) -> None:
    """Apply chamfer bevel modifier and smooth shading so edges catch studio specular highlights."""
    bev = obj.modifiers.new(name="StudioBevel", type="BEVEL")
    bev.width = width
    bev.segments = segments
    bev.limit_method = "ANGLE"
    bev.angle_limit = math.radians(30)
    if obj.type == "MESH":
        for poly in obj.data.polygons:
            poly.use_smooth = True


def create_box(
    name: str,
    location: tuple[float, float, float],
    dimensions: tuple[float, float, float],
    material: bpy.types.Material,
    rotation: tuple[float, float, float] = (0.0, 0.0, 0.0),
    bevel_width: float = 0.02,
    bevel_segments: int = 4,
) -> bpy.types.Object:
    bpy.ops.mesh.primitive_cube_add(size=1.0, location=location, rotation=rotation)
    obj = bpy.context.active_object
    obj.name = name
    obj.scale = dimensions
    bpy.context.view_layer.update()
    bpy.ops.object.transform_apply(location=False, rotation=False, scale=True)
    if bevel_width > 0:
        add_bevel_and_smooth(obj, width=bevel_width, segments=bevel_segments)
    assign_material(obj, material)
    return obj


def create_torus_ring(
    name: str,
    location: tuple[float, float, float],
    major_radius: float,
    minor_radius: float,
    material: bpy.types.Material,
    rotation: tuple[float, float, float] = (math.radians(90), 0.0, 0.0),
) -> bpy.types.Object:
    bpy.ops.mesh.primitive_torus_add(
        major_segments=128,
        minor_segments=24,
        major_radius=major_radius,
        minor_radius=minor_radius,
        location=location,
        rotation=rotation,
    )
    obj = bpy.context.active_object
    obj.name = name
    for poly in obj.data.polygons:
        poly.use_smooth = True
    assign_material(obj, material)
    return obj


def create_arc_sweep(
    name: str,
    center: tuple[float, float, float],
    radius: float,
    start_deg: float,
    end_deg: float,
    tube_radius: float,
    material: bpy.types.Material,
    steps: int = 48,
) -> bpy.types.Object:
    """Create a beveled circular arc lying in the XZ plane for luminous orbital sweeps."""
    curve_data = bpy.data.curves.new(name=f"{name}_Curve", type="CURVE")
    curve_data.dimensions = "3D"
    curve_data.bevel_depth = tube_radius
    curve_data.bevel_resolution = 6
    curve_data.resolution_u = 12

    spline = curve_data.splines.new("POLY")
    spline.points.add(steps)
    for i in range(steps + 1):
        t = i / steps
        ang = math.radians(start_deg + (end_deg - start_deg) * t)
        x = radius * math.cos(ang)
        z = radius * math.sin(ang)
        spline.points[i].co = (x, 0.0, z, 1.0)

    obj = bpy.data.objects.new(name, curve_data)
    obj.location = center
    bpy.context.collection.objects.link(obj)
    assign_material(obj, material)
    return obj


def create_text_3d(
    name: str,
    body: str,
    font_path: str,
    target_width: float,
    max_height: float,
    location: tuple[float, float, float],
    extrude: float,
    bevel_depth: float,
    material: bpy.types.Material,
    space_character: float = 1.04,
    space_line: float = 0.94,
) -> bpy.types.Object:
    """Create beveled, upright, exactly-sized 3D typography facing -Y."""
    curve = bpy.data.curves.new(name=f"{name}_FontCurve", type="FONT")
    curve.body = body
    curve.align_x = "CENTER"
    curve.align_y = "CENTER"
    curve.extrude = extrude
    curve.bevel_depth = bevel_depth
    curve.bevel_resolution = 4
    curve.space_character = space_character
    curve.space_line = space_line
    curve.size = 1.0

    if os.path.exists(font_path):
        curve.font = bpy.data.fonts.load(font_path)

    obj = bpy.data.objects.new(name, curve)
    obj.location = location
    obj.rotation_euler = (math.radians(90), 0.0, 0.0)
    bpy.context.collection.objects.link(obj)
    assign_material(obj, material)

    bpy.context.view_layer.update()
    initial_corners = [obj.matrix_world @ Vector(corner) for corner in obj.bound_box]
    span_x = max(v.x for v in initial_corners) - min(v.x for v in initial_corners)
    span_z = max(v.z for v in initial_corners) - min(v.z for v in initial_corners)
    scale_x = target_width / max(0.05, span_x)
    scale_z = max_height / max(0.05, span_z)
    uniform_scale = min(scale_x, scale_z)
    obj.scale = (uniform_scale, uniform_scale, uniform_scale)
    bpy.context.view_layer.update()

    # Center vertically using rendered world bbox (not font baseline) so Vietnamese diacritics stay symmetric
    world_corners = [obj.matrix_world @ Vector(corner) for corner in obj.bound_box]
    min_z = min(v.z for v in world_corners)
    max_z = max(v.z for v in world_corners)
    obj.location.z += location[2] - 0.5 * (min_z + max_z)
    bpy.context.view_layer.update()
    return obj


def add_area_light(
    name: str,
    location: tuple[float, float, float],
    target: tuple[float, float, float],
    energy: float,
    color: tuple[float, float, float],
    size: float,
    size_y: float | None = None,
) -> bpy.types.Object:
    light_data = bpy.data.lights.new(name=f"{name}_Data", type="AREA")
    light_data.energy = energy
    light_data.color = color
    if size_y is not None:
        light_data.shape = "RECTANGLE"
        light_data.size = size
        light_data.size_y = size_y
    else:
        light_data.shape = "DISK"
        light_data.size = size
    obj = bpy.data.objects.new(name, light_data)
    obj.location = location
    bpy.context.collection.objects.link(obj)

    direction = (Vector(target) - Vector(location)).normalized()
    obj.rotation_euler = direction.to_track_quat("-Z", "Y").to_euler()
    return obj


def configure_world_and_render(
    aspect: str,
    samples: int,
    frames: int,
    fps: int,
) -> tuple[int, int]:
    scene = bpy.context.scene

    # Engine: support Blender 4.2 transitional NEXT and Blender 5.x BLENDER_EEVEE
    try:
        scene.render.engine = "BLENDER_EEVEE_NEXT"
    except (TypeError, ValueError):
        scene.render.engine = "BLENDER_EEVEE"

    if hasattr(scene, "eevee"):
        if hasattr(scene.eevee, "taa_render_samples"):
            scene.eevee.taa_render_samples = samples
        if hasattr(scene.eevee, "taa_samples"):
            scene.eevee.taa_samples = min(16, samples)

    if aspect == "9x16":
        res_x, res_y = 1080, 1920
    else:
        res_x, res_y = 1920, 1080

    scene.render.resolution_x = res_x
    scene.render.resolution_y = res_y
    scene.render.resolution_percentage = 100
    scene.render.fps = fps
    scene.frame_start = 1
    scene.frame_end = frames

    # Color management: AgX studio look
    try:
        scene.view_settings.view_transform = "AgX"
        scene.view_settings.look = "AgX - Medium High Contrast"
    except Exception:
        scene.view_settings.view_transform = "Filmic"
    scene.view_settings.exposure = 0.25
    scene.view_settings.gamma = 1.0

    # Deep slate studio environment so brushed steel catches soft ambient reflection
    world = bpy.data.worlds.new("StudioWorld")
    scene.world = world
    world.use_nodes = True
    bg = world.node_tree.nodes.get("Background")
    if bg:
        bg.inputs["Color"].default_value = (0.022, 0.032, 0.058, 1.0)
        bg.inputs["Strength"].default_value = 0.75

    # Subtle compositor lens bloom for accent sweeps (guarded across Blender 5.x versions)
    try:
        scene.use_nodes = True
        nt = getattr(scene, "node_tree", None)
        if nt is not None:
            rl = nt.nodes.get("Render Layers")
            comp = nt.nodes.get("Composite")
            if rl and comp:
                glare = nt.nodes.new("CompositorNodeGlare")
                if hasattr(glare, "glare_type"):
                    glare.glare_type = "FOG_GLOW"
                if hasattr(glare, "mix"):
                    glare.mix = -0.82
                if hasattr(glare, "threshold"):
                    glare.threshold = 1.4
                if hasattr(glare, "size"):
                    glare.size = 6
                nt.links.new(rl.outputs["Image"], glare.inputs["Image"])
                nt.links.new(glare.outputs["Image"], comp.inputs["Image"])
    except Exception as exc:
        print(f"[build_kcdt_bumper] skipping compositor glare ({exc})")

    return res_x, res_y


def build_bumper_scene(args: argparse.Namespace) -> None:
    clear_scene()
    configure_world_and_render(
        aspect=args.aspect,
        samples=args.samples,
        frames=args.frames,
        fps=args.fps,
    )
    scene = bpy.context.scene
    palette = ACCENT_PALETTES[args.accent]
    is_portrait = args.aspect == "9x16"

    # ---- Materials ----
    mat_obsidian = create_brushed_pbr(
        "MAT-studio_obsidian",
        base_color=(0.018, 0.026, 0.048, 1.0),
        metallic=0.0,
        roughness_low=0.26,
        roughness_high=0.40,
        coat_weight=0.35,
        specular=0.60,
        brush_scale=(1.5, 1.5, 40.0),
    )
    mat_tungsten = create_brushed_pbr(
        "MAT-brushed_tungsten",
        base_color=(0.24, 0.28, 0.35, 1.0),
        metallic=1.0,
        roughness_low=0.18,
        roughness_high=0.32,
        brush_scale=(65.0, 2.0, 2.0),
    )
    mat_steel = create_brushed_pbr(
        "MAT-champagne_steel",
        base_color=(0.72, 0.74, 0.78, 1.0),
        metallic=1.0,
        roughness_low=0.14,
        roughness_high=0.24,
        brush_scale=(50.0, 50.0, 4.0),
    )
    mat_glass = create_brushed_pbr(
        "MAT-smoked_glass",
        base_color=(0.014, 0.022, 0.040, 1.0),
        metallic=0.0,
        roughness_low=0.20,
        roughness_high=0.30,
        coat_weight=0.30,
        coat_roughness=0.24,
        specular=0.45,
    )
    mat_title = create_brushed_pbr(
        "MAT-title_titanium",
        base_color=(0.94, 0.96, 0.99, 1.0),
        metallic=0.0,
        roughness_low=0.12,
        roughness_high=0.20,
        coat_weight=0.75,
        specular=0.68,
        emission_color=(0.95, 0.97, 1.0, 1.0),
        emission_strength=0.18,
    )
    mat_tagline = create_brushed_pbr(
        "MAT-tagline_silver",
        base_color=(0.82, 0.86, 0.92, 1.0),
        metallic=0.0,
        roughness_low=0.18,
        roughness_high=0.26,
        specular=0.58,
        emission_color=(0.82, 0.88, 0.96, 1.0),
        emission_strength=0.22,
    )
    mat_accent = create_brushed_pbr(
        "MAT-accent_glow",
        base_color=palette["base"],
        metallic=0.0,
        roughness_low=0.12,
        roughness_high=0.18,
        emission_color=palette["glow"],
        emission_strength=2.6,
    )
    mat_accent_arc = create_brushed_pbr(
        "MAT-accent_arc_glow",
        base_color=palette["base"],
        metallic=0.0,
        roughness_low=0.14,
        roughness_high=0.20,
        emission_color=palette["glow"],
        emission_strength=1.9,
    )

    # ---- Aspect-Calibrated Studio Geometry ----
    # At camera y = -5.0 and horizontal sensor_width=36, lens=45 => visible X width at y=0 is 4.00 units.
    plate_w = 3.25
    plate_h = 2.08 if is_portrait else 0.96
    ring_r = 1.62 if is_portrait else 1.24

    # 1. Deep architectural studio backdrop wall + stepped flanking plinth columns
    create_box(
        "BG-studio_wall",
        location=(0.0, 2.8, 0.0),
        dimensions=(22.0, 0.3, 22.0),
        material=mat_obsidian,
        bevel_width=0.0,
    )

    flank_x = 1.85 if is_portrait else 2.35
    for idx, side in enumerate((-1, 1)):
        create_box(
            f"BG-plinth_outer_{idx}",
            location=(side * (flank_x + 0.55), 2.05, 0.0),
            dimensions=(1.1, 0.45, 9.5),
            material=mat_obsidian,
            rotation=(0.0, 0.0, side * math.radians(16)),
            bevel_width=0.035,
        )
        create_box(
            f"BG-fin_steel_{idx}",
            location=(side * (flank_x + 0.05), 1.10, 0.0),
            dimensions=(0.14, 0.52, 8.0),
            material=mat_tungsten,
            rotation=(0.0, 0.0, side * math.radians(24)),
            bevel_width=0.015,
        )

    # Diagonal lower stage floor shelf catching rim glints in portrait aspect
    create_box(
        "BG-stage_horizon",
        location=(0.0, 0.95, -plate_h * 0.95 - 1.15),
        dimensions=(10.0, 2.4, 0.35),
        material=mat_obsidian,
        rotation=(math.radians(6), 0.0, 0.0),
        bevel_width=0.04,
    )

    # 2. Orbital meridian rings + glowing radar comet arc (kept well behind glass plate)
    rings_pivot = bpy.data.objects.new("RIG-meridian_rings", None)
    rings_pivot.location = (0.0, 0.95, 0.06)
    bpy.context.collection.objects.link(rings_pivot)

    outer_ring = create_torus_ring(
        "GEO-meridian_outer",
        location=(0.0, 0.0, 0.0),
        major_radius=ring_r,
        minor_radius=0.018,
        material=mat_tungsten,
        rotation=(math.radians(86), math.radians(6), 0.0),
    )
    outer_ring.parent = rings_pivot

    inner_ring = create_torus_ring(
        "GEO-meridian_inner",
        location=(0.0, 0.0, 0.0),
        major_radius=ring_r * 0.80,
        minor_radius=0.012,
        material=mat_steel,
        rotation=(math.radians(95), math.radians(-7), 0.0),
    )
    inner_ring.parent = rings_pivot

    # 24 small machined index ticks around outer ring perimeter
    tick_parent = bpy.data.objects.new("RIG-tick_ring", None)
    tick_parent.location = (0.0, 0.95, 0.06)
    tick_parent.rotation_euler = (math.radians(-4), 0.0, 0.0)
    bpy.context.collection.objects.link(tick_parent)
    for k in range(24):
        ang = (2.0 * math.pi * k) / 24.0
        tx = (ring_r * 0.90) * math.cos(ang)
        tz = (ring_r * 0.90) * math.sin(ang)
        tick = create_box(
            f"GEO-tick_{k:02d}",
            location=(tx, 0.0, tz),
            dimensions=(0.012, 0.025, 0.055 if k % 6 == 0 else 0.028),
            material=mat_steel if k % 6 == 0 else mat_tungsten,
            rotation=(0.0, -ang + math.pi / 2.0, 0.0),
            bevel_width=0.002,
            bevel_segments=2,
        )
        tick.parent = tick_parent

    accent_arc = create_arc_sweep(
        "GEO-accent_arc",
        center=(0.0, 0.91, 0.06),
        radius=ring_r * 0.92,
        start_deg=28.0,
        end_deg=132.0,
        tube_radius=0.014,
        material=mat_accent_arc,
    )

    # 3. Smoked-glass hero title backing tablet + metallic frame trim + crest diamond
    slab_group = bpy.data.objects.new("RIG-hero_slab", None)
    slab_group.location = (0.0, 0.18, 0.0)
    bpy.context.collection.objects.link(slab_group)

    backing_slab = create_box(
        "GEO-glass_backing",
        location=(0.0, 0.0, 0.0),
        dimensions=(plate_w, 0.08, plate_h),
        material=mat_glass,
        bevel_width=0.024,
    )
    backing_slab.parent = slab_group

    trim_frame = create_box(
        "GEO-steel_rim_frame",
        location=(0.0, 0.02, 0.0),
        dimensions=(plate_w + 0.05, 0.05, plate_h + 0.05),
        material=mat_tungsten,
        bevel_width=0.016,
    )
    trim_frame.parent = slab_group

    # Twin horizontal luminous accent sweep bars (top and bottom of smoked glass plate)
    top_sweep = create_box(
        "GEO-accent_bar_top",
        location=(0.0, -0.048, plate_h * 0.5 + 0.012),
        dimensions=(plate_w * 0.92, 0.024, 0.028),
        material=mat_accent,
        bevel_width=0.006,
        bevel_segments=2,
    )
    bottom_sweep = create_box(
        "GEO-accent_bar_bottom",
        location=(0.0, -0.048, -plate_h * 0.5 - 0.012),
        dimensions=(plate_w * 0.92, 0.024, 0.028),
        material=mat_accent,
        bevel_width=0.006,
        bevel_segments=2,
    )

    # Top broadcast diamond crest above the title plate
    crest_z = plate_h * 0.5 + 0.25
    crest_outer = create_box(
        "GEO-crest_outer",
        location=(0.0, 0.06, crest_z),
        dimensions=(0.18, 0.06, 0.18),
        material=mat_steel,
        rotation=(0.0, math.radians(45), 0.0),
        bevel_width=0.014,
    )
    crest_core = create_box(
        "GEO-crest_core",
        location=(0.0, 0.02, crest_z),
        dimensions=(0.085, 0.075, 0.085),
        material=mat_accent,
        rotation=(0.0, math.radians(45), 0.0),
        bevel_width=0.008,
    )

    # 4. Hero 3D Typography + Tagline
    title_text = args.title
    if is_portrait and "\n" not in title_text and title_text.strip() == "KÝ CHỦ ĐIỂM TIN":
        title_text = "KÝ CHỦ\nĐIỂM TIN"

    title_obj = create_text_3d(
        "TXT-hero_title",
        body=title_text,
        font_path=FONT_TITLE_DEFAULT,
        target_width=plate_w * (0.82 if is_portrait else 0.86),
        max_height=plate_h * (0.74 if is_portrait else 0.64),
        location=(0.0, -0.04, 0.0),
        extrude=0.058,
        bevel_depth=0.011,
        material=mat_title,
        space_character=1.05,
        space_line=0.85,
    )
    settled_title_z = title_obj.location.z

    tagline_z = -plate_h * 0.5 - 0.26
    tagline_obj = create_text_3d(
        "TXT-tagline",
        body=args.tagline,
        font_path=FONT_TAGLINE_DEFAULT,
        target_width=plate_w * (0.74 if is_portrait else 0.62),
        max_height=0.135,
        location=(0.0, -0.02, tagline_z),
        extrude=0.022,
        bevel_depth=0.004,
        material=mat_tagline,
        space_character=1.10,
        space_line=1.0,
    )
    settled_tag_z = tagline_obj.location.z

    # ---- Camera & Tracking ----
    cam_target = bpy.data.objects.new("CAM-target", None)
    cam_target.location = (0.0, 0.0, 0.02)
    bpy.context.collection.objects.link(cam_target)

    cam_data = bpy.data.cameras.new("StudioCamera")
    cam_data.sensor_fit = "HORIZONTAL"
    cam_data.sensor_width = 36.0
    cam_data.lens = 45.0
    cam_data.clip_start = 0.1
    cam_data.clip_end = 100.0
    cam_data.dof.use_dof = False

    cam_obj = bpy.data.objects.new("CAM-hero", cam_data)
    cam_obj.location = (-0.28, -6.25, 0.06)
    bpy.context.collection.objects.link(cam_obj)
    scene.camera = cam_obj

    track = cam_obj.constraints.new(type="TRACK_TO")
    track.target = cam_target
    track.track_axis = "TRACK_NEGATIVE_Z"
    track.up_axis = "UP_Y"

    # ---- Studio Lighting Rig ----
    # Front-top broad key strip so extruded ivory faces shine cleanly against obsidian glass
    key_light = add_area_light(
        "LGT-key_studio",
        location=(1.8, -4.6, 2.8),
        target=(0.0, 0.0, 0.0),
        energy=220.0,
        color=(1.0, 0.98, 0.94),
        size=4.2,
        size_y=2.0,
    )
    # Moving glint key sweep (animates subtly left-to-right across bevels during hold phase)
    scene.frame_set(1)
    key_light.location = (-1.6, -4.4, 2.6)
    key_light.keyframe_insert("location", frame=1)
    scene.frame_set(args.frames)
    key_light.location = (1.6, -4.6, 2.7)
    key_light.keyframe_insert("location", frame=args.frames)

    # Cool sapphire upper-left fill light for deep editorial slate depth
    add_area_light(
        "LGT-fill_sapphire",
        location=(-3.8, -3.5, 1.4),
        target=(0.0, 0.4, 0.0),
        energy=145.0,
        color=(0.45, 0.68, 1.0),
        size=5.0,
    )

    # Soft axial front beauty fill without casting a circular disk reflection onto the glass backing plate
    front_light = add_area_light(
        "LGT-front_clarity",
        location=(0.0, -5.2, -0.4),
        target=(0.0, 0.0, 0.0),
        energy=65.0,
        color=(0.94, 0.96, 1.0),
        size=4.5,
    )
    if hasattr(front_light.data, "specular_factor"):
        front_light.data.specular_factor = 0.0
    if hasattr(front_light, "visible_glossy"):
        front_light.visible_glossy = False

    # Accent rim lights grazing studio flanks & steel rings without washing out to pink
    add_area_light(
        "LGT-rim_accent_left",
        location=(-3.2, 0.25, 0.4),
        target=(0.0, 0.2, 0.0),
        energy=110.0,
        color=palette["rim"],
        size=2.2,
        size_y=5.5,
    )
    add_area_light(
        "LGT-rim_accent_right",
        location=(3.2, 0.35, -0.4),
        target=(0.0, 0.2, 0.0),
        energy=95.0,
        color=palette["rim"],
        size=2.2,
        size_y=5.5,
    )

    # ---- Choreography & Keyframes ----
    f_end = args.frames
    f_open = max(24, int(round(f_end * 0.32)))
    f_settle = max(36, int(round(f_end * 0.44)))

    # Camera smooth push-in (fast mechanical settle -> steady atmospheric drift)
    cam_keys = [
        (1, (-0.28, -6.25, 0.06)),
        (f_open, (-0.04, -5.12, 0.02)),
        (f_end, (0.04, -4.88, 0.0)),
    ]
    for fr, loc in cam_keys:
        scene.frame_set(fr)
        cam_obj.location = loc
        cam_obj.keyframe_insert("location", frame=fr)
    set_key_ease_out(cam_obj, "location")

    # Smoked glass plate reveal
    for fr, sx in [(1, 0.08), (f_open - 4, 1.0), (f_end, 1.0)]:
        scene.frame_set(fr)
        slab_group.scale = (sx, 1.0, 1.0)
        slab_group.keyframe_insert("scale", frame=fr)
    set_key_ease_out(slab_group, "scale")

    # Luminous accent sweeps extend outward
    for bar in (top_sweep, bottom_sweep):
        for fr, sx in [(2, 0.0), (f_open, 1.0), (f_end, 1.0)]:
            scene.frame_set(fr)
            bar.scale = (sx, 1.0, 1.0)
            bar.keyframe_insert("scale", frame=fr)
        set_key_ease_out(bar, "scale")

    # Hero title 3D entrance (pull forward cleanly in front of smoked glass + settle tilt)
    hero_base_scale = tuple(title_obj.scale)
    scene.frame_set(1)
    title_obj.location = (0.0, 0.06, settled_title_z)
    title_obj.rotation_euler = (math.radians(76), 0.0, 0.0)
    title_obj.scale = tuple(s * 0.72 for s in hero_base_scale)
    title_obj.keyframe_insert("location", frame=1)
    title_obj.keyframe_insert("rotation_euler", frame=1)
    title_obj.keyframe_insert("scale", frame=1)

    scene.frame_set(f_open + 4)
    title_obj.location = (0.0, -0.04, settled_title_z)
    title_obj.rotation_euler = (math.radians(90), 0.0, 0.0)
    title_obj.scale = hero_base_scale
    title_obj.keyframe_insert("location", frame=f_open + 4)
    title_obj.keyframe_insert("rotation_euler", frame=f_open + 4)
    title_obj.keyframe_insert("scale", frame=f_open + 4)

    for dp in ("location", "rotation_euler", "scale"):
        set_key_ease_out(title_obj, dp)

    # Tagline delayed slide-up + scale settle
    tag_base_scale = tuple(tagline_obj.scale)
    f_tag_in = max(12, int(round(f_end * 0.16)))
    scene.frame_set(f_tag_in)
    tagline_obj.location = (0.0, 0.18, settled_tag_z - 0.10)
    tagline_obj.scale = tuple(s * 0.02 for s in tag_base_scale)
    tagline_obj.keyframe_insert("location", frame=f_tag_in)
    tagline_obj.keyframe_insert("scale", frame=f_tag_in)

    scene.frame_set(f_settle)
    tagline_obj.location = (0.0, -0.02, settled_tag_z)
    tagline_obj.scale = tag_base_scale
    tagline_obj.keyframe_insert("location", frame=f_settle)
    tagline_obj.keyframe_insert("scale", frame=f_settle)
    for dp in ("location", "scale"):
        set_key_ease_out(tagline_obj, dp)

    # Crest subtle rotation & scale pop
    for obj, end_ang in [(crest_outer, math.radians(45)), (crest_core, math.radians(-135))]:
        scene.frame_set(1)
        obj.scale = (0.05, 0.05, 0.05)
        obj.keyframe_insert("scale", frame=1)
        scene.frame_set(f_open)
        obj.scale = (1.0, 1.0, 1.0)
        obj.keyframe_insert("scale", frame=f_open)
        scene.frame_set(f_end)
        obj.rotation_euler = (0.0, end_ang, 0.0)
        obj.keyframe_insert("rotation_euler", frame=f_end)
        set_key_ease_out(obj, "scale")

    # Continuous smooth meridian ring rotation (kept behind glass backing plate) + upper-arc comet sweep
    scene.frame_set(1)
    outer_ring.rotation_euler = (math.radians(86), math.radians(6), 0.0)
    inner_ring.rotation_euler = (math.radians(95), math.radians(-7), 0.0)
    tick_parent.rotation_euler = (math.radians(-4), 0.0, 0.0)
    accent_arc.rotation_euler = (0.0, math.radians(-18), 0.0)
    for obj in (outer_ring, inner_ring, tick_parent, accent_arc):
        obj.keyframe_insert("rotation_euler", frame=1)

    scene.frame_set(f_end)
    outer_ring.rotation_euler = (math.radians(92), math.radians(-6), math.radians(20))
    inner_ring.rotation_euler = (math.radians(87), math.radians(7), math.radians(-24))
    tick_parent.rotation_euler = (math.radians(-4), math.radians(18), 0.0)
    accent_arc.rotation_euler = (0.0, math.radians(22), 0.0)
    for obj in (outer_ring, inner_ring, tick_parent, accent_arc):
        obj.keyframe_insert("rotation_euler", frame=f_end)

    scene.frame_set(1)


def render_and_encode(args: argparse.Namespace) -> None:
    out_mp4 = Path(args.out).resolve()
    out_mp4.parent.mkdir(parents=True, exist_ok=True)

    if args.blend:
        blend_path = Path(args.blend).resolve()
        blend_path.parent.mkdir(parents=True, exist_ok=True)
        bpy.ops.wm.save_as_mainfile(filepath=str(blend_path))
        print(f"[build_kcdt_bumper] saved blend -> {blend_path}")

    frames_dir = out_mp4.parent / f"._{out_mp4.stem}_frames"
    if frames_dir.exists():
        shutil.rmtree(frames_dir)
    frames_dir.mkdir(parents=True, exist_ok=True)

    scene = bpy.context.scene
    scene.render.image_settings.file_format = "PNG"
    scene.render.image_settings.color_mode = "RGB"
    scene.render.image_settings.color_depth = "8"
    scene.render.filepath = str(frames_dir / "frame_")

    bpy.ops.render.render(animation=True)

    ffmpeg_cmd = [
        "ffmpeg",
        "-y",
        "-framerate",
        str(args.fps),
        "-i",
        str(frames_dir / "frame_%04d.png"),
        "-c:v",
        "libx264",
        "-preset",
        "medium",
        "-crf",
        "18",
        "-pix_fmt",
        "yuv420p",
        "-movflags",
        "+faststart",
        str(out_mp4),
    ]
    proc = subprocess.run(ffmpeg_cmd, capture_output=True, text=True)
    if proc.returncode != 0:
        raise RuntimeError(f"ffmpeg failed ({proc.returncode}):\n{proc.stderr}")

    if not args.keep_frames:
        shutil.rmtree(frames_dir, ignore_errors=True)

    print(f"[build_kcdt_bumper] rendered MP4 -> {out_mp4}")


def parse_args() -> argparse.Namespace:
    if "--" in sys.argv:
        cli_args = sys.argv[sys.argv.index("--") + 1 :]
    else:
        cli_args = sys.argv[1:]

    parser = argparse.ArgumentParser(description="Build reusable Ký Chủ Điểm Tin 3D brand bumper.")
    parser.add_argument("--aspect", choices=["9x16", "16x9"], default="9x16")
    parser.add_argument("--out", required=True, help="Output MP4 path.")
    parser.add_argument("--blend", default=None, help="Optional .blend output path.")
    parser.add_argument("--accent", choices=sorted(ACCENT_PALETTES), default="crimson")
    parser.add_argument("--title", default="KÝ CHỦ ĐIỂM TIN")
    parser.add_argument("--tagline", default="BẢN TIN PHÂN TÍCH · ĐA CHIỀU")
    parser.add_argument("--samples", type=int, default=32)
    parser.add_argument("--frames", type=int, default=90)
    parser.add_argument("--fps", type=int, default=30)
    parser.add_argument("--keep-frames", action="store_true")
    return parser.parse_args(cli_args)


def main() -> None:
    args = parse_args()
    build_bumper_scene(args)
    render_and_encode(args)


if __name__ == "__main__":
    main()
