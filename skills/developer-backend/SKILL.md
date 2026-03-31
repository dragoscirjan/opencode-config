---
name: developer-backend
description: Backend development standards — style guides, tooling, key rules for 18 languages. Load when writing backend code.
---

# Backend Development Standards

Always load `clean-code` alongside this skill.

## Tooling Reference

| Language | Style Guide | Linter | Formatter | Testing |
|----------|------------|--------|-----------|---------|
| C / C++ | [Google C++](https://google.github.io/styleguide/cppguide.html) | `clang-tidy`, `cppcheck` | `clang-format` | GoogleTest / Catch2 |
| C# | [Google C#](https://google.github.io/styleguide/csharp-style.html) | Roslyn analyzers | `dotnet-format` | xUnit + Moq + FluentAssertions |
| Java | [Google Java](https://google.github.io/styleguide/javaguide.html) | Checkstyle, SpotBugs, Error Prone | `google-java-format` | JUnit 5 + Mockito + AssertJ |
| Go | [Google Go](https://google.github.io/styleguide/go/), [Effective Go](https://go.dev/doc/effective_go) | `golangci-lint` | `gofmt`, `goimports` | `testing` + `testify` |
| Python | [Google Python](https://google.github.io/styleguide/pyguide.html) | `ruff`, `mypy` | `ruff format` | `pytest` + `pytest-cov` |
| Rust | [API Guidelines](https://rust-lang.github.io/api-guidelines/) | `clippy -D warnings` | `rustfmt` | `cargo test` + `proptest` |
| Zig | [Zig Style](https://ziglang.org/documentation/master/#Style-Guide) | compiler warnings | `zig fmt` | `zig test` |
| Elixir | [Elixir Style](https://github.com/christopheradams/elixir_style_guide) | `Credo`, `Dialyxir` | `mix format` | ExUnit + `Mox` |
| Lua | [Lua Style](https://github.com/Olivine-Labs/lua-style-guide) | `luacheck` | `StyLua` | `busted` / `luaunit` |
| Swift | [Google Swift](https://google.github.io/swift/) | `SwiftLint` | `swift-format` | XCTest / Swift Testing |
| JavaScript | [Google JS](https://google.github.io/styleguide/jsguide.html) | `ESLint` | `Prettier` | Vitest / Jest |
| TypeScript | [Google TS](https://google.github.io/styleguide/tsguide.html) | `ESLint` + `typescript-eslint` | `Prettier` | Vitest / Jest |
| Shell / Bash | [Google Shell](https://google.github.io/styleguide/shellguide.html) | `shellcheck` | `shfmt` | Bats |
| Fish | — | `fish --no-execute` | `fish_indent` | — |
| PowerShell | [PS Practice & Style](https://poshcode.gitbook.io/powershell-practice-and-style) | `PSScriptAnalyzer` | PSScriptAnalyzer | Pester |
| Markdown | [Google Markdown](https://google.github.io/styleguide/docguide/style.html) | `ESLint` | `prettier` | — |
| YAML | [Yaml Specs](https://yaml.org/spec/1.2.2/) | `ESLint` | `prettier` | — |
| JSON | [Google JSON](https://google.github.io/styleguide/jsoncstyleguide.xml) | `ESLint` | `prettier` | — |

## Key Rules by Language

**C/C++** — C++20+. `-Wall -Wextra -Werror`. RAII everywhere. Smart pointers only — no raw `new`/`delete`. Sanitizers (ASan, UBSan, TSan) in CI. CMake 3.20+.

**C#** — Nullable reference types enabled. Records for immutable DTOs. Pattern matching. Async/await for I/O. Constructor injection with DI.

**Java** — 17+. Records, sealed classes, switch expressions. `Optional<T>` — never return null. Try-with-resources. Virtual threads (21+) for I/O.

**Go** — Return errors, never panic. Wrap with `%w`. Context propagation mandatory. Accept interfaces, return concretes. `log/slog` for logging. `cmd/`, `internal/`, `pkg/` layout.

**Python** — 3.11+. Type hints throughout. `pyproject.toml` + `src/` layout + `uv`. `raise ... from err`. `asyncio.TaskGroup` for structured concurrency.

**Rust** — `Result<T,E>` — never panic in libraries. `thiserror` for libs, `anyhow` for apps. No `unwrap()` in production. Borrow over clone. `tokio` for async.

**Zig** — Explicit allocators passed as parameters. `defer`/`errdefer` for cleanup. Error unions. `comptime` for compile-time work. `GeneralPurposeAllocator` in debug.

**Elixir** — Pattern matching in function heads. Pipe operator. `{:ok, value}`/`{:error, reason}` tuples. Let it crash — supervisors handle recovery. OTP supervision trees.

**Lua** — `local` everything. `return nil, err` for expected failures. `pcall`/`xpcall` for unexpected. Metatables + `__index` for OOP. Neovim: `setup(opts)` pattern.

**Swift** — Structs over classes by default. `Result<T,E>` and `throws`. Protocol-oriented. `async`/`await`. `Codable` for serialization. SPM for deps.

**JS** — Node 22+ ESM. ES6+ concepts only. Custom error classes with codes. `node:` prefix for builtins. Deno: least-privilege permissions. Bun: `bun test`.

**TS** — `strict: true`. `unknown` over `any`. Discriminated unions for state. Explicit return types on public functions. Generics to reduce duplication.

**Shell** — `set -euo pipefail`. Quote all expansions. `local` in functions. Trap for cleanup. `command -v` over `which`. Portable across macOS + Linux.

**PowerShell** — Approved verbs. `[CmdletBinding()]` on all functions. `-ErrorAction Stop`. Pipeline-friendly output.

## Cross-Cutting Rules

- **Errors**: Return explicitly. Never swallow, never throw for control flow. Include context (what failed, with what input).
- **DI**: Accept interfaces, return concretes. Wire at entry point.
- **Logging**: Structured (JSON). Correlation/request IDs. Never log secrets.
- **Security**: Secrets from env or secret manager — never VCS. Parameterized queries. Validate inputs. Timeouts on HTTP clients.
- **Config**: Env vars with safe defaults. Validate at startup, fail fast.
- **Testing**: Test error paths. Table-driven/parameterized. Testcontainers for integration.
- **Automation**: `Taskfile.yml` — `task build`, `task test`, `task lint`, `task format`, `task validate`.
