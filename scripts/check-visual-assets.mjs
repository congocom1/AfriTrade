import { readFileSync, statSync, existsSync } from 'node:fs';
import { resolve } from 'node:path';
const manifest = JSON.parse(readFileSync('public/assets/registry.json', 'utf8'));
const seen = new Set();
for (const a of manifest.assets) {
  if (!a.id || seen.has(a.id)) throw new Error(`Duplicate/missing asset id: ${a.id}`);
  seen.add(a.id);
  if (!a.path?.startsWith('/')) throw new Error(`Invalid asset path: ${a.id}`);
  const file = resolve('public', '.' + a.path);
  if (!file.startsWith(resolve('public') + '/')) throw new Error(`Unsafe path: ${a.id}`);
  if (!existsSync(file)) throw new Error(`Missing asset: ${a.path}`);
  const data = readFileSync(file);
  if (!data.length) throw new Error(`Empty asset: ${a.path}`);
  if (statSync(file).size > 1500000) throw new Error(`Oversized asset: ${a.path}`);
  if (a.format === 'svg' && (!data.toString('utf8').includes('<svg') || /<script\b|onload\s*=|javascript:/i.test(data.toString('utf8')))) throw new Error(`Invalid SVG: ${a.path}`);
  if (a.license === 'unknown' || !a.source || !a.status) throw new Error(`Incomplete provenance: ${a.id}`);
}
console.log(`Validated ${seen.size} registered assets; paths, basic SVG safety and provenance checked.`);
