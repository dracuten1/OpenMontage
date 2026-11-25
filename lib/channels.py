"""Channel pack loader, asset resolver, and merged lexicon/profile helpers."""

from __future__ import annotations

import json
from functools import lru_cache
from pathlib import Path
from typing import Any

import jsonschema
import yaml

from lib.paths import CHANNELS_DIR, PROJECTS_DIR, REPO_ROOT, SHARED_ASSETS_DIR

CHANNEL_SCHEMA_PATH = REPO_ROOT / "schemas" / "channels" / "channel.schema.json"
DEFAULT_MIX_PROFILE_PATH = REPO_ROOT / "tools" / "qc" / "default_mix_profile.json"


@lru_cache(maxsize=1)
def _load_channel_schema() -> dict[str, Any]:
    return json.loads(CHANNEL_SCHEMA_PATH.read_text(encoding="utf-8"))


def list_channels(channels_dir: Path | None = None) -> list[str]:
    """Return sorted channel IDs containing ``channel.yaml`` (skips ``_template`` and dotfiles)."""
    root = Path(channels_dir) if channels_dir is not None else CHANNELS_DIR
    if not root.is_dir():
        return []
    out: list[str] = []
    for entry in sorted(root.iterdir()):
        if not entry.is_dir() or entry.name.startswith(("_", ".")):
            continue
        if (entry / "channel.yaml").is_file():
            out.append(entry.name)
    return out


def load_channel(
    channel_id: str,
    channels_dir: Path | None = None,
    validate: bool = True,
) -> dict[str, Any]:
    """Load and optionally schema-validate ``channels/<channel_id>/channel.yaml``."""
    root = Path(channels_dir) if channels_dir is not None else CHANNELS_DIR
    ch_dir = root / channel_id
    cfg_path = ch_dir / "channel.yaml"
    if not cfg_path.is_file():
        raise FileNotFoundError(f"Channel config not found: {cfg_path}")

    data = yaml.safe_load(cfg_path.read_text(encoding="utf-8"))
    if not isinstance(data, dict):
        raise ValueError(f"Channel config must be a YAML mapping: {cfg_path}")

    if validate:
        schema = _load_channel_schema()
        try:
            jsonschema.validate(instance=data, schema=schema)
        except jsonschema.ValidationError as exc:
            raise ValueError(f"Invalid channel.yaml ({cfg_path}): {exc.message}") from exc
        if data.get("id") != channel_id:
            raise ValueError(
                f"Channel id mismatch in {cfg_path}: id={data.get('id')!r} != dir {channel_id!r}"
            )

    result = dict(data)
    result["_dir"] = str(ch_dir)
    return result


def detect_project_channel(
    project_dir: Path | str,
    projects_dir: Path | None = None,
    channels_dir: Path | None = None,
) -> str | None:
    """Detect channel ID from ``project.json['channel']`` or nested parent folder name."""
    proj = Path(project_dir)
    marker_path = proj / "project.json"
    if marker_path.is_file():
        try:
            marker = json.loads(marker_path.read_text(encoding="utf-8"))
            if isinstance(marker, dict):
                ch = marker.get("channel")
                if isinstance(ch, str) and ch.strip():
                    return ch.strip()
        except (OSError, json.JSONDecodeError, UnicodeError):
            pass

    known = set(list_channels(channels_dir=channels_dir))
    parent = proj.parent
    proj_root = Path(projects_dir) if projects_dir is not None else PROJECTS_DIR
    try:
        if (
            parent.name in known
            and parent.parent.resolve() == proj_root.resolve()
        ):
            return parent.name
    except OSError:
        pass
    if parent.name in known and parent.parent.name == proj_root.name:
        return parent.name
    return None


def resolve_channel_asset(
    channel_id: str | None,
    rel_path: str,
    *,
    project_dir: Path | None = None,
    channels_dir: Path | None = None,
) -> Path | None:
    """Resolve an asset using strict precedence: episode -> channel -> shared -> legacy."""
    clean_rel = str(rel_path).lstrip("/\\")
    if clean_rel.startswith("assets/"):
        clean_rel_no_prefix = clean_rel[len("assets/"):]
    else:
        clean_rel_no_prefix = clean_rel

    ch_root = Path(channels_dir) if channels_dir is not None else CHANNELS_DIR
    candidates: list[Path] = []

    if project_dir is not None:
        proj = Path(project_dir)
        candidates.append(proj / "assets" / clean_rel_no_prefix)
        candidates.append(proj / clean_rel)

    if channel_id:
        ch_dir = ch_root / channel_id
        candidates.append(ch_dir / "assets" / clean_rel_no_prefix)
        candidates.append(ch_dir / clean_rel)

    candidates.append(SHARED_ASSETS_DIR / clean_rel_no_prefix)
    candidates.append(REPO_ROOT / "assets" / clean_rel_no_prefix)
    candidates.append(REPO_ROOT / "music_library" / clean_rel_no_prefix)
    if channel_id:
        candidates.append(REPO_ROOT / "music_library" / "bgm" / channel_id / Path(clean_rel_no_prefix).name)

    for cand in candidates:
        if cand.is_file():
            return cand
    return None


def load_merged_lexicon(
    channel_id: str | None,
    project_dir: Path | None = None,
    lexicon_rel: str = "tts_lexicon.json",
    *,
    channels_dir: Path | None = None,
) -> dict[str, Any] | None:
    """Load channel TTS lexicon and merge episode-level overrides on top."""
    ch_root = Path(channels_dir) if channels_dir is not None else CHANNELS_DIR
    merged: dict[str, Any] = {}
    merged_replacements: dict[str, Any] = {}
    has_any = False

    def _merge_file(path: Path) -> None:
        nonlocal has_any
        if not path.is_file():
            return
        try:
            data = json.loads(path.read_text(encoding="utf-8"))
        except (OSError, json.JSONDecodeError, UnicodeError):
            return
        if not isinstance(data, dict):
            return
        has_any = True
        for k, v in data.items():
            if k in ("replacements", "pronunciations") and isinstance(v, dict):
                merged_replacements.update(v)
            else:
                merged[k] = v

    if channel_id:
        lex_name = "tts_lexicon.json"
        try:
            cfg = load_channel(channel_id, channels_dir=ch_root, validate=False)
            lex_name = (cfg.get("audio") or {}).get("lexicon") or lex_name
        except Exception:
            pass
        _merge_file(ch_root / channel_id / lex_name)

    if project_dir is not None:
        _merge_file(Path(project_dir) / lexicon_rel)

    if not has_any:
        return None
    if merged_replacements:
        existing = merged.get("replacements")
        if isinstance(existing, dict):
            combined = dict(existing)
            combined.update(merged_replacements)
            merged["replacements"] = combined
        else:
            merged["replacements"] = merged_replacements
    return merged


def resolve_channel_mix_profile(
    channel_id: str | None,
    *,
    channels_dir: Path | None = None,
) -> Path:
    """Return channel mix_profile.json if present, else default_mix_profile.json."""
    if channel_id:
        ch_root = Path(channels_dir) if channels_dir is not None else CHANNELS_DIR
        mix_name = "mix_profile.json"
        try:
            cfg = load_channel(channel_id, channels_dir=ch_root, validate=False)
            mix_name = (cfg.get("audio") or {}).get("mix_profile") or mix_name
        except Exception:
            pass
        cand = ch_root / channel_id / mix_name
        if cand.is_file():
            return cand
    return DEFAULT_MIX_PROFILE_PATH
