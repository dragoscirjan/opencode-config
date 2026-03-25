# CVS Mode

CVS integration conventions. Loaded by agents when working with version control system issues, PRs, or comments.

## Mode Selection

| Condition | Mode | Behavior |
|-----------|------|----------|
| User mentions an issue (e.g., `#42`, `issue 42`) | **CVS** | Use CVS tools for issues/PRs, post comments |
| No issue context, no CVS provider detected | **FS** | Local `.issues/` files only (load `issue-tracking` skill) |
| CVS tools unavailable but provider detected | **FS+CLI** | Fall back to CLI tools (`gh`, `glab`, `forgejo-cli`) |

**Default is FS mode.** CVS mode activates only when an issue is explicitly referenced or the user requests it.

## Provider Detection

Parse `.git/config` for `[remote "origin"]` URL:

| URL contains | Provider | MCP tools | CLI fallback |
|--------------|----------|-----------|-------------|
| `github.com` | GitHub | `cvs_github_*` | `gh` |
| `gitlab.com` or GitLab self-hosted | GitLab | `cvs_gitlab_*` | `glab` |
| `forgejo` or `gitea` in URL | Forgejo | `cvs_forgejo_*` | `forgejo-cli` |
| None of the above | Unknown | — | FS mode only |

**Auto-detection order**: Check MCP tools first (preferred). If unavailable, try CLI. If neither, fall back to FS mode.

## Autonomy Levels

| Level | Default? | Behavior |
|-------|----------|----------|
| **Interactive** | Yes | Ask user in chat before acting. Standard for all primary agents. |
| **Silent** | No | Proceed autonomously. Report progress and failures as CVS comments. |

**Rules**:
- Destructive CI/CD operations (deploy, delete, force-push) → **ALWAYS** require human approval regardless of autonomy level
- Non-destructive operations (build, test, lint) → auto-approve in silent mode
- Silent mode is opt-in per session — user must explicitly request it

## Identity & Attribution

All LLM-generated content posted to CVS **MUST** include a visible attribution block:

```markdown
---
```
opencode:agent=<agent-name>
```
---
```

Absence of this marker = human-authored content.

## Dual Communication Model

| Channel | Purpose | Direction |
|---------|---------|-----------|
| **FS** (wire protocol) | Inter-agent coordination | Agent ↔ Agent |
| **CVS** (issue comments) | Human-visible updates | Agent → Human |

**Rules**:
- Inter-agent communication uses wire protocol signals only — **never** CVS as message bus between agents
- Failure reports **MUST** be posted as CVS comments (so humans see them even in silent mode)
- Progress updates to CVS are optional in interactive mode (user sees chat), recommended in silent mode

## CVS Operations by Role (Guideline)

Typical operations per role. This is orientative — agents may perform additional CVS operations when the task requires it. Use judgement.

| Operation | PO | Orchestrators | Workers | Reviewer |
|-----------|----|---------------|---------|----------|
| Read issues | ✅ | ✅ | ✅ | ✅ |
| Write issues | ✅ | ✅ | ❌ | ❌ |
| Read comments | ✅ | ✅ | ✅ | ✅ |
| Write comments | ✅ | ✅ | ✅ | ✅ |
| Push commits | ❌ | ✅ | ✅ | ❌ |
| Create PRs | ❌ | ✅ | ✅ | ❌ |
| Read PRs | ❌ | ✅ | ✅ | ✅ |
| Review PRs | ❌ | ❌ | ❌ | ✅ |

**PO** = hermes. **Orchestrators** = athena, hephaestus. **Workers** = architect, lead-architect, tech-lead, developer-*, devops.

## Approval Flow

| Mode | Approval mechanism | Maps to |
|------|-------------------|---------|
| CVS | PR review approval | `SIG:APPROVED` |
| FS | User confirmation in chat | `SIG:APPROVED` |

## Label Management

Before creating issues with labels, ensure the labels exist on the CVS platform.

**Tool: `enable_cvs_labels`** _(use if available)_ — Creates missing labels idempotently on GitHub, GitLab, or Forgejo. Auto-detects platform from git remote.

**When to call:**
- Before the **first** `gh issue create --label ...`, `glab issue create --label ...`, or equivalent API call in a session
- You only need to call it **once per session** — it creates all missing labels in one go

**Usage:**
```
enable_cvs_labels({ presets: "types" })              # epic, story, task, spike, bug, chore
enable_cvs_labels({ presets: "types,priority" })      # + critical, high, medium, low
enable_cvs_labels({ presets: "all" })                 # types + priority + status + scope
enable_cvs_labels({ presets: "types", dryRun: "true" }) # preview only
```

**Presets:** `types` (epic/story/task/spike/bug/chore), `priority` (critical/high/medium/low), `status` (blocked/needs-review/in-progress/ready), `scope` (docs/tests/ci/deps).

If the tool is unavailable, skip this step — label creation will fail silently on the CVS platform and you can proceed without labels.

## Posting a CVS Comment

When posting to CVS:
1. Include attribution (see Identity section above)
2. Keep comments concise — link to local files (`.specs/`, `.ai.tmp/`) rather than duplicating content
3. Use markdown formatting the CVS platform supports
4. Reference related issues/PRs by number (e.g., `#42`, `!15`)

## Wire Protocol Integration

No new signal types. Existing signals apply. CVS operations are **side-effects** alongside wire signals:
- Agent completes work → returns `SIG:DONE` to orchestrator AND (if CVS mode) posts summary comment to issue
- Agent blocked → returns `SIG:BLOCKED` to orchestrator AND (if CVS mode) posts failure comment to issue
