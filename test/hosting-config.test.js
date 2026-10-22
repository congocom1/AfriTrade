import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, existsSync } from 'node:fs';
const config = JSON.parse(readFileSync('base44/config.jsonc', 'utf8'));
const packageConfig = JSON.parse(readFileSync('package.json', 'utf8'));

describe('Base44 canonical hosting configuration', () => {
  it('installs the locked dependency tree and builds the React site', () => {
    assert.equal(config.site.installCommand, 'npm ci');
    assert.equal(config.site.buildCommand, 'npm run build');
    assert.equal(config.site.outputDirectory, './dist');
    assert.ok(existsSync('package-lock.json'));
    assert.equal(packageConfig.scripts.build, 'vite build');
  });
  it('retains the Base44 integrated dev workflow and hosted backend code', () => {
    assert.equal(config.site.serveCommand, 'npm run dev');
    assert.equal(packageConfig.scripts['dev:base44'], 'base44 dev');
    assert.ok(existsSync('base44/functions/health/entry.ts'));
    assert.ok(existsSync('base44/entities/Order.jsonc'));
    assert.ok(existsSync('pubspec.yaml'));
  });
});
