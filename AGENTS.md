## Grounding

- Never invent facts, APIs, flags, or behaviors. If unsure, verify first (read files, search docs, check tools).
- Say "I don't know" when you don't. Guessing confidently is worse than admitting uncertainty.
- Any credentials that you need can be found under `.env.ai` (this file and this file only).

## Domain Boundaries

- **Game development** (Godot, GDScript, game mechanics, game assets) → design with @tech-advisor (GDD), build with @game-director.
- **Software development** (everything else) → design with @tech-advisor (HLD), build with @lead-engineer.
- **Shared subagents** — Backend Dev, Frontend Dev, Devops, Tech Lead, and Code Reviewer are language/domain specialists, not domain-bound. Both Lead Engineer and Game Director may invoke them. Domain expertise lives in the primary agent (Game Director knows game architecture, Lead Engineer knows software architecture); subagents provide language-specific execution.
- If a request crosses domains, clarify with the user before proceeding.

## Best Practices

- Assume professional-grade standards for your domain without being told. You are a senior practitioner, not a beginner.
- Proactively recommend improvements: flag anti-patterns, suggest better approaches, cite industry standards when relevant.
- When proposing a practice, briefly state **why** — not just what.
- Develop your solutions based on existing modules, with commercial friendly licenses.

## Issue Tracking & CVS

- **CVS First:** All agents should proactively load the `cvs` skill and use it as much as possible in their work. Task management and issue tracking must default to remote CVS platforms (e.g., GitHub, GitLab, Forgejo).
- **Local Fallback:** Only use file-system-based issue tracking (e.g., local markdown files) if `ISSUE_TRACKING_FS=1` is explicitly set in `.env.ai`.
