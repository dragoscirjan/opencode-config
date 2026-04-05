import { tool } from "@opencode-ai/plugin"
import { readFileSync, writeFileSync, existsSync, mkdirSync } from "fs"
import { join, dirname } from "path"

// --- Budget system ---

interface BudgetFile {
  budget_cents: number
  log: Array<Record<string, number>>
}

function loadBudget(budgetPath: string): BudgetFile | null {
  if (!existsSync(budgetPath)) return null
  return JSON.parse(readFileSync(budgetPath, "utf-8")) as BudgetFile
}

function spentTotal(budget: BudgetFile): number {
  return budget.log.reduce((sum, entry) => sum + Object.values(entry).reduce((a, b) => a + b, 0), 0)
}

function checkBudget(budgetPath: string, costCents: number): string | null {
  const budget = loadBudget(budgetPath)
  if (!budget) return null
  const spent = spentTotal(budget)
  const remaining = budget.budget_cents - spent
  if (costCents > remaining) {
    return `Budget exceeded: need ${costCents}c but only ${remaining}c remaining (${spent}c of ${budget.budget_cents}c spent)`
  }
  return null
}

function recordSpend(budgetPath: string, costCents: number, service: string): void {
  const budget = loadBudget(budgetPath)
  if (!budget) return
  budget.log.push({ [service]: costCents })
  writeFileSync(budgetPath, JSON.stringify(budget, null, 2) + "\n")
}

// --- Gemini image backend ---

const GEMINI_MODEL = "gemini-3.1-flash-image-preview"
const GEMINI_COSTS: Record<string, number> = { "512": 5, "1K": 7, "2K": 10, "4K": 15 }
const GEMINI_SIZES = ["512", "1K", "2K", "4K"]
const GEMINI_ASPECT_RATIOS = [
  "1:1", "1:4", "1:8", "2:3", "3:2", "3:4", "4:1", "4:3",
  "4:5", "5:4", "8:1", "9:16", "16:9", "21:9",
]

// --- xAI Grok image backend ---

const GROK_IMAGE_MODEL = "grok-imagine-image"
const GROK_COST = 2
const GROK_SIZES = ["1K", "2K"]
const GROK_ASPECT_RATIOS = [
  "1:1", "16:9", "9:16", "4:3", "3:4", "3:2", "2:3",
  "2:1", "1:2", "19.5:9", "9:19.5", "20:9", "9:20", "auto",
]

// --- xAI Grok video backend ---

const GROK_VIDEO_MODEL = "grok-imagine-video"
const VIDEO_COST_PER_SEC = 5

function mimeForImage(path: string): string {
  const ext = path.toLowerCase().split(".").pop()
  return { jpg: "image/jpeg", jpeg: "image/jpeg", png: "image/png", webp: "image/webp" }[ext ?? ""] ?? "image/png"
}

function imageDataUri(imagePath: string): string {
  const b64 = readFileSync(imagePath).toString("base64")
  return `data:${mimeForImage(imagePath)};base64,${b64}`
}

async function generateGemini(
  prompt: string,
  outputPath: string,
  size: string,
  aspectRatio: string,
  refImagePath: string | null,
): Promise<{ ok: boolean; path?: string; cost_cents?: number; error?: string }> {
  let genai: typeof import("@google/genai")
  try {
    genai = await import("@google/genai")
  } catch {
    return { ok: false, error: "@google/genai is not installed. Run: npm install @google/genai" }
  }

  const apiKey = process.env.GEMINI_API_KEY || process.env.GOOGLE_API_KEY
  if (!apiKey) return { ok: false, error: "GEMINI_API_KEY or GOOGLE_API_KEY not set" }

  const cost = GEMINI_COSTS[size]
  const client = new genai.GoogleGenAI({ apiKey })

  const parts: Array<Record<string, unknown>> = []
  if (refImagePath) {
    const data = readFileSync(refImagePath).toString("base64")
    parts.push({ inlineData: { mimeType: mimeForImage(refImagePath), data } })
  }
  parts.push({ text: prompt })

  try {
    const response = await client.models.generateContent({
      model: GEMINI_MODEL,
      contents: [{ role: "user", parts }],
      config: {
        responseModalities: ["IMAGE"],
        // @ts-expect-error -- imageConfig may not be in type defs yet
        imageConfig: { imageSize: size, aspectRatio },
      },
    })

    const candidates = response.candidates
    if (!candidates?.length) {
      const reason = candidates?.[0]?.finishReason ?? "unknown"
      return { ok: false, error: `Generation blocked (reason: ${reason})` }
    }

    for (const part of candidates[0].content?.parts ?? []) {
      const inlineData = (part as Record<string, unknown>).inlineData as
        | { data: string; mimeType: string }
        | undefined
      if (inlineData?.data) {
        mkdirSync(dirname(outputPath), { recursive: true })
        writeFileSync(outputPath, Buffer.from(inlineData.data, "base64"))
        return { ok: true, path: outputPath, cost_cents: cost }
      }
    }

    return { ok: false, error: "No image returned" }
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err)
    return { ok: false, error: msg }
  }
}

async function generateGrokImage(
  prompt: string,
  outputPath: string,
  size: string,
  aspectRatio: string,
  refImagePath: string | null,
): Promise<{ ok: boolean; path?: string; cost_cents?: number; error?: string }> {
  const apiKey = process.env.XAI_API_KEY
  if (!apiKey) return { ok: false, error: "XAI_API_KEY environment variable not set" }

  const body: Record<string, unknown> = {
    model: GROK_IMAGE_MODEL,
    prompt,
    response_format: "b64_json",
    n: 1,
  }

  if (refImagePath) {
    body.image_url = imageDataUri(refImagePath)
  }
  if (aspectRatio && aspectRatio !== "auto") {
    body.aspect_ratio = aspectRatio
  }
  if (size) {
    body.resolution = size.toLowerCase()
  }

  try {
    const resp = await fetch("https://api.x.ai/v1/images/generations", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(body),
    })

    if (!resp.ok) {
      const text = await resp.text()
      return { ok: false, error: `xAI API error (${resp.status}): ${text}` }
    }

    const data = (await resp.json()) as { data: Array<{ b64_json?: string; url?: string }> }
    const imageData = data.data?.[0]

    if (imageData?.b64_json) {
      // xAI may return JPEG — convert to PNG via sharp
      let sharp: typeof import("sharp")
      try {
        sharp = await import("sharp")
      } catch {
        // No sharp — save raw (likely JPEG)
        mkdirSync(dirname(outputPath), { recursive: true })
        writeFileSync(outputPath, Buffer.from(imageData.b64_json, "base64"))
        return { ok: true, path: outputPath, cost_cents: GROK_COST }
      }
      const buf = Buffer.from(imageData.b64_json, "base64")
      mkdirSync(dirname(outputPath), { recursive: true })
      await sharp.default(buf).png().toFile(outputPath)
      return { ok: true, path: outputPath, cost_cents: GROK_COST }
    }

    if (imageData?.url) {
      const dlResp = await fetch(imageData.url)
      if (!dlResp.ok) return { ok: false, error: "Failed to download image from URL" }
      const buf = Buffer.from(await dlResp.arrayBuffer())
      mkdirSync(dirname(outputPath), { recursive: true })
      writeFileSync(outputPath, buf)
      return { ok: true, path: outputPath, cost_cents: GROK_COST }
    }

    return { ok: false, error: "No image data in response" }
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err)
    return { ok: false, error: msg }
  }
}

async function generateVideo(
  prompt: string,
  outputPath: string,
  refImagePath: string,
  duration: number,
  resolution: string,
): Promise<{ ok: boolean; path?: string; cost_cents?: number; error?: string }> {
  const apiKey = process.env.XAI_API_KEY
  if (!apiKey) return { ok: false, error: "XAI_API_KEY environment variable not set" }

  const body: Record<string, unknown> = {
    model: GROK_VIDEO_MODEL,
    prompt,
    image_url: imageDataUri(refImagePath),
    duration,
    aspect_ratio: "1:1",
    resolution,
  }

  try {
    const resp = await fetch("https://api.x.ai/v1/videos/generations", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(body),
    })

    if (!resp.ok) {
      const text = await resp.text()
      return { ok: false, error: `xAI video API error (${resp.status}): ${text}` }
    }

    const data = (await resp.json()) as { data: Array<{ url?: string }> }
    const videoUrl = data.data?.[0]?.url

    if (!videoUrl) return { ok: false, error: "No video URL in response" }

    // Download video
    const dlResp = await fetch(videoUrl, { signal: AbortSignal.timeout(120_000) })
    if (!dlResp.ok) return { ok: false, error: `Failed to download video (${dlResp.status})` }

    const buf = Buffer.from(await dlResp.arrayBuffer())
    mkdirSync(dirname(outputPath), { recursive: true })
    writeFileSync(outputPath, buf)

    const cost = duration * VIDEO_COST_PER_SEC
    return { ok: true, path: outputPath, cost_cents: cost }
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err)
    return { ok: false, error: msg }
  }
}

export default tool({
  description:
    "Generate game art assets: images (Gemini 5-15c or Grok 2c), videos (Grok 5c/sec), or manage budget. " +
    "Commands: image, video, set_budget, get_budget. " +
    "Budget tracking via assets/budget.json. Returns JSON result.",
  args: {
    command: tool.schema
      .string()
      .describe('Command: "image", "video", "set_budget", "get_budget"'),
    prompt: tool.schema
      .string()
      .describe("Generation prompt (required for image/video)")
      .optional(),
    model: tool.schema
      .string()
      .describe('Image backend: "gemini" (5-15c, precise) or "grok" (2c, fast). Default: "grok"')
      .optional(),
    size: tool.schema
      .string()
      .describe('Resolution. Gemini: 512, 1K, 2K, 4K. Grok: 1K, 2K. Default: "1K"')
      .optional(),
    aspectRatio: tool.schema
      .string()
      .describe('Aspect ratio, e.g. "1:1", "16:9". Default: "1:1"')
      .optional(),
    image: tool.schema
      .string()
      .describe("Reference image path for image-to-image or video starting frame")
      .optional(),
    output: tool.schema
      .string()
      .describe("Output file path (required for image/video)")
      .optional(),
    duration: tool.schema
      .string()
      .describe("Video duration in seconds, 1-15. Required for video command.")
      .optional(),
    resolution: tool.schema
      .string()
      .describe('Video resolution: "480p" or "720p". Default: "720p"')
      .optional(),
    cents: tool.schema
      .string()
      .describe("Budget amount in cents (for set_budget command)")
      .optional(),
  },
  async execute(args, context) {
    const cwd = context.worktree ?? context.directory
    const resolve = (p: string) => (p.startsWith("/") ? p : join(cwd, p))
    const budgetPath = join(cwd, "assets", "budget.json")

    const command = args.command?.trim()

    // --- set_budget ---
    if (command === "set_budget") {
      const cents = parseInt(args.cents ?? "0", 10)
      if (cents <= 0) return JSON.stringify({ ok: false, error: "cents must be a positive integer" })

      mkdirSync(dirname(budgetPath), { recursive: true })
      const budget: BudgetFile = { budget_cents: cents, log: [] }
      if (existsSync(budgetPath)) {
        const old = loadBudget(budgetPath)
        if (old) budget.log = old.log
      }
      writeFileSync(budgetPath, JSON.stringify(budget, null, 2) + "\n")
      const spent = spentTotal(budget)
      return JSON.stringify({ ok: true, budget_cents: cents, spent_cents: spent, remaining_cents: cents - spent })
    }

    // --- get_budget ---
    if (command === "get_budget") {
      const budget = loadBudget(budgetPath)
      if (!budget) return JSON.stringify({ ok: true, budget_cents: null, note: "No budget file found" })
      const spent = spentTotal(budget)
      return JSON.stringify({
        ok: true,
        budget_cents: budget.budget_cents,
        spent_cents: spent,
        remaining_cents: budget.budget_cents - spent,
        log_entries: budget.log.length,
      })
    }

    // --- image ---
    if (command === "image") {
      const prompt = args.prompt?.trim()
      if (!prompt) return JSON.stringify({ ok: false, error: "prompt is required" })
      const output = args.output?.trim()
      if (!output) return JSON.stringify({ ok: false, error: "output is required" })

      const backend = args.model?.trim() ?? "grok"
      const size = args.size?.trim() ?? "1K"
      const aspectRatio = args.aspectRatio?.trim() ?? "1:1"
      const refImage = args.image?.trim() ? resolve(args.image.trim()) : null

      // Validate backend + size
      if (backend === "gemini") {
        if (!GEMINI_SIZES.includes(size)) {
          return JSON.stringify({ ok: false, error: `Gemini does not support size ${size}. Use: ${GEMINI_SIZES.join(", ")}` })
        }
      } else if (backend === "grok") {
        if (!GROK_SIZES.includes(size)) {
          return JSON.stringify({ ok: false, error: `Grok does not support size ${size}. Use: ${GROK_SIZES.join(", ")}` })
        }
      } else {
        return JSON.stringify({ ok: false, error: `Unknown backend: "${backend}". Use "gemini" or "grok"` })
      }

      // Budget check
      const cost = backend === "gemini" ? GEMINI_COSTS[size] : GROK_COST
      const budgetErr = checkBudget(budgetPath, cost)
      if (budgetErr) return JSON.stringify({ ok: false, error: budgetErr })

      const resolvedOutput = resolve(output)
      let result: { ok: boolean; path?: string; cost_cents?: number; error?: string }

      if (backend === "gemini") {
        result = await generateGemini(prompt, resolvedOutput, size, aspectRatio, refImage)
      } else {
        result = await generateGrokImage(prompt, resolvedOutput, size, aspectRatio, refImage)
      }

      if (result.ok && result.cost_cents) {
        recordSpend(budgetPath, result.cost_cents, backend)
      }
      return JSON.stringify(result)
    }

    // --- video ---
    if (command === "video") {
      const prompt = args.prompt?.trim()
      if (!prompt) return JSON.stringify({ ok: false, error: "prompt is required" })
      const output = args.output?.trim()
      if (!output) return JSON.stringify({ ok: false, error: "output is required" })
      const refImage = args.image?.trim()
      if (!refImage) return JSON.stringify({ ok: false, error: "image (starting frame) is required for video" })

      const duration = parseInt(args.duration ?? "0", 10)
      if (duration < 1 || duration > 15) {
        return JSON.stringify({ ok: false, error: "duration must be 1-15 seconds" })
      }
      const resolution = args.resolution?.trim() ?? "720p"
      const cost = duration * VIDEO_COST_PER_SEC

      const budgetErr = checkBudget(budgetPath, cost)
      if (budgetErr) return JSON.stringify({ ok: false, error: budgetErr })

      const result = await generateVideo(prompt, resolve(output), resolve(refImage), duration, resolution)
      if (result.ok && result.cost_cents) {
        recordSpend(budgetPath, result.cost_cents, "xai-video")
      }
      return JSON.stringify(result)
    }

    return JSON.stringify({
      ok: false,
      error: `Unknown command: "${command}". Use "image", "video", "set_budget", or "get_budget"`,
    })
  },
})
