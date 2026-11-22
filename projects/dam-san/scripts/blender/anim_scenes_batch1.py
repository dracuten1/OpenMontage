#!/usr/bin/env python3
"""Animated one-way Blender + BlenderKit scenes batch 1: B3D-01, B3D-04, B3D-05, B3D-06 (240f @ 24fps)."""
from __future__ import annotations

import math
import random
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent))
import bpy  # noqa: E402
from mathutils import Euler, Vector  # noqa: E402

from anim_scene_common import (  # noqa: E402
    attach,
    finalize_or_probe_scene,
    instance_baked_bk,
    make_empty,
    parse_batch_cli,
    set_visible_shadow,
    setup_track_camera,
)
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
    anim_sit_talk,
    anim_walk,
    build_anim_palette,
    create_articulated_actor,
    set_interp,
    setup_eevee_fast,
)


def build_b3d_01(samples: int = 12, probe_only: bool = False) -> None:
    """B3D-01: Rừng Sáp Đen & Cổng Mặt Trời (Đăm Săn marches into Black Wax Forest, Sun Goddess flares)."""
    clear_scene()
    setup_eevee_fast(samples=samples, frame_end=240)
    setup_world((0.024, 0.017, 0.013), strength=0.36)
    pal = build_anim_palette()
    add_diorama_plinth(pal, radius=5.4)

    for i, r in enumerate([4.8, 3.6, 2.3]):
        add_cylinder(f"GEO-terrace-{i}", (0, 0.35 * i, 0.05 + 0.07 * i), (r, r * 0.85, 0.14), mat=pal["red_soil"], verts=24)

    # Charred & amber dripping black-wax columns + rising puddles (keep center sightline clear!)
    rng = random.Random(42)
    puddle_pivs = []
    for idx in range(22):
        side = -1 if idx % 2 == 0 else 1
        x = side * (1.25 + rng.uniform(0.25, 2.55))
        y = rng.uniform(-2.4, 2.8)
        if y < -0.2 and abs(x) < 1.95:
            x = side * (1.95 + rng.uniform(0.2, 1.4))
        if (x * x + y * y) ** 0.5 > 4.4:
            continue
        h = rng.uniform(1.1, 3.1)
        r = rng.uniform(0.13, 0.26)
        m = pal["amber_wax"] if (idx % 3 == 0 and y > 0.0) else pal["black_wax"]
        add_cylinder(
            f"GEO-wax-col-{idx}", (x, y, h * 0.5 + 0.08), (r, r * 0.9, h),
            rot=(rng.uniform(-0.07, 0.07), rng.uniform(-0.07, 0.07), 0), mat=m, verts=16,
        )
        piv = make_empty(f"Pivot-WaxPuddle-{idx}", loc=(x, y, 0.12))
        attach(add_cylinder(f"GEO-wax-pool-{idx}", (0, 0, 0), (r * 1.9, r * 1.6, 0.06), mat=pal["amber_wax"], verts=16), piv)
        puddle_pivs.append(piv)

    for piv in puddle_pivs:
        for f, sc in [(1, 0.72), (110, 0.85), (210, 1.38), (240, 1.45)]:
            piv.scale = (sc, sc, 1.0)
            piv.keyframe_insert("scale", frame=f)
        set_interp(piv, "BEZIER")

    # Twin basalt gate ridges framing radiant Sun Goddess disc + rotating halo
    add_box("GEO-ridge-L", (-1.35, 2.75, 1.35), (1.35, 0.78, 2.55), rot=(0, 0.15, 0.22), mat=pal["basalt"], bevel=0.05)
    add_box("GEO-ridge-R", (1.35, 2.75, 1.35), (1.35, 0.78, 2.55), rot=(0, -0.15, -0.22), mat=pal["basalt"], bevel=0.05)

    piv_sun = make_empty("Pivot-SunGate", loc=(0, 3.15, 1.55))
    attach(add_cylinder("GEO-sun-disc", (0, 0, 0), (1.22, 1.22, 0.14), rot=(math.radians(90), 0, 0), mat=pal["sun_gold"], verts=48), piv_sun)
    halo = attach(add_torus("GEO-sun-halo", (0, -0.05, 0), major_r=1.45, minor_r=0.048, rot=(math.radians(90), 0, 0), mat=pal["bronze_gong"]), piv_sun)
    for f, sz in [(1, 1.55), (110, 1.95), (200, 2.35), (240, 2.40)]:
        piv_sun.location.z = sz
        piv_sun.keyframe_insert("location", frame=f)
    set_interp(piv_sun, "BEZIER")
    for f, ry in [(1, 0.0), (120, math.radians(180)), (240, math.radians(360))]:
        halo.rotation_euler.y = ry
        halo.keyframe_insert("rotation_euler", frame=f)
    set_interp(halo, "LINEAR")

    # BlenderKit baked trees darkened to match black-wax forest perimeter
    bk_tree = search_and_download("stylized_tree", "stylized tree")
    instance_baked_bk(
        bk_tree,
        "WaxTree",
        [
            ((-3.6, 2.9, 0.05), 3.6, 0.5),
            ((3.7, 2.8, 0.05), 3.7, 1.8),
            ((-4.0, -0.4, 0.05), 3.3, 2.6),
            ((4.0, -0.5, 0.05), 3.4, 3.7),
        ],
        material_override=pal["black_wax"],
        override_all=False,
    )

    # Articulated Dam San facing +Y (180deg) marching toward Sun Gate, raising shield, kneeling under glare
    ds = create_articulated_actor("DamSan", (0.0, -2.25, 0.06), math.radians(180), pal, role="damsan", armed=True)
    anim_blink(ds, [18, 96, 175])
    anim_walk(ds, 1, 128, (0.0, -2.25, 0.06), (0.0, 0.35, 0.08), stride_frames=14, swing=0.48)

    # Shield defense -> knee drop at high glare (f=128..240)
    ds["pelvis"].location.z = 0.50
    ds["pelvis"].keyframe_insert("location", frame=128)
    ds["pelvis"].location.z = 0.36
    ds["pelvis"].keyframe_insert("location", frame=205)
    ds["pelvis"].keyframe_insert("location", frame=240)
    set_interp(ds["pelvis"], "BEZIER")

    ds["hipL"].rotation_euler.x = 0.0
    ds["hipR"].rotation_euler.x = 0.0
    ds["hipL"].keyframe_insert("rotation_euler", frame=130)
    ds["hipR"].keyframe_insert("rotation_euler", frame=130)
    ds["hipL"].rotation_euler.x = -1.15
    ds["hipR"].rotation_euler.x = 0.55
    ds["hipL"].keyframe_insert("rotation_euler", frame=205)
    ds["hipR"].keyframe_insert("rotation_euler", frame=205)
    set_interp(ds["hipL"], "BEZIER")
    set_interp(ds["hipR"], "BEZIER")

    for f, sl_e, sr_e, tor_x in [
        (128, (-0.15, 0.0, 0.0), (-0.25, 0.0, 0.0), 0.0),
        (165, (-1.15, 0.45, 0.25), (-0.55, 0.0, 0.0), -0.15),
        (215, (-1.45, 0.65, 0.35), (0.25, 0.0, 0.0), -0.28),
        (240, (-1.45, 0.65, 0.35), (0.25, 0.0, 0.0), -0.28),
    ]:
        ds["shoulderL"].rotation_euler = Euler(sl_e, "XYZ")
        ds["shoulderR"].rotation_euler = Euler(sr_e, "XYZ")
        ds["torso"].rotation_euler.x = tor_x
        ds["shoulderL"].keyframe_insert("rotation_euler", frame=f)
        ds["shoulderR"].keyframe_insert("rotation_euler", frame=f)
        ds["torso"].keyframe_insert("rotation_euler", frame=f)
    set_interp(ds["shoulderL"], "BEZIER")
    set_interp(ds["shoulderR"], "BEZIER")
    set_interp(ds["torso"], "BEZIER")

    # Sun surge point light
    sun_lgt = bpy.data.lights.new("LGT-SunSurge", type="POINT")
    sun_lgt.color = (1.0, 0.72, 0.24)
    sobj = bpy.data.objects.new("LGT-SunSurge", sun_lgt)
    bpy.context.collection.objects.link(sobj)
    sobj.location = (0.0, 2.5, 2.2)
    for f, eng in [(1, 1400), (110, 1900), (195, 3600), (240, 3800)]:
        sun_lgt.energy = eng
        sun_lgt.keyframe_insert("energy", frame=f)
    set_interp(sun_lgt, "BEZIER")

    add_lighting_rig(key_pos=(4.5, -5.8, 5.0), key_energy=780, key_color=(1.0, 0.80, 0.50), fill_pos=(-4.8, -5.0, 4.2), fill_energy=290, rim_pos=(0.0, 4.5, 5.2), rim_energy=820, target=(0, 0.4, 1.0))

    cam_obj, _ = setup_track_camera(
        [(1, (4.6, -5.8, 3.0)), (120, (3.1, -5.4, 2.6)), (240, (1.6, -4.7, 2.15))],
        [(1, (0.0, -0.6, 1.0)), (120, (0.0, 0.6, 1.15)), (240, (0.0, 1.4, 1.45))],
        lens=35.0,
    )

    anc_sun = make_empty("TRK-SunPortal", loc=(0.0, 0.0, 1.15), parent=piv_sun)
    anc_wax = make_empty("TRK-WaxForest", loc=(-1.85, 0.35, 1.85))
    finalize_or_probe_scene(
        "B3D-01", cam_obj,
        {"DamSan": ds["label_anchor"], "SunPortal": anc_sun, "WaxForest": anc_wax},
        probe_only=probe_only,
    )


def build_b3d_04(samples: int = 12, probe_only: bool = False) -> None:
    """B3D-04: Địa tầng văn bản BEFEO 1933 (censor seals lift, loupe scans, 6 missing tablets + cassette animate)."""
    clear_scene()
    setup_eevee_fast(samples=samples, frame_end=240)
    setup_world((0.030, 0.023, 0.018), strength=0.42)
    pal = build_anim_palette()
    from common_blender import make_noise_material
    table_mat = make_noise_material("MAT-table-matte", (0.14, 0.075, 0.042), roughness=0.76, bump_strength=0.18, noise_scale=28.0, coat_weight=0.0)

    add_box("GEO-table-top", (0, 0, -0.15), (11.5, 8.0, 0.30), mat=table_mat, bevel=0.04)
    add_box("GEO-backdrop-wall", (0, 6.2, 3.2), (18.0, 0.4, 12.0), mat=pal["basalt"], bevel=0.0)

    # BlenderKit Vintage Folio + Open BEFEO 1933 Spread Left (all neatly inside left frame)
    bk_book = search_and_download("old_book", "vintage book")
    append_normalized(bk_book, "BEFEO-Ledger", target_max_dim=1.25, loc=(-2.25, 1.45, 0.0), rot_z=math.radians(-14))

    add_box("GEO-book-cover", (-1.45, -0.35, 0.04), (2.35, 1.70, 0.07), rot=(0, 0, math.radians(-8)), mat=pal["brocade_red"], bevel=0.02)
    add_box("GEO-page-L", (-1.98, -0.29, 0.10), (1.04, 1.56, 0.06), rot=(0, math.radians(4), math.radians(-8)), mat=pal["paper"], bevel=0.012)
    add_box("GEO-page-R", (-0.92, -0.43, 0.10), (1.04, 1.56, 0.06), rot=(0, math.radians(-4), math.radians(-8)), mat=pal["paper"], bevel=0.012)

    # Two Red Wax Censorship Bars lifting off the folio (Sabatier 1933 edits exposed)
    seal_pivs = []
    for si, (sx, sy) in enumerate([(-1.98, -0.02), (-1.96, -0.42)]):
        piv_s = make_empty(f"Pivot-Redact-{si}", loc=(sx, sy, 0.15), rot=(0, math.radians(4), math.radians(-8)))
        attach(add_box(f"GEO-redact-{si}", (0, 0, 0), (0.82, 0.14, 0.03), mat=pal["brocade_red"], bevel=0.008), piv_s)
        seal_pivs.append((piv_s, sx, sy))
    for si, (piv_s, sx, sy) in enumerate(seal_pivs):
        f0 = 24 + si * 14
        piv_s.location = (sx, sy, 0.15)
        piv_s.rotation_euler = Euler((0, math.radians(4), math.radians(-8)), "XYZ")
        piv_s.scale = (1.0, 1.0, 1.0)
        piv_s.keyframe_insert("location", frame=f0)
        piv_s.keyframe_insert("rotation_euler", frame=f0)
        piv_s.keyframe_insert("scale", frame=f0)

        piv_s.location = (sx - 0.35, sy + 0.35, 1.15)
        piv_s.rotation_euler = Euler((math.radians(-22), math.radians(18), math.radians(28)), "XYZ")
        piv_s.scale = (0.01, 0.01, 0.01)
        piv_s.keyframe_insert("location", frame=f0 + 48)
        piv_s.keyframe_insert("rotation_euler", frame=f0 + 48)
        piv_s.keyframe_insert("scale", frame=f0 + 48)
        set_interp(piv_s, "BEZIER")

    # Sliding Brass Magnifying Loupe across folio
    piv_loupe = make_empty("Pivot-Loupe", loc=(-2.25, -0.60, 0.19))
    attach(add_torus("GEO-loupe-ring", (0, 0, 0), major_r=0.33, minor_r=0.035, mat=pal["bronze_gong"]), piv_loupe)
    attach(add_cylinder("GEO-loupe-handle", (0.42, -0.38, -0.01), (0.042, 0.042, 0.65), rot=(math.radians(88), 0, math.radians(48)), mat=pal["teak_carved"]), piv_loupe)
    for f, lp in [(1, (-2.25, -0.60, 0.22)), (45, (-1.85, -0.25, 0.25)), (95, (-1.05, -0.35, 0.24)), (140, (-0.55, -0.82, 0.19)), (240, (-0.55, -0.82, 0.19))]:
        piv_loupe.location = Vector(lp)
        piv_loupe.keyframe_insert("location", frame=f)
    set_interp(piv_loupe, "BEZIER")

    # 8 Chieftain Tablets: first 2 already up (Sabatier), remaining 6 rise cleanly in staggered cascade!
    anc_t8 = None
    for idx in range(8):
        tx = 0.65 + (idx % 4) * 0.64
        ty = 0.62 - (idx // 4) * 1.18
        h = 0.45 + idx * 0.095
        piv_t = make_empty(f"Pivot-Tablet-{idx}", loc=(tx, ty, 0.0), rot=(0, 0, math.radians(-6 + idx * 1.5)))
        mat_tab = pal["teak_carved"] if idx < 2 else pal["bronze_gong"]
        attach(add_box(f"GEO-tablet-{idx}", (0, 0, h * 0.5), (0.44, 0.18, h), mat=mat_tab, bevel=0.015), piv_t)
        attach(add_cylinder(f"GEO-tablet-cap-{idx}", (0, 0, h + 0.02), (0.075, 0.075, 0.045), mat=pal["copper"]), piv_t)
        if idx >= 2:
            fs = 76 + (idx - 2) * 14
            piv_t.location.z = -h - 0.15
            piv_t.scale = (0.85, 0.85, 0.05)
            piv_t.keyframe_insert("location", frame=1)
            piv_t.keyframe_insert("scale", frame=1)
            piv_t.keyframe_insert("location", frame=fs)
            piv_t.keyframe_insert("scale", frame=fs)

            piv_t.location.z = 0.0
            piv_t.scale = (1.0, 1.0, 1.0)
            piv_t.keyframe_insert("location", frame=fs + 24)
            piv_t.keyframe_insert("scale", frame=fs + 24)
            set_interp(piv_t, "BEZIER")
        if idx == 7:
            anc_t8 = make_empty("TRK-Tablets8", loc=(0.0, 0.0, h + 0.30), parent=piv_t)

    # BlenderKit TDK Cassette cleanly positioned inside lower-right with subtle archival lift motion
    bk_cas = search_and_download("cassette", "cassette tape")
    piv_cas = make_empty("Pivot-Cassette", loc=(1.85, -1.20, 0.02), rot=(0, 0, math.radians(-14)))
    append_normalized(bk_cas, "FieldCassette", target_max_dim=0.98, loc=(0, 0, 0), parent=piv_cas)
    for f, dz, rx in [(1, 0.0, 0.0), (120, 0.06, math.radians(8)), (240, 0.02, math.radians(4))]:
        piv_cas.location.z = 0.02 + dz
        piv_cas.rotation_euler.x = rx
        piv_cas.keyframe_insert("location", frame=f)
        piv_cas.keyframe_insert("rotation_euler", frame=f)
    set_interp(piv_cas, "BEZIER")

    add_lighting_rig(key_pos=(-3.5, -4.5, 5.4), key_energy=1050, key_color=(1.0, 0.88, 0.70), fill_pos=(5.0, -4.2, 4.6), fill_energy=320, rim_pos=(0.5, 4.5, 4.8), rim_energy=580, target=(0.2, -0.3, 0.35))

    cam_obj, _ = setup_track_camera(
        [(1, (-0.95, -4.85, 3.15)), (90, (0.05, -5.05, 3.25)), (240, (0.95, -4.85, 2.95))],
        [(1, (-0.85, -0.20, 0.22)), (110, (0.20, -0.15, 0.36)), (240, (0.95, -0.25, 0.42))],
        lens=36.0,
    )

    anc_b = make_empty("TRK-BEFEO1933", loc=(-1.55, -0.25, 0.75))
    anc_c = make_empty("TRK-Cassette", loc=(0.0, 0.0, 0.72), parent=piv_cas)
    finalize_or_probe_scene(
        "B3D-04", cam_obj,
        {"BEFEO1933": anc_b, "Tablets8": anc_t8, "Cassette": anc_c},
        probe_only=probe_only,
    )


def build_b3d_05(samples: int = 12, probe_only: bool = False) -> None:
    """B3D-05: Cây Thần Smuk / Ktu Gãy Đổ (Đăm Săn swings BK Axe, tree crashes, Yàng Sky Beam opens)."""
    clear_scene()
    setup_eevee_fast(samples=samples, frame_end=240)
    setup_world((0.020, 0.025, 0.023), strength=0.40)
    pal = build_anim_palette()
    add_diorama_plinth(pal, radius=5.4)
    add_cylinder("GEO-forest-ground", (0, 0, 0.04), (4.9, 4.9, 0.14), mat=pal["forest_moss"], verts=32)

    # Three miniature thatched huts at right/back
    for hi, (hx, hy, hrot) in enumerate([(2.45, -1.55, -0.48), (2.35, 1.55, 0.28), (1.35, 2.55, 0.15)]):
        add_box(f"GEO-mini-hut-{hi}", (hx, hy, 0.36), (0.62, 1.25, 0.42), rot=(0, 0, hrot), mat=pal["ironwood"], bevel=0.02)
        add_box(f"GEO-mini-roof-L-{hi}", (hx - 0.18 * math.cos(hrot), hy - 0.18 * math.sin(hrot), 0.72), (0.56, 1.42, 0.08), rot=(0, math.radians(-38), hrot), mat=pal["thatch"], bevel=0.02)
        add_box(f"GEO-mini-roof-R-{hi}", (hx + 0.18 * math.cos(hrot), hy + 0.18 * math.sin(hrot), 0.72), (0.56, 1.42, 0.08), rot=(0, math.radians(38), hrot), mat=pal["thatch"], bevel=0.02)

    # Background BlenderKit forest canopy (original green alpha textures, shadow maps disabled for fast EEVEE)
    bk_tree = search_and_download("stylized_tree", "stylized tree")
    instance_baked_bk(
        bk_tree,
        "ForestBG",
        [
            ((-3.6, 2.5, 0.08), 3.4, 0.4),
            ((-1.4, 3.8, 0.08), 3.7, 1.6),
            ((3.4, 2.7, 0.08), 3.3, 2.9),
        ],
        disable_shadows=True,
    )

    # Fixed Smuk Stump + Roots
    add_cylinder("GEO-smuk-stump", (-1.55, 0.25, 0.38), (0.56, 0.52, 0.68), mat=pal["ironwood"], verts=14)
    for ri in range(7):
        ang = math.radians(51 * ri)
        add_box(f"GEO-root-{ri}", (-1.55 + 0.58 * math.cos(ang), 0.25 + 0.58 * math.sin(ang), 0.18), (0.20, 0.88, 0.22), rot=(math.radians(22), 0, ang), mat=pal["ironwood"], bevel=0.04)

    # Falling Smuk Upper Trunk & Foliage Crown Pivot
    piv_smuk = make_empty("Pivot-SmukFall", loc=(-1.55, 0.25, 0.68))
    attach(add_cylinder("GEO-smuk-trunk", (0, 0, 1.50), (0.42, 0.38, 3.10), mat=pal["ironwood"], verts=14), piv_smuk)
    attach(add_cylinder("GEO-smuk-limb-1", (0.35, 0.10, 2.35), (0.14, 0.14, 1.15), rot=(0, math.radians(42), 0), mat=pal["ironwood"], verts=10), piv_smuk)
    attach(add_cylinder("GEO-smuk-limb-2", (-0.30, -0.15, 2.45), (0.12, 0.12, 1.05), rot=(math.radians(-30), math.radians(-35), 0), mat=pal["ironwood"], verts=10), piv_smuk)
    smuk_crown = append_normalized(bk_tree, "SmukCrown", target_height=2.9, loc=(0.05, 0.0, 2.05), parent=piv_smuk)
    set_visible_shadow(smuk_crown, False)

    for f, rot_e in [
        (1, (0.0, 0.0, 0.0)),
        (82, (0.0, math.radians(4), 0.0)),
        (115, (math.radians(8), math.radians(28), math.radians(-12))),
        (146, (math.radians(14), math.radians(80), math.radians(-22))),
        (154, (math.radians(12), math.radians(76), math.radians(-22))),
        (240, (math.radians(12), math.radians(76), math.radians(-22))),
    ]:
        piv_smuk.rotation_euler = Euler(rot_e, "XYZ")
        piv_smuk.keyframe_insert("rotation_euler", frame=f)
    set_interp(piv_smuk, "BEZIER")

    # Chopping Wood-Chip Spark Bursts (f=38, 76) & Tree-Crash Dust Clouds (f=142..188)
    for ci, bf in enumerate((38, 76)):
        sp_grp = make_empty(f"Pivot-ChopSparks-{ci}", loc=(-1.18, 0.22, 0.72))
        for si in range(6):
            ang = math.radians(60 * si)
            s = add_box(f"VFX-chop-sp-{ci}-{si}", (0, 0, 0), (0.05, 0.10, 0.02), mat=pal["spark_gold"], bevel=0.004)
            s.parent = sp_grp
            s.keyframe_insert("location", frame=bf)
            s.location = (0.35 * math.cos(ang), 0.35 * math.sin(ang), 0.22 + (si % 2) * 0.15)
            s.keyframe_insert("location", frame=bf + 12)
            set_interp(s, "BEZIER")
        for f, sc in [(1, 0.001), (bf - 1, 0.001), (bf + 1, 1.0), (bf + 14, 0.001), (240, 0.001)]:
            sp_grp.scale = (sc, sc, sc)
            sp_grp.keyframe_insert("scale", frame=f)
        set_interp(sp_grp, "LINEAR")

    dust_piv = make_empty("Pivot-TreeDust", loc=(1.15, -0.35, 0.35))
    for di in range(6):
        ang = math.radians(di * 60)
        attach(add_sphere(f"VFX-tree-dust-{di}", (0.65 * math.cos(ang), 0.55 * math.sin(ang), 0.15 * (di % 2)), (0.38, 0.35, 0.28), mat=pal["dust_warm"], segs=12), dust_piv)
    for f, sc in [(1, 0.001), (140, 0.001), (150, 0.85), (178, 1.55), (205, 0.001), (240, 0.001)]:
        dust_piv.scale = (sc, sc, sc)
        dust_piv.keyframe_insert("scale", frame=f)
    set_interp(dust_piv, "BEZIER")

    # Articulated Dam San on left facing Smuk Trunk holding BlenderKit Axe pointing forward
    ds = create_articulated_actor("DamSan", (-2.45, -0.25, 0.08), math.radians(118), pal, role="damsan", armed=False)
    bk_axe = search_and_download("axe", "wooden axe")
    axe_wrist = make_empty("Pivot-AxeGrip", loc=(0.02, -0.05, -0.34), rot=(math.radians(82), 0.0, 0.0), parent=ds["shoulderR"])
    append_normalized(bk_axe, "DamSanAxe", target_height=0.78, loc=(0.0, 0.0, -0.18), parent=axe_wrist)
    # Wives in clear courtyard in front of village huts (no hut clipping!)
    w1 = create_articulated_actor("HNhik", (0.82, -2.05, 0.08), math.radians(-28), pal, role="woman", armed=False)
    w2 = create_articulated_actor("HBhik", (1.42, -2.25, 0.08), math.radians(-18), pal, role="woman", armed=False)
    anim_blink(ds, [14, 108, 195])
    anim_blink(w1, [22, 148])
    anim_blink(w2, [34, 152])

    # Chop swings -> recoil as tree falls -> lift axe skyward at f=160..240
    for f, sr_e, tor_e in [
        (1, (math.radians(-20), 0.0, 0.0), (0.0, 0.0, 0.0)),
        (24, (math.radians(-135), -0.35, 0.2), (-0.12, 0.0, 0.15)),
        (38, (math.radians(-35), 0.25, -0.15), (0.18, 0.0, -0.15)),
        (62, (math.radians(-138), -0.35, 0.2), (-0.12, 0.0, 0.15)),
        (76, (math.radians(-32), 0.25, -0.15), (0.18, 0.0, -0.15)),
        (115, (math.radians(-20), 0.0, 0.0), (-0.10, 0.0, 0.0)),
        (178, (math.radians(-148), 0.15, 0.0), (-0.20, 0.0, 0.0)),
        (240, (math.radians(-142), 0.15, 0.0), (-0.18, 0.0, 0.0)),
    ]:
        ds["shoulderR"].rotation_euler = Euler(sr_e, "XYZ")
        ds["torso"].rotation_euler = Euler(tor_e, "XYZ")
        ds["shoulderR"].keyframe_insert("rotation_euler", frame=f)
        ds["torso"].keyframe_insert("rotation_euler", frame=f)
    set_interp(ds["shoulderR"], "BEZIER")
    set_interp(ds["torso"], "BEZIER")

    # Sky Beam cone (Yàng heaven portal opening cleanly after f=154; zero needle before!)
    piv_sky = make_empty("Pivot-SkyBeam", loc=(-2.35, -0.25, 0.08))
    beam_obj = attach(add_cone("VFX-sky-beam", (0, 0, 2.3), r1=1.15, r2=0.22, depth=4.6, mat=pal["yang_beam"], verts=24), piv_sky)
    beam_obj.hide_render = True
    beam_obj.keyframe_insert("hide_render", frame=1)
    beam_obj.keyframe_insert("hide_render", frame=153)
    beam_obj.hide_render = False
    beam_obj.keyframe_insert("hide_render", frame=154)
    beam_obj.keyframe_insert("hide_render", frame=240)
    for f, sc in [(1, (0.0, 0.0, 0.0)), (153, (0.0, 0.0, 0.0)), (154, (0.05, 0.05, 1.0)), (174, (1.0, 1.0, 1.0)), (240, (1.08, 1.08, 1.0))]:
        piv_sky.scale = sc
        piv_sky.keyframe_insert("scale", frame=f)
    set_interp(piv_sky, "BEZIER")

    add_lighting_rig(key_pos=(-4.8, -5.8, 6.2), key_energy=1150, key_color=(0.98, 0.90, 0.78), fill_pos=(5.8, -4.5, 4.6), fill_energy=360, rim_pos=(-1.0, 5.5, 5.8), rim_energy=760, target=(0.0, 0.0, 0.9))

    cam_obj, _ = setup_track_camera(
        [(1, (4.3, -6.1, 3.0)), (120, (3.2, -5.8, 2.75)), (240, (1.6, -5.5, 3.65))],
        [(1, (-0.3, 0.1, 1.15)), (140, (0.2, -0.1, 0.95)), (240, (-0.8, -0.1, 1.85))],
        lens=34.0,
    )

    anc_tree = make_empty("TRK-SmukTree", loc=(0.0, 0.0, 2.15), parent=piv_smuk)
    anc_sky = make_empty("TRK-SkyBeam", loc=(-2.35, -0.25, 2.65))
    finalize_or_probe_scene(
        "B3D-05", cam_obj,
        {"SmukTree": anc_tree, "DamSan": ds["label_anchor"], "SkyBeam": anc_sky},
        probe_only=probe_only,
    )


def build_b3d_06(samples: int = 12, probe_only: bool = False) -> None:
    """B3D-06: Cổng Mặt Trời & Rừng Sáp Đen Tan Chảy (Wax spreads, BlenderKit Horse & Đăm Săn sink, golden SoulFly rises)."""
    clear_scene()
    setup_eevee_fast(samples=samples, frame_end=240)
    setup_world((0.024, 0.015, 0.011), strength=0.34)
    pal = build_anim_palette()
    add_diorama_plinth(pal, radius=5.4)

    # Expanding melting black/amber wax pools
    add_cylinder("GEO-melt-outer", (0, -0.25, 0.06), (3.8, 3.3, 0.09), mat=pal["black_wax"], verts=32)
    piv_amber = make_empty("Pivot-AmberMelt", loc=(0, -0.25, 0.09))
    attach(add_cylinder("GEO-melt-amber", (0, 0, 0), (2.3, 2.0, 0.08), mat=pal["amber_wax"], verts=32), piv_amber)
    for f, sc in [(1, 0.42), (75, 0.65), (165, 1.25), (240, 1.38)]:
        piv_amber.scale = (sc, sc, 1.0)
        piv_amber.keyframe_insert("scale", frame=f)
    set_interp(piv_amber, "BEZIER")

    # Dripping wax monolith archway (back & far flanks open to clear center sightline)
    rng = random.Random(7)
    for idx in range(18):
        ang = math.radians(-148 + idx * (296 / 17))
        if -math.radians(32) < ang < math.radians(32):
            continue
        dist = rng.uniform(2.5, 4.0)
        x = dist * math.sin(ang)
        y = dist * math.cos(ang) + 0.35
        if y < -0.5 and abs(x) < 2.2:
            continue
        h = rng.uniform(1.6, 3.4)
        mat_w = pal["amber_wax"] if abs(x) < 2.4 else pal["black_wax"]
        add_cylinder(f"GEO-monolith-{idx}", (x, y, h * 0.5), (0.26, 0.24, h), rot=(rng.uniform(-0.1, 0.1), rng.uniform(-0.1, 0.1), 0), mat=mat_w, verts=16)

    # Blazing Sun Goddess disc + 2 counter-rotating bronze halos
    add_cylinder("GEO-sun-goddess-disc", (0, 2.95, 2.00), (1.38, 1.38, 0.16), rot=(math.radians(90), 0, 0), mat=pal["sun_gold"], verts=48)
    ring1 = add_torus("GEO-sun-ring-1", (0, 2.91, 2.00), major_r=1.58, minor_r=0.042, rot=(math.radians(90), 0, 0), mat=pal["bronze_gong"])
    ring2 = add_torus("GEO-sun-ring-2", (0, 2.88, 2.00), major_r=1.86, minor_r=0.026, rot=(math.radians(90), 0, 0), mat=pal["copper"])
    for f, a1, a2 in [(1, 0.0, 0.0), (120, math.radians(180), math.radians(-180)), (240, math.radians(360), math.radians(-360))]:
        ring1.rotation_euler.y = a1
        ring2.rotation_euler.y = a2
        ring1.keyframe_insert("rotation_euler", frame=f)
        ring2.keyframe_insert("rotation_euler", frame=f)
    set_interp(ring1, "LINEAR")
    set_interp(ring2, "LINEAR")

    # BlenderKit Rearing War Horse (carved teak sculpture look, pedestal sunken into wax pool)
    bk_horse = search_and_download("horse", "horse")
    piv_horse = make_empty("Pivot-Horse", loc=(-1.25, -0.55, 0.05), rot=(0, 0, math.radians(-32)))
    append_normalized(bk_horse, "SteedMount", target_height=1.72, loc=(0, 0, -0.10), parent=piv_horse, material_override=pal["teak_carved"], override_all=True)
    for f, dz, rx in [(1, 0.0, 0.0), (50, 0.08, math.radians(-6)), (105, -0.12, math.radians(8)), (175, -0.45, math.radians(16)), (240, -0.50, math.radians(16))]:
        piv_horse.location.z = 0.05 + dz
        piv_horse.rotation_euler.x = rx
        piv_horse.keyframe_insert("location", frame=f)
        piv_horse.keyframe_insert("rotation_euler", frame=f)
    set_interp(piv_horse, "BEZIER")

    # Articulated Dam San reaching upward then slowly sinking into wax
    ds = create_articulated_actor("DamSan", (0.28, -0.65, 0.06), math.radians(162), pal, role="damsan", armed=True)
    anim_blink(ds, [12, 85])
    for f, dz, sr_e, sl_e, hd_x in [
        (1, 0.06, (-0.35, 0, 0), (-0.25, 0, 0), 0.0),
        (55, 0.06, (math.radians(-135), 0.15, 0), (math.radians(-110), -0.15, 0), -0.25),
        (115, -0.16, (math.radians(-125), 0.2, 0), (math.radians(-95), -0.2, 0), -0.20),
        (175, -0.54, (math.radians(-70), 0.1, 0), (math.radians(-65), -0.1, 0), -0.10),
        (240, -0.58, (math.radians(-65), 0.1, 0), (math.radians(-60), -0.1, 0), -0.10),
    ]:
        ds["root"].location.z = dz
        ds["shoulderR"].rotation_euler = Euler(sr_e, "XYZ")
        ds["shoulderL"].rotation_euler = Euler(sl_e, "XYZ")
        ds["head"].rotation_euler.x = hd_x
        ds["root"].keyframe_insert("location", frame=f)
        ds["shoulderR"].keyframe_insert("rotation_euler", frame=f)
        ds["shoulderL"].keyframe_insert("rotation_euler", frame=f)
        ds["head"].keyframe_insert("rotation_euler", frame=f)
    for o in (ds["root"], ds["shoulderR"], ds["shoulderL"], ds["head"]):
        set_interp(o, "BEZIER")

    # Glowing Golden Soul Fly ("hóa ruồi nhập H'Âng") rising smoothly after f=162
    piv_fly = make_empty("Pivot-SoulFly", loc=(0.28, -0.65, 0.85))
    attach(add_sphere("VFX-soul-fly", (0, 0, 0), (0.075, 0.075, 0.075), mat=pal["spark_gold"], segs=12), piv_fly)
    attach(add_torus("VFX-soul-halo", (0, 0, 0), major_r=0.14, minor_r=0.015, rot=(math.radians(90), 0, 0), mat=pal["gong_ring"]), piv_fly)
    for f, floc, sc in [
        (1, (0.28, -0.65, 0.85), 0.001),
        (160, (0.28, -0.65, 0.72), 0.001),
        (172, (0.35, -0.68, 1.15), 1.0),
        (205, (0.95, -0.80, 1.75), 1.15),
        (240, (1.45, -0.70, 2.25), 1.2),
    ]:
        piv_fly.location = Vector(floc)
        piv_fly.scale = (sc, sc, sc)
        piv_fly.keyframe_insert("location", frame=f)
        piv_fly.keyframe_insert("scale", frame=f)
    set_interp(piv_fly, "BEZIER")

    sun_core = bpy.data.lights.new("LGT-SunCore", type="POINT")
    sun_core.energy = 2400
    sun_core.color = (1.0, 0.65, 0.18)
    pobj = bpy.data.objects.new("LGT-SunCore", sun_core)
    bpy.context.collection.objects.link(pobj)
    pobj.location = (0, 2.2, 2.0)

    add_lighting_rig(key_pos=(3.8, -5.8, 4.8), key_energy=760, key_color=(1.0, 0.80, 0.50), fill_pos=(-5.5, -4.5, 4.2), fill_energy=260, rim_pos=(0.0, 4.0, 4.5), rim_energy=1100, rim_color=(1.0, 0.55, 0.15), target=(0, 0.2, 1.0))

    cam_obj, _ = setup_track_camera(
        [(1, (2.1, -6.5, 2.55)), (120, (1.3, -6.1, 2.35)), (240, (0.55, -5.75, 2.20))],
        [(1, (-0.15, 0.15, 0.95)), (160, (0.05, 0.25, 0.92)), (240, (0.25, 0.10, 1.15))],
        lens=33.0,
    )

    anc_sun = make_empty("TRK-SunGoddess", loc=(0.0, 2.85, 2.15))
    anc_wax = make_empty("TRK-WaxPool", loc=(-0.85, -1.15, 0.25))
    anc_fly = make_empty("TRK-SoulFly", loc=(0.0, 0.0, 0.25), parent=piv_fly)
    finalize_or_probe_scene(
        "B3D-06", cam_obj,
        {"SunGoddess": anc_sun, "DamSan": ds["label_anchor"], "WaxPool": anc_wax, "SoulFly": anc_fly},
        probe_only=probe_only,
    )


if __name__ == "__main__":
    cli = parse_batch_cli()
    builders = {
        "B3D-01": build_b3d_01,
        "B3D-04": build_b3d_04,
        "B3D-05": build_b3d_05,
        "B3D-06": build_b3d_06,
    }
    for sid, fn in builders.items():
        if cli.only_set and sid not in cli.only_set:
            continue
        fn(samples=cli.samples, probe_only=cli.probe_only)
