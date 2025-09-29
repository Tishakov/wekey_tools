import React, { useState, useEffect } from 'react';
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
  const { 
    news, 
    loading, 
    error, 
    fetchNews,
    createNews,
    deleteNews,
    publishNews,
    archiveNews,
    uploadImage
  } = useNews();
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [priorityFilter, setPriorityFilter] = useState<string>('all');

  // Загрузка списка новостей при монтировании компонента
  useEffect(() => {
    fetchNews();
  }, []); // Убираем fetchNews из зависимостей

  // Обработчики действий
  const handleCreateNews = async (formData: any) => {
    try {
      await createNews(formData);
      setShowCreateForm(false);
    } catch (error) {
      console.error('Error creating news:', error);
    }
  };

  const handleDeleteNews = async (id: number) => {
    if (window.confirm('Вы уверены, что хотите удалить эту новость?')) {
      try {
        await deleteNews(id);
      } catch (error) {
        console.error('Error deleting news:', error);
      }
    }
  };

  const handlePublishNews = async (id: number) => {
    if (window.confirm('Вы уверены, что хотите опубликовать эту новость?')) {
      try {
        await publishNews(id);
      } catch (error) {
        console.error('Error publishing news:', error);
      }
    }
  };

  const handleArchiveNews = async (id: number) => {
    if (window.confirm('Вы уверены, что хотите архивировать эту новость?')) {
      try {
        await archiveNews(id);
      } catch (error) {
        console.error('Error archiving news:', error);
      }
    }
  };

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
          onClick={() => setShowCreateForm(true)}
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
                onClick={() => setShowCreateForm(true)}
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
                    <button className="action-btn edit-btn" title="Редактировать">
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

      {/* TODO: Модальные окна для создания/редактирования */}
      {showCreateForm && (
        <div className="modal-overlay">
          <div className="create-news-modal">
            <div className="modal-header">
              <h2>📝 Создание новой новости</h2>
              <button 
                className="close-modal-btn"
                onClick={() => setShowCreateForm(false)}
              >
                ✕
              </button>
            </div>
            <div className="modal-content">
              <p>🚧 Форма создания новости в разработке...</p>
              <p>Здесь будет:</p>
              <ul>
                <li>📋 Поле для заголовка новости</li>
                <li>🖼️ Загрузка изображения</li>
                <li>📝 Rich-text редактор для содержания</li>
                <li>🏷️ Поля для тегов и описания</li>
                <li>📧 Опция отправки email-уведомлений</li>
                <li>⭐ Настройка приоритета</li>
                <li>👀 Предварительный просмотр</li>
              </ul>
            </div>
            <div className="modal-actions">
              <button 
                className="cancel-btn"
                onClick={() => setShowCreateForm(false)}
              >
                Отмена
              </button>
              <button className="save-btn" disabled>
                💾 Сохранить черновик
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminNews;