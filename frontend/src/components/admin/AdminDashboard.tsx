import React from 'react';

const AdminDashboard: React.FC = () => {
  return (
    <div className="admin-section">
      <div className="admin-section-header">
        <h1>Дашборд</h1>
        <p>Общая статистика использования инструментов</p>
      </div>
      
      <div className="admin-content">
        {/* Здесь будет контент текущей админ-панели */}
        <div className="placeholder-content">
          <h3>📊 Статистика использования</h3>
          <p>Текущий контент дашборда будет перенесен сюда</p>
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;