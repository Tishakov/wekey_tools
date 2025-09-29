import React, { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import AnalyticsChart from '../AnalyticsChart';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts';
import './DashboardCharts.css';

interface ActivityData {
  date: string;
  usageCount: number;
}

interface TopToolData {
  name: string;
  count: number;
  percentage: number;
}

const DashboardCharts: React.FC = () => {
  const { user } = useAuth();
  const [activityData, setActivityData] = useState<ActivityData[]>([]);
  const [topToolsData, setTopToolsData] = useState<TopToolData[]>([]);
  const [loading, setLoading] = useState(true);
  const [hasDataInLast30Days, setHasDataInLast30Days] = useState(false);

  // Загрузка данных для графиков
  useEffect(() => {
    const fetchChartData = async () => {
      if (!user || !localStorage.getItem('wekey_token')) return;
      
      try {
        // Получаем данные активности за последние 30 дней
        const activityResponse = await fetch('http://localhost:8880/api/auth/activity-chart', {
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('wekey_token')}`,
            'Content-Type': 'application/json'
          }
        });

        // Получаем топ-5 инструментов
        const topToolsResponse = await fetch('http://localhost:8880/api/auth/top-tools', {
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('wekey_token')}`,
            'Content-Type': 'application/json'
          }
        });

        if (activityResponse.ok) {
          const activityResult = await activityResponse.json();
          if (activityResult.success && activityResult.data) {
            setActivityData(activityResult.data);
            // Проверяем, есть ли реальная активность за последние 30 дней
            const hasActivity = activityResult.data.some((item: ActivityData) => item.usageCount > 0);
            setHasDataInLast30Days(hasActivity);
          } else {
            // Для нового пользователя показываем пустые данные (все нули)
            const emptyData = [];
            for (let i = 29; i >= 0; i--) {
              const date = new Date();
              date.setDate(date.getDate() - i);
              emptyData.push({
                date: date.toISOString().split('T')[0],
                usageCount: 0
              });
            }
            setActivityData(emptyData);
            setHasDataInLast30Days(false);
          }
        } else {
          // При ошибке API тоже показываем пустые данные
          const emptyData = [];
          for (let i = 29; i >= 0; i--) {
            const date = new Date();
            date.setDate(date.getDate() - i);
            emptyData.push({
              date: date.toISOString().split('T')[0],
              usageCount: 0
            });
          }
          setActivityData(emptyData);
          setHasDataInLast30Days(false);
        }

        if (topToolsResponse.ok) {
          const topToolsResult = await topToolsResponse.json();
          if (topToolsResult.success && topToolsResult.data && topToolsResult.data.length > 0) {
            setTopToolsData(topToolsResult.data);
            // Если есть данные по инструментам, проверяем что есть реальная активность
            const hasToolsActivity = topToolsResult.data.some((tool: TopToolData) => tool.count > 0);
            setHasDataInLast30Days(prev => prev || hasToolsActivity);
          } else {
            // Для нового пользователя показываем пустые данные
            setTopToolsData([]);
          }
        } else {
          // При ошибке API тоже показываем пустые данные
          setTopToolsData([]);
        }
      } catch (error) {
        console.error('Ошибка загрузки данных графиков:', error);
        // При ошибке показываем пустые данные
        const emptyData = [];
        for (let i = 29; i >= 0; i--) {
          const date = new Date();
          date.setDate(date.getDate() - i);
          emptyData.push({
            date: date.toISOString().split('T')[0],
            usageCount: 0
          });
        }
        setActivityData(emptyData);
        setTopToolsData([]);
        setHasDataInLast30Days(false);
      } finally {
        setLoading(false);
      }
    };

    fetchChartData();
  }, [user]);



  // Цвета для круговой диаграммы
  const pieColors = ['#5E35F2', '#F22987', '#3b82f6', '#10b981', '#f59e0b'];

  // Функция для форматирования названий инструментов
  const formatToolName = (toolName: string): string => {
    // Словарь стандартных переводов названий инструментов (из fix_tool_names.js)
    const toolTranslations: { [key: string]: string } = {
      // Основные инструменты
      'add-symbol': 'Добавление символа',
      'case-changer': 'Изменения регистра',
      'char-counter': 'Количество символов', 
      'cross-analytics': 'Сквозная аналитика',
      'duplicate-finder': 'Поиск дубликатов',
      'remove-duplicates': 'Удаление дубликатов',
      'remove-empty-lines': 'Удаление пустых строк',
      'emoji': 'Эмодзи',
      'find-replace': 'Найти и заменить',
      'match-types': 'Типы соответствия',
      'minus-words': 'Обработка минус-слов',
      'number-generator': 'Генератор чисел',
      'password-generator': 'Генератор паролей',
      'remove-line-breaks': 'Удаление переносов',
      'spaces-to-paragraphs': 'Пробелы на абзацы',
      'synonym-generator': 'Генератор синонимов',
      'text-by-columns': 'Текст по столбцам',
      'text-generator': 'Генератор текста',
      'text-optimizer': 'Оптимизатор текста',
      'text-sorting': 'Сортировка слов и строк',
      'text-to-html': 'Текст в HTML',
      'transliteration': 'Транслитерация',
      'utm-generator': 'Генератор UTM-меток',
      'word-declension': 'Склонение слов',
      'word-gluing': 'Склейка слов',
      'word-mixer': 'Миксация слов',
      
      // SEO инструменты
      'seo-analyzer': 'SEO анализатор',
      'meta-tags-generator': 'Генератор мета-тегов',
      'sitemap-generator': 'Генератор карты сайта',
      'robots-txt-generator': 'Генератор robots.txt',
      'schema-markup-generator': 'Генератор Schema разметки',
      
      // Английские названия из базы данных
      'Remove Empty Lines': 'Удаление пустых строк',
      'Site Audit': 'Аудит сайта',
      'Remove Duplicates': 'Удаление дубликатов',
      'Number Generator': 'Генератор чисел',
      'Password Generator': 'Генератор паролей',
      
      // Дополнительные варианты написания
      'site-audit': 'Аудит сайта',
      'siteaudit': 'Аудит сайта'
    };

    // Если есть перевод - используем его, иначе форматируем название
    if (toolTranslations[toolName]) {
      return toolTranslations[toolName];
    }

    // Форматируем название: убираем дефисы, делаем первую букву заглавной
    return toolName
      .split('-')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');
  };

  // Кастомный tooltip для круговой диаграммы
  const CustomPieTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0];
      return (
        <div className="custom-pie-tooltip">
          <p className="custom-pie-tooltip-title">
            {formatToolName(data.payload.name)}
          </p>
          <p className="custom-pie-tooltip-details">
            Использований: {data.payload.count} ({data.payload.percentage}%)
          </p>
        </div>
      );
    }
    return null;
  };

  if (!user) {
    return null;
  }

  // Скрываем графики для новых пользователей без данных за последние 30 дней
  if (!loading && !hasDataInLast30Days) {
    return null;
  }

  return (
    <div className="dashboard-charts-container">
      <div className="dashboard-charts-grid">
        {/* График активности по дням */}
        <div className="dashboard-chart-card dashboard-activity-chart">
          <h3>Активность за 30 дней</h3>
          <div className="chart-content">
            {loading ? (
              <div className="chart-loading">Загрузка данных...</div>
            ) : (
              <AnalyticsChart 
                data={activityData.map(item => ({
                  date: item.date,
                  value: item.usageCount
                }))} 
                color="#3b82f6"
                title="Использований инструментов"
                height={220}
              />
            )}
          </div>
        </div>

        {/* Круговая диаграмма топ-5 инструментов */}
        <div className="dashboard-chart-card dashboard-pie-chart">
          <h3>ТОП-5 инструментов</h3>
          <p className="chart-subtitle">За все время</p>
          <div className="chart-content">
            {loading ? (
              <div className="chart-loading">Загрузка данных...</div>
            ) : (
              <>
                <div className="pie-chart-wrapper">
                  <ResponsiveContainer width="100%" height={140}>
                    <PieChart>
                      <Pie
                        data={topToolsData as any}
                        cx="50%"
                        cy="50%"
                        innerRadius={30}
                        outerRadius={60}
                        paddingAngle={4}
                        dataKey="count"
                        stroke="#28282A"
                      >
                        {topToolsData.map((_, index) => (
                          <Cell key={`cell-${index}`} fill={pieColors[index % pieColors.length]} />
                        ))}
                      </Pie>
                      <Tooltip content={<CustomPieTooltip />} />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
                
                {/* Легенда */}
                <div className="pie-legend">
                  {topToolsData.map((tool, index) => (
                    <div key={tool.name} className="legend-item">
                      <div 
                        className={`legend-color legend-color-${index}`}
                      ></div>
                      <span className="legend-name">{formatToolName(tool.name)}</span>
                      <span className="legend-value">{tool.percentage}%</span>
                    </div>
                  ))}
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default DashboardCharts;