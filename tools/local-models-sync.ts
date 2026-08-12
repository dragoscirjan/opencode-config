import { readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { tool } from '@opencode-ai/plugin';

const OPENAI_COMPAT_NPM = '@ai-sdk/openai-compatible';
const TIMEOUT_MS = 5000;

type JsonObject = Record<string, unknown>;

function isRecord(value: unknown): value is JsonObject {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function getModelsEndpoint(baseURL: string): string {
  if (baseURL.endsWith('/')) {
    return `${baseURL}models`;
  }

  return `${baseURL}/models`;
}

function isOpenAICompatible(providerId: string, providerConfig: JsonObject): boolean {
  const api = providerConfig.api;
  if (typeof api === 'string' && api.toLowerCase() === 'openai') {
    return true;
  }

  const npm = providerConfig.npm;
  if (typeof npm === 'string' && npm === OPENAI_COMPAT_NPM) {
    return true;
  }

  return providerId === 'ollama';
}

function getApiKeyHeader(providerConfig: JsonObject): Record<string, string> {
  const options = isRecord(providerConfig.options) ? providerConfig.options : null;
  if (!options) {
    return {};
  }

  const apiKey = options.apiKey;
  if (typeof apiKey !== 'string' || !apiKey.trim()) {
    return {};
  }

  // opencode.json can contain unresolved placeholders like {env:API_KEY}
  if (apiKey.includes('{env:')) {
    return {};
  }

  return { Authorization: `Bearer ${apiKey}` };
}

async function fetchWithTimeout(url: string, headers: Record<string, string>): Promise<Response> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), TIMEOUT_MS);

  try {
    return await fetch(url, {
      method: 'GET',
      headers,
      signal: controller.signal,
    });
  } finally {
    clearTimeout(timeout);
  }
}

function extractModelIds(payload: unknown): string[] {
  if (!isRecord(payload) || !Array.isArray(payload.data)) {
    return [];
  }

  const ids = new Set<string>();
  for (const entry of payload.data) {
    if (!isRecord(entry)) {
      continue;
    }

    const modelId = entry.id;
    if (typeof modelId === 'string' && modelId.trim()) {
      ids.add(modelId);
    }
  }

  return Array.from(ids).sort();
}

function reconcileModels(
  existingValue: unknown,
  discoveredIds: string[],
): {
  reconciled: JsonObject;
  added: number;
  removed: number;
  kept: number;
} {
  const existingModels = isRecord(existingValue) ? existingValue : {};
  const discoveredSet = new Set(discoveredIds);

  const reconciled: JsonObject = {};
  let added = 0;
  let kept = 0;

  for (const modelId of discoveredIds) {
    const existingEntry = existingModels[modelId];
    if (existingEntry === undefined) {
      reconciled[modelId] = { name: modelId };
      added += 1;
      continue;
    }

    if (isRecord(existingEntry)) {
      reconciled[modelId] = { name: modelId, ...existingEntry };
    } else {
      reconciled[modelId] = existingEntry;
    }
    kept += 1;
  }

  const removed = Object.keys(existingModels).filter((modelId) => !discoveredSet.has(modelId)).length;

  return { reconciled, added, removed, kept };
}

export default tool({
  description:
    'Sync OpenAI-compatible provider model lists in opencode.json. Adds new models, removes missing models, keeps existing settings for retained models, and warns on provider connectivity issues.',
  args: {},
  async execute(_args, context) {
    const configPath = join(context.directory, 'opencode.json');

    let configRaw: string;
    try {
      configRaw = readFileSync(configPath, 'utf-8');
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : String(error);
      return `Error: unable to read opencode.json at ${configPath}. ${message}`;
    }

    let config: JsonObject;
    try {
      const parsed = JSON.parse(configRaw);
      if (!isRecord(parsed)) {
        return 'Error: opencode.json root must be a JSON object.';
      }
      config = parsed;
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : String(error);
      return `Error: opencode.json is not valid JSON. ${message}`;
    }

    const providers = isRecord(config.provider) ? config.provider : null;
    if (!providers) {
      return 'Error: opencode.json does not contain a valid "provider" object.';
    }

    const infos: string[] = [];
    const warnings: string[] = [];
    const providerSummaries: string[] = [];

    let scanned = 0;
    let updated = 0;
    let unchanged = 0;

    for (const [providerId, value] of Object.entries(providers)) {
      if (!isRecord(value)) {
        infos.push(`- ${providerId}: skipped (provider entry is not an object)`);
        continue;
      }

      if (!isOpenAICompatible(providerId, value)) {
        infos.push(`- ${providerId}: skipped (not OpenAI-compatible)`);
        continue;
      }

      const options = isRecord(value.options) ? value.options : null;
      const baseURL = options && typeof options.baseURL === 'string' ? options.baseURL.trim() : '';
      if (!baseURL) {
        infos.push(`- ${providerId}: skipped (missing options.baseURL)`);
        continue;
      }

      scanned += 1;
      const endpoint = getModelsEndpoint(baseURL);

      let response: Response;
      try {
        response = await fetchWithTimeout(endpoint, {
          Accept: 'application/json',
          ...getApiKeyHeader(value),
        });
      } catch (error: unknown) {
        const isTimeout = error instanceof Error && error.name === 'AbortError';
        const message = isTimeout
          ? `timeout after ${TIMEOUT_MS}ms`
          : error instanceof Error
            ? error.message
            : String(error);
        warnings.push(`- ${providerId}: unable to fetch ${endpoint} (${message})`);
        continue;
      }

      if (!response.ok) {
        warnings.push(`- ${providerId}: ${endpoint} returned HTTP ${response.status}`);
        continue;
      }

      let payload: unknown;
      try {
        payload = await response.json();
      } catch (error: unknown) {
        const message = error instanceof Error ? error.message : String(error);
        warnings.push(`- ${providerId}: invalid JSON response from ${endpoint} (${message})`);
        continue;
      }

      const discoveredIds = extractModelIds(payload);
      if (!isRecord(payload) || !Array.isArray(payload.data)) {
        warnings.push(`- ${providerId}: response payload missing data[] model list`);
        continue;
      }

      const { reconciled, added, removed, kept } = reconcileModels(value.models, discoveredIds);
      const oldModels = isRecord(value.models) ? value.models : {};
      const changed = JSON.stringify(oldModels) !== JSON.stringify(reconciled);

      value.models = reconciled;
      if (changed) {
        updated += 1;
      } else {
        unchanged += 1;
      }

      providerSummaries.push(
        `- ${providerId}: +${added} / -${removed} / =${kept} (${discoveredIds.length} discovered)`,
      );
    }

    try {
      writeFileSync(configPath, `${JSON.stringify(config, null, 2)}\n`, 'utf-8');
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : String(error);
      return `Error: failed to write opencode.json. ${message}`;
    }

    const lines = [
      'Local model sync complete.',
      `Eligible providers scanned: ${scanned}`,
      `Providers updated: ${updated}`,
      `Providers unchanged: ${unchanged}`,
    ];

    if (providerSummaries.length > 0) {
      lines.push('', 'Per-provider reconciliation:');
      lines.push(...providerSummaries);
    }

    if (infos.length > 0) {
      lines.push('', 'Info:');
      lines.push(...infos);
    }

    if (warnings.length > 0) {
      lines.push('', 'Warnings:');
      lines.push(...warnings);
    }

    lines.push('', 'Restart OpenCode to apply updated model registrations.');

    return lines.join('\n');
  },
});
