#!/usr/bin/env node
import { mkdir, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { scanProject } from '../scanner/project.js';
import { runChecks } from '../checks/index.js';
import { renderTerminalReport } from '../reporters/terminal.js';
import { renderJsonReport } from '../reporters/json.js';
import { isDirectory } from '../utils/fs.js';
import type { ScanOptions, ScanReport } from '../types/index.js';

function parsePorts(raw: string | undefined): number[] | undefined {
  if (!raw) {
    return undefined;
  }

  return raw
    .split(',')
    .map((item) => Number(item.trim()))
    .filter((value) => Number.isInteger(value) && value >= 1 && value <= 65535);
}

function printHelp(): void {
  console.log(`startup-precheck\n\nUsage:\n  precheck scan <path> [--ports 3000,5173] [--json] [--output report.json]\n  precheck doctor <path> [--ports 3000,5173] [--json] [--output report.json]`);
}

function buildSummary(report: ScanReport['checks']): ScanReport['summary'] {
  return report.reduce(
    (summary, item) => {
      summary[item.status] += 1;
      return summary;
    },
    { pass: 0, warn: 0, fail: 0, skip: 0 }
  );
}

async function executeScan(options: ScanOptions): Promise<number> {
  const absolutePath = path.resolve(options.targetPath);
  const exists = await isDirectory(absolutePath);
  if (!exists) {
    console.error(`目标路径不存在或不是目录: ${absolutePath}`);
    return 1;
  }

  const metadata = await scanProject(absolutePath);
  const { checks, runtimes } = await runChecks(metadata, options.ports);
  const report: ScanReport = {
    generatedAt: new Date().toISOString(),
    metadata,
    runtimes,
    checks,
    summary: buildSummary(checks)
  };

  if (options.outputPath) {
    const outputFile = path.resolve(options.outputPath);
    await mkdir(path.dirname(outputFile), { recursive: true });
    await writeFile(outputFile, renderJsonReport(report), 'utf8');
  }

  if (options.json) {
    console.log(renderJsonReport(report));
  } else {
    console.log(renderTerminalReport(report));
  }

  return report.summary.fail > 0 ? 1 : 0;
}

async function main(): Promise<void> {
  const [, , command, targetPath = '.', ...rest] = process.argv;

  if (!command || command === '--help' || command === '-h') {
    printHelp();
    process.exit(0);
  }

  if (!['scan', 'doctor'].includes(command)) {
    printHelp();
    process.exit(1);
  }

  const portsFlagIndex = rest.indexOf('--ports');
  const json = rest.includes('--json');
  const outputIndex = rest.indexOf('--output');

  const exitCode = await executeScan({
    targetPath,
    ports: portsFlagIndex >= 0 ? parsePorts(rest[portsFlagIndex + 1]) : undefined,
    json,
    outputPath: outputIndex >= 0 ? rest[outputIndex + 1] : undefined
  });

  process.exit(exitCode);
}

main().catch((error: unknown) => {
  const message = error instanceof Error ? error.message : String(error);
  console.error(`执行失败: ${message}`);
  process.exit(1);
});
