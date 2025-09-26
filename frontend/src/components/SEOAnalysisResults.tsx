import React, { useEffect } from 'react';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  LineChart,
  Line,
  Area,
  AreaChart
} from 'recharts';
import './SEOAnalysisResults.css';

interface Query {
  query: string;
  clicks: number;
  impressions: number;
  ctr: number;
  position: number;
}

interface Page {
  page: string;
  clicks: number;
  impressions: number;
  ctr: number;
  position: number;
}

interface Device {
  device: string;
  clicks: number;
  impressions: number;
  ctr: number;
  position: number;
}

interface Recommendation {
  priority: 'high' | 'medium' | 'low';
  category: string;
  title: string;
  description: string;
  impact: string;
  actionSteps: string[];
}

interface DeviceMetrics {
  mobile: {
    clicks: number;
    impressions: number;
    ctr: number;
  };
  desktop: {
    clicks: number;
    impressions: number;
    ctr: number;
  };
  tablet: {
    clicks: number;
    impressions: number;
    ctr: number;
  };
}

interface Changes {
  clicksChange: number;
  impressionsChange: number;
  ctrChange: number;
  positionChange: number;
}

interface AdvancedMetrics {
  top10Positions: number;
  featuredSnippets: number;
  estimatedBacklinks: number;
}

interface AnalysisData {
  url: string;
  period?: {
    startDate: string;
    endDate: string;
  };
  periodDays?: number; // Добавляем поле для периода в днях
  gscData: {
    searchPerformance?: {
      totalClicks: number;
      totalImpressions: number;
      averageCTR: number;
      averagePosition: number;
      changes?: Changes;
      deviceMetrics?: DeviceMetrics;
      uniqueQueries?: number;
      advancedMetrics?: AdvancedMetrics;
      queries: Query[];
      pages: Page[];
      devices?: Device[];
    };
    indexCoverage?: {
      validPages: number;
      errorPages: number;
      excludedPages: number;
      warnings: number;
      status?: string;
    };
  };
  overallScore: number;
  healthStatus: string;
  recommendations: Recommendation[];
}

interface SEOAnalysisResultsProps {
  data: AnalysisData;
  selectedPeriod?: 7 | 14 | 28 | 90;
  onPeriodChange?: (period: 7 | 14 | 28 | 90) => void;
}

const SEOAnalysisResults: React.FC<SEOAnalysisResultsProps> = ({ 
  data, 
  selectedPeriod = 28, 
  onPeriodChange 
}) => {
  const { gscData, overallScore, healthStatus, recommendations } = data;
  const { searchPerformance, indexCoverage } = gscData;

  // Функция для форматирования больших чисел (объявляем рано для использования в useEffect)
  const formatNumber = (num: number) => {
    if (num >= 1000000) return (num / 1000000).toFixed(1) + 'M';
    if (num >= 1000) return (num / 1000).toFixed(1) + 'K';
    return num.toString();
  };

  // Проверка соответствия данных и выбранного периода
  const isDataMatching = !data.periodDays || data.periodDays === selectedPeriod;
  
  // Логирование изменений данных для отладки
  useEffect(() => {
    console.log('🔄 SEOAnalysisResults: Пропсы изменились', {
      selectedPeriod,
      dataPeriod: data.periodDays,
      isMatching: isDataMatching,
      totalClicks: searchPerformance?.totalClicks,
      totalImpressions: searchPerformance?.totalImpressions,
      averageCTR: searchPerformance?.averageCTR,
      dataTimestamp: data.url
    });
    
    if (!isDataMatching) {
      console.warn(`⚠️ НЕСООТВЕТСТВИЕ: Показываем данные для ${data.periodDays} дней, а период выбран ${selectedPeriod} дней!`);
    }
    
    console.log(`🎨 Рендер метрик для периода ${selectedPeriod}:`, {
      totalClicks: searchPerformance?.totalClicks,
      totalImpressions: searchPerformance?.totalImpressions,
      averageCTR: searchPerformance?.averageCTR,
      formatNumberClicks: searchPerformance?.totalClicks ? formatNumber(searchPerformance.totalClicks) : 'N/A'
    });
  }, [data, selectedPeriod, searchPerformance?.totalClicks, searchPerformance?.totalImpressions, isDataMatching]);

  // Проверяем наличие данных производительности
  if (!searchPerformance) {
    return (
      <div className="seo-analysis-results">
        <div className="error-state">
          <h3>❌ Данные недоступны</h3>
          <p>Не удалось получить данные производительности поиска</p>
        </div>
      </div>
    );
  }

  // Показываем индикатор загрузки, если данные не соответствуют выбранному периоду
  if (!isDataMatching) {
    return (
      <div className="seo-analysis-results">
        <div className="seopro-loading-state">
          <div className="seopro-loading-spinner large"></div>
          <h3>🔄 Загружаем данные для периода {selectedPeriod} дней</h3>
          <p>Обновляем аналитику для выбранного периода...</p>
        </div>
      </div>
    );
  }

  // Цвета для графиков
  const COLORS = {
    primary: '#4285f4',
    secondary: '#34a853',
    warning: '#fbbc05',
    danger: '#ea4335',
    info: '#9c27b0'
  };

  // Подготовка данных для диаграммы устройств
  const deviceData = searchPerformance.devices?.map(device => ({
    name: device.device === 'MOBILE' ? 'Мобильные' : 
          device.device === 'DESKTOP' ? 'Десктоп' : 'Планшеты',
    clicks: device.clicks,
    impressions: device.impressions,
    ctr: device.ctr
  })) || [];

  // Данные для круговой диаграммы индексации
  const indexData = indexCoverage ? [
    { name: 'Проиндексированы', value: indexCoverage.validPages, color: COLORS.secondary },
    { name: 'Ошибки', value: indexCoverage.errorPages, color: COLORS.danger },
    { name: 'Исключены', value: indexCoverage.excludedPages, color: COLORS.warning },
    { name: 'Предупреждения', value: indexCoverage.warnings, color: COLORS.info }
  ] : [];

  // Функция для определения цвета health score
  const getHealthScoreColor = (score: number) => {
    if (score >= 80) return COLORS.secondary;
    if (score >= 60) return COLORS.primary;
    if (score >= 40) return COLORS.warning;
    return COLORS.danger;
  };

  // Функции для расчета компонентных скоров
  const getTrafficScore = (performance: any) => {
    const clicks = performance.totalClicks || 0;
    const impressions = performance.totalImpressions || 0;
    const ctr = performance.averageCTR || 0;
    
    // Скор на основе трафика (0-100)
    let score = 0;
    if (clicks > 10000) score += 40;
    else if (clicks > 5000) score += 30;
    else if (clicks > 1000) score += 20;
    else if (clicks > 100) score += 10;
    
    if (impressions > 100000) score += 30;
    else if (impressions > 50000) score += 20;
    else if (impressions > 10000) score += 15;
    else if (impressions > 1000) score += 10;
    
    if (ctr > 5) score += 30;
    else if (ctr > 3) score += 20;
    else if (ctr > 1) score += 10;
    
    return Math.min(100, score);
  };

  const getPositionScore = (performance: any) => {
    const avgPosition = performance.averagePosition || 100;
    const top10 = performance.advancedMetrics?.top10Positions || 0;
    const totalQueries = performance.uniqueQueries || 1;
    
    // Скор на основе позиций (0-100)
    let score = 0;
    if (avgPosition <= 3) score += 40;
    else if (avgPosition <= 5) score += 30;
    else if (avgPosition <= 10) score += 20;
    else if (avgPosition <= 20) score += 10;
    
    const top10Ratio = top10 / totalQueries;
    if (top10Ratio > 0.5) score += 60;
    else if (top10Ratio > 0.3) score += 40;
    else if (top10Ratio > 0.1) score += 20;
    else if (top10Ratio > 0.05) score += 10;
    
    return Math.min(100, score);
  };

  const getTechnicalScore = (coverage: any) => {
    if (!coverage) return 0;
    
    const validPages = coverage.validPages || 0;
    const errorPages = coverage.errorPages || 0;
    const totalPages = validPages + errorPages;
    
    if (totalPages === 0) return 0;
    
    // Скор на основе технического состояния (0-100)
    const healthRatio = validPages / totalPages;
    let score = healthRatio * 80;
    
    if (validPages > 1000) score += 20;
    else if (validPages > 500) score += 15;
    else if (validPages > 100) score += 10;
    else if (validPages > 10) score += 5;
    
    return Math.min(100, Math.round(score));
  };

  const getProScore = (performance: any) => {
    const featuredSnippets = performance.advancedMetrics?.featuredSnippets || 0;
    const backlinks = performance.advancedMetrics?.estimatedBacklinks || 0;
    
    // Скор на основе PRO метрик (0-100)
    let score = 0;
    
    if (featuredSnippets > 20) score += 50;
    else if (featuredSnippets > 10) score += 35;
    else if (featuredSnippets > 5) score += 25;
    else if (featuredSnippets > 0) score += 15;
    
    if (backlinks > 1000) score += 50;
    else if (backlinks > 500) score += 35;
    else if (backlinks > 100) score += 25;
    else if (backlinks > 10) score += 15;
    
    return Math.min(100, score);
  };

  const getComponentScoreColor = (score: number) => {
    if (score >= 75) return '#10B981'; // Зеленый
    if (score >= 50) return '#F59E0B'; // Желтый
    return '#EF4444'; // Красный
  };

  // Функция для изменения периода
  const handlePeriodChange = (period: 7 | 14 | 28 | 90) => {
    console.log(`📅 SEOAnalysisResults: Изменение периода с ${selectedPeriod} на ${period}`);
    console.log(`📊 Текущие данные до изменения:`, {
      totalClicks: searchPerformance?.totalClicks,
      totalImpressions: searchPerformance?.totalImpressions,
      averageCTR: searchPerformance?.averageCTR
    });
    
    if (onPeriodChange) {
      onPeriodChange(period);
    }
  };

  // Получить текст периода для отображения
  const getPeriodText = (days: number) => {
    switch (days) {
      case 7: return 'Неделя';
      case 14: return '2 недели';
      case 28: return 'Месяц';
      case 90: return '3 месяца';
      default: return 'Месяц';
    }
  };

  // Логирование данных для отладки
  console.log(`🔍 SEOAnalysisResults render:`, {
    selectedPeriod,
    totalClicks: searchPerformance.totalClicks,
    totalImpressions: searchPerformance.totalImpressions,
    dataTimestamp: new Date().toISOString()
  });

  return (
    <div className="seo-analysis-results">
      {/* Главная панель с метриками */}
      <div className="seopro-metrics-dashboard">
        {/* Селектор периода */}
        <div className="seopro-period-selector">
          <div className="seopro-period-label">📅 Период анализа:</div>
          <div className="seopro-period-buttons">
            {[7, 14, 28, 90].map((days) => (
              <button
                key={days}
                className={`seopro-period-btn ${selectedPeriod === days ? 'active' : ''}`}
                onClick={() => handlePeriodChange(days as 7 | 14 | 28 | 90)}
              >
                {getPeriodText(days)}
              </button>
            ))}
          </div>
        </div>

        {/* Основные метрики с изменениями */}
        <div className="seopro-metric-card primary-metric">
          <div className="seopro-metric-icon">👆</div>
          <div className="seopro-metric-value">{formatNumber(searchPerformance.totalClicks)}</div>
          <div className="seopro-metric-label">Клики</div>
          {searchPerformance.changes?.clicksChange !== undefined && (
            <div className={`seopro-metric-change ${searchPerformance.changes.clicksChange >= 0 ? 'positive' : 'negative'}`}>
              {searchPerformance.changes.clicksChange >= 0 ? '↗' : '↘'} {Math.abs(searchPerformance.changes.clicksChange).toFixed(1)}%
            </div>
          )}
        </div>
        
        <div className="seopro-metric-card primary-metric">
          <div className="seopro-metric-icon">👁️</div>
          <div className="seopro-metric-value">{formatNumber(searchPerformance.totalImpressions)}</div>
          <div className="seopro-metric-label">Показы</div>
          {searchPerformance.changes?.impressionsChange !== undefined && (
            <div className={`seopro-metric-change ${searchPerformance.changes.impressionsChange >= 0 ? 'positive' : 'negative'}`}>
              {searchPerformance.changes.impressionsChange >= 0 ? '↗' : '↘'} {Math.abs(searchPerformance.changes.impressionsChange).toFixed(1)}%
            </div>
          )}
        </div>
        
        <div className="seopro-metric-card primary-metric">
          <div className="seopro-metric-icon">📊</div>
          <div className="seopro-metric-value">{searchPerformance.averageCTR.toFixed(1)}%</div>
          <div className="seopro-metric-label">Средний CTR</div>
          {searchPerformance.changes?.ctrChange !== undefined && (
            <div className={`seopro-metric-change ${searchPerformance.changes.ctrChange >= 0 ? 'positive' : 'negative'}`}>
              {searchPerformance.changes.ctrChange >= 0 ? '↗' : '↘'} {Math.abs(searchPerformance.changes.ctrChange).toFixed(1)}%
            </div>
          )}
        </div>
        
        <div className="seopro-metric-card primary-metric">
          <div className="seopro-metric-icon">🎯</div>
          <div className="seopro-metric-value">{searchPerformance.averagePosition.toFixed(1)}</div>
          <div className="seopro-metric-label">Средняя позиция</div>
          {searchPerformance.changes?.positionChange !== undefined && (
            <div className={`seopro-metric-change ${searchPerformance.changes.positionChange <= 0 ? 'positive' : 'negative'}`}>
              {searchPerformance.changes.positionChange <= 0 ? '↗' : '↘'} {Math.abs(searchPerformance.changes.positionChange).toFixed(1)}%
            </div>
          )}
        </div>

        {/* Новые метрики по устройствам */}
        <div className="seopro-metric-card device-metric">
          <div className="seopro-metric-icon">📱</div>
          <div className="seopro-metric-value">
            {searchPerformance.deviceMetrics?.mobile?.ctr?.toFixed(1) || '0.0'}%
          </div>
          <div className="seopro-metric-label">Mobile CTR</div>
          <div className="seopro-metric-detail">
            {formatNumber(searchPerformance.deviceMetrics?.mobile?.clicks || 0)} кликов
          </div>
        </div>

        <div className="seopro-metric-card device-metric">
          <div className="seopro-metric-icon">🖥️</div>
          <div className="seopro-metric-value">
            {searchPerformance.deviceMetrics?.desktop?.ctr?.toFixed(1) || '0.0'}%
          </div>
          <div className="seopro-metric-label">Desktop CTR</div>
          <div className="seopro-metric-detail">
            {formatNumber(searchPerformance.deviceMetrics?.desktop?.clicks || 0)} кликов
          </div>
        </div>

        <div className="seopro-metric-card standard-metric">
          <div className="seopro-metric-icon">🔍</div>
          <div className="seopro-metric-value">{formatNumber(searchPerformance.uniqueQueries || 0)}</div>
          <div className="seopro-metric-label">Уникальных запросов</div>
          <div className="seopro-metric-detail">
            За 28 дней
          </div>
        </div>

        <div className="seopro-metric-card standard-metric">
          <div className="seopro-metric-icon">📄</div>
          <div className="seopro-metric-value">{formatNumber(data.gscData?.indexCoverage?.validPages || 0)}</div>
          <div className="seopro-metric-label">Проиндексир.</div>
          <div className="seopro-metric-detail">страницы</div>
        </div>

        <div className="seopro-metric-card warning-metric">
          <div className="seopro-metric-icon">⚠️</div>
          <div className="seopro-metric-value">{formatNumber(data.gscData?.indexCoverage?.errorPages || 0)}</div>
          <div className="seopro-metric-label">Страницы с ошибками</div>
          <div className="seopro-metric-detail">
            {data.gscData?.indexCoverage?.validPages && data.gscData.indexCoverage.validPages > 0 && 
             `${(((data.gscData.indexCoverage.errorPages || 0) / data.gscData.indexCoverage.validPages) * 100).toFixed(1)}%`
            }
          </div>
        </div>

        {/* Продвинутые метрики */}
        <div className="seopro-metric-card pro-metric">
          <div className="seopro-metric-icon">🏆</div>
          <div className="seopro-metric-value">{formatNumber(searchPerformance.advancedMetrics?.top10Positions || 0)}</div>
          <div className="seopro-metric-label">TOP-10 позиций</div>
          <div className="seopro-metric-detail">
            из {formatNumber(searchPerformance.uniqueQueries || 0)} запросов
          </div>
        </div>

        <div className="seopro-metric-card pro-metric">
          <div className="seopro-metric-icon">💎</div>
          <div className="seopro-metric-value">{formatNumber(searchPerformance.advancedMetrics?.featuredSnippets || 0)}</div>
          <div className="seopro-metric-label">Featured Snippets</div>
          <div className="seopro-metric-detail">
            избранные фрагменты
          </div>
        </div>

        <div className="seopro-metric-card pro-metric">
          <div className="seopro-metric-icon">🔗</div>
          <div className="seopro-metric-value">{formatNumber(searchPerformance.advancedMetrics?.estimatedBacklinks || 0)}</div>
          <div className="seopro-metric-label">Внешние ссылки</div>
          <div className="seopro-metric-detail">
            оценка доменов
          </div>
        </div>
      </div>

      {/* Health Score Dashboard */}
      <div className="health-score-section">
        <h3>📊 Общая оценка SEO</h3>
        
        {/* Главная оценка - большая диаграмма */}
        <div className="health-score-main">
          <div className="health-score-circle-main">
            <svg width="140" height="140">
              <circle cx="70" cy="70" r="55" fill="none" stroke="#374151" strokeWidth="10"></circle>
              <circle 
                cx="70" cy="70" r="55" 
                fill="none"
                stroke={getHealthScoreColor(overallScore)}
                strokeWidth="10"
                strokeLinecap="round"
                style={{
                  strokeDasharray: `${2 * Math.PI * 55}`,
                  strokeDashoffset: `${2 * Math.PI * 55 * (1 - overallScore / 100)}`,
                  transform: 'rotate(-90deg)',
                  transformOrigin: 'center'
                }}
              ></circle>
            </svg>
            <div className="health-score-text">
              <span className="health-score-number">{overallScore}</span>
              <span className="health-score-label">SEO Score</span>
            </div>
          </div>
          <div className="health-score-status">
            <h4>
              {healthStatus === 'excellent' && '🟢 Отличное SEO'}
              {healthStatus === 'good' && '🟡 Хорошее SEO'}
              {healthStatus === 'average' && '🟠 Среднее SEO'}
              {healthStatus === 'poor' && '🔴 Слабое SEO'}
            </h4>
            <p>
              {healthStatus === 'excellent' && 'Ваш сайт отлично оптимизирован для поисковых систем!'}
              {healthStatus === 'good' && 'Хорошая SEO оптимизация, есть небольшие возможности для улучшения.'}
              {healthStatus === 'average' && 'SEO требует внимания. Рекомендуется оптимизация.'}
              {healthStatus === 'poor' && 'SEO нуждается в серьезных улучшениях!'}
            </p>
            <div className={`health-summary ${healthStatus}`}>
              <span className="health-summary-label">⚡ Общее состояние:</span>
              <span className="health-summary-value">
                {healthStatus === 'excellent' && 'Превосходно'}
                {healthStatus === 'good' && 'Хорошо'}
                {healthStatus === 'average' && 'Удовлетворительно'}
                {healthStatus === 'poor' && 'Требует работы'}
              </span>
            </div>
          </div>
        </div>

        {/* Компонентные оценки - маленькие диаграммы */}
        <div className="health-components-section">
          <h4>🔍 Детализация по компонентам</h4>
          <div className="health-components-grid">
            
            {/* Трафик */}
            <div className="health-component-item">
              <div className="health-component-icon">📈</div>
              <div className="health-component-info">
                <div className="health-component-name">Трафик</div>
                <div className="health-component-description">Клики и показы</div>
              </div>
              <div className="health-component-value">
                <span className="health-component-number">{formatNumber(searchPerformance.totalClicks)}</span>
                <div className="health-component-score-circle">
                  <svg width="50" height="50">
                    <circle cx="25" cy="25" r="22" fill="none" stroke="#374151" strokeWidth="3"></circle>
                    <circle 
                      cx="25" cy="25" r="22" 
                      fill="none"
                      stroke={getComponentScoreColor(getTrafficScore(searchPerformance))}
                      strokeWidth="3"
                      strokeLinecap="round"
                      style={{
                        strokeDasharray: `${2 * Math.PI * 22}`,
                        strokeDashoffset: `${2 * Math.PI * 22 * (1 - getTrafficScore(searchPerformance) / 100)}`,
                        transform: 'rotate(-90deg)',
                        transformOrigin: 'center'
                      }}
                    ></circle>
                  </svg>
                  <span className="health-component-score-text">{getTrafficScore(searchPerformance)}</span>
                </div>
              </div>
            </div>

            {/* Позиции */}
            <div className="health-component-item">
              <div className="health-component-icon">🎯</div>
              <div className="health-component-info">
                <div className="health-component-name">Позиции</div>
                <div className="health-component-description">Ранжирование</div>
              </div>
              <div className="health-component-value">
                <span className="health-component-number">{searchPerformance.averagePosition.toFixed(1)}</span>
                <div className="health-component-score-circle">
                  <svg width="50" height="50">
                    <circle cx="25" cy="25" r="22" fill="none" stroke="#374151" strokeWidth="3"></circle>
                    <circle 
                      cx="25" cy="25" r="22" 
                      fill="none"
                      stroke={getComponentScoreColor(getPositionScore(searchPerformance))}
                      strokeWidth="3"
                      strokeLinecap="round"
                      style={{
                        strokeDasharray: `${2 * Math.PI * 22}`,
                        strokeDashoffset: `${2 * Math.PI * 22 * (1 - getPositionScore(searchPerformance) / 100)}`,
                        transform: 'rotate(-90deg)',
                        transformOrigin: 'center'
                      }}
                    ></circle>
                  </svg>
                  <span className="health-component-score-text">{getPositionScore(searchPerformance)}</span>
                </div>
              </div>
            </div>

            {/* Техническое */}
            <div className="health-component-item">
              <div className="health-component-icon">⚙️</div>
              <div className="health-component-info">
                <div className="health-component-name">Техническое</div>
                <div className="health-component-description">Индексация</div>
              </div>
              <div className="health-component-value">
                <span className="health-component-number">{formatNumber(indexCoverage?.validPages || 0)}</span>
                <div className="health-component-score-circle">
                  <svg width="50" height="50">
                    <circle cx="25" cy="25" r="22" fill="none" stroke="#374151" strokeWidth="3"></circle>
                    <circle 
                      cx="25" cy="25" r="22" 
                      fill="none"
                      stroke={getComponentScoreColor(getTechnicalScore(indexCoverage))}
                      strokeWidth="3"
                      strokeLinecap="round"
                      style={{
                        strokeDasharray: `${2 * Math.PI * 22}`,
                        strokeDashoffset: `${2 * Math.PI * 22 * (1 - getTechnicalScore(indexCoverage) / 100)}`,
                        transform: 'rotate(-90deg)',
                        transformOrigin: 'center'
                      }}
                    ></circle>
                  </svg>
                  <span className="health-component-score-text">{getTechnicalScore(indexCoverage)}</span>
                </div>
              </div>
            </div>

            {/* PRO метрики */}
            <div className="health-component-item">
              <div className="health-component-icon">💎</div>
              <div className="health-component-info">
                <div className="health-component-name">PRO метрики</div>
                <div className="health-component-description">Продвинутые</div>
              </div>
              <div className="health-component-value">
                <span className="health-component-number">{formatNumber(searchPerformance.advancedMetrics?.top10Positions || 0)}</span>
                <div className="health-component-score-circle">
                  <svg width="50" height="50">
                    <circle cx="25" cy="25" r="22" fill="none" stroke="#374151" strokeWidth="3"></circle>
                    <circle 
                      cx="25" cy="25" r="22" 
                      fill="none"
                      stroke={getComponentScoreColor(getProScore(searchPerformance))}
                      strokeWidth="3"
                      strokeLinecap="round"
                      style={{
                        strokeDasharray: `${2 * Math.PI * 22}`,
                        strokeDashoffset: `${2 * Math.PI * 22 * (1 - getProScore(searchPerformance) / 100)}`,
                        transform: 'rotate(-90deg)',
                        transformOrigin: 'center'
                      }}
                    ></circle>
                  </svg>
                  <span className="health-component-score-text">{getProScore(searchPerformance)}</span>
                </div>
              </div>
            </div>

          </div>
        </div>
      </div>

      {/* Топ запросы */}
      <div className="analysis-section">
        <h3>📈 Топ поисковых запросов</h3>
        <div className="queries-chart">
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={searchPerformance.queries.slice(0, 10)}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis 
                dataKey="query" 
                angle={-45}
                textAnchor="end"
                height={80}
                fontSize={12}
              />
              <YAxis />
              <Tooltip 
                formatter={(value, name) => [
                  name === 'clicks' ? `${value} кликов` : 
                  name === 'impressions' ? `${value} показов` :
                  name === 'ctr' ? `${value}% CTR` :
                  `${value} позиция`, 
                  name === 'clicks' ? 'Клики' : 
                  name === 'impressions' ? 'Показы' :
                  name === 'ctr' ? 'CTR' : 'Позиция'
                ]}
              />
              <Bar dataKey="clicks" name="clicks" fill={COLORS.primary} />
              <Bar dataKey="impressions" name="impressions" fill={COLORS.secondary} opacity={0.7} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Распределение трафика по устройствам */}
      {deviceData.length > 0 && (
        <div className="analysis-section">
          <h3>📱 Трафик по устройствам</h3>
          <div className="devices-charts">
            <div className="device-pie-chart">
              <ResponsiveContainer width="100%" height={250}>
                <PieChart>
                  <Pie
                    data={deviceData}
                    cx="50%"
                    cy="50%"
                    outerRadius={80}
                    dataKey="clicks"
                    label={({name, percent}) => `${name}: ${((percent as number) * 100).toFixed(0)}%`}
                  >
                    {deviceData.map((_entry, index) => (
                      <Cell key={`cell-${index}`} fill={Object.values(COLORS)[index]} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </div>
            
            <div className="device-metrics">
              {deviceData.map((device, index) => (
                <div key={device.name} className="device-metric">
                  <div 
                    className="device-color" 
                    style={{ backgroundColor: Object.values(COLORS)[index] }}
                  ></div>
                  <div className="device-info">
                    <div className="device-name">{device.name}</div>
                    <div className="device-stats">
                      {device.clicks} кликов • CTR {device.ctr.toFixed(1)}%
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Топ страницы */}
      <div className="analysis-section">
        <h3>📄 Топ страниц по трафику</h3>
        <div className="pages-table">
          <div className="table-header">
            <div className="table-cell">Страница</div>
            <div className="table-cell">Клики</div>
            <div className="table-cell">Показы</div>
            <div className="table-cell">CTR</div>
            <div className="table-cell">Позиция</div>
          </div>
          {searchPerformance.pages.slice(0, 10).map((page, index) => (
            <div key={index} className="table-row">
              <div className="table-cell page-url" title={page.page}>
                {page.page.replace(/^https?:\/\//, '').substring(0, 40)}...
              </div>
              <div className="table-cell">{page.clicks}</div>
              <div className="table-cell">{formatNumber(page.impressions)}</div>
              <div className="table-cell">{page.ctr.toFixed(1)}%</div>
              <div className="table-cell">{page.position.toFixed(1)}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Индексация (если данные доступны) */}
      {indexCoverage && (
        <div className="analysis-section">
          <h3>🔍 Состояние индексации</h3>
          <div className="index-coverage">
            <div className="index-pie">
              <ResponsiveContainer width="100%" height={200}>
                <PieChart>
                  <Pie
                    data={indexData}
                    cx="50%"
                    cy="50%"
                    outerRadius={70}
                    dataKey="value"
                    label={({name, value}) => `${name}: ${value}`}
                  >
                    {indexData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div className="index-summary">
              <div className="index-stat">
                <span className="index-value">{indexCoverage.validPages}</span>
                <span className="index-label">Проиндексированных страниц</span>
              </div>
              {indexCoverage.errorPages > 0 && (
                <div className="index-stat error">
                  <span className="index-value">{indexCoverage.errorPages}</span>
                  <span className="index-label">Ошибок индексации</span>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Рекомендации с приоритетами */}
      <div className="analysis-section">
        <h3>🎯 Персональные рекомендации</h3>
        <div className="recommendations-grid">
          {recommendations.map((rec, index) => (
            <div key={index} className={`recommendation-card priority-${rec.priority}`}>
              <div className="recommendation-header">
                <div className="recommendation-priority">
                  <span className={`priority-badge ${rec.priority}`}>
                    {rec.priority === 'high' && '🔥 Высокий'}
                    {rec.priority === 'medium' && '⚡ Средний'}
                    {rec.priority === 'low' && '💡 Низкий'}
                  </span>
                  <span className="recommendation-category">{rec.category}</span>
                </div>
              </div>
              
              <h4 className="recommendation-title">{rec.title}</h4>
              <p className="recommendation-description">{rec.description}</p>
              
              <div className="recommendation-impact">
                <strong>Ожидаемый эффект:</strong> {rec.impact}
              </div>
              
              <div className="recommendation-steps">
                <strong>План действий:</strong>
                <ol>
                  {rec.actionSteps.map((step, stepIndex) => (
                    <li key={stepIndex}>{step}</li>
                  ))}
                </ol>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default SEOAnalysisResults;