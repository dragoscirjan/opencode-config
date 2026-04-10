import { tool } from "@opencode-ai/plugin"
import { readFileSync, writeFileSync, mkdirSync } from "fs"
import { join, dirname } from "path"

const API_BASE = "https://api.tripo3d.ai/v2/openapi"

const MODEL_P1 = "P1-20260311"
const MODEL_V31 = "v3.1-20260211"

const QUALITY_PRESETS: Record<string, { modelVersion: string; textureQuality: string; costCents: number }> = {
  default: { modelVersion: MODEL_P1, textureQuality: "standard", costCents: 50 },
  high: { modelVersion: MODEL_V31, textureQuality: "detailed", costCents: 40 },
}

async function uploadImage(apiKey: string, imagePath: string): Promise<string> {
  const imageData = readFileSync(imagePath)
  const blob = new Blob([imageData], { type: "image/png" })

  const form = new FormData()
  form.append("file", blob, "image.png")

  const resp = await fetch(`${API_BASE}/upload`, {
    method: "POST",
    headers: { Authorization: `Bearer ${apiKey}` },
    body: form,
  })

  if (!resp.ok) {
    const text = await resp.text()
    throw new Error(`Upload failed (${resp.status}): ${text}`)
  }

  const data = (await resp.json()) as { data: { image_token: string } }
  return data.data.image_token
}

async function createTask(
  apiKey: string,
  imageToken: string,
  modelVersion: string,
  textureQuality: string,
): Promise<string> {
  const payload: Record<string, unknown> = {
    type: "image_to_model",
    model_version: modelVersion,
    file: { type: "png", file_token: imageToken },
    texture: true,
    pbr: true,
  }

  if (textureQuality !== "standard") {
    payload.texture_quality = textureQuality
  }

  const resp = await fetch(`${API_BASE}/task`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
  })

  if (!resp.ok) {
    const text = await resp.text()
    throw new Error(`Task creation failed (${resp.status}): ${text}`)
  }

  const data = (await resp.json()) as { data: { task_id: string } }
  return data.data.task_id
}

async function pollTask(
  apiKey: string,
  taskId: string,
  timeout: number,
  interval: number,
): Promise<Record<string, unknown>> {
  const start = Date.now()

  while (Date.now() - start < timeout * 1000) {
    const resp = await fetch(`${API_BASE}/task/${taskId}`, {
      headers: { Authorization: `Bearer ${apiKey}` },
    })

    if (!resp.ok) {
      const text = await resp.text()
      throw new Error(`Poll failed (${resp.status}): ${text}`)
    }

    const json = (await resp.json()) as { data: { status: string; output?: Record<string, string> } }
    const { status, output } = json.data

    if (status === "success") return json.data as Record<string, unknown>
    if (status === "failed" || status === "cancelled" || status === "unknown") {
      throw new Error(`Task ${taskId} failed with status: ${status}`)
    }

    await new Promise((r) => setTimeout(r, interval * 1000))
  }

  throw new Error(`Task ${taskId} timed out after ${timeout}s`)
}

async function downloadModel(taskResult: Record<string, unknown>, outputPath: string): Promise<void> {
  const output = taskResult.output as Record<string, string> | undefined
  const modelUrl = output?.pbr_model || output?.base_model
  if (!modelUrl) {
    throw new Error(`No model URL in task output: ${JSON.stringify(Object.keys(output ?? {}))}`)
  }

  const resp = await fetch(modelUrl)
  if (!resp.ok) {
    throw new Error(`Download failed (${resp.status})`)
  }

  const buf = Buffer.from(await resp.arrayBuffer())
  mkdirSync(dirname(outputPath), { recursive: true })
  writeFileSync(outputPath, buf)
}

export default tool({
  description:
    "Convert a PNG image to a GLB 3D model via Tripo3D API. " +
    "Two quality presets: default (P1, low-poly game-optimized, 50c) and high (v3.1, HD textures, 40c). " +
    "Requires TRIPO3D_API_KEY environment variable. " +
    "Returns JSON: {ok, path, cost_cents, task_id}.",
  args: {
    image: tool.schema.string().describe("Input PNG image path"),
    output: tool.schema.string().describe("Output GLB file path"),
    quality: tool.schema
      .string()
      .describe('Quality preset: "default" (P1, low-poly, 50c) or "high" (v3.1, HD, 40c). Default: "default"')
      .optional(),
    timeout: tool.schema
      .string()
      .describe("Timeout in seconds for task completion. Default: 300")
      .optional(),
  },
  async execute(args, context) {
    const cwd = context.worktree ?? context.directory
    const resolve = (p: string) => (p.startsWith("/") ? p : join(cwd, p))

    const imagePath = args.image?.trim()
    if (!imagePath) return JSON.stringify({ ok: false, error: "image is required" })

    const outputPath = args.output?.trim()
    if (!outputPath) return JSON.stringify({ ok: false, error: "output is required" })

    const quality = args.quality?.trim() ?? "default"
    const timeout = parseInt(args.timeout ?? "300", 10)

    const preset = QUALITY_PRESETS[quality]
    if (!preset) {
      return JSON.stringify({
        ok: false,
        error: `Unknown quality preset: "${quality}". Use "default" or "high"`,
      })
    }

    const apiKey = process.env.TRIPO3D_API_KEY
    if (!apiKey) {
      return JSON.stringify({ ok: false, error: "TRIPO3D_API_KEY environment variable not set" })
    }

    const resolvedImage = resolve(imagePath)
    const resolvedOutput = resolve(outputPath)

    try {
      // 1. Upload image
      const imageToken = await uploadImage(apiKey, resolvedImage)

      // 2. Create task
      const taskId = await createTask(apiKey, imageToken, preset.modelVersion, preset.textureQuality)

      // 3. Poll until complete
      const result = await pollTask(apiKey, taskId, timeout, 5)

      // 4. Download GLB
      await downloadModel(result, resolvedOutput)

      return JSON.stringify({
        ok: true,
        path: resolvedOutput,
        cost_cents: preset.costCents,
        task_id: taskId,
      })
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err)
      return JSON.stringify({ ok: false, error: msg })
    }
  },
})
