#!/usr/bin/env bash
set -euo pipefail

# ──────────────────────────────────────────────────────────────
# switch-models.sh — Bulk-swap model providers across all agents
#
# Usage: ./scripts/switch-models.sh <keyword>
#   Keywords: free | copilot | anthropic | openai | openrouter
#
# Edit the maps below to adjust model IDs.
# ──────────────────────────────────────────────────────────────

readonly SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
readonly AGENTS_DIR="${SCRIPT_DIR}/../agents"
readonly SCRIPT_NAME="${0##*/}"

# ── Model maps ────────────────────────────────────────────────
# Each keyword defines two tiers:
#   STRONG  = opus-class (worker-lead-architect, worker-tech-lead, worker-code-reviewer, agent-architect)
#   FAST    = sonnet-class (architect, developers, devops, orchestrators)

declare -A MODEL_STRONG MODEL_FAST

MODEL_STRONG[copilot]="github-copilot/claude-opus-4.6"
MODEL_FAST[copilot]="github-copilot/claude-sonnet-4.6"

MODEL_STRONG[copilot_google]="github-copilot/gemini-3.1-pro-preview"
MODEL_FAST[copilot_google]="github-copilot/gemini-3.1-pro-preview"

MODEL_STRONG[copilot_gpt]="github-copilot/gpt-5.4"
MODEL_FAST[copilot_gpt]="github-copilot/gpt-5.3-codex"

MODEL_STRONG[anthropic]="anthropic/claude-opus-4-2025-04-16"
MODEL_FAST[anthropic]="anthropic/claude-sonnet-4-20250514"

MODEL_STRONG[openai]="openai/o3"
MODEL_FAST[openai]="openai/gpt-4.1"

MODEL_STRONG[openrouter]="openrouter/anthropic/claude-opus-4"
MODEL_FAST[openrouter]="openrouter/anthropic/claude-sonnet-4"

# Free tier — best-effort reasoning & code gen from free models
MODEL_STRONG[free]="opencode/nemotron-3-super-free"
MODEL_FAST[free]="opencode/gpt-5-nano"

# ── Agent tier assignments ────────────────────────────────────
# STRONG-tier agents (need reasoning power)
readonly STRONG_AGENTS="worker-lead-architect worker-tech-lead worker-code-reviewer agent-architect"
# FAST-tier agents (volume work, orchestration)
readonly FAST_AGENTS="worker-sys-architect worker-backend-dev worker-frontend-dev worker-devops product-owner lead-engineer tech-writer tech-advisor game-director worker-game-designer worker-godot-expert worker-visual-qa"

# ── Functions ─────────────────────────────────────────────────

usage() {
  cat <<EOF
Usage: ${SCRIPT_NAME} <keyword>

Keywords:
  copilot     GitHub Copilot models (claude-opus/sonnet via Copilot)
  anthropic   Direct Anthropic API
  openai      OpenAI models (o3 / gpt-4.1)
  openrouter  OpenRouter-proxied models
  free        Free-tier models (all agents get lightweight model)

Current models:
EOF
  for agent_file in "${AGENTS_DIR}"/*.md; do
    local name
    name="$(basename "${agent_file}" .md)"
    local current
    current="$(grep -m1 '^model:' "${agent_file}" 2>/dev/null | sed 's/^model: *//' || echo "???")"
    printf "  %-25s %s\n" "${name}" "${current}"
  done
}

switch_model() {
  local file="$1" new_model="$2" name
  name="$(basename "${file}" .md)"

  local old_model
  old_model="$(grep -m1 '^model:' "${file}" | sed 's/^model: *//')"

  if [[ "${old_model}" == "${new_model}" ]]; then
    printf "  %-25s %s (unchanged)\n" "${name}" "${old_model}"
    return
  fi

  # Portable sed in-place (works on macOS and Linux)
  # Use | as delimiter since model IDs contain /
  sed -i.bak -e "s|^model: .*|model: ${new_model}|g" "${file}" && rm -f "${file}.bak"

  printf "  %-25s %s → %s\n" "${name}" "${old_model}" "${new_model}"
}

main() {
  if [[ $# -lt 1 ]] || [[ "$1" == "-h" ]] || [[ "$1" == "--help" ]]; then
    usage
    exit 0
  fi

  local keyword="$1"

  if [[ -z "${MODEL_STRONG[${keyword}]+set}" ]]; then
    echo "Error: Unknown keyword '${keyword}'" >&2
    echo "Valid keywords: copilot | anthropic | openai | openrouter | free" >&2
    exit 1
  fi

  local strong="${MODEL_STRONG[${keyword}]}"
  local fast="${MODEL_FAST[${keyword}]}"

  echo "Switching to: ${keyword}"
  echo "  STRONG (opus-tier):  ${strong}"
  echo "  FAST   (sonnet-tier): ${fast}"
  echo ""

  for agent in ${STRONG_AGENTS}; do
    local file="${AGENTS_DIR}/${agent}.md"
    if [[ -f "${file}" ]]; then
      switch_model "${file}" "${strong}"
    else
      printf "  %-25s (not found, skipped)\n" "${agent}"
    fi
  done

  for agent in ${FAST_AGENTS}; do
    local file="${AGENTS_DIR}/${agent}.md"
    if [[ -f "${file}" ]]; then
      switch_model "${file}" "${fast}"
    else
      printf "  %-25s (not found, skipped)\n" "${agent}"
    fi
  done

  echo ""
  echo "Done."
}

main "$@"
