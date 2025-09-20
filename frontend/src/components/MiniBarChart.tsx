import React from 'react';
import './MiniBarChart.css';

interface MiniBarChartProps {
  value: number;
  maxValue: number;
  color?: string;
  width?: number;
  height?: number;
}

const MiniBarChart: React.FC<MiniBarChartProps> = ({
  value,
  maxValue,
  color = '#3b82f6',
  width = 80,
  height = 20
}) => {
  const percentage = maxValue > 0 ? (value / maxValue) * 100 : 0;

  return (
    <div className="mini-bar-chart" style={{ width, height }}>
      <div className="mini-bar-background">
        <div 
          className="mini-bar-fill"
          style={{
            width: `${percentage}%`,
            height: '100%'
          }}
        />
      </div>
      <span className="mini-bar-value">{value}</span>
    </div>
  );
};

export default MiniBarChart;