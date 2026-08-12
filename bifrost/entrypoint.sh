#!/usr/bin/env bash

set -eo pipefail

# Smart entrypoint for Bifrost inside Docker.
# Runs start.ts directly via Bun. Data directory is preserved across restarts.

app_dir="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
data_dir="${BIFROST_APP_DIR:-${app_dir}/data}"

mkdir -p "${data_dir}"

setup="${BIFROST_SETUP:-default-test}"
printf 'Starting Bifrost (setup=%s, data=%s)\n' "${setup}" "${data_dir}"

exec bun "${app_dir}/start.ts"
