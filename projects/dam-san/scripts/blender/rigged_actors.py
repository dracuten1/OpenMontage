#!/usr/bin/env python3
"""Articulated Blender 5.2 character rigs, reusable animation cycles, fast EEVEE setup, and 3D-to-2D screen tracking."""
from __future__ import annotations

import json
import math
from pathlib import Path

import bpy
import bpy_extras.anim_utils as anim_utils
from bpy_extras.object_utils import world_to_camera_view
from mathutils import Euler, Vector

from common_blender import (
    add_box,
    add_cone,
    add_cylinder,
    add_diorama_plinth,
    add_lighting_rig,
    add_sphere,
    add_torus,
    aim_at,
    assign_mat,
    build_palette,
    clear_scene,
    make_noise_material,
    set_input,
    setup_world,
)


def make_alpha_glow_material(name: str, rgba: tuple[float, float, float, float], emission_strength: float = 1.5):
    if name in bpy.data.materials:
        return bpy.data.materials[name]
    mat = bpy.data.materials.new(name)
    mat.use_nodes = True
    bsdf = mat.node_tree.nodes["Principled BSDF"]
    set_input(bsdf, "Base Color", rgba)
    set_input(bsdf, "Alpha", rgba[3])
    set_input(bsdf, "Roughness", 0.5)
    set_input(bsdf, "Emission Color", rgba)
    set_input(bsdf, "Emission Strength", emission_strength)
    return mat


def build_anim_palette() -> dict[str, bpy.types.Material]:
    """Extend base Central Highlands diorama palette with character expression & VFX materials."""
    pal = build_palette()
    pal["eye_white"] = make_noise_material("MAT-eye_white", (0.95, 0.94, 0.92), roughness=0.22, bump_strength=0.0, color_var=0.02)
    pal["eye_dark"] = make_noise_material("MAT-eye_dark", (0.03, 0.025, 0.025), roughness=0.12, coat_weight=0.7, bump_strength=0.0, color_var=0.02)
    pal["skin_warm"] = make_noise_material("MAT-skin_warm", (0.46, 0.25, 0.14), roughness=0.52, sss_weight=0.2, bump_strength=0.06, noise_scale=28.0)
    pal["skin_elder"] = make_noise_material("MAT-skin_elder", (0.38, 0.23, 0.15), roughness=0.58, sss_weight=0.15, bump_strength=0.10, noise_scale=30.0)
    pal["indigo_cloth"] = make_noise_material("MAT-indigo_cloth", (0.08, 0.10, 0.19), roughness=0.78, bump_strength=0.22, noise_scale=60.0)
    pal["hair_dark"] = make_noise_material("MAT-hair_dark", (0.04, 0.035, 0.03), roughness=0.45, bump_strength=0.14, noise_scale=48.0)
    pal["spark_gold"] = make_noise_material("MAT-spark_gold", (1.0, 0.72, 0.18), roughness=0.2, emission_rgb=(1.0, 0.58, 0.10), emission_strength=9.0, bump_strength=0.0)
    pal["dust_warm"] = make_alpha_glow_material("MAT-dust_warm", (0.76, 0.58, 0.40, 0.42), emission_strength=0.45)
    pal["yang_beam"] = make_alpha_glow_material("MAT-yang_beam", (1.0, 0.84, 0.36, 0.20), emission_strength=2.4)
    pal["gong_ring"] = make_alpha_glow_material("MAT-gong_ring", (1.0, 0.78, 0.24, 0.55), emission_strength=4.0)
    return pal


def setup_eevee_fast(samples: int = 12, frame_end: int = 240, width: int = 1920, height: int = 1080) -> None:
    """Fast one-way narrative animation EEVEE setup (~0.25-0.45s/frame at 1080p)."""
    scene = bpy.context.scene
    scene.render.engine = "BLENDER_EEVEE"
    scene.eevee.taa_render_samples = samples
    scene.eevee.use_raytracing = False

    scene.render.resolution_x = width
    scene.render.resolution_y = height
    scene.render.resolution_percentage = 100
    scene.render.fps = 24
    scene.frame_start = 1
    scene.frame_end = frame_end
    scene.render.image_settings.file_format = "JPEG"
    scene.render.image_settings.quality = 95
    try:
        scene.view_settings.view_transform = "AgX"
        scene.view_settings.look = "AgX - Medium High Contrast"
    except Exception:
        scene.view_settings.view_transform = "Standard"
    scene.view_settings.exposure = 0.22


def set_interp(owner, interp: str = "BEZIER", handle: str = "AUTO_CLAMPED") -> None:
    """Apply FCurve interpolation via Blender 5.2 channelbag API."""
    ad = getattr(owner, "animation_data", None)
    if not ad or not ad.action:
        return
    fcurves = []
    if hasattr(ad.action, "fcurves"):
        fcurves = list(ad.action.fcurves)
    elif hasattr(ad, "action_slot") and ad.action_slot is not None:
        cb = anim_utils.action_get_channelbag_for_slot(ad.action, ad.action_slot)
        if cb is not None:
            fcurves = list(cb.fcurves)
    for fc in fcurves:
        for kp in fc.keyframe_points:
            kp.interpolation = interp
            if interp == "BEZIER":
                kp.handle_left_type = handle
                kp.handle_right_type = handle


def _make_empty(name: str, loc=(0, 0, 0), rot=(0, 0, 0), parent=None) -> bpy.types.Object:
    e = bpy.data.objects.new(name, None)
    e.empty_display_type = "PLAIN_AXES"
    e.empty_display_size = 0.12
    bpy.context.collection.objects.link(e)
    e.location = Vector(loc)
    e.rotation_euler = Euler(rot, "XYZ")
    if parent is not None:
        e.parent = parent
    return e


def _attach(obj: bpy.types.Object, parent: bpy.types.Object) -> bpy.types.Object:
    obj.parent = parent
    return obj


def create_articulated_actor(
    name: str,
    loc: tuple[float, float, float],
    rot_z: float,
    pal: dict[str, bpy.types.Material],
    *,
    role: str = "damsan",
    armed: bool = True,
) -> dict[str, bpy.types.Object]:
    """Build articulated figurine facing -Y in local space (R_z(rot_z) faces (sin(rot_z), -cos(rot_z)))."""
    skin_m = pal["skin_elder"] if role == "elder" else pal["skin_warm"]
    if role == "mtaomxay":
        torso_m = pal["iron_armor"]
        skirt_m = pal["basalt"]
        headband_m = pal["iron_armor"]
        shield_m = pal["iron_armor"]
        spear_m = pal["iron_armor"]
    elif role == "woman":
        torso_m = pal["indigo_cloth"]
        skirt_m = pal["brocade_red"]
        headband_m = pal["brocade_red"]
        shield_m = pal["bronze_gong"]
        spear_m = pal["bronze_gong"]
    elif role == "elder":
        torso_m = pal["indigo_cloth"]
        skirt_m = pal["indigo_cloth"]
        headband_m = pal["brocade_red"]
        shield_m = pal["bronze_gong"]
        spear_m = pal["bronze_gong"]
    else:  # damsan
        torso_m = pal["skin_warm"]
        skirt_m = pal["brocade_red"]
        headband_m = pal["brocade_red"]
        shield_m = pal["bronze_gong"]
        spear_m = pal["bronze_gong"]

    root = _make_empty(f"ACT-{name}-root", loc=loc, rot=(0, 0, rot_z))
    pelvis = _make_empty(f"ACT-{name}-pelvis", loc=(0, 0, 0.50), parent=root)

    # Hip pivots + legs extending straight down along -Z
    hipL = _make_empty(f"ACT-{name}-hipL", loc=(-0.10, 0, -0.02), parent=pelvis)
    _attach(add_cylinder(f"GEO-{name}-legL", (0, 0, -0.22), (0.072, 0.072, 0.44), mat=skin_m), hipL)
    _attach(add_sphere(f"GEO-{name}-footL", (0, -0.03, -0.44), (0.078, 0.11, 0.05), mat=pal["ironwood"]), hipL)

    hipR = _make_empty(f"ACT-{name}-hipR", loc=(0.10, 0, -0.02), parent=pelvis)
    _attach(add_cylinder(f"GEO-{name}-legR", (0, 0, -0.22), (0.072, 0.072, 0.44), mat=skin_m), hipR)
    _attach(add_sphere(f"GEO-{name}-footR", (0, -0.03, -0.44), (0.078, 0.11, 0.05), mat=pal["ironwood"]), hipR)

    # Torso pivot at waist
    torso = _make_empty(f"ACT-{name}-torso", loc=(0, 0, 0.02), parent=pelvis)
    skirt_z = 0.24 if role != "woman" else 0.34
    _attach(add_cylinder(f"GEO-{name}-waist", (0, 0, 0.04), (0.18, 0.14, skirt_z), mat=skirt_m), torso)
    _attach(add_cylinder(f"GEO-{name}-chest", (0, 0, 0.27), (0.21, 0.15, 0.38), mat=torso_m), torso)
    if role == "damsan":
        _attach(add_cylinder(f"GEO-{name}-sash", (0, 0, 0.28), (0.218, 0.156, 0.12), mat=pal["brocade_red"]), torso)
    elif role == "mtaomxay":
        _attach(add_box(f"GEO-{name}-cuirass", (0, -0.01, 0.29), (0.44, 0.33, 0.28), mat=pal["iron_armor"], bevel=0.04), torso)
    elif role == "woman":
        _attach(add_cylinder(f"GEO-{name}-shawl", (0, 0, 0.30), (0.218, 0.156, 0.11), mat=pal["brocade_red"]), torso)

    # Head pivot + face (-Y forward) + blinking eyelids + hair/helmet
    head = _make_empty(f"ACT-{name}-head", loc=(0, 0, 0.50), parent=torso)
    _attach(add_sphere(f"GEO-{name}-head", (0, 0, 0.13), (0.165, 0.16, 0.17), mat=skin_m), head)
    _attach(add_cylinder(f"GEO-{name}-band", (0, 0, 0.18), (0.175, 0.17, 0.06), mat=headband_m), head)
    if role == "woman":
        _attach(add_sphere(f"GEO-{name}-hairbun", (0, 0.14, 0.19), (0.09, 0.09, 0.09), mat=pal["hair_dark"]), head)
    elif role == "mtaomxay":
        _attach(add_cone(f"GEO-{name}-crest", (0, 0.02, 0.31), r1=0.07, r2=0.01, depth=0.16, mat=pal["iron_armor"]), head)

    # Eyes on -Y front face
    _attach(add_sphere(f"GEO-{name}-eyeWL", (-0.065, -0.142, 0.135), (0.034, 0.022, 0.036), mat=pal["eye_white"], segs=12), head)
    _attach(add_sphere(f"GEO-{name}-eyeWR", (0.065, -0.142, 0.135), (0.034, 0.022, 0.036), mat=pal["eye_white"], segs=12), head)
    _attach(add_sphere(f"GEO-{name}-pupilL", (-0.065, -0.156, 0.135), (0.020, 0.015, 0.022), mat=pal["eye_dark"], segs=12), head)
    _attach(add_sphere(f"GEO-{name}-pupilR", (0.065, -0.156, 0.135), (0.020, 0.015, 0.022), mat=pal["eye_dark"], segs=12), head)

    lidL = _make_empty(f"ACT-{name}-lidL", loc=(-0.065, -0.145, 0.165), parent=head)
    _attach(add_box(f"GEO-{name}-lidL", (0, 0, -0.015), (0.072, 0.045, 0.065), mat=skin_m, bevel=0.006), lidL)
    lidL.scale = (1.0, 1.0, 0.08)

    lidR = _make_empty(f"ACT-{name}-lidR", loc=(0.065, -0.145, 0.165), parent=head)
    _attach(add_box(f"GEO-{name}-lidR", (0, 0, -0.015), (0.072, 0.045, 0.065), mat=skin_m, bevel=0.006), lidR)
    lidR.scale = (1.0, 1.0, 0.08)

    # Left & right shoulder pivots (arms hang downward -Z so -rot_x swings arm FORWARD -Y!)
    arm_m = torso_m if role == "mtaomxay" else skin_m
    shoulderL = _make_empty(f"ACT-{name}-shoulderL", loc=(-0.25, 0, 0.39), parent=torso)
    _attach(add_cylinder(f"GEO-{name}-armL", (0, 0, -0.17), (0.055, 0.055, 0.34), mat=arm_m), shoulderL)
    _attach(add_sphere(f"GEO-{name}-handL", (0, 0, -0.35), (0.060, 0.060, 0.060), mat=skin_m, segs=12), shoulderL)

    shield_grp = None
    if armed and role in {"damsan", "mtaomxay"}:
        shield_grp = _make_empty(f"ACT-{name}-shieldGrp", loc=(-0.06, -0.06, -0.26), rot=(0, math.radians(-80), 0), parent=shoulderL)
        _attach(add_cylinder(f"GEO-{name}-shield", (0, 0, 0), (0.30, 0.30, 0.04), rot=(math.radians(90), 0, 0), mat=shield_m), shield_grp)
        _attach(add_sphere(f"GEO-{name}-shieldBoss", (0, -0.03, 0), (0.08, 0.08, 0.08), mat=pal["copper"]), shield_grp)

    shoulderR = _make_empty(f"ACT-{name}-shoulderR", loc=(0.25, 0, 0.39), parent=torso)
    _attach(add_cylinder(f"GEO-{name}-armR", (0, 0, -0.17), (0.055, 0.055, 0.34), mat=arm_m), shoulderR)
    _attach(add_sphere(f"GEO-{name}-handR", (0, 0, -0.35), (0.060, 0.060, 0.060), mat=skin_m, segs=12), shoulderR)

    spear_pivot = None
    if armed and role in {"damsan", "mtaomxay"}:
        # Spear centered vertically in hand at z=-0.35, tilted slightly forward
        spear_pivot = _make_empty(f"ACT-{name}-spear", loc=(0.02, -0.02, -0.35), rot=(math.radians(-18), 0, 0), parent=shoulderR)
        _attach(add_cylinder(f"GEO-{name}-shaft", (0, 0, 0.25), (0.022, 0.022, 1.55), mat=pal["ironwood"]), spear_pivot)
        _attach(add_cone(f"GEO-{name}-spearTip", (0, 0, 1.11), r1=0.055, r2=0.002, depth=0.28, mat=spear_m), spear_pivot)

    label_anchor = _make_empty(f"TRK-{name}", loc=(0, 0, 1.44), parent=pelvis)
    label_anchor.location = (0, 0, 0.94)  # relative to pelvis z=0.50 -> world +1.44

    return {
        "root": root,
        "pelvis": pelvis,
        "hipL": hipL,
        "hipR": hipR,
        "torso": torso,
        "head": head,
        "lidL": lidL,
        "lidR": lidR,
        "shoulderL": shoulderL,
        "shoulderR": shoulderR,
        "shield_grp": shield_grp,
        "spear_pivot": spear_pivot,
        "label_anchor": label_anchor,
    }


def anim_blink(actor: dict[str, bpy.types.Object], frames: list[int]) -> None:
    """Insert crisp 4-frame eye blinks."""
    for lid_key in ("lidL", "lidR"):
        lid = actor[lid_key]
        for f in frames:
            lid.scale = (1.0, 1.0, 0.08)
            lid.keyframe_insert("scale", frame=f)
            lid.scale = (1.0, 1.0, 1.15)
            lid.keyframe_insert("scale", frame=f + 2)
            lid.scale = (1.0, 1.0, 0.08)
            lid.keyframe_insert("scale", frame=f + 4)
        set_interp(lid, "LINEAR")


def anim_walk(
    actor: dict[str, bpy.types.Object],
    f0: int,
    f1: int,
    p0: tuple[float, float, float],
    p1: tuple[float, float, float],
    *,
    stride_frames: int = 12,
    swing: float = 0.52,
    lift: float = 0.05,
) -> None:
    """Walk cycle between world positions p0 -> p1 with opposite hip/shoulder swing and pelvis bounce."""
    root = actor["root"]
    root.location = Vector(p0)
    root.keyframe_insert("location", frame=f0)
    root.location = Vector(p1)
    root.keyframe_insert("location", frame=f1)
    set_interp(root, "BEZIER")

    hipL, hipR = actor["hipL"], actor["hipR"]
    shL, shR = actor["shoulderL"], actor["shoulderR"]
    pelvis = actor["pelvis"]

    step = max(3, stride_frames // 2)
    phase = 1
    f = f0
    while f < f1:
        a = phase * swing
        hipL.rotation_euler.x = -a
        hipR.rotation_euler.x = a
        shL.rotation_euler.x = a * 0.7
        shR.rotation_euler.x = -a * 0.7 if actor["spear_pivot"] is None else -0.25 - a * 0.25
        pelvis.location.z = 0.50 + lift
        for obj in (hipL, hipR, shL, shR):
            obj.keyframe_insert("rotation_euler", frame=f)
        pelvis.keyframe_insert("location", frame=f)

        mid_f = min(f1, f + step // 2)
        if mid_f > f:
            pelvis.location.z = 0.485
            pelvis.keyframe_insert("location", frame=mid_f)

        phase *= -1
        f += step

    # Settle neutral at end of walk
    for obj in (hipL, hipR, shL):
        obj.rotation_euler.x = 0.0
        obj.keyframe_insert("rotation_euler", frame=f1)
    shR.rotation_euler.x = 0.0 if actor["spear_pivot"] is None else -0.20
    shR.keyframe_insert("rotation_euler", frame=f1)
    pelvis.location.z = 0.50
    pelvis.keyframe_insert("location", frame=f1)
    for obj in (hipL, hipR, shL, shR, pelvis):
        set_interp(obj, "BEZIER")


def anim_sit_talk(
    actor: dict[str, bpy.types.Object],
    f0: int,
    f1: int,
    *,
    seat_pelvis_z: float = 0.30,
    nod_amp: float = 0.14,
) -> None:
    """Pose actor seated (legs -Y forward) with expressive storytelling nods and arm gestures."""
    hipL, hipR = actor["hipL"], actor["hipR"]
    pelvis = actor["pelvis"]
    torso = actor["torso"]
    head = actor["head"]
    shR, shL = actor["shoulderR"], actor["shoulderL"]

    hipL.rotation_euler.x = -1.35
    hipR.rotation_euler.x = -1.35
    hipL.keyframe_insert("rotation_euler", frame=f0)
    hipR.keyframe_insert("rotation_euler", frame=f0)
    pelvis.location.z = seat_pelvis_z
    pelvis.keyframe_insert("location", frame=f0)

    f = f0
    sign = 1
    while f <= f1:
        head.rotation_euler = (0.08 * sign, 0.04 * sign, nod_amp * sign)
        torso.rotation_euler = (-0.06, 0.04 * sign, 0.0)
        shR.rotation_euler = (-0.75 - 0.25 * max(0, sign), -0.15, 0.0)
        shL.rotation_euler = (-0.55 - 0.18 * max(0, -sign), 0.12, 0.0)
        for obj in (head, torso, shR, shL):
            obj.keyframe_insert("rotation_euler", frame=f)
        sign *= -1
        f += 16

    for obj in (hipL, hipR, pelvis, torso, head, shR, shL):
        set_interp(obj, "BEZIER")


def export_screen_tracks(
    scene: bpy.types.Scene,
    cam_obj: bpy.types.Object,
    anchors: dict[str, bpy.types.Object],
    f_start: int,
    f_end: int,
    out_json: Path,
) -> None:
    """Bake 3D-to-2D 1920x1080 screen coordinates per frame (same schema as yedda-team-journey)."""
    w = scene.render.resolution_x
    h = scene.render.resolution_y
    tracks: dict[str, dict[str, dict[str, float | bool]]] = {}
    depsgraph = bpy.context.evaluated_depsgraph_get()
    for f in range(f_start, f_end + 1):
        scene.frame_set(f)
        depsgraph.update()
        cam_eval = cam_obj.evaluated_get(depsgraph)
        row: dict[str, dict[str, float | bool]] = {}
        for key, obj in anchors.items():
            obj_eval = obj.evaluated_get(depsgraph)
            co = world_to_camera_view(scene, cam_eval, obj_eval.matrix_world.translation)
            visible = bool(co.z > 0.0 and -0.05 <= co.x <= 1.05 and -0.05 <= co.y <= 1.05)
            row[key] = {
                "x": round(float(co.x * w), 1),
                "y": round(float((1.0 - co.y) * h), 1),
                "v": visible,
            }
        tracks[str(f)] = row
    out_json.parent.mkdir(parents=True, exist_ok=True)
    out_json.write_text(json.dumps(tracks), encoding="utf-8")
    print(f"EXPORTED 3D screen tracks ({f_end - f_start + 1} frames, {len(anchors)} anchors) -> {out_json}")
