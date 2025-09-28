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
  height?: number;
}

const AnalyticsChart: React.FC<AnalyticsChartProps> = ({ 
  data, 
  color = '#3b82f6',
  title = 'Analytics Chart',
  height = 180
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
          color: '#BCBBBD',
          fontSize: '14px'
        }}>
          Нет данных для отображения
        </div>
      </div>
    );
  }
  
  const chartData = data;
  
  // Умная логика для интервала подписей в зависимости от количества дней
  const getTickSettings = () => {
    const dataLength = data.length;
    
    if (dataLength <= 31) {
      // До месяца - показываем дни
      return { 
        interval: dataLength <= 14 ? 0 : Math.floor(dataLength / 8), 
        minTickGap: 15,
        showDays: true
      };
    } else {
      // Больше месяца - показываем месяцы
      return { 
        interval: Math.floor(dataLength / 6), 
        minTickGap: 40,
        showDays: false
      };
    }
  };

  const tickSettings = getTickSettings();
  
  // Создаем ID для уникального градиента
  const gradientId = `gradient-${color.replace('#', '')}`;
  
  // Единый градиент для всех графиков
  const getGradientColors = () => {
    // Всегда используем одинаковый градиент
    return {
      start: '#5E35F2',
      middle: '#5E35F2', // Можно оставить средний цвет таким же или сделать промежуточным
      end: '#F22987'
    };
  };

  const gradientColors = getGradientColors();

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
      <ResponsiveContainer width="100%" height={height}>
        <LineChart data={chartData} margin={{ top: 20, right: 20, bottom: 35, left: 30 }}>
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
            tick={{ fontSize: 14, fill: '#9ca3af', dy: 10 }}
            interval={tickSettings.interval}
            minTickGap={tickSettings.minTickGap}
            tickFormatter={(value) => {
              const date = new Date(value);
              if (tickSettings.showDays) {
                // Для коротких периодов показываем дни
                return date.getDate().toString();
              } else {
                // Для длинных периодов - "день мес."
                return date.toLocaleDateString('ru-RU', { 
                  day: 'numeric', 
                  month: 'short' 
                });
              }
            }}
          />
          <YAxis hide />
          <Tooltip content={<CustomTooltip />} />
          <Line 
            type="natural" 
            dataKey="value" 
            stroke={`url(#${gradientId})`}
            strokeWidth={6}
            dot={false}
            activeDot={{ r: 6, fill: gradientColors.middle, strokeWidth: 2, stroke: '#fff' }}
            strokeLinecap="round"
            strokeLinejoin="round"
            connectNulls={false}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
};

export default AnalyticsChart;