const codes = {
  reset: '\u001b[0m',
  red: '\u001b[31m',
  yellow: '\u001b[33m',
  green: '\u001b[32m',
  cyan: '\u001b[36m',
  bold: '\u001b[1m',
  dim: '\u001b[2m'
};

export function colorize(text: string, color: keyof typeof codes): string {
  if (!process.stdout.isTTY) {
    return text;
  }

  return `${codes[color]}${text}${codes.reset}`;
}

export function bold(text: string): string {
  return colorize(text, 'bold');
}
