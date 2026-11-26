#!/usr/bin/env python3
"""Thin OpenMontage QC gate adapter delegating to the global vn-legal-counsel plugin."""
from __future__ import annotations

import argparse
import importlib.util
import os
import sys
from pathlib import Path
from typing import Any

DEFAULT_PLUGIN_DIR = Path.home() / ".gemini" / "config" / "plugins" / "vn-legal-counsel"


def _resolve_scanner_path() -> Path:
    plugin_dir = Path(os.environ.get("VN_LEGAL_PLUGIN_DIR", str(DEFAULT_PLUGIN_DIR))).expanduser()
    scanner = plugin_dir / "skills" / "vn-legal-counsel" / "scripts" / "legal_audit_scanner.py"
    if not scanner.is_file():
        raise FileNotFoundError(
            f"Global vn-legal-counsel scanner not found at {scanner}. "
            "Ensure global plugin vn-legal-counsel is installed under ~/.gemini/config/plugins/."
        )
    return scanner


def _load_global_scanner():
    scanner_path = _resolve_scanner_path()
    spec = importlib.util.spec_from_file_location("vn_legal_audit_scanner_global", str(scanner_path))
    if spec is None or spec.loader is None:
        raise ImportError(f"Unable to load scanner module from {scanner_path}")
    mod = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(mod)
    return mod


def verify_project_legal_audit(
    project_dir: Path | str,
    *,
    registry_path: Path | str | None = None,
    scan_only: bool = False,
) -> tuple[bool, dict[str, Any], list[str]]:
    """Run global Vietnamese legal audit verification for an OpenMontage project."""
    scanner = _load_global_scanner()
    reg = scanner.load_superseded_registry(registry_path) if registry_path else scanner.load_superseded_registry()
    return scanner.verify_legal_audit(project_dir, registry=reg, scan_only=scan_only)


def main(argv: list[str] | None = None) -> int:
    scanner = _load_global_scanner()
    return scanner.main(argv)


if __name__ == "__main__":
    sys.exit(main())
