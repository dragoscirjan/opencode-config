import { tool } from "@opencode-ai/plugin"
import { mkdirSync } from "fs"
import { join, basename, extname } from "path"

export default tool({
  description:
    "Slice a grid image into individual PNGs. " +
    "Divides an image evenly into a cols x rows grid and saves each cell. " +
    "Returns JSON: {ok, cells, cell_size, paths}.",
  args: {
    input: tool.schema.string().describe("Input grid image path (PNG, JPEG, or WebP)"),
    output: tool.schema.string().describe("Output directory for sliced cell images"),
    grid: tool.schema
      .string()
      .describe('Grid layout as ColsxRows, e.g. "2x2", "3x3", "2x4". Default: "2x2"')
      .optional(),
    names: tool.schema
      .string()
      .describe(
        "Comma-separated names for output files (without .png). " +
        'Must match cell count. Default: "01", "02", ...'
      )
      .optional(),
  },
  async execute(args, context) {
    const cwd = context.worktree ?? context.directory

    const inputPath = args.input?.trim()
    if (!inputPath) return JSON.stringify({ ok: false, error: "input is required" })

    const outputDir = args.output?.trim()
    if (!outputDir) return JSON.stringify({ ok: false, error: "output is required" })

    // Parse grid
    const gridStr = (args.grid ?? "2x2").toLowerCase()
    const gridMatch = gridStr.match(/^(\d+)x(\d+)$/)
    if (!gridMatch) {
      return JSON.stringify({ ok: false, error: `Invalid grid format: "${gridStr}". Use ColsxRows, e.g. "2x2"` })
    }
    const cols = parseInt(gridMatch[1], 10)
    const rows = parseInt(gridMatch[2], 10)
    const total = cols * rows

    // Parse names
    let names: string[] | null = null
    if (args.names) {
      names = args.names.split(",").map((n) => n.trim())
      if (names.length !== total) {
        return JSON.stringify({
          ok: false,
          error: `--names has ${names.length} entries, grid is ${total} cells (${cols}x${rows})`,
        })
      }
    }

    // Resolve paths
    const resolvedInput = inputPath.startsWith("/") ? inputPath : join(cwd, inputPath)
    const resolvedOutput = outputDir.startsWith("/") ? outputDir : join(cwd, outputDir)

    // Dynamic import sharp (may not be installed at lint time)
    let sharp: typeof import("sharp")
    try {
      sharp = await import("sharp")
    } catch {
      return JSON.stringify({ ok: false, error: "sharp is not installed. Run: npm install sharp" })
    }

    // Load image metadata
    let width: number
    let height: number
    try {
      const meta = await sharp.default(resolvedInput).metadata()
      width = meta.width!
      height = meta.height!
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err)
      return JSON.stringify({ ok: false, error: `Cannot read image: ${msg}` })
    }

    const cellW = Math.floor(width / cols)
    const cellH = Math.floor(height / rows)

    mkdirSync(resolvedOutput, { recursive: true })

    const paths: string[] = []
    for (let i = 0; i < total; i++) {
      const row = Math.floor(i / cols)
      const col = i % cols
      const x = col * cellW
      const y = row * cellH

      const name = names ? names[i] : String(i + 1).padStart(2, "0")
      const outPath = join(resolvedOutput, `${name}.png`)

      try {
        await sharp
          .default(resolvedInput)
          .extract({ left: x, top: y, width: cellW, height: cellH })
          .png()
          .toFile(outPath)
        paths.push(outPath)
      } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : String(err)
        return JSON.stringify({ ok: false, error: `Failed to extract cell ${i}: ${msg}` })
      }
    }

    return JSON.stringify({
      ok: true,
      cells: total,
      cell_size: `${cellW}x${cellH}`,
      paths,
    })
  },
})
