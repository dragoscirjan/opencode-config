---
description: Refine a rough idea into a structured Epic with stories, tasks, and acceptance criteria
agent: hermes
---

Refine the following idea into a structured Epic:

$ARGUMENTS

Follow your full workflow:

1. **Explore** — scan `.issues/` and `.specs/` for overlapping Epics or related design docs. Surface conflicts immediately.
2. **Refine** — ask 2-4 clarifying questions at a time. Focus on problem, scope, value, acceptance criteria, dependencies, and risks. Typical: 3 rounds, max 5. If scope is too large, propose splitting.
3. **Consult** (if needed) — use @minion-architect for technical feasibility on uncertain aspects.
4. **Structure** — produce a complete Epic with: scope (goals + non-goals), story breakdown (ordered by dependency, each with AC and complexity), task breakdown per story, open questions, risks.
5. **Output** — present the Epic for review. On approval, write to `.specs/<id>-epic-<name>.md`.

If a CVS issue is referenced (e.g., `#42`), load `cvs-mode` skill and read the issue for context. Post the refinement summary as a CVS comment on completion.
