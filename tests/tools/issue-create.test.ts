import { describe, it, expect, vi, beforeEach } from 'vitest';
import { existsSync, mkdirSync, readdirSync, writeFileSync } from 'fs';
import { join } from 'path';
import issueCreateTool from '../../tools/issue-create.js';

vi.mock('fs', () => ({
  existsSync: vi.fn(),
  mkdirSync: vi.fn(),
  readdirSync: vi.fn(),
  writeFileSync: vi.fn(),
}));

describe('issue-create tool', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  const runTool = (args: any, directory = '/mock/dir') => 
    issueCreateTool.execute(args, { directory } as any);

  it('should validate issue type', async () => {
    const result = await runTool({ type: 'invalid', title: 'Test' });
    expect(result).toContain('Error: invalid type "invalid"');
  });

  it('should validate title presence', async () => {
    const result = await runTool({ type: 'task', title: '   ' });
    expect(result).toBe('Error: title is required');
  });

  it('should validate status', async () => {
    const result = await runTool({ type: 'task', title: 'Test', status: 'unknown' });
    expect(result).toContain('Error: invalid status "unknown"');
  });

  it('should validate parent ID format', async () => {
    const result = await runTool({ type: 'task', title: 'Test', parent: '123' });
    expect(result).toContain('Error: invalid parent "123"');
  });

  it('should validate depends IDs format', async () => {
    const result = await runTool({ type: 'task', title: 'Test', depends: '00001,abcde' });
    expect(result).toContain('Error: invalid depends ID "abcde"');
  });

  it('should create the first issue as 00001 if .issues does not exist', async () => {
    (existsSync as unknown as ReturnType<typeof vi.fn>).mockReturnValue(false);

    const result = await runTool({ type: 'task', title: 'My First Task' });

    expect(mkdirSync).toHaveBeenCalledWith(join('/mock/dir', '.issues'), { recursive: true });
    
    const expectedFilename = '00001-task-my-first-task.md';
    const expectedFilepath = join('/mock/dir', '.issues', expectedFilename);
    
    expect(writeFileSync).toHaveBeenCalled();
    const [path, content] = (writeFileSync as unknown as ReturnType<typeof vi.fn>).mock.calls[0];
    expect(path).toBe(expectedFilepath);
    expect(content).toContain('id: "00001"');
    expect(content).toContain('type: task');
    expect(content).toContain('title: "My First Task"');
    expect(content).toContain('status: open');
    expect(content).toContain('# My First Task');
    expect(content).toContain('## Comments');

    expect(result).toContain('Created: .issues/00001-task-my-first-task.md');
    expect(result).toContain('ID: 00001');
  });

  it('should calculate the next ID based on existing files', async () => {
    (existsSync as unknown as ReturnType<typeof vi.fn>).mockReturnValue(true);
    (readdirSync as unknown as ReturnType<typeof vi.fn>).mockReturnValue([
      '00042-task-foo.md',
      '00005-bug-bar.md',
      'not-an-issue.md'
    ]);

    const result = await runTool({ type: 'epic', title: 'Next Epic' });

    const expectedFilename = '00043-epic-next-epic.md';
    const expectedFilepath = join('/mock/dir', '.issues', expectedFilename);
    
    expect(writeFileSync).toHaveBeenCalledWith(
      expectedFilepath,
      expect.stringContaining('id: "00043"'),
      'utf-8'
    );
  });

  it('should include optional fields in frontmatter', async () => {
    (existsSync as unknown as ReturnType<typeof vi.fn>).mockReturnValue(false);

    await runTool({ 
      type: 'story', 
      title: 'Detailed Story',
      status: 'in_progress',
      parent: '00010',
      depends: '00005, 00006',
      author: 'opencode-agent-1'
    });

    const [_, content] = (writeFileSync as unknown as ReturnType<typeof vi.fn>).mock.calls[0];
    
    expect(content).toContain('status: in_progress');
    expect(content).toContain('parent: "00010"');
    expect(content).toContain('depends: ["00005", "00006"]');
    expect(content).toContain('opencode-agent: opencode-agent-1');
  });
});
