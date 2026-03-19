---
name: lang-bash
description: Bash/Shell scripting standards — style, tooling, patterns, testing, and cross-platform compatibility. Load when working on shell scripts.
---

# Bash / Shell Scripting Standards

## Shebang and Strict Mode

Always start scripts with:

```bash
#!/usr/bin/env bash
set -euo pipefail
```

- `set -e`: Exit on error
- `set -u`: Error on undefined variables
- `set -o pipefail`: Pipe fails if any command fails

**Runtime**: Bash 4.0+. All scripts must work on both macOS and Linux.

---

## Code Style

Follow [Google Shell Style Guide](https://google.github.io/styleguide/shellguide.html).

**Tooling (mandatory)**:
- `shellcheck` — static analysis
- `shfmt` — formatting

Run before committing:

```bash
shellcheck script.sh
shfmt -w script.sh
```

---

## Naming Conventions

```bash
# Constants: UPPER_SNAKE_CASE
readonly MAX_RETRIES=3
readonly CONFIG_FILE="/etc/myapp/config"

# Variables: lower_snake_case
local user_name=""
local file_count=0

# Functions: lower_snake_case
process_file() {
    local file_path="$1"
}
```

---

## Variable Quoting

Quote all variable expansions to avoid word-splitting and globbing:

```bash
# Good
echo "${filename}"
rm "${file_path}"
for item in "${array[@]}"; do

# Bad
echo $filename
rm $file_path
for item in ${array[@]}; do
```

---

## Function Design

- Keep functions small and focused
- Use `local` for all function variables
- Document parameters and return values
- Return explicit exit codes

```bash
# Fetches user data from API
# Arguments:
#   $1 - User ID
# Returns:
#   0 on success, 1 on failure
# Outputs:
#   User JSON to stdout
fetch_user() {
    local user_id="$1"

    if [[ -z "${user_id}" ]]; then
        echo "Error: user_id is required" >&2
        return 1
    fi

    curl --silent --fail "https://api.example.com/users/${user_id}"
}
```

---

## Error Handling

```bash
# Explicit error with context
if ! result=$(fetch_user "${user_id}"); then
    echo "Error: Failed to fetch user ${user_id}" >&2
    exit 1
fi

# Trap for cleanup
cleanup() {
    rm -f "${temp_file:-}"
}
trap cleanup EXIT

# Check command existence
if ! command -v jq &>/dev/null; then
    echo "Error: jq is required but not installed" >&2
    exit 1
fi
```

---

## CLI Arguments

Provide a usage block, validate flags, exit non-zero on misuse:

```bash
readonly SCRIPT_NAME="${0##*/}"

usage() {
    cat <<EOF
Usage: ${SCRIPT_NAME} [OPTIONS] <input_file>

Options:
    -o, --output FILE    Output file (default: stdout)
    -v, --verbose        Enable verbose output
    -h, --help           Show this help message
EOF
}

main() {
    local output_file="" verbose=false input_file=""

    while [[ $# -gt 0 ]]; do
        case "$1" in
            -o|--output) output_file="$2"; shift 2 ;;
            -v|--verbose) verbose=true; shift ;;
            -h|--help) usage; exit 0 ;;
            -*) echo "Error: Unknown option: $1" >&2; usage >&2; exit 1 ;;
            *) input_file="$1"; shift ;;
        esac
    done

    if [[ -z "${input_file}" ]]; then
        echo "Error: input_file is required" >&2
        usage >&2
        exit 1
    fi
}

main "$@"
```

---

## Testing

Use **Bats** (Bash Automated Testing System):

```bash
# test/greeter.test.bats
@test "hello returns greeting" {
  source src/greeter.sh
  result="$(hello "World")"
  [ "$result" = "Hello, World!" ]
}
```

- Write small, testable functions
- Isolate side effects
- Use subshells for testing functions that modify state

---

## Configuration

Make ports and paths configurable via environment with safe defaults:

```bash
readonly PORT="${PORT:-8080}"
readonly CONFIG_DIR="${CONFIG_DIR:-/etc/myapp}"
readonly LOG_LEVEL="${LOG_LEVEL:-info}"
```

---

## Common Patterns

```bash
# Safe temporary files
temp_file=$(mktemp)
trap 'rm -f "${temp_file}"' EXIT

# Reading files line by line
while IFS= read -r line; do
    process_line "${line}"
done < "${input_file}"

# Default values
name="${1:-default_name}"

# Check if variable is set
if [[ -n "${var:-}" ]]; then
    echo "var is set"
fi
```

---

## macOS/Linux Compatibility

### sed (in-place editing)
```bash
sed -i'' -e 's/old/new/g' file.txt    # Portable
```

### date
```bash
date -u +"%Y-%m-%dT%H:%M:%SZ"         # Portable

# Timestamp conversion
if [[ "$(uname)" == "Darwin" ]]; then
    date -r "${timestamp}" +"%Y-%m-%d"
else
    date -d "@${timestamp}" +"%Y-%m-%d"
fi
```

### readlink (absolute path)
```bash
get_script_dir() {
    local source="${BASH_SOURCE[0]}"
    while [[ -L "${source}" ]]; do
        local dir
        dir=$(cd -P "$(dirname "${source}")" && pwd)
        source=$(readlink "${source}")
        [[ "${source}" != /* ]] && source="${dir}/${source}"
    done
    cd -P "$(dirname "${source}")" && pwd
}
```

### stat (file size)
```bash
# Portable
file_size=$(wc -c < "${file}" | tr -d ' ')
```

### find
```bash
find . -name "*.tmp" -print0 | xargs -0 rm    # Portable
```

### Command detection
```bash
command -v jq &>/dev/null    # Prefer over `which`
```

---

## Observability

```bash
log_info() { echo "[INFO] $(date -Iseconds) $*"; }
log_error() { echo "[ERROR] $(date -Iseconds) $*" >&2; }
```

- Redirect errors to stderr
- Use appropriate exit codes
- Include context in log messages

---

## Security

- Never print secrets; redact by default
- Load secrets from environment: `readonly API_KEY="${API_KEY:?Error: API_KEY is required}"`
- Validate and sanitize inputs
- Quote all variables to prevent injection

---

## Project Scaffolding

For new projects, scaffold from: [templ-project/generic](https://github.com/templ-project/generic)

```bash
uvx --from git+https://github.com/templ-project/generic.git bootstrap ./my-project
cd my-project && git init && task deps:sync && task validate
```

Use [Taskfile](https://github.com/go-task/task) for automation: `task test`, `task lint`, `task format`, `task validate`.

---

## Deliverables

- Shebang and strict mode
- Usage block with examples
- Argument validation
- Error handling with context
- README with usage instructions
- `Taskfile.yml` for automation
