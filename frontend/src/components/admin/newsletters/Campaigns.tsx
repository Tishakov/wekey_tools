import React from 'react';
import './Campaigns.css';

const Campaigns: React.FC = () => {
  return (
    <div className="campaigns-container">
      <div className="coming-soon">
        <div className="coming-soon-icon">📨</div>
        <h2>Рассылки</h2>
        <p>
          История всех отправленных рассылок с детальной статистикой: 
          количество отправлений, открытий, кликов и конверсий.
        </p>
        <div className="features-preview">
          <div className="feature-item">
            <span className="feature-icon">📊</span>
            <span>Детальная статистика</span>
          </div>
          <div className="feature-item">
            <span className="feature-icon">📈</span>
            <span>A/B тестирование</span>
          </div>
          <div className="feature-item">
            <span className="feature-icon">⏰</span>
            <span>Отложенная отправка</span>
          </div>
        </div>
        <span className="badge-coming-soon">🚧 В разработке - ЭТАП 5</span>
      </div>
    </div>
  );
};

export default Campaigns;
