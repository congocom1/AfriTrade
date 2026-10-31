import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { translations } from '../src/i18n/resources.js';
import { SHIPMENT_STATUS_LABELS } from '../src/lib/logistics.js';
import { HEALTH_LABELS } from '../src/lib/platformHealth.js';
import { EVENT_LABELS } from '../src/lib/events.js';
import { DISPUTE_TYPES, RESOLUTION_LABELS } from '../src/lib/disputeResolution.js';
import { FEATURE_LABELS, planAmount } from '../src/lib/plans.js';
import { RETURN_REASON_LABELS } from '../src/lib/returns.js';
import { LOYALTY_TIERS, LOYALTY_REWARDS, loyaltySummary } from '../src/lib/loyalty.js';

function hasKey(key) {
  const parts = key.split('.');
   
  let node = translations.fr;
  for (const p of parts) {
    node = node?.[p];
    if (node === undefined) return false;
  }
  return true;
}

describe('lib label maps resolve in French dict', () => {
  const maps = {
    SHIPMENT_STATUS_LABELS,
    HEALTH_LABELS,
    EVENT_LABELS,
    DISPUTE_TYPES,
    RESOLUTION_LABELS,
    FEATURE_LABELS,
    RETURN_REASON_LABELS,
  };
  for (const [name, map] of Object.entries(maps)) {
    it(`${name} values all exist in fr`, () => {
      const missing = Object.values(map).filter((k) => !hasKey(k));
      assert.deepEqual(missing, []);
    });
  }

  it('LOYALTY_TIERS and LOYALTY_REWARDS keys exist in fr and loyaltySummary provides lifetimeUsd', () => {
    for (const tier of LOYALTY_TIERS) {
      assert.equal(hasKey(tier.nameKey), true, `Missing ${tier.nameKey}`);
      assert.equal(hasKey(tier.perksKey), true, `Missing ${tier.perksKey}`);
    }
    for (const reward of LOYALTY_REWARDS) {
      assert.equal(hasKey(reward.labelKey), true, `Missing ${reward.labelKey}`);
      assert.equal(hasKey(reward.noteKey), true, `Missing ${reward.noteKey}`);
    }
    const summary = loyaltySummary({
      orders: [{ id: '1', status: 'DELIVERED', payment_status: 'PAID', total_usd: 25 }],
      redemptions: [],
    });
    assert.equal(summary.lifetimeUsdCents, 2500);
    assert.equal(summary.lifetimeUsd, 25);
  });

  it('planAmount resolves both cents and legacy dollar plan fields', () => {
    assert.equal(planAmount({ price_monthly_usd_cents: 1900 }, 'monthly'), 1900);
    assert.equal(planAmount({ price_monthly_usd: 19 }, 'monthly'), 1900);
    assert.equal(planAmount({ price_yearly_usd_cents: 19000 }, 'yearly'), 19000);
    assert.equal(planAmount({ price_yearly_usd: 190 }, 'yearly'), 19000);
  });
});