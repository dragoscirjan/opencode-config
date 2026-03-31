---
name: developer-frontend
description: Frontend development standards — style guides, tooling, accessibility, component patterns, and testing. Load when writing frontend code.
---

# Frontend Development Standards

Always load `clean-code` alongside this skill.

## Tooling Reference

| Technology | Style Guide | Linter | Formatter | Testing |
|-----------|------------|--------|-----------|---------|
| HTML | [Google HTML/CSS](https://google.github.io/styleguide/htmlcssguide.html) | `HTMLHint` | `prettier` | — |
| CSS | [Google HTML/CSS](https://google.github.io/styleguide/htmlcssguide.html) | `Stylelint` | `prettier` | — |
| JavaScript | [Google JS](https://google.github.io/styleguide/jsguide.html) | `ESLint` | `Prettier` | Vitest / Jest |
| TypeScript | [Google TS](https://google.github.io/styleguide/tsguide.html) | `ESLint` + `typescript-eslint` | `Prettier` | Vitest / Jest |
| Angular | [Angular Style Guide](https://angular.dev/style-guide) | `angular-eslint` | `Prettier` | Karma+Jasmine / Jest, Playwright e2e |
| React | [React docs](https://react.dev) | `eslint-plugin-react`, `eslint-plugin-react-hooks` | `Prettier` | Vitest/Jest + RTL, Playwright e2e |
| Vue | [Vue Style Guide](https://vuejs.org/style-guide/) | `eslint-plugin-vue` | `Prettier` | Vitest + Vue Test Utils, Playwright e2e |
| Svelte | [Svelte docs](https://svelte.dev/docs) | `eslint-plugin-svelte` | `Prettier` | Vitest + Svelte Testing Library, Playwright e2e |
| Markdown | [Google Markdown](https://google.github.io/styleguide/docguide/style.html) | `ESLint` | `prettier` | — |
| YAML | [Yaml Specs](https://yaml.org/spec/1.2.2/) | `ESLint` | `prettier` | — |
| JSON | [Google JSON](https://google.github.io/styleguide/jsoncstyleguide.xml) | `ESLint` | `prettier` | — |

## Key Rules

### HTML / CSS

Semantic elements (`<nav>`, `<main>`, `<article>`). CSS custom properties for theming. BEM or utility-first (Tailwind). Mobile-first responsive. No inline styles in production.

### JavaScript / TypeScript

ESM only. `const`/`let` — no `var`. Custom error classes. JSDoc for public APIs. TS: `strict: true`, `unknown` over `any`, discriminated unions for component state, explicit return types on public functions.

### Frameworks

**Angular** — Feature modules. Smart vs presentational components. OnPush change detection. Reactive forms. `takeUntilDestroyed` or `async` pipe for RxJS. Standalone components (17+).

**React** — Functional components only. Hooks for state/effects. `useMemo`/`useCallback` only when profiling proves need. Composition over prop drilling. Stable, unique keys. Collocate components with styles and tests.

**Vue** — Composition API (`<script setup>`) for new code. `ref`/`reactive` for state, `computed` for derived. `defineProps`/`defineEmits` for contracts. Single-file components. Props down, events up.

**Svelte** — Runes (`$state`, `$derived`, `$effect`) in 5+. `$:` reactive declarations in 4. Stores for shared state. Extract when logic exceeds ~100 lines.

## Cross-Cutting Rules

- **Accessibility**: WCAG 2.1 AA minimum. Semantic HTML. ARIA only when native elements insufficient. Keyboard navigable. Contrast ≥ 4.5:1. Test with axe-core / Lighthouse.
- **Performance**: Lazy-load routes and heavy components. Code-split at route boundaries. Optimize images (WebP, lazy). Bundle size budgets. Avoid layout shifts (CLS).
- **State**: Local first. Lift only when shared. Framework-native before external libraries. Normalize complex state.
- **Components**: Single responsibility. Props in, events/callbacks out. No direct DOM manipulation. Presentational components are pure functions of props.
- **Testing pyramid**: Unit for logic/utilities. Component for rendering/interaction. e2e for critical flows only.
- **Build**: Vite for new projects. `Taskfile.yml` — `task dev`, `task build`, `task test`, `task lint`, `task format`.
- **Security**: Sanitize user content. Never `innerHTML`/`v-html`/`dangerouslySetInnerHTML` with untrusted data. CSP headers. HTTPS only.
