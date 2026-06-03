# Bifrost Configuration

Typed Bifrost configuration for OpenCode.

## Usage

```bash
./service.sh start             # default setup
./service.sh start local       # local-first setup
./service.sh start remote      # OpenRouter-only setup
./service.sh stop              # stop running instance
./service.sh restart local     # switch setup after restart
./service.sh logs              # tail data/bifrost.log
```

## Configuration

| File               | Purpose                                                      |
| ------------------ | ------------------------------------------------------------ |
| `config.ts`        | Runtime config values, stores, providers, governance rules   |
| `config.schema.ts` | Documented TypeScript schema types                           |
| `model-pool.ts`    | Single provider/model registry used by providers and routing |
| `providers.ts`     | Provider endpoints, keys, and model allowlists               |
| `governance.ts`    | Named setups and complexity-tiered `code` routing rules      |

## Virtual Models

### `code` — complexity-tiered routing

Bifrost's Complexity Router classifies each request into SIMPLE / MEDIUM / COMPLEX / REASONING and routes to setup-selected models.

Setups: `default`, `local`, `remote`. One Bifrost process uses one setup. Stop/restart before switching.

| Setup     | SIMPLE model                      |
| --------- | --------------------------------- |
| `default` | `lmstudio-tw/qwen/qwen3.6-27b`    |
| `local`   | `lmstudio-tw/north-mini-code-1.0` |
| `remote`  | `openrouter-custom/z-ai/glm-5.2`  |

### `design`

No routing rule defined — passes through to the default model.

## Providers

Providers are declared only when selected setup uses them. Each provider key lists only models referenced by that setup's routing rules or fallbacks.

| Setup     | Provider models included                                                                       |
| --------- | ---------------------------------------------------------------------------------------------- |
| `default` | `lmstudio-tw/qwen/qwen3.6-27b` plus OpenRouter routing models                                  |
| `local`   | `lmstudio-tw/north-mini-code-1.0`, `lmstudio-tw/qwen/qwen3.6-27b`, plus selected Mac M5 models |
| `remote`  | OpenRouter routing models only                                                                 |

## Environment Variables

| Variable                          | Default                           | Description                              |
| --------------------------------- | --------------------------------- | ---------------------------------------- |
| `BIFROST_APP_DIR`                 | `bifrost/data`                    | Data directory                           |
| `BIFROST_ENCRYPTION_KEY`          | `local-development-key-change-me` | Encryption key for secrets               |
| `OPENROUTER_BASE_URL`             | `https://openrouter.ai/api`       | OpenRouter base URL                      |
| `BIFROST_REQUEST_TIMEOUT_SECONDS` | `300`                             | Per-request timeout                      |
| `BIFROST_MAX_RETRIES`             | `0`                               | Retries for failed requests              |
| `BIFROST_SETUP`                   | `default`                         | Setup name: `default`, `local`, `remote` |
| `BIFROST_CODE_SIMPLE`             | (see governance.ts)               | Comma-separated SIMPLE tier model refs   |
| `BIFROST_CODE_MEDIUM`             | (see governance.ts)               | Comma-separated MEDIUM tier models       |
| `BIFROST_CODE_COMPLEX`            | (see governance.ts)               | Comma-separated COMPLEX tier models      |
| `BIFROST_CODE_REASONING`          | (see governance.ts)               | Comma-separated REASONING tier models    |
| `BIFROST_CODE_DEFAULT`            | (see governance.ts)               | Comma-separated default tier model refs  |
