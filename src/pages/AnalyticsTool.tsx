import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import '../styles/tool-pages.css';
import './AnalyticsTool.css';

// Типы данных
interface Metric {
  id: string;
  name: string;
  tooltip: string;
  isPercentage: boolean;
  defaultValue: number;
}

interface Group {
  title: string;
  color: string;
  metrics: Metric[];
}

// Конфигурация групп и параметров
const metricsConfig: Group[] = [
  {
    title: 'Реклама',
    color: '#6B7280', // серый
    metrics: [
      { id: 'impressions', name: 'Показы', tooltip: 'Количество показов рекламы', isPercentage: false, defaultValue: 1000 },
      { id: 'ctr', name: 'CTR', tooltip: 'Click Through Rate - отношение кликов к показам', isPercentage: true, defaultValue: 10 },
      { id: 'clicks', name: 'Клики', tooltip: 'Количество кликов по рекламе', isPercentage: false, defaultValue: 100 },
    ]
  },
  {
    title: 'Расходы',
    color: '#EF4444', // красный
    metrics: [
      { id: 'cpc', name: 'CPC – стоимость клика', tooltip: 'Cost Per Click - стоимость одного клика', isPercentage: false, defaultValue: 10 },
      { id: 'adCost', name: 'Затраты на рекламу', tooltip: 'Общие затраты на рекламную кампанию', isPercentage: false, defaultValue: 1000 },
    ]
  },
  {
    title: 'Сайт',
    color: '#F59E0B', // жёлтый
    metrics: [
      { id: 'cr1', name: 'CR1 – Конверсия сайта %', tooltip: 'Conversion Rate 1 - процент посетителей, ставших лидами', isPercentage: true, defaultValue: 5 },
      { id: 'leads', name: 'Лидов, продаж', tooltip: 'Количество полученных лидов', isPercentage: false, defaultValue: 50 },
      { id: 'cpl', name: 'CPL – стоимость лида', tooltip: 'Cost Per Lead - стоимость получения одного лида', isPercentage: false, defaultValue: 20 },
    ]
  },
  {
    title: 'Отдел продаж',
    color: '#3B82F6', // синий
    metrics: [
      { id: 'cr2', name: 'CR2 – Из лида в продажу %', tooltip: 'Conversion Rate 2 - процент лидов, ставших продажами', isPercentage: true, defaultValue: 20 },
      { id: 'sales', name: 'Сделок, продаж', tooltip: 'Количество заключенных сделок', isPercentage: false, defaultValue: 10 },
      { id: 'cpo', name: 'CPO – цена сделки, продажи', tooltip: 'Cost Per Order - стоимость получения одной сделки', isPercentage: false, defaultValue: 100 },
    ]
  },
  {
    title: 'Ценообразование',
    color: '#8B5CF6', // фиолетовый
    metrics: [
      { id: 'aov', name: 'AOV – средний чек (одной)', tooltip: 'Average Order Value - средняя стоимость одного заказа', isPercentage: false, defaultValue: 500 },
      { id: 'revenue', name: 'Валовой доход', tooltip: 'Общий доход от продаж', isPercentage: false, defaultValue: 5000 },
      { id: 'marginPercent', name: 'Маржинальность %', tooltip: 'Процент маржи от дохода', isPercentage: true, defaultValue: 50 },
      { id: 'marginPerUnit', name: 'Маржа с одной', tooltip: 'Маржа с одной единицы товара', isPercentage: false, defaultValue: 250 },
    ]
  },
  {
    title: 'Доходы',
    color: '#10B981', // зелёный
    metrics: [
      { id: 'profit', name: 'Прибыль', tooltip: 'Общая прибыль', isPercentage: false, defaultValue: 2500 },
      { id: 'netProfit', name: 'Чистая прибыль', tooltip: 'Чистая прибыль после всех расходов', isPercentage: false, defaultValue: 1500 },
      { id: 'netProfitPerUnit', name: 'Чистая прибыль с одной', tooltip: 'Чистая прибыль с одной единицы', isPercentage: false, defaultValue: 150 },
      { id: 'romi', name: 'ROMI %', tooltip: 'Return on Marketing Investment - возврат инвестиций в маркетинг', isPercentage: true, defaultValue: 150 },
      { id: 'roas', name: 'ROAS', tooltip: 'Return on Advertising Spend - возврат рекламных инвестиций', isPercentage: false, defaultValue: 5 },
    ]
  },
  {
    title: 'Формулы',
    color: '#6B7280', // серый
    metrics: [
      { id: 'drr', name: 'ДРР %', tooltip: 'Доля рекламных расходов', isPercentage: true, defaultValue: 20 },
      { id: 'iccr', name: 'ICCR %', tooltip: 'Index of Customer Conversion Rate', isPercentage: true, defaultValue: 25 },
      { id: 'cpm', name: 'CPM', tooltip: 'Cost Per Mille - стоимость тысячи показов', isPercentage: false, defaultValue: 10 },
    ]
  }
];

const AnalyticsTool: React.FC = () => {
  // Состояние для всех метрик
  const [metrics, setMetrics] = useState<Record<string, number>>(() => {
    const initialState: Record<string, number> = {};
    metricsConfig.forEach(group => {
      group.metrics.forEach(metric => {
        initialState[metric.id] = metric.defaultValue;
      });
    });
    return initialState;
  });

  // Обработчик изменения значения метрики
  const handleMetricChange = (metricId: string, value: number) => {
    setMetrics(prev => ({
      ...prev,
      [metricId]: value
    }));
  };

  // Обработчик изменения слайдера
  const handleSliderChange = (metricId: string, sliderValue: number, metric: Metric) => {
    // Более умное масштабирование в зависимости от типа метрики
    let scaledValue: number;
    
    if (metric.isPercentage) {
      // Для процентов: 0-100 слайдер -> 0-100% значение
      scaledValue = sliderValue;
    } else {
      // Для обычных значений: масштабируем в зависимости от базового значения
      const baseValue = metric.defaultValue;
      scaledValue = (sliderValue / 50) * baseValue; // 50 = средняя позиция слайдера
    }
    
    handleMetricChange(metricId, scaledValue);
  };

  // Получение значения слайдера из текущего значения метрики
  const getSliderValue = (metricId: string, metric: Metric): number => {
    const currentValue = metrics[metricId];
    
    if (metric.isPercentage) {
      // Для процентов: прямое соответствие
      return Math.min(100, Math.max(0, currentValue));
    } else {
      // Для обычных значений: обратное масштабирование
      const baseValue = metric.defaultValue;
      return Math.min(100, Math.max(0, (currentValue / baseValue) * 50));
    }
  };

  return (
    <div className="tool-container">
      {/* Заголовок */}
      <header className="tool-header-island">
        <Link to="/" className="back-button">
          <img src="/icons/arrow_left.svg" alt="" />
          Все инструменты
        </Link>
        
        <h1 className="tool-title">Сквозная аналитика</h1>
        
        <div className="tool-header-buttons">
          <button className="tool-header-btn counter-btn" title="Счетчик запусков">
            <img src="/icons/rocket.svg" alt="" />
            <span className="counter">0</span>
          </button>
          <button className="tool-header-btn icon-only" title="Подсказки">
            <img src="/icons/lamp.svg" alt="" />
          </button>
          <button className="tool-header-btn icon-only" title="Скриншот">
            <img src="/icons/camera.svg" alt="" />
          </button>
        </div>
      </header>

      {/* Основная область */}
      <main className="main-workspace">
        <div className="analytics-container">
          {/* Заголовки таблицы */}
          <div className="table-header">
            <div className="column-header">Параметр</div>
            <div className="column-header">На что можно влиять</div>
            <div className="column-header">
              <div className="dual-header">
                <span>День</span>
                <span>30 Дней</span>
              </div>
            </div>
          </div>

          {/* Группы параметров */}
          {metricsConfig.map((group) => (
            <div key={group.title} className="metrics-group">
              {/* Заголовок группы - вертикальный слева */}
              <div className="group-title-vertical" style={{ color: group.color }}>
                <div className="icon-background"></div>
                <span className="group-text">{group.title}</span>
              </div>

              {/* Метрики группы */}
              <div className="group-metrics">
                {group.metrics.map((metric) => (
                  <div key={metric.id} className="metric-row">
                    {/* Название параметра */}
                    <div className="metric-name">
                      <button 
                        className="help-button" 
                        title={metric.tooltip}
                        style={{ backgroundColor: group.color }}
                      >
                        ?
                      </button>
                      <span>{metric.name}</span>
                    </div>

                    {/* Слайдер */}
                    <div className="metric-slider">
                      <input
                        type="range"
                        min="0"
                        max="100"
                        value={getSliderValue(metric.id, metric)}
                        onChange={(e) => handleSliderChange(metric.id, parseInt(e.target.value), metric)}
                        className="slider"
                        style={{
                          '--thumb-color': group.color
                        } as React.CSSProperties}
                      />
                    </div>

                    {/* Поля ввода */}
                    <div className="metric-values">
                      <input
                        type="number"
                        value={metric.isPercentage ? 
                          parseFloat(metrics[metric.id].toFixed(1)) : 
                          metrics[metric.id]
                        }
                        onChange={(e) => handleMetricChange(metric.id, parseFloat(e.target.value) || 0)}
                        className="value-input"
                        placeholder="0"
                        step={metric.isPercentage ? "0.1" : "1"}
                      />
                      <input
                        type="number"
                        value={metric.isPercentage ? 
                          parseFloat((metrics[metric.id] * 30).toFixed(1)) : 
                          metrics[metric.id] * 30
                        }
                        readOnly
                        className="value-input readonly"
                        placeholder="0"
                      />
                      {metric.isPercentage && <span className="percentage-symbol">%</span>}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </main>
    </div>
  );
};

export default AnalyticsTool;