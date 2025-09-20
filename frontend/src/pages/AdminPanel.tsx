import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import AdminSidebar from '../components/AdminSidebar';
import AdminDashboard from '../components/admin/AdminDashboard';
import AdminTools from '../components/admin/AdminTools';
import AdminUsers from '../components/admin/AdminUsers';
import AdminFinance from '../components/admin/AdminFinance';
import AdminAdmins from '../components/admin/AdminAdmins';
import AdminLogs from '../components/admin/AdminLogs';
import AdminIntegrations from '../components/admin/AdminIntegrations';
import './AdminPanel.css';

interface AdminData {
  success: boolean;
  stats: {
    [displayName: string]: { 
      count: number; 
      lastUsed: string;
      originalKey?: string; // Опциональный оригинальный ключ
    };
  };
  totalUsage: number;
}

interface AnalyticsData {
  success: boolean;
  analytics: {
    total: {
      visitors: number;
      toolUsers: number;
      conversionRate: string;
    };
    today: {
      visitors: number;
      toolUsers: number;
      conversionRate: string;
    };
    events: number;
  };
}

const AdminPanel: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [adminData, setAdminData] = useState<AdminData | null>(null);
  const [analyticsData, setAnalyticsData] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Определяем активную секцию из URL
  const getActiveSectionFromUrl = () => {
    const path = location.pathname;
    if (path === '/admin' || path === '/admin/dashboard') return 'dashboard';
    if (path === '/admin/tools') return 'tools';
    if (path === '/admin/users') return 'users';
    if (path === '/admin/finance') return 'finance';
    if (path === '/admin/admins') return 'admins';
    if (path === '/admin/logs') return 'logs';
    if (path === '/admin/integrations') return 'integrations';
    return 'dashboard';
  };

  const [activeSection, setActiveSection] = useState(getActiveSectionFromUrl());

  // Обновляем активную секцию при изменении URL
  useEffect(() => {
    setActiveSection(getActiveSectionFromUrl());
  }, [location.pathname]);

  // Функция для смены секции с обновлением URL
  const handleSectionChange = (section: string) => {
    setActiveSection(section);
    navigate(`/admin/${section}`);
  };

  // Проверяем есть ли уже токен
  useEffect(() => {
    const token = localStorage.getItem('adminToken');
    if (token) {
      setIsLoggedIn(true);
      fetchAdminData();
      fetchAnalyticsData();
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

      if (response.ok && data.token) {
        localStorage.setItem('adminToken', data.token);
        setIsLoggedIn(true);
        fetchAdminData();
        fetchAnalyticsData();
      } else {
        setError('Неверные данные для входа');
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

  const fetchAnalyticsData = async () => {
    try {
      const token = localStorage.getItem('adminToken');
      const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:3001';
      
      console.log('📊 [ADMIN] Fetching analytics data...');
      
      const response = await fetch(`${API_BASE}/api/admin/analytics`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        console.log('📊 [ADMIN] Analytics data received:', data);
        setAnalyticsData(data);
      } else {
        console.warn('❌ [ADMIN] Error fetching analytics:', response.status, response.statusText);
      }
    } catch (error) {
      console.error('❌ [ADMIN] Error fetching analytics:', error);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('adminToken');
    setIsLoggedIn(false);
    setAdminData(null);
    setEmail('');
    setPassword('');
  };

  const handleResetStats = async () => {
    if (!confirm('Вы уверены, что хотите сбросить всю аналитику? Это действие нельзя отменить.')) {
      return;
    }

    setLoading(true);
    try {
      const token = localStorage.getItem('adminToken');
      const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:3001';
      
      const response = await fetch(`${API_BASE}/api/admin/reset-stats`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        throw new Error('Ошибка сброса аналитики');
      }

      const result = await response.json();
      
      // Обновляем данные после сброса
      fetchAdminData();
      
      // Показываем результат
      if (result.message === 'stats already empty') {
        alert('Статистика уже пуста!');
      } else {
        alert('Аналитика успешно сброшена!');
      }
      
    } catch (error) {
      console.error('Ошибка сброса аналитики:', error);
      alert('Ошибка при сбросе аналитики: ' + (error instanceof Error ? error.message : 'Неизвестная ошибка'));
    } finally {
      setLoading(false);
    }
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

  // Функция рендера контента в зависимости от активной секции
  const renderContent = () => {
    switch (activeSection) {
      case 'dashboard':
        return (
          <div className="dashboard-content">
            <div className="stats-grid">
              <div className="stat-card">
                <h3>Общая статистика</h3>
                <div className="stat-number">{adminData?.totalUsage || 0}</div>
                <div className="stat-label">Всего использований</div>
              </div>

              <div className="stat-card">
                <h3>Инструменты</h3>
                <div className="stat-number">{adminData?.stats ? Object.values(adminData.stats).filter(stat => stat.count > 0).length : 0}</div>
                <div className="stat-label">Использованных инструментов</div>
              </div>

              <div className="stat-card">
                <h3>Посетители</h3>
                <div className="stat-number">{analyticsData?.analytics?.total?.visitors || 0}</div>
                <div className="stat-label">Всего посетителей</div>
              </div>

              <div className="stat-card">
                <h3>Пользователи инструментов</h3>
                <div className="stat-number">{analyticsData?.analytics?.total?.toolUsers || 0}</div>
                <div className="stat-label">Использовали инструменты</div>
              </div>

              <div className="stat-card">
                <h3>Конверсия</h3>
                <div className="stat-number">{analyticsData?.analytics?.total?.conversionRate || '0'}%</div>
                <div className="stat-label">Посетители → Пользователи</div>
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
                    {adminData?.stats && Object.keys(adminData.stats).length > 0 ? (
                      Object.entries(adminData.stats)
                        .filter(([, data]) => data.count > 0)
                        .map(([displayName, data], index) => (
                        <tr key={index}>
                          <td>{displayName}</td>
                          <td>{data.count}</td>
                          <td>{new Date(data.lastUsed).toLocaleString('ru-RU')}</td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan={3}>Пока нет данных об использовании</td>
                      </tr>
                    )}
                    {adminData?.stats && Object.entries(adminData.stats).every(([, data]) => data.count === 0) && (
                      <tr>
                        <td colSpan={3}>Пока нет данных об использовании</td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            <div className="admin-actions">
              <button onClick={handleResetStats} className="reset-button" disabled={loading}>
                {loading ? 'Сброс...' : 'Сбросить аналитику'}
              </button>
              <button onClick={() => { fetchAdminData(); fetchAnalyticsData(); }} className="refresh-button">
                Обновить данные
              </button>
            </div>
          </div>
        );
      case 'tools':
        return <AdminTools />;
      case 'users':
        return <AdminUsers />;
      case 'finance':
        return <AdminFinance />;
      case 'admins':
        return <AdminAdmins />;
      case 'logs':
        return <AdminLogs />;
      case 'integrations':
        return <AdminIntegrations />;
      default:
        return (
          <div className="dashboard-content">
            <div className="loading">Загрузка данных...</div>
          </div>
        );
    }
  };

  return (
    <div className="admin-panel">
      <AdminSidebar activeSection={activeSection} onSectionChange={handleSectionChange} />
      
      <div className="admin-main">
        <header className="admin-header">
          <h1>Админ-панель Wekey Tools</h1>
          <div className="header-buttons">
            <button onClick={handleLogout} className="logout-button">
              Выйти
            </button>
          </div>
        </header>

        {error && <div className="error-message">{error}</div>}

        <div className="admin-content-wrapper">
          {renderContent()}
        </div>
      </div>
    </div>
  );
};

export default AdminPanel;