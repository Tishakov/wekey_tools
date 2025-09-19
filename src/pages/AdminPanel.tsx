import React, { useState, useEffect } from 'react';
import './AdminPanel.css';

interface ToolStats {
  toolName: string;
  usageCount: number;
  lastUsed: string;
}

interface UserStats {
  totalUsers: number;
  activeToday: number;
  newThisWeek: number;
}

interface AdminData {
  stats: {
    toolUsage: ToolStats[];
    users: UserStats;
    totalUsage: number;
  };
}

const AdminPanel: React.FC = () => {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [adminData, setAdminData] = useState<AdminData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Проверяем есть ли уже токен
  useEffect(() => {
    const token = localStorage.getItem('adminToken');
    if (token) {
      setIsLoggedIn(true);
      fetchAdminData();
    }
  }, []);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:3001';
      const response = await fetch(`${API_BASE}/api/auth/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, password }),
      });

      const data = await response.json();

      if (response.ok && data.user.role === 'admin') {
        localStorage.setItem('adminToken', data.token);
        setIsLoggedIn(true);
        fetchAdminData();
      } else {
        setError('Неверные данные для входа или недостаточно прав');
      }
    } catch (err) {
      setError('Ошибка подключения к серверу');
      console.error('Login error:', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchAdminData = async () => {
    try {
      const token = localStorage.getItem('adminToken');
      const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:3001';
      
      const response = await fetch(`${API_BASE}/api/admin/stats`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        setAdminData(data);
      } else {
        setError('Ошибка загрузки данных');
      }
    } catch (err) {
      setError('Ошибка подключения к серверу');
      console.error('Fetch error:', err);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('adminToken');
    setIsLoggedIn(false);
    setAdminData(null);
    setEmail('');
    setPassword('');
  };

  if (!isLoggedIn) {
    return (
      <div className="admin-login">
        <div className="admin-login-container">
          <h1>Вход в админ-панель</h1>
          <form onSubmit={handleLogin} className="admin-login-form">
            <div className="form-group">
              <label htmlFor="email">Email:</label>
              <input
                type="email"
                id="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                placeholder="admin@wekey.tools"
              />
            </div>
            <div className="form-group">
              <label htmlFor="password">Пароль:</label>
              <input
                type="password"
                id="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                placeholder="Введите пароль"
              />
            </div>
            {error && <div className="error-message">{error}</div>}
            <button type="submit" disabled={loading} className="login-button">
              {loading ? 'Вход...' : 'Войти'}
            </button>
          </form>
          <div className="demo-credentials">
            <p><strong>Тестовые данные:</strong></p>
            <p>Email: admin@wekey.tools</p>
            <p>Пароль: admin123</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="admin-panel">
      <header className="admin-header">
        <h1>Админ-панель Wekey Tools</h1>
        <button onClick={handleLogout} className="logout-button">
          Выйти
        </button>
      </header>

      {error && <div className="error-message">{error}</div>}

      {adminData ? (
        <div className="admin-content">
          <div className="stats-grid">
            <div className="stat-card">
              <h3>Общая статистика</h3>
              <div className="stat-number">{adminData.stats.totalUsage}</div>
              <div className="stat-label">Всего использований</div>
            </div>

            <div className="stat-card">
              <h3>Пользователи</h3>
              <div className="stat-number">{adminData.stats.users.totalUsers}</div>
              <div className="stat-label">Всего пользователей</div>
              <div className="stat-sub">
                Активных сегодня: {adminData.stats.users.activeToday}
              </div>
              <div className="stat-sub">
                Новых за неделю: {adminData.stats.users.newThisWeek}
              </div>
            </div>
          </div>

          <div className="tools-usage">
            <h3>Использование инструментов</h3>
            <div className="tools-table">
              <table>
                <thead>
                  <tr>
                    <th>Инструмент</th>
                    <th>Использований</th>
                    <th>Последнее использование</th>
                  </tr>
                </thead>
                <tbody>
                  {adminData.stats.toolUsage.length > 0 ? (
                    adminData.stats.toolUsage.map((tool, index) => (
                      <tr key={index}>
                        <td>{tool.toolName}</td>
                        <td>{tool.usageCount}</td>
                        <td>{new Date(tool.lastUsed).toLocaleString('ru-RU')}</td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={3}>Пока нет данных об использовании</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>

          <div className="refresh-section">
            <button onClick={fetchAdminData} className="refresh-button">
              Обновить данные
            </button>
          </div>
        </div>
      ) : (
        <div className="loading">Загрузка данных...</div>
      )}
    </div>
  );
};

export default AdminPanel;