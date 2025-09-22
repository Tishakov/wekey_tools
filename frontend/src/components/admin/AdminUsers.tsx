import React, { useState, useEffect } from 'react';
import './AdminUsers.css';

interface User {
  id: number;
  firstName: string;
  lastName: string;
  email: string;
  role: 'user' | 'admin' | 'premium';
  status: 'active' | 'inactive' | 'banned';
  createdAt: string;
  lastLoginAt: string | null;
  loginCount: number;
  toolStats: {
    totalUsage: number;
    uniqueTools: number;
    lastToolUsage: string | null;
  };
}

interface UsersResponse {
  success: boolean;
  data: {
    users: User[];
    pagination: {
      total: number;
      page: number;
      pages: number;
    };
  };
}

const AdminUsers: React.FC = () => {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalUsers, setTotalUsers] = useState(0);
  const [searchTerm, setSearchTerm] = useState('');

  const fetchUsers = async (page: number = 1) => {
    try {
      setLoading(true);
      setError(null);
      
      const token = localStorage.getItem('adminToken');
      if (!token) {
        throw new Error('Токен авторизации не найден');
      }

      const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:8880';
      const response = await fetch(`${API_BASE}/api/admin/users?page=${page}&limit=20`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        throw new Error(`Ошибка сервера: ${response.status}`);
      }

      const data: UsersResponse = await response.json();
      
      if (data.success) {
        setUsers(data.data.users);
        setCurrentPage(data.data.pagination.page);
        setTotalPages(data.data.pagination.pages);
        setTotalUsers(data.data.pagination.total);
      } else {
        throw new Error('Ошибка получения данных');
      }
    } catch (err) {
      console.error('Error fetching users:', err);
      setError(err instanceof Error ? err.message : 'Неизвестная ошибка');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers(1);
  }, []);

  const handlePageChange = (page: number) => {
    if (page >= 1 && page <= totalPages) {
      setCurrentPage(page);
      fetchUsers(page);
    }
  };

  const handleRefresh = () => {
    fetchUsers(currentPage);
  };

  const getInitials = (firstName: string, lastName: string) => {
    const first = firstName ? firstName.charAt(0).toUpperCase() : '';
    const last = lastName ? lastName.charAt(0).toUpperCase() : '';
    return first + last || '?';
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('ru-RU', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const formatDateTime = (dateString: string | null) => {
    if (!dateString) return 'Никогда';
    const date = new Date(dateString);
    return date.toLocaleString('ru-RU', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getRoleLabel = (role: string) => {
    switch (role) {
      case 'admin': return 'Админ';
      case 'premium': return 'Премиум';
      case 'user': return 'Пользователь';
      default: return role;
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'active': return 'Активен';
      case 'inactive': return 'Неактивен';
      case 'banned': return 'Заблокирован';
      default: return status;
    }
  };

  // Подсчет статистики
  const activeUsers = users.filter(user => user.status === 'active').length;
  const premiumUsers = users.filter(user => user.role === 'premium').length;
  const usersWithToolUsage = users.filter(user => user.toolStats.totalUsage > 0).length;

  if (loading && users.length === 0) {
    return (
      <div className="admin-users">
        <div className="admin-users-loading">
          Загрузка пользователей...
        </div>
      </div>
    );
  }

  return (
    <div className="admin-users">
      <div className="admin-users-header">
        <div>
          <h1 className="admin-users-title">Пользователи</h1>
          <p className="admin-users-subtitle">Управление пользователями системы</p>
        </div>
        <div className="admin-users-controls">
          <input
            type="text"
            placeholder="Поиск пользователей..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="admin-users-search"
          />
          <button
            onClick={handleRefresh}
            disabled={loading}
            className="admin-users-refresh"
          >
            {loading ? 'Обновление...' : 'Обновить'}
          </button>
        </div>
      </div>

      {error && (
        <div className="admin-users-error">
          {error}
        </div>
      )}

      <div className="admin-users-stats">
        <div className="admin-users-stat-card">
          <div className="admin-users-stat-number">{totalUsers}</div>
          <div className="admin-users-stat-label">Всего пользователей</div>
        </div>
        <div className="admin-users-stat-card">
          <div className="admin-users-stat-number">{activeUsers}</div>
          <div className="admin-users-stat-label">Активных</div>
        </div>
        <div className="admin-users-stat-card">
          <div className="admin-users-stat-number">{premiumUsers}</div>
          <div className="admin-users-stat-label">Премиум</div>
        </div>
        <div className="admin-users-stat-card">
          <div className="admin-users-stat-number">{usersWithToolUsage}</div>
          <div className="admin-users-stat-label">Используют инструменты</div>
        </div>
      </div>

      <div className="admin-users-table-container">
        <table className="admin-users-table">
          <thead>
            <tr>
              <th>Пользователь</th>
              <th>Роль</th>
              <th>Статус</th>
              <th>Дата регистрации</th>
              <th>Последний сеанс</th>
              <th>Входов</th>
              <th>Использований</th>
              <th>Инструментов</th>
              <th>Действия</th>
            </tr>
          </thead>
          <tbody>
            {users.length === 0 ? (
              <tr>
                <td colSpan={9} className="admin-users-empty">
                  Пользователи не найдены
                </td>
              </tr>
            ) : (
              users.map((user) => (
                <tr key={user.id}>
                  <td>
                    <div className="user-info">
                      <div className="user-avatar">
                        {getInitials(user.firstName, user.lastName)}
                      </div>
                      <div className="user-details">
                        <div className="user-name">
                          {user.firstName && user.lastName 
                            ? `${user.firstName} ${user.lastName}`
                            : user.firstName || user.lastName || 'Без имени'
                          }
                        </div>
                        <div className="user-email">{user.email}</div>
                      </div>
                    </div>
                  </td>
                  <td>
                    <span className={`user-role ${user.role}`}>
                      {getRoleLabel(user.role)}
                    </span>
                  </td>
                  <td>
                    <span className={`user-status ${user.status}`}>
                      {getStatusLabel(user.status)}
                    </span>
                  </td>
                  <td>
                    <div className="user-date">
                      <div className="user-date-main">{formatDate(user.createdAt)}</div>
                    </div>
                  </td>
                  <td>
                    <div className="user-date">
                      <div className="user-date-main">{formatDateTime(user.lastLoginAt)}</div>
                    </div>
                  </td>
                  <td>
                    <div className="user-stats">
                      <div className="user-stats-number">{user.loginCount}</div>
                    </div>
                  </td>
                  <td>
                    <div className="user-stats">
                      <div className="user-stats-number">{user.toolStats.totalUsage}</div>
                      <div className="user-stats-label">всего</div>
                    </div>
                  </td>
                  <td>
                    <div className="user-stats">
                      <div className="user-stats-number">{user.toolStats.uniqueTools}</div>
                      <div className="user-stats-label">уникальных</div>
                    </div>
                  </td>
                  <td>
                    <div className="user-actions">
                      <button className="user-action-btn">
                        Детальнее
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {totalPages > 1 && (
        <div className="admin-users-pagination">
          <button
            onClick={() => handlePageChange(currentPage - 1)}
            disabled={currentPage === 1}
          >
            ← Назад
          </button>
          
          <div className="admin-users-pagination-info">
            Страница {currentPage} из {totalPages} (всего: {totalUsers})
          </div>
          
          <button
            onClick={() => handlePageChange(currentPage + 1)}
            disabled={currentPage === totalPages}
          >
            Вперед →
          </button>
        </div>
      )}
    </div>
  );
};

export default AdminUsers;