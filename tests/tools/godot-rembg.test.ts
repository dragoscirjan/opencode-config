import { describe, it, expect, vi, beforeEach } from 'vitest';
import { mkdirSync, readdirSync } from 'fs';
import { join } from 'path';
import godotRembgTool from '../../tools/godot-rembg.js';

vi.mock('fs', () => ({
  mkdirSync: vi.fn(),
  readdirSync: vi.fn(),
}));

const mockSharpInstance = {
  metadata: vi.fn().mockResolvedValue({ width: 10, height: 10 }),
  removeAlpha: vi.fn().mockReturnThis(),
  ensureAlpha: vi.fn().mockReturnThis(),
  resize: vi.fn().mockReturnThis(),
  png: vi.fn().mockReturnThis(),
  raw: vi.fn().mockReturnThis(),
  toBuffer: vi.fn(),
  toFile: vi.fn().mockResolvedValue(true),
};

vi.mock('sharp', () => ({
  default: vi.fn(() => mockSharpInstance),
}));

const mockRemoveBackground = vi.fn();
vi.mock('@imgly/background-removal', () => ({
  removeBackground: mockRemoveBackground,
}));

// Provide minimal Buffer mock for Blob arrayBuffer
global.Blob = class Blob {
  private parts: any[];
  constructor(parts: any[], options?: any) {
    this.parts = parts;
  }
  async arrayBuffer() {
    return this.parts[0].buffer || Buffer.from(this.parts[0]).buffer;
  }
} as any;

describe('godot-rembg tool', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  const runTool = (args: any, directory = '/mock/dir') => 
    godotRembgTool.execute(args, { directory } as any);

  const createRgbBuffer = (r: number, g: number, b: number, width = 10, height = 10) => {
    const buf = Buffer.alloc(width * height * 3);
    for (let i = 0; i < width * height; i++) {
      buf[i * 3] = r;
      buf[i * 3 + 1] = g;
      buf[i * 3 + 2] = b;
    }
    return buf;
  };

  const createRgbaBuffer = (r: number, g: number, b: number, a: number, width = 10, height = 10) => {
    const buf = Buffer.alloc(width * height * 4);
    for (let i = 0; i < width * height; i++) {
      buf[i * 4] = r;
      buf[i * 4 + 1] = g;
      buf[i * 4 + 2] = b;
      buf[i * 4 + 3] = a; // Mask alpha channel
    }
    return buf;
  };

  it('should validate missing input', async () => {
    const result = await runTool({});
    expect(JSON.parse(result)).toEqual({ ok: false, error: 'input is required' });
  });

  it('should require output for batch mode', async () => {
    const result = await runTool({ input: 'dir', batch: 'true' });
    expect(JSON.parse(result)).toEqual({ ok: false, error: 'output directory is required for batch mode' });
  });

  it('should process single image', async () => {
    // Setup simple 10x10 image buffers
    const rgbBuf = createRgbBuffer(255, 255, 255); // Background white
    const rgbaBuf = createRgbaBuffer(255, 255, 255, 0); // Resulting mask (0 alpha = background)
    
    // Mock image read sequence:
    // 1. toBuffer() for rgbBuf
    // 2. toBuffer() for inputBuf (passed to removeBackground)
    // 3. toBuffer() for rgbaRaw (parsing the result blob)
    mockSharpInstance.toBuffer
      .mockResolvedValueOnce(rgbBuf)
      .mockResolvedValueOnce(Buffer.from('png-data'))
      .mockResolvedValueOnce(rgbaBuf);

    mockRemoveBackground.mockResolvedValue(new Blob([rgbaBuf]));

    const resultStr = await runTool({ input: 'char.png', output: 'char_nobg.png' });
    const result = JSON.parse(resultStr);

    expect(result.ok).toBe(true);
    expect(result.path).toBe('/mock/dir/char_nobg.png');
    expect(result.regime).toBe('color'); // auto-detected (mask had 0 foreground pixels)
    
    expect(mockRemoveBackground).toHaveBeenCalled();
    expect(mockSharpInstance.toFile).toHaveBeenCalledWith('/mock/dir/char_nobg.png');
  });

  it('should process batch mode directory', async () => {
    (readdirSync as unknown as ReturnType<typeof vi.fn>).mockReturnValue(['01.png', '02.png']);
    
    const rgbBuf = createRgbBuffer(0, 255, 0); // Green bg
    const rgbaBuf = createRgbaBuffer(0, 255, 0, 255); // Solid mask

    // Each image has 3 toBuffer calls
    mockSharpInstance.toBuffer.mockResolvedValue(rgbBuf);
    
    // Override specifically for the mask reading call
    mockSharpInstance.toBuffer = vi.fn()
      .mockResolvedValueOnce(rgbBuf)
      .mockResolvedValueOnce(Buffer.from('png-data-1'))
      .mockResolvedValueOnce(rgbaBuf)
      .mockResolvedValueOnce(rgbBuf)
      .mockResolvedValueOnce(Buffer.from('png-data-2'))
      .mockResolvedValueOnce(rgbaBuf);

    mockRemoveBackground.mockResolvedValue(new Blob([rgbaBuf]));

    const resultStr = await runTool({ input: 'sprites', output: 'sprites_out', batch: 'true' });
    const result = JSON.parse(resultStr);

    expect(result.ok).toBe(true);
    expect(result.processed).toBe(2);
    expect(result.errors).toBe(0);
    expect(result.output_dir).toBe('/mock/dir/sprites_out');
    
    expect(mkdirSync).toHaveBeenCalledWith('/mock/dir/sprites_out', { recursive: true });
    expect(mockSharpInstance.toFile).toHaveBeenCalledTimes(2);
  });
});
