import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useAuthRequired } from '../hooks/useAuthRequired';
import { useAuth } from '../contexts/AuthContext';
import { useLocalizedLink } from '../hooks/useLanguageFromUrl';
import { statsService } from '../utils/statsService';
import AuthRequiredModal from '../components/AuthRequiredModal';
import AuthModal from '../components/AuthModal';
import './SiteAudit.css';
import '../styles/tool-pages.css';

interface AuditResult {
  url: string;
  loading: boolean;
  error?: string;
  data?: {
    basic: {
      title: string;
      description: string;
      favicon: string;
    };
    technologies: {
      cms?: string;
      cmsVersion?: string;
      framework?: string[];
      language?: string[];
      database?: string[];
      analytics?: string[];
      security?: string[];
      cloudPlatform?: string;
      cssFramework?: string[];
      cssPreprocessor?: string[];
      staticGenerator?: string[];
      buildTool?: string[];
      microFramework?: string[];
      ecommerce?: string[];
    };
    analytics: {
      googleAnalytics?: boolean;
      googleTagManager?: boolean;
      facebookPixel?: boolean;
      metaPixel?: boolean;
      yandexMetrica?: boolean;
      hotjar?: boolean;
      clarity?: boolean;
      mailchimp?: boolean;
      convertkit?: boolean;
      klaviyo?: boolean;
      intercom?: boolean;
      zendesk?: boolean;
      tawkTo?: boolean;
      crisp?: boolean;
      optimizely?: boolean;
      vwo?: boolean;
      googleOptimize?: boolean;
      crazyEgg?: boolean;
      fullstory?: boolean;
      mouseflow?: boolean;
    };
    visual: {
      imagesCount?: number;
      imagesWithoutAlt?: number;
      imagesWithEmptyAlt?: number;
      cssFiles?: number;
      jsFiles?: number;
      inlineStyles?: number;
      fonts?: Array<{name: string}>;
      colors?: string[];
      logo?: string;
      favicon?: string;
      icons?: string[];
      videos?: number;
      audio?: number;
      svgs?: number;
    };
    hosting: {
      ssl?: boolean;
      sslGrade?: string;
      tlsVersion?: string;
      certificateAuthority?: string;
      webServer?: string;
      hostingProvider?: string;
      cloudflare?: boolean;
      cdn?: string[];
      httpVersion?: string;
      compression?: string[];
      securityHeaders?: Record<string, boolean>;
      serverLocation?: {
        ip?: string;
        country?: string;
        city?: string;
        region?: string;
        flag?: string;
      };
    };
    social: {
      facebook?: string;
      instagram?: string;
      twitter?: string;
      linkedin?: string;
      youtube?: string;
      telegram?: string;
      whatsapp?: string;
      viber?: string;
    };
    contact: {
      phones: string[];
      emails: string[];
    };
    domain?: {
      name?: string;
      tld?: string;
      subdomain?: string;
      registrar?: string;
      registrarUrl?: string;
      organization?: string;
      organizationLocal?: string;
      city?: string;
      country?: string;
      countryCode?: string;
      nameservers?: string[];
      creationDate?: string;
      expirationDate?: string;
      updatedDate?: string;
      dnssec?: string;
      status?: string[];
      redirects?: Array<{
        from: string;
        to: string;
        type: string;
      }>;
      wwwRedirect?: string;
    };
    performance: {
      loadTime?: number;
      pageSize?: number;
      pageSizeKB?: number;
      requests?: number;
    };
  };
}

const SiteAudit: React.FC = () => {
  const { t } = useTranslation();
  const { createLink } = useLocalizedLink();
  const { requireAuth, isAuthRequiredModalOpen, isAuthModalOpen, closeAuthRequiredModal, closeAuthModal, openAuthModal } = useAuthRequired();
  const { user } = useAuth();
  const [url, setUrl] = useState('');
  const [result, setResult] = useState<AuditResult | null>(null);
  const [launchCount, setLaunchCount] = useState(0);
  const [copiedColorIndex, setCopiedColorIndex] = useState<number | null>(null);
  
  // Protocol selector states
  const [protocol, setProtocol] = useState('https://');
  const [protocolDropdownOpen, setProtocolDropdownOpen] = useState(false);

  // Загружаем счетчик запусков
  useEffect(() => {
    const loadLaunchCount = async () => {
      try {
        const count = await statsService.getLaunchCount('site-audit');
        setLaunchCount(count);
      } catch (error) {
        console.error('Ошибка загрузки счетчика:', error);
      }
    };
    loadLaunchCount();
  }, []);

  // Protocol handling functions
  const handleUrlChange = (value: string) => {
    // Автоматическое определение протокола
    if (value.startsWith('https://')) {
      handleProtocolSelect('https://');
      setUrl(value.substring(8));
    } else if (value.startsWith('http://')) {
      handleProtocolSelect('http://');
      setUrl(value.substring(7));
    } else {
      setUrl(value);
    }
  };

  const handleProtocolToggle = () => {
    setProtocolDropdownOpen(!protocolDropdownOpen);
  };

  const handleProtocolSelect = (selectedProtocol: string) => {
    setProtocol(selectedProtocol);
    setProtocolDropdownOpen(false);
  };

  const handlePaste = async () => {
    try {
      const text = await navigator.clipboard.readText();
      handleUrlChange(text);
    } catch (err) {
      console.error('Ошибка при вставке:', err);
    }
  };

  // Закрытие выпадающего списка при клике вне его области
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (protocolDropdownOpen) {
        const protocolSelector = document.querySelector('.site-audit-protocol-selector');
        if (protocolSelector && !protocolSelector.contains(event.target as Node)) {
          setProtocolDropdownOpen(false);
        }
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [protocolDropdownOpen]);

  const handleAudit = async () => {
    if (!requireAuth()) return;

    if (!url.trim()) {
      alert('Пожалуйста, введите URL сайта');
      return;
    }

    // Формирование полного URL с выбранным протоколом
    const fullUrl = protocol + url.trim();

    try {
      setResult({
        url: fullUrl,
        loading: true
      });

      // Увеличиваем счетчик использования
      if (user) {
        await statsService.incrementLaunchCount('site-audit');
      }

      // Вызов API для анализа сайта
      const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:8880';
      const response = await fetch(`${API_BASE}/api/tools/site-audit`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ url: fullUrl })
      });

      if (!response.ok) {
        throw new Error(`Ошибка сервера: ${response.status}`);
      }

      const data = await response.json();
      console.log('Backend response:', data.results?.visual);

      setResult({
        url: fullUrl,
        loading: false,
        data: data.results
      });

    } catch (error) {
      console.error('Ошибка при анализе сайта:', error);
      setResult({
        url: fullUrl,
        loading: false,
        error: error instanceof Error ? error.message : 'Неизвестная ошибка'
      });
    }
  };

  // Функция копирования цвета
  const handleColorCopy = async (color: string, index: number) => {
    try {
      await navigator.clipboard.writeText(color);
      setCopiedColorIndex(index);
      
      // Убираем индикатор копирования через 2 секунды
      setTimeout(() => {
        setCopiedColorIndex(null);
      }, 2000);
      
    } catch (err) {
      console.error('Ошибка копирования:', err);
    }
  };

  // Функция скачивания изображения
  const handleImageDownload = async (imageUrl: string, filename: string) => {
    console.log('Попытка скачивания:', imageUrl, filename);
    try {
      const response = await fetch(imageUrl, {
        mode: 'cors',
        credentials: 'omit'
      });
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = filename;
      link.style.display = 'none';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
      console.log('Скачивание успешно:', filename);
    } catch (err) {
      console.error('Ошибка скачивания:', err);
      alert(`Не удалось скачать файл: ${err instanceof Error ? err.message : 'Неизвестная ошибка'}`);
    }
  };

  // Функция копирования URL
  const handleCopyUrl = async (url: string) => {
    console.log('Копирование URL:', url);
    try {
      await navigator.clipboard.writeText(url);
      console.log('URL скопирован в буфер обмена');
      // Можно добавить toast уведомление
    } catch (err) {
      console.error('Ошибка копирования:', err);
      // Fallback для старых браузеров
      const textArea = document.createElement('textarea');
      textArea.value = url;
      document.body.appendChild(textArea);
      textArea.select();
      document.execCommand('copy');
      document.body.removeChild(textArea);
    }
  };

  return (
    <div className="site-audit-tool">
      {/* Header Island */}
      <div className="tool-header-island">
        <Link to={createLink('')} className="back-button">
          <img src="/icons/arrow_left.svg" alt="" />
          Все инструменты
        </Link>
        <h1 className="tool-title">{t('tools.names.site-audit')}</h1>
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
        {/* Audit Input Section - структура как в UtmGeneratorTool */}
        <div className="audit-row">
          <div className="audit-url-container">
            <div className="audit-url-wrapper">
              <div className="site-audit-protocol-selector">
                <button 
                  className="site-audit-protocol-toggle"
                  onClick={handleProtocolToggle}
                  type="button"
                >
                  <span>{protocol}</span>
                  <span className="site-audit-protocol-arrow">▼</span>
                </button>
                {protocolDropdownOpen && (
                  <div className="site-audit-protocol-dropdown">
                    <div 
                      className={`site-audit-protocol-option ${protocol === 'https://' ? 'selected' : ''}`}
                      onClick={() => handleProtocolSelect('https://')}
                    >
                      https://
                    </div>
                    <div 
                      className={`site-audit-protocol-option ${protocol === 'http://' ? 'selected' : ''}`}
                      onClick={() => handleProtocolSelect('http://')}
                    >
                      http://
                    </div>
                  </div>
                )}
              </div>
              <div className="input-field-wrapper">
                <input
                  type="text"
                  value={url}
                  onChange={(e) => handleUrlChange(e.target.value)}
                  placeholder="example.com"
                  className="audit-url-field"
                  onKeyPress={(e) => e.key === 'Enter' && handleAudit()}
                />
                <button className="paste-button" onClick={handlePaste}>
                  <img src="/icons/button_paste.svg" alt="" />
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Control Buttons - стандартный блок из других инструментов */}
        <div className="control-buttons">
          <button 
            className="action-btn primary" 
            style={{ width: '445px' }}
            onClick={handleAudit}
            disabled={result?.loading || !url.trim()}
          >
            {result?.loading ? 'Анализирую...' : 'Показать результат'}
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

        {/* Audit Results Section - уникальный для аудита */}
        {result && (
          <div className="audit-results-container">
            {result.loading && (
              <div className="audit-loading-state">
                <div className="loading-spinner"></div>
                <p>Анализирую сайт {result.url}...</p>
                <p className="loading-note">Это может занять несколько секунд</p>
              </div>
            )}

            {result.error && (
              <div className="audit-error-state">
                <h3>❌ Ошибка анализа</h3>
                <p>{result.error}</p>
                <p className="error-help">Проверьте правильность URL и доступность сайта</p>
              </div>
            )}

            {result.data && (
              <div className="audit-content">
                {/* Двухколоночная структура */}
                <div className="audit-columns">
                  {/* Левая колонка */}
                  <div className="audit-column-left">
                    {/* Основная информация */}
                    {result.data.basic && (
                  <div className="audit-section">
                    <h3>📄 Основная информация</h3>
                    <div className="info-grid">
                      <div className="info-item">
                        <span className="info-label">Заголовок:</span>
                        <span className="info-value">{result.data.basic.title || 'Не найден'}</span>
                      </div>
                      <div className="info-item">
                        <span className="info-label">Описание:</span>
                        <span className="info-value">{result.data.basic.description || 'Не найдено'}</span>
                      </div>
                    </div>
                  </div>
                )}

                {/* Технологии */}
                {result.data.technologies && (
                  <div className="audit-section">
                    <h3>🔧 Технологии и разработка</h3>
                    <div className="tech-categories">
                      
                      {/* CMS */}
                      {result.data.technologies.cms && (
                        <div className="tech-category">
                          <span className="tech-category-title">
                            <span className="tech-category-icon">📝</span>
                            Система управления
                          </span>
                          <span className="tech-category-value">
                            {result.data.technologies.cms}
                            {result.data.technologies.cmsVersion && ` v${result.data.technologies.cmsVersion}`}
                          </span>
                        </div>
                      )}

                      {/* Web Frameworks */}
                      {result.data.technologies.framework && result.data.technologies.framework.length > 0 && (
                        <div className="tech-category">
                          <span className="tech-category-title">
                            <span className="tech-category-icon">⚛️</span>
                            Фреймворки
                          </span>
                          <span className="tech-category-value">
                            {result.data.technologies.framework.join(', ')}
                          </span>
                        </div>
                      )}

                      {/* Programming Languages */}
                      {result.data.technologies.language && result.data.technologies.language.length > 0 && (
                        <div className="tech-category">
                          <span className="tech-category-title">
                            <span className="tech-category-icon">💻</span>
                            Языки программирования
                          </span>
                          <span className="tech-category-value">
                            {result.data.technologies.language.join(', ')}
                          </span>
                        </div>
                      )}

                      {/* Cloud Platform */}
                      {result.data.technologies.cloudPlatform && (
                        <div className="tech-category">
                          <span className="tech-category-title">
                            <span className="tech-category-icon">☁️</span>
                            Облачная платформа
                          </span>
                          <span className="tech-category-value">
                            {result.data.technologies.cloudPlatform}
                          </span>
                        </div>
                      )}

                      {/* CSS Frameworks */}
                      {result.data.technologies.cssFramework && result.data.technologies.cssFramework.length > 0 && (
                        <div className="tech-category">
                          <span className="tech-category-title">
                            <span className="tech-category-icon">🎨</span>
                            CSS фреймворки
                          </span>
                          <span className="tech-category-value">
                            {result.data.technologies.cssFramework.join(', ')}
                          </span>
                        </div>
                      )}

                      {/* CSS Preprocessors */}
                      {result.data.technologies.cssPreprocessor && result.data.technologies.cssPreprocessor.length > 0 && (
                        <div className="tech-category">
                          <span className="tech-category-title">
                            <span className="tech-category-icon">🎭</span>
                            CSS препроцессоры
                          </span>
                          <span className="tech-category-value">
                            {result.data.technologies.cssPreprocessor.join(', ')}
                          </span>
                        </div>
                      )}

                      {/* Static Site Generators */}
                      {result.data.technologies.staticGenerator && result.data.technologies.staticGenerator.length > 0 && (
                        <div className="tech-category">
                          <span className="tech-category-title">
                            <span className="tech-category-icon">🏗️</span>
                            Статические генераторы
                          </span>
                          <span className="tech-category-value">
                            {result.data.technologies.staticGenerator.join(', ')}
                          </span>
                        </div>
                      )}

                      {/* Build Tools */}
                      {result.data.technologies.buildTool && result.data.technologies.buildTool.length > 0 && (
                        <div className="tech-category">
                          <span className="tech-category-title">
                            <span className="tech-category-icon">🔨</span>
                            Инструменты сборки
                          </span>
                          <span className="tech-category-value">
                            {result.data.technologies.buildTool.join(', ')}
                          </span>
                        </div>
                      )}

                      {/* Micro Frameworks */}
                      {result.data.technologies.microFramework && result.data.technologies.microFramework.length > 0 && (
                        <div className="tech-category">
                          <span className="tech-category-title">
                            <span className="tech-category-icon">🧩</span>
                            Микрофреймворки
                          </span>
                          <span className="tech-category-value">
                            {result.data.technologies.microFramework.join(', ')}
                          </span>
                        </div>
                      )}

                      {/* Database */}
                      {result.data.technologies.database && result.data.technologies.database.length > 0 && (
                        <div className="tech-category">
                          <span className="tech-category-title">
                            <span className="tech-category-icon">🗄️</span>
                            Базы данных
                          </span>
                          <span className="tech-category-value">
                            {result.data.technologies.database.join(', ')}
                          </span>
                        </div>
                      )}

                      {/* E-commerce */}
                      {result.data.technologies.ecommerce && result.data.technologies.ecommerce.length > 0 && (
                        <div className="tech-category">
                          <span className="tech-category-title">
                            <span className="tech-category-icon">🛒</span>
                            E-commerce платформы:
                          </span>
                          <span className="tech-category-value">
                            {result.data.technologies.ecommerce.join(', ')}
                          </span>
                        </div>
                      )}

                      {/* Если технологий не найдено */}
                      {!result.data.technologies.cms && 
                       (!result.data.technologies.framework || result.data.technologies.framework.length === 0) &&
                       (!result.data.technologies.language || result.data.technologies.language.length === 0) &&
                       (!result.data.technologies.cssFramework || result.data.technologies.cssFramework.length === 0) &&
                       !result.data.technologies.cloudPlatform && (
                        <div className="tech-empty">
                          <p>🔍 Не удалось определить используемые технологии</p>
                          <small>Сайт может использовать нестандартную конфигурацию или статическую генерацию</small>
                        </div>
                      )}

                    </div>
                  </div>
                )}

                {/* Аналитика */}
                {result.data.analytics && (
                  <div className="audit-section">
                    <h3>📊 Аналитика и трекинг</h3>
                    <div className="analytics-categories">
                      
                      {/* Веб-аналитика */}
                      {(result.data.analytics.googleAnalytics || result.data.analytics.googleTagManager || result.data.analytics.yandexMetrica) && (
                        <div className="analytics-category">
                          <h4 className="analytics-category-title">📈 Веб-аналитика</h4>
                          <div className="analytics-badges">
                            {result.data.analytics.googleAnalytics && (
                              <div className="analytics-badge web-analytics">
                                <span className="analytics-icon">📊</span>
                                <span className="analytics-name">Google Analytics</span>
                              </div>
                            )}
                            {result.data.analytics.googleTagManager && (
                              <div className="analytics-badge web-analytics">
                                <span className="analytics-icon">🏷️</span>
                                <span className="analytics-name">Google Tag Manager</span>
                              </div>
                            )}
                            {result.data.analytics.yandexMetrica && (
                              <div className="analytics-badge web-analytics">
                                <span className="analytics-icon">📐</span>
                                <span className="analytics-name">Яндекс.Метрика</span>
                              </div>
                            )}
                          </div>
                        </div>
                      )}

                      {/* Социальная аналитика */}
                      {(result.data.analytics.facebookPixel || result.data.analytics.metaPixel) && (
                        <div className="analytics-category">
                          <h4 className="analytics-category-title">📱 Социальная аналитика</h4>
                          <div className="analytics-badges">
                            {result.data.analytics.facebookPixel && (
                              <div className="analytics-badge social">
                                <span className="analytics-icon">👥</span>
                                <span className="analytics-name">Facebook Pixel</span>
                              </div>
                            )}
                            {result.data.analytics.metaPixel && (
                              <div className="analytics-badge social">
                                <span className="analytics-icon">🎯</span>
                                <span className="analytics-name">Meta Pixel</span>
                              </div>
                            )}
                          </div>
                        </div>
                      )}

                      {/* Тепловые карты */}
                      {(result.data.analytics.hotjar || result.data.analytics.crazyEgg || result.data.analytics.fullstory || result.data.analytics.mouseflow || result.data.analytics.clarity) && (
                        <div className="analytics-category">
                          <h4 className="analytics-category-title">🔥 Тепловые карты</h4>
                          <div className="analytics-badges">
                            {result.data.analytics.hotjar && (
                              <div className="analytics-badge heatmaps">
                                <span className="analytics-icon">🔥</span>
                                <span className="analytics-name">Hotjar</span>
                              </div>
                            )}
                            {result.data.analytics.crazyEgg && (
                              <div className="analytics-badge heatmaps">
                                <span className="analytics-icon">👁️</span>
                                <span className="analytics-name">Crazy Egg</span>
                              </div>
                            )}
                            {result.data.analytics.fullstory && (
                              <div className="analytics-badge heatmaps">
                                <span className="analytics-icon">📹</span>
                                <span className="analytics-name">FullStory</span>
                              </div>
                            )}
                            {result.data.analytics.mouseflow && (
                              <div className="analytics-badge heatmaps">
                                <span className="analytics-icon">🖱️</span>
                                <span className="analytics-name">Mouseflow</span>
                              </div>
                            )}
                            {result.data.analytics.clarity && (
                              <div className="analytics-badge heatmaps">
                                <span className="analytics-icon">🔍</span>
                                <span className="analytics-name">Microsoft Clarity</span>
                              </div>
                            )}
                          </div>
                        </div>
                      )}

                      {/* Чаты и поддержка */}
                      {(result.data.analytics.intercom || result.data.analytics.zendesk || result.data.analytics.tawkTo || result.data.analytics.crisp) && (
                        <div className="analytics-category">
                          <h4 className="analytics-category-title">💬 Чаты и поддержка</h4>
                          <div className="analytics-badges">
                            {result.data.analytics.intercom && (
                              <div className="analytics-badge support">
                                <span className="analytics-icon">💬</span>
                                <span className="analytics-name">Intercom</span>
                              </div>
                            )}
                            {result.data.analytics.zendesk && (
                              <div className="analytics-badge support">
                                <span className="analytics-icon">🎧</span>
                                <span className="analytics-name">Zendesk</span>
                              </div>
                            )}
                            {result.data.analytics.tawkTo && (
                              <div className="analytics-badge support">
                                <span className="analytics-icon">💭</span>
                                <span className="analytics-name">Tawk.to</span>
                              </div>
                            )}
                            {result.data.analytics.crisp && (
                              <div className="analytics-badge support">
                                <span className="analytics-icon">💙</span>
                                <span className="analytics-name">Crisp</span>
                              </div>
                            )}
                          </div>
                        </div>
                      )}

                      {/* Email маркетинг */}
                      {(result.data.analytics.mailchimp || result.data.analytics.convertkit || result.data.analytics.klaviyo) && (
                        <div className="analytics-category">
                          <h4 className="analytics-category-title">📧 Email маркетинг</h4>
                          <div className="analytics-badges">
                            {result.data.analytics.mailchimp && (
                              <div className="analytics-badge email">
                                <span className="analytics-icon">📧</span>
                                <span className="analytics-name">Mailchimp</span>
                              </div>
                            )}
                            {result.data.analytics.convertkit && (
                              <div className="analytics-badge email">
                                <span className="analytics-icon">✉️</span>
                                <span className="analytics-name">ConvertKit</span>
                              </div>
                            )}
                            {result.data.analytics.klaviyo && (
                              <div className="analytics-badge email">
                                <span className="analytics-icon">📮</span>
                                <span className="analytics-name">Klaviyo</span>
                              </div>
                            )}
                          </div>
                        </div>
                      )}

                      {/* A/B тестирование */}
                      {(result.data.analytics.optimizely || result.data.analytics.vwo || result.data.analytics.googleOptimize) && (
                        <div className="analytics-category">
                          <h4 className="analytics-category-title">🧪 A/B тестирование</h4>
                          <div className="analytics-badges">
                            {result.data.analytics.optimizely && (
                              <div className="analytics-badge testing">
                                <span className="analytics-icon">🧪</span>
                                <span className="analytics-name">Optimizely</span>
                              </div>
                            )}
                            {result.data.analytics.vwo && (
                              <div className="analytics-badge testing">
                                <span className="analytics-icon">⚗️</span>
                                <span className="analytics-name">VWO</span>
                              </div>
                            )}
                            {result.data.analytics.googleOptimize && (
                              <div className="analytics-badge testing">
                                <span className="analytics-icon">🔬</span>
                                <span className="analytics-name">Google Optimize</span>
                              </div>
                            )}
                          </div>
                        </div>
                      )}

                    </div>
                  </div>
                )}

                {/* SEO-анализ */}
                <div className="audit-section">
                  <h3>🔍 SEO-анализ</h3>
                  <div className="seo-recommendation">
                    <p className="recommendation-text">
                      Для подробного SEO-анализа сайта воспользуйтесь нашим специализированным инструментом
                    </p>
                    <Link 
                      to={createLink('/seo-audit')} 
                      className="recommendation-button"
                    >
                      🚀 Запустить SEO Аудит
                    </Link>
                  </div>
                </div>

                {/* Визуальные ресурсы */}
                {result.data.visual && (
                  <div className="audit-section">
                    <h3>🎨 Визуальные ресурсы</h3>
                    <div className="visual-resources">
                      {/* Шрифты */}
                      {result.data.visual.fonts && result.data.visual.fonts.length > 0 && (
                        <div className="visual-resource-card">
                          <div className="resource-header">
                            <span className="resource-icon">✏️</span>
                            <span className="resource-title">Шрифты</span>
                          </div>
                          <div className="resource-content">
                            {result.data.visual.fonts.map((font, index) => (
                              <span key={index} className="font-item">{font.name}</span>
                            ))}
                          </div>
                        </div>
                      )}
                      
                      {/* Цвета */}
                      {result.data.visual.colors && result.data.visual.colors.length > 0 && (
                        <div className="visual-resource-card">
                          <div className="resource-header">
                            <span className="resource-icon">🎨</span>
                            <span className="resource-title">Цвета</span>
                          </div>
                          <div className="resource-content">
                            <div className="color-palette">
                              {result.data.visual.colors.map((color, index) => (
                                <div 
                                  key={index} 
                                  className={`color-item ${copiedColorIndex === index ? 'copied' : ''}`}
                                  onClick={() => handleColorCopy(color, index)}
                                >
                                  <div 
                                    className="color-swatch" 
                                    style={{ backgroundColor: color }}
                                  ></div>
                                  <span className="color-code">{color}</span>
                                </div>
                              ))}
                            </div>
                          </div>
                        </div>
                      )}
                      
                      {/* Логотип сайта */}
                      {result.data.visual.logo && (
                        <div className="visual-resource-card">
                          <div className="resource-header">
                            <span className="resource-icon">�</span>
                            <span className="resource-title">Логотип сайта</span>
                          </div>
                          <div className="resource-content">
                            <div className="logo-card">
                              <div className="logo-preview-container">
                                <img 
                                  src={result.data.visual.logo} 
                                  alt="Logo" 
                                  className="logo-image"
                                  onError={(e) => {
                                    e.currentTarget.style.display = 'none';
                                  }}
                                />
                              </div>
                              <div className="asset-info">
                                <div className="asset-name">
                                  {result.data.visual.logo.split('/').pop()?.split('?')[0] || 'logo'}
                                </div>
                                <div className="asset-meta">
                                  <span className="asset-format">
                                    {(result.data.visual.logo.split('.').pop()?.split('?')[0] || 'unknown').toUpperCase()}
                                  </span>
                                  <span className="asset-type">Основной логотип</span>
                                </div>
                              </div>
                              <div className="asset-actions">
                                <button 
                                  className="asset-btn primary"
                                  onClick={() => {
                                    console.log('Клик по кнопке Скачать логотип');
                                    handleImageDownload(result.data!.visual.logo!, 'logo.png');
                                  }}
                                  title="Скачать логотип"
                                >
                                  <span>⬇️</span>
                                  Скачать
                                </button>
                                <button 
                                  className="asset-btn secondary"
                                  onClick={() => {
                                    console.log('Клик по кнопке URL логотипа');
                                    handleCopyUrl(result.data!.visual.logo!);
                                  }}
                                  title="Копировать URL"
                                >
                                  <span>🔗</span>
                                  URL
                                </button>
                              </div>
                            </div>
                          </div>
                        </div>
                      )}

                      {/* Фавикон сайта */}
                      {result.data.visual.favicon && (
                        <div className="visual-resource-card">
                          <div className="resource-header">
                            <span className="resource-icon">🔖</span>
                            <span className="resource-title">Фавикон сайта</span>
                          </div>
                          <div className="resource-content">
                            <div className="favicon-card">
                              <div className="favicon-preview-container">
                                <img 
                                  src={result.data.visual.favicon} 
                                  alt="Favicon" 
                                  className="favicon-image"
                                  onError={(e) => {
                                    e.currentTarget.style.display = 'none';
                                  }}
                                />
                              </div>
                              <div className="asset-info">
                                <div className="asset-name">
                                  {result.data.visual.favicon.split('/').pop()?.split('?')[0] || 'favicon.ico'}
                                </div>
                                <div className="asset-meta">
                                  <span className="asset-format">
                                    {(result.data.visual.favicon.split('.').pop()?.split('?')[0] || 'ico').toUpperCase()}
                                  </span>
                                  <span className="asset-type">16×16 - 512×512</span>
                                </div>
                              </div>
                              <div className="asset-actions">
                                <button 
                                  className="asset-btn primary"
                                  onClick={() => {
                                    console.log('Клик по кнопке Скачать фавикон');
                                    handleImageDownload(result.data!.visual.favicon!, 'favicon.ico');
                                  }}
                                  title="Скачать фавикон"
                                >
                                  <span>⬇️</span>
                                  Скачать
                                </button>
                                <button 
                                  className="asset-btn secondary"
                                  onClick={() => {
                                    console.log('Клик по кнопке URL фавикона');
                                    handleCopyUrl(result.data!.visual.favicon!);
                                  }}
                                  title="Копировать URL"
                                >
                                  <span>🔗</span>
                                  URL
                                </button>
                              </div>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                )}


                  </div>

                  {/* Правая колонка */}
                  <div className="audit-column-right">
                
                {/* Хостинг и безопасность */}
                {result.data.hosting && (
                  <div className="audit-section">
                    <h3>🔒 Хостинг и безопасность</h3>
                    <div className="hosting-grid">
                      {result.data.hosting.webServer && (
                        <div className="hosting-item">
                          <span className="hosting-label">
                            <span className="tech-category-icon">🖥️</span>
                            Веб-сервер
                          </span>
                          <span className="hosting-value">{result.data.hosting.webServer}</span>
                        </div>
                      )}
                      
                      {result.data.hosting.hostingProvider && (
                        <div className="hosting-item">
                          <span className="hosting-label">
                            <span className="tech-category-icon">☁️</span>
                            Хостинг-провайдер
                          </span>
                          <span className="hosting-value">{result.data.hosting.hostingProvider}</span>
                        </div>
                      )}
                      
                      {result.data.hosting.serverLocation && result.data.hosting.serverLocation.country && (
                        <div className="hosting-item">
                          <span className="hosting-label">
                            <span className="tech-category-icon">🌍</span>
                            Геолокация сервера
                          </span>
                          <span className="hosting-value">
                            {result.data.hosting.serverLocation.flag} {result.data.hosting.serverLocation.country}
                            {result.data.hosting.serverLocation.city && result.data.hosting.serverLocation.city !== 'Unknown' && 
                              `, ${result.data.hosting.serverLocation.city}`}
                          </span>
                        </div>
                      )}
                      
                      {result.data.hosting.ssl && result.data.hosting.sslGrade && (
                        <div className="hosting-item">
                          <span className="hosting-label">
                            <span className="tech-category-icon">🔒</span>
                            SSL Grade
                          </span>
                          <span className={`hosting-value ssl-grade-${result.data.hosting.sslGrade.toLowerCase().replace('+', 'plus')}`}>
                            {result.data.hosting.sslGrade}
                          </span>
                        </div>
                      )}
                      
                      {result.data.hosting.httpVersion && (
                        <div className="hosting-item">
                          <span className="hosting-label">
                            <span className="tech-category-icon">🌐</span>
                            HTTP версия
                          </span>
                          <span className="hosting-value">{result.data.hosting.httpVersion}</span>
                        </div>
                      )}
                      
                      {result.data.hosting.compression && result.data.hosting.compression.length > 0 && (
                        <div className="hosting-item">
                          <span className="hosting-label">
                            <span className="tech-category-icon">📦</span>
                            Сжатие
                          </span>
                          <span className="hosting-value">{result.data.hosting.compression.join(', ')}</span>
                        </div>
                      )}
                      
                      {result.data.hosting.cdn && result.data.hosting.cdn.length > 0 && (
                        <div className="hosting-item">
                          <span className="hosting-label">
                            <span className="tech-category-icon">🚀</span>
                            CDN
                          </span>
                          <span className="hosting-value">{result.data.hosting.cdn.join(', ')}</span>
                        </div>
                      )}
                      
                      {(result.data.hosting.ssl || result.data.hosting.cloudflare || (result.data.hosting.cdn && result.data.hosting.cdn.length > 0)) && (
                        <div className="hosting-item">
                          <span className="hosting-label">
                            <span className="tech-category-icon">⚡</span>
                            Функции безопасности
                          </span>
                          <span className="hosting-value">
                            {[
                              result.data.hosting.ssl && 'SSL/HTTPS',
                              result.data.hosting.cloudflare && 'Cloudflare',
                              result.data.hosting.cdn && result.data.hosting.cdn.length > 0 && 'CDN'
                            ].filter(Boolean).join(', ')}
                          </span>
                        </div>
                      )}
                      

                    </div>
                  </div>
                )}

                {/* Домен */}
                {result.data.domain && (
                  <div className="audit-section">
                    <h3>🌐 Домен</h3>
                    <div className="hosting-grid">
                      {result.data.domain.name && (
                        <div className="hosting-item">
                          <span className="hosting-label">
                            <span className="tech-category-icon">🏷️</span>
                            Название
                          </span>
                          <span className="hosting-value">{result.data.domain.name}</span>
                        </div>
                      )}
                      {result.data.domain.tld && (
                        <div className="hosting-item">
                          <span className="hosting-label">
                            <span className="tech-category-icon">🌍</span>
                            Зона
                          </span>
                          <span className="hosting-value">.{result.data.domain.tld}</span>
                        </div>
                      )}
                      {result.data.domain.subdomain && (
                        <div className="hosting-item">
                          <span className="hosting-label">
                            <span className="tech-category-icon">🔗</span>
                            Поддомен
                          </span>
                          <span className="hosting-value">{result.data.domain.subdomain}</span>
                        </div>
                      )}
                      {result.data.domain.registrar && (
                        <div className="hosting-item">
                          <span className="hosting-label">
                            <span className="tech-category-icon">🏢</span>
                            Регистратор
                          </span>
                          <span className="hosting-value">
                            {result.data.domain.registrarUrl ? (
                              <a href={result.data.domain.registrarUrl} target="_blank" rel="noopener noreferrer">
                                {result.data.domain.registrar}
                              </a>
                            ) : (
                              result.data.domain.registrar
                            )}
                          </span>
                        </div>
                      )}
                      {result.data.domain.organization && (
                        <div className="hosting-item">
                          <span className="hosting-label">
                            <span className="tech-category-icon">🏛️</span>
                            Организация
                          </span>
                          <span className="hosting-value">{result.data.domain.organization}</span>
                        </div>
                      )}
                      {result.data.domain.organizationLocal && (
                        <div className="hosting-item">
                          <span className="hosting-label">
                            <span className="tech-category-icon">🏪</span>
                            Организация (местн.)
                          </span>
                          <span className="hosting-value">{result.data.domain.organizationLocal}</span>
                        </div>
                      )}
                      {result.data.domain.city && (
                        <div className="hosting-item">
                          <span className="hosting-label">
                            <span className="tech-category-icon">🏙️</span>
                            Город
                          </span>
                          <span className="hosting-value">{result.data.domain.city}</span>
                        </div>
                      )}
                      {result.data.domain.country && (
                        <div className="hosting-item">
                          <span className="hosting-label">
                            <span className="tech-category-icon">🚩</span>
                            Страна
                          </span>
                          <span className="hosting-value">{result.data.domain.country}</span>
                        </div>
                      )}
                      {result.data.domain.creationDate && (
                        <div className="hosting-item">
                          <span className="hosting-label">
                            <span className="tech-category-icon">📅</span>
                            Создан
                          </span>
                          <span className="hosting-value">{result.data.domain.creationDate}</span>
                        </div>
                      )}
                      {result.data.domain.expirationDate && (
                        <div className="hosting-item">
                          <span className="hosting-label">
                            <span className="tech-category-icon">⏰</span>
                            Истекает
                          </span>
                          <span className="hosting-value">{result.data.domain.expirationDate}</span>
                        </div>
                      )}
                      {result.data.domain.updatedDate && (
                        <div className="hosting-item">
                          <span className="hosting-label">
                            <span className="tech-category-icon">🔄</span>
                            Обновлен
                          </span>
                          <span className="hosting-value">{result.data.domain.updatedDate}</span>
                        </div>
                      )}
                      {result.data.domain.dnssec && (
                        <div className="hosting-item">
                          <span className="hosting-label">
                            <span className="tech-category-icon">🔐</span>
                            DNSSEC
                          </span>
                          <span className="hosting-value">{result.data.domain.dnssec}</span>
                        </div>
                      )}
                      {result.data.domain.nameservers && result.data.domain.nameservers.length > 0 && (
                        <div className="hosting-item">
                          <span className="hosting-label">
                            <span className="tech-category-icon">🌐</span>
                            Name серверы
                          </span>
                          <span className="hosting-value">{result.data.domain.nameservers.join(', ')}</span>
                        </div>
                      )}
                      {result.data.domain.redirects && result.data.domain.redirects.length > 0 && (
                        <div className="hosting-item">
                          <span className="hosting-label">
                            <span className="tech-category-icon">↗️</span>
                            Редиректы
                          </span>
                          <span className="hosting-value">
                            {result.data.domain.redirects.map((redirect, index) => (
                              <div key={index} style={{fontSize: '0.9em', marginBottom: '4px'}}>
                                {redirect.from} → {redirect.to} ({redirect.type})
                              </div>
                            ))}
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* Социальные сети */}
                {result.data.social && Object.values(result.data.social).some(Boolean) && (
                  <div className="audit-section">
                    <h3>📱 Социальные сети</h3>
                    <div className="social-grid">
                      {Object.entries(result.data.social).map(([platform, url]) => {
                        const getSocialIcon = (platform: string) => {
                          const iconMap: { [key: string]: string } = {
                            facebook: '/icons/tools_facebook.svg',
                            instagram: '/icons/tools_instagram.svg',
                            twitter: '/icons/tools_tik_tok.svg', // Используем TikTok иконку для Twitter/X
                            linkedin: '/icons/tools_linkedin.svg',
                            youtube: '/icons/tools_youtube.svg',
                            telegram: '/icons/tools_telegram.svg',
                            whatsapp: '/icons/tools_whats_app.svg',
                            viber: '/icons/tools_viber.svg'
                          };
                          return iconMap[platform] || '/icons/tools_facebook.svg'; // Fallback
                        };

                        return url && (
                          <div key={platform} className="social-item">
                            <img 
                              src={getSocialIcon(platform)} 
                              alt={`${platform} icon`}
                              className="social-icon-svg"
                              onError={(e) => {
                                // Fallback к эмодзи если SVG не загрузился
                                const target = e.target as HTMLImageElement;
                                target.style.display = 'none';
                                const fallback = target.nextElementSibling as HTMLSpanElement;
                                if (fallback) fallback.style.display = 'inline';
                              }}
                            />
                            <span className="social-icon-fallback" style={{ display: 'none' }}>
                              {platform === 'facebook' && '👥'}
                              {platform === 'instagram' && '📷'}
                              {platform === 'twitter' && '🐦'}
                              {platform === 'linkedin' && '💼'}
                              {platform === 'youtube' && '📺'}
                              {platform === 'telegram' && '✈️'}
                              {platform === 'whatsapp' && '💬'}
                              {platform === 'viber' && '💜'}
                            </span>
                            <span className="social-name">{platform}</span>
                            <a href={url} target="_blank" rel="noopener noreferrer" className="social-link">
                              Перейти
                            </a>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* Контакты */}
                {result.data.contact && (result.data.contact.phones.length > 0 || result.data.contact.emails.length > 0) && (
                  <div className="audit-section">
                    <h3>📞 Контактная информация</h3>
                    <div className="contact-grid">
                      {result.data.contact.phones.length > 0 && (
                        <div className="contact-group">
                          <h4>📱 Телефоны:</h4>
                          {result.data.contact.phones.map((phone, index) => (
                            <div key={index} className="contact-item">
                              <a href={`tel:${phone}`} className="contact-link">
                                {phone}
                              </a>
                              <button 
                                className="copy-contact-btn"
                                onClick={(e) => {
                                  console.log('Копирование телефона:', phone);
                                  navigator.clipboard.writeText(phone);
                                  
                                  // Визуальная обратная связь
                                  const btn = e.target as HTMLButtonElement;
                                  const originalText = btn.textContent;
                                  btn.textContent = '✅';
                                  btn.style.background = 'rgba(46, 204, 113, 0.2)';
                                  btn.style.borderColor = 'rgba(46, 204, 113, 0.5)';
                                  btn.style.transform = 'scale(1.1)';
                                  
                                  setTimeout(() => {
                                    btn.textContent = originalText;
                                    btn.style.background = '';
                                    btn.style.borderColor = '';
                                    btn.style.transform = '';
                                  }, 1000);
                                }}
                                title="Скопировать телефон"
                              >
                                📋
                              </button>
                            </div>
                          ))}
                        </div>
                      )}
                      {result.data.contact.emails.length > 0 && (
                        <div className="contact-group">
                          <h4>📧 Email:</h4>
                          {result.data.contact.emails.map((email, index) => (
                            <div key={index} className="contact-item">
                              <a href={`mailto:${email}`} className="contact-link">
                                {email}
                              </a>
                              <button 
                                className="copy-contact-btn"
                                onClick={(e) => {
                                  console.log('Копирование email:', email);
                                  navigator.clipboard.writeText(email);
                                  
                                  // Визуальная обратная связь
                                  const btn = e.target as HTMLButtonElement;
                                  const originalText = btn.textContent;
                                  btn.textContent = '✅';
                                  btn.style.background = 'rgba(46, 204, 113, 0.2)';
                                  btn.style.borderColor = 'rgba(46, 204, 113, 0.5)';
                                  btn.style.transform = 'scale(1.1)';
                                  
                                  setTimeout(() => {
                                    btn.textContent = originalText;
                                    btn.style.background = '';
                                    btn.style.borderColor = '';
                                    btn.style.transform = '';
                                  }, 1000);
                                }}
                                title="Скопировать email"
                              >
                                📋
                              </button>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                )}
                  </div>
                </div>
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

export default SiteAudit;