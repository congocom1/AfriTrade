import fr from './fr.js';
import frExtended from './fr-extended.js';
import en from './en.js';
import ln from './ln.js';
import sw from './sw.js';
import intlShipment from './intlShipment.js';
import homeCollections from './homeCollections.js';
import commerceIntro from './commerceIntro.js';
import portalStatus from './portalStatus.js';

export const mergeNamespaces = (base, extra) =>
  Object.entries(extra).reduce((out, [ns, values]) => ({ ...out, [ns]: { ...(out[ns] || {}), ...values } }), { ...base });

// Merge extended French translations (fixes missing keys test)
const frWithExtensions = mergeNamespaces(fr, frExtended);

/**
 * The dictionaries the app actually runs on.
 *
 * fr.js / en.js are at their size limit, so newer namespaces (the
 * international-shipment route) live in intlShipment.js and are merged in
 * here. Anything that needs to resolve a translation key — the i18n setup and
 * the tests — reads these merged objects, so both see the same keys the UI
 * does. Lingala and Kiswahili fall back to the French copy for the newer
 * namespaces.
 */
const baseTranslations = {
  fr: mergeNamespaces(mergeNamespaces(frWithExtensions, intlShipment.fr), homeCollections.fr),
  en: mergeNamespaces(mergeNamespaces(en, intlShipment.en), homeCollections.en),
  ln: mergeNamespaces(mergeNamespaces(mergeNamespaces(ln, frExtended), intlShipment.fr), homeCollections.fr),
  sw: mergeNamespaces(mergeNamespaces(mergeNamespaces(sw, frExtended), intlShipment.fr), homeCollections.fr),
};

export const translations = Object.fromEntries(
  Object.entries(baseTranslations).map(([language, dictionary]) => [
    language, mergeNamespaces(mergeNamespaces(dictionary, commerceIntro[language] || commerceIntro.fr), portalStatus[language] || portalStatus.fr),
  ]),
);
