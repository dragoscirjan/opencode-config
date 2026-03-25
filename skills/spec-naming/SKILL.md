# Spec Naming

Path authority and naming for `.specs/`. **Orchestrators only** (Athena, Hephaestus).

## Rule

**Only orchestrators assign spec paths.** Subagents receive paths, never invent them.

For draft documents in `.ai.tmp/`, load the `draft-documents` skill.

## `.specs/` — Finalized Documents

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
2. Include in task: `"Write to: .specs/hld-00001-auth-system-v1.md"`
3. Subagent returns `SIG:DONE|PATH:<path>`
