#!/usr/bin/env python3
"""Build & render Animated Demo Scene 2: Đăm Săn vs Mtao Mxây Áo Giáp Sắt (240f @ 24fps = 10s)."""
from __future__ import annotations

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
    add_cone,
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
    anim_walk,
    build_anim_palette,
    create_articulated_actor,
    export_screen_tracks,
    set_interp,
    setup_eevee_fast,
)

OM = Path("/Users/tuyennguyen/project/OpenMontage")
OUT_BLEND = OM / "projects" / "dam-san" / "assets" / "blender_anim" / "anim_b3d03_clash.blend"
OUT_TRACKS = OM / "remotion-composer" / "src" / "dam-san" / "screen_tracks_clash.json"
OUT_MP4 = OM / "remotion-composer" / "public" / "dam-san" / "anim_demo" / "anim_b3d03_clash.mp4"
TMP_FRAMES = OM / "projects" / "dam-san" / "tmp_anim" / "clash"


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
    setup_world((0.032, 0.022, 0.018), strength=0.45)
    pal = build_anim_palette()
    add_diorama_plinth(pal, radius=6.2)

    # 1. Village courtyard palisade perimeter (back arc open to front camera)
    for i in range(20):
        ang = math.radians(18 * i)
        if -math.radians(130) < ang < -math.radians(50):
            continue
        add_cylinder(
            f"GEO-palisade-{i}",
            (4.9 * math.cos(ang), 4.9 * math.sin(ang), 0.58),
            (0.14, 0.14, 1.2 + (i % 3) * 0.22),
            mat=pal["ironwood"],
            verts=12,
        )

    # 2. Grounded Bronze Hero Gong Stand + Animated Swinging Gong + Expanding Acoustic Ring
    add_cylinder("GEO-gong-stand-L", (-0.88, 1.85, 0.65), (0.06, 0.06, 1.25), mat=pal["ironwood"])
    add_cylinder("GEO-gong-stand-R", (0.48, 1.85, 0.65), (0.06, 0.06, 1.25), mat=pal["ironwood"])
    add_cylinder("GEO-gong-stand-top", (-0.20, 1.85, 1.26), (0.055, 0.055, 1.50), rot=(0, math.radians(90), 0), mat=pal["teak_carved"])

    piv_gong = _make_empty("Pivot-HeroGong", loc=(-0.20, 1.85, 1.24))
    _attach(add_cylinder("GEO-gong-cord-L", (-0.18, 0.0, -0.20), (0.015, 0.015, 0.36), mat=pal["brocade_red"]), piv_gong)
    _attach(add_cylinder("GEO-gong-cord-R", (0.18, 0.0, -0.20), (0.015, 0.015, 0.36), mat=pal["brocade_red"]), piv_gong)
    _attach(add_cylinder("GEO-hero-gong", (0.0, 0.0, -0.52), (0.46, 0.46, 0.07), rot=(math.radians(90), 0, 0), mat=pal["bronze_gong"]), piv_gong)

    for f, rx in [(1, 0.0), (171, 0.0), (178, math.radians(24)), (188, math.radians(-18)), (198, math.radians(11)), (210, math.radians(-5)), (225, 0.0), (240, 0.0)]:
        piv_gong.rotation_euler.x = rx
        piv_gong.keyframe_insert("rotation_euler", frame=f)
    set_interp(piv_gong, "BEZIER")

    gong_ring = add_torus("VFX-GongRing", (-0.20, 1.80, 0.72), major_r=0.55, minor_r=0.04, rot=(math.radians(90), 0, 0), mat=pal["gong_ring"])
    for f, sc in [(1, 0.001), (171, 0.001), (173, 0.75), (206, 3.6), (212, 0.001), (240, 0.001)]:
        gong_ring.scale = (sc, sc, sc)
        gong_ring.keyframe_insert("scale", frame=f)
    set_interp(gong_ring, "BEZIER")

    # 3. BlenderKit War Elephant (reusable model + cultural howdah + triumphant rear animation) & Courtyard Trees/Braziers
    bk_ele = search_and_download("elephant", "elephant")
    bk_campfire = search_and_download("campfire2", "3d scanned campfire")
    bk_tree = search_and_download("stylized_tree", "stylized tree")

    piv_ele = _make_empty("Pivot-Ele", loc=(2.55, 2.15, 0.05), rot=(0, 0, math.radians(-26)))
    append_normalized(bk_ele, "WarElephant", target_height=2.25, loc=(0.0, 0.0, 0.0), rot_z=0.0, parent=piv_ele)
    # Ornate carved wooden war howdah saddle seated over elephant back
    _attach(add_box("GEO-ele-saddle", (0.0, 0.05, 1.76), (0.58, 0.72, 0.22), mat=pal["teak_carved"], bevel=0.04), piv_ele)
    _attach(add_box("GEO-ele-blanket", (0.0, 0.05, 1.64), (0.76, 0.84, 0.08), mat=pal["brocade_red"], bevel=0.02), piv_ele)
    for f, rx, dz in [
        (1, 0.0, 0.0),
        (102, math.radians(-4), 0.0),
        (140, 0.0, 0.0),
        (185, 0.0, 0.0),
        (206, math.radians(-11), 0.06),
        (220, math.radians(-4), 0.01),
        (235, math.radians(-12), 0.07),
    ]:
        piv_ele.rotation_euler.x = rx
        piv_ele.location.z = 0.05 + dz
        piv_ele.keyframe_insert("rotation_euler", frame=f)
        piv_ele.keyframe_insert("location", frame=f)
    set_interp(piv_ele, "BEZIER")

    for ti, (tx, ty, th, trz) in enumerate([
        (-4.2, 3.6, 3.8, 0.6),
        (0.2, 4.6, 4.2, 2.1),
        (4.3, 3.4, 3.7, 3.9),
    ]):
        append_normalized(bk_tree, f"Tree-CL-{ti}", target_height=th, loc=(tx, ty, 0.05), rot_z=trz)

    for bi, (bx, by) in enumerate([(-3.3, 1.15), (3.4, 0.45)]):
        append_normalized(bk_campfire, f"Brazier-{bi}", target_max_dim=0.88, loc=(bx, by, 0.05), rot_z=bi * 1.1)
        add_sphere(f"GEO-brazier-ember-{bi}", (bx, by, 0.14), (0.16, 0.16, 0.06), mat=pal["hearth_ember"])

    # 4. Articulated Hero Warriors: Dam San (+90deg faces +X RIGHT) vs Mtao Mxay (-90deg faces -X LEFT)
    ds = create_articulated_actor("DamSan", (-1.65, -0.45, 0.06), math.radians(90), pal, role="damsan", armed=True)
    mx = create_articulated_actor("MtaoMxay", (1.65, -0.45, 0.06), math.radians(-90), pal, role="mtaomxay", armed=True)
    anim_blink(ds, [15, 132, 215])
    anim_blink(mx, [28, 118])

    # Beat 1 (f=1..65): Mtao Mxay steps to x=1.05 & raises shield; Dam San executes 360deg whirlwind shield dance
    anim_walk(mx, 1, 36, (1.65, -0.45, 0.06), (1.05, -0.45, 0.06), stride_frames=12, lift=0.04)
    mx["shoulderL"].rotation_euler = (math.radians(-48), math.radians(20), 0)
    mx["shoulderL"].keyframe_insert("rotation_euler", frame=42)
    mx["shoulderR"].rotation_euler = (math.radians(-35), math.radians(-15), 0)
    mx["shoulderR"].keyframe_insert("rotation_euler", frame=42)

    ds["root"].location = Vector((-1.65, -0.45, 0.06))
    ds["root"].rotation_euler = (0, 0, math.radians(90))
    ds["root"].keyframe_insert("location", frame=1)
    ds["root"].keyframe_insert("rotation_euler", frame=1)
    ds["root"].rotation_euler = (0, 0, math.radians(90))
    ds["root"].keyframe_insert("rotation_euler", frame=18)
    ds["root"].rotation_euler = (0, 0, math.radians(450))
    ds["root"].keyframe_insert("rotation_euler", frame=58)
    ds["shoulderL"].rotation_euler = (math.radians(-55), math.radians(-30), 0)
    ds["shoulderR"].rotation_euler = (math.radians(-40), math.radians(35), 0)
    ds["shoulderL"].keyframe_insert("rotation_euler", frame=24)
    ds["shoulderR"].keyframe_insert("rotation_euler", frame=24)

    # Expanding dust swirls under Dam San's shield dance (f=22..62)
    for di in range(3):
        dr = add_torus(f"VFX-DustRing-{di}", (-1.65, -0.45, 0.12 + di * 0.08), major_r=0.45, minor_r=0.06, mat=pal["dust_warm"])
        f0 = 20 + di * 10
        for f, sc in [(1, 0.001), (f0, 0.001), (f0 + 4, 0.65), (f0 + 24, 2.2), (f0 + 30, 0.001), (240, 0.001)]:
            dr.scale = (sc, sc, sc * 0.6)
            dr.keyframe_insert("scale", frame=f)
        set_interp(dr, "BEZIER")

    # Beat 2 (f=66..126): Dam San leaps in arc & lunges spear into Mtao Mxay's iron armor (impact f=102)
    ds["root"].location = Vector((-1.65, -0.45, 0.06))
    ds["root"].keyframe_insert("location", frame=72)
    ds["root"].location = Vector((-0.90, -0.45, 1.15))
    ds["root"].keyframe_insert("location", frame=86)
    ds["root"].location = Vector((-0.05, -0.45, 0.06))
    ds["root"].keyframe_insert("location", frame=99)
    ds["root"].location = Vector((0.05, -0.45, 0.06))
    ds["root"].keyframe_insert("location", frame=102)
    ds["root"].location = Vector((-0.75, -0.45, 0.72))
    ds["root"].keyframe_insert("location", frame=114)
    ds["root"].location = Vector((-1.45, -0.45, 0.06))
    ds["root"].keyframe_insert("location", frame=125)

    # Spear cock back at leap apex -> overhand horizontal thrust at f=102 -> recover
    for f, sr_x, sp_x, tor_x in [
        (70, -0.35, math.radians(18), 0.0),
        (86, 0.35, math.radians(12), 0.12),
        (98, -0.55, math.radians(95), -0.10),
        (102, math.radians(-58), math.radians(148), -0.25),
        (112, -0.40, math.radians(25), 0.0),
        (125, -0.25, math.radians(18), 0.0),
    ]:
        ds["shoulderR"].rotation_euler.x = sr_x
        ds["spear_pivot"].rotation_euler.x = sp_x
        ds["torso"].rotation_euler.x = tor_x
        ds["shoulderR"].keyframe_insert("rotation_euler", frame=f)
        ds["spear_pivot"].keyframe_insert("rotation_euler", frame=f)
        ds["torso"].keyframe_insert("rotation_euler", frame=f)

    # Armor recoil at f=102 (holds!)
    for f, mx_x, mx_rx in [(99, 1.05, 0.0), (104, 1.38, -0.22), (114, 1.32, 0.0), (168, 1.32, 0.0)]:
        mx["root"].location = Vector((mx_x, -0.45, 0.06))
        mx["torso"].rotation_euler.x = mx_rx
        mx["root"].keyframe_insert("location", frame=f)
        mx["torso"].keyframe_insert("rotation_euler", frame=f)

    # Burst 8 bright sparks at impact f=102 (keep true base scale 0.045!)
    for si in range(8):
        ang = (2.0 * math.pi * si) / 8.0
        sp = add_sphere(f"VFX-Spark-{si}", (0.85, -0.45, 0.88), (0.045, 0.045, 0.045), mat=pal["spark_gold"], segs=8)
        for f, loc_t, sc in [
            (1, (0.85, -0.45, 0.88), 0.001),
            (100, (0.85, -0.45, 0.88), 0.001),
            (102, (0.85, -0.45, 0.88), 0.055),
            (113, (0.85 + 0.65 * math.cos(ang), -0.45 + 0.50 * math.sin(ang), 0.92 + 0.50 * math.sin(ang * 2)), 0.001),
            (240, (0.85, -0.45, 0.88), 0.001),
        ]:
            sp.location = Vector(loc_t)
            sp.scale = (sc, sc, sc)
            sp.keyframe_insert("location", frame=f)
            sp.keyframe_insert("scale", frame=f)
        set_interp(sp, "BEZIER")

    # Beat 3 (f=127..186): Golden Yang shaft highlights wooden pestle -> pestle hurls & shatters Mtao Mxay's iron armor (f=172)
    yang_beam = add_cone("VFX-YangBeam", (-0.55, -1.05, 1.85), r1=0.72, r2=0.14, depth=3.7, mat=pal["yang_beam"])
    for f, sc in [(1, 0.001), (126, 0.001), (138, 1.0), (162, 1.0), (172, 0.001), (240, 0.001)]:
        yang_beam.scale = (sc, sc, 1.0 if sc > 0.1 else 0.001)
        yang_beam.keyframe_insert("scale", frame=f)
    set_interp(yang_beam, "BEZIER")

    pestle = add_cylinder("GEO-pestle", (-0.45, -1.18, 0.14), (0.085, 0.085, 0.92), rot=(math.radians(85), 0, math.radians(24)), mat=pal["ironwood"])
    for f, ploc, prot in [
        (1, (-0.45, -1.18, 0.14), (math.radians(85), 0, math.radians(24))),
        (142, (-0.45, -1.18, 0.14), (math.radians(85), 0, math.radians(24))),
        (152, (-1.10, -0.45, 1.15), (0, math.radians(45), 0)),
        (162, (0.10, -0.45, 2.05), (math.radians(180), math.radians(220), 0)),
        (172, (1.28, -0.45, 1.15), (math.radians(360), math.radians(420), 0)),
        (188, (1.75, -0.95, 0.14), (math.radians(445), math.radians(510), math.radians(35))),
        (240, (1.75, -0.95, 0.14), (math.radians(445), math.radians(510), math.radians(35))),
    ]:
        pestle.location = Vector(ploc)
        pestle.rotation_euler = Euler(prot, "XYZ")
        pestle.keyframe_insert("location", frame=f)
        pestle.keyframe_insert("rotation_euler", frame=f)
    set_interp(pestle, "BEZIER")

    # Dam San throwing motion at f=145..160
    for f, sr_x in [(140, -0.25), (152, 1.15), (160, -1.65), (176, -0.35)]:
        ds["shoulderR"].rotation_euler.x = sr_x
        ds["shoulderR"].keyframe_insert("rotation_euler", frame=f)

    # Armor shards flying off Mtao Mxay at f=172 (preserve compact plate dimensions 0.14x0.10x0.04!)
    for shi in range(6):
        ang = shi * 1.05
        sh = add_box(f"VFX-ArmorShard-{shi}", (1.32, -0.45, 1.05), (0.14, 0.10, 0.04), mat=pal["iron_armor"], bevel=0.008)
        for f, loc_t, rot_t, sc in [
            (1, (1.32, -0.45, 1.05), (0, 0, 0), 0.001),
            (170, (1.32, -0.45, 1.05), (0, 0, 0), 0.001),
            (172, (1.32, -0.45, 1.05), (0, 0, 0), 1.0),
            (194, (1.32 + 0.9 * math.cos(ang), -0.45 + 0.85 * math.sin(ang), 0.10), (ang * 3, ang * 2, ang * 4), 1.0),
            (240, (1.32 + 0.9 * math.cos(ang), -0.45 + 0.85 * math.sin(ang), 0.10), (ang * 3, ang * 2, ang * 4), 1.0),
        ]:
            sh.location = Vector(loc_t)
            sh.rotation_euler = Euler(rot_t, "XYZ")
            sh.scale = (0.14 * sc, 0.10 * sc, 0.04 * sc)
            sh.keyframe_insert("location", frame=f)
            sh.keyframe_insert("rotation_euler", frame=f)
            sh.keyframe_insert("scale", frame=f)
        set_interp(sh, "BEZIER")

    # Beat 4 (f=172..240): Mtao Mxay collapses backward (-X torso -> +Z rotates -1.45 rad!) & Dam San victorious stride + salute
    for f, p_rx, p_z in [(170, 0.0, 0.50), (180, -0.25, 0.48), (198, -1.42, 0.18), (240, -1.42, 0.18)]:
        mx["pelvis"].rotation_euler.x = p_rx
        mx["pelvis"].location.z = p_z
        mx["pelvis"].keyframe_insert("rotation_euler", frame=f)
        mx["pelvis"].keyframe_insert("location", frame=f)
    set_interp(mx["pelvis"], "BEZIER")

    anim_walk(ds, 182, 212, (-1.45, -0.45, 0.06), (-0.30, -0.45, 0.06), stride_frames=12, lift=0.05)
    # Turn triumphant 3/4 toward front-right camera & raise spear high + hold shield proudly clear of torso!
    ds["root"].rotation_euler = (0, 0, math.radians(450))
    ds["root"].keyframe_insert("rotation_euler", frame=210)
    ds["root"].rotation_euler = (0, 0, math.radians(390))  # +30deg 3/4 facing viewer
    ds["root"].keyframe_insert("rotation_euler", frame=226)
    set_interp(ds["root"], "BEZIER")
    for f, sr_e, sp_x, sl_e in [
        (210, (-0.35, 0.0, 0.0), math.radians(18), (-0.20, 0.0, 0.0)),
        (226, (math.radians(-145), 0.18, 0.0), math.radians(122), (-0.85, -0.62, 0.0)),
        (240, (math.radians(-138), 0.18, 0.0), math.radians(118), (-0.80, -0.58, 0.0)),
    ]:
        ds["shoulderR"].rotation_euler = Euler(sr_e, "XYZ")
        ds["spear_pivot"].rotation_euler.x = sp_x
        ds["shoulderL"].rotation_euler = Euler(sl_e, "XYZ")
        ds["shoulderR"].keyframe_insert("rotation_euler", frame=f)
        ds["spear_pivot"].keyframe_insert("rotation_euler", frame=f)
        ds["shoulderL"].keyframe_insert("rotation_euler", frame=f)

    for obj in (ds["shoulderL"], ds["shoulderR"], ds["spear_pivot"], ds["torso"], mx["shoulderL"], mx["shoulderR"], mx["root"], mx["torso"]):
        set_interp(obj, "BEZIER")

    # Impact flash point light at armor clashes (balanced exposure so faces stay crisp)
    flash = bpy.data.lights.new("LGT-ImpactFlash", type="POINT")
    flash.energy = 0.0
    flash.color = (1.0, 0.62, 0.14)
    fobj = bpy.data.objects.new("LGT-ImpactFlash", flash)
    bpy.context.collection.objects.link(fobj)
    fobj.location = (0.95, -0.65, 1.05)
    for f, e in [(1, 0), (100, 0), (102, 1100), (107, 0), (170, 0), (172, 1500), (179, 0), (240, 0)]:
        flash.energy = e
        flash.keyframe_insert("energy", frame=f)
    set_interp(flash, "LINEAR")

    # 5. Dynamic action camera + impact micro-shake
    cam_target = _make_empty("CAM-TARGET", loc=(0.0, -0.2, 0.95))
    for f, tloc in [
        (1, (0.0, -0.2, 0.95)),
        (68, (0.0, -0.35, 0.95)),
        (102, (0.55, -0.45, 1.00)),
        (135, (0.15, -0.55, 0.95)),
        (172, (1.05, -0.45, 0.95)),
        (210, (0.25, -0.15, 1.15)),
        (240, (0.25, -0.15, 1.15)),
    ]:
        cam_target.location = Vector(tloc)
        cam_target.keyframe_insert("location", frame=f)
    set_interp(cam_target, "BEZIER")

    cam_data = bpy.data.cameras.new("CAM-ANIM")
    cam_data.lens = 36.0
    cam_obj = bpy.data.objects.new("CAM-ANIM", cam_data)
    bpy.context.collection.objects.link(cam_obj)
    track = cam_obj.constraints.new(type="TRACK_TO")
    track.target = cam_target
    track.track_axis = "TRACK_NEGATIVE_Z"
    track.up_axis = "UP_Y"

    for f, cloc in [
        (1, (-0.25, -6.1, 2.35)),
        (68, (-0.10, -5.5, 2.15)),
        (100, (0.25, -4.3, 1.85)),
        (102, (0.33, -4.22, 1.92)),
        (105, (0.18, -4.35, 1.80)),
        (130, (-0.85, -4.9, 2.10)),
        (170, (-0.45, -4.6, 1.95)),
        (172, (-0.36, -4.50, 2.04)),
        (175, (-0.52, -4.65, 1.90)),
        (212, (-0.85, -4.0, 1.50)),
        (240, (-0.75, -3.75, 1.40)),
    ]:
        cam_obj.location = Vector(cloc)
        cam_obj.keyframe_insert("location", frame=f)
    set_interp(cam_obj, "BEZIER")
    bpy.context.scene.camera = cam_obj

    add_lighting_rig(key_pos=(-5.2, -6.2, 6.0), key_energy=1550, key_color=(1.0, 0.84, 0.62), fill_pos=(6.5, -4.8, 5.0), fill_energy=420, rim_pos=(0.0, 6.2, 5.5), rim_energy=880, rim_color=(1.0, 0.68, 0.35), target=(0.0, 0.0, 1.0))

    anc_impact = _make_empty("TRK-Impact", loc=(0.85, -0.45, 1.45))
    anc_pestle = _make_empty("TRK-Pestle", loc=(0.0, 0.0, 0.45), parent=pestle)
    anc_ele = _make_empty("TRK-Elephant", loc=(0.0, -0.8, 2.15), parent=piv_ele)

    anchors = {
        "DamSan": ds["label_anchor"],
        "MtaoMxay": mx["label_anchor"],
        "Impact": anc_impact,
        "Pestle": anc_pestle,
        "Elephant": anc_ele,
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
    print(f"RENDERED anim_b3d03_clash: {len(frames)} frames in {elapsed:.2f}s ({elapsed/max(1,len(frames)):.3f} s/f)")
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
