---
description: Dispatch reviewers to evaluate an existing design document
agent: athena
---

Review the following design document:

$ARGUMENTS

1. **Identify** — `$ARGUMENTS` should reference a spec path (e.g., `.specs/hld-00002-auth-v1.md`) or describe which design to review. If unclear, scan `.specs/` and ask the user to pick.
2. **Dispatch reviewers** — based on the document type:
   - **Design overview** → @minion-architect + @minion-tech-lead review
   - **HLD** → @minion-tech-lead + relevant dev(s) review
   - **LLD** → relevant dev(s) review (not @minion-tech-lead if they authored it)
3. **Collect feedback** — reviewers write to `.ai.tmp/` review paths. Collect signals.
4. **Present** — summarize findings to user: critical issues, major concerns, positives, verdict.
5. **Revise** (if needed) — if user wants changes addressed, dispatch the original author to revise based on feedback. Run additional review rounds (max 3).

Follow standard review conventions. Use `spec-create` tool for any new spec versions, `draft-create` for review paths.
