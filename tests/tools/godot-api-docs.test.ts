import { describe, it, expect, vi, beforeEach } from 'vitest';
import { readFileSync, writeFileSync, mkdirSync, existsSync, readdirSync } from 'fs';
import { join } from 'path';
import godotApiDocsTool from '../../tools/godot-api-docs.js';

vi.mock('fs', () => ({
  readFileSync: vi.fn(),
  writeFileSync: vi.fn(),
  mkdirSync: vi.fn(),
  existsSync: vi.fn(),
  readdirSync: vi.fn(),
}));

const mockXmlParser = vi.fn();
vi.mock('fast-xml-parser', () => ({
  XMLParser: class {
    parse = mockXmlParser;
  }
}));

const mockGitClone = vi.fn();
const mockGitRaw = vi.fn();
const mockSimpleGit = vi.fn().mockReturnValue({
  clone: mockGitClone,
  raw: mockGitRaw,
});

vi.mock('simple-git', () => ({
  simpleGit: mockSimpleGit
}));

describe('godot-api-docs tool', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  const runTool = (args: any, directory = '/mock/dir') => 
    godotApiDocsTool.execute(args, { directory } as any);

  it('should validate invalid command', async () => {
    const result = await runTool({ command: 'invalid' });
    expect(JSON.parse(result)).toEqual({ ok: false, error: 'Unknown command: "invalid". Use "lookup", "build", "list", or "ensure"' });
  });

  it('should execute "ensure" and clone if not exists', async () => {
    (existsSync as unknown as ReturnType<typeof vi.fn>).mockReturnValue(false); // xmlDir missing
    
    mockGitClone.mockResolvedValueOnce(undefined);
    mockGitRaw.mockResolvedValueOnce(undefined);

    const resultStr = await runTool({ command: 'ensure' });
    const result = JSON.parse(resultStr);

    expect(result.ok).toBe(true);
    expect(mockSimpleGit).toHaveBeenCalled();
    expect(mockGitClone).toHaveBeenCalledWith(
      'https://github.com/godotengine/godot.git',
      expect.stringContaining('.godot-docs/godot'),
      expect.arrayContaining(['--sparse'])
    );
    expect(mockGitRaw).toHaveBeenCalledWith(['sparse-checkout', 'set', 'doc/classes']);
  });

  it('should not clone if XML files already exist in ensure', async () => {
    (existsSync as unknown as ReturnType<typeof vi.fn>).mockReturnValue(true);
    (readdirSync as unknown as ReturnType<typeof vi.fn>).mockReturnValue(['Node.xml']);

    const resultStr = await runTool({ command: 'ensure' });
    const result = JSON.parse(resultStr);

    expect(result.ok).toBe(true);
    expect(mockGitClone).not.toHaveBeenCalled();
  });

  it('should execute "list" command with filter', async () => {
    const resultStr = await runTool({ command: 'list', filter: 'scene' });
    const result = JSON.parse(resultStr);

    expect(result.ok).toBe(true);
    expect(result.filter).toBe('scene');
    expect(result.classes.length).toBeGreaterThan(0);
    expect(result.classes).toContain('Node');
  });

  it('should execute "lookup" for a specific class', async () => {
    (existsSync as unknown as ReturnType<typeof vi.fn>).mockImplementation((path: string) => {
      if (path.endsWith('.md')) return false; // Cache doesn't exist
      if (path.endsWith('.xml')) return true; // XML exists
      return true;
    });

    (readFileSync as unknown as ReturnType<typeof vi.fn>).mockReturnValue('<class name="Node" inherits="Object"></class>');
    
    mockXmlParser.mockReturnValue({
      class: {
        '@_name': 'Node',
        '@_inherits': 'Object',
        brief_description: { '#text': 'Base class for all scene objects.' },
        methods: { method: [] }
      }
    });

    const result = await runTool({ command: 'lookup', className: 'Node' });
    
    // Result is directly markdown, not JSON
    expect(result).toContain('# Node');
    expect(result).toContain('## Node <- Object');
    expect(result).toContain('Base class for all scene objects.');
  });

  it('should execute "build" command and output markdown files', async () => {
    (existsSync as unknown as ReturnType<typeof vi.fn>).mockReturnValue(true);
    (readdirSync as unknown as ReturnType<typeof vi.fn>).mockImplementation((path) => {
      if (path.includes('classes')) return ['Node.xml'];
      return [];
    });

    mockXmlParser.mockReturnValue({
      class: {
        '@_name': 'Node',
        '@_inherits': 'Object',
        brief_description: { '#text': 'Base class for all scene objects.' },
      }
    });

    const resultStr = await runTool({ command: 'build', filter: 'scene' });
    const result = JSON.parse(resultStr);

    expect(result.ok).toBe(true);
    expect(result.converted).toBe(1);
    expect(writeFileSync).toHaveBeenCalledWith(
      expect.stringContaining('Node.md'),
      expect.any(String)
    );
    expect(writeFileSync).toHaveBeenCalledWith(
      expect.stringContaining('_index.md'),
      expect.any(String)
    );
  });
});
