import { tool } from "@opencode-ai/plugin"
import { readFileSync } from "fs"
import { join, extname } from "path"

const DEFAULT_MODEL = "gemini-3-flash"

const STATIC_PROMPT = `You are a visual quality assessor for a Godot 4 game.
Compare the reference image (visual target) with the game screenshot.
Focus on: layout accuracy, color fidelity, sprite positioning, text readability, UI alignment.
Score 1-10 and list specific issues with actionable fixes.
Output format:
## Score: N/10
## Issues
- [severity: high|medium|low] description — fix suggestion
## Summary
One-line overall assessment.`

const DYNAMIC_PROMPT = `You are a visual quality assessor for a Godot 4 game.
Compare the reference image (visual target) with the game frame sequence (captured at 2 FPS).
Assess: animation smoothness, visual consistency across frames, layout drift, flickering, sprite movement correctness.
Score 1-10 and list specific issues with actionable fixes.
Output format:
## Score: N/10
## Issues
- [severity: high|medium|low] [frame N] description — fix suggestion
## Summary
One-line overall assessment.`

const QUESTION_PROMPT = `You are a visual analyst for a Godot 4 game.
Answer the developer's question about the provided screenshot(s) with specific, actionable observations.
Reference exact visual elements, positions, and colors in your answer.`

function mimeForImage(path: string): string {
  const ext = extname(path).toLowerCase()
  const mimes: Record<string, string> = {
    ".jpg": "image/jpeg",
    ".jpeg": "image/jpeg",
    ".png": "image/png",
    ".webp": "image/webp",
    ".gif": "image/gif",
  }
  return mimes[ext] ?? "image/png"
}

export default tool({
  description:
    "Analyze game screenshots via Gemini Flash vision. " +
    "Three modes: static (reference + screenshot), dynamic (reference + frame sequence), " +
    "question (free-form question + screenshots). " +
    "Returns the visual QA assessment as markdown text.",
  args: {
    mode: tool.schema
      .string()
      .describe(
        'Analysis mode: "static" (reference + 1 screenshot), "dynamic" (reference + frame sequence), ' +
        'or "question" (free-form question + screenshots). Default: auto-detected from image count.'
      )
      .optional(),
    reference: tool.schema
      .string()
      .describe("Reference image path (visual target). Required for static/dynamic modes.")
      .optional(),
    images: tool.schema
      .string()
      .describe(
        "Comma-separated paths to game screenshots or frames. " +
        "Static: 1 image. Dynamic: 2+ frames. Question: 1+ images."
      ),
    question: tool.schema
      .string()
      .describe("Free-form question about the screenshots. Required for question mode.")
      .optional(),
    taskContext: tool.schema
      .string()
      .describe("Task context (Goal, Requirements, Verify) for goal verification.")
      .optional(),
    model: tool.schema
      .string()
      .describe(`Gemini model override. Default: "${DEFAULT_MODEL}"`)
      .optional(),
  },
  async execute(args, context) {
    const cwd = context.worktree ?? context.directory

    const imagePaths = (args.images ?? "")
      .split(",")
      .map((p) => p.trim())
      .filter(Boolean)

    if (imagePaths.length === 0) {
      return "Error: images is required (comma-separated paths)"
    }

    const question = args.question?.trim()
    const reference = args.reference?.trim()
    const taskContext = args.taskContext?.trim()
    const model = args.model?.trim() || DEFAULT_MODEL

    // Auto-detect mode
    let mode = args.mode?.trim()
    if (!mode) {
      if (question) {
        mode = "question"
      } else if (imagePaths.length === 1) {
        mode = "static"
      } else {
        mode = "dynamic"
      }
    }

    // Validate
    if (mode !== "question" && !reference) {
      return "Error: reference image is required for static/dynamic mode"
    }
    if (mode === "question" && !question) {
      return "Error: question is required for question mode"
    }

    // Resolve paths
    const resolve = (p: string) => (p.startsWith("/") ? p : join(cwd, p))

    // Dynamic import @google/genai
    let genai: typeof import("@google/genai")
    try {
      genai = await import("@google/genai")
    } catch {
      return "Error: @google/genai is not installed. Run: npm install @google/genai"
    }

    const apiKey = process.env.GEMINI_API_KEY || process.env.GOOGLE_API_KEY
    if (!apiKey) {
      return "Error: GEMINI_API_KEY or GOOGLE_API_KEY environment variable not set"
    }

    const client = new genai.GoogleGenAI({ apiKey })

    // Build content parts
    const parts: Array<{ text: string } | { inlineData: { mimeType: string; data: string } }> = []

    if (mode === "question") {
      let prompt = QUESTION_PROMPT
      prompt += `\n\n## Question\n\n${question}\n`
      if (taskContext) {
        prompt += `\n## Additional Context\n\n${taskContext}\n`
      }
      parts.push({ text: prompt })

      for (let i = 0; i < imagePaths.length; i++) {
        const resolved = resolve(imagePaths[i])
        const label = imagePaths.length === 1 ? "Screenshot:" : `Frame ${i + 1}:`
        parts.push({ text: label })
        try {
          const data = readFileSync(resolved).toString("base64")
          parts.push({ inlineData: { mimeType: mimeForImage(resolved), data } })
        } catch (err: unknown) {
          const msg = err instanceof Error ? err.message : String(err)
          return `Error: Cannot read image ${imagePaths[i]}: ${msg}`
        }
      }
    } else {
      // Static or dynamic mode
      const isStatic = mode === "static"
      let prompt = isStatic ? STATIC_PROMPT : DYNAMIC_PROMPT
      if (taskContext) {
        prompt += `\n\n## Task Context\n\n${taskContext}\n`
      }
      parts.push({ text: prompt })

      // Reference image
      const refResolved = resolve(reference!)
      parts.push({ text: "Reference (visual target):" })
      try {
        const data = readFileSync(refResolved).toString("base64")
        parts.push({ inlineData: { mimeType: mimeForImage(refResolved), data } })
      } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : String(err)
        return `Error: Cannot read reference image: ${msg}`
      }

      // Game screenshots
      if (isStatic) {
        parts.push({ text: "Game screenshot:" })
        const resolved = resolve(imagePaths[0])
        try {
          const data = readFileSync(resolved).toString("base64")
          parts.push({ inlineData: { mimeType: mimeForImage(resolved), data } })
        } catch (err: unknown) {
          const msg = err instanceof Error ? err.message : String(err)
          return `Error: Cannot read screenshot: ${msg}`
        }
      } else {
        for (let i = 0; i < imagePaths.length; i++) {
          parts.push({ text: `Frame ${i + 1}:` })
          const resolved = resolve(imagePaths[i])
          try {
            const data = readFileSync(resolved).toString("base64")
            parts.push({ inlineData: { mimeType: mimeForImage(resolved), data } })
          } catch (err: unknown) {
            const msg = err instanceof Error ? err.message : String(err)
            return `Error: Cannot read frame ${imagePaths[i]}: ${msg}`
          }
        }
      }
    }

    // Call Gemini
    try {
      const response = await client.models.generateContent({
        model,
        contents: [{ role: "user", parts }],
        config: {
          // @ts-expect-error -- mediaResolution may not be in type defs yet
          mediaResolution: "high",
        },
      })

      const text = response.text
      if (!text) {
        return "Error: Gemini returned no text (possible safety block)"
      }
      return text
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err)
      return `Error: Gemini API call failed: ${msg}`
    }
  },
})
