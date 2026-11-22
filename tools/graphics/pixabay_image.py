"""Stock image acquisition from Pixabay API (free) with Wikimedia Commons CC fallback."""

from __future__ import annotations

import os
import re
import time
from pathlib import Path
from typing import Any

import requests

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


class PixabayImage(BaseTool):
    name = "pixabay_image"
    version = "0.1.0"
    tier = ToolTier.SOURCE
    capability = "image_generation"
    provider = "pixabay"
    stability = ToolStability.BETA
    execution_mode = ExecutionMode.SYNC
    determinism = Determinism.DETERMINISTIC
    runtime = ToolRuntime.API

    dependencies = []
    install_instructions = (
        "Set PIXABAY_API_KEY to your Pixabay API key.\n"
        "  Get one free at https://pixabay.com/api/docs/"
    )
    agent_skills = []

    capabilities = ["search_image", "download_image", "stock_image"]
    supports = {
        "orientation_filter": True,
        "category_filter": True,
        "color_filter": True,
        "image_type_filter": True,
        "editors_choice": True,
        "free_commercial_use": True,
    }
    best_for = [
        "large royalty-free library (5M+ images)",
        "category-based filtering (nature, business, science, etc.)",
        "free stock images — no cost, no attribution required",
    ]
    not_good_for = [
        "full-resolution originals (standard API limited to 1280px)",
        "custom compositions",
        "offline use",
    ]

    input_schema = {
        "type": "object",
        "required": ["query"],
        "properties": {
            "query": {"type": "string", "description": "Search term (max 100 chars)"},
            "image_type": {
                "type": "string",
                "enum": ["all", "photo", "illustration", "vector"],
                "default": "all",
            },
            "orientation": {
                "type": "string",
                "enum": ["all", "horizontal", "vertical"],
                "default": "all",
            },
            "category": {
                "type": "string",
                "enum": [
                    "backgrounds", "fashion", "nature", "science", "education",
                    "feelings", "health", "people", "religion", "places",
                    "animals", "industry", "computer", "food", "sports",
                    "transportation", "travel", "buildings", "business", "music",
                ],
            },
            "colors": {
                "type": "string",
                "description": "Comma-separated: grayscale, transparent, red, orange, yellow, green, turquoise, blue, lilac, pink, white, gray, black, brown",
            },
            "editors_choice": {"type": "boolean", "default": False},
            "safesearch": {"type": "boolean", "default": True},
            "per_page": {"type": "integer", "default": 5, "minimum": 3, "maximum": 200},
            "page": {"type": "integer", "default": 1},
            "output_path": {"type": "string"},
            "allow_wikimedia_fallback": {"type": "boolean", "default": True},
            "min_width": {"type": "integer", "default": 800},
            "min_height": {"type": "integer", "default": 600},
        },
    }

    resource_profile = ResourceProfile(
        cpu_cores=1, ram_mb=256, vram_mb=0, disk_mb=50, network_required=True
    )
    retry_policy = RetryPolicy(max_retries=2, retryable_errors=["rate_limit", "timeout"])
    idempotency_key_fields = ["query", "image_type", "orientation", "category", "page"]
    side_effects = ["writes image file to output_path", "calls Pixabay API"]
    user_visible_verification = ["Check that downloaded image matches the intended scene"]

    def get_status(self) -> ToolStatus:
        if os.environ.get("PIXABAY_API_KEY"):
            return ToolStatus.AVAILABLE
        return ToolStatus.UNAVAILABLE

    def estimate_cost(self, inputs: dict[str, Any]) -> float:
        return 0.0  # Pixabay is free

    @staticmethod
    def _fetch_wikimedia_commons(
        query: str,
        orientation: str,
        output_path: Path,
        min_width: int = 800,
        min_height: int = 600,
    ) -> dict[str, Any]:
        """Search Wikimedia Commons for a CC/PD-licensed JPEG/PNG matching dimensions."""
        headers = {"User-Agent": "OpenMontage/3.0 (editorial archival media fetcher)"}
        params = {
            "action": "query",
            "format": "json",
            "generator": "search",
            "gsrsearch": query,
            "gsrnamespace": 6,
            "gsrlimit": 12,
            "prop": "imageinfo",
            "iiprop": "url|size|mime|extmetadata",
        }
        resp = requests.get("https://commons.wikimedia.org/w/api.php", params=params, headers=headers, timeout=30)
        resp.raise_for_status()
        pages = resp.json().get("query", {}).get("pages", {})
        if not isinstance(pages, dict) or not pages:
            raise RuntimeError(f"No Wikimedia Commons results for query: {query}")

        license_pattern = re.compile(r"\b(cc|creative commons|public domain|pd|cc0)\b", re.IGNORECASE)
        for page in pages.values():
            infos = page.get("imageinfo") or []
            if not infos:
                continue
            info = infos[0]
            mime = str(info.get("mime", "")).lower()
            if mime not in {"image/jpeg", "image/png"}:
                continue
            w = int(info.get("width") or 0)
            h = int(info.get("height") or 0)
            if w < min_width or h < min_height:
                continue
            if orientation == "horizontal" and w < h:
                continue
            if orientation == "vertical" and h <= w:
                continue

            ext = info.get("extmetadata") or {}
            lic = str((ext.get("LicenseShortName") or ext.get("UsageTerms") or {}).get("value", "")).strip()
            if not lic or not license_pattern.search(lic) or "nc" in lic.lower():
                continue
            artist_raw = str((ext.get("Artist") or {}).get("value", "Unknown"))
            author = re.sub(r"<[^>]+>", "", artist_raw).strip() or "Unknown"

            image_url = info.get("url")
            if not image_url:
                continue
            img_resp = requests.get(image_url, headers=headers, timeout=60)
            img_resp.raise_for_status()
            output_path.parent.mkdir(parents=True, exist_ok=True)
            output_path.write_bytes(img_resp.content)

            return {
                "provider": "wikimedia_commons",
                "title": page.get("title", ""),
                "user": author,
                "author": author,
                "image_width": w,
                "image_height": h,
                "query": query,
                "output": str(output_path),
                "license": lic,
                "page_url": info.get("descriptionurl", ""),
            }

        raise RuntimeError(f"No suitable CC/PD Wikimedia Commons JPEG/PNG found for query: {query}")

    def _run_wikimedia_fallback(
        self,
        inputs: dict[str, Any],
        output_path: Path,
        reason: str,
        start: float,
    ) -> ToolResult:
        """Execute Wikimedia Commons fallback cleanly and attach fallback_reason."""
        data = self._fetch_wikimedia_commons(
            query=inputs["query"],
            orientation=inputs.get("orientation", "all"),
            output_path=output_path,
            min_width=int(inputs.get("min_width", 800)),
            min_height=int(inputs.get("min_height", 600)),
        )
        data["fallback_reason"] = reason
        return ToolResult(
            success=True,
            data=data,
            artifacts=[str(output_path)],
            cost_usd=0.0,
            duration_seconds=round(time.time() - start, 2),
        )

    def execute(self, inputs: dict[str, Any]) -> ToolResult:
        api_key = os.environ.get("PIXABAY_API_KEY")
        allow_fallback = bool(inputs.get("allow_wikimedia_fallback", True))
        start = time.time()
        query = inputs["query"]
        default_out = Path(inputs.get("output_path", "wikimedia_fallback.jpg"))

        if not api_key:
            if allow_fallback:
                try:
                    return self._run_wikimedia_fallback(inputs, default_out, "PIXABAY_API_KEY missing", start)
                except Exception as exc:
                    return ToolResult(success=False, error=f"PIXABAY_API_KEY not set and Wikimedia fallback failed: {exc}")
            return ToolResult(
                success=False,
                error="PIXABAY_API_KEY not set. " + self.install_instructions,
            )

        params: dict[str, Any] = {
            "key": api_key,
            "q": query,
            # Pixabay rejects per_page outside 3-200 with HTTP 400
            "per_page": max(3, min(inputs.get("per_page", 5), 200)),
            "page": inputs.get("page", 1),
            "safesearch": str(inputs.get("safesearch", True)).lower(),
        }
        if inputs.get("image_type") and inputs["image_type"] != "all":
            params["image_type"] = inputs["image_type"]
        if inputs.get("orientation") and inputs["orientation"] != "all":
            params["orientation"] = inputs["orientation"]
        if inputs.get("category"):
            params["category"] = inputs["category"]
        if inputs.get("colors"):
            params["colors"] = inputs["colors"]
        if inputs.get("editors_choice"):
            params["editors_choice"] = "true"

        try:
            search_response = requests.get(
                "https://pixabay.com/api/",
                params=params,
                timeout=30,
            )
            search_response.raise_for_status()
            data = search_response.json()

            hits = data.get("hits", [])
            if not hits:
                if allow_fallback:
                    return self._run_wikimedia_fallback(inputs, default_out, "Pixabay returned zero hits", start)
                return ToolResult(
                    success=False,
                    error=f"No images found for query: {query}",
                    data={"total_results": data.get("total", 0)},
                )

            hit = hits[0]
            # largeImageURL is the best available at standard API tier (1280px)
            image_url = hit.get("largeImageURL", hit.get("webformatURL"))

            # Download immediately — Pixabay URLs contain embedded tokens that expire
            image_response = requests.get(image_url, timeout=60)
            image_response.raise_for_status()

            output_path = Path(inputs.get("output_path", f"pixabay_{hit['id']}.jpg"))
            output_path.parent.mkdir(parents=True, exist_ok=True)
            output_path.write_bytes(image_response.content)

        except Exception as e:
            if allow_fallback:
                try:
                    return self._run_wikimedia_fallback(inputs, default_out, f"Pixabay failed ({e})", start)
                except Exception as fb_exc:
                    return ToolResult(
                        success=False,
                        error=f"Pixabay image search failed: {e}; Wikimedia fallback failed: {fb_exc}",
                    )
            return ToolResult(success=False, error=f"Pixabay image search failed: {e}")

        return ToolResult(
            success=True,
            data={
                "provider": "pixabay",
                "image_id": hit["id"],
                "user": hit.get("user", "Unknown"),
                "tags": hit.get("tags", ""),
                "image_width": hit.get("imageWidth"),
                "image_height": hit.get("imageHeight"),
                "query": query,
                "output": str(output_path),
                "total_results": data.get("total", 0),
                "results_returned": len(hits),
                "license": "Pixabay Content License (free, no attribution required)",
                "page_url": hit.get("pageURL", ""),
            },
            artifacts=[str(output_path)],
            cost_usd=0.0,
            duration_seconds=round(time.time() - start, 2),
        )
