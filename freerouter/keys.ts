import type { FreeRouter } from 'freerouter'
import { lmStudioMacM5ProviderId, lmStudioTwNixosProviderId, openRouterProviderId } from './providers.js'

export const userId = 'opencode'

export function registerConfiguredKeys(router: FreeRouter): void {
  const openRouterKey = process.env.OPENROUTER_API_KEY
  if (openRouterKey !== undefined && openRouterKey !== '') {
    router.setKey(userId, openRouterProviderId, openRouterKey)
  }

  router.setKey(userId, lmStudioMacM5ProviderId, process.env.FREEROUTER_LMSTUDIO_M5_API_KEY ?? '')
  router.setKey(userId, lmStudioTwNixosProviderId, process.env.FREEROUTER_LMSTUDIO_TW_API_KEY ?? '')
}
