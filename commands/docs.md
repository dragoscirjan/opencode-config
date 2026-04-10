---
description: Generate or update MkDocs documentation for the current project
agent: tech-writer
---

Generate or update the MkDocs documentation site for this project.

$ARGUMENTS

Follow your full workflow:

1. **Explore** — read README, source tree, existing `docs/`, changelogs, contributing guides. If a CVS issue is referenced (e.g., `#42`), load `cvs-mode` and read the issue for documentation requirements.
2. **Scaffold** — if not already set up, create the toolchain: `uv` for Python env, `mise.toml` for Python version, `Taskfile.yml` with docs tasks (`docs:serve`, `docs:build`, `docs:deploy`), `mkdocs.yml` with material theme.
3. **Write** — create or update documentation pages following the standard nav structure. One page at a time. Use proper headings, code blocks, admonitions. Never invent API details — use `TODO` placeholders for anything unverifiable.
4. **Verify** — run `mise exec -- task docs:build` to confirm the site builds without errors. Do NOT run `docs:serve`.

If `$ARGUMENTS` is provided, treat it as a specific instruction (e.g., "update the API section", "add a configuration page", "document the new auth flow"). Otherwise, perform a full documentation audit and fill any missing sections.

If a CVS issue is referenced, post a completion comment summarizing what was documented.
