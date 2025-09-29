import React, { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useNewsletters } from '../../hooks/useNewslettersAndNews';
import SimpleEmailBuilder from './EmailBuilder/SimpleEmailBuilder';
import type { EmailBlock } from './EmailBuilder/SimpleEmailBuilder';
import './CreateNewsletter.css';

const CreateNewsletter: React.FC = () => {
  const navigate = useNavigate();
  const { createNewsletter } = useNewsletters();
  const contentTextareaRef = useRef<HTMLTextAreaElement>(null);
  
  const [formData, setFormData] = useState({
    title: '',
    subject: '',
    content: '',
    targetAudience: 'all',
    segmentCriteria: {},
    scheduledAt: '',
    sendImmediately: false
  });
  
  const [emailBlocks, setEmailBlocks] = useState<EmailBlock[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [useAdvancedBuilder, setUseAdvancedBuilder] = useState(true);
  const [selectedBlockId, setSelectedBlockId] = useState<string | null>(null);

  // Interactive block component for right panel
  const InteractiveBlockComponent = ({ 
    block, 
    index, 
    isSelected,
    onUpdate, 
    onDelete, 
    onSelect,
    onMove 
  }: {
    block: EmailBlock;
    index: number;
    isSelected: boolean;
    onUpdate: (updates: Partial<EmailBlock>) => void;
    onDelete: () => void;
    onSelect: () => void;
    onMove: (direction: 'up' | 'down') => void;
  }) => {
    
    const handleContentChange = (newContent: string) => {
      onUpdate({ 
        content: { 
          ...block.content, 
          text: newContent 
        } 
      });
    };

    const renderBlockHTML = (block: EmailBlock): string => {
      const { padding, margin, backgroundColor, alignment, borderRadius, borderColor, borderWidth, borderStyle } = block.settings;
      const paddingStyle = `${padding?.top || 15}px ${padding?.right || 20}px ${padding?.bottom || 15}px ${padding?.left || 20}px`;
      const marginStyle = `${margin?.top || 0}px ${margin?.right || 0}px ${margin?.bottom || 0}px ${margin?.left || 0}px`;
      const containerStyle = `padding: ${paddingStyle}; margin: ${marginStyle}; background-color: ${backgroundColor || 'transparent'}; text-align: ${alignment || 'left'}; border-radius: ${borderRadius || 0}px; border: ${borderWidth || 0}px ${borderStyle || 'solid'} ${borderColor || 'transparent'};`;

      switch (block.type) {
        case 'text':
          const TextTag = block.content.textType || 'p';
          return `
            <div style="${containerStyle}">
              <${TextTag} style="
                font-size: ${block.content.fontSize || 16}px; 
                color: ${block.content.color || '#333333'};
                font-weight: ${block.content.fontWeight || 'normal'};
                font-style: ${block.content.fontStyle || 'normal'};
                text-decoration: ${block.content.textDecoration || 'none'};
                margin: 0;
                line-height: 1.5;
              ">
                ${block.content.text || 'Введите текст...'}
              </${TextTag}>
            </div>
          `;
        case 'image':
          return `<div style="${containerStyle}"><img src="${block.content.src}" alt="${block.content.alt}" style="max-width: 100%; height: auto;" /></div>`;
        case 'button':
          return `<div style="${containerStyle}"><a href="${block.content.url}" style="display: inline-block; padding: 10px 20px; background-color: ${block.content.backgroundColor}; color: ${block.content.textColor}; text-decoration: none; border-radius: 4px;">${block.content.text}</a></div>`;
        case 'divider':
          return `<div style="${containerStyle}"><hr style="border: none; height: 1px; background-color: #ccc;" /></div>`;
        case 'spacer':
          return `<div style="height: ${block.content.height}px;"></div>`;
        default:
          return '';
      }
    };

    return (
      <div 
        className={`block-preview ${isSelected ? 'selected' : ''}`}
        onClick={(e) => {
          e.stopPropagation();
          onSelect();
        }}
      >
        <div className="interactive-block-controls">
          <button 
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onMove('up');
            }}
            disabled={index === 0}
            className="interactive-control-btn"
            title="Переместить вверх"
          >
            ↑
          </button>
          <button 
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onMove('down');
            }}
            disabled={index === emailBlocks.length - 1}
            className="interactive-control-btn"
            title="Переместить вниз"
          >
            ↓
          </button>
          <button 
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onDelete();
            }}
            className="interactive-control-btn delete"
            title="Удалить блок"
          >
            ✕
          </button>
        </div>
        
        {block.type === 'text' ? (
          <div
            className="editable-text"
            contentEditable
            suppressContentEditableWarning={true}
            onBlur={(e) => handleContentChange(e.currentTarget.innerHTML)}
            dangerouslySetInnerHTML={{ __html: block.content.text || 'Введите текст...' }}
            style={{ 
              minHeight: '20px',
              border: isSelected ? '2px dashed #007acc' : `${block.settings.borderWidth || 0}px ${block.settings.borderStyle || 'solid'} ${block.settings.borderColor || 'transparent'}`,
              padding: `${block.settings.padding?.top || 15}px ${block.settings.padding?.right || 20}px ${block.settings.padding?.bottom || 15}px ${block.settings.padding?.left || 20}px`,
              margin: `${block.settings.margin?.top || 0}px ${block.settings.margin?.right || 0}px ${block.settings.margin?.bottom || 0}px ${block.settings.margin?.left || 0}px`,
              textAlign: block.settings.alignment || 'left',
              backgroundColor: block.settings.backgroundColor || 'transparent',
              borderRadius: `${block.settings.borderRadius || 0}px`,
              fontSize: `${block.content.fontSize || 16}px`,
              color: block.content.color || '#333333',
              lineHeight: '1.5'
            }}
          />
        ) : (
          <div 
            dangerouslySetInnerHTML={{ __html: renderBlockHTML(block) }}
            style={{ 
              border: isSelected ? '2px dashed #007acc' : '1px solid transparent',
              borderRadius: '4px'
            }}
          />
        )}
      </div>
    );
  };


  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? (e.target as HTMLInputElement).checked : value
    }));
  };

  // Функции форматирования текста
  const insertFormatting = (tag: string, hasClosingTag: boolean = true) => {
    const textarea = contentTextareaRef.current;
    if (!textarea) return;

    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const selectedText = formData.content.substring(start, end);
    
    let newText: string;
    let closingTag: string;
    
    // Специальная обработка для ссылок
    if (tag.startsWith('a href')) {
      newText = `<a href="">${selectedText}</a>`;
    } else if (hasClosingTag) {
      closingTag = tag.split(' ')[0]; // Для случаев вроде "a href" берем только "a"
      newText = `<${tag}>${selectedText}</${closingTag}>`;
    } else {
      newText = `<${tag}>`;
    }
    
    const newContent = 
      formData.content.substring(0, start) + 
      newText + 
      formData.content.substring(end);
    
    setFormData({ ...formData, content: newContent });
    
    // Восстанавливаем фокус и позицию курсора
    setTimeout(() => {
      textarea.focus();
      const newPosition = start + newText.length;
      textarea.setSelectionRange(newPosition, newPosition);
    }, 0);
  };

  const insertText = (text: string) => {
    const textarea = contentTextareaRef.current;
    if (!textarea) return;

    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    
    const newContent = 
      formData.content.substring(0, start) + 
      text + 
      formData.content.substring(end);
    
    setFormData({ ...formData, content: newContent });
    
    setTimeout(() => {
      textarea.focus();
      const newPosition = start + text.length;
      textarea.setSelectionRange(newPosition, newPosition);
    }, 0);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    
    try {
      await createNewsletter({
        ...formData,
        status: 'draft',
        createdBy: 1 // TODO: получить из контекста авторизации
      });
      
      // Переход обратно к списку рассылок
      navigate('/admin/newsletters');
    } catch (error) {
      console.error('Error creating newsletter:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSaveDraft = async () => {
    setIsSubmitting(true);
    
    try {
      await createNewsletter({
        ...formData,
        status: 'draft',
        createdBy: 1
      });
      
      navigate('/admin/newsletters');
    } catch (error) {
      console.error('Error saving draft:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="create-newsletter-container">
      {/* Хлебные крошки и навигация */}
      <div className="create-header">
        <div className="breadcrumbs">
          <button 
            className="breadcrumb-link"
            onClick={() => navigate('/admin/newsletters')}
          >
            📧 Рассылки
          </button>
          <span className="breadcrumb-separator">→</span>
          <span className="breadcrumb-current">Создание рассылки</span>
        </div>
        

      </div>

      <div className="create-content">
        {/* Основная форма */}
        <form onSubmit={handleSubmit} className="newsletter-form with-preview">
            {/* Основная информация */}
            <div className="newsletter-form-section">
              <div className="newsletter-form-row">
                <div className="newsletter-form-group">
                  <label htmlFor="title">Название рассылки *</label>
                  <input
                    type="text"
                    id="title"
                    name="title"
                    value={formData.title}
                    onChange={handleInputChange}
                    placeholder="Название для внутреннего использования"
                    required
                  />
                </div>
              </div>

              <div className="newsletter-form-row">
                <div className="newsletter-form-group">
                  <label htmlFor="subject">Тема письма *</label>
                  <input
                    type="text"
                    id="subject"
                    name="subject"
                    value={formData.subject}
                    onChange={handleInputChange}
                    placeholder="Тема, которую увидят получатели"
                    required
                  />
                </div>
              </div>
            </div>

            {/* Содержание */}
            <div className="newsletter-form-section">
              <div className="newsletter-content-group">
                <div className="newsletter-editor-mode-selector">
                  <label>Режим создания письма</label>
                  <div className="mode-buttons">
                    <button
                      type="button"
                      className={!useAdvancedBuilder ? 'active' : ''}
                      onClick={() => setUseAdvancedBuilder(false)}
                    >
                      📝 Простой редактор
                    </button>
                    <button
                      type="button"
                      className={useAdvancedBuilder ? 'active' : ''}
                      onClick={() => setUseAdvancedBuilder(true)}
                    >
                      🧱 Блочный конструктор
                    </button>
                  </div>
                </div>

                {!useAdvancedBuilder ? (
                  <>
                    <label htmlFor="content">Текст рассылки *</label>
                    
                    {/* Панель инструментов форматирования */}
                    <div className="formatting-toolbar">
                      <div className="toolbar-group">
                        <button
                          type="button"
                          className="toolbar-btn"
                          onClick={() => insertFormatting('b')}
                          title="Жирный текст"
                        >
                          <strong>B</strong>
                        </button>
                        <button
                          type="button"
                          className="toolbar-btn"
                          onClick={() => insertFormatting('i')}
                          title="Курсив"
                        >
                          <em>I</em>
                        </button>
                        <button
                          type="button"
                          className="toolbar-btn"
                          onClick={() => insertFormatting('u')}
                          title="Подчеркнутый"
                        >
                          <u>U</u>
                        </button>
                      </div>
                      
                      <div className="toolbar-separator"></div>
                      
                      <div className="toolbar-group">
                        <button
                          type="button"
                          className="toolbar-btn"
                          onClick={() => insertFormatting('h1')}
                          title="Заголовок 1"
                        >
                          H1
                        </button>
                        <button
                          type="button"
                          className="toolbar-btn"
                          onClick={() => insertFormatting('h2')}
                          title="Заголовок 2"
                        >
                          H2
                        </button>
                        <button
                          type="button"
                          className="toolbar-btn"
                          onClick={() => insertFormatting('p')}
                          title="Абзац"
                        >
                          P
                        </button>
                      </div>
                      
                      <div className="toolbar-separator"></div>
                      
                      <div className="toolbar-group">
                        <button
                          type="button"
                          className="toolbar-btn"
                          onClick={() => insertText('<br>')}
                          title="Перенос строки"
                        >
                          ↵
                        </button>
                        <button
                          type="button"
                          className="toolbar-btn"
                          onClick={() => insertText('<hr>')}
                          title="Горизонтальная линия"
                        >
                          ―
                        </button>
                      </div>
                      
                      <div className="toolbar-separator"></div>
                      
                      <div className="toolbar-group">
                        <button
                          type="button"
                          className="toolbar-btn"
                          onClick={() => insertFormatting('a href=""')}
                          title="Ссылка"
                        >
                          🔗
                        </button>
                        <button
                          type="button"
                          className="toolbar-btn"
                          onClick={() => insertText('<img src="" alt="">')}
                          title="Изображение"
                        >
                          🖼️
                        </button>
                      </div>
                    </div>
                    
                    <textarea
                      ref={contentTextareaRef}
                      id="content"
                      name="content"
                      value={formData.content}
                      onChange={handleInputChange}
                      placeholder="Содержание вашей рассылки..."
                      rows={12}
                      required
                    />
                    <div className="newsletter-form-hint">
                      💡 Поддерживается HTML разметка для форматирования текста
                    </div>
                  </>
                ) : (
                  <div className="newsletter-advanced-builder">
                    <SimpleEmailBuilder
                      initialBlocks={emailBlocks}
                      onBlocksChange={setEmailBlocks}
                      onContentChange={(html: string) => {
                        setFormData(prev => ({ ...prev, content: html }));
                      }}
                      selectedBlockId={selectedBlockId}
                      onBlockSelect={setSelectedBlockId}
                    />
                  </div>
                )}
              </div>
            </div>

            {/* Аудитория */}
            <div className="newsletter-form-section">
              <div className="newsletter-form-row">
                <div className="newsletter-form-group">
                  <label htmlFor="targetAudience">Целевая аудитория</label>
                  <select
                    id="targetAudience"
                    name="targetAudience"
                    value={formData.targetAudience}
                    onChange={handleInputChange}
                  >
                    <option value="all">🌐 Все пользователи</option>
                    <option value="active">✅ Только активные пользователи</option>
                    <option value="premium">⭐ Premium пользователи</option>
                    <option value="recent">🆕 Недавно зарегистрированные</option>
                    <option value="inactive">😴 Неактивные пользователи</option>
                  </select>
                </div>
              </div>
            </div>

            {/* Планирование */}
            <div className="newsletter-form-section">
              <h2>📅 Планирование отправки</h2>
              
              <div className="newsletter-form-row">
                <div className="newsletter-form-group newsletter-checkbox-group">
                  <label className="newsletter-checkbox-label">
                    <input
                      type="checkbox"
                      name="sendImmediately"
                      checked={formData.sendImmediately}
                      onChange={handleInputChange}
                    />
                    Отправить немедленно после создания
                  </label>
                </div>
              </div>

              {!formData.sendImmediately && (
                <div className="newsletter-form-row">
                  <div className="newsletter-form-group">
                    <label htmlFor="scheduledAt">Запланировать отправку</label>
                    <input
                      type="datetime-local"
                      id="scheduledAt"
                      name="scheduledAt"
                      value={formData.scheduledAt}
                      onChange={handleInputChange}
                      min={new Date().toISOString().slice(0, 16)}
                    />
                    <div className="newsletter-form-hint">
                      💡 Оставьте пустым для отправки вручную
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Кнопки действий */}
            <div className="form-actions">
              <div>
                <button 
                  type="button"
                  className="cancel-btn"
                  onClick={() => navigate('/admin/newsletters')}
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
                    disabled={isSubmitting || !formData.title || !formData.subject || !formData.content}
                  >
                    {isSubmitting ? '⏳ Создание...' : formData.sendImmediately ? '🚀 Создать и отправить' : '✅ Создать рассылку'}
                  </button>
                </div>
              </div>
            </div>
          </form>

        {/* Предварительный просмотр */}
        <div className="newsletter-preview-container">
          <div className="newsletter-preview-header">
            <h3>👁️ Предварительный просмотр</h3>
          </div>
          
          {/* Индикатор прогресса заполнения */}
          <div className="form-progress">
            <div className="progress-label">Готовность формы:</div>
            <div className="progress-bar">
              <div 
                className="progress-fill" 
                style={{ 
                  width: `${Math.round(
                    ((formData.title ? 1 : 0) + 
                     (formData.subject ? 1 : 0) + 
                     (formData.content ? 1 : 0)) / 3 * 100
                  )}%` 
                }}
              ></div>
            </div>
            <div className="progress-text">
              {Math.round(
                ((formData.title ? 1 : 0) + 
                 (formData.subject ? 1 : 0) + 
                 (formData.content ? 1 : 0)) / 3 * 100
              )}% завершено
            </div>
          </div>
            
            <div className="newsletter-email-preview">
              <div className="newsletter-email-header">
                <div className="newsletter-email-subject">{formData.subject || 'Тема письма'}</div>
                <div className="newsletter-email-from">
                  <div>
                    <div><strong>Wekey Tools</strong> &lt;noreply@wekey.tools&gt;</div>
                    <div>кому: мне</div>
                  </div>
                </div>
              </div>
              
              {useAdvancedBuilder ? (
                <div 
                  className="newsletter-email-body interactive"
                  onClick={(e) => {
                    // Сбрасываем выделение при клике в пустое место
                    if (e.target === e.currentTarget) {
                      setSelectedBlockId(null);
                    }
                  }}
                >
                  {emailBlocks.length === 0 ? (
                    <div 
                      className="empty-state"
                      onClick={() => setSelectedBlockId(null)}
                    >
                      <p>Добавьте блоки для создания письма</p>
                    </div>
                  ) : (
                    emailBlocks.map((block, index) => (
                      <InteractiveBlockComponent
                        key={block.id}
                        block={block}
                        index={index}
                        isSelected={selectedBlockId === block.id}
                        onUpdate={(updates: Partial<EmailBlock>) => {
                          setEmailBlocks(prev => prev.map(b => 
                            b.id === block.id ? { ...b, ...updates } : b
                          ));
                        }}
                        onDelete={() => {
                          // Clear selection if deleting the selected block
                          if (selectedBlockId === block.id) {
                            setSelectedBlockId(null);
                          }
                          setEmailBlocks(prev => prev.filter(b => b.id !== block.id));
                        }}
                        onSelect={() => setSelectedBlockId(block.id)}
                        onMove={(direction: 'up' | 'down') => {
                          const currentIndex = emailBlocks.findIndex(b => b.id === block.id);
                          if (direction === 'up' && currentIndex > 0) {
                            const newBlocks = [...emailBlocks];
                            [newBlocks[currentIndex], newBlocks[currentIndex - 1]] = [newBlocks[currentIndex - 1], newBlocks[currentIndex]];
                            setEmailBlocks(newBlocks);
                          } else if (direction === 'down' && currentIndex < emailBlocks.length - 1) {
                            const newBlocks = [...emailBlocks];
                            [newBlocks[currentIndex], newBlocks[currentIndex + 1]] = [newBlocks[currentIndex + 1], newBlocks[currentIndex]];
                            setEmailBlocks(newBlocks);
                          }
                        }}
                      />
                    ))
                  )}
                </div>
              ) : (
                <div className="newsletter-email-body">
                  <div dangerouslySetInnerHTML={{ 
                    __html: formData.content || '<p>Содержание письма появится здесь...</p>' 
                  }} />
                </div>
              )}
            </div>
        </div>
      </div>
    </div>
  );
};

export default CreateNewsletter;