import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import './NewslettersList.css';

interface Newsletter {
  id: number;
  title: string;
  subject: string;
  status: 'draft' | 'scheduled' | 'sent' | 'sending' | 'failed' | 'active';
  type?: string;
  isSystem?: boolean;
  targetAudience: string;
  createdAt: string;
  scheduledAt?: string;
  sentAt?: string;
  stats?: {
    sent: number;
    opened: number;
    clicked: number;
  };
}

interface NewslettersListProps {
  newsletters: Newsletter[];
  onDelete: (id: number) => void;
  onDuplicate: (id: number) => void;
  onRefresh: () => void;
}

export const NewslettersList: React.FC<NewslettersListProps> = ({
  newsletters,
  onDelete,
  onDuplicate,
  onRefresh,
}) => {
  const navigate = useNavigate();
  const [deleteModalId, setDeleteModalId] = useState<number | null>(null);
  const [previewId, setPreviewId] = useState<number | null>(null);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'draft':
        return '#fbbf24';
      case 'scheduled':
        return '#3b82f6';
      case 'sent':
        return '#10b981';
      case 'sending':
        return '#8b5cf6';
      case 'failed':
        return '#ef4444';
      case 'active':
        return '#10b981';
      default:
        return '#6b7280';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'draft':
        return 'Черновик';
      case 'scheduled':
        return 'Запланировано';
      case 'sent':
        return 'Отправлено';
      case 'sending':
        return 'Отправка...';
      case 'failed':
        return 'Ошибка';
      case 'active':
        return 'Активно';
      default:
        return status;
    }
  };

  const getSystemEmailLabel = (type?: string) => {
    switch (type) {
      case 'system_welcome':
        return 'Приветственное письмо';
      case 'system_password_reset':
        return 'Сброс пароля';
      case 'system_verification':
        return 'Подтверждение Email';
      case 'system_balance_refill':
        return 'Пополнение баланса';
      default:
        return 'Системное письмо';
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('ru-RU', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const handleEdit = (id: number) => {
    navigate(`/admin/newsletters/edit/${id}`);
  };

  const handleDelete = (id: number) => {
    onDelete(id);
    setDeleteModalId(null);
  };

  const handleDuplicate = (id: number) => {
    onDuplicate(id);
  };

  const handlePreview = (id: number) => {
    setPreviewId(id);
  };

  if (newsletters.length === 0) {
    return (
      <div className="newsletters-empty">
        <div className="empty-icon">📧</div>
        <h3>Нет рассылок</h3>
        <p>Создайте первую рассылку, чтобы начать работу</p>
        <button
          className="btn-primary"
          onClick={() => navigate('/admin/newsletters/create')}
        >
          Создать рассылку
        </button>
      </div>
    );
  }

  return (
    <div className="newsletters-list">
      <div className="newsletters-grid">
        {newsletters.map((newsletter) => (
          <div key={newsletter.id} className="newsletter-card">
            {/* Системный badge */}
            {newsletter.isSystem && (
              <div className="system-badge">
                <span className="badge-icon">⚙️</span>
                <span className="badge-text">Системное</span>
              </div>
            )}
            
            {/* Статус badge */}
            <div className="newsletter-status">
              <span
                className="status-badge"
                style={{ backgroundColor: getStatusColor(newsletter.status) }}
              >
                {getStatusText(newsletter.status)}
              </span>
            </div>

            {/* Основная информация */}
            <div className="newsletter-header">
              <h3 className="newsletter-title">
                {newsletter.title}
                {newsletter.isSystem && (
                  <span className="system-label" title={getSystemEmailLabel(newsletter.type)}>
                    {getSystemEmailLabel(newsletter.type)}
                  </span>
                )}
              </h3>
              <p className="newsletter-subject">
                <span className="subject-label">Тема:</span> {newsletter.subject || 'Не указана'}
              </p>
            </div>

            {/* Статистика */}
            <div className="newsletter-stats">
              <div className="stat-item">
                <span className="stat-label">Получатели</span>
                <span className="stat-value">{newsletter.targetAudience || 'Не выбрано'}</span>
              </div>
              {newsletter.stats && newsletter.status === 'sent' && (
                <>
                  <div className="stat-item">
                    <span className="stat-label">Отправлено</span>
                    <span className="stat-value">{newsletter.stats.sent}</span>
                  </div>
                  <div className="stat-item">
                    <span className="stat-label">Открыто</span>
                    <span className="stat-value">
                      {newsletter.stats.opened} ({Math.round((newsletter.stats.opened / newsletter.stats.sent) * 100)}%)
                    </span>
                  </div>
                </>
              )}
            </div>

            {/* Дата */}
            <div className="newsletter-date">
              <span className="date-label">
                {newsletter.status === 'sent' && newsletter.sentAt
                  ? 'Отправлено:'
                  : newsletter.status === 'scheduled' && newsletter.scheduledAt
                  ? 'Запланировано на:'
                  : 'Создано:'}
              </span>
              <span className="date-value">
                {newsletter.status === 'sent' && newsletter.sentAt
                  ? formatDate(newsletter.sentAt)
                  : newsletter.status === 'scheduled' && newsletter.scheduledAt
                  ? formatDate(newsletter.scheduledAt)
                  : formatDate(newsletter.createdAt)}
              </span>
            </div>

            {/* Действия */}
            <div className="newsletter-actions">
              <button
                className="action-btn preview"
                onClick={() => handlePreview(newsletter.id)}
                title="Предпросмотр"
              >
                <span className="icon">👁️</span>
                Просмотр
              </button>
              <button
                className="action-btn edit"
                onClick={() => handleEdit(newsletter.id)}
                title="Редактировать"
              >
                <span className="icon">✏️</span>
                Редактировать
              </button>
              {!newsletter.isSystem && (
                <>
                  <button
                    className="action-btn duplicate"
                    onClick={() => handleDuplicate(newsletter.id)}
                    title="Дублировать"
                  >
                    <span className="icon">📋</span>
                    Дублировать
                  </button>
                  <button
                    className="action-btn delete"
                    onClick={() => setDeleteModalId(newsletter.id)}
                    title="Удалить"
                  >
                    <span className="icon">🗑️</span>
                    Удалить
                  </button>
                </>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Модальное окно удаления */}
      {deleteModalId && (
        <div className="modal-overlay" onClick={() => setDeleteModalId(null)}>
          <div className="modal-content delete-modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-icon">⚠️</div>
            <h3>Удалить рассылку?</h3>
            <p>Это действие нельзя будет отменить</p>
            <div className="modal-actions">
              <button
                className="btn-secondary"
                onClick={() => setDeleteModalId(null)}
              >
                Отмена
              </button>
              <button
                className="btn-danger"
                onClick={() => handleDelete(deleteModalId)}
              >
                Удалить
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Модальное окно предпросмотра (заглушка) */}
      {previewId && (
        <div className="modal-overlay" onClick={() => setPreviewId(null)}>
          <div className="modal-content preview-modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Предпросмотр рассылки</h3>
              <button className="close-btn" onClick={() => setPreviewId(null)}>×</button>
            </div>
            <div className="modal-body">
              <p>Предпросмотр письма #{previewId}</p>
              {/* TODO: Реализовать предпросмотр */}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
