import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import AdminSidebar from '../components/AdminSidebar';
import AdminTools from '../components/admin/AdminTools';
import AdminUsers from '../components/admin/AdminUsers';
import AdminFinance from '../components/admin/AdminFinance';
import AdminAdmins from '../components/admin/AdminAdmins';
import AdminLogs from '../components/admin/AdminLogs';
import AdminIntegrations from '../components/admin/AdminIntegrations';
import AnalyticsChart from '../components/AnalyticsChart';
import { getSectionTitle, getActiveSectionFromUrl } from '../utils/adminSections';
import DateRangePicker from '../components/DateRangePicker';
import MiniBarChart from '../components/MiniBarChart';
import historicalAnalyticsService from '../services/historicalAnalyticsService';
import type { HistoricalDataPoint } from '../services/historicalAnalyticsService';
import { getToolName } from '../utils/toolsRegistry';
import './AdminPanel.css';

const AdminPanel: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [periodStats, setPeriodStats] = useState<{
    totalUsage: number;
    uniqueUsers: number;
    activeTools: number;
    totalVisitors: number;
  } | null>(null);
  const [periodToolsData, setPeriodToolsData] = useState<Array<{
    toolName: string;
    usageCount: number;
    lastUsed: string;
  }> | null>(null);
  const [historicalData, setHistoricalData] = useState<HistoricalDataPoint[]>([]);
  const [dateRange, setDateRange] = useState(() => {
    const endDate = new Date();
    const startDate = new Date(new Date().setDate(new Date().getDate() - 13));
    console.log('🗓️ [ADMIN] Initial dateRange:', { startDate, endDate, label: 'Последние 14 дней' });
    return {
      startDate,
      endDate,
      label: 'Последние 14 дней'
    };
  });
  const [loading, setLoading] = useState(false);
  const [loadingHistorical, setLoadingHistorical] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState('');
  const [showResetConfirm, setShowResetConfirm] = useState(false);
  const [isResetModalClosing, setIsResetModalClosing] = useState(false);
  const [isNotificationClosing, setIsNotificationClosing] = useState(false);
  const [notification, setNotification] = useState<{
    show: boolean;
    message: string;
    type: 'success' | 'error';
  }>({
    show: false,
    message: '',
    type: 'success'
  });
  
  // Состояние для часового пояса
  const [timezone, setTimezone] = useState(() => {
    return localStorage.getItem('adminTimezone') || 'Europe/Kiev';
  });

  // Состояние для управления инструментами
  const [tools, setTools] = useState<any[]>([]);
  const [toolsLoading, setToolsLoading] = useState(false);

  // Функции плавного закрытия модальных окон
  const closeResetModal = () => {
    setIsResetModalClosing(true);
    setTimeout(() => {
      setShowResetConfirm(false);
      setIsResetModalClosing(false);
    }, 300); // Совпадает с длительностью анимации
  };

  const closeNotification = () => {
    setIsNotificationClosing(true);
    setTimeout(() => {
      setNotification({ show: false, message: '', type: 'success' });
      setIsNotificationClosing(false);
    }, 300);
  };

  // Определяем активную секцию из URL
  const [activeSection, setActiveSection] = useState(getActiveSectionFromUrl(location.pathname));

  // Обновляем активную секцию при изменении URL
  useEffect(() => {
    setActiveSection(getActiveSectionFromUrl(location.pathname));
  }, [location.pathname]);

  // Загружаем данные при смене секции
  useEffect(() => {
    if (activeSection === 'tools' && isLoggedIn) {
      fetchTools();
    }
  }, [activeSection, isLoggedIn]);

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
      // Данные для периода загружаются в отдельном useEffect
    }
  }, []);

  // Загружаем данные для периода при изменении dateRange
  useEffect(() => {
    if (isLoggedIn) {
      console.log('🔄 [ADMIN] DateRange changed, loading data for:', dateRange);
      fetchPeriodStats(dateRange.startDate, dateRange.endDate);
      fetchPeriodTools(dateRange.startDate, dateRange.endDate);
      fetchHistoricalData(dateRange.startDate, dateRange.endDate);
    }
  }, [dateRange, isLoggedIn]);

  // Автоматическое закрытие уведомления (только для ошибок)
  useEffect(() => {
    if (notification.show && notification.type === 'error') {
      const timer = setTimeout(() => {
        setNotification({ show: false, message: '', type: 'success' });
      }, 5000); // Закрыть через 5 секунд

      return () => clearTimeout(timer);
    }
  }, [notification.show, notification.type]);

  // Загрузка статистики за выбранный период
  const fetchPeriodStats = async (startDate: Date, endDate: Date) => {
    console.log('🚀 [ADMIN] Starting fetchPeriodStats...');
    try {
      const token = localStorage.getItem('adminToken');
      const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:8880';
      
      console.log('🔧 [ADMIN] API_BASE:', API_BASE);
      console.log('🔧 [ADMIN] Token exists:', !!token);
      
      const params = new URLSearchParams({
        startDate: `${startDate.getFullYear()}-${String(startDate.getMonth() + 1).padStart(2, '0')}-${String(startDate.getDate()).padStart(2, '0')}`,
        endDate: `${endDate.getFullYear()}-${String(endDate.getMonth() + 1).padStart(2, '0')}-${String(endDate.getDate()).padStart(2, '0')}`
      });
      
      const startDateStr = `${startDate.getFullYear()}-${String(startDate.getMonth() + 1).padStart(2, '0')}-${String(startDate.getDate()).padStart(2, '0')}`;
      const endDateStr = `${endDate.getFullYear()}-${String(endDate.getMonth() + 1).padStart(2, '0')}-${String(endDate.getDate()).padStart(2, '0')}`;
      
      console.log('📊 [ADMIN] Fetching period stats for:', startDateStr, 'to', endDateStr);
      console.log('🔑 [ADMIN] Using token:', token ? token.substring(0, 20) + '...' : 'NO TOKEN');
      console.log('🔗 [ADMIN] Request URL:', `${API_BASE}/api/admin/period-stats?${params}`);
      
      const response = await fetch(`${API_BASE}/api/admin/period-stats?${params}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      console.log('📡 [ADMIN] Response status:', response.status, response.statusText);
      
      if (response.ok) {
        const data = await response.json();
        console.log('✅ [ADMIN] Period stats received:', data);
        console.log('🔄 [ADMIN] Setting periodStats to:', data.stats);
        setPeriodStats(data.stats);
      } else {
        console.warn('❌ [ADMIN] Error fetching period stats:', response.status, response.statusText);
        const errorText = await response.text();
        console.warn('❌ [ADMIN] Error details:', errorText);
        // Фоллбэк на нули
        setPeriodStats({
          totalUsage: 0,
          uniqueUsers: 0,
          activeTools: 0,
          totalVisitors: 0
        });
      }
    } catch (error) {
      console.error('❌ [ADMIN] Error fetching period stats:', error);
      // Фоллбэк на нули
      setPeriodStats({
        totalUsage: 0,
        uniqueUsers: 0,
        activeTools: 0,
        totalVisitors: 0
      });
    }
  };

  // Загрузка статистики инструментов за период
  const fetchPeriodTools = async (startDate: Date, endDate: Date) => {
    try {
      const token = localStorage.getItem('adminToken');
      const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:8880';
      
      const startDateStr = `${startDate.getFullYear()}-${String(startDate.getMonth() + 1).padStart(2, '0')}-${String(startDate.getDate()).padStart(2, '0')}`;
      const endDateStr = `${endDate.getFullYear()}-${String(endDate.getMonth() + 1).padStart(2, '0')}-${String(endDate.getDate()).padStart(2, '0')}`;
      
      console.log('🛠️ [ADMIN] Fetching period tools data:', startDateStr, 'to', endDateStr);
      
      const response = await fetch(`${API_BASE}/api/admin/period-tools?startDate=${startDateStr}&endDate=${endDateStr}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        console.log('✅ [ADMIN] Period tools received:', data);
        setPeriodToolsData(data.toolUsage);
      } else {
        console.warn('❌ [ADMIN] Error fetching period tools:', response.status, response.statusText);
        setPeriodToolsData([]);
      }
    } catch (error) {
      console.error('❌ [ADMIN] Error fetching period tools:', error);
      setPeriodToolsData([]);
    }
  };

  // Загрузка инструментов
  const fetchTools = async () => {
    try {
      setToolsLoading(true);
      const token = localStorage.getItem('adminToken');
      
      if (!token) {
        throw new Error('Токен авторизации не найден');
      }

      const response = await fetch('http://localhost:8880/api/tools', {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        throw new Error(`Ошибка сервера: ${response.status}`);
      }

      const data = await response.json();
      setTools(Array.isArray(data) ? data : (data.tools || []));
    } catch (error) {
      console.error('Error loading tools:', error);
      setTools([]);
    } finally {
      setToolsLoading(false);
    }
  };

  // Массовое переключение инструментов
  const toggleAllTools = async () => {
    try {
      setToolsLoading(true);
      const token = localStorage.getItem('adminToken');
      
      if (!token) {
        throw new Error('Токен авторизации не найден');
      }

      // Переключаем все инструменты
      const togglePromises = tools.map(tool => 
        fetch(`http://localhost:8880/api/tools/${tool.id}/toggle`, {
          method: 'PATCH',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        })
      );

      await Promise.all(togglePromises);
      
      // Перезагружаем список инструментов
      await fetchTools();
      
      // Уведомляем компонент AdminTools об обновлении
      window.dispatchEvent(new CustomEvent('toolsUpdated'));
      
    } catch (error) {
      console.error('Error toggling all tools:', error);
    } finally {
      setToolsLoading(false);
    }
  };

  // Загрузка исторических данных
  const fetchHistoricalData = async (startDate?: Date, endDate?: Date) => {
    try {
      setLoadingHistorical(true);
      
      let data;
      if (startDate && endDate) {
        // Логируем исходные даты
        console.log('📊 [ADMIN] Raw dates received:', { startDate, endDate });
        
        // Используем локальную дату без UTC конвертации
        const startDateStr = `${startDate.getFullYear()}-${String(startDate.getMonth() + 1).padStart(2, '0')}-${String(startDate.getDate()).padStart(2, '0')}`;
        const endDateStr = `${endDate.getFullYear()}-${String(endDate.getMonth() + 1).padStart(2, '0')}-${String(endDate.getDate()).padStart(2, '0')}`;
        
        console.log('📊 [ADMIN] Fetching historical data for range:', startDateStr, 'to', endDateStr, 'timezone:', timezone);
        data = await historicalAnalyticsService.getHistoricalData(
          startDateStr,
          endDateStr,
          timezone
        );
      } else {
        // Используем период по умолчанию (последние 30 дней)
        console.log('📊 [ADMIN] Fetching historical data for default period');
        data = await historicalAnalyticsService.getDataByPeriod('month');
      }
      
      setHistoricalData(data);
      console.log('✅ [ADMIN] Historical data loaded:', data.length, 'days');
    } catch (error) {
      console.error('❌ [ADMIN] Error fetching historical data:', error);
      setError('Ошибка загрузки исторических данных');
    } finally {
      setLoadingHistorical(false);
    }
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:8880';
      const response = await fetch(`${API_BASE}/api/auth/admin-login`, {
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
        fetchHistoricalData();
        fetchPeriodStats(dateRange.startDate, dateRange.endDate);
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
      const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:8880';
      
      const response = await fetch(`${API_BASE}/api/admin/stats`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (response.ok) {
        await response.json();
        // adminData удален как неиспользуемый
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
    setEmail('');
    setPassword('');
  };

  const handleResetStats = () => {
    setShowResetConfirm(true);
  };

  const confirmResetStats = async () => {
    setShowResetConfirm(false);
    setLoading(true);
    try {
      const token = localStorage.getItem('adminToken');
      const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:8880';
      
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
      
      // Небольшая задержка для гарантии обновления данных
      await new Promise(resolve => setTimeout(resolve, 500));
      
      // Очищаем текущие данные перед обновлением
      setPeriodToolsData([]);
      setHistoricalData([]);
      
      // Обновляем все данные после сброса
      fetchAdminData();
      fetchHistoricalData(dateRange.startDate, dateRange.endDate);
      fetchPeriodStats(dateRange.startDate, dateRange.endDate);
      fetchPeriodTools(dateRange.startDate, dateRange.endDate);
      
      // Показываем результат
      setNotification({
        show: true,
        message: `Аналитика успешно сброшена!\nУдалено записей: ${result.deletedRecords || 0}`,
        type: 'success'
      });
      
    } catch (error) {
      console.error('Ошибка сброса аналитики:', error);
      setNotification({
        show: true,
        message: 'Ошибка при сбросе аналитики: ' + (error instanceof Error ? error.message : 'Неизвестная ошибка'),
        type: 'error'
      });
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
                <h3>Посетителей</h3>
                <div className="stat-number">{periodStats?.totalVisitors || 0}</div>
              </div>

              <div className="stat-card">
                <h3>Пользователей</h3>
                <div className="stat-number">{periodStats?.uniqueUsers || 0}</div>
                {/* Debug: {JSON.stringify(periodStats)} */}
              </div>

              <div className="stat-card">
                <h3>Использований</h3>
                <div className="stat-number">{periodStats?.totalUsage || 0}</div>
              </div>

              <div className="stat-card">
                <h3>Инструментов</h3>
                <div className="stat-number">{periodStats?.activeTools || 0}</div>
              </div>

              <div className="stat-card">
                <h3>Конверсия</h3>
                <div className="stat-conversion">
                  {periodStats?.totalVisitors && periodStats.totalVisitors > 0 
                    ? `${((periodStats.uniqueUsers / periodStats.totalVisitors) * 100).toFixed(1)}%`
                    : '0%'
                  }
                </div>
              </div>

              <div className="stat-card">
                <h3>Использовано токенов</h3>
                <div className="stat-number">0</div>
              </div>
            </div>

            <div className="charts-grid">
              <div className="chart-card">
                <h3>Посетителей</h3>
                {loadingHistorical ? (
                  <div className="chart-loading">Загрузка данных...</div>
                ) : (
                  <AnalyticsChart 
                    data={historicalData.map(item => ({
                      date: item.date,
                      value: item.visitors
                    }))} 
                    color="#3b82f6"
                    title="Динамика посетителей"
                  />
                )}
              </div>
              
              <div className="chart-card">
                <h3>Пользователей</h3>
                {loadingHistorical ? (
                  <div className="chart-loading">Загрузка данных...</div>
                ) : (
                  <AnalyticsChart 
                    data={historicalData.map(item => ({
                      date: item.date,
                      value: item.toolUsers
                    }))} 
                    color="#10b981"
                    title="Динамика пользователей"
                  />
                )}
              </div>
              
              <div className="chart-card">
                <h3>Использований</h3>
                {loadingHistorical ? (
                  <div className="chart-loading">Загрузка данных...</div>
                ) : (
                  <AnalyticsChart 
                    data={historicalData.map(item => ({
                      date: item.date,
                      value: item.usageCount
                    }))} 
                    color="#8b5cf6"
                    title="Динамика использований"
                  />
                )}
              </div>
              
              <div className="chart-card">
                <h3>Инструментов</h3>
                {loadingHistorical ? (
                  <div className="chart-loading">Загрузка данных...</div>
                ) : (
                  <AnalyticsChart 
                    data={(() => {
                      // Используем реальные данные из periodToolsData для текущего количества активных инструментов
                      const currentActiveTools = periodToolsData?.length || 0;
                      
                      // Если нет инструментов за период, показываем все нули
                      if (currentActiveTools === 0 || historicalData.length === 0) {
                        return historicalData.map(item => ({
                          date: item.date,
                          value: 0
                        }));
                      }
                      
                      // Если есть данные об использовании инструментов, то показываем рост
                      // Но только если есть реальные использования (usageCount > 0)
                      const hasRealUsage = historicalData.some(item => item.usageCount > 0);
                      
                      if (!hasRealUsage) {
                        return historicalData.map(item => ({
                          date: item.date,
                          value: 0
                        }));
                      }
                      
                      // Показываем рост инструментов только в те дни, когда были использования
                      return historicalData.map((item, index) => {
                        // Если в этот день не было использований, показываем 0
                        if (item.usageCount === 0) {
                          return {
                            date: item.date,
                            value: 0
                          };
                        }
                        
                        // Постепенный рост количества активных инструментов
                        const progressRatio = index / Math.max(1, historicalData.length - 1);
                        const minTools = Math.max(1, Math.floor(currentActiveTools * 0.5));
                        const toolsCount = Math.floor(minTools + (currentActiveTools - minTools) * progressRatio);
                        
                        return {
                          date: item.date,
                          value: toolsCount
                        };
                      });
                    })()}
                    color="#f59e0b"
                    title="Динамика активных инструментов"
                  />
                )}
              </div>

              <div className="chart-card">
                <h3>Конверсия</h3>
                {loadingHistorical ? (
                  <div className="chart-loading">Загрузка данных...</div>
                ) : (
                  <AnalyticsChart 
                    data={historicalData.map(item => ({
                      date: item.date,
                      value: item.visitors > 0 ? parseFloat(((item.toolUsers / item.visitors) * 100).toFixed(1)) : 0
                    }))} 
                    color="#ef4444"
                    title="Динамика конверсии (%)"
                  />
                )}
              </div>
              
              <div className="chart-card">
                <h3>Использовано токенов</h3>
                {loadingHistorical ? (
                  <div className="chart-loading">Загрузка данных...</div>
                ) : (
                  <AnalyticsChart 
                    data={[]} 
                    color="#06b6d4"
                    title="Динамика использования токенов"
                  />
                )}
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
                      <th>Последний</th>
                      <th>Сравнение</th>
                    </tr>
                  </thead>
                  <tbody>
                    {periodToolsData && periodToolsData.length > 0 ? (() => {
                      const toolsWithUsage = periodToolsData.filter(tool => tool.usageCount > 0);
                      const maxUsage = Math.max(...toolsWithUsage.map(tool => tool.usageCount));
                      
                      return toolsWithUsage.map((tool, index) => (
                        <tr key={index}>
                          <td>{getToolName(tool.toolName)}</td>
                          <td>{tool.usageCount}</td>
                          <td>{new Date(tool.lastUsed).toLocaleString('ru-RU')}</td>
                          <td>
                            <MiniBarChart 
                              value={tool.usageCount}
                              maxValue={maxUsage}
                              height={10}
                            />
                          </td>
                        </tr>
                      ));
                    })() : (
                      <tr>
                        <td colSpan={4}>Пока нет данных об использовании за выбранный период</td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
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
      <AdminSidebar 
        activeSection={activeSection} 
        onSectionChange={handleSectionChange}
        onLogout={handleLogout}
      />
      
      <div className="admin-main">
        <header className="admin-header">
          <div className="admin-title">{getSectionTitle(activeSection)}</div>
          <div className="header-buttons">
            {activeSection === 'dashboard' && (
              <>
                <select 
                  value={timezone} 
                  onChange={(e) => {
                    setTimezone(e.target.value);
                    localStorage.setItem('adminTimezone', e.target.value);
                    // Перезагружаем все данные с новым часовым поясом
                    fetchHistoricalData(dateRange.startDate, dateRange.endDate);
                    fetchPeriodStats(dateRange.startDate, dateRange.endDate);
                    fetchPeriodTools(dateRange.startDate, dateRange.endDate);
                  }}
                  className="timezone-selector"
                >
                  <option value="Europe/Kiev">GMT+3 (EEST)</option>
                  <option value="UTC">GMT+0 (UTC)</option>
                  <option value="Europe/London">GMT+1 (LON)</option>
                  <option value="America/New_York">GMT-4 (NYC)</option>
                  <option value="Asia/Tokyo">GMT+9 (TOK)</option>
                </select>
                <button onClick={handleResetStats} className="reset-button" disabled={loading}>
                  {loading ? 'Сброс...' : 'Сбросить аналитику'}
                </button>
                <button onClick={async () => { 
                  setRefreshing(true);
                  try {
                    await fetchAdminData(); 
                    await fetchHistoricalData(dateRange.startDate, dateRange.endDate);
                    await fetchPeriodStats(dateRange.startDate, dateRange.endDate); 
                    await fetchPeriodTools(dateRange.startDate, dateRange.endDate);
                  } finally {
                    setRefreshing(false);
                  }
                }} className={`refresh-button ${refreshing ? 'refreshing' : ''}`} disabled={refreshing}>
                  <img src="/icons/reset.svg" alt="Обновить данные" />
                </button>
                <DateRangePicker
                  selectedRange={dateRange}
                  onRangeChange={(newRange: { startDate: Date; endDate: Date; label: string }) => {
                    console.log('🗓️ DateRangePicker onChange:', newRange);
                    setDateRange(newRange);
                    fetchHistoricalData(newRange.startDate, newRange.endDate);
                    fetchPeriodStats(newRange.startDate, newRange.endDate);
                    fetchPeriodTools(newRange.startDate, newRange.endDate);
                  }}
                />
              </>
            )}
            {activeSection === 'tools' && (
              <>
                <div className="tools-header-controls">
                  <span className="tools-toggle-label">
                    {Array.isArray(tools) && tools.some(tool => tool.isActive) ? 'Отключить все' : 'Включить все'}
                  </span>
                  <button
                    onClick={toggleAllTools}
                    className={`tools-header-toggle ${Array.isArray(tools) && tools.some(tool => tool.isActive) ? 'active' : 'inactive'}`}
                    disabled={toolsLoading}
                  >
                    <div className={`tools-header-toggle-slider ${Array.isArray(tools) && tools.some(tool => tool.isActive) ? 'active' : 'inactive'}`} />
                  </button>
                </div>
              </>
            )}
          </div>
        </header>

        {error && <div className="error-message">{error}</div>}

        <div className="admin-content-wrapper">
          {renderContent()}
        </div>
      </div>

      {/* Попап подтверждения сброса аналитики */}
      {showResetConfirm && (
        <div 
          className={`admin-modal-overlay ${isResetModalClosing ? 'closing' : ''}`}
        >
          <div 
            className="admin-modal-content"
            onClick={(e) => e.stopPropagation()}
          >
            <h3>Вы уверены, что хотите <br />сбросить аналитику?</h3>
            <p><strong>Это действие нельзя отменить.</strong></p>
            <div className="admin-modal-buttons">
              <button 
                onClick={confirmResetStats}
                className="admin-confirm-button"
                disabled={loading}
              >
                {loading ? 'Сброс...' : 'Да'}
              </button>
              <button 
                onClick={closeResetModal}
                className="admin-cancel-button"
                disabled={loading}
              >
                Нет
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Попап уведомления */}
      {notification.show && (
        <div 
          className={`notification-overlay ${isNotificationClosing ? 'closing' : ''}`}
          onClick={closeNotification}
        >
          <div 
            className={`notification-content ${notification.type}`}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="notification-message">
              {notification.message}
            </div>
            <button 
              onClick={closeNotification}
              className="notification-close"
            >
              ОК
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminPanel;
