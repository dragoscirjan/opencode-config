import { tool } from "@opencode-ai/plugin"
import { existsSync, mkdirSync, readdirSync, readFileSync, writeFileSync } from "fs"
import { join, dirname } from "path"

// ─── Curated class lists ────────────────────────────────────────────

const CLASS_SCENE = [
  "Node","Node2D","Node3D","Resource",
  "CharacterBody2D","RigidBody2D","StaticBody2D","AnimatableBody2D","Area2D","CollisionShape2D","RayCast2D","ShapeCast2D",
  "CharacterBody3D","RigidBody3D","StaticBody3D","AnimatableBody3D","Area3D","CollisionShape3D","RayCast3D","ShapeCast3D",
  "Sprite2D","AnimatedSprite2D","Sprite3D","AnimatedSprite3D","MeshInstance2D","MeshInstance3D","MultiMeshInstance2D","MultiMeshInstance3D",
  "GPUParticles2D","GPUParticles3D","CPUParticles2D","CPUParticles3D",
  "Camera2D","Camera3D",
  "AnimationPlayer","AnimationTree","Tween","Timer",
  "AudioStreamPlayer","AudioStreamPlayer2D","AudioStreamPlayer3D",
  "TileMapLayer","TileSet",
  "Path2D","Path3D","PathFollow2D","PathFollow3D",
  "Control","CanvasLayer","HBoxContainer","VBoxContainer","GridContainer","MarginContainer","CenterContainer",
  "Label","Button","TextureRect","Panel","ColorRect","ProgressBar",
  "NavigationAgent2D","NavigationAgent3D","NavigationRegion2D","NavigationRegion3D",
  "PointLight2D","DirectionalLight2D","OmniLight3D","SpotLight3D","DirectionalLight3D",
  "RectangleShape2D","CircleShape2D","CapsuleShape2D","ConvexPolygonShape2D",
  "BoxShape3D","SphereShape3D","CapsuleShape3D","ConvexPolygonShape3D",
  "BoxMesh","SphereMesh","CylinderMesh","CapsuleMesh","PlaneMesh","QuadMesh","PrismMesh","TorusMesh",
  "StandardMaterial3D","CanvasItemMaterial","ShaderMaterial",
  "Vector2","Vector3","Color","Transform2D","Transform3D","Basis","Rect2",
  "PackedScene",
]

const CLASS_UNIFIED = [
  "Node","Node2D","Node3D","Object","RefCounted","Resource",
  "CharacterBody2D","RigidBody2D","StaticBody2D","AnimatableBody2D","Area2D","CollisionShape2D","CollisionPolygon2D","RayCast2D","ShapeCast2D",
  "CharacterBody3D","RigidBody3D","StaticBody3D","AnimatableBody3D","Area3D","CollisionShape3D","CollisionPolygon3D","RayCast3D","ShapeCast3D",
  "Sprite2D","AnimatedSprite2D","Sprite3D","AnimatedSprite3D","MeshInstance2D","MeshInstance3D","MultiMeshInstance2D","MultiMeshInstance3D",
  "GPUParticles2D","GPUParticles3D","CPUParticles2D","CPUParticles3D",
  "Camera2D","Camera3D",
  "AnimationPlayer","AnimationTree","Tween","Timer",
  "AudioStreamPlayer","AudioStreamPlayer2D","AudioStreamPlayer3D",
  "TileMapLayer","TileSet",
  "Path2D","Path3D","PathFollow2D","PathFollow3D","Curve2D","Curve3D",
  "Control","Container","CanvasLayer","CanvasItem",
  "HBoxContainer","VBoxContainer","GridContainer","MarginContainer","CenterContainer","PanelContainer","ScrollContainer",
  "Label","Button","TextureButton","LineEdit","ProgressBar","Slider","HSlider","VSlider","CheckBox","Panel","TextureRect","ColorRect",
  "Input","InputEvent",
  "PackedScene","Texture2D","AudioStream","Mesh","Material","StandardMaterial3D","ShaderMaterial","CanvasItemMaterial",
  "Shape2D","RectangleShape2D","CircleShape2D","CapsuleShape2D","ConvexPolygonShape2D",
  "Shape3D","BoxShape3D","SphereShape3D","CapsuleShape3D","ConvexPolygonShape3D",
  "PrimitiveMesh","BoxMesh","SphereMesh","CylinderMesh","CapsuleMesh","PlaneMesh",
  "NavigationAgent2D","NavigationAgent3D","NavigationRegion2D","NavigationRegion3D",
  "Light2D","PointLight2D","DirectionalLight2D","Light3D","OmniLight3D","SpotLight3D","DirectionalLight3D",
  "Vector2","Vector3","Vector4","Rect2","Transform2D","Transform3D","Basis","Quaternion","AABB","Plane","Color",
  "SceneTree","Engine","Callable","Signal",
]

const FILTER_MAP: Record<string, string[]> = {
  scene: CLASS_SCENE,
  unified: CLASS_UNIFIED,
}

// ─── BBCode → Markdown conversion ───────────────────────────────────

function convertBbcode(text: string): string {
  if (!text) return ""
  let t = text
  t = t.replace(/\[code\](.*?)\[\/code\]/g, "`$1`")
  t = t.replace(/\[b\](.*?)\[\/b\]/g, "**$1**")
  t = t.replace(/\[i\](.*?)\[\/i\]/g, "*$1*")
  t = t.replace(/\[(method|member|signal|param|constant|enum)\s+([^\]]+)\]/g, "`$2`")
  t = t.replace(/\[([A-Z][a-zA-Z0-9_]+)\]/g, "$1")
  t = t.replace(/\[url[^\]]*\].*?\[\/url\]/g, "")
  t = t.replace(/\[codeblock\][\s\S]*?\[\/codeblock\]/g, "")
  t = t.replace(/\[codeblocks\][\s\S]*?\[\/codeblocks\]/g, "")
  t = t.replace(/\s+/g, " ")
  return t.trim()
}

function firstSentence(text: string): string {
  const clean = convertBbcode(text)
  if (!clean) return ""
  const match = clean.match(/^[^.!?]*[.!?]/)
  return match ? match[0].trim() : clean.slice(0, 100).trim()
}

type DescMode = "none" | "first" | "full"

function getDescription(text: string | null, mode: DescMode): string {
  if (mode === "none" || !text) return ""
  if (mode === "first") return firstSentence(text)
  return convertBbcode(text)
}

// ─── XML parsing types (from fast-xml-parser) ───────────────────────

interface XmlParam {
  "@_name": string
  "@_type": string
  "@_default"?: string
}

interface XmlMember {
  "@_name": string
  "@_type": string
  "@_default"?: string
  "@_enum"?: string
  "#text"?: string
}

interface XmlMethod {
  "@_name": string
  "@_qualifiers"?: string
  return?: { "@_type": string }
  param?: XmlParam | XmlParam[]
  description?: { "#text"?: string }
}

interface XmlSignal {
  "@_name": string
  param?: XmlParam | XmlParam[]
  description?: { "#text"?: string }
}

interface XmlConstant {
  "@_name": string
  "@_value": string
  "@_enum"?: string
  "#text"?: string
}

interface XmlClass {
  "@_name": string
  "@_inherits"?: string
  brief_description?: { "#text"?: string }
  description?: { "#text"?: string }
  members?: { member: XmlMember | XmlMember[] }
  methods?: { method: XmlMethod | XmlMethod[] }
  signals?: { signal: XmlSignal | XmlSignal[] }
  constants?: { constant: XmlConstant | XmlConstant[] }
}

// ─── Helpers ────────────────────────────────────────────────────────

function asArray<T>(v: T | T[] | undefined): T[] {
  if (v === undefined || v === null) return []
  return Array.isArray(v) ? v : [v]
}

function shouldSkipClass(name: string): boolean {
  if (name === "@GlobalScope" || name === "@GDScript") return true
  if (name.startsWith("Editor") || name.startsWith("_")) return true
  if (name.endsWith("Plugin") || (name.endsWith("Server") && name !== "AudioServer")) return true
  return false
}

// ─── Class → Markdown ───────────────────────────────────────────────

function parseClass(
  xml: XmlClass,
  methodDesc: DescMode,
): string | null {
  const name = xml["@_name"]
  if (!name || shouldSkipClass(name)) return null

  const inherits = xml["@_inherits"] ?? ""
  const lines: string[] = []

  // Header
  lines.push(inherits ? `## ${name} <- ${inherits}` : `## ${name}`)
  lines.push("")

  // Brief description
  const brief = xml.brief_description?.["#text"]
  if (brief) {
    lines.push(firstSentence(brief))
    lines.push("")
  }

  // Properties
  const members = asArray(xml.members?.member)
  if (members.length > 0) {
    lines.push("**Props:**")
    for (const m of members) {
      let mtype = m["@_type"] ?? ""
      if (m["@_enum"]) mtype = `${mtype} (${m["@_enum"]})`
      const def = m["@_default"]
      lines.push(def ? `- ${m["@_name"]}: ${mtype} = ${def}` : `- ${m["@_name"]}: ${mtype}`)
    }
    lines.push("")
  }

  // Methods
  const methods = asArray(xml.methods?.method)
  const methodLines: string[] = []
  for (const m of methods) {
    const quals = m["@_qualifiers"] ?? ""
    if (quals.includes("virtual")) continue // skip virtual

    const retType = m.return?.["@_type"] ?? "void"
    const params = asArray(m.param)
    const paramStr = params
      .map((p) => {
        let s = `${p["@_name"]}: ${p["@_type"]}`
        if (p["@_default"] !== undefined) s += ` = ${p["@_default"]}`
        return s
      })
      .join(", ")

    const retStr = retType && retType !== "void" ? ` -> ${retType}` : ""
    const desc = getDescription(m.description?.["#text"] ?? null, methodDesc)
    const descStr = desc ? ` - ${desc}` : ""
    methodLines.push(`- ${m["@_name"]}(${paramStr})${retStr}${descStr}`)
  }
  if (methodLines.length > 0) {
    lines.push("**Methods:**")
    lines.push(...methodLines)
    lines.push("")
  }

  // Signals
  const signals = asArray(xml.signals?.signal)
  if (signals.length > 0) {
    lines.push("**Signals:**")
    for (const s of signals) {
      const params = asArray(s.param)
      const paramStr = params.length > 0
        ? `(${params.map((p) => `${p["@_name"]}: ${p["@_type"]}`).join(", ")})`
        : ""
      const desc = getDescription(s.description?.["#text"] ?? null, "none")
      const descStr = desc ? ` - ${desc}` : ""
      lines.push(`- ${s["@_name"]}${paramStr}${descStr}`)
    }
    lines.push("")
  }

  // Enums/Constants
  const constants = asArray(xml.constants?.constant)
  if (constants.length > 0) {
    const enums: Record<string, Array<{ name: string; value: string }>> = {}
    for (const c of constants) {
      const enumName = c["@_enum"] ?? "Constants"
      if (!enums[enumName]) enums[enumName] = []
      enums[enumName].push({ name: c["@_name"], value: c["@_value"] })
    }

    lines.push("**Enums:**")
    for (const [enumName, values] of Object.entries(enums)) {
      const valueStrs = values.slice(0, 10).map((v) => `${v.name}=${v.value}`)
      if (values.length > 10) valueStrs.push("...")
      lines.push(`**${enumName}:** ${valueStrs.join(", ")}`)
    }
    lines.push("")
  }

  return lines.join("\n")
}

// ─── Tool definition ────────────────────────────────────────────────

export default tool({
  description:
    "Convert Godot API XML class docs to compact LLM-friendly Markdown. " +
    "Two modes: 'lookup' (single class) and 'build' (generate full doc set). " +
    "Fetches XML docs from Godot GitHub via sparse checkout if not present. " +
    "Returns markdown text for lookup, or result summary for build.",
  args: {
    command: tool.schema
      .string()
      .describe(
        '"lookup" (get markdown for one class), "build" (generate full doc set), ' +
        '"list" (list available classes), or "ensure" (ensure XML docs are cloned)'
      ),
    className: tool.schema
      .string()
      .describe("Class name for lookup command, e.g. \"CharacterBody2D\"")
      .optional(),
    filter: tool.schema
      .string()
      .describe('Class filter for build: "unified" (default, ~128 classes), "scene", or "all"')
      .optional(),
    xmlDir: tool.schema
      .string()
      .describe("Path to Godot XML doc/classes directory. Default: .godot-docs/godot/doc/classes")
      .optional(),
    outputDir: tool.schema
      .string()
      .describe("Output directory for per-class .md files (build mode). Default: .godot-docs/api")
      .optional(),
    methodDesc: tool.schema
      .string()
      .describe('Method description mode: "none" (default), "first" (sentence), "full"')
      .optional(),
  },
  async execute(args, context) {
    const cwd = context.worktree ?? context.directory
    const resolve = (p: string) => (p.startsWith("/") ? p : join(cwd, p))

    const command = args.command?.trim()
    const defaultXmlDir = join(cwd, ".godot-docs", "godot", "doc", "classes")
    const xmlDir = args.xmlDir ? resolve(args.xmlDir) : defaultXmlDir
    const defaultOutputDir = join(cwd, ".godot-docs", "api")
    const outputDir = args.outputDir ? resolve(args.outputDir) : defaultOutputDir
    const methodDesc = (args.methodDesc?.trim() ?? "none") as DescMode

    // Dynamic import fast-xml-parser
    let XMLParser: typeof import("fast-xml-parser").XMLParser
    try {
      const fxp = await import("fast-xml-parser")
      XMLParser = fxp.XMLParser
    } catch {
      return JSON.stringify({ ok: false, error: "fast-xml-parser is not installed. Run: npm install fast-xml-parser" })
    }

    const parser = new XMLParser({
      ignoreAttributes: false,
      attributeNamePrefix: "@_",
      textNodeName: "#text",
      isArray: () => false,
    })

    function parseXmlFile(filePath: string): XmlClass | null {
      try {
        const xml = readFileSync(filePath, "utf-8")
        const parsed = parser.parse(xml)
        return parsed.class as XmlClass
      } catch {
        return null
      }
    }

    // ─── ensure: clone Godot docs via sparse checkout ───

    async function ensureDocs(): Promise<{ ok: boolean; path: string; error?: string }> {
      if (existsSync(xmlDir) && readdirSync(xmlDir).some((f) => f.endsWith(".xml"))) {
        return { ok: true, path: xmlDir }
      }

      let simpleGit: typeof import("simple-git")
      try {
        simpleGit = await import("simple-git")
      } catch {
        return { ok: false, path: xmlDir, error: "simple-git is not installed. Run: npm install simple-git" }
      }

      const repoDir = join(cwd, ".godot-docs", "godot")
      mkdirSync(dirname(repoDir), { recursive: true })

      try {
        const git = simpleGit.simpleGit()

        if (!existsSync(join(repoDir, ".git"))) {
          // Clone with sparse checkout
          await git.clone(
            "https://github.com/godotengine/godot.git",
            repoDir,
            ["--depth", "1", "--filter=blob:none", "--sparse"],
          )
        }

        const repoGit = simpleGit.simpleGit(repoDir)
        await repoGit.raw(["sparse-checkout", "set", "doc/classes"])

        return { ok: true, path: xmlDir }
      } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : String(err)
        return { ok: false, path: xmlDir, error: `Git clone failed: ${msg}` }
      }
    }

    // ─── ensure command ───
    if (command === "ensure") {
      const result = await ensureDocs()
      return JSON.stringify(result)
    }

    // ─── list command ───
    if (command === "list") {
      const filter = args.filter?.trim() ?? "unified"
      if (FILTER_MAP[filter]) {
        return JSON.stringify({ ok: true, filter, classes: FILTER_MAP[filter], count: FILTER_MAP[filter].length })
      }
      // List available XML files
      if (!existsSync(xmlDir)) {
        return JSON.stringify({ ok: false, error: `XML directory not found: ${xmlDir}. Run ensure first.` })
      }
      const files = readdirSync(xmlDir).filter((f) => f.endsWith(".xml")).map((f) => f.replace(".xml", "")).sort()
      return JSON.stringify({ ok: true, filter: "all", classes: files, count: files.length })
    }

    // ─── lookup command ───
    if (command === "lookup") {
      const className = args.className?.trim()
      if (!className) return JSON.stringify({ ok: false, error: "className is required for lookup" })

      // Ensure docs exist
      const ensureResult = await ensureDocs()
      if (!ensureResult.ok) return JSON.stringify(ensureResult)

      // Check pre-built cache first
      const cachedPath = join(outputDir, `${className}.md`)
      if (existsSync(cachedPath)) {
        return readFileSync(cachedPath, "utf-8")
      }

      // Parse from XML
      const xmlPath = join(xmlDir, `${className}.xml`)
      if (!existsSync(xmlPath)) {
        return JSON.stringify({ ok: false, error: `Class not found: ${className}` })
      }

      const xmlClass = parseXmlFile(xmlPath)
      if (!xmlClass) return JSON.stringify({ ok: false, error: `Failed to parse XML for ${className}` })

      const md = parseClass(xmlClass, methodDesc)
      if (!md) return JSON.stringify({ ok: false, error: `Class ${className} was skipped (editor/internal)` })

      return md
    }

    // ─── build command ───
    if (command === "build") {
      // Ensure docs exist
      const ensureResult = await ensureDocs()
      if (!ensureResult.ok) return JSON.stringify(ensureResult)

      const filter = args.filter?.trim() ?? "unified"
      const classFilter = FILTER_MAP[filter] ? new Set(FILTER_MAP[filter]) : null

      if (!existsSync(xmlDir)) {
        return JSON.stringify({ ok: false, error: `XML directory not found: ${xmlDir}` })
      }

      let xmlFiles = readdirSync(xmlDir).filter((f) => f.endsWith(".xml")).sort()
      if (classFilter) {
        xmlFiles = xmlFiles.filter((f) => classFilter.has(f.replace(".xml", "")))
      }

      mkdirSync(outputDir, { recursive: true })

      let converted = 0
      let skipped = 0
      const commonEntries: Array<{ name: string; inherits: string; brief: string }> = []
      const unifiedSet = new Set(CLASS_UNIFIED)

      for (const file of xmlFiles) {
        const xmlClass = parseXmlFile(join(xmlDir, file))
        if (!xmlClass) { skipped++; continue }

        const name = xmlClass["@_name"]
        if (!name || shouldSkipClass(name)) { skipped++; continue }

        const md = parseClass(xmlClass, methodDesc)
        if (!md) { skipped++; continue }

        writeFileSync(join(outputDir, `${name}.md`), md + "\n")
        converted++

        if (unifiedSet.has(name)) {
          const brief = xmlClass.brief_description?.["#text"]
            ? firstSentence(xmlClass.brief_description["#text"])
            : ""
          commonEntries.push({ name, inherits: xmlClass["@_inherits"] ?? "", brief })
        }
      }

      // Write index
      const indexLines = [`# Godot API Index (${commonEntries.length} classes)`, ""]
      for (const entry of commonEntries.sort((a, b) => a.name.localeCompare(b.name))) {
        const parent = entry.inherits ? ` <- ${entry.inherits}` : ""
        const desc = entry.brief ? ` \u2014 ${entry.brief}` : ""
        indexLines.push(`- ${entry.name}${parent}${desc}`)
      }
      writeFileSync(join(outputDir, "_index.md"), indexLines.join("\n") + "\n")

      return JSON.stringify({
        ok: true,
        converted,
        skipped,
        output_dir: outputDir,
        index: join(outputDir, "_index.md"),
      })
    }

    return JSON.stringify({
      ok: false,
      error: `Unknown command: "${command}". Use "lookup", "build", "list", or "ensure"`,
    })
  },
})
