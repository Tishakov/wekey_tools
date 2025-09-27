import React, { useState, useEffect, useRef } from 'react';
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
  coinBalance: number;
  toolStats: {
    totalUsage: number;
    uniqueTools: number;
    lastToolUsage: string | null;
  };
}

interface CoinOperationReason {
  id: number;
  reason: string;
  type: 'add' | 'subtract' | 'both';
  sortOrder: number;
  isActive: boolean;
}

// Компонент для элемента причины с inline редактированием
interface ReasonItemProps {
  reason: CoinOperationReason;
  onSelect: (reason: string) => void;
  onEdit: (id: number, newText: string) => void;
  onDelete: (id: number) => void;
}

const ReasonItem: React.FC<ReasonItemProps> = ({ reason, onSelect, onEdit, onDelete }) => {
  const [isEditing, setIsEditing] = useState(false);
  const [editText, setEditText] = useState(reason.reason);

  const handleSave = () => {
    if (editText.trim() && editText !== reason.reason) {
      onEdit(reason.id, editText.trim());
    }
    setIsEditing(false);
  };

  const handleCancel = () => {
    setEditText(reason.reason);
    setIsEditing(false);
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSave();
    } else if (e.key === 'Escape') {
      handleCancel();
    }
  };

  return (
    <div className="reason-item">
      {isEditing ? (
        <div className="reason-edit-mode">
          <input
            type="text"
            value={editText}
            onChange={(e) => setEditText(e.target.value)}
            onKeyPress={handleKeyPress}
            className="reason-edit-input"
            autoFocus
          />
          <div className="reason-edit-actions">
            <button 
              onClick={handleSave}
              className="save-btn"
              disabled={!editText.trim()}
            >
              ✓
            </button>
            <button 
              onClick={handleCancel}
              className="cancel-btn"
            >
              ✗
            </button>
          </div>
        </div>
      ) : (
        <div className="reason-display-mode">
          <span 
            className="reason-text"
            onClick={() => onSelect(reason.reason)}
          >
            {reason.reason}
          </span>
          <div className="reason-actions">
            <button 
              onClick={() => setIsEditing(true)}
              className="edit-btn"
              title="Редактировать"
            >
              ✏️
            </button>
            <button 
              onClick={() => onDelete(reason.id)}
              className="delete-btn"
              title="Удалить"
            >
              🗑️
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

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
  
  // Состояние для удаления пользователя
  const [deleteModal, setDeleteModal] = useState<{
    show: boolean;
    user: User | null;
    loading: boolean;
  }>({
    show: false,
    user: null,
    loading: false
  });

  // Состояние для управления коинами
  const [coinModal, setCoinModal] = useState<{
    show: boolean;
    user: User | null;
    type: 'add' | 'subtract' | null;
    amount: string;
    reason: string;
    customReason: string;
    loading: boolean;
  }>({
    show: false,
    user: null,
    type: null,
    amount: '',
    reason: '',
    customReason: '',
    loading: false
  });

  // Состояние для анимации закрытия модального окна
  const [isClosing, setIsClosing] = useState(false);

  // Состояние для интерактивного dropdown причин
  const [showReasonsDropdown, setShowReasonsDropdown] = useState(false);
  const [isAddingNewReason, setIsAddingNewReason] = useState(false);
  const [newReasonText, setNewReasonText] = useState('');
  const [coinReasons, setCoinReasons] = useState<CoinOperationReason[]>([]);

  // Refs для обработки кликов
  const reasonsDropdownRef = useRef<HTMLDivElement>(null);
  const selectedReasonRef = useRef<HTMLDivElement>(null);


  
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

  // Обработка клика вне области dropdown
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (reasonsDropdownRef.current && !reasonsDropdownRef.current.contains(event.target as Node) &&
          selectedReasonRef.current && !selectedReasonRef.current.contains(event.target as Node)) {
        setShowReasonsDropdown(false);
      }
    };

    const handleResize = () => {
      if (showReasonsDropdown) {
        positionDropdown();
      }
    };

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        if (showReasonsDropdown) {
          setShowReasonsDropdown(false);
        } else if (coinModal.show) {
          closeCoinModal();
        }
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('keydown', handleKeyDown);
    window.addEventListener('resize', handleResize);
    window.addEventListener('scroll', handleResize);
    
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('resize', handleResize);
      window.removeEventListener('scroll', handleResize);
    };
  }, [showReasonsDropdown, coinModal.show]);

  const handlePageChange = (page: number) => {
    if (page >= 1 && page <= totalPages) {
      setCurrentPage(page);
      fetchUsers(page);
    }
  };

  const handleRefresh = () => {
    fetchUsers(currentPage);
  };

  // Функции для удаления пользователей
  const handleDeleteUser = (user: User) => {
    setDeleteModal({
      show: true,
      user,
      loading: false
    });
  };

  const confirmDeleteUser = async () => {
    if (!deleteModal.user) return;

    try {
      setDeleteModal(prev => ({ ...prev, loading: true }));
      
      const token = localStorage.getItem('adminToken');
      if (!token) {
        throw new Error('Токен авторизации не найден');
      }

      const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:8880';
      const response = await fetch(`${API_BASE}/api/admin/users/${deleteModal.user.id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || `Ошибка сервера: ${response.status}`);
      }

      const data = await response.json();
      
      if (data.success) {
        // Обновляем список пользователей
        setUsers(prev => prev.filter(u => u.id !== deleteModal.user!.id));
        setTotalUsers(prev => prev - 1);
        
        // Закрываем модальное окно
        setDeleteModal({
          show: false,
          user: null,
          loading: false
        });
        
        // Показываем успешное сообщение (можно добавить toast уведомление)
        console.log('✅ Пользователь успешно удален:', data.data.deletedUser.email);
      } else {
        throw new Error('Ошибка удаления пользователя');
      }
    } catch (err) {
      console.error('Error deleting user:', err);
      setError(err instanceof Error ? err.message : 'Неизвестная ошибка при удалении');
      
      // Сбрасываем состояние загрузки, но оставляем модальное окно открытым
      setDeleteModal(prev => ({ ...prev, loading: false }));
    }
  };

  const cancelDeleteUser = () => {
    setDeleteModal({
      show: false,
      user: null,
      loading: false
    });
  };

  // Функции для работы с коинами
  const handleCoinAction = (user: User, type: 'add' | 'subtract') => {
    setCoinModal({
      show: true,
      user,
      type,
      amount: '',
      reason: '',
      customReason: '',
      loading: false
    });
    
    // Загружаем список причин при открытии модального окна
    loadCoinReasons();
  };

  const handleCoinAmountChange = (value: string) => {
    // Разрешаем только цифры
    if (/^\d*$/.test(value)) {
      setCoinModal(prev => ({ ...prev, amount: value }));
    }
  };

  const confirmCoinAction = async () => {
    const finalReason = coinModal.reason === 'custom' ? coinModal.customReason : coinModal.reason;
    
    if (!coinModal.user || !coinModal.type || !coinModal.amount || !finalReason) return;

    try {
      setCoinModal(prev => ({ ...prev, loading: true }));
      
      const token = localStorage.getItem('adminToken');
      if (!token) {
        throw new Error('Токен авторизации не найден');
      }

      const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:8880';
      const response = await fetch(`${API_BASE}/api/admin/users/${coinModal.user.id}/coins`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          type: coinModal.type,
          amount: parseInt(coinModal.amount),
          reason: finalReason
        })
      });

      const data = await response.json();
      
      if (response.ok && data.success) {
        // Обновляем баланс пользователя в локальном состоянии
        setUsers(prev => prev.map(u => 
          u.id === coinModal.user!.id 
            ? { ...u, coinBalance: data.data.newBalance }
            : u
        ));
        
        // Закрываем модальное окно
        setCoinModal({
          show: false,
          user: null,
          type: null,
          amount: '',
          reason: '',
          customReason: '',
          loading: false
        });
        
        console.log('✅ Баланс коинов успешно обновлен:', data.data);
      } else {
        throw new Error(data.message || 'Ошибка обновления баланса коинов');
      }
    } catch (err) {
      console.error('Error updating coin balance:', err);
      setError(err instanceof Error ? err.message : 'Неизвестная ошибка при обновлении баланса');
      
      setCoinModal(prev => ({ ...prev, loading: false }));
    }
  };

  // Функции для работы с причинами операций
  const loadCoinReasons = async () => {
    try {
      const token = localStorage.getItem('adminToken');
      if (!token) {
        console.log('❌ No admin token found');
        return;
      }

      const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:8880';
      console.log('🔄 Loading coin reasons from:', `${API_BASE}/api/admin/coin-reasons`);
      
      // Загружаем все причины
      const response = await fetch(`${API_BASE}/api/admin/coin-reasons`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });

      if (response.ok) {
        const data = await response.json();
        console.log('✅ Loaded coin reasons:', data);
        setCoinReasons(data.data || []);
      } else {
        console.error('❌ Failed to load coin reasons:', response.status, response.statusText);
      }
    } catch (error) {
      console.error('❌ Error loading coin reasons:', error);
    }
  };



  // Фильтрация причин по типу операции
  const filteredReasons = coinReasons.filter(reason => 
    reason.type === coinModal.type || reason.type === 'both'
  );
  
  // Отладка
  console.log('🔍 Debug reasons:', {
    coinModal: coinModal.type,
    allReasons: coinReasons.length,
    filteredReasons: filteredReasons.length,
    filtered: filteredReasons
  });

  // Функция для позиционирования dropdown
  const positionDropdown = () => {
    if (selectedReasonRef.current && reasonsDropdownRef.current) {
      const rect = selectedReasonRef.current.getBoundingClientRect();
      const dropdown = reasonsDropdownRef.current;
      
      dropdown.style.position = 'fixed';
      dropdown.style.top = `${rect.bottom + 4}px`;
      dropdown.style.left = `${rect.left}px`;
      dropdown.style.width = `${rect.width}px`;
    }
  };

  // Обработчики для dropdown
  const handleReasonSelect = (reason: string) => {
    setCoinModal(prev => ({ ...prev, reason }));
    setShowReasonsDropdown(false);
  };

  const toggleDropdown = () => {
    setShowReasonsDropdown(!showReasonsDropdown);
    if (!showReasonsDropdown) {
      setTimeout(positionDropdown, 0);
    }
  };

  const closeCoinModal = () => {
    setIsClosing(true);
    setShowReasonsDropdown(false);
    
    setTimeout(() => {
      setCoinModal({
        show: false,
        user: null,
        type: null,
        amount: '',
        reason: '',
        customReason: '',
        loading: false
      });
      setIsClosing(false);
      setIsAddingNewReason(false);
      setNewReasonText('');
    }, 300); // Время должно совпадать с длительностью CSS анимации
  };

  // Обработчики для управления причинами
  const handleAddNewReason = async () => {
    if (!newReasonText.trim() || !coinModal.type) return;

    try {
      const token = localStorage.getItem('adminToken');
      const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:8880';
      
      const response = await fetch(`${API_BASE}/api/admin/coin-reasons`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          reason: newReasonText.trim(),
          type: coinModal.type,
          sortOrder: coinReasons.length + 1
        }),
      });

      if (response.ok) {
        await loadCoinReasons();
        setNewReasonText('');
        setIsAddingNewReason(false);
      }
    } catch (error) {
      console.error('Ошибка добавления причины:', error);
    }
  };

  const handleEditReason = async (id: number, newText: string) => {
    try {
      const token = localStorage.getItem('adminToken');
      const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:8880';
      
      const response = await fetch(`${API_BASE}/api/admin/coin-reasons/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          reason: newText
        }),
      });

      if (response.ok) {
        await loadCoinReasons();
      }
    } catch (error) {
      console.error('Ошибка редактирования причины:', error);
    }
  };

  const handleDeleteReason = async (id: number) => {
    if (!confirm('Удалить эту причину?')) return;

    try {
      const token = localStorage.getItem('adminToken');
      const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:8880';
      
      const response = await fetch(`${API_BASE}/api/admin/coin-reasons/${id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.ok) {
        await loadCoinReasons();
      }
    } catch (error) {
      console.error('Ошибка удаления причины:', error);
    }
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
              <th onClick={() => handleSort('coinBalance')} className="sortable">
                Баланс коинов
                {sortField === 'coinBalance' && (
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
                <td colSpan={8} className="admin-users-empty">
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
                    <div className="user-coin-balance">
                      <div className="coin-balance-display">
                        <img src="/icons/coin_rocket_v1.svg" alt="Коин" className="coin-icon" />
                        <span className="coin-amount">{user.coinBalance || 0}</span>
                      </div>
                      <div className="coin-actions">
                        <button 
                          className="coin-action-btn add-btn" 
                          title="Начислить коины"
                          onClick={() => handleCoinAction(user, 'add')}
                        >
                          +
                        </button>
                        <button 
                          className="coin-action-btn subtract-btn" 
                          title="Списать коины"
                          onClick={() => handleCoinAction(user, 'subtract')}
                        >
                          −
                        </button>
                      </div>
                    </div>
                  </td>
                  <td>
                    <div className="user-actions">
                      <button 
                        className="user-action-btn view-btn"
                        title="Детальная информация"
                      >
                        👁️
                      </button>
                      {user.role !== 'admin' && (
                        <button 
                          className="user-action-btn delete-btn"
                          onClick={() => handleDeleteUser(user)}
                          title="Удалить пользователя"
                        >
                          🗑️
                        </button>
                      )}
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

      {/* Модальное окно подтверждения удаления */}
      {deleteModal.show && deleteModal.user && (
        <div className="delete-modal-overlay">
          <div className="delete-modal-content">
            <div className="delete-modal-header">
              <h3>Удаление пользователя</h3>
            </div>
            
            <div className="delete-modal-body">
              <p>Вы точно уверены, что хотите удалить этого пользователя?</p>
              
              <div className="user-info-delete">
                <div className="user-avatar-delete">
                  {deleteModal.user.avatar ? (
                    <img 
                      src={deleteModal.user.avatar.startsWith('http') ? deleteModal.user.avatar : `http://localhost:8880${deleteModal.user.avatar}`} 
                      alt="User avatar" 
                    />
                  ) : (
                    getInitials(deleteModal.user.firstName, deleteModal.user.lastName)
                  )}
                </div>
                <div className="user-details-delete">
                  <div className="user-name-delete">
                    {deleteModal.user.firstName && deleteModal.user.lastName 
                      ? `${deleteModal.user.firstName} ${deleteModal.user.lastName}`
                      : deleteModal.user.firstName || deleteModal.user.lastName || 'Без имени'
                    }
                  </div>
                  <div className="user-email-delete">{deleteModal.user.email}</div>
                  <div className="user-role-delete">
                    {getRoleLabel(deleteModal.user.role)}
                  </div>
                </div>
              </div>
              
              <div className="delete-warning">
                <strong>⚠️ Это действие нельзя отменить!</strong>
                <p>Будут удалены все данные пользователя:</p>
                <ul>
                  <li>Профиль и настройки</li>
                  <li>История использования инструментов</li>
                  <li>Аналитические данные</li>
                </ul>
              </div>
            </div>
            
            <div className="delete-modal-footer">
              <button 
                onClick={cancelDeleteUser}
                className="delete-modal-btn cancel-btn"
                disabled={deleteModal.loading}
              >
                Отмена
              </button>
              <button 
                onClick={confirmDeleteUser}
                className="delete-modal-btn confirm-btn"
                disabled={deleteModal.loading}
              >
                {deleteModal.loading ? 'Удаление...' : 'Да, удалить'}
              </button>
            </div>
          </div>
        </div>
      )}

      {coinModal.show && coinModal.user && coinModal.type && (
        <div 
          className={`coin-modal-overlay ${isClosing ? 'closing' : ''}`}
          onClick={closeCoinModal}
        >
          <div 
            className={`coin-modal-content ${isClosing ? 'closing' : ''}`}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="coin-modal-header">
              <h3>
                {coinModal.type === 'add' ? 'Начислить коины' : 'Списать коины'}
              </h3>
            </div>
            
            <div className="coin-modal-body">
              <div className="user-info-coin">
                <div className="user-avatar-coin">
                  {coinModal.user.avatar ? (
                    <img 
                      src={coinModal.user.avatar.startsWith('http') ? coinModal.user.avatar : `http://localhost:8880${coinModal.user.avatar}`} 
                      alt="User avatar" 
                    />
                  ) : (
                    getInitials(coinModal.user.firstName, coinModal.user.lastName)
                  )}
                </div>
                <div className="user-details-coin">
                  <div className="user-name-coin">
                    {coinModal.user.firstName && coinModal.user.lastName 
                      ? `${coinModal.user.firstName} ${coinModal.user.lastName}`
                      : coinModal.user.firstName || coinModal.user.lastName || 'Без имени'
                    }
                  </div>
                  <div className="user-email-coin">{coinModal.user.email}</div>
                  <div className="current-balance">
                    Текущий баланс: 
                    <span className="balance-amount">
                      <img src="/icons/coin_rocket_v1.svg" alt="Коин" className="coin-icon-small" />
                      {coinModal.user.coinBalance || 0}
                    </span>
                  </div>
                </div>
              </div>
              
              <div className="coin-form">
                <div className="coin-form-field">
                  <label>Количество коинов:</label>
                  <input
                    type="text"
                    value={coinModal.amount}
                    onChange={(e) => handleCoinAmountChange(e.target.value)}
                    placeholder="Введите количество"
                    disabled={coinModal.loading}
                  />
                </div>
                
                <div className="coin-form-field">
                  <label>Причина операции:</label>
                  <div className="reason-selector">
                    <div className="reason-input-container">
                      <div 
                        className="selected-reason"
                        ref={selectedReasonRef}
                        onClick={toggleDropdown}
                      >
                        <span className={coinModal.reason ? 'selected-reason-text' : 'selected-reason-placeholder'}>
                          {coinModal.reason || 'Выберите причину операции...'}
                        </span>
                        <button 
                          type="button"
                          className="dropdown-toggle"
                        >
                          ▼
                        </button>
                      </div>
                      
                      {showReasonsDropdown && (
                        <div 
                          className="reasons-dropdown"
                          ref={reasonsDropdownRef}
                        >
                          {filteredReasons.map(reason => (
                            <ReasonItem
                              key={reason.id}
                              reason={reason}
                              onSelect={handleReasonSelect}
                              onEdit={(id, newText) => handleEditReason(id, newText)}
                              onDelete={handleDeleteReason}
                            />
                          ))}
                          
                          {isAddingNewReason ? (
                            <div className="reason-item adding">
                              <input
                                type="text"
                                value={newReasonText}
                                onChange={(e) => setNewReasonText(e.target.value)}
                                placeholder="Новая причина..."
                                className="new-reason-input"
                                onKeyPress={(e) => {
                                  if (e.key === 'Enter') {
                                    handleAddNewReason();
                                  }
                                }}
                                autoFocus
                              />
                              <div className="reason-actions">
                                <button 
                                  onClick={handleAddNewReason}
                                  className="save-btn"
                                  disabled={!newReasonText.trim()}
                                >
                                  ✓
                                </button>
                                <button 
                                  onClick={() => {
                                    setIsAddingNewReason(false);
                                    setNewReasonText('');
                                  }}
                                  className="cancel-btn"
                                >
                                  ✗
                                </button>
                              </div>
                            </div>
                          ) : (
                            <div 
                              className="reason-item add-new"
                              onClick={() => setIsAddingNewReason(true)}
                            >
                              <span className="add-icon">+</span>
                              Добавить новую причину
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </div>
            
            <div className="coin-modal-footer">
              <button 
                onClick={closeCoinModal}
                className="coin-modal-btn cancel-btn"
                disabled={coinModal.loading}
              >
                Отмена
              </button>
              <button 
                onClick={confirmCoinAction}
                className={`coin-modal-btn confirm-btn ${coinModal.type === 'add' ? 'add-btn' : 'subtract-btn'}`}
                disabled={coinModal.loading || !coinModal.amount || 
                  (!coinModal.reason || (coinModal.reason === 'custom' && !coinModal.customReason))}
              >
                {coinModal.loading ? 'Обработка...' : 
                  coinModal.type === 'add' ? 'Начислить' : 'Списать'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminUsers;