import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useNews } from '../../hooks/useNewslettersAndNews';
import './AdminNews.css';

interface NewsItem {
  id: number;
  title: string;
  slug: string;
  excerpt?: string;
  content: string;
  featuredImage?: string;
  tags: string[];
  status: 'draft' | 'published' | 'archived';
  publishedAt?: string;
  sendEmailNotification: boolean;
  emailSentAt?: string;
  emailRecipientCount: number;
  viewCount: number;
  priority: number;
  createdAt: string;
}

const AdminNews: React.FC = () => {
  const navigate = useNavigate();
  const { 
    news, 
    loading, 
    error, 
    fetchNews
  } = useNews();
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');

  // Загрузка списка новостей при монтировании компонента
  useEffect(() => {
    fetchNews();
  }, []); // Убираем fetchNews из зависимостей

  // Фильтрация новостей
  const filteredNews = news.filter((newsItem: any) => {
    const matchesSearch = newsItem.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         (newsItem.excerpt && newsItem.excerpt.toLowerCase().includes(searchTerm.toLowerCase()));
    const matchesStatus = statusFilter === 'all' || newsItem.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const getStatusBadge = (status: string) => {
    const statusConfig = {
      draft: { text: 'Черновик', class: 'status-draft' },
      published: { text: 'Опубликовано', class: 'status-published' },
      archived: { text: 'В архиве', class: 'status-archived' }
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

  const getPriorityIcon = (priority: number) => {
    if (priority > 5) return '🔥'; // Высокий приоритет
    if (priority > 0) return '⭐'; // Средний приоритет
    return '📄'; // Обычный приоритет
  };

  if (loading) {
    return (
      <div className="admin-news-container">
        <div className="loading-state">
          <div className="loading-spinner"></div>
          <h3>Загрузка новостей...</h3>
          <p>Подождите, пожалуйста</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="admin-news-container">
        <div className="empty-state">
          <span className="empty-icon">⚠️</span>
          <h3>Ошибка загрузки</h3>
          <p>{error}</p>
          <button className="create-first-news-btn" onClick={() => fetchNews()}>
            Попробовать снова
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="admin-news-container">
      <div className="admin-news-header">
        <div className="admin-section-title">
          <h1>📰 Новости</h1>
          <p>Управление новостями и уведомлениями для пользователей</p>
        </div>
        <button 
          className="create-news-btn"
          onClick={() => navigate('/admin/news/create')}
        >
          📝 Создать новость
        </button>
      </div>

      {/* Фильтры */}
      <div className="news-filters">
        <div className="search-box">
          <input
            type="text"
            placeholder="Поиск по названию или описанию..."
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
            <option value="published">Опубликованные</option>
            <option value="archived">В архиве</option>
          </select>
        </div>
      </div>

      {/* Список новостей */}
      <div className="news-content">
        {loading ? (
          <div className="loading-state">
            <div className="loading-spinner"></div>
            <p>Загрузка новостей...</p>
          </div>
        ) : filteredNews.length === 0 ? (
          <div className="empty-state">
            <div className="empty-icon">📰</div>
            <h3>Новости не найдены</h3>
            <p>
              {searchTerm || statusFilter !== 'all' 
                ? 'Попробуйте изменить критерии поиска'
                : 'Создайте первую новость для ваших пользователей'
              }
            </p>
            {!searchTerm && statusFilter === 'all' && (
              <button 
                className="create-first-news-btn"
                onClick={() => navigate('/admin/news/create')}
              >
                📝 Создать первую новость
              </button>
            )}
          </div>
        ) : (
          <div className="news-list">
            {filteredNews.map((newsItem: any) => (
              <div key={newsItem.id} className="news-card">
                <div className="news-header">
                  <div className="news-title">
                    <div className="title-with-priority">
                      <span className="priority-icon">{getPriorityIcon(newsItem.priority)}</span>
                      <h3>{newsItem.title}</h3>
                    </div>
                    {newsItem.excerpt && (
                      <p className="news-excerpt">{newsItem.excerpt}</p>
                    )}
                  </div>
                  <div className="news-status">
                    {getStatusBadge(newsItem.status)}
                  </div>
                </div>

                {newsItem.featuredImage && (
                  <div className="news-image">
                    <img src={newsItem.featuredImage} alt={newsItem.title} />
                  </div>
                )}

                <div className="news-content-preview">
                  <p>{newsItem.content.substring(0, 200)}...</p>
                </div>

                {newsItem.tags.length > 0 && (
                  <div className="news-tags">
                    {newsItem.tags.map((tag: string, index: number) => (
                      <span key={index} className="news-tag">#{tag}</span>
                    ))}
                  </div>
                )}

                <div className="news-stats">
                  <div className="stat-item">
                    <span className="stat-label">👁️ Просмотры:</span>
                    <span className="stat-value">{newsItem.viewCount}</span>
                  </div>
                  {newsItem.sendEmailNotification && (
                    <div className="stat-item">
                      <span className="stat-label">📧 Email отправлен:</span>
                      <span className="stat-value">
                        {newsItem.emailSentAt ? 'Да' : 'Нет'} 
                        {newsItem.emailRecipientCount > 0 && ` (${newsItem.emailRecipientCount})`}
                      </span>
                    </div>
                  )}
                </div>

                <div className="news-meta">
                  <div className="news-dates">
                    <span>Создано: {formatDate(newsItem.createdAt)}</span>
                    {newsItem.publishedAt && (
                      <span>Опубликовано: {formatDate(newsItem.publishedAt)}</span>
                    )}
                  </div>
                  <div className="news-actions">
                    <button className="action-btn view-btn" title="Просмотр">
                      👁️
                    </button>
                    <button 
                      className="action-btn edit-btn" 
                      title="Редактировать"
                      onClick={() => navigate(`/admin/news/edit/${newsItem.id}`)}
                    >
                      ✏️
                    </button>
                    <button className="action-btn publish-btn" title="Опубликовать">
                      🚀
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

export default AdminNews;