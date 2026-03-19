<p align="center">
  <img src="https://github.com/anomalyco/opencode/raw/dev/packages/console/app/src/asset/logo-ornate-dark.svg" alt="opencode" width="200" />
</p>

<h1 align="center">opencode-config</h1>

<p align="center">
  My personal <a href="https://opencode.ai">opencode</a> configuration — a batteries-included setup for AI-assisted development with multi-agent workflows, language-specific skills, and curated MCP integrations.
</p>

---

## What's Inside

```
.
├── opencode.json        # Main opencode config (agents, MCP servers, plugins)
├── dcp.jsonc            # Dynamic Context Pruning settings
├── agents/              # Sub-agent definitions (role, model, permissions)
├── commands/            # Slash commands (/docs, /review, /test)
├── prompts/             # System prompts for Plan and Build modes
└── skills/              # Language & methodology skill packs
```

## Agents

A multi-agent team that can be invoked for complex tasks:

| Agent | Role | Model |
|-------|------|-------|
| **architect** | System design, HLDs, architecture decisions | `claude-opus-4.6` |
| **tech-lead** | Task breakdown, implementation planning | `claude-opus-4.6` |
| **developer** | Code implementation | `claude-sonet-4.6` |
| **tester** | Test writing & execution, TDD support | `claude-sonet-4.6` |
| **code-reviewer** | Quality, security & correctness review | `claude-opus-4.6` |
| **docs** | Technical documentation (MkDocs) | `claude-sonet-4.6` |

The **Build** prompt acts as a Senior Developer by default — it only invokes the team when a task is complex enough to warrant it. The **Plan** prompt acts as a Senior Architect for analysis and design.

## Skills

Loadable instruction packs that teach agents language-specific conventions and best practices:

- **Languages** — Bash, C++, Elixir, Go, Java, JavaScript, Lua, Python, Rust, TypeScript, Zig
- **clean-code** — SOLID principles, design patterns, readability standards
- **mcp-tools** — External MCP tool reference

## Commands

| Command | Description |
|---------|-------------|
| `/docs` | Generate or update project documentation |
| `/review` | Run a code review on the current diff |
| `/test` | Run tests with coverage |

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

## How It Works

- **Solo mode (default):** The Build agent works as a Senior Developer, handling tasks directly.
- **Team mode:** For complex tasks (3+ files, design trade-offs, new APIs, architecture changes), the full agent team is invoked — Tech Lead plans, Developer implements, Tester verifies, Code Reviewer approves.
- **TDD support:** Include "TDD" in your request and the Tester writes failing tests first, then the Developer implements to make them pass.
- **Plan mode:** The Plan agent acts as a Senior Architect for analysis-only tasks — producing HLD documents, design roadmaps, and task breakdowns without writing code.

## License

[MIT](LICENSE)
