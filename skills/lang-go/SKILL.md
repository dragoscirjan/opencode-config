---
name: lang-go
description: Go development standards — style, error handling, concurrency, testing, and project structure. Load when working on Go projects.
---

# Go Standards

## Code Style

Follow [Effective Go](https://go.dev/doc/effective_go).

**Tooling (mandatory)**:
- `gofmt` — formatting
- `go vet` — static analysis
- `staticcheck` — extended linting
- `golangci-lint` — comprehensive linting (18+ linters including gosec, errcheck, etc.)

**Naming**:
- Short, concise names for local variables
- Descriptive names for exported identifiers
- Avoid stuttering (e.g., `user.UserName` → `user.Name`)

---

## Error Handling

```go
// Good: wrapped error with context
if err != nil {
    return fmt.Errorf("failed to fetch user %s: %w", userID, err)
}

// Bad: silent failure or panic
return nil   // hiding error
panic(err)   // unless truly unrecoverable
```

- Return errors, never panic (except unrecoverable situations)
- Wrap errors with context using `fmt.Errorf` and `%w`
- Use sentinel errors or custom error types for programmatic handling
- Check errors immediately after the call

---

## Concurrency

- Use goroutines and channels appropriately
- **Context propagation is mandatory** — pass `context.Context` as first parameter
- Use `sync.WaitGroup` for goroutine coordination
- Prefer `sync.Mutex` over channels for simple state protection
- Always handle channel closure

```go
func fetchData(ctx context.Context, id string) (*Data, error) {
    select {
    case <-ctx.Done():
        return nil, ctx.Err()
    default:
    }
    // ... fetch logic
}
```

---

## Dependency Injection

- Accept interfaces, return concrete types
- Wire dependencies in `main.go` or a dedicated wire package
- Avoid global state; pass dependencies explicitly

```go
type UserService struct {
    repo UserRepository  // interface
    log  *slog.Logger
}

func NewUserService(repo UserRepository, log *slog.Logger) *UserService {
    return &UserService{repo: repo, log: log}
}
```

---

## Testing

**Framework**: `testing` package + `testify` for assertions.

- Write table-driven tests
- Use subtests for organization
- Test error paths, not just happy paths
- Use interfaces for dependency injection and mocking

```go
func TestCalculateTotal(t *testing.T) {
    tests := []struct {
        name     string
        items    []Item
        expected float64
    }{
        {"empty", []Item{}, 0},
        {"single", []Item{{Price: 10}}, 10},
        {"multiple", []Item{{Price: 10}, {Price: 20}}, 30},
    }

    for _, tt := range tests {
        t.Run(tt.name, func(t *testing.T) {
            got := CalculateTotal(tt.items)
            assert.Equal(t, tt.expected, got)
        })
    }
}
```

Use Testcontainers for integration tests when applicable.

---

## Configuration

Use environment variables with safe defaults and a config struct:

```go
type Config struct {
    Port     int    `env:"PORT" envDefault:"8080"`
    LogLevel string `env:"LOG_LEVEL" envDefault:"info"`
}
```

---

## Observability

- Use `log/slog` for structured logging (Go 1.21+)
- Include request/correlation IDs in context
- Log levels: info, warn, error
- Never log secrets; redact sensitive data

```go
slog.Info("user fetched",
    "user_id", userID,
    "request_id", ctx.Value(requestIDKey),
)
```

---

## Security

- Load secrets from environment or secret manager
- Never commit secrets to VCS
- Validate and sanitize all inputs
- Use parameterized queries (no string concatenation for SQL)
- Set timeouts on HTTP clients and servers

```go
client := &http.Client{Timeout: 10 * time.Second}
```

---

## Project Scaffolding

For new projects, scaffold from: [templ-project/go](https://github.com/templ-project/go)

```bash
uvx --from git+https://github.com/templ-project/go.git bootstrap my-project
cd my-project && task deps:sync && task validate
```

**Template structure**:
```
├── cmd/
│   └── cli/
│       └── main.go       # CLI entry point
├── pkg/
│   └── greeter/
│       ├── greeter.go
│       └── greeter_test.go
├── internal/             # Private packages
├── Taskfile.yml
├── go.mod
├── go.sum
└── .golangci.yml
```

- Use `cmd/` for application entry points
- Use `pkg/` for public libraries
- Use `internal/` for private packages
- Keep `main.go` minimal — wire dependencies and start
- Group by domain, not by layer when it makes sense

Use [Taskfile](https://github.com/go-task/task) for automation: `task build`, `task test`, `task lint`, `task format`, `task validate`.

**Monorepo cleanup**: When scaffolding into a monorepo, remove files handled at root level (`.husky/`, `.github/`, `.editorconfig`, `.gitignore`, `.lintstagedrc.yml`, `.mise.toml`, `.vscode/`, `.scripts/`, `.taskfiles/`, `Taskfile.yml`, `mkdocs.yml`, `docs/`). Keep package-specific files (`go.mod`, `go.sum`, `.golangci.yml`, `cmd/`, `pkg/`, `internal/`).

---

## Deliverables

- `README.md` with run/test instructions
- `go.mod` with pinned dependencies
- `Taskfile.yml` for automation
- Unit tests for public APIs
- Proper error handling throughout
- Context propagation in all async paths
