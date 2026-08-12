import type { RoutingRule } from './config.schema.ts';
import { models, resolveModelRef, type ModelDefinition, type ModelRef } from './model-pool.ts';

type ComplexityTier = 'SIMPLE' | 'MEDIUM' | 'COMPLEX' | 'REASONING';
type TierModels = Record<ComplexityTier, ModelDefinition[]> & { DEFAULT: ModelDefinition[] };

export const setups = {
  default: {
    code: {
      SIMPLE: [models.tw.qwen3Coder30b, models.macM5.qwen3Coder30b],
      MEDIUM: [models.macM5.devstralSmall2512, models.openRouter.geminiFlash, models.openRouter.glm5_2],
      COMPLEX: [models.openRouter.kimiCode, models.openRouter.gptLuna, models.openRouter.claudeSonnet],
      REASONING: [models.openRouter.claudeOpus, models.openRouter.gptTerra, models.openRouter.kimiReasoning],
      DEFAULT: [models.tw.qwen3Coder30b],
    },
  },
  'default-small-ctx': {
    code: {
      SIMPLE: [models.tw.essentialRnj1, models.tw.qwen25Coder14b],
      MEDIUM: [models.openRouter.geminiFlash, models.openRouter.glm5_2],
      COMPLEX: [models.openRouter.kimiCode, models.openRouter.gptLuna, models.openRouter.claudeSonnet],
      REASONING: [models.openRouter.claudeOpus, models.openRouter.gptTerra, models.openRouter.kimiReasoning],
      DEFAULT: [models.tw.essentialRnj1],
    },
  },
  'default-test': {
    code: {
      SIMPLE: [
        // models.tw.qwen3Coder30b,
        models.macM5.qwen3CoderNext,
        models.openRouter.geminiFlash,
      ],

      MEDIUM: [
        models.macM5.qwen3CoderNext,
        models.openRouter.geminiFlash,
        models.openRouter.glm5_2,
      ],

      COMPLEX: [
        models.openRouter.kimiCode,
        models.openRouter.gptLuna,
        models.openRouter.claudeSonnet,
      ],

      REASONING: [
        models.openRouter.claudeOpus,
        models.openRouter.gptTerra,
        models.openRouter.kimiReasoning,
      ],

      DEFAULT: [
        // models.tw.qwen3Coder30b,
        models.macM5.qwen3CoderNext,
        models.openRouter.geminiFlash,
      ],
    },
  },
  'huge-context': {
    code: {
      SIMPLE: [
        models.tw.qwen3Coder30b,
        models.macM5.nemotron3Super,
        models.openRouter.geminiFlash,
      ],

      MEDIUM: [
        models.macM5.nemotron3Super,
        models.openRouter.geminiFlash,
        models.openRouter.glm5_2,
      ],

      COMPLEX: [
        models.macM5.nemotron3Super,
        models.openRouter.kimiCode,
        models.openRouter.claudeSonnet,
      ],

      REASONING: [
        models.macM5.nemotron3Super,
        models.openRouter.claudeOpus,
        models.openRouter.gptTerra,
        models.openRouter.kimiReasoning,
      ],

      DEFAULT: [
        models.tw.qwen3Coder30b,
        models.macM5.nemotron3Super,
        models.openRouter.geminiFlash,
      ],
    },
  },
  'fast-local': {
    code: {
      SIMPLE: [
        models.tw.qwen3Coder30b,
        models.macM5.devstralSmall2512,
        models.openRouter.geminiFlash,
      ],

      MEDIUM: [
        models.macM5.devstralSmall2512,
        models.openRouter.geminiFlash,
        models.openRouter.glm5_2,
      ],

      COMPLEX: [
        models.openRouter.kimiCode,
        models.openRouter.gptLuna,
        models.openRouter.claudeSonnet,
      ],

      REASONING: [
        models.openRouter.claudeOpus,
        models.openRouter.gptTerra,
        models.openRouter.kimiReasoning,
      ],

      DEFAULT: [
        models.tw.qwen3Coder30b,
        models.macM5.devstralSmall2512,
        models.openRouter.geminiFlash,
      ],
    },
  },
  dev: {
    code: {
      SIMPLE: [
        // models.tw.qwen3Coder30b,
        models.macM5.qwen3CoderNext,
        models.openRouter.geminiFlash,
      ],

      MEDIUM: [
        models.macM5.qwen3CoderNext,
        models.openRouter.geminiFlash,
        models.openRouter.glm5_2,
      ],

      COMPLEX: [
        models.openRouter.kimiCode,
        models.openRouter.gptLuna,
        models.openRouter.claudeSonnet,
      ],

      REASONING: [
        models.openRouter.claudeOpus,
        models.openRouter.gptTerra,
        models.openRouter.kimiReasoning,
      ],

      DEFAULT: [
        // models.tw.qwen3Coder30b,
        models.macM5.qwen3CoderNext,
        models.openRouter.geminiFlash,
      ],
    },
  },
  test: {
    code: {
      SIMPLE: [
        // models.tw.qwen3Coder30b,
        models.macM5.qwen3CoderNext,
        models.openRouter.geminiFlash,
      ],

      MEDIUM: [
        models.macM5.qwen3CoderNext,
        models.openRouter.geminiFlash,
        models.openRouter.glm5_2,
      ],

      COMPLEX: [
        models.openRouter.kimiCode,
        models.openRouter.gptLuna,
        models.openRouter.claudeSonnet,
      ],

      REASONING: [
        models.openRouter.claudeOpus,
        models.openRouter.gptTerra,
        models.openRouter.kimiReasoning,
      ],

      DEFAULT: [
        // models.tw.qwen3Coder30b,
        models.macM5.qwen3CoderNext,
        models.openRouter.geminiFlash,
      ],
    },
  },
} satisfies Record<string, { code: TierModels }>;

export type SetupName = keyof typeof setups;

function envModels(name: string, fallback: ModelDefinition[]): ModelDefinition[] {
  const value = process.env[name];
  if (value === undefined) return fallback;
  const refs = value
    .split(',')
    .map((item) => item.trim())
    .filter(Boolean);
  if (refs.length === 0) throw new Error(`${name} must contain at least one model`);
  return refs.map(resolveModelRef);
}

function selectedModels(setupName: SetupName): TierModels {
  const code = setups[setupName].code;
  return {
    SIMPLE: envModels('BIFROST_CODE_SIMPLE', code.SIMPLE),
    MEDIUM: envModels('BIFROST_CODE_MEDIUM', code.MEDIUM),
    COMPLEX: envModels('BIFROST_CODE_COMPLEX', code.COMPLEX),
    REASONING: envModels('BIFROST_CODE_REASONING', code.REASONING),
    DEFAULT: envModels('BIFROST_CODE_DEFAULT', code.DEFAULT),
  };
}

export function setupModels(setupName: SetupName = 'default'): ModelDefinition[] {
  const selected = selectedModels(setupName);
  return [
    ...new Map(
      Object.values(selected)
        .flat()
        .map((item) => [item.ref, item]),
    ).values(),
  ];
}

function generateRoutingRule(
  id: string,
  tier: ComplexityTier | undefined,
  selected: ModelDefinition[],
  priority: number,
): RoutingRule {
  const targetCount = tier === undefined ? 1 : Math.min(selected.length, 2);
  const weights = targetCount === 1 ? [1] : [0.4, 0.6];
  const targets = selected.slice(0, targetCount).map((item, index) => ({
    provider: item.provider,
    model: item.model,
    weight: weights[index],
  }));

  return {
    id: `${id}-${tier?.toLowerCase() ?? 'default'}`,
    name: `${id} -> ${tier?.toLowerCase() ?? 'default'} -> ${selected[0].ref}`,
    description: `Complexity-tiered ${id} routing`,
    enabled: true,
    priority,
    scope: 'global',
    cel_expression: `model == "${id}"${tier ? ` && complexity_tier == "${tier}"` : ''}`,
    targets,
    fallbacks: selected.slice(targetCount).map((item) => item.ref),
  };
}

export function codeRules(setupName: SetupName = 'default'): RoutingRule[] {
  const selected = selectedModels(setupName);
  return [
    generateRoutingRule('code', 'SIMPLE', selected.SIMPLE, 11),
    generateRoutingRule('code', 'MEDIUM', selected.MEDIUM, 12),
    generateRoutingRule('code', 'COMPLEX', selected.COMPLEX, 13),
    generateRoutingRule('code', 'REASONING', selected.REASONING, 14),
    generateRoutingRule('code', undefined, selected.DEFAULT, 15),
  ];
}

export type { ModelRef };
