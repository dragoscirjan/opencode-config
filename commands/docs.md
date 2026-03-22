---
description: Generate or update MkDocs documentation for the current project
agent: technical-writer
subtask: true
---

Generate or update the MkDocs documentation site for this project.

$ARGUMENTS

Follow your full workflow:
1. Explore the project — read README, source tree, existing docs/, changelogs, contributing guides
2. Scaffold the toolchain if not already set up (uv, mise, Taskfile docs tasks, mkdocs.yml)
3. Write or update all documentation pages following the standard nav structure
4. Run `task docs:build` to confirm the site builds without errors

If `$ARGUMENTS` is provided, treat it as a specific instruction (e.g. "update the API section" or "add a configuration page"). Otherwise, perform a full documentation audit and fill any missing sections.
