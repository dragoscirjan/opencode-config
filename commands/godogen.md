---
description: Generate a complete Godot 4 game from a natural language description
agent: game-director
---

Build a Godot 4 game from this description:

$ARGUMENTS

Follow your full pipeline:

1. **Resume check** — if a game plan spec exists in `.specs/`, resume from where you left off. Read the spec + knowledge graph for discoveries and skip to the next incomplete task.
2. **Design** — load `game-design` skill. Generate a visual target (`reference.png`), define art direction in a draft, decompose into risk-ordered tasks in a game plan spec (via `spec-create`).
3. **Architecture** — load `game-bootstrap` skill. Scaffold the project: `project.godot`, architecture notes (draft), scene stubs, and build order.
4. **Assets** — if a budget is provided, load `game-assets` skill. Plan and generate assets using the budget-aware system (Gemini/Grok/Tripo3D).
5. **Build** — load `game-execution` + `godot-engine` + `godot-gdscript` skills. Execute tasks in game plan order. For each task: implement, run headless test, capture screenshot, commit.
6. **QA** — after each major milestone, dispatch @worker-visual-qa for visual quality assessment against `reference.png`. Fix issues scoring below 7/10.
7. **Deliver** — final git commit, summary of what was built, and any platform export if requested.

If `$ARGUMENTS` includes a budget (e.g. "$5", "500 cents"), pass it to the asset generation pipeline. If it includes an export target (e.g. "export to Android", "build for Windows"), load `platform-export` skill and handle the export after the game is complete.
