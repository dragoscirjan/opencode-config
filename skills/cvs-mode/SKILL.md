# CVS Mode

Use CVS tools for any platform operation the user requests. The only operations that belong to `git`/`jj` instead are version control operations (commits, branches, pushes, rebases, etc.).

## Provider Detection

Parse `.git/config` remote origin URL:

| URL contains | Provider | MCP tools | CLI fallback |
|---|---|---|---|
| `github.com` | GitHub | `cvs_github_*` | `gh` |
| `gitlab.com` / self-hosted | GitLab | `cvs_gitlab_*` | `glab` |
| `forgejo` / `gitea` | Forgejo | `cvs_forgejo_*` | `forgejo-cli` |

**Priority**: MCP tools → CLI → fall back to FS mode (load `issue-tracking` skill instead).

## Attribution

All agent-posted CVS content (issues, comments, PRs, reviews) **MUST** include a visible attribution block:

```markdown
---
```
opencode:agent=<agent-name>
```
---
```

Absence of marker = human-authored.

## Labels

Call `enable_cvs_labels` **once per session** before creating labeled issues:

```
enable_cvs_labels({ presets: "types" })         # epic, story, task, spike, bug, chore
enable_cvs_labels({ presets: "types,priority" }) # + critical, high, medium, low
enable_cvs_labels({ presets: "all" })            # all presets
```

If the tool is unavailable, proceed without labels.
