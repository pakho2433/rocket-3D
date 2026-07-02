import { mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';
import { spawnSync } from 'node:child_process';
import { gunzipSync } from 'node:zlib';
import { applyPhysicsPatches } from '../src/source-patches.js';

const root = resolve(import.meta.dirname, '..');
const chunks = [
  'runtime.part0.b64',
  'runtime.part1.b64',
  'runtime.part2.b64',
  'runtime.part3a.b64',
  'runtime.part3b.b64',
  'runtime.part3c.b64',
  'runtime.part3d.b64',
];

const encoded = chunks
  .map((name) => readFileSync(join(root, 'src', name), 'utf8').trim())
  .join('');
const source = gunzipSync(Buffer.from(encoded, 'base64')).toString('utf8');
const patched = applyPhysicsPatches(source);

for (const marker of [
  "import * as THREE from 'three'",
  'simulationScale = state.parachuteDeployed ? 40 : 2.4',
  'const simulationDt = dt * 3.5',
]) {
  if (!patched.includes(marker)) throw new Error(`Runtime validation marker missing: ${marker}`);
}

const directory = mkdtempSync(join(tmpdir(), 'rocket-lab-'));
const runtimePath = join(directory, 'runtime.mjs');
try {
  writeFileSync(runtimePath, patched);
  const result = spawnSync(process.execPath, ['--check', runtimePath], { stdio: 'inherit' });
  if (result.status !== 0) process.exit(result.status || 1);
} finally {
  rmSync(directory, { recursive: true, force: true });
}

console.log(`Validated ${patched.length.toLocaleString()} bytes of Rocket Lab 3D runtime.`);
