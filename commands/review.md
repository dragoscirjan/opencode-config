---
description: Trigger a code review on specific files or recent changes
agent: hephaestus
---

Review the following code:

$ARGUMENTS

Dispatch @minion-argus-reviewer to perform a thorough code review.

1. **Scope** — if `$ARGUMENTS` specifies file paths, review those files. If it says "recent changes" or similar, use `git diff` to identify changed files. If it references an issue or spec, use that as context for what the code should accomplish.
2. **Review** — @minion-argus-reviewer checks: correctness, security (input validation, no hardcoded secrets, auth), performance (no N+1, unnecessary allocations), test coverage, code quality (readability, codebase patterns).
3. **Findings** — present the review findings to the user. Priority: security > correctness > performance > style.
4. **Fix** (if requested) — if the user asks to fix the findings, dispatch the appropriate developer(s) to address them, then re-review.

This command only reviews — it does not fix code unless explicitly asked.
