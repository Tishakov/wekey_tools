import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useNewsletters } from '../../../hooks/useNewslettersAndNews';
import './EmailTemplates.css';

interface Newsletter {
  id: number;
  title: string;
  subject: string;
  status: string;
  type: string;
  isSystem: boolean;
  content: string;
  createdAt: string;
  updatedAt: string;
}

type FilterType = 'all' | 'system' | 'custom';

const EmailTemplates: React.FC = () => {
  const navigate = useNavigate();
  const { newsletters, loading, fetchNewsletters, deleteNewsletter } = useNewsletters();
  const [filter, setFilter] = useState<FilterType>('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [deleteModalId, setDeleteModalId] = useState<number | null>(null);

  useEffect(() => {
    fetchNewsletters();
  }, []);

  // Фильтрация писем
  const filteredNewsletters = newsletters.filter((newsletter: Newsletter) => {
    const matchesSearch = newsletter.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         newsletter.subject?.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesFilter = 
      filter === 'all' ? true :
      filter === 'system' ? newsletter.isSystem :
      filter === 'custom' ? !newsletter.isSystem : true;
    
    return matchesSearch && matchesFilter;
  });

  // Разделяем на системные и пользовательские
  const systemEmails = filteredNewsletters.filter((n: Newsletter) => n.isSystem);
  const customTemplates = filteredNewsletters.filter((n: Newsletter) => !n.isSystem);

  const handleDelete = async (id: number) => {
    try {
      await deleteNewsletter(id);
      setDeleteModalId(null);
      fetchNewsletters();
    } catch (error) {
      console.error('Error deleting newsletter:', error);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString('ru-RU', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getSystemEmailDescription = (type: string) => {
    const descriptions: Record<string, string> = {
      system_welcome: 'Отправляется после регистрации для подтверждения email',
      system_password_reset: 'Отправляется при запросе восстановления пароля',
      system_verification: 'Дополнительная верификация аккаунта',
      system_balance_refill: 'Уведомление о пополнении баланса коинов'
    };
    return descriptions[type] || 'Системное письмо';
  };

  return (
    <div className="email-templates-container">
      {/* Filters and Search */}
      <div className="templates-toolbar">
        <div className="toolbar-left">
          <div className="filter-buttons">
            <button 
              className={`filter-btn ${filter === 'all' ? 'active' : ''}`}
              onClick={() => setFilter('all')}
            >
              Все письма
              <span className="count-badge">{newsletters.length}</span>
            </button>
            <button 
              className={`filter-btn ${filter === 'system' ? 'active' : ''}`}
              onClick={() => setFilter('system')}
            >
              ⚙️ Системные
              <span className="count-badge">{systemEmails.length}</span>
            </button>
            <button 
              className={`filter-btn ${filter === 'custom' ? 'active' : ''}`}
              onClick={() => setFilter('custom')}
            >
              📝 Пользовательские
              <span className="count-badge">{customTemplates.length}</span>
            </button>
          </div>
          <div className="search-box">
            <input
              type="text"
              placeholder="🔍 Поиск по названию или теме..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="search-input"
            />
          </div>
        </div>
        <div className="toolbar-right">
          <button 
            className="create-template-btn"
            onClick={() => navigate('/admin/newsletters/create')}
          >
            ➕ Создать письмо
          </button>
        </div>
      </div>

      {/* Loading State */}
      {loading && (
        <div className="loading-state">
          <div className="spinner"></div>
          <p>Загрузка писем...</p>
        </div>
      )}

      {/* System Emails Section */}
      {!loading && (filter === 'all' || filter === 'system') && systemEmails.length > 0 && (
        <div className="templates-section">
          <div className="section-header">
            <h2>⚙️ Системные письма</h2>
            <p className="section-description">
              Эти письма автоматически отправляются пользователям при определенных событиях. 
              Вы можете редактировать их содержимое, но не можете удалить.
            </p>
          </div>
          <div className="templates-grid">
            {systemEmails.map((email: Newsletter) => (
              <div key={email.id} className="template-card system-template">
                <div className="template-header">
                  <div className="template-icon">⚙️</div>
                  <span className="system-badge">Системное</span>
                </div>
                <div className="template-body">
                  <h3 className="template-title">{email.title}</h3>
                  <p className="template-subject">{email.subject}</p>
                  <p className="template-description">
                    {getSystemEmailDescription(email.type)}
                  </p>
                  <div className="template-meta">
                    <span className="meta-item">
                      📝 Изменено: {formatDate(email.updatedAt)}
                    </span>
                  </div>
                </div>
                <div className="template-actions">
                  <button 
                    className="action-btn preview-btn"
                    title="Просмотр"
                    onClick={() => navigate(`/admin/newsletters/preview/${email.id}`)}
                  >
                    👁️ Просмотр
                  </button>
                  <button 
                    className="action-btn edit-btn"
                    onClick={() => navigate(`/admin/newsletters/edit/${email.id}`)}
                  >
                    ✏️ Редактировать
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Custom Templates Section */}
      {!loading && (filter === 'all' || filter === 'custom') && customTemplates.length > 0 && (
        <div className="templates-section">
          <div className="section-header">
            <h2>📝 Пользовательские шаблоны</h2>
            <p className="section-description">
              Ваши собственные шаблоны писем для отправки рассылок
            </p>
          </div>
          <div className="templates-grid">
            {customTemplates.map((template: Newsletter) => (
              <div key={template.id} className="template-card custom-template">
                <div className="template-header">
                  <div className="template-icon">📝</div>
                  <span className={`status-badge status-${template.status}`}>
                    {template.status === 'draft' ? 'Черновик' : 
                     template.status === 'active' ? 'Активен' : template.status}
                  </span>
                </div>
                <div className="template-body">
                  <h3 className="template-title">{template.title}</h3>
                  <p className="template-subject">{template.subject}</p>
                  <div className="template-preview">
                    {template.content.substring(0, 120)}...
                  </div>
                  <div className="template-meta">
                    <span className="meta-item">
                      📅 Создано: {formatDate(template.createdAt)}
                    </span>
                  </div>
                </div>
                <div className="template-actions">
                  <button 
                    className="action-btn preview-btn"
                    title="Просмотр"
                    onClick={() => navigate(`/admin/newsletters/preview/${template.id}`)}
                  >
                    👁️
                  </button>
                  <button 
                    className="action-btn edit-btn"
                    onClick={() => navigate(`/admin/newsletters/edit/${template.id}`)}
                  >
                    ✏️
                  </button>
                  <button 
                    className="action-btn duplicate-btn"
                    title="Дублировать"
                  >
                    📋
                  </button>
                  <button 
                    className="action-btn delete-btn"
                    title="Удалить"
                    onClick={() => setDeleteModalId(template.id)}
                  >
                    🗑️
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Empty State */}
      {!loading && filteredNewsletters.length === 0 && (
        <div className="empty-state">
          <div className="empty-icon">📭</div>
          <h3>Письма не найдены</h3>
          <p>
            {searchTerm 
              ? 'Попробуйте изменить поисковый запрос'
              : filter === 'system'
              ? 'Системные письма еще не созданы'
              : 'Создайте первое письмо для начала работы'
            }
          </p>
          {!searchTerm && filter === 'custom' && (
            <button 
              className="create-first-btn"
              onClick={() => navigate('/admin/newsletters/create')}
            >
              ➕ Создать первое письмо
            </button>
          )}
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {deleteModalId && (
        <div className="modal-overlay" onClick={() => setDeleteModalId(null)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <h3>Удалить письмо?</h3>
            <p>Это действие нельзя отменить. Письмо будет удалено навсегда.</p>
            <div className="modal-actions">
              <button 
                className="cancel-btn"
                onClick={() => setDeleteModalId(null)}
              >
                Отмена
              </button>
              <button 
                className="delete-confirm-btn"
                onClick={() => handleDelete(deleteModalId)}
              >
                🗑️ Удалить
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default EmailTemplates;
