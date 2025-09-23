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
                              style={{ width: `${Math.round(result.data.overallScore.technical)}%` }}
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
                              style={{ width: `${Math.round(result.data.overallScore.content)}%` }}
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
                              style={{ width: `${Math.round(result.data.overallScore.performance)}%` }}
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
                                <div className="web-vital-icon">🎯</div>
                                <div className="web-vital-info">
                                  <div className="web-vital-name">LCP</div>
                                  <div className="web-vital-description">Загрузка контента</div>
                                </div>
                                <div className="web-vital-value">
                                  <span className="web-vital-number">{currentDeviceData.core_web_vitals.lcp.displayValue}</span>
                                  <div className="web-vital-score-circle">
                                    <svg width="40" height="40">
                                      <circle cx="20" cy="20" r="18" className="web-vital-bg"></circle>
                                      <circle 
                                        cx="20" cy="20" r="18" 
                                        className={`web-vital-fill ${currentDeviceData.core_web_vitals.lcp.score >= 75 ? 'good' : currentDeviceData.core_web_vitals.lcp.score >= 50 ? 'average' : 'poor'}`}
                                        style={{
                                          strokeDasharray: `${2 * Math.PI * 18}`,
                                          strokeDashoffset: `${2 * Math.PI * 18 * (1 - currentDeviceData.core_web_vitals.lcp.score / 100)}`
                                        }}
                                      ></circle>
                                    </svg>
                                    <span className="web-vital-score-text">{currentDeviceData.core_web_vitals.lcp.score}</span>
                                  </div>
                                </div>
                              </div>

                              <div className="web-vital-item">
                                <div className="web-vital-icon">⚡</div>
                                <div className="web-vital-info">
                                  <div className="web-vital-name">FID</div>
                                  <div className="web-vital-description">Интерактивность</div>
                                </div>
                                <div className="web-vital-value">
                                  <span className="web-vital-number">{currentDeviceData.core_web_vitals.fid.displayValue}</span>
                                  <div className="web-vital-score-circle">
                                    <svg width="40" height="40">
                                      <circle cx="20" cy="20" r="18" className="web-vital-bg"></circle>
                                      <circle 
                                        cx="20" cy="20" r="18" 
                                        className={`web-vital-fill ${currentDeviceData.core_web_vitals.fid.score >= 75 ? 'good' : currentDeviceData.core_web_vitals.fid.score >= 50 ? 'average' : 'poor'}`}
                                        style={{
                                          strokeDasharray: `${2 * Math.PI * 18}`,
                                          strokeDashoffset: `${2 * Math.PI * 18 * (1 - currentDeviceData.core_web_vitals.fid.score / 100)}`
                                        }}
                                      ></circle>
                                    </svg>
                                    <span className="web-vital-score-text">{currentDeviceData.core_web_vitals.fid.score}</span>
                                  </div>
                                </div>
                              </div>

                              <div className="web-vital-item">
                                <div className="web-vital-icon">📐</div>
                                <div className="web-vital-info">
                                  <div className="web-vital-name">CLS</div>
                                  <div className="web-vital-description">Стабильность</div>
                                </div>
                                <div className="web-vital-value">
                                  <span className="web-vital-number">{currentDeviceData.core_web_vitals.cls.displayValue}</span>
                                  <div className="web-vital-score-circle">
                                    <svg width="40" height="40">
                                      <circle cx="20" cy="20" r="18" className="web-vital-bg"></circle>
                                      <circle 
                                        cx="20" cy="20" r="18" 
                                        className={`web-vital-fill ${currentDeviceData.core_web_vitals.cls.score >= 75 ? 'good' : currentDeviceData.core_web_vitals.cls.score >= 50 ? 'average' : 'poor'}`}
                                        style={{
                                          strokeDasharray: `${2 * Math.PI * 18}`,
                                          strokeDashoffset: `${2 * Math.PI * 18 * (1 - currentDeviceData.core_web_vitals.cls.score / 100)}`
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

                {/* Двухколоночная структура как раньше */}
                <div className="seo-audit-columns">
                  {/* Левая колонка */}
                  <div className="seo-audit-column-left">
                    {/* SEO Summary */}
                    {result.data.performance && (
                      <div className="seo-audit-section">
                        <h3>📊 Общая оценка SEO</h3>
                        <div className="seo-audit-scores">
                          <div className="seo-audit-score-item">
                            <span className="seo-audit-score-label">Заголовок</span>
                            <div className="seo-audit-score-bar">
                              <div 
                                className="seo-audit-score-fill" 
                                style={{ width: `${result.data.performance.title_length_score}%` }}
                              ></div>
                            </div>
                            <span className="seo-audit-score-value">{result.data.performance.title_length_score}/100</span>
                          </div>
                          <div className="seo-audit-score-item">
                            <span className="seo-audit-score-label">Описание</span>
                            <div className="seo-audit-score-bar">
                              <div 
                                className="seo-audit-score-fill" 
                                style={{ width: `${result.data.performance.description_length_score}%` }}
                              ></div>
                            </div>
                            <span className="seo-audit-score-value">{result.data.performance.description_length_score}/100</span>
                          </div>
                          <div className="seo-audit-score-item">
                            <span className="seo-audit-score-label">H1 заголовок</span>
                            <div className="seo-audit-score-bar">
                              <div 
                                className="seo-audit-score-fill" 
                                style={{ width: `${result.data.performance.h1_score}%` }}
                              ></div>
                            </div>
                            <span className="seo-audit-score-value">{result.data.performance.h1_score}/100</span>
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Основные элементы страницы */}
                    <div className="seo-audit-section">
                      <h3>📄 Основные элементы страницы</h3>
                      
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

                    {/* Продвинутый анализ заголовков */}
                    {result.data.headings && (
                      <div className="seo-audit-section">
                        <h3>📋 Структура заголовков</h3>
                        
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
                    )}
                  </div>

                  {/* Правая колонка */}
                  <div className="seo-audit-column-right">
                    {/* Социальные сети */}
                    <div className="seo-audit-section">
                      <h3>📱 Социальные сети</h3>
                      
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

                    {/* Техническое SEO */}
                    <div className="seo-audit-section">
                      <h3>⚙️ Техническая настройка</h3>
                      
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

                    {/* Изображения и ссылки */}
                    {result.data.images && (
                      <div className="seo-audit-section">
                        <h3>🖼️ Контент и медиа</h3>
                        
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
                                    style={{ width: `${result.data.performance.images_alt_score}%` }}
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
                                      style={{ width: `${result.data.performance.content_score}%` }}
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
                    )}

                    {/* Продвинутый технический анализ */}
                    {result.data.technical && (
                      <div className="seo-audit-section">
                        <h3>🔧 Технический анализ</h3>
                        
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
                                      width: `${Math.min(data.density * 33.33, 100)}%`,
                                      backgroundColor: data.density >= 0.5 && data.density <= 3 ? '#10B981' : 
                                                     data.density < 0.5 ? '#F59E0B' : '#EF4444'
                                    }}
                                  ></div>
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
                  </div>
                </div>

                {/* Action Plan - Персонализированные рекомендации */}
                {result.data.actionPlan && result.data.actionPlan.length > 0 && (
                  <div className="seo-audit-action-plan">
                    <h3>🎯 Персональный план действий</h3>
                    <div className="action-plan-grid">
                      {result.data.actionPlan.slice(0, 6).map((action, index) => (
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