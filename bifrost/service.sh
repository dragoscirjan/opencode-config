#!/usr/bin/env bash

set -eo pipefail

app_dir="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
data_dir="${BIFROST_APP_DIR:-${app_dir}/data}"
pid_file="${data_dir}/bifrost.pid"
log_file="${data_dir}/bifrost.log"

mkdir -p "${data_dir}"

load_environment() {
  if [[ -f "${HOME}/.env" ]]; then
    set -a
    source "${HOME}/.env"
    set +a
  fi
}

is_running() {
  [[ -f "${pid_file}" ]] || return 1

  local pid command
  pid="$(<"${pid_file}")"
  [[ "${pid}" =~ ^[0-9]+$ ]] || return 1
  kill -0 "${pid}" 2>/dev/null || return 1

  # Avoid treating a reused PID as our Bifrost supervisor.
  [[ -r "/proc/${pid}/cmdline" ]] || return 1
  command="$(tr '\0' ' ' <"/proc/${pid}/cmdline")"
  [[ "${command}" == *"${app_dir}/start.ts"* ]]
}

process_group_running() {
  local pid="$1"
  kill -0 -- "-${pid}" 2>/dev/null
}

start() {
  load_environment
  local setup="${1:-${BIFROST_SETUP:-default}}"
  case "${setup}" in
  default | local | remote | default-test) ;;
  *)
    printf 'Unknown setup: %s (expected default, local, or remote)\n' "${setup}" >&2
    return 2
    ;;
  esac
  if is_running; then
    printf 'Bifrost already running (PID %s); stop first to switch setup\n' "$(<"${pid_file}")"
    return 0
  fi

  [[ -v "$BIFROST_CLEANUP" ]] && rm -rf "${data_dir}"

  rm -f "${pid_file}"
  BIFROST_SETUP="${setup}" nohup setsid node "${app_dir}/start.ts" >>"${log_file}" 2>&1 &
  printf '%s\n' "$!" >"${pid_file}"
  printf 'Bifrost started (PID %s)\n' "$!"
}

stop() {
  if ! is_running; then
    rm -f "${pid_file}"
    printf 'Bifrost is not running\n'
    return 0
  fi

  local pid
  pid="$(<"${pid_file}")"
  # setsid makes supervisor PID equal process-group ID. Kill descendants too.
  kill -TERM -- "-${pid}" 2>/dev/null || kill "${pid}"
  for _ in {1..50}; do
    process_group_running "${pid}" || break
    sleep 0.1
  done
  if process_group_running "${pid}"; then
    kill -KILL -- "-${pid}" 2>/dev/null || true
  fi
  rm -f "${pid_file}"
  printf 'Bifrost stopped\n'
}

restart() {
  local setup="${1:-${BIFROST_SETUP:-default}}"
  stop
  sleep 1
  start "${setup}"
}

logs() {
  touch "${log_file}"
  tail -f "${log_file}"
}

case "${1:-}" in
start) start "${2:-}" ;;
stop) stop ;;
restart) restart "${2:-}" ;;
logs) logs ;;
*)
  printf 'Usage: %s {start|stop|restart} [default|local|remote] | logs\n' "${BASH_SOURCE[0]}" >&2
  exit 2
  ;;
esac
