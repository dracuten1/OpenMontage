#!/usr/bin/env python3
"""
character-performer/tools/gen_turnaround.py — 9router Orthographic Turnaround Generator
Part 2 of TASK_MESH_AND_TURNAROUND for OpenMontage / Remotion rigs.

Generates 5 canonical orthographic turnaround views (0°, 45°, 90°, 135°, 180°)
for kawaii characters (Turtle & Rabbit) with identity preservation.

Features:
- Connects to 9router (:20128) using .env credentials (cx/gpt-image-2.5-sunburst / cx/gpt-5.6-luna-image).
- SSE streaming response parser for 9router.
- Automatic fallback / mock mode generating procedural kawaii turnaround poses
  when offline or without API connectivity.
- Outputs 5 individual view PNGs + 1 unified turnaround contact sheet.
- Emits turnaround_manifest.json for Remotion rig consumption.
"""

import argparse
import base64
import json
import math
import os
import re
import sys
import urllib.request
import urllib.error
from pathlib import Path
from PIL import Image, ImageDraw

REPO_ROOT = Path(__file__).resolve().parent.parent.parent

# 5 Canonical Turnaround Angles
TURNAROUND_VIEWS = [
    {
        "id": "front",
        "angle": 0,
        "suffix": "000",
        "label": "Front View (0°)",
        "prompt_desc": "Orthographic front view, facing camera directly at eye-level, 0 degrees, symmetrical character model sheet pose",
    },
    {
        "id": "three_quarter",
        "angle": 45,
        "suffix": "045",
        "label": "3/4 View (45°)",
        "prompt_desc": "Orthographic 3/4 front three-quarter view, turned 45 degrees left, showing front and left side",
    },
    {
        "id": "side",
        "angle": 90,
        "suffix": "090",
        "label": "Side Profile (90°)",
        "prompt_desc": "Orthographic strict side profile view, turned 90 degrees left, showing complete left silhouette",
    },
    {
        "id": "three_quarter_back",
        "angle": 135,
        "suffix": "135",
        "label": "3/4 Back View (135°)",
        "prompt_desc": "Orthographic 3/4 rear three-quarter view, turned 135 degrees away from camera, showing back and left side",
    },
    {
        "id": "back",
        "angle": 180,
        "suffix": "180",
        "label": "Back View (180°)",
        "prompt_desc": "Orthographic back view from behind, 180 degrees away from camera, showing rear silhouette and shell/back",
    },
]


def load_env_credentials():
    """Reads OPENAI_API_KEY and OPENAI_BASE_URL from .env file."""
    env_path = REPO_ROOT / ".env"
    key, base_url, model = "", "http://127.0.0.1:20128/v1", "cx/gpt-image-2.5-sunburst"

    if env_path.exists():
        content = env_path.read_text(encoding="utf-8")
        m_key = re.search(r"OPENAI_API_KEY=(.+)", content)
        if m_key:
            key = m_key.group(1).strip()
        m_base = re.search(r"OPENAI_BASE_URL=(.+)", content)
        if m_base:
            base_url = m_base.group(1).strip().rstrip("/")
        m_model = re.search(r"OPENAI_IMAGE_MODEL=(.+)", content)
        if m_model:
            model = m_model.group(1).strip()

    return key, base_url, model


def check_9router_health(base_url: str) -> bool:
    """Checks if 9router endpoint is alive."""
    try:
        url = f"{base_url}/models"
        req = urllib.request.Request(url)
        with urllib.request.urlopen(req, timeout=3) as resp:
            return resp.status == 200
    except Exception:
        return False


def call_9router_image_gen(
    prompt: str,
    base_url: str,
    api_key: str,
    model: str,
    ref_image_path: str = None,
    timeout: int = 120,
) -> bytes:
    """Calls 9router image generation endpoint with SSE streaming."""
    url = f"{base_url}/images/generations"
    headers = {
        "Content-Type": "application/json",
        "Accept": "text/event-stream",
    }
    if api_key:
        headers["Authorization"] = f"Bearer {api_key}"

    payload = {
        "model": model,
        "prompt": prompt,
        "n": 1,
        "size": "auto",
        "quality": "auto",
        "background": "transparent",
        "image_detail": "high",
        "output_format": "png",
    }

    # If reference image is supplied for I2I identity preservation
    if ref_image_path and os.path.exists(ref_image_path):
        with open(ref_image_path, "rb") as rf:
            raw_b64 = base64.b64encode(rf.read()).decode("utf-8")
            data_uri = f"data:image/png;base64,{raw_b64}"
            # Embed data uri in prompt or image parameter
            payload["image"] = data_uri
            payload["prompt"] = f"{prompt} Maintain exact visual character identity from reference: {data_uri}"

    data = json.dumps(payload).encode("utf-8")
    req = urllib.request.Request(url, data=data, headers=headers)

    with urllib.request.urlopen(req, timeout=timeout) as resp:
        body = resp.read().decode("utf-8", errors="ignore")

    # Parse SSE events for base64 payload
    chunks = re.findall(r"data:\s*(\{.*\})", body)
    image_b64 = None
    for chunk in chunks:
        try:
            d = json.loads(chunk)
            for it in d.get("data", []):
                b = it.get("b64_json") or it.get("image")
                if b:
                    image_b64 = b
        except Exception:
            continue

    if not image_b64:
        raise RuntimeError(f"No image found in 9router SSE response: {body[-300:]}")

    if "," in image_b64:
        image_b64 = image_b64.split(",", 1)[1]

    return base64.b64decode(image_b64)


def generate_procedural_turnaround_view(
    character: str, view_info: dict, width: int = 512, height: int = 512
) -> Image.Image:
    """
    Generates a clean, high-fidelity procedural orthographic turnaround pose
    matching the kawaii character spec with transparent background.
    """
    img = Image.new("RGBA", (width, height), (0, 0, 0, 0))
    draw = ImageDraw.Draw(img)

    angle = view_info["angle"]
    rad = math.radians(angle)
    cos_a = math.cos(rad)
    sin_a = math.sin(rad)

    cx, cy = width // 2, int(height * 0.58)

    if character == "turtle":
        # Palettes for Golden Turtle (Rùa Vàng)
        c_outline = (58, 46, 42, 255)       # #3a2e2a
        c_mai = (242, 181, 60, 255)         # #f2b53c golden
        c_mai_hi = (251, 228, 157, 255)     # #fbe49d highlight
        c_skin = (148, 163, 68, 255)        # #94a344 green
        c_skin_hi = (168, 183, 85, 255)     # #a8b755 light green
        c_plastron = (245, 230, 200, 255)   # #f5e6c8 cream
        c_scute = (232, 114, 74, 255)       # #e8724a orange spot
        c_glasses = (91, 58, 47, 255)       # #5b3a2f brown
        c_blush = (255, 157, 180, 210)      # #ff9db4 pink

        # Ground shadow
        draw.ellipse([cx - 100, cy + 90, cx + 100, cy + 120], fill=(15, 23, 42, 70))

        # 1. Tail (visible mostly at side / back)
        if cos_a < 0.2:
            tail_x = cx + int(60 * sin_a)
            tail_y = cy + 45
            draw.ellipse([tail_x - 14, tail_y - 12, tail_x + 14, tail_y + 12], fill=c_skin, outline=c_outline, width=4)

        # 2. Back Flippers
        bf_l_x = cx - int(65 * cos_a) - int(30 * sin_a)
        bf_r_x = cx + int(65 * cos_a) - int(30 * sin_a)
        draw.ellipse([bf_l_x - 22, cy + 60, bf_l_x + 22, cy + 85], fill=c_skin, outline=c_outline, width=4)
        draw.ellipse([bf_r_x - 22, cy + 60, bf_r_x + 22, cy + 85], fill=c_skin, outline=c_outline, width=4)

        # 3. Main Shell (Carapace)
        rx_shell = int(95 * math.sqrt((math.cos(rad))**2 + (0.92 * math.sin(rad))**2))
        ry_shell = 85
        shell_cx = cx + int(10 * sin_a)
        shell_cy = cy

        # If back view, draw shell dominant; if front view, plastron visible in front
        draw.ellipse(
            [shell_cx - rx_shell, shell_cy - ry_shell, shell_cx + rx_shell, shell_cy + ry_shell],
            fill=c_mai,
            outline=c_outline,
            width=6,
        )
        # Shell rim highlight
        draw.ellipse(
            [shell_cx - int(rx_shell * 0.75), shell_cy - int(ry_shell * 0.75), shell_cx + int(rx_shell * 0.5), shell_cy + int(ry_shell * 0.5)],
            fill=c_mai_hi,
        )

        # Shell scutes (spots)
        if angle in (0, 45, 90):
            sc_x = shell_cx + int(25 * cos_a)
            draw.ellipse([sc_x - 14, shell_cy - 25, sc_x + 14, shell_cy + 5], fill=c_scute, outline=c_outline, width=3)
        if angle in (45, 90, 135, 180):
            sc_bx = shell_cx - int(30 * cos_a)
            draw.ellipse([sc_bx - 15, shell_cy - 10, sc_bx + 15, shell_cy + 20], fill=c_scute, outline=c_outline, width=3)

        # 4. Plastron (Belly plate) — visible when cos_a > 0 (front hemisphere)
        if cos_a > 0.1:
            rx_pl = int(rx_shell * 0.82)
            pl_x = shell_cx - int(15 * sin_a)
            draw.ellipse([pl_x - rx_pl, shell_cy + 25, pl_x + rx_pl, shell_cy + 75], fill=c_plastron, outline=c_outline, width=4)

        # 5. Fore Flippers (Arms)
        ff_l_x = cx - int(85 * cos_a) + int(25 * sin_a)
        ff_r_x = cx + int(85 * cos_a) + int(25 * sin_a)
        if cos_a > -0.2:
            draw.ellipse([ff_l_x - 22, cy + 15, ff_l_x + 22, cy + 65], fill=c_skin, outline=c_outline, width=5)
            if angle < 75:
                draw.ellipse([ff_r_x - 22, cy + 15, ff_r_x + 22, cy + 65], fill=c_skin, outline=c_outline, width=5)

        # 6. Head
        rx_head = int(68 * math.sqrt((math.cos(rad))**2 + (0.95 * math.sin(rad))**2))
        ry_head = 60
        head_cx = cx - int(45 * sin_a)
        head_cy = cy - 95

        draw.ellipse([head_cx - rx_head, head_cy - ry_head, head_cx + rx_head, head_cy + ry_head], fill=c_skin, outline=c_outline, width=6)
        # Head highlight
        draw.ellipse([head_cx - int(rx_head * 0.7), head_cy - int(ry_head * 0.7), head_cx + int(rx_head * 0.3), head_cy + int(ry_head * 0.3)], fill=c_skin_hi)

        # 7. Facial Features (Visible when cos_a > 0, front hemisphere)
        if cos_a > 0.05:
            # Eyes & Glasses
            eye_spacing = int(32 * cos_a)
            face_offset_x = head_cx - int(18 * sin_a)

            # Left Eye
            el_x = face_offset_x - eye_spacing
            draw.ellipse([el_x - 12, head_cy - 12, el_x + 12, head_cy + 12], fill=c_outline)
            draw.ellipse([el_x - 5, head_cy - 8, el_x + 1, head_cy - 2], fill=(255, 255, 255, 255))
            # Left Glasses Rim
            draw.ellipse([el_x - 18, head_cy - 18, el_x + 18, head_cy + 18], outline=c_glasses, width=4)

            # Right Eye (if not full profile)
            if angle <= 65:
                er_x = face_offset_x + eye_spacing
                draw.ellipse([er_x - 12, head_cy - 12, er_x + 12, head_cy + 12], fill=c_outline)
                draw.ellipse([er_x - 5, head_cy - 8, er_x + 1, head_cy - 2], fill=(255, 255, 255, 255))
                draw.ellipse([er_x - 18, head_cy - 18, er_x + 18, head_cy + 18], outline=c_glasses, width=4)
                # Bridge
                draw.line([el_x + 16, head_cy - 2, er_x - 16, head_cy - 2], fill=c_glasses, width=4)

            # Pink Blush
            draw.ellipse([el_x - 18, head_cy + 10, el_x + 14, head_cy + 24], fill=c_blush)

            # Snout / Nose bump
            snout_x = head_cx - int(38 * sin_a)
            snout_y = head_cy + 8
            draw.ellipse([snout_x - 12, snout_y - 8, snout_x + 12, snout_y + 8], fill=c_skin_hi, outline=c_outline, width=3)
            # Nostril
            draw.ellipse([snout_x - 4, snout_y - 2, snout_x - 1, snout_y + 1], fill=c_outline)

    else:
        # Palettes for Kawaii Rabbit (Thỏ Trắng)
        c_outline = (58, 46, 42, 255)
        c_fur = (243, 235, 228, 255)
        c_vest = (232, 80, 58, 255)
        c_pink = (255, 201, 214, 255)
        c_blush = (255, 157, 180, 220)

        # Ground shadow
        draw.ellipse([cx - 85, cy + 85, cx + 85, cy + 115], fill=(15, 23, 42, 70))

        # Tail (behind if cos_a < 0.2)
        if cos_a < 0.2:
            tail_x = cx + int(45 * sin_a)
            draw.ellipse([tail_x - 18, cy + 35, tail_x + 18, cy + 65], fill=(255, 255, 255, 255), outline=c_outline, width=4)

        # Feet
        draw.ellipse([cx - 40, cy + 70, cx + 5, cy + 92], fill=(255, 255, 255, 255), outline=c_outline, width=4)
        draw.ellipse([cx + 5, cy + 70, cx + 50, cy + 92], fill=(255, 255, 255, 255), outline=c_outline, width=4)

        # Body Torso
        rx_body = int(75 * math.sqrt((math.cos(rad))**2 + (0.95 * math.sin(rad))**2))
        draw.ellipse([cx - rx_body, cy - 25, cx + rx_body, cy + 65], fill=c_fur, outline=c_outline, width=5)

        # Red Vest
        rx_vest = int(rx_body * 0.98)
        draw.ellipse([cx - rx_vest, cy - 10, cx + rx_vest, cy + 50], fill=c_vest, outline=c_outline, width=5)
        if cos_a > 0.1:
            draw.ellipse([cx - 4, cy + 5, cx + 4, cy + 13], fill=(255, 255, 255, 255))
            draw.ellipse([cx - 4, cy + 25, cx + 4, cy + 33], fill=(255, 255, 255, 255))

        # Head
        rx_head = int(105 * math.sqrt((math.cos(rad))**2 + (0.92 * math.sin(rad))**2))
        head_cy = cy - 90
        draw.ellipse([cx - rx_head, head_cy - 85, cx + rx_head, head_cy + 85], fill=c_fur, outline=c_outline, width=6)

        # Ears
        ear_l_x = cx - 35
        ear_r_x = cx + 35
        draw.ellipse([ear_l_x - 20, head_cy - 180, ear_l_x + 20, head_cy - 65], fill=(255, 255, 255, 255), outline=c_outline, width=5)
        draw.ellipse([ear_l_x - 10, head_cy - 165, ear_l_x + 10, head_cy - 80], fill=c_pink)
        draw.ellipse([ear_r_x - 20, head_cy - 180, ear_r_x + 20, head_cy - 65], fill=(255, 255, 255, 255), outline=c_outline, width=5)
        draw.ellipse([ear_r_x - 10, head_cy - 165, ear_r_x + 10, head_cy - 80], fill=c_pink)

        # Face (when cos_a > 0.05)
        if cos_a > 0.05:
            # Eyes
            eye_spacing = int(45 * cos_a)
            el_x = cx - eye_spacing - int(15 * sin_a)
            draw.ellipse([el_x - 14, head_cy - 15, el_x + 14, head_cy + 15], fill=c_outline)
            draw.ellipse([el_x - 6, head_cy - 10, el_x + 2, head_cy - 2], fill=(255, 255, 255, 255))

            if angle <= 65:
                er_x = cx + eye_spacing - int(15 * sin_a)
                draw.ellipse([er_x - 14, head_cy - 15, er_x + 14, head_cy + 15], fill=c_outline)
                draw.ellipse([er_x - 6, head_cy - 10, er_x + 2, head_cy - 2], fill=(255, 255, 255, 255))

            # Pink nose & blush
            draw.ellipse([cx - 8 - int(20 * sin_a), head_cy + 15, cx + 8 - int(20 * sin_a), head_cy + 25], fill=(255, 143, 163, 255))
            draw.ellipse([el_x - 25, head_cy + 12, el_x + 10, head_cy + 30], fill=c_blush)

    return img


def create_contact_sheet(images: list, width: int = 512, height: int = 512) -> Image.Image:
    """Stitches 5 turnaround views side-by-side into a single 2560x512 sheet."""
    sheet = Image.new("RGBA", (width * len(images), height), (15, 23, 42, 255))

    for idx, (view, img) in enumerate(images):
        x_offset = idx * width
        sheet.paste(img, (x_offset, 0), img)

        # Annotate view header
        draw = ImageDraw.Draw(sheet)
        label = f"{view['label']}"
        draw.rectangle([x_offset + 10, 10, x_offset + width - 10, 42], fill=(30, 41, 59, 220), outline=(56, 189, 248, 180), width=1)
        draw.text((x_offset + width // 2 - 45, 18), label, fill=(248, 250, 252, 255))

    return sheet


def main():
    parser = argparse.ArgumentParser(description="9router Orthographic Turnaround Generator")
    parser.add_argument("--character", choices=["turtle", "rabbit"], default="turtle", help="Character to generate")
    parser.add_argument("--model", default="cx/gpt-image-2.5-sunburst", help="9router image model ID")
    parser.add_argument("--ref", default="", help="Path to reference image for identity preservation")
    parser.add_argument("--output-dir", default="", help="Output directory path")
    parser.add_argument("--mock", action="store_true", help="Force offline procedural generation mode")
    parser.add_argument("--timeout", type=int, default=120, help="HTTP request timeout in seconds")

    args = parser.parse_args()

    # Determine output directory
    if args.output_dir:
        out_dir = Path(args.output_dir).resolve()
    else:
        out_dir = REPO_ROOT / "character-performer" / "kids" / "turnaround"
    out_dir.mkdir(parents=True, exist_ok=True)

    print(f"=== 9router Turnaround Generator ===")
    print(f"Character: {args.character.upper()}")
    print(f"Target Output Directory: {out_dir}")

    # Credentials check
    api_key, base_url, default_model = load_env_credentials()
    model = args.model or default_model
    is_9router_up = False if args.mock else check_9router_health(base_url)

    mode_desc = "9router LIVE API" if is_9router_up and not args.mock else "PROCEDURAL VECTOR FALLBACK (Mock Mode)"
    print(f"Execution Mode: {mode_desc}")
    if is_9router_up and not args.mock:
        print(f"Gateway URL: {base_url}")
        print(f"Model: {model}")

    # Default reference image fallback if none provided
    ref_image = args.ref
    if not ref_image:
        candidate_refs = [
            REPO_ROOT / "character-performer" / "kids" / "qc_multiscene_v3" / f"sheet_{args.character}.png",
            REPO_ROOT / "character-performer" / "kids" / "assets" / "k_base.png",
        ]
        for c in candidate_refs:
            if c.exists():
                ref_image = str(c)
                break

    if ref_image:
        print(f"Reference Image: {ref_image}")

    generated_images = []
    manifest_views = {}

    for view in TURNAROUND_VIEWS:
        file_name = f"{args.character}_{view['id']}_{view['suffix']}.png"
        file_path = out_dir / file_name

        print(f"\n[{view['angle']}°] Generating {view['label']} -> {file_name}...")
        img = None

        if is_9router_up and not args.mock:
            prompt = (
                f"Master character turnaround sheet pose of kawaii cartoon {args.character}. "
                f"{view['prompt_desc']}. Clean lineart, pastel flat colors, pure white or transparent background, "
                f"orthographic perspective, high quality 2D animation character model."
            )
            try:
                raw_bytes = call_9router_image_gen(
                    prompt=prompt,
                    base_url=base_url,
                    api_key=api_key,
                    model=model,
                    ref_image_path=ref_image,
                    timeout=args.timeout,
                )
                with open(file_path, "wb") as f:
                    f.write(raw_bytes)
                img = Image.open(file_path).convert("RGBA")
                print(f"  ✓ 9router API successfully rendered {file_name}")
            except Exception as e:
                print(f"  ⚠ 9router call failed ({e}). Falling back to procedural generator...")
                img = generate_procedural_turnaround_view(args.character, view, 512, 512)
                img.save(file_path, format="PNG")
                print(f"  ✓ Procedural fallback saved {file_name}")
        else:
            img = generate_procedural_turnaround_view(args.character, view, 512, 512)
            img.save(file_path, format="PNG")
            print(f"  ✓ Procedural view rendered: {file_name}")

        generated_images.append((view, img))
        manifest_views[view["id"]] = {
            "view": view["id"],
            "angle": view["angle"],
            "nominal_yaw": view["angle"],
            "label": view["label"],
            "file": file_name,
            "path": str(file_path.relative_to(REPO_ROOT)),
            "width": img.width,
            "height": img.height,
            "anchor_x": img.width // 2,
            "anchor_y": int(img.height * 0.58),
        }

    # Generate composite contact sheet
    sheet_name = f"{args.character}_turnaround_sheet.png"
    sheet_path = out_dir / sheet_name
    sheet = create_contact_sheet(generated_images)
    sheet.save(sheet_path, format="PNG")
    print(f"\n✓ Turnaround contact sheet saved: {sheet_name} (2560x512)")

    # Write manifest JSON
    manifest = {
        "character": args.character,
        "format": "OpenMontage_Turnaround_v1",
        "generated_at": "2026-10-11T02:00:00Z",
        "mode": "9router" if is_9router_up and not args.mock else "procedural_fallback",
        "model": model,
        "reference_image": ref_image,
        "views": manifest_views,
        "contact_sheet": {
            "file": sheet_name,
            "path": str(sheet_path.relative_to(REPO_ROOT)),
            "width": sheet.width,
            "height": sheet.height,
        },
    }

    manifest_path = out_dir / "turnaround_manifest.json"
    with open(manifest_path, "w", encoding="utf-8") as f:
        json.dump(manifest, f, indent=2)
    print(f"✓ Manifest written to: {manifest_path}")

    # Mirror / link to remotion-composer/public/character-performer/kids/turnaround/
    public_turnaround_dir = REPO_ROOT / "remotion-composer" / "public" / "character-performer" / "kids" / "turnaround"
    public_turnaround_dir.mkdir(parents=True, exist_ok=True)
    for view_id, vinfo in manifest_views.items():
        src = out_dir / vinfo["file"]
        dst = public_turnaround_dir / vinfo["file"]
        dst.write_bytes(src.read_bytes())
    dst_sheet = public_turnaround_dir / sheet_name
    dst_sheet.write_bytes(sheet_path.read_bytes())
    dst_manifest = public_turnaround_dir / "turnaround_manifest.json"
    dst_manifest.write_text(json.dumps(manifest, indent=2), encoding="utf-8")
    print(f"✓ Copied assets to Remotion public dir: {public_turnaround_dir}")

    print("\n[SUCCESS] Part 2 Turnaround Generation Completed.")


if __name__ == "__main__":
    main()
