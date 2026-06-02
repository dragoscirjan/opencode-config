import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { exec } from 'node:child_process';
import { promisify } from 'node:util';
import { tool } from '@opencode-ai/plugin';

const execAsync = promisify(exec);

export default tool({
  description: 'Executes a task target using the locally configured task runner (mise, task, just, make, npm, pnpm, yarn, bun).',
  args: {
    target: tool.schema.string().describe('The task target to run (e.g., "lint", "build", "test")'),
  },
  async execute({ target }, context) {
    const cwd = context.directory;
    let command = '';
    let runner = '';

    // Priority list of task managers
    const taskManagers = [
      {
        name: 'task',
        files: ['Taskfile.yml', 'Taskfile.yaml', 'Taskfile.dist.yml'],
        getCommand: (t: string) => `task ${t}`
      },
      {
        name: 'mise',
        files: ['mise.toml'],
        getCommand: (t: string) => `mise run ${t}`
      },
      {
        name: 'just',
        files: ['Justfile', 'justfile'],
        getCommand: (t: string) => `just ${t}`
      },
      {
        name: 'make',
        files: ['Makefile', 'makefile'],
        getCommand: (t: string) => `make ${t}`
      },
      {
        name: 'npm/yarn/pnpm/bun',
        files: ['package.json'],
        getCommand: (t: string) => {
          const pkg = JSON.parse(readFileSync(join(cwd, 'package.json'), 'utf-8'));
          if (!pkg.scripts || !pkg.scripts[t]) return null;
          
          if (existsSync(join(cwd, 'bun.lockb'))) { runner = 'bun'; return `bun run ${t}`; }
          if (existsSync(join(cwd, 'pnpm-lock.yaml'))) { runner = 'pnpm'; return `pnpm run ${t}`; }
          if (existsSync(join(cwd, 'yarn.lock'))) { runner = 'yarn'; return `yarn run ${t}`; }
          runner = 'npm'; return `npm run ${t}`;
        }
      }
    ];

    for (const manager of taskManagers) {
      const hasFile = manager.files.some(file => existsSync(join(cwd, file)));
      if (hasFile) {
        runner = runner || manager.name; // Keep runner from getCommand if set (e.g. for pnpm), otherwise use manager.name
        const cmd = manager.getCommand(target);
        if (cmd) {
          command = cmd;
          break;
        }
      }
    }

    if (!command) {
      return `Error: Could not determine task runner, or target '${target}' is not defined in package.json scripts. Ensure you have a mise.toml, Taskfile.yml, Justfile, Makefile, or package.json configured.`;
    }

    try {
      const { stdout, stderr } = await execAsync(command, { cwd, timeout: 120000 });
      return `Executed using ${runner}:\n$ ${command}\n\nSTDOUT:\n${stdout}\n\nSTDERR:\n${stderr}`;
    } catch (error: any) {
      return `Failed using ${runner}:\n$ ${command}\n\nEXIT CODE: ${error.code}\n\nSTDOUT:\n${error.stdout}\n\nSTDERR:\n${error.stderr}\n\nMESSAGE:\n${error.message}`;
    }
  }
});
