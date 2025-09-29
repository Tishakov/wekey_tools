import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useNews } from '../../hooks/useNewslettersAndNews';
import './CreateNews.css';

const CreateNews: React.FC = () => {
  const navigate = useNavigate();
  const { createNews } = useNews();
  
  const [formData, setFormData] = useState({
    title: '',
    summary: '',
    content: '',
    tags: '',
    imageUrl: '',
    priority: 'normal',
    isPublished: false,
    publishedAt: '',
    sendNotification: false,
    notificationText: ''
  });
  
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showPreview, setShowPreview] = useState(false);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? (e.target as HTMLInputElement).checked : value
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    
    try {
      const newsData = {
        ...formData,
        tags: formData.tags.split(',').map(tag => tag.trim()).filter(tag => tag),
        publishedAt: formData.isPublished ? (formData.publishedAt || new Date().toISOString()) : null,
        authorId: 1 // TODO: получить из контекста авторизации
      };

      await createNews(newsData);
      navigate('/admin/news');
    } catch (error) {
      console.error('Error creating news:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSaveDraft = async () => {
    setIsSubmitting(true);
    
    try {
      const newsData = {
        ...formData,
        tags: formData.tags.split(',').map(tag => tag.trim()).filter(tag => tag),
        isPublished: false,
        authorId: 1
      };

      await createNews(newsData);
      navigate('/admin/news');
    } catch (error) {
      console.error('Error saving draft:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="create-news-container">
      {/* Хлебные крошки и навигация */}
      <div className="create-header">
        <div className="breadcrumbs">
          <button 
            className="breadcrumb-link"
            onClick={() => navigate('/admin/news')}
          >
            📰 Новости
          </button>
          <span className="breadcrumb-separator">→</span>
          <span className="breadcrumb-current">Создание новости</span>
        </div>
        
        <div className="header-actions">
          <button 
            className="preview-btn"
            onClick={() => setShowPreview(!showPreview)}
            type="button"
          >
            👁️ {showPreview ? 'Скрыть' : 'Предварительный просмотр'}
          </button>
        </div>
      </div>

      <div className="create-content">
        {/* Основная форма */}
        <div className={`form-container ${showPreview ? 'with-preview' : ''}`}>
          <form onSubmit={handleSubmit} className="news-form">
            {/* Основная информация */}
            <div className="form-section">
              <h2>📝 Основная информация</h2>
              
              <div className="form-row">
                <div className="form-group">
                  <label htmlFor="title">Заголовок новости *</label>
                  <input
                    type="text"
                    id="title"
                    name="title"
                    value={formData.title}
                    onChange={handleInputChange}
                    placeholder="Привлекательный заголовок новости"
                    required
                  />
                </div>
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label htmlFor="summary">Краткое описание</label>
                  <textarea
                    id="summary"
                    name="summary"
                    value={formData.summary}
                    onChange={handleInputChange}
                    placeholder="Краткое описание новости для превью..."
                    rows={3}
                  />
                  <div className="form-hint">
                    💡 Это описание будет отображаться в списке новостей
                  </div>
                </div>
              </div>
            </div>

            {/* Содержание */}
            <div className="form-section">
              <h2>📄 Содержание новости</h2>
              
              <div className="form-group">
                <label htmlFor="content">Полный текст новости *</label>
                <textarea
                  id="content"
                  name="content"
                  value={formData.content}
                  onChange={handleInputChange}
                  placeholder="Подробное содержание вашей новости..."
                  rows={15}
                  required
                />
                <div className="form-hint">
                  💡 Поддерживается HTML разметка и Markdown
                </div>
              </div>
            </div>

            {/* Медиа и теги */}
            <div className="form-section">
              <h2>🖼️ Медиа и категоризация</h2>
              
              <div className="form-row">
                <div className="form-group">
                  <label htmlFor="imageUrl">Изображение (URL)</label>
                  <input
                    type="url"
                    id="imageUrl"
                    name="imageUrl"
                    value={formData.imageUrl}
                    onChange={handleInputChange}
                    placeholder="https://example.com/image.jpg"
                  />
                  <div className="form-hint">
                    💡 Рекомендуемый размер: 1200x630px для лучшего отображения
                  </div>
                </div>
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label htmlFor="tags">Теги</label>
                  <input
                    type="text"
                    id="tags"
                    name="tags"
                    value={formData.tags}
                    onChange={handleInputChange}
                    placeholder="SEO, обновления, функции, инструменты"
                  />
                  <div className="form-hint">
                    💡 Разделяйте теги запятыми
                  </div>
                </div>
                
                <div className="form-group">
                  <label htmlFor="priority">Приоритет</label>
                  <select
                    id="priority"
                    name="priority"
                    value={formData.priority}
                    onChange={handleInputChange}
                  >
                    <option value="low">🔵 Низкий</option>
                    <option value="normal">⚪ Обычный</option>
                    <option value="high">🟡 Высокий</option>
                    <option value="urgent">🔴 Срочный</option>
                  </select>
                </div>
              </div>
            </div>

            {/* Публикация */}
            <div className="form-section">
              <h2>🚀 Настройки публикации</h2>
              
              <div className="form-row">
                <div className="form-group checkbox-group">
                  <label className="checkbox-label">
                    <input
                      type="checkbox"
                      name="isPublished"
                      checked={formData.isPublished}
                      onChange={handleInputChange}
                    />
                    <span className="checkmark">📢</span>
                    Опубликовать новость сразу
                  </label>
                </div>
              </div>

              {formData.isPublished && (
                <div className="form-row">
                  <div className="form-group">
                    <label htmlFor="publishedAt">Дата публикации</label>
                    <input
                      type="datetime-local"
                      id="publishedAt"
                      name="publishedAt"
                      value={formData.publishedAt}
                      onChange={handleInputChange}
                      min={new Date().toISOString().slice(0, 16)}
                    />
                    <div className="form-hint">
                      💡 Оставьте пустым для публикации сейчас
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Уведомления */}
            <div className="form-section">
              <h2>📧 Уведомления пользователей</h2>
              
              <div className="form-row">
                <div className="form-group checkbox-group">
                  <label className="checkbox-label">
                    <input
                      type="checkbox"
                      name="sendNotification"
                      checked={formData.sendNotification}
                      onChange={handleInputChange}
                    />
                    <span className="checkmark">🔔</span>
                    Отправить уведомление пользователям
                  </label>
                </div>
              </div>

              {formData.sendNotification && (
                <div className="form-row">
                  <div className="form-group">
                    <label htmlFor="notificationText">Текст уведомления</label>
                    <textarea
                      id="notificationText"
                      name="notificationText"
                      value={formData.notificationText}
                      onChange={handleInputChange}
                      placeholder="Короткий текст для push-уведомления..."
                      rows={2}
                    />
                    <div className="form-hint">
                      💡 Если пусто, будет использован заголовок новости
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Кнопки действий */}
            <div className="form-actions">
              <button 
                type="button"
                className="cancel-btn"
                onClick={() => navigate('/admin/news')}
                disabled={isSubmitting}
              >
                ← Отмена
              </button>
              
              <div className="action-buttons">
                <button 
                  type="button"
                  className="draft-btn"
                  onClick={handleSaveDraft}
                  disabled={isSubmitting || !formData.title}
                >
                  {isSubmitting ? '⏳ Сохранение...' : '💾 Сохранить черновик'}
                </button>
                
                <button 
                  type="submit"
                  className="create-btn"
                  disabled={isSubmitting || !formData.title || !formData.content}
                >
                  {isSubmitting ? '⏳ Создание...' : formData.isPublished ? '🚀 Опубликовать' : '✅ Создать новость'}
                </button>
              </div>
            </div>
          </form>
        </div>

        {/* Предварительный просмотр */}
        {showPreview && (
          <div className="preview-container">
            <div className="preview-header">
              <h3>👁️ Предварительный просмотр</h3>
            </div>
            
            <div className="news-preview">
              {formData.imageUrl && (
                <div className="news-image">
                  <img src={formData.imageUrl} alt="Preview" />
                </div>
              )}
              
              <div className="news-header">
                <div className="news-meta">
                  <span className={`priority-badge priority-${formData.priority}`}>
                    {formData.priority === 'low' && '🔵'}
                    {formData.priority === 'normal' && '⚪'}
                    {formData.priority === 'high' && '🟡'}
                    {formData.priority === 'urgent' && '🔴'}
                    {formData.priority}
                  </span>
                  <span className="publish-status">
                    {formData.isPublished ? '📢 Опубликовано' : '📝 Черновик'}
                  </span>
                </div>
                
                <h1 className="news-title">{formData.title || 'Заголовок новости'}</h1>
                
                {formData.summary && (
                  <p className="news-summary">{formData.summary}</p>
                )}
                
                {formData.tags && (
                  <div className="news-tags">
                    {formData.tags.split(',').map((tag, index) => (
                      <span key={index} className="tag">#{tag.trim()}</span>
                    ))}
                  </div>
                )}
              </div>
              
              <div className="news-content">
                <div dangerouslySetInnerHTML={{ 
                  __html: formData.content || '<p>Содержание новости появится здесь...</p>' 
                }} />
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default CreateNews;