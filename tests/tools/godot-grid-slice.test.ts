import { describe, it, expect, vi, beforeEach } from 'vitest';
import { mkdirSync } from 'fs';
import { join } from 'path';
import godotGridSliceTool from '../../tools/godot-grid-slice.js';

vi.mock('fs', () => ({
  mkdirSync: vi.fn(),
}));

// Mock sharp module dynamically
const mockSharpInstance = {
  metadata: vi.fn().mockResolvedValue({ width: 100, height: 100 }),
  extract: vi.fn().mockReturnThis(),
  png: vi.fn().mockReturnThis(),
  toFile: vi.fn().mockResolvedValue(true),
};

vi.mock('sharp', () => ({
  default: vi.fn(() => mockSharpInstance),
}));

describe('godot-grid-slice tool', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  const runTool = (args: any, directory = '/mock/dir') => 
    godotGridSliceTool.execute(args, { directory } as any);

  it('should validate missing input', async () => {
    const result = await runTool({ output: 'out' });
    expect(JSON.parse(result)).toEqual({ ok: false, error: 'input is required' });
  });

  it('should validate missing output', async () => {
    const result = await runTool({ input: 'in.png' });
    expect(JSON.parse(result)).toEqual({ ok: false, error: 'output is required' });
  });

  it('should validate grid format', async () => {
    const result = await runTool({ input: 'in.png', output: 'out', grid: '2-2' });
    expect(JSON.parse(result)).toEqual({ ok: false, error: 'Invalid grid format: "2-2". Use ColsxRows, e.g. "2x2"' });
  });

  it('should validate name count against grid size', async () => {
    const result = await runTool({ input: 'in.png', output: 'out', grid: '2x2', names: 'one,two,three' });
    expect(JSON.parse(result)).toEqual({ ok: false, error: '--names has 3 entries, grid is 4 cells (2x2)' });
  });

  it('should slice image into 2x2 grid and return paths', async () => {
    mockSharpInstance.metadata.mockResolvedValueOnce({ width: 200, height: 200 });

    const resultStr = await runTool({ input: 'in.png', output: 'out_dir', grid: '2x2' });
    const result = JSON.parse(resultStr);

    expect(result.ok).toBe(true);
    expect(result.cells).toBe(4);
    expect(result.cell_size).toBe('100x100');
    expect(result.paths).toHaveLength(4);

    const baseDir = join('/mock/dir', 'out_dir');
    expect(result.paths).toEqual([
      join(baseDir, '01.png'),
      join(baseDir, '02.png'),
      join(baseDir, '03.png'),
      join(baseDir, '04.png'),
    ]);

    expect(mockSharpInstance.extract).toHaveBeenCalledTimes(4);
    // Top-left
    expect(mockSharpInstance.extract).toHaveBeenNthCalledWith(1, { left: 0, top: 0, width: 100, height: 100 });
    // Top-right
    expect(mockSharpInstance.extract).toHaveBeenNthCalledWith(2, { left: 100, top: 0, width: 100, height: 100 });
    // Bottom-left
    expect(mockSharpInstance.extract).toHaveBeenNthCalledWith(3, { left: 0, top: 100, width: 100, height: 100 });
    // Bottom-right
    expect(mockSharpInstance.extract).toHaveBeenNthCalledWith(4, { left: 100, top: 100, width: 100, height: 100 });
    
    expect(mkdirSync).toHaveBeenCalledWith(baseDir, { recursive: true });
  });

  it('should use custom names if provided', async () => {
    mockSharpInstance.metadata.mockResolvedValueOnce({ width: 200, height: 100 });

    const resultStr = await runTool({ 
      input: 'sprite.png', 
      output: 'out_sprites', 
      grid: '2x1',
      names: 'idle,run'
    });
    
    const result = JSON.parse(resultStr);
    expect(result.ok).toBe(true);
    
    const baseDir = join('/mock/dir', 'out_sprites');
    expect(result.paths).toEqual([
      join(baseDir, 'idle.png'),
      join(baseDir, 'run.png')
    ]);
  });
});
