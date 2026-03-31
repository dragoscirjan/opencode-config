import { tool } from "@opencode-ai/plugin"
import { existsSync, mkdirSync, readdirSync, writeFileSync } from "fs"
import { join } from "path"

const VALID_TYPES = ["epic", "story", "task", "spike"] as const
type IssueType = (typeof VALID_TYPES)[number]

const VALID_STATUSES = ["open", "in_progress", "done", "closed"] as const
type IssueStatus = (typeof VALID_STATUSES)[number]

function kebabCase(input: string): string {
  return input
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
}

function nextId(issuesDir: string): string {
  if (!existsSync(issuesDir)) return "00001"

  let max = 0
  for (const file of readdirSync(issuesDir)) {
    const match = file.match(/^(\d+)/)
    if (match) {
      const num = parseInt(match[1], 10)
      if (num > max) max = num
    }
  }
  return String(max + 1).padStart(5, "0")
}

function buildFrontmatter(fields: {
  id: string
  type: IssueType
  title: string
  status: IssueStatus
  labels: string[]
  parent?: string
  depends?: string[]
  author?: string
}): string {
  const lines = [
    "---",
    `id: "${fields.id}"`,
    `type: ${fields.type}`,
    `title: "${fields.title}"`,
    `status: ${fields.status}`,
    `labels: [${fields.labels.map((l) => `"${l}"`).join(", ")}]`,
  ]
  if (fields.parent) lines.push(`parent: "${fields.parent}"`)
  if (fields.depends?.length) {
    const deps = fields.depends.map((d) => `"${d}"`).join(", ")
    lines.push(`depends: [${deps}]`)
  }
  if (fields.author) lines.push(`author: "opencode:agent=${fields.author}"`)
  lines.push("---")
  return lines.join("\n")
}

export default tool({
  description:
    "Create a new issue file in .issues/ with auto-assigned 5-digit ID and YAML frontmatter. " +
    "Returns the file path. The agent should then edit the file to fill in the body content.",
  args: {
    type: tool.schema
      .string()
      .describe("Issue type: epic, story, task, or spike"),
    title: tool.schema.string().describe("Human-readable issue title"),
    status: tool.schema
      .string()
      .describe("Issue status: open, in_progress, done, closed. Default: open")
      .optional(),
    parent: tool.schema
      .string()
      .describe("Parent issue ID (e.g. 00001)")
      .optional(),
    depends: tool.schema
      .string()
      .describe("Comma-separated blocking issue IDs (e.g. 00001,00002)")
      .optional(),
    labels: tool.schema
      .string()
      .describe("Comma-separated extra labels. level/<type> is auto-added.")
      .optional(),
    author: tool.schema
      .string()
      .describe("Agent or user name for attribution (e.g. hermes, athena)")
      .optional(),
  },
  async execute(args, context) {
    const cwd = context.directory

    // Validate type
    const issueType = args.type?.trim().toLowerCase() as IssueType
    if (!VALID_TYPES.includes(issueType)) {
      return `Error: invalid type "${args.type}". Must be one of: ${VALID_TYPES.join(", ")}`
    }

    // Validate title
    const title = args.title?.trim()
    if (!title) return "Error: title is required"

    // Validate status
    const status = (args.status?.trim().toLowerCase() ?? "open") as IssueStatus
    if (!VALID_STATUSES.includes(status)) {
      return `Error: invalid status "${args.status}". Must be one of: ${VALID_STATUSES.join(", ")}`
    }

    // Build labels
    const autoLabel = `level/${issueType}`
    const extraLabels = args.labels
      ? args.labels
        .split(",")
        .map((l) => l.trim())
        .filter(Boolean)
      : []
    const labels = [autoLabel, ...extraLabels]

    // Parse depends
    const depends = args.depends
      ? args.depends
        .split(",")
        .map((d) => d.trim())
        .filter(Boolean)
      : undefined

    // Compute ID and path
    const issuesDir = join(cwd, ".issues")
    mkdirSync(issuesDir, { recursive: true })
    const id = nextId(issuesDir)
    const slug = kebabCase(title) || "untitled"
    const filename = `${id}-${issueType}-${slug}.md`
    const filepath = join(issuesDir, filename)

    // Build file content
    const frontmatter = buildFrontmatter({
      id,
      type: issueType,
      title,
      status,
      labels,
      parent: args.parent?.trim() || undefined,
      depends,
      author: args.author?.trim() || undefined,
    })

    const content = `${frontmatter}\n\n# ${title}\n\n\n\n## Comments\n`
    writeFileSync(filepath, content, "utf-8")

    return [
      `Created: .issues/${filename}`,
      `ID: ${id}`,
      `Edit the file body between "# ${title}" and "## Comments".`,
    ].join("\n")
  },
})
