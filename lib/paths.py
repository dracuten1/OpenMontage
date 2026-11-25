"""Canonical repository paths — single source of truth.

The projects root is the most load-bearing path in the system: checkpoints
are written under it, tool events are attributed against it, and the Backlot
board watches it. Define it once.
"""

from __future__ import annotations

import os
from pathlib import Path

REPO_ROOT = Path(__file__).resolve().parent.parent

# Overridable for staging/screenshots/tests. Everything — checkpoint writes,
# event attribution, the Backlot board — follows the same root.
PROJECTS_DIR = Path(os.environ.get("OPENMONTAGE_PROJECTS_DIR") or (REPO_ROOT / "projects"))
CHANNELS_DIR = Path(os.environ.get("OPENMONTAGE_CHANNELS_DIR") or (REPO_ROOT / "channels"))
SHARED_ASSETS_DIR = REPO_ROOT / "assets" / "shared"


def is_project_dir(path: Path) -> bool:
    """Return True when ``path`` looks like an episode/project workspace directory."""
    if not path.is_dir():
        return False
    if (path / "project.json").is_file():
        return True
    try:
        return any(path.glob("checkpoint_*.json"))
    except OSError:
        return False


def is_channel_container(path: Path, channels_dir: Path | None = None) -> bool:
    """Return True when ``path`` is a channel subdirectory grouping nested episodes."""
    if not path.is_dir() or path.name.startswith(("_", ".")):
        return False
    if is_project_dir(path):
        return False
    ch_root = Path(channels_dir) if channels_dir is not None else CHANNELS_DIR
    if (ch_root / path.name / "channel.yaml").is_file():
        return True
    try:
        return any(is_project_dir(child) for child in path.iterdir() if child.is_dir() and not child.name.startswith(("_", ".")))
    except OSError:
        return False


def iter_project_dirs(
    projects_dir: Path | None = None,
    channels_dir: Path | None = None,
) -> list[tuple[str | None, Path]]:
    """Return ``(channel_id_or_None, project_dir)`` pairs for flat and nested layouts."""
    root = Path(projects_dir) if projects_dir is not None else PROJECTS_DIR
    if not root.is_dir():
        return []
    entries: list[tuple[str | None, Path]] = []
    for entry in sorted(root.iterdir()):
        if not entry.is_dir() or entry.name.startswith(("_", ".")):
            continue
        if is_channel_container(entry, channels_dir=channels_dir):
            for child in sorted(entry.iterdir()):
                if not child.is_dir() or child.name.startswith(("_", ".")):
                    continue
                entries.append((entry.name, child))
        else:
            entries.append((None, entry))
    return entries


def resolve_project_dir(
    project_id: str,
    projects_dir: Path | None = None,
    channel: str | None = None,
    channels_dir: Path | None = None,
) -> Path | None:
    """Locate ``project_id`` across flat ``projects/<id>`` and nested ``projects/<ch>/<id>``."""
    root = Path(projects_dir) if projects_dir is not None else PROJECTS_DIR
    if not project_id or any(c in project_id for c in "/\\:") or project_id in (".", ".."):
        return None
    if channel:
        cand = root / channel / project_id
        if cand.is_dir():
            return cand
    direct = root / project_id
    if direct.is_dir() and not is_channel_container(direct, channels_dir=channels_dir):
        return direct
    if not root.is_dir():
        return None
    for entry in sorted(root.iterdir()):
        if not entry.is_dir() or entry.name.startswith(("_", ".")):
            continue
        if is_channel_container(entry, channels_dir=channels_dir):
            nested = entry / project_id
            if nested.is_dir():
                return nested
    return None
