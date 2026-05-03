import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { join } from 'node:path';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import godotTripo3dTool from '../../tools/godot-tripo3d.js';

vi.mock('fs', () => ({
  readFileSync: vi.fn(),
  writeFileSync: vi.fn(),
  mkdirSync: vi.fn(),
}));

// Provide minimal Blob and FormData
global.Blob = class Blob {
  private parts: unknown[];
  constructor(parts: unknown[]) {
    this.parts = parts;
  }
} as unknown as typeof Blob;

global.FormData = class FormData {
  private data: Record<string, unknown> = {};
  append(key: string, value: unknown, filename?: string) {
    this.data[key] = { value, filename };
  }
} as unknown as typeof FormData;

const mockFetch = vi.fn();
global.fetch = mockFetch as unknown as typeof fetch;

describe('godot-tripo3d tool', () => {
  const originalEnv = process.env;

  beforeEach(() => {
    vi.clearAllMocks();
    process.env = { ...originalEnv, TRIPO3D_API_KEY: 'test-key' };
    (readFileSync as unknown as ReturnType<typeof vi.fn>).mockReturnValue(Buffer.from('fake-image'));
  });

  const runTool = (args: Parameters<typeof godotTripo3dTool.execute>[0], directory = '/mock/dir') =>
    godotTripo3dTool.execute(args, { directory } as Parameters<typeof godotTripo3dTool.execute>[1]);

  it('should validate missing image', async () => {
    const result = await runTool({ output: 'out.glb' });
    expect(JSON.parse(result)).toEqual({ ok: false, error: 'image is required' });
  });

  it('should error if API key is missing', async () => {
    delete process.env.TRIPO3D_API_KEY;
    const result = await runTool({ image: 'img.png', output: 'out.glb' });
    expect(JSON.parse(result)).toEqual({ ok: false, error: 'TRIPO3D_API_KEY environment variable not set' });
  });

  it('should upload image, create task, poll status, and download model', async () => {
    // 1. Upload mock
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ data: { image_token: 'token-123' } }),
    });

    // 2. Create task mock
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ data: { task_id: 'task-123' } }),
    });

    // 3. Poll status mock (pending then success)
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ data: { status: 'running' } }),
    });
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ data: { status: 'success', output: { pbr_model: 'https://tripo.ai/model.glb' } } }),
    });

    // 4. Download model mock
    mockFetch.mockResolvedValueOnce({
      ok: true,
      arrayBuffer: async () => Buffer.from('mock-glb-data').buffer,
    });

    vi.useFakeTimers();

    const promise = runTool({ image: 'img.png', output: 'models/out.glb' });

    // Fast-forward timers for the polling delay
    await vi.runAllTimersAsync();

    const resultStr = await promise;
    const result = JSON.parse(resultStr);

    vi.useRealTimers();

    expect(result.ok).toBe(true);
    expect(result.path).toBe('/mock/dir/models/out.glb');
    expect(result.cost_cents).toBe(50); // Default preset cost
    expect(result.task_id).toBe('task-123');

    // Verification
    expect(mkdirSync).toHaveBeenCalledWith(join('/mock/dir', 'models'), { recursive: true });
    expect(writeFileSync).toHaveBeenCalledWith('/mock/dir/models/out.glb', expect.any(Buffer));
  });

  it('should handle API errors properly', async () => {
    // Upload mock failure
    mockFetch.mockResolvedValueOnce({
      ok: false,
      status: 401,
      text: async () => 'Unauthorized',
    });

    const resultStr = await runTool({ image: 'img.png', output: 'out.glb' });
    const result = JSON.parse(resultStr);

    expect(result.ok).toBe(false);
    expect(result.error).toContain('Upload failed (401): Unauthorized');
  });

  it('should handle timeout during polling', async () => {
    // 1. Upload mock
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ data: { image_token: 'token-123' } }),
    });

    // 2. Create task mock
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ data: { task_id: 'task-123' } }),
    });

    // 3. Poll status mock always running
    // We need to return running endlessly until timeout.
    mockFetch.mockImplementation(async (url) => {
      if (url.includes('/task/task-123')) {
        return {
          ok: true,
          json: async () => ({ data: { status: 'running' } }),
        };
      }
      return { ok: true, json: async () => ({}) };
    });

    vi.useFakeTimers();

    const promise = runTool({ image: 'img.png', output: 'out.glb', timeout: '1' });

    // Fast-forward timers for polling
    await vi.runAllTimersAsync();

    const resultStr = await promise;
    const result = JSON.parse(resultStr);

    vi.useRealTimers();

    expect(result.ok).toBe(false);
    expect(result.error).toContain('Task task-123 timed out');
  });
});
