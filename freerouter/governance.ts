import type { CostOptimizationConfig, Rule, RulesMode } from 'freerouter'
import { openRouterProviderId } from './providers.js'

// ─── Tier model lists (mirror bifrost's env-overridable ladders) ───────────
// FreeRouter has no complexity classifier, so the tier lists are exported
// for reference and env override only. The rules below pin `code` to the
// SIMPLE tier by default — the same safety-net behaviour as bifrost's
// `code-default` rule.

export const FREEROUTER_CODE_SIMPLE = (process.env.FREEROUTER_CODE_SIMPLE ?? [
  `${openRouterProviderId}/z-ai/glm-5.2`,
].join(',')).split(',').map(m => m.trim()).filter(Boolean)

export const FREEROUTER_CODE_MEDIUM = (process.env.FREEROUTER_CODE_MEDIUM ?? [
  `${openRouterProviderId}/google/gemini-3.6-flash`,
  `${openRouterProviderId}/z-ai/glm-5.2`,
].join(',')).split(',').map(m => m.trim()).filter(Boolean)

export const FREEROUTER_CODE_COMPLEX = (process.env.FREEROUTER_CODE_COMPLEX ?? [
  `${openRouterProviderId}/moonshotai/kimi-k2.7-code`,
  `${openRouterProviderId}/openai/gpt-5.6-luna`,
  `${openRouterProviderId}/anthropic/claude-sonnet-5`,
].join(',')).split(',').map(m => m.trim()).filter(Boolean)

export const FREEROUTER_CODE_REASONING = (process.env.FREEROUTER_CODE_REASONING ?? [
  `${openRouterProviderId}/anthropic/claude-opus-5`,
  `${openRouterProviderId}/openai/gpt-5.6-terra`,
  `${openRouterProviderId}/moonshotai/kimi-k3`,
].join(',')).split(',').map(m => m.trim()).filter(Boolean)

// ─── Rules ─────────────────────────────────────────────────────────────────
// FreeRouter's RuleMatch supports `metadata` key-value matching. Since
// FreeRouter has no `complexity_tier` CEL variable, clients can pass
// `metadata: { tier: "complex" }` in the request to select a tier.
// Without metadata, `code` falls through to the default (SIMPLE) pin.

export const rulesMode: RulesMode = 'pin-wins'

export const rules: Rule[] = [
  {
    id: 'code-reasoning',
    priority: 40,
    match: { modelPattern: 'code', metadata: { tier: 'reasoning' } },
    action: { type: 'pin', model: FREEROUTER_CODE_REASONING[0] },
  },
  {
    id: 'code-complex',
    priority: 30,
    match: { modelPattern: 'code', metadata: { tier: 'complex' } },
    action: { type: 'pin', model: FREEROUTER_CODE_COMPLEX[0] },
  },
  {
    id: 'code-medium',
    priority: 20,
    match: { modelPattern: 'code', metadata: { tier: 'medium' } },
    action: { type: 'pin', model: FREEROUTER_CODE_MEDIUM[0] },
  },
  // Default: no metadata.tier → pin to SIMPLE (bifrost's safety-net behaviour)
  {
    id: 'code',
    priority: 10,
    match: { modelPattern: 'code' },
    action: { type: 'pin', model: FREEROUTER_CODE_SIMPLE[0] },
  },
  {
    id: 'design',
    priority: 10,
    match: { modelPattern: 'design' },
    action: { type: 'pin', model: `${openRouterProviderId}/google/gemini-3.6-flash` },
  },
]

export const costOptimization: CostOptimizationConfig = {
  strategy: 'performance',
  candidateModels: [],
}
