---
description: Discover and reconcile local OpenAI-compatible provider models into opencode.json
agent: build
---

Sync local models from configured providers:

$ARGUMENTS

Flow:

1. Run the `local-models-sync` tool.
2. Report reconciliation results per provider (`+added / -removed / =kept`).
3. Highlight warnings for unreachable providers, timeouts, malformed responses, or HTTP failures.
4. Always remind the user to restart OpenCode so updated model registrations are loaded.

Notes:

- Scope is OpenAI-compatible providers only.
- Current timeout is 5 seconds per provider endpoint.
