---
description: Investigate and fix a bug from a description or issue reference
agent: lead-engineer
---

Fix the following bug:

$ARGUMENTS

Follow this flow:

1. **Understand** — if `$ARGUMENTS` references an issue (`#N`), load `cvs-mode` and read it for reproduction steps and context. Otherwise, analyze the bug description.
2. **Investigate** — explore the codebase to locate the root cause. Check related tests, recent changes, and error handling paths.
3. **Reproduce** — if possible, write or run a failing test that demonstrates the bug.
4. **Fix** — apply the minimal change to resolve the root cause. Load `clean-code` and appropriate developer skill (`developer-backend`, `developer-frontend`, or `developer-devops`).
5. **Test** — ensure the failing test now passes. Run the full test suite — no regressions.
6. **Review** — for non-trivial fixes, dispatch @worker-code-reviewer. Address feedback.
7. **Report** — summarize: root cause, what was changed, test coverage added.

If a CVS issue is referenced, post the root cause analysis and fix summary as issue comments.
