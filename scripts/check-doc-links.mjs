/** Ensure maintained documentation links resolve inside the checkout. */
import { existsSync, readFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';

const maintained = [
  'README.md', 'CONTRIBUTING.md', 'SECURITY.md',
  'docs/README.md', 'docs/engineering/GIT_WORKFLOW.md',
  'docs/archive/README.md', 'docs/archive/root-reports/README.md',
  'docs/guides/CONTRIBUTING.md',
];
let checked = 0;
let errors = 0;
for (const filename of maintained) {
  if (!existsSync(filename)) {
    console.error(`Missing maintained document: ${filename}`);
    errors++;
    continue;
  }
  const content = readFileSync(filename, 'utf8');
  for (const [, raw] of content.matchAll(/\[[^\]]+\]\(([^)]+)\)/g)) {
    const link = raw.trim().split(/\s+"/)[0];
    if (!link || link.startsWith('#') || /^(?:https?:|mailto:|tel:)/i.test(link)) continue;
    const path = link.split(/[?#]/)[0];
    const target = resolve(dirname(filename), decodeURIComponent(path));
    checked++;
    if (!existsSync(target)) {
      console.error(`Broken link ${filename}: ${link}`);
      errors++;
    }
  }
}
if (errors) {
  console.error(`Documentation integrity failed: ${errors} issue(s), ${checked} links scanned.`);
  process.exitCode = 1;
} else console.log(`Maintained documentation links valid: ${checked} local references checked.`);
