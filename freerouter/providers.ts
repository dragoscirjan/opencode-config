import type { ChatRequest, ChatResponse, StreamChunk } from 'freerouter'
import { BaseProvider } from 'freerouter/providers'

interface ProviderPricing {
  input: number
  output: number
}

interface OpenAIResponse {
  id: string
  choices: Array<{
    message: { content: string | null }
  }>
  usage?: {
    prompt_tokens?: number
    completion_tokens?: number
    total_tokens?: number
  }
}

interface OpenAIStreamChunk {
  choices?: Array<{
    delta?: { content?: string }
    finish_reason?: string | null
  }>
  usage?: {
    prompt_tokens?: number
    completion_tokens?: number
    total_tokens?: number
  }
}

export interface OpenAICompatibleProviderOptions {
  name: string
  baseUrl: string
  pricing?: Record<string, ProviderPricing>
}

export class OpenAICompatibleProvider extends BaseProvider {
  readonly name: string
  readonly #baseUrl: string
  readonly #pricing: Record<string, ProviderPricing>

  constructor(options: OpenAICompatibleProviderOptions) {
    super()
    this.name = options.name
    this.#baseUrl = options.baseUrl.replace(/\/$/, '')
    this.#pricing = options.pricing ?? {}
  }

  pricing(model: string): ProviderPricing {
    const price = Object.entries(this.#pricing).find(([prefix]) => model.startsWith(prefix))?.[1]

    return price ?? { input: 0, output: 0 }
  }

  async chat(request: ChatRequest, apiKey: string): Promise<ChatResponse> {
    const startedAt = Date.now()
    const response = await this.request(request, apiKey)
    const data = (await response.json()) as OpenAIResponse
    const choice = data.choices[0]

    if (choice === undefined) {
      throw new Error(`[FreeRouter/${this.name}] No choices returned`)
    }

    return {
      id: data.id || this.generateId(),
      model: this.modelId(request.model),
      content: choice.message.content ?? '',
      usage: this.usage(data.usage),
      latencyMs: this.elapsed(startedAt),
      provider: this.name,
      finishedAt: Date.now(),
    }
  }

  async *chatStream(request: ChatRequest, apiKey: string): AsyncIterable<StreamChunk> {
    const response = await this.request(request, apiKey, true)

    if (response.body === null) {
      throw new Error(`[FreeRouter/${this.name}] Empty stream body`)
    }

    const reader = response.body.getReader()
    const decoder = new TextDecoder()
    let buffer = ''
    let finalUsage: StreamChunk['usage']

    while (true) {
      const { done, value } = await reader.read()
      if (done) break

      buffer += decoder.decode(value, { stream: true })
      const lines = buffer.split('\n')
      buffer = lines.pop() ?? ''

      for (const line of lines) {
        if (!line.startsWith('data: ')) continue

        const body = line.slice(6).trim()
        if (body === '[DONE]') {
          yield { delta: '', done: true, ...(finalUsage !== undefined && { usage: finalUsage }) }
          return
        }

        let chunk: OpenAIStreamChunk
        try {
          chunk = JSON.parse(body) as OpenAIStreamChunk
        } catch {
          continue
        }

        finalUsage = chunk.usage === undefined ? finalUsage : this.usage(chunk.usage)
        const choice = chunk.choices?.[0]
        const delta = choice?.delta?.content ?? ''
        const finished = choice?.finish_reason !== undefined && choice.finish_reason !== null

        if (delta !== '' || finished) {
          yield {
            delta,
            done: finished,
            ...(finished && finalUsage !== undefined && { usage: finalUsage }),
          }
        }
      }
    }

    yield { delta: '', done: true, ...(finalUsage !== undefined && { usage: finalUsage }) }
  }

  async request(request: ChatRequest, apiKey: string, stream = false): Promise<Response> {
    const response = await fetch(`${this.#baseUrl}/chat/completions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(apiKey !== '' && { Authorization: `Bearer ${apiKey}` }),
      },
      body: JSON.stringify({
        model: this.modelId(request.model),
        messages: request.messages,
        ...(request.temperature !== undefined && { temperature: request.temperature }),
        ...(request.maxTokens !== undefined && { max_tokens: request.maxTokens }),
        ...(stream && {
          stream: true,
          stream_options: { include_usage: true },
        }),
      }),
    })

    if (!response.ok) {
      const body = await response.text()
      throw new Error(`[FreeRouter/${this.name}] Upstream request failed (${response.status}): ${body.slice(0, 500)}`)
    }

    return response
  }

  generateId(): string {
    return `fr-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`
  }

  elapsed(startedAt: number): number {
    return Date.now() - startedAt
  }

  async throwHttpError(response: Response, provider: string): Promise<never> {
    const body = await response.text()
    throw new Error(`[FreeRouter/${provider}] Upstream request failed (${response.status}): ${body.slice(0, 500)}`)
  }

  modelId(model: string): string {
    return model.startsWith(`${this.name}/`) ? model.slice(this.name.length + 1) : model
  }

  usage(usage: OpenAIResponse['usage']): NonNullable<StreamChunk['usage']> {
    return {
      promptTokens: usage?.prompt_tokens ?? 0,
      completionTokens: usage?.completion_tokens ?? 0,
      totalTokens: usage?.total_tokens ?? 0,
    }
  }
}

export const openRouterProviderId = 'openrouter'
export const lmStudioMacM5ProviderId = 'lmstudio-m5'
export const lmStudioTwNixosProviderId = 'lmstudio-tw'

export const openRouterModels = [
  'google/gemini-3.6-flash',
  'z-ai/glm-5.2',
  'moonshotai/kimi-k2.7-code',
  'openai/gpt-5.6-luna',
  'anthropic/claude-sonnet-5',
  'anthropic/claude-opus-5',
  'openai/gpt-5.6-terra',
  'moonshotai/kimi-k3',
] as const

export const lmStudioMacM5Models = [
  'mistralai/devstral-small-2-2512',
  'qwen/qwen3.6-35b-a3b',
  'zai-org/glm-4.7-flash',
  'nvidia/nemotron-3-super',
  'openai/gpt-oss-120b',
] as const

export const lmStudioTwNixosModels = [
  'north-mini-code-1.0',
  'qwen/qwen3.6-27b',
  'google/gemma-4-31b',
  'qwen/qwen3-coder-30b',
] as const

export const allModels = [
  ...openRouterModels.map(m => `${openRouterProviderId}/${m}`),
  ...lmStudioMacM5Models.map(m => `${lmStudioMacM5ProviderId}/${m}`),
  ...lmStudioTwNixosModels.map(m => `${lmStudioTwNixosProviderId}/${m}`),
]

export const providerToggles = {
  [openRouterProviderId]: { enabled: true },
  [lmStudioMacM5ProviderId]: { enabled: true },
  [lmStudioTwNixosProviderId]: { enabled: true },
}

export function providers(): OpenAICompatibleProvider[] {
  return [
    new OpenAICompatibleProvider({
      name: openRouterProviderId,
      baseUrl: process.env.OPENROUTER_BASE_URL ?? 'https://openrouter.ai/api/v1',
    }),
    new OpenAICompatibleProvider({
      name: lmStudioMacM5ProviderId,
      baseUrl: process.env.FREEROUTER_LMSTUDIO_M5_BASE_URL ?? 'http://mac-m5.trilu.lila:1234/v1',
    }),
    new OpenAICompatibleProvider({
      name: lmStudioTwNixosProviderId,
      baseUrl: process.env.FREEROUTER_LMSTUDIO_TW_BASE_URL ?? 'http://tw-nixos.trilu.lila:1234/v1',
    }),
  ]
}
