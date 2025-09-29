import React, { useState } from 'react';
import './SimpleEmailBuilder.css';

export interface EmailBlock {
  id: string;
  type: 'text' | 'image' | 'button' | 'divider' | 'spacer';
  content: any;
  settings: {
    padding?: { top: number; right: number; bottom: number; left: number };
    backgroundColor?: string;
    alignment?: 'left' | 'center' | 'right';
  };
}

interface SimpleEmailBuilderProps {
  initialBlocks?: EmailBlock[];
  onBlocksChange: (blocks: EmailBlock[]) => void;
  onContentChange: (html: string) => void;
  selectedBlockId?: string | null;
  onBlockSelect?: (blockId: string | null) => void;
}

const SimpleEmailBuilder: React.FC<SimpleEmailBuilderProps> = ({
  initialBlocks = [],
  onBlocksChange,
  onContentChange,
  selectedBlockId = null,
  onBlockSelect
}) => {
  const [blocks, setBlocks] = useState<EmailBlock[]>(initialBlocks);

  const addBlock = (type: EmailBlock['type']) => {
    const newBlock: EmailBlock = {
      id: `block-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      type,
      content: getDefaultContent(type),
      settings: getDefaultSettings()
    };

    const updatedBlocks = [...blocks, newBlock];
    setBlocks(updatedBlocks);
    onBlocksChange(updatedBlocks);
    generateHTML(updatedBlocks);
  };

  const updateBlock = (blockId: string, updates: Partial<EmailBlock>) => {
    const updatedBlocks = blocks.map(block =>
      block.id === blockId ? { ...block, ...updates } : block
    );
    setBlocks(updatedBlocks);
    onBlocksChange(updatedBlocks);
    generateHTML(updatedBlocks);
  };

  const moveBlock = (index: number, direction: 'up' | 'down') => {
    const newIndex = direction === 'up' ? index - 1 : index + 1;
    if (newIndex < 0 || newIndex >= blocks.length) return;

    const updatedBlocks = [...blocks];
    [updatedBlocks[index], updatedBlocks[newIndex]] = [updatedBlocks[newIndex], updatedBlocks[index]];
    
    setBlocks(updatedBlocks);
    onBlocksChange(updatedBlocks);
    generateHTML(updatedBlocks);
  };

  const getDefaultContent = (type: EmailBlock['type']) => {
    switch (type) {
      case 'text':
        return { text: 'Введите ваш текст здесь...', fontSize: 16, color: '#333333' };
      case 'image':
        return { src: '', alt: '', width: '100%' };
      case 'button':
        return { text: 'Нажмите здесь', url: '', backgroundColor: '#6366f1', textColor: '#ffffff' };
      case 'divider':
        return { height: 1, color: '#e5e7eb' };
      case 'spacer':
        return { height: 20 };
      default:
        return {};
    }
  };

  const getDefaultSettings = () => ({
    padding: { top: 15, right: 20, bottom: 15, left: 20 },
    backgroundColor: 'transparent',
    alignment: 'left' as const
  });

  const generateHTML = (currentBlocks: EmailBlock[]) => {
    const html = currentBlocks.map(block => blockToHTML(block)).join('');
    const fullHTML = `
      <div style="max-width: 600px; margin: 0 auto; font-family: 'Google Sans', Arial, sans-serif; background: #ffffff;">
        ${html}
      </div>
    `;
    onContentChange(fullHTML);
  };

  const blockToHTML = (block: EmailBlock): string => {
    const { padding, backgroundColor, alignment } = block.settings;
    const paddingStyle = `${padding?.top || 15}px ${padding?.right || 20}px ${padding?.bottom || 15}px ${padding?.left || 20}px`;
    
    const containerStyle = `
      padding: ${paddingStyle};
      background-color: ${backgroundColor || 'transparent'};
      text-align: ${alignment || 'left'};
    `;

    switch (block.type) {
      case 'text':
        return `
          <div style="${containerStyle}">
            <div style="margin: 0; font-size: ${block.content.fontSize || 16}px; color: ${block.content.color || '#333333'}; line-height: 1.5;">
              ${block.content.text || ''}
            </div>
          </div>
        `;
      case 'image':
        if (!block.content.src) return '';
        return `
          <div style="${containerStyle}">
            <img src="${block.content.src}" alt="${block.content.alt || ''}" 
                 style="width: ${block.content.width || '100%'}; height: auto; display: block; max-width: 100%;" />
          </div>
        `;
      case 'button':
        return `
          <div style="${containerStyle}">
            <table cellpadding="0" cellspacing="0" border="0">
              <tr>
                <td style="border-radius: 6px; background-color: ${block.content.backgroundColor || '#6366f1'};">
                  <a href="${block.content.url || '#'}" 
                     style="display: inline-block; padding: 12px 24px; color: ${block.content.textColor || '#ffffff'}; 
                            text-decoration: none; font-weight: 500; border-radius: 6px;">
                    ${block.content.text || 'Кнопка'}
                  </a>
                </td>
              </tr>
            </table>
          </div>
        `;
      case 'divider':
        return `
          <div style="${containerStyle}">
            <hr style="height: ${block.content.height || 1}px; border: none; background-color: ${block.content.color || '#e5e7eb'}; margin: 0;" />
          </div>
        `;
      case 'spacer':
        return `<div style="height: ${block.content.height || 20}px; line-height: 1;"></div>`;
      default:
        return '';
    }
  };

  return (
    <div className="simple-email-builder">
      <div className="builder-sidebar">
        <div className="block-toolbox">
          <h4>Добавить блок</h4>
          <div className="toolbox-buttons-container">
            <div className="toolbox-buttons">
              <button type="button" onClick={() => addBlock('text')} className="block-btn">
                📝 Текст
              </button>
              <button type="button" onClick={() => addBlock('image')} className="block-btn">
                🖼️ Изображение
              </button>
              <button type="button" onClick={() => addBlock('button')} className="block-btn">
                🔘 Кнопка
              </button>
              <button type="button" onClick={() => addBlock('divider')} className="block-btn">
                ➖ Разделитель
              </button>
              <button type="button" onClick={() => addBlock('spacer')} className="block-btn">
                📏 Отступ
              </button>
            </div>
          </div>
        </div>

        <div className="block-settings">
          {selectedBlockId ? (
            <>
              <div className="block-settings-scroll-container">
                <BlockSettings 
                  block={blocks.find(b => b.id === selectedBlockId)!}
                  onUpdate={(updates: Partial<EmailBlock>) => updateBlock(selectedBlockId, updates)}
                />
              </div>
            </>
          ) : (
            <div className="block-settings-empty">
              Выберите блок для редактирования его настроек
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

const getBlockLabel = (type: EmailBlock['type']): string => {
  
  const renderContent = () => {
    const style = {
      padding: `${block.settings.padding?.top || 15}px ${block.settings.padding?.right || 20}px ${block.settings.padding?.bottom || 15}px ${block.settings.padding?.left || 20}px`,
      backgroundColor: block.settings.backgroundColor || 'transparent',
      textAlign: block.settings.alignment || 'left' as const
    };

    switch (block.type) {
      case 'text':
        const TextElement = block.content.textType || 'p';
        return (
          <div style={style}>
            <TextElement
              contentEditable
              suppressContentEditableWarning
              onBlur={(e: React.FocusEvent<HTMLElement>) => {
                onUpdate({
                  content: { ...block.content, text: (e.target as HTMLElement).innerHTML }
                });
              }}
              style={{
                fontSize: `${block.content.fontSize || 16}px`,
                color: block.content.color || '#333333',
                fontWeight: block.content.fontWeight || 'normal',
                fontStyle: block.content.fontStyle || 'normal',
                textDecoration: block.content.textDecoration || 'none',
                outline: 'none',
                minHeight: '20px',
                lineHeight: '1.5',
                margin: 0
              }}
              dangerouslySetInnerHTML={{ __html: block.content.text || 'Введите текст...' }}
            />
          </div>
        );

      case 'image':
        return (
          <div style={style}>
            {block.content.src ? (
              <img
                src={block.content.src}
                alt={block.content.alt || ''}
                style={{
                  width: block.content.width || '100%',
                  height: 'auto',
                  display: 'block',
                  maxWidth: '100%'
                }}
              />
            ) : (
              <div className="image-placeholder">
                🖼️ Настройте изображение в панели ниже
              </div>
            )}
          </div>
        );

      case 'button':
        return (
          <div style={style}>
            <button
              style={{
                backgroundColor: block.content.backgroundColor || '#6366f1',
                color: block.content.textColor || '#ffffff',
                border: 'none',
                padding: '12px 24px',
                borderRadius: '6px',
                cursor: 'pointer',
                fontWeight: '500'
              }}
            >
              {block.content.text || 'Кнопка'}
            </button>
          </div>
        );

      case 'divider':
        return (
          <div style={style}>
            <hr
              style={{
                height: `${block.content.height || 1}px`,
                border: 'none',
                backgroundColor: block.content.color || '#e5e7eb',
                margin: 0
              }}
            />
          </div>
        );

      case 'spacer':
        return (
          <div style={{ height: `${block.content.height || 20}px`, position: 'relative' }}>
            <div className="spacer-label">
              Отступ: {block.content.height || 20}px
            </div>
          </div>
        );

      default:
        return <div>Неизвестный блок</div>;
    }
  };

  return (
    <div 
      className={`block-item ${isSelected ? 'selected' : ''}`}
      onClick={onSelect}
    >
      <div className="block-controls">
        <span className="block-type">{getBlockLabel(block.type)}</span>
        <div className="block-actions">
          <button type="button" onClick={(e) => { e.stopPropagation(); onMove(index, 'up'); }} disabled={index === 0}>
            ↑
          </button>
          <button type="button" onClick={(e) => { e.stopPropagation(); onMove(index, 'down'); }}>
            ↓
          </button>
          <button type="button" onClick={(e) => { e.stopPropagation(); /* TODO: настройки */ }} title="Настройки">
            ⚙️
          </button>
          <button type="button" onClick={(e) => { e.stopPropagation(); onDelete(); }} className="delete-btn">
            🗑️
          </button>
        </div>
      </div>
      <div className="block-content">
        {renderContent()}
      </div>
    </div>
  );
};



// Компонент настроек блока
const BlockSettings: React.FC<{
  block: EmailBlock;
  onUpdate: (updates: Partial<EmailBlock>) => void;
}> = ({ block, onUpdate }) => {
  
  const updateContent = (key: string, value: any) => {
    onUpdate({
      content: { ...block.content, [key]: value }
    });
  };

  const updateSettings = (key: string, value: any) => {
    onUpdate({
      settings: { ...block.settings, [key]: value }
    });
  };

  const renderContentSettings = () => {
    switch (block.type) {
      case 'text':
        return (
          <>
            <div className="block-settings-group">
              <label className="block-settings-label">Тип текста:</label>
              <select
                className="block-settings-select"
                value={block.content.textType || 'p'}
                onChange={(e) => updateContent('textType', e.target.value)}
              >
                <option value="p">Параграф</option>
                <option value="h1">Заголовок 1</option>
                <option value="h2">Заголовок 2</option>
                <option value="h3">Заголовок 3</option>
              </select>
            </div>
            <div className="block-settings-group">
              <label className="block-settings-label">Размер шрифта:</label>
              <input
                className="block-settings-input"
                type="number"
                value={block.content.fontSize || 16}
                onChange={(e) => updateContent('fontSize', parseInt(e.target.value))}
                min="8"
                max="72"
              />
            </div>
            <div className="block-settings-group">
              <label className="block-settings-label">Цвет:</label>
              <input
                className="block-settings-input"
                type="color"
                value={block.content.color || '#333333'}
                onChange={(e) => updateContent('color', e.target.value)}
              />
            </div>
            <div className="block-settings-group">
              <label className="block-settings-label">Жирный:</label>
              <input
                className="block-settings-input"
                type="checkbox"
                checked={block.content.fontWeight === 'bold'}
                onChange={(e) => updateContent('fontWeight', e.target.checked ? 'bold' : 'normal')}
              />
            </div>
            <div className="block-settings-group">
              <label className="block-settings-label">Курсив:</label>
              <input
                className="block-settings-input"
                type="checkbox"
                checked={block.content.fontStyle === 'italic'}
                onChange={(e) => updateContent('fontStyle', e.target.checked ? 'italic' : 'normal')}
              />
            </div>
            <div className="block-settings-group">
              <label className="block-settings-label">Подчеркивание:</label>
              <input
                className="block-settings-input"
                type="checkbox"
                checked={block.content.textDecoration === 'underline'}
                onChange={(e) => updateContent('textDecoration', e.target.checked ? 'underline' : 'none')}
              />
            </div>
          </>
        );

      case 'image':
        return (
          <>
            <div className="block-settings-group">
              <label className="block-settings-label">URL изображения:</label>
              <input
                className="block-settings-input"
                type="url"
                value={block.content.src || ''}
                onChange={(e) => updateContent('src', e.target.value)}
                placeholder="https://example.com/image.jpg"
              />
            </div>
            <div className="block-settings-group">
              <label className="block-settings-label">Описание:</label>
              <input
                className="block-settings-input"
                type="text"
                value={block.content.alt || ''}
                onChange={(e) => updateContent('alt', e.target.value)}
                placeholder="Описание изображения"
              />
            </div>
          </>
        );

      case 'button':
        return (
          <>
            <div className="block-settings-group">
              <label className="block-settings-label">Текст кнопки:</label>
              <input
                className="block-settings-input"
                type="text"
                value={block.content.text || ''}
                onChange={(e) => updateContent('text', e.target.value)}
                placeholder="Нажмите здесь"
              />
            </div>
            <div className="block-settings-group">
              <label className="block-settings-label">Ссылка:</label>
              <input
                className="block-settings-input"
                type="url"
                value={block.content.url || ''}
                onChange={(e) => updateContent('url', e.target.value)}
                placeholder="https://example.com"
              />
            </div>
            <div className="block-settings-group">
              <label className="block-settings-label">Цвет кнопки:</label>
              <input
                className="block-settings-input"
                type="color"
                value={block.content.backgroundColor || '#6366f1'}
                onChange={(e) => updateContent('backgroundColor', e.target.value)}
              />
            </div>
            <div className="block-settings-group">
              <label className="block-settings-label">Цвет текста:</label>
              <input
                className="block-settings-input"
                type="color"
                value={block.content.textColor || '#ffffff'}
                onChange={(e) => updateContent('textColor', e.target.value)}
              />
            </div>
          </>
        );

      case 'divider':
        return (
          <>
            <div className="block-settings-group">
              <label className="block-settings-label">Толщина:</label>
              <input
                className="block-settings-input"
                type="number"
                value={block.content.height || 1}
                onChange={(e) => updateContent('height', parseInt(e.target.value))}
                min="1"
                max="10"
              />
            </div>
            <div className="block-settings-group">
              <label className="block-settings-label">Цвет:</label>
              <input
                className="block-settings-input"
                type="color"
                value={block.content.color || '#e5e7eb'}
                onChange={(e) => updateContent('color', e.target.value)}
              />
            </div>
          </>
        );

      case 'spacer':
        return (
          <>
            <div className="block-settings-group">
              <label className="block-settings-label">Высота:</label>
              <input
                className="block-settings-input"
                type="number"
                value={block.content.height || 20}
                onChange={(e) => updateContent('height', parseInt(e.target.value))}
                min="5"
                max="200"
              />
            </div>
          </>
        );

      default:
        return null;
    }
  };

  const renderGeneralSettings = () => (
    <>
      <div className="block-settings-group">
        <label className="block-settings-label">Выравнивание:</label>
        <select
          className="block-settings-select"
          value={block.settings.alignment || 'left'}
          onChange={(e) => updateSettings('alignment', e.target.value)}
        >
          <option value="left">Слева</option>
          <option value="center">По центру</option>
          <option value="right">Справа</option>
        </select>
      </div>
      <div className="block-settings-group">
        <label className="block-settings-label">Цвет фона:</label>
        <input
          className="block-settings-input"
          type="color"
          value={block.settings.backgroundColor || '#ffffff'}
          onChange={(e) => updateSettings('backgroundColor', e.target.value === '#ffffff' ? 'transparent' : e.target.value)}
        />
      </div>
      <div className="block-settings-group">
        <label className="block-settings-label">Отступ сверху:</label>
        <input
          className="block-settings-input"
          type="number"
          value={block.settings.padding?.top || 15}
          onChange={(e) => updateSettings('padding', { ...block.settings.padding, top: parseInt(e.target.value) })}
          min="0"
          max="50"
        />
      </div>
      <div className="block-settings-group">
        <label className="block-settings-label">Отступ снизу:</label>
        <input
          className="block-settings-input"
          type="number"
          value={block.settings.padding?.bottom || 15}
          onChange={(e) => updateSettings('padding', { ...block.settings.padding, bottom: parseInt(e.target.value) })}
          min="0"
          max="50"
        />
      </div>
    </>
  );

  return (
    <div className="block-settings-content">
      {renderContentSettings()}
      {renderGeneralSettings()}
    </div>
  );
};

const getBlockLabel = (type: EmailBlock['type']): string => {
  const labels = {
    text: 'Текст',
    image: 'Изображение',
    button: 'Кнопка',
    divider: 'Разделитель',
    spacer: 'Отступ'
  };
  return labels[type] || type;
};

export default SimpleEmailBuilder;