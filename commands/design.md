---
description: Start an architecture design session — design overviews, HLDs, and LLDs
agent: athena
---

Design the architecture for:

$ARGUMENTS

Follow your workflow:

1. **Assess** — determine scope. If `$ARGUMENTS` references a spec (`.specs/`), read it for context. If it references an issue (`#N`), load `cvs-mode` and read the issue.
2. **Conflict detection** — scan `.specs/` for existing design docs that overlap. Surface conflicts — offer to extend existing, create new, or abort.
3. **Mode** — solo (present plan in chat) vs team (2+ of: multi-system scope, competing approaches, new infrastructure, formal docs needed, user requests it).
4. **Execute** — solo: analyze and present architecture in chat. Team: orchestrate @minion-daedalus-lead-architect (design overview) → @minion-archimedes-architect (HLDs) → @minion-odysseus-tech-lead (LLDs) with review rounds.
5. **Deliver** — summarize all produced artifacts (file paths) and recommended next steps (typically: switch to @hephaestus for implementation).

If a CVS issue is referenced, post design summaries at phase boundaries as issue comments.
