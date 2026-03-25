<p align="center">
  <img src="https://github.com/anomalyco/opencode/raw/dev/packages/console/app/src/asset/logo-ornate-dark.svg" alt="opencode" width="200" />
</p>

<h1 align="center">opencode-config</h1>

<p align="center">
  My personal <a href="https://opencode.ai">opencode</a> configuration — a multi-agent AI development team with orchestrated design-to-delivery workflows, domain-specific skills, and curated MCP integrations.
</p>

---

## Table of Contents

- [What's Inside](#whats-inside)
- [Agents](#agents)
  - [Primary Agents](#primary-agents)
  - [Subagents](#subagents)
- [Workflows](#workflows)
  - [Standalone Agents](#standalone-agents)
  - [Product Owner — Epic Refinement](#product-owner--epic-refinement)
  - [Athena — Solo Design](#athena--solo-design)
  - [Hephaestus — Solo Build](#hephaestus--solo-build)
  - [Athena — Team Design](#athena--team-design)
  - [Hephaestus — Team Build](#hephaestus--team-build)
- [Skills](#skills)
  - [Language Skills](#language-skills)
  - [Workflow Skills](#workflow-skills)
- [Commands](#commands)
- [MCP Servers](#mcp-servers)
- [Plugin](#plugin)
- [Setup](#setup)
- [License](#license)

---

## What's Inside

```
.
├── opencode.json        # Main config (MCP servers, plugins)
├── dcp.jsonc            # Dynamic Context Pruning settings
├── agents/              # Agent definitions (role, model, permissions, prompts)
├── commands/            # Slash commands (/design, /implement, /review, …)
└── skills/              # Domain-specific instruction packs
```

Projects that use this config also produce:

```
<project>/
├── .issues/             # Local issue tracking (Epic, Story, Task, Spike)
├── .specs/              # Finalized design documents (HLDs, LLDs, task plans)
└── .ai.tmp/             # Ephemeral AI drafts (compressed notation, disposable)
```

## Agents

### Primary Agents

User-facing agents, switchable with <kbd>Tab</kbd>:

| Agent | Role | Model |
|-------|------|-------|
| **Product Owner** | Refines ideas into structured Epics with stories and acceptance criteria | `claude-sonnet-4.6` |
| **Athena** | Orchestrates architecture design — design overviews, HLDs, LLDs | `claude-sonnet-4.6` |
| **Hephaestus** | Implements features solo or orchestrates a dev team for complex builds | `claude-sonnet-4.6` |
| **Technical Writer** | Generates and maintains MkDocs documentation sites | `claude-sonnet-4.6` |
| **Agent Architect** | Designs, writes, and refines agent/subagent definitions (meta-agent) | `claude-opus-4.6` |

### Subagents

Hidden specialists invoked by orchestrators via the Task tool:

| Agent | Role | Model | Invoked by |
|-------|------|-------|------------|
| **Lead Architect** | Design overviews — system scope, component boundaries | `claude-opus-4.6` | Athena, Product Owner |
| **Architect** | HLDs — what a system does, not how | `claude-sonnet-4.6` | Athena |
| **Tech Lead** | LLDs, task breakdowns, design reviews | `claude-opus-4.6` | Athena, Hephaestus |
| **Developer Backend** | Backend code, APIs, data layers, tests | `claude-sonnet-4.6` | Hephaestus, Athena |
| **Developer Frontend** | Frontend code, UI components, tests | `claude-sonnet-4.6` | Hephaestus, Athena |
| **DevOps** | Infrastructure, CI/CD, deployment configs | `claude-sonnet-4.6` | Hephaestus, Athena |
| **Reviewer** | Code review — quality, security, correctness | `claude-opus-4.6` | Hephaestus |

## Workflows

### Standalone Agents

```mermaid
sequenceDiagram
    actor User

    rect rgb(16, 185, 129, 0.1)
    note right of User: Technical Writer
    User->>Technical Writer: Write docs for project
    Technical Writer->>User: Docs site (MkDocs)
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
    PO->>User: Epic + story (DD or HLD per LA)
    end
```

### Athena — Solo Design

```mermaid
sequenceDiagram
    actor User
    participant A as Athena

    rect rgb(99, 102, 241, 0.1)
    note right of User: Solo Design
    User->>A: Design request
    A->>A: Write HLD
    A->>A: Write LLD
    A->>User: Present plan in chat
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
    LA->>A: Finalized + HLD Stories
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
    Arch->>A: Finalized + LLD Story
    A->>User: HLD complete — ask me to write next HLD or proceed to LLD
    end

    rect rgb(99, 102, 241, 0.22)
    note right of User: LLD (one at a time, user-initiated)
    User->>A: Write LLD for component X
    A->>TL: Write LLD
    loop Review rounds (configurable limit)
        TL->>A: Draft ready
        A->>Devs: Review LLD (feasibility)
        Devs->>A: Feedback
        A->>TL: Apply feedback
    end
    TL->>A: Finalized
    A->>User: LLD complete
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

### Language Skills

Loadable instruction packs that teach agents language-specific conventions and best practices:

Bash, C++, Elixir, Go, Java, JavaScript, Lua, Python, Rust, TypeScript, Zig

### Workflow Skills

| Skill | Purpose |
|-------|---------|
| **clean-code** | SOLID principles, design patterns, readability standards |
| **tdd** | Test-Driven Development — Red-Green-Refactor cycle with wire protocol signals |
| **issue-tracking** | Local `.issues/` conventions — file naming, YAML frontmatter, ID management |
| **cvs-mode** | CVS integration — GitHub/GitLab/Forgejo auto-detection, MCP-first with CLI fallback |
| **wire-protocol** | Base communication DSL for subagents — signals, compressed output, no hallucination |
| **wire-design** | Design document extension — compressed notation for reviews and drafts |
| **spec-naming** | Path authority for orchestrators — draft/final naming, directory conventions |
| **mcp-tools** | External MCP tool reference |

## Commands

| Command | Description | Agent |
|---------|-------------|-------|
| `/design` | Start an architecture design session — design overviews, HLDs, LLDs | Athena |
| `/review-design` | Dispatch reviewers to evaluate an existing design document | Athena |
| `/spike` | Conduct a technical research spike — explore, analyze, report | Athena |
| `/implement` | Implement a feature from a spec, issue, or direct instructions | Hephaestus |
| `/fix` | Investigate and fix a bug from a description or issue reference | Hephaestus |
| `/review` | Trigger a code review on specific files or recent changes | Hephaestus |
| `/tdd` | Implement a feature using Test-Driven Development | Hephaestus |
| `/pr` | Create a pull request with auto-generated description | Hephaestus |
| `/refine` | Refine a rough idea into a structured Epic with stories and acceptance criteria | Product Owner |
| `/backlog` | Review and prioritize the backlog — scan issues, suggest next actions | Product Owner |
| `/sync-issues` | Sync issues between CVS platform and local `.issues/` directory | Product Owner |
| `/docs` | Generate or update MkDocs documentation for the current project | Technical Writer |
| `/changelog` | Generate or update CHANGELOG.md from git history and resolved issues | Technical Writer |
| `/new-agent` | Design a new OpenCode agent — discovery, design, prompt crafting | Agent Architect |
| `/refine-agent` | Analyze and refine an existing agent — improve prompt, permissions, design | Agent Architect |
| `/new-skill` | Design a new OpenCode skill — domain-specific instructions for agents | Agent Architect |

## MCP Servers

Pre-configured integrations (enable/disable in `opencode.json`):

| Server | Category | Default |
|--------|----------|---------|
| **Playwright** | Browser automation | Enabled |
| **Puppeteer** | Browser automation | Disabled |
| **Context7** | Documentation lookup | Enabled |
| **GitHub Grep** | Code search across GitHub | Enabled |
| **JSON Memory** | Persistent knowledge graph | Enabled |
| **Sequential Thinking** | Structured reasoning | Enabled |
| **LibSQL Memory** | SQLite-based memory | Disabled |
| **GitHub MCP** | GitHub repos & issues | Disabled |
| **GitLab MCP** | GitLab integration | Disabled |
| **Forgejo MCP** | Forgejo integration | Disabled |
| **CocoIndex** | Code indexing | Disabled |
| **FastCode** | Code indexing | Disabled |
| **Tavily** | Web crawling | Disabled |
| **Firecrawl** | Web crawling | Disabled |

## Plugin

Uses [`@tarquinen/opencode-dcp`](https://www.npmjs.com/package/@tarquinen/opencode-dcp) for Dynamic Context Pruning — automatic context management to keep conversations efficient.

## Setup

1. **Install [opencode](https://opencode.ai)**

2. **Clone this repo** into your opencode config directory:
   ```bash
   git clone git@github.com:dragoscirjan/opencode-config.git ~/.config/opencode
   ```

3. **Install dependencies:**
   ```bash
   cd ~/.config/opencode && bun install
   ```

4. **Set environment variables** for any MCP servers you want to enable:
   ```bash
   # Browser automation
   export BROWSER_PATH="/usr/bin/chromium"

   # Memory (auto-configured per project)
   export PROJECT_PATH="/path/to/your/project"

   # Optional — enable as needed
   export GITHUB_TOKEN="..."
   export TAVILY_API_KEY="..."
   export FIRECRAWL_API_KEY="..."
   ```

5. **Enable/disable MCP servers** by toggling `"enabled"` in `opencode.json`.

## License

[MIT](LICENSE)
