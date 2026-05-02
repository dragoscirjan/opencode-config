---
name: issue-tracking
description: Manage tasks, epics, and bugs. Default to remote CVS platforms. Use local .issues/ ONLY if ISSUE_TRACKING_FS=1 in .env.ai. Require cvs skill.
---

# Issue Tracking

Read `.env.ai` from the project folder, if the file existsi
Manage tasks, epics, and bugs. Default to remote CVS platforms. Use local `.issues/` ONLY if `ISSUE_TRACKING_FS=1` in `.env.ai`. Require `cvs` skill.

## Templates

- **Issues:** Base your markdown body on `skills/issue-tracking/issue.md`.
- **Comments:** Format your updates using `skills/issue-tracking/comment.md`.

## Hierarchy & Emoticons

Strictly follow this hierarchy. For CVS, you **MUST** prefix issue titles with the exact emoticon (e.g., `🚀 Q3 Goals`). Do **NOT** manage or use labels.

- **🚀 Initiative** (`initiative`): Top-level business goal.
  - **🏔️ Epic** (`epic`): Large project phase.
    - **📖 Story** (`story`): User-facing feature.
      - **🛠️ Task** (`task`): Atomic implementation step.
      - **🐛 Bug** (`bug`): Defect in a story.
    - **🐛 Bug** (`bug`): Defect in an epic.

## CVS Mode Rules
- **Links over Text:** Link to local `.specs/` files in comments instead of pasting large content.
- **Hierarchy Links:** Use markdown (`#42`) to link parent/child and dependent issues.
- **Report Failures:** Always post execution failures as CVS comments so humans can see them.

## FS Fallback Rules (`.issues/`)
- **Naming:** `<5-digit-id>-<type>-<title-kebab>.md` (e.g., `00001-task-add-auth.md`). Use the `issue-create` tool to automatically generate the file and ID, then edit the body.
- **Format:** YAML frontmatter followed by markdown body.

**Frontmatter Schema:**

```yaml
id: "00001"     # 5-digit zero-padded
type: task      # initiative | epic | story | task | bug
title: Add Auth # Emoticons optional in FS
status: open    # open | in_progress | done | closed
parent: "00000" # Optional: Parent issue ID
depends: []     # Optional: Array of blocking issue IDs
author: name    # Optional: Author name
```
