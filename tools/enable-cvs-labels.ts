import { tool } from "@opencode-ai/plugin"
import { execFileSync } from "child_process"

interface Label {
  name: string
  color: string
  description: string
}

const COLOR_PATTERN = /^[0-9a-fA-F]{6}$/

const PRESETS: Record<string, Label[]> = {
  types: [
    { name: "epic", color: "6366F1", description: "Large feature or initiative spanning multiple stories" },
    { name: "story", color: "8B5CF6", description: "User-facing deliverable or feature" },
    { name: "task", color: "A78BFA", description: "Technical work item or subtask" },
    { name: "spike", color: "C4B5FD", description: "Research or investigation task" },
    { name: "bug", color: "EF4444", description: "Something is broken" },
    { name: "chore", color: "6B7280", description: "Maintenance, refactoring, or housekeeping" },
  ],
  priority: [
    { name: "priority:critical", color: "DC2626", description: "Must fix immediately - blocks release or causes outage" },
    { name: "priority:high", color: "F97316", description: "Must resolve this sprint" },
    { name: "priority:medium", color: "EAB308", description: "Should resolve soon" },
    { name: "priority:low", color: "22C55E", description: "Nice to have, resolve when convenient" },
  ],
  status: [
    { name: "status:blocked", color: "DC2626", description: "Blocked by another issue or external dependency" },
    { name: "status:needs-review", color: "F59E0B", description: "Ready for review" },
    { name: "status:in-progress", color: "3B82F6", description: "Actively being worked on" },
    { name: "status:ready", color: "10B981", description: "Ready to start work" },
  ],
  scope: [
    { name: "scope:docs", color: "0EA5E9", description: "Documentation changes" },
    { name: "scope:tests", color: "14B8A6", description: "Test-only changes" },
    { name: "scope:ci", color: "8B5CF6", description: "CI/CD pipeline changes" },
    { name: "scope:deps", color: "F59E0B", description: "Dependency updates" },
  ],
}

type Platform = "github" | "gitlab" | "forgejo"

interface RepoInfo {
  platform: Platform
  owner: string
  repo: string
  projectPath: string
}

function parseGitRemote(cwd: string): RepoInfo {
  const remoteUrl = execFileSync("git", ["remote", "get-url", "origin"], {
    cwd,
    encoding: "utf-8",
  }).trim()

  // SSH SCP-like:  git@github.com:owner/repo.git
  // SSH URL:       ssh://git@github.com/owner/repo.git
  // SSH with port: ssh://git@github.com:22/owner/repo.git
  // HTTPS:         https://github.com/owner/repo.git
  let host = ""
  let path = ""

  const scpMatch = remoteUrl.match(/@([^:/]+):(?!\/\/)(.+?)(?:\.git)?$/)
  const sshUrlMatch = remoteUrl.match(/ssh:\/\/[^@]+@([^:/]+)(?::\d+)?\/(.+?)(?:\.git)?$/)
  const httpsMatch = remoteUrl.match(/https?:\/\/([^/]+)\/(.+?)(?:\.git)?$/)

  if (scpMatch) {
    host = scpMatch[1]
    path = scpMatch[2]
  } else if (sshUrlMatch) {
    host = sshUrlMatch[1]
    path = sshUrlMatch[2]
  } else if (httpsMatch) {
    host = httpsMatch[1]
    path = httpsMatch[2]
  }

  const [owner, ...repoParts] = path.split("/")
  const repo = repoParts.join("/")

  if (!owner || !repo) {
    throw new Error(`Cannot parse owner/repo from remote URL: ${remoteUrl}`)
  }

  const platform = detectPlatform(host)
  return { platform, owner, repo, projectPath: `${owner}/${repo}` }
}

/** Normalize a URL env var — ensure it has a scheme and no trailing slash. */
function normalizeUrl(raw: string): string {
  let url = raw.trim()
  if (!url) return ""
  if (!/^https?:\/\//i.test(url)) {
    url = `https://${url}`
  }
  return url.replace(/\/+$/, "")
}

/** Returns true if `host` equals `domain` or is a subdomain of it. */
function matchesDomain(host: string, domain: string): boolean {
  return host === domain || host.endsWith(`.${domain}`)
}

function detectPlatform(host: string): Platform {
  if (matchesDomain(host, "github.com")) return "github"
  if (matchesDomain(host, "gitlab.com")) return "gitlab"
  if (matchesDomain(host, "gitea.io") || matchesDomain(host, "codeberg.org")) return "forgejo"

  const gitlabUrl = normalizeUrl(process.env.GITLAB_URL ?? "")
  if (gitlabUrl) {
    try {
      if (matchesDomain(host, new URL(gitlabUrl).hostname)) return "gitlab"
    } catch { /* invalid URL, skip */ }
  }

  const forgejoUrl = normalizeUrl(process.env.FORGEJO_URL ?? "")
  if (forgejoUrl) {
    try {
      if (matchesDomain(host, new URL(forgejoUrl).hostname)) return "forgejo"
    } catch { /* invalid URL, skip */ }
  }

  // Fallback: check env vars for token presence
  if (process.env.GITHUB_TOKEN) return "github"

  if (process.env.GITLAB_TOKEN ?? process.env.GITLAB_PRIVATE_TOKEN) {
    if (!gitlabUrl) {
      throw new Error("GITLAB_TOKEN is set but GITLAB_URL is not. Set GITLAB_URL (e.g. 'gitlab.example.com' or 'https://gitlab.example.com').")
    }
    return "gitlab"
  }

  if (process.env.FORGEJO_ACCESS_TOKEN) {
    if (!forgejoUrl) {
      throw new Error("FORGEJO_ACCESS_TOKEN is set but FORGEJO_URL is not. Set FORGEJO_URL (e.g. 'https://forgejo.example.com').")
    }
    return "forgejo"
  }

  throw new Error(
    `Cannot detect CVS platform from remote host "${host}". ` +
    "Set GITHUB_TOKEN, GITLAB_TOKEN + GITLAB_URL, or FORGEJO_ACCESS_TOKEN + FORGEJO_URL."
  )
}

function validateLabel(label: unknown, index: number): Label {
  if (typeof label !== "object" || label === null) {
    throw new Error(`customLabels[${index}]: expected object, got ${typeof label}`)
  }
  const obj = label as Record<string, unknown>
  if (typeof obj.name !== "string" || !obj.name.trim()) {
    throw new Error(`customLabels[${index}].name: must be a non-empty string`)
  }
  if (typeof obj.color !== "string" || !COLOR_PATTERN.test(obj.color)) {
    throw new Error(`customLabels[${index}].color: must be a 6-char hex string (e.g. "FF0000"), got "${String(obj.color)}"`)
  }
  if (typeof obj.description !== "string") {
    throw new Error(`customLabels[${index}].description: must be a string`)
  }
  return { name: obj.name.trim(), color: obj.color, description: obj.description }
}

function createLabelsGitHub(labels: Label[], cwd: string, dryRun: boolean): string[] {
  const results: string[] = []
  for (const label of labels) {
    const args = [
      "label", "create", label.name,
      "--color", label.color,
      "--description", label.description,
      "--force",
    ]
    if (dryRun) {
      results.push(`[dry-run] gh ${args.map((a) => JSON.stringify(a)).join(" ")}`)
    } else {
      try {
        execFileSync("gh", args, { cwd, encoding: "utf-8", stdio: "pipe" })
        results.push(`Created/updated: ${label.name}`)
      } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : String(err)
        results.push(`Failed: ${label.name} - ${msg.split("\n")[0]}`)
      }
    }
  }
  return results
}

function createLabelsGitLab(labels: Label[], info: RepoInfo, dryRun: boolean): string[] {
  const results: string[] = []
  const gitlabUrl = normalizeUrl(process.env.GITLAB_URL ?? "")
  const token = process.env.GITLAB_TOKEN ?? process.env.GITLAB_PRIVATE_TOKEN ?? ""

  if (!token) {
    return ["Error: GITLAB_TOKEN or GITLAB_PRIVATE_TOKEN is not set. Cannot authenticate with GitLab."]
  }

  const baseUrl = `${gitlabUrl}/api/v4`
  const encodedPath = encodeURIComponent(info.projectPath)

  for (const label of labels) {
    const body = JSON.stringify({ name: label.name, color: `#${label.color}`, description: label.description })
    const createUrl = `${baseUrl}/projects/${encodedPath}/labels`

    if (dryRun) {
      results.push(`[dry-run] POST ${createUrl} - ${label.name}`)
    } else {
      try {
        execFileSync("curl", [
          "-sf", "-X", "POST", createUrl,
          "-H", `PRIVATE-TOKEN: ${token}`,
          "-H", "Content-Type: application/json",
          "-d", body,
        ], { encoding: "utf-8", stdio: "pipe" })
        results.push(`Created: ${label.name}`)
      } catch {
        // Label may already exist - try updating via PUT
        try {
          const updateUrl = `${baseUrl}/projects/${encodedPath}/labels/${encodeURIComponent(label.name)}`
          const updateBody = JSON.stringify({ new_name: label.name, color: `#${label.color}`, description: label.description })
          execFileSync("curl", [
            "-sf", "-X", "PUT", updateUrl,
            "-H", `PRIVATE-TOKEN: ${token}`,
            "-H", "Content-Type: application/json",
            "-d", updateBody,
          ], { encoding: "utf-8", stdio: "pipe" })
          results.push(`Updated (already existed): ${label.name}`)
        } catch (err: unknown) {
          const msg = err instanceof Error ? err.message : String(err)
          results.push(`Failed: ${label.name} - ${msg.split("\n")[0]}`)
        }
      }
    }
  }
  return results
}

function createLabelsForgejo(labels: Label[], info: RepoInfo, dryRun: boolean): string[] {
  const results: string[] = []
  const forgejoUrl = normalizeUrl(process.env.FORGEJO_URL ?? "")
  const token = process.env.FORGEJO_ACCESS_TOKEN ?? ""

  if (!token) {
    return ["Error: FORGEJO_ACCESS_TOKEN is not set. Cannot authenticate with Forgejo."]
  }

  const labelsUrl = `${forgejoUrl}/api/v1/repos/${info.owner}/${info.repo}/labels`

  // Fetch existing labels for idempotent updates
  let existingLabels: Array<{ id: number; name: string }> = []
  try {
    const raw = execFileSync("curl", [
      "-sf", labelsUrl,
      "-H", `Authorization: token ${token}`,
      "-H", "Content-Type: application/json",
    ], { encoding: "utf-8", stdio: "pipe" })
    existingLabels = JSON.parse(raw) as Array<{ id: number; name: string }>
  } catch {
    // If we can't fetch, we'll try create-only and catch conflicts
  }

  const existingMap = new Map(existingLabels.map((l) => [l.name, l.id]))

  for (const label of labels) {
    const body = JSON.stringify({ name: label.name, color: `#${label.color}`, description: label.description })
    const existingId = existingMap.get(label.name)

    if (dryRun) {
      if (existingId) {
        results.push(`[dry-run] PATCH ${labelsUrl}/${existingId} - ${label.name} (update)`)
      } else {
        results.push(`[dry-run] POST ${labelsUrl} - ${label.name} (create)`)
      }
    } else if (existingId) {
      // Update existing label
      try {
        execFileSync("curl", [
          "-sf", "-X", "PATCH", `${labelsUrl}/${existingId}`,
          "-H", `Authorization: token ${token}`,
          "-H", "Content-Type: application/json",
          "-d", body,
        ], { encoding: "utf-8", stdio: "pipe" })
        results.push(`Updated: ${label.name}`)
      } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : String(err)
        results.push(`Failed to update: ${label.name} - ${msg.split("\n")[0]}`)
      }
    } else {
      // Create new label
      try {
        execFileSync("curl", [
          "-sf", "-X", "POST", labelsUrl,
          "-H", `Authorization: token ${token}`,
          "-H", "Content-Type: application/json",
          "-d", body,
        ], { encoding: "utf-8", stdio: "pipe" })
        results.push(`Created: ${label.name}`)
      } catch {
        results.push(`Created/exists: ${label.name}`)
      }
    }
  }
  return results
}

export default tool({
  description: [
    "Ensure CVS (GitHub/GitLab/Forgejo) labels exist for the current repository.",
    "Auto-detects the platform from git remote URL and environment variables.",
    "Creates labels idempotently - safe to run multiple times.",
    "Default presets: types (epic/story/task/spike/bug/chore), priority, status, scope.",
    "Call this before creating issues if labels are needed.",
  ].join(" "),
  args: {
    presets: tool.schema
      .string()
      .describe(
        'Comma-separated preset names to apply. Available: "types", "priority", "status", "scope", "all". ' +
        'Default: "all". Example: "types,priority"'
      )
      .optional(),
    customLabels: tool.schema
      .string()
      .describe(
        "JSON array of custom labels to create in addition to presets. " +
        'Format: [{"name":"label-name","color":"hex-without-hash","description":"text"}]. Optional.'
      )
      .optional(),
    dryRun: tool.schema
      .string()
      .describe('Set to "true" to preview commands without executing them. Default: "false"')
      .optional(),
  },
  async execute(args, context) {
    const cwd = context.worktree ?? context.directory
    const isDryRun = args.dryRun === "true" || args.dryRun === "1" || args.dryRun === "yes"

    // Resolve presets
    const presetNames = (args.presets ?? "all").split(",").map((s) => s.trim())
    let labels: Label[] = []

    if (presetNames.includes("all")) {
      labels = Object.values(PRESETS).flat()
    } else {
      for (const name of presetNames) {
        const preset = PRESETS[name]
        if (!preset) {
          return `Unknown preset: "${name}". Available: ${Object.keys(PRESETS).join(", ")}, all`
        }
        labels.push(...preset)
      }
    }

    // Parse and validate custom labels
    if (args.customLabels) {
      let parsed: unknown
      try {
        parsed = JSON.parse(args.customLabels)
      } catch {
        return `Invalid customLabels JSON: ${args.customLabels}`
      }
      if (!Array.isArray(parsed)) {
        return `customLabels must be a JSON array, got ${typeof parsed}`
      }
      try {
        for (let i = 0; i < parsed.length; i++) {
          labels.push(validateLabel(parsed[i], i))
        }
      } catch (err: unknown) {
        return err instanceof Error ? err.message : String(err)
      }
    }

    if (labels.length === 0) {
      return "No labels to create. Specify presets or customLabels."
    }

    // Detect repo info
    let info: RepoInfo
    try {
      info = parseGitRemote(cwd)
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err)
      return `Failed to detect repository: ${msg}`
    }

    // Create labels
    const header = [
      `Platform: ${info.platform}`,
      `Repository: ${info.projectPath}`,
      `Labels to process: ${labels.length}`,
      isDryRun ? "Mode: DRY RUN" : "Mode: LIVE",
      "---",
    ]

    let results: string[]
    switch (info.platform) {
      case "github":
        results = createLabelsGitHub(labels, cwd, isDryRun)
        break
      case "gitlab":
        results = createLabelsGitLab(labels, info, isDryRun)
        break
      case "forgejo":
        results = createLabelsForgejo(labels, info, isDryRun)
        break
      default: {
        const _exhaustive: never = info.platform
        results = [`Unsupported platform: ${_exhaustive}`]
      }
    }

    return [...header, ...results].join("\n")
  },
})
