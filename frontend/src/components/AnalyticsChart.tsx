import React from 'react';
import { LineChart, Line, XAxis, YAxis, ResponsiveContainer, Tooltip } from 'recharts';

interface ChartData {
  date: string;
  value: number;
}

interface AnalyticsChartProps {
  data: ChartData[];
  color?: string;
  title?: string;
}

const AnalyticsChart: React.FC<AnalyticsChartProps> = ({ 
  data, 
  color = '#3b82f6',
  title = 'Analytics Chart'
}) => {
  // Если нет данных, показываем сообщение о пустом графике
  if (data.length === 0) {
    return (
      <div className="analytics-chart">
        <div style={{ 
          height: 180, 
          display: 'flex', 
          alignItems: 'center', 
          justifyContent: 'center',
          color: '#6b7280',
          fontSize: '14px'
        }}>
          Нет данных для отображения
        </div>
      </div>
    );
  }
  
  const chartData = data;
  
  // Создаем ID для уникального градиента
  const gradientId = `gradient-${color.replace('#', '')}`;
  
  // Предустановленные красивые градиенты
  const getGradientColors = (baseColor: string) => {
    const gradients: { [key: string]: { start: string; middle: string; end: string } } = {
      '#3b82f6': { // Синий
        start: '#8B5CF6', // Фиолетовый
        middle: '#3B82F6', // Синий
        end: '#06B6D4'  // Голубой
      },
      '#10b981': { // Зеленый
        start: '#10B981', // Зеленый
        middle: '#06B6D4', // Голубой
        end: '#8B5CF6'  // Фиолетовый
      },
      '#f59e0b': { // Желтый/Оранжевый
        start: '#F59E0B', // Желтый
        middle: '#EF4444', // Красный
        end: '#EC4899'  // Розовый
      },
      '#ef4444': { // Красный
        start: '#EC4899', // Розовый
        middle: '#EF4444', // Красный
        end: '#F59E0B'  // Желтый
      }
    };
    
    return gradients[baseColor] || {
      start: '#8B5CF6',
      middle: baseColor,
      end: '#06B6D4'
    };
  };

  const gradientColors = getGradientColors(color);

  // Кастомный компонент для tooltip
  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0];
      const date = new Date(label);
      const formattedDate = date.toLocaleDateString('ru-RU', { 
        day: 'numeric', 
        month: 'long',
        year: 'numeric'
      });
      
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
          <p style={{ margin: '0 0 4px 0', color: '#9ca3af', fontSize: '12px' }}>
            {formattedDate}
          </p>
          <p style={{ margin: 0, fontWeight: 'bold', color: data.color }}>
            {title.replace('Динамика ', '').charAt(0).toUpperCase() + title.replace('Динамика ', '').slice(1)}: {data.value}
          </p>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="analytics-chart">
      <ResponsiveContainer width="100%" height={180}>
        <LineChart data={chartData} margin={{ top: 20, right: 20, bottom: 20, left: 0 }}>
          <defs>
            <linearGradient id={gradientId} x1="0" y1="0" x2="1" y2="0">
              <stop offset="0%" stopColor={gradientColors.start} />
              <stop offset="50%" stopColor={gradientColors.middle} />
              <stop offset="100%" stopColor={gradientColors.end} />
            </linearGradient>
          </defs>
          <XAxis 
            dataKey="date" 
            axisLine={false}
            tickLine={false}
            tick={{ fontSize: 11, fill: '#9ca3af' }}
            tickFormatter={(value) => {
              // Показываем только день месяца
              const date = new Date(value);
              return date.getDate().toString();
            }}
          />
          <YAxis hide />
          <Tooltip content={<CustomTooltip />} />
          <Line 
            type="natural" 
            dataKey="value" 
            stroke={`url(#${gradientId})`}
            strokeWidth={5}
            dot={false}
            activeDot={{ r: 6, fill: gradientColors.middle, strokeWidth: 2, stroke: '#fff' }}
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
};

export default AnalyticsChart;