import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { PAYMENT_PROVIDERS } from '../src/lib/payments.js';

describe('legacy payment UI descriptors cannot simulate a successful payment', () => {
  for (const [name, provider] of Object.entries(PAYMENT_PROVIDERS)) {
    it(`${name} refuses direct browser charge and refund`, async () => {
      await assert.rejects(provider.charge({amountCents:100,orderNumber:'TEST'}), /verified server functions/);
      await assert.rejects(provider.refund({amountCents:100, provider_txn_id:'SYNTHETIC'}), /verified server functions/);
    });
  }
});
