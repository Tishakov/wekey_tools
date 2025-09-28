import React, { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import './UserQuickStats.css';

interface UserStats {
  totalToolUsage: number;
  uniqueToolsUsed: number;
  daysOnPlatform: number;
  tokensUsed: number;
}

const UserQuickStats: React.FC = () => {
  const { user } = useAuth();
  const [userStats, setUserStats] = useState<UserStats>({
    totalToolUsage: 0,
    uniqueToolsUsed: 0,
    daysOnPlatform: 0,
    tokensUsed: 0,
  });

  // Загрузка статистики пользователя
  useEffect(() => {
    const fetchUserStats = async () => {
      if (!user || !localStorage.getItem('wekey_token')) return;
      
      try {
        const response = await fetch('http://localhost:8880/api/auth/stats', {
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('wekey_token')}`,
            'Content-Type': 'application/json'
          }
        });

        if (response.ok) {
          const result = await response.json();
          if (result.success && result.stats) {
            setUserStats(result.stats);
          }
        }
      } catch (error) {
        console.error('Ошибка загрузки статистики:', error);
      }
    };

    fetchUserStats();
  }, [user]);

  // Вычисляемые метрики
  const avgToolsPerDay = userStats.daysOnPlatform > 0 
    ? Math.round(userStats.totalToolUsage / userStats.daysOnPlatform * 10) / 10
    : 0;
  
  const avgCoinsPerTool = userStats.totalToolUsage > 0 
    ? Math.round(userStats.tokensUsed / userStats.totalToolUsage * 10) / 10
    : 0;
  
  const toolsExplored = userStats.uniqueToolsUsed;
  const totalTools = 31; // Общее количество инструментов на платформе
  const explorationPercent = Math.round((toolsExplored / totalTools) * 100);
  
  const getUserLevel = () => {
    if (toolsExplored < 5) return { level: 'Новичок', color: '#64B5F6', progress: Math.min((toolsExplored / 5) * 100, 100) };
    if (toolsExplored < 15) return { level: 'Исследователь', color: '#81C784', progress: Math.min(((toolsExplored - 5) / 10) * 100, 100) };
    if (toolsExplored < 25) return { level: 'Эксперт', color: '#FFB74D', progress: Math.min(((toolsExplored - 15) / 10) * 100, 100) };
    if (toolsExplored === 31) return { level: 'Мастер', color: '#E57373', progress: 100 };
    return { level: 'Профи', color: '#BA68C8', progress: Math.min(((toolsExplored - 25) / 6) * 100, 100) };
  };
  
  const userLevel = getUserLevel();
  
  const getEfficiencyLevel = () => {
    if (avgCoinsPerTool <= 2) return { level: 'Экономный', color: '#4CAF50' };
    if (avgCoinsPerTool <= 4) return { level: 'Умеренный', color: '#FF9800' };
    return { level: 'Интенсивный', color: '#F44336' };
  };
  
  const efficiencyLevel = getEfficiencyLevel();

  if (!user) {
    return (
      <div className="dashboard-error">
        Для просмотра статистики необходимо войти в систему
      </div>
    );
  }

  return (
    <div className="user-dashboard">
      {/* Быстрая статистика */}
      <div className="dashboard-quick-stats">
        <h2>⚡ Быстрая статистика</h2>
        <div className="dashboard-quick-stats-grid">
          
          {/* Активность пользователя */}
          <div className="dashboard-quick-stat">
            <div className="stat-icon">📊</div>
            <div className="stat-content">
              <span className="dashboard-quick-stat-label">Активность в день</span>
              <span className="dashboard-quick-stat-value">{avgToolsPerDay} инструментов</span>
              <div className="stat-subtext">
                {avgToolsPerDay < 1 ? 'Попробуйте больше инструментов' :
                 avgToolsPerDay < 3 ? 'Хорошая активность' :
                 avgToolsPerDay < 5 ? 'Высокая активность' : 'Супер активный пользователь!'}
              </div>
            </div>
          </div>

          {/* Эффективность использования */}
          <div className="dashboard-quick-stat">
            <div className="stat-icon">💰</div>
            <div className="stat-content">
              <span className="dashboard-quick-stat-label">Эффективность</span>
              <span className="dashboard-quick-stat-value" style={{ color: efficiencyLevel.color }}>
                {efficiencyLevel.level}
              </span>
              <div className="stat-subtext">{avgCoinsPerTool} коинов на инструмент</div>
            </div>
          </div>

          {/* Уровень исследования с прогрессом */}
          <div className="dashboard-quick-stat">
            <div className="stat-icon">🎯</div>
            <div className="stat-content">
              <span className="dashboard-quick-stat-label">Уровень исследования</span>
              <span className="dashboard-quick-stat-value" style={{ color: userLevel.color }}>
                {userLevel.level}
              </span>
              <div className="stat-progress">
                <div className="progress-bar">
                  <div 
                    className="progress-fill" 
                    style={{ 
                      width: `${userLevel.progress}%`,
                      backgroundColor: userLevel.color 
                    }}
                  ></div>
                </div>
                <div className="stat-subtext">{toolsExplored} из {totalTools} инструментов ({explorationPercent}%)</div>
              </div>
            </div>
          </div>

          {/* Общая статистика */}
          <div className="dashboard-quick-stat">
            <div className="stat-icon">📈</div>
            <div className="stat-content">
              <span className="dashboard-quick-stat-label">На платформе</span>
              <span className="dashboard-quick-stat-value">{userStats.daysOnPlatform} дней</span>
              <div className="stat-subtext">
                Всего использований: {userStats.totalToolUsage} • Потрачено коинов: {userStats.tokensUsed}
              </div>
            </div>
          </div>

          {/* Достижение дня */}
          <div className="dashboard-quick-stat achievement">
            <div className="stat-icon">🏆</div>
            <div className="stat-content">
              <span className="dashboard-quick-stat-label">Достижение дня</span>
              <span className="dashboard-quick-stat-value">
                {userStats.uniqueToolsUsed >= 31 ? 'Мастер всех инструментов!' :
                 userStats.totalToolUsage >= 100 ? 'Активный исследователь!' :
                 userStats.daysOnPlatform >= 30 ? 'Верный пользователь!' :
                 avgToolsPerDay >= 5 ? 'Продуктивный день!' :
                 userStats.uniqueToolsUsed >= 10 ? 'Любознательный!' : 'Продолжайте исследовать!'}
              </span>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
};

export default UserQuickStats;