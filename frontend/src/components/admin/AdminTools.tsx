import React from 'react';

const AdminTools: React.FC = () => {
  return (
    <div className="admin-section">
      <div className="admin-section-header">
        <h1>Инструменты</h1>
        <p>Управление инструментами сайта</p>
      </div>
      
      <div className="admin-content">
        <div className="placeholder-content">
          <h3>🛠️ Управление инструментами</h3>
          <ul>
            <li>Включение/отключение инструментов</li>
            <li>Изменение порядка отображения</li>
            <li>Просмотр статистики использования</li>
            <li>Настройка доступности</li>
          </ul>
        </div>
      </div>
    </div>
  );
};

export default AdminTools;