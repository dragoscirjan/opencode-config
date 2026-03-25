---
description: Create a pull request from the current branch with auto-generated description
agent: hephaestus
---

Create a pull request for the current work.

$ARGUMENTS

Follow this flow:

1. **Context** — load `cvs-mode` skill. Detect the CVS provider. Read the current branch name, `git diff` against the base branch, and recent commit messages.
2. **Gather references** — scan for related specs in `.specs/`, issues in `.issues/`, and any CVS issue references in commit messages or `$ARGUMENTS`.
3. **Generate PR** — create the pull request with:
   - **Title**: concise summary (from `$ARGUMENTS` if provided, otherwise derived from branch/commits)
   - **Description**: what changed, why, how to test. Reference linked issues/specs.
   - **Labels/assignees**: if `$ARGUMENTS` specifies them
4. **Push and open** — push the branch and create the PR via CVS tools.
5. **Report** — show the PR URL and summary to the user.

If `$ARGUMENTS` provides a title, branch, or additional instructions, use them. Otherwise, auto-detect everything from git state.

Include visible attribution block on the PR description (see `cvs-mode` skill).
