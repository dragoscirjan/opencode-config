import { join } from 'node:path'
import type { RouterConfig } from 'freerouter'
import { FileSpendStore } from 'freerouter/adapters'
import { allModels, providerToggles } from './providers.js'
import { costOptimization, rules, rulesMode } from './governance.js'

export const port = Number(process.env.FREEROUTER_PORT ?? 8081)
export const appDir = process.env.FREEROUTER_APP_DIR ?? join(import.meta.dirname, 'data')

export const config: RouterConfig = {
  defaultModel: 'code',
  allowedModels: ['code', 'design', ...allModels],
  maxInputLength: 100_000,
  promptInjectionGuard: true,
  providers: providerToggles,
  spendPersistence: {
    store: new FileSpendStore(join(appDir, 'spend.json')),
    intervalMs: 60_000,
  },
  costOptimization,
  rules: {
    rules,
    mode: rulesMode,
  },
}
