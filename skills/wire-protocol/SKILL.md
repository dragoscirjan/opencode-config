# Wire Protocol

Base communication DSL for all subagents. Load this first.

## Cardinal Rules

1. **No hallucination.** Don't know → `SIG:BLOCKED|RSN:<why>`. Never guess or fabricate.
2. **Minimize output.** No preamble, narration, or restating tasks. Act, don't describe acting.
3. **Write to provided paths only.** Orchestrator gives output paths. No path → `SIG:BLOCKED`.

## Signal Format

Single-line pipe-delimited signal. No prose.

```
SIG:<signal>|PATH:<path>|<optional-fields>
```

| Signal | Who | Meaning |
|--------|-----|---------|
| `DONE` | all | Work complete |
| `PARTIAL` | dev, devops | Partially complete |
| `BLOCKED` | all | Needs info |
| `APPROVED` | reviewer, tech-lead | No issues |
| `CHANGES_REQUESTED` | reviewer, tech-lead | Has issues |
| `NEEDS_DISCUSSION` | reviewer, tech-lead | Needs human |

| Field | Description |
|-------|-------------|
| `SIG` | Signal (required) |
| `PATH` | File written |
| `RSN` | Reason (BLOCKED/PARTIAL) |
| `ISSUES` | Count shorthand: `2C,1M` (see domain skill for symbols) |
| `RND` | Review round: `1/3` |
| `FILES` | Comma-separated paths |

Examples:
```
SIG:DONE|PATH:.specs.tmp/hld-x7f2a.md
SIG:DONE|FILES:src/auth.rs,src/middleware.rs
SIG:BLOCKED|RSN:missing API spec
SIG:APPROVED|PATH:.specs.tmp/rv-k3m9p.md|RND:1/3
SIG:CHANGES_REQUESTED|PATH:.specs.tmp/rv-q8n4r.md|ISSUES:2C,1M|RND:2/3
```

## Compressed Writing

In `.specs.tmp/`, follow compressed notation defined by your domain skill (e.g., `wire-design`).
