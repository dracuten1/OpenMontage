#!/usr/bin/env python3
"""Build & render Blender 5.2.2 LTS dioramas B3D-06 through B3D-10 (10 PNGs)."""
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


def build_b3d_06() -> None:
    """B3D-06: Cổng Mặt Trời & Rừng Sáp Đen Tan Chảy (Climax Lớp A)."""
    clear_scene()
    setup_cycles_metal(samples=64)
    setup_world((0.024, 0.014, 0.010), strength=0.32)
    pal = build_palette()
    add_diorama_plinth(pal, radius=4.8)

    # Viscous melted dark-amber wax pool spreading across center
    add_cylinder("GEO-melt-pool-outer", (0, -0.2, 0.06), (3.4, 3.0, 0.09), mat=pal["black_wax"], verts=32)
    add_cylinder("GEO-melt-pool-inner", (0, -0.2, 0.09), (2.2, 1.9, 0.08), mat=pal["amber_wax"], verts=32)

    # Dramatic archway of tall dripping black & amber wax monoliths
    rng = random.Random(7)
    for idx in range(20):
        ang = math.radians(-150 + idx * (300 / 19))
        if -math.radians(28) < ang < math.radians(28):
            continue
        dist = rng.uniform(2.1, 3.6)
        x = dist * math.sin(ang)
        y = dist * math.cos(ang) + 0.3
        h = rng.uniform(1.6, 3.6)
        mat_w = pal["amber_wax"] if abs(x) < 2.2 else pal["black_wax"]
        add_cylinder(f"GEO-monolith-{idx}", (x, y, h * 0.5), (0.28, 0.24, h), rot=(rng.uniform(-0.1, 0.1), rng.uniform(-0.1, 0.1), 0), mat=mat_w, verts=16)

    # Radiant Sun Goddess disc + concentric bronze rays directly down center corridor
    add_cylinder("GEO-sun-goddess-disc", (0, 2.75, 1.85), (1.35, 1.35, 0.16), rot=(math.radians(90), 0, 0), mat=pal["sun_gold"], verts=48)
    add_torus("GEO-sun-ring-1", (0, 2.72, 1.85), major_r=1.55, minor_r=0.04, rot=(math.radians(90), 0, 0), mat=pal["bronze_gong"])
    add_torus("GEO-sun-ring-2", (0, 2.70, 1.85), major_r=1.82, minor_r=0.025, rot=(math.radians(90), 0, 0), mat=pal["copper"])

    # Stylized wooden horse standing beside sunken hero in amber/black wax (clear silhouette, no intersecting box)
    add_box("GEO-horse-body", (-1.05, -0.45, 0.56), (0.32, 0.88, 0.36), rot=(0, 0, math.radians(-24)), mat=pal["ironwood"], bevel=0.06)
    add_box("GEO-horse-neck", (-1.18, -0.08, 0.84), (0.18, 0.24, 0.48), rot=(math.radians(26), 0, math.radians(-24)), mat=pal["ironwood"], bevel=0.04)
    add_box("GEO-horse-head", (-1.28, 0.08, 1.06), (0.16, 0.34, 0.16), rot=(math.radians(18), 0, math.radians(-24)), mat=pal["teak_carved"], bevel=0.03)
    for lx, ly in [(-0.11, -0.32), (0.11, -0.32), (-0.11, 0.32), (0.11, 0.32)]:
        add_cylinder(f"GEO-horse-leg-{lx}-{ly}", (-1.05 + lx, -0.45 + ly, 0.25), (0.045, 0.045, 0.42), mat=pal["ironwood"])
    add_stylized_warrior("damsan-sinking", (0.12, -0.58, 0.06), math.radians(162), pal, armor_mat=pal["teak_carved"], shield_mat=pal["copper"], pose="ready")

    pt = bpy.data.lights.new("LGT-SunCore", type="POINT")
    pt.energy = 2400
    pt.color = (1.0, 0.65, 0.18)
    pobj = bpy.data.objects.new("LGT-SunCore", pt)
    bpy.context.collection.objects.link(pobj)
    pobj.location = (0, 2.1, 1.85)

    add_lighting_rig(key_pos=(3.8, -5.8, 4.8), key_energy=680, key_color=(1.0, 0.78, 0.48), fill_pos=(-5.5, -4.5, 4.2), fill_energy=220, rim_pos=(0.0, 4.0, 4.5), rim_energy=1100, rim_color=(1.0, 0.55, 0.15), target=(0, 0.2, 1.0))

    save_blend("B3D-06-sun-climax")
    render_camera("CAM-06-wide", (1.85, -5.85, 2.35), (0.0, 0.35, 1.1), 35.0, "B3D-06-wide.png", fstop=4.0)
    render_camera("CAM-06-detail", (0.72, -2.55, 1.48), (-0.05, -0.45, 0.85), 52.0, "B3D-06-detail.png", fstop=3.2)


def build_b3d_07() -> None:
    """B3D-07: Ghế Độc Mộc Kpan & Dây Liên Kết Hai Dòng Họ Niê – Mlô."""
    clear_scene()
    setup_cycles_metal(samples=64)
    setup_world((0.030, 0.022, 0.017), strength=0.40)
    pal = build_palette()

    # Timber longhouse floor stage & back slatted bamboo wall
    add_box("GEO-gah-floor", (0, 0, -0.10), (9.5, 6.2, 0.20), mat=pal["ironwood"], bevel=0.02)
    add_box("GEO-gah-backwall", (0, 2.6, 2.1), (9.5, 0.18, 4.4), mat=pal["basalt"], bevel=0.0)
    for si in range(18):
        add_cylinder(f"GEO-slat-{si}", (-3.6 + si * 0.42, 2.45, 2.0), (0.06, 0.06, 4.0), mat=pal["teak_carved"], verts=12)

    # Monolithic hollowed dugout bench Kpan spanning across center heroically
    add_box("GEO-kpan-trunk", (0.0, 0.25, 0.52), (4.85, 0.68, 0.38), mat=pal["teak_carved"], bevel=0.06)
    add_cylinder("GEO-kpan-leg-L", (-1.95, 0.25, 0.20), (0.28, 0.28, 0.36), mat=pal["ironwood"])
    add_cylinder("GEO-kpan-leg-R", (1.95, 0.25, 0.20), (0.28, 0.28, 0.36), mat=pal["ironwood"])

    # Ceramic Ché wine jars lined behind left & right ends
    for ji, jx in enumerate([-2.65, -2.25, 2.25, 2.65]):
        add_cylinder(f"GEO-che-{ji}", (jx, 1.35, 0.42), (0.22, 0.22, 0.84), mat=pal["ceramic_che"], verts=24)
        add_torus(f"GEO-che-rim-{ji}", (jx, 1.35, 0.84), major_r=0.14, minor_r=0.03, mat=pal["bronze_gong"])

    # Two ancestral clan totems (Niê & Mlô) connected by red brocade marriage cord (chuê nuê)
    add_cylinder("GEO-clan-Nie", (-1.55, -0.95, 0.95), (0.22, 0.22, 1.85), mat=pal["teak_carved"], verts=16)
    add_sphere("GEO-clan-Nie-top", (-1.55, -0.95, 1.98), (0.24, 0.24, 0.24), mat=pal["bronze_gong"])
    add_cylinder("GEO-clan-Mlo", (1.55, -0.95, 0.95), (0.22, 0.22, 1.85), mat=pal["ironwood"], verts=16)
    add_sphere("GEO-clan-Mlo-top", (1.55, -0.95, 1.98), (0.24, 0.24, 0.24), mat=pal["copper"])
    # Smooth continuous crimson NURBS cord linking Nie & Mlo totems (chuê nuê)
    curve_data = bpy.data.curves.new("CRV-chue-nue-cord", type="CURVE")
    curve_data.dimensions = "3D"
    curve_data.bevel_depth = 0.036
    curve_data.bevel_resolution = 6
    spline = curve_data.splines.new("NURBS")
    pts = [(-1.55 + (i / 8.0) * 3.10, -0.95, 1.56 - 0.34 * math.sin((i / 8.0) * math.pi), 1.0) for i in range(9)]
    spline.points.add(len(pts) - 1)
    for i, pt_co in enumerate(pts):
        spline.points[i].co = pt_co
    spline.use_endpoint_u = True
    cord_obj = bpy.data.objects.new("GEO-chue-nue-cord", curve_data)
    bpy.context.collection.objects.link(cord_obj)
    cord_obj.data.materials.append(pal["brocade_red"])

    # Glowing hearth right front
    add_box("GEO-hearth-frame", (0.0, -1.65, 0.06), (1.05, 0.85, 0.14), mat=pal["red_soil"])
    add_sphere("GEO-hearth-coal", (0.0, -1.65, 0.15), (0.28, 0.24, 0.10), mat=pal["hearth_ember"])

    pt = bpy.data.lights.new("LGT-KpanHearth", type="POINT")
    pt.energy = 260
    pt.color = (1.0, 0.48, 0.14)
    pobj = bpy.data.objects.new("LGT-KpanHearth", pt)
    bpy.context.collection.objects.link(pobj)
    pobj.location = (0.0, -1.65, 0.65)

    add_lighting_rig(key_pos=(-5.2, -5.2, 4.8), key_energy=950, key_color=(1.0, 0.85, 0.65), fill_pos=(5.5, -4.5, 4.2), fill_energy=280, rim_pos=(0.0, 2.2, 5.2), rim_energy=600, target=(0, 0.0, 0.85))

    save_blend("B3D-07-kpan-matriliny")
    render_camera("CAM-07-wide", (0.2, -5.6, 2.35), (0.0, 0.15, 0.9), 38.0, "B3D-07-wide.png", fstop=4.0)
    render_camera("CAM-07-detail", (-3.1, -3.5, 1.35), (0.0, 0.1, 0.72), 65.0, "B3D-07-detail.png", fstop=2.8)


def build_b3d_08() -> None:
    """B3D-08: Sa bàn Địa hình 3D Tây Nguyên & Luồng Ngôn ngữ Chamic – Môn-Khmer."""
    clear_scene()
    setup_cycles_metal(samples=64)
    setup_world((0.028, 0.025, 0.022), strength=0.45)
    pal = build_palette()

    # Large square museum cartographic table
    add_box("GEO-map-table", (0, 0, -0.20), (10.5, 8.2, 0.40), mat=pal["basalt"], bevel=0.04)
    add_box("GEO-map-ocean", (2.6, 0, 0.02), (4.2, 7.6, 0.06), mat=pal["forest_moss"], bevel=0.01)

    # Stepped topographic highland tiers (Central Highlands plateaus vs coastal strip)
    # Tier 1 coastal Champa plains (right side +X)
    add_box("GEO-coast-plain", (1.2, 0.0, 0.12), (2.4, 6.8, 0.18), mat=pal["paper"], bevel=0.04)
    # Tier 2 Truong Son foothills
    add_box("GEO-highlands-t2", (-0.85, 0.0, 0.28), (3.8, 6.2, 0.24), mat=pal["teak_carved"], bevel=0.06)
    # Tier 3 Dak Lak / Gia Lai / Kon Tum basalt plateaus (400-800m terraced steps)
    for ti, (tx, ty, sx, sy, tz, mat_p) in enumerate([
        (-1.05, 1.75, 2.1, 1.85, 0.52, pal["red_soil"]),   # Northern Kon Tum / Gia Lai plateau
        (-0.85, -0.35, 2.4, 1.95, 0.62, pal["red_soil"]),  # Dak Lak heroic Ede heartland
        (-1.15, -2.15, 1.9, 1.45, 0.72, pal["teak_carved"]), # Lam Dong / Da Lat southern high plateau
    ]):
        add_box(f"GEO-plateau-{ti}", (tx, ty, tz), (sx, sy, 0.34), mat=mat_p, bevel=0.08)

    # Brass marker pins representing the 5 Chamic & surrounding highland centers + coastal arc before 600 BCE
    markers = [
        ("Ede-DakLak", (-0.75, -0.35, 0.96), pal["bronze_gong"], 0.24),
        ("Jarai-GiaLai", (-0.95, 1.55, 0.88), pal["bronze_gong"], 0.18),
        ("Cham-Coast", (1.35, -0.45, 0.36), pal["copper"], 0.20),
        ("Bahnar-North", (-1.45, 1.95, 0.88), pal["forest_moss"], 0.16),
        ("Mnong-South", (-0.95, -1.75, 0.94), pal["forest_moss"], 0.16),
    ]
    for mname, mloc, mmat, mr in markers:
        add_cylinder(f"GEO-pin-{mname}", mloc, (mr, mr, 0.24), mat=mmat, verts=24)
        add_sphere(f"GEO-pin-head-{mname}", (mloc[0], mloc[1], mloc[2] + 0.16), (mr * 0.65, mr * 0.65, mr * 0.65), mat=mmat)

    # Smooth continuous brass NURBS trajectory arc from Champa coast onto Dak Lak highlands
    arc_curve = bpy.data.curves.new("CRV-chamic-arc", type="CURVE")
    arc_curve.dimensions = "3D"
    arc_curve.bevel_depth = 0.045
    arc_curve.bevel_resolution = 6
    arc_spline = arc_curve.splines.new("NURBS")
    arc_pts = [
        (1.85 - (i / 13.0) * 2.55, -0.38 + 0.15 * math.sin((i / 13.0) * math.pi), 0.34 + 1.05 * math.sin((i / 13.0) * math.pi), 1.0)
        for i in range(14)
    ]
    arc_spline.points.add(len(arc_pts) - 1)
    for i, pt_co in enumerate(arc_pts):
        arc_spline.points[i].co = pt_co
    arc_spline.use_endpoint_u = True
    arc_obj = bpy.data.objects.new("GEO-arc-chamic", arc_curve)
    bpy.context.collection.objects.link(arc_obj)
    arc_obj.data.materials.append(pal["bronze_gong"])

    add_lighting_rig(key_pos=(-4.5, -5.5, 6.8), key_energy=1050, key_color=(1.0, 0.90, 0.74), fill_pos=(5.5, -4.5, 5.2), fill_energy=320, rim_pos=(0.0, 5.5, 5.5), rim_energy=640, target=(-0.2, 0.0, 0.65))

    save_blend("B3D-08-topography-chamic")
    render_camera("CAM-08-wide", (1.5, -6.4, 4.85), (-0.25, -0.1, 0.55), 35.0, "B3D-08-wide.png", fstop=5.0)
    render_camera("CAM-08-detail", (1.25, -3.55, 2.35), (-0.35, -0.35, 0.75), 55.0, "B3D-08-detail.png", fstop=3.2)


def build_b3d_09() -> None:
    """B3D-09: Dàn Chiêng Ê Đê Chuẩn (6 Chiêng Bằng + 3 Chiêng Núm + 1 Giữ Nhịp + 1 Trống Cái)."""
    clear_scene()
    setup_cycles_metal(samples=64)
    setup_world((0.025, 0.020, 0.017), strength=0.38)
    pal = build_palette()
    add_diorama_plinth(pal, radius=4.8)

    # Curved ritual timber rack holding the exact 11-instrument Ede ceremonial ensemble
    add_cylinder("GEO-rack-post-L", (-3.15, 0.55, 1.45), (0.14, 0.14, 2.9), mat=pal["ironwood"])
    add_cylinder("GEO-rack-post-R", (3.15, 0.55, 1.45), (0.14, 0.14, 2.9), mat=pal["ironwood"])
    add_cylinder("GEO-rack-beam-top", (0.0, 0.55, 2.68), (0.11, 0.11, 6.7), rot=(0, math.radians(90), 0), mat=pal["teak_carved"])

    # 6 flat gongs (chiêng bằng) left-to-center graduated diameter
    for i in range(6):
        gx = -2.45 + i * 0.62
        r = 0.27 - i * 0.015
        add_cylinder(f"GEO-chieng-bang-{i}", (gx, 0.55, 1.85), (r, r, 0.04), rot=(math.radians(90), 0, 0), mat=pal["bronze_gong"], verts=36)
        add_cylinder(f"GEO-rope-bang-{i}", (gx, 0.55, 2.35), (0.015, 0.015, 0.65), mat=pal["brocade_red"])

    # 3 knobbed boss gongs (chiêng núm) center-right with raised central copper boss
    for i in range(3):
        gx = 1.25 + i * 0.56
        r = 0.30 - i * 0.02
        add_cylinder(f"GEO-chieng-num-{i}", (gx, 0.55, 1.82), (r, r, 0.055), rot=(math.radians(90), 0, 0), mat=pal["bronze_gong"], verts=36)
        add_sphere(f"GEO-num-boss-{i}", (gx, 0.49, 1.82), (r * 0.32, 0.08, r * 0.32), mat=pal["copper"])
        add_cylinder(f"GEO-rope-num-{i}", (gx, 0.55, 2.35), (0.015, 0.015, 0.65), mat=pal["brocade_red"])

    # 1 small rhythm keeper gong (chiêng giữ nhịp) + hanging rope + grounded timber cradle for Trống cái
    add_cylinder("GEO-chieng-nhip", (2.68, 0.55, 1.75), (0.17, 0.17, 0.038), rot=(math.radians(90), 0, 0), mat=pal["copper"], verts=32)
    add_cylinder("GEO-rope-nhip", (2.68, 0.55, 2.22), (0.015, 0.015, 0.85), mat=pal["brocade_red"])
    add_box("GEO-drum-cradle", (-1.75, -1.25, 0.20), (0.68, 0.82, 0.24), rot=(0, 0, math.radians(28)), mat=pal["ironwood"], bevel=0.02)
    add_cylinder("GEO-trong-cai-body", (-1.85, -1.15, 0.68), (0.48, 0.48, 1.15), rot=(math.radians(72), 0, math.radians(28)), mat=pal["teak_carved"], verts=28)
    add_cylinder("GEO-trong-cai-head", (-1.62, -1.68, 0.85), (0.44, 0.44, 0.06), rot=(math.radians(72), 0, math.radians(28)), mat=pal["paper"], verts=28)

    # Warm floor hearth + padded drum beater (positioned cleanly inside wide framing)
    add_sphere("GEO-gong-hearth", (0.25, -1.05, 0.14), (0.34, 0.30, 0.10), mat=pal["hearth_ember"])
    add_cylinder("GEO-mallet", (0.45, -0.85, 0.18), (0.035, 0.035, 0.65), rot=(math.radians(86), 0, math.radians(-35)), mat=pal["ironwood"])
    add_sphere("GEO-mallet-head", (0.28, -1.12, 0.20), (0.07, 0.07, 0.07), mat=pal["brocade_red"])

    add_lighting_rig(key_pos=(-4.5, -5.8, 5.2), key_energy=1150, key_color=(1.0, 0.85, 0.62), fill_pos=(5.5, -5.0, 4.2), fill_energy=280, rim_pos=(0.0, 5.5, 5.5), rim_energy=760, rim_color=(1.0, 0.72, 0.36), target=(0.1, 0.3, 1.45))

    save_blend("B3D-09-gong-ensemble")
    render_camera("CAM-09-wide", (0.45, -6.25, 2.25), (0.15, 0.25, 1.35), 38.0, "B3D-09-wide.png", fstop=4.5)
    render_camera("CAM-09-detail", (2.1, -3.15, 1.85), (1.35, 0.45, 1.75), 65.0, "B3D-09-detail.png", fstop=2.8)


def build_b3d_10() -> None:
    """B3D-10: Kho Tàng 62 Tập, Băng Ghi Âm 90 Phút, Kèn Đing Tut & Bếp Lửa Còn Cháy."""
    clear_scene()
    setup_cycles_metal(samples=64)
    setup_world((0.025, 0.020, 0.017), strength=0.38)
    pal = build_palette()

    # Longhouse plank gallery + open portal framing highland dawn sky beyond
    add_box("GEO-floor-planks", (0, 0, -0.10), (9.5, 6.8, 0.20), mat=pal["ironwood"], bevel=0.02)
    add_box("GEO-door-L", (-3.1, 2.8, 2.1), (3.2, 0.24, 4.4), mat=pal["basalt"], bevel=0.02)
    add_box("GEO-door-R", (3.1, 2.8, 2.1), (3.2, 0.24, 4.4), mat=pal["basalt"], bevel=0.02)
    add_box("GEO-dawn-sky-panel", (0, 4.8, 2.2), (8.0, 0.1, 5.0), mat=pal["amber_wax"], bevel=0.0)

    # Stacked archival volumes representing 62-volume Kho Tang Su Thi Tay Nguyen
    rng = random.Random(99)
    for stack_x, cnt in [(-2.05, 8), (-1.20, 7), (-0.42, 5)]:
        for bi in range(cnt):
            bz = 0.08 + bi * 0.13
            rot_z = rng.uniform(-0.08, 0.08)
            mat_b = pal["brocade_red"] if (bi % 3 == 0) else pal["teak_carved"]
            add_box(f"GEO-vol-{stack_x}-{bi}", (stack_x, 0.25, bz), (0.70, 0.94, 0.11), rot=(0, 0, rot_z), mat=mat_b, bevel=0.012)
            add_box(f"GEO-vol-pages-{stack_x}-{bi}", (stack_x + 0.02, 0.25, bz), (0.65, 0.89, 0.08), rot=(0, 0, rot_z), mat=pal["paper"], bevel=0.004)

    # Fieldwork archive box of 90-minute cassette tapes + loose hero cassette & bamboo flute
    add_box("GEO-tape-crate", (1.25, 0.35, 0.22), (1.40, 0.90, 0.44), rot=(0, 0, math.radians(-12)), mat=pal["ironwood"], bevel=0.02)
    for ti in range(6):
        add_box(f"GEO-tape-{ti}", (0.80 + ti * 0.18, 0.34, 0.48), (0.11, 0.56, 0.24), rot=(0, 0, math.radians(-12)), mat=pal["basalt"], bevel=0.01)
    # Two loose hero cassettes + traditional bamboo ding tut flute foreground right
    add_box("GEO-hero-tape", (0.55, -1.05, 0.08), (0.68, 0.44, 0.12), rot=(0, 0, math.radians(22)), mat=pal["paper"], bevel=0.01)
    for pi in range(5):
        plen = 1.45 - pi * 0.14
        add_cylinder(f"GEO-dingtut-{pi}", (1.55 + pi * 0.07, -1.15, 0.08 + pi * 0.015), (0.028, 0.028, plen), rot=(math.radians(88), 0, math.radians(38)), mat=pal["thatch"])

    # Warm hearth ember stone ring glowing gently foreground left
    add_cylinder("GEO-hearth-ring", (-1.55, -1.35, 0.08), (0.55, 0.55, 0.14), mat=pal["red_soil"], verts=16)
    add_sphere("GEO-hearth-fire", (-1.55, -1.35, 0.16), (0.24, 0.24, 0.11), mat=pal["hearth_ember"])

    pt = bpy.data.lights.new("LGT-DawnArch", type="AREA")
    pt.energy = 850
    pt.size = 2.8
    pt.color = (1.0, 0.72, 0.38)
    pobj = bpy.data.objects.new("LGT-DawnArch", pt)
    bpy.context.collection.objects.link(pobj)
    pobj.location = (0, 3.8, 2.2)

    add_lighting_rig(key_pos=(-4.2, -5.2, 4.6), key_energy=950, key_color=(1.0, 0.86, 0.66), fill_pos=(5.2, -4.5, 4.2), fill_energy=260, rim_pos=(0.0, 3.6, 3.2), rim_energy=720, rim_color=(1.0, 0.75, 0.42), target=(0.0, 0.0, 0.65))

    save_blend("B3D-10-archive-heritage")
    render_camera("CAM-10-wide", (0.15, -5.15, 2.25), (0.0, 0.25, 0.72), 35.0, "B3D-10-wide.png", fstop=4.2)
    render_camera("CAM-10-detail", (1.65, -2.85, 1.35), (0.35, -0.35, 0.25), 65.0, "B3D-10-detail.png", fstop=2.8)


if __name__ == "__main__":
    build_b3d_06()
    build_b3d_07()
    build_b3d_08()
    build_b3d_09()
    build_b3d_10()
    print("ALL B3D-06..B3D-10 COMPLETE!")
