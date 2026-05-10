---
name: issue-tracking
description: Manage tasks, epics, and bugs. Default to remote CVS platforms. Use local .issues/ ONLY if ISSUE_TRACKING_FS=1 in .env.ai. Require cvs skill.
---

# Issue Tracking

- Run `get-env` tool for `ISSUE_TRACKING` variable. It will provide you the issue tracking type and tools you can use to create/track issues.
- Manage initiatives, epics, stories, tasks and bugs (see bellow). Default to remote CVS platforms.

## Templates

- **Issues:** Base your markdown body on `skills/issue-tracking/issue.md`.
- **Comments:** Format your updates using `skills/issue-tracking/comment.md`.

For new issue/comment, if possible, always create first, then read specific template .

## Hierarchy & Emoticons

If not created for the file system (`ISSUE_TRACKING=fs,...`), issue title **MUST** contain as prefix the exact emoticon (e.g., `🚀 Q3 Goals`). Do **NOT** manage or use labels.

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
