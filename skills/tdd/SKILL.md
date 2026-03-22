# TDD — Test-Driven Development

When this skill is loaded, the developer follows the Red-Green-Refactor cycle. The orchestrator loads this skill when the user requests TDD.

## Cycle

1. **Red** — Write failing tests first. Tests define expected behavior from the task plan. Run them — verify they fail for the right reasons (not syntax/import errors).
2. **Green** — Write the minimum code to make all tests pass. No more.
3. **Refactor** — Clean up code and tests. No behavior changes. All tests still pass.

## Rules

- Write tests **before** any implementation code
- Each test covers one behavior — name it after what it verifies
- Start with the simplest case, add complexity incrementally
- Run tests after every step (red, green, refactor) — report results each time
- Tests must fail for the **right reason** — a missing function, not a syntax error
- Do NOT write implementation and tests simultaneously
- Do NOT write all tests upfront — write one test (or a small batch), make it pass, then write the next

## Test Quality

- Test behavior, not implementation details
- Include edge cases: empty inputs, nulls, boundary values, error conditions
- Keep tests independent — no shared mutable state
- Mock external dependencies, not internal logic
- Arrange-Act-Assert structure

## Wire Protocol Extension

When in TDD mode, use these additional signals:

```
SIG:RED|FILES:<test-files>
SIG:GREEN|FILES:<impl-files>,<test-files>
SIG:REFACTOR|FILES:<changed-files>
```

The standard `DONE`, `BLOCKED`, `PARTIAL` signals still apply for final status.
