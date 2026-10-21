/** Install the curated image ZIP from this conversation into the Vite public tree.
 * Usage: node scripts/install-realistic-assets.mjs /path/to/afritrade-realistic-assets.zip
 * Requires system `unzip`; never writes outside public/images/realistic.
 */
import { execFileSync } from 'node:child_process';
import { existsSync, mkdirSync, writeFileSync } from 'node:fs';
import { resolve, join } from 'node:path';

const archive = process.argv[2] && resolve(process.argv[2]);
if (!archive || !existsSync(archive)) {
  console.error('Usage: node scripts/install-realistic-assets.mjs /path/to/afritrade-realistic-assets.zip');
  process.exit(1);
}
const images = [
  'homepage-hero', 'logo-concept', 'beauty-category', 'fashion-category',
  'logistics-delivery', 'electronics-category', 'logistics-warehouse', 'delivery-truck',
];
const destination = resolve('public/images/realistic');
mkdirSync(destination, { recursive: true });
for (const name of images) {
  const filename = `images/${name}.webp`;
  const data = execFileSync('unzip', ['-p', archive, filename], { maxBuffer: 8 * 1024 * 1024 });
  if (!data.length || data.toString('ascii', 0, 4) !== 'RIFF' || data.toString('ascii', 8, 12) !== 'WEBP') {
    throw new Error(`Invalid WebP asset: ${filename}`);
  }
  writeFileSync(join(destination, `${name}.webp`), data);
  console.log(`Installed ${name}.webp (${data.length} bytes)`);
}
