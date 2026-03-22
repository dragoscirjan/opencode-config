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

In `.specs.tmp/` content — drop articles/filler, imperative mood, abbreviate: `req` `impl` `cfg` `auth` `svc` `db` `fn` `dep` `env` `err` `msg` `resp` `ctx`. Use `file:line` refs. Keywords over sentences. Mermaid OK.

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

- Expand all abbreviations to full words
- Write complete sentences
- Proper markdown headers and structure
- Keep Mermaid diagrams as-is
- `[!]` `[?]` `[+]` → prose sections
- Add context implicit in compressed form
- Result must be readable by someone who never saw the drafts
