#!/usr/bin/env node

import { FreeRouter, validateConfig } from 'freerouter'
import { config, port } from './config.js'
import { registerConfiguredKeys } from './keys.js'
import { providers } from './providers.js'
import { createServer } from './server.js'

const validation = validateConfig(config)
if (!validation.valid) {
  throw new Error(`[FreeRouter] Invalid configuration: ${validation.errors.join('; ')}`)
}

const unsupportedValidatorKeys = new Set(['spendPersistence', 'costOptimization', 'rules'])
for (const warning of validation.warnings) {
  if (!unsupportedValidatorKeys.has(warning.match(/"([^"]+)"/)?.[1] ?? '')) {
    process.stderr.write(`[FreeRouter] Configuration warning: ${warning}\n`)
  }
}

const router = new FreeRouter(config)
for (const provider of providers()) {
  router.registerProvider(provider)
}
registerConfiguredKeys(router)
await router.init()

const server = createServer(router).listen(port, () => {
  process.stdout.write(`[FreeRouter] Listening on http://127.0.0.1:${port}/v1\n`)
})

let stopping = false
async function shutdown(signal: string): Promise<void> {
  if (stopping) return
  stopping = true

  process.stdout.write(`[FreeRouter] Received ${signal}; shutting down\n`)
  server.close(async error => {
    if (error !== undefined) {
      process.stderr.write(`[FreeRouter] HTTP server shutdown failed: ${error.message}\n`)
      process.exitCode = 1
    }

    await router.shutdown()
  })
}

process.once('SIGINT', () => void shutdown('SIGINT'))
process.once('SIGTERM', () => void shutdown('SIGTERM'))
