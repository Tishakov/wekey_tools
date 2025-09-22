import React, { useState, useEffect } from 'react';
import './AdminUsers.css';

interface User {
  id: number;
  firstName: string;
  lastName: string;
  email: string;
  role: 'user' | 'admin' | 'premium';
  status: 'active' | 'inactive' | 'banned';
  avatar?: string | null;
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
  
  // Состояние для сортировки
  const [sortField, setSortField] = useState<string | null>(null);
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');
  
  // Состояние для фильтрации
  const [filters, setFilters] = useState({
    roles: [] as string[],
    statuses: [] as string[]
  });

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

  // Функция для обработки сортировки
  const handleSort = (field: string) => {
    if (sortField === field) {
      // Если кликнули по тому же полю, меняем направление
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      // Если новое поле, устанавливаем по возрастанию
      setSortField(field);
      setSortDirection('asc');
    }
  };

  // Функция для сортировки пользователей
  const sortUsers = (usersToSort: User[]) => {
    if (!sortField) return usersToSort;

    return [...usersToSort].sort((a, b) => {
      let aValue: any;
      let bValue: any;

      switch (sortField) {
        case 'name':
          aValue = `${a.firstName || ''} ${a.lastName || ''}`.trim().toLowerCase();
          bValue = `${b.firstName || ''} ${b.lastName || ''}`.trim().toLowerCase();
          break;
        case 'email':
          aValue = a.email.toLowerCase();
          bValue = b.email.toLowerCase();
          break;
        case 'createdAt':
          aValue = new Date(a.createdAt);
          bValue = new Date(b.createdAt);
          break;
        case 'lastLoginAt':
          aValue = a.lastLoginAt ? new Date(a.lastLoginAt) : new Date(0);
          bValue = b.lastLoginAt ? new Date(b.lastLoginAt) : new Date(0);
          break;
        case 'loginCount':
          aValue = a.loginCount;
          bValue = b.loginCount;
          break;
        case 'totalUsage':
          aValue = a.toolStats.totalUsage;
          bValue = b.toolStats.totalUsage;
          break;
        case 'uniqueTools':
          aValue = a.toolStats.uniqueTools;
          bValue = b.toolStats.uniqueTools;
          break;
        default:
          return 0;
      }

      if (aValue < bValue) return sortDirection === 'asc' ? -1 : 1;
      if (aValue > bValue) return sortDirection === 'asc' ? 1 : -1;
      return 0;
    });
  };

  // Функция для фильтрации пользователей
  const filterUsers = (usersToFilter: User[]) => {
    return usersToFilter.filter(user => {
      // Фильтр по ролям
      if (filters.roles.length > 0 && !filters.roles.includes(user.role)) {
        return false;
      }
      
      // Фильтр по статусам
      if (filters.statuses.length > 0 && !filters.statuses.includes(user.status)) {
        return false;
      }
      
      // Фильтр по поисковому запросу
      if (searchTerm) {
        const searchLower = searchTerm.toLowerCase();
        const fullName = `${user.firstName || ''} ${user.lastName || ''}`.toLowerCase();
        const email = user.email.toLowerCase();
        
        if (!fullName.includes(searchLower) && !email.includes(searchLower)) {
          return false;
        }
      }
      
      return true;
    });
  };

  // Функция для обработки изменения фильтров
  const handleFilterChange = (type: 'roles' | 'statuses', value: string, checked: boolean) => {
    setFilters(prev => ({
      ...prev,
      [type]: checked 
        ? [...prev[type], value]
        : prev[type].filter(item => item !== value)
    }));
  };

  // Получаем отфильтрованных и отсортированных пользователей
  const processedUsers = sortUsers(filterUsers(users));

  const getInitials = (firstName: string, lastName: string) => {
    const first = firstName ? firstName.charAt(0).toUpperCase() : '';
    const last = lastName ? lastName.charAt(0).toUpperCase() : '';
    return first + last || '?';
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

      <div className="admin-users-filters">
        <div className="filter-section">
          <span className="filter-label">Роли:</span>
          <div className="filter-tags">
            {[
              { value: 'user', label: 'Пользователь' },
              { value: 'premium', label: 'Премиум' },
              { value: 'admin', label: 'Админ' }
            ].map(role => (
              <button
                key={role.value}
                className={`filter-tag ${filters.roles.includes(role.value) ? 'active' : ''}`}
                data-filter={role.value}
                onClick={() => handleFilterChange('roles', role.value, !filters.roles.includes(role.value))}
              >
                {role.label}
              </button>
            ))}
          </div>
        </div>
        
        <div className="filter-section">
          <span className="filter-label">Статусы:</span>
          <div className="filter-tags">
            {[
              { value: 'active', label: 'Активен' },
              { value: 'inactive', label: 'Неактивен' },
              { value: 'banned', label: 'Заблокирован' }
            ].map(status => (
              <button
                key={status.value}
                className={`filter-tag ${filters.statuses.includes(status.value) ? 'active' : ''}`}
                data-filter={status.value}
                onClick={() => handleFilterChange('statuses', status.value, !filters.statuses.includes(status.value))}
              >
                {status.label}
              </button>
            ))}
          </div>
        </div>
        
        <button 
          className={`clear-filters-btn ${(filters.roles.length === 0 && filters.statuses.length === 0) ? 'disabled' : ''}`}
          onClick={() => setFilters({ roles: [], statuses: [] })}
          disabled={filters.roles.length === 0 && filters.statuses.length === 0}
        >
          ✕ Очистить
        </button>
      </div>

      <div className="admin-users-table-container">
        <table className="admin-users-table">
          <thead>
            <tr>
              <th onClick={() => handleSort('name')} className="sortable">
                Пользователь
                {sortField === 'name' && (
                  <span className="sort-indicator">
                    {sortDirection === 'asc' ? ' ↑' : ' ↓'}
                  </span>
                )}
              </th>
              <th onClick={() => handleSort('createdAt')} className="sortable">
                Дата регистрации
                {sortField === 'createdAt' && (
                  <span className="sort-indicator">
                    {sortDirection === 'asc' ? ' ↑' : ' ↓'}
                  </span>
                )}
              </th>
              <th onClick={() => handleSort('lastLoginAt')} className="sortable">
                Последний сеанс
                {sortField === 'lastLoginAt' && (
                  <span className="sort-indicator">
                    {sortDirection === 'asc' ? ' ↑' : ' ↓'}
                  </span>
                )}
              </th>
              <th onClick={() => handleSort('loginCount')} className="sortable">
                Входов
                {sortField === 'loginCount' && (
                  <span className="sort-indicator">
                    {sortDirection === 'asc' ? ' ↑' : ' ↓'}
                  </span>
                )}
              </th>
              <th onClick={() => handleSort('totalUsage')} className="sortable">
                Использований
                {sortField === 'totalUsage' && (
                  <span className="sort-indicator">
                    {sortDirection === 'asc' ? ' ↑' : ' ↓'}
                  </span>
                )}
              </th>
              <th onClick={() => handleSort('uniqueTools')} className="sortable">
                Инструментов
                {sortField === 'uniqueTools' && (
                  <span className="sort-indicator">
                    {sortDirection === 'asc' ? ' ↑' : ' ↓'}
                  </span>
                )}
              </th>
              <th>Действия</th>
            </tr>
          </thead>
          <tbody>
            {processedUsers.length === 0 ? (
              <tr>
                <td colSpan={7} className="admin-users-empty">
                  {users.length === 0 ? 'Пользователи не найдены' : 'Нет пользователей, соответствующих фильтрам'}
                </td>
              </tr>
            ) : (
              processedUsers.map((user) => (
                <tr key={user.id}>
                  <td>
                    <div className="user-info">
                      <div className="user-avatar">
                        {user.avatar ? (
                          <img 
                            src={user.avatar.startsWith('http') ? user.avatar : `http://localhost:8880${user.avatar}`} 
                            alt="User avatar" 
                            style={{
                              width: '100%',
                              height: '100%',
                              borderRadius: '50%',
                              objectFit: 'cover'
                            }}
                          />
                        ) : (
                          getInitials(user.firstName, user.lastName)
                        )}
                      </div>
                      <div className="user-details">
                        <span className={`user-role-badge ${user.role}`}>
                          {getRoleLabel(user.role)}
                        </span>
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
                    <div className="user-date">
                      <div className="user-date-main">{formatDateTime(user.createdAt)}</div>
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
                    </div>
                  </td>
                  <td>
                    <div className="user-stats">
                      <div className="user-stats-number">{user.toolStats.uniqueTools}</div>
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