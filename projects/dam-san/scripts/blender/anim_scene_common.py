#!/usr/bin/env python3
"""Shared helpers for one-way animated Blender + BlenderKit explainer scenes."""
from __future__ import annotations

import argparse
import json
import shutil
import subprocess
import sys
import time
from pathlib import Path

import bpy
from mathutils import Euler, Vector

from blenderkit_lib import append_normalized
from rigged_actors import export_screen_tracks, set_interp

OM = Path("/Users/tuyennguyen/project/OpenMontage")
PROJ = OM / "projects" / "dam-san"
BLEND_ANIM_DIR = PROJ / "assets" / "blender_anim"
QC_PROBE_DIR = PROJ / "qc" / "anim_probes"
TMP_ROOT = PROJ / "tmp_frames"
TRACKS_DIR = OM / "remotion-composer" / "src" / "dam-san" / "tracks"
VIDEO_DIR = OM / "remotion-composer" / "public" / "dam-san" / "blender" / "video"


def make_empty(name: str, loc=(0.0, 0.0, 0.0), rot=(0.0, 0.0, 0.0), parent=None) -> bpy.types.Object:
    e = bpy.data.objects.new(name, None)
    e.empty_display_type = "PLAIN_AXES"
    e.empty_display_size = 0.1
    bpy.context.collection.objects.link(e)
    e.location = Vector(loc)
    e.rotation_euler = Euler(rot, "XYZ")
    if parent is not None:
        e.parent = parent
    return e


def attach(obj: bpy.types.Object, parent: bpy.types.Object) -> bpy.types.Object:
    obj.parent = parent
    return obj


def set_visible_shadow(root_obj: bpy.types.Object, enabled: bool) -> None:
    """Toggle shadow casting across an object hierarchy (ideal for 175k-poly foliage)."""
    for o in [root_obj, *root_obj.children_recursive]:
        if o.type == "MESH":
            o.visible_shadow = enabled


def disable_fill_rim_shadows() -> None:
    """Keep primary key light shadows active while skipping shadow maps on fill/rim area lights for fast EEVEE."""
    for name in ("LGT-Fill", "LGT-Rim"):
        lobj = bpy.data.objects.get(name)
        if lobj and lobj.type == "LIGHT" and hasattr(lobj.data, "use_shadow"):
            lobj.data.use_shadow = False


def instance_baked_bk(
    blend_path: Path,
    base_name: str,
    placements: list[tuple[tuple[float, float, float], float, float]],
    *,
    material_override=None,
    override_all: bool = False,
    disable_shadows: bool = False,
) -> list[bpy.types.Object]:
    """Append & bake a BlenderKit asset once, then lightweight-instance copies across placements=(loc, target_height, rot_z)."""
    out: list[bpy.types.Object] = []
    if not placements:
        return out

    loc0, th0, rz0 = placements[0]
    first = append_normalized(
        blend_path,
        f"{base_name}-0",
        target_height=th0,
        loc=loc0,
        rot_z=rz0,
        material_override=material_override,
        override_all=override_all,
        bake_geonodes=True,
    )
    if disable_shadows:
        set_visible_shadow(first, False)
    out.append(first)
    if len(placements) == 1:
        return out

    # Collect subtree under first (`BK-<base_name>-0` -> `BK-Inner-...` -> mesh children)
    coll = bpy.context.scene.collection

    def _clone_hierarchy(src_obj: bpy.types.Object, suffix: str, new_parent) -> bpy.types.Object:
        copy = src_obj.copy()
        copy.name = f"{src_obj.name}{suffix}"
        # Share baked mesh datablock across instances for fast EEVEE BVH & low RAM
        coll.objects.link(copy)
        if new_parent is not None:
            copy.parent = new_parent
        for ch in src_obj.children:
            _clone_hierarchy(ch, suffix, copy)
        return copy

    for idx, (loc, th, rz) in enumerate(placements[1:], start=1):
        clone_outer = _clone_hierarchy(first, f"-inst{idx}", None)
        ratio = th / max(th0, 1e-4)
        clone_outer.location = Vector(loc)
        clone_outer.rotation_euler = (0.0, 0.0, rz)
        clone_outer.scale = (ratio, ratio, ratio)
        if disable_shadows:
            set_visible_shadow(clone_outer, False)
        out.append(clone_outer)

    return out


def setup_track_camera(
    cam_keys: list[tuple[int, tuple[float, float, float]]],
    target_keys: list[tuple[int, tuple[float, float, float]]],
    *,
    lens: float = 36.0,
) -> tuple[bpy.types.Object, bpy.types.Object]:
    """Create damped animated camera + Track-To target Empty."""
    cam_target = make_empty("CAM-TARGET", loc=target_keys[0][1])
    for f, tloc in target_keys:
        cam_target.location = Vector(tloc)
        cam_target.keyframe_insert("location", frame=f)
    set_interp(cam_target, "BEZIER")

    cam_data = bpy.data.cameras.new("CAM-ANIM")
    cam_data.lens = lens
    cam_obj = bpy.data.objects.new("CAM-ANIM", cam_data)
    bpy.context.collection.objects.link(cam_obj)
    track = cam_obj.constraints.new(type="TRACK_TO")
    track.target = cam_target
    track.track_axis = "TRACK_NEGATIVE_Z"
    track.up_axis = "UP_Y"

    for f, cloc in cam_keys:
        cam_obj.location = Vector(cloc)
        cam_obj.keyframe_insert("location", frame=f)
    set_interp(cam_obj, "BEZIER")
    bpy.context.scene.camera = cam_obj
    return cam_obj, cam_target


def anim_rising_embers(prefix: str, cx: float, cy: float, z0: float, pal: dict, count: int = 8) -> None:
    """Animate subtle rising embers above a hearth or brazier (safe via Empty scale)."""
    from common_blender import add_sphere

    for ei in range(count):
        piv = make_empty(f"{prefix}-ember-piv-{ei}", loc=(cx, cy, z0))
        add_sphere(f"{prefix}-ember-{ei}", (0, 0, 0), (0.028, 0.028, 0.028), mat=pal["spark_gold"], segs=8).parent = piv
        t_off = ei * 22
        for k in range(5):
            f_start = ((t_off + k * 48) % 210) + 1
            f_end = min(240, f_start + 38)
            ex = cx + ((ei % 3) - 1) * 0.14
            ey = cy + (((ei + 1) % 3) - 1) * 0.12
            piv.location = (cx + (ei - count / 2) * 0.03, cy, z0)
            piv.scale = (0.01, 0.01, 0.01)
            piv.keyframe_insert("location", frame=f_start)
            piv.keyframe_insert("scale", frame=f_start)

            piv.location = (ex, ey, z0 + 0.52 + (ei % 3) * 0.12)
            piv.scale = (1.1, 1.1, 1.1)
            piv.keyframe_insert("location", frame=min(240, (f_start + f_end) // 2))
            piv.keyframe_insert("scale", frame=min(240, (f_start + f_end) // 2))

            piv.scale = (0.01, 0.01, 0.01)
            piv.keyframe_insert("scale", frame=f_end)
        set_interp(piv, "LINEAR")


def finalize_or_probe_scene(
    scene_id: str,
    cam_obj: bpy.types.Object,
    anchors: dict[str, bpy.types.Object],
    *,
    probe_only: bool = False,
    frame_end: int = 240,
) -> None:
    """Save .blend, export 240-frame screen tracks, and either render 3 QC probes or full 240f -> 30fps MP4."""
    disable_fill_rim_shadows()
    BLEND_ANIM_DIR.mkdir(parents=True, exist_ok=True)
    TRACKS_DIR.mkdir(parents=True, exist_ok=True)
    VIDEO_DIR.mkdir(parents=True, exist_ok=True)
    QC_PROBE_DIR.mkdir(parents=True, exist_ok=True)

    blend_out = BLEND_ANIM_DIR / f"{scene_id}-anim.blend"
    bpy.ops.wm.save_as_mainfile(filepath=str(blend_out))
    export_screen_tracks(bpy.context.scene, cam_obj, anchors, 1, frame_end, TRACKS_DIR / f"{scene_id}.json")

    scene = bpy.context.scene
    if probe_only:
        for pf in (24, 120, 216):
            scene.frame_set(pf)
            out_jpg = QC_PROBE_DIR / f"{scene_id}_f{pf:03d}.jpg"
            scene.render.filepath = str(out_jpg)
            t0 = time.time()
            bpy.ops.render.render(write_still=True)
            print(f"PROBE {scene_id} f={pf}: {time.time() - t0:.2f}s -> {out_jpg.name}")
        return

    tmp_dir = TMP_ROOT / scene_id
    if tmp_dir.exists():
        shutil.rmtree(tmp_dir)
    tmp_dir.mkdir(parents=True, exist_ok=True)

    scene.render.filepath = str(tmp_dir / "frame_")
    t0 = time.time()
    bpy.ops.render.render(animation=True)
    elapsed = time.time() - t0
    frames = sorted(tmp_dir.glob("frame_*.jpg"))
    print(f"RENDERED {scene_id}: {len(frames)} frames in {elapsed:.2f}s ({elapsed / max(1, len(frames)):.3f} s/f)")
    assert len(frames) == frame_end, f"Expected {frame_end} frames for {scene_id}, got {len(frames)}"

    out_mp4 = VIDEO_DIR / f"{scene_id}-clip.mp4"
    subprocess.run(
        [
            "ffmpeg", "-y", "-loglevel", "error",
            "-framerate", "24",
            "-i", str(tmp_dir / "frame_%04d.jpg"),
            "-vf", "fps=30,format=yuv420p",
            "-an",
            "-c:v", "libx264", "-preset", "medium", "-crf", "18",
            "-g", "15", "-movflags", "+faststart",
            str(out_mp4),
        ],
        check=True,
    )
    shutil.rmtree(tmp_dir)

    probe = subprocess.run(
        [
            "ffprobe", "-v", "error", "-select_streams", "v:0",
            "-show_entries", "stream=width,height,r_frame_rate,nb_frames",
            "-show_entries", "format=duration,size",
            "-of", "json", str(out_mp4),
        ],
        capture_output=True, text=True, check=True,
    )
    print(f"SAVED & PROBED {out_mp4.name}: {probe.stdout.strip()}")


def parse_batch_cli() -> argparse.Namespace:
    argv = sys.argv[sys.argv.index("--") + 1 :] if "--" in sys.argv else []
    ap = argparse.ArgumentParser()
    ap.add_argument("--only", action="append", default=[], help="Scene IDs e.g. B3D-01 or comma-separated")
    ap.add_argument("--probe-only", action="store_true", help="Render frames 24, 120, 216 only")
    ap.add_argument("--samples", type=int, default=12)
    args = ap.parse_args(argv)
    expanded: set[str] = set()
    for item in args.only:
        for tok in item.split(","):
            tok = tok.strip()
            if tok:
                expanded.add(tok)
    args.only_set = expanded
    return args
