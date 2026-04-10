---
name: cvs
description: Rules for interacting with local version control and remote platforms (GitHub, GitLab, Forgejo).
---

# CVS Mode

Rules for interacting with local version control and remote platforms (GitHub, GitLab, Forgejo).

## Configuration (`.env.ai`)

Check `.env.ai` for tool and platform overrides before starting:

- `CVS_TOOL`: Local version control CLI. `git` (default) or `jj`.
- `CVS_PLATFORM`: Remote platform. `github` (default), `gitlab`, or `forgejo`.
- `ISSUE_TRACKING_FS=1`: Force local `.issues/` tracking instead of remote.

## Core Directives

1. **Platform Operations:** Use MCP tools (`cvs_github_*`, `cvs_gitlab_*`, `cvs_forgejo_*`) or CLI fallback (`gh`, `glab`, `forgejo-cli`) for issues, PRs, and comments.
2. **Local Operations:** ONLY use the configured `CVS_TOOL` for commits, branches, and pushes.
3. **No Labels:** NEVER manage or use labels for issues/PRs. Rely solely on the emoticon hierarchy defined in the `issue-tracking` skill.

## Provider Mapping

| Platform | Detection Hint | MCP Prefix | CLI Fallback |
|---|---|---|---|
| **GitHub** | `github.com` | `cvs_github_...` | `gh` |
| **GitLab** | `gitlab.com` | `cvs_gitlab_...` | `glab` |
| **Forgejo** | `forgejo` / `gitea` / `codeberg.org` | `cvs_forgejo_...` | `forgejo-cli` |
