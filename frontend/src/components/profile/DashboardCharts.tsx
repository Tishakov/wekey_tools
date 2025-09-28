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
          if (activityResult.success) {
            // Генерируем данные за последние 30 дней (пока моковые)
            const mockActivityData = generateMockActivityData();
            setActivityData(mockActivityData);
          }
        }

        if (topToolsResponse.ok) {
          const topToolsResult = await topToolsResponse.json();
          if (topToolsResult.success) {
            // Пока используем моковые данные
            const mockTopTools = generateMockTopToolsData();
            setTopToolsData(mockTopTools);
          }
        }
      } catch (error) {
        console.error('Ошибка загрузки данных графиков:', error);
        // Генерируем моковые данные при ошибке
        setActivityData(generateMockActivityData());
        setTopToolsData(generateMockTopToolsData());
      } finally {
        setLoading(false);
      }
    };

    fetchChartData();
  }, [user]);

  // Генерация моковых данных активности
  const generateMockActivityData = (): ActivityData[] => {
    const data: ActivityData[] = [];
    const today = new Date();
    
    for (let i = 29; i >= 0; i--) {
      const date = new Date(today);
      date.setDate(date.getDate() - i);
      
      // Генерируем случайное количество использований (0-8)
      const usageCount = Math.floor(Math.random() * 9);
      
      data.push({
        date: date.toISOString().split('T')[0],
        usageCount
      });
    }
    
    return data;
  };

  // Генерация моковых данных топ инструментов
  const generateMockTopToolsData = (): TopToolData[] => {
    const tools = [
      'SEO Аудит',
      'Генератор паролей', 
      'Проверка грамматики',
      'Конвертер изображений',
      'Анализ ключевых слов'
    ];
    
    const total = 100;
    let remaining = total;
    
    return tools.map((tool, index) => {
      let count;
      if (index === tools.length - 1) {
        count = remaining;
      } else {
        const maxCount = Math.floor(remaining / (tools.length - index));
        count = Math.floor(Math.random() * maxCount) + 5;
        remaining -= count;
      }
      
      return {
        name: tool,
        count,
        percentage: Math.round((count / total) * 100)
      };
    }).filter(tool => tool.count > 0).slice(0, 5);
  };

  // Цвета для круговой диаграммы
  const pieColors = ['#5E35F2', '#F22987', '#3b82f6', '#10b981', '#f59e0b'];

  // Кастомный tooltip для круговой диаграммы
  const CustomPieTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0];
      return (
        <div style={{
          backgroundColor: '#1e1e1e',
          border: '1px solid #333',
          borderRadius: '8px',
          padding: '12px',
          color: '#fff',
          fontSize: '14px',
          boxShadow: '0 4px 12px rgba(0, 0, 0, 0.3)'
        }}>
          <p style={{ margin: '0 0 4px 0', fontWeight: 'bold' }}>
            {data.payload.name}
          </p>
          <p style={{ margin: 0, color: '#9ca3af', fontSize: '12px' }}>
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

  return (
    <div className="dashboard-charts">
      <div className="charts-grid">
        {/* График активности по дням */}
        <div className="chart-card">
          <h3>Активность за 30 дней</h3>
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
            />
          )}
        </div>

        {/* Круговая диаграмма топ-5 инструментов */}
        <div className="chart-card">
          <h3>Топ-5 инструментов</h3>
          {loading ? (
            <div className="chart-loading">Загрузка данных...</div>
          ) : (
            <div className="pie-chart-container">
              <ResponsiveContainer width="100%" height={180}>
                <PieChart>
                  <Pie
                    data={topToolsData}
                    cx="50%"
                    cy="50%"
                    innerRadius={40}
                    outerRadius={70}
                    paddingAngle={2}
                    dataKey="count"
                  >
                    {topToolsData.map((_, index) => (
                      <Cell key={`cell-${index}`} fill={pieColors[index % pieColors.length]} />
                    ))}
                  </Pie>
                  <Tooltip content={<CustomPieTooltip />} />
                </PieChart>
              </ResponsiveContainer>
              
              {/* Легенда */}
              <div className="pie-legend">
                {topToolsData.map((tool, index) => (
                  <div key={tool.name} className="legend-item">
                    <div 
                      className="legend-color" 
                      style={{ backgroundColor: pieColors[index % pieColors.length] }}
                    ></div>
                    <span className="legend-name">{tool.name}</span>
                    <span className="legend-value">{tool.percentage}%</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default DashboardCharts;