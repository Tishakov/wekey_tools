import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useLocalizedLink } from '../hooks/useLanguageFromUrl';
import { statsService } from '../utils/statsService';
import { useAuthRequired } from '../hooks/useAuthRequired';
import AuthRequiredModal from '../components/AuthRequiredModal';
import AuthModal from '../components/AuthModal';
import SEOAnalysisResults from '../components/SEOAnalysisResults';
import './SEOAuditProTool.css';
import '../styles/tool-pages.css';

const TOOL_ID = 'seoauditpro';
console.log('SEO Audit Pro: Using tool ID:', TOOL_ID);
const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:8880';

// Типы для GSC данных
interface GSCData {
  searchPerformance?: {
    totalClicks: number;
    totalImpressions: number;
    averageCTR: number;
    averagePosition: number;
    queries: Array<{
      query: string;
      clicks: number;
      impressions: number;
      ctr: number;
      position: number;
    }>;
    pages: Array<{
      page: string;
      clicks: number;
      impressions: number;
      ctr: number;
      position: number;
    }>;
    devices?: Array<{
      device: string;
      clicks: number;
      impressions: number;
      ctr: number;
      position: number;
    }>;
  };
  indexCoverage?: {
    validPages: number;
    errorPages: number;
    excludedPages: number;
    warnings: number;
    status?: string;
    issues?: Array<{
      type: string;
      count: number;
      urls: string[];
    }>;
  };
  coreWebVitals?: {
    goodUrls: number;
    needsImprovementUrls: number;
    poorUrls: number;
    issues: Array<{
      metric: string;
      category: string;
      urls: string[];
    }>;
  };
}

interface AuditResult {
  loading: boolean;
  error?: string;
  data?: {
    url: string;
    gscData: GSCData;
    overallScore: number;
    healthStatus: 'excellent' | 'good' | 'average' | 'poor' | 'critical';
    recommendations: Array<{
      priority: 'high' | 'medium' | 'low';
      category: string;
      title: string;
      description: string;
      impact: string;
      actionSteps: string[];
    }>;
  };
}

const SEOAuditProTool: React.FC = () => {
  const { t } = useTranslation();
  const createLink = useLocalizedLink();

  // Auth Required Hook
  const {
    isAuthRequiredModalOpen,
    isAuthModalOpen,
    requireAuth,
    closeAuthRequiredModal,
    closeAuthModal,
    openAuthModal
  } = useAuthRequired();

  const [launchCount, setLaunchCount] = useState(0);
  const [isConnecting, setIsConnecting] = useState(false);
  const [isConnected, setIsConnected] = useState(false);
  const [result, setResult] = useState<AuditResult | null>(null);
  
  // Новые состояния для выбора сайтов из GSC
  const [availableSites, setAvailableSites] = useState<Array<{siteUrl: string, permissionLevel: string}>>([]);
  const [selectedSite, setSelectedSite] = useState('');
  const [loadingSites, setLoadingSites] = useState(false);
  
  // Состояние для выбранного периода анализа
  const [selectedPeriod, setSelectedPeriod] = useState<7 | 14 | 28 | 90>(28);

  // Загружаем статистику при инициализации
  useEffect(() => {
    const loadLaunchCount = async () => {
      try {
        console.log(`SEO Audit Pro: Loading launch count for tool ID: ${TOOL_ID}`);
        console.log(`SEO Audit Pro: API Base URL: ${API_BASE}`);
        
        const count = await statsService.getLaunchCount(TOOL_ID);
        console.log(`SEO Audit Pro: Successfully loaded launch count: ${count}`);
        setLaunchCount(count);
      } catch (error) {
        console.error('SEO Audit Pro: Error loading launch count:', error);
        console.log('SEO Audit Pro: Falling back to 0 count');
        // Устанавливаем 0 как fallback
        setLaunchCount(0);
      }
    };
    
    // Добавляем небольшую задержку, чтобы дать время компоненту полностью загрузиться
    setTimeout(loadLaunchCount, 100);
  }, []);

  // Загрузка доступных сайтов из GSC (демо-данные)
  const loadAvailableSites = async () => {
    setLoadingSites(true);
    try {
      const response = await fetch(`${API_BASE}/api/tools/seo-audit-pro/sites`);
      const data = await response.json();
      
      if (data.success) {
        setAvailableSites(data.sites);
      }
    } catch (error) {
      console.error('Ошибка загрузки сайтов:', error);
    } finally {
      setLoadingSites(false);
    }
  };

  // Загрузка реальных сайтов из GSC с токенами
  const loadAvailableSitesWithTokens = async (tokens: any) => {
    setLoadingSites(true);
    try {
      const response = await fetch(`${API_BASE}/api/tools/seo-audit-pro/sites`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ tokens })
      });
      const data = await response.json();
      
      if (data.success) {
        setAvailableSites(data.sites);
        // Сохраняем токены для последующих запросов
        localStorage.setItem('gsc-tokens', JSON.stringify(tokens));
        
        // Показываем сообщение об активации API если нужно
        if (data.message && data.apiActivationUrl) {
          console.warn('🔧 API Activation needed:', data.message);
          console.warn('🔗 Activation URL:', data.apiActivationUrl);
          
          // Можно добавить уведомление пользователю
          if (data.isDemo) {
            alert(`${data.message}\n\nДля получения реальных данных активируйте API:\n${data.apiActivationUrl}`);
          }
        }
      }
    } catch (error) {
      console.error('Ошибка загрузки сайтов с токенами:', error);
      // Fallback к демо-данным
      await loadAvailableSites();
    } finally {
      setLoadingSites(false);
    }
  };

  // Подключение к Google Search Console
  const handleConnectGSC = async () => {
    const authResult = await requireAuth();
    if (!authResult) return;

    setIsConnecting(true);
    try {
      // Получаем URL авторизации Google OAuth
      const response = await fetch(`${API_BASE}/api/tools/seo-audit-pro/auth`);
      const data = await response.json();
      
      if (data.success) {
        // Открываем окно авторизации Google
        const authWindow = window.open(
          data.authUrl, 
          'gsc-auth', 
          'width=600,height=700,scrollbars=yes,resizable=yes'
        );

        // Слушаем сообщения от окна авторизации
        const handleAuthMessage = (event: MessageEvent) => {
          if (event.origin !== window.location.origin) return;
          
          if (event.data.type === 'GSC_AUTH_SUCCESS') {
            authWindow?.close();
            setIsConnected(true);
            setIsConnecting(false);
            // Загружаем реальные сайты из GSC
            loadAvailableSitesWithTokens(event.data.tokens);
            window.removeEventListener('message', handleAuthMessage);
          } else if (event.data.type === 'GSC_AUTH_ERROR') {
            authWindow?.close();
            setIsConnecting(false);
            console.error('Ошибка авторизации GSC:', event.data.error);
            window.removeEventListener('message', handleAuthMessage);
          }
        };

        window.addEventListener('message', handleAuthMessage);

        // Проверяем, если окно было закрыто пользователем
        const checkClosed = setInterval(() => {
          if (authWindow?.closed) {
            setIsConnecting(false);
            clearInterval(checkClosed);
            window.removeEventListener('message', handleAuthMessage);
          }
        }, 1000);
      }
    } catch (error) {
      setIsConnecting(false);
      console.error('Ошибка подключения к GSC:', error);
    }
  };

  // Обработчик изменения периода
  const handlePeriodChange = async (newPeriod: 7 | 14 | 28 | 90) => {
    console.log(`🔄 SEOAuditProTool: Изменение периода с ${selectedPeriod} на ${newPeriod} дней`);
    console.log(`🗂️ Текущий результат:`, result?.data ? 'есть данные' : 'нет данных');
    
    setSelectedPeriod(newPeriod);
    
    // Если есть активные результаты и выбран сайт, перезапускаем анализ с новым периодом
    if (result?.data && selectedSite) {
      console.log(`📊 Перезапуск анализа для периода ${newPeriod} дней (было ${selectedPeriod})...`);
      
      // Очищаем предыдущие результаты и показываем loading
      setResult({
        loading: true
      });
      
      // Небольшая задержка для визуального feedback
      await new Promise(resolve => setTimeout(resolve, 100));
      
      // Запускаем анализ без инкремента счетчика (это не новый запуск, а смена периода)
      await handleAnalyzeSiteInternal(false, newPeriod);
    }
  };

  // Внутренняя функция анализа с опциональным инкрементом счетчика
  const handleAnalyzeSiteInternal = async (shouldIncrementCounter = true, customPeriod?: number) => {
    if (!selectedSite) return;

    // Инкрементируем счетчик использования только при первом запуске анализа
    if (shouldIncrementCounter) {
      try {
        const newCount = await statsService.incrementAndGetCount(TOOL_ID);
        console.log(`SEO Audit Pro: Launch count updated from ${launchCount} to ${newCount}`);
        setLaunchCount(newCount);
      } catch (error) {
        console.error('Error updating launch count:', error);
        // Продолжаем анализ даже если не удалось обновить счетчик
      }
    }

    // Очищаем предыдущие результаты
    setResult({
      loading: true
    });

    try {
      // Получаем сохраненные токены GSC
      const savedTokens = localStorage.getItem('gsc-tokens');
      const tokens = savedTokens ? JSON.parse(savedTokens) : null;
      
      // Добавляем случайный параметр для предотвращения кэширования
      const cacheBuster = Date.now();
      const actualPeriod = customPeriod || selectedPeriod;
      
      console.log(`🔍 Запрос анализа для ${selectedSite}, период: ${actualPeriod} дней, cacheBuster: ${cacheBuster}`);
      
      const requestBody = {
        website: selectedSite,
        tokens: tokens,
        useMockData: false,
        period: actualPeriod,
        cacheBuster
      };
      
      console.log(`📤 Отправляем запрос с телом:`, {
        website: selectedSite,
        period: actualPeriod,
        tokensPresent: !!tokens,
        cacheBuster
      });
      
      // API запрос к endpoint для анализа реальных GSC данных
      const response = await fetch(`${API_BASE}/api/tools/seo-audit-pro/analyze?_t=${cacheBuster}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(requestBody)
      });

      if (!response.ok) {
        throw new Error('Ошибка получения данных GSC');
      }

      const data = await response.json();
      console.log('📊 Получены данные анализа:', data);

      if (data.success && data.analysis) {
        console.log(`✅ SEOAuditProTool: Данные получены для периода ${selectedPeriod}:`, {
          totalClicks: data.analysis.gscData?.searchPerformance?.totalClicks,
          totalImpressions: data.analysis.gscData?.searchPerformance?.totalImpressions,
          averageCTR: data.analysis.gscData?.searchPerformance?.averageCTR
        });
        
        setResult({
          loading: false,
          data: data.analysis
        });
      } else {
        throw new Error(data.error || 'Неизвестная ошибка анализа');
      }
    } catch (error) {
      console.error('❌ Ошибка анализа сайта:', error);
      setResult({
        loading: false,
        error: error instanceof Error ? error.message : 'Неизвестная ошибка анализа'
      });
    }
  };

  // Публичная функция запуска анализа (с инкрементом счетчика)
  const handleAnalyzeSite = async () => {
    await handleAnalyzeSiteInternal(true);
  };

  return (
    <div className="seo-audit-pro-tool">
      {/* Header Island */}
      <div className="tool-header-island">
        <Link to={createLink.createLink('')} className="back-button">
          <img src="/icons/arrow_left.svg" alt="" />
          Все инструменты
        </Link>
        <h1 className="tool-title">{t('tools.names.seo-audit-pro')}</h1>
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

      <div className="seopro-main-workspace">
        {/* GSC Connection Section */}
        {!isConnected ? (
          <div className="seopro-gsc-connection-section">
            <div className="seopro-gsc-intro">
              <div className="seopro-gsc-icon">
                <img src="/icons/google-search-console.svg" alt="Google Search Console" />
              </div>
              <h2>Подключите Google Search Console</h2>
              <p className="seopro-gsc-description">
                Получите персональный SEO-анализ на основе реальных данных Google о вашем сайте
              </p>
              
              <div className="seopro-gsc-benefits">
                <div className="seopro-benefit-item">
                  <span className="seopro-benefit-icon">📊</span>
                  <span>Реальные данные поиска</span>
                </div>
                <div className="seopro-benefit-item">
                  <span className="seopro-benefit-icon">🔍</span>
                  <span>Анализ ключевых запросов</span>
                </div>
                <div className="seopro-benefit-item">
                  <span className="seopro-benefit-icon">⚡</span>
                  <span>Проблемы производительности</span>
                </div>
                <div className="seopro-benefit-item">
                  <span className="seopro-benefit-icon">🎯</span>
                  <span>Персональные рекомендации</span>
                </div>
              </div>

              <button 
                className={`seopro-gsc-connect-btn ${isConnecting ? 'connecting' : ''}`}
                onClick={handleConnectGSC}
                disabled={isConnecting}
              >
                {isConnecting ? (
                  <>
                    <div className="seopro-loading-spinner"></div>
                    Подключаемся...
                  </>
                ) : (
                  <>
                    <img src="/icons/google.svg" alt="" />
                    Подключить Google Search Console
                  </>
                )}
              </button>
            </div>
          </div>
        ) : (
          <>
            {/* Website Selection Section */}
            <div className="seopro-website-input-section">
              <div className="seopro-site-selector-container">
                <select
                  value={selectedSite}
                  onChange={(e) => setSelectedSite(e.target.value)}
                  className="seopro-site-selector"
                  disabled={loadingSites}
                >
                  <option value="">
                    {loadingSites ? 'Загружаю сайты...' : 'Выберите сайт для анализа'}
                  </option>
                  {availableSites.map((site, index) => (
                    <option key={index} value={site.siteUrl}>
                      {site.siteUrl} {site.permissionLevel === 'siteOwner' ? '👑' : '👤'}
                    </option>
                  ))}
                </select>
              </div>
              
              <button 
                className="seopro-analyze-btn"
                onClick={handleAnalyzeSite}
                disabled={!selectedSite || (result?.loading || false)}
              >
                {result?.loading ? (
                  <>
                    <div className="seopro-loading-spinner"></div>
                    Анализируем...
                  </>
                ) : (
                  'Проанализировать'
                )}
              </button>
            </div>

            {/* Results Section */}
            {result && (
              <div className="seo-audit-pro-results">
                {result.loading && (
                  <div className="seopro-loading-state">
                    <div className="seopro-loading-spinner large"></div>
                    <h3>Анализируем данные Google Search Console</h3>
                    <p>Получаем актуальную информацию о вашем сайте...</p>
                    <div className="seopro-loading-steps">
                      <div className="seopro-step active">📊 Загружаем статистику поиска</div>
                      <div className="seopro-step">🔍 Анализируем индексацию</div>
                      <div className="seopro-step">⚡ Проверяем Core Web Vitals</div>
                      <div className="seopro-step">🎯 Формируем рекомендации</div>
                    </div>
                  </div>
                )}

                {result.error && (
                  <div className="seopro-error-state">
                    <h3>❌ Ошибка анализа</h3>
                    <p>{result.error}</p>
                    <button className="seopro-retry-btn" onClick={handleAnalyzeSite}>
                      Попробовать снова
                    </button>
                  </div>
                )}

                {result.data && (
                  <SEOAnalysisResults 
                    data={result.data} 
                    selectedPeriod={selectedPeriod}
                    onPeriodChange={handlePeriodChange}
                  />
                )}
              </div>
            )}
          </>
        )}
      </div>

      {/* Модальные окна аутентификации */}
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

export default SEOAuditProTool;