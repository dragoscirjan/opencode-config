import { tool } from "@opencode-ai/plugin"
import { mkdirSync, readdirSync } from "fs"
import { join } from "path"

// Mask coverage thresholds for regime auto-detection
const MASK_MIN_PCT = 5.0
const MASK_MAX_PCT = 70.0
const MASK_MIN_PX = 100

// Default thresholds per regime
const DEFAULTS: Record<string, { bgThresh: number; fgThresh: number }> = {
  trust: { bgThresh: 0.05, fgThresh: 1.0 },
  adapt: { bgThresh: 0.05, fgThresh: 0.2 },
  color: { bgThresh: 0.1, fgThresh: 0.1 },
}

/** Sample background color from 2x2 blocks at all 4 corners. */
function sampleBgColor(rgb: Buffer, width: number, height: number): [number, number, number] {
  const block = 2
  let r = 0, g = 0, b = 0, count = 0

  const sample = (x: number, y: number) => {
    const idx = (y * width + x) * 3
    r += rgb[idx]; g += rgb[idx + 1]; b += rgb[idx + 2]
    count++
  }

  for (let dy = 0; dy < block; dy++) {
    for (let dx = 0; dx < block; dx++) {
      sample(dx, dy)                                 // top-left
      sample(width - 1 - dx, dy)                     // top-right
      sample(dx, height - 1 - dy)                    // bottom-left
      sample(width - 1 - dx, height - 1 - dy)        // bottom-right
    }
  }

  return [r / count / 255, g / count / 255, b / count / 255]
}

/** Compute alpha from compositing equation: pixel = alpha * fg + (1-alpha) * bg. */
function computeAlphaColor(
  rgb: Buffer,
  width: number,
  height: number,
  bg: [number, number, number],
): Float32Array {
  const pixels = width * height
  const alpha = new Float32Array(pixels)

  for (let i = 0; i < pixels; i++) {
    const r = rgb[i * 3] / 255
    const g = rgb[i * 3 + 1] / 255
    const b = rgb[i * 3 + 2] / 255

    let a = 0
    const channels = [r - bg[0], g - bg[1], b - bg[2]]
    for (let c = 0; c < 3; c++) {
      if (1.0 - bg[c] > 0.05) {
        a = Math.max(a, Math.max(channels[c], 0) / (1.0 - bg[c]))
      }
      if (bg[c] > 0.05) {
        a = Math.max(a, Math.max(-channels[c], 0) / bg[c])
      }
    }
    alpha[i] = Math.min(Math.max(a, 0), 1)
  }
  return alpha
}

/** Detect regime from mask coverage. */
function detectRegime(maskSoft: Float32Array, totalPixels: number): string {
  let fgCount = 0
  for (let i = 0; i < maskSoft.length; i++) {
    if (maskSoft[i] > 0.5) fgCount++
  }
  const pct = (fgCount / totalPixels) * 100
  if (fgCount < MASK_MIN_PX || pct < MASK_MIN_PCT) return "color"
  if (pct > MASK_MAX_PCT) return "adapt"
  return "trust"
}

/** Recover foreground: fg = (pixel - (1-a)*bg) / a. */
function recoverForeground(
  rgb: Buffer,
  alpha: Float32Array,
  bg: [number, number, number],
  width: number,
  height: number,
): Buffer {
  const pixels = width * height
  const out = Buffer.alloc(pixels * 4)

  for (let i = 0; i < pixels; i++) {
    const a = alpha[i]
    const safeA = a > 0.02 ? a : 1.0

    for (let c = 0; c < 3; c++) {
      const pixel = rgb[i * 3 + c] / 255
      let fg = (pixel - (1.0 - a) * bg[c]) / safeA
      fg = Math.min(Math.max(fg, 0), 1)
      if (a < 0.02) fg = 0
      out[i * 4 + c] = Math.round(fg * 255)
    }
    out[i * 4 + 3] = Math.round(Math.max(a < 0.01 ? 0 : a, 0) * 255)
  }
  return out
}

/** Combine color alpha + mask alpha per regime, return final alpha. */
function combineAlpha(
  alphaColor: Float32Array,
  maskSoft: Float32Array,
  regime: string,
  bgThresh: number,
  fgThresh: number,
): Float32Array {
  const pixels = alphaColor.length
  const alpha = new Float32Array(pixels)

  for (let i = 0; i < pixels; i++) {
    const ac = alphaColor[i]
    const ms = maskSoft[i]

    if (regime === "color") {
      alpha[i] = ac < bgThresh ? ac : ac
    } else if (regime === "trust") {
      const isBg = ac < bgThresh || ms < 0.05
      alpha[i] = isBg ? ac : Math.max(ac, ms)
    } else {
      // adapt
      const thresh = bgThresh + ms * (fgThresh - bgThresh)
      const isBg = ac < thresh
      alpha[i] = isBg ? ac : Math.max(ac, ms)
    }

    if (alpha[i] < 0.01) alpha[i] = 0
  }
  return alpha
}

export default tool({
  description:
    "Remove solid-color background from game art using color matting + AI soft mask. " +
    "Three regimes: trust (mask good), adapt (mask imperfect), color (mask failed). " +
    "Supports single image and batch mode. Returns JSON result with output path(s).",
  args: {
    input: tool.schema
      .string()
      .describe("Input image path (single mode) or directory path (batch mode with --batch)"),
    output: tool.schema
      .string()
      .describe("Output path. File path for single mode, directory for batch mode.")
      .optional(),
    batch: tool.schema
      .string()
      .describe('Set to "true" for batch mode — process all PNGs in input directory')
      .optional(),
    mode: tool.schema
      .string()
      .describe('Regime: "auto", "trust", "adapt", "color". Default: "auto"')
      .optional(),
    bgThresh: tool.schema
      .string()
      .describe("Background threshold override (0-1). Default: per-regime")
      .optional(),
    fgThresh: tool.schema
      .string()
      .describe("Foreground threshold override (0-1). Default: per-regime")
      .optional(),
  },
  async execute(args, context) {
    const cwd = context.worktree ?? context.directory
    const resolve = (p: string) => (p.startsWith("/") ? p : join(cwd, p))

    const inputPath = args.input?.trim()
    if (!inputPath) return JSON.stringify({ ok: false, error: "input is required" })

    const isBatch = args.batch === "true" || args.batch === "1"
    const regime = args.mode?.trim() ?? "auto"
    const bgThreshOverride = args.bgThresh ? parseFloat(args.bgThresh) : null
    const fgThreshOverride = args.fgThresh ? parseFloat(args.fgThresh) : null

    // Dynamic imports
    let sharp: typeof import("sharp")
    let removeBackground: (input: Blob | ArrayBuffer | Buffer) => Promise<Blob>
    try {
      sharp = await import("sharp")
    } catch {
      return JSON.stringify({ ok: false, error: "sharp is not installed. Run: npm install sharp" })
    }
    try {
      const imgly = await import("@imgly/background-removal")
      removeBackground = imgly.removeBackground as typeof removeBackground
    } catch {
      return JSON.stringify({
        ok: false,
        error: "@imgly/background-removal is not installed. Run: npm install @imgly/background-removal",
      })
    }

    async function processImage(
      imgPath: string,
      outPath: string,
    ): Promise<{ ok: boolean; path?: string; regime?: string; error?: string }> {
      // Load RGB raw buffer
      const img = sharp.default(imgPath)
      const meta = await img.metadata()
      const width = meta.width!
      const height = meta.height!
      const rgbBuf = await sharp.default(imgPath).removeAlpha().raw().toBuffer()
      const pixels = width * height

      // 1. Sample background color from corners
      const bg = sampleBgColor(rgbBuf, width, height)

      // 2. Color matting alpha
      const alphaColor = computeAlphaColor(rgbBuf, width, height, bg)

      // 3. Get soft mask from @imgly/background-removal
      const inputBuf = await sharp.default(imgPath).png().toBuffer()
      const blob = new Blob([inputBuf], { type: "image/png" })
      let maskSoft: Float32Array

      try {
        const resultBlob = await removeBackground(blob)
        const resultBuf = Buffer.from(await resultBlob.arrayBuffer())
        // Extract alpha channel from result RGBA
        const rgbaMeta = await sharp.default(resultBuf).metadata()
        const rgbaRaw = await sharp.default(resultBuf)
          .resize(width, height, { fit: "fill" })
          .ensureAlpha()
          .raw()
          .toBuffer()

        maskSoft = new Float32Array(pixels)
        for (let i = 0; i < pixels; i++) {
          maskSoft[i] = rgbaRaw[i * 4 + 3] / 255
        }
      } catch {
        // Mask failed — use color-only
        maskSoft = new Float32Array(pixels) // all zeros
      }

      // 4. Detect or use specified regime
      const actualRegime = regime === "auto" ? detectRegime(maskSoft, pixels) : regime
      const bgT = bgThreshOverride ?? DEFAULTS[actualRegime]?.bgThresh ?? 0.05
      const fgT = fgThreshOverride ?? DEFAULTS[actualRegime]?.fgThresh ?? 0.2

      // 5. Combine alpha
      const alpha = combineAlpha(alphaColor, maskSoft, actualRegime, bgT, fgT)

      // 6. Recover foreground + output RGBA
      const rgba = recoverForeground(rgbBuf, alpha, bg, width, height)

      // 7. Save
      await sharp.default(rgba, { raw: { width, height, channels: 4 } })
        .png()
        .toFile(outPath)

      return { ok: true, path: outPath, regime: actualRegime }
    }

    // Single mode
    if (!isBatch) {
      const resolved = resolve(inputPath)
      const defaultOut = resolved.replace(/(\.\w+)$/, "_nobg.png")
      const outPath = args.output ? resolve(args.output) : defaultOut

      try {
        const result = await processImage(resolved, outPath)
        return JSON.stringify(result)
      } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : String(err)
        return JSON.stringify({ ok: false, error: msg })
      }
    }

    // Batch mode
    if (!args.output) {
      return JSON.stringify({ ok: false, error: "output directory is required for batch mode" })
    }

    const resolvedInput = resolve(inputPath)
    const resolvedOutput = resolve(args.output)
    mkdirSync(resolvedOutput, { recursive: true })

    let files: string[]
    try {
      files = readdirSync(resolvedInput)
        .filter((f) => f.toLowerCase().endsWith(".png"))
        .sort()
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err)
      return JSON.stringify({ ok: false, error: `Cannot read input directory: ${msg}` })
    }

    if (files.length === 0) {
      return JSON.stringify({ ok: false, error: "No PNG files found in input directory" })
    }

    const results: string[] = []
    let errors = 0
    for (const file of files) {
      const inPath = join(resolvedInput, file)
      const outPath = join(resolvedOutput, file)
      try {
        await processImage(inPath, outPath)
        results.push(outPath)
      } catch {
        errors++
      }
    }

    return JSON.stringify({
      ok: errors === 0,
      processed: results.length,
      errors,
      output_dir: resolvedOutput,
    })
  },
})
