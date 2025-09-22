import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';

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

// Определяем язык из URL при инициализации
const getInitialLanguage = () => {
  const path = window.location.pathname;
  const langMatch = path.match(/^\/([a-z]{2})\//);
  const urlLang = langMatch ? langMatch[1] : null;
  
  // Проверяем, что язык из URL поддерживается
  if (urlLang && ['ru', 'en', 'uk'].includes(urlLang)) {
    console.log('🌍 [i18n] Language from URL:', urlLang);
    return urlLang;
  }
  
  console.log('🌍 [i18n] Using default language: ru');
  return 'ru';
};

i18n
  .use(initReactI18next)
  .init({
    resources,
    lng: getInitialLanguage(), // Устанавливаем язык из URL при инициализации
    fallbackLng: 'ru',
    debug: process.env.NODE_ENV === 'development',
    
    interpolation: {
      escapeValue: false // React уже экранирует значения
    },
    
    react: {
      useSuspense: false // Отключаем Suspense для немедленного рендера
    },

    // Отключаем все автоматические детекторы языка
    // Язык будет управляться только через URL
    initImmediate: false,
    
    // Отключаем сохранение в localStorage чтобы избежать конфликтов
    saveMissing: false,
    updateMissing: false
  });

export default i18n;