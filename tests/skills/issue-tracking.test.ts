import { existsSync, readFileSync, writeFileSync, mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { runAgent } from '../helpers.js';

describe('Skill: issue-tracking', () => {
  let testDir: string;

  beforeEach(() => {
    // Create a unique temporary directory for each test
    testDir = mkdtempSync(join(tmpdir(), 'opencode-test-'));
  });

  afterEach(() => {
    // Completely remove the temporary directory and all its contents
    if (existsSync(testDir)) {
      rmSync(testDir, { recursive: true, force: true });
    }
  });

  it('creates an issue in the local filesystem when ISSUE_TRACKING=fs', async () => {
    // Write the .env.ai file so the env-get tool can read it
    writeFileSync(
      join(testDir, '.env.ai'),
      'ISSUE_TRACKING=fs,issue-create,issue-list,issue-read\n'
    );

    const prompt = `
      Load the 'issue-tracking' skill.
      Create a new issue of type 'task' with the title 'Create database schema'.
      For the description, use the Gherkin format ('As a / I want to / So that').
      Fill in all the required sections from the issue template.
      Do NOT ask for clarification, just execute the task.
    `;

    await runAgent('product-owner', prompt, 'issue-tracking-fs', {
      cwd: testDir,
    });

    // Check if the issue was created in .issues directory
    expect(existsSync(join(testDir, '.issues'))).toBe(true);
    
    // There should be a file like 00001-task-create-database-schema.md
    const files = existsSync(join(testDir, '.issues')) 
      ? require('node:fs').readdirSync(join(testDir, '.issues'))
      : [];
    
    expect(files.length).toBeGreaterThan(0);
    
    const issueFile = files.find((f: string) => f.includes('00001-task-') && f.endsWith('.md'));
    expect(issueFile).toBeDefined();

    if (issueFile) {
      const issueContent = readFileSync(join(testDir, '.issues', issueFile), 'utf-8');
      
      // Verify YAML frontmatter injected by the tool
      expect(issueContent).toContain('id: "00001"');
      expect(issueContent).toContain('type: task');
      expect(issueContent).toContain('status: open');
      
      // Verify LLM followed Gherkin format instructions
      expect(issueContent).toMatch(/As a (.*)/i);
      expect(issueContent).toMatch(/I want to (.*)/i);
      expect(issueContent).toMatch(/So that (.*)/i);
      
      // Verify other template sections are present
      expect(issueContent).toContain('## Acceptance Criteria');
    }
  }, 120000);

  it('formats issues appropriately for GitHub when ISSUE_TRACKING=github', async () => {
    // Write the .env.ai file so the env-get tool can read it
    writeFileSync(
      join(testDir, '.env.ai'),
      'ISSUE_TRACKING=github,gh,cvs_github\n'
    );

    const prompt = `
      Load the 'issue-tracking' skill.
      We want to create a new task on GitHub with the title 'Create API endpoints'.
      Write the exact title and body of the issue you WOULD create to a file named 'github-issue.md' in the workspace.
      Include the appropriate emoticon in the title.
      Use the Gherkin format ('Given / When / Then') for the description.
      Do NOT actually attempt to run any 'gh' or 'cvs_github' commands. Just write the file.
      Do NOT ask for clarification.
    `;

    await runAgent('product-owner', prompt, 'issue-tracking-github', {
      cwd: testDir,
    });

    const outputFilePath = join(testDir, 'github-issue.md');
    expect(existsSync(outputFilePath)).toBe(true);

    const issueContent = readFileSync(outputFilePath, 'utf-8');

    // Title should contain the emoticon for task (🛠️ Task)
    expect(issueContent).toContain('🛠️');
    
    // Should contain Gherkin syntax
    expect(issueContent).toMatch(/Given/i);
    expect(issueContent).toMatch(/When/i);
    expect(issueContent).toMatch(/Then/i);
    
    // Should NOT have the fs YAML frontmatter
    expect(issueContent).not.toContain('id: "00001"');
    expect(issueContent).not.toContain('type: task');
    expect(issueContent).not.toContain('status: open');
  }, 120000);
});
