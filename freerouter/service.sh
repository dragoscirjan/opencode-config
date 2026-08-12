#!/usr/bin/env bash

set -euo pipefail

app_dir="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
data_dir="${FREEROUTER_APP_DIR:-${app_dir}/data}"
pid_file="${data_dir}/freerouter.pid"
log_file="${data_dir}/freerouter.log"

mkdir -p "${data_dir}"

load_environment() {
  if [[ -f "${HOME}/.env" ]]; then
    set -a
    source "${HOME}/.env"
    set +a
  fi
}

is_running() {
  [[ -f "${pid_file}" ]] && kill -0 "$(<"${pid_file}")" 2>/dev/null
}

start() {
  load_environment
  if is_running; then
    printf 'FreeRouter is already running (PID %s)\n' "$(<"${pid_file}")"
    return 0
  fi

  rm -f "${pid_file}"
  if ! command -v bun >/dev/null 2>&1; then
    printf 'FreeRouter requires bun to run TypeScript entrypoints\n' >&2
    return 1
  fi

  nohup bun "${app_dir}/start.ts" >>"${log_file}" 2>&1 &
  printf '%s\n' "$!" >"${pid_file}"
  printf 'FreeRouter started (PID %s)\n' "$!"
}

stop() {
  if ! is_running; then
    rm -f "${pid_file}"
    printf 'FreeRouter is not running\n'
    return 0
  fi

  local pid
  pid="$(<"${pid_file}")"
  kill "${pid}"
  for _ in {1..50}; do
    kill -0 "${pid}" 2>/dev/null || break
    sleep 0.1
  done
  if kill -0 "${pid}" 2>/dev/null; then
    kill -TERM "${pid}" 2>/dev/null || true
  fi
  rm -f "${pid_file}"
  printf 'FreeRouter stopped\n'
}

restart() {
  stop
  sleep 1
  start
}

status() {
  if is_running; then
    printf 'FreeRouter is running (PID %s)\n' "$(<"${pid_file}")"
    return 0
  fi

  printf 'FreeRouter is not running\n'
  return 1
}

logs() {
  touch "${log_file}"
  tail -f "${log_file}"
}

case "${1:-}" in
start) start ;;
stop) stop ;;
restart) restart ;;
status) status ;;
logs) logs ;;
*)
  printf 'Usage: %s {start|stop|restart|status|logs}\n' "${BASH_SOURCE[0]}" >&2
  exit 2
  ;;
esac
