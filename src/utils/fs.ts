import { access, readFile, stat } from 'node:fs/promises';
import path from 'node:path';
import { constants } from 'node:fs';

export async function pathExists(targetPath: string): Promise<boolean> {
  try {
    await access(targetPath, constants.F_OK);
    return true;
  } catch {
    return false;
  }
}

export async function isDirectory(targetPath: string): Promise<boolean> {
  try {
    const info = await stat(targetPath);
    return info.isDirectory();
  } catch {
    return false;
  }
}

export async function readTextIfExists(targetPath: string): Promise<string | undefined> {
  if (!(await pathExists(targetPath))) {
    return undefined;
  }

  return readFile(targetPath, 'utf8');
}

export function resolveFrom(basePath: string, ...segments: string[]): string {
  return path.resolve(basePath, ...segments);
}
