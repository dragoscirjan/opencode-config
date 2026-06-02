#!/usr/bin/env bash
set -euo pipefail

# ──────────────────────────────────────────────────────────────
# switch-models.sh — Dynamic Model Switcher for OpenCode Agents
#
# Usage: ./scripts/switch-models.sh [--target normal|bb] <combination>
#
# Combinations automatically assign a Normal model to standard agents
# and a Big Brother model to escalation agents.
# ──────────────────────────────────────────────────────────────

readonly SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
readonly AGENTS_DIR="${SCRIPT_DIR}/../agents"
readonly SCRIPT_NAME="${0##*/}"

declare -A MODEL_NORMAL MODEL_BB

# ── LOCAL ──
MODEL_NORMAL[local_8gb]="ollama/qwen2.5-coder:7b"
MODEL_BB[local_8gb]="ollama/deepseek-r1:8b"

MODEL_NORMAL[local_16gb]="ollama/qwen2.5-coder:32b"
MODEL_BB[local_16gb]="ollama/deepseek-r1:14b"

# MODEL_NORMAL[local_32gb]="ollama/qwen2.5-coder:32b"
# MODEL_BB[local_32gb]="ollama/deepseek-r1:32b"
MODEL_NORMAL[local_32gb]="qwen/qwen3-coder-30b"
MODEL_BB[local_32gb]="ollama/deepseek-r1:32b"

MODEL_NORMAL[local_64gb]="ollama/qwen2.5-coder:72b"
MODEL_BB[local_64gb]="ollama/deepseek-r1:70b"

# ── OPENROUTER ──
MODEL_NORMAL[openrouter_ultra_budget]="qwen/qwen3.5-9b"
MODEL_BB[openrouter_ultra_budget]="deepseek/deepseek-v3.2"

MODEL_NORMAL[openrouter_value]="stepfun/step-3.5-flash"
MODEL_BB[openrouter_value]="minimax/minimax-m2.5"

MODEL_NORMAL[openrouter_standard]="google/gemini-3.1-pro-preview"
MODEL_BB[openrouter_standard]="openai/gpt-5.4"

MODEL_NORMAL[openrouter_premium]="anthropic/claude-sonnet-4.6"
MODEL_BB[openrouter_premium]="anthropic/claude-opus-4.6"

# ── COPILOT ──
MODEL_NORMAL[copilot_budget]="github-copilot/gpt-4o-mini"
MODEL_BB[copilot_budget]="github-copilot/o3-mini"

MODEL_NORMAL[copilot_standard]="github-copilot/gemini-3.1-pro-preview"
MODEL_BB[copilot_standard]="github-copilot/claude-sonnet-4.6"

MODEL_NORMAL[copilot_premium]="github-copilot/claude-sonnet-4.6"
MODEL_BB[copilot_premium]="github-copilot/claude-opus-4.6"

MODEL_NORMAL[copilot_architect]="github-copilot/gpt-5.4"
MODEL_BB[copilot_architect]="github-copilot/o1"

# ── Agent Groupings ──
readonly BB_AGENTS="worker-bb-coder worker-bb-oracle agent-architect"
readonly NORMAL_AGENTS="worker-lead-architect worker-tech-lead worker-code-reviewer worker-sys-architect worker-backend-dev worker-frontend-dev worker-devops product-owner lead-engineer tech-writer tech-advisor tech-storyteller game-director worker-game-designer worker-godot-expert worker-visual-qa"

usage() {
  cat <<EOF
Usage: ${SCRIPT_NAME} [--target normal|bb|all] <combination>

Options:
  --target <target>        Update only specific agents (normal, bb, all). Default is all.

Available Combinations:

  [LOCAL - by VRAM]
  local_8gb                (Qwen 7B -> DeepSeek 8B)
  local_16gb               (Qwen 32B -> DeepSeek 14B)
  local_32gb               (Qwen 30B -> DeepSeek 32B)
  local_64gb               (Qwen 72B -> DeepSeek 70B)

  [OPENROUTER - by Cost]
  openrouter_ultra_budget  (Qwen 9B -> DeepSeek V3.2)
  openrouter_value         (Step 3.5 Flash -> MiniMax M2.5)
  openrouter_standard      (Gemini 3.1 Pro -> GPT-5.4)
  openrouter_premium       (Sonnet 4.6 -> Opus 4.6)

  [GITHUB COPILOT]
  copilot_budget           (GPT-4o-mini -> o3-mini)
  copilot_standard         (Gemini 3.1 Pro -> Sonnet 4.6)
  copilot_premium          (Sonnet 4.6 -> Opus 4.6)
  copilot_architect        (GPT-5.4 -> o1)

EOF
}

switch_model() {
  local file="$1" new_model="$2" name
  name="$(basename "${file}" .md)"
  [[ ! -f "${file}" ]] && return

  local old_model
  old_model="$(grep -m1 '^model:' "${file}" | sed 's/^model: *//' || echo "")"

  if [[ -z "${old_model}" ]]; then
    echo "model: ${new_model}" >>"${file}"
    printf "  %-25s (New) → %s\n" "${name}" "${new_model}"
    return
  fi

  if [[ "${old_model}" == "${new_model}" ]]; then
    printf "  %-25s %s (unchanged)\n" "${name}" "${old_model}"
    return
  fi

  sed -i.bak -e "s|^model: .*|model: ${new_model}|g" "${file}" && rm -f "${file}.bak"
  printf "  %-25s %s → %s\n" "${name}" "${old_model}" "${new_model}"
}

main() {
  local target="all"

  if [[ $# -eq 0 ]] || [[ "$1" == "-h" ]] || [[ "$1" == "--help" ]]; then
    usage
    exit 0
  fi

  if [[ "$1" == "--target" ]]; then
    if [[ $# -lt 3 ]]; then
      echo "Error: --target requires an argument (normal, bb, all) followed by a combination" >&2
      exit 1
    fi
    target="$2"
    shift 2
  fi

  local profile="$1"

  if [[ -z "${MODEL_NORMAL[${profile}]+set}" ]]; then
    echo "Error: Unknown combination '${profile}'" >&2
    exit 1
  fi

  local normal_model="${MODEL_NORMAL[${profile}]}"
  local bb_model="${MODEL_BB[${profile}]}"

  echo "Switching agents (Target: ${target}) to combination: ${profile}"
  [[ "${target}" == "all" || "${target}" == "normal" ]] && echo "  Normal Agents:      ${normal_model}"
  [[ "${target}" == "all" || "${target}" == "bb" ]] && echo "  Big Brother Agents: ${bb_model}"
  echo "--------------------------------------------------------"

  if [[ "${target}" == "all" || "${target}" == "bb" ]]; then
    echo "Updating Big Brother Agents..."
    for agent in ${BB_AGENTS}; do
      switch_model "${AGENTS_DIR}/${agent}.md" "${bb_model}"
    done
    echo ""
  fi

  if [[ "${target}" == "all" || "${target}" == "normal" ]]; then
    echo "Updating Normal Agents..."
    for agent in ${NORMAL_AGENTS}; do
      switch_model "${AGENTS_DIR}/${agent}.md" "${normal_model}"
    done
  fi

  echo "--------------------------------------------------------"
  echo "Done!"
}

main "$@"
