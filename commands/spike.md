---
description: Conduct a technical research spike — explore, analyze, and report findings
agent: athena
---

Research the following technical question:

$ARGUMENTS

This is a **spike** — time-boxed research, not a design commitment. You can consult anyone on your team.

1. **Understand** — clarify the question. If `$ARGUMENTS` references an issue (`#N`), load `cvs-mode` and read it. If it references a spec, read it for context.
2. **Explore** — investigate the codebase (`codeindex_*` tools), external docs (`docs_context7_*`), code examples (`docs_github_grep_*`), and web resources as needed.
3. **Consult** — dispatch subagents for specialized input:
   - @minion-archimedes-architect or @minion-daedalus-lead-architect for architecture-level questions
   - @minion-odysseus-tech-lead for implementation approach feasibility
   - @minion-hector-developer-backend / @minion-orpheus-developer-frontend for technology-specific expertise
   - @minion-atlas-devops for infrastructure/deployment questions
4. **Synthesize** — produce a structured research report in chat:
   - **Question**: what was asked
   - **Findings**: what was discovered (with evidence/references)
   - **Options**: viable approaches with trade-offs
   - **Recommendation**: your suggested path and why
   - **Open questions**: what still needs investigation
5. **No formal docs** — spikes produce chat output, not `.specs/` documents. Unless the user explicitly asks for a written report.

If a CVS issue is referenced, post the findings summary as an issue comment.
