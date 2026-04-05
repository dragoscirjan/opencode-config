# Contributing

Thank you for contributing to opencode-config!

## Getting Started

1. Fork the repository and create a feature branch.
2. Make your changes following the conventions in this repo.
3. Open a pull request with a clear description of your changes.

## Agent & Skill Conventions

- New primary agents go in `agents/` and follow the template in `agent-templates/primary.md`.
- New subagents go in `agents/` with a `minion-` prefix and follow `agent-templates/subagent.md`.
- New skills go in `skills/<skill-name>/SKILL.md`.
- New commands go in `commands/<command-name>.md`.
- New tools go in `tools/<tool-name>.ts`.

### Agent Naming Convention

Agents follow a three-family mythology naming scheme:

| Family | Domain | Examples |
|--------|--------|----------|
| **Japanese gods** | Generic / cross-cutting (orchestration layer) | Amaterasu (Technical Advisor), Inari (Product Owner), Benzaiten (Technical Writer), Tsukuyomi (Agent Architect) |
| **Greek heroes** | Software development | Hephaestus (Solution Engineer); subagents: Hector, Orpheus, Atlas, Odysseus, Argus, Archimedes, Daedalus |
| **Norse gods** | Game development | Odin (Game Generator); subagents: Freya, Mimir, Heimdall |

Primary agents use just the name (e.g., `odin.md`, `amaterasu.md`). Subagents follow `minion-<name>-<kebab-description>.md` (e.g., `minion-freya-game-designer.md`, `minion-hector-developer-backend.md`).

### Agent Definition Constraints

- Primary agents must be defined within 400 (max 500) words
- Sub agents must be defined within 300 (max 400) words
- Tsukuyomi must be defined within 500 (max 600) words
- These limitations can be ignored in case of agents/sub-agents with very specific targets

## Tools

TypeScript tools in `tools/` use the `@opencode-ai/plugin` `tool()` helper. Follow the patterns in existing tools for argument validation and error messages.

## Commit Messages

Use [Conventional Commits](https://www.conventionalcommits.org/):
`feat:`, `fix:`, `chore:`, `docs:`, `refactor:`
