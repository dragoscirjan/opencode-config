# Epic: CVS Integration

> **ID**: 00001  
> **Type**: Epic  
> **Status**: Done  
> **Source**: [Issue #4](https://github.com/dragoscirjan/opencode-config/issues/4)  
> **Labels**: `level/epic`, `enhancement`

## Scope

Add GitHub/GitLab/Forgejo integration as a cross-cutting concern across the entire OpenCode agent ecosystem. This introduces a new Product Owner agent, CVS-aware skills, issue tracking conventions, and modifications to all 11 existing agents.

### Goals

- **Product Owner agent** — interactive primary agent that helps humans refine rough ideas into structured Epics with scope, acceptance criteria, and story breakdowns
- **CVS integration skills** — shared skills enabling all agents to detect CVS providers, post comments, manage issues, and respect identity/attribution conventions
- **Issue tracking conventions** — local `.issues/` file structure for FS-mode and mapping to CVS issues
- **Directory migration** — rename `.specs.tmp/` to `.ai.tmp/` across all skills and agents
- **Agent CVS awareness** — update all existing agents with CVS operation capabilities, identity attribution, and dual-mode (CVS/FS) support

### Non-Goals

- Building custom MCP servers (we use existing `cvs_*` MCP tools + CLI fallbacks)
- Implementing CI/CD pipeline automation (future epic)
- Creating a web UI for issue management

---

## Stories

### Story 1: Product Owner Agent

> **Priority**: HIGH — implement first (no dependencies)  
> **Type**: Feature

Create a new primary agent (`product-owner.md`) that helps humans refine rough ideas into structured work items.

**Acceptance Criteria:**

- Agent is user-facing (primary mode) and interactive
- Guides user through a structured refinement process: problem → scope → acceptance criteria → story breakdown
- Outputs structured Epic documents following the work item hierarchy (Epic → Story → Task → Spike)
- Can consult @architect for technical feasibility via Task tool
- Works in FS-mode (writes to `.issues/` and `.specs/`) — CVS mode added in Story 5
- Understands the label taxonomy: `level/epic`, `level/story`, `level/task`, `level/spike`

**Tasks:**

| ID | Description | Files |
|----|-------------|-------|
| T1.1 | Design and write product-owner agent | `agents/product-owner.md` |

**Design Decisions:**

- **Model**: claude-sonnet-4.6 — conversational task, doesn't need opus-level reasoning
- **Temperature**: 0.4 — slightly creative for brainstorming but structured output
- **Steps**: 30 — interactive refinement sessions are multi-turn but bounded
- **Permissions**: edit (writes issue/spec files), task (consults @architect), skill (loads issue-tracking)
- **No bash** — the PO agent is an advisor/planner, not an implementer
- **Color**: `#F59E0B` (amber — warm, approachable, distinct from existing agents)

---

### Story 2: Directory Migration (.specs.tmp/ → .ai.tmp/)

> **Priority**: HIGH — prerequisite for Stories 3-5  
> **Type**: Refactor

Rename all references from `.specs.tmp/` to `.ai.tmp/` across the codebase. The `.ai.tmp/` directory serves as the ephemeral workspace for all agent-generated drafts, reviews, and intermediate artifacts.

**Acceptance Criteria:**

- All skills referencing `.specs.tmp/` updated to `.ai.tmp/`
- All agents referencing `.specs.tmp/` updated to `.ai.tmp/`
- Wire protocol examples updated
- No remaining references to `.specs.tmp/` anywhere in the config

**Tasks:**

| ID | Description | Files |
|----|-------------|-------|
| T2.1 | Update wire-protocol skill | `skills/wire-protocol/SKILL.md` |
| T2.2 | Update wire-design skill | `skills/wire-design/SKILL.md` |
| T2.3 | Update spec-naming skill | `skills/spec-naming/SKILL.md` |
| T2.4 | Update athena agent | `agents/athena.md` |
| T2.5 | Update hephaestus agent | `agents/hephaestus.md` |

**Notes:** Subagents receive paths from orchestrators and never reference `.specs.tmp/` directly, so only skills and orchestrators need updating.

---

### Story 3: Issue Tracking Conventions

> **Priority**: HIGH — prerequisite for Stories 4-5  
> **Type**: Feature

Define the local `.issues/` file structure and create a skill that teaches agents how to read/write issue files.

**Acceptance Criteria:**

- New `issue-tracking` skill defines the `.issues/` file format
- File naming convention: `<5-digit-id>-<type>-<title-kebab>.md`
- YAML frontmatter schema: type, status, labels, parent, assignee, priority
- Comments section format defined
- `spec-naming` skill extended with `.issues/` path conventions and ID assignment
- Work item hierarchy documented: Epic → Story → Task → Spike

**Tasks:**

| ID | Description | Files |
|----|-------------|-------|
| T3.1 | Create issue-tracking skill | `skills/issue-tracking/SKILL.md` |
| T3.2 | Extend spec-naming skill for .issues/ | `skills/spec-naming/SKILL.md` |

**Design Decisions:**

- `.issues/` is flat (no subdirectories) — simplicity over hierarchy
- Types map to labels: `level/epic`, `level/story`, `level/task`, `level/spike`
- Status values: `open`, `in-progress`, `review`, `done`, `closed`, `blocked`
- Parent field links to parent issue ID (e.g., story → epic)
- Comments use a simple `## Comments` section with timestamped entries

---

### Story 4: CVS Integration Skills

> **Priority**: HIGH — prerequisite for Story 5  
> **Type**: Feature

Create skills that enable agents to detect CVS providers, select operating mode (CVS vs FS), manage identity/attribution, and understand their CVS operation permissions.

**Acceptance Criteria:**

- New `cvs-mode` skill covers: provider detection, mode selection, identity/attribution, autonomy levels
- Provider auto-detection from `.git/config` remote URL patterns
- Mode selection logic: CVS mode triggered by issue reference, FS mode is default
- Identity/attribution: visible `opencode:agent=<agent-name>` block between `---` rules
- Autonomy levels defined: interactive (default) vs silent
- Agent operation matrix documented (who can read/write/create what)
- `mcp-tools` skill updated with expanded `cvs_*` section
- CLI fallback commands documented: `gh`, `glab`, `forgejo-cli`

**Tasks:**

| ID | Description | Files |
|----|-------------|-------|
| T4.1 | Create cvs-mode skill | `skills/cvs-mode/SKILL.md` |
| T4.2 | Update mcp-tools skill with expanded CVS section | `skills/mcp-tools/SKILL.md` |

**Design Decisions:**

- CVS as communication channel is agent→human only (issue comments for status/failures)
- Inter-agent communication stays on the wire protocol (FS-based signals and paths)
- Destructive CI/CD operations always require human approval regardless of autonomy level
- Provider detection: GitHub (`github.com`), GitLab (`gitlab.com` or self-hosted), Forgejo (detected via API probe)

---

### Story 5: Agent CVS Awareness

> **Priority**: HIGH — depends on Stories 2, 3, 4  
> **Type**: Feature

Update all existing agents to be CVS-aware: load CVS skills, post failure comments, include identity attribution, and support dual-mode operation.

**Acceptance Criteria:**

- All agents include identity/attribution in CVS-mode output
- Orchestrators (athena, hephaestus) detect CVS mode and can post status comments
- Failure reports posted as issue comments when in CVS mode
- Product Owner agent gains CVS mode for creating issues directly
- Agent operation matrix enforced via skill instructions (not permissions — skills guide behavior)
- Reviewer gains PR read access awareness
- DevOps gains CI/CD permission model awareness

**Tasks:**

| ID | Description | Files |
|----|-------------|-------|
| T5.1 | Update athena (CVS mode detection, comment posting) | `agents/athena.md` |
| T5.2 | Update hephaestus (CVS mode detection, comment posting) | `agents/hephaestus.md` |
| T5.3 | Update architect (identity attribution, CVS awareness) | `agents/architect.md` |
| T5.4 | Update lead-architect (identity attribution, CVS awareness) | `agents/lead-architect.md` |
| T5.5 | Update tech-lead (identity attribution, CVS awareness) | `agents/tech-lead.md` |
| T5.6 | Update developer-backend (identity attribution, failure comments) | `agents/developer-backend.md` |
| T5.7 | Update developer-frontend (identity attribution, failure comments) | `agents/developer-frontend.md` |
| T5.8 | Update devops (identity attribution, CI/CD permission model) | `agents/devops.md` |
| T5.9 | Update reviewer (identity attribution, PR read awareness) | `agents/reviewer.md` |
| T5.10 | Update technical-writer (identity attribution, CVS awareness) | `agents/technical-writer.md` |
| T5.11 | Update product-owner (CVS mode for issue creation) | `agents/product-owner.md` |
| T5.12 | Update agent-architect (CVS awareness for new agent design) | `agents/agent-architect.md` |

**Notes:** CVS awareness is additive — all existing functionality is preserved. Agents gain new capabilities without losing current behavior. The `cvs-mode` skill provides behavioral guidance; we don't change tool permissions (agents already have the MCP tools available when enabled).

---

## Implementation Order

```
Story 1 (Product Owner) ─────────────────────────────────────────────→ ✅ Done
Story 2 (.ai.tmp/ Migration) ──→ Story 3 (Issue Tracking) ──┐        ✅ Done
                                 Story 4 (CVS Skills) ───────┤        ✅ Done
                                                              └──→ Story 5 (Agent CVS Awareness) ✅ Done
```

1. **Story 1** — ✅ Implemented: `agents/product-owner.md`
2. **Story 2** — ✅ Migrated all `.specs.tmp/` → `.ai.tmp/` in 6 files
3. **Story 3** — ✅ Created: `skills/issue-tracking/SKILL.md` (T3.2 deferred — `.issues/` is independent from `spec-naming`)
4. **Story 4** — ✅ Created: `skills/cvs-mode/SKILL.md`, updated `skills/mcp-tools/SKILL.md`
5. **Story 5** — ✅ Updated all 12 agents with CVS awareness sections

---

## Key Design Principles

1. **Additive, not breaking** — CVS integration adds capabilities without changing existing FS-mode behavior
2. **Skills over permissions** — behavioral guidance lives in skills, not in permission YAML
3. **FS first, CVS optional** — FS mode is always the default/fallback
4. **Wire protocol is sacred** — inter-agent communication stays on wire protocol; CVS is agent→human only
5. **Identity is transparent** — HTML comments mark LLM-generated content; absence means human
6. **Autonomy is conservative** — interactive mode by default; silent mode is opt-in; destructive ops always need approval

---

## Open Questions

- Should the Product Owner be able to create GitHub issues directly, or always go through `.issues/` first?
- How do we handle issue ID conflicts between local `.issues/` and CVS issue numbers?
- Should `spec-naming` be renamed to something broader (e.g., `path-authority`) now that it covers `.issues/` too?
