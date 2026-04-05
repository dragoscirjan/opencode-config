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
- [Domains](#domains)
- [Agents](#agents)
- [MCP Servers](#mcp-servers)
- [Plugin](#plugin)
- [Testing](#testing)
- [Scripts](#scripts)
- [Setup](#setup)
- [License](#license)

---

## What's Inside

```
.
├── opencode.json          # Main config (MCP servers, plugins)
├── dcp.jsonc              # Dynamic Context Pruning settings
├── AGENTS.md              # Global rules injected into all agents
├── agents/                # Agent definitions (16 agents: 6 primary + 10 subagents)
├── agent-templates/       # Reusable prompt templates (primary.md, subagent.md)
├── commands/              # Slash commands (/design, /implement, /review, /godogen, …)
├── document-templates/    # Templates for HLDs, LLDs, GDDs, epics, stories
├── skills/                # Domain-specific instruction packs (17 skills)
├── tools/                 # Custom TypeScript tools (11 tools)
├── scripts/               # Utility scripts (model switching)
└── tests/                 # Agent integration tests (Taskfile-based)
```

Projects that use this config also produce:

```
<project>/
├── .issues/             # Local issue tracking (Epic, Story, Task, Spike)
├── .specs/              # Finalized design documents (HLDs, LLDs, task plans)
└── .ai.tmp/             # Ephemeral AI drafts (disposable working files)
```

## Domains

This configuration covers two specialized domains, each with its own agents, skills, tools, and workflows:

| Domain | Agents | Skills | Tools | Commands | Docs |
|--------|--------|--------|-------|----------|------|
| **[Software Development](README_DEV.md)** | 5 primary + 7 subagents | 9 | 4 | 16 | Design-to-delivery workflows for any software project |
| **[Game Development](README_GAME_DEV.md)** | 1 primary + 3 subagents | 7 | 7 | 1 | Autonomous Godot 4 game generation from natural language |

### Software Development

Inari (Product Owner) refines ideas into Epics. Amaterasu (Technical Advisor) designs architecture via HLDs. Hephaestus (Solution Engineer) implements features with optional team delegation. Benzaiten (Technical Writer) generates docs. Tsukuyomi (Agent Architect) designs new agents.

All agents support **solo mode** (agent does all work) and **team mode** (delegates to specialized subagents with iterative review rounds).

See **[README_DEV.md](README_DEV.md)** for full agent descriptions, workflow diagrams, skills, tools, and commands.

### Game Development

Same front door: Inari refines game ideas into Epics. Amaterasu designs games via GDDs (Game Design Documents), authored by Freya (Game Designer subagent). Odin (Game Generator) builds the game: visual target, architecture, asset generation, task execution, visual QA, and delivery. Mimir handles Godot API lookup. Heimdall handles visual QA.

See **[README_GAME_DEV.md](README_GAME_DEV.md)** for the pipeline, agents, skills, tools, and platform support.

## Agents

| Agent | Domain | Role | Model |
|-------|--------|------|-------|
| **Inari** | Both | Product Owner — Epics, stories, acceptance criteria | `claude-sonnet-4.6` |
| **Amaterasu** | Both | Technical Advisor — design overviews, HLDs, GDDs | `claude-sonnet-4.6` |
| **Hephaestus** | Software | Solution Engineer — LLDs, implementation, team orchestration | `claude-sonnet-4.6` |
| **Benzaiten** | Software | Technical Writer — MkDocs documentation | `claude-sonnet-4.6` |
| **Tsukuyomi** | Meta | Agent Architect — designs agent/subagent definitions | `claude-opus-4.6` |
| **Odin** | Game | Game Generator — full Godot 4 pipeline from GDD to build | `claude-opus-4.6` |

<details>
<summary>10 Subagents (hidden, invoked by orchestrators)</summary>

| Agent | Domain | Role | Model | Invoked by |
|-------|--------|------|-------|------------|
| **Daedalus** (Lead Architect) | Both | Design overviews, scope review | `claude-opus-4.6` | Amaterasu, Inari |
| **Archimedes** (Architect) | Software | HLDs — what, not how | `claude-sonnet-4.6` | Amaterasu |
| **Freya** (Game Designer) | Game | GDDs — game vision, mechanics, art direction | `claude-sonnet-4.6` | Amaterasu |
| **Odysseus** (Tech Lead) | Shared | LLDs, task breakdowns, design reviews | `claude-opus-4.6` | Amaterasu, Hephaestus, Odin |
| **Hector** (Developer Backend) | Shared | Backend code, APIs, data layers, tests | `claude-sonnet-4.6` | Hephaestus, Odin |
| **Orpheus** (Developer Frontend) | Shared | Frontend code, UI components, tests | `claude-sonnet-4.6` | Hephaestus, Odin |
| **Atlas** (DevOps) | Shared | Infrastructure, CI/CD, deployment | `claude-sonnet-4.6` | Hephaestus, Odin |
| **Argus** (Reviewer) | Shared | Code review — quality, security, correctness | `claude-opus-4.6` | Hephaestus, Odin |
| **Mimir** | Game | Godot API lookup (850+ classes) | `claude-sonnet-4.6` | Odin |
| **Heimdall** | Game | Visual QA — screenshot analysis, defect detection | `claude-sonnet-4.6` | Odin |

</details>

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
| **GitHub MCP** | GitHub repos & issues | Enabled |
| **GitLab MCP** | GitLab integration | Disabled |
| **Forgejo MCP** | Forgejo integration | Disabled |
| **CocoIndex** | Code indexing | Disabled |
| **FastCode** | Code indexing | Disabled |
| **Tavily** | Web crawling | Disabled |
| **Firecrawl** | Web crawling | Disabled |

## Plugin

Uses [`@tarquinen/opencode-dcp`](https://www.npmjs.com/package/@tarquinen/opencode-dcp) for Dynamic Context Pruning — automatic context management to keep conversations efficient.

## Testing

Agent integration tests live in `tests/` and use [Task](https://taskfile.dev) as the test runner. Each agent suite follows a pattern: clean workspace, seed input, run agent via `opencode run`, then assert outputs.

```bash
# Run all tests
cd tests && task test

# Run a specific agent's tests
cd tests && task amaterasu:test
cd tests && task inari:test
cd tests && task benzaiten:test
```

| Suite | Tests | What's verified |
|-------|-------|-----------------|
| **Amaterasu** | 11 | Solo: HLD in `.specs/` with correct metadata + story in `.issues/`. Team: HLD + draft in `.ai.tmp/` + story. |
| **Inari** | 14 | Solo: Epic + Story in `.issues/` with parent links and ID sequencing. Team: + draft. CVS: GitHub issue creation. |
| **Benzaiten** | 13 | Scaffold validation: pyproject.toml, mise.toml, mkdocs.yml, Taskfile.yml, docs/. Boundary: no `.issues/` or `.specs/`. |

Reusable test helpers are defined in `tests/generic/Taskfile.yml` (path assertions, content checks, file counting).

## Scripts

| Script | Purpose |
|--------|---------|
| `scripts/switch-models.sh` | Bulk model swap across all agent files. Supports keywords: `copilot`, `anthropic`, `openai`, `openrouter`, `free`. Strong tier (opus) for Daedalus (Lead Architect), Odysseus (Tech Lead), Argus (Reviewer), Tsukuyomi, Odin. Fast tier (sonnet) for all others. |

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

   # Game development (optional — only for Odin pipeline)
   export GOOGLE_API_KEY="..."    # Gemini image gen + visual QA
   export XAI_API_KEY="..."       # xAI Grok image/video gen
   export TRIPO3D_API_KEY="..."   # Image-to-3D conversion
   ```

5. **Enable/disable MCP servers** by toggling `"enabled"` in `opencode.json`.

6. **Switch model providers** (optional):
   ```bash
   # Switch all agents to Anthropic direct API models
   ./scripts/switch-models.sh anthropic

   # Switch to GitHub Copilot models (default)
   ./scripts/switch-models.sh copilot
   ```

## License

[MIT](LICENSE)
