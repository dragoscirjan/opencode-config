# OpenCode Architecture & Configuration

This repository contains the configuration and custom architecture designed to optimize OpenCode agents for both performance and cost.

## 🏛️ The "Big Brother" Escalation Architecture

To prevent burning through expensive API credits (like Claude Opus 4.6 or o1) on simple typos, we built a tiered escalation system. 

By default, the standard OpenCode agents (`worker-frontend-dev`, `worker-backend-dev`, etc.) use extremely cheap, fast "Daily Driver" models. If they get stuck in an execution loop, they invoke the **Escalation Protocol** to call in the "Big Brothers".

### The Big Brother Agents:
1. **`worker-bb-coder` (The Execution Closer):** Designed to jump into a failing agent's context, adopt their persona, fix the immediate complex logic bug, and hand control back.
2. **`worker-bb-oracle` (The Deep Reasoner):** Designed for architectural deadlocks. It doesn't write code; it provides a high-level, step-by-step solution path using massive context reasoning models.

### The Escalation Protocol (`skills/escalation-protocol`)
A custom skill teaches normal agents exactly *when* to escalate (e.g., failing a test 3 times) and *how* to format the request to the Big Brother (Identity, Goal, The Wall, Context).

---

## 📊 Live Model Benchmarking & Tiering

Using live 2026 pricing and context windows from the OpenRouter `/api/v1/models` endpoint combined with the Onyx Coding Leaderboard, we organized the models into distinct combinations based on provider (Local, OpenRouter, Copilot).

*You can view the raw scraped benchmark data in `models-coding.csv` and `models-reasoning.csv`.*

These combinations are documented in `model-list.yaml` and integrated directly into our custom script.

---

## 🛠️ Dynamic Model Switcher

To easily manage these configurations, we built `scripts/switch-models.sh`. It allows you to instantly swap the models across your entire OpenCode agent fleet using predefined cost combinations, scaling from free local hardware up to premium API calls.

### Usage:
```bash
./scripts/switch-models.sh <combination>
```

### Available Combinations:

**[LOCAL - by VRAM]**
*   `local-8gb` (Qwen 7B -> DeepSeek 8B)
*   `local-16gb` (Qwen 32B -> DeepSeek 14B)
*   `local-32gb` (Qwen 32B -> DeepSeek 32B)
*   `local-64gb` (Qwen 72B -> DeepSeek 70B)

**[OPENROUTER - by Cost]**
*   `openrouter-ultra-budget` (Qwen 9B -> DeepSeek V3.2)
*   `openrouter-value` (Step 3.5 Flash -> MiniMax M2.5)
*   `openrouter-standard` (Gemini 3.1 Pro -> GPT-5.4)
*   `openrouter-premium` (Sonnet 4.6 -> Opus 4.6)

**[GITHUB COPILOT]**
*   `copilot-budget` (GPT-4o-mini -> o3-mini)
*   `copilot-standard` (Gemini 3.1 Pro -> Sonnet 4.6)
*   `copilot-premium` (Sonnet 4.6 -> Opus 4.6)
*   `copilot-architect` (GPT-5.4 -> o1)
