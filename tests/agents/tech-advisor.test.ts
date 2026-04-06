import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { existsSync, readdirSync, readFileSync } from 'fs';
import { execSync } from 'child_process';
import { join } from 'path';
import { cleanEnvironment, runAgent, TEST_WORKSPACE } from '../helpers.js';

const ISSUES_DIR = join(TEST_WORKSPACE, '.issues');
const SPECS_DIR = join(TEST_WORKSPACE, '.specs');
const TMP_DIR = join(TEST_WORKSPACE, '.ai.tmp');

describe('tech-advisor', () => {
  beforeEach(() => {
    cleanEnvironment();
  });

  afterEach(() => {
    cleanEnvironment();
  });

  describe('Solo Mode', () => {
    it('creates an HLD in .specs/ and an implementation story in .issues/', async () => {
      const prompt = `
        Write an HLD for an In-Memory Cache System.
        Do NOT ask clarifying questions — all information is provided below.
        Solo mode, no team review.

        Context: The application currently hits the database on every request.
        We need an in-memory caching layer to reduce DB load and improve
        response times for frequently accessed data.

        Scope IN: key-value store with TTL, LRU eviction, cache invalidation
        on writes, per-key TTL configuration, cache-aside pattern.
        Scope OUT: distributed caching (Redis/Memcached), cache warming
        strategies, multi-level caching, persistent cache.

        Decisions already made:
        - Cache sits in the application process (no external service)
        - Maximum cache size: 10,000 entries
        - Default TTL: 5 minutes

        Risks: Memory pressure on high-cardinality data sets.
        Cache stampede when popular keys expire simultaneously.
      `;

      await runAgent('tech-advisor', prompt, 'team-limiter');

      expect(existsSync(SPECS_DIR)).toBe(true);
      expect(existsSync(ISSUES_DIR)).toBe(true);
      expect(existsSync(TMP_DIR)).toBe(false); // No drafts in solo mode

      // Verify HLD Spec
      const specs = readdirSync(SPECS_DIR);
      const hlds = specs.filter(f => f.startsWith('hld-'));
      expect(hlds).toHaveLength(1);

      const hldContent = readFileSync(join(SPECS_DIR, hlds[0]), 'utf-8');
      expect(hldContent).toContain('type: hld');
      expect(hldContent).toContain('opencode-agent: tech-advisor');

      // Verify Implementation Story
      const issues = readdirSync(ISSUES_DIR);
      const stories = issues.filter(f => f.includes('-story-'));
      expect(stories).toHaveLength(1);

      const storyContent = readFileSync(join(ISSUES_DIR, stories[0]), 'utf-8');
      expect(storyContent).toContain('type: story');
      expect(storyContent).toContain('status: open');
      expect(storyContent).toContain('opencode-agent: tech-advisor');
    });
  });

  describe('Team Mode', () => {
    it('creates drafts before finalizing an HLD and an implementation story', async () => {
      const prompt = `
        Write an HLD for a Rate Limiter.
        Do NOT ask clarifying questions.
        Use the team. iterations=1.

        Context: Public API endpoints have no throttling.
        Scope IN: per-client rate limiting (by API key).
      `;

      await runAgent('tech-advisor', prompt);

      expect(existsSync(SPECS_DIR)).toBe(true);
      expect(existsSync(ISSUES_DIR)).toBe(true);
      expect(existsSync(TMP_DIR)).toBe(true); // Team mode creates drafts

      const drafts = readdirSync(TMP_DIR).filter(f => f.endsWith('.md'));
      expect(drafts.length).toBeGreaterThanOrEqual(1);

      const specs = readdirSync(SPECS_DIR);
      const hlds = specs.filter(f => f.startsWith('hld-'));
      expect(hlds).toHaveLength(1);

      const issues = readdirSync(ISSUES_DIR);
      const stories = issues.filter(f => f.includes('-story-'));
      expect(stories).toHaveLength(1);
    }, 1200000);
  });

  describe('GitHub CVS Mode', () => {
    it('creates an HLD locally but creates child stories via GitHub CLI', async () => {
      const prompt = `
        Write an HLD for an Analytics Module.
        Do NOT ask any questions.
        Solo mode, no team review. Finalize directly immediately.
        You MUST use remote CVS tracking for creating stories. Create the child story via GitHub CLI (gh).
        Only create 1 implementation story. Title it: "[TEST] Analytics Implementation Story"

        Context: We need to track user events.
        Scope IN: Event ingestion, batching.
      `;

      await runAgent('tech-advisor', prompt, 'github-cvs-hld', { env: { ISSUE_TRACKING_FS: '0' } });

      // Verify the HLD was still created locally in .specs/
      expect(existsSync(SPECS_DIR)).toBe(true);
      const specs = readdirSync(SPECS_DIR);
      const hlds = specs.filter(f => f.startsWith('hld-'));
      expect(hlds).toHaveLength(1);

      // Wait a few seconds for GitHub search indexing to catch up
      await new Promise(resolve => setTimeout(resolve, 5000));

      // Find the issue using gh CLI
      const stdout = execSync('gh issue list --state open --search "[TEST] Analytics Implementation Story" --json number', {
        encoding: 'utf-8',
        cwd: TEST_WORKSPACE
      });
      const issues = JSON.parse(stdout);

      // Verify at least one issue was created on GitHub
      expect(issues.length).toBeGreaterThan(0);

      // Clean up by closing the created issue(s)
      for (const issue of issues) {
        execSync(`gh issue close ${issue.number} --reason "not planned"`, { cwd: TEST_WORKSPACE });
      }
    });
  });
});
