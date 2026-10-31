import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { translations } from '../src/i18n/resources.js';
import i18next from 'i18next';

const fr = translations.fr;
const en = translations.en;

const root = path.dirname(path.dirname(fileURLToPath(import.meta.url)));

function flatten(obj, prefix = '', out = new Set()) {
  for (const [k, v] of Object.entries(obj)) {
    const key = prefix ? `${prefix}.${k}` : k;
    if (v && typeof v === 'object') flatten(v, key, out);
    else out.add(key);
  }
  return out;
}

function srcFiles(dir, acc = []) {
  for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
    const f = path.join(dir, e.name);
    if (e.isDirectory()) {
      if (e.name !== 'i18n') srcFiles(f, acc);
    } else if (/\.jsx?$/.test(f)) acc.push(f);
  }
  return acc;
}

describe('i18n dictionaries', () => {
  it('English covers every French key (fallback must never fire for EN)', () => {
    const frKeys = flatten(fr);
    const enKeys = flatten(en);
    const missing = [...frKeys].filter((k) => !enKeys.has(k));
    assert.deepEqual(missing, []);
  });

  it('every t() key used in src exists in French', () => {
    const frKeys = flatten(fr);
    const used = new Set();
    for (const f of srcFiles(path.join(root, 'src'))) {
      const s = fs.readFileSync(f, 'utf8');
      const re = /\bt\(\s*['"]([a-z0-9_.]+)['"]/gi;
      let m;
      while ((m = re.exec(s))) used.add(m[1]);
    }
    const missing = [...used].filter((k) => !frKeys.has(k));
    assert.deepEqual(missing, []);
  });
});

describe('language fallback and locale behavior', () => {
  it('falls back to French for keys absent from partial Lingala and Kiswahili dictionaries', async () => {
    const instance = i18next.createInstance();
    await instance.init({ resources: Object.fromEntries(Object.entries(translations).map(([id, dictionary]) => [id, { translation: dictionary }])), lng: 'ln', fallbackLng: 'fr', initImmediate: false });
    for (const locale of ['ln', 'sw']) {
      await instance.changeLanguage(locale);
      assert.equal(instance.t('search.emptyTitle'), translations.fr.search.emptyTitle);
      assert.equal(instance.t('nav.home'), translations[locale].nav.home);
    }
  });
  it('English and French retain distinct localizations of core UI', () => {
    assert.notEqual(translations.en.search.emptyTitle, translations.fr.search.emptyTitle);
    assert.notEqual(translations.en.asyncState.retry, translations.fr.asyncState.retry);
  });
});
