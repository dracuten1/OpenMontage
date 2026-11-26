---
name: gemini-web-search
description: >-
  Run Google-grounded news and explainer research through Gemini Web (gemini.google.com/app)
  via OpenMontage's gemini_web_search tool and agent-desktop with automatic 3-profile Chrome
  rotation, URL extraction, primary-source verification, and headless fallback. Use before
  calling gemini_web_search in the research stage of animated-explainer or news pipelines.
---

# Gemini Web Search (`gemini_web_search`)

Use `tools/analysis/gemini_web_search.py` as the primary interactive research backend on unlocked macOS desktops (~0 Antigravity tokens) before falling back to headless search.

## CLI & Tool Usage

```bash
.venv/bin/python tools/analysis/gemini_web_search.py \
  --query "diễn biến thuế quan Mỹ tác động xuất khẩu Việt Nam" \
  --freshness YYYY-MM-DD \
  --language vi \
  --output projects/<channel>/<slug>/research/gemini_raw.md
```

- **Profile rotation (automatic):** `Default` → `Profile 2` → `Profile 5` on rate-limit, empty output, or helper error. Pass `--window-id <id>` (from `chrome_ax_helper.py find-window`) to pin an existing tab without rotating.
- **Prompt modes:** `news_research` (default — enforces `freshness_anchor`, ≥2 independent sources, and a fenced full-URL block for `--prefer-copy-code`) or `raw` (sends prompt verbatim; pair with `--skill <name>` / `--task` if needed).
- **Output formats:** `.md` (formatted report + extracted URL list) or `.json` (structured payload with `response`, `urls`, `profile`, `attempts`).

## Mandatory Verification & Fallback Rules

1. **Never treat Gemini Web text alone as `PRIMARY_FETCHED`:** Take the extracted `urls` and read/verify exact numbers, dates, and quotes on original publisher pages using `web_url_read` (SearXNG MCP) or `curl -sL` before writing `artifacts/fact_whitelist.json`.
2. **Headless / locked-screen fallback:** If Chrome GUI is unavailable or all 3 profiles fail, immediately fall back to `searxng_web_search` + `web_url_read` (or `web_search` via 9Router / native `search_web`).

## Quick Health Check

```bash
.venv/bin/python -c "from tools.tool_registry import registry; registry.discover(); print(registry.get('gemini_web_search').get_status())"
```
