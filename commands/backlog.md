---
description: Review and prioritize the backlog — scan issues, suggest priorities and next actions
agent: product-owner
---

Review the current backlog.

$ARGUMENTS

1. **Scan** — read all items in `.issues/` (if exists) and `.specs/` for Epics. If CVS is available (load `cvs-mode`), also read open issues from the platform.
2. **Categorize** — group items by status (open, in-progress, blocked, stale) and type (Epic, Story, Task, Spike).
3. **Assess** — for each open item: is it well-defined? Does it have clear AC? Are dependencies met? Is it blocked on anything?
4. **Recommend** — present a prioritized summary:
   - **Ready to start** — well-defined, unblocked items in suggested priority order
   - **Needs refinement** — items that are too vague or missing AC
   - **Blocked** — items waiting on dependencies or decisions
   - **Stale** — items with no activity that should be closed or re-evaluated
5. **Suggest** — recommend what to work on next based on dependencies and value.

If `$ARGUMENTS` provides a filter (e.g., "only epics", "only blocked"), narrow the scope accordingly.
