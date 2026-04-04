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

## Tools

TypeScript tools in `tools/` use the `@opencode-ai/plugin` `tool()` helper. Follow the patterns in existing tools for argument validation and error messages.

## Commit Messages

Use [Conventional Commits](https://www.conventionalcommits.org/):
`feat:`, `fix:`, `chore:`, `docs:`, `refactor:`
