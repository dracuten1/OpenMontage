#!/usr/bin/env bash
# ==============================================================================
# OpenMontage Agent Team Runner via Claude Code CLI
# ==============================================================================
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
REPO_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"

if [ $# -lt 1 ]; then
  echo "Usage: $0 <project_id> [playbook]"
  echo "Example: $0 btc-market-update clean-professional"
  exit 1
fi

PROJECT_ID="$1"
PLAYBOOK="${2:-clean-professional}"

cd "$REPO_ROOT"

if [ ! -d "projects/$PROJECT_ID" ]; then
  echo "ERROR: Project directory 'projects/$PROJECT_ID' does not exist."
  echo "Run 'scripts/hermes_research_ingest.py' first to seal the research artifact."
  exit 1
fi

# Ensure venv python is active
if [ -d ".venv" ]; then
  # shellcheck disable=SC1091
  source .venv/bin/activate
fi

# Check next stage
NEXT_STAGE=$(.venv/bin/python -c "
from lib.checkpoint import get_next_stage
from pathlib import Path
print(get_next_stage(Path('projects'), '$PROJECT_ID', 'animated-explainer') or 'COMPLETED')
")

echo "=========================================================="
echo "OpenMontage Team Launcher"
echo "Project: $PROJECT_ID | Playbook: $PLAYBOOK"
echo "Current State Machine Target: $NEXT_STAGE"
echo "=========================================================="

if [ "$NEXT_STAGE" = "COMPLETED" ]; then
  echo "All pipeline stages for '$PROJECT_ID' are completed!"
  exit 0
fi

# Export guardrails to environment
export CLAUDE_CODE_EXPERIMENTAL_AGENT_TEAMS=1
export DISABLE_AUTO_COMPACT=1

# Generate active prompt
PROMPT_TEMPLATE="$REPO_ROOT/.claude/prompts/om_team_leader_prompt.md"
if [ ! -f "$PROMPT_TEMPLATE" ]; then
  echo "ERROR: Prompt template missing at $PROMPT_TEMPLATE"
  exit 1
fi

ACTIVE_PROMPT=$(sed -e "s/\$PROJECT_ID/$PROJECT_ID/g" -e "s/\$PLAYBOOK/$PLAYBOOK/g" "$PROMPT_TEMPLATE")

echo "Starting Claude Code interactive session in Agent Teams mode..."
echo "(WebSearch & WebFetch are strictly disallowed)"

exec claude \
  --disallowedTools WebSearch,WebFetch \
  "$ACTIVE_PROMPT"
