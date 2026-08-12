import type { FreeRouter } from 'freerouter'
import { createMiddleware } from 'freerouter/adapters'
import express, { type Express } from 'express'
import { userId } from './keys.js'

export function createServer(router: FreeRouter): Express {
  const app = express()

  app.use(express.json({ limit: '4mb' }))
  app.post('/v1/chat/completions', createMiddleware(router, { extractUserId: () => userId }))
  app.get('/health', (_request, response) => {
    response.json(router.healthCheck())
  })
  app.get('/metrics', (_request, response) => {
    response.json(router.metrics())
  })

  return app
}
