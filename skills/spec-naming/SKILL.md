# Spec Naming

Path authority and naming. **Orchestrators only** (Athena, Hephaestus).

## Rule

**Only orchestrators assign paths.** Subagents receive paths, never invent them.

## Structure

```
.specs.tmp/    — compressed drafts/reviews (ephemeral, no subfolders needed)
.specs/        — finalized docs (versioned, permanent)
```

## `.specs.tmp/` — Draft Names

Type-prefixed random. Only agents read these.

Format: `<prefix>-<5-char-random>.md`

| Type | Prefix | Example |
|------|--------|---------|
| HLD | `hld` | `hld-x7f2a.md` |
| Design overview | `design` | `design-k3m9p.md` |
| LLD | `lld` | `lld-q8n4r.md` |
| Tasks | `tasks` | `tasks-b2j6w.md` |
| Review | `rv` | `rv-m5t1c.md` |
| Feedback | `fb` | `fb-p9g3v.md` |

## `.specs/` — Final Names

Structured, versioned. Never overwrite — increment version.

Format: `<type>-<id>-<name>-v<ver>.md`

- `<id>` = 5-digit zero-padded (00001)
- `<name>` = kebab-case
- `<ver>` = integer
- LLD/Tasks inherit parent HLD's `<id>`

## ID Assignment

Scan `.specs/` before assigning:
- New doc → highest existing id + 1 (start 00001)
- New version → same id, ver + 1
- LLD/Tasks → parent HLD's id

## Conflict Detection

Before design work:
1. Scan `.specs/` for scope overlap
2. Overlap found → present options to user: extend, new, or abort
3. Never silently duplicate scope

## Dispatch Pattern

1. Generate output path per conventions above
2. Include in task: `"Write to: .specs.tmp/hld-x7f2a.md"`
3. Subagent returns `SIG:DONE|PATH:<path>`
