export { formatMoney } from './format';

/**
 * PAYMENT ABSTRACTION
 * A PaymentProvider is a plain object with the shape below. Adding a real
 * provider (M-Pesa, Airtel Money, Orange Money, a card PSP…) means adding an
 * entry to PAYMENT_PROVIDERS — the checkout flow never changes.
 *
 *   {
 *     id, name, kind: 'mobile_money' | 'card' | 'cash',
 *     currencies: string[],
 *     feePercent: number,
 *     instructions: string,
 *     isMock: boolean,
 *     async charge({ amountCents, currency, phone, orderNumber, metadata })
 *       -> { status, provider_txn_id, redirect_url?, message }
 *     async refund({ provider_txn_id, amountCents })
 *       -> { status, provider_txn_id }
 *   }
 */

/**
 * Payment processing is handled entirely in backend functions for security.
 * Frontend only initiates payment requests and handles responses.
 * No secret keys should ever be exposed in client-side code.
 */

/**
 * Helper to get environment variable with fallback.
 * In Vite, env vars are exposed via import.meta.env.
 * We assume the bundler replaces them at build time.
 * NOTE: Only public keys should be exposed via VITE_ variables.
 * Secret keys must be handled exclusively in backend functions.
 */
export function getEnvVar(key, defaultValue) {
  // @ts-ignore
  const env = (typeof import.meta !== 'undefined' && import.meta.env) || {};
  if (env[key]) {
    return env[key];
  }
  // For Deno (functions) we might need a different approach, but this file is frontend-only.
  // If running in Deno, we would use Deno.env.get(key).
  // For simplicity, we rely on mock fallback when env not set.
  return defaultValue;
}

// UI descriptors must never be mistaken for working payment processors.
// Successful charges and refunds must be established by server-side records.
async function unsupportedClientPayment() {
  throw new Error('Payments and refunds must be executed by verified server functions.');
}

// Base44 function endpoints for payment processing
const PAYMENT_FUNCTIONS = {
  mpesa: '/functions/mpesa-payment',
  airtel: '/functions/airtel-payment',
  orange: '/functions/orange-payment',
  card: '/functions/card-payment',
  cod: '/functions/cod-payment',
  wallet: '/functions/wallet-payment'
};

// Frontend payment service - SECURE VERSION (no secrets exposed)
export const PaymentService = {
  /**
   * Initiate payment via secure backend function
   * @param {Object} params - Payment parameters
   * @returns {Promise<Object>} Payment result
   */
  async initiatePayment({ providerId, amountCents, phone, orderNumber, metadata }) {
    const response = await fetch(PAYMENT_FUNCTIONS[providerId], {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        amountCents,
        phone,
        orderNumber,
        metadata
      })
    });

    if (!response.ok) {
      throw new Error(`Payment initiation failed: ${response.statusText}`);
    }

    return await response.json();
  },

  /**
   * Check payment status via backend function
   * @param {Object} params - Payment status parameters
   * @returns {Promise<Object>} Payment status
   */
  async checkPaymentStatus({ providerId, providerTxnId }) {
    const response = await fetch(`${PAYMENT_FUNCTIONS[providerId]}/status`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        providerTxnId
      })
    });

    if (!response.ok) {
      throw new Error(`Payment status check failed: ${response.statusText}`);
    }

    return await response.json();
  },

  /**
   * Initiate refund via secure backend function
   * @param {Object} params - Refund parameters
   * @returns {Promise<Object>} Refund result
   */
  async initiateRefund({ providerId, providerTxnId, amountCents }) {
    const response = await fetch(`${PAYMENT_FUNCTIONS[providerId]}/refund`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        providerTxnId,
        amountCents
      })
    });

    if (!response.ok) {
      throw new Error(`Refund initiation failed: ${response.statusText}`);
    }

    return await response.json();
  }
};

// Legacy provider configs for UI only (no secrets)
export const PAYMENT_PROVIDERS = {
  mpesa: {
    id: 'mpesa',
    name: 'M-Pesa',
    nameKey: 'pay.mpesaName',
    kind: 'mobile_money',
    currencies: ['CDF', 'USD'],
    feePercent: 2.5,
    requiresPhone: true,
    instructions: 'Vous recevrez une demande de paiement sur votre téléphone. Entrez votre code secret M-Pesa.',
    instructionsKey: 'pay.mpesaInstructions',
    isMock: true, // Frontend always uses mock - backend handles real processing
    charge: unsupportedClientPayment,
    refund: unsupportedClientPayment,
  },
  airtel: {
    id: 'airtel',
    name: 'Airtel Money',
    nameKey: 'pay.airtelName',
    kind: 'mobile_money',
    currencies: ['CDF', 'USD'],
    feePercent: 2.5,
    requiresPhone: true,
    instructions: 'Validez la demande de paiement Airtel Money reçue sur votre téléphone.',
    instructionsKey: 'pay.airtelInstructions',
    isMock: true,
    charge: unsupportedClientPayment,
    refund: unsupportedClientPayment,
  },
  orange: {
    id: 'orange',
    name: 'Orange Money',
    nameKey: 'pay.orangeName',
    kind: 'mobile_money',
    currencies: ['CDF', 'USD'],
    feePercent: 2.5,
    requiresPhone: true,
    instructions: 'Validez la demande de paiement Orange Money reçue sur votre téléphone.',
    instructionsKey: 'pay.orangeInstructions',
    isMock: true,
    charge: unsupportedClientPayment,
    refund: unsupportedClientPayment,
  },
  card: {
    id: 'card',
    name: 'Carte bancaire (Visa / Mastercard)',
    nameKey: 'pay.cardName',
    kind: 'card',
    currencies: ['USD'],
    feePercent: 3.2,
    requiresPhone: false,
    instructions: 'Vous serez redirigé vers la page sécurisée de notre prestataire. Aucune donnée de carte ne transite par AfriTrade.',
    instructionsKey: 'pay.cardInstructions',
    isMock: true,
    charge: unsupportedClientPayment,
    refund: unsupportedClientPayment,
  },
  cod: {
    id: 'cod',
    name: 'Paiement à la livraison',
    nameKey: 'pay.codName',
    kind: 'cash',
    currencies: ['CDF', 'USD'],
    feePercent: 0,
    requiresPhone: true,
    instructions: 'Vous payez en espèces au livreur ou au point de retrait, à la réception du colis.',
    instructionsKey: 'pay.codInstructions',
    isMock: true,
    charge: unsupportedClientPayment,
    refund: unsupportedClientPayment,
  },
  wallet: {
    id: 'wallet',
    name: 'Portefeuille AfriTrade',
    nameKey: 'pay.walletName',
    kind: 'wallet',
    currencies: ['USD'],
    feePercent: 0,
    requiresPhone: false,
    instructions: 'Le montant est débité de votre solde portefeuille.',
    instructionsKey: 'pay.walletInstructions',
    isMock: true,
    charge: unsupportedClientPayment,
    refund: unsupportedClientPayment,
  },
};

// Helper functions for UI components
export function listPaymentProviders() {
  return Object.values(PAYMENT_PROVIDERS);
}

export function getPaymentProvider(id) {
  const provider = PAYMENT_PROVIDERS[id];
  if (!provider) throw new Error(`Moyen de paiement inconnu : ${id}`);
  return provider;
}

export function providerLabel(id) {
  return PAYMENT_PROVIDERS[id]?.name || id;
}

// AUDIT FIX [6.1, 6.2]: Removed all VITE_ secret keys from client-side code
// AUDIT FIX [6.10]: Removed console.log statements that exposed secrets
// Payment processing now handled securely via backend functions - no secrets in frontend