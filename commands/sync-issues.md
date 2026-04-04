---
description: Sync issues between CVS platform and local .issues/ directory
agent: hermes
---

Sync issues between the CVS platform and local `.issues/` files.

$ARGUMENTS

Load `cvs-mode` and `issue-tracking` skills.

**Direction** (determined from `$ARGUMENTS` or ask user):

- **pull** — fetch open issues from the CVS platform, create/update corresponding `.issues/` files following `issue-tracking` conventions. Preserve existing local metadata. Skip issues that are already up-to-date.
- **push** — read local `.issues/` files, create or update corresponding issues on the CVS platform. Include visible attribution block (see `cvs-mode` skill).
- **sync** (default if unspecified) — pull first, then push. Resolve conflicts by preferring the most recently updated version. Present conflicts to user if ambiguous.

**Rules:**
- Never delete local files or close remote issues during sync — only create/update.
- Report a summary: created, updated, skipped, conflicts.
- If `$ARGUMENTS` includes a filter (e.g., "only epics", "#42"), scope to that.
