import { spawn } from 'node:child_process';
import type { ChildProcessWithoutNullStreams } from 'node:child_process';

export interface CommandResult {
  success: boolean;
  stdout: string;
  stderr: string;
  code: number | null;
}

 function isWindowsPackageManager(command: string): boolean {
   return process.platform === 'win32' && ['npm', 'pnpm', 'yarn'].includes(command);
 }

export async function runCommand(command: string, args: string[], cwd?: string): Promise<CommandResult> {
  return new Promise((resolve) => {
    let child: ChildProcessWithoutNullStreams;

    try {
      child = isWindowsPackageManager(command)
        ? spawn('cmd.exe', ['/d', '/s', '/c', command, ...args], {
            cwd,
            shell: false
          })
        : spawn(command, args, {
            cwd,
            shell: false
          });
    } catch {
      resolve({ success: false, stdout: '', stderr: '', code: null });
      return;
    }

    let stdout = '';
    let stderr = '';

    child.stdout.on('data', (chunk) => {
      stdout += chunk.toString();
    });

    child.stderr.on('data', (chunk) => {
      stderr += chunk.toString();
    });

    child.on('error', () => {
      resolve({ success: false, stdout, stderr, code: null });
    });

    child.on('close', (code) => {
      resolve({
        success: code === 0,
        stdout: stdout.trim(),
        stderr: stderr.trim(),
        code
      });
    });
  });
}
