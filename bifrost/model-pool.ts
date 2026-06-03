export const providerIds = {
  openRouter: 'openrouter-custom',
  lmStudioMacM5: 'lmstudio-m5',
  lmStudioTwNixos: 'lmstudio-tw',
} as const;

export type ProviderId = (typeof providerIds)[keyof typeof providerIds];
export type ModelRef = `${ProviderId}/${string}`;

export interface ModelDefinition {
  provider: ProviderId;
  model: string;
  ref: ModelRef;
}

function model(provider: ProviderId, modelName: string): ModelDefinition {
  return {
    provider,
    model: modelName,
    ref: `${provider}/${modelName}` as ModelRef,
  };
}

/** Named model definitions. Setups, providers, and routing all derive from these. */
export const models = {
  openRouter: {
    geminiFlash: model(providerIds.openRouter, 'google/gemini-3.6-flash'),
    glm5_2: model(providerIds.openRouter, 'z-ai/glm-5.2'),
    kimiCode: model(providerIds.openRouter, 'moonshotai/kimi-k2.7-code'),
    gptLuna: model(providerIds.openRouter, 'openai/gpt-5.6-luna'),
    claudeSonnet: model(providerIds.openRouter, 'anthropic/claude-sonnet-5'),
    claudeOpus: model(providerIds.openRouter, 'anthropic/claude-opus-5'),
    gptTerra: model(providerIds.openRouter, 'openai/gpt-5.6-terra'),
    kimiReasoning: model(providerIds.openRouter, 'moonshotai/kimi-k3'),
  },
  macM5: {
    essentialRnj1: model(providerIds.lmStudioTwNixos, 'essentialai/rnj-1'),
    devstralSmall2512: model(providerIds.lmStudioMacM5, 'mistralai/devstral-small-2-2512'),
    gemma4_31b: model(providerIds.lmStudioMacM5, 'google/gemma-4-31b'),
    qwen36_35bA3b: model(providerIds.lmStudioMacM5, 'qwen/qwen3.6-35b-a3b'),
    qwen3CoderNext: model(providerIds.lmStudioMacM5, 'qwen/qwen3-coder-next'),
    qwen3Coder30b: model(providerIds.lmStudioMacM5, 'qwen/qwen3-coder-30b'),
    nemotron3Super: model(providerIds.lmStudioMacM5, 'nvidia/nemotron-3-super'),
    glmFlash: model(providerIds.lmStudioMacM5, 'zai-org/glm-4.7-flash'),
  },
  tw: {
    essentialRnj1: model(providerIds.lmStudioTwNixos, 'essentialai/rnj-1'),
    qwen25Coder14b: model(providerIds.lmStudioTwNixos, 'qwen/qwen2.5-coder-14b'),
    northMini: model(providerIds.lmStudioTwNixos, 'north-mini-code-1.0'),
    qwen36_27b: model(providerIds.lmStudioTwNixos, 'qwen/qwen3.6-27b'),
    qwen3Coder30b: model(providerIds.lmStudioTwNixos, 'qwen/qwen3-coder-30b'),
  },
} as const;

export function modelDefinitionsByProvider(
  activeModels: readonly ModelDefinition[],
): Record<ProviderId, ModelDefinition[]> {
  return {
    [providerIds.openRouter]: activeModels.filter((item) => item.provider === providerIds.openRouter),
    [providerIds.lmStudioMacM5]: activeModels.filter((item) => item.provider === providerIds.lmStudioMacM5),
    [providerIds.lmStudioTwNixos]: activeModels.filter((item) => item.provider === providerIds.lmStudioTwNixos),
  };
}

export function resolveModelRef(ref: string): ModelDefinition {
  const allModels = Object.values(models).flatMap((providerModels) => Object.values(providerModels));
  const resolved = allModels.find((item) => item.ref === ref);
  if (!resolved) throw new Error(`Unknown model '${ref}'`);
  return resolved;
}
