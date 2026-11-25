#!/usr/bin/env python3
"""new_channel.py — Scaffold a new OpenMontage channel pack and Remotion theme."""

from __future__ import annotations

import argparse
import json
import re
import shutil
import sys
from pathlib import Path
from typing import Any

REPO_ROOT = Path(__file__).resolve().parents[2]
if str(REPO_ROOT) not in sys.path:
    sys.path.insert(0, str(REPO_ROOT))

from lib.channels import load_channel
from lib.paths import CHANNELS_DIR, PROJECTS_DIR

CHANNEL_ID_RE = re.compile(r"^[a-z0-9]+(?:-[a-z0-9]+)*$")

BASE_THEME_TO_PLAYBOOK = {
    "swiss-broadcast": "archival-editorial",
    "archival-diorama": "ink-genome",
    "clean-minimal": "clean-professional",
}

BASE_THEME_TO_LANE = {
    "swiss-broadcast": "news-editorial-motion",
    "archival-diorama": "myth-archival-diorama",
    "clean-minimal": "explainer-motion",
}


def _to_camel_case(slug: str) -> str:
    parts = [p for p in slug.split("-") if p]
    if not parts:
        return "channelTheme"
    return parts[0] + "".join(p[:1].upper() + p[1:] for p in parts[1:]) + "Theme"


def _render_template(text: str, vars_map: dict[str, Any]) -> str:
    out = text
    for key, val in vars_map.items():
        out = out.replace(f"{{{{{key}}}}}", str(val))
    return out


def _update_registry(registry_path: Path, channel_id: str, theme_var: str) -> None:
    if not registry_path.is_file():
        return
    src = registry_path.read_text(encoding="utf-8")
    import_line = f'import {{ {theme_var} }} from "./{channel_id}/theme";'
    entry_line = f'  "{channel_id}": {theme_var},'

    if import_line not in src:
        marker = "// </channel-registry-imports>"
        if marker in src:
            src = src.replace(marker, f"{import_line}\n{marker}", 1)

    if f'"{channel_id}":' not in src:
        marker = "  // </channel-registry-entries>"
        if marker in src:
            src = src.replace(marker, f"{entry_line}\n{marker}", 1)

    registry_path.write_text(src, encoding="utf-8")


def _update_gitignore(gitignore_path: Path, channel_id: str) -> None:
    if not gitignore_path.is_file():
        return
    src = gitignore_path.read_text(encoding="utf-8")
    marker = "# </channel-gitignore-rules>"
    if f"!projects/{channel_id}/*/" in src or marker not in src:
        return
    block = (
        f"!projects/{channel_id}/*/\n"
        f"projects/{channel_id}/*/*\n"
        f"!projects/{channel_id}/*/scripts\n"
        f"!projects/{channel_id}/*/artifacts\n"
        f"!projects/{channel_id}/*/*.json\n"
        f"!projects/{channel_id}/*/*.md\n"
    )
    src = src.replace(marker, f"{block}{marker}", 1)
    gitignore_path.write_text(src, encoding="utf-8")


def create_channel(
    channel_id: str,
    *,
    name: str,
    platform: str,
    aspect: str | None = None,
    base_theme: str | None = None,
    voice: str | None = None,
    language: str = "vi",
    channels_dir: Path | None = None,
    projects_dir: Path | None = None,
    composer_dir: Path | None = None,
    gitignore_path: Path | None = None,
    force: bool = False,
) -> dict[str, Any]:
    if not CHANNEL_ID_RE.match(channel_id):
        raise ValueError(
            f"Invalid channel id {channel_id!r}: must be kebab-case (lowercase letters, digits, hyphens)"
        )

    ch_root = Path(channels_dir) if channels_dir is not None else CHANNELS_DIR
    proj_root = Path(projects_dir) if projects_dir is not None else PROJECTS_DIR
    comp_root = Path(composer_dir) if composer_dir is not None else (REPO_ROOT / "remotion-composer")
    template_dir = ch_root / "_template"
    if not template_dir.is_dir():
        template_dir = CHANNELS_DIR / "_template"
    if not template_dir.is_dir():
        raise FileNotFoundError(f"Channel template directory not found: {template_dir}")

    ch_dir = ch_root / channel_id
    if ch_dir.exists() and not force:
        raise FileExistsError(f"Channel already exists: {ch_dir} (pass --force to overwrite)")

    resolved_aspect = aspect or ("9:16" if platform in {"tiktok", "reels", "shorts"} else "16:9")
    if resolved_aspect == "9:16":
        width, height = 1080, 1920
        default_base = "swiss-broadcast"
        safe_profile = "tiktok-v3.2"
        speed = 1.15
    else:
        width, height = 1920, 1080
        default_base = "clean-minimal"
        safe_profile = "youtube-16x9"
        speed = 1.0

    resolved_base_theme = base_theme or default_base
    if resolved_base_theme not in BASE_THEME_TO_PLAYBOOK:
        raise ValueError(
            f"Unknown base_theme {resolved_base_theme!r}; expected one of {sorted(BASE_THEME_TO_PLAYBOOK)}"
        )

    style_playbook = BASE_THEME_TO_PLAYBOOK[resolved_base_theme]
    lane = BASE_THEME_TO_LANE[resolved_base_theme]
    vars_map = {
        "CHANNEL_ID": channel_id,
        "CHANNEL_NAME": name,
        "PLATFORM": platform,
        "WIDTH": width,
        "HEIGHT": height,
        "FPS": 30,
        "ASPECT_RATIO": resolved_aspect,
        "BASE_THEME": resolved_base_theme,
        "STYLE_PLAYBOOK": style_playbook,
        "SAFE_ZONE_PROFILE": safe_profile,
        "VOICE": json.dumps(voice) if voice else "null",
        "SPEED": speed,
        "LANGUAGE": language,
        "LANE": lane,
        "DESCRIPTION_TEMPLATE": "Hook + main topic summary + relevant hashtags + CTA",
    }

    ch_dir.mkdir(parents=True, exist_ok=True)
    for sub in ("assets/brand", "assets/characters", "assets/bgm", "assets/textures"):
        d = ch_dir / sub
        d.mkdir(parents=True, exist_ok=True)
        (d / ".gitkeep").touch()

    ep_dir = proj_root / channel_id
    ep_dir.mkdir(parents=True, exist_ok=True)
    (ep_dir / ".gitkeep").touch()

    yaml_text = _render_template((template_dir / "channel.yaml.tmpl").read_text(encoding="utf-8"), vars_map)
    (ch_dir / "channel.yaml").write_text(yaml_text, encoding="utf-8")

    rules_text = _render_template((template_dir / "editorial-rules.md.tmpl").read_text(encoding="utf-8"), vars_map)
    (ch_dir / "editorial-rules.md").write_text(rules_text, encoding="utf-8")

    shutil.copy2(template_dir / "tts_lexicon.json", ch_dir / "tts_lexicon.json")
    shutil.copy2(template_dir / "mix_profile.json", ch_dir / "mix_profile.json")

    # Validate generated channel.yaml against schema
    load_channel(channel_id, channels_dir=ch_root, validate=True)

    # Scaffold Remotion theme + register in channels/registry.ts
    theme_var = _to_camel_case(channel_id)
    remotion_ch_dir = comp_root / "src" / "channels" / channel_id
    remotion_ch_dir.mkdir(parents=True, exist_ok=True)
    theme_ts = (
        'import { createChannelTheme } from "../../core/theme";\n\n'
        f'export const {theme_var} = createChannelTheme("{resolved_base_theme}", {{\n'
        f'  id: "{channel_id}",\n'
        f'  name: {json.dumps(name, ensure_ascii=False)},\n'
        f'  platform: "{platform}",\n'
        f'  canvas: {{ width: {width}, height: {height}, fps: 30 }},\n'
        "});\n\n"
        f"export const FPS = {theme_var}.canvas.fps;\n"
        f"export const WIDTH = {theme_var}.canvas.width;\n"
        f"export const HEIGHT = {theme_var}.canvas.height;\n"
        f"export const COLORS = {theme_var}.colors;\n"
        f"export const FONTS = {theme_var}.fonts;\n"
        f"export const SAFE = {theme_var}.safe;\n"
        f"export const MOTION = {theme_var}.motion;\n"
        f"export const ensureFonts = {theme_var}.ensureFonts;\n"
        f"export const waitForFonts = {theme_var}.waitForFonts;\n"
    )
    (remotion_ch_dir / "theme.ts").write_text(theme_ts, encoding="utf-8")
    (remotion_ch_dir / "index.ts").write_text('export * from "./theme";\n', encoding="utf-8")

    _update_registry(comp_root / "src" / "channels" / "registry.ts", channel_id, theme_var)
    if gitignore_path is not None:
        _update_gitignore(gitignore_path, channel_id)
    elif ch_root.resolve() == CHANNELS_DIR.resolve():
        _update_gitignore(REPO_ROOT / ".gitignore", channel_id)

    return {
        "status": "created",
        "channel_id": channel_id,
        "channel_dir": str(ch_dir),
        "projects_dir": str(ep_dir),
        "remotion_theme_dir": str(remotion_ch_dir),
        "theme_export": theme_var,
        "platform": platform,
        "aspect_ratio": resolved_aspect,
        "base_theme": resolved_base_theme,
    }


def main(argv: list[str] | None = None) -> int:
    ap = argparse.ArgumentParser(description="Scaffold a new OpenMontage channel pack and Remotion theme.")
    ap.add_argument("channel_id", help="Kebab-case channel slug (e.g. tech-deep-dive)")
    ap.add_argument("--name", required=True, help="Human display name for the channel")
    ap.add_argument("--platform", required=True, choices=["tiktok", "youtube", "reels", "shorts", "custom"])
    ap.add_argument("--aspect", default=None, choices=["9:16", "16:9"])
    ap.add_argument(
        "--base-theme",
        default=None,
        choices=["swiss-broadcast", "archival-diorama", "clean-minimal"],
    )
    ap.add_argument("--voice", default=None)
    ap.add_argument("--language", default="vi")
    ap.add_argument("--channels-dir", default=None)
    ap.add_argument("--projects-dir", default=None)
    ap.add_argument("--composer-dir", default=None)
    ap.add_argument("--force", action="store_true")
    args = ap.parse_args(argv)

    result = create_channel(
        args.channel_id,
        name=args.name,
        platform=args.platform,
        aspect=args.aspect,
        base_theme=args.base_theme,
        voice=args.voice,
        language=args.language,
        channels_dir=Path(args.channels_dir) if args.channels_dir else None,
        projects_dir=Path(args.projects_dir) if args.projects_dir else None,
        composer_dir=Path(args.composer_dir) if args.composer_dir else None,
        force=args.force,
    )
    print(json.dumps(result, ensure_ascii=False, indent=2))
    return 0


if __name__ == "__main__":
    sys.exit(main())
