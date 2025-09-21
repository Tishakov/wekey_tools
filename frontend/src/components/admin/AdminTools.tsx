import React, { useState, useEffect } from 'react';
import './AdminTools.css';

interface Tool {
  id: number;
  toolId: string;
  name: string;
  description: string;
  icon: string;
  path: string;
  category: string;
  isActive: boolean;
  order: number;
  createdAt: string;
  updatedAt: string;
  usageCount?: number;
  lastUsed?: string | null;
}

interface ToolsStats {
  totalTools: number;
  activeTools: number;
  inactiveTools: number;
  categories: Array<{
    category: string;
    count: number;
    active: number;
  }>;
}

const AdminTools: React.FC = () => {
  const [tools, setTools] = useState<Tool[]>([]);
  const [stats, setStats] = useState<ToolsStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState<'all' | 'active' | 'inactive'>('all');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');

  const loadTools = async () => {
    try {
      console.log('Loading tools...');
      const token = localStorage.getItem('adminToken');
      console.log('Token found:', !!token);
      
      if (!token) {
        throw new Error('Токен авторизации не найден');
      }

      const response = await fetch('http://localhost:8880/api/tools', {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      console.log('Response status:', response.status);
      
      if (!response.ok) {
        const errorText = await response.text();
        console.error('Server error:', errorText);
        throw new Error(`Ошибка сервера: ${response.status} - ${errorText}`);
      }

      const data = await response.json();
      console.log('Tools data received:', data);
      setTools(Array.isArray(data) ? data : (data.tools || []));
      setError(null);
    } catch (err) {
      console.error('Error loading tools:', err);
      setError(err instanceof Error ? err.message : 'Неизвестная ошибка');
    }
  };

  const loadStats = async () => {
    try {
      console.log('Loading stats...');
      const token = localStorage.getItem('adminToken');
      
      if (!token) {
        throw new Error('Токен авторизации не найден');
      }

      const response = await fetch('http://localhost:8880/api/tools/stats', {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      console.log('Stats response status:', response.status);
      
      if (!response.ok) {
        const errorText = await response.text();
        console.error('Stats server error:', errorText);
        throw new Error(`Ошибка загрузки статистики: ${response.status}`);
      }

      const data = await response.json();
      console.log('Stats data received:', data);
      setStats(data.stats || data);
    } catch (err) {
      console.error('Error loading stats:', err);
      // Не показываем ошибку статистики как общую ошибку
    }
  };

  const toggleTool = async (toolId: number) => {
    try {
      console.log('Toggling tool:', toolId);
      const token = localStorage.getItem('adminToken');
      
      if (!token) {
        throw new Error('Токен авторизации не найден');
      }

      const response = await fetch(`http://localhost:8880/api/tools/${toolId}/toggle`, {
        method: 'PATCH',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      console.log('Toggle response status:', response.status);
      
      if (!response.ok) {
        const errorText = await response.text();
        console.error('Toggle server error:', errorText);
        throw new Error(`Ошибка изменения статуса: ${response.status}`);
      }

      const updatedTool = await response.json();
      console.log('Tool updated:', updatedTool);
      
      // Обновляем локальное состояние
      setTools(Array.isArray(tools) ? tools.map(tool => 
        tool.id === toolId 
          ? { ...tool, isActive: !tool.isActive }
          : tool
      ) : []);
      
      // Перезагружаем статистику
      await loadStats();
      
      // Перезагружаем статистику
      await loadStats();
      
    } catch (err) {
      console.error('Error toggling tool:', err);
      setError(err instanceof Error ? err.message : 'Ошибка изменения статуса инструмента');
    }
  };

  useEffect(() => {
    const initializeData = async () => {
      setLoading(true);
      // Загружаем данные
      await loadTools();
      await loadStats();
      setLoading(false);
    };

    initializeData();
    
    // Слушаем событие обновления инструментов
    const handleToolsUpdate = () => {
      console.log('Tools update event received');
      loadTools();
      loadStats();
    };
    
    window.addEventListener('toolsUpdated', handleToolsUpdate);
    
    return () => {
      window.removeEventListener('toolsUpdated', handleToolsUpdate);
    };
  }, []);

  // Фильтрация инструментов
  const filteredTools = Array.isArray(tools) ? tools.filter((tool: Tool) => {
    const statusMatch = 
      filter === 'all' || 
      (filter === 'active' && tool.isActive) ||
      (filter === 'inactive' && !tool.isActive);
    
    const categoryMatch = categoryFilter === 'all' || tool.category === categoryFilter;
    
    return statusMatch && categoryMatch;
  }).sort((a, b) => a.name.localeCompare(b.name)) : [];

  // Получение списка категорий
  const categories = Array.isArray(tools) ? Array.from(new Set(tools.map((tool: Tool) => tool.category))) : [];

  const getCategoryName = (category: string) => {
    const categoryNames: { [key: string]: string } = {
      'generators': 'Генераторы',
      'text-tools': 'Текстовые инструменты',
      'utilities': 'Утилиты',
      'converters': 'Конвертеры'
    };
    return categoryNames[category] || category;
  };

  if (loading) {
    return (
      <div className="admin-section">
        <div className="admin-content">
          <div className="tools-loading">
            Загрузка инструментов...
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="admin-section">
        <div className="admin-content">
          <div className="tools-error">
            Ошибка: {error}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="admin-section">
      <div className="admin-content">
        {/* Статистика */}
        {stats && (
          <div className="tools-stats">
            <div className="tools-stats-card">
              <h3 className="tools-stats-number">{stats.totalTools || 0}</h3>
              <p className="tools-stats-label">Всего инструментов</p>
            </div>
            
            <div className="tools-stats-card">
              <h3 className="tools-stats-number">{stats.activeTools || 0}</h3>
              <p className="tools-stats-label">Активных</p>
            </div>
            
            <div className="tools-stats-card">
              <h3 className={`tools-stats-number ${(stats.inactiveTools || 0) > 0 ? 'positive' : ''}`}>{stats.inactiveTools || 0}</h3>
              <p className="tools-stats-label">Отключенных</p>
            </div>
            
            <div className="tools-stats-card">
              <h3 className="tools-stats-number">{stats.categories?.length || 0}</h3>
              <p className="tools-stats-label">Категорий</p>
            </div>
          </div>
        )}

        {/* Фильтры */}
        <div className="tools-filters">
          <div>
            <label className="tools-filter-label">
              Статус:
            </label>
            <select 
              value={filter} 
              onChange={(e) => setFilter(e.target.value as any)}
              className="tools-filter-select"
            >
              <option value="all">Все ({Array.isArray(tools) ? tools.length : 0})</option>
              <option value="active">Активные ({Array.isArray(tools) ? tools.filter((t: Tool) => t.isActive).length : 0})</option>
              <option value="inactive">Отключенные ({Array.isArray(tools) ? tools.filter((t: Tool) => !t.isActive).length : 0})</option>
            </select>
          </div>

          <div>
            <label className="tools-filter-label">
              Категория:
            </label>
            <select 
              value={categoryFilter} 
              onChange={(e) => setCategoryFilter(e.target.value)}
              className="tools-filter-select"
            >
              <option value="all">Все категории</option>
              {categories.map((category: string) => (
                <option key={category} value={category}>
                  {getCategoryName(category)} ({Array.isArray(tools) ? tools.filter((t: Tool) => t.category === category).length : 0})
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Список инструментов */}
        <div className="tools-list">
          {filteredTools.length === 0 ? (
            <div className="tools-list-empty">
              <p>Инструменты не найдены</p>
            </div>
          ) : (
            filteredTools.map(tool => (
              <div key={tool.id} className="tools-item">
                <div className="tools-item-content">
                  <div className={`tools-item-icon ${tool.isActive ? 'active' : 'inactive'}`}>
                    {!tool.icon.includes('.svg') ? (
                      <span className="tools-item-icon-emoji">{tool.icon}</span>
                    ) : (
                      <img 
                        src={tool.icon} 
                        alt={tool.name} 
                        className="tools-item-icon-image"
                      />
                    )}
                  </div>
                  
                  <div className="tools-item-info">
                    <h3 className={`tools-item-title ${tool.isActive ? 'active' : 'inactive'}`}>
                      {tool.name}
                    </h3>
                    <p className={`tools-item-description ${tool.isActive ? 'active' : 'inactive'}`}>
                      {tool.description} • {getCategoryName(tool.category)}
                    </p>
                    <div className={`tools-item-stats ${tool.isActive ? 'active' : 'inactive'}`}>
                      Запусков: <span className="tools-item-stats-count">{tool.usageCount || 0}</span>
                      {tool.lastUsed && (
                        <span className="tools-item-stats-separator"> • </span>
                      )}
                      {tool.lastUsed && (
                        <span className="tools-item-stats-last">
                          Последний: {new Date(tool.lastUsed).toLocaleString('ru-RU')}
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                <div className="tools-item-controls">
                  <span className={`tools-item-status ${tool.isActive ? 'active' : 'inactive'}`}>
                    {tool.isActive ? 'Активен' : 'Отключен'}
                  </span>
                  
                  <button
                    onClick={() => toggleTool(tool.id)}
                    className={`tools-item-toggle ${tool.isActive ? 'active' : 'inactive'}`}
                  >
                    <div className={`tools-item-toggle-slider ${tool.isActive ? 'active' : 'inactive'}`} />
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};

export default AdminTools;