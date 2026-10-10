"""Hexpix Scene — hue-marker geometry encoding for generated images.

Two operations on one tool:

- analyze: decode marker regions from an existing marked image
  (HSV-band gate -> region mask -> path polyline / object sprite RGBA +
  inpainted background fallback). Pure local OpenCV, deterministic.
- generate: full-chain scene build per skills/creative/hexpix-scene-usage.md:
  optional clean base pass -> marker pass (gen or gen-edit) -> decode ->
  optional object-removal pass via identity-preserving gen-edit. Emits
  geometry.json (normalized polylines/bboxes/centroids), sprite RGBA PNG and
  background PNG for the compose stage.

Verified recipes live in docs/ORCHESTRATION_DOCTRINE.md §4/§4b/§4c.
The gen calls delegate to the openai_image tool (9router gateway) so model
choice, SSE handling and pricing stay in one place.
"""

from __future__ import annotations

import colorsys
import json
import os
import sys
import time
from pathlib import Path
from typing import Any

_REPO_ROOT = Path(__file__).resolve().parent.parent.parent
if str(_REPO_ROOT) not in sys.path:
    sys.path.insert(0, str(_REPO_ROOT))

from tools.base_tool import (
    BaseTool,
    Determinism,
    ExecutionMode,
    ResourceProfile,
    RetryPolicy,
    ToolResult,
    ToolRuntime,
    ToolStability,
    ToolStatus,
    ToolTier,
)

# Default hue bands in OpenCV H units (0-179 = degrees / 2).
# Model drift is +-25 degrees; bands are wide on purpose. NEVER write spec
# hue values in 0-359 — halve them first (cost a debug cycle, see doctrine §4c).
DEFAULT_HUE_BANDS = {
    "magenta": (145, 165),   # #FF00FF
    "cyan": (85, 100),       # #00FFFF
    "teal": (78, 100),       # #1FA9A0
    "violet": (135, 158),    # #C77DD8
    "gold": (20, 32),        # #FFD700
    "orange": (10, 18),      # #FF6600
}

DEFAULT_T2I_MODEL = "cx/gpt-5.6-luna-image"
DEFAULT_EDIT_MODEL = "cx/gpt-image-2.5-sunburst"


def _hue_band(hex_color: str) -> tuple[int, int]:
    """Derive a +-11 (OpenCV units) hue band from a hex color."""
    hex_color = hex_color.lstrip("#")
    r, g, b = (
        int(hex_color[0:2], 16) / 255.0,
        int(hex_color[2:4], 16) / 255.0,
        int(hex_color[4:6], 16) / 255.0,
    )
    h_deg, _l, s = colorsys.rgb_to_hls(r, g, b)
    h_cv = int(round(h_deg * 179))
    return (max(0, h_cv - 11), min(179, h_cv + 11))


def _gate(bgr, band, sat_min, sat_max, val_min):
    import cv2
    import numpy as np

    hsv = cv2.cvtColor(bgr, cv2.COLOR_BGR2HSV)
    h = hsv[:, :, 0].astype(int)
    s = hsv[:, :, 1].astype(int) / 255.0
    v = hsv[:, :, 2].astype(int)
    lo, hi = band
    inb = ((h >= lo) & (h <= hi)) if lo <= hi else ((h >= lo) | (h <= hi))
    return ((inb) & (s >= sat_min) & (s <= sat_max) & (v >= val_min)).astype(np.uint8) * 255


def _clean(mask, k=5):
    import cv2

    ker = cv2.getStructuringElement(cv2.MORPH_ELLIPSE, (k, k))
    return cv2.morphologyEx(cv2.morphologyEx(mask, cv2.MORPH_CLOSE, ker), cv2.MORPH_OPEN, ker)


def _polyline(mask, n_bins=36):
    import numpy as np

    ys, xs = np.nonzero(mask)
    if len(xs) < 50:
        return None
    pts = np.stack([xs, ys], 1).astype(np.float32)
    mean = pts.mean(0)
    d = pts - mean
    axis = np.linalg.svd(d, full_matrices=False)[2][0]
    t = d @ axis
    qs = np.quantile(t, np.linspace(0, 1, n_bins + 1))
    line = []
    for b in range(n_bins):
        sel = (t >= qs[b]) & (t <= qs[b + 1])
        if sel.sum() >= 3:
            line.append([float(pts[sel, 0].mean()), float(pts[sel, 1].mean())])
    if len(line) < 2:
        return None
    return dict(axis=[float(axis[0]), float(axis[1])], points=line)


def _largest_component(mask):
    import cv2

    n, labels, stats, _ = cv2.connectedComponentsWithStats(mask, 8)
    if n <= 1:
        return None
    i = 1 + int(stats[1:, cv2.CC_STAT_AREA].argmax())
    x, y, w, h = stats[i, cv2.CC_STAT_LEFT], stats[i, cv2.CC_STAT_TOP], stats[i, cv2.CC_STAT_WIDTH], stats[i, cv2.CC_STAT_HEIGHT]
    return i, labels, (int(x), int(y), int(w), int(h))


class HexpixScene(BaseTool):
    name = "hexpix_scene"
    version = "0.1.0"
    tier = ToolTier.GENERATE
    capability = "graphics"
    provider = "opencv"
    stability = ToolStability.PRODUCTION
    execution_mode = ExecutionMode.SYNC
    determinism = Determinism.STOCHASTIC  # analyze deterministic; generate calls gen models
    runtime = ToolRuntime.HYBRID

    dependencies = []
    install_instructions = "pip install opencv-python-headless numpy Pillow"
    agent_skills = ["hexpix-scene-usage"]  # skills/creative/hexpix-scene-usage.md

    capabilities = [
        "decode_marker_regions",
        "extract_path_polyline",
        "extract_object_sprite",
        "generate_marker_scene",
    ]

    input_schema = {
        "type": "object",
        "required": ["mode"],
        "properties": {
            "mode": {"type": "string", "enum": ["analyze", "generate"]},
            "image_path": {
                "type": "string",
                "description": "Marked image to analyze (analyze mode) or clean base for marker edit (generate mode with base prompt omitted).",
            },
            "regions": {
                "type": "array",
                "description": (
                    "Marker region specs. Each: {name, hue (named band or [lo,hi] in "
                    "OpenCV 0-179 units), hex (alternative to hue), kind: path|sprite, "
                    "sat_min (default 0.12)}. Hue pairs must be >=30 apart in OpenCV "
                    "units (60 degrees)."
                ),
            },
            "output_dir": {"type": "string", "description": "Directory for outputs. Default: alongside the input image."},
            "remove_objects": {
                "type": "array",
                "description": "Object names (from regions, kind=sprite) to remove from the background via gen-edit.",
            },
            # --- generate-mode only ---
            "base_prompt": {"type": "string", "description": "Clean-base art prompt (no markers). Skipped when image_path is given."},
            "marker_prompt": {"type": "string", "description": "Marker pass prompt (recolor/add markers). Required for generate mode."},
            "size": {"type": "string", "default": "1536x1024"},
            "t2i_model": {"type": "string", "default": DEFAULT_T2I_MODEL},
            "edit_model": {"type": "string", "default": DEFAULT_EDIT_MODEL},
        },
    }

    resource_profile = ResourceProfile(
        cpu_cores=2, ram_mb=1024, vram_mb=0, disk_mb=50, network_required=False
    )
    retry_policy = RetryPolicy(max_retries=2, retryable_errors=["rate_limit", "timeout"])
    idempotency_key_fields = ["mode", "image_path", "marker_prompt"]
    side_effects = ["writes sprite/background/geometry files to output_dir", "generate mode calls image APIs"]
    user_visible_verification = ["Check geometry.json polylines visually against the marked image"]

    best_for = [
        "path-following object animation on gen images (boat along river)",
        "exact-anchor TSX overlays on gen-image features (arrows, labels on map regions)",
        "cutting an object out of a gen image as a clean RGBA sprite + clean background",
    ]
    not_good_for = [
        "thin directional paths (arrows render as blobs — encode wide bands instead)",
        "invisible/stealth markers (sat <0.05 cannot be decoded)",
        "exact hex fidelity (model drifts +-25 degrees; decode uses HSV bands)",
    ]

    # ------------------------------------------------------------------ status

    def get_status(self) -> ToolStatus:
        try:
            import cv2  # noqa: F401
            import numpy  # noqa: F401

            return ToolStatus.AVAILABLE
        except ImportError:
            return ToolStatus.UNAVAILABLE

    def estimate_cost(self, inputs: dict[str, Any]) -> float:
        # generate mode: 1 base call (0.5-2 USD via 9router gateway pricing varies)
        # + 1 marker-edit + 1 removal-edit per removed object. analyze = 0.
        if inputs.get("mode") != "generate":
            return 0.0
        calls = 1  # marker pass
        if inputs.get("base_prompt"):
            calls += 1
        calls += len(inputs.get("remove_objects") or [])
        return calls * 0.5  # rough upper bound via local gateway

    # ------------------------------------------------------------------ execute

    def execute(self, inputs: dict[str, Any]) -> ToolResult:
        start = time.time()
        mode = inputs.get("mode")
        try:
            if mode == "analyze":
                result = self._analyze(inputs)
            elif mode == "generate":
                result = self._generate(inputs)
            else:
                return ToolResult(success=False, error=f"Unknown mode: {mode}")
        except Exception as e:
            return ToolResult(success=False, error=f"hexpix_scene failed: {e}")
        result.duration_seconds = round(time.time() - start, 2)
        return result

    # ------------------------------------------------------------------ analyze

    def _analyze(self, inputs: dict[str, Any]) -> ToolResult:
        import cv2
        import numpy as np
        from PIL import Image

        image_path = Path(inputs["image_path"])
        if not image_path.is_file():
            return ToolResult(success=False, error=f"Image not found: {image_path}")
        regions = inputs.get("regions") or []
        if not regions:
            return ToolResult(success=False, error="regions required for analyze mode")

        out_dir = Path(inputs.get("output_dir") or image_path.parent)
        out_dir.mkdir(parents=True, exist_ok=True)

        img = np.asarray(Image.open(image_path).convert("RGB"))
        bgr = img[:, :, ::-1].copy()
        H, W = img.shape[:2]
        bg = img.copy()
        geometry: dict[str, Any] = {"source": str(image_path), "width": W, "height": H, "regions": {}}
        sprites = []

        for r in regions:
            name = r.get("name") or r.get("region")
            band = self._resolve_band(r)
            if band is None:
                geometry["regions"][name] = {"found": False, "error": "no hue/hex"}
                continue
            mask = _clean(_gate(bgr, band, r.get("sat_min", 0.12), r.get("sat_max", 1.0), 30))
            cov = int((mask > 0).sum())
            entry: dict[str, Any] = {"found": cov > 0, "pixels": cov, "hue_band": list(band)}
            if cov == 0:
                geometry["regions"][name] = entry
                continue

            comp = _largest_component(mask)
            if comp is None:
                geometry["regions"][name] = entry
                continue
            x, y, w, h = comp[2]
            entry["bbox"] = [x, y, w, h]
            entry["bbox_norm"] = [round(x / W, 4), round(y / H, 4), round(w / W, 4), round(h / H, 4)]
            entry["centroid_norm"] = [round((x + w / 2) / W, 4), round((y + h / 2) / H, 4)]

            if r.get("kind") == "path":
                poly = _polyline(mask, r.get("n_bins", 36))
                if poly:
                    entry["polyline"] = poly["points"]
                    entry["polyline_norm"] = [[round(px / W, 4), round(py / H, 4)] for px, py in poly["points"]]
            elif r.get("kind") == "sprite":
                sprite_path, sprite_meta = self._cut_sprite(img, mask, comp, out_dir, name)
                entry.update(sprite_meta)
                if sprite_path:
                    sprites.append(name)
                    # inpaint fallback background (gen-edit removal is preferred)
                    hm = np.zeros((H, W), np.uint8)
                    i, labels, _ = comp
                    hm[labels == i] = 255
                    hm = cv2.dilate(hm, np.ones((7, 7), np.uint8))
                    bg[:, :, ::-1] = cv2.inpaint(bgr, hm, 5, cv2.INPAINT_TELEA)
            geometry["regions"][name] = entry

        if sprites:
            bg_path = out_dir / "hexpix_bg_inpainted_fallback.png"
            Image.fromarray(bg).save(bg_path)
            geometry["background_fallback"] = str(bg_path)

        geo_path = out_dir / "geometry.json"
        geo_path.write_text(json.dumps(geometry, indent=2, ensure_ascii=False), encoding="utf-8")

        missing = [n for n, e in geometry["regions"].items() if not e.get("found")]
        return ToolResult(
            success=not missing,
            error=f"Regions not found: {missing}" if missing else "",
            data={"geometry": str(geo_path), "regions": geometry["regions"], "not_found": missing},
            artifacts=[str(geo_path)],
        )

    def _cut_sprite(self, img, mask, comp, out_dir, name):
        import numpy as np
        from PIL import Image

        i, labels, (x, y, w, h) = comp
        sub = (labels[y:y + h, x:x + w] == i)
        pad = 8
        sprite = np.zeros((h + 2 * pad, w + 2 * pad, 4), dtype=np.uint8)
        sprite[pad:pad + h, pad:pad + w, :3] = img[y:y + h, x:x + w]
        sprite[pad:pad + h, pad:pad + w, 3] = (sub * 255).astype(np.uint8)
        p = out_dir / f"hexpix_sprite_{name}.png"
        Image.fromarray(sprite).save(p)
        meta = {"sprite": str(p), "transparent_pct": round(100 * (sprite[:, :, 3] == 0).mean(), 1)}
        # Inverse-mask variant: inside the bbox, non-marker = object. The pure
        # marker mask misses dark edges (boatman outline). Prefer this when the
        # object sits inside a marked region — caller chooses per skill §sprite-cut.
        return str(p), meta

    def _resolve_band(self, region: dict[str, Any]) -> tuple[int, int] | None:
        if isinstance(region.get("hue"), str):
            return DEFAULT_HUE_BANDS.get(region["hue"].lower())
        if isinstance(region.get("hue"), (list, tuple)) and len(region["hue"]) == 2:
            return (int(region["hue"][0]), int(region["hue"][1]))
        if region.get("hex"):
            return _hue_band(str(region["hex"]))
        return None

    # ------------------------------------------------------------------ generate

    def _generate(self, inputs: dict[str, Any]) -> ToolResult:
        image_tool = self._image_tool()
        if image_tool is None:
            return ToolResult(
                success=False,
                error="openai_image tool unavailable (OPENAI_API_KEY missing). Use analyze mode or configure the gateway.",
            )

        out_dir = Path(inputs.get("output_dir") or ".")
        out_dir.mkdir(parents=True, exist_ok=True)
        size = inputs.get("size", "1536x1024")

        # Pass 0 (optional): clean base, no markers
        base_path = inputs.get("image_path")
        if not base_path and inputs.get("base_prompt"):
            p = out_dir / "hexpix_base.png"
            r = image_tool.execute({
                "prompt": inputs["base_prompt"], "size": size,
                "model": inputs.get("t2i_model", DEFAULT_T2I_MODEL),
                "output_path": str(p),
            })
            if not r.success:
                return ToolResult(success=False, error=f"Base pass failed: {r.error}")
            base_path = str(p)

        # Pass 1: markers (fresh gen, or identity-preserving edit on the base)
        marker_prompt = inputs["marker_prompt"]
        marked_p = out_dir / "hexpix_marked.png"
        gen_inputs: dict[str, Any] = {
            "prompt": marker_prompt, "size": size, "output_path": str(marked_p),
        }
        if base_path:
            gen_inputs["image_path"] = str(base_path)
            gen_inputs["model"] = inputs.get("edit_model", DEFAULT_EDIT_MODEL)
        else:
            gen_inputs["model"] = inputs.get("t2i_model", DEFAULT_T2I_MODEL)
        r = image_tool.execute(gen_inputs)
        if not r.success:
            return ToolResult(success=False, error=f"Marker pass failed: {r.error}")

        # Decode
        a = self._analyze({"image_path": str(marked_p), "regions": inputs.get("regions") or [], "output_dir": str(out_dir)})
        if not a.success:
            return ToolResult(
                success=False,
                error=f"Decode after marker pass failed: {a.error}",
                data={"marked": str(marked_p), "analyze": a.data},
                artifacts=[str(marked_p)],
            )

        # Pass 2: object removal via gen-edit (manual inpaint failed 9/9 — doctrine §4b)
        removed: dict[str, str] = {}
        for obj in inputs.get("remove_objects") or []:
            sprite = a.data.get("regions", {}).get(obj, {}).get("sprite")
            region = next((x for x in inputs.get("regions") or [] if (x.get("name") or x.get("region")) == obj), {})
            fill = region.get("fill", "the surrounding area")
            bg_p = out_dir / f"hexpix_bg_no_{obj}.png"
            r = image_tool.execute({
                "prompt": (
                    f"Remove the {obj} completely from this exact image. Fill with "
                    f"{fill}, matching texture and color exactly. Keep EVERYTHING "
                    "else EXACTLY identical."
                ),
                "image_path": str(marked_p), "size": size,
                "model": inputs.get("edit_model", DEFAULT_EDIT_MODEL),
                "output_path": str(bg_p),
            })
            if r.success:
                removed[obj] = str(bg_p)
            else:
                removed[obj] = f"FAILED: {r.error}"

        geo = json.loads(Path(a.data["geometry"]).read_text(encoding="utf-8"))
        geo["removed_backgrounds"] = removed
        Path(a.data["geometry"]).write_text(json.dumps(geo, indent=2, ensure_ascii=False), encoding="utf-8")

        return ToolResult(
            success=True,
            data={"marked": str(marked_p), "geometry": a.data["geometry"], "removed_backgrounds": removed},
            artifacts=[str(marked_p), a.data["geometry"]] + list(removed.values()),
        )

    def _image_tool(self):
        try:
            from tools.graphics.openai_image import OpenAIImage

            tool = OpenAIImage()
            return tool if tool.get_status() == ToolStatus.AVAILABLE else None
        except Exception:
            return None
