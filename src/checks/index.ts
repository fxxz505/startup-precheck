import { readTextIfExists, resolveFrom } from '../utils/fs.js';
import { detectRuntimes } from '../detectors/runtime.js';
import { isPortInUse } from '../detectors/ports.js';
import { diffEnvKeys, parseEnvKeys } from '../utils/env.js';
import { compareVersions, extractMinimumVersion } from '../utils/version.js';
import type { CheckResult, ProjectMetadata, RuntimeInfo } from '../types/index.js';

function runtimeMap(runtimes: RuntimeInfo[]): Map<string, RuntimeInfo> {
  return new Map(runtimes.map((runtime) => [runtime.command, runtime]));
}

function buildProjectChecks(metadata: ProjectMetadata): CheckResult[] {
  const checks: CheckResult[] = [];

  checks.push({
    id: 'project_type',
    title: '项目类型识别',
    category: 'project',
    status: metadata.projectType === 'generic' ? 'warn' : 'pass',
    message:
      metadata.projectType === 'generic'
        ? '未识别为 Node、Python 或 Java 项目，将按通用项目处理'
        : `识别为 ${metadata.projectType} 项目`,
    suggestion: metadata.projectType === 'generic' ? '请确认项目关键文件是否位于根目录' : undefined,
    details: {
      framework: metadata.framework,
      packageManager: metadata.packageManager
    }
  });

  const requiredFileEntries: Array<[keyof ProjectMetadata['files'], string]> = [
    ['readme', 'README.md'],
    ['envExample', '.env.example']
  ];

  if (metadata.projectType === 'node') requiredFileEntries.push(['packageJson', 'package.json']);
  if (metadata.projectType === 'python') requiredFileEntries.push(['requirementsTxt', 'requirements.txt']);
  if (metadata.projectType === 'java') requiredFileEntries.push(['pomXml', 'pom.xml']);

  for (const [key, label] of requiredFileEntries) {
    checks.push({
      id: `file_${key}`,
      title: `关键文件检查: ${label}`,
      category: 'project',
      status: metadata.files[key] ? 'pass' : 'warn',
      message: metadata.files[key] ? `${label} 已存在` : `${label} 缺失`,
      suggestion: metadata.files[key] ? undefined : `建议补充 ${label}`
    });
  }

  return checks;
}

function buildRuntimeChecks(metadata: ProjectMetadata, runtimes: RuntimeInfo[]): CheckResult[] {
  const checks: CheckResult[] = [];
  const map = runtimeMap(runtimes);
  const requiredRuntimes = new Set<string>(['git']);

  if (metadata.projectType === 'node') {
    requiredRuntimes.add('node');
    requiredRuntimes.add(metadata.packageManager);
  }

  if (metadata.projectType === 'python') {
    requiredRuntimes.add('python');
    requiredRuntimes.add('pip');
  }

  if (metadata.projectType === 'java') {
    requiredRuntimes.add('java');
  }

  if (metadata.serviceHints.includes('docker')) {
    requiredRuntimes.add('docker');
  }

  for (const runtimeName of requiredRuntimes) {
    const runtime = map.get(runtimeName);
    const installed = runtime?.installed ?? false;
    checks.push({
      id: `runtime_${runtimeName}`,
      title: `运行时检查: ${runtimeName}`,
      category: 'runtime',
      status: installed ? 'pass' : 'fail',
      message: installed ? `${runtimeName} 已安装${runtime?.version ? `，版本 ${runtime.version}` : ''}` : `${runtimeName} 未安装或不可用`,
      suggestion: installed ? undefined : `请先安装 ${runtimeName}`
    });
  }

  const nodeRuntime = map.get('node');
  const expectedNode = extractMinimumVersion(metadata.packageJsonEngines?.node);
  if (expectedNode) {
    if (!nodeRuntime?.installed || !nodeRuntime.version) {
      checks.push({
        id: 'runtime_node_engine',
        title: 'Node 版本约束检查',
        category: 'runtime',
        status: 'fail',
        message: `项目要求 Node ${metadata.packageJsonEngines?.node}，但本机无法获取 Node 版本`,
        suggestion: '请安装符合要求的 Node 版本'
      });
    } else {
      const result = compareVersions(nodeRuntime.version, expectedNode);
      checks.push({
        id: 'runtime_node_engine',
        title: 'Node 版本约束检查',
        category: 'runtime',
        status: result >= 0 ? 'pass' : 'fail',
        message:
          result >= 0
            ? `当前 Node ${nodeRuntime.version} 满足要求 ${metadata.packageJsonEngines?.node}`
            : `当前 Node ${nodeRuntime.version} 低于要求 ${metadata.packageJsonEngines?.node}`,
        suggestion: result >= 0 ? undefined : `请升级 Node 到 ${expectedNode} 或更高版本`
      });
    }
  }

  return checks;
}

async function buildConfigChecks(metadata: ProjectMetadata): Promise<CheckResult[]> {
  const checks: CheckResult[] = [];
  const envPath = resolveFrom(metadata.projectPath, '.env');
  const envExamplePath = resolveFrom(metadata.projectPath, '.env.example');
  const [envContent, envExampleContent] = await Promise.all([readTextIfExists(envPath), readTextIfExists(envExamplePath)]);

  if (metadata.files.envExample && !metadata.files.env) {
    checks.push({
      id: 'config_env_missing',
      title: '.env 文件检查',
      category: 'config',
      status: 'fail',
      message: '检测到 .env.example，但 .env 缺失',
      suggestion: '请根据 .env.example 创建 .env 文件'
    });
  } else if (metadata.files.env) {
    checks.push({
      id: 'config_env_exists',
      title: '.env 文件检查',
      category: 'config',
      status: 'pass',
      message: '.env 文件已存在'
    });
  } else {
    checks.push({
      id: 'config_env_skip',
      title: '.env 文件检查',
      category: 'config',
      status: 'skip',
      message: '未检测到 .env 或 .env.example'
    });
  }

  if (envExampleContent && envContent) {
    const missingKeys = diffEnvKeys(parseEnvKeys(envExampleContent), parseEnvKeys(envContent));
    checks.push({
      id: 'config_env_keys',
      title: '.env 字段完整性检查',
      category: 'config',
      status: missingKeys.length === 0 ? 'pass' : 'fail',
      message: missingKeys.length === 0 ? '.env 已包含 .env.example 中的所有字段' : `缺少 ${missingKeys.length} 个环境变量字段`,
      suggestion: missingKeys.length === 0 ? undefined : `请补充字段: ${missingKeys.join(', ')}`,
      details: { missingKeys }
    });
  }

  return checks;
}

async function buildPortChecks(ports: number[]): Promise<CheckResult[]> {
  if (ports.length === 0) {
    return [
      {
        id: 'port_skip',
        title: '端口占用检查',
        category: 'port',
        status: 'skip',
        message: '未提供端口，也未从项目中识别到常见端口'
      }
    ];
  }

  const checks = await Promise.all(
    ports.map(async (port) => {
      const inUse = await isPortInUse(port);
      return {
        id: `port_${port}`,
        title: `端口检查: ${port}`,
        category: 'port',
        status: inUse ? 'warn' : 'pass',
        message: inUse ? `端口 ${port} 已被占用` : `端口 ${port} 可用`,
        suggestion: inUse ? `请释放端口 ${port} 或修改项目配置` : undefined
      } satisfies CheckResult;
    })
  );

  return checks;
}

function buildServiceChecks(metadata: ProjectMetadata, runtimes: RuntimeInfo[]): CheckResult[] {
  if (metadata.serviceHints.length === 0) {
    return [
      {
        id: 'service_skip',
        title: '依赖服务检查',
        category: 'service',
        status: 'skip',
        message: '未从项目配置中检测到 Redis、MySQL、PostgreSQL 或 Docker 线索'
      }
    ];
  }

  const map = runtimeMap(runtimes);
  return metadata.serviceHints.map((hint) => {
    if (hint === 'docker') {
      const docker = map.get('docker');
      return {
        id: 'service_docker',
        title: 'Docker 可用性检查',
        category: 'service',
        status: docker?.installed ? 'pass' : 'warn',
        message: docker?.installed ? `检测到 Docker，版本 ${docker.version ?? 'unknown'}` : '项目疑似依赖 Docker，但本机未检测到 docker 命令',
        suggestion: docker?.installed ? undefined : '如果项目依赖容器，请先安装并启动 Docker'
      } satisfies CheckResult;
    }

    return {
      id: `service_${hint}`,
      title: `服务线索检查: ${hint}`,
      category: 'service',
      status: 'warn',
      message: `检测到 ${hint} 相关配置线索，请确认对应服务已启动并配置正确`,
      suggestion: `请检查 ${hint} 的连接地址、凭据和服务状态`
    } satisfies CheckResult;
  });
}

export async function runChecks(metadata: ProjectMetadata, explicitPorts?: number[]): Promise<{ checks: CheckResult[]; runtimes: RuntimeInfo[] }> {
  const runtimes = await detectRuntimes();
  const derivedPorts = explicitPorts?.length ? explicitPorts : metadata.detectedPorts;
  const checks = [
    ...buildProjectChecks(metadata),
    ...buildRuntimeChecks(metadata, runtimes),
    ...(await buildConfigChecks(metadata)),
    ...(await buildPortChecks(derivedPorts)),
    ...buildServiceChecks(metadata, runtimes)
  ];

  return { checks, runtimes };
}
