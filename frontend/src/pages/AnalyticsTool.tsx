import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import ExcelJS from 'exceljs';
import ColumnIcon from '../assets/icons/column.svg?react';
import StringIcon from '../assets/icons/string.svg?react';
import { useAuthRequired } from '../hooks/useAuthRequired';
import AuthRequiredModal from '../components/AuthRequiredModal';
import AuthModal from '../components/AuthModal';
import { statsService } from '../utils/statsService';
import '../styles/tool-pages.css';
import './AnalyticsTool.css';
import { openaiService, type AnalyticsData } from '../services/openaiService';
import { useTranslation } from 'react-i18next';
import { useLocalizedLink } from '../hooks/useLanguageFromUrl';
import SEOHead from '../components/SEOHead';

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

const TOOL_ID = 'cross-analytics';

const AnalyticsTool: React.FC = () => {
  const { t } = useTranslation();
  const { createLink } = useLocalizedLink();

  // Auth Required Hook
  const {
    isAuthRequiredModalOpen,
    isAuthModalOpen,
    requireAuth,
    closeAuthRequiredModal,
    closeAuthModal,
    openAuthModal
  } = useAuthRequired();

  const metricsConfig: Group[] = [
    {
      title: t('analyticsTool.groups.traffic'),
      color: '#6B7280', // серый
      metrics: [
        { id: 'clicks', name: t('analyticsTool.metrics.clicks.name'), tooltip: t('analyticsTool.metrics.clicks.tooltip'), isPercentage: false, defaultValue: 300, hasPeriod: true, sliderRange: { min: 0, max: 500 } },
        { id: 'impressions', name: t('analyticsTool.metrics.impressions.name'), tooltip: t('analyticsTool.metrics.impressions.tooltip'), isPercentage: false, defaultValue: 8000, hasPeriod: true, sliderRange: { min: 0, max: 10000 } },
        { id: 'ctr', name: t('analyticsTool.metrics.ctr.name'), tooltip: t('analyticsTool.metrics.ctr.tooltip'), isPercentage: true, defaultValue: 3.75, hasPeriod: false },
      ]
    },
    {
      title: t('analyticsTool.groups.costs'),
      color: '#EF4444', // красный
      metrics: [
        { id: 'cpc', name: t('analyticsTool.metrics.cpc.name'), tooltip: t('analyticsTool.metrics.cpc.tooltip'), isPercentage: false, isDecimal: true, defaultValue: 12, hasPeriod: false, sliderRange: { min: 0, max: 50 } },
        { id: 'adCost', name: t('analyticsTool.metrics.adCost.name'), tooltip: t('analyticsTool.metrics.adCost.tooltip'), isPercentage: false, defaultValue: 3600, hasPeriod: true, sliderRange: { min: 0, max: 10000 } },
      ]
    },
    {
      title: t('analyticsTool.groups.website'),
      color: '#F59E0B', // жёлтый
      metrics: [
        { id: 'cr1', name: t('analyticsTool.metrics.cr1.name'), tooltip: t('analyticsTool.metrics.cr1.tooltip'), isPercentage: true, defaultValue: 4.0, hasPeriod: false, sliderRange: { min: 0, max: 50 } },
        { id: 'leads', name: t('analyticsTool.metrics.leads.name'), tooltip: t('analyticsTool.metrics.leads.tooltip'), isPercentage: false, isDecimal: true, defaultValue: 12, hasPeriod: true, sliderRange: { min: 0, max: 200 } },
        { id: 'cpl', name: t('analyticsTool.metrics.cpl.name'), tooltip: t('analyticsTool.metrics.cpl.tooltip'), isPercentage: false, defaultValue: 300, hasPeriod: false, sliderRange: { min: 0, max: 1000 } },
      ]
    },
    {
      title: t('analyticsTool.groups.sales'),
      color: '#3B82F6', // синий
      metrics: [
        { id: 'cr2', name: t('analyticsTool.metrics.cr2.name'), tooltip: t('analyticsTool.metrics.cr2.tooltip'), isPercentage: true, defaultValue: 75.0, hasPeriod: false },
        { id: 'sales', name: t('analyticsTool.metrics.sales.name'), tooltip: t('analyticsTool.metrics.sales.tooltip'), isPercentage: false, isDecimal: true, defaultValue: 9, hasPeriod: true, sliderRange: { min: 0, max: 100 } },
        { id: 'cpo', name: t('analyticsTool.metrics.cpo.name'), tooltip: t('analyticsTool.metrics.cpo.tooltip'), isPercentage: false, defaultValue: 400, hasPeriod: false, sliderRange: { min: 0, max: 1000 } },
      ]
    },
    {
      title: t('analyticsTool.groups.pricing'),
      color: '#8B5CF6', // фиолетовый
      metrics: [
        { id: 'aov', name: t('analyticsTool.metrics.aov.name'), tooltip: t('analyticsTool.metrics.aov.tooltip'), isPercentage: false, defaultValue: 3000, hasPeriod: false, sliderRange: { min: 0, max: 5000 } },
        { id: 'revenue', name: t('analyticsTool.metrics.revenue.name'), tooltip: t('analyticsTool.metrics.revenue.tooltip'), isPercentage: false, defaultValue: 27000, hasPeriod: true, sliderRange: { min: 0, max: 100000 } },
        { id: 'marginPercent', name: t('analyticsTool.metrics.marginPercent.name'), tooltip: t('analyticsTool.metrics.marginPercent.tooltip'), isPercentage: true, defaultValue: 50, hasPeriod: false },
        { id: 'marginPerUnit', name: t('analyticsTool.metrics.marginPerUnit.name'), tooltip: t('analyticsTool.metrics.marginPerUnit.tooltip'), isPercentage: false, defaultValue: 1500, hasPeriod: false, sliderRange: { min: 0, max: 5000 } },
        { id: 'totalMargin', name: t('analyticsTool.metrics.totalMargin.name'), tooltip: t('analyticsTool.metrics.totalMargin.tooltip'), isPercentage: false, defaultValue: 13500, hasPeriod: false, sliderRange: { min: 0, max: 50000 } },
      ]
    },
    {
      title: t('analyticsTool.groups.revenue'),
      color: '#10B981', // зелёный
      metrics: [
        { id: 'netProfit', name: t('analyticsTool.metrics.netProfit.name'), tooltip: t('analyticsTool.metrics.netProfit.tooltip'), isPercentage: false, defaultValue: 9900, hasPeriod: true, sliderRange: { min: 0, max: 50000 } },
        { id: 'netProfitPerUnit', name: t('analyticsTool.metrics.netProfitPerUnit.name'), tooltip: t('analyticsTool.metrics.netProfitPerUnit.tooltip'), isPercentage: false, defaultValue: 1100, hasPeriod: true, sliderRange: { min: 0, max: 5000 } },
        { id: 'romi', name: t('analyticsTool.metrics.romi.name'), tooltip: t('analyticsTool.metrics.romi.tooltip'), isPercentage: true, defaultValue: 275, hasPeriod: false, sliderRange: { min: 0, max: 1000 } },
        { id: 'roas', name: t('analyticsTool.metrics.roas.name'), tooltip: t('analyticsTool.metrics.roas.tooltip'), isPercentage: false, defaultValue: 7.5, hasPeriod: false, sliderRange: { min: 0, max: 10 } },
      ]
    },
    {
      title: t('analyticsTool.groups.formulas'),
      color: '#6B7280', // серый
      metrics: [
        { id: 'drr', name: t('analyticsTool.metrics.drr.name'), tooltip: t('analyticsTool.metrics.drr.tooltip'), isPercentage: true, isDecimal: true, defaultValue: 13.33, hasPeriod: false },
        { id: 'iccr', name: t('analyticsTool.metrics.iccr.name'), tooltip: t('analyticsTool.metrics.iccr.tooltip'), isPercentage: true, isDecimal: true, defaultValue: 26.67, hasPeriod: false },
        { id: 'cpm', name: t('analyticsTool.metrics.cpm.name'), tooltip: t('analyticsTool.metrics.cpm.tooltip'), isPercentage: false, defaultValue: 450, hasPeriod: false, sliderRange: { min: 0, max: 1000 } },
      ]
    }
  ];

  // Состояние для периода (по умолчанию 30 дней)
  const [period, setPeriod] = useState<number>(30);
  const [launchCount, setLaunchCount] = useState(0);
  
  // Состояние для попапа экспорта
  const [showExportModal, setShowExportModal] = useState<boolean>(false);
  const [exportFormat, setExportFormat] = useState<'vertical' | 'horizontal'>('vertical');
  const [isModalClosing, setIsModalClosing] = useState<boolean>(false);
  
  // Состояние для попапа ИИ анализа
  const [showAIModal, setShowAIModal] = useState<boolean>(false);
  const [isAIModalClosing, setIsAIModalClosing] = useState<boolean>(false);
  
  // Состояние для формы ИИ анализа
  const [niche, setNiche] = useState<string>('');
  const [currency, setCurrency] = useState<'uah' | 'usd' | 'rub'>('uah');
  const [isAnalyzing, setIsAnalyzing] = useState<boolean>(false);
  const [aiResponse, setAiResponse] = useState<string>('');
  const [aiError, setAiError] = useState<string>('');
  
  // Состояние для дропдаунов сегментации
  const [landingType, setLandingType] = useState<'ecommerce' | 'landing' | 'instagram'>('ecommerce');
  const [businessModel, setBusinessModel] = useState<'product' | 'service'>('product');
  const [trafficSource, setTrafficSource] = useState<'google-search' | 'google-shopping' | 'meta' | 'tiktok' | 'email'>('google-search');
  
  // Состояние для кратности масштабирования слайдеров
  const [scaleFactor, setScaleFactor] = useState<number>(1);
  
  // Функции управления кратностью
  const increaseScale = () => {
    setScaleFactor(prev => Math.min(20, prev + 1));
  };
  
  const decreaseScale = () => {
    setScaleFactor(prev => Math.max(1, prev - 1));
  };
  
  // Получить масштабированный диапазон для слайдера
  const getScaledRange = (metric: Metric) => {
    if (metric.sliderRange) {
      return {
        min: metric.sliderRange.min,
        max: metric.sliderRange.max * scaleFactor
      };
    }
    return null;
  };
  
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

  // Загрузка статистики (без увеличения счетчика)
  useEffect(() => {
    const loadStats = async () => {
      try {
        const count = await statsService.getLaunchCount(TOOL_ID);
        setLaunchCount(count);
      } catch (error) {
        console.warn('Failed to load statistics:', error);
        setLaunchCount(0);
      }
    };
    loadStats();
  }, []);

  // Функция плавного закрытия модального окна
  const closeModal = () => {
    setIsModalClosing(true);
    setTimeout(() => {
      setShowExportModal(false);
      setIsModalClosing(false);
    }, 300); // Совпадает с длительностью анимации
  };
  
  // Функция плавного закрытия ИИ модального окна
  const closeAIModal = () => {
    setIsAIModalClosing(true);
    setTimeout(() => {
      setShowAIModal(false);
      setIsAIModalClosing(false);
      // Сброс состояния формы
      setNiche('');
      setAiResponse('');
      setAiError('');
      setIsAnalyzing(false);
    }, 300);
  };
  
  // Функция получения анализа от ИИ
  const handleAIAnalysis = async () => {
    console.log('🎯 Starting AI analysis...');
    
    // Проверяем авторизацию перед выполнением
    if (!requireAuth()) {
      return; // Если пользователь не авторизован, показываем модальное окно и прерываем выполнение
    }
    
    if (!niche.trim()) {
      setAiError(t('analyticsTool.aiAnalysis.nicheRequired'));
      return;
    }
    
    // Увеличиваем счетчик использования для анализа ИИ
    try {
      const newCount = await statsService.incrementAndGetCount(TOOL_ID);
      setLaunchCount(newCount);
    } catch (error) {
      console.error('Failed to update stats:', error);
      setLaunchCount(prev => prev + 1);
    }
    
    setIsAnalyzing(true);
    setAiError('');
    setAiResponse('');
    
    try {
      // Подготавливаем данные для анализа
      const analyticsData: AnalyticsData = {
        businessType: landingType, // используем landingType как businessType для совместимости
        landingType,
        businessModel,
        trafficSource,
        niche: niche.trim(),
        metrics,
        period,
        currency
      };
      
      console.log('📊 Analytics data prepared:', analyticsData);
      
      // Получаем анализ от ИИ
      const result = await openaiService.getAnalysis(analyticsData);
      
      console.log('📈 Analysis result:', result);
      
      if (result.success && result.analysis) {
        setAiResponse(result.analysis);
        console.log('✅ Analysis set to state');
      } else {
        console.error('❌ Analysis failed:', result.error);
        setAiError(result.error || t('analyticsTool.aiAnalysis.error'));
      }
    } catch (error) {
      console.error('💥 Error during AI analysis:', error);
      setAiError(t('analyticsTool.aiAnalysis.error'));
    } finally {
      setIsAnalyzing(false);
      console.log('🏁 Analysis completed');
    }
  };
  
  // Функция копирования ответа ИИ
  const copyAIResponse = async () => {
    if (aiResponse) {
      try {
        await navigator.clipboard.writeText(aiResponse);
        // Можно добавить уведомление об успешном копировании
      } catch (error) {
        console.error('Failed to copy text:', error);
      }
    }
  };

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
      // Для полей с настроенным диапазоном слайдера - используем масштабированный диапазон
      const scaledRange = getScaledRange(metric);
      if (scaledRange) {
        const { min, max } = scaledRange;
        const numericValue = (sliderValue / 100) * (max - min) + min;
        scaledValue = metric.isDecimal ? numericValue.toFixed(1) : 
                     metric.isPercentage ? numericValue.toFixed(1) : 
                     Math.round(numericValue);
      } else {
        // Резервный вариант для случая когда масштабированный диапазон недоступен
        const { min, max } = metric.sliderRange;
        const numericValue = (sliderValue / 100) * (max - min) + min;
        scaledValue = metric.isDecimal ? numericValue.toFixed(1) : 
                     metric.isPercentage ? numericValue.toFixed(1) : 
                     Math.round(numericValue);
      }
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
      // Для полей с настроенным диапазоном слайдера - используем масштабированный диапазон
      const scaledRange = getScaledRange(metric);
      if (scaledRange) {
        const { min, max } = scaledRange;
        const percentage = (currentValue - min) / (max - min);
        return Math.min(100, Math.max(0, percentage * 100));
      }
    } else if (metric.isPercentage) {
      // Для процентов без диапазона: прямое соответствие
      return Math.min(100, Math.max(0, currentValue));
    } else {
      // Для обычных и десятичных значений: обратное масштабирование
      const baseValue = metric.defaultValue;
      return Math.min(100, Math.max(0, (currentValue / baseValue) * 50));
    }
    
    return 0;
  };

  // Функция экспорта в Excel из оригинала
  const exportToExcel = async (format: 'vertical' | 'horizontal' = 'vertical') => {
    // Проверяем авторизацию перед выполнением
    if (!requireAuth()) {
      return; // Если пользователь не авторизован, показываем модальное окно и прерываем выполнение
    }

    // Увеличиваем счетчик использования для экспорта
    try {
      const newCount = await statsService.incrementAndGetCount(TOOL_ID);
      setLaunchCount(newCount);
    } catch (error) {
      console.error('Failed to update stats:', error);
      setLaunchCount(prev => prev + 1);
    }

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

      // Создаем файл Excel с помощью ExcelJS для надежной стилизации
      const workbook = new ExcelJS.Workbook();
      const worksheet = workbook.addWorksheet('Аналитика');
      
      // Добавляем данные
      if (format === 'vertical') {
        // Вертикальный формат
        const headers = ['Параметр', 'За 1 день', `За ${period} ${period === 1 ? 'день' : period < 5 ? 'дня' : 'дней'}`];
        worksheet.addRow(headers);
        
        // Добавляем данные строки
        exportData.slice(1).forEach(row => {
          const rowData = [
            row['Параметр'],
            row['За 1 день'],
            row[Object.keys(row).find(key => key.startsWith('За ') && key !== 'За 1 день') || '']
          ];
          worksheet.addRow(rowData);
        });
      } else {
        // Горизонтальный формат
        const headers = Object.keys(exportData[0]);
        worksheet.addRow(headers);
        
        exportData.forEach(row => {
          const rowData = headers.map(header => row[header]);
          worksheet.addRow(rowData);
        });
      }
      
      // Стилизация заголовков (первая строка)
      const headerRow = worksheet.getRow(1);
      headerRow.eachCell((cell) => {
        cell.font = { bold: true, size: 10 }; // Уменьшили размер шрифта до 10
        cell.alignment = { 
          horizontal: 'center', 
          vertical: 'middle',
          wrapText: true // Перенос текста в заголовках
        };
        cell.fill = {
          type: 'pattern',
          pattern: 'solid',
          fgColor: { argb: 'FFE6E6E6' } // Светло-серый фон
        };
        cell.border = {
          top: { style: 'thin' },
          left: { style: 'thin' },
          bottom: { style: 'thin' },
          right: { style: 'thin' }
        };
      });
      
      // Генерируем имя файла
      const today = new Date();
      const dateStr = today.toISOString().split('T')[0];
      const timeStr = today.toTimeString().split(' ')[0].replace(/:/g, '-');
      const fileName = `analytics_result_wekey_tools_${dateStr}_${timeStr}.xlsx`;
      
      // Скачиваем файл
      workbook.xlsx.writeBuffer().then((buffer) => {
        const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
        const url = window.URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = fileName;
        link.click();
        window.URL.revokeObjectURL(url);
      });
      
      console.log('Файл успешно экспортирован:', fileName);
    } catch (error) {
      console.error('Ошибка при экспорте:', error);
      alert('Произошла ошибка при экспорте данных');
    }
  };

  return (
    <>
      <SEOHead 
        title={t('analyticsTool.title')}
        description={t('analyticsTool.description')}
        keywords={t('analyticsTool.keywords')}
      />
      <div className="tool-container">
        {/* Заголовок */}
        <header className="tool-header-island">
          <Link to={createLink('')} className="back-button">
            <img src="/icons/arrow_left.svg" alt="" />
            {t('common.backToTools')}
          </Link>
          
          <h1 className="tool-title">{t('analyticsTool.title')}</h1>
          
          <div className="tool-header-buttons">
            <button className="tool-header-btn counter-btn" title={t('common.usageCount')}>
              <img src="/icons/rocket.svg" alt="" />
              <span className="counter">{launchCount}</span>
            </button>
            <button className="tool-header-btn icon-only" title={t('common.tips')}>
              <img src="/icons/lamp.svg" alt="" />
            </button>
            <button className="tool-header-btn icon-only" title={t('common.screenshot')}>
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
                  {/* Блок управления кратностью */}
                  <div className="scale-controls">
                    <button 
                      className="scale-button"
                      onClick={decreaseScale}
                      disabled={scaleFactor <= 1}
                      title={t('analyticsTool.scale.decrease')}
                    >
                      –
                    </button>
                    <span className="scale-value">×{scaleFactor}</span>
                    <button 
                      className="scale-button"
                      onClick={increaseScale}
                      disabled={scaleFactor >= 20}
                      title={t('analyticsTool.scale.increase')}
                    >
                      +
                    </button>
                  </div>
                  
                  {/* Дропдауны сегментации */}
                  <div className="segmentation-dropdowns">
                    {/* Точка входа */}
                    <div className="dropdown-container">
                      <label className="dropdown-label">{t('analyticsTool.businessType')}</label>
                      <select 
                        value={landingType} 
                        onChange={(e) => setLandingType(e.target.value as 'ecommerce' | 'landing' | 'instagram')}
                        className="dropdown-select"
                      >
                        <option value="ecommerce">{t('analyticsTool.businessTypes.ecommerce')}</option>
                        <option value="landing">{t('analyticsTool.businessTypes.landing')}</option>
                        <option value="instagram">{t('analyticsTool.businessTypes.instagram')}</option>
                      </select>
                    </div>
                    
                    {/* Тип бизнеса */}
                    <div className="dropdown-container">
                      <label className="dropdown-label">{t('analyticsTool.businessModel')}</label>
                      <select 
                        value={businessModel} 
                        onChange={(e) => setBusinessModel(e.target.value as 'product' | 'service')}
                        className="dropdown-select"
                      >
                        <option value="product">{t('analyticsTool.businessModels.product')}</option>
                        <option value="service">{t('analyticsTool.businessModels.service')}</option>
                      </select>
                    </div>
                    
                    {/* Источник трафика */}
                    <div className="dropdown-container">
                      <label className="dropdown-label">{t('analyticsTool.trafficSource')}</label>
                      <select 
                        value={trafficSource} 
                        onChange={(e) => setTrafficSource(e.target.value as 'google-search' | 'google-shopping' | 'meta' | 'tiktok' | 'email')}
                        className="dropdown-select"
                      >
                        <option value="google-search">{t('analyticsTool.trafficSources.googleSearch')}</option>
                        <option value="google-shopping">{t('analyticsTool.trafficSources.googleShopping')}</option>
                        <option value="meta">{t('analyticsTool.trafficSources.meta')}</option>
                        <option value="tiktok">{t('analyticsTool.trafficSources.tiktok')}</option>
                        <option value="email">{t('analyticsTool.trafficSources.email')}</option>
                      </select>
                    </div>
                  </div>
                  
                  <button 
                    className="header-export-button"
                    onClick={() => setShowExportModal(true)}
                    title={t('analyticsTool.buttons.export')}
                  >
                    <img src="/icons/download.svg" alt="Download" width="11" height="11" />
                    {t('analyticsTool.buttons.export')}
                  </button>
                  
                  <button 
                    className="header-ai-button"
                    onClick={() => setShowAIModal(true)}
                    title={t('analyticsTool.buttons.aiAnalysis')}
                  >
                    <img src="/icons/ai.svg" alt="AI" width="16" height="16" />
                    {t('analyticsTool.buttons.aiAnalysis')}
                  </button>
                </div>
              </div>
            </div>

            {/* Второй заголовок таблицы */}
            <div className="table-header secondary-header">
              <div className="column-header param-header-secondary">
                <span>{t('analyticsTool.headers.parameter')}</span>
              </div>
              <div className="column-header values-header">
                <div className="dual-header">
                  <span className="day-header">{t('analyticsTool.headers.day')}</span>
                  <div className="period-input-container">
                    <input
                      type="number"
                      value={period}
                      onChange={(e) => setPeriod(Number(e.target.value) || 1)}
                      className="period-input"
                      min="1"
                      max="365"
                    />
                    <span className="period-label">{t('analyticsTool.headers.days')}</span>
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
        
        {/* Модальное окно ИИ анализа */}
        {showAIModal && (
          <div 
            className={`modal-overlay ${isAIModalClosing ? 'closing' : ''}`}
            onClick={closeAIModal}
          >
            <div 
              className={`ai-modal-content ${isAIModalClosing ? 'closing' : ''}`}
              onClick={(e) => e.stopPropagation()}
            >
              {/* Левая часть - форма */}
              <div className="ai-modal-left">
                <h3>{t('analyticsTool.aiAnalysis.title')}</h3>
                
                {/* Тумблер валюты */}
                <div className="business-type-toggle">
                  <label className="toggle-label">{t('analyticsTool.currency')}:</label>
                  <div className="toggle-buttons currency-toggle">
                    <button 
                      className={`toggle-btn ${currency === 'uah' ? 'active' : ''}`}
                      onClick={() => setCurrency('uah')}
                    >
                      UAH
                    </button>
                    <button 
                      className={`toggle-btn ${currency === 'usd' ? 'active' : ''}`}
                      onClick={() => setCurrency('usd')}
                    >
                      USD
                    </button>
                    <button 
                      className={`toggle-btn ${currency === 'rub' ? 'active' : ''}`}
                      onClick={() => setCurrency('rub')}
                    >
                      RUB
                    </button>
                  </div>
                </div>
                
                {/* Поле для ниши */}
                <div className="niche-input">
                  <label className="input-label">{t('analyticsTool.niche')}:</label>
                  <input
                    type="text"
                    placeholder={t('analyticsTool.nichePlaceholder')}
                    className="niche-field"
                    value={niche}
                    onChange={(e) => setNiche(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' && !isAnalyzing && niche.trim()) {
                        handleAIAnalysis();
                      }
                    }}
                    disabled={isAnalyzing}
                  />
                </div>
                
                {/* Кнопка анализа */}
                <button 
                  className="ai-analyze-button"
                  onClick={handleAIAnalysis}
                  disabled={isAnalyzing || !niche.trim()}
                >
                  <img src="/icons/ai.svg" alt="AI" width="16" height="16" />
                  {isAnalyzing ? t('analyticsTool.buttons.analyzing') : t('analyticsTool.buttons.analyze')}
                </button>
              </div>
              
              {/* Правая часть - результат */}
              <div className="ai-modal-right">
                <div className="ai-result-header">
                  <h4>{t('analyticsTool.aiAnalysis.resultTitle')}</h4>
                  {aiResponse && !isAnalyzing && (
                    <button 
                      className="copy-response-btn"
                      onClick={copyAIResponse}
                      title={t('analyticsTool.buttons.copy')}
                    >
                      <img src="/icons/button_copy.svg" alt="Copy" width="14" height="14" />
                      {t('analyticsTool.buttons.copy')}
                    </button>
                  )}
                </div>
                <div className="ai-response">
                  {isAnalyzing && (
                    <div className="ai-loading">
                      <div className="loading-spinner"></div>
                      <div className="loading-text">
                        <p>{t('analyticsTool.aiAnalysis.loading.analyzing')}</p>
                        <p>{t('analyticsTool.aiAnalysis.loading.timeWarning')}</p>
                        <p>{t('analyticsTool.aiAnalysis.loading.doNotClose')}</p>
                      </div>
                    </div>
                  )}
                  
                  {aiError && (
                    <div className="ai-error">
                      <p>❌ {aiError}</p>
                    </div>
                  )}
                  
                  {aiResponse && !isAnalyzing && (
                    <div className="ai-result">
                      <div className="ai-text">
                        {aiResponse.split('\n').map((line, index) => (
                          <p key={index}>{line}</p>
                        ))}
                      </div>
                    </div>
                  )}
                  
                  {!isAnalyzing && !aiResponse && !aiError && (
                    <div className="ai-placeholder">
                      <p>{t('analyticsTool.aiAnalysis.placeholder')}</p>
                    </div>
                  )}
                </div>
              </div>
              
              {/* Кнопка закрытия */}
              <button 
                className="close-modal-btn"
                onClick={closeAIModal}
                title={t('analyticsTool.buttons.cancel')}
              >
                ×
              </button>
            </div>
          </div>
        )}
        
        {/* Модальное окно выбора формата экспорта */}
        {showExportModal && (
          <div 
            className={`modal-overlay ${isModalClosing ? 'closing' : ''}`}
            onClick={closeModal}
          >
            <div 
              className={`modal-content ${isModalClosing ? 'closing' : ''}`}
              onClick={(e) => e.stopPropagation()}
            >
              <h3>{t('analyticsTool.export.formatTitle')}</h3>
              <div className="export-options">
                <div 
                  className={`radio-option ${exportFormat === 'vertical' ? 'active' : ''}`}
                  onClick={() => setExportFormat('vertical')}
                >
                  <ColumnIcon className="option-icon" />
                  <div className="option-details">
                    <strong>{t('analyticsTool.export.formats.vertical')}</strong>
                  </div>
                </div>
                
                <div 
                  className={`radio-option ${exportFormat === 'horizontal' ? 'active' : ''}`}
                  onClick={() => setExportFormat('horizontal')}
                >
                  <StringIcon className="option-icon" />
                  <div className="option-details">
                    <strong>{t('analyticsTool.export.formats.horizontal')}</strong>
                  </div>
                </div>
              </div>
              
              <div className="modal-buttons">
                <button
                  onClick={() => {
                    exportToExcel(exportFormat);
                    closeModal();
                  }}
                  className="analytics-button export-button"
                >
                  {t('analyticsTool.buttons.downloadTable')}
                </button>
                <button
                  onClick={closeModal}
                  className="analytics-button clear-button"
                >
                  {t('analyticsTool.buttons.cancel')}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* SEO блок */}
        <div className="seo-section">
          <div className="seo-content">
            <div className="seo-item">
              <p>{t('analyticsTool.seo.toolDescription')}</p>
            </div>
            
            <div className="seo-item">
              <h2>{t('analyticsTool.seo.whatIsAnalytics')}</h2>
              <p>{t('analyticsTool.seo.whatIsAnalyticsText')}</p>
            </div>
            
            <div className="seo-item">
              <h2>{t('analyticsTool.seo.whyNeededAnalytics')}</h2>
              <h3>{t('analyticsTool.seo.whyNeededAnalyticsTitle')}</h3>
              <p>{t('analyticsTool.seo.whyNeededAnalyticsText')}</p>
            </div>
            
            <div className="seo-item">
              <h2>{t('analyticsTool.seo.howItWorks')}</h2>
              <h3>{t('analyticsTool.seo.howItWorksTitle')}</h3>
              <p>{t('analyticsTool.seo.howItWorksText')}</p>
            </div>
            
            <div className="seo-item">
              <h2>{t('analyticsTool.seo.whatMetrics')}</h2>
              <p>{t('analyticsTool.seo.whatMetricsText')}</p>
            </div>
            
            <div className="seo-item">
              <h2>{t('analyticsTool.seo.whoNeedsIt')}</h2>
              <p>{t('analyticsTool.seo.whoNeedsItText')}</p>
            </div>
            
            <div className="seo-item">
              <h2>{t('analyticsTool.seo.howToUse')}</h2>
              <p>{t('analyticsTool.seo.howToUseText')}</p>
            </div>
          </div>
        </div>

        {/* Модальные окна для авторизации */}
        <AuthRequiredModal
          isOpen={isAuthRequiredModalOpen}
          onClose={closeAuthRequiredModal}
          onLoginClick={openAuthModal}
        />

        <AuthModal
          isOpen={isAuthModalOpen}
          onClose={closeAuthModal}
          initialMode="login"
        />
      </div>
    </>
  );
};

export default AnalyticsTool;