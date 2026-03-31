---
description: Design a new OpenCode skill — domain-specific instructions loaded on-demand by agents
agent: gea
---

Design a new skill:

$ARGUMENTS

Follow this process:

1. **Discovery** — understand the skill's purpose: what domain knowledge does it capture? Which agents will load it? When should it be loaded? What behavior does it change?
2. **Design** — determine structure: rules, templates, conventions, size limits. Skills should be focused — one concern per skill. If it exceeds ~200 lines, consider splitting.
3. **Write** — create `skills/<name>/SKILL.md` with clear sections: purpose, rules, templates/conventions, examples. Use the same style as existing skills.
4. **Integrate** — identify which agents should reference the new skill. Suggest specific additions to agent prompts (e.g., "Load `<skill>` when X condition applies").
5. **Verify** — confirm the skill is self-contained (an agent loading only this skill would understand what to do).

If `$ARGUMENTS` is provided, treat it as the skill's purpose and domain. Still ask clarifying questions if the scope is unclear.
