#!/usr/bin/env python3
"""Reusable BlenderKit free model search, local caching, and ground-normalized import helpers."""
from __future__ import annotations

import json
import sys
import urllib.parse
import urllib.request
import uuid
from pathlib import Path

CACHE_DIR = Path("/Users/tuyennguyen/project/OpenMontage/projects/dam-san/assets/blenderkit_assets")
MANIFEST_PATH = CACHE_DIR / "blenderkit_manifest.json"
HEADERS = {"User-Agent": "OpenMontage/1.0"}

DEFAULT_ASSETS = [
    ("elephant", "elephant", 150_000),
    ("campfire2", "3d scanned campfire", 80_000),
    ("ceramic_jar", "ceramic jar", 80_000),
    ("stylized_tree", "stylized tree", 80_000),
]

NEW_ASSETS = [
    ("horse", ["horse", "brown horse"], 100_000),
    ("old_book", ["old open book", "vintage book"], 80_000),
    ("cassette", ["cassette tape", "audio cassette"], 80_000),
    ("axe", ["wooden axe", "medieval axe"], 80_000),
    ("wooden_drum", ["wooden drum", "tribal drum"], 80_000),
]

WIDGET_PREFIXES = ("WGT-", "WGT_", "CS_")


def _is_widget(obj) -> bool:
    return obj.name.startswith(WIDGET_PREFIXES) or "Widget" in obj.name


def _bake_geonodes_on_meshes(meshes: list) -> int:
    """Realize instances and bake any Geometry Nodes modifiers on imported meshes once at append time."""
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
        except Exception as exc:
            print(f"GEONODES convert fallback for {m.name}: {exc}")

        if not converted:
            depsgraph = bpy.context.evaluated_depsgraph_get()
            ev = m.evaluated_get(depsgraph)
            new_mesh = bpy.data.meshes.new_from_object(ev, preserve_all_data_layers=True, depsgraph=depsgraph)
            m.modifiers.clear()
            m.data = new_mesh
        baked += 1
    return baked


def _load_manifest() -> dict:
    if MANIFEST_PATH.exists():
        try:
            return json.loads(MANIFEST_PATH.read_text(encoding="utf-8"))
        except Exception:
            pass
    return {"assets": {}}


def _save_manifest(mf: dict) -> None:
    CACHE_DIR.mkdir(parents=True, exist_ok=True)
    MANIFEST_PATH.write_text(json.dumps(mf, indent=2, ensure_ascii=False), encoding="utf-8")


def search_and_download(slug: str, query: str, *, skip_ids: set[str] | None = None, max_results: int = 8) -> Path:
    """Download a free BlenderKit .blend model into persistent cache or reuse cached file."""
    CACHE_DIR.mkdir(parents=True, exist_ok=True)
    out_path = CACHE_DIR / f"{slug}.blend"
    mf = _load_manifest()

    if not skip_ids and out_path.exists() and out_path.stat().st_size > 10_000 and slug in mf.get("assets", {}):
        print(f"REUSE cached BlenderKit {slug}: {out_path.name} ({out_path.stat().st_size:,} B)")
        return out_path

    url = "https://www.blenderkit.com/api/v1/search/?" + urllib.parse.urlencode(
        {"query": f"{query} is_free:true asset_type:model", "page_size": max_results}
    )
    req = urllib.request.Request(url, headers=HEADERS)
    with urllib.request.urlopen(req, timeout=15) as resp:
        results = json.loads(resp.read()).get("results", [])

    skip = skip_ids or set()
    for item in results:
        bid = item.get("assetBaseId", "")
        if bid in skip:
            continue
        blend_files = [f for f in item.get("files", []) if f.get("fileType") == "blend" and f.get("downloadUrl")]
        if not blend_files:
            continue
        dl_url = blend_files[0]["downloadUrl"] + "?scene_uuid=" + str(uuid.uuid4())
        req2 = urllib.request.Request(dl_url, headers=HEADERS)
        with urllib.request.urlopen(req2, timeout=15) as r2:
            dl_info = json.loads(r2.read())
        file_url = dl_info.get("filePath")
        if not file_url:
            continue
        print(f"DOWNLOAD BlenderKit {slug!r} ({item.get('name')}, id={bid})...")
        req3 = urllib.request.Request(file_url, headers=HEADERS)
        with urllib.request.urlopen(req3, timeout=90) as r3:
            data = r3.read()
        if len(data) < 10_000:
            continue
        out_path.write_bytes(data)
        mf.setdefault("assets", {})[slug] = {
            "slug": slug,
            "name": item.get("name"),
            "assetBaseId": bid,
            "query": query,
            "local_file": str(out_path),
            "size_bytes": len(data),
        }
        _save_manifest(mf)
        print(f"SAVED {out_path.name} ({len(data):,} B)")
        return out_path

    raise RuntimeError(f"No downloadable free .blend found on BlenderKit for query={query!r}")


def append_normalized(
    blend_path: Path,
    name: str,
    *,
    target_height: float | None = None,
    target_max_dim: float | None = None,
    loc: tuple[float, float, float] = (0.0, 0.0, 0.0),
    rot_z: float = 0.0,
    parent=None,
    material_override=None,
    override_all: bool = False,
    bake_geonodes: bool = True,
):
    """Append a BlenderKit .blend model cleanly, hide rig widgets, bake GeoNodes, center XY=0, ground minZ=0, scale & place."""
    import bpy
    from mathutils import Vector

    with bpy.data.libraries.load(str(blend_path), link=False) as (data_from, data_to):
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
        if _is_widget(o):
            o.hide_render = True
            o.hide_viewport = True
            continue
        if o.name not in coll.objects:
            coll.objects.link(o)

    imported_set = set(imported)
    roots = [
        o for o in imported
        if not _is_widget(o)
        and (o.parent is None or o.parent not in imported_set)
    ]

    inner = bpy.data.objects.new(f"BK-Inner-{name}", None)
    coll.objects.link(inner)
    for r in roots:
        r.parent = inner

    meshes = [
        o for o in imported
        if o.type == "MESH"
        and not _is_widget(o)
        and (len(o.data.vertices) > 0 or any(mod.type == "NODES" for mod in o.modifiers))
    ]
    assert meshes, f"BlenderKit asset {blend_path.name} contained zero MESH objects"

    if bake_geonodes:
        _bake_geonodes_on_meshes(meshes)

    bpy.context.view_layer.update()
    depsgraph = bpy.context.evaluated_depsgraph_get()
    meshes = [o for o in meshes if o.name in bpy.data.objects and len(o.data.vertices) > 0]
    poly_count = sum(len(m.data.polygons) for m in meshes)
    assert meshes, f"BlenderKit asset {blend_path.name} contained zero non-empty MESH objects after bake"

    if material_override is not None:
        for m in meshes:
            if len(m.data.materials) == 0:
                m.data.materials.append(material_override)
                continue
            for i, mat in enumerate(m.data.materials):
                mname = (mat.name if mat else "").lower()
                if not override_all and ("cork" in mname or "wood" in mname):
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

    dx = max_v[0] - min_v[0]
    dy = max_v[1] - min_v[1]
    dz = max_v[2] - min_v[2]
    cx = 0.5 * (min_v[0] + max_v[0])
    cy = 0.5 * (min_v[1] + max_v[1])

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

    print(
        f"APPENDED {name} from {blend_path.name}: polys={poly_count:,}, "
        f"raw=({dx:.2f},{dy:.2f},{dz:.2f}), scaled=({dx*sf:.2f},{dy*sf:.2f},{dz*sf:.2f})"
    )
    return outer


def _render_probe_still(out_jpg: Path, cam_loc=(3.2, -3.4, 2.0), target=(0.0, 0.0, 0.9)) -> float:
    import time
    import bpy
    from mathutils import Vector

    scene = bpy.context.scene
    scene.render.engine = "BLENDER_EEVEE"
    scene.eevee.taa_render_samples = 12
    scene.eevee.use_raytracing = False
    scene.render.resolution_x = 960
    scene.render.resolution_y = 540
    scene.render.resolution_percentage = 100
    scene.render.image_settings.file_format = "JPEG"
    scene.render.image_settings.quality = 90
    try:
        scene.view_settings.view_transform = "AgX"
    except Exception:
        pass

    world = bpy.data.worlds.new("ProbeWorld")
    world.use_nodes = True
    bg = world.node_tree.nodes.get("Background")
    if bg:
        bg.inputs[0].default_value = (0.08, 0.07, 0.06, 1.0)
        bg.inputs[1].default_value = 0.8
    scene.world = world

    # Ground plane
    bpy.ops.mesh.primitive_cylinder_add(vertices=32, radius=3.5, depth=0.1, location=(0, 0, -0.05))
    mat_g = bpy.data.materials.new("ProbeGround")
    mat_g.use_nodes = True
    mat_g.node_tree.nodes["Principled BSDF"].inputs["Base Color"].default_value = (0.16, 0.14, 0.12, 1.0)
    bpy.context.active_object.data.materials.append(mat_g)

    # Key & Fill lights
    for lname, eng, loc in [("ProbeKey", 800, (3.5, -3.5, 4.5)), ("ProbeFill", 350, (-3.5, -2.5, 3.0))]:
        ld = bpy.data.lights.new(lname, type="AREA")
        ld.energy = eng
        ld.size = 2.5
        lo = bpy.data.objects.new(lname, ld)
        scene.collection.objects.link(lo)
        lo.location = loc
        direction = Vector(target) - Vector(loc)
        lo.rotation_euler = direction.to_track_quat("-Z", "Y").to_euler()

    # Camera
    t_empty = bpy.data.objects.new("ProbeTarget", None)
    t_empty.location = Vector(target)
    scene.collection.objects.link(t_empty)
    cd = bpy.data.cameras.new("ProbeCam")
    cd.lens = 40.0
    co = bpy.data.objects.new("ProbeCam", cd)
    co.location = Vector(cam_loc)
    scene.collection.objects.link(co)
    tr = co.constraints.new(type="TRACK_TO")
    tr.target = t_empty
    tr.track_axis = "TRACK_NEGATIVE_Z"
    tr.up_axis = "UP_Y"
    scene.camera = co

    out_jpg.parent.mkdir(parents=True, exist_ok=True)
    scene.render.filepath = str(out_jpg)
    t0 = time.time()
    bpy.ops.render.render(write_still=True)
    return time.time() - t0


def fetch_new_probes() -> None:
    """Benchmark stylized_tree bake speed and fetch+render 1-frame probes for the 5 new slugs."""
    import bpy

    probe_dir = CACHE_DIR.parent.parent / "qc" / "blenderkit_probes"
    probe_dir.mkdir(parents=True, exist_ok=True)

    # 1. Benchmark stylized_tree baked GeoNodes
    tree_path = CACHE_DIR / "stylized_tree.blend"
    if tree_path.exists():
        bpy.ops.wm.read_factory_settings(use_empty=True)
        append_normalized(tree_path, "stylized_tree", target_height=2.2, bake_geonodes=True)
        meshes = [o for o in bpy.data.objects if o.type == "MESH" and not _is_widget(o)]
        polys = sum(len(m.data.polygons) for m in meshes)
        geo_mods_left = sum(sum(1 for mod in m.modifiers if mod.type == "NODES") for m in meshes)
        dt = _render_probe_still(probe_dir / "stylized_tree_baked.jpg", cam_loc=(3.4, -3.6, 2.2), target=(0.0, 0.0, 1.0))
        print(f"BENCHMARK stylized_tree baked: polys={polys:,}, geo_mods_left={geo_mods_left}, render_time={dt:.2f}s")

    # 2. Fetch + probe the 5 new slugs (never touching the 4 existing slugs unless missing)
    for slug, queries, max_polys in NEW_ASSETS:
        skip: set[str] = set()
        passed = False
        for query in queries:
            for attempt in range(3):
                try:
                    p = search_and_download(slug, query, skip_ids=skip, max_results=12)
                except Exception as exc:
                    print(f"SEARCH failed for {slug} query={query!r}: {exc}")
                    break
                bpy.ops.wm.read_factory_settings(use_empty=True)
                try:
                    outer = append_normalized(p, slug, target_height=1.8, bake_geonodes=True)
                    meshes = [o for o in bpy.data.objects if o.type == "MESH" and not _is_widget(o)]
                    polys = sum(len(m.data.polygons) for m in meshes)
                    if polys == 0 or polys > max_polys:
                        mf = _load_manifest()
                        bid = mf["assets"][slug]["assetBaseId"]
                        print(f"REJECT {slug} (polys={polys}, limit={max_polys}), trying next candidate...")
                        skip.add(bid)
                        p.unlink(missing_ok=True)
                        mf["assets"].pop(slug, None)
                        _save_manifest(mf)
                        continue
                    dt = _render_probe_still(probe_dir / f"{slug}.jpg")
                    print(f"PROBE PASS {slug}: {polys:,} polys, render={dt:.2f}s, preview={probe_dir / f'{slug}.jpg'}")
                    passed = True
                    break
                except Exception as exc:
                    mf = _load_manifest()
                    bid = mf.get("assets", {}).get(slug, {}).get("assetBaseId")
                    if bid:
                        skip.add(bid)
                    p.unlink(missing_ok=True)
                    mf.get("assets", {}).pop(slug, None)
                    _save_manifest(mf)
                    print(f"PROBE ERR {slug} attempt {attempt + 1}: {exc}")
            if passed:
                break
        if not passed:
            print(f"FALLBACK NEEDED: {slug} failed all candidates — use procedural geometry.")


if __name__ == "__main__":
    if "--fetch-probe" in sys.argv:
        fetch_and_probe()
    elif "--fetch-new-probes" in sys.argv:
        fetch_new_probes()
