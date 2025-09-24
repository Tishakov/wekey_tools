import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useAuthRequired } from '../hooks/useAuthRequired';
import { useAuth } from '../contexts/AuthContext';
import { useLocalizedLink } from '../hooks/useLanguageFromUrl';
import { statsService } from '../utils/statsService';
import AuthRequiredModal from '../components/AuthRequiredModal';
import AuthModal from '../components/AuthModal';
import './SeoAudit.css';
import '../styles/tool-pages.css';

// Функция для расчета цвета на основе процента
const getProgressColor = (percentage: number): string => {
  if (percentage <= 30) {
    // 0-30%: красный
    return '#EF4444';
  } else if (percentage <= 60) {
    // 30-60%: переход от красного к желтому
    const progress = (percentage - 30) / 30; // 0-1
    const red = Math.round(239 - (239 - 245) * progress);
    const green = Math.round(68 + (158 - 68) * progress);
    const blue = Math.round(68 + (11 - 68) * progress);
    return `rgb(${red}, ${green}, ${blue})`;
  } else {
    // 60-100%: переход от желтого к зеленому
    const progress = (percentage - 60) / 40; // 0-1
    const red = Math.round(245 - (245 - 16) * progress);
    const green = Math.round(158 + (185 - 158) * progress);
    const blue = Math.round(11 + (129 - 11) * progress);
    return `rgb(${red}, ${green}, ${blue})`;
  }
};

// Специальная функция для цветов ключевых слов (другая логика)
const getKeywordColor = (density: number): string => {
  if (density < 0.5) {
    // Менее 0.5% - желтый (мало для SEO)
    return '#F59E0B';
  } else if (density >= 0.5 && density <= 3) {
    // 0.5-3% - зеленый (оптимально)
    return '#10B981';
  } else {
    // Более 3% - красный (переспам)
    return '#EF4444';
  }
};

interface SeoAuditResult {
  url: string;
  loading: boolean;
  error?: string;
  data?: {
    title: {
      content: string;
      length: number;
      isOptimal: boolean;
    };
    metaDescription: {
      content: string;
      length: number;
      isOptimal: boolean;
    };
    keywords: {
      content: string;
      count: number;
    };
    openGraph: {
      title: string;
      description: string;
      image: string;
      url: string;
      type: string;
      siteName: string;
    };
    twitterCard: {
      card: string;
      title: string;
      description: string;
      image: string;
      site: string;
    };
    structuredData: {
      count: number;
      types: string[];
    };
    microdata: {
      itemscope: number;
      itemtype: string[];
    };
    headings: {
      h1: { count: number; texts: Array<{text: string; length: number; hasKeywords: boolean}>; issues: string[] };
      h2: { count: number; texts: Array<{text: string; length: number; hasKeywords: boolean}>; issues: string[] };
      h3: { count: number; texts: Array<{text: string; length: number; hasKeywords: boolean}>; issues: string[] };
      h4: { count: number; texts: Array<{text: string; length: number; hasKeywords: boolean}>; issues: string[] };
      h5: { count: number; texts: Array<{text: string; length: number; hasKeywords: boolean}>; issues: string[] };
      h6: { count: number; texts: Array<{text: string; length: number; hasKeywords: boolean}>; issues: string[] };
      structure: { isValid: boolean; issues: string[] };
    };
    canonical: {
      url: string;
      isPresent: boolean;
    };
    robots: {
      content: string;
      noindex: boolean;
      nofollow: boolean;
      noarchive: boolean;
      nosnippet: boolean;
    };
    hreflang: Array<{
      lang: string;
      href: string;
    }>;
    sitemap: {
      found: boolean;
      urls: string[];
    };
    additional: {
      viewport: string;
      charset: string;
      lang: string;
      favicon: boolean;
    };
    images: {
      total: number;
      withoutAlt: number;
      withEmptyAlt: number;
    };
    links: {
      total: number;
      internal: number;
      external: number;
      nofollow: number;
    };
    performance: {
      htmlSize: number;
      htmlSizeKB: number;
      wordCount: number;
      textToHtmlRatio: number;
      title_length_score: number;
      description_length_score: number;
      h1_score: number;
      content_score: number;
      images_alt_score: number;
    };
    keywordAnalysis?: {
      titleKeywords: string[];
      keywordDensity: { [key: string]: { count: number; density: number } };
      recommendations: string[];
    };
    technical?: {
      https: boolean;
      urlStructure: {
        length: number;
        hasParameters: boolean;
        hasFragment: boolean;
        isClean: boolean;
      };
      pageLoadHints: {
        hasLazyLoading: boolean;
        hasPreconnect: boolean;
        hasPrefetch: boolean;
        hasMinifiedCSS: boolean;
      };
    };
    // Новые поля Level 2
    webVitals?: {
      mobile?: {
        performance_score: number;
        core_web_vitals: {
          lcp: { value: number; score: number; displayValue: string };
          fid: { value: number; score: number; displayValue: string };
          cls: { value: number; score: number; displayValue: string };
        };
      };
      desktop?: {
        performance_score: number;
        core_web_vitals: {
          lcp: { value: number; score: number; displayValue: string };
          fid: { value: number; score: number; displayValue: string };
          cls: { value: number; score: number; displayValue: string };
        };
      };
      error?: string;
    };
    overallScore?: {
      technical: number;
      content: number;
      performance: number;
      overall: number;
    };
    actionPlan?: Array<{
      priority: 'critical' | 'important' | 'recommended';
      category: string;
      task: string;
      description: string;
      impact: 'high' | 'medium' | 'low';
      effort: 'high' | 'medium' | 'low';
      expectedImprovement: string;
    }>;
    visualData?: {
      scoreBreakdown: {
        technical: number;
        content: number;
        performance: number;
      };
      headingsChart: {
        h1: number; h2: number; h3: number; h4: number; h5: number; h6: number;
      };
      contentStats: {
        wordCount: number;
        imagesTotal: number;
        imagesWithoutAlt: number;
        linksInternal: number;
        linksExternal: number;
      };
      coreWebVitals?: {
        lcp: { value: number; score: number; displayValue: string };
        fid: { value: number; score: number; displayValue: string };
        cls: { value: number; score: number; displayValue: string };
      };
    };
    robotsCheck?: {
      found: boolean;
      url?: string;
      status?: number;
      hasUserAgent?: boolean;
      hasDisallow?: boolean;
      hasSitemap?: boolean;
      issues?: string[];
      warnings?: string[];
      error?: string;
    };
    sitemapCheck?: {
      found: boolean;
      urls?: Array<{
        url: string;
        status: number;
        size: string;
      }>;
      issues?: string[];
      warnings?: string[];
    };
    ssl?: {
      hasSSL: boolean;
      status?: number;
      issues?: string[];
      warnings?: string[];
      error?: string;
    };
    resourcesSpeed?: {
      loadTime: number | null;
      htmlSize?: number;
      htmlSizeKB?: number;
      responseStatus?: number;
      issues?: string[];
      warnings?: string[];
      error?: string;
    };
    mobileFriendly?: {
      isMobileFriendly: boolean;
      status: string;
      issues?: string[];
      recommendations?: string[];
      viewport?: string | null;
      hasMediaQueries?: boolean;
      loadingStatus?: string;
      resourceIssues?: any[];
      error?: string;
    };
    sslLabs?: {
      status: string;
      grade: string | null;
      hasSSL: boolean;
      score?: number;
      certificate?: {
        issuer: string;
        expiryDate: string;
        daysUntilExpiry: number | null;
      };
      protocols?: any[];
      issues?: string[];
      recommendations?: string[];
      message?: string;
      error?: string;
      rawData?: {
        grade: string;
        hasWarnings: boolean;
        isExceptional: boolean;
      };
    };
    w3cValidator?: {
      isValid: boolean;
      score: number;
      totalMessages: number;
      errors: {
        count: number;
        details: Array<{
          line?: number;
          column?: number;
          message: string;
          extract?: string;
        }>;
        categories?: {
          syntax: number;
          accessibility: number;
          seo: number;
          structure: number;
          other: number;
        };
      };
      warnings: {
        count: number;
        details: Array<{
          line?: number;
          message: string;
        }>;
      };
      issues?: string[];
      recommendations?: string[];
      summary: {
        status: string;
        quality: string;
      };
      error?: string;
    };
    securityHeaders?: {
      url: string;
      grade: string | null;
      score: number;
      headers: Record<string, string>;
      analysis: Record<string, {
        present: boolean;
        value?: string;
        score: number;
      }>;
      missing: string[];
      issues?: string[];
      recommendations?: string[];
      summary: {
        total: number;
        critical: number;
        missing: number;
        status: string;
      };
      error?: string;
    };
    linkProfile?: {
      score: number;
      maxScore: number;
      issues: string[];
      recommendations: string[];
      internal: {
        total: number;
        unique: string[];
        anchorTexts: Record<string, number>;
        distribution: Record<string, any>;
        quality: string;
      };
      external: {
        total: number;
        domains: Record<string, number>;
        nofollow: number;
        dofollow: number;
        social: string[];
        quality: string;
      };
      ratios: {
        internalToExternal: number;
        nofollowRatio: number;
        anchorDiversity: number;
      };
    };
    sitelinks?: {
      score: number;
      maxScore: number;
      status: string;
      issues: string[];
      recommendations: string[];
      navigation: {
        hasMainMenu: boolean;
        menuItemsCount: number;
        menuStructure: string;
      };
      urlStructure: {
        hasCleanUrls: boolean;
        hasLogicalHierarchy: boolean;
        avgUrlDepth: number;
      };
      linkingProfile: {
        internalLinksCount: number;
        navigationLinksCount: number;
        topSections: Array<{
          name: string;
          linkCount: number;
          urlExample: string;
        }>;
      };
    };
  };
}

const SeoAudit: React.FC = () => {
  const { t } = useTranslation();
  const { createLink } = useLocalizedLink();
  const { requireAuth, isAuthRequiredModalOpen, isAuthModalOpen, closeAuthRequiredModal, closeAuthModal, openAuthModal } = useAuthRequired();
  const { user } = useAuth();
  const [url, setUrl] = useState('');
  const [result, setResult] = useState<SeoAuditResult | null>(null);
  const [launchCount, setLaunchCount] = useState(0);
  const [selectedDevice, setSelectedDevice] = useState<'mobile' | 'desktop'>('mobile');
  const [w3cErrorsToShow, setW3cErrorsToShow] = useState(5);
  const [activeTooltip, setActiveTooltip] = useState<string | null>(null);
  const [actionPlanToShow, setActionPlanToShow] = useState(6);
  const [collapsedSections, setCollapsedSections] = useState<Set<string>>(new Set());

  // Функция переключения аккордеона
  const toggleSection = (sectionId: string) => {
    setCollapsedSections(prev => {
      const newSet = new Set(prev);
      if (newSet.has(sectionId)) {
        newSet.delete(sectionId);
      } else {
        newSet.add(sectionId);
      }
      return newSet;
    });
  };

  // Определяем текущие данные устройства с fallback
  const getCurrentDeviceData = () => {
    if (!result?.data?.webVitals) return null;
    
    // Сначала пробуем выбранное устройство
    if (result.data.webVitals[selectedDevice]) {
      return result.data.webVitals[selectedDevice];
    }
    
    // Fallback на mobile если desktop недоступен
    if (selectedDevice === 'desktop' && result.data.webVitals.mobile) {
      return result.data.webVitals.mobile;
    }
    
    // Fallback на desktop если mobile недоступен  
    if (selectedDevice === 'mobile' && result.data.webVitals.desktop) {
      return result.data.webVitals.desktop;
    }
    
    return null;
  };

  const currentDeviceData = getCurrentDeviceData();

  // Функция для показа дополнительных W3C ошибок
  const showMoreW3cErrors = () => {
    setW3cErrorsToShow(prev => prev + 5);
  };

  // Функции для управления tooltip
  const showTooltip = (tooltipId: string) => {
    setActiveTooltip(tooltipId);
  };

  const hideTooltip = () => {
    setActiveTooltip(null);
  };

  // Загружаем счетчик запусков
  useEffect(() => {
    const loadLaunchCount = async () => {
      try {
        const count = await statsService.getLaunchCount('seo-audit');
        setLaunchCount(count);
      } catch (error) {
        console.error('Ошибка загрузки счетчика:', error);
      }
    };
    loadLaunchCount();
  }, []);

  const handleAudit = async () => {
    if (!requireAuth()) return;

    if (!url.trim()) {
      alert('Пожалуйста, введите URL сайта');
      return;
    }

    // Сбрасываем количество показываемых W3C ошибок при новом аудите
    setW3cErrorsToShow(5);

    // Нормализация URL
    let normalizedUrl = url.trim();
    if (!normalizedUrl.startsWith('http://') && !normalizedUrl.startsWith('https://')) {
      normalizedUrl = 'https://' + normalizedUrl;
    }

    try {
      setResult({
        url: normalizedUrl,
        loading: true
      });

      // Увеличиваем счетчик использования
      if (user) {
        await statsService.incrementLaunchCount('seo-audit');
        setLaunchCount(prev => prev + 1);
      }

      // Вызов API для SEO анализа
      const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:8880';
      const response = await fetch(`${API_BASE}/api/tools/seo-audit`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ url: normalizedUrl })
      });

      if (!response.ok) {
        throw new Error(`Ошибка сервера: ${response.status}`);
      }

      const data = await response.json();

      console.log('🔍 SEO Audit results:', data.results);
      console.log('🔍 Web Vitals:', data.results?.webVitals);

      setResult({
        url: normalizedUrl,
        loading: false,
        data: data.results
      });

    } catch (error) {
      console.error('Ошибка при SEO анализе:', error);
      setResult({
        url: normalizedUrl,
        loading: false,
        error: error instanceof Error ? error.message : 'Неизвестная ошибка'
      });
    }
  };

  return (
    <div className="seo-audit-tool">
      {/* Header Island */}
      <div className="tool-header-island">
        <Link to={createLink('')} className="back-button">
          <img src="/icons/arrow_left.svg" alt="" />
          Все инструменты
        </Link>
        <h1 className="tool-title">{t('tools.names.seo-audit')}</h1>
        <div className="tool-header-buttons">
          <button className="tool-header-btn counter-btn" title="Счетчик запусков">
            <img src="/icons/rocket.svg" alt="" />
            <span className="counter">{launchCount}</span>
          </button>
          <button className="tool-header-btn icon-only" title="Подсказки">
            <img src="/icons/lamp.svg" alt="" />
          </button>
          <button className="tool-header-btn icon-only" title="Скриншот">
            <img src="/icons/camera.svg" alt="" />
          </button>
        </div>
      </div>

      <div className="main-workspace">
        {/* SEO Audit Input Section - структура как в SiteAudit */}
        <div className="seo-audit-row">
          <div className="seo-audit-url-container">
            <div className="seo-audit-url-wrapper">
              <input
                type="url"
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                placeholder="Введите адрес сайта для SEO анализа"
                className="seo-audit-url-field"
                onKeyPress={(e) => e.key === 'Enter' && handleAudit()}
              />
            </div>
          </div>
        </div>

        {/* Control Buttons - стандартный блок */}
        <div className="control-buttons">
          <button 
            className="action-btn primary" 
            style={{ width: '445px' }}
            onClick={handleAudit}
            disabled={result?.loading || !url.trim()}
          >
            {result?.loading ? 'Анализирую SEO...' : 'Показать результат'}
          </button>
          
          <button 
            className="action-btn secondary icon-left" 
            style={{ width: '445px' }}
            onClick={() => {/* TODO: логика копирования результата */}}
            disabled={!result?.data}
          >
            <img src="/icons/button_copy.svg" alt="" />
            Скопировать результат
          </button>
        </div>

        {/* SEO Audit Results Section - уникальный для SEO аудита */}
        {result && (
          <div className="seo-audit-results-container">
            {result.loading && (
              <div className="seo-audit-loading-state">
                <div className="loading-spinner"></div>
                <p>Анализирую SEO сайта {result.url}...</p>
                <p className="loading-note">Это может занять несколько секунд</p>
              </div>
            )}

            {result.error && (
              <div className="seo-audit-error-state">
                <h3>❌ Ошибка SEO анализа</h3>
                <p>{result.error}</p>
                <p className="error-help">Проверьте правильность URL и доступность сайта</p>
              </div>
            )}

            {result.data && (
              <div className="seo-audit-content">
                {/* Общий Health Score Dashboard - КИЛЛЕР ФИЧА */}
                {result.data.overallScore && (
                  <div className="seo-audit-dashboard">
                    <div className="seo-audit-health-score">
                      <div className="health-score-main">
                        <div className="health-score-circle">
                          <svg width="120" height="120" className="health-score-svg">
                            <circle cx="60" cy="60" r="50" className="health-score-bg"></circle>
                            <circle 
                              cx="60" 
                              cy="60" 
                              r="50" 
                              className="health-score-fill"
                              style={{
                                strokeDasharray: `${2 * Math.PI * 50}`,
                                strokeDashoffset: `${2 * Math.PI * 50 * (1 - result.data.overallScore.overall / 100)}`
                              }}
                            ></circle>
                          </svg>
                          <div className="health-score-text">
                            <span className="health-score-number">{Math.round(result.data.overallScore.overall)}</span>
                            <span className="health-score-label">SEO Health</span>
                          </div>
                        </div>
                        <div className="health-score-status">
                          <h3>
                            {result.data.overallScore.overall >= 80 ? '🚀 Отличное SEO!' : 
                             result.data.overallScore.overall >= 60 ? '⚡ Хорошее SEO' :
                             result.data.overallScore.overall >= 40 ? '⚠️ Требует улучшения' : '🔧 Много проблем'}
                          </h3>
                          <p className="health-score-description">
                            {result.data.overallScore.overall >= 80 ? 'Ваш сайт отлично оптимизирован для поисковых систем' : 
                             result.data.overallScore.overall >= 60 ? 'Хорошая основа, но есть возможности для улучшения' :
                             result.data.overallScore.overall >= 40 ? 'Необходимы базовые SEO улучшения' : 'Требуется комплексная SEO оптимизация'}
                          </p>
                        </div>
                      </div>
                      
                      {/* Детализация по категориям */}
                      <div className="health-score-breakdown">
                        <div className="score-category">
                          <div className="score-category-header">
                            <span className="score-category-icon">⚙️</span>
                            <span className="score-category-name">Техническое SEO</span>
                            <span className="score-category-value">{Math.round(result.data.overallScore.technical)}/100</span>
                          </div>
                          <div className="score-category-bar">
                            <div 
                              className="score-category-fill technical"
                              style={{ 
                                width: `${Math.round(result.data.overallScore.technical)}%`,
                                backgroundColor: getProgressColor(Math.round(result.data.overallScore.technical))
                              }}
                            ></div>
                          </div>
                        </div>
                        
                        <div className="score-category">
                          <div className="score-category-header">
                            <span className="score-category-icon">📝</span>
                            <span className="score-category-name">Качество контента</span>
                            <span className="score-category-value">{Math.round(result.data.overallScore.content)}/100</span>
                          </div>
                          <div className="score-category-bar">
                            <div 
                              className="score-category-fill content"
                              style={{ 
                                width: `${Math.round(result.data.overallScore.content)}%`,
                                backgroundColor: getProgressColor(Math.round(result.data.overallScore.content))
                              }}
                            ></div>
                          </div>
                        </div>
                        
                        <div className="score-category">
                          <div className="score-category-header">
                            <span className="score-category-icon">⚡</span>
                            <span className="score-category-name">Производительность</span>
                            <span className="score-category-value">{Math.round(result.data.overallScore.performance)}/100</span>
                          </div>
                          <div className="score-category-bar">
                            <div 
                              className="score-category-fill performance"
                              style={{ 
                                width: `${Math.round(result.data.overallScore.performance)}%`,
                                backgroundColor: getProgressColor(Math.round(result.data.overallScore.performance))
                              }}
                            ></div>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Performance Dashboard с переключателем устройств */}
                    {(result.data.webVitals?.mobile || result.data.webVitals?.desktop) && (
                      <div className="core-web-vitals-dashboard">
                        <div className="performance-header">
                          <h3>🚀 Производительность (Google PageSpeed)</h3>
                          <div className="device-toggle">
                            <button 
                              className={`device-toggle-btn ${selectedDevice === 'mobile' ? 'active' : ''} ${!result.data.webVitals?.mobile ? 'disabled' : ''}`}
                              onClick={() => setSelectedDevice('mobile')}
                              disabled={!result.data.webVitals?.mobile}
                            >
                              📱 Mobile {!result.data.webVitals?.mobile ? '(недоступно)' : ''}
                            </button>
                            <button 
                              className={`device-toggle-btn ${selectedDevice === 'desktop' ? 'active' : ''} ${!result.data.webVitals?.desktop ? 'disabled' : ''}`}
                              onClick={() => setSelectedDevice('desktop')}
                              disabled={!result.data.webVitals?.desktop}
                            >
                              💻 Desktop {!result.data.webVitals?.desktop ? '(недоступно)' : ''}
                            </button>
                          </div>
                        </div>

                        {/* Общая скорость загрузки - ВИДНОЕ МЕСТО */}
                        {currentDeviceData?.performance_score !== undefined && (
                          <div className="performance-score-main">
                            <div className="performance-score-circle">
                              <svg width="120" height="120">
                                <circle cx="60" cy="60" r="50" className="performance-score-bg"></circle>
                                <circle 
                                  cx="60" cy="60" r="50" 
                                  className={`performance-score-fill ${
                                    currentDeviceData.performance_score >= 90 ? 'excellent' : 
                                    currentDeviceData.performance_score >= 70 ? 'good' : 
                                    currentDeviceData.performance_score >= 50 ? 'average' : 'poor'
                                  }`}
                                  style={{
                                    strokeDasharray: `${2 * Math.PI * 50}`,
                                    strokeDashoffset: `${2 * Math.PI * 50 * (1 - currentDeviceData.performance_score / 100)}`
                                  }}
                                ></circle>
                              </svg>
                              <div className="performance-score-text">
                                <span className="performance-score-number">{currentDeviceData.performance_score}</span>
                                <span className="performance-score-label">Скорость</span>
                              </div>
                            </div>
                            <div className="performance-score-status">
                              <h4>
                                {currentDeviceData.performance_score >= 90 ? '🟢 Отличная скорость' : 
                                 currentDeviceData.performance_score >= 70 ? '🟡 Хорошая скорость' : 
                                 currentDeviceData.performance_score >= 50 ? '🟠 Средняя скорость' : '🔴 Медленная загрузка'}
                              </h4>
                              <p>
                                {currentDeviceData.performance_score >= 90 ? 'Ваш сайт загружается очень быстро! Пользователи будут довольны.' : 
                                 currentDeviceData.performance_score >= 70 ? 'Неплохая скорость, но есть возможности для улучшения.' : 
                                 currentDeviceData.performance_score >= 50 ? 'Скорость ниже среднего. Рекомендуется оптимизация.' : 'Критически медленная загрузка. Нужны срочные улучшения!'}
                              </p>
                            </div>
                          </div>
                        )}

                        {/* Core Web Vitals для выбранного устройства */}
                        {currentDeviceData?.core_web_vitals && (
                          <div className="web-vitals-section">
                            <h4>📊 Core Web Vitals</h4>
                            <div className="web-vitals-grid">
                              <div className="web-vital-item">
                                <span 
                                  className="web-vital-tooltip-trigger"
                                  onMouseEnter={() => showTooltip('lcp')}
                                  onMouseLeave={hideTooltip}
                                >
                                  ❓
                                </span>
                                {activeTooltip === 'lcp' && (
                                  <div className="web-vital-tooltip">
                                    <strong>Largest Contentful Paint</strong><br/>
                                    Время загрузки самого большого видимого элемента на странице. 
                                    Хороший показатель: ≤ 2.5 сек.
                                  </div>
                                )}
                                <div className="web-vital-icon">🎯</div>
                                <div className="web-vital-info">
                                  <div className="web-vital-name">LCP</div>
                                  <div className="web-vital-description">Загрузка контента</div>
                                </div>
                                <div className="web-vital-value">
                                  <span className="web-vital-number">{currentDeviceData.core_web_vitals.lcp.displayValue}</span>
                                  <div className="web-vital-score-circle">
                                    <svg width="50" height="50">
                                      <circle cx="25" cy="25" r="22" className="web-vital-bg"></circle>
                                      <circle 
                                        cx="25" cy="25" r="22" 
                                        className={`web-vital-fill ${currentDeviceData.core_web_vitals.lcp.score >= 75 ? 'good' : currentDeviceData.core_web_vitals.lcp.score >= 50 ? 'average' : 'poor'}`}
                                        style={{
                                          strokeDasharray: `${2 * Math.PI * 22}`,
                                          strokeDashoffset: `${2 * Math.PI * 22 * (1 - currentDeviceData.core_web_vitals.lcp.score / 100)}`
                                        }}
                                      ></circle>
                                    </svg>
                                    <span className="web-vital-score-text">{currentDeviceData.core_web_vitals.lcp.score}</span>
                                  </div>
                                </div>
                              </div>

                              <div className="web-vital-item">
                                <span 
                                  className="web-vital-tooltip-trigger"
                                  onMouseEnter={() => showTooltip('fid')}
                                  onMouseLeave={hideTooltip}
                                >
                                  ❓
                                </span>
                                {activeTooltip === 'fid' && (
                                  <div className="web-vital-tooltip">
                                    <strong>First Input Delay</strong><br/>
                                    Время от первого взаимодействия пользователя до ответа браузера. 
                                    Хороший показатель: ≤ 100 мс.
                                  </div>
                                )}
                                <div className="web-vital-icon">⚡</div>
                                <div className="web-vital-info">
                                  <div className="web-vital-name">FID</div>
                                  <div className="web-vital-description">Интерактивность</div>
                                </div>
                                <div className="web-vital-value">
                                  <span className="web-vital-number">{currentDeviceData.core_web_vitals.fid.displayValue}</span>
                                  <div className="web-vital-score-circle">
                                    <svg width="50" height="50">
                                      <circle cx="25" cy="25" r="22" className="web-vital-bg"></circle>
                                      <circle 
                                        cx="25" cy="25" r="22" 
                                        className={`web-vital-fill ${currentDeviceData.core_web_vitals.fid.score >= 75 ? 'good' : currentDeviceData.core_web_vitals.fid.score >= 50 ? 'average' : 'poor'}`}
                                        style={{
                                          strokeDasharray: `${2 * Math.PI * 22}`,
                                          strokeDashoffset: `${2 * Math.PI * 22 * (1 - currentDeviceData.core_web_vitals.fid.score / 100)}`
                                        }}
                                      ></circle>
                                    </svg>
                                    <span className="web-vital-score-text">{currentDeviceData.core_web_vitals.fid.score}</span>
                                  </div>
                                </div>
                              </div>

                              <div className="web-vital-item">
                                <span 
                                  className="web-vital-tooltip-trigger"
                                  onMouseEnter={() => showTooltip('cls')}
                                  onMouseLeave={hideTooltip}
                                >
                                  ❓
                                </span>
                                {activeTooltip === 'cls' && (
                                  <div className="web-vital-tooltip">
                                    <strong>Cumulative Layout Shift</strong><br/>
                                    Измеряет стабильность макета страницы. Показывает, насколько элементы 
                                    "прыгают" при загрузке. Хороший показатель: ≤ 0.1.
                                  </div>
                                )}
                                <div className="web-vital-icon">📐</div>
                                <div className="web-vital-info">
                                  <div className="web-vital-name">CLS</div>
                                  <div className="web-vital-description">Стабильность</div>
                                </div>
                                <div className="web-vital-value">
                                  <span className="web-vital-number">{currentDeviceData.core_web_vitals.cls.displayValue}</span>
                                  <div className="web-vital-score-circle">
                                    <svg width="50" height="50">
                                      <circle cx="25" cy="25" r="22" className="web-vital-bg"></circle>
                                      <circle 
                                        cx="25" cy="25" r="22" 
                                        className={`web-vital-fill ${currentDeviceData.core_web_vitals.cls.score >= 75 ? 'good' : currentDeviceData.core_web_vitals.cls.score >= 50 ? 'average' : 'poor'}`}
                                        style={{
                                          strokeDasharray: `${2 * Math.PI * 22}`,
                                          strokeDashoffset: `${2 * Math.PI * 22 * (1 - currentDeviceData.core_web_vitals.cls.score / 100)}`
                                        }}
                                      ></circle>
                                    </svg>
                                    <span className="web-vital-score-text">{currentDeviceData.core_web_vitals.cls.score}</span>
                                  </div>
                                </div>
                              </div>
                            </div>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                )}

                {/* Сбалансированная двухколоночная структура */}
                <div className="seo-audit-flex-columns">
                  {/* Левая колонка */}
                  <div className="seo-audit-column-left">
                    {/* SEO Summary */}
                    {result.data.performance && (
                      <div className="seo-audit-section">
                        <h3 
                          className="seo-audit-section-header" 
                          onClick={() => toggleSection('seo-summary')}
                          style={{ 
                            cursor: 'pointer', 
                            display: 'flex', 
                            justifyContent: 'space-between', 
                            alignItems: 'center',
                            marginBottom: collapsedSections.has('seo-summary') ? '0px' : undefined,
                            transition: 'margin-bottom 0.4s ease-in-out'
                          }}
                        >
                          📊 Общая оценка SEO
                          <img 
                            src="/icons/arrow_circle.svg" 
                            alt="" 
                            style={{ 
                              width: '20px', 
                              height: '20px',
                              transform: collapsedSections.has('seo-summary') ? 'rotate(-90deg)' : 'rotate(0deg)',
                              transition: 'transform 0.4s ease-in-out'
                            }}
                          />
                        </h3>
                        <div 
                          className="seo-audit-section-content"
                          style={{
                            overflow: 'hidden',
                            maxHeight: collapsedSections.has('seo-summary') ? '0px' : '1000px',
                            transition: 'max-height 0.4s ease-in-out',
                          }}
                        >
                        <div className="seo-audit-scores">
                          <div className="seo-audit-score-item">
                            <span className="seo-audit-score-label">Заголовок</span>
                            <div className="seo-audit-score-bar">
                              <div 
                                className="seo-audit-score-fill" 
                                style={{ 
                                  width: `${result.data.performance.title_length_score}%`,
                                  backgroundColor: getProgressColor(result.data.performance.title_length_score)
                                }}
                              ></div>
                            </div>
                            <span className="seo-audit-score-value">{result.data.performance.title_length_score}/100</span>
                          </div>
                          <div className="seo-audit-score-item">
                            <span className="seo-audit-score-label">Описание</span>
                            <div className="seo-audit-score-bar">
                              <div 
                                className="seo-audit-score-fill" 
                                style={{ 
                                  width: `${result.data.performance.description_length_score}%`,
                                  backgroundColor: getProgressColor(result.data.performance.description_length_score)
                                }}
                              ></div>
                            </div>
                            <span className="seo-audit-score-value">{result.data.performance.description_length_score}/100</span>
                          </div>
                          <div className="seo-audit-score-item">
                            <span className="seo-audit-score-label">H1 заголовок</span>
                            <div className="seo-audit-score-bar">
                              <div 
                                className="seo-audit-score-fill" 
                                style={{ 
                                  width: `${result.data.performance.h1_score}%`,
                                  backgroundColor: getProgressColor(result.data.performance.h1_score)
                                }}
                              ></div>
                            </div>
                            <span className="seo-audit-score-value">{result.data.performance.h1_score}/100</span>
                          </div>
                        </div>
                        </div>
                      </div>
                    )}

                    {/* Основные элементы страницы */}
                    <div className="seo-audit-section">
                      <h3 
                        className="seo-audit-section-header" 
                        onClick={() => toggleSection('page-elements')}
                        style={{ 
                          cursor: 'pointer', 
                          display: 'flex', 
                          justifyContent: 'space-between', 
                          alignItems: 'center',
                          marginBottom: collapsedSections.has('page-elements') ? '0px' : undefined,
                          transition: 'margin-bottom 0.4s ease-in-out'
                        }}
                      >
                        📄 Основные элементы страницы
                        <img 
                          src="/icons/arrow_circle.svg" 
                          alt="" 
                          style={{ 
                            width: '20px', 
                            height: '20px',
                            transform: collapsedSections.has('page-elements') ? 'rotate(-90deg)' : 'rotate(0deg)',
                            transition: 'transform 0.4s ease-in-out'
                          }}
                        />
                      </h3>
                      <div 
                        className="seo-audit-section-content"
                        style={{
                          overflow: 'hidden',
                          maxHeight: collapsedSections.has('page-elements') ? '0px' : '1000px',
                          transition: 'max-height 0.4s ease-in-out',
                        }}
                      >
                      
                      {/* Заголовок страницы */}
                      <div className="seo-audit-item">
                        <div className="seo-audit-item-header">
                          <span className={`seo-audit-status ${result.data.title?.isOptimal ? 'good' : 'warning'}`}>
                            {result.data.title?.isOptimal ? '✅' : '⚠️'}
                          </span>
                          <span className="seo-audit-title">Заголовок страницы</span>
                        </div>
                        <div className="seo-audit-content-block">
                          <p className="seo-audit-value">"{result.data.title?.content || 'Не найден'}"</p>
                          <p className="seo-audit-meta">
                            Длина: {result.data.title?.length || 0} символов
                            {result.data.title?.isOptimal ? 
                              ' (оптимальная длина)' : 
                              ' (рекомендуется 30-60 символов)'
                            }
                          </p>
                          {!result.data.title?.isOptimal && (
                            <p className="seo-audit-tip">💡 Заголовок помогает поисковикам понять тему страницы. Оптимальная длина 30-60 символов.</p>
                          )}
                        </div>
                      </div>

                      {/* Описание страницы */}
                      <div className="seo-audit-item">
                        <div className="seo-audit-item-header">
                          <span className={`seo-audit-status ${result.data.metaDescription?.isOptimal ? 'good' : 'warning'}`}>
                            {result.data.metaDescription?.isOptimal ? '✅' : '⚠️'}
                          </span>
                          <span className="seo-audit-title">Описание страницы</span>
                        </div>
                        <div className="seo-audit-content-block">
                          <p className="seo-audit-value">
                            {result.data.metaDescription?.content || 'Описание не найдено'}
                          </p>
                          <p className="seo-audit-meta">
                            Длина: {result.data.metaDescription?.length || 0} символов
                            {result.data.metaDescription?.isOptimal ? 
                              ' (оптимальная длина)' : 
                              ' (рекомендуется 120-160 символов)'
                            }
                          </p>
                          {!result.data.metaDescription?.isOptimal && (
                            <p className="seo-audit-tip">💡 Описание показывается в результатах поиска под заголовком. Должно быть привлекательным и информативным.</p>
                          )}
                        </div>
                      </div>
                      </div>
                    </div>

                    {/* Продвинутый анализ заголовков */}
                    {result.data.headings && (
                      <div className="seo-audit-section">
                        <h3 
                          className="seo-audit-section-header" 
                          onClick={() => toggleSection('headings-structure')}
                          style={{ 
                            cursor: 'pointer', 
                            display: 'flex', 
                            justifyContent: 'space-between', 
                            alignItems: 'center',
                            marginBottom: collapsedSections.has('headings-structure') ? '0px' : undefined,
                            transition: 'margin-bottom 0.4s ease-in-out'
                          }}
                        >
                          📋 Структура заголовков
                          <img 
                            src="/icons/arrow_circle.svg" 
                            alt="" 
                            style={{ 
                              width: '20px', 
                              height: '20px',
                              transform: collapsedSections.has('headings-structure') ? 'rotate(-90deg)' : 'rotate(0deg)',
                              transition: 'transform 0.4s ease-in-out'
                            }}
                          />
                        </h3>
                        <div 
                          className="seo-audit-section-content"
                          style={{
                            overflow: 'hidden',
                            maxHeight: collapsedSections.has('headings-structure') ? '0px' : '1000px',
                            transition: 'max-height 0.4s ease-in-out',
                          }}
                        >
                        
                        {/* H1 анализ */}
                        <div className="seo-audit-item">
                          <div className="seo-audit-item-header">
                            <span className={`seo-audit-status ${result.data.headings.h1.count === 1 ? 'good' : 'warning'}`}>
                              {result.data.headings.h1.count === 1 ? '✅' : result.data.headings.h1.count === 0 ? '❌' : '⚠️'}
                            </span>
                            <span className="seo-audit-title">H1 заголовки ({result.data.headings.h1.count})</span>
                          </div>
                          <div className="seo-audit-content-block">
                            {result.data.headings.h1.texts?.map((heading, index) => (
                              <div key={index} className="seo-audit-heading-item">
                                <p className="seo-audit-value">"{heading.text}"</p>
                                <p className="seo-audit-meta">
                                  Длина: {heading.length} символов
                                  {heading.hasKeywords && ' • Содержит ключевые слова'}
                                </p>
                              </div>
                            ))}
                            {result.data.headings.h1.issues?.map((issue, index) => (
                              <p key={index} className="seo-audit-tip">{issue}</p>
                            ))}
                          </div>
                        </div>

                        {/* Иерархия заголовков */}
                        {result.data.headings.structure && !result.data.headings.structure.isValid && (
                          <div className="seo-audit-item">
                            <div className="seo-audit-item-header">
                              <span className="seo-audit-status warning">⚠️</span>
                              <span className="seo-audit-title">Иерархия заголовков</span>
                            </div>
                            <div className="seo-audit-content-block">
                              {result.data.headings.structure.issues?.map((issue, index) => (
                                <p key={index} className="seo-audit-tip">{issue}</p>
                              ))}
                              <p className="seo-audit-tip">💡 Правильная иерархия: H1 → H2 → H3 → H4. Не пропускайте уровни заголовков.</p>
                            </div>
                          </div>
                        )}

                        {/* Обзор всех заголовков */}
                        <div className="seo-audit-item">
                          <div className="seo-audit-item-header">
                            <span className="seo-audit-status good">📊</span>
                            <span className="seo-audit-title">Обзор заголовков</span>
                          </div>
                          <div className="seo-audit-content-block">
                            <div className="seo-audit-headings-summary">
                              {['h1', 'h2', 'h3', 'h4', 'h5', 'h6'].map(level => {
                                const headingLevel = level as 'h1' | 'h2' | 'h3' | 'h4' | 'h5' | 'h6';
                                const count = result.data?.headings?.[headingLevel]?.count || 0;
                                return count > 0 ? (
                                  <div key={level} className="seo-audit-heading-level">
                                    <span className="seo-audit-heading-label">{level.toUpperCase()}</span>
                                    <span className="seo-audit-heading-count">{count}</span>
                                  </div>
                                ) : null;
                              })}
                            </div>
                          </div>
                        </div>
                        </div>
                      </div>
                    )}

                    {/* Robots.txt проверка - Level 2 */}
                    {result.data.robotsCheck && (
                      <div className="seo-audit-section">
                        <h3 
                          className="seo-audit-section-header" 
                          onClick={() => toggleSection('robots-txt')}
                          style={{ 
                            cursor: 'pointer', 
                            display: 'flex', 
                            justifyContent: 'space-between', 
                            alignItems: 'center',
                            marginBottom: collapsedSections.has('robots-txt') ? '0px' : undefined,
                            transition: 'margin-bottom 0.4s ease-in-out'
                          }}
                        >
                          🤖 Robots.txt
                          <img 
                            src="/icons/arrow_circle.svg" 
                            alt="" 
                            style={{ 
                              width: '20px', 
                              height: '20px',
                              transform: collapsedSections.has('robots-txt') ? 'rotate(-90deg)' : 'rotate(0deg)',
                              transition: 'transform 0.4s ease-in-out'
                            }}
                          />
                        </h3>
                        <div 
                          className="seo-audit-section-content"
                          style={{
                            overflow: 'hidden',
                            maxHeight: collapsedSections.has('robots-txt') ? '0px' : '1000px',
                            transition: 'max-height 0.4s ease-in-out',
                          }}
                        >
                        
                        <div className="seo-audit-item">
                          <div className="seo-audit-item-header">
                            <span className={`seo-audit-status ${result.data.robotsCheck.found ? 'good' : 'warning'}`}>
                              {result.data.robotsCheck.found ? '✅' : '❌'}
                            </span>
                            <span className="seo-audit-title">Файл robots.txt</span>
                          </div>
                          <div className="seo-audit-content-block">
                            {result.data.robotsCheck.found ? (
                              <div>
                                <p className="seo-audit-value">✅ Файл найден</p>
                                <div className="seo-audit-technical-details">
                                  <p>📍 URL: <code>{result.data.robotsCheck.url}</code></p>
                                  <p>🎯 User-agent: {result.data.robotsCheck.hasUserAgent ? '✅' : '❌'}</p>
                                  <p>🚫 Disallow правила: {result.data.robotsCheck.hasDisallow ? '✅' : '❌'}</p>
                                  <p>🗺️ Sitemap указан: {result.data.robotsCheck.hasSitemap ? '✅' : '❌'}</p>
                                </div>
                                {result.data.robotsCheck.issues && result.data.robotsCheck.issues.length > 0 && (
                                  <div className="seo-audit-issues">
                                    <h4>❌ Проблемы:</h4>
                                    {result.data.robotsCheck.issues.map((issue, i) => (
                                      <p key={i} className="seo-audit-issue">{issue}</p>
                                    ))}
                                  </div>
                                )}
                                {result.data.robotsCheck.warnings && result.data.robotsCheck.warnings.length > 0 && (
                                  <div className="seo-audit-warnings">
                                    <h4>⚠️ Предупреждения:</h4>
                                    {result.data.robotsCheck.warnings.map((warning, i) => (
                                      <p key={i} className="seo-audit-warning">{warning}</p>
                                    ))}
                                  </div>
                                )}
                              </div>
                            ) : (
                              <div>
                                <p className="seo-audit-value">Файл robots.txt не найден</p>
                                <p className="seo-audit-tip">💡 Создайте файл robots.txt для управления индексацией поисковыми системами.</p>
                              </div>
                            )}
                          </div>
                        </div>
                        </div>
                      </div>
                    )}

                    {/* Sitemap.xml проверка - Level 2 */}
                    {result.data.sitemapCheck && (
                      <div className="seo-audit-section">
                        <h3 
                          className="seo-audit-section-header" 
                          onClick={() => toggleSection('sitemap')}
                          style={{ 
                            cursor: 'pointer', 
                            display: 'flex', 
                            justifyContent: 'space-between', 
                            alignItems: 'center',
                            marginBottom: collapsedSections.has('sitemap') ? '0px' : undefined,
                            transition: 'margin-bottom 0.4s ease-in-out'
                          }}
                        >
                          🗺️ Sitemap
                          <img 
                            src="/icons/arrow_circle.svg" 
                            alt="" 
                            style={{ 
                              width: '20px', 
                              height: '20px',
                              transform: collapsedSections.has('sitemap') ? 'rotate(-90deg)' : 'rotate(0deg)',
                              transition: 'transform 0.4s ease-in-out'
                            }}
                          />
                        </h3>
                        <div 
                          className="seo-audit-section-content"
                          style={{
                            overflow: 'hidden',
                            maxHeight: collapsedSections.has('sitemap') ? '0px' : '1000px',
                            transition: 'max-height 0.4s ease-in-out',
                          }}
                        >
                        
                        <div className="seo-audit-item">
                          <div className="seo-audit-item-header">
                            <span className={`seo-audit-status ${result.data.sitemapCheck.found ? 'good' : 'warning'}`}>
                              {result.data.sitemapCheck.found ? '✅' : '❌'}
                            </span>
                            <span className="seo-audit-title">Карта сайта</span>
                          </div>
                          <div className="seo-audit-content-block">
                            {result.data.sitemapCheck.found ? (
                              <div>
                                <p className="seo-audit-value">✅ Sitemap найден</p>
                                {result.data.sitemapCheck.urls && result.data.sitemapCheck.urls.length > 0 && (
                                  <div className="sitemap-urls">
                                    <h4>📂 Найденные sitemap файлы:</h4>
                                    {result.data.sitemapCheck.urls.map((sitemap, i) => (
                                      <div key={i} className="sitemap-url">
                                        <span className="url">{sitemap.url}</span>
                                        <span className="status">Статус: {sitemap.status}</span>
                                        <span className="size">Размер: {sitemap.size}</span>
                                      </div>
                                    ))}
                                  </div>
                                )}
                                {result.data.sitemapCheck.issues && result.data.sitemapCheck.issues.length > 0 && (
                                  <div className="seo-audit-issues">
                                    <h4>❌ Проблемы:</h4>
                                    {result.data.sitemapCheck.issues.map((issue, i) => (
                                      <p key={i} className="seo-audit-issue">{issue}</p>
                                    ))}
                                  </div>
                                )}
                              </div>
                            ) : (
                              <div>
                                <p className="seo-audit-value">Sitemap не найден</p>
                                <p className="seo-audit-tip">💡 Создайте sitemap.xml для лучшей индексации страниц сайта.</p>
                              </div>
                            )}
                          </div>
                        </div>
                        </div>
                      </div>
                    )}

                    {/* Социальные сети - перенесено из правой колонки для баланса */}
                    <div className="seo-audit-section">
                      <h3 
                        className="seo-audit-section-header" 
                        onClick={() => toggleSection('social-networks')}
                        style={{ 
                          cursor: 'pointer', 
                          display: 'flex', 
                          justifyContent: 'space-between', 
                          alignItems: 'center',
                          marginBottom: collapsedSections.has('social-networks') ? '0px' : undefined,
                          transition: 'margin-bottom 0.4s ease-in-out'
                        }}
                      >
                        📱 Социальные сети
                        <img 
                          src="/icons/arrow_circle.svg" 
                          alt="" 
                          style={{ 
                            width: '20px', 
                            height: '20px',
                            transform: collapsedSections.has('social-networks') ? 'rotate(-90deg)' : 'rotate(0deg)',
                            transition: 'transform 0.4s ease-in-out'
                          }}
                        />
                      </h3>
                      <div 
                        className="seo-audit-section-content"
                        style={{
                          overflow: 'hidden',
                          maxHeight: collapsedSections.has('social-networks') ? '0px' : '1000px',
                          transition: 'max-height 0.4s ease-in-out',
                        }}
                      >
                      
                      <div className="seo-audit-item">
                        <div className="seo-audit-item-header">
                          <span className={`seo-audit-status ${result.data.openGraph?.title ? 'good' : 'warning'}`}>
                            {result.data.openGraph?.title ? '✅' : '❌'}
                          </span>
                          <span className="seo-audit-title">Карточки для соцсетей</span>
                        </div>
                        <div className="seo-audit-content-block">
                          {result.data.openGraph?.title ? (
                            <div>
                              <p className="seo-audit-value">Настроены карточки для Facebook, ВКонтакте, Telegram</p>
                              <div className="seo-audit-social-preview">
                                <p><strong>Заголовок:</strong> {result.data.openGraph.title}</p>
                                {result.data.openGraph.description && (
                                  <p><strong>Описание:</strong> {result.data.openGraph.description.substring(0, 100)}...</p>
                                )}
                                {result.data.openGraph.image && (
                                  <p><strong>Изображение:</strong> Настроено</p>
                                )}
                              </div>
                            </div>
                          ) : (
                            <div>
                              <p className="seo-audit-value">Карточки для соцсетей не настроены</p>
                              <p className="seo-audit-tip">💡 При публикации ссылки в соцсетях будет показываться стандартная карточка без картинки и описания.</p>
                            </div>
                          )}
                        </div>
                      </div>
                      </div>
                    </div>

                    {/* Продвинутый технический анализ - перенесено для баланса колонок */}
                    {result.data.technical && (
                      <div className="seo-audit-section">
                        <h3 
                          className="seo-audit-section-header" 
                          onClick={() => toggleSection('technical-analysis')}
                          style={{ 
                            cursor: 'pointer', 
                            display: 'flex', 
                            justifyContent: 'space-between', 
                            alignItems: 'center',
                            marginBottom: collapsedSections.has('technical-analysis') ? '0px' : undefined,
                            transition: 'margin-bottom 0.4s ease-in-out'
                          }}
                        >
                          🔧 Технический анализ
                          <img 
                            src="/icons/arrow_circle.svg" 
                            alt="" 
                            style={{ 
                              width: '20px', 
                              height: '20px',
                              transform: collapsedSections.has('technical-analysis') ? 'rotate(-90deg)' : 'rotate(0deg)',
                              transition: 'transform 0.4s ease-in-out'
                            }}
                          />
                        </h3>
                        <div 
                          className="seo-audit-section-content"
                          style={{
                            overflow: 'hidden',
                            maxHeight: collapsedSections.has('technical-analysis') ? '0px' : '1000px',
                            transition: 'max-height 0.4s ease-in-out',
                          }}
                        >
                        
                        <div className="seo-audit-item">
                          <div className="seo-audit-item-header">
                            <span className={`seo-audit-status ${result.data.technical.https ? 'good' : 'error'}`}>
                              {result.data.technical.https ? '✅' : '❌'}
                            </span>
                            <span className="seo-audit-title">HTTPS защита</span>
                          </div>
                          <div className="seo-audit-content-block">
                            <p className="seo-audit-value">
                              {result.data.technical.https ? 'Сайт использует HTTPS' : 'Сайт НЕ использует HTTPS'}
                            </p>
                            {!result.data.technical.https && (
                              <p className="seo-audit-tip">💡 HTTPS является обязательным фактором ранжирования в Google. Обязательно настройте SSL-сертификат.</p>
                            )}
                          </div>
                        </div>

                        <div className="seo-audit-item">
                          <div className="seo-audit-item-header">
                            <span className={`seo-audit-status ${result.data.technical.urlStructure.isClean ? 'good' : 'warning'}`}>
                              {result.data.technical.urlStructure.isClean ? '✅' : '⚠️'}
                            </span>
                            <span className="seo-audit-title">Структура URL</span>
                          </div>
                          <div className="seo-audit-content-block">
                            <p className="seo-audit-value">
                              Длина URL: {result.data.technical.urlStructure.length} символов
                            </p>
                            <p className="seo-audit-meta">
                              {result.data.technical.urlStructure.hasParameters && '• Содержит параметры '} 
                              {result.data.technical.urlStructure.hasFragment && '• Содержит фрагмент '}
                              {result.data.technical.urlStructure.isClean && '• Чистая структура'}
                            </p>
                            {!result.data.technical.urlStructure.isClean && (
                              <p className="seo-audit-tip">💡 Короткие и понятные URL лучше воспринимаются пользователями и поисковыми системами.</p>
                            )}
                          </div>
                        </div>
                        </div>
                      </div>
                    )}

                    {/* W3C Markup Validator - Level 3 */}
                    {result.data.w3cValidator && (
                      <div className="seo-audit-section">
                        <h3 
                          className="seo-audit-section-header" 
                          onClick={() => toggleSection('w3c-validation')}
                          style={{ 
                            cursor: 'pointer', 
                            display: 'flex', 
                            justifyContent: 'space-between', 
                            alignItems: 'center',
                            marginBottom: collapsedSections.has('w3c-validation') ? '0px' : undefined,
                            transition: 'margin-bottom 0.4s ease-in-out'
                          }}
                        >
                          🔍 W3C Валидация
                          <img 
                            src="/icons/arrow_circle.svg" 
                            alt="" 
                            style={{ 
                              width: '20px', 
                              height: '20px',
                              transform: collapsedSections.has('w3c-validation') ? 'rotate(-90deg)' : 'rotate(0deg)',
                              transition: 'transform 0.4s ease-in-out'
                            }}
                          />
                        </h3>
                        <div 
                          className="seo-audit-section-content"
                          style={{
                            overflow: 'hidden',
                            maxHeight: collapsedSections.has('w3c-validation') ? '0px' : '1000px',
                            transition: 'max-height 0.4s ease-in-out',
                          }}
                        >
                        
                        <div className="seo-audit-item">
                          <div className="seo-audit-item-header">
                            <span className={`seo-audit-status ${result.data.w3cValidator.isValid ? 'good' : 'error'}`}>
                              {result.data.w3cValidator.isValid ? '✅' : '❌'}
                            </span>
                            <span className="seo-audit-title">HTML Валидация</span>
                          </div>
                          <div className="seo-audit-content-block">
                            <p className="seo-audit-value">
                              📊 Статус: <span className={result.data.w3cValidator.isValid ? 'text-success' : 'text-error'}>
                                {result.data.w3cValidator.isValid ? 'Код валиден' : 'Найдены ошибки'}
                              </span>
                            </p>
                            {result.data.w3cValidator.score !== undefined && (
                              <>
                                <p className="seo-audit-meta">🎯 Оценка качества: {result.data.w3cValidator.score}/100</p>
                                <div className="seo-audit-score-item">
                                  <span className="seo-audit-score-label">Качество HTML</span>
                                  <div className="seo-audit-score-bar">
                                    <div 
                                      className="seo-audit-score-fill" 
                                      style={{ 
                                        width: `${result.data.w3cValidator.score}%`,
                                        backgroundColor: getProgressColor(result.data.w3cValidator.score)
                                      }}
                                    ></div>
                                  </div>
                                  <span className="seo-audit-score-value">{result.data.w3cValidator.score}/100</span>
                                </div>
                              </>
                            )}
                            
                            <div className="w3c-stats">
                              <div className="w3c-stat-item">
                                <span className="stat-label">❌ Ошибки:</span>
                                <span className={`stat-value ${result.data.w3cValidator.errors.count > 0 ? 'text-error' : 'text-success'}`}>
                                  {result.data.w3cValidator.errors.count}
                                </span>
                              </div>
                              <div className="w3c-stat-item">
                                <span className="stat-label">⚠️ Предупреждения:</span>
                                <span className={`stat-value ${result.data.w3cValidator.warnings.count > 0 ? 'text-warning' : 'text-success'}`}>
                                  {result.data.w3cValidator.warnings.count}
                                </span>
                              </div>
                              <div className="w3c-stat-item">
                                <span className="stat-label">📝 Всего сообщений:</span>
                                <span className="stat-value">{result.data.w3cValidator.totalMessages}</span>
                              </div>
                            </div>

                            {result.data.w3cValidator.errors.count > 0 && result.data.w3cValidator.errors.details.length > 0 && (
                              <div className="w3c-errors">
                                <h4>❌ Основные ошибки:</h4>
                                {result.data.w3cValidator.errors.details.slice(0, w3cErrorsToShow).map((error, i) => (
                                  <div key={i} className="w3c-error-item">
                                    {error.line && (
                                      <div className="error-location">Строка {error.line}{error.column ? `, колонка ${error.column}` : ''}</div>
                                    )}
                                    <div className="error-message">{error.message}</div>
                                    {error.extract && (
                                      <div className="error-extract">
                                        <code>{error.extract.trim()}</code>
                                      </div>
                                    )}
                                  </div>
                                ))}
                                {result.data.w3cValidator.errors.count > w3cErrorsToShow && (
                                  <div className="w3c-show-more">
                                    <p className="more-errors">И еще {result.data.w3cValidator.errors.count - w3cErrorsToShow} ошибок...</p>
                                    <button 
                                      className="show-more-button"
                                      onClick={showMoreW3cErrors}
                                    >
                                      Показать еще 5
                                    </button>
                                  </div>
                                )}
                              </div>
                            )}
                            
                            {result.data.w3cValidator.issues && result.data.w3cValidator.issues.length > 0 && (
                              <div className="seo-audit-issues">
                                <h4>🚨 Проблемы:</h4>
                                {result.data.w3cValidator.issues.map((issue, i) => (
                                  <p key={i} className="seo-audit-issue">{issue}</p>
                                ))}
                              </div>
                            )}
                            
                            {result.data.w3cValidator.recommendations && result.data.w3cValidator.recommendations.length > 0 && (
                              <div className="seo-audit-warnings">
                                <h4>💡 Рекомендации:</h4>
                                {result.data.w3cValidator.recommendations.map((rec, i) => (
                                  <p key={i} className="seo-audit-warning">{rec}</p>
                                ))}
                              </div>
                            )}
                            
                            {!result.data.w3cValidator.isValid && (
                              <p className="seo-audit-tip">🔧 Валидный HTML код улучшает SEO и доступность сайта!</p>
                            )}
                          </div>
                        </div>
                        </div>
                      </div>
                    )}

                    {/* Mobile-Friendly Test - Level 3 */}
                    {result.data.mobileFriendly && (
                      <div className="seo-audit-section">
                        <h3 
                          className="seo-audit-section-header" 
                          onClick={() => toggleSection('mobile-friendly')}
                          style={{ 
                            cursor: 'pointer', 
                            display: 'flex', 
                            justifyContent: 'space-between', 
                            alignItems: 'center',
                            marginBottom: collapsedSections.has('mobile-friendly') ? '0px' : undefined,
                            transition: 'margin-bottom 0.4s ease-in-out'
                          }}
                        >
                          📱 Мобильная адаптивность
                          <img 
                            src="/icons/arrow_circle.svg" 
                            alt="" 
                            style={{ 
                              width: '20px', 
                              height: '20px',
                              transform: collapsedSections.has('mobile-friendly') ? 'rotate(-90deg)' : 'rotate(0deg)',
                              transition: 'transform 0.4s ease-in-out'
                            }}
                          />
                        </h3>
                        <div 
                          className="seo-audit-section-content"
                          style={{
                            overflow: 'hidden',
                            maxHeight: collapsedSections.has('mobile-friendly') ? '0px' : '1000px',
                            transition: 'max-height 0.4s ease-in-out',
                          }}
                        >
                        
                        <div className="seo-audit-item">
                          <div className="seo-audit-item-header">
                            <span className={`seo-audit-status ${result.data.mobileFriendly.isMobileFriendly ? 'good' : 'error'}`}>
                              {result.data.mobileFriendly.isMobileFriendly ? '✅' : '❌'}
                            </span>
                            <span className="seo-audit-title">Google Mobile-Friendly Test</span>
                          </div>
                          <div className="seo-audit-content-block">
                            <p className="seo-audit-value">
                              📱 Статус: <span className={result.data.mobileFriendly.isMobileFriendly ? 'text-success' : 'text-error'}>
                                {result.data.mobileFriendly.isMobileFriendly ? 'Адаптивен для мобильных' : 'Не адаптирован для мобильных'}
                              </span>
                            </p>
                            {result.data.mobileFriendly.status && (
                              <p className="seo-audit-meta">🔍 Анализ: {result.data.mobileFriendly.status}</p>
                            )}
                            {result.data.mobileFriendly.viewport && (
                              <div className="seo-audit-technical-details">
                                <p>📏 Viewport: <code>{result.data.mobileFriendly.viewport}</code></p>
                              </div>
                            )}
                            {result.data.mobileFriendly.hasMediaQueries !== undefined && (
                              <p className="seo-audit-meta">🎨 CSS Media Queries: {result.data.mobileFriendly.hasMediaQueries ? '✅' : '❌'}</p>
                            )}
                            {result.data.mobileFriendly.issues && result.data.mobileFriendly.issues.length > 0 && (
                              <div className="seo-audit-issues">
                                <h4>❌ Проблемы мобильности:</h4>
                                {result.data.mobileFriendly.issues.map((issue, i) => (
                                  <p key={i} className="seo-audit-issue">{issue}</p>
                                ))}
                              </div>
                            )}
                            {result.data.mobileFriendly.recommendations && result.data.mobileFriendly.recommendations.length > 0 && (
                              <div className="seo-audit-warnings">
                                <h4>💡 Рекомендации:</h4>
                                {result.data.mobileFriendly.recommendations.map((rec, i) => (
                                  <p key={i} className="seo-audit-warning">{rec}</p>
                                ))}
                              </div>
                            )}
                            {!result.data.mobileFriendly.isMobileFriendly && (
                              <p className="seo-audit-tip">📱 Мобильная адаптивность критически важна - более 60% пользователей заходят с мобильных устройств!</p>
                            )}
                          </div>
                        </div>
                        </div>
                      </div>
                    )}

                    {/* SSL Labs Analysis - Level 3 */}
                    {result.data.sslLabs && (
                      <div className="seo-audit-section">
                        <h3 
                          className="seo-audit-section-header" 
                          onClick={() => toggleSection('ssl-labs')}
                          style={{ 
                            cursor: 'pointer', 
                            display: 'flex', 
                            justifyContent: 'space-between', 
                            alignItems: 'center',
                            marginBottom: collapsedSections.has('ssl-labs') ? '0px' : undefined,
                            transition: 'margin-bottom 0.4s ease-in-out'
                          }}
                        >
                          🛡️ SSL Labs анализ
                          <img 
                            src="/icons/arrow_circle.svg" 
                            alt="" 
                            style={{ 
                              width: '20px', 
                              height: '20px',
                              transform: collapsedSections.has('ssl-labs') ? 'rotate(-90deg)' : 'rotate(0deg)',
                              transition: 'transform 0.4s ease-in-out'
                            }}
                          />
                        </h3>
                        <div 
                          className="seo-audit-section-content"
                          style={{
                            overflow: 'hidden',
                            maxHeight: collapsedSections.has('ssl-labs') ? '0px' : '1000px',
                            transition: 'max-height 0.4s ease-in-out',
                          }}
                        >
                        
                        <div className="seo-audit-item">
                          <div className="seo-audit-item-header">
                            <span className={`seo-audit-status ${
                              result.data.sslLabs.grade === 'A+' || result.data.sslLabs.grade === 'A' ? 'good' : 
                              result.data.sslLabs.grade === 'B' || result.data.sslLabs.grade === 'A-' ? 'warning' : 'error'
                            }`}>
                              {result.data.sslLabs.grade === 'A+' ? '🏆' : 
                               result.data.sslLabs.grade === 'A' || result.data.sslLabs.grade === 'A-' ? '✅' : 
                               result.data.sslLabs.grade === 'B' ? '⚠️' : '❌'}
                            </span>
                            <span className="seo-audit-title">SSL сертификат</span>
                          </div>
                          <div className="seo-audit-content-block">
                            {result.data.sslLabs.grade ? (
                              <div>
                                <p className="seo-audit-value">
                                  🏅 Оценка SSL Labs: <span className={`ssl-grade grade-${result.data.sslLabs.grade?.replace('+', 'plus').replace('-', 'minus')}`}>
                                    {result.data.sslLabs.grade}
                                  </span>
                                </p>
                                {result.data.sslLabs.score && (
                                  <>
                                    <p className="seo-audit-meta">📊 Балл: {result.data.sslLabs.score}/100</p>
                                    <div className="seo-audit-score-item">
                                      <span className="seo-audit-score-label">SSL безопасность</span>
                                      <div className="seo-audit-score-bar">
                                        <div 
                                          className="seo-audit-score-fill" 
                                          style={{ 
                                            width: `${result.data.sslLabs.score}%`,
                                            backgroundColor: getProgressColor(result.data.sslLabs.score)
                                          }}
                                        ></div>
                                      </div>
                                      <span className="seo-audit-score-value">{result.data.sslLabs.score}/100</span>
                                    </div>
                                  </>
                                )}
                              </div>
                            ) : (
                              <p className="seo-audit-value">
                                🔍 Статус: {result.data.sslLabs.status === 'IN_PROGRESS' ? 'Анализ в процессе' : 
                                           result.data.sslLabs.status === 'ERROR' ? 'Ошибка анализа' : 
                                           result.data.sslLabs.status === 'FALLBACK' ? 'Базовая проверка' : 
                                           'Анализ недоступен'}
                              </p>
                            )}
                            
                            {result.data.sslLabs.certificate && (
                              <div className="seo-audit-technical-details">
                                <p>🏢 Издатель: <code>{result.data.sslLabs.certificate.issuer}</code></p>
                                {result.data.sslLabs.certificate.daysUntilExpiry !== null && (
                                  <p className={`certificate-expiry ${result.data.sslLabs.certificate.daysUntilExpiry < 30 ? 'text-error' : 
                                                                    result.data.sslLabs.certificate.daysUntilExpiry < 90 ? 'text-warning' : 'text-success'}`}>
                                    📅 Истекает через: {result.data.sslLabs.certificate.daysUntilExpiry} дней
                                  </p>
                                )}
                              </div>
                            )}
                            
                            {result.data.sslLabs.issues && result.data.sslLabs.issues.length > 0 && (
                              <div className="seo-audit-issues">
                                <h4>❌ Проблемы SSL:</h4>
                                {result.data.sslLabs.issues.map((issue, i) => (
                                  <p key={i} className="seo-audit-issue">{issue}</p>
                                ))}
                              </div>
                            )}
                            
                            {result.data.sslLabs.recommendations && result.data.sslLabs.recommendations.length > 0 && (
                              <div className="seo-audit-warnings">
                                <h4>💡 Рекомендации:</h4>
                                {result.data.sslLabs.recommendations.map((rec, i) => (
                                  <p key={i} className="seo-audit-warning">{rec}</p>
                                ))}
                              </div>
                            )}
                            
                            {result.data.sslLabs.status === 'IN_PROGRESS' && (
                              <p className="seo-audit-tip">⏳ SSL Labs анализ может занять несколько минут. Повторите проверку позже для получения детальных результатов.</p>
                            )}
                            
                            {!result.data.sslLabs.hasSSL && (
                              <p className="seo-audit-tip">🔒 HTTPS является обязательным фактором ранжирования в поисковых системах!</p>
                            )}
                          </div>
                        </div>
                        </div>
                      </div>
                    )}

                    {/* Техническое SEO */}
                    <div className="seo-audit-section">
                      <h3 
                        className="seo-audit-section-header" 
                        onClick={() => toggleSection('technical-settings')}
                        style={{ 
                          cursor: 'pointer', 
                          display: 'flex', 
                          justifyContent: 'space-between', 
                          alignItems: 'center',
                          marginBottom: collapsedSections.has('technical-settings') ? '0px' : undefined,
                          transition: 'margin-bottom 0.4s ease-in-out'
                        }}
                      >
                        ⚙️ Техническая настройка
                        <img 
                          src="/icons/arrow_circle.svg" 
                          alt="" 
                          style={{ 
                            width: '20px', 
                            height: '20px',
                            transform: collapsedSections.has('technical-settings') ? 'rotate(-90deg)' : 'rotate(0deg)',
                            transition: 'transform 0.4s ease-in-out'
                          }}
                        />
                      </h3>
                      <div 
                        className="seo-audit-section-content"
                        style={{
                          overflow: 'hidden',
                          maxHeight: collapsedSections.has('technical-settings') ? '0px' : '1000px',
                          transition: 'max-height 0.4s ease-in-out',
                        }}
                      >
                      
                      <div className="seo-audit-item">
                        <div className="seo-audit-item-header">
                          <span className={`seo-audit-status ${(result.data.structuredData?.count ?? 0) > 0 ? 'good' : 'warning'}`}>
                            {(result.data.structuredData?.count ?? 0) > 0 ? '✅' : '❌'}
                          </span>
                          <span className="seo-audit-title">Разметка для поисковиков</span>
                        </div>
                        <div className="seo-audit-content-block">
                          {(result.data.structuredData?.count ?? 0) > 0 ? (
                            <div>
                              <p className="seo-audit-value">Найдено {result.data.structuredData?.count} блоков структурированных данных</p>
                              <p className="seo-audit-tip">💡 Это помогает Google лучше понимать содержимое сайта и показывать расширенные сниппеты в поиске.</p>
                            </div>
                          ) : (
                            <div>
                              <p className="seo-audit-value">Структурированные данные не найдены</p>
                              <p className="seo-audit-tip">💡 Добавление разметки Schema.org может улучшить отображение сайта в результатах поиска.</p>
                            </div>
                          )}
                        </div>
                      </div>
                      </div>
                    </div>

                    {/* SSL и безопасность - Level 2 */}
                    {result.data.ssl && (
                      <div className="seo-audit-section">
                        <h3 
                          className="seo-audit-section-header" 
                          onClick={() => toggleSection('ssl-security')}
                          style={{ 
                            cursor: 'pointer', 
                            display: 'flex', 
                            justifyContent: 'space-between', 
                            alignItems: 'center',
                            marginBottom: collapsedSections.has('ssl-security') ? '0px' : undefined,
                            transition: 'margin-bottom 0.4s ease-in-out'
                          }}
                        >
                          🔒 SSL и безопасность
                          <img 
                            src="/icons/arrow_circle.svg" 
                            alt="" 
                            style={{ 
                              width: '20px', 
                              height: '20px',
                              transform: collapsedSections.has('ssl-security') ? 'rotate(-90deg)' : 'rotate(0deg)',
                              transition: 'transform 0.4s ease-in-out'
                            }}
                          />
                        </h3>
                        <div 
                          className="seo-audit-section-content"
                          style={{
                            overflow: 'hidden',
                            maxHeight: collapsedSections.has('ssl-security') ? '0px' : '1000px',
                            transition: 'max-height 0.4s ease-in-out',
                          }}
                        >
                        
                        <div className="seo-audit-item">
                          <div className="seo-audit-item-header">
                            <span className={`seo-audit-status ${result.data.ssl.hasSSL ? 'good' : 'error'}`}>
                              {result.data.ssl.hasSSL ? '✅' : '🔴'}
                            </span>
                            <span className="seo-audit-title">HTTPS протокол</span>
                          </div>
                          <div className="seo-audit-content-block">
                            <p className="seo-audit-value">
                              🛡️ Протокол: <span className={result.data.ssl.hasSSL ? 'text-success' : 'text-error'}>
                                {result.data.ssl.hasSSL ? 'HTTPS (Безопасно)' : 'HTTP (Небезопасно)'}
                              </span>
                            </p>
                            {result.data.ssl.status && (
                              <p className="seo-audit-meta">📊 Код ответа: {result.data.ssl.status}</p>
                            )}
                            {result.data.ssl.issues && result.data.ssl.issues.length > 0 && (
                              <div className="seo-audit-issues">
                                <h4>❌ Проблемы безопасности:</h4>
                                {result.data.ssl.issues.map((issue, i) => (
                                  <p key={i} className="seo-audit-issue">{issue}</p>
                                ))}
                              </div>
                            )}
                            {!result.data.ssl.hasSSL && (
                              <p className="seo-audit-tip">💡 HTTPS является обязательным фактором ранжирования в Google. Настройте SSL-сертификат.</p>
                            )}
                          </div>
                        </div>
                        </div>
                      </div>
                    )}

                    {/* Скорость ресурсов - Level 2 */}
                    {result.data.resourcesSpeed && (
                      <div className="seo-audit-section">
                        <h3 
                          className="seo-audit-section-header" 
                          onClick={() => toggleSection('loading-speed')}
                          style={{ 
                            cursor: 'pointer',
                            marginBottom: collapsedSections.has('loading-speed') ? '0px' : undefined,
                            transition: 'margin-bottom 0.4s ease-in-out'
                          }}
                        >
                          ⚡ Скорость загрузки
                          <img 
                            src="/icons/arrow_circle.svg" 
                            alt="" 
                            style={{ 
                              width: '20px', 
                              height: '20px',
                              marginLeft: 'auto',
                              transform: collapsedSections.has('loading-speed') ? 'rotate(-90deg)' : 'rotate(0deg)',
                              transition: 'transform 0.4s ease-in-out'
                            }} 
                          />
                        </h3>
                        <div 
                          className="seo-audit-section-content"
                          style={{
                            overflow: 'hidden',
                            maxHeight: collapsedSections.has('loading-speed') ? '0px' : '1000px',
                            transition: 'max-height 0.4s ease-in-out',
                          }}
                        >
                        
                        <div className="seo-audit-item">
                          <div className="seo-audit-item-header">
                            <span className={`seo-audit-status ${
                              result.data.resourcesSpeed.loadTime && result.data.resourcesSpeed.loadTime < 1500 ? 'good' : 
                              result.data.resourcesSpeed.loadTime && result.data.resourcesSpeed.loadTime < 3000 ? 'warning' : 'error'
                            }`}>
                              {result.data.resourcesSpeed.loadTime && result.data.resourcesSpeed.loadTime < 1500 ? '✅' : 
                               result.data.resourcesSpeed.loadTime && result.data.resourcesSpeed.loadTime < 3000 ? '⚠️' : '🔴'}
                            </span>
                            <span className="seo-audit-title">Время загрузки HTML</span>
                          </div>
                          <div className="seo-audit-content-block">
                            {result.data.resourcesSpeed.loadTime && (
                              <p className="seo-audit-value">⏱️ Время загрузки: {result.data.resourcesSpeed.loadTime}ms</p>
                            )}
                            {result.data.resourcesSpeed.htmlSizeKB && (
                              <p className="seo-audit-meta">📦 Размер HTML: {result.data.resourcesSpeed.htmlSizeKB}KB</p>
                            )}
                            <div className="resources-grid">
                              {result.data.resourcesSpeed.loadTime && (
                                <div className="resource-metric">
                                  <span className="metric-label">⏱️ HTML</span>
                                  <span className="metric-value">{result.data.resourcesSpeed.loadTime}ms</span>
                                </div>
                              )}
                              {result.data.resourcesSpeed.htmlSizeKB && (
                                <div className="resource-metric">
                                  <span className="metric-label">📦 Размер</span>
                                  <span className="metric-value">{result.data.resourcesSpeed.htmlSizeKB}KB</span>
                                </div>
                              )}
                            </div>
                            {result.data.resourcesSpeed.issues && result.data.resourcesSpeed.issues.length > 0 && (
                              <div className="seo-audit-issues">
                                <h4>❌ Проблемы производительности:</h4>
                                {result.data.resourcesSpeed.issues.map((issue, i) => (
                                  <p key={i} className="seo-audit-issue">{issue}</p>
                                ))}
                              </div>
                            )}
                            {result.data.resourcesSpeed.warnings && result.data.resourcesSpeed.warnings.length > 0 && (
                              <div className="seo-audit-warnings">
                                <h4>⚠️ Рекомендации:</h4>
                                {result.data.resourcesSpeed.warnings.map((warning, i) => (
                                  <p key={i} className="seo-audit-warning">{warning}</p>
                                ))}
                              </div>
                            )}
                            {result.data.resourcesSpeed.loadTime && result.data.resourcesSpeed.loadTime > 3000 && (
                              <p className="seo-audit-tip">💡 Время загрузки влияет на рейтинг в поисковых системах. Оптимизируйте размер и код страницы.</p>
                            )}
                          </div>
                        </div>
                      </div>
                        </div>
                    )}
                  </div>

                  {/* Правая колонка */}
                  <div className="seo-audit-column-right">
                    {/* Изображения и ссылки */}
                    {result.data.images && (
                      <div className="seo-audit-section">
                        <h3 
                          className="seo-audit-section-header" 
                          onClick={() => toggleSection('content-media')}
                          style={{ 
                            cursor: 'pointer',
                            marginBottom: collapsedSections.has('content-media') ? '0px' : undefined,
                            transition: 'margin-bottom 0.4s ease-in-out'
                          }}
                        >
                          🖼️ Контент и медиа
                          <img 
                            src="/icons/arrow_circle.svg" 
                            alt="" 
                            style={{ 
                              width: '20px', 
                              height: '20px',
                              marginLeft: 'auto',
                              transform: collapsedSections.has('content-media') ? 'rotate(-90deg)' : 'rotate(0deg)',
                              transition: 'transform 0.4s ease-in-out'
                            }} 
                          />
                        </h3>
                        <div 
                          className="seo-audit-section-content"
                          style={{
                            overflow: 'hidden',
                            maxHeight: collapsedSections.has('content-media') ? '0px' : '2000px',
                            transition: 'max-height 0.4s ease-in-out',
                          }}
                        >
                        
                        <div className="seo-audit-item">
                          <div className="seo-audit-item-header">
                            <span className={`seo-audit-status ${result.data.images.withoutAlt === 0 ? 'good' : 'warning'}`}>
                              {result.data.images.withoutAlt === 0 ? '✅' : '⚠️'}
                            </span>
                            <span className="seo-audit-title">Alt-тексты изображений</span>
                          </div>
                          <div className="seo-audit-content-block">
                            <p className="seo-audit-value">
                              Всего изображений: {result.data.images.total}
                              {result.data.images.withoutAlt > 0 && (
                                `, без alt-текста: ${result.data.images.withoutAlt}`
                              )}
                            </p>
                            {result.data.performance?.images_alt_score !== undefined && (
                              <div className="seo-audit-score-item">
                                <span className="seo-audit-score-label">Оценка ALT</span>
                                <div className="seo-audit-score-bar">
                                  <div 
                                    className="seo-audit-score-fill" 
                                    style={{ 
                                      width: `${result.data.performance.images_alt_score}%`,
                                      backgroundColor: getProgressColor(result.data.performance.images_alt_score)
                                    }}
                                  ></div>
                                </div>
                                <span className="seo-audit-score-value">{result.data.performance.images_alt_score}/100</span>
                              </div>
                            )}
                            {result.data.images.withoutAlt > 0 && (
                              <p className="seo-audit-tip">💡 Alt-тексты помогают поисковикам понять содержимое изображений и важны для доступности сайта.</p>
                            )}
                          </div>
                        </div>

                        {/* Анализ контента */}
                        {result.data.performance && (
                          <div className="seo-audit-item">
                            <div className="seo-audit-item-header">
                              <span className={`seo-audit-status ${(result.data.performance.wordCount || 0) >= 300 ? 'good' : 'warning'}`}>
                                {(result.data.performance.wordCount || 0) >= 300 ? '✅' : '⚠️'}
                              </span>
                              <span className="seo-audit-title">Объем контента</span>
                            </div>
                            <div className="seo-audit-content-block">
                              <p className="seo-audit-value">
                                Слов на странице: {result.data.performance.wordCount || 0}
                              </p>
                              <p className="seo-audit-meta">
                                Размер HTML: {result.data.performance.htmlSizeKB || 0} KB
                                {result.data.performance.textToHtmlRatio && 
                                  `, соотношение текст/код: ${result.data.performance.textToHtmlRatio}%`
                                }
                              </p>
                              {result.data.performance.content_score !== undefined && (
                                <div className="seo-audit-score-item">
                                  <span className="seo-audit-score-label">Контент</span>
                                  <div className="seo-audit-score-bar">
                                    <div 
                                      className="seo-audit-score-fill" 
                                      style={{ 
                                        width: `${result.data.performance.content_score}%`,
                                        backgroundColor: getProgressColor(result.data.performance.content_score)
                                      }}
                                    ></div>
                                  </div>
                                  <span className="seo-audit-score-value">{result.data.performance.content_score}/100</span>
                                </div>
                              )}
                              {(result.data.performance.wordCount || 0) < 300 && (
                                <p className="seo-audit-tip">💡 Рекомендуется минимум 300 слов для хорошего ранжирования в поисковых системах.</p>
                              )}
                            </div>
                          </div>
                        )}
                      </div>
                        </div>
                    )}

                    {/* Анализ ключевых слов */}
                    {result.data.keywordAnalysis && (
                      <div className="seo-audit-section">
                        <h3>🎯 Анализ ключевых слов</h3>
                        
                        <div className="seo-audit-item">
                          <div className="seo-audit-item-header">
                            <span className="seo-audit-status good">📊</span>
                            <span className="seo-audit-title">Плотность ключевых слов</span>
                          </div>
                          
                          <div className="keyword-zones-info">
                            <div className="keyword-zone">
                              <div className="keyword-zone-color" style={{ backgroundColor: '#F59E0B' }}></div>
                              <span className="keyword-zone-text">&lt; 0,5% — встречается редко (мало для SEO)</span>
                            </div>
                            <div className="keyword-zone">
                              <div className="keyword-zone-color" style={{ backgroundColor: '#10B981' }}></div>
                              <span className="keyword-zone-text">0,5-3% — оптимальная зона</span>
                            </div>
                            <div className="keyword-zone">
                              <div className="keyword-zone-color" style={{ backgroundColor: '#EF4444' }}></div>
                              <span className="keyword-zone-text">&gt; 3% — может быть переспамлено</span>
                            </div>
                          </div>
                          
                          <div className="seo-audit-content-block">
                            {Object.entries(result.data.keywordAnalysis.keywordDensity || {}).map(([keyword, data]) => (
                              <div key={keyword} className="seo-audit-keyword-item">
                                <div className="seo-audit-keyword-header">
                                  <span className="seo-audit-keyword-name">"{keyword}"</span>
                                  <span className="seo-audit-keyword-stats">{data.count} раз ({data.density}%)</span>
                                </div>
                                <div className="seo-audit-keyword-bar">
                                  <div 
                                    className="seo-audit-keyword-fill" 
                                    style={{ 
                                      width: `${Math.min((data.density / 5) * 100, 100)}%`,
                                      backgroundColor: getKeywordColor(data.density)
                                    }}
                                  ></div>
                                </div>
                                <div className="keyword-scale-labels">
                                  <span className="scale-label">0%</span>
                                  <span className="scale-label">0,3%</span>
                                  <span className="scale-label">1,5%</span>
                                  <span className="scale-label">2,5%</span>
                                  <span className="scale-label">3,5%</span>
                                  <span className="scale-label">4,5%</span>
                                  <span className="scale-label">5%+</span>
                                </div>
                              </div>
                            ))}
                            {result.data.keywordAnalysis.recommendations.length > 0 && (
                              <div className="seo-audit-recommendations">
                                {result.data.keywordAnalysis.recommendations?.map((rec, index) => (
                                  <p key={index} className="seo-audit-tip">{rec}</p>
                                ))}
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Анализ ссылочного профиля */}
                    {result.data.linkProfile && (
                      <div className="seo-audit-section">
                        <h3 
                          className="seo-audit-section-header" 
                          onClick={() => toggleSection('link-profile')}
                          style={{ 
                            cursor: 'pointer',
                            marginBottom: collapsedSections.has('link-profile') ? '0px' : undefined,
                            transition: 'margin-bottom 0.4s ease-in-out'
                          }}
                        >
                          🔗 Ссылочный профиль
                          <img 
                            src="/icons/arrow_circle.svg" 
                            alt="" 
                            style={{ 
                              width: '20px', 
                              height: '20px',
                              marginLeft: 'auto',
                              transform: collapsedSections.has('link-profile') ? 'rotate(-90deg)' : 'rotate(0deg)',
                              transition: 'transform 0.4s ease-in-out'
                            }} 
                          />
                        </h3>
                        <div 
                          className="seo-audit-section-content"
                          style={{
                            overflow: 'hidden',
                            maxHeight: collapsedSections.has('link-profile') ? '0px' : '3000px',
                            transition: 'max-height 0.4s ease-in-out',
                          }}
                        >
                        
                        <div className="seo-audit-info-block">
                          <p><strong>Анализ ссылочного профиля</strong> помогает оценить качество внутренней и внешней перелинковки сайта:</p>
                          <ul>
                            <li><strong>Внутренние ссылки</strong> - ссылки между страницами вашего сайта, улучшают навигацию и распределение веса</li>
                            <li><strong>Внешние ссылки</strong> - ссылки на другие сайты, должны быть качественными и релевантными</li>
                            <li><strong>Анкорный текст</strong> - текст ссылок, влияет на понимание контента поисковыми системами</li>
                          </ul>
                        </div>
                        
                        <div className="seo-audit-item">
                          <div className="seo-audit-item-header">
                            <span className={`seo-audit-status ${
                              result.data.linkProfile.score >= 80 ? 'good' : 
                              result.data.linkProfile.score >= 50 ? 'warning' : 'error'
                            }`}>
                              {result.data.linkProfile.score >= 80 ? '🏆' : 
                               result.data.linkProfile.score >= 50 ? '👍' : '📈'}
                            </span>
                            <span className="seo-audit-title">Качество ссылок</span>
                          </div>
                          <div className="seo-audit-content-block">
                            <p className="seo-audit-value">
                              📊 Оценка ссылочного профиля: <span className={
                                result.data.linkProfile.score >= 80 ? 'text-success' : 
                                result.data.linkProfile.score >= 50 ? 'text-warning' : 'text-error'
                              }>
                                {result.data.linkProfile.score}/{result.data.linkProfile.maxScore}
                              </span>
                            </p>
                            
                            <div className="seo-audit-score-item">
                              <span className="seo-audit-score-label">Ссылочный профиль</span>
                              <div className="seo-audit-score-bar">
                                <div 
                                  className="seo-audit-score-fill" 
                                  style={{ 
                                    width: `${result.data.linkProfile.score}%`,
                                    backgroundColor: getProgressColor(result.data.linkProfile.score)
                                  }}
                                ></div>
                              </div>
                              <span className="seo-audit-score-value">{result.data.linkProfile.score}/100</span>
                            </div>

                            <div className="link-profile-stats">
                              <div className="link-stat-section">
                                <h5>🔗 Внутренние ссылки</h5>
                                <p className="link-stat-description">
                                  <small>Внутренние ссылки соединяют страницы вашего сайта и помогают поисковым системам понять структуру сайта</small>
                                </p>
                                <div className="link-stats-grid">
                                  <div className="link-stat-item">
                                    <span className="stat-label">📊 Всего внутренних ссылок:</span>
                                    <span className={`stat-value ${result.data.linkProfile.internal.total >= 10 ? 'text-success' : 'text-warning'}`}>
                                      {result.data.linkProfile.internal.total}
                                    </span>
                                  </div>
                                  <div className="link-stat-item">
                                    <span className="stat-label">🔗 Уникальных URL адресов:</span>
                                    <span className="stat-value">{result.data.linkProfile.internal.unique.length}</span>
                                  </div>
                                  <div className="link-stat-item">
                                    <span className="stat-label">📝 Разных текстов ссылок:</span>
                                    <span className="stat-value">{result.data.linkProfile.ratios.anchorDiversity}</span>
                                  </div>
                                  <div className="link-stat-item">
                                    <span className="stat-label">⭐ Общее качество:</span>
                                    <span className={`stat-value quality-${result.data.linkProfile.internal.quality}`}>
                                      {result.data.linkProfile.internal.quality === 'excellent' ? '🏆 Отлично' :
                                       result.data.linkProfile.internal.quality === 'good' ? '✅ Хорошо' :
                                       result.data.linkProfile.internal.quality === 'fair' ? '⚠️ Средне' : '❌ Плохо'}
                                    </span>
                                  </div>
                                </div>
                              </div>

                              <div className="link-stat-section">
                                <h5>🌐 Внешние ссылки</h5>
                                <p className="link-stat-description">
                                  <small>Ссылки на внешние сайты должны быть релевантными и вести на качественные ресурсы</small>
                                </p>
                                <div className="link-stats-grid">
                                  <div className="link-stat-item">
                                    <span className="stat-label">🌐 Всего внешних ссылок:</span>
                                    <span className="stat-value">{result.data.linkProfile.external.total}</span>
                                  </div>
                                  <div className="link-stat-item">
                                    <span className="stat-label">🏢 Разных сайтов:</span>
                                    <span className="stat-value">{Object.keys(result.data.linkProfile.external.domains).length}</span>
                                  </div>
                                  <div className="link-stat-item">
                                    <span className="stat-label">🚫 Nofollow ссылок:</span>
                                    <span className="stat-value">{result.data.linkProfile.external.nofollow} ({result.data.linkProfile.ratios.nofollowRatio}%)</span>
                                  </div>
                                  <div className="link-stat-item">
                                    <span className="stat-label">✅ Dofollow ссылок:</span>
                                    <span className="stat-value">{result.data.linkProfile.external.dofollow}</span>
                                  </div>
                                </div>
                              </div>

                              <div className="link-ratios">
                                <h5>📊 Ключевые соотношения</h5>
                                <p className="link-stat-description">
                                  <small>Рекомендуемое соотношение внутренних к внешним ссылкам: 3:1 или больше</small>
                                </p>
                                <div className="ratio-item">
                                  <span className="ratio-label">⚖️ Баланс внутренних к внешним ссылкам:</span>
                                  <span className={`ratio-value ${result.data.linkProfile.ratios.internalToExternal >= 3 ? 'text-success' : 
                                                                 result.data.linkProfile.ratios.internalToExternal >= 1.5 ? 'text-warning' : 'text-error'}`}>
                                    {result.data.linkProfile.ratios.internalToExternal}:1
                                  </span>
                                </div>
                              </div>
                            </div>

                            {Object.keys(result.data.linkProfile.external.domains).length > 0 && (
                              <div className="external-domains">
                                <h5>🌍 Топ внешних доменов:</h5>
                                <div className="domains-list">
                                  {Object.entries(result.data.linkProfile.external.domains)
                                    .sort(([,a], [,b]) => b - a)
                                    .slice(0, 5)
                                    .map(([domain, count]) => (
                                    <div key={domain} className="domain-item">
                                      <span className="domain-name">{domain}</span>
                                      <span className="domain-count">{count} ссылок</span>
                                    </div>
                                  ))}
                                </div>
                              </div>
                            )}

                            {result.data.linkProfile.external.social.length > 0 && (
                              <div className="social-links">
                                <h5>📱 Социальные сети:</h5>
                                <div className="social-list">
                                  {result.data.linkProfile.external.social.slice(0, 3).map((social, index) => (
                                    <span key={index} className="social-badge">{social}</span>
                                  ))}
                                </div>
                              </div>
                            )}

                            {result.data.linkProfile.issues.length > 0 && (
                              <div className="link-profile-issues">
                                <h5>⚠️ Проблемы:</h5>
                                {result.data.linkProfile.issues.map((issue, index) => (
                                  <p key={index} className="seo-audit-error">{issue}</p>
                                ))}
                              </div>
                            )}

                            {result.data.linkProfile.recommendations.length > 0 && (
                              <div className="link-profile-recommendations">
                                <h5>💡 Рекомендации:</h5>
                                {result.data.linkProfile.recommendations.map((rec, index) => (
                                  <p key={index} className="seo-audit-tip">{rec}</p>
                                ))}
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                        </div>
                    )}

                    {/* Анализ потенциала Sitelinks */}
                    {result.data.sitelinks && (
                      <div className="seo-audit-section">
                        <h3 
                          className="seo-audit-section-header" 
                          onClick={() => toggleSection('sitelinks')}
                          style={{ 
                            cursor: 'pointer',
                            marginBottom: collapsedSections.has('sitelinks') ? '0px' : undefined,
                            transition: 'margin-bottom 0.4s ease-in-out'
                          }}
                        >
                          🔗 Потенциал для Sitelinks
                          <img 
                            src="/icons/arrow_circle.svg" 
                            alt="" 
                            style={{ 
                              width: '20px', 
                              height: '20px',
                              marginLeft: 'auto',
                              transform: collapsedSections.has('sitelinks') ? 'rotate(-90deg)' : 'rotate(0deg)',
                              transition: 'transform 0.4s ease-in-out'
                            }} 
                          />
                        </h3>
                        <div 
                          className="seo-audit-section-content"
                          style={{
                            overflow: 'hidden',
                            maxHeight: collapsedSections.has('sitelinks') ? '0px' : '2500px',
                            transition: 'max-height 0.4s ease-in-out',
                          }}
                        >
                        
                        <div className="seo-audit-item">
                          <div className="seo-audit-item-header">
                            <span className={`seo-audit-status ${
                              result.data.sitelinks.status === 'excellent' ? 'good' : 
                              result.data.sitelinks.status === 'good' ? 'warning' : 'error'
                            }`}>
                              {result.data.sitelinks.status === 'excellent' ? '🏆' : 
                               result.data.sitelinks.status === 'good' ? '👍' : '📈'}
                            </span>
                            <span className="seo-audit-title">Готовность к Sitelinks</span>
                          </div>
                          <div className="seo-audit-content-block">
                            <p className="seo-audit-value">
                              📊 Оценка потенциала: <span className={
                                result.data.sitelinks.score >= 80 ? 'text-success' : 
                                result.data.sitelinks.score >= 50 ? 'text-warning' : 'text-error'
                              }>
                                {result.data.sitelinks.score}/{result.data.sitelinks.maxScore}
                              </span>
                            </p>
                            
                            <div className="seo-audit-score-item">
                              <span className="seo-audit-score-label">Sitelinks потенциал</span>
                              <div className="seo-audit-score-bar">
                                <div 
                                  className="seo-audit-score-fill" 
                                  style={{ 
                                    width: `${result.data.sitelinks.score}%`,
                                    backgroundColor: getProgressColor(result.data.sitelinks.score)
                                  }}
                                ></div>
                              </div>
                              <span className="seo-audit-score-value">{result.data.sitelinks.score}/100</span>
                            </div>

                            <div className="sitelinks-analysis">
                              <div className="sitelinks-metric">
                                <span className="metric-label">🧭 Навигация:</span>
                                <span className={`metric-value ${result.data.sitelinks.navigation.hasMainMenu ? 'text-success' : 'text-error'}`}>
                                  {result.data.sitelinks.navigation.hasMainMenu ? 
                                    `${result.data.sitelinks.navigation.menuItemsCount} пунктов меню` : 
                                    'Меню не найдено'
                                  }
                                </span>
                              </div>
                              
                              <div className="sitelinks-metric">
                                <span className="metric-label">🔗 Внутренние ссылки:</span>
                                <span className="metric-value">
                                  {result.data.sitelinks.linkingProfile.internalLinksCount}
                                  {result.data.sitelinks.linkingProfile.navigationLinksCount > 0 && 
                                    ` (навигационных: ${result.data.sitelinks.linkingProfile.navigationLinksCount})`
                                  }
                                </span>
                              </div>
                              
                              <div className="sitelinks-metric">
                                <span className="metric-label">📂 Средняя глубина URL:</span>
                                <span className={`metric-value ${result.data.sitelinks.urlStructure.avgUrlDepth <= 3 ? 'text-success' : 'text-warning'}`}>
                                  {result.data.sitelinks.urlStructure.avgUrlDepth} уровня
                                </span>
                              </div>
                            </div>

                            {result.data.sitelinks.linkingProfile.topSections.length > 0 && (
                              <div className="sitelinks-sections">
                                <h5>📁 Основные разделы сайта:</h5>
                                <div className="sections-list">
                                  {result.data.sitelinks.linkingProfile.topSections.slice(0, 6).map((section, index) => (
                                    <div key={index} className="section-item">
                                      <span className="section-name">/{section.name}</span>
                                      <span className="section-count">{section.linkCount} ссылок</span>
                                    </div>
                                  ))}
                                </div>
                                <p className="seo-audit-tip">
                                  💡 Эти разделы имеют наибольший потенциал для показа в Sitelinks
                                </p>
                              </div>
                            )}

                            {result.data.sitelinks.issues.length > 0 && (
                              <div className="sitelinks-issues">
                                <h5>⚠️ Проблемы:</h5>
                                {result.data.sitelinks.issues.map((issue, index) => (
                                  <p key={index} className="seo-audit-error">{issue}</p>
                                ))}
                              </div>
                            )}

                            {result.data.sitelinks.recommendations.length > 0 && (
                              <div className="sitelinks-recommendations">
                                <h5>💡 Рекомендации:</h5>
                                {result.data.sitelinks.recommendations.map((rec, index) => (
                                  <p key={index} className="seo-audit-tip">{rec}</p>
                                ))}
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                        </div>
                    )}

                    {/* Security Headers Analysis - Level 3 */}
                    {result.data.securityHeaders && (
                      <div className="seo-audit-section">
                        <h3 
                          className="seo-audit-section-header" 
                          onClick={() => toggleSection('security-headers')}
                          style={{ 
                            cursor: 'pointer',
                            marginBottom: collapsedSections.has('security-headers') ? '0px' : undefined,
                            transition: 'margin-bottom 0.4s ease-in-out'
                          }}
                        >
                          🛡️ Заголовки безопасности
                          <img 
                            src="/icons/arrow_circle.svg" 
                            alt="" 
                            style={{ 
                              width: '20px', 
                              height: '20px',
                              marginLeft: 'auto',
                              transform: collapsedSections.has('security-headers') ? 'rotate(-90deg)' : 'rotate(0deg)',
                              transition: 'transform 0.4s ease-in-out'
                            }} 
                          />
                        </h3>
                        <div 
                          className="seo-audit-section-content"
                          style={{
                            overflow: 'hidden',
                            maxHeight: collapsedSections.has('security-headers') ? '0px' : '2000px',
                            transition: 'max-height 0.4s ease-in-out',
                          }}
                        >
                        
                        <div className="seo-audit-item">
                          <div className="seo-audit-item-header">
                            <span className={`seo-audit-status ${
                              result.data.securityHeaders.grade === 'A+' || result.data.securityHeaders.grade === 'A' ? 'good' : 
                              result.data.securityHeaders.grade === 'B' || result.data.securityHeaders.grade === 'C' ? 'warning' : 'error'
                            }`}>
                              {result.data.securityHeaders.grade === 'A+' ? '🏆' : 
                               result.data.securityHeaders.grade === 'A' ? '✅' : 
                               result.data.securityHeaders.grade === 'B' || result.data.securityHeaders.grade === 'C' ? '⚠️' : '❌'}
                            </span>
                            <span className="seo-audit-title">Security Headers</span>
                          </div>
                          <div className="seo-audit-content-block">
                            {result.data.securityHeaders.grade ? (
                              <div>
                                <p className="seo-audit-value">
                                  🏅 Оценка безопасности: <span className={`security-grade grade-${result.data.securityHeaders.grade?.replace('+', 'plus')}`}>
                                    {result.data.securityHeaders.grade}
                                  </span>
                                </p>
                                <p className="seo-audit-meta">📊 Балл: {result.data.securityHeaders.score}/100</p>
                                <div className="seo-audit-score-item">
                                  <span className="seo-audit-score-label">Безопасность</span>
                                  <div className="seo-audit-score-bar">
                                    <div 
                                      className="seo-audit-score-fill" 
                                      style={{ 
                                        width: `${result.data.securityHeaders.score}%`,
                                        backgroundColor: getProgressColor(result.data.securityHeaders.score)
                                      }}
                                    ></div>
                                  </div>
                                  <span className="seo-audit-score-value">{result.data.securityHeaders.score}/100</span>
                                </div>
                              </div>
                            ) : (
                              <p className="seo-audit-value">🔍 Статус: {result.data.securityHeaders.summary.status}</p>
                            )}
                            
                            <div className="security-summary">
                              <div className="security-stat">
                                <span className="stat-label">🛡️ Настроено:</span>
                                <span className="stat-value">{result.data.securityHeaders.summary.total}</span>
                              </div>
                              <div className="security-stat">
                                <span className="stat-label">🚨 Критичных:</span>
                                <span className="stat-value">{result.data.securityHeaders.summary.critical}</span>
                              </div>
                              <div className="security-stat">
                                <span className="stat-label">❌ Отсутствует:</span>
                                <span className="stat-value">{result.data.securityHeaders.summary.missing}</span>
                              </div>
                            </div>

                            {result.data.securityHeaders.missing && result.data.securityHeaders.missing.length > 0 && (
                              <div className="security-missing">
                                <h4>❌ Отсутствующие заголовки:</h4>
                                <div className="missing-headers-grid">
                                  {result.data.securityHeaders.missing.slice(0, 6).map((header, i) => (
                                    <span key={i} className="missing-header-tag">{header}</span>
                                  ))}
                                </div>
                              </div>
                            )}
                            
                            {Object.keys(result.data.securityHeaders.headers).length > 0 && (
                              <div className="security-present">
                                <h4>✅ Настроенные заголовки:</h4>
                                <div className="present-headers-list">
                                  {Object.keys(result.data.securityHeaders.headers).map((header, i) => (
                                    <div key={i} className="present-header-item">
                                      <span className="header-name">{header}</span>
                                      <span className="header-status">✓</span>
                                    </div>
                                  ))}
                                </div>
                              </div>
                            )}
                            
                            {result.data.securityHeaders.issues && result.data.securityHeaders.issues.length > 0 && (
                              <div className="seo-audit-issues">
                                <h4>🚨 Проблемы безопасности:</h4>
                                {result.data.securityHeaders.issues.map((issue, i) => (
                                  <p key={i} className="seo-audit-issue">{issue}</p>
                                ))}
                              </div>
                            )}
                            
                            {result.data.securityHeaders.recommendations && result.data.securityHeaders.recommendations.length > 0 && (
                              <div className="seo-audit-warnings">
                                <h4>💡 Рекомендации:</h4>
                                {result.data.securityHeaders.recommendations.slice(0, 4).map((rec, i) => (
                                  <p key={i} className="seo-audit-warning">{rec}</p>
                                ))}
                              </div>
                            )}
                            
                            {result.data.securityHeaders.score < 50 && (
                              <p className="seo-audit-tip">🔒 Заголовки безопасности критически важны для защиты пользователей и SEO!</p>
                            )}
                          </div>
                        </div>
                      </div>
                        </div>
                    )}
                  </div>
                </div>

                {/* Action Plan - Персонализированные рекомендации */}
                {result.data.actionPlan && result.data.actionPlan.length > 0 && (
                  <div className="seo-audit-action-plan">
                    <h3>🎯 Персональный план действий</h3>
                    <div className="action-plan-grid">
                      {result.data.actionPlan.slice(0, actionPlanToShow).map((action, index) => (
                        <div key={index} className={`action-plan-item priority-${action.priority}`}>
                          <div className="action-plan-header">
                            <span className={`action-priority-badge ${action.priority}`}>
                              {action.priority === 'critical' ? '🔥 Критическое' : 
                               action.priority === 'important' ? '⚡ Важное' : '💡 Рекомендуемое'}
                            </span>
                            <span className="action-category">{action.category}</span>
                          </div>
                          <h4 className="action-task">{action.task}</h4>
                          <p className="action-description">{action.description}</p>
                          <div className="action-metrics">
                            <div className="action-metric">
                              <span className="action-metric-label">Влияние:</span>
                              <span className={`action-metric-value impact-${action.impact}`}>
                                {action.impact === 'high' ? 'Высокое' : action.impact === 'medium' ? 'Среднее' : 'Низкое'}
                              </span>
                            </div>
                            <div className="action-metric">
                              <span className="action-metric-label">Сложность:</span>
                              <span className={`action-metric-value effort-${action.effort}`}>
                                {action.effort === 'low' ? 'Легко' : action.effort === 'medium' ? 'Средне' : 'Сложно'}
                              </span>
                            </div>
                          </div>
                          <div className="action-improvement">
                            <span className="action-improvement-label">Ожидаемый результат:</span>
                            <span className="action-improvement-value">{action.expectedImprovement}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                    {result.data.actionPlan.length > 6 && (
                      <div className="action-plan-controls">
                        <button
                          className="show-more-button"
                          onClick={() => setActionPlanToShow(prev => prev === 6 ? (result.data?.actionPlan?.length || 6) : 6)}
                        >
                          {actionPlanToShow === 6 
                            ? `Показать все рекомендации (${result.data.actionPlan.length})` 
                            : 'Показать топ-6'}
                        </button>
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Модальные окна */}
      <AuthRequiredModal 
        isOpen={isAuthRequiredModalOpen}
        onClose={closeAuthRequiredModal}
        onLoginClick={openAuthModal}
      />
      
      <AuthModal 
        isOpen={isAuthModalOpen}
        onClose={closeAuthModal}
      />
    </div>
  );
};

export default SeoAudit;