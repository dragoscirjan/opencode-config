import { spawn } from 'child_process';
import { rmSync, existsSync, mkdirSync, writeFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

export const TEST_WORKSPACE = join(__dirname, 'workspace');
const LOGS_DIR = join(__dirname, 'logs');

export function cleanEnvironment() {
  if (existsSync(TEST_WORKSPACE)) {
    rmSync(TEST_WORKSPACE, { recursive: true, force: true });
  }
  mkdirSync(TEST_WORKSPACE, { recursive: true });
}

export async function runAgent(agent: string, prompt: string, testName?: string, options: { env?: Record<string, string> } = {}): Promise<any> {
  return new Promise((resolve, reject) => {
    const isDebug = process.env.DEBUG_AGENT === '1';

    if (!existsSync(LOGS_DIR)) {
      mkdirSync(LOGS_DIR, { recursive: true });
    }

    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const safeName = testName ? testName.replace(/[^a-z0-9]/gi, '_').toLowerCase() : 'run';
    const logPrefix = join(LOGS_DIR, `${agent}-${safeName}-${timestamp}`);

    const stdoutFile = `${logPrefix}-stdout.log`;
    const stderrFile = `${logPrefix}-stderr.log`;

    let stdoutData = '';
    let stderrData = '';

    const child = spawn('npx', ['-y', 'opencode-ai', 'run', '--agent', agent, '--', prompt], {
      cwd: TEST_WORKSPACE,
      env: { ...process.env, ISSUE_TRACKING_FS: '1', ...options.env }
    });

    child.stdin.end();

    let spinnerIdx = 0;
    const spinnerChars = ['⠋', '⠙', '⠹', '⠸', '⠼', '⠴', '⠦', '⠧', '⠇', '⠏'];
    let spinnerTimer: ReturnType<typeof setInterval>;

    if (!isDebug) {
      spinnerTimer = setInterval(() => {
        process.stdout.write(`\r\x1b[36m${spinnerChars[spinnerIdx]} Running ${agent} (${safeName})...\x1b[0m `);
        spinnerIdx = (spinnerIdx + 1) % spinnerChars.length;
      }, 50);
    } else {
      console.log(`\n[DEBUG] Starting agent: ${agent} (${safeName})\n`);
    }

    child.stdout.on('data', (data) => {
      stdoutData += data.toString();
      if (isDebug) process.stdout.write(data);
    });

    child.stderr.on('data', (data) => {
      stderrData += data.toString();
      if (isDebug) process.stderr.write(data);
    });

    child.on('close', (code) => {
      if (spinnerTimer) clearInterval(spinnerTimer);
      
      if (!isDebug) {
        process.stdout.write(`\r\x1b[32m✓ ${agent} (${safeName}) finished.\x1b[0m          \n`);
      } else {
        console.log(`\n[DEBUG] ${agent} (${safeName}) finished with code ${code}\n`);
      }

      writeFileSync(stdoutFile, stdoutData, 'utf-8');
      writeFileSync(stderrFile, stderrData, 'utf-8');

      if (isDebug) {
        console.log(`[${agent}] Execution logs saved to:`);
        console.log(`  - ${stdoutFile}`);
        console.log(`  - ${stderrFile}`);
      }

      resolve({
        stdout: stdoutData,
        stderr: stderrData,
        status: code,
        logPaths: { stdout: stdoutFile, stderr: stderrFile }
      });
    });

    child.on('error', (error) => {
      if (spinnerTimer) clearInterval(spinnerTimer);
      reject(error);
    });
  });
}
