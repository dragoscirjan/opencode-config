---
name: lang-rust
description: Rust development standards — ownership, error handling, testing, and project structure. Load when working on Rust projects.
---

# Rust Standards

## Code Style

Follow the [Rust API Guidelines](https://rust-lang.github.io/api-guidelines/).

**Tooling (mandatory)**:
- `rustfmt` — formatting (always run before commit)
- `clippy` — linting (deny warnings in CI: `cargo clippy -- -D warnings`)
- `cargo check` — fast type checking
- `cargo audit` — dependency vulnerability scanning

**Naming**:
- `snake_case` for functions, methods, variables, modules
- `PascalCase` for types, traits, enum variants
- `SCREAMING_SNAKE_CASE` for constants and statics
- Prefix unused variables with `_`

---

## Ownership and Borrowing

Rust's ownership system is the foundation — work with it, not around it.

```rust
// Good: borrow when you don't need ownership
fn process(data: &[u8]) -> Result<Output> { ... }

// Good: take ownership when you need it
fn consume(data: Vec<u8>) -> Result<Output> { ... }

// Bad: unnecessary clone
let result = process(&data.clone()); // just use &data
```

- Prefer borrowing (`&T`, `&mut T`) over ownership transfer
- Avoid unnecessary `.clone()` — it's a code smell; audit each one
- Use `Cow<'_, T>` when you may or may not need to own data
- Prefer `&str` over `&String`, `&[T]` over `&Vec<T>` in function parameters
- Use lifetimes explicitly when the compiler requires them; don't fight the borrow checker

---

## Error Handling

Use `Result<T, E>` — never panic in library code.

```rust
use thiserror::Error;

#[derive(Error, Debug)]
pub enum AppError {
    #[error("failed to read config: {0}")]
    Config(#[from] std::io::Error),
    #[error("invalid input: {reason}")]
    Validation { reason: String },
}

fn load_config(path: &Path) -> Result<Config, AppError> {
    let content = std::fs::read_to_string(path)?; // auto-converts via From
    parse_config(&content)
}
```

- **Libraries**: use `thiserror` for typed, structured errors
- **Applications**: use `anyhow` for convenient error chaining
- Never `unwrap()` or `expect()` in production code unless the invariant is provably guaranteed
- Use `?` operator for propagation
- Add context with `.context()` (anyhow) or custom error variants (thiserror)
- Reserve `panic!` for programmer bugs, not runtime errors

---

## Type System

Leverage Rust's type system for correctness.

```rust
// Good: newtype pattern for type safety
struct UserId(u64);
struct OrderId(u64);

// Good: use enums for state machines
enum ConnectionState {
    Disconnected,
    Connecting { attempt: u32 },
    Connected { session: Session },
}

// Good: builder pattern for complex construction
let config = ConfigBuilder::new()
    .port(8080)
    .timeout(Duration::from_secs(30))
    .build()?;
```

- Use newtypes to prevent mixing semantically different values
- Use enums for state machines — make illegal states unrepresentable
- Use the builder pattern for types with many optional fields
- Prefer `Option<T>` over sentinel values (null, -1, empty string)

---

## Traits and Generics

```rust
// Good: accept trait bounds, return concrete types
fn process<R: Read>(input: R) -> Result<Output> { ... }

// Good: use impl Trait for simple cases
fn fetch(url: &str) -> impl Future<Output = Result<Response>> { ... }
```

- Accept generic bounds, return concrete types (when possible)
- Use `impl Trait` in argument position for simple cases
- Use `dyn Trait` when you need dynamic dispatch (trait objects)
- Keep trait definitions small and focused (trait segregation)
- Derive standard traits: `Debug`, `Clone`, `PartialEq` as appropriate

---

## Async

```rust
use tokio;

#[tokio::main]
async fn main() -> Result<()> {
    let result = fetch_data("https://api.example.com").await?;
    process(result).await
}
```

- Use `tokio` as the async runtime (unless the project specifies otherwise)
- Propagate errors with `?` in async functions
- Use `tokio::select!` for concurrent operations with cancellation
- Be mindful of `Send` + `Sync` bounds in async contexts
- Avoid blocking calls in async code — use `tokio::task::spawn_blocking` when needed

---

## Testing

**Framework**: built-in `cargo test` + property testing with `proptest`.

```rust
#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_parse_valid_input() {
        let result = parse("valid input");
        assert_eq!(result, Ok(Expected::Value));
    }

    #[test]
    fn test_parse_invalid_input() {
        let result = parse("");
        assert!(result.is_err());
    }

    #[test]
    fn test_error_message() {
        let err = parse("bad").unwrap_err();
        assert_eq!(err.to_string(), "invalid input: bad");
    }
}
```

- Use `#[cfg(test)]` module in the same file
- Test both success and error paths
- Use `assert_eq!`, `assert!`, `assert_ne!`
- Use `proptest` for property-based testing when applicable
- Use `mockall` or manual mocks via traits for dependency injection
- Integration tests go in `tests/` directory
- Use `cargo test` to run all tests
- Use Testcontainers for integration tests with external services

---

## Project Structure

```
├── src/
│   ├── main.rs           # Binary entry point
│   ├── lib.rs            # Library root
│   ├── error.rs          # Error types
│   └── module/
│       ├── mod.rs
│       └── types.rs
├── tests/
│   └── integration.rs    # Integration tests
├── benches/
│   └── benchmark.rs      # Benchmarks
├── Cargo.toml
├── Cargo.lock
├── clippy.toml           # Clippy configuration
└── README.md
```

- Keep `main.rs` minimal — parse args, wire dependencies, call into `lib.rs`
- Group by domain/feature, not by layer
- Use `mod.rs` or named modules for organization
- Public API surface should be small and deliberate

---

## Configuration

Use environment variables with structured config:

```rust
use serde::Deserialize;

#[derive(Deserialize)]
struct Config {
    #[serde(default = "default_port")]
    port: u16,
    database_url: String,
}

fn default_port() -> u16 { 8080 }
```

- Use `serde` for deserialization
- Use `dotenvy` for `.env` files in development
- Provide sensible defaults
- Validate configuration at startup, fail fast

---

## Observability

- Use `tracing` crate for structured, span-based logging
- Include context (request IDs, operation names) in spans
- Use `tracing-subscriber` for output configuration

```rust
use tracing::{info, error, instrument};

#[instrument(skip(db))]
async fn fetch_user(db: &Database, user_id: u64) -> Result<User> {
    info!(user_id, "fetching user");
    db.get_user(user_id).await.map_err(|e| {
        error!(user_id, error = %e, "failed to fetch user");
        e
    })
}
```

---

## Security

- Load secrets from environment or secret manager
- Never commit secrets to VCS
- Validate and sanitize all inputs
- Use `ring` or `rustls` for cryptographic operations
- Run `cargo audit` in CI to catch vulnerable dependencies
- Use `#[deny(unsafe_code)]` at crate level unless unsafe is explicitly needed
- When `unsafe` is required, document invariants and minimize scope

---

## Performance

- Profile before optimizing — use `cargo flamegraph` or `criterion` benchmarks
- Prefer stack allocation over heap when sizes are known
- Use iterators and zero-copy parsing where possible
- Avoid allocations in hot paths

---

## Deliverables

- `README.md` with build/test instructions
- `Cargo.toml` with pinned dependency versions
- Unit tests for public APIs
- Proper error handling throughout (no unwrap in production)
- `clippy` clean with no warnings
- `rustfmt` formatted
