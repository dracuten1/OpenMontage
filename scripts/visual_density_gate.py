#!/usr/bin/env python3
"""visual_density_gate.py — chặn video "slide trình chiếu" TRƯỚC compose/render.

Bài học diem-tin-vn-20261107: 9 cảnh chỉ 3 ảnh, motion 2,3/cảnh → video dạng slide
dù checkpoint khai "style_playbook: editorial-explainer-manifest". Gate này đối chiếu
manifest ↔ file trên đĩa ↔ composition thay vì tin khai báo.

Usage:
  python3 scripts/visual_density_gate.py <project_slug> [--min-motion-per-scene 6] \
      [--lane editorial|animation] [--manifest path]

Exit 0 = PASS; exit 1 = FAIL (in từng lỗi). Report: projects/<slug>/qc/visual_density_gate.json
Áp cho MỌI lane (news, crypto, explainer, myth/YouTube, kids). Lane animation tính
sprite/rig frame là asset layer.
"""
import argparse, json, re, sys
from pathlib import Path
from typing import Optional

REPO = Path(__file__).resolve().parent.parent
IMG_EXT = {".png", ".jpg", ".jpeg", ".webp", ".avif", ".gif"}
IMG_METHODS = {
    "t2i", "i2i", "web_plus_i2i", "t2i_chroma_key", "web_asset",
    "sprite", "rig_frame", "photo_asset",
}

def find_file(slug: str, name: str) -> Optional[Path]:
    roots = [
        REPO / "projects" / slug / "assets" / "images",
        REPO / "remotion-composer" / "public" / slug / "img",
        REPO / "remotion-composer" / "public" / slug,
        REPO / "projects" / slug / "assets" / "sprites",
        REPO / "projects" / slug / "assets",
    ]
    for r in roots:
        if (r / name).is_file():
            return r / name
    hits = [p for r in roots if r.is_dir() for p in r.rglob(name) if p.is_file()]
    return hits[0] if hits else None

def main() -> int:
    ap = argparse.ArgumentParser()
    ap.add_argument("slug")
    ap.add_argument("--min-motion-per-scene", type=float, default=6.0)
    ap.add_argument("--lane", default="editorial", choices=["editorial", "animation"])
    ap.add_argument("--manifest", default=None)
    a = ap.parse_args()

    proj = REPO / "projects" / a.slug
    src = REPO / "remotion-composer" / "src" / a.slug
    errors, warns, stats = [], [], {}

    # G1: manifest khai layer từng cảnh
    mpath = Path(a.manifest) if a.manifest else proj / "scene_manifest.json"
    if not mpath.is_file():
        errors.append(f"G1: thiếu scene_manifest.json ({mpath}) — không có kế hoạch layer/asset từng cảnh")
        scenes = []
    else:
        m = json.loads(mpath.read_text(encoding="utf-8"))
        scenes = m.get("scenes", [])
        if not scenes:
            errors.append("G1: scene_manifest.json không có scenes[]")
    stats["scenes"] = len(scenes)

    # fallback số cảnh từ scene_timing.json / scene_elements.json (G3/G4 vẫn đo được khi thiếu manifest)
    n_scenes = len(scenes)
    if not n_scenes:
        st = proj / "artifacts" / "scene_timing.json"
        if st.is_file():
            try:
                d = json.loads(st.read_text(encoding="utf-8"))
                cand = d.get("sections") if isinstance(d, dict) else d
                if isinstance(cand, list):
                    n_scenes = len(cand)
                elif isinstance(cand, dict):
                    n_scenes = len(cand)
            except Exception:
                pass
    if not n_scenes:
        se = proj / "artifacts" / "scene_elements.json"
        if se.is_file():
            try:
                d = json.loads(se.read_text(encoding="utf-8"))
                ks = list(d.get("frames", {}).keys())
                prefixes = {mm.group(0) for k in ks for mm in [re.match(r"s\d+", k)] if mm}
                n_scenes = len(prefixes)
            except Exception:
                pass
        stats["scenes_from_timing"] = n_scenes

    # G2: mỗi cảnh ≥1 layer ảnh thật + file tồn tại trên đĩa
    scenes_no_asset, files_missing = [], []
    for s in scenes:
        sid = s.get("scene_id") or s.get("section_id") or "?"
        if s.get("support") or s.get("role") == "support":
            continue
        layers = s.get("layers", [])
        asset_layers = [l for l in layers
                        if (l.get("pipeline") or {}).get("method") in IMG_METHODS]
        if not asset_layers:
            scenes_no_asset.append(sid)
            continue
        for l in asset_layers:
            f = (l.get("pipeline") or {}).get("file")
            if f and not find_file(a.slug, f):
                files_missing.append(f"{sid}:{f}")
    if scenes_no_asset:
        errors.append(f"G2: {len(scenes_no_asset)} cảnh KHÔNG có layer ảnh nào (t2i/i2i/cutout/sprite): {', '.join(scenes_no_asset)}")
    if files_missing:
        errors.append(f"G2b: file asset khai trong manifest nhưng KHÔNG tồn tại trên đĩa: {', '.join(files_missing[:10])}")

    # G3: composition tham chiếu đủ ảnh — đối chiếu TÊN FILE ảnh trên đĩa với text src
    # (bắt cả template literal `.../${...}.png` mà regex staticFile hụt)
    disk_roots = [
        REPO / "remotion-composer" / "public" / a.slug,
        proj / "assets",
    ]
    disk_imgs = set()
    for r in disk_roots:
        if r.is_dir():
            for p in r.rglob("*"):
                if p.is_file() and p.suffix.lower() in IMG_EXT:
                    disk_imgs.add(p.name)
    src_text = ""
    if src.is_dir():
        for tf in src.rglob("*.tsx"):
            src_text += tf.read_text(encoding="utf-8", errors="ignore")
    img_refs = {n for n in disk_imgs if n in src_text or Path(n).stem in src_text}
    stats["disk_images"] = len(disk_imgs)
    stats["comp_img_refs"] = len(img_refs)
    denom = n_scenes or 1
    if n_scenes and len(img_refs) < max(1, n_scenes - 1):  # cho phép tối đa 1 cảnh thuần typography
        errors.append(f"G3: composition chỉ dùng {len(img_refs)} file ảnh cho {n_scenes} cảnh (chuẩn demo: ~ảnh/cảnh ≥1)")

    # G4: mật độ motion nguyên thủy
    motion = 0
    if src.is_dir():
        mpat = re.compile(r"interpolate\(|spring\(|useCurrentFrame")
        for tf in src.rglob("*.tsx"):
            motion += len(mpat.findall(tf.read_text(encoding="utf-8", errors="ignore")))
    per_scene = round(motion / (n_scenes or 1), 2)
    stats["motion_primitives"] = motion
    stats["motion_per_scene"] = per_scene
    if n_scenes and per_scene < a.min_motion_per_scene:
        errors.append(f"G4: motion {per_scene}/cảnh < {a.min_motion_per_scene} (demo xăng: ~10/cảnh; bản lỗi diem-tin: ~2,3)")

    out = {"project": a.slug, "lane": a.lane, "pass": not errors, "errors": errors,
           "warnings": warns, "stats": stats, "min_motion_per_scene": a.min_motion_per_scene}
    qdir = proj / "qc"; qdir.mkdir(exist_ok=True)
    (qdir / "visual_density_gate.json").write_text(json.dumps(out, ensure_ascii=False, indent=2), encoding="utf-8")

    print(f"[visual-density-gate] {a.slug} lane={a.lane} scenes={stats.get('scenes')} img_refs={stats.get('comp_img_refs')} motion/scene={per_scene}")
    for e in errors:
        print("  FAIL:", e)
    for w in warns:
        print("  WARN:", w)
    print("RESULT:", "PASS" if not errors else "FAIL")
    return 0 if not errors else 1

if __name__ == "__main__":
    sys.exit(main())
