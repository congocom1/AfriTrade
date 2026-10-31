import { pathToFileURL, fileURLToPath } from 'node:url';
import path from 'node:path';
import fs from 'node:fs';

const root = path.dirname(path.dirname(fileURLToPath(import.meta.url)));

const EXTENSIONS = ['', '.js', '.jsx', '/index.js', '/index.jsx'];

export async function resolve(specifier, context, next) {
  if (specifier === '@/api/base44Client') {
    return { url: pathToFileURL(path.join(root, 'test/stubs/base44Client.js')).href, shortCircuit: true };
  }
  if (specifier.startsWith('@/')) {
    const base = path.join(root, 'src', specifier.slice(2));
    const hit = EXTENSIONS.map((e) => base + e).find((p) => fs.existsSync(p) && fs.statSync(p).isFile());
    if (hit) return { url: pathToFileURL(hit).href, shortCircuit: true };
  }
  if (specifier.startsWith('.') && context?.parentURL?.startsWith('file:')) {
    const base = path.resolve(path.dirname(fileURLToPath(context.parentURL)), specifier);
    const hit = EXTENSIONS.map((e) => base + e).find((p) => fs.existsSync(p) && fs.statSync(p).isFile());
    if (hit) return { url: pathToFileURL(hit).href, shortCircuit: true };
  }
  return next(specifier, context);
}

// Node 22.12 does not strip TypeScript; keep tests portable across the CI matrix.
export async function load(url, context, next) {
  if (url.startsWith('file:') && url.endsWith('.ts')) {
    const { default: ts } = await import('typescript');
    const source = fs.readFileSync(fileURLToPath(url), 'utf8');
    return {
      format: 'module',
      shortCircuit: true,
      source: ts.transpileModule(source, {
        compilerOptions: { module: ts.ModuleKind.ESNext, target: ts.ScriptTarget.ES2022 },
      }).outputText,
    };
  }
  return next(url, context);
}
