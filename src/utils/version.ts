export function normalizeVersion(raw: string | undefined): string | undefined {
  if (!raw) {
    return undefined;
  }

  const match = raw.match(/\d+(?:\.\d+){0,2}/);
  return match?.[0];
}

export function compareVersions(actual: string, expected: string): number {
  const a = actual.split('.').map((part) => Number(part));
  const b = expected.split('.').map((part) => Number(part));
  const length = Math.max(a.length, b.length);

  for (let index = 0; index < length; index += 1) {
    const left = a[index] ?? 0;
    const right = b[index] ?? 0;
    if (left > right) {
      return 1;
    }
    if (left < right) {
      return -1;
    }
  }

  return 0;
}

export function extractMinimumVersion(range: string | undefined): string | undefined {
  if (!range) {
    return undefined;
  }

  const match = range.match(/\d+(?:\.\d+){0,2}/);
  return match?.[0];
}
