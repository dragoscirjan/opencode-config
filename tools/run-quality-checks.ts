import { tool } from '@opencode-ai/plugin';
import runTaskTool from './run-task.js'; // Reusing the logic

export default tool({
  description: 'Executes a predefined sequence of quality checks (lint:fix, format:fix, duplicate-check, audit, test, build, validate) using the local task runner.',
  args: {},
  async execute(args, context) {
    const targets = [
      'format:fix',
      'format',
      'lint:fix',
      'lint',
      'duplicate-check',
      'audit',
      'test',
      'build',
      'validate'
    ];

    const results: string[] = [];
    let failureFound = false;

    for (const target of targets) {
      if (failureFound) break;

      const result = await runTaskTool.execute({ target }, context);
      
      // If the target wasn't found/configured, we skip and log it softly
      if (result.includes('Could not determine task runner, or target') || result.includes('Unknown task')) {
        results.push(`Target '${target}' skipped (not configured).`);
        continue;
      }

      results.push(`--- Output for target: ${target} ---`);
      results.push(result);

      if (result.includes('EXIT CODE:') || result.includes('Failed using')) {
        failureFound = true;
        results.push(`\n❌ Quality check failed on target: ${target}. Stopping execution.`);
      } else {
        results.push(`\n✅ Target ${target} completed successfully.`);
      }
    }

    return results.join('\n');
  }
});
