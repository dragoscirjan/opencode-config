/* global process */

import type { ProviderConfig } from './config.schema.ts';
import { modelDefinitionsByProvider, providerIds, type ModelDefinition, type ProviderId } from './model-pool.ts';

const genericProvider: Omit<ProviderConfig, 'keys' | 'network_config'> = {
  custom_provider_config: {
    base_provider_type: 'openai',
    allowed_requests: {
      chat_completion: true,
      chat_completion_stream: true,
    },
  },
};

const providerSettings: Record<ProviderId, { value: string; baseUrl: string; allowPrivateNetwork?: boolean }> = {
  [providerIds.openRouter]: {
    value: 'env.OPENROUTER_API_KEY',
    baseUrl: process.env.OPENROUTER_BASE_URL ?? 'https://openrouter.ai/api',
  },
  [providerIds.lmStudioMacM5]: {
    value: 'local',
    baseUrl: 'http://mac-m5.trilu.lila:1234',
    allowPrivateNetwork: true,
  },
  [providerIds.lmStudioTwNixos]: {
    value: 'local',
    baseUrl: 'http://tw-nixos.trilu.lila:1234',
    allowPrivateNetwork: true,
  },
};

function createProvider(id: ProviderId, activeModels: ModelDefinition[]): ProviderConfig {
  const settings = providerSettings[id];
  return {
    ...genericProvider,
    keys: [
      {
        name: settings.value === 'local' ? 'local' : 'default',
        value: settings.value,
        models: activeModels.map((item) => item.model),
        weight: 1,
      },
    ],
    network_config: {
      base_url: settings.baseUrl,
      default_request_timeout_in_seconds: Number(process.env.BIFROST_REQUEST_TIMEOUT_SECONDS ?? 3600),
      stream_idle_timeout_in_seconds: Number(process.env.BIFROST_STREAM_IDLE_TIMEOUT_SECONDS ?? 3600),
      max_retries: Number(process.env.BIFROST_MAX_RETRIES ?? 0),
      ...(settings.allowPrivateNetwork ? { allow_private_network: true } : {}),
    },
  };
}

export function createProviders(activeModels: readonly ModelDefinition[]): Record<string, ProviderConfig> {
  const byProvider = modelDefinitionsByProvider(activeModels);
  return Object.fromEntries(
    Object.entries(byProvider)
      .filter(([, providerModels]) => providerModels.length > 0)
      .map(([id, providerModels]) => [id, createProvider(id as ProviderId, providerModels)]),
  );
}
