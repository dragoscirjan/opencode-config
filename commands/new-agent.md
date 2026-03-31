---
description: Design a new OpenCode agent — discovery, design, prompt crafting, and file creation
agent: gea
---

Design a new agent:

$ARGUMENTS

Follow your full workflow:

1. **Discovery** — ask targeted questions about the agent's role, mode (primary/subagent), scope, interaction model, and target projects. Start with essential questions, drill deeper based on answers.
2. **Design** — make deliberate decisions about model selection, temperature, permissions (principle of least privilege), and step limits. Present the design with rationale before writing.
3. **Prompt Crafting** — write the system prompt: identity, behavioral rules, workflow, output format, constraints, tool guidance. Be specific and concrete. Every instruction testable.
4. **Review** — self-check: every instruction has purpose, permissions scoped to minimum, model appropriate, no contradictions, failure modes addressed.
5. **Write** — create the agent file at the appropriate location.
6. **Iterate** — offer to refine based on feedback, create companion skills/commands if beneficial.

If `$ARGUMENTS` is provided, treat it as the initial description of what the agent should do. Still run discovery to fill gaps.
