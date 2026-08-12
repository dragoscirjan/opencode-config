// import { existsSync, readdirSync, readFileSync } from 'node:fs';
// import { join } from 'node:path';
// import { tool } from '@opencode-ai/plugin';
//
// export default tool({
//   description: 'List issues from the local .issues/ directory. Returns a summary of issues. Can optionally filter by status or type.',
//   args: {
//     status: tool.schema.string().optional().describe('Filter by status (e.g. open, in_progress, done, closed)'),
//     type: tool.schema.string().optional().describe('Filter by type (e.g. epic, story, task, bug)'),
//   },
//   async execute(args, context) {
//     const issuesDir = join(context.directory, '.issues');
//     if (!existsSync(issuesDir)) {
//       return 'No .issues/ directory found.';
//     }
//
//     const files = readdirSync(issuesDir).filter(f => f.endsWith('.md'));
//     if (files.length === 0) {
//       return 'No issues found.';
//     }
//
//     const issues = [];
//     for (const file of files) {
//       const content = readFileSync(join(issuesDir, file), 'utf-8');
//
//       // Parse basic frontmatter using regex
//       const idMatch = content.match(/^id:\s*"?(\d+)"?/m);
//       const statusMatch = content.match(/^status:\s*"?([a-zA-Z_]+)"?/m);
//       const typeMatch = content.match(/^type:\s*"?([a-zA-Z_]+)"?/m);
//
//       const id = idMatch ? idMatch[1] : 'unknown';
//       const status = statusMatch ? statusMatch[1] : 'unknown';
//       const type = typeMatch ? typeMatch[1] : 'unknown';
//
//       if (args.status && args.status !== status) continue;
//       if (args.type && args.type !== type) continue;
//
//       issues.push(`ID: ${id} | Type: ${type} | Status: ${status} | File: ${file}`);
//     }
//
//     if (issues.length === 0) {
//       return 'No issues match the filters.';
//     }
//
//     return issues.join('\n');
//   },
// });
