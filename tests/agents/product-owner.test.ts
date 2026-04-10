import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { existsSync, readdirSync, readFileSync, mkdirSync, writeFileSync } from 'fs';
import { execSync } from 'child_process';
import { join } from 'path';
import { cleanEnvironment, runAgent, TEST_WORKSPACE } from '../helpers.js';

const ISSUES_DIR = join(TEST_WORKSPACE, '.issues');
const SPECS_DIR = join(TEST_WORKSPACE, '.specs');
const TMP_DIR = join(TEST_WORKSPACE, '.ai.tmp');

describe('product-owner', () => {
  beforeEach(() => {
    cleanEnvironment();
  });

  afterEach(() => {
    cleanEnvironment();
  });

  describe('Solo Mode', () => {
    it('creates 1 Epic and 1 Design Story with correct metadata', async () => {
      const prompt = `
        Create an Epic for a User Authentication System.
        Title: User Authentication.
        Do NOT ask clarifying questions — all information is provided below.
        Solo mode, no team review.

        Problem: Users cannot log in to the application. We need a complete
        authentication system supporting email/password login, session management,
        and password reset.

        Scope IN: sign-up, login, logout, password reset via email, session tokens (JWT).
        Scope OUT: OAuth/social login, two-factor authentication, admin user management.

        Acceptance Criteria:
        - Users can register with email and password
        - Users can log in and receive a JWT
        - Users can reset their password via email link
        - Sessions expire after 24 hours of inactivity

        Risks: JWT secret rotation strategy not yet defined.
      `;

      await runAgent('product-owner', prompt, 'solo-auth-epic');

      // Verify directories
      expect(existsSync(ISSUES_DIR)).toBe(true);
      expect(existsSync(TMP_DIR)).toBe(false); // No draft in solo mode
      expect(existsSync(SPECS_DIR)).toBe(false); // No specs written

      // Verify files
      const issues = readdirSync(ISSUES_DIR);
      const epics = issues.filter(f => f.includes('-epic-'));
      const stories = issues.filter(f => f.includes('-story-'));

      expect(epics).toHaveLength(1);
      expect(stories).toHaveLength(1);

      // Epic Frontmatter Checks
      const epicContent = readFileSync(join(ISSUES_DIR, epics[0]), 'utf-8');
      expect(epicContent).toContain('type: epic');
      expect(epicContent).toContain('status: open');
      expect(epicContent).toContain('id: "00001"');
      expect(epicContent).toContain('opencode-agent: product-owner');

      // Story Frontmatter Checks
      const storyContent = readFileSync(join(ISSUES_DIR, stories[0]), 'utf-8');
      expect(storyContent).toContain('type: story');
      expect(storyContent).toContain('status: open');
      expect(storyContent).toContain('id: "00002"');
      expect(storyContent).toContain('parent: "00001"'); // Links back to epic
      expect(storyContent).toContain('opencode-agent: product-owner');
    });

    it('handles ID sequencing correctly when pre-seeded', async () => {
      mkdirSync(ISSUES_DIR, { recursive: true });
      writeFileSync(join(ISSUES_DIR, '00001-task-seed-task.md'), `
---
id: "00001"
type: task
title: Seed Task
status: done
---
# Seed Task
      `);

      const prompt = `
        Create an Epic for a Logging Pipeline.
        Title: Logging Pipeline.
        Do NOT ask clarifying questions.
        Solo mode.
      `;

      await runAgent('product-owner', prompt, 'id-sequencing');

      const issues = readdirSync(ISSUES_DIR);
      expect(issues.length).toBe(3); // Seed + Epic + Story

      const epics = issues.filter(f => f.startsWith('00002-epic-'));
      const stories = issues.filter(f => f.startsWith('00003-story-'));

      expect(epics).toHaveLength(1);
      expect(stories).toHaveLength(1);

      const storyContent = readFileSync(join(ISSUES_DIR, stories[0]), 'utf-8');
      expect(storyContent).toContain('parent: "00002"');
    });
  });

  describe('Team Mode', () => {
    it('creates drafts before finalizing', async () => {
      const prompt = `
        Create an Epic for a Notification System.
        Title: Notification System.
        Do NOT ask clarifying questions.
        Use the team. iterations=1.

        Problem: Users need notifications.
        Scope IN: in-app, email.
      `;

      await runAgent('product-owner', prompt, 'team-notification-epic');

      expect(existsSync(ISSUES_DIR)).toBe(true);
      expect(existsSync(TMP_DIR)).toBe(true); // Draft should exist

      const drafts = readdirSync(TMP_DIR).filter(f => f.endsWith('.md'));
      expect(drafts.length).toBeGreaterThanOrEqual(1);

      const issues = readdirSync(ISSUES_DIR);
      const epics = issues.filter(f => f.includes('-epic-'));
      const stories = issues.filter(f => f.includes('-story-'));

      expect(epics).toHaveLength(1);
      expect(stories).toHaveLength(1);
    });
  });

  describe('GitHub CVS Mode', () => {
    it('creates 1 Epic via GitHub CLI and closes it', async () => {
      const prompt = `
        Create an Epic for a Test System.
        Title: [TEST] Remote CVS Integration Epic.
        Do NOT ask any questions. Skip refinement completely.
        Solo mode, no team review. Finalize directly immediately.
        You MUST use remote CVS tracking. Create the Epic issue via GitHub CLI (gh).
        Do not create any implementation stories, only the Epic.

        Problem: Testing remote CVS integration.
        Scope IN: Basic test scope.
      `;

      await runAgent('product-owner', prompt, 'github-cvs-epic', { env: { ISSUE_TRACKING_FS: '0' } });

      // Wait a few seconds for GitHub search indexing to catch up
      await new Promise(resolve => setTimeout(resolve, 5000));

      // Find the issue using gh CLI
      const stdout = execSync('gh issue list --state open --search "[TEST] Remote CVS Integration Epic" --json number', { 
        encoding: 'utf-8',
        cwd: TEST_WORKSPACE 
      });
      const issues = JSON.parse(stdout);

      // Verify at least one issue was created
      expect(issues.length).toBeGreaterThan(0);

      // Clean up by closing the created issue(s)
      for (const issue of issues) {
        execSync(`gh issue close ${issue.number} --reason "not planned"`, { cwd: TEST_WORKSPACE });
      }
    });
  });
});
