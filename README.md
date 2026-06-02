# OpenCode Agent Configuration & Architecture

This repository contains a comprehensive, highly-optimized configuration suite for OpenCode. The intention behind this setup is to provide a production-ready, multi-agent ecosystem that handles everything from high-level system architecture and game design to low-level backend implementations—all while strictly managing AI model costs.

## 🌟 Ecosystem Overview

Rather than relying on a single monolithic AI agent, this configuration splits responsibilities into specific roles, ensuring context remains clean, workflows are respected, and domain boundaries are maintained.

### 1. Orchestrators & Directors
Primary agents that interface directly with the user to manage large-scale planning:
- **`product-owner` / `tech-advisor`**: Manage requirements, User Stories, and high-level technical direction.
- **`lead-engineer`**: Orchestrates software engineering tasks, delegating to specialized development sub-agents.
- **`game-director`**: Specifically tuned for Godot 4 game development, managing visual targets, art pipelines, and execution.

### 2. Specialized Workers (Sub-agents)
Task-specific agents invoked by the orchestrators to do the heavy lifting:
- **Software Dev**: `worker-frontend-dev`, `worker-backend-dev`, `worker-devops`, `worker-sys-architect`, `worker-tech-lead`, `worker-code-reviewer`
- **Game Dev**: `worker-game-designer`, `worker-godot-expert`, `worker-visual-qa`

### 3. Domain-Specific Skills
A rich library of loadable skills (e.g., `clean-code`, `develop-tdd`, `godot-engine`) that inject precise workflows and standards dynamically based on the active task.

---

## 🏛️ The "Big Brother" Escalation Architecture

To prevent burning through expensive API credits (like Claude Opus 4.6 or o1) on simple typos or repetitive trial-and-error, we built a tiered **Escalation Protocol** (`skills/escalation-protocol`). 

By default, standard sub-agents use extremely cheap, fast "Daily Driver" models. If they fail repeatedly or get stuck in a logic loop, they automatically format a distress payload and call in the "Big Brothers":

1. **`worker-bb-coder` (The Execution Closer):** Adopts the failing agent's persona, fixes the immediate complex code bug, and hands control back.
2. **`worker-bb-oracle` (The Deep Reasoner):** Resolves deep architectural deadlocks by providing high-level, step-by-step logic paths without writing the final code.

---

## 📊 Live Model Benchmarking & Tiering

We track model performance and pricing to keep our agent configurations optimal. Our tiering strategy is heavily informed by data from the [Onyx Best LLMs for Coding Leaderboard](https://onyx.app/best-llm-for-coding), cross-referenced with live pricing from the OpenRouter API.

*You can view our scraped benchmark data snapshots in `models-coding.csv` and `models-reasoning.csv`.*

Based on this data, we organize models into distinct "Normal" (Daily Driver) and "Big Brother" pairs across different environments (Local, OpenRouter, Copilot), documented in `model-list.yaml`.

---

## 🛠️ Dynamic Model Switcher

To easily manage these configurations, we built a utility script `scripts/switch-models.sh`. It allows you to instantly swap the models across your entire OpenCode agent fleet using predefined combinations.

### Usage:
```bash
./scripts/switch-models.sh [--target normal|bb|all] <combination>
```

### Available Combinations:

**[LOCAL - by VRAM]**
*   `local_8gb` (Qwen 7B -> DeepSeek 8B)
*   `local_16gb` (Qwen 32B -> DeepSeek 14B)
*   `local_32gb` (Qwen 30B -> DeepSeek 32B)
*   `local_64gb` (Qwen 72B -> DeepSeek 70B)

**[OPENROUTER - by Cost]**
*   `openrouter_ultra_budget` (Qwen 9B -> DeepSeek V3.2)
*   `openrouter_value` (Step 3.5 Flash -> MiniMax M2.5)
*   `openrouter_standard` (Gemini 3.1 Pro -> GPT-5.4)
*   `openrouter_premium` (Sonnet 4.6 -> Opus 4.6)

**[GITHUB COPILOT]**
*   `copilot_budget` (GPT-4o-mini -> o3-mini)
*   `copilot_standard` (Gemini 3.1 Pro -> Sonnet 4.6)
*   `copilot_premium` (Sonnet 4.6 -> Opus 4.6)
*   `copilot_architect` (GPT-5.4 -> o1)
```
