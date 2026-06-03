# FreeRouter Gateway

Native FreeRouter configuration with an OpenAI-compatible HTTP gateway for OpenCode.

## Commands

```bash
./service.sh start
./service.sh stop
./service.sh status
./service.sh logs
```

## Layout

| File            | Purpose                                                          |
| --------------- | ---------------------------------------------------------------- |
| `config.ts`     | Native `RouterConfig` — spend persistence, limits, provider toggles, rules |
| `providers.ts`  | `OpenAICompatibleProvider` (extends `BaseProvider`) + model registry |
| `governance.ts` | Native `Rule[]` with tier-based pin rules (SIMPLE/MEDIUM/COMPLEX/REASONING) |
| `keys.ts`       | BYOK registration via `router.setKey()`                           |
| `server.ts`     | Express host around `createMiddleware` + `/health` + `/metrics`  |
| `start.ts`      | Config validation, router init, provider/key registration, graceful shutdown |

## Routing

FreeRouter has no complexity classifier (unlike Bifrost's CEL `complexity_tier`). The `code` virtual model pins to the SIMPLE tier by default. Clients can pass `metadata: { tier: "medium" | "complex" | "reasoning" }` in the request body to select a different tier.

### Tier ladders (all OpenRouter, mirroring bifrost)

| Tier       | Default model                          |
| ---------- | -------------------------------------- |
| SIMPLE     | `openrouter/z-ai/glm-5.2`              |
| MEDIUM     | `openrouter/google/gemini-3.6-flash`   |
| COMPLEX    | `openrouter/moonshotai/kimi-k2.7-code` |
| REASONING  | `openrouter/anthropic/claude-opus-5`   |

### Key differences from Bifrost

- No complexity classifier — tier is selected via request `metadata.tier`, not auto-classified
- No weighted targets — each rule pins to a single model
- No fallback chains — FreeRouter rules are terminal on match
- No CEL expressions — native `RuleMatch` predicates only

## Environment

| Variable                          | Default                              | Description                         |
| --------------------------------- | ------------------------------------ | ----------------------------------- |
| `FREEROUTER_APP_DIR`              | `freerouter/data`                    | Data directory                      |
| `FREEROUTER_PORT`                 | `8081`                               | HTTP port                           |
| `OPENROUTER_API_KEY`              | —                                    | OpenRouter BYOK key (required)      |
| `OPENROUTER_BASE_URL`             | `https://openrouter.ai/api/v1`       | OpenRouter endpoint                 |
| `FREEROUTER_LMSTUDIO_M5_BASE_URL` | `http://mac-m5.trilu.lila:1234/v1`   | M5 LM Studio endpoint               |
| `FREEROUTER_LMSTUDIO_TW_BASE_URL` | `http://tw-nixos.trilu.lila:1234/v1` | TW NixOS LM Studio endpoint         |
| `FREEROUTER_CODE_SIMPLE`          | `openrouter/z-ai/glm-5.2`            | Comma-separated SIMPLE tier models  |
| `FREEROUTER_CODE_MEDIUM`          | `openrouter/google/gemini-3.6-flash,openrouter/z-ai/glm-5.2` | MEDIUM tier models |
| `FREEROUTER_CODE_COMPLEX`         | `openrouter/moonshotai/kimi-k2.7-code,bifrost/code
| `FREEROUTER_CODE_REASONING`       | `openrouter/anthropic/claude-opus-5,bifrost/code

## Install

The real FreeRouter package is installed from `github:takkekatechie/FreeRouter` — the npm package named `freerouter` is an unrelated 2017 squat.
