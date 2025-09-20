import React from 'react';

const AdminFinance: React.FC = () => {
  return (
    <div className="admin-section">
      <div className="admin-section-header">
        <h1>Финансы</h1>
        <p>Финансовая аналитика и управление платежами</p>
      </div>
      
      <div className="admin-content">
        <div className="placeholder-content">
          <h3>💰 Финансовое управление</h3>
          <ul>
            <li>Платежи и транзакции</li>
            <li>Подписки пользователей</li>
            <li>Анализ доходов</li>
            <li>Статистика по тарифам</li>
            <li>Отчеты и аналитика</li>
          </ul>
        </div>
      </div>
    </div>
  );
};

export default AdminFinance;