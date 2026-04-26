import path from 'node:path';
import { readTextIfExists, resolveFrom } from '../utils/fs.js';
import type { FilePresenceMap, FrameworkType, ProjectMetadata, ProjectType } from '../types/index.js';

interface PackageJsonShape {
  name?: string;
  scripts?: Record<string, string>;
  dependencies?: Record<string, string>;
  devDependencies?: Record<string, string>;
  engines?: {
    node?: string;
    npm?: string;
    pnpm?: string;
    yarn?: string;
  };
}

function detectFramework(packageJson: PackageJsonShape | undefined, files: FilePresenceMap, pythonFiles: string | undefined, javaFiles: string | undefined): FrameworkType {
  const deps = {
    ...(packageJson?.dependencies ?? {}),
    ...(packageJson?.devDependencies ?? {})
  };

  if (deps.next) return 'nextjs';
  if (deps['react'] || deps['react-dom']) return 'react';
  if (deps.vue) return 'vue';
  if (deps['@nestjs/core']) return 'nestjs';

  const lowerPython = (pythonFiles ?? '').toLowerCase();
  if (lowerPython.includes('fastapi')) return 'fastapi';
  if (lowerPython.includes('django')) return 'django';

  const lowerJava = (javaFiles ?? '').toLowerCase();
  if (lowerJava.includes('spring-boot')) return 'spring-boot';

  if (files.packageJson || files.requirementsTxt || files.pyprojectToml || files.pomXml || files.buildGradle) {
    return 'unknown';
  }

  return 'unknown';
}

function detectProjectType(files: FilePresenceMap): ProjectType {
  if (files.packageJson) return 'node';
  if (files.requirementsTxt || files.pyprojectToml) return 'python';
  if (files.pomXml || files.buildGradle) return 'java';
  return 'generic';
}

function detectPackageManager(files: FilePresenceMap, packageJson?: PackageJsonShape): ProjectMetadata['packageManager'] {
  if (!files.packageJson) {
    return files.requirementsTxt || files.pyprojectToml ? 'pip' : 'unknown';
  }

  const scriptsText = JSON.stringify(packageJson?.scripts ?? {});
  if (scriptsText.includes('pnpm')) return 'pnpm';
  if (scriptsText.includes('yarn')) return 'yarn';
  return 'npm';
}

function extractPortsFromText(content: string | undefined): number[] {
  if (!content) {
    return [];
  }

  const matches = content.match(/(?:PORT|port)\s*[:=]\s*["']?(\d{2,5})["']?/g) ?? [];
  const portNumbers = matches
    .map((match) => match.match(/(\d{2,5})/)?.[0])
    .filter((value): value is string => Boolean(value))
    .map((value) => Number(value))
    .filter((value) => value >= 1 && value <= 65535);

  return [...new Set(portNumbers)];
}

function detectServiceHints(texts: Array<string | undefined>): Array<'docker' | 'redis' | 'mysql' | 'postgresql'> {
  const joined = texts.filter(Boolean).join('\n').toLowerCase();
  const hints: Array<'docker' | 'redis' | 'mysql' | 'postgresql'> = [];

  if (joined.includes('docker')) hints.push('docker');
  if (joined.includes('redis')) hints.push('redis');
  if (joined.includes('mysql')) hints.push('mysql');
  if (joined.includes('postgres') || joined.includes('postgresql')) hints.push('postgresql');

  return [...new Set(hints)];
}

export async function scanProject(targetPath: string): Promise<ProjectMetadata> {
  const packageJsonPath = resolveFrom(targetPath, 'package.json');
  const requirementsPath = resolveFrom(targetPath, 'requirements.txt');
  const pyprojectPath = resolveFrom(targetPath, 'pyproject.toml');
  const pomPath = resolveFrom(targetPath, 'pom.xml');
  const gradlePath = resolveFrom(targetPath, 'build.gradle');
  const dockerComposePath = resolveFrom(targetPath, 'docker-compose.yml');
  const envPath = resolveFrom(targetPath, '.env');
  const envExamplePath = resolveFrom(targetPath, '.env.example');
  const readmePath = resolveFrom(targetPath, 'README.md');

  const [packageJsonContent, requirementsContent, pyprojectContent, pomContent, gradleContent, dockerComposeContent] = await Promise.all([
    readTextIfExists(packageJsonPath),
    readTextIfExists(requirementsPath),
    readTextIfExists(pyprojectPath),
    readTextIfExists(pomPath),
    readTextIfExists(gradlePath),
    readTextIfExists(dockerComposePath)
  ]);

  const files: FilePresenceMap = {
    packageJson: Boolean(packageJsonContent),
    requirementsTxt: Boolean(requirementsContent),
    pyprojectToml: Boolean(pyprojectContent),
    pomXml: Boolean(pomContent),
    buildGradle: Boolean(gradleContent),
    dockerCompose: Boolean(dockerComposeContent),
    env: Boolean(await readTextIfExists(envPath)),
    envExample: Boolean(await readTextIfExists(envExamplePath)),
    readme: Boolean(await readTextIfExists(readmePath))
  };

  const packageJson = packageJsonContent ? (JSON.parse(packageJsonContent) as PackageJsonShape) : undefined;
  const projectType = detectProjectType(files);
  const framework = detectFramework(packageJson, files, [requirementsContent, pyprojectContent].filter(Boolean).join('\n'), [pomContent, gradleContent].filter(Boolean).join('\n'));
  const packageManager = detectPackageManager(files, packageJson);
  const detectedPorts = [
    ...extractPortsFromText(packageJsonContent),
    ...extractPortsFromText(dockerComposeContent),
    ...extractPortsFromText(await readTextIfExists(envExamplePath)),
    ...extractPortsFromText(await readTextIfExists(envPath))
  ].filter((value, index, array) => array.indexOf(value) === index);

  const serviceHints = detectServiceHints([
    packageJsonContent,
    requirementsContent,
    pyprojectContent,
    pomContent,
    gradleContent,
    dockerComposeContent,
    await readTextIfExists(envPath),
    await readTextIfExists(envExamplePath)
  ]);

  return {
    projectPath: targetPath,
    projectName: packageJson?.name ?? path.basename(targetPath),
    projectType,
    framework,
    packageManager,
    detectedPorts,
    files,
    serviceHints,
    packageJsonEngines: packageJson?.engines,
    packageJsonScripts: packageJson?.scripts
  };
}
