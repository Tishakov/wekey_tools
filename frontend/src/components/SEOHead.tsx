import { Helmet } from 'react-helmet-async';
import { useLanguageFromUrl } from '../hooks/useLanguageFromUrl';

interface SEOHeadProps {
  title?: string;
  description?: string;
  keywords?: string;
  ogTitle?: string;
  ogDescription?: string;
  ogImage?: string;
  canonical?: string;
  noindex?: boolean;
}

// Переводы для SEO
const seoTranslations = {
  ru: {
    siteName: 'WEKey Tools - Инструменты для работы с текстом',
    defaultTitle: 'WEKey Tools - Бесплатные онлайн инструменты для работы с текстом',
    defaultDescription: 'Бесплатные онлайн инструменты для работы с текстом: изменение регистра, удаление дубликатов, склейка слов, транслитерация, генератор паролей и многое другое',
    defaultKeywords: 'инструменты для текста, обработка текста, склейка слов, транслитерация, удаление дубликатов, генератор паролей, изменение регистра'
  },
  en: {
    siteName: 'WEKey Tools - Text Processing Tools',
    defaultTitle: 'WEKey Tools - Free Online Text Processing Tools',
    defaultDescription: 'Free online text processing tools: case converter, duplicate remover, word joiner, transliteration, password generator and much more',
    defaultKeywords: 'text tools, text processing, word joiner, transliteration, duplicate remover, password generator, case converter'
  },
  uk: {
    siteName: 'WEKey Tools - Інструменти для роботи з текстом',
    defaultTitle: 'WEKey Tools - Безкоштовні онлайн інструменти для роботи з текстом',
    defaultDescription: 'Безкоштовні онлайн інструменти для роботи з текстом: зміна регістру, видалення дублікатів, склеювання слів, транслітерація, генератор паролів та багато іншого',
    defaultKeywords: 'інструменти для тексту, обробка тексту, склеювання слів, транслітерація, видалення дублікатів, генератор паролів, зміна регістру'
  }
};

const SEOHead: React.FC<SEOHeadProps> = ({
  title,
  description,
  keywords,
  ogTitle,
  ogDescription,
  ogImage,
  canonical,
  noindex = false
}) => {
  const { currentLanguage, getLanguageAlternatives } = useLanguageFromUrl();
  
  const currentLang = currentLanguage as keyof typeof seoTranslations;
  const seoText = seoTranslations[currentLang] || seoTranslations.ru;
  
  const finalTitle = title || seoText.defaultTitle;
  const finalDescription = description || seoText.defaultDescription;
  const finalKeywords = keywords || seoText.defaultKeywords;
  const finalOgTitle = ogTitle || finalTitle;
  const finalOgDescription = ogDescription || finalDescription;
  const finalOgImage = ogImage || '/icons/logo_wekey_tools.svg';
  
  // Получаем текущий URL для canonical
  const currentUrl = typeof window !== 'undefined' ? window.location.href : '';
  const finalCanonical = canonical || currentUrl;
  
  // Получаем языковые альтернативы
  const languageAlternatives = getLanguageAlternatives();

  return (
    <Helmet>
      {/* Базовые meta теги */}
      <html lang={currentLanguage} />
      <title>{finalTitle}</title>
      <meta name="description" content={finalDescription} />
      <meta name="keywords" content={finalKeywords} />
      
      {/* Canonical URL */}
      {finalCanonical && <link rel="canonical" href={finalCanonical} />}
      
      {/* Hreflang теги для всех языков */}
      {languageAlternatives.map(({ lang, url }) => (
        <link
          key={lang}
          rel="alternate"
          hrefLang={lang}
          href={`${window.location.origin}${url}`}
        />
      ))}
      
      {/* x-default для поисковых систем */}
      <link
        rel="alternate"
        hrefLang="x-default"
        href={`${window.location.origin}/ru${window.location.pathname.replace(/^\/[a-z]{2}/, '')}`}
      />
      
      {/* Open Graph теги */}
      <meta property="og:type" content="website" />
      <meta property="og:title" content={finalOgTitle} />
      <meta property="og:description" content={finalOgDescription} />
      <meta property="og:image" content={finalOgImage} />
      <meta property="og:url" content={finalCanonical} />
      <meta property="og:site_name" content={seoText.siteName} />
      <meta property="og:locale" content={getOGLocale(currentLanguage)} />
      
      {/* Twitter Card теги */}
      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:title" content={finalOgTitle} />
      <meta name="twitter:description" content={finalOgDescription} />
      <meta name="twitter:image" content={finalOgImage} />
      
      {/* Robots теги */}
      {noindex ? (
        <meta name="robots" content="noindex, nofollow" />
      ) : (
        <meta name="robots" content="index, follow" />
      )}
      
      {/* Дополнительные SEO теги */}
      <meta name="author" content="WEKey Tools" />
      <meta name="generator" content="React + Vite" />
      <meta name="theme-color" content="#1976d2" />
      
      {/* Viewport и основные теги */}
      <meta name="viewport" content="width=device-width, initial-scale=1.0" />
      <meta charSet="utf-8" />
    </Helmet>
  );
};

// Функция для получения правильного OG locale
const getOGLocale = (lang: string): string => {
  const localeMap: Record<string, string> = {
    ru: 'ru_RU',
    en: 'en_US',
    uk: 'uk_UA'
  };
  return localeMap[lang] || localeMap.ru;
};

export default SEOHead;