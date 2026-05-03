import { randomBytes } from 'node:crypto';
import { mkdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { tool } from '@opencode-ai/plugin';

function kebabCase(input: string): string {
  return input
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');
}

export default tool({
  description:
    'Create a new draft file in .ai.tmp/ with a unique hash in the filename. ' +
    'Returns the file path. The agent should then write content to it.',
  args: {
    title: tool.schema.string().describe('Title for the draft (used in filename)'),
  },
  async execute(args, context) {
    const cwd = context.directory;

    const title = args.title?.trim();
    if (!title) return 'Error: title is required';

    const draftsDir = join(cwd, '.ai.tmp');
    mkdirSync(draftsDir, { recursive: true });

    const hash = randomBytes(4).toString('hex');
    const slug = kebabCase(title) || 'untitled';
    const filename = `${slug}-${hash}.md`;
    const filepath = join(draftsDir, filename);

    writeFileSync(filepath, '', 'utf-8');

    return [`Created: .ai.tmp/${filename}`, 'Write your draft content to this file.'].join('\n');
  },
});
