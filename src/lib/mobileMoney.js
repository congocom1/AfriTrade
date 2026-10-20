/**
 * Mobile-money numbering for the countries the checkout offers mobile money in.
 *
 * Every network declares its country, dialling code and local prefixes, so one
 * table covers the platform's coverage instead of assuming one country. The
 * number a gateway is asked to debit must be the customer's own wallet number —
 * not necessarily the delivery phone — so it is captured and validated on its own.
 */
import i18n from '@/i18n';

/**
 * `prefixes` are the first digits of the national number as the operator
 * publishes them (trunk 0 included, as Nigerian operators publish them).
 * `national` is how many digits the national number has *including* that trunk
 * 0 — Nigerian mobiles are 11 digits dialled locally, 10 without it — so a
 * cut-off number is rejected instead of being sent to a gateway.
 */
export const PHONE_NETWORKS = [
  { providerId: 'mpesa', name: 'M-Pesa (Vodacom)', country: 'CD', dial: '+243', national: 9, prefixes: ['81', '82', '83'] },
  { providerId: 'airtel', name: 'Airtel Money', country: 'CD', dial: '+243', national: 9, prefixes: ['96', '97', '98', '99'] },
  { providerId: 'orange', name: 'Orange Money', country: 'CD', dial: '+243', national: 9, prefixes: ['84', '85', '89'] },
  { providerId: 'africell', name: 'Afrimoney (Africell)', country: 'CD', dial: '+243', national: 9, prefixes: ['90', '91'] },
  { providerId: 'mpesa', name: 'M-Pesa', country: 'NG', dial: '+234', national: 11, prefixes: ['080'] },
  { providerId: 'airtel', name: 'Airtel Money', country: 'NG', dial: '+234', national: 11, prefixes: ['070', '090'] },
  { providerId: 'orange', name: 'Orange Money', country: 'NG', dial: '+234', national: 11, prefixes: ['081', '082'] },
];

/**
 * Finds the network whose national prefix starts the number. Every candidate is
 * tried in both spellings of the same number — as dialled locally (trunk 0 where
 * the country uses one) and as sent internationally (country code stripped, no
 * trunk 0) — and longer prefixes win so `080` is preferred over a 2-digit match.
 */
function matchNetwork(input) {
  const digits = String(input || '').replace(/\D/g, '');
  if (!digits) return null;
  const candidates = [];
  for (const network of PHONE_NETWORKS) {
    const country = network.dial.slice(1);
    // Both accepted spellings of the same number: as dialled locally (trunk 0
    // where the country uses one) and as sent internationally (country code
    // stripped, no trunk 0).
    const dialled = digits.startsWith(country) ? digits.slice(country.length) : digits;
    const national = dialled.replace(/^0/, '');
    const forms = [`0${national}`, national];
    for (const local of forms) {
      if (local.length !== network.national) continue;
      for (const prefix of network.prefixes) {
        if (!local.startsWith(prefix)) continue;
        // Longer prefixes are a stronger claim to the number.
        candidates.push({ network, local, length: prefix.length });
        break;
      }
    }
  }
  return candidates.sort((a, b) => b.length - a.length)[0] || null;
}

/** Strips spaces, dashes and the country code into E.164 (+<dial><national>), or '' if unusable. */
export function normalizePhone(input) {
  const match = matchNetwork(input);
  // E.164 has no trunk 0; Nigerian prefixes carry one, so at most one is dropped.
  return match ? `${match.network.dial}${match.local.replace(/^0/, '')}` : '';
}

/** The operator a number belongs to, or null when its prefix is unknown. */
export function networkForPhone(input) {
  return matchNetwork(input)?.network || null;
}

/**
 * Checks a number against the operator the customer picked, so a payment is
 * never sent to a wallet the gateway cannot debit.
 */
export function validateMobileMoneyNumber(providerId, raw) {
  const t = i18n.t.bind(i18n);
  const network = PHONE_NETWORKS.find((n) => n.providerId === providerId);
  const hint = network
    ? t('momo.hint', { network: network.name, prefixes: network.prefixes.map((p) => (p.startsWith('0') ? p : `0${p}`)).join(', ') })
    : t('momo.hintDefault');
  const phone = normalizePhone(raw);

  if (!phone) {
    return { ok: false, phone: '', hint, error: t('momo.invalid') };
  }

  const detected = networkForPhone(phone);
  if (detected && network && detected.providerId !== network.providerId) {
    return {
      ok: false,
      phone,
      hint,
      error: t('momo.mismatch', { detected: detected.name, network: network.name }),
    };
  }

  return { ok: true, phone, hint, error: '' };
}
