import { describe, it, expect, vi, beforeEach } from 'vitest';
import { existsSync, mkdirSync, readdirSync, writeFileSync } from 'fs';
import { join } from 'path';
import specCreateTool from '../../tools/spec-create.js';

vi.mock('fs', () => ({
  existsSync: vi.fn(),
  mkdirSync: vi.fn(),
  readdirSync: vi.fn(),
  writeFileSync: vi.fn(),
}));

describe('spec-create tool', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  const runTool = (args: any, directory = '/mock/dir') => 
    specCreateTool.execute(args, { directory } as any);

  it('should validate spec type', async () => {
    const result = await runTool({ type: 'invalid', title: 'Test' });
    expect(result).toContain('Error: invalid type "invalid"');
  });

  it('should validate title presence', async () => {
    const result = await runTool({ type: 'hld', title: '   ' });
    expect(result).toBe('Error: title is required');
  });

  it('should validate status', async () => {
    const result = await runTool({ type: 'hld', title: 'Test', status: 'unknown' });
    expect(result).toContain('Error: invalid status "unknown"');
  });

  it('should validate ID format', async () => {
    const result = await runTool({ type: 'hld', title: 'Test', id: '123' });
    expect(result).toContain('Error: id must be a 5-digit zero-padded number (e.g. 00001)');
  });

  it('should validate parent format', async () => {
    const result = await runTool({ type: 'lld', title: 'Test', parent: 'abcde' });
    expect(result).toContain('Error: parent must be a 5-digit zero-padded number (e.g. 00001)');
  });

  it('should create the first spec as 00001 v1 if .specs does not exist', async () => {
    (existsSync as unknown as ReturnType<typeof vi.fn>).mockReturnValue(false);

    const result = await runTool({ type: 'hld', title: 'My First Spec' });

    expect(mkdirSync).toHaveBeenCalledWith(join('/mock/dir', '.specs'), { recursive: true });
    
    const expectedFilename = 'hld-00001-my-first-spec-v1.md';
    const expectedFilepath = join('/mock/dir', '.specs', expectedFilename);
    
    expect(writeFileSync).toHaveBeenCalledWith(
      expectedFilepath,
      expect.stringContaining('id: "00001"'),
      'utf-8'
    );

    const [_, content] = (writeFileSync as unknown as ReturnType<typeof vi.fn>).mock.calls[0];
    expect(content).toContain('type: hld');
    expect(content).toContain('title: "My First Spec"');
    expect(content).toContain('version: 1');
    expect(content).toContain('status: draft');
    expect(content).toContain('# My First Spec');

    expect(result).toContain('Created: .specs/hld-00001-my-first-spec-v1.md');
    expect(result).toContain('ID: 00001');
    expect(result).toContain('Version: 1');
  });

  it('should calculate the next ID based on existing files', async () => {
    (existsSync as unknown as ReturnType<typeof vi.fn>).mockReturnValue(true);
    (readdirSync as unknown as ReturnType<typeof vi.fn>).mockReturnValue([
      'hld-00042-foo-v1.md',
      'lld-00005-bar-v2.md',
      'not-a-spec.md'
    ]);

    const result = await runTool({ type: 'task', title: 'Next Task' });

    const expectedFilename = 'task-00043-next-task-v1.md';
    const expectedFilepath = join('/mock/dir', '.specs', expectedFilename);
    
    expect(writeFileSync).toHaveBeenCalledWith(
      expectedFilepath,
      expect.stringContaining('id: "00043"'),
      'utf-8'
    );
  });

  it('should bump version if an ID is provided', async () => {
    (existsSync as unknown as ReturnType<typeof vi.fn>).mockReturnValue(true);
    (readdirSync as unknown as ReturnType<typeof vi.fn>).mockReturnValue([
      'lld-00010-foo-v1.md',
      'lld-00010-foo-v2.md',
      'hld-00010-foo-v1.md', // Same ID, different type
    ]);

    const result = await runTool({ type: 'lld', title: 'Foo Update', id: '00010' });

    const expectedFilename = 'lld-00010-foo-update-v3.md';
    const expectedFilepath = join('/mock/dir', '.specs', expectedFilename);
    
    expect(writeFileSync).toHaveBeenCalledWith(
      expectedFilepath,
      expect.stringContaining('version: 3'),
      'utf-8'
    );
    
    expect(result).toContain('Version: 3');
  });

  it('should include optional fields in frontmatter', async () => {
    (existsSync as unknown as ReturnType<typeof vi.fn>).mockReturnValue(false);

    await runTool({ 
      type: 'lld', 
      title: 'Detailed LLD',
      status: 'approved',
      parent: '00010',
      author: 'opencode-agent-1'
    });

    const [_, content] = (writeFileSync as unknown as ReturnType<typeof vi.fn>).mock.calls[0];
    
    expect(content).toContain('status: approved');
    expect(content).toContain('parent: "00010"');
    expect(content).toContain('opencode-agent: opencode-agent-1');
  });
});
