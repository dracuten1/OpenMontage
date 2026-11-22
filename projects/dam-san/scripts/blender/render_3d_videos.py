#!/usr/bin/env python3
"""Render 10 animated 3D Blender EEVEE Raytracing (1080p, AgX) video clips from existing B3D-01..B3D-10 .blend scenes."""
from __future__ import annotations

import argparse
import json
import math
import shutil
import subprocess
import sys
import time
from pathlib import Path

import bpy
import bpy_extras.anim_utils as anim_utils
from mathutils import Vector

OM = Path("/Users/tuyennguyen/project/OpenMontage")
BLEND_DIR = OM / "projects" / "dam-san" / "assets" / "blender"
TMP_FRAMES_DIR = OM / "projects" / "dam-san" / "tmp_frames"
OUT_VIDEO_DIR = OM / "remotion-composer" / "public" / "dam-san" / "blender" / "video"

# Exact camera & shot table from plan
SHOTS = [
    {
        "id": "B3D-01",
        "blend": "B3D-01-black-wax-forest.blend",
        "start": (5.0, -6.0, 3.2),
        "mid": (3.6, -6.1, 2.9),
        "end": (1.8, -5.6, 2.55),
        "target": (0.0, 0.4, 1.1),
        "lens": 35.0,
        "fstop": 4.5,
    },
    {
        "id": "B3D-02",
        "blend": "B3D-02-longhouse.blend",
        "start": (6.6, -5.8, 3.8),
        "mid": (5.1, -6.3, 3.25),
        "end": (3.4, -6.2, 2.65),
        "target": (0.0, -0.3, 1.45),
        "lens": 35.0,
        "fstop": 5.0,
    },
    {
        "id": "B3D-03",
        "blend": "B3D-03-mtao-mxay-clash.blend",
        "start": (-1.8, -5.8, 2.2),
        "mid": (-0.1, -6.0, 2.35),
        "end": (1.6, -5.5, 2.45),
        "target": (0.1, 0.15, 0.95),
        "lens": 40.0,
        "fstop": 4.0,
    },
    {
        "id": "B3D-04",
        "blend": "B3D-04-archival-strata.blend",
        "start": (-1.4, -4.6, 3.4),
        "mid": (0.0, -4.75, 3.25),
        "end": (1.4, -4.4, 3.0),
        "target": (0.15, -0.25, 0.25),
        "lens": 40.0,
        "fstop": 4.5,
    },
    {
        "id": "B3D-05",
        "blend": "B3D-05-smuk-tree.blend",
        "start": (4.8, -6.1, 2.4),
        "mid": (3.7, -6.4, 3.15),
        "end": (2.2, -6.3, 3.9),
        "target": (0.1, 0.0, 0.95),
        "lens": 32.0,
        "fstop": 4.5,
    },
    {
        "id": "B3D-06",
        "blend": "B3D-06-sun-climax.blend",
        "start": (2.4, -6.0, 2.45),
        "mid": (1.4, -5.6, 2.2),
        "end": (0.4, -4.9, 1.95),
        "target": (0.0, 0.35, 1.1),
        "lens": 35.0,
        "fstop": 4.0,
    },
    {
        "id": "B3D-07",
        "blend": "B3D-07-kpan-matriliny.blend",
        "start": (-1.8, -5.5, 2.3),
        "mid": (0.0, -5.8, 2.25),
        "end": (1.8, -5.4, 2.2),
        "target": (0.0, 0.15, 0.9),
        "lens": 38.0,
        "fstop": 4.0,
    },
    {
        "id": "B3D-08",
        "blend": "B3D-08-topography-chamic.blend",
        "start": (2.6, -6.3, 5.0),
        "mid": (0.6, -6.5, 4.75),
        "end": (-1.4, -6.2, 4.4),
        "target": (-0.25, -0.1, 0.55),
        "lens": 35.0,
        "fstop": 5.0,
    },
    {
        "id": "B3D-09",
        "blend": "B3D-09-gong-ensemble.blend",
        "start": (-1.5, -6.1, 2.15),
        "mid": (0.2, -6.3, 2.25),
        "end": (1.9, -5.9, 2.35),
        "target": (0.15, 0.25, 1.35),
        "lens": 38.0,
        "fstop": 4.5,
    },
    {
        "id": "B3D-10",
        "blend": "B3D-10-archive-heritage.blend",
        "start": (-1.5, -5.0, 2.35),
        "mid": (0.05, -5.2, 2.2),
        "end": (1.6, -4.9, 2.05),
        "target": (0.0, 0.25, 0.72),
        "lens": 35.0,
        "fstop": 4.2,
    },
]


def set_bezier_autoclamped(anim_owner) -> None:
    """Apply BEZIER + AUTO_CLAMPED handles using Blender 5.2 channelbag API."""
    ad = getattr(anim_owner, "animation_data", None)
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
            kp.interpolation = "BEZIER"
            kp.handle_left_type = "AUTO_CLAMPED"
            kp.handle_right_type = "AUTO_CLAMPED"


def setup_eevee_video(samples: int = 16, frame_end: int = 96) -> None:
    scene = bpy.context.scene
    scene.render.engine = "BLENDER_EEVEE"
    scene.eevee.taa_render_samples = samples
    scene.eevee.use_raytracing = True
    if hasattr(scene.eevee, "ray_tracing_options"):
        scene.eevee.ray_tracing_options.resolution_scale = "2"

    scene.render.resolution_x = 1920
    scene.render.resolution_y = 1080
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
    scene.view_settings.exposure = 0.15


def rig_camera_and_light(shot: dict, frame_end: int = 96) -> None:
    scene = bpy.context.scene
    for old_name in ("CAM-VIDEO", "CAM-VIDEO-Target"):
        obj = bpy.data.objects.get(old_name)
        if obj:
            bpy.data.objects.remove(obj, do_unlink=True)

    target_empty = bpy.data.objects.new("CAM-VIDEO-Target", None)
    target_empty.empty_display_type = "PLAIN_AXES"
    target_empty.location = Vector(shot["target"])
    scene.collection.objects.link(target_empty)

    cam_data = bpy.data.cameras.new("CAM-VIDEO")
    cam_data.lens = float(shot["lens"])
    cam_data.dof.use_dof = True
    cam_data.dof.focus_object = target_empty
    cam_data.dof.aperture_fstop = float(shot["fstop"])

    cam_obj = bpy.data.objects.new("CAM-VIDEO", cam_data)
    cam_obj.location = Vector(shot["start"])
    scene.collection.objects.link(cam_obj)

    track = cam_obj.constraints.new(type="TRACK_TO")
    track.target = target_empty
    track.track_axis = "TRACK_NEGATIVE_Z"
    track.up_axis = "UP_Y"

    cam_obj.location = Vector(shot["start"])
    cam_obj.keyframe_insert(data_path="location", frame=1)
    cam_obj.location = Vector(shot["mid"])
    cam_obj.keyframe_insert(data_path="location", frame=frame_end // 2)
    cam_obj.location = Vector(shot["end"])
    cam_obj.keyframe_insert(data_path="location", frame=frame_end)
    set_bezier_autoclamped(cam_obj)

    scene.camera = cam_obj

    # Subtle key light energy breathing (+/- 12% smooth sine wave over frames 1..frame_end)
    lights = [o for o in scene.objects if o.type == "LIGHT" and o.data and o.data.type in {"SUN", "AREA"}]
    if lights:
        primary = max(lights, key=lambda o: getattr(o.data, "energy", 0.0))
        base_energy = float(primary.data.energy)
        q1 = max(2, frame_end // 4)
        mid = frame_end // 2
        q3 = min(frame_end - 1, (3 * frame_end) // 4)
        for frame in (1, q1, mid, q3, frame_end):
            phase = math.sin(math.pi * (frame - 1) / max(1, frame_end - 1))
            primary.data.energy = base_energy * (1.0 + 0.12 * phase)
            primary.data.keyframe_insert(data_path="energy", frame=frame)
        set_bezier_autoclamped(primary.data)


def encode_pingpong_mp4(frames_dir: Path, out_mp4: Path) -> None:
    out_mp4.parent.mkdir(parents=True, exist_ok=True)
    cmd = [
        "ffmpeg", "-y", "-framerate", "24",
        "-i", str(frames_dir / "frame_%04d.jpg"),
        "-filter_complex",
        "[0:v]split[f][r];[r]reverse,setpts=PTS-STARTPTS[rv];[f][rv]concat=n=2:v=1:a=0,fps=30,format=yuv420p[out]",
        "-map", "[out]",
        "-c:v", "libx264", "-preset", "medium", "-crf", "18", "-g", "15", "-movflags", "+faststart",
        str(out_mp4),
    ]
    proc = subprocess.run(cmd, capture_output=True, text=True)
    if proc.returncode != 0:
        raise RuntimeError(f"FFmpeg encode failed for {out_mp4}:\n{proc.stderr}")

    probe = subprocess.run(
        ["ffprobe", "-v", "error", "-select_streams", "v:0",
         "-show_entries", "stream=width,height,r_frame_rate,nb_frames",
         "-show_entries", "format=duration,size",
         "-of", "json", str(out_mp4)],
        capture_output=True, text=True, check=True,
    )
    info = json.loads(probe.stdout)
    stream = info["streams"][0]
    fmt = info["format"]
    w, h = int(stream["width"]), int(stream["height"])
    size_bytes = int(fmt["size"])
    dur = float(fmt["duration"])
    assert (w, h) == (1920, 1080), f"Bad dims {w}x{h} on {out_mp4}"
    assert size_bytes > 100_000, f"Output video unexpectedly tiny: {size_bytes} B on {out_mp4}"
    print(f"VERIFIED {out_mp4.name}: {w}x{h} fps={stream['r_frame_rate']} nb={stream.get('nb_frames')} dur={dur:.2f}s size={size_bytes:,}B")


def main() -> None:
    argv = sys.argv[sys.argv.index("--") + 1:] if "--" in sys.argv else []
    ap = argparse.ArgumentParser()
    ap.add_argument("--clips", default="all", help="Comma-separated IDs like B3D-01,B3D-02 or 'all'")
    ap.add_argument("--samples", type=int, default=16)
    ap.add_argument("--benchmark", action="store_true", help="Render frames 1..10 of selected clip(s) and report s/frame")
    args = ap.parse_args(argv)

    want = {s.strip() for s in args.clips.split(",") if s.strip()} if args.clips != "all" else {s["id"] for s in SHOTS}
    frame_end = 10 if args.benchmark else 96

    OUT_VIDEO_DIR.mkdir(parents=True, exist_ok=True)
    TMP_FRAMES_DIR.mkdir(parents=True, exist_ok=True)

    for shot in SHOTS:
        sid = shot["id"]
        if sid not in want:
            continue
        blend_path = BLEND_DIR / shot["blend"]
        assert blend_path.exists(), f"Missing .blend: {blend_path}"

        out_mp4 = OUT_VIDEO_DIR / f"{sid}-clip.mp4"
        if not args.benchmark and out_mp4.exists() and out_mp4.stat().st_size > 100_000:
            print(f"SKIP existing verified clip {out_mp4.name} ({out_mp4.stat().st_size:,} B)")
            continue

        bpy.ops.wm.open_mainfile(filepath=str(blend_path))
        setup_eevee_video(samples=args.samples, frame_end=frame_end)
        rig_camera_and_light(shot, frame_end=96)

        clip_frames_dir = TMP_FRAMES_DIR / sid
        if clip_frames_dir.exists():
            shutil.rmtree(clip_frames_dir)
        clip_frames_dir.mkdir(parents=True, exist_ok=True)
        bpy.context.scene.render.filepath = str(clip_frames_dir / "frame_")

        t0 = time.time()
        bpy.ops.render.render(animation=True)
        elapsed = time.time() - t0
        rendered_frames = sorted(clip_frames_dir.glob("frame_*.jpg"))
        spf = elapsed / max(1, len(rendered_frames))
        print(f"RENDERED {sid}: {len(rendered_frames)} frames in {elapsed:.2f}s ({spf:.3f} s/frame, samples={args.samples})")

        if not args.benchmark:
            assert len(rendered_frames) == 96, f"Expected 96 JPGs, got {len(rendered_frames)}"
            encode_pingpong_mp4(clip_frames_dir, out_mp4)
            shutil.rmtree(clip_frames_dir)


if __name__ == "__main__":
    main()
