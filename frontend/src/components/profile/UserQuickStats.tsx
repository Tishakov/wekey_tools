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
        const response = await fetch('http://localhost:8880/api/auth/user-stats', {
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
          <div className="dashboard-quick-stat">
            <span className="dashboard-quick-stat-label">Среднее использование в день:</span>
            <span className="dashboard-quick-stat-value">
              {userStats.daysOnPlatform > 0 
                ? Math.round(userStats.totalToolUsage / userStats.daysOnPlatform * 10) / 10
                : 0
              } инструментов
            </span>
          </div>
          <div className="dashboard-quick-stat">
            <span className="dashboard-quick-stat-label">Среднее коинов на инструмент:</span>
            <span className="dashboard-quick-stat-value">
              {userStats.totalToolUsage > 0 
                ? Math.round(userStats.tokensUsed / userStats.totalToolUsage * 10) / 10
                : 0
              } коинов
            </span>
          </div>
          <div className="dashboard-quick-stat">
            <span className="dashboard-quick-stat-label">Уровень исследования:</span>
            <span className="dashboard-quick-stat-value">
              {userStats.uniqueToolsUsed < 5 ? 'Новичок' :
               userStats.uniqueToolsUsed < 15 ? 'Исследователь' :
               userStats.uniqueToolsUsed < 25 ? 'Эксперт' :
               userStats.uniqueToolsUsed === 31 ? 'Мастер' : 'Профи'}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default UserQuickStats;