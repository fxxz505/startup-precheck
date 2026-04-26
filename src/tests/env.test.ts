import test from 'node:test';
import assert from 'node:assert/strict';
import { diffEnvKeys, parseEnvKeys } from '../utils/env.js';

test('parseEnvKeys parses valid env keys', () => {
  const keys = parseEnvKeys('PORT=3000\n# comment\nexport API_KEY=test\n EMPTY = value');
  assert.deepEqual(keys, ['PORT', 'API_KEY', 'EMPTY']);
});

test('diffEnvKeys returns missing keys', () => {
  const missing = diffEnvKeys(['PORT', 'API_KEY', 'DB_URL'], ['PORT', 'DB_URL']);
  assert.deepEqual(missing, ['API_KEY']);
});
