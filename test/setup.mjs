import { register } from 'node:module';
import { readdirSync, rmSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

// Test-only ESM hooks: `@/` → ./src, and the Base44 SDK client → a stub.
// Lets node --test import the app's pure logic without a browser or backend.
register('./alias-loader.mjs', import.meta.url);

// Several suites transpile a backend function into a `*.testmod.mjs` file next
// to themselves so it can be imported as ESM. Those artifacts are throwaway —
// remove them when the runner exits so the working tree stays clean.
const TEST_DIR = path.dirname(fileURLToPath(import.meta.url));

// Each test file runs in its own process and transpiles the function it exercises
// into `<name>[-n].testmod.mjs` next to itself. On exit, that process removes only
// its own artifacts — a blanket sweep would delete a sibling file's module while
// that sibling is still importing it.
const currentTestFile = process.argv[1] ? path.basename(process.argv[1]) : '';
const artifactPrefix = currentTestFile.endsWith('.test.js')
  ? currentTestFile.slice(0, -'.test.js'.length)
  : '';

if (artifactPrefix) {
  process.on('exit', () => {
    try {
      for (const name of readdirSync(TEST_DIR)) {
        const isOwnArtifact = name.endsWith('.testmod.mjs')
          && (name.startsWith(`${artifactPrefix}.`) || name.startsWith(`${artifactPrefix}-`));
        if (isOwnArtifact) rmSync(path.join(TEST_DIR, name), { force: true });
      }
    } catch {
      // Best-effort: a locked or already-removed file must not fail a run.
    }
  });
}