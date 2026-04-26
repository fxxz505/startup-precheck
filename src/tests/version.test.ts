import test from 'node:test';
import assert from 'node:assert/strict';
import { compareVersions, extractMinimumVersion, normalizeVersion } from '../utils/version.js';

test('normalizeVersion extracts semver-like string', () => {
  assert.equal(normalizeVersion('v20.11.1'), '20.11.1');
  assert.equal(normalizeVersion('Python 3.12.2'), '3.12.2');
});

test('compareVersions compares semantic versions', () => {
  assert.equal(compareVersions('20.0.0', '18.17.0'), 1);
  assert.equal(compareVersions('18.17.0', '18.17.0'), 0);
  assert.equal(compareVersions('16.20.0', '18.17.0'), -1);
});

test('extractMinimumVersion reads minimal version from range', () => {
  assert.equal(extractMinimumVersion('>=18'), '18');
  assert.equal(extractMinimumVersion('^20.10.0'), '20.10.0');
});
