import React from 'react';
import './Audiences.css';

const Audiences: React.FC = () => {
  return (
    <div className="audiences-container">
      <div className="coming-soon">
        <div className="coming-soon-icon">👥</div>
        <h2>Аудитории</h2>
        <p>
          Создавайте сегменты пользователей по различным критериям: 
          активность, баланс коинов, использованные инструменты и многое другое.
        </p>
        <div className="features-preview">
          <div className="feature-item">
            <span className="feature-icon">🎯</span>
            <span>Точная сегментация</span>
          </div>
          <div className="feature-item">
            <span className="feature-icon">🔄</span>
            <span>Динамические группы</span>
          </div>
          <div className="feature-item">
            <span className="feature-icon">📋</span>
            <span>Импорт списков</span>
          </div>
        </div>
        <span className="badge-coming-soon">🚧 В разработке - ЭТАП 6</span>
      </div>
    </div>
  );
};

export default Audiences;
