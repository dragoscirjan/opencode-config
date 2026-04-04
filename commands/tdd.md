---
description: Implement a feature using Test-Driven Development (Red-Green-Refactor)
agent: hephaestus
---

Implement the following using strict TDD (Test-Driven Development):

$ARGUMENTS

**TDD is mandatory for this task.** Load the `tdd` skill. Instruct all developers to follow Red-Green-Refactor:

1. **Red** — write failing tests first. Tests define expected behavior.
2. **Green** — write minimum code to make tests pass.
3. **Refactor** — clean up, all tests still pass.

Otherwise, follow the standard implementation workflow:

1. **Assess scope** — determine solo vs team mode. If `$ARGUMENTS` references a spec or issue, read it for context.
2. **Plan** — solo: plan and go. Team: @minion-tech-lead for task breakdown, feasibility reviews, user approval.
3. **Build** — TDD cycle for each subtask. Every developer loads `tdd` skill.
4. **Test** — full test suite must pass after each cycle.
5. **Review** — dispatch @minion-reviewer. Address feedback. Max 3 rounds.
6. **Report** — summarize what was built, TDD cycles completed, test coverage, and any open concerns.
