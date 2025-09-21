import { useEffect } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { useTranslation } from 'react-i18next';

// Список поддерживаемых языков
export const SUPPORTED_LANGUAGES = ['ru', 'en', 'uk'] as const;
export type SupportedLanguage = typeof SUPPORTED_LANGUAGES[number];

// Проверка, является ли язык поддерживаемым
export const isSupportedLanguage = (lang: string): lang is SupportedLanguage => {
  return SUPPORTED_LANGUAGES.includes(lang as SupportedLanguage);
};

// Получение языка по умолчанию
export const getDefaultLanguage = (): SupportedLanguage => 'ru';

// Хук для работы с языком из URL
export const useLanguageFromUrl = () => {
  const { lang } = useParams<{ lang: string }>();
  const navigate = useNavigate();
  const location = useLocation();
  const { i18n } = useTranslation();

  // Определяем текущий язык из URL или используем язык по умолчанию
  const currentLanguage: SupportedLanguage = (lang && isSupportedLanguage(lang)) 
    ? lang 
    : getDefaultLanguage();

  useEffect(() => {
    console.log('🌍 [useLanguageFromUrl] Effect triggered:', { 
      lang, 
      currentLanguage, 
      'i18n.language': i18n.language,
      pathname: location.pathname 
    });

    // Если язык в URL не поддерживается или отсутствует, редиректим
    if (!lang || !isSupportedLanguage(lang)) {
      const newPath = `/${getDefaultLanguage()}${location.pathname}${location.search}`;
      console.log('🔄 [useLanguageFromUrl] Redirecting to:', newPath);
      navigate(newPath, { replace: true });
      return;
    }

    // Синхронизируем i18n с языком из URL
    if (i18n.language !== currentLanguage) {
      console.log('🔄 [useLanguageFromUrl] Changing i18n language from', i18n.language, 'to', currentLanguage);
      i18n.changeLanguage(currentLanguage);
    }
  }, [lang, navigate, location, i18n, currentLanguage]);

  // Функция для смены языка
  const changeLanguage = (newLang: SupportedLanguage) => {
    const currentPath = location.pathname;
    console.log('🔄 [changeLanguage] Changing language:', { 
      from: currentLanguage, 
      to: newLang, 
      currentPath 
    });
    
    // Заменяем язык в URL
    const newPath = currentPath.replace(/^\/[a-z]{2}/, `/${newLang}`);
    console.log('🔄 [changeLanguage] Navigating to:', newPath + location.search);
    navigate(newPath + location.search);
  };

  // Функция для получения URL с другим языком
  const getUrlForLanguage = (targetLang: SupportedLanguage) => {
    const currentPath = location.pathname;
    return currentPath.replace(/^\/[a-z]{2}/, `/${targetLang}`) + location.search;
  };

  // Функция для получения всех языковых альтернатив
  const getLanguageAlternatives = () => {
    return SUPPORTED_LANGUAGES.map(langCode => ({
      lang: langCode,
      url: getUrlForLanguage(langCode)
    }));
  };

  return {
    currentLanguage,
    changeLanguage,
    getUrlForLanguage,
    getLanguageAlternatives,
    supportedLanguages: SUPPORTED_LANGUAGES
  };
};

// Хук для генерации ссылок с языком
export const useLocalizedLink = () => {
  const { currentLanguage } = useLanguageFromUrl();

  const createLink = (path: string) => {
    // Убираем ведущий слэш если есть
    const cleanPath = path.startsWith('/') ? path.slice(1) : path;
    return `/${currentLanguage}/${cleanPath}`;
  };

  return { createLink, currentLanguage };
};

export default useLanguageFromUrl;