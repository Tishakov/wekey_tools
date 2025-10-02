import React, { useState } from 'react';
import './ModernEmailBuilder.css';

// ==================== ТИПЫ ====================

export type SectionLayout = '1col' | '2col-50-50' | '2col-33-66' | '2col-66-33' | '3col' | '4col';

export interface EmailBlock {
  id: string;
  type: 'text' | 'button' | 'image' | 'divider' | 'social' | 'spacer';
  content: {
    text?: string;
    html?: string;
    buttonText?: string;
    buttonUrl?: string;
    imageUrl?: string;
    imageAlt?: string;
    height?: number;
    links?: Array<{ platform: string; url: string }>;
  };
  styles: {
    textAlign?: 'left' | 'center' | 'right';
    fontSize?: number;
    fontWeight?: string;
    color?: string;
    backgroundColor?: string;
    padding?: string;
    margin?: string;
    borderRadius?: string;
    width?: string;
  };
}

export interface EmailColumn {
  id: string;
  width: number; // процент ширины
  blocks: EmailBlock[];
  styles: {
    backgroundColor?: string;
    padding?: string;
    verticalAlign?: 'top' | 'middle' | 'bottom';
  };
}

export interface EmailSection {
  id: string;
  type: 'section';
  layout: SectionLayout;
  columns: EmailColumn[];
  styles: {
    backgroundColor?: string;
    padding?: string;
    fullWidth?: boolean;
    maxWidth?: string;
  };
}

export interface EmailTemplate {
  id?: string;
  subject: string;
  preheader?: string;
  sections: EmailSection[];
  globalStyles: {
    backgroundColor?: string;
    fontFamily?: string;
    primaryColor?: string;
  };
}

// ==================== УТИЛИТЫ ====================

const generateId = () => Math.random().toString(36).substr(2, 9);

const getLayoutColumns = (layout: SectionLayout): number[] => {
  switch (layout) {
    case '1col': return [100];
    case '2col-50-50': return [50, 50];
    case '2col-33-66': return [33, 67];
    case '2col-66-33': return [67, 33];
    case '3col': return [33, 33, 33];
    case '4col': return [25, 25, 25, 25];
    default: return [100];
  }
};

const createSection = (layout: SectionLayout): EmailSection => {
  const widths = getLayoutColumns(layout);
  
  return {
    id: generateId(),
    type: 'section',
    layout,
    columns: widths.map(width => ({
      id: generateId(),
      width,
      blocks: [],
      styles: {
        backgroundColor: 'transparent',
        padding: '10px',
        verticalAlign: 'top'
      }
    })),
    styles: {
      backgroundColor: '#ffffff',
      padding: '20px 0',
      fullWidth: false,
      maxWidth: '600px'
    }
  };
};

const createBlock = (type: EmailBlock['type']): EmailBlock => {
  const baseBlock = {
    id: generateId(),
    type,
    content: {},
    styles: {
      padding: '10px',
      textAlign: 'left' as const
    }
  };

  switch (type) {
    case 'text':
      return {
        ...baseBlock,
        content: { 
          html: '<p>Введите текст...</p>'
        },
        styles: {
          ...baseBlock.styles,
          fontSize: 14,
          color: '#333333'
        }
      };
    case 'button':
      return {
        ...baseBlock,
        content: {
          buttonText: 'Нажмите здесь',
          buttonUrl: '#'
        },
        styles: {
          ...baseBlock.styles,
          backgroundColor: '#007bff',
          color: '#ffffff',
          padding: '12px 24px',
          borderRadius: '4px',
          textAlign: 'center' as const
        }
      };
    case 'image':
      return {
        ...baseBlock,
        content: {
          imageUrl: 'https://via.placeholder.com/600x200',
          imageAlt: 'Image'
        },
        styles: {
          ...baseBlock.styles,
          width: '100%'
        }
      };
    case 'divider':
      return {
        ...baseBlock,
        content: {
          height: 1
        },
        styles: {
          ...baseBlock.styles,
          backgroundColor: '#e0e0e0',
          padding: '10px 0'
        }
      };
    case 'spacer':
      return {
        ...baseBlock,
        content: {
          height: 20
        }
      };
    case 'social':
      return {
        ...baseBlock,
        content: {
          links: [
            { platform: 'facebook', url: '#' },
            { platform: 'twitter', url: '#' },
            { platform: 'instagram', url: '#' }
          ]
        },
        styles: {
          ...baseBlock.styles,
          textAlign: 'center' as const
        }
      };
    default:
      return baseBlock;
  }
};

// ==================== КОМПОНЕНТ ====================

interface Props {
  initialTemplate?: EmailTemplate;
  onSave?: (template: EmailTemplate) => void;
  onCancel?: () => void;
}

const ModernEmailBuilder: React.FC<Props> = ({ 
  initialTemplate, 
  onSave, 
  onCancel 
}) => {
  // ========== STATE ==========
  
  const [template, setTemplate] = useState<EmailTemplate>(
    initialTemplate || {
      subject: '',
      preheader: '',
      sections: [],
      globalStyles: {
        backgroundColor: '#f5f5f5',
        fontFamily: 'Arial, sans-serif',
        primaryColor: '#007bff'
      }
    }
  );

  const [selectedSectionId, setSelectedSectionId] = useState<string | null>(null);
  const [selectedBlockId, setSelectedBlockId] = useState<string | null>(null);
  const [selectedColumnId, setSelectedColumnId] = useState<string | null>(null);
  const [sidebarTab, setSidebarTab] = useState<'sections' | 'blocks' | 'settings'>('sections');

  // ========== HANDLERS ==========

  const addSection = (layout: SectionLayout) => {
    const newSection = createSection(layout);
    setTemplate(prev => ({
      ...prev,
      sections: [...prev.sections, newSection]
    }));
    setSelectedSectionId(newSection.id);
    setSelectedBlockId(null);
    setSidebarTab('settings');
  };

  const deleteSection = (sectionId: string) => {
    setTemplate(prev => ({
      ...prev,
      sections: prev.sections.filter(s => s.id !== sectionId)
    }));
    if (selectedSectionId === sectionId) {
      setSelectedSectionId(null);
    }
  };

  const updateSection = (sectionId: string, updates: Partial<EmailSection>) => {
    setTemplate(prev => ({
      ...prev,
      sections: prev.sections.map(section =>
        section.id === sectionId ? { ...section, ...updates } : section
      )
    }));
  };

  const addBlockToColumn = (sectionId: string, columnId: string, blockType: EmailBlock['type']) => {
    const newBlock = createBlock(blockType);
    
    setTemplate(prev => ({
      ...prev,
      sections: prev.sections.map(section => {
        if (section.id === sectionId) {
          return {
            ...section,
            columns: section.columns.map(column => {
              if (column.id === columnId) {
                return {
                  ...column,
                  blocks: [...column.blocks, newBlock]
                };
              }
              return column;
            })
          };
        }
        return section;
      })
    }));

    setSelectedBlockId(newBlock.id);
    setSelectedColumnId(columnId);
    setSidebarTab('settings');
  };

  const deleteBlock = (sectionId: string, columnId: string, blockId: string) => {
    setTemplate(prev => ({
      ...prev,
      sections: prev.sections.map(section => {
        if (section.id === sectionId) {
          return {
            ...section,
            columns: section.columns.map(column => {
              if (column.id === columnId) {
                return {
                  ...column,
                  blocks: column.blocks.filter(b => b.id !== blockId)
                };
              }
              return column;
            })
          };
        }
        return section;
      })
    }));

    if (selectedBlockId === blockId) {
      setSelectedBlockId(null);
    }
  };

  const updateBlock = (sectionId: string, columnId: string, blockId: string, updates: Partial<EmailBlock>) => {
    setTemplate(prev => ({
      ...prev,
      sections: prev.sections.map(section => {
        if (section.id === sectionId) {
          return {
            ...section,
            columns: section.columns.map(column => {
              if (column.id === columnId) {
                return {
                  ...column,
                  blocks: column.blocks.map(block =>
                    block.id === blockId ? { ...block, ...updates } : block
                  )
                };
              }
              return column;
            })
          };
        }
        return section;
      })
    }));
  };

  const handleSave = () => {
    if (onSave) {
      onSave(template);
    }
  };

  // Найти выбранные элементы
  const selectedSection = template.sections.find(s => s.id === selectedSectionId);
  const selectedBlock = selectedSection?.columns
    .find(c => c.id === selectedColumnId)
    ?.blocks.find(b => b.id === selectedBlockId);

  // ========== RENDER ==========

  return (
    <div className="modern-email-builder">
      {/* ЛЕВАЯ ПАНЕЛЬ */}
      <div className="builder-sidebar">
        {/* Шапка с действиями */}
        <div className="sidebar-header">
          <h2>📧 Конструктор письма</h2>
          <div className="header-actions">
            <button onClick={onCancel} className="btn-secondary">
              Отмена
            </button>
            <button onClick={handleSave} className="btn-primary">
              💾 Сохранить
            </button>
          </div>
        </div>

        {/* Вкладки */}
        <div className="sidebar-tabs">
          <button
            className={`tab ${sidebarTab === 'sections' ? 'active' : ''}`}
            onClick={() => setSidebarTab('sections')}
          >
            📐 Секции
          </button>
          <button
            className={`tab ${sidebarTab === 'blocks' ? 'active' : ''}`}
            onClick={() => setSidebarTab('blocks')}
          >
            🧱 Блоки
          </button>
          <button
            className={`tab ${sidebarTab === 'settings' ? 'active' : ''}`}
            onClick={() => setSidebarTab('settings')}
          >
            ⚙️ Настройки
          </button>
        </div>

        {/* Контент вкладки СЕКЦИИ */}
        {sidebarTab === 'sections' && (
          <div className="tab-content">
            <div className="section-hint">
              Выберите структуру секции для добавления в письмо:
            </div>
            
            <div className="section-grid">
              <button
                className="section-btn"
                onClick={() => addSection('1col')}
                title="1 колонка (100%)"
              >
                <div className="section-visual">
                  <div className="col" style={{ width: '100%' }}></div>
                </div>
                <span>1 колонка</span>
              </button>

              <button
                className="section-btn"
                onClick={() => addSection('2col-50-50')}
                title="2 колонки (50% / 50%)"
              >
                <div className="section-visual">
                  <div className="col" style={{ width: '48%' }}></div>
                  <div className="col" style={{ width: '48%' }}></div>
                </div>
                <span>2 колонки (1:1)</span>
              </button>

              <button
                className="section-btn"
                onClick={() => addSection('2col-33-66')}
                title="2 колонки (33% / 67%)"
              >
                <div className="section-visual">
                  <div className="col" style={{ width: '30%' }}></div>
                  <div className="col" style={{ width: '65%' }}></div>
                </div>
                <span>2 колонки (1:2)</span>
              </button>

              <button
                className="section-btn"
                onClick={() => addSection('2col-66-33')}
                title="2 колонки (67% / 33%)"
              >
                <div className="section-visual">
                  <div className="col" style={{ width: '65%' }}></div>
                  <div className="col" style={{ width: '30%' }}></div>
                </div>
                <span>2 колонки (2:1)</span>
              </button>

              <button
                className="section-btn"
                onClick={() => addSection('3col')}
                title="3 колонки"
              >
                <div className="section-visual">
                  <div className="col" style={{ width: '30%' }}></div>
                  <div className="col" style={{ width: '30%' }}></div>
                  <div className="col" style={{ width: '30%' }}></div>
                </div>
                <span>3 колонки</span>
              </button>

              <button
                className="section-btn"
                onClick={() => addSection('4col')}
                title="4 колонки"
              >
                <div className="section-visual">
                  <div className="col" style={{ width: '22%' }}></div>
                  <div className="col" style={{ width: '22%' }}></div>
                  <div className="col" style={{ width: '22%' }}></div>
                  <div className="col" style={{ width: '22%' }}></div>
                </div>
                <span>4 колонки</span>
              </button>
            </div>
          </div>
        )}

        {/* Контент вкладки БЛОКИ */}
        {sidebarTab === 'blocks' && (
          <div className="tab-content">
            {selectedColumnId ? (
              <>
                <div className="section-hint">
                  Выберите блок для добавления в колонку:
                </div>
                
                <div className="blocks-grid">
                  <button
                    className="block-btn"
                    onClick={() => addBlockToColumn(selectedSectionId!, selectedColumnId, 'text')}
                  >
                    <span className="block-icon">📝</span>
                    <span>Текст</span>
                    <small style={{ fontSize: '11px', color: '#6a737d', marginTop: '-4px' }}>Параграфы, заголовки</small>
                  </button>

                  <button
                    className="block-btn"
                    onClick={() => addBlockToColumn(selectedSectionId!, selectedColumnId, 'button')}
                  >
                    <span className="block-icon">�</span>
                    <span>Кнопка</span>
                    <small style={{ fontSize: '11px', color: '#6a737d', marginTop: '-4px' }}>Call-to-action</small>
                  </button>

                  <button
                    className="block-btn"
                    onClick={() => addBlockToColumn(selectedSectionId!, selectedColumnId, 'image')}
                  >
                    <span className="block-icon">🖼️</span>
                    <span>Изображение</span>
                    <small style={{ fontSize: '11px', color: '#6a737d', marginTop: '-4px' }}>Картинка, логотип</small>
                  </button>

                  <button
                    className="block-btn"
                    onClick={() => addBlockToColumn(selectedSectionId!, selectedColumnId, 'divider')}
                  >
                    <span className="block-icon">➖</span>
                    <span>Разделитель</span>
                    <small style={{ fontSize: '11px', color: '#6a737d', marginTop: '-4px' }}>Горизонтальная линия</small>
                  </button>

                  <button
                    className="block-btn"
                    onClick={() => addBlockToColumn(selectedSectionId!, selectedColumnId, 'spacer')}
                  >
                    <span className="block-icon">⬜</span>
                    <span>Отступ</span>
                    <small style={{ fontSize: '11px', color: '#6a737d', marginTop: '-4px' }}>Пустое пространство</small>
                  </button>

                  <button
                    className="block-btn"
                    onClick={() => addBlockToColumn(selectedSectionId!, selectedColumnId, 'social')}
                  >
                    <span className="block-icon">🌐</span>
                    <span>Соцсети</span>
                    <small style={{ fontSize: '11px', color: '#6a737d', marginTop: '-4px' }}>Иконки ссылок</small>
                  </button>
                </div>
              </>
            ) : (
              <div className="empty-state">
                <p>👈 Выберите колонку в превью</p>
                <p style={{ fontSize: '14px', color: '#666' }}>
                  Кликните на любую колонку справа, чтобы добавить в неё блоки
                </p>
              </div>
            )}
          </div>
        )}

        {/* Контент вкладки НАСТРОЙКИ */}
        {sidebarTab === 'settings' && (
          <div className="tab-content settings-panel">
            {selectedBlock ? (
              <BlockSettings
                block={selectedBlock}
                onUpdate={(updates) => updateBlock(selectedSectionId!, selectedColumnId!, selectedBlockId!, updates)}
                onDelete={() => deleteBlock(selectedSectionId!, selectedColumnId!, selectedBlockId!)}
              />
            ) : selectedSection ? (
              <SectionSettings
                section={selectedSection}
                onUpdate={(updates) => updateSection(selectedSectionId!, updates)}
                onDelete={() => deleteSection(selectedSectionId!)}
              />
            ) : (
              <div className="empty-state">
                <p>⚙️ Настройки</p>
                <p style={{ fontSize: '14px', color: '#666' }}>
                  Выберите секцию или блок для редактирования
                </p>
              </div>
            )}
          </div>
        )}
      </div>

      {/* ПРАВАЯ ПАНЕЛЬ - ПРЕВЬЮ */}
      <div className="builder-preview">
        <div className="preview-header">
          <h3>📱 Превью письма</h3>
          <div className="preview-controls">
            <button title="Desktop view">🖥️</button>
            <button title="Mobile view">📱</button>
          </div>
        </div>

        <div className="preview-content" style={{ backgroundColor: template.globalStyles.backgroundColor }}>
          <div className="email-canvas" style={{ fontFamily: template.globalStyles.fontFamily }}>
            {template.sections.length === 0 ? (
              <div className="empty-canvas">
                <h3>👈 Начните с добавления секции</h3>
                <p>Перейдите на вкладку "Секции" и выберите структуру</p>
              </div>
            ) : (
              template.sections.map((section) => (
                <div
                  key={section.id}
                  className={`email-section ${selectedSectionId === section.id ? 'selected' : ''}`}
                  onClick={(e) => {
                    e.stopPropagation();
                    setSelectedSectionId(section.id);
                    setSelectedBlockId(null);
                    setSelectedColumnId(null);
                    setSidebarTab('settings');
                  }}
                  style={{
                    backgroundColor: section.styles.backgroundColor,
                    padding: section.styles.padding,
                    maxWidth: section.styles.fullWidth ? '100%' : section.styles.maxWidth,
                    margin: '0 auto'
                  }}
                >
                  <div className="section-columns">
                    {section.columns.map((column) => (
                      <div
                        key={column.id}
                        className={`email-column ${selectedColumnId === column.id ? 'selected' : ''}`}
                        onClick={(e) => {
                          e.stopPropagation();
                          setSelectedColumnId(column.id);
                          setSelectedSectionId(section.id);
                          setSelectedBlockId(null);
                          setSidebarTab('blocks');
                        }}
                        style={{
                          width: `${column.width}%`,
                          backgroundColor: column.styles.backgroundColor,
                          padding: column.styles.padding,
                          verticalAlign: column.styles.verticalAlign
                        }}
                      >
                        {column.blocks.length === 0 ? (
                          <div className="empty-column">
                            <span>➕ Добавить блок</span>
                          </div>
                        ) : (
                          column.blocks.map((block) => (
                            <div
                              key={block.id}
                              className={`email-block block-${block.type} ${selectedBlockId === block.id ? 'selected' : ''}`}
                              onClick={(e) => {
                                e.stopPropagation();
                                setSelectedBlockId(block.id);
                                setSelectedColumnId(column.id);
                                setSelectedSectionId(section.id);
                                setSidebarTab('settings');
                              }}
                            >
                              <BlockRenderer block={block} />
                            </div>
                          ))
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

// ==================== ВСПОМОГАТЕЛЬНЫЕ КОМПОНЕНТЫ ====================

const BlockRenderer: React.FC<{ block: EmailBlock }> = ({ block }) => {
  switch (block.type) {
    case 'text':
      return (
        <div
          style={{
            ...block.styles,
            fontSize: `${block.styles.fontSize}px`,
            color: block.styles.color,
            textAlign: block.styles.textAlign
          }}
          dangerouslySetInnerHTML={{ __html: block.content.html || block.content.text || '' }}
        />
      );

    case 'button':
      return (
        <div style={{ textAlign: block.styles.textAlign, padding: block.styles.padding }}>
          <a
            href={block.content.buttonUrl}
            style={{
              display: 'inline-block',
              backgroundColor: block.styles.backgroundColor,
              color: block.styles.color,
              padding: block.styles.padding,
              borderRadius: block.styles.borderRadius,
              textDecoration: 'none',
              fontWeight: 'bold'
            }}
          >
            {block.content.buttonText}
          </a>
        </div>
      );

    case 'image':
      return (
        <img
          src={block.content.imageUrl}
          alt={block.content.imageAlt}
          style={{
            width: block.styles.width,
            display: 'block',
            margin: block.styles.textAlign === 'center' ? '0 auto' : '0'
          }}
        />
      );

    case 'divider':
      return (
        <hr
          style={{
            border: 'none',
            borderTop: `${block.content.height}px solid ${block.styles.backgroundColor}`,
            margin: block.styles.padding
          }}
        />
      );

    case 'spacer':
      return <div style={{ height: `${block.content.height}px` }} />;

    case 'social':
      return (
        <div style={{ textAlign: block.styles.textAlign, padding: block.styles.padding }}>
          {block.content.links?.map((link, idx) => (
            <a
              key={idx}
              href={link.url}
              style={{ margin: '0 5px', display: 'inline-block' }}
              title={link.platform}
            >
              {link.platform === 'facebook' && '📘'}
              {link.platform === 'twitter' && '🐦'}
              {link.platform === 'instagram' && '📷'}
            </a>
          ))}
        </div>
      );

    default:
      return <div>Unknown block type</div>;
  }
};

const SectionSettings: React.FC<{
  section: EmailSection;
  onUpdate: (updates: Partial<EmailSection>) => void;
  onDelete: () => void;
}> = ({ section, onUpdate, onDelete }) => {
  return (
    <div className="settings-form">
      <h3>⚙️ Настройки секции</h3>

      <div className="form-group">
        <label>Цвет фона</label>
        <input
          type="color"
          value={section.styles.backgroundColor || '#ffffff'}
          onChange={(e) => onUpdate({
            styles: { ...section.styles, backgroundColor: e.target.value }
          })}
        />
      </div>

      <div className="form-group">
        <label>Отступы (padding)</label>
        <input
          type="text"
          value={section.styles.padding || '20px 0'}
          onChange={(e) => onUpdate({
            styles: { ...section.styles, padding: e.target.value }
          })}
          placeholder="20px 0"
        />
      </div>

      <div className="form-group">
        <label>
          <input
            type="checkbox"
            checked={section.styles.fullWidth || false}
            onChange={(e) => onUpdate({
              styles: { ...section.styles, fullWidth: e.target.checked }
            })}
          />
          <span>Полная ширина</span>
        </label>
      </div>

      <button className="btn-danger" onClick={onDelete}>
        🗑️ Удалить секцию
      </button>
    </div>
  );
};

const BlockSettings: React.FC<{
  block: EmailBlock;
  onUpdate: (updates: Partial<EmailBlock>) => void;
  onDelete: () => void;
}> = ({ block, onUpdate, onDelete }) => {
  return (
    <div className="settings-form">
      <h3>⚙️ Настройки блока: {block.type}</h3>

      {/* Текстовый блок */}
      {block.type === 'text' && (
        <>
          <div className="form-group">
            <label>Текст</label>
            <textarea
              value={block.content.html || ''}
              onChange={(e) => onUpdate({
                content: { ...block.content, html: e.target.value }
              })}
              rows={5}
            />
          </div>

          <div className="form-group">
            <label>Размер шрифта</label>
            <input
              type="number"
              value={block.styles.fontSize || 14}
              onChange={(e) => onUpdate({
                styles: { ...block.styles, fontSize: parseInt(e.target.value) }
              })}
            />
          </div>

          <div className="form-group">
            <label>Цвет текста</label>
            <input
              type="color"
              value={block.styles.color || '#333333'}
              onChange={(e) => onUpdate({
                styles: { ...block.styles, color: e.target.value }
              })}
            />
          </div>

          <div className="form-group">
            <label>Выравнивание</label>
            <select
              value={block.styles.textAlign || 'left'}
              onChange={(e) => onUpdate({
                styles: { ...block.styles, textAlign: e.target.value as any }
              })}
            >
              <option value="left">Слева</option>
              <option value="center">По центру</option>
              <option value="right">Справа</option>
            </select>
          </div>
        </>
      )}

      {/* Кнопка */}
      {block.type === 'button' && (
        <>
          <div className="form-group">
            <label>Текст кнопки</label>
            <input
              type="text"
              value={block.content.buttonText || ''}
              onChange={(e) => onUpdate({
                content: { ...block.content, buttonText: e.target.value }
              })}
            />
          </div>

          <div className="form-group">
            <label>Ссылка</label>
            <input
              type="text"
              value={block.content.buttonUrl || ''}
              onChange={(e) => onUpdate({
                content: { ...block.content, buttonUrl: e.target.value }
              })}
            />
          </div>

          <div className="form-group">
            <label>Цвет фона</label>
            <input
              type="color"
              value={block.styles.backgroundColor || '#007bff'}
              onChange={(e) => onUpdate({
                styles: { ...block.styles, backgroundColor: e.target.value }
              })}
            />
          </div>

          <div className="form-group">
            <label>Цвет текста</label>
            <input
              type="color"
              value={block.styles.color || '#ffffff'}
              onChange={(e) => onUpdate({
                styles: { ...block.styles, color: e.target.value }
              })}
            />
          </div>

          <div className="form-group">
            <label>Радиус скругления</label>
            <input
              type="text"
              value={block.styles.borderRadius || '4px'}
              onChange={(e) => onUpdate({
                styles: { ...block.styles, borderRadius: e.target.value }
              })}
            />
          </div>
        </>
      )}

      {/* Изображение */}
      {block.type === 'image' && (
        <>
          <div className="form-group">
            <label>URL изображения</label>
            <input
              type="text"
              value={block.content.imageUrl || ''}
              onChange={(e) => onUpdate({
                content: { ...block.content, imageUrl: e.target.value }
              })}
            />
          </div>

          <div className="form-group">
            <label>Alt текст</label>
            <input
              type="text"
              value={block.content.imageAlt || ''}
              onChange={(e) => onUpdate({
                content: { ...block.content, imageAlt: e.target.value }
              })}
            />
          </div>

          <div className="form-group">
            <label>Ширина</label>
            <input
              type="text"
              value={block.styles.width || '100%'}
              onChange={(e) => onUpdate({
                styles: { ...block.styles, width: e.target.value }
              })}
            />
          </div>
        </>
      )}

      {/* Разделитель */}
      {block.type === 'divider' && (
        <>
          <div className="form-group">
            <label>Толщина (px)</label>
            <input
              type="number"
              value={block.content.height || 1}
              onChange={(e) => onUpdate({
                content: { ...block.content, height: parseInt(e.target.value) }
              })}
            />
          </div>

          <div className="form-group">
            <label>Цвет</label>
            <input
              type="color"
              value={block.styles.backgroundColor || '#e0e0e0'}
              onChange={(e) => onUpdate({
                styles: { ...block.styles, backgroundColor: e.target.value }
              })}
            />
          </div>
        </>
      )}

      {/* Отступ */}
      {block.type === 'spacer' && (
        <div className="form-group">
          <label>Высота (px)</label>
          <input
            type="number"
            value={block.content.height || 20}
            onChange={(e) => onUpdate({
              content: { ...block.content, height: parseInt(e.target.value) }
            })}
          />
        </div>
      )}

      <button className="btn-danger" onClick={onDelete}>
        🗑️ Удалить блок
      </button>
    </div>
  );
};

export default ModernEmailBuilder;
