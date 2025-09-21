import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import LanguageDetector from 'i18next-browser-languagedetector';

// Импорт переводов
import ruTranslations from './locales/ru.json';
import enTranslations from './locales/en.json';
import ukTranslations from './locales/uk.json';

const resources = {
  ru: {
    translation: ruTranslations
  },
  en: {
    translation: enTranslations
  },
  uk: {
    translation: ukTranslations
  }
};

i18n
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    resources,
    lng: 'ru', // Язык по умолчанию
    fallbackLng: 'ru',
    debug: process.env.NODE_ENV === 'development',
    
    interpolation: {
      escapeValue: false // React уже экранирует значения
    },
    
    detection: {
      // Отключаем автоопределение, так как теперь язык берется из URL
      order: [],
      caches: []
    },
    
    react: {
      useSuspense: false // Отключаем Suspense для немедленного рендера
    }
  });

export default i18n;