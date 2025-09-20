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

  return (
    <div className="analytics-chart">
      <ResponsiveContainer width="100%" height={180}>
        <LineChart data={chartData} margin={{ top: 20, right: 20, bottom: 20, left: 0 }}>
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
            type="monotone" 
            dataKey="value" 
            stroke={color}
            strokeWidth={3}
            dot={false}
            activeDot={{ r: 4, fill: color }}
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