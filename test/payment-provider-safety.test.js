import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const source = readFileSync('src/lib/payments.js', 'utf8').replace(/^export \{ formatMoney \} from ['"]\.\/format['"];?\s*/m, '');
const { PAYMENT_PROVIDERS } = await import(`data:text/javascript;base64,${Buffer.from(source).toString('base64')}`);

describe('legacy payment UI descriptors cannot simulate a successful payment', () => {
  for (const [name, provider] of Object.entries(PAYMENT_PROVIDERS)) {
    it(`${name} refuses direct browser charge and refund`, async () => {
      await assert.rejects(provider.charge({amountCents:100,orderNumber:'TEST'}), /verified server functions/);
      await assert.rejects(provider.refund({amountCents:100, provider_txn_id:'SYNTHETIC'}), /verified server functions/);
    });
  }
});
