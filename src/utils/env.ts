export function parseEnvKeys(content: string | undefined): string[] {
  if (!content) {
    return [];
  }

  return content
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter((line) => line && !line.startsWith('#'))
    .map((line) => line.replace(/^export\s+/, ''))
    .map((line) => {
      const equalIndex = line.indexOf('=');
      return equalIndex >= 0 ? line.slice(0, equalIndex).trim() : line.trim();
    })
    .filter(Boolean);
}

export function diffEnvKeys(exampleKeys: string[], actualKeys: string[]): string[] {
  const actual = new Set(actualKeys);
  return exampleKeys.filter((key) => !actual.has(key));
}
