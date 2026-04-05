# Software Development with OpenCode

Multi-agent AI development team with orchestrated design-to-delivery workflows. From rough ideas to structured Epics, architecture design, implementation, code review, and documentation — each stage handled by a specialized agent.

---

## Table of Contents

- [Agents](#agents)
  - [Primary Agents](#primary-agents)
  - [Subagents](#subagents)
- [Workflows](#workflows)
  - [Standalone Agents](#standalone-agents)
  - [Hermes — Epic Refinement](#hermes--epic-refinement)
  - [Athena — Solo Design](#athena--solo-design)
  - [Hephaestus — Solo Build](#hephaestus--solo-build)
  - [Athena — Team Design](#athena--team-design)
  - [Hephaestus — Team Build](#hephaestus--team-build)
- [Skills](#skills)
  - [Developer Skills](#developer-skills)
  - [Workflow Skills](#workflow-skills)
- [Custom Tools](#custom-tools)
- [Commands](#commands)

---

## Agents

### Primary Agents

User-facing agents, switchable with <kbd>Tab</kbd>:

| Agent | Role | Model |
|-------|------|-------|
| **Hermes** — Product Owner | Refines ideas into structured Epics with stories and acceptance criteria | `claude-sonnet-4.6` |
| **Athena** — Technical Advisor | Orchestrates architecture design — design overviews, HLDs, GDDs (via Freya for game projects) | `claude-sonnet-4.6` |
| **Hephaestus** — Solution Engineer | Implements features solo or orchestrates a dev team for complex builds | `claude-sonnet-4.6` |
| **Clio** — Technical Writer | Generates and maintains MkDocs documentation sites | `claude-sonnet-4.6` |
| **Gea** — Agent Architect | Designs, writes, and refines agent/subagent definitions (meta-agent) | `claude-opus-4.6` |

### Subagents

Hidden specialists invoked by orchestrators via the Task tool:

| Agent | Role | Model | Invoked by |
|-------|------|-------|------------|
| **Daedalus** (Lead Architect) | Design overviews — system scope, component boundaries | `claude-opus-4.6` | Athena, Hermes |
| **Archimedes** (Architect) | HLDs — what a system does, not how | `claude-sonnet-4.6` | Athena |
| **Odysseus** (Tech Lead) | LLDs, task breakdowns, design reviews | `claude-opus-4.6` | Athena, Hephaestus |
| **Hector** (Developer Backend) | Backend code, APIs, data layers, tests | `claude-sonnet-4.6` | Hephaestus |
| **Orpheus** (Developer Frontend) | Frontend code, UI components, tests | `claude-sonnet-4.6` | Hephaestus |
| **Atlas** (DevOps) | Infrastructure, CI/CD, deployment configs | `claude-sonnet-4.6` | Hephaestus |
| **Argus** (Reviewer) | Code review — quality, security, correctness | `claude-opus-4.6` | Hephaestus |

All agents operate in two modes:

- **Solo mode** (default) — the primary agent does all work itself
- **Team mode** (`iterations=N`) — the primary agent delegates to subagents with iterative review rounds

## Workflows

### Standalone Agents

```mermaid
sequenceDiagram
    actor User

    rect rgb(16, 185, 129, 0.1)
    note right of User: Clio (Technical Writer)
    User->>Clio: Write docs for project
    Clio->>Clio: Scaffold toolchain (uv, mise, mkdocs, Taskfile)
    Clio->>Clio: Write documentation pages
    Clio->>User: Docs site (MkDocs + Material theme)
    end

    rect rgb(139, 92, 246, 0.1)
    note right of User: Gea (Agent Architect)
    User->>Gea: Design a new agent
    Gea->>User: Agent definition (.md)
    end
```

### Hermes — Epic Refinement

```mermaid
sequenceDiagram
    actor User
    participant H as Hermes
    participant LA as Lead Architect

    rect rgb(245, 158, 11, 0.1)
    note right of User: Epic Refinement
    User->>H: Rough idea
    H->>User: Clarifying questions
    User->>H: Answers
    H->>LA: Feasibility + story type?
    LA->>H: DD story or HLD story
    H->>User: Epic + child stories (.issues/)
    end
```

### Athena — Solo Design

> For game projects, Athena dispatches to **Freya** (Game Designer) instead of writing an HLD herself. See [Game Development](README_GAME_DEV.md#workflow) for that workflow.

```mermaid
sequenceDiagram
    actor User
    participant A as Athena

    rect rgb(99, 102, 241, 0.1)
    note right of User: Solo Design
    User->>A: Design request
    A->>A: Scan .specs/ and document-templates/
    A->>A: Write HLD (.specs/)
    A->>A: Create implementation story (.issues/)
    A->>User: Present HLD + story
    end
```

### Hephaestus — Solo Build

```mermaid
sequenceDiagram
    actor User
    participant H as Hephaestus
    participant Rev as Reviewer

    rect rgb(234, 88, 12, 0.1)
    note right of User: Solo Build
    alt Direct request
        User->>H: Implement feature
    else Handoff from Athena
        User->>H: Continue with implementation
        H->>H: Read specs from .specs/
    end
    H->>H: Write code + tests
    H->>Rev: Request review
    Rev->>H: Changes requested
    H->>H: Fix issues
    H->>Rev: Re-review
    Rev->>H: Approved
    H->>User: Done
    end
```

### Athena — Team Design

```mermaid
sequenceDiagram
    actor User
    participant A as Athena
    participant LA as Lead Architect
    participant Arch as Architect
    participant TL as Tech Lead
    participant Devs as Developers

    rect rgb(99, 102, 241, 0.08)
    note right of User: Design Overview
    User->>A: Design request
    A->>LA: Write design overview
    loop Review rounds (configurable limit)
        LA->>A: Draft ready
        A->>Arch: Review design overview
        A->>TL: Review design overview
        Arch->>A: Feedback
        TL->>A: Feedback
        A->>LA: Apply feedback
    end
    LA->>A: Finalized
    A->>User: Design overview complete — ask me to write each HLD
    end

    rect rgb(99, 102, 241, 0.15)
    note right of User: HLD (one at a time, user-initiated)
    User->>A: Write HLD for component X
    A->>Arch: Write HLD
    loop Review rounds (configurable limit)
        Arch->>A: Draft ready
        A->>TL: Review HLD
        A->>Devs: Review HLD (feasibility)
        TL->>A: Feedback
        Devs->>A: Feedback
        A->>Arch: Apply feedback
    end
    Arch->>A: Finalized
    A->>User: HLD complete + implementation story created
    end
```

### Hephaestus — Team Build

```mermaid
sequenceDiagram
    actor User
    participant H as Hephaestus
    participant TL as Tech Lead
    participant Devs as Developers
    participant Rev as Reviewer

    rect rgb(234, 88, 12, 0.08)
    note right of User: Task Planning (per story)
    User->>H: Plan story X
    H->>TL: Create task breakdown
    loop Review rounds (configurable limit)
        TL->>H: Task plan
        H->>Devs: Review feasibility
        Devs->>H: Feedback
        H->>TL: Apply feedback
    end
    TL->>H: Write Tasks
    H->>User: Present plan for approval
    User->>H: Approved
    end

    rect rgb(234, 88, 12, 0.15)
    note right of User: Implementation (user chooses scope)
    User->>H: Implement task X (or tasks X, Y in parallel)
    alt Multiple tasks requested
        H->>TL: Confirm implementation order
        TL->>H: Order / parallelism advice
    end
    H->>Devs: Implement tasks
    Devs->>H: Code + tests ready
    end

    rect rgb(234, 88, 12, 0.22)
    note right of User: Review (per task or parallel batch)
    H->>Rev: Review changes
    loop Review rounds (configurable limit)
        Rev->>H: Changes requested
        H->>Devs: Apply fixes
        Devs->>H: Fixes ready
        H->>Rev: Re-review
    end
    Rev->>H: Approved
    H->>User: Done
    end
```

## Skills

### Developer Skills

| Skill | Scope |
|-------|-------|
| **developer-backend** | C/C++, C#, Java, Go, Python, Rust, Zig, Elixir, Lua, Swift, JS/TS, Shell/Bash, Fish, PowerShell, Markdown, YAML, JSON |
| **developer-frontend** | HTML/CSS, JavaScript, TypeScript, Angular, React, Vue, Svelte |
| **developer-devops** | Ansible, Terraform, OpenTofu, Shell/Bash, PowerShell, Fish |

### Workflow Skills

| Skill | Purpose |
|-------|---------|
| **clean-code** | SOLID principles, design patterns, readability standards, quality tooling (.editorconfig, jscpd, Semgrep, MegaLinter, pre-commit, commitlint) |
| **tdd** | Test-Driven Development — Red-Green-Refactor cycle |
| **issue-tracking** | Local `.issues/` conventions — file naming, YAML frontmatter, ID management |
| **issue-tracking-cvs** | CVS-backed issue tracking — same conventions via GitHub/GitLab/Forgejo API |
| **cvs-mode** | CVS integration — GitHub/GitLab/Forgejo auto-detection, MCP-first with CLI fallback |
| **mcp-tools** | External MCP tool reference — memory, docs, browser, code indexing, CVS, web crawl |

## Custom Tools

TypeScript tools extending agent capabilities (built with `@opencode-ai/plugin`):

| Tool | Purpose |
|------|---------|
| **spec-create** | Creates `.specs/<type>-<id>-<slug>-v<ver>.md` with auto-incrementing ID and versioning. Types: `hld`, `lld`, `task`. |
| **issue-create** | Creates `.issues/<id>-<type>-<slug>.md` with auto-incrementing ID. Types: `epic`, `story`, `task`, `spike`. |
| **draft-create** | Creates `.ai.tmp/<slug>-<hash>.md` for ephemeral working drafts. |
| **enable-cvs-labels** | Creates labels on GitHub/GitLab/Forgejo. Presets: types, priority, status, scope. Auto-detects platform from git remote. |

## Commands

| Command | Description | Agent |
|---------|-------------|-------|
| `/design` | Start an architecture design session — design overviews, HLDs | Athena |
| `/review-design` | Dispatch reviewers to evaluate an existing design document | Athena |
| `/spike` | Conduct a technical research spike — explore, analyze, report | Athena |
| `/implement` | Implement a feature from a spec, issue, or direct instructions | Hephaestus |
| `/fix` | Investigate and fix a bug from a description or issue reference | Hephaestus |
| `/review` | Trigger a code review on specific files or recent changes | Hephaestus |
| `/tdd` | Implement a feature using Test-Driven Development | Hephaestus |
| `/pr` | Create a pull request with auto-generated description | Hephaestus |
| `/refine` | Refine a rough idea into a structured Epic with stories and acceptance criteria | Hermes |
| `/backlog` | Review and prioritize the backlog — scan issues, suggest next actions | Hermes |
| `/sync-issues` | Sync issues between CVS platform and local `.issues/` directory | Hermes |
| `/docs` | Generate or update MkDocs documentation for the current project | Clio |
| `/changelog` | Generate or update CHANGELOG.md from git history and resolved issues | Clio |
| `/new-agent` | Design a new OpenCode agent — discovery, design, prompt crafting | Gea |
| `/refine-agent` | Analyze and refine an existing agent — improve prompt, permissions, design | Gea |
| `/new-skill` | Design a new OpenCode skill — domain-specific instructions for agents | Gea |
