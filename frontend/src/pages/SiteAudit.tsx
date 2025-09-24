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
      cdn?: string[];
      webServer?: string;
      database?: string[];
      analytics?: string[];
      security?: string[];
      hosting?: string;
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
      fonts?: string[];
      icons?: string[];
      videos?: number;
      audio?: number;
      svgs?: number;
    };
    hosting: {
      ssl?: boolean;
      webServer?: string;
      cloudflare?: boolean;
      cdn?: boolean;
      securityHeaders?: Record<string, boolean>;
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
                            Система управления:
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
                            Фреймворки:
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
                            Языки программирования:
                          </span>
                          <span className="tech-category-value">
                            {result.data.technologies.language.join(', ')}
                          </span>
                        </div>
                      )}

                      {/* CDN */}
                      {result.data.technologies.cdn && result.data.technologies.cdn.length > 0 && (
                        <div className="tech-category">
                          <span className="tech-category-title">
                            <span className="tech-category-icon">🌐</span>
                            CDN:
                          </span>
                          <span className="tech-category-value">
                            {result.data.technologies.cdn.join(', ')}
                          </span>
                        </div>
                      )}

                      {/* Web Server */}
                      {result.data.technologies.webServer && (
                        <div className="tech-category">
                          <span className="tech-category-title">
                            <span className="tech-category-icon">🖥️</span>
                            Веб-сервер:
                          </span>
                          <span className="tech-category-value">
                            {result.data.technologies.webServer}
                          </span>
                        </div>
                      )}

                      {/* Hosting */}
                      {result.data.technologies.hosting && (
                        <div className="tech-category">
                          <span className="tech-category-title">
                            <span className="tech-category-icon">☁️</span>
                            Хостинг:
                          </span>
                          <span className="tech-category-value">
                            {result.data.technologies.hosting}
                          </span>
                        </div>
                      )}

                      {/* CSS Frameworks */}
                      {result.data.technologies.cssFramework && result.data.technologies.cssFramework.length > 0 && (
                        <div className="tech-category">
                          <span className="tech-category-title">
                            <span className="tech-category-icon">🎨</span>
                            CSS фреймворки:
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
                            CSS препроцессоры:
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
                            Статические генераторы:
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
                            Инструменты сборки:
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
                            Микрофреймворки:
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
                            Базы данных:
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
                       !result.data.technologies.webServer && (
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
                    <div className="analytics-grid">
                      {Object.entries(result.data.analytics).map(([key, value]) => (
                        value && (
                          <div key={key} className="analytics-item">
                            <span className="analytics-icon">✅</span>
                            <span className="analytics-name">
                              {key === 'googleAnalytics' && 'Google Analytics'}
                              {key === 'googleTagManager' && 'Google Tag Manager'}
                              {key === 'facebookPixel' && 'Facebook Pixel'}
                              {key === 'metaPixel' && 'Meta Pixel'}
                              {key === 'yandexMetrica' && 'Яндекс.Метрика'}
                              {key === 'hotjar' && 'Hotjar'}
                              {key === 'clarity' && 'Microsoft Clarity'}
                              {key === 'mailchimp' && 'Mailchimp'}
                              {key === 'convertkit' && 'ConvertKit'}
                              {key === 'klaviyo' && 'Klaviyo'}
                              {key === 'intercom' && 'Intercom'}
                              {key === 'zendesk' && 'Zendesk'}
                              {key === 'tawkTo' && 'Tawk.to'}
                              {key === 'crisp' && 'Crisp'}
                              {key === 'optimizely' && 'Optimizely'}
                              {key === 'vwo' && 'VWO'}
                              {key === 'googleOptimize' && 'Google Optimize'}
                              {key === 'crazyEgg' && 'Crazy Egg'}
                              {key === 'fullstory' && 'FullStory'}
                              {key === 'mouseflow' && 'Mouseflow'}
                            </span>
                          </div>
                        )
                      ))}
                    </div>
                  </div>
                )}

                {/* Производительность */}
                {result.data.performance && (
                  <div className="audit-section">
                    <h3>⚡ Производительность</h3>
                    <div className="performance-grid">
                      <div className="performance-item">
                        <span className="performance-label">Время загрузки:</span>
                        <span className="performance-value">{result.data.performance.loadTime}ms</span>
                      </div>
                      <div className="performance-item">
                        <span className="performance-label">Размер страницы:</span>
                        <span className="performance-value">
                          {result.data.performance.pageSizeKB 
                            ? `${result.data.performance.pageSizeKB} KB` 
                            : result.data.performance.pageSize 
                              ? `${(result.data.performance.pageSize / 1024).toFixed(2)} KB`
                              : '0 KB'
                          }
                        </span>
                      </div>
                      {result.data.performance.requests && (
                        <div className="performance-item">
                          <span className="performance-label">Запросов:</span>
                          <span className="performance-value">{result.data.performance.requests}</span>
                        </div>
                      )}
                    </div>
                  </div>
                )}
                  </div>

                  {/* Правая колонка */}
                  <div className="audit-column-right">
                {/* SEO Recommendation */}
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

                {/* Визуальные элементы */}
                {result.data.visual && (
                  <div className="audit-section">
                    <h3>🎨 Визуальные элементы</h3>
                    <div className="visual-grid">
                      {result.data.visual.imagesCount && (
                        <div className="visual-item">
                          <span className="visual-icon">🖼️</span>
                          <span className="visual-label">Изображения:</span>
                          <span className="visual-value">{result.data.visual.imagesCount}</span>
                          {(result.data.visual.imagesWithoutAlt ?? 0) > 0 && (
                            <span className="visual-warning">({result.data.visual.imagesWithoutAlt} без alt)</span>
                          )}
                        </div>
                      )}
                      {result.data.visual.cssFiles && (
                        <div className="visual-item">
                          <span className="visual-icon">🎨</span>
                          <span className="visual-label">CSS файлы:</span>
                          <span className="visual-value">{result.data.visual.cssFiles}</span>
                        </div>
                      )}
                      {result.data.visual.jsFiles && (
                        <div className="visual-item">
                          <span className="visual-icon">⚡</span>
                          <span className="visual-label">JS файлы:</span>
                          <span className="visual-value">{result.data.visual.jsFiles}</span>
                        </div>
                      )}
                      {result.data.visual.fonts && (
                        <div className="visual-item">
                          <span className="visual-icon">🔤</span>
                          <span className="visual-label">Шрифты:</span>
                          <span className="visual-value">{result.data.visual.fonts.join(', ')}</span>
                        </div>
                      )}
                      {result.data.visual.icons && (
                        <div className="visual-item">
                          <span className="visual-icon">⭐</span>
                          <span className="visual-label">Иконки:</span>
                          <span className="visual-value">{result.data.visual.icons.join(', ')}</span>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* Хостинг и безопасность */}
                {result.data.hosting && (
                  <div className="audit-section">
                    <h3>🔒 Хостинг и безопасность</h3>
                    <div className="hosting-grid">
                      {result.data.hosting.webServer && (
                        <div className="hosting-item">
                          <span className="hosting-label">Сервер:</span>
                          <span className="hosting-value">{result.data.hosting.webServer}</span>
                        </div>
                      )}
                      {result.data.hosting.webServer && (
                        <div className="hosting-item">
                          <span className="hosting-label">Веб-сервер:</span>
                          <span className="hosting-value">{result.data.hosting.webServer}</span>
                        </div>
                      )}
                      <div className="hosting-features">
                        {result.data.hosting.ssl && <span className="security-tag">SSL/HTTPS</span>}
                        {result.data.hosting.cloudflare && <span className="security-tag">Cloudflare</span>}
                        {result.data.hosting.cdn && <span className="security-tag">CDN</span>}
                      </div>
                      {result.data.hosting.securityHeaders && (
                        <div className="security-headers">
                          <span className="hosting-label">Заголовки безопасности:</span>
                          <div className="security-tags">
                            {Object.keys(result.data.hosting.securityHeaders).map(header => (
                              <span key={header} className="security-tag">{header.toUpperCase()}</span>
                            ))}
                          </div>
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
                      {Object.entries(result.data.social).map(([platform, url]) => (
                        url && (
                          <div key={platform} className="social-item">
                            <span className="social-icon">
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
                        )
                      ))}
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
                            <a key={index} href={`tel:${phone}`} className="contact-item">
                              {phone}
                            </a>
                          ))}
                        </div>
                      )}
                      {result.data.contact.emails.length > 0 && (
                        <div className="contact-group">
                          <h4>📧 Email:</h4>
                          {result.data.contact.emails.map((email, index) => (
                            <a key={index} href={`mailto:${email}`} className="contact-item">
                              {email}
                            </a>
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