import { describe, it, expect, vi, beforeEach } from 'vitest';
import { readdirSync } from 'fs';
import { join } from 'path';
import godotLoopDetectTool from '../../tools/godot-loop-detect.js';

vi.mock('fs', () => ({
  readdirSync: vi.fn(),
}));

const mockSharpInstance = {
  resize: vi.fn().mockReturnThis(),
  removeAlpha: vi.fn().mockReturnThis(),
  raw: vi.fn().mockReturnThis(),
  toBuffer: vi.fn(),
};

vi.mock('sharp', () => ({
  default: vi.fn(() => mockSharpInstance),
}));

describe('godot-loop-detect tool', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  const runTool = (args: any, directory = '/mock/dir') => 
    godotLoopDetectTool.execute(args, { directory } as any);

  // Creates a buffer with a single byte set to 255, rest 0.
  // This guarantees orthogonal vectors (similarity = 0) if index differs.
  const createOrthogonalBuffer = (index: number, length: number = 32 * 32 * 3) => {
    const buf = Buffer.alloc(length, 0);
    if (index < length) buf[index] = 255;
    return buf;
  };

  it('should validate missing framesDir', async () => {
    const result = await runTool({});
    expect(JSON.parse(result)).toEqual({ error: 'framesDir is required' });
  });

  it('should handle fs readdirSync errors', async () => {
    (readdirSync as unknown as ReturnType<typeof vi.fn>).mockImplementation(() => {
      throw new Error('ENOENT');
    });
    const result = await runTool({ framesDir: 'frames' });
    expect(JSON.parse(result).error).toContain('Cannot read frames directory: ENOENT');
  });

  it('should handle not enough frames', async () => {
    (readdirSync as unknown as ReturnType<typeof vi.fn>).mockReturnValue(['01.png', '02.png']);
    const result = await runTool({ framesDir: 'frames' });
    expect(JSON.parse(result)).toEqual({ error: 'Not enough frames (2) for skip=10' });
  });

  it('should find a good loop point with identical frames', async () => {
    const frames = Array.from({ length: 30 }, (_, i) => `frame_${String(i).padStart(2, '0')}.png`);
    (readdirSync as unknown as ReturnType<typeof vi.fn>).mockReturnValue(frames);

    mockSharpInstance.toBuffer.mockImplementation(async () => {
      return createOrthogonalBuffer(0); // All identical, so sim=1.0 for all pairs
    });

    const resultStr = await runTool({ framesDir: 'frames' });
    const result = JSON.parse(resultStr);

    expect(result.loop_frame).toBeGreaterThanOrEqual(17);
    expect(result.similarity).toBeCloseTo(1.0);
    expect(result.window).toBe(7);
  });

  it('should fallback to 1-frame window if 7-frame window fails', async () => {
    const frames = Array.from({ length: 20 }, (_, i) => `frame_${String(i).padStart(2, '0')}.png`);
    (readdirSync as unknown as ReturnType<typeof vi.fn>).mockReturnValue(frames);

    let callCount = -1;
    mockSharpInstance.toBuffer.mockImplementation(async () => {
      callCount++;
      // Frame 0 and Frame 15 are identical. Others are orthogonal.
      if (callCount === 0 || callCount === 15) return createOrthogonalBuffer(0);
      return createOrthogonalBuffer(callCount + 1); 
    });

    const resultStr = await runTool({ framesDir: 'frames', skip: '0' });
    const result = JSON.parse(resultStr);

    expect(result.loop_frame).toBe(16); // index 15 + 1
    expect(result.window).toBe(1);
    expect(result.similarity).toBeGreaterThan(0.9);
  });

  it('should return note if no good loop point found', async () => {
    const frames = Array.from({ length: 15 }, (_, i) => `frame_${String(i).padStart(2, '0')}.png`);
    (readdirSync as unknown as ReturnType<typeof vi.fn>).mockReturnValue(frames);

    let callCount = 0;
    mockSharpInstance.toBuffer.mockImplementation(async () => {
      callCount++;
      return createOrthogonalBuffer(callCount); // All mutually orthogonal
    });

    const resultStr = await runTool({ framesDir: 'frames', skip: '0' });
    const result = JSON.parse(resultStr);

    expect(result.loop_frame).toBe(15);
    expect(result.similarity).toBe(0);
    expect(result.note).toBe('no good loop point found, using whole clip');
  });
});
