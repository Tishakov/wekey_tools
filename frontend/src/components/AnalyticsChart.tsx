import React from 'react';
import { LineChart, Line, XAxis, YAxis, ResponsiveContainer } from 'recharts';

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
  // Генерируем тестовые данные если данные не переданы
  const chartData = data.length > 0 ? data : generateMockData();
  
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

// Генерация мок-данных для демонстрации
function generateMockData(): ChartData[] {
  const data: ChartData[] = [];
  const today = new Date();
  
  for (let i = 29; i >= 0; i--) {
    const date = new Date(today);
    date.setDate(date.getDate() - i);
    
    // Генерируем плавно изменяющиеся данные с некоторой случайностью
    const baseValue = 30 + Math.sin(i * 0.2) * 15;
    const randomVariation = (Math.random() - 0.5) * 10;
    const value = Math.max(5, Math.floor(baseValue + randomVariation));
    
    data.push({
      date: date.toISOString().split('T')[0],
      value: value
    });
  }
  
  return data;
}

export default AnalyticsChart;