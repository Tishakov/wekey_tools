import React, { useState, useEffect } from 'react';
import './SimpleEmailBuilder.css';
import RichTextEditor from './RichTextEditor';

export interface EmailBlock {
  id: string;
  type: 'text' | 'image' | 'button' | 'divider' | 'spacer';
  content: any;
  settings: {
    padding?: { top: number; right: number; bottom: number; left: number };
    margin?: { top: number; right: number; bottom: number; left: number };
    backgroundColor?: string;
    alignment?: 'left' | 'center' | 'right';
    borderRadius?: number;
    borderColor?: string;
    borderWidth?: number;
    borderStyle?: 'solid' | 'dashed' | 'dotted' | 'double';
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

  // Синхронизируем внутреннее состояние с внешними изменениями
  useEffect(() => {
    if (JSON.stringify(blocks) !== JSON.stringify(initialBlocks)) {
      setBlocks(initialBlocks);
    }
  }, [initialBlocks, blocks]);

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
    
    // Автоматически выбираем новый блок
    if (onBlockSelect) {
      onBlockSelect(newBlock.id);
    }
  };

  const updateBlock = (blockId: string, updates: Partial<EmailBlock>) => {
    const updatedBlocks = blocks.map(block =>
      block.id === blockId ? { ...block, ...updates } : block
    );
    setBlocks(updatedBlocks);
    onBlocksChange(updatedBlocks);
    generateHTML(updatedBlocks);
  };

  const getDefaultContent = (type: EmailBlock['type']) => {
    switch (type) {
      case 'text':
        return { 
          text: 'Введите ваш текст здесь...', 
          fontSize: 16, 
          color: '#333333',
          textType: 'p',
          fontWeight: 'normal',
          fontStyle: 'normal',
          textDecoration: 'none'
        };
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
        <style>
          strong, b { font-weight: bold !important; }
          em, i { font-style: italic !important; }
          u { text-decoration: underline !important; }
          a { color: #007cba !important; text-decoration: underline !important; }
          ul, ol { margin: 8px 0 !important; padding-left: 20px !important; }
          li { margin: 4px 0 !important; line-height: 1.5 !important; }
        </style>
        ${html}
      </div>
    `;
    onContentChange(fullHTML);
  };

  const blockToHTML = (block: EmailBlock): string => {
    const { padding, backgroundColor, alignment, borderRadius, borderColor, borderWidth, borderStyle } = block.settings;
    const paddingStyle = `${padding?.top || 15}px ${padding?.right || 20}px ${padding?.bottom || 15}px ${padding?.left || 20}px`;
    
    const containerStyle = `
      padding: ${paddingStyle};
      background-color: ${backgroundColor || 'transparent'};
      text-align: ${alignment || 'left'};
      border-radius: ${borderRadius || 0}px;
      border: ${borderWidth || 0}px ${borderStyle || 'solid'} ${borderColor || 'transparent'};
    `;

    switch (block.type) {
      case 'text':
        const TextTag = block.content.textType || 'div';
        // Для HTML контента используем div, чтобы сохранить внутреннее форматирование
        return `
          <div style="${containerStyle}">
            <${TextTag} style="
              margin: 0; 
              font-size: ${block.content.fontSize || 16}px; 
              color: ${block.content.color || '#333333'}; 
              line-height: 1.5;
            ">
              ${block.content.text || ''}
            </${TextTag}>
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
      <div 
        className="builder-sidebar"
        onClick={(e) => {
          // Сбрасываем выделение при клике в пустое место сайдбара
          if (e.target === e.currentTarget && onBlockSelect) {
            onBlockSelect(null);
          }
        }}
      >
        <div className="block-toolbox" onClick={(e) => e.stopPropagation()}>
          <h4>Добавить блок</h4>
          <div className="toolbox-buttons-container">
            <div className="toolbox-buttons">
              <button type="button" onClick={(e) => { e.stopPropagation(); addBlock('text'); }} className="block-btn">
                📝 Текст
              </button>
              <button type="button" onClick={(e) => { e.stopPropagation(); addBlock('image'); }} className="block-btn">
                🖼️ Изображение
              </button>
              <button type="button" onClick={(e) => { e.stopPropagation(); addBlock('button'); }} className="block-btn">
                🔘 Кнопка
              </button>
              <button type="button" onClick={(e) => { e.stopPropagation(); addBlock('divider'); }} className="block-btn">
                ➖ Разделитель
              </button>
              <button type="button" onClick={(e) => { e.stopPropagation(); addBlock('spacer'); }} className="block-btn">
                📏 Отступ
              </button>
            </div>
          </div>
        </div>

        <div className="block-settings" onClick={(e) => e.stopPropagation()}>
          {selectedBlockId ? (
            (() => {
              const selectedBlock = blocks.find(b => b.id === selectedBlockId);
              return selectedBlock ? (
                <>
                  <div className="block-settings-scroll-container">
                    <BlockSettings 
                      block={selectedBlock}
                      onUpdate={(updates: Partial<EmailBlock>) => updateBlock(selectedBlockId, updates)}
                    />
                  </div>
                </>
              ) : (
                <div className="block-settings-empty">
                  Выберите блок для редактирования его настроек
                </div>
              );
            })()
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

// Компонент настроек блока
const BlockSettings: React.FC<{
  block: EmailBlock;
  onUpdate: (updates: Partial<EmailBlock>) => void;
}> = ({ block, onUpdate }) => {
  const [textType, setTextType] = useState<'paragraph' | 'h1' | 'h2' | 'h3'>(
    block.content.textType === 'h1' ? 'h1' :
    block.content.textType === 'h2' ? 'h2' :
    block.content.textType === 'h3' ? 'h3' : 'paragraph'
  );

  const updateContent = (key: string, value: any) => {
    onUpdate({
      content: {
        ...block.content,
        [key]: value
      }
    });
  };

  const updateSettings = (key: string, value: any) => {
    onUpdate({
      settings: {
        ...block.settings,
        [key]: value
      }
    });
  };

  const handleTextTypeChange = (newType: 'paragraph' | 'h1' | 'h2' | 'h3') => {
    setTextType(newType);
    const htmlTag = newType === 'paragraph' ? 'p' : newType;
    updateContent('textType', htmlTag);
  };

  const renderContentSettings = () => {
    switch (block.type) {
      case 'text':
        return (
          <>
            <div className="block-settings-group full-width">
              <RichTextEditor
                value={block.content.text || ''}
                onChange={(value) => updateContent('text', value)}
                placeholder="Введите текст блока..."
              />
            </div>
            
            <div className="block-settings-group">
              <label className="block-settings-label">Тип текста:</label>
              <div className="block-settings-text-type">
                <button
                  type="button"
                  className={`text-type-btn ${textType === 'paragraph' ? 'active' : ''}`}
                  onClick={() => handleTextTypeChange('paragraph')}
                >
                  P
                </button>
                <button
                  type="button"
                  className={`text-type-btn ${textType === 'h1' ? 'active' : ''}`}
                  onClick={() => handleTextTypeChange('h1')}
                >
                  H1
                </button>
                <button
                  type="button"
                  className={`text-type-btn ${textType === 'h2' ? 'active' : ''}`}
                  onClick={() => handleTextTypeChange('h2')}
                >
                  H2
                </button>
                <button
                  type="button"
                  className={`text-type-btn ${textType === 'h3' ? 'active' : ''}`}
                  onClick={() => handleTextTypeChange('h3')}
                >
                  H3
                </button>
              </div>
            </div>

            <div className="block-settings-group">
              <label className="block-settings-label">Выравнивание:</label>
              <div className="block-settings-formatting">
                <button
                  type="button"
                  className={`text-type-btn alignment-btn ${(block.settings.alignment || 'left') === 'left' ? 'active' : ''}`}
                  onClick={() => updateSettings('alignment', 'left')}
                >
                  <div className="align-icon">
                    <div className="line long"></div>
                    <div className="line medium"></div>
                    <div className="line short"></div>
                    <div className="line long"></div>
                  </div>
                </button>
                <button
                  type="button"
                  className={`text-type-btn alignment-btn ${(block.settings.alignment || 'left') === 'center' ? 'active' : ''}`}
                  onClick={() => updateSettings('alignment', 'center')}
                >
                  <div className="align-icon center">
                    <div className="line medium"></div>
                    <div className="line long"></div>
                    <div className="line short"></div>
                    <div className="line long"></div>
                  </div>
                </button>
                <button
                  type="button"
                  className={`text-type-btn alignment-btn ${(block.settings.alignment || 'left') === 'right' ? 'active' : ''}`}
                  onClick={() => updateSettings('alignment', 'right')}
                >
                  <div className="align-icon right">
                    <div className="line long"></div>
                    <div className="line medium"></div>
                    <div className="line short"></div>
                    <div className="line long"></div>
                  </div>
                </button>
              </div>
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
              <label className="block-settings-label">Альтернативный текст:</label>
              <input
                className="block-settings-input"
                type="text"
                value={block.content.alt || ''}
                onChange={(e) => updateContent('alt', e.target.value)}
                placeholder="Описание изображения"
              />
            </div>
            <div className="block-settings-group">
              <label className="block-settings-label">Ширина:</label>
              <input
                className="block-settings-input"
                type="text"
                value={block.content.width || '100%'}
                onChange={(e) => updateContent('width', e.target.value)}
                placeholder="100%, 300px, и т.д."
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
              <label className="block-settings-label">Цвет фона:</label>
              <input
                className="block-settings-color"
                type="color"
                value={block.content.backgroundColor || '#6366f1'}
                onChange={(e) => updateContent('backgroundColor', e.target.value)}
              />
            </div>
            <div className="block-settings-group">
              <label className="block-settings-label">Цвет текста:</label>
              <input
                className="block-settings-color"
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
              <label className="block-settings-label">Высота (px):</label>
              <input
                className="block-settings-input"
                type="number"
                value={block.content.height || 1}
                onChange={(e) => updateContent('height', parseInt(e.target.value))}
                min="1"
                max="20"
              />
            </div>
            <div className="block-settings-group">
              <label className="block-settings-label">Цвет:</label>
              <input
                className="block-settings-color"
                type="color"
                value={block.content.color || '#e5e7eb'}
                onChange={(e) => updateContent('color', e.target.value)}
              />
            </div>
          </>
        );
      case 'spacer':
        return (
          <div className="block-settings-group">
            <label className="block-settings-label">Высота (px):</label>
            <input
              className="block-settings-input"
              type="number"
              value={block.content.height || 20}
              onChange={(e) => updateContent('height', parseInt(e.target.value))}
              min="5"
              max="100"
            />
          </div>
        );
      default:
        return null;
    }
  };

  const renderGeneralSettings = () => (
    <>
      <div className="block-settings-group">
        <label className="block-settings-label">Цвет текста:</label>
        <input
          className="block-settings-color"
          type="color"
          value={block.content.color || '#333333'}
          onChange={(e) => updateContent('color', e.target.value)}
        />
      </div>
      <div className="block-settings-group">
        <label className="block-settings-label">Скругление фона:</label>
        <input
          className="block-settings-input"
          type="number"
          value={block.settings.borderRadius || 0}
          onChange={(e) => updateSettings('borderRadius', parseInt(e.target.value))}
          min="0"
          max="50"
        />
      </div>
      <div className="block-settings-group">
        <label className="block-settings-label">Цвет фона:</label>
        <input
          className="block-settings-color"
          type="color"
          value={block.settings.backgroundColor || '#ffffff'}
          onChange={(e) => updateSettings('backgroundColor', e.target.value)}
        />
      </div>
      <div className="block-settings-group full-width">
        <label className="block-settings-label">Обводка:</label>
        <div className="border-controls">
          <div className="border-control-row">
            <div className="border-control-group">
              <label className="border-control-label">Цвет:</label>
              <input
                className="block-settings-color border-color-input"
                type="color"
                value={block.settings.borderColor || '#000000'}
                onChange={(e) => updateSettings('borderColor', e.target.value)}
              />
            </div>
            <div className="border-control-group">
              <label className="border-control-label">Толщина:</label>
              <input
                className="block-settings-input border-width-input"
                type="number"
                value={block.settings.borderWidth || 0}
                onChange={(e) => updateSettings('borderWidth', parseInt(e.target.value))}
                min="0"
                max="10"
              />
            </div>
            <div className="border-control-group">
              <label className="border-control-label">Тип:</label>
              <select
                className="block-settings-select border-style-select"
                value={block.settings.borderStyle || 'solid'}
                onChange={(e) => updateSettings('borderStyle', e.target.value)}
              >
                <option value="solid">Сплошная</option>
                <option value="dashed">Пунктир</option>
                <option value="dotted">Точки</option>
                <option value="double">Двойная</option>
              </select>
            </div>
          </div>
        </div>
      </div>
      <div className="block-settings-group full-width">
        <label className="block-settings-label">Внутренние отступы:</label>
        <div className="padding-controls">
          <div className="padding-control-item">
            <div className="padding-icon">↑</div>
            <input
              className="block-settings-input padding-input"
              type="number"
              value={block.settings.padding?.top || 15}
              onChange={(e) => updateSettings('padding', { ...block.settings.padding, top: parseInt(e.target.value) })}
              min="0"
              max="50"
            />
          </div>
          <div className="padding-control-item">
            <div className="padding-icon">↓</div>
            <input
              className="block-settings-input padding-input"
              type="number"
              value={block.settings.padding?.bottom || 15}
              onChange={(e) => updateSettings('padding', { ...block.settings.padding, bottom: parseInt(e.target.value) })}
              min="0"
              max="50"
            />
          </div>
          <div className="padding-control-item">
            <div className="padding-icon">←</div>
            <input
              className="block-settings-input padding-input"
              type="number"
              value={block.settings.padding?.left || 20}
              onChange={(e) => updateSettings('padding', { ...block.settings.padding, left: parseInt(e.target.value) })}
              min="0"
              max="50"
            />
          </div>
          <div className="padding-control-item">
            <div className="padding-icon">→</div>
            <input
              className="block-settings-input padding-input"
              type="number"
              value={block.settings.padding?.right || 20}
              onChange={(e) => updateSettings('padding', { ...block.settings.padding, right: parseInt(e.target.value) })}
              min="0"
              max="50"
            />
          </div>
        </div>
      </div>

      <div className="block-settings-group full-width">
        <label className="block-settings-label">Внешние отступы:</label>
        <div className="margin-controls">
          <div className="margin-control-item">
            <div className="margin-icon">↑</div>
            <input
              className="block-settings-input margin-input"
              type="number"
              value={block.settings.margin?.top || 0}
              onChange={(e) => updateSettings('margin', { ...block.settings.margin, top: parseInt(e.target.value) })}
              min="0"
              max="50"
            />
          </div>
          <div className="margin-control-item">
            <div className="margin-icon">↓</div>
            <input
              className="block-settings-input margin-input"
              type="number"
              value={block.settings.margin?.bottom || 0}
              onChange={(e) => updateSettings('margin', { ...block.settings.margin, bottom: parseInt(e.target.value) })}
              min="0"
              max="50"
            />
          </div>
          <div className="margin-control-item">
            <div className="margin-icon">←</div>
            <input
              className="block-settings-input margin-input"
              type="number"
              value={block.settings.margin?.left || 0}
              onChange={(e) => updateSettings('margin', { ...block.settings.margin, left: parseInt(e.target.value) })}
              min="0"
              max="50"
            />
          </div>
          <div className="margin-control-item">
            <div className="margin-icon">→</div>
            <input
              className="block-settings-input margin-input"
              type="number"
              value={block.settings.margin?.right || 0}
              onChange={(e) => updateSettings('margin', { ...block.settings.margin, right: parseInt(e.target.value) })}
              min="0"
              max="50"
            />
          </div>
        </div>
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

export default SimpleEmailBuilder;