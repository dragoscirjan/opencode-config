---
description: Run tests with coverage
agent: tester
---

Run tests with coverage in "$ARGUMENTS" (or current directory).

## Steps

1. Detect test runner (check in order):
   - `Taskfile.yml` → `task test` or `task test:coverage`
   - `package.json` → `npm test` / `vitest` / `jest`
   - `go.mod` → `go test -race -cover ./...`
   - `Cargo.toml` → `cargo test`
   - `pyproject.toml` / `pytest.ini` → `pytest --cov`
   - etc.

2. Run tests and capture output

3. For failures:
   - Show failing test name and error
   - Show relevant code context
   - Suggest fix

4. Summarize: passed / failed / skipped / coverage %
