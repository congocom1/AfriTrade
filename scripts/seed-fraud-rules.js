#!/usr/bin/env node
/**
 * seed-fraud-rules.js
 * 
 * Script to seed fraud rules from src/lib/fraud-rules.json into the
 * FraudRule entity. Can be run locally for testing or as part of
 * deployment.
 * 
 * Usage:
 *   node scripts/seed-fraud-rules.js          # seed via the linked Base44 backend
 *   node scripts/seed-fraud-rules.js --mock   # dry run, no backend writes
 *
 * Environment:
 *   Must be able to import src/api/base44Client.js against a linked/dev
 *   Base44 environment. Without it the script exits non-zero unless --mock
 *   is passed explicitly — it never silently pretends to seed.
 */

import fs from 'node:fs';
import path from 'node:path';

const SEED_DATA_PATH = path.join(import.meta.dirname, '../src/lib/fraud-rules.json');
const ALLOW_MOCK = process.argv.includes('--mock');

async function getDb() {
  const { base44 } = await import('../src/api/base44Client.js');
  return base44.asServiceRole || base44;
}

async function seedFraudRules() {
  console.log('🌱 Seeding fraud rules...\n');

  const seedData = JSON.parse(fs.readFileSync(SEED_DATA_PATH, 'utf-8'));
  const RULES_SEED = seedData.RULES_SEED || seedData.default || seedData.rules || [];

  console.log(`Found ${RULES_SEED.length} rules to seed.`);

  const db = await getDb().catch((err) => {
    if (!ALLOW_MOCK) {
      console.error('❌ Base44 backend unavailable and --mock was not passed.');
      console.error('   Run inside a linked `base44 dev` environment, or pass --mock for a dry run.');
      console.error(`   Import error: ${err.message}`);
      process.exit(1);
    }
    console.log('⚠️  Using mock mode (--mock): no records will be written to the backend');
    return {
      entities: {
        FraudRule: {
          filter: async () => [],
          create: async (data) => ({ id: 'mock-' + Date.now(), ...data }),
        },
      },
    };
  });

  const results = { seeded: 0, skipped: 0, errors: 0, rules: [] };

  for (const rule of RULES_SEED) {
    try {
      const existing = await db.entities.FraudRule.filter({ code: rule.code }).catch(() => []);

      if (existing.length > 0) {
        console.log(`⏭️  ${rule.code} — already exists`);
        results.skipped++;
        results.rules.push({ code: rule.code, status: 'exists' });
        continue;
      }

      const created = await db.entities.FraudRule.create({
        code: rule.code,
        label: rule.label,
        description: rule.description || '',
        signal: rule.signal,
        threshold: rule.threshold,
        score: rule.score,
        action: rule.action,
        active: rule.active,
        sort_order: rule.sort_order || 0,
      });

      console.log(`✅ Created: ${rule.code}`);
      results.seeded++;
      results.rules.push({ code: rule.code, status: 'created', id: created.id });
    } catch (err) {
      console.error(`❌ Failed: ${rule.code} — ${err.message}`);
      results.errors++;
      results.rules.push({ code: rule.code, error: err.message });
    }
  }

  console.log(`\n📊 Results:`);
  console.log(`   Seeded: ${results.seeded}`);
  console.log(`   Skipped: ${results.skipped}`);
  console.log(`   Errors: ${results.errors}`);

  return results;
}

if (import.meta.url === `file://${process.argv[1]}`) {
  seedFraudRules().catch((err) => {
    console.error('Fatal error:', err);
    process.exit(1);
  });
}

export { seedFraudRules };