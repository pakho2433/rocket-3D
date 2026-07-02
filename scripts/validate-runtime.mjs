import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { spawnSync } from 'node:child_process';
import { gunzipSync } from 'node:zlib';

const root = resolve(import.meta.dirname, '..');
const chunks = [
  'builder.part0.b64',
  'builder.part1.b64',
  'builder.part2.b64',
  'builder.part3.b64',
  'builder.part4.b64',
];
const encoded = chunks
  .map((name) => readFileSync(resolve(root, 'src', name), 'utf8').trim())
  .join('');
const source = gunzipSync(Buffer.from(encoded, 'base64')).toString('utf8');

const temporaryPath = resolve(root, '.rocket-builder-runtime.mjs');
const syntax = spawnSync(process.execPath, ['--check', '--input-type=module'], {
  input: source,
  encoding: 'utf8',
  stdio: ['pipe', 'inherit', 'inherit'],
});
if (syntax.status !== 0) process.exit(syntax.status || 1);

const partsStart = source.indexOf('const PARTS = {');
const partsEnd = source.indexOf('const DESTINATIONS =', partsStart);
if (partsStart < 0 || partsEnd < 0) throw new Error('PARTS 配件資料結構不存在。');
const partsSource = source.slice(partsStart, partsEnd);

const categories = ['nose', 'capsule', 'tank', 'engine', 'booster', 'fin', 'utility'];
for (const category of categories) {
  const count = [...partsSource.matchAll(new RegExp(`id: '${category}-\\d+'`, 'g'))].length;
  if (count < 5) throw new Error(`${category} 只有 ${count} 款配件，最低要求為 5 款。`);
}

for (const marker of [
  "assembly[categoryId].push(partId)",
  "tank', name: '燃料箱'",
  'max: 8',
  'const drag = .5 * density',
  'const deltaV = averageIsp',
]) {
  if (!source.includes(marker)) throw new Error(`缺少必要功能：${marker}`);
}

console.log(`Rocket Builder 3D validated: ${source.length.toLocaleString()} bytes, 7 categories, at least 5 parts each, multi-part assembly and flight physics enabled.`);
