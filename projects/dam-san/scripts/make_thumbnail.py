#!/usr/bin/env python3
"""Render 1280x720 YouTube thumbnail composited over Blender 5.2.2 Cycles hero render B3D-06-wide.png."""
from pathlib import Path
from PIL import Image, ImageDraw, ImageFont

OM = Path("/Users/tuyennguyen/project/OpenMontage")
SRC_IMG = OM / "remotion-composer" / "public" / "dam-san" / "blender" / "B3D-06-wide.png"
OUT = OM / "projects" / "dam-san" / "deliverables" / "dam-san-thumbnail-1280x720.jpg"
OUT.parent.mkdir(parents=True, exist_ok=True)


def load_font(size: int, bold: bool = True) -> ImageFont.FreeTypeFont:
    candidates = [
        "/System/Library/Fonts/Supplemental/Georgia Bold.ttf" if bold else "/System/Library/Fonts/Supplemental/Georgia.ttf",
        "/Library/Fonts/Arial Unicode.ttf",
        "/System/Library/Fonts/Helvetica.ttc",
        "/System/Library/Fonts/Supplemental/Arial.ttf",
    ]
    for p in candidates:
        if Path(p).exists():
            try:
                return ImageFont.truetype(p, size)
            except OSError:
                continue
    return ImageFont.load_default()


def main() -> None:
    im = Image.open(SRC_IMG).convert("RGBA").resize((1280, 720), Image.Resampling.LANCZOS)
    # Strong left dark scrim up to x=620, then smooth feather so all title text has >7:1 contrast
    scrim = Image.new("RGBA", (1280, 720), (0, 0, 0, 0))
    sd = ImageDraw.Draw(scrim)
    for x in range(880):
        t = 0.0 if x < 420 else (x - 420) / 460.0
        alpha = int(232 * max(0.0, 1.0 - t ** 1.2))
        sd.line([(x, 0), (x, 720)], fill=(16, 12, 10, alpha))
    # Left gold bar accent
    sd.rectangle([(48, 88), (58, 610)], fill=(212, 155, 56, 255))
    im = Image.alpha_composite(im, scrim).convert("RGB")

    draw = ImageDraw.Draw(im)
    f_tag = load_font(23, bold=False)
    f_h1 = load_font(76, bold=True)
    f_sub = load_font(33, bold=True)

    draw.text((82, 98), "VN-MYTH S3E02 · SỬ THI Ê ĐÊ", fill=(212, 155, 56), font=f_tag)
    draw.text((82, 165), "VÌ SAO", fill=(250, 245, 235), font=f_h1)
    draw.text((82, 254), "ĐĂM SĂN", fill=(212, 155, 56), font=f_h1)
    draw.text((82, 343), "THẤT BẠI?", fill=(250, 245, 235), font=f_h1)
    draw.text((82, 468), "Bí mật Rừng Sáp Đen &", fill=(250, 245, 235), font=f_sub)
    draw.text((82, 516), "7 cuộc chiến bị cắt năm 1933", fill=(238, 175, 92), font=f_sub)

    im.save(OUT, quality=95)
    print(f"Saved thumbnail -> {OUT} ({OUT.stat().st_size} bytes)")


if __name__ == "__main__":
    main()
