import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { existsSync, readdirSync, readFileSync } from 'fs';
import { join } from 'path';
import { cleanEnvironment, runAgent, TEST_WORKSPACE } from '../helpers.js';

const SPECS_DIR = join(TEST_WORKSPACE, '.specs');
const TMP_DIR = join(TEST_WORKSPACE, '.ai.tmp');

describe('lead-engineer', () => {
  beforeEach(() => {
    cleanEnvironment();
  });

  afterEach(() => {
    cleanEnvironment();
  });

  describe('Solo Mode', () => {
    it('creates an LLD in .specs/ without writing code when not approved', async () => {
      const prompt = `
        Write an LLD for a JSON-to-CSV file converter CLI tool written in Node.js.
        Do NOT ask clarifying questions — all information is provided below.
        Solo mode, no team review.

        Context: We need a quick CLI tool to convert large JSON files to CSV.
        Scope IN: streaming parser, memory efficient, output to stdout or file.
        Scope OUT: XML parsing, binary formats.
      `;

      await runAgent('lead-engineer', prompt, 'solo_json_csv_lld');

      // Verify a spec file was created in .specs/
      expect(existsSync(SPECS_DIR)).toBe(true);
      const specFiles = readdirSync(SPECS_DIR);
      expect(specFiles.length).toBe(1);
      
      const specPath = join(SPECS_DIR, specFiles[0]);
      const content = readFileSync(specPath, 'utf8');

      // Basic LLD expectations
      expect(content).toContain('Node.js');
      expect(content).toContain('CSV');

      // The agent should stop and ask for approval, NOT write actual code
      expect(existsSync(join(TEST_WORKSPACE, 'index.js'))).toBe(false);
      expect(existsSync(join(TEST_WORKSPACE, 'package.json'))).toBe(false);
    }, 120000);
  });

  describe('Team Mode', () => {
    it('creates an LLD and delegates implementation tasks to subagents', async () => {
      const prompt = `
        Implement a simple math utility module in Node.js.
        Do NOT ask clarifying questions.
        Team mode: yes.
        
        CRITICAL TEST INSTRUCTIONS:
        1. Skip the feasibility review phase to save time. Tell @worker-tech-lead to immediately create the finalized LLD via spec-create.
        2. I explicitly approve the LLD. Proceed directly to implementation.
        3. Delegate the implementation. Run up to 3 subagents in parallel to create:
           - src/add.js (exports an add function)
           - src/subtract.js (exports a subtract function)
           - src/multiply.js (exports a multiply function)
        4. Skip the code review phase to save time.
      `;

      await runAgent('lead-engineer', prompt, 'team_math_module');

      // Verify LLD is created
      expect(existsSync(SPECS_DIR)).toBe(true);
      const specFiles = readdirSync(SPECS_DIR);
      expect(specFiles.filter(f => f.startsWith('lld-')).length).toBeGreaterThanOrEqual(1);

      // Verify the subagents created the code files
      expect(existsSync(join(TEST_WORKSPACE, 'src/add.js'))).toBe(true);
      expect(existsSync(join(TEST_WORKSPACE, 'src/subtract.js'))).toBe(true);
      expect(existsSync(join(TEST_WORKSPACE, 'src/multiply.js'))).toBe(true);
    }, 300000);
  });
});

