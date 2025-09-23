import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useAuthRequired } from '../hooks/useAuthRequired';
import { useAuth } from '../contexts/AuthContext';
import { useLocalizedLink } from '../hooks/useLanguageFromUrl';
import { statsService } from '../utils/statsService';
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
      h1: { count: number; texts: string[] };
      h2: { count: number; texts: string[] };
      h3: { count: number; texts: string[] };
      h4: { count: number; texts: string[] };
      h5: { count: number; texts: string[] };
      h6: { count: number; texts: string[] };
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
      title_length_score: number;
      description_length_score: number;
      h1_score: number;
    };
  };
}

const SeoAudit: React.FC = () => {
  const { t } = useTranslation();
  const { createLink } = useLocalizedLink();
  const { requireAuth } = useAuthRequired();
  const { user } = useAuth();
  const [url, setUrl] = useState('');
  const [result, setResult] = useState<SeoAuditResult | null>(null);
  const [launchCount, setLaunchCount] = useState(0);

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

  const copyResult = () => {
    if (!result?.data) return;

    const seoReport = generateSeoReport(result.data, result.url);
    navigator.clipboard.writeText(seoReport);
    
    // Показываем уведомление
    const notification = document.createElement('div');
    notification.textContent = 'SEO отчет скопирован в буфер обмена';
    notification.style.cssText = `
      position: fixed;
      top: 20px;
      right: 20px;
      background: #4CAF50;
      color: white;
      padding: 12px 20px;
      border-radius: 6px;
      z-index: 10000;
      font-family: Inter, sans-serif;
    `;
    document.body.appendChild(notification);
    setTimeout(() => notification.remove(), 3000);
  };

  const generateSeoReport = (data: any, url: string): string => {
    return `
🔍 SEO АУДИТ САЙТА
Сайт: ${url}
Дата анализа: ${new Date().toLocaleDateString('ru-RU')}

📊 ОБЩАЯ ОЦЕНКА:
• Заголовок: ${data.performance.title_length_score}/100
• Описание: ${data.performance.description_length_score}/100  
• H1 заголовок: ${data.performance.h1_score}/100

📄 ОСНОВНЫЕ ЭЛЕМЕНТЫ:
• Заголовок: "${data.title.content}" (${data.title.length} символов)
• Описание: ${data.metaDescription.content ? `"${data.metaDescription.content.substring(0, 100)}..."` : 'Отсутствует'} (${data.metaDescription.length} символов)

📱 СОЦИАЛЬНЫЕ СЕТИ:
• Open Graph: ${data.openGraph.title ? '✅ Настроен' : '❌ Не настроен'}
• Twitter Cards: ${data.twitterCard.card ? '✅ Настроен' : '❌ Не настроен'}

⚙️ ТЕХНИЧЕСКОЕ SEO:
• Структурированные данные: ${data.structuredData.count} блоков
• Canonical URL: ${data.canonical.isPresent ? '✅ Есть' : '❌ Нет'}
• Многоязычность: ${data.hreflang.length} языков
• Sitemap: ${data.sitemap.found ? '✅ Найден' : '❌ Не найден'}

📝 СТРУКТУРА КОНТЕНТА:
• H1: ${data.headings.h1.count} | H2: ${data.headings.h2.count} | H3: ${data.headings.h3.count}

🖼️ ИЗОБРАЖЕНИЯ И ССЫЛКИ:
• Изображения: ${data.images.total} (без alt: ${data.images.withoutAlt})
• Ссылки: ${data.links.total} (внутренних: ${data.links.internal}, внешних: ${data.links.external})

Отчет создан с помощью Wekey Tools - wekey.top
    `.trim();
  };

  return (
    <div className="seo-audit-tool">
      {/* Header Island */}
      <div className="seo-audit-header-island">
        <Link to={createLink('')} className="seo-audit-back-button">
          <img src="/icons/arrow_left.svg" alt="" />
          Все инструменты
        </Link>
        <h1 className="seo-audit-title">🔍 SEO Аудит</h1>
        <div className="seo-audit-header-buttons">
          <button className="seo-audit-header-btn seo-audit-counter-btn" title="Счетчик запусков">
            <img src="/icons/rocket.svg" alt="" />
            <span className="seo-audit-counter">{launchCount}</span>
          </button>
          <button className="seo-audit-header-btn seo-audit-icon-only" title="Подсказки">
            <img src="/icons/lamp.svg" alt="" />
          </button>
          <button className="seo-audit-header-btn seo-audit-icon-only" title="Скриншот">
            <img src="/icons/camera.svg" alt="" />
          </button>
        </div>
      </div>

      <div className="seo-audit-main-workspace">
        {/* Input Section */}
        <div className="seo-audit-input-row">
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

        {/* Control Buttons */}
        <div className="seo-audit-control-buttons">
          <button 
            className="seo-audit-action-btn seo-audit-primary" 
            onClick={handleAudit}
            disabled={result?.loading || !url.trim()}
          >
            {result?.loading ? 'Анализирую SEO...' : 'Показать результат'}
          </button>
          
          <button 
            className="seo-audit-action-btn seo-audit-secondary seo-audit-icon-left" 
            onClick={copyResult}
            disabled={!result?.data}
          >
            <img src="/icons/button_copy.svg" alt="" />
            Скопировать результат
          </button>
        </div>

        {/* Results Section */}
        {result && (
          <div className="seo-audit-results-container">
            {result.loading && (
              <div className="seo-audit-loading-state">
                <div className="seo-audit-loading-spinner"></div>
                <p>Выполняю детальный SEO анализ {result.url}...</p>
                <p className="seo-audit-loading-note">Анализирую заголовки, мета-теги, структуру и техническое SEO</p>
              </div>
            )}

            {result.error && (
              <div className="seo-audit-error-state">
                <h3>❌ Ошибка SEO анализа</h3>
                <p>{result.error}</p>
                <p className="seo-audit-error-help">Проверьте правильность URL и доступность сайта</p>
              </div>
            )}

            {result.data && (
              <div className="seo-audit-content">
                <h2 className="seo-audit-content-title">🔍 Детальный SEO анализ сайта</h2>
                
                {/* SEO Сводка */}
                {result.data.performance && (
                  <div className="seo-audit-summary">
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
                <div className="seo-audit-group">
                  <h3>📄 Основные элементы страницы</h3>
                  
                  {/* Заголовок страницы */}
                  <div className="seo-audit-item">
                    <div className="seo-audit-item-header">
                      <span className={`seo-audit-status ${result.data.title?.isOptimal ? 'seo-audit-good' : 'seo-audit-warning'}`}>
                        {result.data.title?.isOptimal ? '✅' : '⚠️'}
                      </span>
                      <span className="seo-audit-item-title">Заголовок страницы</span>
                    </div>
                    <div className="seo-audit-item-content">
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
                      <span className={`seo-audit-status ${result.data.metaDescription?.isOptimal ? 'seo-audit-good' : 'seo-audit-warning'}`}>
                        {result.data.metaDescription?.isOptimal ? '✅' : '⚠️'}
                      </span>
                      <span className="seo-audit-item-title">Описание страницы</span>
                    </div>
                    <div className="seo-audit-item-content">
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

                {/* Социальные сети и мессенджеры */}
                <div className="seo-audit-group">
                  <h3>📱 Социальные сети</h3>
                  
                  <div className="seo-audit-item">
                    <div className="seo-audit-item-header">
                      <span className={`seo-audit-status ${result.data.openGraph?.title ? 'seo-audit-good' : 'seo-audit-warning'}`}>
                        {result.data.openGraph?.title ? '✅' : '❌'}
                      </span>
                      <span className="seo-audit-item-title">Карточки для соцсетей</span>
                    </div>
                    <div className="seo-audit-item-content">
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

                  <div className="seo-audit-item">
                    <div className="seo-audit-item-header">
                      <span className={`seo-audit-status ${result.data.twitterCard?.card ? 'seo-audit-good' : 'seo-audit-warning'}`}>
                        {result.data.twitterCard?.card ? '✅' : '❌'}
                      </span>
                      <span className="seo-audit-item-title">Карточки для Twitter</span>
                    </div>
                    <div className="seo-audit-item-content">
                      {result.data.twitterCard?.card ? (
                        <p className="seo-audit-value">Настроены специальные карточки для Twitter (X)</p>
                      ) : (
                        <div>
                          <p className="seo-audit-value">Twitter карточки не настроены</p>
                          <p className="seo-audit-tip">💡 Twitter будет использовать обычные Open Graph данные.</p>
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {/* Техническое SEO */}
                <div className="seo-audit-group">
                  <h3>⚙️ Техническая настройка</h3>
                  
                  <div className="seo-audit-item">
                    <div className="seo-audit-item-header">
                      <span className={`seo-audit-status ${(result.data.structuredData?.count ?? 0) > 0 ? 'seo-audit-good' : 'seo-audit-warning'}`}>
                        {(result.data.structuredData?.count ?? 0) > 0 ? '✅' : '❌'}
                      </span>
                      <span className="seo-audit-item-title">Разметка для поисковиков</span>
                    </div>
                    <div className="seo-audit-item-content">
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

                  <div className="seo-audit-item">
                    <div className="seo-audit-item-header">
                      <span className={`seo-audit-status ${result.data.canonical?.isPresent ? 'seo-audit-good' : 'seo-audit-warning'}`}>
                        {result.data.canonical?.isPresent ? '✅' : '⚠️'}
                      </span>
                      <span className="seo-audit-item-title">Основная версия страницы</span>
                    </div>
                    <div className="seo-audit-item-content">
                      {result.data.canonical?.isPresent ? (
                        <p className="seo-audit-value">Указана основная версия страницы (canonical URL)</p>
                      ) : (
                        <div>
                          <p className="seo-audit-value">Основная версия страницы не указана</p>
                          <p className="seo-audit-tip">💡 Canonical URL помогает избежать дублирования контента, если одна страница доступна по нескольким адресам.</p>
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="seo-audit-item">
                    <div className="seo-audit-item-header">
                      <span className={`seo-audit-status ${(result.data.hreflang?.length ?? 0) > 0 ? 'seo-audit-good' : 'seo-audit-info'}`}>
                        {(result.data.hreflang?.length ?? 0) > 0 ? '✅' : 'ℹ️'}
                      </span>
                      <span className="seo-audit-item-title">Многоязычность</span>
                    </div>
                    <div className="seo-audit-item-content">
                      {(result.data.hreflang?.length ?? 0) > 0 ? (
                        <div>
                          <p className="seo-audit-value">Сайт доступен на {result.data.hreflang?.length} языках</p>
                          <p className="seo-audit-tip">💡 Поисковики смогут показывать правильную языковую версию пользователям из разных стран.</p>
                        </div>
                      ) : (
                        <div>
                          <p className="seo-audit-value">Сайт одноязычный</p>
                          <p className="seo-audit-tip">💡 Если планируете международную аудиторию, стоит рассмотреть добавление других языков.</p>
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="seo-audit-item">
                    <div className="seo-audit-item-header">
                      <span className={`seo-audit-status ${result.data.sitemap?.found ? 'seo-audit-good' : 'seo-audit-warning'}`}>
                        {result.data.sitemap?.found ? '✅' : '⚠️'}
                      </span>
                      <span className="seo-audit-item-title">Карта сайта</span>
                    </div>
                    <div className="seo-audit-item-content">
                      {result.data.sitemap?.found ? (
                        <p className="seo-audit-value">Найдена карта сайта (sitemap)</p>
                      ) : (
                        <div>
                          <p className="seo-audit-value">Карта сайта не найдена</p>
                          <p className="seo-audit-tip">💡 Sitemap помогает поисковикам найти и проиндексировать все страницы сайта.</p>
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {/* Структура контента */}
                {result.data.headings && (
                  <div className="seo-audit-group">
                    <h3>📝 Структура контента</h3>
                    <div className="seo-audit-item">
                      <div className="seo-audit-item-header">
                        <span className={`seo-audit-status ${result.data.headings.h1.count === 1 ? 'seo-audit-good' : 'seo-audit-warning'}`}>
                          {result.data.headings.h1.count === 1 ? '✅' : '⚠️'}
                        </span>
                        <span className="seo-audit-item-title">Заголовки страницы</span>
                      </div>
                      <div className="seo-audit-item-content">
                        <div className="seo-audit-headings-summary">
                          <span className="seo-audit-heading-stat">H1: {result.data.headings.h1.count}</span>
                          <span className="seo-audit-heading-stat">H2: {result.data.headings.h2.count}</span>
                          <span className="seo-audit-heading-stat">H3: {result.data.headings.h3.count}</span>
                          {(result.data.headings.h4.count + result.data.headings.h5.count + result.data.headings.h6.count) > 0 && (
                            <span className="seo-audit-heading-stat">
                              H4-H6: {result.data.headings.h4.count + result.data.headings.h5.count + result.data.headings.h6.count}
                            </span>
                          )}
                        </div>
                        {result.data.headings.h1.count !== 1 && (
                          <p className="seo-audit-tip">
                            💡 {result.data.headings.h1.count === 0 ? 
                              'Отсутствует главный заголовок H1. Каждая страница должна иметь один уникальный H1.' :
                              'Найдено несколько H1 заголовков. Рекомендуется использовать только один H1 на странице.'
                            }
                          </p>
                        )}
                        {result.data.headings.h1.texts.length > 0 && (
                          <p className="seo-audit-meta">Главный заголовок: "{result.data.headings.h1.texts[0]}"</p>
                        )}
                      </div>
                    </div>
                  </div>
                )}

                {/* Изображения и ссылки */}
                {result.data.images && (
                  <div className="seo-audit-group">
                    <h3>🖼️ Изображения и ссылки</h3>
                    
                    <div className="seo-audit-item">
                      <div className="seo-audit-item-header">
                        <span className={`seo-audit-status ${result.data.images.withoutAlt === 0 ? 'seo-audit-good' : 'seo-audit-warning'}`}>
                          {result.data.images.withoutAlt === 0 ? '✅' : '⚠️'}
                        </span>
                        <span className="seo-audit-item-title">Alt-тексты изображений</span>
                      </div>
                      <div className="seo-audit-item-content">
                        <p className="seo-audit-value">
                          Всего изображений: {result.data.images.total}
                          {result.data.images.withoutAlt > 0 && (
                            `, без alt-текста: ${result.data.images.withoutAlt}`
                          )}
                        </p>
                        {result.data.images.withoutAlt > 0 && (
                          <p className="seo-audit-tip">💡 Alt-тексты помогают поисковикам понять содержимое изображений и важны для доступности сайта.</p>
                        )}
                      </div>
                    </div>

                    {result.data.links && (
                      <div className="seo-audit-item">
                        <div className="seo-audit-item-header">
                          <span className="seo-audit-status seo-audit-info">ℹ️</span>
                          <span className="seo-audit-item-title">Ссылки на странице</span>
                        </div>
                        <div className="seo-audit-item-content">
                          <p className="seo-audit-value">
                            Всего ссылок: {result.data.links.total} 
                            (внутренних: {result.data.links.internal}, внешних: {result.data.links.external})
                          </p>
                          {result.data.links.nofollow > 0 && (
                            <p className="seo-audit-meta">Ссылок с nofollow: {result.data.links.nofollow}</p>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default SeoAudit;