---
description: Analyze and refine an existing agent — improve prompt quality, permissions, and design
agent: gea
---

Refine the following agent:

$ARGUMENTS

1. **Read** — if `$ARGUMENTS` is a file path, read that agent. Otherwise, search `agents/` for a matching name. If ambiguous, list agents and ask.
2. **Analyze** — evaluate the agent against design principles:
   - Is the identity clear and specific?
   - Are permissions scoped to minimum necessary?
   - Is the model appropriate for the task?
   - Are instructions specific, concrete, and testable?
   - Are there contradictions or redundancies?
   - Are failure modes addressed?
   - Is the prompt length appropriate (too long → suggest skill extraction)?
3. **Present findings** — show the user what you'd change and why. Categorize as: critical (must fix), improvement (recommended), nit (optional).
4. **Rewrite** — on user approval, apply changes. Preserve the agent's core identity and purpose — refine, don't redesign.
5. **Companions** — suggest new skills, commands, or constraint changes if they'd improve the agent.

If `$ARGUMENTS` says "all" or "audit", analyze every agent in `agents/` and produce a summary report.
