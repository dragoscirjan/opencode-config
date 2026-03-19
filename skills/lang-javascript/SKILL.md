---
name: lang-javascript
description: JavaScript development standards — style, tooling, testing, and runtime variants (Node, Deno, Bun, K6). Load when working on JavaScript projects.
---

# JavaScript Standards

## Code Style

Follow [Google JavaScript Style Guide](https://google.github.io/styleguide/jsguide.html).

**Tooling (mandatory)**:
- ESLint + Prettier
- JSDoc for documentation (`/** @param {string} name */`)

**Runtime**: Node 22+ with ESM by default; use `const`/`let` only (no `var`).

---

## Error Handling

```javascript
// Good: explicit error with context
throw new AppError('USER_NOT_FOUND', `User ${id} not found`, { userId: id })

// Bad: silent failure
return null
```

- Never swallow errors silently
- Use custom error classes with error codes
- Include context in error messages
- Return explicit errors; avoid silent failures

---

## Testing

**Framework**: Vitest (new projects) or Jest (existing).

- Write unit tests for all public APIs
- Use table-driven tests for multiple scenarios
- Mock external dependencies, not internal modules
- Test error paths, not just happy paths

```javascript
describe('calculateTotal', () => {
  it.each([
    { items: [], expected: 0 },
    { items: [{ price: 10 }], expected: 10 },
    { items: [{ price: 10 }, { price: 20 }], expected: 30 },
  ])('returns $expected for $items.length items', ({ items, expected }) => {
    expect(calculateTotal(items)).toBe(expected)
  })
})
```

---

## Runtime Variants

### Node.js
- Node 22+ with ESM by default
- Use `const`/`let` only
- Prefer `node:` prefix for built-in modules (`import fs from 'node:fs'`)

### Deno
- Code quality: `deno fmt`, `deno lint`, `deno check` for type-check with JSR/TypeScript
- Runtime: Deno stable; default to ESM. Prefer URL imports or `deno.json` imports map
- Permissions: run with least privilege (`--allow-read` specific paths, avoid `--allow-all`)
- Packaging: target web-compatible ESM; avoid Node-only APIs
- Testing: `deno test` for Deno-native; for cross-runtime libraries use Vitest in a separate Node test matrix
- CI/CD: cache Deno and modules; run `deno fmt --check`, `deno lint`, `deno test`

### Bun
- Runtime: Bun stable; ESM by default. Target web/Node compat where feasible
- Code quality: `bun run lint` with ESLint/Prettier; `bun` for scripts and dev server
- Testing: `bun test` for Bun-native; for cross-runtime libraries, add Vitest in a separate matrix
- Compatibility: avoid Bun-only APIs unless the project is Bun-only; document support explicitly
- CI/CD: install Bun via official installer; run `bun test` and lint

### K6 (Performance Testing)
- Runtime: K6 (ES6 subset); avoid Node APIs
- Testing: Vitest/Jest; mock K6 as needed

---

## Observability

- Emit structured logs (JSON preferred)
- Include request/correlation IDs
- Log levels: info (normal), warn (unexpected but tolerable), error (actionable)
- Never log secrets; redact sensitive data

---

## Security

- Load secrets from environment or secret manager
- Never commit secrets to VCS
- Validate and sanitize all inputs
- Use parameterized queries for databases

---

## Project Scaffolding

For new projects, scaffold from: [templ-project/javascript](https://github.com/templ-project/javascript)

```bash
npx --yes --package=github:templ-project/javascript bootstrap ./my-project
cd my-project && npm install && npm test
```

Use [Taskfile](https://github.com/go-task/task) for automation: `task build`, `task test`, `task lint`, `task format`, `task validate`.

---

## Deliverables

- `README.md` with run/test instructions
- `package.json` with pinned dependencies
- ESLint + Prettier configs
- Unit tests for public APIs
- `Taskfile.yml` for automation
