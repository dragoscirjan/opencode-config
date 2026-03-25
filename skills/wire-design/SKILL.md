# Wire Design

Design document domain extension for `wire-protocol`. Loaded by design authoring and reviewing agents.

## Compressed Notation

| Context | Symbol | Meaning |
|---------|--------|---------|
| Review | `[C]` | Critical |
| Review | `[M]` | Major |
| Review | `[m]` | Minor |
| Review | `[n]` | Nit |
| Feedback | `[!]` | Risk |
| Feedback | `[?]` | Question |
| Feedback | `[+]` | Positive |
| Document | `VRD:` | Verdict |
| Document | `ACT:` | Action |

### Telegraphic Writing

In `.ai.tmp/` content — drop articles/filler, imperative mood, abbreviate: `req` `impl` `cfg` `auth` `svc` `db` `fn` `dep` `env` `err` `msg` `resp` `ctx`. Use `file:line` refs. Keywords over sentences. Mermaid OK.

## Document Metadata

Every design document carries provenance metadata. Format differs by phase.

### Compressed Drafts (`.ai.tmp/`)

First line, before template header:

```
META:<type>|ID:<id>|V:<ver>|ISS:<#N>|DATE:<YYYY-MM-DD>|AUTH:opencode:<agent>|REPO:<owner/repo>[|<extra-key>:<value>]*
```

- `<type>`: `overview` | `hld` | `lld` | `tasks`
- `ISS:—` when no issue. Omit `<extra-key>` pairs unless contextually relevant.
- The orchestrator provides: type, ID, name, version, issue ref, repo, date. The author fills `AUTH` with its own agent name.

### Finalized Documents (`.specs/`)

Visible metadata block immediately after the document title (`# ...`). Must be readable in rendered markdown — **not** hidden YAML frontmatter.

```markdown
# <Document Type> — <Name>

---
Document Type: <Design Overview | HLD | LLD | Tasks>
ID: <00000>
Name: <name>
Version: v<N>
Status: Current
Repository: [<owner/repo>](https://<provider>/<owner>/<repo>)
Date: <YYYY-MM-DD>
Author: opencode:<agent>
Issue: [#<N>](https://<provider>/<owner>/<repo>/issues/<N>)   ← omit line if none
Issue File: [<filename>](<relative-path>)                      ← omit line if none
---
```

- The `---` fences make it a visible horizontal-rule-delimited block, not YAML frontmatter.
- `Author` is always the agent name (e.g., `opencode:lead-architect`), never the user.
- Agents MAY add extra fields (e.g., `Supersedes`, `Parent Doc`, `Migrated Index`) when contextually relevant.

## Workflow

1. Orchestrator provides output path → author writes compressed draft there.
2. Orchestrator dispatches reviewers with draft + review output path → reviewers write feedback.
3. Author reads **one review at a time**, applies targeted edits (Edit tool). No full rewrites.
4. Repeat until approved.
5. Finalization: orchestrator provides final output path → translate to full English, write there (see Finalization below).

## Size Limits

Compressed notation required (see above). Over limit = not compressed enough.

| Type | Max Lines |
|------|-----------|
| HLD | 300 (excl. Mermaid) |
| Design overview | 150 |
| LLD | 200 |
| Tasks | 200 |
| Review/feedback | 50 |

## Templates

### Design Overview (≤150 lines excl. Mermaid)

No code blocks. No component internals.

```
META:overview|ID:<id>|V:<ver>|ISS:<#N>|DATE:<date>|AUTH:opencode:<agent>|REPO:<owner/repo>
DESIGN:<id>|<name>|DRAFT:<N>
---
SCOPE:                        (≤20)
- Problem, goals, non-goals

COMPONENTS:                   (≤40)
- <comp>: <responsibility>, <boundary>
- <comp>→<comp>: <interaction>

[Mermaid: system/component diagram — unlimited]

HLDS:                         (≤30)
- hld-<id>-<name>: <scope>

DEC:                          (≤30)
- <choice> over <alt> — <rationale>

RISK:                         (≤20)
[!] <risk>

ASSUME:                       (≤10)
- <assumption>
```

### HLD (≤300 lines excl. Mermaid/Swagger)

No code blocks. No pseudo-code.

```
META:hld|ID:<id>|V:<ver>|ISS:<#N>|DATE:<date>|AUTH:opencode:<agent>|REPO:<owner/repo>
HLD:<id>|<name>|DRAFT:<N>
---
REQ:                          (≤20)
- F: <functional req>
- NF: <non-functional req>

ARCH:                         (≤40)
- <comp>: <role>, <owns what>
- <comp>→<comp> via <protocol>

[Mermaid — unlimited]

DATA:                         (≤25)
- <entity>: <description>
- <entity>→<entity>: <rel>

IFACE:                        (≤25, plain English, NO code)
- <comp>: exposes <ops> via <protocol>
- [Swagger for HTTP APIs — unlimited]

DEC:                          (≤40)
- <choice> over <alt> — <rationale>, trade-off: <consequence>

RISK:                         (≤25)
[!] <risk>  [?] <open question>

ASSUME:                       (≤15)
```

### Review (≤50)

```
RV:<doc-ref>|RND:<N>/3
---
[C] <file:line> — <issue>, <fix>
[M] <file:line> — <issue>, <fix>
[m] <file:line> — <issue>
[n] <nit>
[+] <positive>
VRD:<APPROVED|CHANGES_REQUESTED|NEEDS_DISCUSSION>
```

### Feedback (≤50)

```
FB:<doc-ref>|ROLE:<role>
---
[!] <risk>
[?] <question>
[+] <positive>
ACT:<REVISE|APPROVE|DISCUSS>|PRI:<high|med|low>
```

### LLD (≤200)

```
META:lld|ID:<id>|V:<ver>|ISS:<#N>|DATE:<date>|AUTH:opencode:<agent>|REPO:<owner/repo>
LLD:<hld-id>|<lld-name>|DRAFT:<N>
---
SCOPE:          (≤5)
COMPONENTS:     (≤100)
- <comp>: <responsibility>, <approach>
- <comp>→<comp>: <pattern>
DATA:           (≤30)
- <model>: <fields, constraints>
IFACE:          (≤25, NO code)
DEC:            (≤25)
RISK:           (≤20)
```

### Tasks (≤200)

```
META:tasks|ID:<id>|V:<ver>|ISS:<#N>|DATE:<date>|AUTH:opencode:<agent>|REPO:<owner/repo>
TASKS:<hld-id>|<name>|DRAFT:<N>
---
SCOPE:          (≤5)
TASKS:          (≤150)
T1: <desc>
  FILES: <paths>
  DEPS: —
  NOTES: <approach>
  AC: <criteria>
RISK:           (≤20)
```

## Finalization

Translating compressed drafts to full English at the path provided by the orchestrator.

**Max 200 lines per tool call.** Finalized docs are large — always chunk.

### Technique

1. Read compressed draft. Plan sections and chunk count.
2. **Write tool** — create file with first chunk (header + first sections).
3. **Edit tool** — append each remaining chunk by matching last line(s) and adding below.
4. **Read** — verify completeness.

#### Append Pattern

```
oldString: <last 1-2 lines of file>
newString: <those same lines>
<next chunk>
```

Split at section boundaries — never mid-paragraph or mid-code-block.

### Translation Rules

- **META: → metadata block**: Convert META: line to visible `---`-delimited metadata block after the document title (see Document Metadata § Finalized Documents). Expand abbreviations, add markdown links for repository/issue, set `Status: Current`. `Author` = the agent's own name (e.g., `opencode:lead-architect`), never the user. Omit `Issue` and `Issue File` lines if not applicable.
- Expand all abbreviations to full words
- Write complete sentences
- Proper markdown headers and structure
- Keep Mermaid diagrams as-is
- `[!]` `[?]` `[+]` → prose sections
- Add context implicit in compressed form
- Result must be readable by someone who never saw the drafts
