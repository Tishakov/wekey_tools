import React from 'react';
import './Automations.css';

const Automations: React.FC = () => {
  return (
    <div className="automations-container">
      <div className="coming-soon">
        <div className="coming-soon-icon">🤖</div>
        <h2>Сценарии автоматизации</h2>
        <p>
          Настраивайте автоматические цепочки писем на основе действий пользователей: 
          регистрация, первая покупка, неактивность и другие триггеры.
        </p>
        <div className="features-preview">
          <div className="feature-item">
            <span className="feature-icon">⚡</span>
            <span>Триггерные письма</span>
          </div>
          <div className="feature-item">
            <span className="feature-icon">🔗</span>
            <span>Цепочки сообщений</span>
          </div>
          <div className="feature-item">
            <span className="feature-icon">🎮</span>
            <span>Визуальный редактор</span>
          </div>
        </div>
        <span className="badge-coming-soon">🚧 В разработке - ЭТАП 8</span>
      </div>
    </div>
  );
};

export default Automations;
