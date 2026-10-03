#!/usr/bin/env python3
"""PreCompact hook blocker for Claude Code.

Enforces zero-compaction policy for OpenMontage productions.
When Claude Code reaches the auto-compact threshold, this hook blocks compaction
with exit code 2 and outputs a JSON decision block, forcing clean session rotation.
"""

import json
import sys


def main() -> None:
    # Log incident to stderr (Claude Code surfaces this to the user/session)
    sys.stderr.write(
        "\n[CRITICAL GUARD] Claude Code attempted context compaction!\n"
        "Compaction is strictly forbidden during OpenMontage video generation "
        "to prevent context loss, hallucinated parameters, and dropped schemas.\n"
        "ACTION REQUIRED: Finish current stage checkpoint and rotate to a fresh session.\n\n"
    )

    # Return structured block decision
    result = {
        "decision": "block",
        "reason": "Compaction forbidden by OpenMontage pipeline rules. Rotate sessions instead of compacting.",
    }
    print(json.dumps(result))
    sys.exit(2)


if __name__ == "__main__":
    main()
