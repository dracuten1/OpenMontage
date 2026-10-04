"""Regression tests: openai_image must return every image it requests and bills for.

`execute()` requested `n` images from the API and `estimate_cost` scales with
`n`, but result handling was hardcoded to `response.data[0]` — images 1..n-1
were decoded never, written never, and absent from `artifacts`. The user paid
for `n` images and received one. The sibling tools (`grok_image`,
`dashscope_image`) already loop over every returned image.
"""

import base64
import sys
import types
from pathlib import Path

import pytest

PROJECT_ROOT = Path(__file__).resolve().parent.parent.parent
sys.path.insert(0, str(PROJECT_ROOT))


class _FakeImage:
    def __init__(self, payload: bytes):
        self.b64_json = base64.b64encode(payload).decode()


class _FakeResponse:
    def __init__(self, n: int):
        self.data = [_FakeImage(f"IMAGE_{i}".encode()) for i in range(n)]


class _FakeImages:
    def __init__(self):
        self.last_kwargs = {}

    def generate(self, **kwargs):
        self.last_kwargs = kwargs
        return _FakeResponse(kwargs["n"])


class _FakeClient:
    def __init__(self, *a, **k):
        self.images = _FakeImages()


@pytest.fixture
def openai_tool(monkeypatch):
    # Stub the `openai` SDK so execute() runs fully offline.
    fake = types.ModuleType("openai")
    fake.OpenAI = _FakeClient
    monkeypatch.setitem(sys.modules, "openai", fake)
    monkeypatch.setenv("OPENAI_API_KEY", "test-key")
    from tools.graphics.openai_image import OpenAIImage

    return OpenAIImage()


def test_all_requested_images_are_written(openai_tool, tmp_path):
    out = tmp_path / "gen.png"
    result = openai_tool.execute({"prompt": "p", "n": 4, "output_path": str(out)})

    assert result.success
    assert result.data["images_generated"] == 4
    assert len(result.artifacts) == 4

    files = sorted(tmp_path.glob("*.png"))
    assert len(files) == 4  # every image reached disk, none overwritten
    contents = {f.read_bytes() for f in files}
    assert contents == {b"IMAGE_0", b"IMAGE_1", b"IMAGE_2", b"IMAGE_3"}


def test_artifacts_match_billed_image_count(openai_tool, tmp_path):
    # What the user pays for must equal what they receive.
    inputs = {"prompt": "p", "n": 3, "quality": "high", "output_path": str(tmp_path / "img.png")}
    result = openai_tool.execute(inputs)
    billed = openai_tool.estimate_cost(inputs)

    assert len(result.artifacts) == 3
    assert billed == pytest.approx(0.211 * 3)


def test_single_image_keeps_exact_output_path(openai_tool, tmp_path):
    out = tmp_path / "single.png"
    result = openai_tool.execute({"prompt": "p", "n": 1, "output_path": str(out)})

    assert result.success
    assert result.artifacts == [str(out)]
    assert out.read_bytes() == b"IMAGE_0"


def test_multi_output_paths_are_suffixed_and_unique():
    from tools.graphics.openai_image import OpenAIImage

    paths = OpenAIImage._output_paths("/tmp/art/pic.png", 3, "png")
    assert [p.name for p in paths] == ["pic_1.png", "pic_2.png", "pic_3.png"]
    assert len(set(paths)) == 3


def test_img2img_embeds_base64_in_prompt(openai_tool, tmp_path):
    input_img = tmp_path / "source.png"
    input_img.write_bytes(b"PNG_SAMPLE_DATA")
    out = tmp_path / "out.png"

    result = openai_tool.execute({
        "prompt": "Make this cat wear a wizard hat",
        "image_path": str(input_img),
        "output_path": str(out),
    })

    assert result.success
    assert result.data["is_img2img"] is True
    # Verify that model defaults to cx/gpt-image-2.5-sunburst when img2img is used
    assert result.data["model"] == "cx/gpt-image-2.5-sunburst"
    # Verify prompt contains data URI
    assert "data:image/png;base64," in result.data["prompt"]
    expected_b64 = base64.b64encode(b"PNG_SAMPLE_DATA").decode()
    assert expected_b64 in result.data["prompt"]


def test_img2img_preserves_explicit_model(openai_tool, tmp_path):
    input_img = tmp_path / "source.jpg"
    input_img.write_bytes(b"JPEG_DATA")
    out = tmp_path / "out.png"

    result = openai_tool.execute({
        "prompt": "Stylize this image",
        "model": "cx/gpt-image-2.5-flare",
        "image_path": str(input_img),
        "output_path": str(out),
    })

    assert result.success
    assert result.data["model"] == "cx/gpt-image-2.5-flare"
    assert "data:image/jpeg;base64," in result.data["prompt"]


def test_cx_model_defaults_size_and_quality_to_auto(openai_tool, tmp_path):
    out = tmp_path / "luna.png"
    result = openai_tool.execute({
        "prompt": "A futuristic city",
        "model": "cx/gpt-5.6-luna-image",
        "output_path": str(out),
    })
    assert result.success
    assert result.data["model"] == "cx/gpt-5.6-luna-image"

