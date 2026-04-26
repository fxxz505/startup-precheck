import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtemp, mkdir, writeFile } from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { scanProject } from '../scanner/project.js';

test('scanProject detects node project metadata', async () => {
  const base = await mkdtemp(path.join(os.tmpdir(), 'precheck-'));
  await mkdir(base, { recursive: true });
  await writeFile(
    path.join(base, 'package.json'),
    JSON.stringify(
      {
        name: 'demo-app',
        dependencies: {
          next: '14.0.0'
        },
        scripts: {
          dev: 'next dev -p 3000'
        },
        engines: {
          node: '>=18'
        }
      },
      null,
      2
    )
  );
  await writeFile(path.join(base, '.env.example'), 'PORT=3000\nAPI_KEY=demo');
  await writeFile(path.join(base, 'README.md'), '# demo');

  const result = await scanProject(base);

  assert.equal(result.projectType, 'node');
  assert.equal(result.framework, 'nextjs');
  assert.equal(result.packageManager, 'npm');
  assert.ok(result.detectedPorts.includes(3000));
  assert.equal(result.files.packageJson, true);
  assert.equal(result.files.envExample, true);
});
