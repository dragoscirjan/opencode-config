# Issue Tracking — CVS Mode

CVS-platform equivalent of `issue-tracking`. Load `cvs-mode` skill first for provider detection, attribution, and label setup.

## Issue Format

Same frontmatter and structure as `issue-tracking` (id, type, title, status, labels, parent, depends). Create issues via CVS API instead of local `.issues/` files.

Types: `epic`, `story`, `task`, `spike` — each maps to a `level/<type>` label.

## Comments

1. Keep concise — link to local files (`.specs/`, `.ai.tmp/`) rather than duplicating content
2. Use platform-supported markdown
3. Reference related issues/PRs by number (`#42`, `!15`)
4. Failures **MUST** be posted as CVS comments (visible to humans even in silent mode)
