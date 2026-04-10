# Software Development with OpenCode

Multi-agent AI development team with orchestrated design-to-delivery workflows. From rough ideas to structured Epics, architecture design, implementation, code review, and documentation — each stage handled by a specialized agent.

---

## Table of Contents

- [Agents](#agents)
  - [Primary Agents](#primary-agents)
  - [Subagents](#subagents)
- [Workflows](#workflows)
  - [Standalone Agents](#standalone-agents)
  - [Product Owner — Epic Refinement](#product-owner--epic-refinement)
  - [Technical Advisor — Solo Design](#technical-advisor--solo-design)
  - [Lead Engineer — Solo Build](#lead-engineer--solo-build)
  - [Technical Advisor — Team Design](#technical-advisor--team-design)
  - [Lead Engineer — Team Build](#lead-engineer--team-build)
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
| **Product Owner** | Refines ideas into structured Epics with stories and acceptance criteria | `claude-sonnet-4.6` |
| **Technical Advisor** | Orchestrates architecture design — design overviews, HLDs, GDDs (via Game Designer for game projects) | `claude-sonnet-4.6` |
| **Lead Engineer** | Implements features solo or orchestrates a dev team for complex builds | `claude-sonnet-4.6` |
| **Technical Writer** | Generates and maintains MkDocs documentation sites | `claude-sonnet-4.6` |
| **Agent Architect** | Designs, writes, and refines agent/subagent definitions (meta-agent) | `claude-opus-4.6` |

### Subagents

Hidden specialists invoked by orchestrators via the Task tool:

| Agent | Role | Model | Invoked by |
|-------|------|-------|------------|
| **Lead Architect** | Design overviews — system scope, component boundaries | `claude-opus-4.6` | Tech Advisor, Product Owner |
| **Sys Architect** | HLDs — what a system does, not how | `claude-sonnet-4.6` | Tech Advisor |
| **Tech Lead** | LLDs, task breakdowns, design reviews | `claude-opus-4.6` | Tech Advisor, Lead Engineer |
| **Backend Dev** | Backend code, APIs, data layers, tests | `claude-sonnet-4.6` | Lead Engineer |
| **Frontend Dev** | Frontend code, UI components, tests | `claude-sonnet-4.6` | Lead Engineer |
| **Devops** | Infrastructure, CI/CD, deployment configs | `claude-sonnet-4.6` | Lead Engineer |
| **Code Reviewer** | Code review — quality, security, correctness | `claude-opus-4.6` | Lead Engineer |

All agents operate in two modes:

- **Solo mode** (default) — the primary agent does all work itself
- **Team mode** (`iterations=N`) — the primary agent delegates to subagents with iterative review rounds

## Workflows

### Standalone Agents

```mermaid
sequenceDiagram
    actor User

    rect rgb(16, 185, 129, 0.1)
    note right of User: Tech Writer
    User->>Tech Writer: Write docs for project
    Tech Writer->>Tech Writer: Scaffold toolchain (uv, mise, mkdocs, Taskfile)
    Tech Writer->>Tech Writer: Write documentation pages
    Tech Writer->>User: Docs site (MkDocs + Material theme)
    end

    rect rgb(139, 92, 246, 0.1)
    note right of User: Agent Architect
    User->>Agent Architect: Design a new agent
    Agent Architect->>User: Agent definition (.md)
    end
```

### Product Owner — Epic Refinement

```mermaid
sequenceDiagram
    actor User
    participant PO as Product Owner
    participant LA as Lead Architect

    rect rgb(245, 158, 11, 0.1)
    note right of User: Epic Refinement
    User->>PO: Rough idea
    PO->>User: Clarifying questions
    User->>PO: Answers
    PO->>LA: Feasibility + story type?
    LA->>PO: DD story or HLD story
    PO->>User: Epic + child stories (.issues/)
    end
```

### Technical Advisor — Solo Design

> For game projects, the Technical Advisor dispatches to the **Game Designer** subagent instead of writing an HLD herself. See [Game Development](README_GAME_DEV.md#workflow) for that workflow.

```mermaid
sequenceDiagram
    actor User
    participant TA as Technical Advisor

    rect rgb(99, 102, 241, 0.1)
    note right of User: Solo Design
    User->>TA: Design request
    TA->>TA: Scan .specs/ and document-templates/
    TA->>TA: Write HLD (.specs/)
    TA->>TA: Create implementation story (.issues/)
    TA->>User: Present HLD + story
    end
```

### Lead Engineer — Solo Build

```mermaid
sequenceDiagram
    actor User
    participant LE as Lead Engineer
    participant Rev as Code Reviewer

    rect rgb(234, 88, 12, 0.1)
    note right of User: Solo Build
    alt Direct request
        User->>LE: Implement feature
    else Handoff from Technical Advisor
        User->>LE: Continue with implementation
        LE->>LE: Read specs from .specs/
    end
    LE->>LE: Write code + tests
    LE->>Rev: Request review
    Rev->>LE: Changes requested
    LE->>LE: Fix issues
    LE->>Rev: Re-review
    Rev->>LE: Approved
    LE->>User: Done
    end
```

### Technical Advisor — Team Design

```mermaid
sequenceDiagram
    actor User
    participant TA as Technical Advisor
    participant LA as Lead Architect
    participant SA as Sys Architect
    participant TL as Tech Lead
    participant Devs as Developers

    rect rgb(99, 102, 241, 0.08)
    note right of User: Design Overview
    User->>TA: Design request
    TA->>LA: Write design overview
    loop Review rounds (configurable limit)
        LA->>TA: Draft ready
        TA->>SA: Review design overview
        TA->>TL: Review design overview
        SA->>TA: Feedback
        TL->>TA: Feedback
        TA->>LA: Apply feedback
    end
    LA->>TA: Finalized
    TA->>User: Design overview complete — ask me to write each HLD
    end

    rect rgb(99, 102, 241, 0.15)
    note right of User: HLD (one at a time, user-initiated)
    User->>TA: Write HLD for component X
    TA->>SA: Write HLD
    loop Review rounds (configurable limit)
        SA->>TA: Draft ready
        TA->>TL: Review HLD
        TA->>Devs: Review HLD (feasibility)
        TL->>TA: Feedback
        Devs->>TA: Feedback
        TA->>SA: Apply feedback
    end
    SA->>TA: Finalized
    TA->>User: HLD complete + implementation story created
    end
```

### Lead Engineer — Team Build

```mermaid
sequenceDiagram
    actor User
    participant LE as Lead Engineer
    participant TL as Tech Lead
    participant Devs as Developers
    participant Rev as Code Reviewer

    rect rgb(234, 88, 12, 0.08)
    note right of User: Task Planning (per story)
    User->>LE: Plan story X
    LE->>TL: Create task breakdown
    loop Review rounds (configurable limit)
        TL->>LE: Task plan
        LE->>Devs: Review feasibility
        Devs->>LE: Feedback
        LE->>TL: Apply feedback
    end
    TL->>LE: Write Tasks
    LE->>User: Present plan for approval
    User->>LE: Approved
    end

    rect rgb(234, 88, 12, 0.15)
    note right of User: Implementation (user chooses scope)
    User->>LE: Implement task X (or tasks X, Y in parallel)
    alt Multiple tasks requested
        LE->>TL: Confirm implementation order
        TL->>LE: Order / parallelism advice
    end
    LE->>Devs: Implement tasks
    Devs->>LE: Code + tests ready
    end

    rect rgb(234, 88, 12, 0.22)
    note right of User: Review (per task or parallel batch)
    LE->>Rev: Review changes
    loop Review rounds (configurable limit)
        Rev->>LE: Changes requested
        LE->>Devs: Apply fixes
        Devs->>LE: Fixes ready
        LE->>Rev: Re-review
    end
    Rev->>LE: Approved
    LE->>User: Done
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

## Commands

| Command | Description | Agent |
|---------|-------------|-------|
| `/design` | Start an architecture design session — design overviews, HLDs | Technical Advisor |
| `/review-design` | Dispatch reviewers to evaluate an existing design document | Technical Advisor |
| `/spike` | Conduct a technical research spike — explore, analyze, report | Technical Advisor |
| `/implement` | Implement a feature from a spec, issue, or direct instructions | Lead Engineer |
| `/fix` | Investigate and fix a bug from a description or issue reference | Lead Engineer |
| `/review` | Trigger a code review on specific files or recent changes | Lead Engineer |
| `/tdd` | Implement a feature using Test-Driven Development | Lead Engineer |
| `/pr` | Create a pull request with auto-generated description | Lead Engineer |
| `/refine` | Refine a rough idea into a structured Epic with stories and acceptance criteria | Product Owner |
| `/backlog` | Review and prioritize the backlog — scan issues, suggest next actions | Product Owner |
| `/sync-issues` | Sync issues between CVS platform and local `.issues/` directory | Product Owner |
| `/docs` | Generate or update MkDocs documentation for the current project | Technical Writer |
| `/changelog` | Generate or update CHANGELOG.md from git history and resolved issues | Technical Writer |
| `/new-agent` | Design a new OpenCode agent — discovery, design, prompt crafting | Agent Architect |
| `/refine-agent` | Analyze and refine an existing agent — improve prompt, permissions, design | Agent Architect |
| `/new-skill` | Design a new OpenCode skill — domain-specific instructions for agents | Agent Architect |
