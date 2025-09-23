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
      framework?: string;
      language?: string;
      cdn?: string;
      hosting?: string;
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
      server?: string;
      webServer?: string;
      ssl?: boolean;
      cdn?: boolean;
      cdnProvider?: string;
      cloudflare?: boolean;
      amazon?: boolean;
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
        await statsService.incrementLaunchCount('site-audit');
      }

      // Вызов API для анализа сайта
      const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:8880';
      const response = await fetch(`${API_BASE}/api/tools/site-audit`, {
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

      setResult({
        url: normalizedUrl,
        loading: false,
        data: data.results
      });

    } catch (error) {
      console.error('Ошибка при анализе сайта:', error);
      setResult({
        url: normalizedUrl,
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
              <input
                type="url"
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                placeholder="Введите адрес нужной страницы"
                className="audit-url-field"
                onKeyPress={(e) => e.key === 'Enter' && handleAudit()}
              />
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
                    <h3>🔧 Технологии</h3>
                    <div className="tech-grid">
                      {result.data.technologies.cms && (
                        <div className="tech-item">
                          <span className="tech-icon">📝</span>
                          <span className="tech-label">CMS:</span>
                          <span className="tech-value">{result.data.technologies.cms}</span>
                        </div>
                      )}
                      {result.data.technologies.framework && (
                        <div className="tech-item">
                          <span className="tech-icon">⚛️</span>
                          <span className="tech-label">Web Framework:</span>
                          <span className="tech-value">{result.data.technologies.framework}</span>
                        </div>
                      )}
                      {result.data.technologies.language && (
                        <div className="tech-item">
                          <span className="tech-icon">💻</span>
                          <span className="tech-label">Язык программирования:</span>
                          <span className="tech-value">{result.data.technologies.language}</span>
                        </div>
                      )}
                      {result.data.technologies.cdn && (
                        <div className="tech-item">
                          <span className="tech-icon">🌐</span>
                          <span className="tech-label">CDN:</span>
                          <span className="tech-value">{result.data.technologies.cdn}</span>
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
                        <span className="performance-value">{result.data.performance.pageSize ? (result.data.performance.pageSize / 1024).toFixed(2) : '0'} KB</span>
                      </div>
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
                      {result.data.hosting.server && (
                        <div className="hosting-item">
                          <span className="hosting-label">Сервер:</span>
                          <span className="hosting-value">{result.data.hosting.server}</span>
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