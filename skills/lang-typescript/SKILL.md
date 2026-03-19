---
name: lang-typescript
description: TypeScript development standards — style, type safety, tooling, testing, and runtime variants (Node, Deno, Bun). Load when working on TypeScript projects.
---

# TypeScript Standards

## Code Style

Follow [Google TypeScript Style Guide](https://google.github.io/styleguide/tsguide.html).

**Tooling (mandatory)**:
- ESLint + Prettier
- Strict TypeScript (`strict: true` in tsconfig)
- `module`: ESNext, `target`: ES2022+

**Runtime**: Node 22+ with ESM by default; use `const`/`let` only (no `var`).

---

## Type Safety

- Prefer `unknown` over `any`
- Use discriminated unions for state management
- Leverage `const` assertions and template literal types
- Define explicit interfaces for API boundaries
- Use generics to reduce duplication, not to show off
- Prefer explicit return types on public functions
- Use type inference for local variables when obvious

```typescript
// Discriminated union
type Result<T> =
  | { ok: true; value: T }
  | { ok: false; error: AppError }

// Const assertion
const ROLES = ['admin', 'user', 'guest'] as const
type Role = typeof ROLES[number]
```

---

## Error Handling

```typescript
// Good: explicit error with context and error code
throw new AppError('USER_NOT_FOUND', `User ${id} not found in database`, { userId: id })

// Bad: silent failure
return null
```

- Never swallow errors silently
- Use custom error classes with error codes
- Include correlation IDs in error context
- Return explicit errors; avoid silent failures

---

## Testing

**Framework**: Vitest (new projects) or Jest (existing).

- Write unit tests for all public APIs
- Use table-driven tests for multiple scenarios
- Mock external dependencies, not internal modules
- Test error paths, not just happy paths

```typescript
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

### Deno
- Use `deno.json` for compiler options and import maps
- Prefer URL imports or import maps over Node resolution
- Run with least privilege (`--allow-read` specific paths, avoid `--allow-all`)
- Use `deno fmt`, `deno lint`, `deno check`
- Testing: `deno test` for platform code; keep a Node/Vitest job for universal libraries

### Bun
- ESM by default; supports TS out of the box
- Use `bun test` for Bun-native testing; Vitest for cross-runtime
- Use `bunx` to run CLIs
- Configure `tsconfig.json` with `module`=ESNext, `target`=ES2022+; strict mode
- Document Bun-specific APIs explicitly

### K6 (Performance Testing)
- K6 constraints apply; emit ESM
- Mock K6 APIs in unit tests

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

For new projects, scaffold from: [templ-project/typescript](https://github.com/templ-project/typescript)

```bash
npx --yes --package=github:templ-project/typescript bootstrap ./my-project
cd my-project && npm install && npm test
```

**Bootstrap options**:
```bash
npx ... bootstrap --target esm,cjs ./my-project          # ESM and CJS only
npx ... bootstrap --part-of-monorepo ./packages/my-lib    # Monorepo mode
```

**Template structure**:
```
├── src/
│   ├── index.ts
│   └── lib/
│       ├── greeter.ts
│       └── greeter.spec.ts
├── dist/                 # Build output (gitignored)
├── Taskfile.yml
├── package.json
├── tsconfig.json
├── vitest.config.ts
├── eslint.config.mjs
└── prettier.config.mjs
```

Use [Taskfile](https://github.com/go-task/task) for automation: `task build`, `task test`, `task lint`, `task format`, `task validate`.

**Monorepo cleanup**: When scaffolding into a monorepo, remove files handled at root level (`.husky/`, `.github/`, `eslint.config.mjs`, `prettier.config.mjs`, `.editorconfig`, `.gitignore`, `.lintstagedrc.yml`, `.mise.toml`, `.vscode/`, `.scripts/`, `.taskfiles/`). Keep package-specific files (`package.json`, `tsconfig.json`, `vitest.config.ts`, `src/`, `test/`).

---

## Deliverables

- `README.md` with run/test instructions
- `package.json` with pinned dependencies
- `tsconfig.json` with strict mode
- ESLint + Prettier configs
- Unit tests for public APIs
- `Taskfile.yml` for automation
