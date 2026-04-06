---
description: Generate or update CHANGELOG.md from git history and resolved issues
agent: tech-writer
---

Generate or update the project changelog.

$ARGUMENTS

1. **Read history** — examine git log (commits, tags, merges). If CVS is available (load `cvs-mode`), also read resolved issues and merged PRs for the version range.
2. **Determine scope** — if `$ARGUMENTS` specifies a version or range (e.g., "v1.2.0", "since v1.1.0"), scope to that. Otherwise, generate for all unreleased changes since the last tag.
3. **Categorize** — group changes following Keep a Changelog format:
   - **Added** — new features
   - **Changed** — changes to existing functionality
   - **Deprecated** — features to be removed
   - **Removed** — removed features
   - **Fixed** — bug fixes
   - **Security** — vulnerability fixes
4. **Write** — create or update `CHANGELOG.md`. If it exists, prepend the new version section. Do not overwrite existing entries.
5. **Reference** — link to issues/PRs where possible (e.g., `(#42)`, `(PR #15)`).

Follow Keep a Changelog conventions (keepachangelog.com).
