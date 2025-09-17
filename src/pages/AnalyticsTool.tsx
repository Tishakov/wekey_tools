import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import * as XLSX from 'xlsx';
import '../styles/tool-pages.css';
import './AnalyticsTool.css';

// Типы данных
interface Metric {
  id: string;
  name: string;
  tooltip: string;
  isPercentage: boolean;
  isDecimal?: boolean; // для полей которые должны показывать десятичные значения но без символа %
  defaultValue: number;
  hasPeriod: boolean; // флаг для двух полей (день + 30 дней)
  sliderRange?: { min: number; max: number }; // диапазон для слайдера
}

interface Group {
  title: string;
  color: string;
  metrics: Metric[];
}

// Конфигурация групп и параметров
const metricsConfig: Group[] = [
  {
    title: 'Трафик',
    color: '#6B7280', // серый
    metrics: [
      { id: 'clicks', name: 'Клики', tooltip: 'Количество кликов по рекламе', isPercentage: false, defaultValue: 300, hasPeriod: true, sliderRange: { min: 0, max: 500 } },
      { id: 'impressions', name: 'Показы', tooltip: 'Количество показов рекламы', isPercentage: false, defaultValue: 8000, hasPeriod: true, sliderRange: { min: 0, max: 10000 } },
      { id: 'ctr', name: 'CTR %', tooltip: 'Click Through Rate - отношение кликов к показам', isPercentage: true, defaultValue: 3.75, hasPeriod: false },
    ]
  },
  {
    title: 'Расходы',
    color: '#EF4444', // красный
    metrics: [
      { id: 'cpc', name: 'CPC (Стоимость клика)', tooltip: 'Cost Per Click - стоимость одного клика', isPercentage: false, isDecimal: true, defaultValue: 12, hasPeriod: false, sliderRange: { min: 0, max: 50 } },
      { id: 'adCost', name: 'Затраты на рекламу', tooltip: 'Общие затраты на рекламную кампанию', isPercentage: false, defaultValue: 3600, hasPeriod: true, sliderRange: { min: 0, max: 10000 } },
    ]
  },
  {
    title: 'Сайт',
    color: '#F59E0B', // жёлтый
    metrics: [
      { id: 'cr1', name: 'CR1 (Конверсия сайта %)', tooltip: 'Conversion Rate 1 - процент посетителей, ставших лидами', isPercentage: true, defaultValue: 4.0, hasPeriod: false, sliderRange: { min: 0, max: 50 } },
      { id: 'leads', name: 'Лидов, продаж', tooltip: 'Количество полученных лидов', isPercentage: false, isDecimal: true, defaultValue: 12, hasPeriod: true, sliderRange: { min: 0, max: 200 } },
      { id: 'cpl', name: 'CPL (Стоимость лида)', tooltip: 'Cost Per Lead - стоимость получения одного лида', isPercentage: false, defaultValue: 300, hasPeriod: false, sliderRange: { min: 0, max: 1000 } },
    ]
  },
  {
    title: 'Отдел продаж',
    color: '#3B82F6', // синий
    metrics: [
      { id: 'cr2', name: 'CR2 (Из лида в продажу %)', tooltip: 'Conversion Rate 2 - процент лидов, ставших продажами', isPercentage: true, defaultValue: 75.0, hasPeriod: false },
      { id: 'sales', name: 'Сделок, продаж', tooltip: 'Количество заключенных сделок', isPercentage: false, isDecimal: true, defaultValue: 9, hasPeriod: true, sliderRange: { min: 0, max: 100 } },
      { id: 'cpo', name: 'CPO (Цена сделки, продажи)', tooltip: 'Cost Per Order - стоимость получения одной сделки', isPercentage: false, defaultValue: 400, hasPeriod: false, sliderRange: { min: 0, max: 1000 } },
    ]
  },
  {
    title: 'Ценообразование',
    color: '#8B5CF6', // фиолетовый
    metrics: [
      { id: 'aov', name: 'AOV (Средний чек одной)', tooltip: 'Average Order Value - средняя стоимость одного заказа', isPercentage: false, defaultValue: 3000, hasPeriod: false, sliderRange: { min: 0, max: 5000 } },
      { id: 'revenue', name: 'Валовой доход', tooltip: 'Общий доход от продаж', isPercentage: false, defaultValue: 27000, hasPeriod: true, sliderRange: { min: 0, max: 100000 } },
      { id: 'marginPercent', name: 'Маржинальность %', tooltip: 'Процент маржи от дохода', isPercentage: true, defaultValue: 50, hasPeriod: false },
      { id: 'marginPerUnit', name: 'Маржа с одной', tooltip: 'Маржа с одной единицы товара', isPercentage: false, defaultValue: 1500, hasPeriod: false, sliderRange: { min: 0, max: 5000 } },
      { id: 'totalMargin', name: 'Общая маржа (Прибыль)', tooltip: 'Общая маржа от всех продаж', isPercentage: false, defaultValue: 13500, hasPeriod: false, sliderRange: { min: 0, max: 50000 } },
    ]
  },
  {
    title: 'Доходы',
    color: '#10B981', // зелёный
    metrics: [
      { id: 'netProfit', name: 'Чистая прибыль', tooltip: 'Чистая прибыль после всех расходов', isPercentage: false, defaultValue: 9900, hasPeriod: true, sliderRange: { min: 0, max: 50000 } },
      { id: 'netProfitPerUnit', name: 'Чистая прибыль с одной', tooltip: 'Чистая прибыль с одной единицы', isPercentage: false, defaultValue: 1100, hasPeriod: true, sliderRange: { min: 0, max: 5000 } },
      { id: 'romi', name: 'ROMI %', tooltip: 'Return on Marketing Investment - возврат инвестиций в маркетинг', isPercentage: true, defaultValue: 275, hasPeriod: false, sliderRange: { min: 0, max: 1000 } },
      { id: 'roas', name: 'ROAS', tooltip: 'Return on Advertising Spend - возврат рекламных инвестиций', isPercentage: false, defaultValue: 7.5, hasPeriod: false, sliderRange: { min: 0, max: 10 } },
    ]
  },
  {
    title: 'Формулы',
    color: '#6B7280', // серый
    metrics: [
      { id: 'drr', name: 'ДРР %', tooltip: 'Доля рекламных расходов', isPercentage: true, isDecimal: true, defaultValue: 13.33, hasPeriod: false },
      { id: 'iccr', name: 'ICCR %', tooltip: 'Index of Customer Conversion Rate', isPercentage: true, isDecimal: true, defaultValue: 26.67, hasPeriod: false },
      { id: 'cpm', name: 'CPM', tooltip: 'Cost Per Mille - стоимость тысячи показов', isPercentage: false, defaultValue: 450, hasPeriod: false, sliderRange: { min: 0, max: 1000 } },
    ]
  }
];

const AnalyticsTool: React.FC = () => {
  // Состояние для периода (по умолчанию 30 дней)
  const [period, setPeriod] = useState<number>(30);
  
  // Состояние для попапа экспорта
  const [showExportModal, setShowExportModal] = useState<boolean>(false);
  const [exportFormat, setExportFormat] = useState<'vertical' | 'horizontal'>('vertical');
  
  // Состояние для всех метрик
  const [metrics, setMetrics] = useState<Record<string, number | string>>(() => {
    const initialState: Record<string, number | string> = {};
    metricsConfig.forEach(group => {
      group.metrics.forEach(metric => {
        // Для процентных и десятичных полей обеспечиваем десятичный формат
        if (metric.isPercentage || metric.isDecimal) {
          initialState[metric.id] = parseFloat(metric.defaultValue.toFixed(1));
        } else {
          initialState[metric.id] = metric.defaultValue;
        }
      });
    });
    return initialState;
  });

  // Форматируем процентные и десятичные поля при инициализации
  useEffect(() => {
    const updatedMetrics: Record<string, number | string> = {};
    let hasUpdates = false;

    metricsConfig.forEach(group => {
      group.metrics.forEach(metric => {
        if ((metric.isPercentage || metric.isDecimal) && typeof metrics[metric.id] === 'number') {
          const currentValue = metrics[metric.id] as number;
          if (Number.isInteger(currentValue)) {
            updatedMetrics[metric.id] = currentValue.toFixed(1);
            hasUpdates = true;
          }
        }
      });
    });

    if (hasUpdates) {
      setMetrics(prev => ({
        ...prev,
        ...updatedMetrics
      }));
    }
  }, []); // Запускаем только один раз при монтировании

  // Проверка, должно ли поле быть readonly
  const isReadonlyField = (metricId: string): boolean => {
    const readonlyMetrics = [
      'ctr',        // CTR
      'cpl',        // CPL – стоимость лида
      'cpo',        // CPO – цена сделки, продажи
      'totalMargin', // Общая маржа
      // Все поля в блоке Доходы
      'profit',     // Прибыль
      'netProfit',  // Чистая прибыль
      'netProfitPerUnit', // Чистая прибыль с одной
      'romi',       // ROMI %
      'roas',       // ROAS
      // Все поля в блоке Формулы
      'drr',        // ДРР %
      'iccr',       // ICCR %
      'cpm'         // CPM
    ];
    return readonlyMetrics.includes(metricId);
  };

  // Проверка, должен ли слайдер быть заблокирован
  const isSliderDisabled = (metricId: string): boolean => {
    // Находим метрику в конфигурации
    const metric = metricsConfig
      .flatMap(group => group.metrics)
      .find(m => m.id === metricId);
    
    if (!metric) return true; // Если метрика не найдена, блокируем слайдер
    
    // Блокируем слайдеры для расчетных полей
    const calculatedFields = ['netProfit', 'netProfitPerUnit'];
    if (calculatedFields.includes(metricId)) return true;
    
    // Разрешаем слайдеры для:
    // 1. Полей с периодом (hasPeriod: true): клики, показы, затраты, лиды, сделки, доходы  
    // 2. Особых полей: CPC, CR1, CR2, AOV, маржинальность
    const allowedFields = ['cpc', 'cr1', 'cr2', 'aov', 'marginPercent'];
    return !metric.hasPeriod && !allowedFields.includes(metricId);
  };

  // Обработчик изменения слайдера
  const handleSliderChange = (metricId: string, sliderValue: number, metric: Metric) => {
    // Проверяем, не заблокирован ли слайдер для этой метрики
    if (isSliderDisabled(metricId)) return;
    
    // Более умное масштабирование в зависимости от типа метрики
    let scaledValue: number | string;
    
    if (metric.sliderRange) {
      // Для полей с настроенным диапазоном слайдера (включая проценты)
      const { min, max } = metric.sliderRange;
      const numericValue = (sliderValue / 100) * (max - min) + min;
      scaledValue = metric.isDecimal ? numericValue.toFixed(1) : 
                   metric.isPercentage ? numericValue.toFixed(1) : 
                   Math.round(numericValue);
    } else if (metric.isPercentage) {
      // Для процентов без диапазона: 0-100 слайдер -> 0-100% значение в десятичном формате
      scaledValue = sliderValue.toFixed(1);
    } else if (metric.isDecimal) {
      // Для десятичных полей: масштабируем и форматируем в десятичный вид
      const baseValue = metric.defaultValue;
      const numericValue = (sliderValue / 50) * baseValue;
      scaledValue = numericValue.toFixed(1);
    } else {
      // Для обычных значений: масштабируем в зависимости от базового значения
      const baseValue = metric.defaultValue;
      scaledValue = (sliderValue / 50) * baseValue; // 50 = средняя позиция слайдера
    }
    
    setMetrics(prev => ({
      ...prev,
      [metricId]: scaledValue
    }));
    
    // Обновляем связанные поля
    updateRelatedFields(metricId, scaledValue);
  };

  // Новые обработчики для полей ввода
  const handleInputFocus = (metricId: string) => {
    const currentValue = metrics[metricId];
    if (currentValue === 0) {
      // Очищаем поле при фокусе, если значение равно 0
      setMetrics(prev => ({
        ...prev,
        [metricId]: '' as any // Временно сохраняем пустую строку
      }));
    }
  };

  const handleInputBlur = (metricId: string, isPercentage: boolean, inputValue: string, isDecimal: boolean = false) => {
    let finalValue: number | string;
    
    if (inputValue === '' || inputValue === undefined) {
      // Возвращаем 0 если поле пустое
      finalValue = (isPercentage || isDecimal) ? '0.0' : 0;
    } else if (isPercentage || isDecimal) {
      // Для процентных и десятичных полей: если введено целое число, добавляем .0
      if (/^\d+$/.test(inputValue)) {
        finalValue = inputValue + '.0';
      } else {
        // Если уже есть десятичная часть, преобразуем в число и обратно для нормализации
        const numericValue = parseFloat(inputValue);
        if (!isNaN(numericValue)) {
          finalValue = numericValue.toFixed(1);
        } else {
          return;
        }
      }
    } else {
      // Для обычных полей преобразуем в число
      const numericValue = parseFloat(inputValue);
      if (!isNaN(numericValue)) {
        finalValue = numericValue;
      } else {
        return;
      }
    }
    
    setMetrics(prev => ({
      ...prev,
      [metricId]: finalValue
    }));
    
    // Обновляем связанные поля
    updateRelatedFields(metricId, finalValue);
  };

  const handleInputChange = (metricId: string, value: string, isPercentage: boolean, isDecimal: boolean = false) => {
    if (isReadonlyField(metricId)) return;

    if (isPercentage || isDecimal) {
      // Заменяем запятую на точку
      let processedValue = value.replace(',', '.');
      
      // Разрешаем пустое поле во время ввода
      if (processedValue === '') {
        setMetrics(prev => ({
          ...prev,
          [metricId]: ''
        }));
        return;
      }
      
      // Ограничиваем формат: число с максимум 1 знаком после точки
      if (!/^\d*\.?\d{0,1}$/.test(processedValue)) {
        return; // Не обновляем если формат неверный
      }

      // Сохраняем строку во время ввода для естественного редактирования
      setMetrics(prev => ({
        ...prev,
        [metricId]: processedValue
      }));
      
      // Обновляем связанные поля в реальном времени (только если есть корректное число)
      const numericValue = parseFloat(processedValue);
      if (!isNaN(numericValue)) {
        updateRelatedFields(metricId, processedValue);
      }
    } else {
      // Для обычных полей
      if (value === '') {
        setMetrics(prev => ({
          ...prev,
          [metricId]: ''
        }));
        return;
      }
      
      const numericValue = parseFloat(value);
      if (!isNaN(numericValue)) {
        setMetrics(prev => ({
          ...prev,
          [metricId]: numericValue
        }));
        
        // Обновляем связанные поля в реальном времени
        updateRelatedFields(metricId, numericValue);
      }
    }
  };

  // Обработчик нажатия клавиш
  const handleKeyDown = (event: React.KeyboardEvent<HTMLInputElement>) => {
    if (event.key === 'Enter') {
      event.currentTarget.blur(); // Снимаем фокус с поля
    }
  };

  // Функция для обновления связанных полей
  const updateRelatedFields = (changedMetricId: string, newValue: number | string) => {
    const numericValue = typeof newValue === 'string' ? parseFloat(newValue) || 0 : newValue;
    
    setMetrics(prev => {
      const updated = { ...prev };
      
      // Получаем текущие значения
      const getNumericValue = (id: string) => {
        const val = updated[id];
        return typeof val === 'string' ? parseFloat(val) || 0 : val;
      };
      
      // 1. CPC ↔ Затраты на рекламу (через клики)
      if (changedMetricId === 'cpc') {
        const clicks = getNumericValue('clicks');
        const newAdCost = numericValue * clicks;
        if (clicks > 0) {
          updated['adCost'] = newAdCost;
        }
      } else if (changedMetricId === 'adCost') {
        const clicks = getNumericValue('clicks');
        if (clicks > 0) {
          const newCpc = numericValue / clicks;
          updated['cpc'] = newCpc.toFixed(1);
        }
      }
      
      // 2. CR1 ↔ Лидов/продаж (через клики)
      if (changedMetricId === 'cr1') {
        const clicks = getNumericValue('clicks');
        const cr2 = getNumericValue('cr2');
        const cr1Percent = numericValue;
        const newLeads = (clicks * cr1Percent) / 100;
        updated['leads'] = newLeads.toFixed(1);
        
        // Обновляем количество сделок при изменении CR1 (через новые лиды)
        const newSales = (newLeads * cr2) / 100;
        updated['sales'] = newSales.toFixed(1);
      } else if (changedMetricId === 'leads') {
        const clicks = getNumericValue('clicks');
        const cr2 = getNumericValue('cr2');
        if (clicks > 0) {
          const newCr1 = (numericValue / clicks) * 100;
          updated['cr1'] = newCr1.toFixed(1);
        }
        
        // Обновляем количество сделок при изменении лидов
        const newSales = (numericValue * cr2) / 100;
        updated['sales'] = newSales.toFixed(1);
      }
      
      // 2.5. CR2 ↔ Сделок (через лидов)
      if (changedMetricId === 'cr2') {
        const leads = getNumericValue('leads');
        const cr2Percent = numericValue;
        const newSales = (leads * cr2Percent) / 100;
        updated['sales'] = newSales.toFixed(1);
      } else if (changedMetricId === 'sales') {
        const leads = getNumericValue('leads');
        if (leads > 0) {
          const newCr2 = (numericValue / leads) * 100;
          updated['cr2'] = newCr2.toFixed(1);
        }
      }
      
      // 3. Обновляем клики и пересчитываем все связанные поля
      if (changedMetricId === 'clicks') {
        const cpc = getNumericValue('cpc');
        const cr1 = getNumericValue('cr1');
        const cr2 = getNumericValue('cr2');
        const impressions = getNumericValue('impressions');
        
        // Обновляем затраты на рекламу
        updated['adCost'] = numericValue * cpc;
        
        // Обновляем количество лидов
        const newLeads = (numericValue * cr1) / 100;
        updated['leads'] = newLeads.toFixed(1);
        
        // Обновляем количество сделок
        const newSales = (newLeads * cr2) / 100;
        updated['sales'] = newSales.toFixed(1);
        
        // Обновляем CTR
        if (impressions > 0) {
          const newCtr = (numericValue / impressions) * 100;
          updated['ctr'] = newCtr.toFixed(1);
        }
      }
      
      // 4. Обновляем показы и пересчитываем CTR
      if (changedMetricId === 'impressions') {
        const clicks = getNumericValue('clicks');
        if (clicks > 0) {
          const newCtr = (clicks / numericValue) * 100;
          updated['ctr'] = newCtr.toFixed(1);
        }
      }
      
      // 5. Пересчитываем CPL при изменении затрат или лидов
      const adCost = getNumericValue('adCost');
      const leads = getNumericValue('leads');
      const sales = getNumericValue('sales');
      
      if ((changedMetricId === 'adCost' || changedMetricId === 'leads' || changedMetricId === 'clicks' || changedMetricId === 'cpc' || changedMetricId === 'cr1') && leads > 0) {
        const newCpl = adCost / leads;
        updated['cpl'] = newCpl.toFixed(0); // Округляем до целого числа
      }
      
      // 6. Пересчитываем CPO при изменении затрат или сделок
      if ((changedMetricId === 'adCost' || changedMetricId === 'sales' || changedMetricId === 'clicks' || changedMetricId === 'cpc' || changedMetricId === 'cr1' || changedMetricId === 'cr2' || changedMetricId === 'leads') && sales > 0) {
        const newCpo = adCost / sales;
        updated['cpo'] = newCpo.toFixed(0); // Округляем до целого числа
      }
      
      // 7. Пересчитываем валовой доход при изменении AOV или сделок
      const aov = getNumericValue('aov');
      
      if (changedMetricId === 'aov' || changedMetricId === 'sales' || changedMetricId === 'clicks' || changedMetricId === 'cr1' || changedMetricId === 'cr2' || changedMetricId === 'leads') {
        const newRevenue = aov * sales;
        updated['revenue'] = Math.round(newRevenue);
      }
      
      // 8. Пересчитываем AOV при изменении валового дохода
      if (changedMetricId === 'revenue' && sales > 0) {
        const newAov = numericValue / sales;
        updated['aov'] = Math.round(newAov);
      }
      
      // 9. Пересчитываем маржу с одной и общую маржу при изменении связанных полей
      const revenue = getNumericValue('revenue');
      const marginPercent = getNumericValue('marginPercent');
      
      if (changedMetricId === 'marginPercent' || changedMetricId === 'revenue' || changedMetricId === 'aov' || changedMetricId === 'sales' || changedMetricId === 'clicks' || changedMetricId === 'cr1' || changedMetricId === 'cr2' || changedMetricId === 'leads' || changedMetricId === 'cpc' || changedMetricId === 'impressions') {
        // Маржа с одной = AOV × Маржинальность %
        const newMarginPerUnit = (aov * marginPercent) / 100;
        updated['marginPerUnit'] = Math.round(newMarginPerUnit);
        
        // Общая маржа = Валовой доход × Маржинальность %
        const newTotalMargin = (revenue * marginPercent) / 100;
        updated['totalMargin'] = Math.round(newTotalMargin);
      }
      
      // 10. Обратные расчеты при изменении маржи
      if (changedMetricId === 'marginPerUnit' && aov > 0) {
        // Если изменили маржу с одной, пересчитываем маржинальность
        const newMarginPercent = (numericValue / aov) * 100;
        updated['marginPercent'] = Math.round(newMarginPercent);
        
        // И пересчитываем общую маржу с новой маржинальностью
        const newTotalMargin = (revenue * newMarginPercent) / 100;
        updated['totalMargin'] = Math.round(newTotalMargin);
      }
      
      if (changedMetricId === 'totalMargin' && revenue > 0) {
        // Если изменили общую маржу, пересчитываем маржинальность
        const newMarginPercent = (numericValue / revenue) * 100;
        updated['marginPercent'] = Math.round(newMarginPercent);
        
        // И пересчитываем маржу с одной с новой маржинальностью
        const newMarginPerUnit = (aov * newMarginPercent) / 100;
        updated['marginPerUnit'] = Math.round(newMarginPerUnit);
      }
      
      // 11. Расчеты для группы "Доходы"
      const totalMargin = getNumericValue('totalMargin');
      const impressions = getNumericValue('impressions');
      
      if (changedMetricId === 'totalMargin' || changedMetricId === 'adCost' || changedMetricId === 'cpc' || changedMetricId === 'revenue' || changedMetricId === 'marginPercent' || changedMetricId === 'sales' || changedMetricId === 'clicks' || changedMetricId === 'cr1' || changedMetricId === 'cr2' || changedMetricId === 'leads' || changedMetricId === 'aov' || changedMetricId === 'impressions') {
        // Чистая прибыль = Общая маржа (Прибыль) - Затраты на рекламу
        const newNetProfit = totalMargin - adCost;
        updated['netProfit'] = Math.round(newNetProfit);
        
        // Чистая прибыль с одной = Чистая прибыль ÷ Сделок
        if (sales > 0) {
          const newNetProfitPerUnit = newNetProfit / sales;
          updated['netProfitPerUnit'] = Math.round(newNetProfitPerUnit);
        }
        
        // ROMI % = (Чистая прибыль ÷ Затраты на рекламу) × 100%
        if (adCost > 0) {
          const newRomi = (newNetProfit / adCost) * 100;
          updated['romi'] = Math.round(newRomi);
        }
        
        // ROAS = Валовой доход ÷ Затраты на рекламу
        if (adCost > 0) {
          const newRoas = revenue / adCost;
          updated['roas'] = newRoas.toFixed(1);
        }
      }
      
      // 12. Расчеты для группы "Формулы"
      if (changedMetricId === 'adCost' || changedMetricId === 'cpc' || changedMetricId === 'revenue' || changedMetricId === 'impressions' || changedMetricId === 'clicks' || changedMetricId === 'cr1' || changedMetricId === 'cr2' || changedMetricId === 'leads' || changedMetricId === 'sales' || changedMetricId === 'aov' || changedMetricId === 'marginPercent' || changedMetricId === 'totalMargin') {
        // ДРР % = (Затраты на рекламу ÷ Валовой доход) × 100%
        if (revenue > 0) {
          const newDrr = (adCost / revenue) * 100;
          updated['drr'] = Math.round(newDrr);
        }
        
        // CPM = (Затраты на рекламу ÷ Показы) × 1000
        if (impressions > 0) {
          const newCpm = (adCost / impressions) * 1000;
          updated['cpm'] = Math.round(newCpm);
        }
        
        // ICCR % = (Затраты на рекламу ÷ Общая маржа (Прибыль)) × 100%
        if (totalMargin > 0) {
          const newIccr = (adCost / totalMargin) * 100;
          updated['iccr'] = Math.round(newIccr);
        }
      }
      
      return updated;
    });
  };

  // Получение значения слайдера из текущего значения метрики
  const getSliderValue = (metricId: string, metric: Metric): number => {
    const currentValue = typeof metrics[metricId] === 'string' ? parseFloat(metrics[metricId] as string) || 0 : metrics[metricId] as number;
    
    if (metric.sliderRange) {
      // Для полей с настроенным диапазоном слайдера (включая проценты)
      const { min, max } = metric.sliderRange;
      const percentage = (currentValue - min) / (max - min);
      return Math.min(100, Math.max(0, percentage * 100));
    } else if (metric.isPercentage) {
      // Для процентов без диапазона: прямое соответствие
      return Math.min(100, Math.max(0, currentValue));
    } else {
      // Для обычных и десятичных значений: обратное масштабирование
      const baseValue = metric.defaultValue;
      return Math.min(100, Math.max(0, (currentValue / baseValue) * 50));
    }
  };

  // Функция экспорта в Excel
  const exportToExcel = (format: 'vertical' | 'horizontal' = 'vertical') => {
    try {
      let exportData;
      
      if (format === 'vertical') {
        // Вертикальный формат (как сейчас): 3 колонки
        exportData = metricsConfig.flatMap((group: Group) => 
          group.metrics.map((metric: Metric) => {
            const dayValue = metrics[metric.id];
            let periodValue;
            
            // Рассчитываем значение за период
            if (metric.isPercentage) {
              // Для процентов - то же значение
              periodValue = dayValue;
            } else if (metric.hasPeriod) {
              // Для полей с периодом - умножаем на период
              const numericDay = typeof dayValue === 'string' ? parseFloat(dayValue) || 0 : dayValue;
              periodValue = Math.round(numericDay * period);
            } else {
              // Для обычных полей - то же значение
              periodValue = dayValue;
            }
            
            // Форматируем значения для отображения
            const formatValue = (value: number | string, isPercentage: boolean) => {
              if (typeof value === 'string') {
                return isPercentage ? `${value} %` : value;
              }
              return isPercentage ? `${value} %` : value.toString();
            };

            return {
              'Параметр': metric.name,
              'За 1 день': formatValue(dayValue, metric.isPercentage),
              [`За ${period} ${period === 1 ? 'день' : period < 5 ? 'дня' : 'дней'}`]: formatValue(periodValue, metric.isPercentage)
            };
          })
        );
      } else {
        // Горизонтальный формат: каждый параметр - отдельная колонка
        const dayRow: Record<string, any> = { 'Период': 'За 1 день' };
        const periodRow: Record<string, any> = { 'Период': `За ${period} ${period === 1 ? 'день' : period < 5 ? 'дня' : 'дней'}` };
        
        metricsConfig.forEach((group: Group) => {
          group.metrics.forEach((metric: Metric) => {
            const dayValue = metrics[metric.id];
            let periodValue;
            
            // Рассчитываем значение за период
            if (metric.isPercentage) {
              periodValue = dayValue;
            } else if (metric.hasPeriod) {
              const numericDay = typeof dayValue === 'string' ? parseFloat(dayValue) || 0 : dayValue;
              periodValue = Math.round(numericDay * period);
            } else {
              periodValue = dayValue;
            }
            
            // Форматируем значения для отображения
            const formatValue = (value: number | string, isPercentage: boolean) => {
              if (typeof value === 'string') {
                return isPercentage ? `${value} %` : value;
              }
              return isPercentage ? `${value} %` : value.toString();
            };
            
            dayRow[metric.name] = formatValue(dayValue, metric.isPercentage);
            periodRow[metric.name] = formatValue(periodValue, metric.isPercentage);
          });
        });
        
        exportData = [dayRow, periodRow];
      }

      // Создаем книгу Excel
      const workbook = XLSX.utils.book_new();
      const worksheet = XLSX.utils.json_to_sheet(exportData);
      
      // Настройка автоширины столбцов
      const colWidths = [];
      
      if (format === 'vertical') {
        // Для вертикального формата: Параметр | День | Период
        // Рассчитываем ширину только по данным (исключая заголовки)
        const dataRows = exportData.slice(1); // Пропускаем первую строку (заголовки)
        
        const maxParamLength = dataRows.length > 0 ? Math.max(
          ...dataRows.map(row => (row['Параметр'] || '').toString().length),
          8 // Минимальная ширина для читаемости
        ) : 8;
        
        const maxDayLength = dataRows.length > 0 ? Math.max(
          ...dataRows.map(row => (row['За 1 день'] || '').toString().length),
          8 // Минимальная ширина
        ) : 8;
        
        const maxPeriodLength = dataRows.length > 0 ? Math.max(
          ...dataRows.map(row => {
            const periodKey = Object.keys(row).find(key => key.startsWith('За '));
            return periodKey ? (row[periodKey] || '').toString().length : 0;
          }),
          8 // Минимальная ширина
        ) : 8;
        
        colWidths.push(
          { wch: Math.min(Math.max(maxParamLength + 2, 10), 35) }, // Параметр: мин 10, макс 35
          { wch: Math.min(Math.max(maxDayLength + 2, 10), 20) },   // День: мин 10, макс 20
          { wch: Math.min(Math.max(maxPeriodLength + 2, 10), 25) } // Период: мин 10, макс 25
        );
      } else {
        // Для горизонтального формата: каждый параметр - отдельный столбец
        // Берем данные строки (исключая заголовки)
        const dataRows = exportData.slice(1);
        const firstRow = exportData[0];
        
        Object.keys(firstRow).forEach((key, index) => {
          if (index === 0) {
            // Первый столбец "Период" - рассчитываем по данным
            const maxLength = dataRows.length > 0 ? Math.max(
              ...dataRows.map(row => (row[key] || '').toString().length),
              8
            ) : 8;
            colWidths.push({ wch: Math.min(Math.max(maxLength + 2, 10), 20) });
          } else {
            // Столбцы параметров - рассчитываем только по значениям данных
            const maxLength = dataRows.length > 0 ? Math.max(
              ...dataRows.map(row => (row[key] || '').toString().length),
              6 // Минимальная ширина для коротких значений
            ) : 6;
            colWidths.push({ wch: Math.min(Math.max(maxLength + 2, 8), 18) });
          }
        });
      }
      
      worksheet['!cols'] = colWidths;
      
      // Добавляем стили для заголовков (жирный шрифт)
      const range = worksheet['!ref'] ? XLSX.utils.decode_range(worksheet['!ref']) : null;
      
      if (range) {
        // Стилизуем первую строку как заголовок
        for (let col = range.s.c; col <= range.e.c; col++) {
          const cellAddress = XLSX.utils.encode_cell({ r: 0, c: col });
          if (!worksheet[cellAddress]) continue;
          
          worksheet[cellAddress].s = {
            font: { bold: true, color: { rgb: "FFFFFF" } },
            fill: { fgColor: { rgb: "366092" } },
            alignment: { horizontal: "center", vertical: "center" },
            border: {
              top: { style: "thin", color: { rgb: "000000" } },
              bottom: { style: "thin", color: { rgb: "000000" } },
              left: { style: "thin", color: { rgb: "000000" } },
              right: { style: "thin", color: { rgb: "000000" } }
            }
          };
        }
        
        // Добавляем границы для всех ячеек
        for (let row = range.s.r; row <= range.e.r; row++) {
          for (let col = range.s.c; col <= range.e.c; col++) {
            const cellAddress = XLSX.utils.encode_cell({ r: row, c: col });
            if (!worksheet[cellAddress]) continue;
            
            if (row > 0) { // Не заголовки
              worksheet[cellAddress].s = {
                ...worksheet[cellAddress].s,
                border: {
                  top: { style: "thin", color: { rgb: "CCCCCC" } },
                  bottom: { style: "thin", color: { rgb: "CCCCCC" } },
                  left: { style: "thin", color: { rgb: "CCCCCC" } },
                  right: { style: "thin", color: { rgb: "CCCCCC" } }
                },
                alignment: { vertical: "center" }
              };
            }
          }
        }
      }
      
      // Добавляем лист в книгу
      XLSX.utils.book_append_sheet(workbook, worksheet, 'Аналитика');
      
      // Генерируем имя файла с текущей датой и временем
      const today = new Date();
      const dateStr = today.toISOString().split('T')[0]; // YYYY-MM-DD
      const timeStr = today.toTimeString().split(' ')[0].replace(/:/g, '-'); // HH-MM-SS
      const fileName = `analytics_result_wekey_tools_${dateStr}_${timeStr}.xlsx`;
      
      // Скачиваем файл
      XLSX.writeFile(workbook, fileName);
      
      console.log('Файл успешно экспортирован:', fileName);
    } catch (error) {
      console.error('Ошибка при экспорте:', error);
      alert('Произошла ошибка при экспорте данных');
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
            <div className="column-header param-header">
              <div className="param-header-content">
                <span>Параметр</span>
                <button 
                  className="header-export-button"
                  onClick={() => setShowExportModal(true)}
                  title="Скачать все результаты в формате Excel"
                >
                  <img src="/icons/download.svg" alt="Download" width="11" height="11" />
                  Скачать результат
                </button>
              </div>
            </div>
            <div className="column-header values-header">
              <div className="dual-header">
                <span className="day-header">День</span>
                <div className="period-input-container">
                  <input
                    type="number"
                    value={period}
                    onChange={(e) => setPeriod(Number(e.target.value) || 1)}
                    className="period-input"
                    min="1"
                    max="365"
                  />
                  <span className="period-label">Дней</span>
                </div>
              </div>
            </div>
          </div>

          {/* Группы параметров */}
          {metricsConfig.map((group) => (
            <div 
              key={group.title} 
              className="metrics-group"
              style={{ '--group-color': group.color } as React.CSSProperties}
            >
              {/* Заголовок группы - вертикальный слева */}
              <div className="group-title-vertical" style={{ color: group.color }}>
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
                        onChange={(e) => !isSliderDisabled(metric.id) && handleSliderChange(metric.id, parseInt(e.target.value), metric)}
                        className={`slider ${isSliderDisabled(metric.id) ? 'slider-disabled' : ''}`}
                        style={{
                          '--thumb-color': group.color
                        } as React.CSSProperties}
                      />
                    </div>

                    {/* Поля ввода */}
                    <div className="metric-values">
                      {/* Первое поле - с процентами или без */}
                      {metric.isPercentage && !metric.hasPeriod ? (
                        // Процентное поле без периода - оборачиваем в контейнер
                        <div className="percentage-input-container">
                          <input
                            type="number"
                            value={metrics[metric.id]}
                            onFocus={() => handleInputFocus(metric.id)}
                            onBlur={(e) => handleInputBlur(metric.id, true, e.target.value, false)}
                            onChange={(e) => handleInputChange(metric.id, e.target.value, true, false)}
                            onKeyDown={handleKeyDown}
                            className={`value-input percentage-field ${isReadonlyField(metric.id) ? 'readonly' : ''}`}
                            placeholder="0.0"
                            step="0.1"
                            readOnly={isReadonlyField(metric.id)}
                          />
                          <span className="percentage-symbol">%</span>
                        </div>
                      ) : (
                        // Обычное поле
                        <input
                          type="number"
                          value={metrics[metric.id]}
                          onFocus={() => handleInputFocus(metric.id)}
                          onBlur={(e) => handleInputBlur(metric.id, metric.isPercentage, e.target.value, metric.isDecimal)}
                          onChange={(e) => handleInputChange(metric.id, e.target.value, metric.isPercentage, metric.isDecimal)}
                          onKeyDown={handleKeyDown}
                          className={`value-input ${!metric.isPercentage && !metric.hasPeriod ? 'single-field' : ''} ${isReadonlyField(metric.id) ? 'readonly' : ''}`}
                          placeholder={metric.isPercentage || metric.isDecimal ? "0.0" : "0"}
                          step={metric.isPercentage || metric.isDecimal ? "0.1" : "1"}
                          readOnly={isReadonlyField(metric.id)}
                        />
                      )}
                      
                      {/* Второе поле - только если hasPeriod = true */}
                      {metric.hasPeriod && (
                        <input
                          type="number"
                          value={metric.isPercentage ? 
                            (typeof metrics[metric.id] === 'string' ? 
                              parseFloat(metrics[metric.id] as string) || 0 : 
                              parseFloat((metrics[metric.id] as number).toFixed(1))
                            ) : 
                            Math.round(typeof metrics[metric.id] === 'string' ? 
                              (parseFloat(metrics[metric.id] as string) || 0) * period : 
                              (metrics[metric.id] as number) * period
                            )
                          }
                          readOnly
                          className="value-input readonly"
                          placeholder="0"
                        />
                      )}
                      
                      {/* Процентный символ для полей с периодом */}
                      {metric.isPercentage && metric.hasPeriod && <span className="percentage-symbol">%</span>}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </main>
      
      {/* Модальное окно выбора формата экспорта */}
      {showExportModal && (
        <div className="modal-overlay">
          <div className="modal-content">
            <h3>Выберите формат экспорта</h3>
            <div className="export-options">
              <label className="radio-option">
                <input
                  type="radio"
                  name="exportFormat"
                  value="vertical"
                  checked={exportFormat === 'vertical'}
                  onChange={(e) => setExportFormat(e.target.value as 'vertical' | 'horizontal')}
                />
                <span className="radio-custom"></span>
                <div className="option-details">
                  <strong>Вертикальный формат</strong>
                  <p>Параметры в строках, колонки: Параметр | За 1 день | За период</p>
                </div>
              </label>
              
              <label className="radio-option">
                <input
                  type="radio"
                  name="exportFormat"
                  value="horizontal"
                  checked={exportFormat === 'horizontal'}
                  onChange={(e) => setExportFormat(e.target.value as 'vertical' | 'horizontal')}
                />
                <span className="radio-custom"></span>
                <div className="option-details">
                  <strong>Горизонтальный формат</strong>
                  <p>Параметры в колонках, строки: За 1 день | За период</p>
                </div>
              </label>
            </div>
            
            <div className="modal-buttons">
              <button
                onClick={() => {
                  exportToExcel(exportFormat);
                  setShowExportModal(false);
                }}
                className="analytics-button export-button"
              >
                Экспортировать
              </button>
              <button
                onClick={() => setShowExportModal(false)}
                className="analytics-button clear-button"
              >
                Отмена
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AnalyticsTool;