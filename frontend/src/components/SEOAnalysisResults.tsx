import React from 'react';
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
}

const SEOAnalysisResults: React.FC<SEOAnalysisResultsProps> = ({ data }) => {
  const { gscData, overallScore, healthStatus, recommendations } = data;
  const { searchPerformance, indexCoverage } = gscData;

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

  // Функция для форматирования больших чисел
  const formatNumber = (num: number) => {
    if (num >= 1000000) return (num / 1000000).toFixed(1) + 'M';
    if (num >= 1000) return (num / 1000).toFixed(1) + 'K';
    return num.toString();
  };

  return (
    <div className="seo-analysis-results">
      {/* Главная панель с метриками */}
      <div className="seopro-metrics-dashboard">
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
          <div className="seopro-metric-label">Проиндексированные</div>
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

      {/* Health Score с круговой диаграммой */}
      <div className="health-score-section">
        <h3>Общая оценка SEO</h3>
        <div className="health-score-wrapper">
          <div className="health-score-chart">
            <div className="score-circle-container">
              <svg viewBox="0 0 200 200" className="score-circle-svg">
                {/* Фоновый круг */}
                <circle
                  cx="100"
                  cy="100" 
                  r="80"
                  fill="none"
                  stroke="#374151"
                  strokeWidth="12"
                />
                {/* Прогресс круг */}
                <circle
                  cx="100"
                  cy="100"
                  r="80"
                  fill="none"
                  stroke={getHealthScoreColor(overallScore)}
                  strokeWidth="12"
                  strokeLinecap="round"
                  strokeDasharray={`${(overallScore / 100) * 502.65} 502.65`}
                  transform="rotate(-90 100 100)"
                  className="score-progress-circle"
                />
              </svg>
              <div className="score-content-center">
                <div className="score-number">{overallScore}</div>
                <div className="score-total">из 100</div>
                <div className={`score-status score-${healthStatus}`}>
                  {healthStatus === 'excellent' && 'Отлично'}
                  {healthStatus === 'good' && 'Хорошо'}
                  {healthStatus === 'average' && 'Средне'}
                  {healthStatus === 'poor' && 'Плохо'}
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