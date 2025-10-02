import React, { useState, useRef, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useNewsletters } from '../../hooks/useNewslettersAndNews';
import { useEmailVariables } from '../../hooks/useEmailVariables';
import SimpleEmailBuilder, { 
  type EmailBlock,
  type EmailSection 
} from './EmailBuilder/SimpleEmailBuilder';
import VariableInserter from './newsletters/VariableInserter';
import IsolatedPreview from './newsletters/IsolatedPreview';
import './CreateNewsletter.css';

const CreateNewsletter: React.FC = () => {
  console.log('🟢 CreateNewsletter component mounting...');
  
  const navigate = useNavigate();
  const { id } = useParams();
  
  console.log('📌 Route params:', { id });
  
  let hookData;
  try {
    hookData = useNewsletters();
    console.log('✅ useNewsletters hook initialized');
  } catch (error) {
    console.error('❌ useNewsletters hook failed:', error);
    throw error;
  }
  
  const { createNewsletter, getNewsletter, updateNewsletter } = hookData;
  
  let emailVariables;
  try {
    emailVariables = useEmailVariables();
    console.log('✅ useEmailVariables hook initialized');
  } catch (error) {
    console.error('❌ useEmailVariables hook failed:', error);
    throw error;
  }
  
  const { replaceWithExamples, getUsedVariables } = emailVariables;
  
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
  const [emailSections, setEmailSections] = useState<EmailSection[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [editorMode, setEditorMode] = useState<'simple' | 'blocks' | 'sections'>('blocks');
  const [selectedBlockId, setSelectedBlockId] = useState<string | null>(null);
  const [selectedSectionId, setSelectedSectionId] = useState<string | null>(null);
  const [isEditMode, setIsEditMode] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  // Load newsletter data for editing
  useEffect(() => {
    console.log('📍 useEffect triggered. ID:', id);
    
    if (id) {
      console.log('📖 Starting to load newsletter...');
      setIsEditMode(true);
      setIsLoading(true);
      
      const loadNewsletter = async () => {
        try {
          console.log('🔄 Calling getNewsletter API...');
          const newsletter = await getNewsletter(id);
          console.log('✅ Newsletter loaded:', newsletter);
          
          // Populate form data
          setFormData({
            title: newsletter.title || '',
            subject: newsletter.subject || '',
            content: newsletter.content || '',
            targetAudience: newsletter.targetAudience || 'all',
            segmentCriteria: newsletter.segmentCriteria || {},
            scheduledAt: newsletter.scheduledAt || '',
            sendImmediately: newsletter.sendImmediately || false
          });

          // Parse and load email blocks if they exist
          if (newsletter.emailBlocks) {
            try {
              const blocks = typeof newsletter.emailBlocks === 'string' 
                ? JSON.parse(newsletter.emailBlocks) 
                : newsletter.emailBlocks;
              
              // Проверяем это блоки или секции (временно)
              if (Array.isArray(blocks) && blocks.length > 0 && blocks[0].type === 'section') {
                console.log('✅ Loaded as sections:', blocks);
                setEmailSections(blocks);
                setEditorMode('sections');
              } else {
                console.log('✅ Loaded as blocks:', blocks);
                setEmailBlocks(blocks);
                setEditorMode('blocks');
              }
            } catch (error) {
              console.error('❌ Error parsing email blocks:', error);
              setEmailBlocks([]);
              setEditorMode('blocks');
            }
          } else {
            console.log('ℹ️ No saved content - default to blocks mode');
            setEditorMode('blocks');
          }
          
        } catch (error) {
          console.error('❌ CRITICAL: Error loading newsletter:', error);
          alert(`Ошибка загрузки: ${error instanceof Error ? error.message : String(error)}`);
          // If loading fails, redirect to newsletters list
          navigate('/admin/newsletters');
        } finally {
          setIsLoading(false);
        }
      };

      loadNewsletter();
    } else {
      console.log('ℹ️ No ID - new newsletter mode');
    }
  }, [id, getNewsletter, navigate]);

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

  // Функция вставки переменных
  const handleInsertVariable = (variableKey: string) => {
    const textarea = contentTextareaRef.current;
    if (!textarea) return;

    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const variableText = `{{${variableKey}}}`;
    
    const newContent = 
      formData.content.substring(0, start) + 
      variableText + 
      formData.content.substring(end);
    
    setFormData({ ...formData, content: newContent });
    
    // Устанавливаем курсор после вставленной переменной
    setTimeout(() => {
      textarea.focus();
      const newPosition = start + variableText.length;
      textarea.setSelectionRange(newPosition, newPosition);
    }, 0);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    
    try {
      const newsletterData = {
        ...formData,
        // ВРЕМЕННО: Сохраняем секции в emailBlocks пока нет отдельного поля
        emailBlocks: editorMode === 'sections' ? JSON.stringify(emailSections) : 
                     editorMode === 'blocks' ? JSON.stringify(emailBlocks) : null,
        status: formData.sendImmediately ? 'sent' : 'scheduled',
        createdBy: 1
      };

      console.log('💾 Saving newsletter:', newsletterData);

      if (isEditMode && id) {
        // Update existing newsletter
        await updateNewsletter(id, newsletterData);
      } else {
        // Create new newsletter
        await createNewsletter(newsletterData);
      }
      
      navigate('/admin/newsletters');
    } catch (error) {
      console.error('❌ Error saving newsletter:', error);
      alert('Ошибка при сохранении: ' + (error as Error).message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSaveDraft = async () => {
    setIsSubmitting(true);
    
    try {
      const newsletterData = {
        ...formData,
        // ВРЕМЕННО: Сохраняем секции в emailBlocks пока нет отдельного поля
        emailBlocks: editorMode === 'sections' ? JSON.stringify(emailSections) : 
                     editorMode === 'blocks' ? JSON.stringify(emailBlocks) : null,
        status: 'draft',
        createdBy: 1
      };

      console.log('📝 Saving draft with data:', newsletterData);

      if (isEditMode && id) {
        // Update existing draft
        console.log('📝 Updating draft:', id);
        const result = await updateNewsletter(id, newsletterData);
        console.log('✅ Draft updated:', result);
      } else {
        // Create new draft
        console.log('📝 Creating new draft');
        const result = await createNewsletter(newsletterData);
        console.log('✅ Draft created:', result);
      }
      
      navigate('/admin/newsletters');
    } catch (error) {
      console.error('❌ Error saving draft:', error);
      alert('Ошибка при сохранении черновика: ' + (error as Error).message);
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
          <span className="breadcrumb-current">
            {isEditMode ? 'Редактирование рассылки' : 'Создание рассылки'}
          </span>
        </div>
        

      </div>

      <div className="create-content">
        {isLoading ? (
          <div className="loading-container">
            <div className="spinner"></div>
            <p>Загрузка данных рассылки...</p>
          </div>
        ) : (
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
                      className={editorMode === 'simple' ? 'active' : ''}
                      onClick={() => setEditorMode('simple')}
                    >
                      📝 Простой редактор
                    </button>
                    <button
                      type="button"
                      className={editorMode === 'blocks' ? 'active' : ''}
                      onClick={() => setEditorMode('blocks')}
                    >
                      🧱 Блочный конструктор
                    </button>
                    <button
                      type="button"
                      className={editorMode === 'sections' ? 'active' : ''}
                      onClick={() => setEditorMode('sections')}
                    >
                      📧 Секции с колонками
                    </button>
                  </div>
                </div>

                {editorMode === 'simple' ? (
                  <>
                    <label htmlFor="content">Текст рассылки *</label>
                    
                    {/* Панель инструментов форматирования */}
                    <div className="formatting-toolbar">
                      {/* Вставка переменных */}
                      <VariableInserter 
                        onInsert={handleInsertVariable}
                        buttonText="Переменная"
                        buttonIcon="{{}}"
                      />
                      
                      <div className="toolbar-separator"></div>
                      
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
                    
                    {/* Информация об используемых переменных */}
                    {formData.content && getUsedVariables(formData.content).length > 0 && (
                      <div className="used-variables-info">
                        <div className="used-variables-header">
                          <span className="info-icon">ℹ️</span>
                          <strong>Используемые переменные:</strong>
                        </div>
                        <div className="used-variables-list">
                          {getUsedVariables(formData.content).map((variable) => (
                            <div key={variable.key} className="variable-tag">
                              <span className="variable-key">{`{{${variable.key}}}`}</span>
                              <span className="variable-desc">{variable.description}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                    
                    <div className="newsletter-form-hint">
                      💡 Поддерживается HTML разметка для форматирования текста
                    </div>
                  </>
                ) : editorMode === 'blocks' ? (
                  <div className="newsletter-advanced-builder">
                    <SimpleEmailBuilder
                      initialBlocks={emailBlocks}
                      initialSections={emailSections}
                      onBlocksChange={setEmailBlocks}
                      onSectionsChange={setEmailSections}
                      onContentChange={(html: string) => {
                        setFormData(prev => ({ ...prev, content: html }));
                      }}
                      selectedBlockId={selectedBlockId}
                      onBlockSelect={setSelectedBlockId}
                      selectedSectionId={selectedSectionId}
                      onSectionSelect={setSelectedSectionId}
                    />
                  </div>
                ) : (
                  <div className="newsletter-advanced-builder">
                    <SimpleEmailBuilder
                      initialBlocks={[]}
                      initialSections={emailSections}
                      onBlocksChange={setEmailBlocks}
                      onSectionsChange={setEmailSections}
                      onContentChange={(html: string) => {
                        setFormData(prev => ({ ...prev, content: html }));
                      }}
                      selectedBlockId={selectedBlockId}
                      onBlockSelect={setSelectedBlockId}
                      selectedSectionId={selectedSectionId}
                      onSectionSelect={setSelectedSectionId}
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
              <button 
                type="button"
                className="cancel-btn"
                onClick={() => navigate('/admin/newsletters')}
                disabled={isSubmitting}
              >
                ← Отмена
              </button>
              
              <button 
                type="button"
                className="draft-btn"
                onClick={handleSaveDraft}
                disabled={isSubmitting || !formData.title}
              >
                {isSubmitting ? '⏳ Сохранение...' : 
                 isEditMode ? '💾 Сохранить изменения' : '💾 Сохранить черновик'}
              </button>
              
              <button 
                type="submit"
                className="create-btn"
                disabled={isSubmitting || !formData.title || !formData.subject || !formData.content}
              >
                {isSubmitting ? (isEditMode ? '⏳ Сохранение...' : '⏳ Создание...') : 
                 isEditMode ? '✅ Сохранить рассылку' : 
                 formData.sendImmediately ? '🚀 Создать и отправить' : '✅ Создать рассылку'}
              </button>
            </div>
          </form>
        )}

        {/* Предварительный просмотр */}
        <div className="newsletter-preview-container">
          <div className="newsletter-preview-header">
            <h3>👁️ Предварительный просмотр</h3>
            {getUsedVariables(formData.content).length > 0 && (
              <div className="preview-hint">
                <span className="hint-icon">💡</span>
                <span>Переменные заменены на примеры</span>
              </div>
            )}
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
              
              {editorMode === 'blocks' ? (
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
              ) : editorMode === 'sections' ? (
                <div className="newsletter-email-body interactive">
                  {emailSections.length === 0 ? (
                    <div className="empty-state">
                      <p>Добавьте секции для создания письма</p>
                    </div>
                  ) : (
                    <div>
                      {emailSections.map((section) => (
                        <div key={section.id} style={{ marginBottom: '10px' }}>
                          {/* Render section preview */}
                          <div style={{
                            backgroundColor: section.settings.backgroundColor || '#ffffff',
                            padding: `${section.settings.padding?.top || 20}px ${section.settings.padding?.right || 20}px ${section.settings.padding?.bottom || 20}px ${section.settings.padding?.left || 20}px`
                          }}>
                            <div style={{ display: 'flex', gap: '10px' }}>
                              {section.columns.map((column) => (
                                <div key={column.id} style={{ flex: `0 0 ${column.width}%`, padding: '0 10px' }}>
                                  {column.blocks.map((block: any) => (
                                    <div key={block.id} style={{ marginBottom: '15px' }}>
                                      {block.type === 'text' && (
                                        <div style={{ 
                                          fontSize: `${block.content.fontSize || 16}px`,
                                          color: block.content.color || '#333',
                                          lineHeight: 1.5
                                        }}>
                                          {block.content.text || 'Текст'}
                                        </div>
                                      )}
                                      {block.type === 'heading' && (
                                        <div style={{ 
                                          fontSize: `${block.content.fontSize || 24}px`,
                                          fontWeight: 'bold',
                                          color: block.content.color || '#333',
                                          textAlign: block.content.align || 'left'
                                        }}>
                                          {block.content.text || 'Заголовок'}
                                        </div>
                                      )}
                                      {block.type === 'image' && (
                                        <img 
                                          src={block.content.url || 'https://via.placeholder.com/300x200'} 
                                          alt={block.content.alt || ''} 
                                          style={{ maxWidth: '100%', height: 'auto' }} 
                                        />
                                      )}
                                      {block.type === 'button' && (
                                        <div style={{ textAlign: block.content.align || 'center' }}>
                                          <a 
                                            href={block.content.url || '#'} 
                                            style={{ 
                                              display: 'inline-block',
                                              padding: block.content.padding || '12px 30px',
                                              backgroundColor: block.content.backgroundColor || '#007bff',
                                              color: block.content.color || '#fff',
                                              textDecoration: 'none',
                                              borderRadius: `${block.content.borderRadius || 4}px`
                                            }}
                                          >
                                            {block.content.text || 'Button'}
                                          </a>
                                        </div>
                                      )}
                                      {block.type === 'divider' && (
                                        <hr style={{ 
                                          border: 'none', 
                                          borderTop: `${block.content.height || 1}px ${block.content.style || 'solid'} ${block.content.color || '#ddd'}` 
                                        }} />
                                      )}
                                      {block.type === 'spacer' && (
                                        <div style={{ height: `${block.content.height || 20}px` }}></div>
                                      )}
                                    </div>
                                  ))}
                                </div>
                              ))}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              ) : (
                <div className="newsletter-email-body newsletter-email-body-isolated">
                  <IsolatedPreview 
                    html={replaceWithExamples(formData.content)} 
                    className="email-content-preview"
                  />
                </div>
              )}
            </div>
          </div>
      </div>
    </div>
  );
};

export default CreateNewsletter;