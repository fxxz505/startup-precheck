import { runCommand } from '../utils/command.js';
import { normalizeVersion } from '../utils/version.js';
import type { RuntimeInfo } from '../types/index.js';

const runtimeCommands: Array<{ key: string; command: string; args: string[] }> = [
  { key: 'node', command: 'node', args: ['--version'] },
  { key: 'npm', command: 'npm', args: ['--version'] },
  { key: 'pnpm', command: 'pnpm', args: ['--version'] },
  { key: 'yarn', command: 'yarn', args: ['--version'] },
  { key: 'python', command: 'python', args: ['--version'] },
  { key: 'pip', command: 'pip', args: ['--version'] },
  { key: 'java', command: 'java', args: ['-version'] },
  { key: 'git', command: 'git', args: ['--version'] },
  { key: 'docker', command: 'docker', args: ['--version'] }
];

export async function detectRuntimes(): Promise<RuntimeInfo[]> {
  const results = await Promise.all(
    runtimeCommands.map(async ({ key, command, args }) => {
      const outcome = await runCommand(command, args);
      const rawOutput = outcome.stdout || outcome.stderr;
      return {
        command: key,
        installed: outcome.success,
        version: normalizeVersion(rawOutput),
        rawOutput
      } satisfies RuntimeInfo;
    })
  );

  return results;
}
