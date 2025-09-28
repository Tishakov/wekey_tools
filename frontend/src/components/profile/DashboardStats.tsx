import React, { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import './DashboardStats.css';

interface UserStats {
  totalToolUsage: number;
  uniqueToolsUsed: number;
  daysOnPlatform: number;
  tokensUsed: number;
}

const DashboardStats: React.FC = () => {
  const { user } = useAuth();
  const [userStats, setUserStats] = useState<UserStats>({
    totalToolUsage: 0,
    uniqueToolsUsed: 0,
    daysOnPlatform: 0,
    tokensUsed: 0
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
          if (result.success) {
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
    return null;
  }

  return (
    <div className="dashboard-stats-section">
      <div className="dashboard-stats-grid">
        <div className="dashboard-stat-card">
          <div className="dashboard-stat-icon">🚀</div>
          <div className="dashboard-stat-info">
            <div className="dashboard-stat-number">{userStats.totalToolUsage}</div>
            <div className="dashboard-stat-label">Количество запусков</div>
          </div>
        </div>
        <div className="dashboard-stat-card">
          <div className="dashboard-stat-icon">🛠️</div>
          <div className="dashboard-stat-info">
            <div className="dashboard-stat-number">{userStats.uniqueToolsUsed}/31</div>
            <div className="dashboard-stat-label">Инструментов запущено</div>
          </div>
        </div>
        <div className="dashboard-stat-card">
          <div className="dashboard-stat-icon">
            <img src="/icons/coin_rocket_v1.svg" alt="Coins" className="dashboard-coin-icon" />
          </div>
          <div className="dashboard-stat-info">
            <div className="dashboard-stat-number">{userStats.tokensUsed}</div>
            <div className="dashboard-stat-label">Коинов использовано</div>
          </div>
        </div>
        <div className="dashboard-stat-card">
          <div className="dashboard-stat-icon">📅</div>
          <div className="dashboard-stat-info">
            <div className="dashboard-stat-number">{userStats.daysOnPlatform}</div>
            <div className="dashboard-stat-label">Дней на платформе</div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DashboardStats;