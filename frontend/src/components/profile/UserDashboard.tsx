import React, { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import './UserDashboard.css';

interface UserStats {
  totalToolUsage: number;
  uniqueToolsUsed: number;
  daysOnPlatform: number;
  tokensUsed: number;
}

interface UserDashboardProps {
  column?: 'left' | 'right';
}

const UserDashboard: React.FC<UserDashboardProps> = ({ column = 'left' }) => {
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
    return (
      <div className="dashboard-error">
        Для просмотра дашборда необходимо войти в систему
      </div>
    );
  }

  // Левая колонка - основная статистика и прогресс
  if (column === 'left') {
    return (
      <div className="user-dashboard">
        {/* Основная статистика */}
        <div className="dashboard-stats-section">
          <div className="dashboard-stats-grid">
            <div className="dashboard-stat-card">
              <div className="dashboard-stat-icon">🚀</div>
              <div className="dashboard-stat-info">
                <div className="dashboard-stat-number">{userStats.totalToolUsage}</div>
                <div className="dashboard-stat-label">Запусков инструментов</div>
              </div>
            </div>
            <div className="dashboard-stat-card">
              <div className="dashboard-stat-icon">🛠️</div>
              <div className="dashboard-stat-info">
                <div className="dashboard-stat-number">{userStats.uniqueToolsUsed}/31</div>
                <div className="dashboard-stat-label">Использовано инструментов</div>
              </div>
            </div>
            <div className="dashboard-stat-card">
              <div className="dashboard-stat-icon">
                <img src="/icons/coin_rocket_v1.svg" alt="Coins" width="40" height="40" />
              </div>
              <div className="dashboard-stat-info">
                <div className="dashboard-stat-number">{userStats.tokensUsed}</div>
                <div className="dashboard-stat-label">Потрачено коинов</div>
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

        {/* Прогресс использования инструментов */}
        <div className="dashboard-progress-section">
          <h2>📈 Прогресс изучения платформы</h2>
          <div className="dashboard-progress-grid">
            <div className="dashboard-progress-card">
              <div className="dashboard-progress-header">
                <h3>Исследование инструментов</h3>
                <span className="dashboard-progress-percent">
                  {Math.round((userStats.uniqueToolsUsed / 31) * 100)}%
                </span>
              </div>
              <div className="dashboard-progress-bar">
                <div 
                  className="dashboard-progress-fill"
                  style={{ width: `${(userStats.uniqueToolsUsed / 31) * 100}%` }}
                ></div>
              </div>
              <p>Попробовано {userStats.uniqueToolsUsed} из 31 инструмента</p>
            </div>
            
            <div className="dashboard-progress-card">
              <div className="dashboard-progress-header">
                <h3>Активность</h3>
                <span className="dashboard-progress-percent">
                  {userStats.totalToolUsage > 100 ? '100+' : userStats.totalToolUsage}
                </span>
              </div>
              <div className="dashboard-progress-bar">
                <div 
                  className="dashboard-progress-fill activity"
                  style={{ width: `${Math.min((userStats.totalToolUsage / 100) * 100, 100)}%` }}
                ></div>
              </div>
              <p>
                {userStats.totalToolUsage < 100 
                  ? `${100 - userStats.totalToolUsage} запусков до активного пользователя`
                  : 'Вы активный пользователь! 🎉'
                }
              </p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Правая колонка - достижения и быстрая статистика
  return (
    <div className="user-dashboard">
      {/* Награды и достижения */}
      <div className="dashboard-achievements-section">
        <h2>🏆 Награды и достижения</h2>
        <div className="dashboard-achievements-grid">
          <div className={`dashboard-achievement-card ${userStats.daysOnPlatform >= 1 ? 'unlocked' : 'locked'}`}>
            <div className="dashboard-achievement-icon">🥇</div>
            <div className="dashboard-achievement-info">
              <div className="dashboard-achievement-title">Первые шаги</div>
              <div className="dashboard-achievement-desc">Зарегистрировались на платформе</div>
              {userStats.daysOnPlatform >= 1 && <div className="dashboard-achievement-status">✅ Получено</div>}
            </div>
          </div>
          
          <div className={`dashboard-achievement-card ${userStats.uniqueToolsUsed >= 5 ? 'unlocked' : 'locked'}`}>
            <div className="dashboard-achievement-icon">⚡</div>
            <div className="dashboard-achievement-info">
              <div className="dashboard-achievement-title">Исследователь</div>
              <div className="dashboard-achievement-desc">Использовали 5+ инструментов</div>
              {userStats.uniqueToolsUsed >= 5 
                ? <div className="dashboard-achievement-status">✅ Получено</div>
                : <div className="dashboard-achievement-progress">{userStats.uniqueToolsUsed}/5</div>
              }
            </div>
          </div>
          
          <div className={`dashboard-achievement-card ${userStats.daysOnPlatform >= 30 ? 'unlocked' : 'locked'}`}>
            <div className="dashboard-achievement-icon">💎</div>
            <div className="dashboard-achievement-info">
              <div className="dashboard-achievement-title">Постоянный клиент</div>
              <div className="dashboard-achievement-desc">На платформе более 30 дней</div>
              {userStats.daysOnPlatform >= 30 
                ? <div className="dashboard-achievement-status">✅ Получено</div>
                : <div className="dashboard-achievement-progress">{userStats.daysOnPlatform}/30 дней</div>
              }
            </div>
          </div>
          
          <div className={`dashboard-achievement-card ${userStats.uniqueToolsUsed >= 15 ? 'unlocked' : 'locked'}`}>
            <div className="dashboard-achievement-icon">🎯</div>
            <div className="dashboard-achievement-info">
              <div className="dashboard-achievement-title">Эксперт платформы</div>
              <div className="dashboard-achievement-desc">Попробовали 15+ инструментов</div>
              {userStats.uniqueToolsUsed >= 15 
                ? <div className="dashboard-achievement-status">✅ Получено</div>
                : <div className="dashboard-achievement-progress">{userStats.uniqueToolsUsed}/15</div>
              }
            </div>
          </div>
          
          <div className={`dashboard-achievement-card ${userStats.totalToolUsage >= 50 ? 'unlocked' : 'locked'}`}>
            <div className="dashboard-achievement-icon">🔥</div>
            <div className="dashboard-achievement-info">
              <div className="dashboard-achievement-title">Активный пользователь</div>
              <div className="dashboard-achievement-desc">50+ запусков инструментов</div>
              {userStats.totalToolUsage >= 50 
                ? <div className="dashboard-achievement-status">✅ Получено</div>
                : <div className="dashboard-achievement-progress">{userStats.totalToolUsage}/50</div>
              }
            </div>
          </div>
          
          <div className={`dashboard-achievement-card ${userStats.uniqueToolsUsed >= 31 ? 'unlocked' : 'locked'}`}>
            <div className="dashboard-achievement-icon">👑</div>
            <div className="dashboard-achievement-info">
              <div className="dashboard-achievement-title">Мастер всех инструментов</div>
              <div className="dashboard-achievement-desc">Попробовали все инструменты</div>
              {userStats.uniqueToolsUsed >= 31 
                ? <div className="dashboard-achievement-status">✅ Получено</div>
                : <div className="dashboard-achievement-progress">{userStats.uniqueToolsUsed}/31</div>
              }
            </div>
          </div>
        </div>
      </div>

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

export default UserDashboard;