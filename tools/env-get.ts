import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { tool } from '@opencode-ai/plugin';

function parseEnv(content: string): Record<string, string> {
  const result: Record<string, string> = {};
  const lines = content.split('\n');
  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) continue;
    const match = trimmed.match(/^([^=]+)=(.*)$/);
    if (match) {
      const key = match[1].trim();
      let value = match[2].trim();
      // Remove quotes if present
      if ((value.startsWith('"') && value.endsWith('"')) || (value.startsWith("'") && value.endsWith("'"))) {
        value = value.slice(1, -1);
      }
      result[key] = value;
    }
  }
  return result;
}

export default tool({
  description:
    'Loads the .env.ai file and returns its variables. An optional key argument filters and returns only a specific value.',
  args: {
    key: tool.schema.string().optional().describe('Optional key to return a specific environment variable.'),
  },
  async execute(args, context) {
    const cwd = context.directory;
    const filepath = join(cwd, '.env.ai');

    if (!existsSync(filepath)) {
      return 'Error: .env.ai does not exist in the current folder.';
    }

    const content = readFileSync(filepath, 'utf-8');
    const parsed = parseEnv(content);

    if (args.key) {
      const val = parsed[args.key];
      if (val !== undefined) {
        return val;
      } else {
        return `Variable ${args.key} not found in .env.ai`;
      }
    }

    return Object.entries(parsed)
      .map(([k, v]) => `${k}=${v}`)
      .join('\n');
  },
});
