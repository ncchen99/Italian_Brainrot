import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';

import zhTW from './locales/zh-TW.json';
import en from './locales/en.json';
import ar from './locales/ar.json';

const resources = {
  'zh-TW': {
    translation: zhTW
  },
  en: {
    translation: en
  },
  ar: {
    translation: ar
  }
};

// `dir` drives the document direction; `htmlLang` is what lands in <html lang>.
export const LANGUAGES = [
  { code: 'zh-TW', label: '中文', htmlLang: 'zh-Hant', dir: 'ltr' },
  { code: 'en', label: 'EN', htmlLang: 'en', dir: 'ltr' },
  { code: 'ar', label: 'العربية', htmlLang: 'ar', dir: 'rtl' }
];

const DEFAULT_LANGUAGE = 'zh-TW';

export function getLanguageMeta(code) {
  return LANGUAGES.find((lang) => lang.code === code)
    || LANGUAGES.find((lang) => lang.code === String(code || '').split('-')[0])
    || LANGUAGES[0];
}

export function isRtl(code) {
  return getLanguageMeta(code).dir === 'rtl';
}

const savedLng = localStorage.getItem('app_lang');
const initialLng = LANGUAGES.some((lang) => lang.code === savedLng) ? savedLng : DEFAULT_LANGUAGE;

function applyDocumentDirection(code) {
  const meta = getLanguageMeta(code);
  const root = document.documentElement;
  root.lang = meta.htmlLang;
  root.dir = meta.dir;
  // Lets CSS target a locale without having to re-read the i18n state.
  root.dataset.lang = meta.code;
}

i18n
  .use(initReactI18next)
  .init({
    resources,
    lng: initialLng,
    fallbackLng: 'en',
    supportedLngs: LANGUAGES.map((lang) => lang.code),
    interpolation: {
      escapeValue: false // react already safes from xss
    }
  });

applyDocumentDirection(initialLng);

i18n.on('languageChanged', (lng) => {
  localStorage.setItem('app_lang', lng);
  applyDocumentDirection(lng);
});

export default i18n;
