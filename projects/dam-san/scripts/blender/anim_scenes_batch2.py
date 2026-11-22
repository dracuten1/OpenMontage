#!/usr/bin/env python3
"""Animated one-way Blender + BlenderKit scenes batch 2: B3D-07, B3D-08, B3D-09, B3D-10 (240f @ 24fps)."""
from __future__ import annotations

import math
import random
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent))
import bpy  # noqa: E402
from mathutils import Euler, Vector  # noqa: E402

from anim_scene_common import (  # noqa: E402
    anim_rising_embers,
    attach,
    finalize_or_probe_scene,
    instance_baked_bk,
    make_empty,
    parse_batch_cli,
    setup_track_camera,
)
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
    set_interp,
    setup_eevee_fast,
)


def build_b3d_07(samples: int = 12, probe_only: bool = False) -> None:
    """B3D-07: Gian Khách Gah, Ghế Kpan & Sợi Dây Nối Dòng Niê – Mlô."""
    clear_scene()
    setup_eevee_fast(samples=samples, frame_end=240)
    setup_world((0.030, 0.022, 0.017), strength=0.42)
    pal = build_anim_palette()

    from common_blender import make_noise_material
    floor_matte = make_noise_material("MAT-floor-matte", (0.14, 0.075, 0.042), roughness=0.78, bump_strength=0.18, noise_scale=28.0, coat_weight=0.0)
    add_box("GEO-gah-floor", (0, 0, -0.10), (10.5, 7.0, 0.20), mat=floor_matte, bevel=0.02)
    add_box("GEO-gah-backwall", (0, 2.75, 2.2), (10.5, 0.18, 4.6), mat=pal["basalt"], bevel=0.0)
    for si in range(18):
        add_cylinder(f"GEO-slat-{si}", (-3.6 + si * 0.42, 2.55, 2.0), (0.06, 0.06, 4.0), mat=pal["teak_carved"], verts=12)

    # Dugout Kpan bench spanning center + BlenderKit ceramic Ché jars + campfire hearth (sunken flush)
    add_box("GEO-kpan-trunk", (0.0, 0.45, 0.50), (4.65, 0.72, 0.36), mat=pal["teak_carved"], bevel=0.06)
    add_cylinder("GEO-kpan-leg-L", (-1.85, 0.45, 0.18), (0.28, 0.28, 0.34), mat=pal["ironwood"])
    add_cylinder("GEO-kpan-leg-R", (1.85, 0.45, 0.18), (0.28, 0.28, 0.34), mat=pal["ironwood"])

    bk_jar = search_and_download("ceramic_jar", "ceramic jar")
    for ji, jx in enumerate([-2.65, -2.18, 2.18, 2.65]):
        append_normalized(bk_jar, f"KpanChe-{ji}", target_height=0.76, loc=(jx, 1.55, 0.0), rot_z=ji * 0.6, material_override=pal["ceramic_che"])

    bk_campfire = search_and_download("campfire2", "3d scanned campfire")
    append_normalized(bk_campfire, "GahHearth", target_max_dim=0.95, loc=(0.0, -1.85, -0.03))
    add_sphere("GEO-gah-coal", (0.0, -1.85, 0.11), (0.12, 0.12, 0.045), mat=pal["hearth_ember"])
    anim_rising_embers("GahHearth", 0.0, -1.85, 0.20, pal, count=7)

    # Tall Clan totems (Niê left, Mlô right) flanking stage so crimson cord arches cleanly ABOVE seated faces
    add_cylinder("GEO-clan-Nie", (-2.15, -0.35, 1.15), (0.20, 0.20, 2.30), mat=pal["teak_carved"], verts=16)
    add_sphere("GEO-clan-Nie-top", (-2.15, -0.35, 2.36), (0.22, 0.22, 0.22), mat=pal["bronze_gong"])
    add_cylinder("GEO-clan-Mlo", (2.15, -0.35, 1.15), (0.20, 0.20, 2.30), mat=pal["ironwood"], verts=16)
    add_sphere("GEO-clan-Mlo-top", (2.15, -0.35, 2.36), (0.22, 0.22, 0.22), mat=pal["copper"])

    curve_data = bpy.data.curves.new("CRV-chue-nue", type="CURVE")
    curve_data.dimensions = "3D"
    curve_data.bevel_depth = 0.042
    curve_data.bevel_resolution = 6
    spline = curve_data.splines.new("NURBS")
    pts = [(-2.15 + (i / 10.0) * 4.30, -0.35, 2.08 - 0.26 * math.sin((i / 10.0) * math.pi), 1.0) for i in range(11)]
    spline.points.add(len(pts) - 1)
    for i, pt_co in enumerate(pts):
        spline.points[i].co = pt_co
    spline.use_endpoint_u = True
    cord_obj = bpy.data.objects.new("GEO-chue-nue-cord", curve_data)
    bpy.context.collection.objects.link(cord_obj)
    cord_obj.data.materials.append(pal["brocade_red"])

    for f, bf in [(1, 0.02), (24, 0.02), (112, 1.0), (240, 1.0)]:
        curve_data.bevel_factor_end = bf
        curve_data.keyframe_insert("bevel_factor_end", frame=f)
    set_interp(curve_data, "BEZIER")

    # Travelling golden light bead binding the two clans along the high cord curve (f=24..112)
    piv_bead = make_empty("Pivot-CordBead", loc=(-2.15, -0.35, 2.08))
    attach(add_sphere("VFX-cord-bead", (0, 0, 0), (0.09, 0.09, 0.09), mat=pal["spark_gold"], segs=12), piv_bead)
    for step_i in range(11):
        frac = step_i / 10.0
        f = 24 + int(round(frac * 88))
        bx = -2.15 + frac * 4.30
        bz = 2.08 - 0.26 * math.sin(frac * math.pi)
        piv_bead.location = (bx, -0.35, bz)
        piv_bead.scale = (1.15, 1.15, 1.15)
        piv_bead.keyframe_insert("location", frame=f)
        piv_bead.keyframe_insert("scale", frame=f)
    piv_bead.scale = (0.01, 0.01, 0.01)
    piv_bead.keyframe_insert("scale", frame=122)
    set_interp(piv_bead, "BEZIER")

    # 3 Articulated Actors: Elder left & Bride right on Kpan; Groom walks to clear center-front & bows
    elder = create_articulated_actor("Elder", (-0.82, 0.35, 0.20), math.radians(-18), pal, role="elder", armed=False)
    bride = create_articulated_actor("Bride", (0.85, 0.35, 0.20), math.radians(18), pal, role="woman", armed=False)
    anim_sit_talk(elder, 1, 240, seat_pelvis_z=0.48, nod_amp=0.14)
    anim_sit_talk(bride, 1, 240, seat_pelvis_z=0.48, nod_amp=0.12)
    anim_blink(elder, [18, 92, 198])
    anim_blink(bride, [38, 144, 218])

    groom = create_articulated_actor("Groom", (-2.45, -0.85, 0.0), math.radians(105), pal, role="damsan", armed=False)
    anim_blink(groom, [16, 130, 205])
    anim_walk(groom, 1, 115, (-2.45, -0.85, 0.0), (0.02, -0.85, 0.0), stride_frames=14, swing=0.48)
    for f, rz, tx, sr_x in [
        (115, math.radians(105), 0.0, -0.2),
        (138, math.radians(160), 0.34, -0.78),
        (175, math.radians(160), 0.30, -0.72),
        (205, math.radians(145), 0.06, -0.35),
        (240, math.radians(145), 0.05, -0.35),
    ]:
        groom["root"].rotation_euler.z = rz
        groom["torso"].rotation_euler.x = tx
        groom["shoulderR"].rotation_euler.x = sr_x
        groom["root"].keyframe_insert("rotation_euler", frame=f)
        groom["torso"].keyframe_insert("rotation_euler", frame=f)
        groom["shoulderR"].keyframe_insert("rotation_euler", frame=f)
    for o in (groom["root"], groom["torso"], groom["shoulderR"]):
        set_interp(o, "BEZIER")

    pt = bpy.data.lights.new("LGT-KpanHearth", type="POINT")
    pt.energy = 95
    pt.color = (1.0, 0.50, 0.16)
    pobj = bpy.data.objects.new("LGT-KpanHearth", pt)
    bpy.context.collection.objects.link(pobj)
    pobj.location = (0.0, -1.85, 0.65)

    add_lighting_rig(key_pos=(-5.2, -5.4, 5.0), key_energy=950, key_color=(1.0, 0.85, 0.65), fill_pos=(5.5, -4.5, 4.4), fill_energy=320, rim_pos=(0.0, 2.4, 5.2), rim_energy=600, target=(0, 0.1, 0.9))

    cam_obj, _ = setup_track_camera(
        [(1, (-1.2, -6.1, 2.55)), (120, (0.05, -6.05, 2.45)), (240, (1.15, -5.85, 2.35))],
        [(1, (-0.30, 0.05, 1.05)), (120, (0.0, 0.15, 1.05)), (240, (0.15, 0.25, 1.02))],
        lens=35.0,
    )

    anc_kpan = make_empty("TRK-KpanBench", loc=(-1.15, 0.45, 1.15))
    anc_cord = make_empty("TRK-ClanCord", loc=(0.0, -0.35, 2.02))
    anc_cn = make_empty("TRK-ChueNue", loc=(0.85, 0.35, 1.65))
    finalize_or_probe_scene(
        "B3D-07", cam_obj,
        {"KpanBench": anc_kpan, "ClanCord": anc_cord, "ChueNue": anc_cn},
        probe_only=probe_only,
    )


def build_b3d_08(samples: int = 12, probe_only: bool = False) -> None:
    """B3D-08: Sa bàn Địa hình Tây Nguyên & Vòng Cung Ngôn Ngữ Chamic – Môn-Khmer."""
    clear_scene()
    setup_eevee_fast(samples=samples, frame_end=240)
    setup_world((0.028, 0.025, 0.022), strength=0.45)
    pal = build_anim_palette()

    from common_blender import make_noise_material
    coast_matte = make_noise_material("MAT-coast-matte", (0.84, 0.77, 0.63), roughness=0.90, bump_strength=0.08, noise_scale=32.0, coat_weight=0.0)
    add_box("GEO-map-table", (0, 0, -0.20), (11.0, 8.4, 0.40), mat=pal["basalt"], bevel=0.04)
    add_box("GEO-map-ocean", (2.7, 0, 0.02), (4.4, 7.6, 0.06), mat=pal["forest_moss"], bevel=0.01)
    add_box("GEO-coast-plain", (1.2, 0.0, 0.12), (2.4, 6.8, 0.18), mat=coast_matte, bevel=0.04)
    add_box("GEO-highlands-t2", (-0.95, 0.0, 0.28), (4.0, 6.2, 0.24), mat=pal["teak_carved"], bevel=0.06)

    # Stepped highland plateaus rising smoothly into relief (f=1..55) + miniature forest markers
    bk_tree = search_and_download("stylized_tree", "stylized tree")
    piv_plateaus = make_empty("Pivot-Plateaus", loc=(0, 0, -0.45))
    for ti, (tx, ty, sx, sy, tz, mat_p) in enumerate([
        (-1.10, 1.75, 2.1, 1.80, 0.52, pal["red_soil"]),
        (-0.90, -0.25, 2.4, 1.85, 0.62, pal["red_soil"]),
        (-1.20, -1.95, 1.9, 1.35, 0.72, pal["teak_carved"]),
    ]):
        attach(add_box(f"GEO-plateau-{ti}", (tx, ty, tz), (sx, sy, 0.34), mat=mat_p, bevel=0.08), piv_plateaus)

    # Cluster small trees cleanly onto plateau rims (keep original alpha foliage, shadow maps off)
    tree_clones = instance_baked_bk(
        bk_tree, "MapTree",
        [
            ((-1.65, 2.05, 0.68), 0.72, 0.3),
            ((-1.55, -0.60, 0.78), 0.78, 1.4),
            ((-1.65, -2.05, 0.88), 0.68, 2.5),
        ],
        disable_shadows=True,
    )
    for tc in tree_clones:
        tc.parent = piv_plateaus

    for f, z_off in [(1, -0.42), (55, 0.0), (240, 0.0)]:
        piv_plateaus.location.z = z_off
        piv_plateaus.keyframe_insert("location", frame=f)
    set_interp(piv_plateaus, "BEZIER")

    # 5 Location Pins popping up staggered + Sonar rings on Cham-Coast (f=55) and Ede-DakLak (f=145)
    markers = [
        ("Cham-Coast", (1.35, -0.45, 0.22), pal["copper"], 0.20, 40),
        ("Ede-DakLak", (-0.80, -0.35, 0.80), pal["bronze_gong"], 0.25, 140),
        ("Jarai-GiaLai", (-1.00, 1.55, 0.70), pal["bronze_gong"], 0.18, 158),
        ("Bahnar-North", (-1.50, 1.95, 0.70), pal["forest_moss"], 0.16, 172),
        ("Mnong-South", (-1.00, -1.75, 0.76), pal["forest_moss"], 0.16, 186),
    ]
    for mname, mloc, mmat, mr, f_pop in markers:
        piv_p = make_empty(f"Pivot-Pin-{mname}", loc=mloc)
        attach(add_cylinder(f"GEO-pin-{mname}", (0, 0, 0.12), (mr, mr, 0.24), mat=mmat, verts=24), piv_p)
        attach(add_sphere(f"GEO-pin-head-{mname}", (0, 0, 0.28), (mr * 0.65, mr * 0.65, mr * 0.65), mat=mmat), piv_p)
        for f, sc in [(1, 0.001), (f_pop, 0.001), (f_pop + 16, 1.18), (f_pop + 24, 1.0), (240, 1.0)]:
            piv_p.scale = (sc, sc, sc)
            piv_p.keyframe_insert("scale", frame=f)
        set_interp(piv_p, "BEZIER")

    for rname, rloc, f_pulse in [("CoastPulse", (1.35, -0.45, 0.26), 54), ("DakLakPulse", (-0.80, -0.35, 0.88), 146)]:
        rpiv = make_empty(f"Pivot-{rname}", loc=rloc)
        attach(add_torus(f"VFX-{rname}", (0, 0, 0), major_r=0.35, minor_r=0.032, mat=pal["gong_ring"]), rpiv)
        for f, sc in [(1, 0.001), (f_pulse, 0.001), (f_pulse + 4, 0.7), (f_pulse + 32, 3.2), (f_pulse + 38, 0.001), (240, 0.001)]:
            rpiv.scale = (sc, sc, sc)
            rpiv.keyframe_insert("scale", frame=f)
        set_interp(rpiv, "BEZIER")

    # Sweeping brass Chamic NURBS arc + moving comet bead (f=65..148)
    arc_curve = bpy.data.curves.new("CRV-chamic-arc", type="CURVE")
    arc_curve.dimensions = "3D"
    arc_curve.bevel_depth = 0.050
    arc_curve.bevel_resolution = 6
    arc_spline = arc_curve.splines.new("NURBS")
    arc_pts = [
        (1.35 - (i / 13.0) * 2.15, -0.45 + 0.10 * (i / 13.0) + 0.16 * math.sin((i / 13.0) * math.pi), 0.35 + 0.95 * math.sin((i / 13.0) * math.pi) + 0.30 * (i / 13.0), 1.0)
        for i in range(14)
    ]
    arc_spline.points.add(len(arc_pts) - 1)
    for i, pt_co in enumerate(arc_pts):
        arc_spline.points[i].co = pt_co
    arc_spline.use_endpoint_u = True
    arc_obj = bpy.data.objects.new("GEO-arc-chamic", arc_curve)
    bpy.context.collection.objects.link(arc_obj)
    arc_obj.data.materials.append(pal["bronze_gong"])
    for f, bf in [(1, 0.01), (64, 0.01), (146, 1.0), (240, 1.0)]:
        arc_curve.bevel_factor_end = bf
        arc_curve.keyframe_insert("bevel_factor_end", frame=f)
    set_interp(arc_curve, "BEZIER")

    comet = make_empty("Pivot-Comet", loc=(1.35, -0.45, 0.35))
    attach(add_sphere("VFX-arc-comet", (0, 0, 0), (0.11, 0.11, 0.11), mat=pal["spark_gold"], segs=12), comet)
    for i, pt_co in enumerate(arc_pts):
        f = 64 + int(round((i / 13.0) * 82))
        comet.location = (pt_co[0], pt_co[1], pt_co[2])
        sc = 0.01 if (i == 0 or i == 13) else 1.15
        comet.scale = (sc, sc, sc)
        comet.keyframe_insert("location", frame=f)
        comet.keyframe_insert("scale", frame=f)
    comet.scale = (0.01, 0.01, 0.01)
    comet.keyframe_insert("scale", frame=1)
    comet.keyframe_insert("scale", frame=152)
    set_interp(comet, "BEZIER")

    add_lighting_rig(key_pos=(-4.5, -5.5, 6.8), key_energy=1100, key_color=(1.0, 0.90, 0.74), fill_pos=(5.5, -4.5, 5.2), fill_energy=340, rim_pos=(0.0, 5.5, 5.5), rim_energy=680, target=(-0.2, 0.0, 0.65))

    cam_obj, _ = setup_track_camera(
        [(1, (2.6, -6.8, 5.3)), (120, (0.6, -6.9, 5.0)), (240, (-1.2, -6.5, 4.6))],
        [(1, (0.35, -0.15, 0.45)), (120, (-0.15, -0.10, 0.56)), (240, (-0.50, -0.05, 0.64))],
        lens=32.0,
    )

    anc_coast = make_empty("TRK-ChampaCoast", loc=(1.35, -0.45, 0.78))
    anc_arc = make_empty("TRK-ChamicArc", loc=(0.25, -0.25, 1.48))
    anc_ede = make_empty("TRK-DakLakEde", loc=(-0.80, -0.35, 1.42))
    finalize_or_probe_scene(
        "B3D-08", cam_obj,
        {"ChampaCoast": anc_coast, "ChamicArc": anc_arc, "DakLakEde": anc_ede},
        probe_only=probe_only,
    )


def build_b3d_09(samples: int = 12, probe_only: bool = False) -> None:
    """B3D-09: Dàn Chiêng Ê Đê 6+3+1 + Trống Cái (Gong player strikes pivoted gongs with rings; Po Khan recites)."""
    clear_scene()
    setup_eevee_fast(samples=samples, frame_end=240)
    setup_world((0.026, 0.020, 0.017), strength=0.40)
    pal = build_anim_palette()
    add_diorama_plinth(pal, radius=5.4)

    # Ceremonial gong rack
    add_cylinder("GEO-rack-post-L", (-3.15, 0.65, 1.45), (0.14, 0.14, 2.9), mat=pal["ironwood"])
    add_cylinder("GEO-rack-post-R", (3.15, 0.65, 1.45), (0.14, 0.14, 2.9), mat=pal["ironwood"])
    add_cylinder("GEO-rack-beam-top", (0.0, 0.65, 2.68), (0.11, 0.11, 6.7), rot=(0, math.radians(90), 0), mat=pal["teak_carved"])

    gong_pivots = []
    gong_rings = []
    # 6 Chiêng Bằng + 3 Chiêng Núm + 1 Chiêng Giữ Nhịp
    specs = (
        [("bang", -2.45 + i * 0.62, 0.27 - i * 0.015, 0.82, False) for i in range(6)]
        + [("num", 1.25 + i * 0.56, 0.30 - i * 0.02, 0.85, True) for i in range(3)]
        + [("nhip", 2.68, 0.17, 0.92, False)]
    )
    for gi, (kind, gx, gr, drop_z, has_boss) in enumerate(specs):
        gpiv = make_empty(f"Pivot-Gong-{gi}", loc=(gx, 0.65, 2.64))
        rope_len = drop_z - 0.1
        attach(add_cylinder(f"GEO-rope-{gi}", (0, 0, -rope_len * 0.5), (0.015, 0.015, rope_len), mat=pal["brocade_red"]), gpiv)
        mat_g = pal["copper"] if kind == "nhip" else pal["bronze_gong"]
        attach(add_cylinder(f"GEO-gong-{gi}", (0, 0, -drop_z), (gr, gr, 0.045), rot=(math.radians(90), 0, 0), mat=mat_g, verts=32), gpiv)
        if has_boss:
            attach(add_sphere(f"GEO-boss-{gi}", (0, -0.055, -drop_z), (gr * 0.30, 0.075, gr * 0.30), mat=pal["copper"]), gpiv)
        ring_piv = make_empty(f"Pivot-GongWave-{gi}", loc=(gx, 0.58, 2.64 - drop_z))
        attach(add_torus(f"VFX-wave-{gi}", (0, 0, 0), major_r=gr * 1.15, minor_r=0.028, rot=(math.radians(90), 0, 0), mat=pal["gong_ring"]), ring_piv)
        ring_piv.scale = (0.001, 0.001, 0.001)
        ring_piv.keyframe_insert("scale", frame=1)
        ring_piv.keyframe_insert("scale", frame=240)
        gong_pivots.append((gpiv, gx))
        gong_rings.append(ring_piv)

    # Strikes at key gongs across 6+3+1 rack (f=28, 72, 118, 162, 206)
    strike_schedule = [(0, 28), (3, 72), (5, 118), (6, 162), (8, 206)]
    strike_frames = {f for _, f in strike_schedule}
    for g_idx, sf in strike_schedule:
        gpiv, _ = gong_pivots[g_idx]
        for f, rx in [(1, 0.0), (sf - 1, 0.0), (sf + 5, math.radians(20)), (sf + 15, math.radians(-14)), (sf + 26, math.radians(7)), (sf + 38, 0.0)]:
            if f <= 240:
                gpiv.rotation_euler.x = rx
                gpiv.keyframe_insert("rotation_euler", frame=f)
        set_interp(gpiv, "BEZIER")

        rp = gong_rings[g_idx]
        for f, sc in [(sf - 1, 0.001), (sf + 1, 0.8), (sf + 30, 3.3), (sf + 35, 0.001)]:
            if f <= 240:
                rp.scale = (sc, sc, sc)
                rp.keyframe_insert("scale", frame=f)
        set_interp(rp, "BEZIER")

    # Sculpted Hardwood Trống Cái in Cradle + BlenderKit Campfire & Trees (framed cleanly inside pan)
    add_box("GEO-drum-cradle", (-1.65, -0.95, 0.20), (0.68, 0.82, 0.24), rot=(0, 0, math.radians(28)), mat=pal["ironwood"], bevel=0.02)
    add_cylinder("GEO-trong-cai-body", (-1.75, -0.85, 0.68), (0.48, 0.48, 1.15), rot=(math.radians(72), 0, math.radians(28)), mat=pal["teak_carved"], verts=28)
    add_cylinder("GEO-trong-cai-head", (-1.52, -1.38, 0.85), (0.44, 0.44, 0.06), rot=(math.radians(72), 0, math.radians(28)), mat=pal["paper"], verts=28)

    bk_campfire = search_and_download("campfire2", "3d scanned campfire")
    append_normalized(bk_campfire, "RitualFire", target_max_dim=1.00, loc=(0.35, -1.35, 0.02))
    anim_rising_embers("RitualFire", 0.35, -1.35, 0.22, pal, count=8)

    bk_tree = search_and_download("stylized_tree", "stylized tree")
    instance_baked_bk(bk_tree, "GongTree", [((-3.9, 3.1, 0.05), 3.6, 0.5), ((3.9, 3.0, 0.05), 3.5, 2.2)], disable_shadows=True)

    # Seated Po Khan beside hearth & Standing Gong Player stepping along rack
    pokhan = create_articulated_actor("PoKhan", (-0.55, -1.45, 0.05), math.radians(45), pal, role="elder", armed=False)
    anim_sit_talk(pokhan, 1, 240, seat_pelvis_z=0.30, nod_amp=0.16)
    anim_blink(pokhan, [18, 110, 195])

    player = create_articulated_actor("GongPlayer", (-2.45, -0.15, 0.05), math.radians(150), pal, role="damsan", armed=False)
    attach(add_cylinder("GEO-player-mallet", (0.02, -0.22, -0.35), (0.025, 0.025, 0.52), rot=(math.radians(80), 0, 0), mat=pal["ironwood"]), player["shoulderR"])
    attach(add_sphere("GEO-player-mallet-head", (0.02, -0.46, -0.38), (0.072, 0.072, 0.072), mat=pal["brocade_red"], segs=12), player["shoulderR"])
    anim_blink(player, [24, 136])

    # Walk waypoints across the 10-gong line matching strike frames
    anim_walk(player, 1, 240, (-2.45, -0.15, 0.05), (2.25, -0.15, 0.05), stride_frames=16, swing=0.38)
    for g_idx, sf in strike_schedule:
        player["shoulderR"].rotation_euler.x = -0.35
        player["shoulderR"].keyframe_insert("rotation_euler", frame=max(1, sf - 12))
        player["shoulderR"].rotation_euler.x = -1.25
        player["shoulderR"].keyframe_insert("rotation_euler", frame=sf - 3)
        player["shoulderR"].rotation_euler.x = -0.55
        player["shoulderR"].keyframe_insert("rotation_euler", frame=sf + 6)
    set_interp(player["shoulderR"], "BEZIER")

    add_lighting_rig(key_pos=(-4.5, -5.8, 5.2), key_energy=1200, key_color=(1.0, 0.85, 0.62), fill_pos=(5.5, -5.0, 4.2), fill_energy=320, rim_pos=(0.0, 5.5, 5.5), rim_energy=760, rim_color=(1.0, 0.72, 0.36), target=(0.1, 0.3, 1.45))

    cam_obj, _ = setup_track_camera(
        [(1, (-1.45, -6.2, 2.35)), (120, (0.35, -6.35, 2.25)), (240, (1.85, -5.9, 2.35))],
        [(1, (-0.35, 0.2, 1.35)), (120, (0.15, 0.3, 1.4)), (240, (0.65, 0.3, 1.4))],
        lens=37.0,
    )

    anc_flat = make_empty("TRK-FlatGongs6", loc=(-0.95, 0.65, 2.35))
    anc_boss = make_empty("TRK-BossGongs3", loc=(1.85, 0.65, 2.35))
    finalize_or_probe_scene(
        "B3D-09", cam_obj,
        {"FlatGongs6": anc_flat, "BossGongs3": anc_boss, "PoKhan": pokhan["label_anchor"]},
        probe_only=probe_only,
    )


def build_b3d_10(samples: int = 12, probe_only: bool = False) -> None:
    """B3D-10: Kho Tàng 62 Tập, Băng 90 Phút, Nghệ Nhân Ama Nhiên & Học Trò Bên Bếp Lửa."""
    clear_scene()
    setup_eevee_fast(samples=samples, frame_end=240)
    setup_world((0.025, 0.020, 0.017), strength=0.40)
    pal = build_anim_palette()
    from common_blender import make_noise_material
    floor_matte = make_noise_material("MAT-floor-archive", (0.14, 0.075, 0.042), roughness=0.78, bump_strength=0.18, noise_scale=28.0, coat_weight=0.0)

    add_box("GEO-floor-planks", (0, 0, -0.10), (10.5, 7.2, 0.20), mat=floor_matte, bevel=0.02)
    add_box("GEO-door-L", (-3.5, 2.75, 2.1), (3.8, 0.24, 4.4), mat=pal["basalt"], bevel=0.02)
    add_box("GEO-door-R", (3.5, 2.75, 2.1), (3.8, 0.24, 4.4), mat=pal["basalt"], bevel=0.02)
    add_box("GEO-dawn-sky-panel", (0, 5.8, 2.2), (10.5, 0.1, 5.5), mat=pal["amber_wax"], bevel=0.0)

    # Baked forest behind open portal keeping original green foliage textures & brown bark (shadows off for speed)
    bk_tree = search_and_download("stylized_tree", "stylized tree")
    instance_baked_bk(bk_tree, "DawnTree", [((-0.85, 4.85, 0.0), 3.3, 0.8), ((0.95, 4.95, 0.0), 3.5, 2.4)], disable_shadows=True)

    # 3 Archival volume stacks rising upward (staggered) + BlenderKit vintage book foreground
    rng = random.Random(99)
    for si, (stack_x, cnt) in enumerate([(-2.25, 7), (-1.40, 6), (-0.60, 5)]):
        for bi in range(cnt):
            bz = 0.08 + bi * 0.13
            rot_z = rng.uniform(-0.08, 0.08)
            mat_b = pal["brocade_red"] if (bi % 3 == 0) else pal["teak_carved"]
            piv_v = make_empty(f"Pivot-Vol-{si}-{bi}", loc=(stack_x, 0.45, bz), rot=(0, 0, rot_z))
            attach(add_box(f"GEO-vol-{si}-{bi}", (0, 0, 0), (0.68, 0.90, 0.11), mat=mat_b, bevel=0.012), piv_v)
            attach(add_box(f"GEO-pages-{si}-{bi}", (0.02, 0, 0), (0.63, 0.85, 0.08), mat=pal["paper"], bevel=0.004), piv_v)
            f0 = 10 + si * 12 + bi * 6
            for f, sc in [(1, 0.01), (f0, 0.01), (f0 + 16, 1.0), (240, 1.0)]:
                piv_v.scale = (sc, sc, sc)
                piv_v.keyframe_insert("scale", frame=f)
            set_interp(piv_v, "BEZIER")

    bk_book = search_and_download("old_book", "vintage book")
    append_normalized(bk_book, "ElderChronicle", target_max_dim=1.15, loc=(0.35, -0.35, 0.0), rot_z=math.radians(15))

    # Fieldwork crate + BlenderKit TDK Cassette resting cleanly beside đing tut bamboo flute
    add_box("GEO-tape-crate", (1.65, 0.45, 0.22), (1.35, 0.88, 0.44), rot=(0, 0, math.radians(-12)), mat=pal["ironwood"], bevel=0.02)
    for ti in range(6):
        add_box(f"GEO-tape-{ti}", (1.20 + ti * 0.18, 0.44, 0.48), (0.11, 0.56, 0.24), rot=(0, 0, math.radians(-12)), mat=pal["basalt"], bevel=0.01)

    bk_cas = search_and_download("cassette", "cassette tape")
    piv_cas = make_empty("Pivot-ArchiveTape", loc=(1.15, -1.05, 0.0), rot=(0, 0, math.radians(22)))
    append_normalized(bk_cas, "HeroArchiveTape", target_max_dim=0.88, loc=(0, 0, 0), parent=piv_cas)

    for pi in range(5):
        plen = 1.35 - pi * 0.12
        add_cylinder(f"GEO-dingtut-{pi}", (1.85 + pi * 0.07, -1.25, 0.08 + pi * 0.014), (0.026, 0.026, plen), rot=(math.radians(88), 0, math.radians(38)), mat=pal["thatch"])

    # Foreground Hearth (BlenderKit campfire2 flush on floor + rising sparks, no bottom sphere clipping)
    bk_campfire = search_and_download("campfire2", "3d scanned campfire")
    append_normalized(bk_campfire, "ArchiveHearth", target_max_dim=0.95, loc=(-1.45, -1.35, -0.02))
    anim_rising_embers("ArchiveHearth", -1.45, -1.35, 0.20, pal, count=7)

    ama = create_articulated_actor("AmaNhien", (-0.55, -1.25, 0.0), math.radians(48), pal, role="elder", armed=False)
    student = create_articulated_actor("Student", (0.55, -1.45, 0.0), math.radians(-52), pal, role="woman", armed=False)
    anim_sit_talk(ama, 1, 240, seat_pelvis_z=0.30, nod_amp=0.15)
    anim_sit_talk(student, 12, 240, seat_pelvis_z=0.30, nod_amp=0.11)
    anim_blink(ama, [24, 128, 210])
    anim_blink(student, [14, 96, 184])

    dawn_lgt = bpy.data.lights.new("LGT-DawnArch", type="AREA")
    dawn_lgt.size = 3.0
    dawn_lgt.use_shadow = False
    dawn_lgt.color = (1.0, 0.72, 0.36)
    dobj = bpy.data.objects.new("LGT-DawnArch", dawn_lgt)
    bpy.context.collection.objects.link(dobj)
    dobj.location = (0, 3.8, 2.2)
    for f, eng in [(1, 180), (120, 260), (240, 340)]:
        dawn_lgt.energy = eng
        dawn_lgt.keyframe_insert("energy", frame=f)
    set_interp(dawn_lgt, "BEZIER")

    add_lighting_rig(key_pos=(-4.2, -5.4, 4.8), key_energy=1050, key_color=(1.0, 0.86, 0.66), fill_pos=(5.2, -4.5, 4.2), fill_energy=320, rim_pos=(0.0, 3.6, 3.4), rim_energy=760, rim_color=(1.0, 0.75, 0.42), target=(0.0, 0.0, 0.65))

    cam_obj, _ = setup_track_camera(
        [(1, (-1.2, -5.4, 2.35)), (120, (0.05, -5.0, 2.15)), (240, (1.15, -4.65, 2.05))],
        [(1, (-0.35, 0.0, 0.72)), (120, (0.0, 0.15, 0.75)), (240, (0.25, 0.2, 0.78))],
        lens=35.0,
    )

    anc_arch = make_empty("TRK-Archive62", loc=(-1.40, 0.45, 1.35))
    anc_tape = make_empty("TRK-FieldTapes", loc=(1.45, -0.35, 0.95))
    anc_hearth = make_empty("TRK-EternalHearth", loc=(-1.45, -1.35, 0.85))
    finalize_or_probe_scene(
        "B3D-10", cam_obj,
        {"Archive62": anc_arch, "FieldTapes": anc_tape, "EternalHearth": anc_hearth},
        probe_only=probe_only,
    )


if __name__ == "__main__":
    cli = parse_batch_cli()
    builders = {
        "B3D-07": build_b3d_07,
        "B3D-08": build_b3d_08,
        "B3D-09": build_b3d_09,
        "B3D-10": build_b3d_10,
    }
    for sid, fn in builders.items():
        if cli.only_set and sid not in cli.only_set:
            continue
        fn(samples=cli.samples, probe_only=cli.probe_only)
