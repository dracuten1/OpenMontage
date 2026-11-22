#!/usr/bin/env python3
"""Build & render Animated Demo Scene 1: Nhà Dài Ê Đê Nhấc Mái & Nối Dài (240f @ 24fps = 10s)."""
from __future__ import annotations

import json
import math
import shutil
import subprocess
import sys
import time
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent))
import bpy  # noqa: E402
from mathutils import Euler, Vector  # noqa: E402

from blenderkit_lib import append_normalized, search_and_download  # noqa: E402
from common_blender import (  # noqa: E402
    add_box,
    add_cylinder,
    add_diorama_plinth,
    add_lighting_rig,
    add_sphere,
    add_torus,
    clear_scene,
    setup_world,
)
from rigged_actors import (  # noqa: E402
    anim_blink,
    anim_sit_talk,
    anim_walk,
    build_anim_palette,
    create_articulated_actor,
    export_screen_tracks,
    set_interp,
    setup_eevee_fast,
)

OM = Path("/Users/tuyennguyen/project/OpenMontage")
OUT_BLEND = OM / "projects" / "dam-san" / "assets" / "blender_anim" / "anim_b3d02_longhouse.blend"
OUT_TRACKS = OM / "remotion-composer" / "src" / "dam-san" / "screen_tracks_longhouse.json"
OUT_MP4 = OM / "remotion-composer" / "public" / "dam-san" / "anim_demo" / "anim_b3d02_longhouse.mp4"
TMP_FRAMES = OM / "projects" / "dam-san" / "tmp_anim" / "longhouse"


def _make_empty(name: str, loc=(0, 0, 0), rot=(0, 0, 0), parent=None) -> bpy.types.Object:
    e = bpy.data.objects.new(name, None)
    bpy.context.collection.objects.link(e)
    e.location = Vector(loc)
    e.rotation_euler = Euler(rot, "XYZ")
    if parent is not None:
        e.parent = parent
    return e


def _attach(obj: bpy.types.Object, parent: bpy.types.Object) -> bpy.types.Object:
    obj.parent = parent
    return obj


def build_and_render(samples: int = 12, dry_run: bool = False) -> None:
    clear_scene()
    setup_eevee_fast(samples=samples, frame_end=240)
    setup_world((0.038, 0.030, 0.024), strength=0.52)
    pal = build_anim_palette()
    add_diorama_plinth(pal, radius=6.4)

    # 1. Foundation pilings & main boat-shaped platform (floor top z = 0.95)
    for row_x in (-1.25, 1.25):
        for idx, py in enumerate([-3.2, -2.1, -1.0, 0.1, 1.2, 2.3, 3.4]):
            add_cylinder(f"GEO-piling-{row_x}-{idx}", (row_x, py, 0.45), (0.11, 0.11, 0.85), mat=pal["ironwood"], verts=16)

    add_box("GEO-floor-main", (0.0, 0.1, 0.88), (2.9, 7.2, 0.14), mat=pal["teak_carved"], bevel=0.02)
    add_box("GEO-dring-gah-railing-L", (-1.40, -2.55, 1.15), (0.08, 1.7, 0.42), mat=pal["ironwood"])
    add_box("GEO-dring-gah-railing-R", (1.40, -2.55, 1.15), (0.08, 1.7, 0.42), mat=pal["ironwood"])

    # Boat outward-leaning left wall + interior Gah/Ok partition
    add_box("GEO-wall-L", (-1.52, 0.7, 1.75), (0.10, 5.4, 1.68), rot=(0, math.radians(-11), 0), mat=pal["ironwood"], bevel=0.015)
    add_box("GEO-partition-Gah-Ok", (-0.15, 1.65, 1.75), (2.4, 0.08, 1.65), mat=pal["teak_carved"], bevel=0.01)

    # Full left thatched roof + main ridge beam + rear gable
    add_box("GEO-roof-L", (-0.82, 0.7, 3.15), (2.15, 6.4, 0.14), rot=(0, math.radians(-42), 0), mat=pal["thatch"], bevel=0.03)
    add_box("GEO-roof-ridge", (0.0, 0.7, 3.85), (0.24, 6.7, 0.24), mat=pal["ironwood"], bevel=0.02)

    # Animated back wall sliding from y=3.4 -> y=5.65 when extension opens (f=166..212)
    wall_back = add_box("GEO-wall-back", (0.0, 3.4, 1.75), (2.8, 0.10, 1.65), mat=pal["ironwood"], bevel=0.015)
    for f, wy in [(1, 3.4), (166, 3.4), (212, 5.65), (240, 5.65)]:
        wall_back.location.y = wy
        wall_back.keyframe_insert("location", frame=f)
    set_interp(wall_back, "BEZIER")

    # Twin staircases on front Dring gah (female left w/ carved breasts + crescent moon, male right)
    for st_name, sx in [("stair-female", -0.65), ("stair-male", 0.65)]:
        add_box(f"GEO-{st_name}-plank", (sx, -3.72, 0.45), (0.42, 1.48, 0.10), rot=(math.radians(38), 0, 0), mat=pal["teak_carved"], bevel=0.015)
        for step_i in range(7):
            frac = (step_i + 0.5) / 7.0
            sy = -4.25 + frac * 1.05
            sz = 0.08 + frac * 0.80
            add_box(f"GEO-{st_name}-step-{step_i}", (sx, sy, sz), (0.44, 0.12, 0.06), mat=pal["ironwood"], bevel=0.008)
        add_box(f"GEO-{st_name}-post", (sx, -3.22, 1.05), (0.28, 0.10, 0.44), mat=pal["teak_carved"], bevel=0.015)
        add_cylinder(f"GEO-{st_name}-crest", (sx, -3.22, 1.24), (0.17, 0.17, 0.09), rot=(math.radians(90), 0, 0), mat=pal["teak_carved"])
        if st_name == "stair-female":
            add_sphere("GEO-stair-relief-L", (sx - 0.07, -3.27, 1.13), (0.065, 0.055, 0.065), mat=pal["teak_carved"])
            add_sphere("GEO-stair-relief-R", (sx + 0.07, -3.27, 1.13), (0.065, 0.055, 0.065), mat=pal["teak_carved"])
            add_torus("GEO-stair-crescent", (sx, -3.27, 1.30), major_r=0.11, minor_r=0.025, rot=(math.radians(90), 0, 0), mat=pal["bronze_gong"])

    # 2. Animated right roof & right cutaway wall (CLOSED f=1..54 -> LIFT OPEN f=55..100)
    piv_roof_r = _make_empty("Pivot-RoofR", loc=(0.0, 0.7, 3.85))
    _attach(add_box("GEO-roof-R-full", (0.82, 0.0, -0.70), (2.15, 6.4, 0.14), rot=(0, math.radians(42), 0), mat=pal["thatch"], bevel=0.03), piv_roof_r)
    for f, zoff, ry, sc in [
        (1, 3.85, 0.0, 1.0),
        (54, 3.85, 0.0, 1.0),
        (82, 5.75, math.radians(-14), 0.92),
        (100, 7.60, math.radians(-22), 0.01),
        (240, 7.60, math.radians(-22), 0.01),
    ]:
        piv_roof_r.location.z = zoff
        piv_roof_r.rotation_euler.y = ry
        piv_roof_r.scale = (sc, sc, sc)
        piv_roof_r.keyframe_insert("location", frame=f)
        piv_roof_r.keyframe_insert("rotation_euler", frame=f)
        piv_roof_r.keyframe_insert("scale", frame=f)
    set_interp(piv_roof_r, "BEZIER")

    piv_wall_r = _make_empty("Pivot-WallR", loc=(1.42, 0.7, 0.95))
    _attach(add_box("GEO-wall-R-anim", (0.05, 0.0, 0.80), (0.10, 5.4, 1.62), rot=(0, math.radians(10), 0), mat=pal["ironwood"], bevel=0.015), piv_wall_r)
    for f, sz in [(1, 1.0), (54, 1.0), (96, 0.24), (240, 0.24)]:
        piv_wall_r.scale = (1.0, 1.0, sz)
        piv_wall_r.keyframe_insert("scale", frame=f)
    set_interp(piv_wall_r, "BEZIER")

    # 3. Animated rear Matrilineal Extension Bay (hidden f=1..164 -> slides/grows out at rear y=3.4..5.65 f=166..215)
    piv_ext = _make_empty("Pivot-ExtBay", loc=(0.0, 3.4, 0.0))
    for rx in (-1.25, 1.25):
        for py in (1.1, 2.2):
            _attach(add_cylinder(f"GEO-ext-pil-{rx}-{py}", (rx, py, 0.45), (0.11, 0.11, 0.85), mat=pal["ironwood"], verts=16), piv_ext)
    _attach(add_box("GEO-ext-floor", (0.0, 1.15, 0.88), (2.9, 2.35, 0.14), mat=pal["teak_carved"], bevel=0.02), piv_ext)
    _attach(add_box("GEO-ext-wallL", (-1.52, 1.15, 1.75), (0.10, 2.30, 1.68), rot=(0, math.radians(-11), 0), mat=pal["ironwood"], bevel=0.015), piv_ext)
    _attach(add_box("GEO-ext-wallR", (1.45, 1.15, 1.14), (0.09, 2.30, 0.42), rot=(0, math.radians(10), 0), mat=pal["ironwood"], bevel=0.01), piv_ext)
    _attach(add_box("GEO-ext-roofL", (-0.82, 1.15, 3.15), (2.15, 2.40, 0.14), rot=(0, math.radians(-42), 0), mat=pal["thatch"], bevel=0.03), piv_ext)
    _attach(add_box("GEO-ext-ridge", (0.0, 1.15, 3.85), (0.24, 2.45, 0.24), mat=pal["ironwood"], bevel=0.02), piv_ext)

    for f, sy, py in [(1, 0.001, 3.35), (164, 0.001, 3.35), (198, 1.04, 3.42), (214, 1.0, 3.40), (240, 1.0, 3.40)]:
        piv_ext.scale = (1.0, sy, sy)
        piv_ext.location.y = py
        piv_ext.keyframe_insert("scale", frame=f)
        piv_ext.keyframe_insert("location", frame=f)
    set_interp(piv_ext, "BEZIER")

    # 4. Interior Gah furnishings + BlenderKit Ché jars, Campfire hearth & tropical foliage
    bk_campfire = search_and_download("campfire2", "3d scanned campfire")
    bk_jar = search_and_download("ceramic_jar", "ceramic jar")
    bk_tree = search_and_download("stylized_tree", "stylized tree")

    add_box("GEO-kpan-bench", (-0.85, -0.35, 1.08), (0.38, 2.75, 0.24), mat=pal["teak_carved"], bevel=0.03)
    add_box("GEO-hearth-box", (0.45, -0.25, 0.99), (0.68, 0.68, 0.12), mat=pal["red_soil"])
    append_normalized(bk_campfire, "HearthFire", target_max_dim=0.62, loc=(0.45, -0.25, 1.01))
    add_sphere("GEO-hearth-ember", (0.45, -0.25, 1.06), (0.14, 0.14, 0.05), mat=pal["hearth_ember"])
    for j in range(4):
        append_normalized(
            bk_jar,
            f"CheJar-{j}",
            target_height=0.38,
            loc=(-1.06, 0.52 + j * 0.28, 0.95),
            rot_z=j * 0.5,
            material_override=pal["ceramic_che"],
        )
    for g_i in range(3):
        add_cylinder(f"GEO-gah-gong-{g_i}", (-1.36, -1.1 + g_i * 0.45, 1.85), (0.20 - g_i * 0.02, 0.20 - g_i * 0.02, 0.05), rot=(0, math.radians(90), 0), mat=pal["bronze_gong"])

    for ti, (tx, ty, th, trz) in enumerate([
        (-4.35, -2.35, 3.6, 0.4),
        (-4.75, 1.85, 4.1, 1.8),
        (-3.25, 5.15, 3.8, 3.1),
    ]):
        append_normalized(bk_tree, f"Tree-LH-{ti}", target_height=th, loc=(tx, ty, 0.05), rot_z=trz)

    for ei in range(6):
        ang = ei * 1.1
        em = add_sphere(f"VFX-ember-{ei}", (0.45 + 0.08 * math.cos(ang), -0.25 + 0.08 * math.sin(ang), 1.10), (0.025, 0.025, 0.025), mat=pal["spark_gold"], segs=8)
        for rep in range(5):
            f0 = 1 + rep * 48 + ei * 6
            if f0 > 236:
                continue
            em.location = (0.45 + 0.10 * math.cos(ang + rep), -0.25 + 0.10 * math.sin(ang + rep), 1.08)
            em.scale = (0.02, 0.02, 0.02)
            em.keyframe_insert("location", frame=f0)
            em.keyframe_insert("scale", frame=f0)
            em.location = (0.45 + 0.12 * math.sin(ang + rep), -0.25 + 0.06 * math.cos(ang), 1.75)
            em.scale = (0.032, 0.032, 0.032)
            em.keyframe_insert("location", frame=min(240, f0 + 24))
            em.keyframe_insert("scale", frame=min(240, f0 + 24))
            em.scale = (0.001, 0.001, 0.001)
            em.keyframe_insert("scale", frame=min(240, f0 + 30))
        set_interp(em, "BEZIER")

    pt = bpy.data.lights.new("LGT-HearthGlow", type="POINT")
    pt.energy = 190
    pt.color = (1.0, 0.50, 0.15)
    pobj = bpy.data.objects.new("LGT-HearthGlow", pt)
    bpy.context.collection.objects.link(pobj)
    pobj.location = (0.45, -0.25, 1.45)
    for f in range(1, 241, 12):
        pt.energy = 185.0 + 45.0 * math.sin(f * 0.55)
        pt.keyframe_insert("energy", frame=f)
    set_interp(pt, "BEZIER")

    # 5. Articulated Living Actors:
    # Groom (Dam San without armor) climbs stairs f=1..55 -> crosses Dring Gah f=56..108 -> sits on Kpan f=114..240
    groom = create_articulated_actor("Groom", (-0.65, -4.35, 0.06), math.radians(180), pal, role="damsan", armed=False)
    anim_walk(groom, 1, 54, (-0.65, -4.35, 0.06), (-0.65, -2.95, 0.95), stride_frames=10, lift=0.05)
    anim_walk(groom, 56, 108, (-0.65, -2.95, 0.95), (-0.52, -0.45, 0.95), stride_frames=12, lift=0.04)
    # Turn smoothly toward +X (hearth) and sit on Kpan bench (-0.75, -0.45, 0.95)
    groom["root"].rotation_euler.z = math.radians(180)
    groom["root"].keyframe_insert("rotation_euler", frame=106)
    groom["root"].rotation_euler.z = math.radians(90)
    groom["root"].location = Vector((-0.78, -0.45, 0.95))
    groom["root"].keyframe_insert("rotation_euler", frame=116)
    groom["root"].keyframe_insert("location", frame=116)
    set_interp(groom["root"], "BEZIER")
    anim_sit_talk(groom, 118, 240, seat_pelvis_z=0.32, nod_amp=0.14)
    anim_blink(groom, [25, 80, 145, 205])

    # Wife seated right of hearth facing -X toward Groom
    wife = create_articulated_actor("Wife", (1.20, -0.12, 0.95), math.radians(-90), pal, role="woman", armed=False)
    anim_sit_talk(wife, 1, 240, seat_pelvis_z=0.16, nod_amp=0.12)
    anim_blink(wife, [18, 72, 130, 195])

    # Elder (Po Khan) seated behind hearth facing -X/-Y
    elder = create_articulated_actor("Elder", (0.35, 0.72, 0.95), math.radians(-22), pal, role="elder", armed=False)
    anim_sit_talk(elder, 1, 240, seat_pelvis_z=0.16, nod_amp=0.15)
    anim_blink(elder, [40, 105, 165, 222])

    # 6. Dynamic 3-phase storytelling camera rig
    cam_target = _make_empty("CAM-TARGET", loc=(-0.55, -2.8, 1.15))
    for f, tloc in [
        (1, (-0.55, -2.8, 1.10)),
        (54, (-0.30, -1.6, 1.35)),
        (105, (0.0, -0.2, 1.35)),
        (155, (0.0, 0.4, 1.45)),
        (215, (0.0, 2.2, 1.55)),
        (240, (0.0, 2.2, 1.55)),
    ]:
        cam_target.location = Vector(tloc)
        cam_target.keyframe_insert("location", frame=f)
    set_interp(cam_target, "BEZIER")

    cam_data = bpy.data.cameras.new("CAM-ANIM")
    cam_data.lens = 34.0
    cam_data.dof.use_dof = False
    cam_obj = bpy.data.objects.new("CAM-ANIM", cam_data)
    bpy.context.collection.objects.link(cam_obj)
    track = cam_obj.constraints.new(type="TRACK_TO")
    track.target = cam_target
    track.track_axis = "TRACK_NEGATIVE_Z"
    track.up_axis = "UP_Y"

    for f, cloc in [
        (1, (5.8, -6.5, 3.0)),
        (54, (5.6, -5.6, 3.2)),
        (105, (4.7, -4.3, 2.75)),
        (155, (5.5, -3.3, 3.0)),
        (215, (6.8, -1.2, 3.65)),
        (240, (6.9, -1.0, 3.65)),
    ]:
        cam_obj.location = Vector(cloc)
        cam_obj.keyframe_insert("location", frame=f)
    set_interp(cam_obj, "BEZIER")
    bpy.context.scene.camera = cam_obj

    # 7. Bright warm documentary studio lighting
    add_lighting_rig(key_pos=(7.5, -6.0, 7.2), key_energy=1550, fill_pos=(-6.5, -5.5, 4.8), fill_energy=420, rim_pos=(0.5, 7.5, 6.5), rim_energy=680, target=(0.0, 0.2, 1.5))

    # Tracking anchors for Remotion 2D callout pills
    anc_stairs = _make_empty("TRK-Stairs", loc=(-0.65, -3.22, 1.65))
    anc_roof = _make_empty("TRK-Roof", loc=(0.55, 0.2, 3.75))
    anc_hearth = _make_empty("TRK-Hearth", loc=(0.45, -0.25, 1.95))
    anc_ext = _make_empty("TRK-Ext", loc=(0.15, 4.45, 2.55))

    anchors = {
        "Stairs": anc_stairs,
        "Roof": anc_roof,
        "Groom": groom["label_anchor"],
        "Hearth": anc_hearth,
        "Wife": wife["label_anchor"],
        "Extension": anc_ext,
    }

    OUT_BLEND.parent.mkdir(parents=True, exist_ok=True)
    bpy.ops.wm.save_as_mainfile(filepath=str(OUT_BLEND))
    export_screen_tracks(bpy.context.scene, cam_obj, anchors, 1, 240, OUT_TRACKS)

    if dry_run:
        return

    if TMP_FRAMES.exists():
        shutil.rmtree(TMP_FRAMES)
    TMP_FRAMES.mkdir(parents=True, exist_ok=True)
    bpy.context.scene.render.filepath = str(TMP_FRAMES / "frame_")
    t0 = time.time()
    bpy.ops.render.render(animation=True)
    elapsed = time.time() - t0
    frames = sorted(TMP_FRAMES.glob("frame_*.jpg"))
    print(f"RENDERED anim_b3d02_longhouse: {len(frames)} frames in {elapsed:.2f}s ({elapsed/max(1,len(frames)):.3f} s/f)")
    assert len(frames) == 240

    OUT_MP4.parent.mkdir(parents=True, exist_ok=True)
    subprocess.run(
        [
            "ffmpeg", "-y", "-framerate", "24", "-i", str(TMP_FRAMES / "frame_%04d.jpg"),
            "-c:v", "libx264", "-preset", "medium", "-crf", "18", "-pix_fmt", "yuv420p",
            "-g", "12", "-movflags", "+faststart", str(OUT_MP4),
        ],
        check=True,
    )
    shutil.rmtree(TMP_FRAMES)
    print(f"SAVED {OUT_MP4} ({OUT_MP4.stat().st_size:,} B)")


if __name__ == "__main__":
    dry = "--dry" in sys.argv
    build_and_render(samples=12, dry_run=dry)
