import { existsSync, readdirSync, readFileSync } from 'node:fs';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import issueListTool from '../../tools/issue-list.js';

vi.mock('fs', () => ({
  existsSync: vi.fn(),
  readdirSync: vi.fn(),
  readFileSync: vi.fn(),
}));

describe('issue-list tool', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  const runTool = (args: Parameters<typeof issueListTool.execute>[0], directory = '/mock/dir') =>
    issueListTool.execute(args, { directory } as Parameters<typeof issueListTool.execute>[1]);

  it('should return error if .issues does not exist', async () => {
    (existsSync as unknown as ReturnType<typeof vi.fn>).mockReturnValue(false);
    
    const result = await runTool({});
    expect(result).toBe('No .issues/ directory found.');
  });

  it('should return message if no markdown files are found', async () => {
    (existsSync as unknown as ReturnType<typeof vi.fn>).mockReturnValue(true);
    (readdirSync as unknown as ReturnType<typeof vi.fn>).mockReturnValue(['not-an-issue.txt']);
    
    const result = await runTool({});
    expect(result).toBe('No issues found.');
  });

  it('should list all issues correctly parsed', async () => {
    (existsSync as unknown as ReturnType<typeof vi.fn>).mockReturnValue(true);
    (readdirSync as unknown as ReturnType<typeof vi.fn>).mockReturnValue([
      '00001-epic-auth.md',
      '00002-task-db.md'
    ]);
    
    (readFileSync as unknown as ReturnType<typeof vi.fn>).mockImplementation((path) => {
      if (path.includes('00001')) {
        return 'id: "00001"\ntype: epic\nstatus: in_progress\n';
      }
      return 'id: "00002"\ntype: task\nstatus: open\n';
    });

    const result = await runTool({});
    expect(result).toContain('ID: 00001 | Type: epic | Status: in_progress | File: 00001-epic-auth.md');
    expect(result).toContain('ID: 00002 | Type: task | Status: open | File: 00002-task-db.md');
  });

  it('should filter issues by status', async () => {
    (existsSync as unknown as ReturnType<typeof vi.fn>).mockReturnValue(true);
    (readdirSync as unknown as ReturnType<typeof vi.fn>).mockReturnValue([
      '00001-epic-auth.md',
      '00002-task-db.md'
    ]);
    
    (readFileSync as unknown as ReturnType<typeof vi.fn>).mockImplementation((path) => {
      if (path.includes('00001')) {
        return 'id: "00001"\ntype: epic\nstatus: in_progress\n';
      }
      return 'id: "00002"\ntype: task\nstatus: open\n';
    });

    const result = await runTool({ status: 'open' });
    expect(result).not.toContain('ID: 00001');
    expect(result).toContain('ID: 00002 | Type: task | Status: open | File: 00002-task-db.md');
  });

  it('should return message if filters exclude all issues', async () => {
    (existsSync as unknown as ReturnType<typeof vi.fn>).mockReturnValue(true);
    (readdirSync as unknown as ReturnType<typeof vi.fn>).mockReturnValue(['00001-epic-auth.md']);
    (readFileSync as unknown as ReturnType<typeof vi.fn>).mockReturnValue('id: "00001"\ntype: epic\nstatus: open\n');

    const result = await runTool({ type: 'bug' });
    expect(result).toBe('No issues match the filters.');
  });
});