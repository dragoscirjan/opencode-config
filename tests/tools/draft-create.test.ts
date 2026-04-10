import { describe, it, expect, vi, beforeEach } from 'vitest';
import { mkdirSync, writeFileSync } from 'fs';
import { join } from 'path';
import { randomBytes } from 'crypto';
import draftCreateTool from '../../tools/draft-create.js';

vi.mock('fs', () => ({
  mkdirSync: vi.fn(),
  writeFileSync: vi.fn(),
}));

vi.mock('crypto', () => ({
  randomBytes: vi.fn(),
}));

describe('draft-create tool', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should create a draft file with a unique hash in .ai.tmp directory', async () => {
    // Setup mocks
    const mockHash = 'deadbeef';
    (randomBytes as unknown as ReturnType<typeof vi.fn>).mockReturnValue({
      toString: () => mockHash,
    });

    const context = { directory: '/mock/project/dir' };
    const args = { title: 'My Awesome Feature' };

    // Run tool
    const result = await draftCreateTool.execute(args, context as any);

    // Verify fs calls
    expect(mkdirSync).toHaveBeenCalledWith(join('/mock/project/dir', '.ai.tmp'), { recursive: true });
    
    const expectedFilename = `my-awesome-feature-${mockHash}.md`;
    const expectedFilepath = join('/mock/project/dir', '.ai.tmp', expectedFilename);
    expect(writeFileSync).toHaveBeenCalledWith(expectedFilepath, '', 'utf-8');

    // Verify output message
    expect(result).toBe(`Created: .ai.tmp/${expectedFilename}\nWrite your draft content to this file.`);
  });

  it('should handle special characters in the title and kebab-case them', async () => {
    const mockHash = '1234abcd';
    (randomBytes as unknown as ReturnType<typeof vi.fn>).mockReturnValue({
      toString: () => mockHash,
    });

    const context = { directory: '/mock/project/dir' };
    const args = { title: '  User Profile & Settings (V2)!  ' };

    await draftCreateTool.execute(args, context as any);

    const expectedFilename = `user-profile-settings-v2-${mockHash}.md`;
    const expectedFilepath = join('/mock/project/dir', '.ai.tmp', expectedFilename);
    
    expect(writeFileSync).toHaveBeenCalledWith(expectedFilepath, '', 'utf-8');
  });

  it('should fall back to "untitled" if title produces empty slug', async () => {
    const mockHash = '5678efff';
    (randomBytes as unknown as ReturnType<typeof vi.fn>).mockReturnValue({
      toString: () => mockHash,
    });

    const context = { directory: '/mock/project/dir' };
    const args = { title: '!!! ???' }; // Results in empty string after cleanup

    await draftCreateTool.execute(args, context as any);

    const expectedFilename = `untitled-${mockHash}.md`;
    const expectedFilepath = join('/mock/project/dir', '.ai.tmp', expectedFilename);
    
    expect(writeFileSync).toHaveBeenCalledWith(expectedFilepath, '', 'utf-8');
  });

  it('should return error if title is empty string', async () => {
    const context = { directory: '/mock/project/dir' };
    const args = { title: '   ' };

    const result = await draftCreateTool.execute(args, context as any);

    expect(result).toBe('Error: title is required');
    expect(mkdirSync).not.toHaveBeenCalled();
    expect(writeFileSync).not.toHaveBeenCalled();
  });
});
