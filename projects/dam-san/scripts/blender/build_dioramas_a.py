#!/usr/bin/env python3
"""Build & render Blender 5.2.2 LTS dioramas B3D-01 through B3D-05 (10 PNGs)."""
from __future__ import annotations

import math
import random
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent))
import bpy  # noqa: E402
from common_blender import (  # noqa: E402
    add_box,
    add_cone,
    add_cylinder,
    add_diorama_plinth,
    add_lighting_rig,
    add_sphere,
    add_stylized_warrior,
    add_torus,
    build_palette,
    clear_scene,
    render_camera,
    save_blend,
    setup_cycles_metal,
    setup_world,
)


def build_b3d_01() -> None:
    """B3D-01: Rừng Sáp Đen & Bình minh Mặt Trời (Black Wax Forest + Sun Goddess)."""
    clear_scene()
    setup_cycles_metal(samples=64)
    setup_world((0.025, 0.018, 0.014), strength=0.35)
    pal = build_palette()
    add_diorama_plinth(pal, radius=4.8)

    # Terraced basalt terrain stepping upward toward sun gate
    for i, r in enumerate([4.3, 3.2, 2.1]):
        add_cylinder(f"GEO-terrace-{i}", (0, 0.35 * i, 0.05 + 0.08 * i), (r, r * 0.85, 0.14), mat=pal["red_soil"], verts=24)

    # Forest of charred dark beeswax + amber translucent melting columns flanking hero path
    rng = random.Random(42)
    for idx in range(28):
        side = -1 if idx % 2 == 0 else 1
        x = side * (0.95 + rng.uniform(0.15, 2.7))
        y = rng.uniform(-2.6, 2.8)
        if (x * x + y * y) ** 0.5 > 4.1:
            continue
        h = rng.uniform(1.1, 3.3)
        r = rng.uniform(0.13, 0.28)
        m = pal["amber_wax"] if (idx % 3 == 0 and y > 0.2) else pal["black_wax"]
        tilt_x = rng.uniform(-0.08, 0.08)
        tilt_y = rng.uniform(-0.08, 0.08)
        add_cylinder(f"GEO-wax-pillar-{idx}", (x, y, h * 0.5 + 0.08), (r, r * 0.9, h), rot=(tilt_x, tilt_y, 0), mat=m, verts=18)
        # Dripping amber pool at base
        add_cylinder(f"GEO-wax-puddle-{idx}", (x, y, 0.12), (r * 1.9, r * 1.6, 0.06), mat=pal["amber_wax"], verts=16)

    # Central glowing Sun Goddess portal disc behind jagged twin basalt ridges
    add_box("GEO-ridge-L", (-1.15, 2.55, 1.3), (1.35, 0.75, 2.4), rot=(0, 0.15, 0.22), mat=pal["basalt"], bevel=0.05)
    add_box("GEO-ridge-R", (1.15, 2.55, 1.3), (1.35, 0.75, 2.4), rot=(0, -0.15, -0.22), mat=pal["basalt"], bevel=0.05)
    add_cylinder("GEO-sun-disc", (0, 3.05, 2.05), (1.15, 1.15, 0.14), rot=(math.radians(90), 0, 0), mat=pal["sun_gold"], verts=48)
    add_torus("GEO-sun-halo", (0, 3.02, 2.05), major_r=1.35, minor_r=0.045, rot=(math.radians(90), 0, 0), mat=pal["bronze_gong"])

    # Stylized carved Dam San approaching along sunlit central corridor
    add_stylized_warrior("damsan", (0.0, -1.45, 0.06), math.radians(180), pal, armor_mat=pal["teak_carved"], shield_mat=pal["bronze_gong"], pose="ready")

    # Warm intense backlight from Sun + dramatic dark forest shadows
    add_lighting_rig(key_pos=(0.0, 2.6, 2.3), key_energy=1800, key_color=(1.0, 0.72, 0.25), fill_pos=(4.5, -5.5, 4.5), fill_energy=240, rim_pos=(-4.5, 1.5, 5.5), rim_energy=450, target=(0, -0.4, 0.9))

    save_blend("B3D-01-black-wax-forest")
    render_camera("CAM-01-wide", (4.8, -6.2, 3.1), (0.0, 0.4, 1.1), 35.0, "B3D-01-wide.png", fstop=4.5)
    render_camera("CAM-01-detail", (-1.75, -3.5, 1.45), (0.0, 0.4, 1.15), 55.0, "B3D-01-detail.png", fstop=2.8)


def build_b3d_02() -> None:
    """B3D-02: Mặt cắt 3D Nhà Dài Ê Đê Hình Thuyền (Cutaway Dring gah – Gah – Ôk & Twin Stairs)."""
    clear_scene()
    setup_cycles_metal(samples=64)
    setup_world((0.032, 0.025, 0.020), strength=0.45)
    pal = build_palette()
    add_diorama_plinth(pal, radius=5.0)

    # Timber floor + foundation pilings (hai hàng cột chính)
    for row_x in (-1.25, 1.25):
        for idx, py in enumerate([-3.2, -2.1, -1.0, 0.1, 1.2, 2.3, 3.4]):
            add_cylinder(f"GEO-piling-{row_x}-{idx}", (row_x, py, 0.45), (0.11, 0.11, 0.85), mat=pal["ironwood"], verts=16)
    # Boat floor platform (Dring gah front terrace at -Y, long hall extending +Y)
    add_box("GEO-floor-main", (0.0, 0.1, 0.88), (2.9, 7.2, 0.14), mat=pal["teak_carved"], bevel=0.02)
    add_box("GEO-dring-gah-railing-L", (-1.40, -2.55, 1.15), (0.08, 1.7, 0.42), mat=pal["ironwood"])
    add_box("GEO-dring-gah-railing-R", (1.40, -2.55, 1.15), (0.08, 1.7, 0.42), mat=pal["ironwood"])

    # Boat-shaped outward-leaning longitudinal walls ("thượng thách - hạ thu") — cutaway right side for diorama view
    add_box("GEO-wall-L", (-1.52, 0.7, 1.75), (0.10, 5.4, 1.68), rot=(0, math.radians(-11), 0), mat=pal["ironwood"], bevel=0.015)
    # Short cutaway lower wall on right side so interior Gah / Kpan / hearth is clearly visible
    add_box("GEO-wall-R-cut", (1.42, 0.7, 1.12), (0.08, 5.4, 0.42), rot=(0, math.radians(10), 0), mat=pal["ironwood"], bevel=0.01)
    # Partition dividing front Gah (public) from back Ôk (private quarters)
    add_box("GEO-partition-Gah-Ok", (-0.15, 1.65, 1.75), (2.4, 0.08, 1.65), mat=pal["teak_carved"], bevel=0.01)
    add_box("GEO-wall-back", (0.0, 3.4, 1.75), (2.8, 0.10, 1.65), mat=pal["ironwood"], bevel=0.015)

    # Steep overhanging boat-prow thatched roof (left slope full, right slope cutaway open)
    add_box("GEO-roof-L", (-0.82, 0.7, 3.15), (2.15, 6.4, 0.14), rot=(0, math.radians(-42), 0), mat=pal["thatch"], bevel=0.03)
    add_box("GEO-roof-ridge", (0.0, 0.7, 3.85), (0.24, 6.7, 0.24), mat=pal["ironwood"], bevel=0.02)
    add_box("GEO-roof-R-top-cut", (0.55, 2.4, 3.35), (1.45, 3.0, 0.12), rot=(0, math.radians(42), 0), mat=pal["thatch"], bevel=0.02)

    # Twin wooden staircases on front Dring gah (mounted solidly onto carved posts + crescent/breast reliefs)
    for st_name, sx in [("stair-female", -0.65), ("stair-male", 0.65)]:
        add_box(f"GEO-{st_name}-plank", (sx, -3.72, 0.45), (0.36, 1.45, 0.10), rot=(math.radians(38), 0, 0), mat=pal["teak_carved"], bevel=0.015)
        for step_i in range(7):
            frac = (step_i + 0.5) / 7.0
            sy = -4.25 + frac * 1.05
            sz = 0.08 + frac * 0.80
            add_box(f"GEO-{st_name}-step-{step_i}", (sx, sy, sz), (0.38, 0.12, 0.06), mat=pal["ironwood"], bevel=0.008)
        # Solid vertical head-post fused down into stair plank + crest finial
        add_box(f"GEO-{st_name}-post", (sx, -3.22, 1.05), (0.28, 0.10, 0.44), mat=pal["teak_carved"], bevel=0.015)
        add_cylinder(f"GEO-{st_name}-crest", (sx, -3.22, 1.24), (0.17, 0.17, 0.09), rot=(math.radians(90), 0, 0), mat=pal["teak_carved"])
        if st_name == "stair-female":
            add_sphere("GEO-stair-relief-L", (sx - 0.07, -3.27, 1.13), (0.065, 0.055, 0.065), mat=pal["teak_carved"])
            add_sphere("GEO-stair-relief-R", (sx + 0.07, -3.27, 1.13), (0.065, 0.055, 0.065), mat=pal["teak_carved"])
            add_torus("GEO-stair-crescent", (sx, -3.27, 1.30), major_r=0.11, minor_r=0.025, rot=(math.radians(90), 0, 0), mat=pal["bronze_gong"])

    # Interior Gah centerpiece: dugout monochrome log bench Kpan, Kpưr gah glowing hearth, ceramic Ché jars, gongs
    add_box("GEO-kpan-bench", (-0.85, -0.35, 1.08), (0.36, 2.75, 0.24), mat=pal["teak_carved"], bevel=0.03)
    add_box("GEO-hearth-box", (0.45, -0.25, 0.99), (0.68, 0.68, 0.12), mat=pal["red_soil"])
    add_sphere("GEO-hearth-ember", (0.45, -0.25, 1.07), (0.20, 0.20, 0.09), mat=pal["hearth_ember"])
    for j in range(4):
        add_cylinder(f"GEO-che-jar-{j}", (-1.05, 0.65 + j * 0.28, 1.14), (0.12, 0.12, 0.34), mat=pal["ceramic_che"], verts=20)
    for g_i in range(3):
        add_cylinder(f"GEO-gah-gong-{g_i}", (-1.36, -1.1 + g_i * 0.45, 1.85), (0.20 - g_i * 0.02, 0.20 - g_i * 0.02, 0.05), rot=(0, math.radians(90), 0), mat=pal["bronze_gong"])

    # Warm hearth point light inside Gah
    pt = bpy.data.lights.new("LGT-HearthGlow", type="POINT")
    pt.energy = 140
    pt.color = (1.0, 0.48, 0.14)
    pobj = bpy.data.objects.new("LGT-HearthGlow", pt)
    bpy.context.collection.objects.link(pobj)
    pobj.location = (0.45, -0.25, 1.45)

    add_lighting_rig(key_pos=(6.5, -5.5, 6.2), key_energy=1150, fill_pos=(-6.0, -5.5, 4.2), fill_energy=290, rim_pos=(0.5, 6.0, 6.5), rim_energy=580, target=(0.0, -0.2, 1.5))

    save_blend("B3D-02-longhouse")
    render_camera("CAM-02-wide", (6.3, -6.1, 3.6), (0.0, -0.3, 1.45), 35.0, "B3D-02-wide.png", fstop=5.0)
    render_camera("CAM-02-detail", (3.6, -2.9, 2.05), (-0.45, -0.35, 1.2), 50.0, "B3D-02-detail.png", fstop=3.2)


def build_b3d_03() -> None:
    """B3D-03: Mtao Mxây Áo Giáp Sắt & Voi Chiến (Iron Chieftain Clash)."""
    clear_scene()
    setup_cycles_metal(samples=64)
    setup_world((0.026, 0.020, 0.017), strength=0.38)
    pal = build_palette()
    add_diorama_plinth(pal, radius=4.6)

    # Courtyard perimeter wooden palisade stumps + hearth sparks
    for i in range(18):
        ang = math.radians(20 * i)
        if -math.radians(125) < ang < -math.radians(55):
            continue
        add_cylinder(f"GEO-palisade-{i}", (3.9 * math.cos(ang), 3.9 * math.sin(ang), 0.55), (0.14, 0.14, 1.15 + (i % 3) * 0.2), mat=pal["ironwood"], verts=12)

    # Carved war elephant (Voi chiến) on right rear with sculpted trunk, ears & timber howdah
    add_box("GEO-ele-body", (1.65, 1.35, 1.05), (1.05, 1.55, 0.92), rot=(0, 0, math.radians(28)), mat=pal["basalt"], bevel=0.18)
    add_sphere("GEO-ele-head", (1.28, 0.45, 1.25), (0.46, 0.50, 0.46), mat=pal["basalt"])
    add_box("GEO-ele-ear-L", (0.85, 0.62, 1.32), (0.12, 0.45, 0.58), rot=(0, math.radians(-18), math.radians(-22)), mat=pal["basalt"], bevel=0.05)
    add_box("GEO-ele-ear-R", (1.72, 0.42, 1.32), (0.12, 0.45, 0.58), rot=(0, math.radians(18), math.radians(22)), mat=pal["basalt"], bevel=0.05)
    # Multi-segment curved trunk dropping down cleanly
    for ti, (ty, tz, trotx, tr) in enumerate([(0.02, 1.12, 45, 0.14), (-0.18, 0.84, 22, 0.11), (-0.28, 0.58, -10, 0.085)]):
        add_cylinder(f"GEO-ele-trunk-{ti}", (1.18 - ti * 0.04, ty, tz), (tr, tr, 0.36), rot=(math.radians(trotx), 0, math.radians(22)), mat=pal["basalt"])
    for lx, ly in [(-0.35, -0.45), (0.35, -0.45), (-0.35, 0.45), (0.35, 0.45)]:
        add_cylinder(f"GEO-ele-leg-{lx}-{ly}", (1.65 + lx * 0.8, 1.35 + ly * 0.9, 0.42), (0.17, 0.17, 0.85), mat=pal["basalt"])
    add_cone("GEO-ele-tusk-L", (0.98, 0.02, 0.95), r1=0.06, r2=0.01, depth=0.68, rot=(math.radians(105), 0, math.radians(-15)), mat=pal["paper"])
    add_cone("GEO-ele-tusk-R", (1.38, 0.08, 0.95), r1=0.06, r2=0.01, depth=0.68, rot=(math.radians(105), 0, math.radians(-25)), mat=pal["paper"])
    add_box("GEO-ele-howdah", (1.65, 1.35, 1.68), (0.72, 0.88, 0.42), rot=(0, 0, math.radians(28)), mat=pal["teak_carved"], bevel=0.04)

    # Clash in foreground: Dam San (carved wood + bronze shield) vs Mtao Mxay (iron armor + iron shield)
    add_stylized_warrior("damsan", (-1.15, -0.55, 0.06), math.radians(-78), pal, armor_mat=pal["teak_carved"], shield_mat=pal["bronze_gong"], pose="attack")
    add_stylized_warrior("mtaomxay", (0.75, -0.45, 0.06), math.radians(105), pal, armor_mat=pal["iron_armor"], shield_mat=pal["iron_armor"], pose="ready")
    # Fallen heavy pestle + grounded timber stand holding hero bronze gong
    add_cylinder("GEO-pestle", (-0.15, -0.95, 0.14), (0.08, 0.08, 0.88), rot=(math.radians(82), 0, math.radians(24)), mat=pal["ironwood"])
    add_cylinder("GEO-gong-stand-L", (-0.68, 0.55, 0.65), (0.06, 0.06, 1.25), mat=pal["ironwood"])
    add_cylinder("GEO-gong-stand-R", (0.48, 0.55, 0.65), (0.06, 0.06, 1.25), mat=pal["ironwood"])
    add_cylinder("GEO-gong-stand-top", (-0.10, 0.55, 1.22), (0.05, 0.05, 1.32), rot=(0, math.radians(90), 0), mat=pal["teak_carved"])
    add_cylinder("GEO-gong-cord-L", (-0.28, 0.55, 1.05), (0.014, 0.014, 0.35), mat=pal["brocade_red"])
    add_cylinder("GEO-gong-cord-R", (0.08, 0.55, 1.05), (0.014, 0.014, 0.35), mat=pal["brocade_red"])
    add_cylinder("GEO-hero-gong", (-0.10, 0.55, 0.72), (0.44, 0.44, 0.07), rot=(math.radians(90), 0, 0), mat=pal["bronze_gong"])

    add_lighting_rig(key_pos=(-4.8, -5.8, 5.5), key_energy=1250, key_color=(1.0, 0.82, 0.58), fill_pos=(6.0, -4.5, 4.5), fill_energy=260, rim_pos=(0.0, 5.5, 5.2), rim_energy=820, rim_color=(1.0, 0.65, 0.35), target=(-0.1, 0.0, 0.9))

    save_blend("B3D-03-mtao-mxay-clash")
    render_camera("CAM-03-wide", (-0.5, -5.9, 2.35), (0.1, 0.15, 0.95), 40.0, "B3D-03-wide.png", fstop=4.0)
    render_camera("CAM-03-detail", (-0.25, -3.15, 1.35), (0.55, -0.35, 0.95), 75.0, "B3D-03-detail.png", fstop=2.5)


def build_b3d_04() -> None:
    """B3D-04: Bàn lưu trữ BEFEO 1933 vs 7 Thẻ Tù trưởng & Cuộn băng điền dã."""
    clear_scene()
    setup_cycles_metal(samples=64)
    setup_world((0.030, 0.024, 0.019), strength=0.42)
    pal = build_palette()

    # Large dark oak scholar's table instead of round plinth
    add_box("GEO-table-top", (0, 0, -0.15), (10.5, 7.5, 0.30), mat=pal["ironwood"], bevel=0.04)
    add_box("GEO-backdrop-archival", (0, 6.2, 3.2), (18.0, 0.4, 12.0), mat=pal["basalt"], bevel=0.0)

    # Open BEFEO 1933 manuscript folio on left
    add_box("GEO-book-cover", (-1.55, -0.25, 0.04), (2.55, 1.85, 0.08), rot=(0, 0, math.radians(-8)), mat=pal["brocade_red"], bevel=0.02)
    add_box("GEO-page-L", (-2.12, -0.20, 0.11), (1.12, 1.68, 0.07), rot=(0, math.radians(4), math.radians(-8)), mat=pal["paper"], bevel=0.015)
    add_box("GEO-page-R", (-0.98, -0.34, 0.11), (1.12, 1.68, 0.07), rot=(0, math.radians(-4), math.radians(-8)), mat=pal["paper"], bevel=0.015)
    # Two red wax censorship seal bars over left page ("Sabatier cut")
    add_box("GEO-redact-1", (-2.12, 0.05, 0.16), (0.82, 0.14, 0.03), rot=(0, math.radians(4), math.radians(-8)), mat=pal["brocade_red"])
    add_box("GEO-redact-2", (-2.10, -0.32, 0.16), (0.76, 0.14, 0.03), rot=(0, math.radians(4), math.radians(-8)), mat=pal["brocade_red"])

    # Brass archival loupe magnifying glass resting on corner of page
    add_torus("GEO-loupe-ring", (-0.65, -0.82, 0.19), major_r=0.34, minor_r=0.035, mat=pal["bronze_gong"])
    add_cylinder("GEO-loupe-handle", (-0.15, -1.25, 0.18), (0.045, 0.045, 0.72), rot=(math.radians(88), 0, math.radians(48)), mat=pal["teak_carved"])

    # 8 Stepped wooden chieftain archive tablets rising left-to-right (2 highlighted crimson/gold + 6 recovered teal/bronze)
    for idx in range(8):
        x = 0.75 + (idx % 4) * 0.62
        y = 0.55 - (idx // 4) * 1.15
        h = 0.42 + idx * 0.10
        mat_tab = pal["bronze_gong"] if idx in (2, 3) else pal["teak_carved"]
        add_box(f"GEO-tablet-{idx}", (x, y, h * 0.5), (0.44, 0.18, h), rot=(0, 0, math.radians(-6 + idx * 1.5)), mat=mat_tab, bevel=0.015)
        add_cylinder(f"GEO-tablet-cap-{idx}", (x, y, h + 0.02), (0.07, 0.07, 0.04), mat=pal["copper"])

    # Vintage field cassette reel standing beside recovered tablets
    add_box("GEO-cassette-shell", (2.15, -1.55, 0.14), (1.05, 0.66, 0.24), rot=(0, 0, math.radians(14)), mat=pal["basalt"], bevel=0.02)
    add_cylinder("GEO-cassette-reelL", (1.92, -1.60, 0.27), (0.14, 0.14, 0.04), mat=pal["paper"])
    add_cylinder("GEO-cassette-reelR", (2.38, -1.50, 0.27), (0.14, 0.14, 0.04), mat=pal["paper"])

    add_lighting_rig(key_pos=(-3.5, -4.5, 5.2), key_energy=950, key_color=(1.0, 0.87, 0.68), fill_pos=(5.0, -4.0, 4.5), fill_energy=280, rim_pos=(0.5, 4.5, 4.5), rim_energy=520, target=(0.2, -0.3, 0.35))

    save_blend("B3D-04-archival-strata")
    render_camera("CAM-04-wide", (-0.15, -4.65, 3.35), (0.15, -0.25, 0.25), 40.0, "B3D-04-wide.png", fstop=4.5)
    render_camera("CAM-04-detail", (1.35, -3.25, 1.95), (1.35, -0.15, 0.45), 65.0, "B3D-04-detail.png", fstop=2.8)


def build_b3d_05() -> None:
    """B3D-05: Cây Thần Smuk / Ktu Gãy Đổ (Shattered Sacred Tree)."""
    clear_scene()
    setup_cycles_metal(samples=64)
    setup_world((0.020, 0.026, 0.024), strength=0.40)
    pal = build_palette()
    add_diorama_plinth(pal, radius=4.8)

    # Mossy undulating forest platform + clean miniature longhouses with gabled thatched eaves
    add_cylinder("GEO-forest-ground", (0, 0, 0.04), (4.4, 4.4, 0.14), mat=pal["forest_moss"], verts=32)
    for hi, (hx, hy, hrot) in enumerate([(-2.35, -1.75, 0.42), (2.45, -1.55, -0.48), (2.15, 1.75, 0.25)]):
        add_box(f"GEO-mini-hut-{hi}", (hx, hy, 0.36), (0.62, 1.25, 0.42), rot=(0, 0, hrot), mat=pal["ironwood"], bevel=0.02)
        add_box(f"GEO-mini-roof-L-{hi}", (hx - 0.18 * math.cos(hrot), hy - 0.18 * math.sin(hrot), 0.72), (0.56, 1.42, 0.08), rot=(0, math.radians(-38), hrot), mat=pal["thatch"], bevel=0.02)
        add_box(f"GEO-mini-roof-R-{hi}", (hx + 0.18 * math.cos(hrot), hy + 0.18 * math.sin(hrot), 0.72), (0.56, 1.42, 0.08), rot=(0, math.radians(38), hrot), mat=pal["thatch"], bevel=0.02)

    # Giant jagged stump with spreading roots at (-1.5, 0.5)
    add_cylinder("GEO-smuk-stump", (-1.55, 0.45, 0.62), (0.64, 0.58, 1.15), mat=pal["ironwood"], verts=14)
    for ri in range(7):
        ang = math.radians(51 * ri)
        add_box(f"GEO-root-{ri}", (-1.55 + 0.68 * math.cos(ang), 0.45 + 0.68 * math.sin(ang), 0.22), (0.24, 1.02, 0.26), rot=(math.radians(24), 0, ang), mat=pal["ironwood"], bevel=0.05)

    # Shattered multi-branch trunk crashing diagonally + irregular rocky/mossy canopy mass (displaced & varied)
    add_cylinder("GEO-smuk-fallen-trunk", (0.12, 0.05, 0.52), (0.48, 0.44, 3.65), rot=(math.radians(78), math.radians(-10), math.radians(-68)), mat=pal["ironwood"], verts=14)
    add_cylinder("GEO-smuk-branch-1", (1.25, 0.35, 0.85), (0.20, 0.18, 1.55), rot=(math.radians(65), math.radians(20), math.radians(-35)), mat=pal["ironwood"], verts=12)
    add_cylinder("GEO-smuk-branch-2", (1.45, -0.45, 0.78), (0.18, 0.16, 1.35), rot=(math.radians(72), math.radians(-25), math.radians(-92)), mat=pal["ironwood"], verts=12)
    # Multi-layered botanical foliage puffs (14 organic varied mounds instead of 4 giant balls)
    rng_t = random.Random(21)
    for ci in range(14):
        cx = 1.75 + rng_t.uniform(-0.85, 0.95)
        cy = -0.05 + rng_t.uniform(-0.95, 0.85)
        cz = 0.55 + rng_t.uniform(0.05, 0.75)
        cr = rng_t.uniform(0.32, 0.58)
        m_leaf = pal["forest_moss"] if ci % 2 == 0 else pal["thatch"]
        add_sphere(f"GEO-canopy-{ci}", (cx, cy, cz), (cr * 1.15, cr * 0.95, cr * 0.78), mat=m_leaf, segs=16)

    # Ceremonial bronze axe embedded into splintered stump break
    add_box("GEO-axe-head", (-1.22, 0.25, 1.08), (0.36, 0.14, 0.18), rot=(0.2, 0.35, -0.4), mat=pal["bronze_gong"], bevel=0.015)
    add_cylinder("GEO-axe-handle", (-1.35, -0.15, 1.24), (0.045, 0.045, 1.05), rot=(math.radians(62), 0, math.radians(-18)), mat=pal["teak_carved"])

    add_lighting_rig(key_pos=(-4.5, -5.5, 6.2), key_energy=1050, key_color=(0.94, 0.92, 0.86), fill_pos=(5.5, -4.5, 4.5), fill_energy=320, fill_color=(0.68, 0.88, 0.85), rim_pos=(-1.0, 5.5, 5.5), rim_energy=680, rim_color=(1.0, 0.78, 0.45), target=(0.0, 0.0, 0.85))

    save_blend("B3D-05-smuk-tree")
    render_camera("CAM-05-wide", (4.5, -6.2, 3.3), (0.1, 0.0, 0.85), 32.0, "B3D-05-wide.png", fstop=4.5)
    render_camera("CAM-05-detail", (-3.1, -3.2, 1.85), (-1.15, 0.3, 0.95), 60.0, "B3D-05-detail.png", fstop=2.8)


if __name__ == "__main__":
    build_b3d_01()
    build_b3d_02()
    build_b3d_03()
    build_b3d_04()
    build_b3d_05()
    print("ALL B3D-01..B3D-05 COMPLETE!")
