import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useNewsletters } from '../../hooks/useNewslettersAndNews';
import './AdminNewsletters.css';

const AdminNewsletters: React.FC = () => {
  const navigate = useNavigate();
  const { 
    newsletters, 
    loading, 
    fetchNewsletters
  } = useNewsletters();
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');

  // Загрузка списка рассылок при монтировании компонента
  useEffect(() => {
    fetchNewsletters();
  }, []); // Убираем fetchNewsletters из зависимостей

  // Фильтрация рассылок
  const filteredNewsletters = newsletters.filter((newsletter: any) => {
    const matchesSearch = newsletter.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         newsletter.subject.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'all' || newsletter.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const getStatusBadge = (status: string) => {
    const statusConfig = {
      draft: { text: 'Черновик', class: 'status-draft' },
      scheduled: { text: 'Запланировано', class: 'status-scheduled' },
      sending: { text: 'Отправляется', class: 'status-sending' },
      sent: { text: 'Отправлено', class: 'status-sent' },
      failed: { text: 'Ошибка', class: 'status-failed' }
    };
    
    const config = statusConfig[status as keyof typeof statusConfig] || { text: status, class: 'status-unknown' };
    return <span className={`status-badge ${config.class}`}>{config.text}</span>;
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString('ru-RU', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <div className="admin-newsletters-container">
      <div className="admin-newsletters-header">
        <div className="admin-section-title">
          <h1>📧 Рассылки</h1>
          <p>Управление email-рассылками для пользователей</p>
        </div>
        <button 
          className="create-newsletter-btn"
          onClick={() => navigate('/admin/newsletters/create')}
        >
          📝 Создать рассылку
        </button>
      </div>

      {/* Фильтры */}
      <div className="newsletters-filters">
        <div className="search-box">
          <input
            type="text"
            placeholder="Поиск по названию или теме..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="search-input"
          />
        </div>
        <div className="status-filter">
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="status-select"
          >
            <option value="all">Все статусы</option>
            <option value="draft">Черновики</option>
            <option value="scheduled">Запланированные</option>
            <option value="sending">Отправляются</option>
            <option value="sent">Отправленные</option>
            <option value="failed">С ошибками</option>
          </select>
        </div>
      </div>

      {/* Список рассылок */}
      <div className="newsletters-content">
        {loading ? (
          <div className="loading-state">
            <div className="loading-spinner"></div>
            <p>Загрузка рассылок...</p>
          </div>
        ) : filteredNewsletters.length === 0 ? (
          <div className="empty-state">
            <div className="empty-icon">📪</div>
            <h3>Рассылки не найдены</h3>
            <p>
              {searchTerm || statusFilter !== 'all' 
                ? 'Попробуйте изменить критерии поиска'
                : 'Создайте первую рассылку для ваших пользователей'
              }
            </p>
            {!searchTerm && statusFilter === 'all' && (
              <button 
                className="create-first-newsletter-btn"
                onClick={() => navigate('/admin/newsletters/create')}
              >
                📝 Создать первую рассылку
              </button>
            )}
          </div>
        ) : (
          <div className="newsletters-list">
            {filteredNewsletters.map((newsletter: any) => (
              <div key={newsletter.id} className="newsletter-card">
                <div className="newsletter-header">
                  <div className="newsletter-title">
                    <h3>{newsletter.title}</h3>
                    <p className="newsletter-subject">{newsletter.subject}</p>
                  </div>
                  <div className="newsletter-status">
                    {getStatusBadge(newsletter.status)}
                  </div>
                </div>

                <div className="newsletter-content-preview">
                  <p>{newsletter.content.substring(0, 150)}...</p>
                </div>

                <div className="newsletter-stats">
                  <div className="stat-item">
                    <span className="stat-label">Получателей:</span>
                    <span className="stat-value">{newsletter.totalRecipients}</span>
                  </div>
                  <div className="stat-item">
                    <span className="stat-label">Отправлено:</span>
                    <span className="stat-value">{newsletter.sentCount}</span>
                  </div>
                  {newsletter.failedCount > 0 && (
                    <div className="stat-item error">
                      <span className="stat-label">Ошибки:</span>
                      <span className="stat-value">{newsletter.failedCount}</span>
                    </div>
                  )}
                </div>

                <div className="newsletter-meta">
                  <div className="newsletter-dates">
                    <span>Создано: {formatDate(newsletter.createdAt)}</span>
                    {newsletter.sentAt && (
                      <span>Отправлено: {formatDate(newsletter.sentAt)}</span>
                    )}
                  </div>
                  <div className="newsletter-actions">
                    <button className="action-btn view-btn" title="Просмотр">
                      👁️
                    </button>
                    <button 
                      className="action-btn edit-btn" 
                      title="Редактировать"
                      onClick={() => navigate(`/admin/newsletters/edit/${newsletter.id}`)}
                    >
                      ✏️
                    </button>
                    <button className="action-btn duplicate-btn" title="Дублировать">
                      📋
                    </button>
                    <button className="action-btn delete-btn" title="Удалить">
                      🗑️
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminNewsletters;