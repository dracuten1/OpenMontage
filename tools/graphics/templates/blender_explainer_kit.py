#!/usr/bin/env python3
"""Zero-dependency Blender Python kit for animated explainer scenes & BlenderKit asset reuse.

Designed to be imported directly inside Blender's embedded Python runtime (stdlib + bpy/mathutils only)
and also invoked cleanly via ``blender --background --python ... -- --probe <asset.blend>``.
"""
from __future__ import annotations

import argparse
import hashlib
import json
import math
import shutil
import subprocess
import sys
import urllib.parse
import urllib.request
import uuid
from pathlib import Path
from typing import Any

WIDGET_PREFIXES = ("WGT-", "WGT_", "CS_")
BLENDERKIT_HEADERS = {"User-Agent": "OpenMontage/1.0"}


def _sha256(path: Path) -> str:
    h = hashlib.sha256()
    with path.open("rb") as fh:
        for chunk in iter(lambda: fh.read(1024 * 1024), b""):
            h.update(chunk)
    return h.hexdigest()


def is_rig_widget(obj: Any) -> bool:
    """Return True for Rigify/control helper objects that inflate bounds or clutter renders."""
    name = getattr(obj, "name", "")
    return name.startswith(WIDGET_PREFIXES) or "Widget" in name


def search_blenderkit(query: str, *, max_results: int = 8, asset_type: str = "model") -> list[dict[str, Any]]:
    """Query BlenderKit public API for free downloadable assets."""
    url = "https://www.blenderkit.com/api/v1/search/?" + urllib.parse.urlencode(
        {"query": f"{query} is_free:true asset_type:{asset_type}", "page_size": int(max_results)}
    )
    req = urllib.request.Request(url, headers=BLENDERKIT_HEADERS)
    with urllib.request.urlopen(req, timeout=20) as resp:
        raw_results = json.loads(resp.read()).get("results", [])

    candidates: list[dict[str, Any]] = []
    for item in raw_results:
        blend_files = [f for f in item.get("files", []) if f.get("fileType") == "blend" and f.get("downloadUrl")]
        if not blend_files:
            continue
        candidates.append(
            {
                "assetBaseId": item.get("assetBaseId", ""),
                "name": item.get("name", ""),
                "displayName": item.get("displayName") or item.get("name", ""),
                "downloadUrl": blend_files[0]["downloadUrl"],
                "fileSize": blend_files[0].get("fileSize"),
                "description": (item.get("description") or "")[:180],
            }
        )
    return candidates


def _load_manifest(manifest_path: Path) -> dict[str, Any]:
    if manifest_path.is_file():
        try:
            return json.loads(manifest_path.read_text(encoding="utf-8"))
        except Exception:
            pass
    return {"assets": {}}


def download_blenderkit_model(
    slug: str,
    query: str,
    cache_dir: Path | str,
    *,
    skip_ids: set[str] | None = None,
    max_results: int = 8,
    manifest_path: Path | str | None = None,
) -> tuple[Path, dict[str, Any]]:
    """Download or reuse a free BlenderKit .blend model and record SHA-256 provenance."""
    cdir = Path(cache_dir).expanduser().resolve()
    cdir.mkdir(parents=True, exist_ok=True)
    mpath = Path(manifest_path).expanduser().resolve() if manifest_path else (cdir / "blenderkit_manifest.json")
    out_path = cdir / f"{slug}.blend"
    mf = _load_manifest(mpath)

    if not skip_ids and out_path.is_file() and out_path.stat().st_size > 10_000 and slug in mf.get("assets", {}):
        entry = dict(mf["assets"][slug])
        entry.setdefault("cached", True)
        return out_path, entry

    skip = skip_ids or set()
    for cand in search_blenderkit(query, max_results=max_results):
        bid = cand["assetBaseId"]
        if bid in skip:
            continue
        dl_url = cand["downloadUrl"] + "?scene_uuid=" + str(uuid.uuid4())
        req2 = urllib.request.Request(dl_url, headers=BLENDERKIT_HEADERS)
        with urllib.request.urlopen(req2, timeout=20) as r2:
            dl_info = json.loads(r2.read())
        file_url = dl_info.get("filePath")
        if not file_url:
            continue
        req3 = urllib.request.Request(file_url, headers=BLENDERKIT_HEADERS)
        with urllib.request.urlopen(req3, timeout=120) as r3:
            data = r3.read()
        if len(data) < 10_000:
            continue

        out_path.write_bytes(data)
        entry = {
            "slug": slug,
            "name": cand["name"],
            "assetBaseId": bid,
            "query": query,
            "local_file": str(out_path),
            "size_bytes": len(data),
            "sha256": _sha256(out_path),
        }
        mf.setdefault("assets", {})[slug] = entry
        mpath.parent.mkdir(parents=True, exist_ok=True)
        mpath.write_text(json.dumps(mf, indent=2, ensure_ascii=False), encoding="utf-8")
        return out_path, entry

    raise RuntimeError(f"No downloadable free .blend found on BlenderKit for query={query!r}")


def set_visible_shadow(root_obj: Any, enabled: bool) -> None:
    """Toggle shadow-casting across MESH descendants (critical speed win for dense alpha foliage)."""
    for o in [root_obj, *root_obj.children_recursive]:
        if o.type == "MESH":
            o.visible_shadow = enabled


def bake_geonodes_on_meshes(meshes: list[Any]) -> int:
    """Realize instances and bake any Geometry Nodes modifiers to static polygons once at append time."""
    import bpy

    baked = 0
    for m in meshes:
        geo_mods = [mod for mod in getattr(m, "modifiers", []) if mod.type == "NODES" and mod.node_group is not None]
        if not geo_mods:
            continue
        for mod in geo_mods:
            ng_copy = mod.node_group.copy()
            mod.node_group = ng_copy
            out_node = next((n for n in ng_copy.nodes if n.bl_idname == "NodeGroupOutput"), None)
            if out_node is not None:
                in_sock = next((s for s in out_node.inputs if s.type == "GEOMETRY" and s.is_linked), None)
                if in_sock is not None and in_sock.links[0].from_node.bl_idname != "GeometryNodeRealizeInstances":
                    from_sock = in_sock.links[0].from_socket
                    ng_copy.links.remove(in_sock.links[0])
                    ri = ng_copy.nodes.new("GeometryNodeRealizeInstances")
                    ng_copy.links.new(from_sock, ri.inputs["Geometry"])
                    ng_copy.links.new(ri.outputs["Geometry"], in_sock)

        bpy.context.view_layer.update()
        converted = False
        try:
            bpy.ops.object.select_all(action="DESELECT")
            m.hide_set(False)
            m.select_set(True)
            bpy.context.view_layer.objects.active = m
            bpy.ops.object.convert(target="MESH")
            converted = True
        except Exception:
            pass

        if not converted:
            depsgraph = bpy.context.evaluated_depsgraph_get()
            ev = m.evaluated_get(depsgraph)
            new_mesh = bpy.data.meshes.new_from_object(ev, preserve_all_data_layers=True, depsgraph=depsgraph)
            m.modifiers.clear()
            m.data = new_mesh
        baked += 1
    return baked


def append_normalized_blend(
    blend_path: Path | str,
    name: str,
    *,
    target_height: float | None = None,
    target_max_dim: float | None = None,
    loc: tuple[float, float, float] = (0.0, 0.0, 0.0),
    rot_z: float = 0.0,
    parent: Any = None,
    material_override: Any = None,
    override_all: bool = False,
    bake_geonodes: bool = True,
    disable_shadows: bool = False,
):
    """Append a .blend model cleanly, bake GeoNodes, center XY=0, ground minZ=0, scale & place."""
    import bpy
    from mathutils import Vector

    bpath = Path(blend_path)
    with bpy.data.libraries.load(str(bpath), link=False) as (data_from, data_to):
        data_to.objects = list(data_from.objects)

    imported = [o for o in data_to.objects if o is not None]
    removed = []
    for o in list(imported):
        if o.type in {"CAMERA", "LIGHT"}:
            removed.append(o)
            bpy.data.objects.remove(o, do_unlink=True)
    imported = [o for o in imported if o not in removed and o.name in bpy.data.objects]

    coll = bpy.context.scene.collection
    for o in imported:
        if is_rig_widget(o):
            o.hide_render = True
            o.hide_viewport = True
            continue
        if o.name not in coll.objects:
            coll.objects.link(o)

    imported_set = set(imported)
    roots = [o for o in imported if not is_rig_widget(o) and (o.parent is None or o.parent not in imported_set)]

    inner = bpy.data.objects.new(f"BK-Inner-{name}", None)
    coll.objects.link(inner)
    for r in roots:
        r.parent = inner

    meshes = [
        o for o in imported
        if o.type == "MESH" and not is_rig_widget(o)
        and (len(o.data.vertices) > 0 or any(mod.type == "NODES" for mod in o.modifiers))
    ]
    assert meshes, f"Asset {bpath.name} contained zero MESH objects"

    if bake_geonodes:
        bake_geonodes_on_meshes(meshes)

    bpy.context.view_layer.update()
    depsgraph = bpy.context.evaluated_depsgraph_get()
    meshes = [o for o in meshes if o.name in bpy.data.objects and len(o.data.vertices) > 0]
    assert meshes, f"Asset {bpath.name} contained zero non-empty MESH objects after bake"

    if material_override is not None:
        for m in meshes:
            if len(m.data.materials) == 0:
                m.data.materials.append(material_override)
                continue
            for i, mat in enumerate(m.data.materials):
                mname = (mat.name if mat else "").lower()
                if not override_all and any(k in mname for k in ("cork", "wood", "bark", "trunk")):
                    continue
                m.data.materials[i] = material_override

    min_v = [1e9, 1e9, 1e9]
    max_v = [-1e9, -1e9, -1e9]
    for m in meshes:
        ev = m.evaluated_get(depsgraph)
        mw = ev.matrix_world
        for corner in ev.bound_box:
            wc = mw @ Vector(corner)
            min_v[0] = min(min_v[0], wc.x)
            min_v[1] = min(min_v[1], wc.y)
            min_v[2] = min(min_v[2], wc.z)
            max_v[0] = max(max_v[0], wc.x)
            max_v[1] = max(max_v[1], wc.y)
            max_v[2] = max(max_v[2], wc.z)

    dx, dy, dz = max_v[0] - min_v[0], max_v[1] - min_v[1], max_v[2] - min_v[2]
    cx, cy = 0.5 * (min_v[0] + max_v[0]), 0.5 * (min_v[1] + max_v[1])

    if target_height is not None:
        sf = target_height / max(dz, 1e-4)
    elif target_max_dim is not None:
        sf = target_max_dim / max(dx, dy, dz, 1e-4)
    else:
        sf = 1.0

    outer = bpy.data.objects.new(f"BK-{name}", None)
    coll.objects.link(outer)
    inner.parent = outer
    inner.scale = (sf, sf, sf)
    inner.location = (-cx * sf, -cy * sf, -min_v[2] * sf)

    outer.location = Vector(loc)
    outer.rotation_euler = (0.0, 0.0, rot_z)
    if parent is not None:
        outer.parent = parent
    if disable_shadows:
        set_visible_shadow(outer, False)
    return outer


def instance_baked_blend(
    blend_path: Path | str,
    base_name: str,
    placements: list[tuple[tuple[float, float, float], float, float]],
    *,
    material_override: Any = None,
    override_all: bool = False,
    disable_shadows: bool = False,
) -> list[Any]:
    """Append & bake a .blend asset once and share its baked mesh datablock across placements=(loc, target_height, rot_z)."""
    import bpy
    from mathutils import Vector

    out: list[Any] = []
    if not placements:
        return out

    loc0, th0, rz0 = placements[0]
    first = append_normalized_blend(
        blend_path,
        f"{base_name}-0",
        target_height=th0,
        loc=loc0,
        rot_z=rz0,
        material_override=material_override,
        override_all=override_all,
        bake_geonodes=True,
        disable_shadows=disable_shadows,
    )
    out.append(first)
    if len(placements) == 1:
        return out

    coll = bpy.context.scene.collection

    def _clone_hierarchy(src_obj: Any, suffix: str, new_parent: Any) -> Any:
        cp = src_obj.copy()
        cp.name = f"{src_obj.name}{suffix}"
        coll.objects.link(cp)
        if new_parent is not None:
            cp.parent = new_parent
        for ch in src_obj.children:
            _clone_hierarchy(ch, suffix, cp)
        return cp

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


def set_interp(owner: Any, interp: str = "BEZIER", handle: str = "AUTO_CLAMPED") -> None:
    """Apply FCurve interpolation across legacy (4.x) and layered channelbag (5.x) Actions."""
    import bpy_extras.anim_utils as anim_utils

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


def setup_eevee_explainer(
    samples: int = 12,
    frame_end: int = 240,
    fps: int = 24,
    width: int = 1920,
    height: int = 1080,
    use_raytracing: bool = False,
    exposure: float = 0.20,
) -> None:
    """Configure fast one-way EEVEE explainer rendering with AgX tone mapping."""
    import bpy

    scene = bpy.context.scene
    scene.render.engine = "BLENDER_EEVEE"
    scene.eevee.taa_render_samples = samples
    if hasattr(scene.eevee, "use_raytracing"):
        scene.eevee.use_raytracing = use_raytracing
    scene.render.resolution_x = width
    scene.render.resolution_y = height
    scene.render.resolution_percentage = 100
    scene.render.fps = fps
    scene.frame_start = 1
    scene.frame_end = frame_end
    scene.render.image_settings.file_format = "JPEG"
    scene.render.image_settings.quality = 95
    try:
        scene.view_settings.view_transform = "AgX"
        scene.view_settings.look = "AgX - Medium High Contrast"
    except Exception:
        scene.view_settings.view_transform = "Standard"
    scene.view_settings.exposure = exposure


def _make_empty(name: str, loc=(0, 0, 0), rot=(0, 0, 0), parent=None):
    import bpy
    from mathutils import Euler, Vector

    e = bpy.data.objects.new(name, None)
    e.empty_display_type = "PLAIN_AXES"
    e.empty_display_size = 0.1
    bpy.context.scene.collection.objects.link(e)
    e.location = Vector(loc)
    e.rotation_euler = Euler(rot, "XYZ")
    if parent is not None:
        e.parent = parent
    return e


def _make_prim(kind: str, name: str, loc, scale=(1, 1, 1), rot=(0, 0, 0), mat=None, parent=None):
    import bpy

    if kind == "cyl":
        bpy.ops.mesh.primitive_cylinder_add(vertices=20, radius=1.0, depth=1.0, location=loc, rotation=rot)
    elif kind == "box":
        bpy.ops.mesh.primitive_cube_add(size=1.0, location=loc, rotation=rot)
    else:
        bpy.ops.mesh.primitive_uv_sphere_add(segments=16, ring_count=12, radius=1.0, location=loc)
    obj = bpy.context.active_object
    obj.name = name
    obj.scale = scale
    bpy.ops.object.shade_smooth()
    if mat is not None:
        obj.data.materials.append(mat)
    if parent is not None:
        obj.parent = parent
    return obj


def _flat_mat(name: str, rgb: tuple[float, float, float], roughness: float = 0.55):
    import bpy

    if name in bpy.data.materials:
        return bpy.data.materials[name]
    mat = bpy.data.materials.new(name)
    mat.use_nodes = True
    bsdf = mat.node_tree.nodes["Principled BSDF"]
    bsdf.inputs["Base Color"].default_value = (*rgb, 1.0)
    bsdf.inputs["Roughness"].default_value = roughness
    return mat


def create_articulated_actor(
    name: str,
    loc: tuple[float, float, float],
    rot_z: float,
    pal: dict[str, Any] | None = None,
    *,
    role: str = "hero",
) -> dict[str, Any]:
    """Build articulated figurine facing -Y in local space with Empty joints & TRK-<name> anchor."""
    p = pal or {}
    skin_m = p.get("skin_warm") or _flat_mat("KIT-Skin", (0.48, 0.28, 0.17))
    torso_m = p.get("indigo_cloth") or _flat_mat(f"KIT-Torso-{role}", (0.16, 0.20, 0.34))
    skirt_m = p.get("brocade_red") or _flat_mat(f"KIT-Skirt-{role}", (0.52, 0.16, 0.12))
    dark_m = p.get("ironwood") or _flat_mat("KIT-Dark", (0.15, 0.09, 0.05))
    eye_w = p.get("eye_white") or _flat_mat("KIT-EyeW", (0.95, 0.94, 0.92), 0.2)
    eye_d = p.get("eye_dark") or _flat_mat("KIT-EyeD", (0.03, 0.03, 0.03), 0.1)

    root = _make_empty(f"ACT-{name}-root", loc=loc, rot=(0, 0, rot_z))
    pelvis = _make_empty(f"ACT-{name}-pelvis", loc=(0, 0, 0.50), parent=root)

    hipL = _make_empty(f"ACT-{name}-hipL", loc=(-0.10, 0, -0.02), parent=pelvis)
    _make_prim("cyl", f"GEO-{name}-legL", (0, 0, -0.22), (0.072, 0.072, 0.44), mat=skin_m, parent=hipL)
    _make_prim("sph", f"GEO-{name}-footL", (0, -0.03, -0.44), (0.078, 0.11, 0.05), mat=dark_m, parent=hipL)

    hipR = _make_empty(f"ACT-{name}-hipR", loc=(0.10, 0, -0.02), parent=pelvis)
    _make_prim("cyl", f"GEO-{name}-legR", (0, 0, -0.22), (0.072, 0.072, 0.44), mat=skin_m, parent=hipR)
    _make_prim("sph", f"GEO-{name}-footR", (0, -0.03, -0.44), (0.078, 0.11, 0.05), mat=dark_m, parent=hipR)

    torso = _make_empty(f"ACT-{name}-torso", loc=(0, 0, 0.02), parent=pelvis)
    _make_prim("cyl", f"GEO-{name}-waist", (0, 0, 0.04), (0.18, 0.14, 0.24), mat=skirt_m, parent=torso)
    _make_prim("cyl", f"GEO-{name}-chest", (0, 0, 0.27), (0.21, 0.15, 0.38), mat=torso_m, parent=torso)

    head = _make_empty(f"ACT-{name}-head", loc=(0, 0, 0.50), parent=torso)
    _make_prim("sph", f"GEO-{name}-head", (0, 0, 0.13), (0.165, 0.16, 0.17), mat=skin_m, parent=head)
    _make_prim("sph", f"GEO-{name}-eyeWL", (-0.065, -0.142, 0.135), (0.034, 0.022, 0.036), mat=eye_w, parent=head)
    _make_prim("sph", f"GEO-{name}-eyeWR", (0.065, -0.142, 0.135), (0.034, 0.022, 0.036), mat=eye_w, parent=head)
    _make_prim("sph", f"GEO-{name}-pupilL", (-0.065, -0.156, 0.135), (0.020, 0.015, 0.022), mat=eye_d, parent=head)
    _make_prim("sph", f"GEO-{name}-pupilR", (0.065, -0.156, 0.135), (0.020, 0.015, 0.022), mat=eye_d, parent=head)

    lidL = _make_empty(f"ACT-{name}-lidL", loc=(-0.065, -0.145, 0.165), parent=head)
    _make_prim("box", f"GEO-{name}-lidL", (0, 0, -0.015), (0.072, 0.045, 0.065), mat=skin_m, parent=lidL)
    lidL.scale = (1.0, 1.0, 0.08)

    lidR = _make_empty(f"ACT-{name}-lidR", loc=(0.065, -0.145, 0.165), parent=head)
    _make_prim("box", f"GEO-{name}-lidR", (0, 0, -0.015), (0.072, 0.045, 0.065), mat=skin_m, parent=lidR)
    lidR.scale = (1.0, 1.0, 0.08)

    shoulderL = _make_empty(f"ACT-{name}-shoulderL", loc=(-0.25, 0, 0.39), parent=torso)
    _make_prim("cyl", f"GEO-{name}-armL", (0, 0, -0.17), (0.055, 0.055, 0.34), mat=skin_m, parent=shoulderL)
    _make_prim("sph", f"GEO-{name}-handL", (0, 0, -0.35), (0.060, 0.060, 0.060), mat=skin_m, parent=shoulderL)

    shoulderR = _make_empty(f"ACT-{name}-shoulderR", loc=(0.25, 0, 0.39), parent=torso)
    _make_prim("cyl", f"GEO-{name}-armR", (0, 0, -0.17), (0.055, 0.055, 0.34), mat=skin_m, parent=shoulderR)
    _make_prim("sph", f"GEO-{name}-handR", (0, 0, -0.35), (0.060, 0.060, 0.060), mat=skin_m, parent=shoulderR)

    label_anchor = _make_empty(f"TRK-{name}", loc=(0, 0, 0.94), parent=pelvis)
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
        "label_anchor": label_anchor,
    }


def anim_blink(actor: dict[str, Any], frames: list[int]) -> None:
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
    actor: dict[str, Any],
    f0: int,
    f1: int,
    p0: tuple[float, float, float],
    p1: tuple[float, float, float],
    *,
    stride_frames: int = 12,
    swing: float = 0.50,
    lift: float = 0.05,
) -> None:
    from mathutils import Vector

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
        shR.rotation_euler.x = -a * 0.7
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

    for obj in (hipL, hipR, shL, shR):
        obj.rotation_euler.x = 0.0
        obj.keyframe_insert("rotation_euler", frame=f1)
    pelvis.location.z = 0.50
    pelvis.keyframe_insert("location", frame=f1)
    for obj in (hipL, hipR, shL, shR, pelvis):
        set_interp(obj, "BEZIER")


def anim_sit_talk(actor: dict[str, Any], f0: int, f1: int, *, seat_pelvis_z: float = 0.30, nod_amp: float = 0.14) -> None:
    hipL, hipR = actor["hipL"], actor["hipR"]
    pelvis, torso, head = actor["pelvis"], actor["torso"], actor["head"]
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


def encode_oneway_mp4(frames_dir: Path | str, out_mp4: Path | str, *, src_fps: int = 24, out_fps: int = 30) -> Path:
    """Encode sequential rendered frames (frame_%04d.jpg) into one-way progressive H.264 MP4 (NO ping-pong)."""
    fdir = Path(frames_dir)
    out = Path(out_mp4)
    out.parent.mkdir(parents=True, exist_ok=True)
    ffmpeg_bin = shutil.which("ffmpeg") or "ffmpeg"
    subprocess.run(
        [
            ffmpeg_bin, "-y", "-loglevel", "error",
            "-framerate", str(src_fps),
            "-i", str(fdir / "frame_%04d.jpg"),
            "-vf", f"fps={out_fps},format=yuv420p",
            "-an",
            "-c:v", "libx264", "-preset", "medium", "-crf", "18",
            "-g", "15", "-movflags", "+faststart",
            str(out),
        ],
        check=True,
    )
    return out


def export_screen_tracks(scene: Any, cam_obj: Any, anchors: dict[str, Any], f_start: int, f_end: int, out_json: Path | str) -> Path:
    """Bake per-frame 3D-to-2D viewport coordinates for Remotion callout overlays."""
    from bpy_extras.object_utils import world_to_camera_view

    w, h = scene.render.resolution_x, scene.render.resolution_y
    tracks: dict[str, dict[str, dict[str, float | bool]]] = {}
    depsgraph = scene.view_layers[0].depsgraph if hasattr(scene, "view_layers") else None
    import bpy
    if depsgraph is None:
        depsgraph = bpy.context.evaluated_depsgraph_get()
    for f in range(f_start, f_end + 1):
        scene.frame_set(f)
        depsgraph.update()
        cam_eval = cam_obj.evaluated_get(depsgraph)
        row: dict[str, dict[str, float | bool]] = {}
        for key, obj in anchors.items():
            co = world_to_camera_view(scene, cam_eval, obj.evaluated_get(depsgraph).matrix_world.translation)
            vis = bool(co.z > 0.0 and -0.05 <= co.x <= 1.05 and -0.05 <= co.y <= 1.05)
            row[key] = {"x": round(float(co.x * w), 1), "y": round(float((1.0 - co.y) * h), 1), "v": vis}
        tracks[str(f)] = row
    out_p = Path(out_json)
    out_p.parent.mkdir(parents=True, exist_ok=True)
    out_p.write_text(json.dumps(tracks), encoding="utf-8")
    return out_p


def run_probe_cli(blend_path: Path, out_preview: Path | None, max_polys: int, target_max_dim: float) -> None:
    """Append .blend, check polycount & GeoNodes bake, optionally render 1-frame EEVEE QA preview."""
    import bpy
    from mathutils import Vector

    bpy.ops.wm.read_factory_settings(use_empty=True)
    outer = append_normalized_blend(blend_path, "ProbeAsset", target_max_dim=target_max_dim, bake_geonodes=True)
    meshes = [o for o in bpy.data.objects if o.type == "MESH" and not is_rig_widget(o)]
    polys = sum(len(m.data.polygons) for m in meshes)
    geo_mods_left = sum(sum(1 for mod in m.modifiers if mod.type == "NODES") for m in meshes)
    passed = 0 < polys <= max_polys and geo_mods_left == 0

    preview_written = None
    if out_preview is not None:
        setup_eevee_explainer(samples=12, frame_end=1, width=960, height=540, exposure=0.15)
        scene = bpy.context.scene
        w = bpy.data.worlds.new("ProbeWorld")
        w.use_nodes = True
        bg = w.node_tree.nodes.get("Background")
        if bg:
            bg.inputs[0].default_value = (0.08, 0.07, 0.06, 1.0)
            bg.inputs[1].default_value = 0.9
        scene.world = w
        for lname, eng, loc in [("ProbeKey", 850, (3.2, -3.2, 4.0)), ("ProbeFill", 320, (-3.0, -2.5, 2.8))]:
            ld = bpy.data.lights.new(lname, type="AREA")
            ld.energy = eng
            ld.size = 2.5
            lo = bpy.data.objects.new(lname, ld)
            scene.collection.objects.link(lo)
            lo.location = loc
            lo.rotation_euler = (Vector((0, 0, target_max_dim * 0.35)) - Vector(loc)).to_track_quat("-Z", "Y").to_euler()
        tgt = _make_empty("ProbeTarget", loc=(0, 0, target_max_dim * 0.35))
        cd = bpy.data.cameras.new("ProbeCam")
        cd.lens = 42.0
        co = bpy.data.objects.new("ProbeCam", cd)
        scene.collection.objects.link(co)
        co.location = (2.8, -3.1, 1.8)
        tr = co.constraints.new(type="TRACK_TO")
        tr.target = tgt
        tr.track_axis = "TRACK_NEGATIVE_Z"
        tr.up_axis = "UP_Y"
        scene.camera = co
        out_preview.parent.mkdir(parents=True, exist_ok=True)
        scene.render.filepath = str(out_preview)
        bpy.ops.render.render(write_still=True)
        preview_written = str(out_preview)

    report = {
        "blend_path": str(blend_path),
        "anchor_name": outer.name,
        "polys": polys,
        "max_polys": max_polys,
        "geonodes_remaining": geo_mods_left,
        "passed": passed,
        "preview_path": preview_written,
    }
    print("OPENMONTAGE_PROBE_JSON=" + json.dumps(report))


if __name__ == "__main__":
    if "--" in sys.argv:
        argv = sys.argv[sys.argv.index("--") + 1 :]
        ap = argparse.ArgumentParser()
        ap.add_argument("--probe", required=True)
        ap.add_argument("--out", default="")
        ap.add_argument("--max-polys", type=int, default=100_000)
        ap.add_argument("--target-max-dim", type=float, default=1.8)
        ns = ap.parse_args(argv)
        run_probe_cli(
            Path(ns.probe).expanduser().resolve(),
            Path(ns.out).expanduser().resolve() if ns.out else None,
            ns.max_polys,
            ns.target_max_dim,
        )
