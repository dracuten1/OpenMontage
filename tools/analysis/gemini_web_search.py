"""Gemini Web Search tool via signed-in Chrome profiles and `agent-desktop`."""

from __future__ import annotations

import json
import os
import re
import shutil
import subprocess
import sys
import tempfile
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

DEFAULT_PROFILES: list[str] = ["Default", "Profile 2", "Profile 5"]
_RATE_LIMIT_PATTERNS = (
    "reached your limit",
    "rate limit",
    "too many requests",
    "try again later",
    "quota exceeded",
    "something went wrong",
    "couldn't generate",
    "can't help with that right now",
)
_URL_RE = re.compile(r"https?://[^\s<>\"')\]`]+")


def _default_helper_path() -> Path:
    override = os.environ.get("GEMINI_WEB_HELPER")
    if override:
        return Path(override).expanduser()
    return Path.home() / ".gemini/config/skills/agent-desktop-web/scripts/chrome_ax_helper.py"


def _default_agent_desktop_bin() -> str | None:
    found = shutil.which("agent-desktop")
    if found:
        return found
    fallback = Path("/opt/homebrew/bin/agent-desktop")
    if fallback.is_file() and os.access(fallback, os.X_OK):
        return str(fallback)
    return None


def _extract_urls(text: str) -> list[str]:
    """Extract unique http(s) URLs in appearance order, stripping trailing punctuation."""
    seen: set[str] = set()
    urls: list[str] = []
    for match in _URL_RE.findall(text):
        cleaned = match.rstrip(".,;:")
        if cleaned and cleaned not in seen:
            seen.add(cleaned)
            urls.append(cleaned)
    return urls


def _looks_like_rate_limit(text: str) -> bool:
    """Detect short Gemini Web quota/rate-limit error banners that should rotate profiles."""
    stripped = text.strip()
    if not stripped:
        return True
    if len(stripped) > 600:
        return False
    lowered = stripped.lower()
    return any(pattern in lowered for pattern in _RATE_LIMIT_PATTERNS)


class GeminiWebSearch(BaseTool):
    """Run Google-grounded web research through Gemini Web (`gemini.google.com/app`)."""

    name = "gemini_web_search"
    version = "0.1.0"
    tier = ToolTier.ANALYZE
    capability = "web_search"
    provider = "gemini_web"
    stability = ToolStability.PRODUCTION
    execution_mode = ExecutionMode.SYNC
    determinism = Determinism.STOCHASTIC
    runtime = ToolRuntime.LOCAL

    dependencies = []
    install_instructions = (
        "Requires macOS Google Chrome with signed-in profile(s), `agent-desktop` CLI "
        "(/opt/homebrew/bin/agent-desktop), and `~/.gemini/config/skills/agent-desktop-web/SKILL.md` "
        "(helper script `scripts/chrome_ax_helper.py`)."
    )
    agent_skills: list[str] = ["gemini-web-search"]

    capabilities = [
        "web_search",
        "research",
        "topic_exploration",
        "fact_checking",
        "news_discovery",
    ]
    supports = {
        "citations": True,
        "direct_answer": True,
        "profile_rotation": True,
        "task_mode": True,
        "freshness_anchor": True,
    }
    best_for = [
        "Google-grounded interactive news discovery and multi-source synthesis at ~0 Antigravity tokens",
        "Vietnamese and international news research across signed-in Chrome profiles (Default -> Profile 2 -> Profile 5)",
    ]
    not_good_for = [
        "headless or locked-screen cron jobs without an active Chrome GUI (use searxng_web_search + web_url_read)",
        "primary-source verification alone (always verify numbers on publisher URLs via web_url_read or curl)",
    ]

    input_schema = {
        "type": "object",
        "required": ["query"],
        "properties": {
            "query": {
                "type": "string",
                "description": "Search query or research prompt.",
            },
            "prompt_mode": {
                "type": "string",
                "enum": ["news_research", "raw"],
                "default": "news_research",
                "description": "'news_research' wraps query with structured multi-source + fenced URL rules; 'raw' sends query verbatim.",
            },
            "freshness_anchor": {
                "type": "string",
                "description": "Anchor date (YYYY-MM-DD) for resolving relative dates. Defaults to today.",
            },
            "language": {
                "type": "string",
                "default": "vi",
                "description": "Target summary language (e.g. 'vi', 'en').",
            },
            "profiles": {
                "type": "array",
                "items": {"type": "string"},
                "description": "Ordered Chrome profile directories to rotate on failure/rate-limit.",
            },
            "window_id": {
                "type": "string",
                "description": "Optional specific Chrome window_id from `chrome_ax_helper.py find-window` (disables profile rotation).",
            },
            "skill": {
                "type": "string",
                "description": "Optional Gemini Web @skill name to prepend.",
            },
            "task": {
                "type": "boolean",
                "default": False,
                "description": "Enable Gemini Web Task mode checkbox if available.",
            },
            "new_chat": {
                "type": "boolean",
                "default": True,
                "description": "Start a new chat before sending.",
            },
            "prefer_copy_code": {
                "type": "boolean",
                "default": True,
                "description": "Click the latest 'Copy code' button + pbpaste to preserve verbatim links.",
            },
            "timeout": {
                "type": "integer",
                "default": 180,
                "minimum": 15,
                "description": "Generation timeout in seconds per profile attempt.",
            },
            "output_path": {
                "type": "string",
                "description": "Optional file path to save formatted research results (.md or .json).",
            },
        },
    }

    resource_profile = ResourceProfile(
        cpu_cores=1, ram_mb=256, vram_mb=0, disk_mb=10, network_required=True
    )
    retry_policy = RetryPolicy(max_retries=0)
    idempotency_key_fields = ["query", "prompt_mode", "freshness_anchor", "language"]
    side_effects = ["automates signed-in Google Chrome Gemini Web tab via agent-desktop"]
    user_visible_verification = ["Verify cited publisher URLs via web_url_read or curl before locking fact_whitelist"]

    def get_status(self) -> ToolStatus:
        helper = _default_helper_path()
        binary = _default_agent_desktop_bin()
        if helper.is_file() and binary is not None:
            return ToolStatus.AVAILABLE
        return ToolStatus.UNAVAILABLE

    def estimate_cost(self, inputs: dict[str, Any]) -> float:
        return 0.0

    @staticmethod
    def _build_prompt(
        query: str,
        *,
        prompt_mode: str,
        freshness_anchor: str,
        language: str,
    ) -> str:
        if prompt_mode == "raw":
            return query.strip()

        lang_label = "tiếng Việt" if language.lower().startswith("vi") else language
        return (
            f"Bạn là trợ lý nghiên cứu tin tức. Ngày neo hiện tại (freshness_anchor): {freshness_anchor}.\n"
            f"Chủ đề cần tìm kiếm & đối chiếu trên Google Search: {query.strip()}\n\n"
            f"Yêu cầu bắt buộc (trả lời bằng {lang_label}):\n"
            "1. Tìm ít nhất 2-4 nguồn báo chí uy tín hoặc cơ quan chính thức độc lập mới nhất; nêu rõ ngày xuất bản tường minh (DD/MM/YYYY), không dùng mốc mơ hồ.\n"
            "2. Liệt kê các số liệu, tỷ lệ %, mốc thời gian, giá trị tiền tệ và phát ngôn quan trọng kèm tên nguồn; ghi chú rõ nếu có số liệu mâu thuẫn giữa các nguồn.\n"
            "3. Ở cuối câu trả lời, xuất MỘT khối code fence ```markdown chứa danh sách đầy đủ các URL gốc (https://... nguyên văn, không rút gọn) để trích xuất cơ học.\n"
        )

    @staticmethod
    def _format_markdown_report(
        *,
        query: str,
        freshness_anchor: str,
        profile: str | None,
        window_id: str | None,
        response: str,
        urls: list[str],
    ) -> str:
        target_label = f"window `{window_id}`" if window_id else f"profile `{profile}`"
        lines: list[str] = [
            f"# Gemini Web Research: {query}",
            f"*Provider:* `gemini_web` ({target_label}) | *Freshness Anchor:* `{freshness_anchor}` | *Date:* {time.strftime('%Y-%m-%d %H:%M:%S')}",
            "",
            "## Response",
            response.strip(),
            "",
            f"## Extracted URLs ({len(urls)})",
            "",
        ]
        if urls:
            for idx, url in enumerate(urls, 1):
                lines.append(f"{idx}. {url}")
        else:
            lines.append("_No URLs extracted from response._")
        lines.append("")
        return "\n".join(lines)

    @staticmethod
    def _parse_helper_stdout(stdout: str) -> dict[str, Any]:
        raw = (stdout or "").strip()
        if not raw:
            return {}
        try:
            parsed = json.loads(raw)
            return parsed if isinstance(parsed, dict) else {}
        except json.JSONDecodeError:
            return {}

    def execute(self, inputs: dict[str, Any]) -> ToolResult:
        helper = _default_helper_path()
        binary = _default_agent_desktop_bin()
        if not helper.is_file() or binary is None:
            return ToolResult(
                success=False,
                error=(
                    "Gemini Web Search prerequisites missing "
                    f"(helper_exists={helper.is_file()}, agent_desktop={binary!r}). "
                    + self.install_instructions
                ),
            )

        start = time.monotonic()
        query = str(inputs["query"])
        prompt_mode = str(inputs.get("prompt_mode") or "news_research")
        freshness_anchor = str(inputs.get("freshness_anchor") or time.strftime("%Y-%m-%d"))
        language = str(inputs.get("language") or "vi")
        window_id = inputs.get("window_id")
        profiles = list(inputs.get("profiles") or DEFAULT_PROFILES)
        skill = inputs.get("skill")
        task = bool(inputs.get("task", False))
        new_chat = bool(inputs.get("new_chat", True))
        prefer_copy_code = bool(inputs.get("prefer_copy_code", True))
        timeout_s = int(inputs.get("timeout", 180))

        prompt_text = self._build_prompt(
            query,
            prompt_mode=prompt_mode,
            freshness_anchor=freshness_anchor,
            language=language,
        )

        targets: list[tuple[str, str]] = (
            [("window", str(window_id))]
            if window_id
            else [("profile", str(p)) for p in profiles]
        )

        attempts: list[dict[str, Any]] = []
        prompt_tmp_path: Path | None = None
        out_tmp_path: Path | None = None

        try:
            with tempfile.NamedTemporaryFile(
                mode="w", suffix=".txt", encoding="utf-8", delete=False
            ) as pf:
                pf.write(prompt_text)
                prompt_tmp_path = Path(pf.name)

            with tempfile.NamedTemporaryFile(
                mode="w", suffix=".txt", encoding="utf-8", delete=False
            ) as of:
                out_tmp_path = Path(of.name)

            for kind, target in targets:
                if out_tmp_path.exists():
                    out_tmp_path.write_text("", encoding="utf-8")

                cmd = [
                    sys.executable,
                    str(helper),
                    "gemini-send",
                    "--prompt-file",
                    str(prompt_tmp_path),
                    "--timeout-s",
                    str(timeout_s),
                    "--out",
                    str(out_tmp_path),
                ]
                if kind == "window":
                    cmd.extend(["--window-id", target])
                else:
                    cmd.extend(["--profile-dir", target])
                if new_chat:
                    cmd.append("--new-chat")
                if task:
                    cmd.append("--task")
                if skill:
                    cmd.extend(["--skill", str(skill)])
                if prefer_copy_code:
                    cmd.append("--prefer-copy-code")

                try:
                    proc = subprocess.run(
                        cmd,
                        text=True,
                        capture_output=True,
                        timeout=timeout_s + 45,
                    )
                except subprocess.TimeoutExpired:
                    attempts.append({"target": target, "kind": kind, "ok": False, "error": "subprocess timeout"})
                    continue
                except Exception as exc:
                    attempts.append({"target": target, "kind": kind, "ok": False, "error": str(exc)})
                    continue

                meta = self._parse_helper_stdout(proc.stdout)
                if proc.returncode != 0 or not meta.get("ok"):
                    err_detail = meta.get("error") or (proc.stderr or proc.stdout or f"exit {proc.returncode}").strip()
                    attempts.append({"target": target, "kind": kind, "ok": False, "error": str(err_detail)[:300]})
                    continue

                response_text = out_tmp_path.read_text(encoding="utf-8", errors="replace").strip() if out_tmp_path.exists() else ""
                if _looks_like_rate_limit(response_text):
                    attempts.append({
                        "target": target,
                        "kind": kind,
                        "ok": False,
                        "error": f"empty or rate-limited response: {response_text[:160]}",
                    })
                    continue

                attempts.append({"target": target, "kind": kind, "ok": True, "chars": len(response_text)})
                urls = _extract_urls(response_text)
                resolved_profile = target if kind == "profile" else None
                resolved_window_id = str(meta.get("window_id") or (target if kind == "window" else "")) or None

                result_data: dict[str, Any] = {
                    "query": query,
                    "provider": "gemini_web",
                    "profile": resolved_profile,
                    "window_id": resolved_window_id,
                    "freshness_anchor": freshness_anchor,
                    "response": response_text,
                    "urls": urls,
                    "num_urls": len(urls),
                    "attempts": attempts,
                }

                artifacts: list[str] = []
                output_path = inputs.get("output_path")
                if output_path:
                    dest = Path(str(output_path))
                    dest.parent.mkdir(parents=True, exist_ok=True)
                    if dest.suffix.lower() == ".json":
                        dest.write_text(
                            json.dumps(result_data, indent=2, ensure_ascii=False),
                            encoding="utf-8",
                        )
                    else:
                        md_report = self._format_markdown_report(
                            query=query,
                            freshness_anchor=freshness_anchor,
                            profile=resolved_profile,
                            window_id=resolved_window_id,
                            response=response_text,
                            urls=urls,
                        )
                        dest.write_text(md_report, encoding="utf-8")
                    artifacts.append(str(dest))

                return ToolResult(
                    success=True,
                    data=result_data,
                    artifacts=artifacts,
                    cost_usd=0.0,
                    duration_seconds=round(time.monotonic() - start, 2),
                    model="gemini-web",
                )

            summary = "; ".join(f"{a['target']}: {a.get('error', 'failed')}" for a in attempts)
            return ToolResult(
                success=False,
                data={"query": query, "provider": "gemini_web", "attempts": attempts},
                error=(
                    f"All Gemini Web targets failed ({summary}). "
                    "Fall back to `searxng_web_search` + `web_url_read` or 9Router `web_search`."
                ),
                duration_seconds=round(time.monotonic() - start, 2),
                model="gemini-web",
            )
        finally:
            if prompt_tmp_path is not None and prompt_tmp_path.exists():
                prompt_tmp_path.unlink(missing_ok=True)
            if out_tmp_path is not None and out_tmp_path.exists():
                out_tmp_path.unlink(missing_ok=True)


if __name__ == "__main__":
    import argparse

    parser = argparse.ArgumentParser(description="Research topics via Gemini Web (gemini.google.com/app) with Chrome profile rotation.")
    parser.add_argument("--query", "-q", required=True, help="Search query or research prompt")
    parser.add_argument("--mode", default="news_research", choices=["news_research", "raw"], help="Prompt wrapper mode")
    parser.add_argument("--freshness", default=None, help="Freshness anchor YYYY-MM-DD (default: today)")
    parser.add_argument("--language", default="vi", help="Output language (default: vi)")
    parser.add_argument("--profile", action="append", dest="profiles", help="Chrome profile dir (repeatable; default rotates Default -> Profile 2 -> Profile 5)")
    parser.add_argument("--window-id", default=None, help="Target specific Chrome window_id directly")
    parser.add_argument("--skill", default=None, help="Optional Gemini Web @skill to prepend")
    parser.add_argument("--task", action="store_true", help="Enable Task checkbox")
    parser.add_argument("--no-new-chat", action="store_true", help="Reuse current chat instead of clicking New chat")
    parser.add_argument("--no-copy-code", action="store_true", help="Disable --prefer-copy-code extraction")
    parser.add_argument("--timeout", type=int, default=180, help="Timeout seconds per profile (default: 180)")
    parser.add_argument("--output", "-o", default=None, help="Output file path (.md or .json)")

    args = parser.parse_args()
    tool = GeminiWebSearch()
    tool_inputs: dict[str, Any] = {
        "query": args.query,
        "prompt_mode": args.mode,
        "language": args.language,
        "task": args.task,
        "new_chat": not args.no_new_chat,
        "prefer_copy_code": not args.no_copy_code,
        "timeout": args.timeout,
    }
    if args.freshness:
        tool_inputs["freshness_anchor"] = args.freshness
    if args.profiles:
        tool_inputs["profiles"] = args.profiles
    if args.window_id:
        tool_inputs["window_id"] = args.window_id
    if args.skill:
        tool_inputs["skill"] = args.skill
    if args.output:
        tool_inputs["output_path"] = args.output

    res = tool.execute(tool_inputs)
    if res.success:
        print(f"[gemini_web | profile={res.data.get('profile')} | window={res.data.get('window_id')}]")
        print(res.data["response"][:1200] + ("..." if len(res.data["response"]) > 1200 else ""))
        print(f"\n--- URLs ({res.data['num_urls']}) ---")
        for i, u in enumerate(res.data["urls"], 1):
            print(f"{i}. {u}")
        if res.artifacts:
            print(f"\nSaved report to: {res.artifacts[0]}")
        sys.exit(0)
    else:
        print(f"Error: {res.error}", file=sys.stderr)
        sys.exit(1)
