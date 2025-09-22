import React from 'react';
import './MiniBarChart.css';

interface MiniBarChartProps {
  value: number;
  maxValue: number;
  width?: number;
  height?: number;
}

const MiniBarChart: React.FC<MiniBarChartProps> = ({
  value,
  maxValue,
  width,
  height = 10
}) => {
  const percentage = maxValue > 0 ? (value / maxValue) * 100 : 0;

  return (
    <div className="mini-bar-chart" style={{ width: width || '100%', height }}>
      <div className="mini-bar-background">
        <div 
          className="mini-bar-fill"
          style={{
            width: `${percentage}%`,
            height: '100%'
          }}
        />
      </div>
    </div>
  );
};

export default MiniBarChart;