# Draft Documents

Conventions for `.ai.tmp/` — ephemeral working drafts shared between agents.

## Structure

Flat directory. No subfolders.

## Naming

`<title-kebab>-<8char-hash>.md` — regenerate hash on every write. Never overwrite; each revision is a new file.

## When to Use

- Cross-agent review before finalizing
- Large documents that benefit from incremental drafting

## Rules

- Never reference `.ai.tmp/` paths in issues or specs — they are transient.
