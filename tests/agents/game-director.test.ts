import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { existsSync, readdirSync, readFileSync } from 'fs';
import { join } from 'path';
import { cleanEnvironment, runAgent, TEST_WORKSPACE } from '../helpers.js';

const SPECS_DIR = join(TEST_WORKSPACE, '.specs');
const TMP_DIR = join(TEST_WORKSPACE, '.ai.tmp');

describe('game-director', () => {
  beforeEach(() => {
    cleanEnvironment();
  });

  afterEach(() => {
    cleanEnvironment();
  });

  describe('Solo Mode', () => {
    it('creates a game plan spec and scaffolds a Godot project file', async () => {
      const prompt = `
        Write a game plan for a simple 2D Flappy Bird clone in Godot 4.
        Do NOT ask clarifying questions — all information is provided below.
        Solo mode.

        CRITICAL TEST INSTRUCTIONS:
        1. Write the game plan using spec-create.
        2. I explicitly approve the plan. Proceed to scaffolding immediately.
        3. Create a basic 'project.godot' file with some placeholder text.
        4. Create a 'scenes' directory and a placeholder 'scenes/main.tscn' file.
        5. Do NOT execute any actual 'godot' bash commands (Godot is not installed in this environment). Just create the text files.
      `;

      await runAgent('game-director', prompt, 'solo_flappy_bird');

      // Verify a spec file was created in .specs/
      expect(existsSync(SPECS_DIR)).toBe(true);
      const specFiles = readdirSync(SPECS_DIR);
      expect(specFiles.length).toBeGreaterThanOrEqual(1);
      
      const specPath = join(SPECS_DIR, specFiles[0]);
      const content = readFileSync(specPath, 'utf8');

      // Basic spec expectations
      expect(content).toContain('type: task');

      // Verify project scaffolding
      expect(existsSync(join(TEST_WORKSPACE, 'project.godot'))).toBe(true);
      expect(existsSync(join(TEST_WORKSPACE, 'scenes', 'main.tscn'))).toBe(true);
    }, 180000);
  });

  describe('Team Mode', () => {
    it('creates a game plan and delegates native code to a subagent', async () => {
      const prompt = `
        We need a Godot 4 project that uses a C++ GDExtension for heavy pathfinding math.
        Do NOT ask clarifying questions.
        Team mode: yes.
        
        CRITICAL TEST INSTRUCTIONS:
        1. Write the game plan using spec-create.
        2. I explicitly approve the plan. Proceed directly to implementation.
        3. Delegate the C++ implementation. Instruct the @worker-backend-dev subagent to create a file named 'src/fast_path.cpp' containing a dummy C++ function.
        4. Do NOT execute any actual 'godot' bash commands. Just ensure the files are created.
      `;

      await runAgent('game-director', prompt, 'team_gdextension');

      // Verify spec is created
      expect(existsSync(SPECS_DIR)).toBe(true);
      const specFiles = readdirSync(SPECS_DIR);
      expect(specFiles.length).toBeGreaterThanOrEqual(1);

      // Verify the subagent created the C++ file
      expect(existsSync(join(TEST_WORKSPACE, 'src', 'fast_path.cpp'))).toBe(true);
    }, 300000);
  });
});
