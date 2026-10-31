import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import { translations } from './resources.js';

export const LANGUAGES = [
  { id: 'fr', label: 'FR', name: 'Français' },
  { id: 'en', label: 'EN', name: 'English' },
  { id: 'ln', label: 'LN', name: 'Lingala' },
  { id: 'sw', label: 'SW', name: 'Kiswahili' },
];

const STORAGE_KEY = 'afritrade:language';
const LEGACY_STORAGE_KEY = 'cc:lang';

export const resolveLanguage = (value) => {
  const base = String(value || '').trim().toLowerCase().split(/[-_]/)[0];
  return LANGUAGES.some((language) => language.id === base) ? base : null;
};

function initialLanguage() {
  try {
    // Preserve the previous selection when upgrading older AfriTrade builds.
    const saved = resolveLanguage(localStorage.getItem(STORAGE_KEY))
      || resolveLanguage(localStorage.getItem(LEGACY_STORAGE_KEY));
    if (saved) return saved;
  } catch {
    // Storage can be unavailable in private browsing.
  }
  try {
    for (const locale of navigator.languages || [navigator.language]) {
      const supported = resolveLanguage(locale);
      if (supported) return supported;
    }
  } catch {
    // Server-side rendering or restricted browser environment.
  }
  return 'fr';
}

i18n.use(initReactI18next).init({
  resources: {
    fr: { translation: translations.fr },
    en: { translation: translations.en },
    ln: { translation: translations.ln },
    sw: { translation: translations.sw },
  },
  lng: initialLanguage(),
  fallbackLng: 'fr',
  supportedLngs: LANGUAGES.map(({ id }) => id),
  load: 'languageOnly',
  interpolation: { escapeValue: false },
});

if (typeof document !== 'undefined') {
  document.documentElement.lang = resolveLanguage(i18n.language) || 'fr';
  i18n.on('languageChanged', (lng) => {
    const language = resolveLanguage(lng) || 'fr';
    document.documentElement.lang = language;
    try {
      localStorage.setItem(STORAGE_KEY, language);
      localStorage.removeItem(LEGACY_STORAGE_KEY);
    } catch {
      // ignore persistence failures
    }
  });
}

export function setLanguage(id) {
  const supported = resolveLanguage(id);
  if (supported) return i18n.changeLanguage(supported);
  return Promise.resolve();
}

export default i18n;