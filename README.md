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
- [Documentation](#documentation)
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
├── commands/              # Slash commands (/design, /implement, /review, …)
├── document-templates/    # Templates for HLDs, LLDs, epics, stories
├── skills/                # Domain-specific instruction packs (13 skills)
├── tools/                 # Custom TypeScript tools (spec-create, issue-create, …)
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

## Documentation

This configuration supports two primary development modes. Please refer to the specific documentation for your use case:

- **[Software Development](README_DEV.md)** — Workflows for building standard applications (web, backend, CLI, etc.). Includes agents like Product Owner, Technical Advisor, and Lead Engineer.
- **[Game Development](README_GAME_DEV.md)** — Workflows for building games with Godot 4. Includes game-specific agents (Game Designer, Game Director, Visual QA) and asset generation pipelines.

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

Agent integration tests live in `tests/` and use [Vitest](https://vitest.dev) as the test runner. Each agent suite follows a pattern: clean workspace, seed input, run agent via `opencode run`, then assert outputs.

```bash
# Run all tests
cd tests && npm test

# Run tests in watch mode
cd tests && npm run test:watch
```

Reusable test helpers are defined in `tests/helpers.ts` (path assertions, content checks, file counting).
Additionally, custom tools (such as asset generators, image utilities) are fully tested via `vitest` in `tests/tools/`.

## Scripts

| Script | Purpose |
|--------|---------|
| `scripts/switch-models.sh` | Bulk model swap across all agent files. Supports keywords: `copilot`, `anthropic`, `openai`, `openrouter`, `free`. Strong tier (opus) for architects and reviewers. Fast tier (sonnet) for all others. |

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

6. **Switch model providers** (optional):
   ```bash
   # Switch all agents to Anthropic direct API models
   ./scripts/switch-models.sh anthropic

   # Switch to GitHub Copilot models (default)
   ./scripts/switch-models.sh copilot
   ```

## License

[MIT](LICENSE)
