---
description: Code review on current diff
agent: code-reviewer
---

Run a comprehensive code review on the current diff.

## Steps

1. Get the diff: `git diff main...HEAD`
2. Review all changes for quality, security, performance, and correctness
3. Present findings grouped by category, then severity:

```
## Security
### Critical
- file:line - Issue description

## Performance
### High
- ...

## Code Quality
...
```

4. End with:
   - Issue counts by severity
   - Top 3 priorities to fix
   - Patterns observed across codebase
