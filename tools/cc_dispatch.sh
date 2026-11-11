#!/bin/bash
# cc_dispatch.sh — Claude Code --print wrapper for OpenMontage manual dispatches.
# Postmortem 2026-11-11 (tin-nong-3tin-20261110): CC runs repeatedly "succeeded"
# with empty output or died mid-stream ('No tool call found for function call
# output') and the caller never noticed. This wrapper retries once on transport
# glitch and exits non-zero if CC is still broken.
#
# Usage: cc_dispatch.sh <log-file> [extra claude args...]
#   Task spec is read from STDIN (same as: claude --print ... < task.md)
# Example:
#   cc_dispatch.sh history/cc_fix3.log --max-turns 60 < history/CC_TASK_FIX3.md \
#     --allowedTools Read,Edit,Write,Glob,Grep,Bash
set -u
LOG="${1:?usage: cc_dispatch.sh <log-file> [extra claude args...] ; task on stdin}"
shift

run_claude() {
  claude --print --dangerously-skip-permissions --permission-mode acceptEdits "$@" \
    > "$LOG" 2>&1
}

glitch() {
  [ ! -s "$LOG" ] && return 0
  grep -q 'No tool call found for function call output' "$LOG" && return 0
  return 1
}

run_claude "$@"
rc=$?
if [ $rc -eq 0 ] && glitch; then
  echo "[cc_dispatch] transport glitch (empty/corrupt output) — retrying once" >&2
  run_claude "$@"
  rc=$?
fi

if glitch; then
  echo "[cc_dispatch] FAIL — CC output still empty/corrupt after retry: $LOG" >&2
  exit 1
fi
if grep -q 'Reached max turns' "$LOG"; then
  echo "[cc_dispatch] FAIL — CC hit max turns, task incomplete: $LOG" >&2
  exit 1
fi
exit $rc
