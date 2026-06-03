/**
 * Bifrost configuration schema and values.
 *
 * This module is the single source of truth for the Bifrost gateway
 * configuration. `start.ts` serializes {@link config} to
 * `${appDir}/config.json` and launches Bifrost with it.
 *
 * Environment variables:
 * - `BIFROST_APP_DIR`                 - Data directory (default: `bifrost/data`)
 * - `BIFROST_ENCRYPTION_KEY`          - Key used to encrypt stored secrets
 * - `OPENROUTER_BASE_URL`             - OpenRouter API base URL
 * - `BIFROST_REQUEST_TIMEOUT_SECONDS` - Per-request timeout (default: 300)
 * - `BIFROST_MAX_RETRIES`             - Retries for failed upstream requests (default: 0)
 */

import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import type { BifrostConfig } from './config.schema.ts';
import { codeRules, setups, setupModels, type SetupName } from './governance.ts';
import { createProviders } from './providers.ts';

const __dirname = dirname(fileURLToPath(import.meta.url));

/** Root directory Bifrost uses for its database files and generated config.json. */
export const appDir = process.env.BIFROST_APP_DIR ?? join(__dirname, 'data');

/* ------------------------------------------------------------------ */
/* Values                                                              */
/* ------------------------------------------------------------------ */

/** Complete Bifrost configuration. */
export function createConfig(setupName: SetupName = 'default'): BifrostConfig {
  if (!(setupName in setups)) {
    throw new Error(`Unknown Bifrost setup '${setupName}'. Available: ${Object.keys(setups).join(', ')}`);
  }

  return {
    $schema: 'https://www.getbifrost.ai/schema',
    source_of_truth: 'config.json',
    encryption_key: process.env.BIFROST_ENCRYPTION_KEY ?? 'local-development-key-change-me',
    server: {
      read_buffer_size: 65536,
    },
    client: {
      enable_logging: true,
      disable_content_logging: false,
      log_retention_days: 90,
      logging_headers: ['x-request-id', 'x-trace-id'],
      dump_errors_in_console_logs: true,
    },
    config_store: {
      enabled: true,
      type: 'sqlite',
      config: {
        path: join(appDir, 'config.db'),
      },
    },
    logs_store: {
      enabled: true,
      type: 'sqlite',
      config: {
        path: join(appDir, 'logs.db'),
      },
    },
    providers: createProviders(setupModels(setupName)),
    governance: {
      routing_rules: [
        /* ------------------------------------------------------------------
         * `code` virtual model — complexity-tiered ladder.
         *
         * Bifrost's Complexity Router classifies the last user message of
         * every request into SIMPLE / MEDIUM / COMPLEX / REASONING and
         * exposes it as the `complexity_tier` CEL variable. The rules below
         * map each tier to the model whose intelligence/price fits it:
         * free local models first, then commercial models in ascending
         * cost order. Priorities are ascending (lower = evaluated first);
         * the tier rules are mutually exclusive, and `code-default` (100)
         * is the safety net when no complexity signal is detected.
         * ------------------------------------------------------------------ */
        ...codeRules(setupName),
      ],
    },
  };
}

export const config = createConfig((process.env.BIFROST_SETUP ?? 'default-test') as SetupName);
