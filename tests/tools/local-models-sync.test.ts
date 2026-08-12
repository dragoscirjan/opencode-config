import { readFileSync, writeFileSync } from 'node:fs';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import localModelsSyncTool from '../../tools/local-models-sync.js';

vi.mock('fs', () => ({
  readFileSync: vi.fn(),
  writeFileSync: vi.fn(),
}));

describe('local-models-sync tool', () => {
  const originalFetch = globalThis.fetch;

  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    globalThis.fetch = originalFetch;
  });

  const runTool = (directory = '/mock/project') =>
    localModelsSyncTool.execute({}, { directory } as Parameters<typeof localModelsSyncTool.execute>[1]);

  it('reconciles models for OpenAI-compatible providers and preserves existing settings', async () => {
    (readFileSync as unknown as ReturnType<typeof vi.fn>).mockReturnValue(
      JSON.stringify({
        provider: {
          ollama: {
            npm: '@ai-sdk/openai-compatible',
            options: { baseURL: 'http://127.0.0.1:11434/v1' },
            models: {
              existing: { name: 'Existing Name', temperature: 0.2 },
              stale: { name: 'Stale' },
            },
          },
          lmstudio: {
            api: 'openai',
            options: { baseURL: 'http://127.0.0.1:1234/v1/' },
            models: {},
          },
          custom: {
            options: { baseURL: 'http://127.0.0.1:9999/v1' },
            models: { keep: { name: 'Untouched' } },
          },
        },
      }),
    );

    globalThis.fetch = vi
      .fn()
      .mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: vi.fn().mockResolvedValue({
          data: [{ id: 'existing' }, { id: 'new-model' }],
        }),
      })
      .mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: vi.fn().mockResolvedValue({
          data: [{ id: 'lmstudio-model' }],
        }),
      }) as unknown as typeof fetch;

    const result = await runTool();

    expect(result).toContain('Local model sync complete.');
    expect(result).toContain('Eligible providers scanned: 2');
    expect(result).toContain('- ollama: +1 / -1 / =1');
    expect(result).toContain('- lmstudio: +1 / -0 / =0');
    expect(result).toContain('- custom: skipped (not OpenAI-compatible)');
    expect(result).toContain('Restart OpenCode to apply updated model registrations.');

    expect(globalThis.fetch).toHaveBeenNthCalledWith(
      1,
      'http://127.0.0.1:11434/v1/models',
      expect.objectContaining({ method: 'GET' }),
    );
    expect(globalThis.fetch).toHaveBeenNthCalledWith(
      2,
      'http://127.0.0.1:1234/v1/models',
      expect.objectContaining({ method: 'GET' }),
    );

    expect(writeFileSync).toHaveBeenCalledTimes(1);
    const [, writtenConfig] = (writeFileSync as unknown as ReturnType<typeof vi.fn>).mock.calls[0];
    const parsed = JSON.parse(writtenConfig);

    expect(parsed.provider.ollama.models).toEqual({
      existing: { name: 'Existing Name', temperature: 0.2 },
      'new-model': { name: 'new-model' },
    });
    expect(parsed.provider.lmstudio.models).toEqual({
      'lmstudio-model': { name: 'lmstudio-model' },
    });
    expect(parsed.provider.custom.models).toEqual({ keep: { name: 'Untouched' } });
  });

  it('warns and keeps provider models unchanged when endpoint times out', async () => {
    (readFileSync as unknown as ReturnType<typeof vi.fn>).mockReturnValue(
      JSON.stringify({
        provider: {
          lmstudio: {
            api: 'openai',
            options: { baseURL: 'http://127.0.0.1:1234/v1' },
            models: { keep: { name: 'Keep Me' } },
          },
        },
      }),
    );

    globalThis.fetch = vi
      .fn()
      .mockRejectedValue(Object.assign(new Error('aborted'), { name: 'AbortError' })) as unknown as typeof fetch;

    const result = await runTool();

    expect(result).toContain('Warnings:');
    expect(result).toContain('timeout after 5000ms');

    const [, writtenConfig] = (writeFileSync as unknown as ReturnType<typeof vi.fn>).mock.calls[0];
    const parsed = JSON.parse(writtenConfig);
    expect(parsed.provider.lmstudio.models).toEqual({ keep: { name: 'Keep Me' } });
  });

  it('warns when response payload does not contain data[]', async () => {
    (readFileSync as unknown as ReturnType<typeof vi.fn>).mockReturnValue(
      JSON.stringify({
        provider: {
          llamacpp: {
            api: 'openai',
            options: { baseURL: 'http://127.0.0.1:8080/v1' },
            models: { x: { name: 'x' } },
          },
        },
      }),
    );

    globalThis.fetch = vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      json: vi.fn().mockResolvedValue({ models: [{ id: 'y' }] }),
    }) as unknown as typeof fetch;

    const result = await runTool();

    expect(result).toContain('response payload missing data[] model list');

    const [, writtenConfig] = (writeFileSync as unknown as ReturnType<typeof vi.fn>).mock.calls[0];
    const parsed = JSON.parse(writtenConfig);
    expect(parsed.provider.llamacpp.models).toEqual({ x: { name: 'x' } });
  });

  it('returns an error for invalid opencode.json', async () => {
    (readFileSync as unknown as ReturnType<typeof vi.fn>).mockReturnValue('{not-valid-json');

    globalThis.fetch = vi.fn() as unknown as typeof fetch;

    const result = await runTool();

    expect(result).toContain('Error: opencode.json is not valid JSON.');
    expect(writeFileSync).not.toHaveBeenCalled();
  });
});
