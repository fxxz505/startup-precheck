import { bold, colorize } from '../utils/colors.js';
import type { CheckResult, ScanReport } from '../types/index.js';

function statusLabel(status: CheckResult['status']): string {
  switch (status) {
    case 'pass':
      return colorize('PASS', 'green');
    case 'warn':
      return colorize('WARN', 'yellow');
    case 'fail':
      return colorize('FAIL', 'red');
    case 'skip':
      return colorize('SKIP', 'cyan');
    default:
      return status;
  }
}

export function renderTerminalReport(report: ScanReport): string {
  const lines: string[] = [];
  const { metadata, summary, checks } = report;

  lines.push(bold('startup-precheck'));
  lines.push(`项目: ${metadata.projectName}`);
  lines.push(`路径: ${metadata.projectPath}`);
  lines.push(`类型: ${metadata.projectType}`);
  lines.push(`框架: ${metadata.framework}`);
  lines.push(`包管理器: ${metadata.packageManager}`);
  lines.push('');
  lines.push(bold('检查结果'));

  for (const check of checks) {
    lines.push(`- [${statusLabel(check.status)}] ${check.title}: ${check.message}`);
    if (check.suggestion) {
      lines.push(`  建议: ${check.suggestion}`);
    }
  }

  lines.push('');
  lines.push(bold('汇总'));
  lines.push(`PASS: ${summary.pass}`);
  lines.push(`WARN: ${summary.warn}`);
  lines.push(`FAIL: ${summary.fail}`);
  lines.push(`SKIP: ${summary.skip}`);

  return lines.join('\n');
}
