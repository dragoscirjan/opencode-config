# Issue Tracking

Local FS conventions for `.issues/` (flat, no subfolders).

## File Naming

`<5-digit-id>-<type>-<title-kebab>.md` — types: `epic`, `story`, `task`, `spike`.

**ID assignment**: scan `.issues/`, use highest ID + 1 (start 00001). Never reuse IDs.

## File Format

```markdown
---
id: "00003"
type: task
title: Add Auth Middleware
status: open
labels: [level/task, enhancement]
parent: "00002"
depends: ["00001"]
---

# Add Auth Middleware

Description — scope, goals, acceptance criteria. Epics contain story breakdowns, stories contain task lists, tasks are atomic.

## Comments

---
```
opencode:agent=athena
```
---

HLD complete. See `.specs/hld-00002-cvs-provider-v1.md`.

---
```

## Frontmatter

| Field | Required | Values |
|-------|----------|--------|
| `id` | yes | 5-digit zero-padded string |
| `type` | yes | `epic` \| `story` \| `task` \| `spike` |
| `title` | yes | Human-readable |
| `status` | yes | `open` \| `in_progress` \| `done` \| `closed` |
| `labels` | yes | Array — must include `level/<type>` |
| `parent` | no | Parent issue ID (story→epic, task→story) |
| `depends` | no | Array of blocking issue IDs |

## Comments

Append under `## Comments`, separated by `---`.

- **Agent**: wrap with `opencode:agent=<name>` attribution block (see example above)
- **Human**: no attribution marker
