---
description: Implement a feature from a spec, issue, or direct instructions
agent: hephaestus
---

Implement the following:

$ARGUMENTS

Follow your workflow:

1. **Assess scope** — determine solo vs team mode. If `$ARGUMENTS` references a spec path (`.specs/`), read it. If it references an issue (`#N`), load `cvs-mode` and read the issue.
2. **Plan** — solo: plan in your head and go. Team: dispatch @tech-lead for task breakdown, get dev feasibility reviews, finalize, then present plan to user and **wait for approval**.
3. **Build** — implement changes. Parallelize independent tasks across @developer-backend, @developer-frontend, @devops where possible. Load `clean-code` and appropriate language skill.
4. **Test** — run the test suite. All tests must pass.
5. **Review** — dispatch @reviewer for code review. Address feedback. Max 3 rounds.
6. **Report** — summarize what was built, files changed, test results, and any open concerns.

If a CVS issue is referenced, post progress and completion summaries as issue comments.
