import { tool } from "@opencode-ai/plugin"
import { readdirSync } from "fs"
import { join } from "path"

const EMBED_SIZE = 32
const MIN_SIM = 0.90
const TOP_K = 10

/** Resize image to 32x32 RGB, flatten, L2-normalize. */
async function embed(
  sharp: typeof import("sharp"),
  filePath: string,
): Promise<Float32Array> {
  const buf = await sharp
    .default(filePath)
    .resize(EMBED_SIZE, EMBED_SIZE, { fit: "fill" })
    .removeAlpha()
    .raw()
    .toBuffer()

  const vec = new Float32Array(buf.length)
  let norm = 0
  for (let i = 0; i < buf.length; i++) {
    vec[i] = buf[i]
    norm += buf[i] * buf[i]
  }
  norm = Math.sqrt(norm) || 1e-8
  for (let i = 0; i < vec.length; i++) {
    vec[i] /= norm
  }
  return vec
}

/** Cosine similarity between two normalized vectors. */
function dot(a: Float32Array, b: Float32Array): number {
  let sum = 0
  for (let i = 0; i < a.length; i++) {
    sum += a[i] * b[i]
  }
  return sum
}

/** Average cosine similarity over a window of consecutive frames. */
function windowSimilarity(
  embeddings: Float32Array[],
  refStart: number,
  candidateStart: number,
  window: number,
): number {
  let total = 0
  for (let offset = 0; offset < window; offset++) {
    total += dot(embeddings[refStart + offset], embeddings[candidateStart + offset])
  }
  return total / window
}

/** Keep highest-sim representative from each cluster of nearby frames. */
function dedupe(
  candidates: Array<[number, number]>,
  minGap: number,
): Array<[number, number]> {
  if (candidates.length === 0) return []
  // Sort by similarity descending
  const bySim = [...candidates].sort((a, b) => b[1] - a[1])
  const kept: Array<[number, number]> = []
  for (const [idx, sim] of bySim) {
    if (kept.every(([k]) => Math.abs(idx - k) >= minGap)) {
      kept.push([idx, sim])
    }
  }
  return kept
}

/** Find best loop point. Returns [index, similarity, peaks]. */
function findLoop(
  embeddings: Float32Array[],
  skip: number,
  window: number,
  minGap: number,
): { idx: number | null; sim: number; peaks: Array<[number, number]> } {
  const n = embeddings.length
  const first = skip + window
  const last = n - window
  if (first > last) return { idx: null, sim: 0, peaks: [] }

  // Score all candidates
  const allCandidates: Array<[number, number]> = []
  for (let start = first; start <= last; start++) {
    const sim = windowSimilarity(embeddings, 0, start, window)
    allCandidates.push([start, sim])
  }

  // Top K by similarity
  const top = [...allCandidates].sort((a, b) => b[1] - a[1]).slice(0, TOP_K)

  // Deduplicate nearby frames
  const peaks = dedupe(top, minGap)
  if (peaks.length === 0) return { idx: null, sim: 0, peaks: [] }

  // Pick latest if its similarity is close to the top; otherwise prefer top sim
  const topSim = Math.max(...peaks.map((p) => p[1]))
  const latest = peaks.reduce((a, b) => (a[0] > b[0] ? a : b))
  const best = topSim - latest[1] < 0.01 ? latest : peaks.reduce((a, b) => (a[1] > b[1] ? a : b))

  return { idx: best[0], sim: best[1], peaks }
}

export default tool({
  description:
    "Find the best loop point in a sequence of animation frames. " +
    "Compares frame similarity using 32x32 embeddings with a sliding window. " +
    "Picks the latest high-similarity frame to maximize clip length. " +
    "Returns JSON: {loop_frame, similarity, window, total_frames}.",
  args: {
    framesDir: tool.schema
      .string()
      .describe("Directory containing numbered frame PNGs (sorted alphabetically)"),
    skip: tool.schema
      .string()
      .describe("Skip first N frames to avoid intro artifacts. Default: 10")
      .optional(),
    minGap: tool.schema
      .string()
      .describe("Minimum frames between candidate loop points. Default: 5")
      .optional(),
  },
  async execute(args, context) {
    const cwd = context.worktree ?? context.directory

    const framesDir = args.framesDir?.trim()
    if (!framesDir) return JSON.stringify({ error: "framesDir is required" })

    const skip = parseInt(args.skip ?? "10", 10)
    const minGap = parseInt(args.minGap ?? "5", 10)

    const resolvedDir = framesDir.startsWith("/") ? framesDir : join(cwd, framesDir)

    // Dynamic import sharp
    let sharp: typeof import("sharp")
    try {
      sharp = await import("sharp")
    } catch {
      return JSON.stringify({ error: "sharp is not installed. Run: npm install sharp" })
    }

    // List PNG frames sorted
    let files: string[]
    try {
      files = readdirSync(resolvedDir)
        .filter((f) => f.toLowerCase().endsWith(".png"))
        .sort()
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err)
      return JSON.stringify({ error: `Cannot read frames directory: ${msg}` })
    }

    if (files.length < skip + 2) {
      return JSON.stringify({ error: `Not enough frames (${files.length}) for skip=${skip}` })
    }

    // Compute embeddings
    const embeddings: Float32Array[] = []
    for (const file of files) {
      embeddings.push(await embed(sharp, join(resolvedDir, file)))
    }

    // Try 7-frame window first, then 1-frame fallback
    for (const window of [7, 1]) {
      const { idx, sim, peaks } = findLoop(embeddings, skip, window, minGap)

      if (idx !== null && sim >= MIN_SIM) {
        return JSON.stringify({
          loop_frame: idx + 1,
          similarity: Math.round(sim * 10000) / 10000,
          window,
          total_frames: files.length,
          candidates: peaks
            .sort((a, b) => b[0] - a[0])
            .slice(0, 5)
            .map(([i, s]) => ({ frame: i + 1, similarity: Math.round(s * 10000) / 10000 })),
        })
      }
    }

    // No good loop point found
    return JSON.stringify({
      loop_frame: files.length,
      similarity: 0,
      window: 0,
      total_frames: files.length,
      note: "no good loop point found, using whole clip",
    })
  },
})
