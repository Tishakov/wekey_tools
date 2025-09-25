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

const TOOL_ID = 'seo-audit-pro';
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
  const [website, setWebsite] = useState('');
  const [isConnecting, setIsConnecting] = useState(false);
  const [isConnected, setIsConnected] = useState(false);
  const [result, setResult] = useState<AuditResult | null>(null);

  // Загружаем статистику при инициализации
  useEffect(() => {
    statsService.getLaunchCount(TOOL_ID).then(setLaunchCount);
  }, []);

  // Подключение к Google Search Console
  const handleConnectGSC = async () => {
    const authResult = await requireAuth();
    if (!authResult) return;

    setIsConnecting(true);
    try {
      // Инкрементируем счетчик использования
      const newCount = await statsService.incrementAndGetCount(TOOL_ID);
      setLaunchCount(newCount);

      // Здесь будет логика подключения к GSC
      // Пока имитируем процесс
      setTimeout(() => {
        setIsConnected(true);
        setIsConnecting(false);
      }, 2000);
    } catch (error) {
      setIsConnecting(false);
      console.error('Ошибка подключения к GSC:', error);
    }
  };

  // Запуск анализа сайта
  const handleAnalyzeSite = async () => {
    if (!website.trim()) return;

    setResult({
      loading: true
    });

    try {
      // API запрос к новому endpoint для анализа GSC данных
      const response = await fetch(`${API_BASE}/api/tools/seo-audit-pro/analyze`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          website: website.trim(),
          useMockData: true // Используем демо-данные для тестирования
        })
      });

      if (!response.ok) {
        throw new Error('Ошибка получения данных GSC');
      }

      const data = await response.json();
      
      if (data.success) {
        setResult({
          loading: false,
          data: data.analysis
        });
      } else {
        throw new Error(data.error || 'Ошибка анализа');
      }
    } catch (error) {
      setResult({
        loading: false,
        error: error instanceof Error ? error.message : 'Неизвестная ошибка'
      });
    }
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

      <div className="main-workspace">
        {/* GSC Connection Section */}
        {!isConnected ? (
          <div className="gsc-connection-section">
            <div className="gsc-intro">
              <div className="gsc-icon">
                <img src="/icons/google-search-console.svg" alt="Google Search Console" />
              </div>
              <h2>Подключите Google Search Console</h2>
              <p className="gsc-description">
                Получите персональный SEO-анализ на основе реальных данных Google о вашем сайте
              </p>
              
              <div className="gsc-benefits">
                <div className="benefit-item">
                  <span className="benefit-icon">📊</span>
                  <span>Реальные данные поиска</span>
                </div>
                <div className="benefit-item">
                  <span className="benefit-icon">🔍</span>
                  <span>Анализ ключевых запросов</span>
                </div>
                <div className="benefit-item">
                  <span className="benefit-icon">⚡</span>
                  <span>Проблемы производительности</span>
                </div>
                <div className="benefit-item">
                  <span className="benefit-icon">🎯</span>
                  <span>Персональные рекомендации</span>
                </div>
              </div>

              <button 
                className={`gsc-connect-btn ${isConnecting ? 'connecting' : ''}`}
                onClick={handleConnectGSC}
                disabled={isConnecting}
              >
                {isConnecting ? (
                  <>
                    <div className="loading-spinner"></div>
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
            {/* Website Input Section */}
            <div className="website-input-section">
              <h3>Выберите сайт для анализа</h3>
              <div className="website-input-row">
                <input
                  type="text"
                  value={website}
                  onChange={(e) => setWebsite(e.target.value)}
                  placeholder="example.com"
                  className="website-input"
                />
                <button 
                  className="analyze-btn"
                  onClick={handleAnalyzeSite}
                  disabled={!website.trim() || (result?.loading || false)}
                >
                  {result?.loading ? (
                    <>
                      <div className="loading-spinner"></div>
                      Анализируем...
                    </>
                  ) : (
                    'Проанализировать'
                  )}
                </button>
              </div>
            </div>

            {/* Results Section */}
            {result && (
              <div className="seo-audit-pro-results">
                {result.loading && (
                  <div className="loading-state">
                    <div className="loading-spinner large"></div>
                    <h3>Анализируем данные Google Search Console</h3>
                    <p>Получаем актуальную информацию о вашем сайте...</p>
                    <div className="loading-steps">
                      <div className="step active">📊 Загружаем статистику поиска</div>
                      <div className="step">🔍 Анализируем индексацию</div>
                      <div className="step">⚡ Проверяем Core Web Vitals</div>
                      <div className="step">🎯 Формируем рекомендации</div>
                    </div>
                  </div>
                )}

                {result.error && (
                  <div className="error-state">
                    <h3>❌ Ошибка анализа</h3>
                    <p>{result.error}</p>
                    <button className="retry-btn" onClick={handleAnalyzeSite}>
                      Попробовать снова
                    </button>
                  </div>
                )}

                {result.data && (
                  <SEOAnalysisResults data={result.data} />
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