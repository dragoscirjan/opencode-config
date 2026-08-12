// import { existsSync, readdirSync, readFileSync } from 'node:fs';
// import { join } from 'node:path';
// import { tool } from '@opencode-ai/plugin';
//
// export default tool({
//   description: 'Read the full content of a specific issue from the local .issues/ directory.',
//   args: {
//     id: tool.schema.string().describe('The 5-digit issue ID (e.g., 00001)'),
//   },
//   async execute(args, context) {
//     const issuesDir = join(context.directory, '.issues');
//     if (!existsSync(issuesDir)) {
//       return 'Error: No .issues/ directory found.';
//     }
//
//     const files = readdirSync(issuesDir).filter(f => f.endsWith('.md') && f.startsWith(`${args.id}-`));
//
//     if (files.length === 0) {
//       return `Error: Issue with ID ${args.id} not found.`;
//     }
//
//     if (files.length > 1) {
//       return `Error: Multiple issues found starting with ID ${args.id}.`;
//     }
//
//     const filePath = join(issuesDir, files[0]);
//     const content = readFileSync(filePath, 'utf-8');
//
//     return content;
//   },
// });
