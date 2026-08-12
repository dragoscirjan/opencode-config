#!/usr/bin/env bun

/* global process */

import { spawn } from 'node:child_process';
import { mkdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { appDir, config } from './config.ts';

const configPath = join(appDir, 'config.json');

function findGovernanceIds(): string[] {
  return config.governance.routing_rules.map((item) => item.id);
}

function findRoutingRulesModelsById(id: string): string[] {
  const routing_rule = config.governance.routing_rules.find((item) => item.id === id);

  return [...(routing_rule?.targets ?? []).map((t) => `${t.provider}/${t.model}`), ...(routing_rule?.fallbacks ?? [])];
}

(async () => {
  // Write configuration and start Bifrost
  mkdirSync(appDir, { recursive: true });
  writeFileSync(configPath, JSON.stringify(config, null, 2) + '\n');

  console.log(`Generated ${configPath}`);
  console.log(`Setup: ${process.env.BIFROST_SETUP ?? 'default-test'}`);
  findGovernanceIds().forEach((id) => {
    console.log(`${id}: ${findRoutingRulesModelsById(id).join(' -> ')}`);
  });

  await new Promise((resolve) => setTimeout(resolve, 3000));

  const child = spawn(
    'npx',
    [
      '-y',
      '@maximhq/bifrost',
      '-app-dir',
      appDir,
      '-log-level',
      process.env.BIFROST_LOG_LEVEL ?? 'debug',
      '-log-style',
      process.env.BIFROST_LOG_STYLE ?? 'json',
    ],
    {
      stdio: 'inherit',
      env: process.env,
    },
  );

  process.on('SIGINT', () => child.kill('SIGINT'));
  process.on('SIGTERM', () => child.kill('SIGTERM'));

  child.on('exit', (code, signal) => {
    process.exit(code ?? (signal ? 1 : 0));
  });
})();
