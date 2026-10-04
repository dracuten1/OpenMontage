"""VieNeu local Vietnamese text-to-speech provider tool (Apache-2.0).

Wraps the vieneu SDK via an external runner (~/project/vietnamese-tts/vieneu_cli.py)
so this repo stays torch-free and the model weights stay in the runner project.
48kHz ONNX Runtime CPU output, 25 preset voices, optional inline cues.
"""
from __future__ import annotations

import json
import subprocess
import time
from pathlib import Path
from typing import Any

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

# Where the vieneu venv + models live (set VIENEU_HOME to override).
VIENEU_HOME = Path.home() / "project" / "vietnamese-tts"


class VieneuTTS(BaseTool):
    name = "vieneu_tts"
    version = "0.1.0"
    tier = ToolTier.VOICE
    capability = "tts"
    provider = "vieneu"
    stability = ToolStability.EXPERIMENTAL
    execution_mode = ExecutionMode.SYNC
    determinism = Determinism.DETERMINISTIC
    runtime = ToolRuntime.LOCAL

    dependencies = [f"dir:{VIENEU_HOME}"]
    install_instructions = (
        "Set up the vieneu runner (see vietnamese-tts-local skill):\n"
        f"  git clone <vieneu project> {VIENEU_HOME}\n"
        f"  cd {VIENEU_HOME} && uv venv --python 3.12 .venv && uv pip install --python .venv/bin/python vieneu\n"
        "Weights download automatically on first run (~540MB, stored in models/)."
    )
    agent_skills = ["text-to-speech"]

    capabilities = [
        "text_to_speech",
        "offline_generation",
        "vietnamese_narration",
    ]
    supports = {
        "voice_cloning": True,   # via ref_audio in the underlying SDK (not exposed here yet)
        "multilingual": False,   # Vietnamese-focused
        "offline": True,
        "native_audio": True,
    }
    best_for = [
        "Vietnamese narration (native 48kHz quality)",
        "offline local-only workflows, no cloud TTS",
        "news explainers and vertical video voiceovers",
    ]
    not_good_for = [
        "non-Vietnamese languages",
        "ultra-low-latency streaming",
    ]

    input_schema = {
        "type": "object",
        "required": ["text"],
        "properties": {
            "text": {"type": "string", "description": "Vietnamese narration text"},
            "voice": {
                "type": "string",
                "default": None,
                "description": 'Preset voice name e.g. "Trúc Ly" (Nu-Bac-tu nhien), '
                               '"Thiện Minh" (Nam-Bac-ke chuyen). Omit = default news voice.',
            },
            "output_path": {"type": "string", "description": "Target WAV path"},
            "threads": {"type": "integer", "default": 6},
        },
    }

    resource_profile = ResourceProfile(
        cpu_cores=4, ram_mb=2048, vram_mb=0, disk_mb=900, network_required=False
    )
    retry_policy = RetryPolicy(max_retries=1, retryable_errors=["subprocess_timeout"])
    idempotency_key_fields = ["text", "voice"]
    side_effects = ["writes audio file to output_path"]
    user_visible_verification = ["Listen to generated audio for Vietnamese intelligibility"]

    def get_status(self) -> ToolStatus:
        if (VIENEU_HOME / ".venv" / "bin" / "python").exists() and (
            VIENEU_HOME / "vieneu_cli.py"
        ).exists():
            return ToolStatus.AVAILABLE
        return ToolStatus.UNAVAILABLE

    def estimate_cost(self, inputs: dict[str, Any]) -> float:
        return 0.0

    def execute(self, inputs: dict[str, Any]) -> ToolResult:
        if self.get_status() != ToolStatus.AVAILABLE:
            return ToolResult(success=False, error="vieneu runner not available. " + self.install_instructions)

        start = time.time()
        try:
            result = self._generate(inputs)
        except Exception as exc:
            return ToolResult(success=False, error=f"Vieneu TTS failed: {exc}")

        result.duration_seconds = round(time.time() - start, 2)
        return result

    def _generate(self, inputs: dict[str, Any]) -> ToolResult:
        output_path = Path(inputs.get("output_path", "vieneu_output.wav"))
        cmd = [
            str(VIENEU_HOME / ".venv" / "bin" / "python"),
            str(VIENEU_HOME / "vieneu_cli.py"),
            "--text", str(inputs["text"]),
            "--output", str(output_path),
            "--threads", str(int(inputs.get("threads", 6))),
        ]
        if inputs.get("voice"):
            cmd += ["--voice", str(inputs["voice"])]

        proc = subprocess.run(cmd, capture_output=True, text=True, timeout=300)
        # Runner prints one JSON line on stdout (HF download warning may precede it).
        payload = None
        for line in reversed(proc.stdout.splitlines()):
            line = line.strip()
            if line.startswith("{"):
                try:
                    payload = json.loads(line)
                    break
                except json.JSONDecodeError:
                    continue
        if proc.returncode != 0 or not payload or not payload.get("ok"):
            err = (payload or {}).get("error") or proc.stderr.strip()[-500:] or "unknown error"
            return ToolResult(success=False, error=f"Vieneu runner failed: {err}")

        audio_seconds = payload.get("audio_seconds")
        if audio_seconds is None and output_path.exists():
            try:
                import av
                with av.open(str(output_path)) as container:
                    if container.duration is not None:
                        audio_seconds = round(float(container.duration) / av.time_base, 2)
            except Exception:
                pass
            if audio_seconds is None:
                try:
                    probe = subprocess.run(
                        ["ffprobe", "-v", "error", "-show_entries", "format=duration", "-of", "default=noprint_wrappers=1:nokey=1", str(output_path)],
                        capture_output=True, text=True, check=True
                    )
                    audio_seconds = round(float(probe.stdout.strip()), 2)
                except Exception:
                    pass

        meta = {
            "output": payload["output"],
            "audio_seconds": audio_seconds,
            "sample_rate": payload.get("sample_rate"),
            "voice": payload.get("voice"),
            "gen_seconds": payload.get("gen_seconds"),
        }
        return ToolResult(success=True, data=meta, artifacts=[payload["output"]])


if __name__ == "__main__":
    import argparse
    import sys

    parser = argparse.ArgumentParser(description="Vieneu Vietnamese TTS tool")
    parser.add_argument("--text", required=True, help="Vietnamese text to synthesize")
    parser.add_argument("--output", required=True, help="Target audio file path (WAV or MP3)")
    parser.add_argument("--voice", default=None, help="Preset voice name")
    parser.add_argument("--threads", type=int, default=6, help="Thread count")
    args = parser.parse_args()

    tool = VieneuTTS()
    result = tool.execute({
        "text": args.text,
        "output_path": args.output,
        "voice": args.voice,
        "threads": args.threads,
    })
    if not result.success:
        print(f"Error: {result.error}", file=sys.stderr)
        sys.exit(1)
    print(json.dumps(result.data, ensure_ascii=False))
