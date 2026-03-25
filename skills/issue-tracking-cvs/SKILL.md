# Issue Tracking — CVS Mode

Conventions for managing issues on GitHub, GitLab, or Forgejo. Activates when an issue is explicitly referenced (e.g., `#42`) or user requests CVS mode.

## Provider Detection

Parse `.git/config` remote origin URL:

| URL contains | Provider | MCP tools | CLI fallback |
|--------------|----------|-----------|-------------|
| `github.com` | GitHub | `cvs_github_*` | `gh` |
| `gitlab.com` / self-hosted | GitLab | `cvs_gitlab_*` | `glab` |
| `forgejo` / `gitea` | Forgejo | `cvs_forgejo_*` | `forgejo-cli` |

**Priority**: MCP tools → CLI → fall back to FS mode (load `issue-tracking` skill instead).

## Issue Types & Labels

Types: `epic`, `story`, `task`, `spike`. Each maps to a `level/<type>` label.

**Label setup**: call `enable_cvs_labels` once per session before creating labeled issues:

```
enable_cvs_labels({ presets: "types" })          # epic, story, task, spike, bug, chore
enable_cvs_labels({ presets: "types,priority" })  # + critical, high, medium, low
enable_cvs_labels({ presets: "all" })             # types + priority + status + scope
```

If the tool is unavailable, skip — proceed without labels.

## Attribution

All agent-posted CVS content **MUST** include:

```markdown
---
```
opencode:agent=<agent-name>
```
---
```

Absence of marker = human-authored.

## Posting Comments

1. Include attribution block
2. Keep concise — link to local files (`.specs/`, `.ai.tmp/`) rather than duplicating content
3. Use platform-supported markdown
4. Reference related issues/PRs by number (`#42`, `!15`)

## Failure Reporting

Failures **MUST** be posted as CVS comments (visible to humans even in silent mode). Progress updates are optional in interactive mode, recommended in silent mode.
