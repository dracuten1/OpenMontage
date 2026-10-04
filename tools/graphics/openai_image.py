"""OpenAI GPT Image generation (gpt-image-2, cx/gpt-*, 9router gateway)."""

from __future__ import annotations

import base64
import os
import sys
import time
from pathlib import Path
from typing import Any

# Ensure repo root is on sys.path when invoked directly as a script
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


class OpenAIImage(BaseTool):
    name = "openai_image"
    version = "0.2.0"
    tier = ToolTier.GENERATE
    capability = "image_generation"
    provider = "openai"
    stability = ToolStability.BETA
    execution_mode = ExecutionMode.SYNC
    determinism = Determinism.STOCHASTIC
    runtime = ToolRuntime.API

    dependencies = []  # checked dynamically
    install_instructions = (
        "Set OPENAI_API_KEY to your OpenAI API key.\n"
        "  pip install openai"
    )
    agent_skills = ["flux-best-practices"]  # general image gen knowledge

    capabilities = [
        "generate_image",
        "generate_illustration",
        "text_to_image",
        "image_to_image",
    ]
    supports = {
        "complex_instructions": True,
        "text_in_image": True,
        "multiple_outputs": True,
        "image_to_image": True,
    }
    best_for = [
        "complex multi-element compositions",
        "images with text/labels",
        "following detailed instructions accurately",
        "image-to-image editing (cx/gpt-image-2.5-flare, cx/gpt-image-2.5-sunburst)",
    ]
    not_good_for = ["offline generation", "budget-constrained projects at high quality without local gateway"]

    input_schema = {
        "type": "object",
        "required": ["prompt"],
        "properties": {
            "prompt": {"type": "string"},
            "model": {
                "type": "string",
                "description": (
                    "Model id. Default: OPENAI_IMAGE_MODEL env or gpt-image-2. "
                    "OpenAI-compatible gateways (e.g. local 9router) expose: "
                    "Text2Image: cx/gpt-image-2.5, cx/gpt-5.6-luna-image, cx/gpt-5.6-terra-image, ag/gemini-3.1-flash-image. "
                    "Img2Img: cx/gpt-image-2.5-flare, cx/gpt-image-2.5-sunburst."
                ),
                "default": "gpt-image-2",
            },
            "image_path": {
                "type": "string",
                "description": (
                    "Path to an input image (local file, URL, or data URI) for image-to-image "
                    "editing. For models like cx/gpt-image-2.5-flare and cx/gpt-image-2.5-sunburst, "
                    "the image is base64-encoded and embedded directly in the prompt."
                ),
            },
            "image_url": {
                "type": "string",
                "description": "Optional image URL for image-to-image editing.",
            },
            "size": {
                "type": "string",
                "description": "Image dimensions or 'auto' (e.g. 'auto', '1024x1024', '1536x1024', '1024x1536').",
                "default": "1024x1024",
            },
            "quality": {
                "type": "string",
                "description": "Quality tier ('low', 'medium', 'high', 'auto').",
                "default": "high",
            },
            "background": {
                "type": "string",
                "enum": ["auto", "transparent", "opaque"],
                "default": "auto",
                "description": "Background transparency setting.",
            },
            "image_detail": {
                "type": "string",
                "enum": ["auto", "low", "high"],
                "default": "high",
                "description": "Detail level passed via extra_body (for cx/ models on 9router).",
            },
            "output_format": {
                "type": "string",
                "enum": ["png", "jpeg", "webp"],
                "default": "png",
            },
            "n": {"type": "integer", "default": 1, "minimum": 1, "maximum": 4},
            "output_path": {"type": "string"},
        },
    }

    resource_profile = ResourceProfile(
        cpu_cores=1, ram_mb=512, vram_mb=0, disk_mb=100, network_required=True
    )
    retry_policy = RetryPolicy(max_retries=2, retryable_errors=["rate_limit", "timeout"])
    idempotency_key_fields = ["prompt", "size", "quality", "model"]
    side_effects = ["writes image file to output_path", "calls OpenAI API"]
    user_visible_verification = ["Inspect generated image for relevance and quality"]

    @staticmethod
    def _encode_image_to_data_uri(image_ref: str) -> str:
        """Convert a local path, URL, or data URI into a base64 data URI string."""
        if image_ref.startswith("data:image/"):
            return image_ref

        p = Path(image_ref)
        if p.is_file():
            raw = p.read_bytes()
            ext = p.suffix.lower().lstrip(".")
            if ext in ("jpg", "jpeg"):
                mime = "image/jpeg"
            elif ext in ("png", "webp", "gif"):
                mime = f"image/{ext}"
            else:
                mime = "image/png"
            b64 = base64.b64encode(raw).decode("utf-8")
            return f"data:{mime};base64,{b64}"

        if image_ref.startswith(("http://", "https://")):
            import urllib.request
            with urllib.request.urlopen(image_ref, timeout=30) as resp:
                raw = resp.read()
                mime = resp.headers.get("Content-Type", "image/png").split(";")[0].strip()
                b64 = base64.b64encode(raw).decode("utf-8")
                return f"data:{mime};base64,{b64}"

        # If already a raw base64 string
        if len(image_ref) > 100 and not any(c in image_ref for c in ("\n", " ", "/", "\\")):
            return f"data:image/png;base64,{image_ref}"

        return image_ref

    @staticmethod
    def _output_paths(output_path: str | None, count: int, extension: str) -> list[Path]:
        """Derive one output path per generated image.

        With a single image, honor the requested path as-is. With several,
        suffix each with `_1`, `_2`, … so no image overwrites another.
        """
        ext = extension if extension.startswith(".") else f".{extension}"
        if not output_path:
            return [Path(f"generated_image_{idx + 1}{ext}") for idx in range(count)]

        path = Path(output_path)
        suffix = path.suffix or ext
        if count == 1:
            return [path if path.suffix else path.with_suffix(suffix)]

        base = path.with_suffix("") if path.suffix else path
        return [base.parent / f"{base.name}_{idx + 1}{suffix}" for idx in range(count)]

    @staticmethod
    def _is_local_gateway() -> bool:
        base_url = os.environ.get("OPENAI_BASE_URL", "").lower()
        return "127.0.0.1" in base_url or "localhost" in base_url

    def get_status(self) -> ToolStatus:
        if os.environ.get("OPENAI_API_KEY"):
            return ToolStatus.AVAILABLE
        return ToolStatus.UNAVAILABLE

    def estimate_cost(self, inputs: dict[str, Any]) -> float:
        # gpt-image-2 per-image pricing at 1024x1024 (non-square sizes run
        # slightly cheaper): https://developers.openai.com/api/docs/guides/image-generation
        quality = inputs.get("quality", "high")
        n = inputs.get("n", 1)
        cost_map = {"low": 0.006, "medium": 0.053, "high": 0.211, "auto": 0.053}
        return cost_map.get(quality, 0.053) * n

    @staticmethod
    def _generate_via_sse(
        base_url: str,
        api_key: str,
        model: str,
        prompt: str,
        size: str,
        quality: str,
        background: str,
        image_detail: str,
        output_format: str,
        n: int,
        timeout: float = 120.0,
    ) -> list[dict[str, Any]]:
        """Fallback direct call to local gateway using Server-Sent Events (SSE)."""
        import json
        import urllib.request

        url = f"{base_url.rstrip('/')}/images/generations"
        payload = {
            "model": model,
            "prompt": prompt,
            "n": n,
            "size": size,
            "quality": quality,
            "background": background,
            "image_detail": image_detail,
            "output_format": output_format,
        }
        req = urllib.request.Request(
            url,
            data=json.dumps(payload).encode("utf-8"),
            headers={
                "Content-Type": "application/json",
                "Authorization": f"Bearer {api_key}",
                "Accept": "text/event-stream",
            },
        )
        with urllib.request.urlopen(req, timeout=timeout) as resp:
            last_event = None
            for raw_line in resp:
                line = raw_line.decode("utf-8", errors="replace").strip()
                if not line:
                    continue
                if line.startswith("event:"):
                    last_event = line.split(":", 1)[1].strip()
                elif line.startswith("data:"):
                    data_str = line.split(":", 1)[1].strip()
                    if last_event == "done" or '"b64_json"' in data_str:
                        parsed = json.loads(data_str)
                        return parsed.get("data", [])
        return []

    def execute(self, inputs: dict[str, Any]) -> ToolResult:
        if not os.environ.get("OPENAI_API_KEY"):
            return ToolResult(
                success=False,
                error="OPENAI_API_KEY not set. " + self.install_instructions,
            )

        from openai import OpenAI

        start = time.time()
        timeout = float(inputs.get("timeout", 180.0))
        try:
            client = OpenAI(timeout=timeout)
        except TypeError:
            client = OpenAI()

        image_ref = inputs.get("image_path") or inputs.get("image_url")
        prompt = inputs["prompt"]

        if image_ref:
            data_uri = self._encode_image_to_data_uri(image_ref)
            if data_uri not in prompt:
                prompt = f"{prompt}\n\n{data_uri}"

        # Determine model
        if inputs.get("model"):
            model = inputs["model"]
        elif image_ref:
            model = os.environ.get("OPENAI_IMG2IMG_MODEL", "cx/gpt-image-2.5-sunburst")
        else:
            model = os.environ.get("OPENAI_IMAGE_MODEL", "gpt-image-2")

        # Set default size/quality intelligently if model is from cx/
        is_cx = str(model).startswith("cx/")
        size = inputs.get("size") or ("auto" if is_cx else "1024x1024")
        quality = inputs.get("quality") or ("auto" if is_cx else "high")
        background = inputs.get("background", "auto")
        image_detail = inputs.get("image_detail", "high")
        output_format = inputs.get("output_format", "png")
        n = inputs.get("n", 1)

        try:
            generate_kwargs: dict[str, Any] = {
                "model": model,
                "prompt": prompt,
                "size": size,
                "quality": quality,
                "output_format": output_format,
                "n": n,
            }
            if background is not None:
                generate_kwargs["background"] = background
            if image_detail:
                generate_kwargs["extra_body"] = {"image_detail": image_detail}

            try:
                response = client.images.generate(**generate_kwargs)
            except TypeError:
                # Fallback for mock clients or older SDK signatures
                minimal_kwargs = {
                    "model": model,
                    "prompt": prompt,
                    "size": size,
                    "quality": quality,
                    "output_format": output_format,
                    "n": n,
                }
                response = client.images.generate(**minimal_kwargs)

            items = getattr(response, "data", None) or []
            if not items and self._is_local_gateway():
                base_url = str(getattr(client, "base_url", "") or os.environ.get("OPENAI_BASE_URL", ""))
                api_key = str(getattr(client, "api_key", "") or os.environ.get("OPENAI_API_KEY", ""))
                items = self._generate_via_sse(
                    base_url, api_key, model, prompt, size, quality, background, image_detail, output_format, n
                )

            if not items:
                return ToolResult(success=False, error="OpenAI returned no image outputs")

            ext = output_format
            output_paths = self._output_paths(inputs.get("output_path"), len(items), ext)
            outputs: list[str] = []
            for item, out_path in zip(items, output_paths):
                out_path.parent.mkdir(parents=True, exist_ok=True)
                b64 = (
                    getattr(item, "b64_json", None)
                    if hasattr(item, "b64_json")
                    else (item.get("b64_json") if isinstance(item, dict) else None)
                )
                if b64:
                    out_path.write_bytes(base64.b64decode(b64))
                elif getattr(item, "url", None):
                    import urllib.request
                    with urllib.request.urlopen(item.url, timeout=30) as u_resp:
                        out_path.write_bytes(u_resp.read())
                outputs.append(str(out_path))

        except Exception as e:
            return ToolResult(success=False, error=f"OpenAI image generation failed: {e}")

        return ToolResult(
            success=True,
            data={
                "provider": "openai",
                "model": model,
                "prompt": prompt,
                "output": outputs[0],
                "outputs": outputs,
                "images_generated": len(outputs),
                "is_img2img": bool(image_ref),
            },
            artifacts=outputs,
            cost_usd=self.estimate_cost(inputs),
            duration_seconds=round(time.time() - start, 2),
            model=model,
        )


if __name__ == "__main__":
    import argparse
    import json
    import sys

    try:
        import dotenv
        dotenv.load_dotenv()
    except ImportError:
        pass

    parser = argparse.ArgumentParser(description="Generate an image via OpenAI or local 9router gateway.")
    parser.add_argument("--prompt", "-p", required=True, help="Image prompt text")
    parser.add_argument("--model", "-m", default=None, help="Model ID (e.g. cx/gpt-5.6-luna-image, cx/gpt-image-2.5-sunburst)")
    parser.add_argument("--image", "-i", default=None, help="Input image path or URL for img2img")
    parser.add_argument("--output", "-o", default=None, help="Output path (e.g. image.png)")
    parser.add_argument("--size", default=None, help="Resolution (e.g. auto, 1024x1024)")
    parser.add_argument("--quality", default=None, help="Quality (auto, high, medium, low)")
    parser.add_argument("--background", default="auto", choices=["auto", "transparent", "opaque"])
    parser.add_argument("--detail", default="high", choices=["auto", "low", "high"])
    parser.add_argument("--format", default="png", choices=["png", "jpeg", "webp"])
    parser.add_argument("-n", type=int, default=1, help="Number of images")

    args = parser.parse_args()
    tool = OpenAIImage()
    cli_inputs = {
        "prompt": args.prompt,
        "n": args.n,
        "background": args.background,
        "image_detail": args.detail,
        "output_format": args.format,
    }
    if args.model:
        cli_inputs["model"] = args.model
    if args.image:
        cli_inputs["image_path"] = args.image
    if args.output:
        cli_inputs["output_path"] = args.output
    if args.size:
        cli_inputs["size"] = args.size
    if args.quality:
        cli_inputs["quality"] = args.quality

    cli_res = tool.execute(cli_inputs)
    if cli_res.success:
        print(f"Generated {len(cli_res.artifacts)} image(s) [model: {cli_res.model}]:")
        for art in cli_res.artifacts:
            print(f"  - {art}")
        sys.exit(0)
    else:
        print(f"Failed: {cli_res.error}", file=sys.stderr)
        sys.exit(1)

