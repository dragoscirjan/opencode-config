import { describe, it, expect, vi, beforeEach } from 'vitest';
import { readFileSync, writeFileSync, mkdirSync, existsSync } from 'fs';
import { join } from 'path';
import godotAssetGenTool from '../../tools/godot-asset-gen.js';

vi.mock('fs', () => ({
  readFileSync: vi.fn(),
  writeFileSync: vi.fn(),
  mkdirSync: vi.fn(),
  existsSync: vi.fn(),
}));

const mockFetch = vi.fn();
global.fetch = mockFetch as any;

describe('godot-asset-gen tool', () => {
  const originalEnv = process.env;

  beforeEach(() => {
    vi.clearAllMocks();
    process.env = { ...originalEnv, GROK_API_KEY: 'test-key', XAI_API_KEY: 'test-key' };
  });

  const runTool = (args: any, directory = '/mock/dir') => 
    godotAssetGenTool.execute(args, { directory } as any);

  it('should set and retrieve budget', async () => {
    (existsSync as unknown as ReturnType<typeof vi.fn>).mockReturnValue(false);

    // set_budget
    const setResult = await runTool({ command: 'set_budget', cents: '1000' });
    expect(JSON.parse(setResult)).toEqual({ ok: true, budget_cents: 1000, spent_cents: 0, remaining_cents: 1000 });

    // get_budget
    (existsSync as unknown as ReturnType<typeof vi.fn>).mockReturnValue(true);
    (readFileSync as unknown as ReturnType<typeof vi.fn>).mockReturnValue(JSON.stringify({
      budget_cents: 1000,
      log: [{ "xai-video": 50 }]
    }));

    const getResult = await runTool({ command: 'get_budget' });
    expect(JSON.parse(getResult)).toEqual({
      ok: true,
      budget_cents: 1000,
      spent_cents: 50,
      remaining_cents: 950,
      log_entries: 1
    });
  });

  it('should validate missing image parameters', async () => {
    const resultStr = await runTool({ command: 'image' });
    expect(JSON.parse(resultStr)).toEqual({ ok: false, error: 'prompt is required' });
  });

  it('should mock generate grok image successfully', async () => {
    (existsSync as unknown as ReturnType<typeof vi.fn>).mockReturnValue(true);
    (readFileSync as unknown as ReturnType<typeof vi.fn>).mockReturnValue(JSON.stringify({
      budget_cents: 1000,
      log: []
    }));

    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        data: [{ url: 'https://grok.ai/fake-image.png' }]
      })
    });
    
    mockFetch.mockResolvedValueOnce({
      ok: true,
      arrayBuffer: async () => Buffer.from('fake-png').buffer
    });

    const resultStr = await runTool({ 
      command: 'image', 
      prompt: 'a red ball', 
      output: 'ball.png',
      model: 'grok',
      size: '1K' 
    });

    const result = JSON.parse(resultStr);
    expect(result.ok).toBe(true);
    expect(result.path).toBe('/mock/dir/ball.png');
  });

  it('should mock generate video successfully', async () => {
    (existsSync as unknown as ReturnType<typeof vi.fn>).mockReturnValue(true);
    (readFileSync as unknown as ReturnType<typeof vi.fn>).mockReturnValue(JSON.stringify({
      budget_cents: 1000,
      log: []
    }));

    // Video generation mock
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ data: [{ url: 'https://xai.com/vid.mp4' }] })
    });

    // Download mock
    mockFetch.mockResolvedValueOnce({
      ok: true,
      arrayBuffer: async () => Buffer.from('fake-mp4').buffer
    });

    vi.useFakeTimers();

    const promise = runTool({ 
      command: 'video', 
      prompt: 'a bouncing ball', 
      output: 'ball.mp4',
      image: 'ref.png',
      duration: '3' // 3 * 5c = 15c
    });

    await vi.runAllTimersAsync();
    const resultStr = await promise;
    const result = JSON.parse(resultStr);

    vi.useRealTimers();

    expect(result.ok).toBe(true);
    expect(result.path).toBe('/mock/dir/ball.mp4');
    expect(result.cost_cents).toBe(15);
  });
});
