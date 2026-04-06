import { tool } from "@opencode-ai/plugin"
import { existsSync, mkdirSync, readdirSync, writeFileSync } from "fs"
import { join } from "path"

const VALID_TYPES = ["hld", "lld", "task"] as const
type SpecType = (typeof VALID_TYPES)[number]

const VALID_STATUSES = ["draft", "review", "approved", "superseded"] as const
type SpecStatus = (typeof VALID_STATUSES)[number]

function kebabCase(input: string): string {
  return input
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
}

function nextId(specsDir: string): string {
  if (!existsSync(specsDir)) return "00001"

  let max = 0
  for (const file of readdirSync(specsDir)) {
    const match = file.match(/^\w+-(\d{5})-/)
    if (match) {
      const num = parseInt(match[1], 10)
      if (num > max) max = num
    }
  }
  return String(max + 1).padStart(5, "0")
}

function nextVersion(specsDir: string, specType: SpecType, id: string): number {
  if (!existsSync(specsDir)) return 1

  let max = 0
  const prefix = `${specType}-${id}-`
  for (const file of readdirSync(specsDir)) {
    if (!file.startsWith(prefix)) continue
    const match = file.match(/-v(\d+)\.md$/)
    if (match) {
      const ver = parseInt(match[1], 10)
      if (ver > max) max = ver
    }
  }
  return max + 1
}

function buildFrontmatter(fields: {
  id: string
  type: SpecType
  title: string
  version: number
  status: SpecStatus
  parent?: string
  author?: string
}): string {
  const lines = [
    "---",
    `id: "${fields.id}"`,
    `type: ${fields.type}`,
    `title: "${fields.title}"`,
    `version: ${fields.version}`,
    `status: ${fields.status}`,
  ]
  if (fields.parent) lines.push(`parent: "${fields.parent}"`)
  if (fields.author) lines.push(`opencode-agent: ${fields.author}`)
  lines.push("---")
  return lines.join("\n")
}

export default tool({
  description:
    "Create a new spec file in .specs/ with auto-assigned 5-digit ID and version. " +
    "Format: <type>-<id>-<name>-v<ver>.md. " +
    "Omit id for a new spec (auto-assigns next ID). " +
    "Provide id to version an existing spec or link LLD/task to parent HLD. " +
    "Returns the file path. The agent should then edit the file to fill in the body content.",
  args: {
    type: tool.schema
      .string()
      .describe("Spec type: hld, lld, or task"),
    title: tool.schema.string().describe("Human-readable spec title"),
    id: tool.schema
      .string()
      .describe(
        "Existing 5-digit spec ID. Omit for new spec (auto-assigns). " +
        "Provide to create a new version or link LLD/task to parent HLD ID."
      )
      .optional(),
    status: tool.schema
      .string()
      .describe("Spec status: draft, review, approved, superseded. Default: draft")
      .optional(),
    parent: tool.schema
      .string()
      .describe("Parent spec ID for traceability (e.g. 00001)")
      .optional(),
    author: tool.schema
      .string()
      .describe("Agent or user name for attribution (e.g. tech-advisor, lead-engineer)")
      .optional(),
  },
  async execute(args, context) {
    const cwd = context.directory

    // Validate type
    const specType = args.type?.trim().toLowerCase() as SpecType
    if (!VALID_TYPES.includes(specType)) {
      return `Error: invalid type "${args.type}". Must be one of: ${VALID_TYPES.join(", ")}`
    }

    // Validate title
    const title = args.title?.trim()
    if (!title) return "Error: title is required"

    // Validate status
    const status = (args.status?.trim().toLowerCase() ?? "draft") as SpecStatus
    if (!VALID_STATUSES.includes(status)) {
      return `Error: invalid status "${args.status}". Must be one of: ${VALID_STATUSES.join(", ")}`
    }

    // Validate id format if provided
    const providedId = args.id?.trim()
    if (providedId && !/^\d{5}$/.test(providedId)) {
      return `Error: id must be a 5-digit zero-padded number (e.g. 00001), got "${providedId}"`
    }

    // Validate parent format if provided
    const parentId = args.parent?.trim()
    if (parentId && !/^\d{5}$/.test(parentId)) {
      return `Error: parent must be a 5-digit zero-padded number (e.g. 00001), got "${parentId}"`
    }

    // Compute ID
    const specsDir = join(cwd, ".specs")
    mkdirSync(specsDir, { recursive: true })
    const id = providedId ?? nextId(specsDir)

    // Compute version
    const version = nextVersion(specsDir, specType, id)

    // Build filename and path
    const slug = kebabCase(title) || "untitled"
    const filename = `${specType}-${id}-${slug}-v${version}.md`
    const filepath = join(specsDir, filename)

    // Build file content
    const frontmatter = buildFrontmatter({
      id,
      type: specType,
      title,
      version,
      status,
      parent: parentId || undefined,
      author: args.author?.trim() || undefined,
    })

    const content = `${frontmatter}\n\n# ${title}\n\n`
    writeFileSync(filepath, content, "utf-8")

    return [
      `Created: .specs/${filename}`,
      `ID: ${id}`,
      `Version: ${version}`,
      `Edit the file body below "# ${title}".`,
    ].join("\n")
  },
})
