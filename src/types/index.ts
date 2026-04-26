export type CheckStatus = 'pass' | 'warn' | 'fail' | 'skip';

export type ProjectType = 'node' | 'python' | 'java' | 'generic';

export type FrameworkType =
  | 'nextjs'
  | 'react'
  | 'vue'
  | 'nestjs'
  | 'fastapi'
  | 'django'
  | 'spring-boot'
  | 'unknown';

export interface CheckResult {
  id: string;
  title: string;
  category: 'project' | 'runtime' | 'config' | 'port' | 'service';
  status: CheckStatus;
  message: string;
  suggestion?: string;
  details?: Record<string, unknown>;
}

export interface FilePresenceMap {
  packageJson: boolean;
  requirementsTxt: boolean;
  pyprojectToml: boolean;
  pomXml: boolean;
  buildGradle: boolean;
  dockerCompose: boolean;
  env: boolean;
  envExample: boolean;
  readme: boolean;
}

export interface ProjectMetadata {
  projectPath: string;
  projectName: string;
  projectType: ProjectType;
  framework: FrameworkType;
  packageManager: 'npm' | 'pnpm' | 'yarn' | 'pip' | 'unknown';
  detectedPorts: number[];
  files: FilePresenceMap;
  serviceHints: Array<'docker' | 'redis' | 'mysql' | 'postgresql'>;
  packageJsonEngines?: {
    node?: string;
    npm?: string;
    pnpm?: string;
    yarn?: string;
  };
  packageJsonScripts?: Record<string, string>;
}

export interface RuntimeInfo {
  command: string;
  installed: boolean;
  version?: string;
  rawOutput?: string;
}

export interface ScanOptions {
  targetPath: string;
  ports?: number[];
  json?: boolean;
  outputPath?: string;
}

export interface ScanReport {
  generatedAt: string;
  metadata: ProjectMetadata;
  runtimes: RuntimeInfo[];
  checks: CheckResult[];
  summary: {
    pass: number;
    warn: number;
    fail: number;
    skip: number;
  };
}
