import { existsSync, readdirSync, readFileSync } from 'node:fs';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import issueReadTool from '../../tools/issue-read.js';

vi.mock('fs', () => ({
  existsSync: vi.fn(),
  readdirSync: vi.fn(),
  readFileSync: vi.fn(),
}));

describe('issue-read tool', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  const runTool = (args: Parameters<typeof issueReadTool.execute>[0], directory = '/mock/dir') =>
    issueReadTool.execute(args, { directory } as Parameters<typeof issueReadTool.execute>[1]);

  it('should return error if .issues does not exist', async () => {
    (existsSync as unknown as ReturnType<typeof vi.fn>).mockReturnValue(false);
    
    const result = await runTool({ id: '00001' });
    expect(result).toBe('Error: No .issues/ directory found.');
  });

  it('should return error if issue ID is not found', async () => {
    (existsSync as unknown as ReturnType<typeof vi.fn>).mockReturnValue(true);
    (readdirSync as unknown as ReturnType<typeof vi.fn>).mockReturnValue(['00002-task-db.md']);
    
    const result = await runTool({ id: '00001' });
    expect(result).toBe('Error: Issue with ID 00001 not found.');
  });

  it('should return error if multiple issues match the ID prefix', async () => {
    (existsSync as unknown as ReturnType<typeof vi.fn>).mockReturnValue(true);
    (readdirSync as unknown as ReturnType<typeof vi.fn>).mockReturnValue([
      '00001-task-a.md',
      '00001-task-b.md'
    ]);
    
    const result = await runTool({ id: '00001' });
    expect(result).toBe('Error: Multiple issues found starting with ID 00001.');
  });

  it('should return the file content when a unique match is found', async () => {
    (existsSync as unknown as ReturnType<typeof vi.fn>).mockReturnValue(true);
    (readdirSync as unknown as ReturnType<typeof vi.fn>).mockReturnValue(['00042-bug-fix.md']);
    (readFileSync as unknown as ReturnType<typeof vi.fn>).mockReturnValue('# Bug Fix Content');
    
    const result = await runTool({ id: '00042' });
    expect(result).toBe('# Bug Fix Content');
    expect(readFileSync).toHaveBeenCalledWith('/mock/dir/.issues/00042-bug-fix.md', 'utf-8');
  });
});