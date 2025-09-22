import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import ExcelJS from 'exceljs';
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
  isDecimal?: boolean;
  defaultValue: number;
  hasPeriod: boolean;
  sliderRange?: { min: number; max: number };
}

interface Group {
  title: string;
  color: string;
  metrics: Metric[];
}

const AnalyticsTool: React.FC = () => {
  const { t } = useTranslation();
  const { createLink } = useLocalizedLink();

  const metricsConfig: Group[] = [
    {
      title: t('analyticsTool.groups.traffic'),
      color: '#6B7280',
      metrics: [
        { 
          id: 'clicks', 
          name: t('analyticsTool.metrics.clicks.name'), 
          tooltip: t('analyticsTool.metrics.clicks.tooltip'), 
          isPercentage: false, 
          defaultValue: 300, 
          hasPeriod: true, 
          sliderRange: { min: 0, max: 500 } 
        },
        { 
          id: 'impressions', 
          name: t('analyticsTool.metrics.impressions.name'), 
          tooltip: t('analyticsTool.metrics.impressions.tooltip'), 
          isPercentage: false, 
          defaultValue: 8000, 
          hasPeriod: true, 
          sliderRange: { min: 0, max: 10000 } 
        },
        { 
          id: 'ctr', 
          name: t('analyticsTool.metrics.ctr.name'), 
          tooltip: t('analyticsTool.metrics.ctr.tooltip'), 
          isPercentage: true, 
          defaultValue: 3.75, 
          hasPeriod: false 
        },
      ]
    },
    {
      title: t('analyticsTool.groups.costs'),
      color: '#EF4444',
      metrics: [
        { 
          id: 'cpc', 
          name: t('analyticsTool.metrics.cpc.name'), 
          tooltip: t('analyticsTool.metrics.cpc.tooltip'), 
          isPercentage: false, 
          isDecimal: true, 
          defaultValue: 12, 
          hasPeriod: false, 
          sliderRange: { min: 0, max: 50 } 
        },
        { 
          id: 'adCost', 
          name: t('analyticsTool.metrics.adCost.name'), 
          tooltip: t('analyticsTool.metrics.adCost.tooltip'), 
          isPercentage: false, 
          defaultValue: 3600, 
          hasPeriod: true, 
          sliderRange: { min: 0, max: 10000 } 
        },
      ]
    },
    {
      title: t('analyticsTool.groups.website'),
      color: '#F59E0B',
      metrics: [
        { 
          id: 'cr1', 
          name: t('analyticsTool.metrics.cr1.name'), 
          tooltip: t('analyticsTool.metrics.cr1.tooltip'), 
          isPercentage: true, 
          defaultValue: 4.0, 
          hasPeriod: false, 
          sliderRange: { min: 0, max: 50 } 
        },
        { 
          id: 'leads', 
          name: t('analyticsTool.metrics.leads.name'), 
          tooltip: t('analyticsTool.metrics.leads.tooltip'), 
          isPercentage: false, 
          isDecimal: true, 
          defaultValue: 12, 
          hasPeriod: true, 
          sliderRange: { min: 0, max: 200 } 
        },
        { 
          id: 'cpl', 
          name: t('analyticsTool.metrics.cpl.name'), 
          tooltip: t('analyticsTool.metrics.cpl.tooltip'), 
          isPercentage: false, 
          defaultValue: 300, 
          hasPeriod: false, 
          sliderRange: { min: 0, max: 1000 } 
        },
      ]
    },
    {
      title: t('analyticsTool.groups.sales'),
      color: '#3B82F6',
      metrics: [
        { 
          id: 'cr2', 
          name: t('analyticsTool.metrics.cr2.name'), 
          tooltip: t('analyticsTool.metrics.cr2.tooltip'), 
          isPercentage: true, 
          defaultValue: 75.0, 
          hasPeriod: false 
        },
        { 
          id: 'sales', 
          name: t('analyticsTool.metrics.sales.name'), 
          tooltip: t('analyticsTool.metrics.sales.tooltip'), 
          isPercentage: false, 
          isDecimal: true, 
          defaultValue: 9, 
          hasPeriod: true, 
          sliderRange: { min: 0, max: 100 } 
        },
        { 
          id: 'cpo', 
          name: t('analyticsTool.metrics.cpo.name'), 
          tooltip: t('analyticsTool.metrics.cpo.tooltip'), 
          isPercentage: false, 
          defaultValue: 400, 
          hasPeriod: false, 
          sliderRange: { min: 0, max: 1000 } 
        },
      ]
    },
    {
      title: t('analyticsTool.groups.pricing'),
      color: '#8B5CF6',
      metrics: [
        { 
          id: 'aov', 
          name: t('analyticsTool.metrics.aov.name'), 
          tooltip: t('analyticsTool.metrics.aov.tooltip'), 
          isPercentage: false, 
          defaultValue: 3000, 
          hasPeriod: false, 
          sliderRange: { min: 0, max: 5000 } 
        },
        { 
          id: 'revenue', 
          name: t('analyticsTool.metrics.revenue.name'), 
          tooltip: t('analyticsTool.metrics.revenue.tooltip'), 
          isPercentage: false, 
          defaultValue: 27000, 
          hasPeriod: true, 
          sliderRange: { min: 0, max: 100000 } 
        },
        { 
          id: 'marginPercent', 
          name: t('analyticsTool.metrics.marginPercent.name'), 
          tooltip: t('analyticsTool.metrics.marginPercent.tooltip'), 
          isPercentage: true, 
          defaultValue: 50, 
          hasPeriod: false 
        },
        { 
          id: 'marginPerUnit', 
          name: t('analyticsTool.metrics.marginPerUnit.name'), 
          tooltip: t('analyticsTool.metrics.marginPerUnit.tooltip'), 
          isPercentage: false, 
          defaultValue: 1500, 
          hasPeriod: false, 
          sliderRange: { min: 0, max: 5000 } 
        },
        { 
          id: 'totalMargin', 
          name: t('analyticsTool.metrics.totalMargin.name'), 
          tooltip: t('analyticsTool.metrics.totalMargin.tooltip'), 
          isPercentage: false, 
          defaultValue: 13500, 
          hasPeriod: false, 
          sliderRange: { min: 0, max: 50000 } 
        },
      ]
    },
    {
      title: t('analyticsTool.groups.revenue'),
      color: '#10B981',
      metrics: [
        { 
          id: 'netProfit', 
          name: t('analyticsTool.metrics.netProfit.name'), 
          tooltip: t('analyticsTool.metrics.netProfit.tooltip'), 
          isPercentage: false, 
          defaultValue: 9900, 
          hasPeriod: true, 
          sliderRange: { min: 0, max: 50000 } 
        },
        { 
          id: 'netProfitPerUnit', 
          name: t('analyticsTool.metrics.netProfitPerUnit.name'), 
          tooltip: t('analyticsTool.metrics.netProfitPerUnit.tooltip'), 
          isPercentage: false, 
          defaultValue: 1100, 
          hasPeriod: true, 
          sliderRange: { min: 0, max: 5000 } 
        },
        { 
          id: 'romi', 
          name: t('analyticsTool.metrics.romi.name'), 
          tooltip: t('analyticsTool.metrics.romi.tooltip'), 
          isPercentage: true, 
          defaultValue: 275, 
          hasPeriod: false, 
          sliderRange: { min: 0, max: 1000 } 
        },
        { 
          id: 'roas', 
          name: t('analyticsTool.metrics.roas.name'), 
          tooltip: t('analyticsTool.metrics.roas.tooltip'), 
          isPercentage: false, 
          defaultValue: 7.5, 
          hasPeriod: false, 
          sliderRange: { min: 0, max: 10 } 
        },
      ]
    },
    {
      title: t('analyticsTool.groups.formulas'),
      color: '#6B7280',
      metrics: [
        { 
          id: 'drr', 
          name: t('analyticsTool.metrics.drr.name'), 
          tooltip: t('analyticsTool.metrics.drr.tooltip'), 
          isPercentage: true, 
          isDecimal: true, 
          defaultValue: 13.33, 
          hasPeriod: false 
        },
        { 
          id: 'iccr', 
          name: t('analyticsTool.metrics.iccr.name'), 
          tooltip: t('analyticsTool.metrics.iccr.tooltip'), 
          isPercentage: true, 
          isDecimal: true, 
          defaultValue: 26.67, 
          hasPeriod: false 
        },
        { 
          id: 'cpm', 
          name: t('analyticsTool.metrics.cpm.name'), 
          tooltip: t('analyticsTool.metrics.cpm.tooltip'), 
          isPercentage: false, 
          defaultValue: 450, 
          hasPeriod: false, 
          sliderRange: { min: 0, max: 1000 } 
        },
      ]
    }
  ];

  // Состояния компонента
  const [values, setValues] = useState<Record<string, number>>({});
  const [activeTooltip, setActiveTooltip] = useState<string | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [aiAnalysis, setAiAnalysis] = useState<string>('');
  const [isLoadingAnalysis, setIsLoadingAnalysis] = useState(false);
  const [exportFormat, setExportFormat] = useState<'excel' | 'csv'>('excel');

  // Инициализация значений по умолчанию
  useEffect(() => {
    const defaultValues: Record<string, number> = {};
    metricsConfig.forEach(group => {
      group.metrics.forEach(metric => {
        defaultValues[metric.id] = metric.defaultValue;
      });
    });
    setValues(defaultValues);
  }, []);

  // Обработчики
  const handleValueChange = (metricId: string, value: number) => {
    setValues(prev => ({ ...prev, [metricId]: value }));
  };

  const handleAIAnalysis = async () => {
    setIsLoadingAnalysis(true);
    try {
      const analyticsData: AnalyticsData = {
        businessType: 'ecommerce',
        landingType: 'ecommerce',
        businessModel: 'product',
        trafficSource: 'google-search',
        niche: 'general',
        metrics: values,
        period: 30,
        currency: 'usd'
      };
      const response = await openaiService.getAnalysis(analyticsData);
      if (response.success && response.analysis) {
        setAiAnalysis(response.analysis);
      } else {
        setAiAnalysis(response.error || t('analyticsTool.aiAnalysis.error'));
      }
    } catch (error) {
      console.error('AI Analysis failed:', error);
      setAiAnalysis(t('analyticsTool.aiAnalysis.error'));
    } finally {
      setIsLoadingAnalysis(false);
    }
  };

  const exportToExcel = async (format: 'excel' | 'csv') => {
    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet(t('analyticsTool.export.sheetName'));

    // Заголовки
    worksheet.addRow([
      t('analyticsTool.export.headers.group'),
      t('analyticsTool.export.headers.metric'),
      t('analyticsTool.export.headers.value'),
      t('analyticsTool.export.headers.tooltip')
    ]);

    // Данные
    metricsConfig.forEach(group => {
      group.metrics.forEach(metric => {
        const value = values[metric.id] || metric.defaultValue;
        const formattedValue = metric.isPercentage ? `${value}%` : 
                              metric.isDecimal ? value.toFixed(2) : 
                              value.toString();
        
        worksheet.addRow([
          group.title,
          metric.name,
          formattedValue,
          metric.tooltip
        ]);
      });
    });

    // Экспорт
    if (format === 'excel') {
      const buffer = await workbook.xlsx.writeBuffer();
      const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = t('analyticsTool.export.filename') + '.xlsx';
      a.click();
      window.URL.revokeObjectURL(url);
    }
  };

  const openModal = () => setIsModalOpen(true);
  const closeModal = () => setIsModalOpen(false);

  // Временная заглушка
  return (
    <>
      <SEOHead 
        title={t('analyticsTool.title')}
        description={t('analyticsTool.description')}
        keywords={t('analyticsTool.keywords')}
      />
      <div className="tool-page">
        <div className="tool-header">
          <h1>{t('analyticsTool.title')}</h1>
          <p>{t('analyticsTool.description')}</p>
        </div>
        
        <div className="analytics-content">
          <div className="analytics-controls">
            <button onClick={handleAIAnalysis} disabled={isLoadingAnalysis} className="analytics-button ai-button">
              {isLoadingAnalysis ? t('analyticsTool.buttons.analyzing') : t('analyticsTool.buttons.aiAnalysis')}
            </button>
            <button onClick={openModal} className="analytics-button export-button">
              {t('analyticsTool.buttons.export')}
            </button>
          </div>

          {/* Группы метрик */}
          <div className="metrics-groups">
            {metricsConfig.map((group, groupIndex) => (
              <div key={groupIndex} className="metrics-group" style={{ borderColor: group.color }}>
                <h3 className="group-title" style={{ color: group.color }}>{group.title}</h3>
                <div className="metrics-list">
                  {group.metrics.map((metric) => (
                    <div key={metric.id} className="metric-item">
                      <div className="metric-header">
                        <label className="metric-label">{metric.name}</label>
                        <span 
                          className="metric-tooltip-icon"
                          onMouseEnter={() => setActiveTooltip(metric.id)}
                          onMouseLeave={() => setActiveTooltip(null)}
                        >
                          ?
                        </span>
                      </div>
                      {activeTooltip === metric.id && (
                        <div className="metric-tooltip">{metric.tooltip}</div>
                      )}
                      <div className="metric-input">
                        {metric.sliderRange ? (
                          <input
                            type="range"
                            min={metric.sliderRange.min}
                            max={metric.sliderRange.max}
                            value={values[metric.id] || metric.defaultValue}
                            onChange={(e) => handleValueChange(metric.id, Number(e.target.value))}
                            className="metric-slider"
                          />
                        ) : (
                          <input
                            type="number"
                            value={values[metric.id] || metric.defaultValue}
                            onChange={(e) => handleValueChange(metric.id, Number(e.target.value))}
                            className="metric-number-input"
                            step={metric.isDecimal ? 0.01 : 1}
                          />
                        )}
                        <span className="metric-value">
                          {metric.isPercentage 
                            ? `${(values[metric.id] || metric.defaultValue).toFixed(2)}%`
                            : metric.isDecimal 
                              ? (values[metric.id] || metric.defaultValue).toFixed(2)
                              : (values[metric.id] || metric.defaultValue).toString()
                          }
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>

          {/* AI Анализ */}
          {aiAnalysis && (
            <div className="ai-analysis-section">
              <h3>{t('analyticsTool.aiAnalysis.title')}</h3>
              <div className="ai-analysis-content">
                {aiAnalysis.split('\n').map((line, index) => (
                  <p key={index}>{line}</p>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Модальное окно экспорта */}
        {isModalOpen && (
          <div className="modal-overlay">
            <div className="modal-content">
              <h3>{t('analyticsTool.export.title')}</h3>
              <div className="export-options">
                <label>
                  <input
                    type="radio"
                    value="excel"
                    checked={exportFormat === 'excel'}
                    onChange={(e) => setExportFormat(e.target.value as 'excel' | 'csv')}
                  />
                  {t('analyticsTool.export.formats.excel')}
                </label>
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

        <div className="back-button-container">
          <Link to={createLink('')} className="back-button">
            {t('common.backToTools')}
          </Link>
        </div>
      </div>
    </>
  );
};

export default AnalyticsTool;