"""9Router Web Search tool for research, evidence gathering, and fact-checking."""

from __future__ import annotations

import json
import os
import sys
import time
import urllib.error
import urllib.request
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


class WebSearch(BaseTool):
    name = "web_search"
    version = "0.1.0"
    tier = ToolTier.ANALYZE
    capability = "web_search"
    provider = "9router"
    stability = ToolStability.PRODUCTION
    execution_mode = ExecutionMode.SYNC
    determinism = Determinism.DETERMINISTIC
    runtime = ToolRuntime.LOCAL

    dependencies = []
    install_instructions = (
        "Ensure local 9router gateway is running on http://localhost:20128\n"
        "and OPENAI_API_KEY (or NINEROUTER_KEY) is set in .env."
    )
    agent_skills = ["9router-web-search"]

    capabilities = [
        "web_search",
        "research",
        "topic_exploration",
        "fact_checking",
        "web_fetch",
    ]
    supports = {
        "citations": True,
        "direct_answer": True,
        "max_results": True,
        "search_type": True,
        "domain_filter": True,
    }
    best_for = [
        "deep research and evidence gathering for video topics",
        "fact-checking claims, dates, and canonical terminology",
        "grounded topic exploration with AI synthesized answers and web citations",
    ]
    not_good_for = ["offline generation without local 9router gateway"]

    input_schema = {
        "type": "object",
        "required": ["query"],
        "properties": {
            "query": {
                "type": "string",
                "description": "The search query or research question.",
            },
            "model": {
                "type": "string",
                "default": "ag",
                "description": "Search provider/model id on 9router (e.g. 'ag', 'search-combo'). Default: 'ag'.",
            },
            "search_type": {
                "type": "string",
                "enum": ["web", "news", "x"],
                "default": "web",
                "description": "Type of search: 'web' (default), 'news', or 'x'.",
            },
            "max_results": {
                "type": "integer",
                "default": 5,
                "minimum": 1,
                "maximum": 20,
                "description": "Maximum number of search results to return.",
            },
            "domain_filter": {
                "type": "string",
                "description": "Optional domain filter (e.g. 'wikipedia.org', 'reuters.com').",
            },
            "output_path": {
                "type": "string",
                "description": "Optional file path to save formatted research results (.md or .json).",
            },
            "timeout": {
                "type": "number",
                "default": 30.0,
                "description": "Request timeout in seconds.",
            },
        },
    }

    resource_profile = ResourceProfile(
        cpu_cores=1, ram_mb=256, vram_mb=0, disk_mb=10, network_required=True
    )
    retry_policy = RetryPolicy(max_retries=2, retryable_errors=["timeout", "502", "503"])
    idempotency_key_fields = ["query", "model", "search_type", "max_results"]
    side_effects = ["queries 9router /v1/search endpoint"]
    user_visible_verification = ["Inspect research summary and citations"]

    def get_status(self) -> ToolStatus:
        api_key = os.environ.get("NINEROUTER_KEY") or os.environ.get("OPENAI_API_KEY")
        if not api_key:
            return ToolStatus.UNAVAILABLE
        return ToolStatus.AVAILABLE

    def estimate_cost(self, inputs: dict[str, Any]) -> float:
        return 0.0

    @staticmethod
    def _format_markdown_report(query: str, provider: str, model: str, answer: str, results: list[dict[str, Any]]) -> str:
        lines: list[str] = [
            f"# Research Report: {query}",
            f"*Provider:* `{provider}` ({model}) | *Date:* {time.strftime('%Y-%m-%d %H:%M:%S')}",
            "",
        ]
        if answer:
            lines.extend([
                "## Summary / Synthesized Answer",
                answer,
                "",
            ])

        lines.extend([
            f"## Sources & Key Findings ({len(results)} found)",
            "",
        ])
        for idx, r in enumerate(results, 1):
            title = r.get("title") or "Source"
            url = r.get("url") or ""
            snippet = r.get("snippet") or ""
            content = r.get("content") or ""
            lines.append(f"### {idx}. [{title}]({url})" if url else f"### {idx}. {title}")
            if snippet:
                lines.append(f"> {snippet.strip()}")
                lines.append("")
            if content and content != snippet:
                # Include a concise content excerpt if available
                short_content = content.strip()[:600]
                if len(content.strip()) > 600:
                    short_content += "..."
                lines.append(short_content)
                lines.append("")

        return "\n".join(lines)

    def execute(self, inputs: dict[str, Any]) -> ToolResult:
        api_key = os.environ.get("NINEROUTER_KEY") or os.environ.get("OPENAI_API_KEY", "")
        if not api_key:
            return ToolResult(
                success=False,
                error="OPENAI_API_KEY or NINEROUTER_KEY not set. " + self.install_instructions,
            )

        start = time.time()
        query = inputs["query"]
        model = inputs.get("model") or os.environ.get("NINEROUTER_SEARCH_MODEL", "ag")
        search_type = inputs.get("search_type", "web")
        max_results = int(inputs.get("max_results", 5))
        timeout = float(inputs.get("timeout", 30.0))

        base_url = (
            os.environ.get("NINEROUTER_URL")
            or os.environ.get("OPENAI_BASE_URL", "http://127.0.0.1:20128/v1")
        ).rstrip("/")

        endpoint = f"{base_url}/search"

        payload: dict[str, Any] = {
            "model": model,
            "query": query,
            "search_type": search_type,
            "max_results": max_results,
        }
        if inputs.get("domain_filter"):
            payload["domain_filter"] = inputs["domain_filter"]

        try:
            req = urllib.request.Request(
                endpoint,
                data=json.dumps(payload).encode("utf-8"),
                headers={
                    "Content-Type": "application/json",
                    "Authorization": f"Bearer {api_key}",
                },
            )
            with urllib.request.urlopen(req, timeout=timeout) as resp:
                raw_body = resp.read().decode("utf-8")
                res = json.loads(raw_body)
        except urllib.error.HTTPError as e:
            err_msg = e.read().decode("utf-8", errors="replace")
            return ToolResult(success=False, error=f"9router search failed (HTTP {e.code}): {err_msg}")
        except Exception as e:
            return ToolResult(success=False, error=f"9router search request failed: {e}")

        provider = res.get("provider", "antigravity")
        answer_obj = res.get("answer")
        answer_text = (
            answer_obj.get("text", "")
            if isinstance(answer_obj, dict)
            else (str(answer_obj) if answer_obj is not None else "")
        )
        results = res.get("results", [])

        artifacts: list[str] = []
        output_path = inputs.get("output_path")
        if output_path:
            p = Path(output_path)
            p.parent.mkdir(parents=True, exist_ok=True)
            if p.suffix.lower() == ".json":
                p.write_text(json.dumps(res, indent=2, ensure_ascii=False), encoding="utf-8")
            else:
                md_content = self._format_markdown_report(query, provider, model, answer_text, results)
                p.write_text(md_content, encoding="utf-8")
            artifacts.append(str(p))

        return ToolResult(
            success=True,
            data={
                "query": query,
                "provider": provider,
                "model": model,
                "answer": answer_text,
                "results": results,
                "num_results": len(results),
            },
            artifacts=artifacts,
            cost_usd=0.0,
            duration_seconds=round(time.time() - start, 2),
            model=model,
        )


if __name__ == "__main__":
    import argparse

    try:
        import dotenv
        dotenv.load_dotenv()
    except ImportError:
        pass

    parser = argparse.ArgumentParser(description="Research topics using 9router /v1/search engine.")
    parser.add_argument("--query", "-q", required=True, help="Search query or research question")
    parser.add_argument("--model", "-m", default="ag", help="Model/provider id (default: 'ag', or 'search-combo')")
    parser.add_argument("--max-results", "-n", type=int, default=5, help="Max results (default: 5)")
    parser.add_argument("--type", default="web", choices=["web", "news", "x"], help="Search type")
    parser.add_argument("--output", "-o", default=None, help="Output file path (.md or .json)")
    parser.add_argument("--domain", default=None, help="Domain filter")

    args = parser.parse_args()
    tool = WebSearch()
    inputs = {
        "query": args.query,
        "model": args.model,
        "max_results": args.max_results,
        "search_type": args.type,
    }
    if args.output:
        inputs["output_path"] = args.output
    if args.domain:
        inputs["domain_filter"] = args.domain

    res = tool.execute(inputs)
    if res.success:
        print(f"[{res.data['provider']} / {res.data['model']}] Results for: '{res.data['query']}'")
        if res.data["answer"]:
            print("\n--- Summary ---")
            print(res.data["answer"][:600] + ("..." if len(res.data["answer"]) > 600 else ""))
        print(f"\n--- Sources ({res.data['num_results']}) ---")
        for idx, item in enumerate(res.data["results"], 1):
            print(f"{idx}. {item.get('title')} -> {item.get('url')}")
        if res.artifacts:
            print(f"\nSaved report to: {res.artifacts[0]}")
        sys.exit(0)
    else:
        print(f"Error: {res.error}", file=sys.stderr)
        sys.exit(1)
