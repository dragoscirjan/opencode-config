import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { existsSync, readFileSync, writeFileSync } from 'fs';
import { join } from 'path';
import { cleanEnvironment, runAgent, TEST_WORKSPACE } from '../helpers.js';

describe('tech-writer (formerly benzaiten)', () => {
  beforeEach(() => {
    cleanEnvironment();

    // Seed a minimal README.md
    const readmeContent = `
# TaskRunner
A lightweight CLI task runner written in Go.

## Features
- YAML-based task definitions
- Dependency resolution between tasks
- Parallel execution with \`--parallel\` flag
- Environment variable interpolation
- \`.env\` file support

## Installation
\`\`\`bash
go install github.com/example/taskrunner@latest
\`\`\`
    `;
    writeFileSync(join(TEST_WORKSPACE, 'README.md'), readmeContent);
  });

  afterEach(() => {
    cleanEnvironment();
  });

  it('scaffolds MkDocs toolchain and generates documentation pages', async () => {
    const prompt = `
      Generate MkDocs documentation for this project.
      Do NOT ask clarifying questions — all information is in the README.md.
      Solo mode, no team review.
      Scaffold the full toolchain (uv, mkdocs) and write
      documentation pages. Do NOT run docs:serve. Do NOT deploy.
    `;

    await runAgent('tech-writer', prompt, 'scaffold-mkdocs');

    // Verify config files
    expect(existsSync(join(TEST_WORKSPACE, 'pyproject.toml'))).toBe(true);
    expect(existsSync(join(TEST_WORKSPACE, 'mkdocs.yml'))).toBe(true);

    // Verify contents
    const pyproject = readFileSync(join(TEST_WORKSPACE, 'pyproject.toml'), 'utf-8');
    expect(pyproject).toContain('mkdocs');

    const mkdocs = readFileSync(join(TEST_WORKSPACE, 'mkdocs.yml'), 'utf-8');
    expect(mkdocs).toContain('material');
    expect(mkdocs).toContain('nav:');

    // Verify docs dir
    expect(existsSync(join(TEST_WORKSPACE, 'docs'))).toBe(true);
    expect(existsSync(join(TEST_WORKSPACE, 'docs/index.md'))).toBe(true);

    // Verify no cross-pollution
    expect(existsSync(join(TEST_WORKSPACE, '.issues'))).toBe(false);
    expect(existsSync(join(TEST_WORKSPACE, '.specs'))).toBe(false);
  }, 120000);
});
