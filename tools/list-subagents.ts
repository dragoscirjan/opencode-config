import { existsSync, readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { homedir } from 'node:os';
import { tool } from '@opencode-ai/plugin';

export default tool({
  description: 'Lists all available subagents that can be called via the task tool. Use this to discover which specialized agents are available for delegation.',
  args: {},
  async execute(args, context) {
    const globalAgentsDir = join(homedir(), '.config', 'opencode', 'agents');
    const localAgentsDir = join(context.directory, '.opencode', 'agents');
    
    const dirs = [globalAgentsDir, localAgentsDir];
    const subagents: string[] = [];

    for (const dir of dirs) {
      if (!existsSync(dir)) continue;

      const files = readdirSync(dir).filter(f => f.endsWith('.md'));
      for (const file of files) {
        const content = readFileSync(join(dir, file), 'utf-8');
        
        // Check if it's a subagent
        const isSubagent = /^mode:\s*"?subagent"?/m.test(content);
        if (!isSubagent) continue;

        // Extract description
        const descMatch = content.match(/^description:\s*"?([^"\n]+)"?/m);
        const description = descMatch ? descMatch[1] : 'No description provided';
        
        const name = file.replace('.md', '');
        subagents.push(`- **${name}**: ${description}`);
      }
    }

    if (subagents.length === 0) {
      return 'No subagents found in global or local agent directories.';
    }

    // Deduplicate by name
    const uniqueSubagents = Array.from(new Set(subagents));
    
    return `Available subagents:\n\n${uniqueSubagents.join('\n')}`;
  },
});
