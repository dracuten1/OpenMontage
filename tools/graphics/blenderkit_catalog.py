"""Free reusable BlenderKit asset search, local cache provenance, and Blender EEVEE probe tool."""
from __future__ import annotations

import importlib.util
import json
import subprocess
from pathlib import Path
from typing import Any

from tools.base_tool import (
    BaseTool,
    Determinism,
    ExecutionMode,
    ResourceProfile,
    ToolResult,
    ToolRuntime,
    ToolStability,
    ToolStatus,
    ToolTier,
)
from tools.graphics.blender_world import find_blender

_REPO_ROOT = Path(__file__).resolve().parents[2]
_KIT_PATH = Path(__file__).resolve().parent / "templates" / "blender_explainer_kit.py"


def _load_kit():
    spec = importlib.util.spec_from_file_location("openmontage_blender_explainer_kit", _KIT_PATH)
    assert spec and spec.loader
    mod = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(mod)
    return mod


class BlenderKitCatalog(BaseTool):
    """Discover, cache, and Blender-probe free BlenderKit .blend assets for explainer scenes."""

    name = "blenderkit_catalog"
    version = "0.1.0"
    tier = ToolTier.SOURCE
    capability = "3d_asset_acquisition"
    provider = "blenderkit"
    stability = ToolStability.BETA
    execution_mode = ExecutionMode.SYNC
    determinism = Determinism.SEEDED
    runtime = ToolRuntime.HYBRID
    dependencies: list[str] = []
    install_instructions = "Requires network access for BlenderKit search/download; local Blender for probe."
    agent_skills = ["blender-explainer-animation", "3d-asset-generation"]
    capabilities = ["blenderkit_search", "blend_download_cache", "blender_probe_qa", "geonodes_bake"]
    best_for = [
        "Reusing free BlenderKit .blend models (animals, foliage, props, books, furniture) before custom modeling",
        "Caching local .blend provenance and validating polygon budget + orientation with a 1-frame EEVEE probe",
    ]
    not_good_for = [
        "Paid or text-to-3D custom hero sculpting",
        "Bypassing visual probe QA on unverified downloads",
    ]
    input_schema = {
        "type": "object",
        "required": ["operation"],
        "properties": {
            "operation": {"type": "string", "enum": ["search", "download", "probe"]},
            "query": {"type": "string"},
            "slug": {"type": "string"},
            "cache_dir": {"type": "string"},
            "blend_path": {"type": "string"},
            "output_path": {"type": "string"},
            "skip_ids": {"type": "array", "items": {"type": "string"}},
            "max_results": {"type": "integer", "minimum": 1, "maximum": 30, "default": 8},
            "max_polys": {"type": "integer", "minimum": 100, "default": 100000},
            "target_max_dim": {"type": "number", "minimum": 0.05, "default": 1.8},
        },
    }
    output_schema = {"type": "object"}
    artifact_schema = {"artifact": "3d_asset"}
    resource_profile = ResourceProfile(cpu_cores=2, ram_mb=1024, vram_mb=0, disk_mb=2000, network_required=True)
    idempotency_key_fields = ["operation", "query", "slug", "blend_path", "max_polys"]
    side_effects = ["downloads cached .blend files and updates blenderkit_manifest.json"]
    fallback_tools = ["threejs_asset_catalog", "blender_world"]
    user_visible_verification = [
        "Inspect rendered 1-frame EEVEE probe preview with multimodal read_file before approving asset",
    ]

    def get_status(self) -> ToolStatus:
        return ToolStatus.AVAILABLE if _KIT_PATH.is_file() else ToolStatus.UNAVAILABLE

    def execute(self, params: dict[str, Any]) -> ToolResult:
        operation = str(params.get("operation") or "")
        kit = _load_kit()

        if operation == "search":
            query = str(params.get("query") or "").strip()
            if not query:
                return ToolResult(success=False, error="query is required for search")
            max_results = int(params.get("max_results", 8))
            results = kit.search_blenderkit(query, max_results=max_results)
            return ToolResult(success=True, data={"query": query, "results": results})

        if operation == "download":
            slug = str(params.get("slug") or "").strip()
            query = str(params.get("query") or "").strip()
            if not slug or not query:
                return ToolResult(success=False, error="slug and query are required for download")
            cache_dir = Path(str(params.get("cache_dir") or (_REPO_ROOT / ".cache" / "blenderkit_assets")))
            skip_ids = set(params.get("skip_ids") or [])
            max_results = int(params.get("max_results", 8))
            out_path, entry = kit.download_blenderkit_model(
                slug, query, cache_dir, skip_ids=skip_ids, max_results=max_results
            )
            return ToolResult(
                success=True,
                data=entry,
                artifacts=[str(out_path), str(cache_dir.resolve() / "blenderkit_manifest.json")],
            )

        if operation == "probe":
            blend_raw = params.get("blend_path")
            if not blend_raw:
                return ToolResult(success=False, error="blend_path is required for probe")
            blend_path = Path(str(blend_raw)).expanduser().resolve()
            if not blend_path.is_file():
                return ToolResult(success=False, error=f"Missing .blend file: {blend_path}")
            blender = find_blender()
            if not blender:
                return ToolResult(success=False, error="Blender binary not found for probe")

            cmd = [
                str(blender),
                "--background",
                "--python",
                str(_KIT_PATH),
                "--",
                "--probe",
                str(blend_path),
                "--max-polys",
                str(int(params.get("max_polys", 100_000))),
                "--target-max-dim",
                str(float(params.get("target_max_dim", 1.8))),
            ]
            out_raw = params.get("output_path")
            if out_raw:
                cmd.extend(["--out", str(Path(str(out_raw)).expanduser().resolve())])
            proc = subprocess.run(cmd, capture_output=True, text=True, encoding="utf-8", errors="replace", timeout=180)
            if proc.returncode != 0:
                return ToolResult(success=False, error=(proc.stderr or proc.stdout)[-2000:])
            probe_line = next(
                (ln for ln in proc.stdout.splitlines() if ln.startswith("OPENMONTAGE_PROBE_JSON=")), ""
            )
            if not probe_line:
                return ToolResult(success=False, error="Probe output missing OPENMONTAGE_PROBE_JSON")
            report = json.loads(probe_line.split("=", 1)[1])
            artifacts = [report["preview_path"]] if report.get("preview_path") else []
            return ToolResult(success=bool(report.get("passed", True)), data=report, artifacts=artifacts)

        return ToolResult(success=False, error=f"Unknown operation: {operation!r}")
