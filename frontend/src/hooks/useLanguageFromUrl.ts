import { useEffect, useRef } from 'react';
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
  console.log('🔄 [useLanguageFromUrl] Hook called with pathname:', window.location.pathname);
  
  const { lang } = useParams<{ lang: string }>();
  const navigate = useNavigate();
  const location = useLocation();
  const { i18n } = useTranslation();
  const lastRedirectRef = useRef<string>('');

  console.log('🔄 [useLanguageFromUrl] Extracted lang:', lang, 'from pathname:', location.pathname);

  // Определяем текущий язык из URL или используем язык по умолчанию
  const currentLanguage: SupportedLanguage = (lang && isSupportedLanguage(lang)) 
    ? lang 
    : getDefaultLanguage();

  // Принудительно устанавливаем язык при первой загрузке, если он отличается
  useEffect(() => {
    if (lang && isSupportedLanguage(lang) && i18n.language !== lang) {
      i18n.changeLanguage(lang);
    }
  }, []); // Выполняется только при первом рендере

  useEffect(() => {
    // Защита от циклических редиректов
    if (lastRedirectRef.current === location.pathname) {
      return;
    }

    // Исключаем системные роуты из языковой обработки
    if (location.pathname.startsWith('/auth/') || 
        location.pathname.startsWith('/admin') ||
        location.pathname === '/auth/callback') {
      console.log('🔒 [useLanguageFromUrl] Skipping language processing for system route:', location.pathname);
      return;
    }

    // Если язык в URL не поддерживается или отсутствует, редиректим
    if (!lang || !isSupportedLanguage(lang)) {
      // Убираем существующий префикс языка если есть и добавляем корректный
      let pathWithoutLang = location.pathname;
      
      // Удаляем все языковые префиксы (включая множественные /ru/ru/ru/)
      pathWithoutLang = pathWithoutLang.replace(/^(\/[a-z]{2})+/, '');
      
      // Убеждаемся что путь начинается с /
      if (!pathWithoutLang.startsWith('/')) {
        pathWithoutLang = '/' + pathWithoutLang;
      }
      
      const newPath = `/${getDefaultLanguage()}${pathWithoutLang}${location.search}`;
      
      lastRedirectRef.current = newPath;
      navigate(newPath, { replace: true });
      return;
    }

    // Сбрасываем защиту от редиректов если путь корректный
    lastRedirectRef.current = '';

    // Синхронизируем i18n с языком из URL
    if (i18n.language !== currentLanguage) {
      i18n.changeLanguage(currentLanguage);
    }
  }, [lang, navigate, location, i18n, currentLanguage]);

  // Функция для смены языка
  const changeLanguage = (newLang: SupportedLanguage) => {
    const currentPath = location.pathname;
    
    // Заменяем язык в URL
    const newPath = currentPath.replace(/^\/[a-z]{2}/, `/${newLang}`);
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