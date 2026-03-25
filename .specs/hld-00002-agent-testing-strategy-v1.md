# HLD — Agent Testing Strategy

---
Document Type: High-Level Design
ID: 00002
Name: agent-testing-strategy
Version: v1
Status: Current
Repository: [dragoscirjan/opencode-config](https://github.com/dragoscirjan/opencode-config)
Date: 2026-03-29
Author: opencode:architect
---

## 1. Requirements

### Functional Requirements

- The system must provide a means to test agent behavioral compliance across four key behaviors: attribution tagging in output files, file naming convention enforcement, CVS versus filesystem mode selection, and stop-point compliance.
- The system must support outcome-based testing by invoking real agents as subagents inside an isolated sandbox and asserting on the files they produce.
- The system must support prompt-unit testing in isolation — evaluating whether a model correctly comprehends an agent prompt — without executing real tool calls.
- The system must drive a prompt optimization feedback loop, enabling developers to identify which instructions in an agent prompt are redundant and can be safely removed without behavioral regression.
- Both testing layers must be runnable locally by a developer and in continuous integration via GitHub Actions.

### Non-Functional Requirements

- **Layer 2 cost:** Each promptfoo evaluation run must cost no more than $0.05. All promptfoo provider configurations must use a cheap-tier inference model (haiku or flash class, at or below $1 per million tokens). Claude Sonnet-class models are explicitly prohibited in Layer 2 provider configurations.
- **Layer 1 cost:** A full Layer 1 suite run must cost no more than $0.50, based on approximately four scenarios each consuming around 30,000 tokens. A per-scenario step budget is enforced via the `max-steps` field in each scenario file.
- **Sandbox isolation:** Each Layer 1 scenario runs in its own subdirectory under `.test-workspace/`, cleaned up before and after the run. Per-scenario isolation also enables parallel execution of multiple scenarios.
- **Determinism:** Both the promptfoo runner and the `qa` agent must be configured with a temperature of 0.1 to maximize reproducibility across runs.
- **State isolation:** No agent prompt state, tool history, or file system side-effects may leak between test runs.

## 2. Architecture

The system is composed of two independent testing layers plus a manual optimization workflow that coordinates them. The layers share no runtime dependency — Layer 2 (promptfoo) never invokes Layer 1 infrastructure, and the `qa` agent never calls the promptfoo runner during a standard test run. The two layers are linked only in the context of the developer-driven prompt optimization workflow.

### Components

**`qa` agent** is the primary orchestrator for Layer 1 outcome testing. It reads scenario files, invokes the target agent as a subagent via the Task tool, then shells out to the bash executor to evaluate each assertion predicate. It does not use LLM reasoning to evaluate outcomes — it acts purely as an orchestrator and coordinator, never as a judge.

**Sandbox-escape guard** is a safety mechanism built into the `qa` agent's subagent invocation. The Task prompt passed to the target agent explicitly declares the working directory boundary: the agent is instructed that it may only write to `.test-workspace/<scenario-id>/`. After the agent completes, the `qa` agent runs a bash diff check against the git working tree to verify no files were modified outside that subtree. Any out-of-tree write results in an immediate FAIL and test abort.

**Bash executor** is the deterministic assertion engine. For each expect-rule predicate defined in a scenario file, the `qa` agent shells out to bash and evaluates the predicate. The predicate types supported are: `file-exists`, `grep`, `not-grep`, and `exit-code`. A zero exit code means the assertion passes; any non-zero exit code means it fails. No language model is involved in the assertion path, eliminating the risk of hallucinated PASS results.

**`/test` command** is the user-facing entry point — a slash command that accepts optional `--scenario` and `--tag` filters and delegates execution to the `qa` agent.

**`evals/scenarios/`** holds the Layer 1 test scenario definitions. Each scenario is a self-describing markdown file containing the agent under test, setup steps, the prompt to issue, and a structured YAML block of expect-rule predicates.

**promptfoo runner** is the Layer 2 evaluation engine, invoked via `npx promptfoo eval`. It reads `evals/promptfooconfig.yaml`, loads per-agent provider configurations from `evals/providers/`, applies assertion rules from `evals/assertions/`, and writes a JUnit-compatible XML report to `evals/.output/junit.xml` and an HTML report to `evals/.output/report.html`.

**`evals/providers/`** contains per-agent promptfoo provider configuration files. Each file isolates the prompt of a specific agent under test and specifies the cheap-tier inference model to use.

**`evals/assertions/`** contains reusable assertion helpers. These serve dual purpose: as bash predicate helpers consumed by the bash executor in Layer 1, and as importable assertion functions referenced in `promptfooconfig.yaml` for Layer 2.

**`.test-workspace/<scenario-id>/`** is the ephemeral per-scenario sandbox directory. It is created fresh for each run and deleted on teardown. Because each scenario gets its own subdirectory, multiple scenarios can execute in parallel without interference. The `qa` agent pre-cleans all scenario subdirectories on startup to recover from any previous failed teardown.

**CI workflow** is a GitHub Actions workflow that runs Layer 2 automatically on every push and pull request, uploading the `evals/.output/` directory as a build artifact. Layer 1 is available on-demand via `workflow_dispatch`.

### Component Interactions

The `/test` command invokes the `qa` agent with an optional scenario filter. The `qa` agent reads matching scenario files from `evals/scenarios/`, then for each scenario invokes the target agent as a Task tool subagent. The target agent writes its outputs into the per-scenario sandbox subdirectory. The `qa` agent then runs the bash executor against each expect-rule predicate and collects results. After assertion, the sandbox is torn down. Results are emitted as JSONL to stdout and written as JUnit XML to `evals/.output/layer1-junit.xml`.

The promptfoo runner is invoked independently — either by a developer on the command line or by the CI workflow — and has no runtime dependency on the `qa` agent. In the prompt optimization workflow, a developer manually runs the promptfoo runner first as a cheap gate, and only proceeds to invoke the `qa` agent if the promptfoo run passes.

### System Diagram

```mermaid
graph TD
    User -->|/test [filter]| TestCmd[/test command]
    TestCmd --> QA[qa agent]

    subgraph Layer1 [Layer 1 — Outcome Testing]
        QA -->|reads| Scenarios[evals/scenarios/*.md]
        QA -->|invokes via Task| RealAgent[target agent]
        RealAgent -->|writes to| Sandbox[.test-workspace/scenario-id/]
        QA -->|asserts on| Sandbox
        QA -->|teardown| Sandbox
        QA -->|emits JSONL| Results[stdout / junit.xml]
    end

    subgraph Layer2 [Layer 2 — Prompt Unit Testing]
        CI[GitHub Action] -->|npx promptfoo eval| Promptfoo[promptfoo runner]
        LocalDev[developer] -->|npx promptfoo eval| Promptfoo
        Promptfoo -->|loads| Providers[evals/providers/]
        Promptfoo -->|applies| Assertions[evals/assertions/]
        Promptfoo -->|reads cfg| Config[evals/promptfooconfig.yaml]
        Promptfoo -->|writes| Artifacts[evals/.output/junit.xml + report.html]
    end

    subgraph OptLoop [Optimization Workflow — developer manual]
        Dev2[developer] -->|1 run L2 first| Promptfoo
        Dev2 -->|2 if L2 passes, run L1| QA
    end
```

## 3. Data Models

### ScenarioFile

A scenario file is a markdown document that fully describes a single Layer 1 test case. It carries the following fields:

- **id** — unique scenario identifier, used as the sandbox subdirectory name and result key.
- **agent** — the name of the agent under test.
- **tags** — a list of string labels used for filtering (e.g., `attribution`, `cvs-mode`).
- **skip / xfail flag** — optional; marks the scenario as skipped or expected to fail.
- **max-steps** — integer upper bound on the number of agent loop steps permitted; enforced by the `qa` agent to cap cost and prevent runaway loops.
- **setup-steps** — ordered list of filesystem operations to perform before the agent is invoked (e.g., creating prerequisite directories).
- **prompt-text** — the exact prompt string to issue to the target agent.
- **teardown-steps** — optional ordered list of cleanup operations. If absent, the `qa` agent applies a generic teardown that deletes the scenario sandbox subdirectory.
- **expect-rules** — a structured YAML fenced block. Each rule is a bash-evaluable predicate with three fields: `check` (one of `file-exists`, `grep`, `not-grep`, or `exit-code`), `target` (a file path relative to the sandbox), and `pattern` (a string or regular expression to match). Rules are evaluated by the bash executor; no language model is involved.

Each `ScenarioFile` produces exactly one `ScenarioResult` when processed by the `qa` agent.

### ScenarioResult

A `ScenarioResult` captures the outcome of a single scenario run. It contains: the scenario identifier, an overall pass/fail status, the identifiers of any failing rules, the paths of files present in the sandbox at assertion time, the number of agent steps consumed, and the wall-clock duration. Results are written as JSON to `evals/results/<scenario-id>-<timestamp>.json`, which is gitignored.

### PromptfooConfig

The promptfoo configuration document (`evals/promptfooconfig.yaml`) defines the full set of Layer 2 tests. It references the per-agent provider configurations in `evals/providers/` and specifies test cases and assertion rules for each behavioral check. Each test case produces one `PromptfooResult`.

### PromptfooResult

A `PromptfooResult` captures the outcome of a single promptfoo test case: the test identifier, pass/fail status, the model's raw response, and the detailed assertion evaluation.

### OptimizationRecord

An `OptimizationRecord` captures one iteration of the prompt optimization loop. It contains: the behavior under test, the original instruction text, the candidate reduction or rewrite, the Layer 2 result, the Layer 1 result, and a final verdict (redundant or required). Records are appended to `evals/optimization-log.md` in human-readable form.

## 4. Interfaces

### `/test` command

The `/test` slash command accepts two optional filters: `--scenario <id>` to run a single named scenario, and `--tag <tag>` to run all scenarios carrying a given tag. With no arguments it runs the full suite. It delegates immediately to the `qa` agent.

### `qa` agent

The `qa` agent reads scenario files from `evals/scenarios/`. For each scenario it sets up the sandbox, invokes the target agent via the Task tool, and then calls the bash executor for each expect-rule predicate. It emits one JSONL line per scenario to stdout in the form `{"id": "...", "status": "pass|fail", "assertions": [...], "duration_ms": N}`, followed by a final summary line `{"total": N, "passed": N, "failed": N}`. It exits with a non-zero status code if any scenario fails. It also writes a JUnit-compatible XML report to `evals/.output/layer1-junit.xml` for CI artifact upload, and writes per-scenario JSON result files to `evals/results/`.

### Bash executor

The bash executor is invoked by the `qa` agent once per expect-rule. It receives the check type, the target file path, and an optional pattern. It returns exit code 0 on success and non-zero on failure. No language model is involved at any point in its execution.

### promptfoo runner

The promptfoo runner is invoked via the standard `npx promptfoo eval` command-line interface. Provider configurations in `evals/providers/` must specify a cheap-tier model. The runner writes a JUnit XML report to `evals/.output/junit.xml` and an HTML report to `evals/.output/report.html`. The HTML report is also viewable through the promptfoo.dev web interface under the free tier.

### `evals/assertions/`

This directory exposes reusable bash predicate helper scripts that the bash executor can call for common assertion patterns. The same helpers are also importable as assertion functions within `promptfooconfig.yaml` for use in Layer 2 test definitions.

## 5. Design Decisions

**Outcome testing over process testing.** The system tests what files exist and what they contain, rather than which tools the agent called or in what order. This makes the test suite resilient to prompt refactoring — an agent can be rewritten to achieve the same outcome differently without breaking tests. The trade-off is reduced visibility into the agent's internal tool-call sequence; that level of detail is deferred to the LLD.

**Self-hosted `qa` agent over an external test harness.** Using OpenCode itself as the test orchestrator avoids introducing any new infrastructure. The trade-off is a circular dependency: the `qa` agent's own behavior is unverified by the system it controls. This is mitigated by keeping the `qa` agent prompt minimal and pinning its version, and by the static JSONL schema validator described in the Risks section.

**promptfoo for Layer 2 over bespoke evaluation scripts.** promptfoo is an open-source, CI-ready tool with a standard assertion DSL and a free web tier. The trade-off is an external dependency and the need to keep provider configurations synchronized with agent prompt changes.

**Temperature 0.1 for both layers.** A low temperature maximizes run-to-run reproducibility, which is essential for a regression testing workflow. The trade-off is that genuinely flaky behaviors that only manifest at higher temperatures will not be caught.

**Structured YAML expect-blocks with bash-evaluable predicates over freeform prose.** Scenario expect-rules use a typed, machine-parseable YAML schema. This eliminates the need for any LLM to interpret assertion intent and removes all assertion non-determinism. The trade-off is that scenario authors must learn the expect-rule schema, and complex semantic checks (e.g., "does this output make logical sense?") are out of scope.

**Bash executor over LLM-as-judge for assertions.** Using shell predicates produces deterministic, perfectly reproducible assertion results. There is no risk of a hallucinated PASS verdict for a failing scenario. The trade-off is that the assertion vocabulary is limited to file existence, grep patterns, and exit codes. Semantic or natural-language assertions are explicitly out of scope for this design.

**Prompt-boundary instruction plus post-run diff check over OS-level sandboxing.** Constraining the target agent's write scope via the Task prompt, combined with a post-run git diff verification, avoids any need for containerization infrastructure. The trade-off is that this is a defence-in-depth approach rather than a hard enforcement mechanism: a sufficiently adversarial or malfunctioning agent could ignore the prompt boundary. This is accepted as appropriate for a developer test-tooling context.

**Cheap-tier inference models mandatory for Layer 2 providers.** Restricting Layer 2 providers to haiku or flash-class models (at or below $1 per million tokens) keeps the cost of a full promptfoo run within the $0.05 target. The trade-off is that cheaper models have lower capability and may miss subtle reasoning failures that a stronger model would catch.

**Two-layer gate as a developer workflow, not a runtime `qa` agent dependency.** The `qa` agent and the promptfoo runner are fully independent at runtime. The two-layer gate — running Layer 2 first as a cheap filter before committing to an expensive Layer 1 run — is a manual developer practice used during prompt optimization. The trade-off is that Layer 2 false positives are possible: a model may correctly comprehend a prompt yet still fail to execute the behavior correctly in practice.

**Per-scenario sandbox subdirectories over a single shared directory.** Giving each scenario its own subdirectory under `.test-workspace/` means scenarios do not interfere with one another and can be executed in parallel. The trade-off is marginally more path management logic in the `qa` agent.

## 6. Prompt Optimization Workflow

The core purpose of this system is to support iterative reduction of agent prompt size without behavioral regression. The workflow is manual and developer-driven, using the two testing layers as a cost-efficient gate sequence.

1. **Establish a baseline.** Write or identify a test scenario (or promptfoo test case) for the specific behavior you want to optimize. Run both layers and confirm that all tests pass. This passing state is the baseline.

2. **Propose a candidate reduction.** Remove or shorten the instruction in the agent prompt that teaches the target behavior.

3. **Run Layer 2 first (cheap gate, ~$0.02).** Execute `npx promptfoo eval` targeting the affected test cases.
   - If Layer 2 **fails**: the model no longer comprehends the behavior from the reduced prompt. Try a more concise rewrite of the instruction rather than full removal, and return to step 2.
   - If Layer 2 **passes**: proceed to step 4.

4. **Run Layer 1 (real execution gate, ~$0.10 per scenario).** Execute `/test --scenario <id>` to invoke the actual agent in the sandbox.
   - If Layer 1 **fails**: the instruction is needed despite passing the comprehension check. There is a gap between prompt understanding and real execution behavior. Restore the instruction and record the result in the Optimization Log with verdict `required`.
   - If Layer 1 **passes**: the instruction was redundant. Keep the removal and record the result with verdict `redundant`.

5. **Record the outcome.** Append an Optimization Record to `evals/optimization-log.md`. The record captures the behavior identifier, the original instruction, the candidate reduction, both layer results, and the final verdict.

6. **Terminate when exhausted.** When no further removal candidates remain for the target behavior, move to the next behavior in the optimization backlog.

## 7. Risks and Open Questions

### Risks

**Sandbox escape.** Real agents are granted unrestricted file edit permissions and could write to `agents/`, `commands/`, or other repository paths outside the test sandbox. The prompt-boundary instruction is advisory only. This risk is mitigated by a post-run bash diff check: the `qa` agent compares the git working tree state against the `.test-workspace/<scenario-id>/` path prefix. Any modification detected outside that subtree causes an immediate FAIL and test abort.

**LLM assertion non-determinism.** If the `qa` agent were to use LLM reasoning to evaluate test outcomes, its verdicts would be probabilistic. Even at temperature 0.1 there is a non-zero probability of a hallucinated PASS for a failing scenario. This is mitigated by design: all expect-rules are bash-evaluable predicates evaluated by the deterministic bash executor. The `qa` agent is an orchestrator only; it never acts as an assertion judge.

**`qa` agent prompt drift.** The `qa` agent's own behavior is not verified by the test framework it controls. If the `qa` agent develops prompt drift, all test results become unreliable. This is mitigated by keeping the `qa` agent prompt as small as possible and pinning its version. Additionally, `scripts/validate-qa-output.sh` is a static, LLM-free script that parses the `qa` agent's JSONL output for schema compliance, providing an independent sanity check.

**Circular dependency.** The `qa` agent tests other agents, but nothing tests the `qa` agent itself. If it is broken, the system may silently produce incorrect results. This is partially addressed by the static validator script above. A future qa-qa bootstrap (a minimal hand-written scenario that validates `qa` agent output format) is identified as an open question.

**Sandbox directory pollution.** If a test run is interrupted mid-execution before teardown completes, stale files may accumulate in `.test-workspace/`. The `qa` agent pre-cleans all per-scenario subdirectories on startup to recover from this condition.

**Provider API rate limiting.** The `npx promptfoo eval` command runs entirely locally and is not subject to any promptfoo.dev rate limits. However, the underlying LLM provider API (Anthropic, etc.) imposes its own rate limits. This is mitigated by limiting CI batch sizes to a maximum of ten test cases per run and adding retry logic with exponential backoff in the CI workflow.

### Open Questions

- Should Layer 1 scenarios be executable headlessly — that is, without the OpenCode UI, via a pure command-line invocation?
- Should there be a minimal qa-qa bootstrap: a static, hand-written scenario that validates the `qa` agent's own output format, independent of LLM behavior?
- Should optimization records be committed to version control (the current approach: `evals/optimization-log.md`) or treated as ephemeral and excluded from the repository?
- What is the versioning strategy for scenario files when an agent prompt changes significantly enough to invalidate the existing scenario baseline?

## 8. Assumptions

- The OpenCode Task tool supports subagent invocation in the current deployment environment.
- Node.js and `npx` are available in the CI runner environment, making `npx promptfoo eval` executable without a separate install step.
- The starter test suite covers the four highest-priority behaviors: agent attribution tagging, CVS versus filesystem mode selection, file naming convention compliance, and Athena agent stop-point enforcement.
- The prompt optimization workflow is manual and iterative. Automated bisection tooling is out of scope for this design.
- The supported expect-rule predicate types are: `file-exists`, `grep`, `not-grep`, and `exit-code`. Semantic or natural-language assertions are out of scope.

**Explicit task (not an assumption):** The entries `.test-workspace/`, `evals/results/`, and `evals/.output/` must be added to `.gitignore`. This is a required deliverable, not a pre-existing condition.

## 9. Directory Structure

```
evals/
  scenarios/
    po-001-attribution.md         Layer 1: verifies agent attribution tagging in output files
    po-002-cvs-mode.md            Layer 1: verifies CVS vs filesystem mode selection
    po-003-naming-convention.md   Layer 1: verifies 5-digit zero-padded IDs and kebab-case filenames
    athena-001-stop-points.md     Layer 1: verifies Athena agent does not auto-proceed after phase end
  promptfooconfig.yaml            Layer 2: all prompt unit test definitions
  providers/                      Per-agent promptfoo provider configurations (cheap-tier model required)
  assertions/                     Reusable bash predicate helpers (Layer 1) and promptfoo imports (Layer 2)
  .output/                        Gitignored — JUnit XML and HTML reports for both layers
  results/                        Gitignored — ScenarioResult JSON files, one per run
  optimization-log.md             Append-only optimization record log (committed to version control)

agents/qa.md                      qa agent system prompt
                                  GLOBAL scope: lives at ~/.config/opencode/agents/
                                  Always available regardless of which project is open.
                                  Portability is intentional.

commands/test.md                  /test slash command
                                  GLOBAL scope: lives at ~/.config/opencode/commands/
                                  Invokes the qa agent from any project context.

scripts/validate-qa-output.sh     Static (LLM-free) bootstrap script — validates qa agent JSONL output schema

.test-workspace/                  Ephemeral sandbox root — gitignored; per-scenario subdirectories

.gitignore                        Must include: .test-workspace/, evals/results/, evals/.output/
```
