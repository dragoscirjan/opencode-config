import { existsSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { tool } from '@opencode-ai/plugin';

export default tool({
  description: 'Checks if .env.ai exists in the current folder. If it does not exist, creates it with default values.',
  args: {},
  async execute(args, context) {
    const cwd = context.directory;
    const filepath = join(cwd, '.env.ai');

    if (existsSync(filepath)) {
      return '.env.ai already exists. No changes made.';
    }

    const content = [
      'ISSUE_TRACKING=fs,issue-create,issue-list,issue-read',
      'CVS_TOOLS=git,gh,cvs_github',
      'TASK_MANAGER=taskfil',
      'DEVELOPER_SKILLS='
    ].join('\n');
    writeFileSync(filepath, content, 'utf-8');

    return 'Created .env.ai with default values.';
  },
});
