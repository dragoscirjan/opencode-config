---
description: Generate project documentation
agent: docs
---

Generate or update documentation for "$ARGUMENTS" (or current project).

## Steps

1. Explore the codebase — understand structure, public API, and existing docs
2. Set up tooling if missing (mise for Python, uv for deps, Taskfile for `docs` tasks)
3. Set up `mkdocs.yml` and `docs/` if they don't exist
4. Generate usage documentation (getting started, configuration, features)
5. Generate API documentation from source if the project has a public API
6. Verify with `task docs:build`
