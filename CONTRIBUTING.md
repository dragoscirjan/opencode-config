# Contributing

Thank you for contributing to opencode-config!

## Getting Started

1. Fork the repository and create a feature branch.
2. Make your changes following the conventions in this repo.
3. Open a pull request with a clear description of your changes.

## Agent & Skill Conventions

- New primary agents go in `agents/` and follow the template in `agent-templates/primary.md`.
- New subagents go in `agents/` with a `worker-` prefix and follow `agent-templates/subagent.md`.
- New skills go in `skills/<skill-name>/SKILL.md`.
- New commands go in `commands/<command-name>.md`.
- New tools go in `tools/<tool-name>.ts`.

### Agent Naming Convention

Agents follow a functional naming convention based on roles:

| Category | Domain | Examples |
|----------|--------|----------|
| **Orchestrators** | Generic / cross-cutting | `tech-advisor`, `product-owner`, `tech-writer`, `agent-architect` |
| **Software Dev** | Application engineering | `lead-engineer`; subagents: `worker-backend-dev`, `worker-frontend-dev`, `worker-devops`, `worker-tech-lead`, `worker-code-reviewer`, `worker-sys-architect`, `worker-lead-architect` |
| **Game Dev** | Godot / Game design | `game-director`; subagents: `worker-game-designer`, `worker-godot-expert`, `worker-visual-qa` |

Primary agents use just the role name (e.g., `game-director.md`, `tech-advisor.md`). Subagents follow `worker-<role>.md` (e.g., `worker-game-designer.md`, `worker-backend-dev.md`).

### Agent Definition Constraints

- Primary agents must be defined within 400 (max 500) words
- Sub agents must be defined within 300 (max 400) words
- Agent Architect must be defined within 500 (max 600) words
- These limitations can be ignored in case of agents/sub-agents with very specific targets

## Tools

TypeScript tools in `tools/` use the `@opencode-ai/plugin` `tool()` helper. Follow the patterns in existing tools for argument validation and error messages.

## Commit Messages

Use [Conventional Commits](https://www.conventionalcommits.org/):
`feat:`, `fix:`, `chore:`, `docs:`, `refactor:`
