import { describe, it, expect, vi, beforeEach } from 'vitest';
import { readFileSync } from 'fs';
import { join } from 'path';
import godotVisualQaTool from '../../tools/godot-visual-qa.js';

vi.mock('fs', () => ({
  readFileSync: vi.fn(),
}));

const mockGenerateContent = vi.fn();

class MockGoogleGenAI {
  models = {
    generateContent: mockGenerateContent
  };
}

vi.mock('@google/genai', () => ({
  GoogleGenAI: MockGoogleGenAI
}));

describe('godot-visual-qa tool', () => {
  const originalEnv = process.env;

  beforeEach(() => {
    vi.clearAllMocks();
    process.env = { ...originalEnv, GEMINI_API_KEY: 'test-key' };
    
    (readFileSync as unknown as ReturnType<typeof vi.fn>).mockReturnValue(Buffer.from('fake-image-data'));
    mockGenerateContent.mockResolvedValue({ text: '## Score: 8/10\n## Issues\nNone' });
  });

  const runTool = (args: any, directory = '/mock/dir') => 
    godotVisualQaTool.execute(args, { directory } as any);

  it('should validate missing images', async () => {
    const result = await runTool({ images: '   ' });
    expect(result).toBe('Error: images is required (comma-separated paths)');
  });

  it('should validate missing reference in static/dynamic mode', async () => {
    const result = await runTool({ images: 'shot.png', mode: 'static' });
    expect(result).toBe('Error: reference image is required for static/dynamic mode');
  });

  it('should validate missing question in question mode', async () => {
    const result = await runTool({ images: 'shot.png', mode: 'question' });
    expect(result).toBe('Error: question is required for question mode');
  });

  it('should error if API key is missing', async () => {
    delete process.env.GEMINI_API_KEY;
    delete process.env.GOOGLE_API_KEY;
    
    const result = await runTool({ images: 'shot.png', reference: 'ref.png' });
    expect(result).toBe('Error: GEMINI_API_KEY or GOOGLE_API_KEY environment variable not set');
  });

  it('should auto-detect static mode and call Gemini API', async () => {
    const result = await runTool({ images: 'shot.png', reference: 'ref.png' });
    
    expect(result).toBe('## Score: 8/10\n## Issues\nNone');
    
    expect(readFileSync).toHaveBeenCalledWith(join('/mock/dir', 'ref.png'));
    expect(readFileSync).toHaveBeenCalledWith(join('/mock/dir', 'shot.png'));
    
    expect(mockGenerateContent).toHaveBeenCalledTimes(1);
    const callArgs = mockGenerateContent.mock.calls[0][0];
    expect(callArgs.model).toBe('gemini-3-flash');
    expect(callArgs.contents[0].parts).toContainEqual(expect.objectContaining({ text: expect.stringContaining('visual target') }));
    expect(callArgs.contents[0].parts).toContainEqual(expect.objectContaining({ inlineData: { mimeType: 'image/png', data: 'ZmFrZS1pbWFnZS1kYXRh' } })); // base64 of fake-image-data
  });

  it('should auto-detect dynamic mode for multiple images', async () => {
    const result = await runTool({ images: 'frame1.jpg,frame2.jpg', reference: 'ref.jpg' });
    
    expect(result).toBe('## Score: 8/10\n## Issues\nNone');
    
    expect(readFileSync).toHaveBeenCalledWith(join('/mock/dir', 'ref.jpg'));
    expect(readFileSync).toHaveBeenCalledWith(join('/mock/dir', 'frame1.jpg'));
    expect(readFileSync).toHaveBeenCalledWith(join('/mock/dir', 'frame2.jpg'));
    
    const callArgs = mockGenerateContent.mock.calls[0][0];
    expect(callArgs.contents[0].parts).toContainEqual(expect.objectContaining({ text: expect.stringContaining('frame sequence') }));
  });

  it('should handle question mode with custom task context', async () => {
    mockGenerateContent.mockResolvedValue({ text: 'The button is misaligned.' });

    const result = await runTool({ 
      images: 'ui.webp', 
      question: 'Is the button aligned?',
      taskContext: 'Fix UI alignment'
    });
    
    expect(result).toBe('The button is misaligned.');
    
    const callArgs = mockGenerateContent.mock.calls[0][0];
    const parts = callArgs.contents[0].parts;
    
    expect(parts).toContainEqual(expect.objectContaining({ 
      text: expect.stringContaining('Is the button aligned?') 
    }));
    expect(parts).toContainEqual(expect.objectContaining({ 
      text: expect.stringContaining('Fix UI alignment') 
    }));
    expect(parts).toContainEqual(expect.objectContaining({ 
      inlineData: { mimeType: 'image/webp', data: 'ZmFrZS1pbWFnZS1kYXRh' } 
    }));
  });

  it('should handle missing text response from Gemini', async () => {
    mockGenerateContent.mockResolvedValue({ text: '' }); // Empty or blocked
    
    const result = await runTool({ images: 'shot.png', reference: 'ref.png' });
    expect(result).toBe('Error: Gemini returned no text (possible safety block)');
  });

  it('should handle API errors gracefully', async () => {
    mockGenerateContent.mockRejectedValue(new Error('Network error'));
    
    const result = await runTool({ images: 'shot.png', reference: 'ref.png' });
    expect(result).toBe('Error: Gemini API call failed: Network error');
  });

  it('should handle file read errors gracefully', async () => {
    (readFileSync as unknown as ReturnType<typeof vi.fn>).mockImplementation(() => {
      throw new Error('ENOENT: no such file');
    });
    
    const result = await runTool({ images: 'missing.png', reference: 'ref.png' });
    expect(result).toContain('Error: Cannot read reference image: ENOENT: no such file');
  });
});
