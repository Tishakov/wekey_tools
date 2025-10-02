import React, { useState } from 'react';
import type { DragEvent } from 'react';
import './EmailBuilderPro.css';

// ==================== ТИПЫ ====================

export interface BlockType {
  type: 'text' | 'image' | 'button' | 'divider' | 'html' | 'social' | 'video' | 'timer' | 'menu' | 'spacer';
  icon: string;
  label: string;
}

export interface EmailBlock {
  id: string;
  type: BlockType['type'];
  content: any;
  styles: any;
}

export interface EmailColumn {
  id: string;
  width: number; // Ширина в пикселях (не в %)
  blocks: EmailBlock[];
}

export interface EmailSection {
  id: string;
  columns: EmailColumn[];
  styles: {
    backgroundColor?: string;
    padding?: string;
    backgroundImage?: string;
    columnGap?: number; // Отступ между колонками в px
  };
}

export interface EmailTemplate {
  sections: EmailSection[];
  globalStyles: {
    backgroundColor: string;
    contentWidth: number;
    fontFamily: string;
    primaryColor: string;
    textAlign: 'left' | 'center' | 'right';
    underlineLinks: boolean;
    responsive: boolean;
  };
}

// ==================== КОНСТАНТЫ ====================

const BLOCK_TYPES: BlockType[] = [
  { type: 'text', icon: '📝', label: 'Текст' },
  { type: 'image', icon: '🖼️', label: 'Изображение' },
  { type: 'button', icon: '🔘', label: 'Кнопка' },
  { type: 'divider', icon: '➖', label: 'Разделитель' },
  { type: 'html', icon: '</>', label: 'HTML' },
  { type: 'social', icon: '🌐', label: 'Соцсети' },
  { type: 'video', icon: '🎬', label: 'Видео' },
  { type: 'timer', icon: '⏰', label: 'Таймер' },
  { type: 'menu', icon: '☰', label: 'Меню' },
  { type: 'spacer', icon: '⬜', label: 'Отступ' }
];

const SECTION_LAYOUTS = [
  { cols: 1, widths: [100], label: '1 колонка' },
  { cols: 2, widths: [50, 50], label: '2 колонки' },
  { cols: 3, widths: [33.33, 33.33, 33.34], label: '3 колонки' },
  { cols: 4, widths: [25, 25, 25, 25], label: '4 колонки' }
];

// ==================== КОМПОНЕНТ ====================

const EmailBuilderPro: React.FC = () => {
  const [template, setTemplate] = useState<EmailTemplate>({
    sections: [],
    globalStyles: {
      backgroundColor: '#f5f5f5',
      contentWidth: 600,
      fontFamily: 'Arial, sans-serif',
      primaryColor: '#0066ff',
      textAlign: 'center',
      underlineLinks: true,
      responsive: true
    }
  });

  const [selectedElement, setSelectedElement] = useState<{
    type: 'section' | 'block' | null;
    sectionId?: string;
    columnId?: string;
    blockId?: string;
  }>({ type: null });

  const [leftPanel, setLeftPanel] = useState<'structures' | 'content'>('structures');
  const [history, setHistory] = useState<EmailTemplate[]>([template]);
  const [historyIndex, setHistoryIndex] = useState(0);
  const [draggedItem, setDraggedItem] = useState<any>(null);
  const [previewMode, setPreviewMode] = useState<'desktop' | 'mobile'>('desktop');
  const [isDragging, setIsDragging] = useState(false);

  // ==================== ГЕНЕРАТОРЫ ID ====================

  const generateId = () => `id_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

  // ==================== СОЗДАНИЕ ЭЛЕМЕНТОВ ====================

  const createSection = (widths: number[]): EmailSection => {
    const contentWidth = template.globalStyles.contentWidth; // Например 600px
    const columnGap = 10;
    const numColumns = widths.length;
    const totalGapWidth = (numColumns - 1) * columnGap;
    const availableWidth = contentWidth - totalGapWidth;

    // Конвертируем проценты в пиксели
    const columnWidths = widths.map(percent => Math.round((availableWidth * percent) / 100));

    return {
      id: generateId(),
      columns: columnWidths.map(width => ({
        id: generateId(),
        width, // Ширина в пикселях
        blocks: []
      })),
      styles: {
        backgroundColor: '#ffffff',
        padding: '20px 10px',
        columnGap: columnGap
      }
    };
  };

  const createBlock = (type: BlockType['type']): EmailBlock => {
    const baseBlock = {
      id: generateId(),
      type,
      content: {},
      styles: {}
    };

    switch (type) {
      case 'text':
        return {
          ...baseBlock,
          content: { html: '<p style="margin: 0;">Введите текст...</p>' },
          styles: { fontSize: '16px', color: '#333333', padding: '10px' }
        };
      case 'image':
        return {
          ...baseBlock,
          content: { url: 'https://via.placeholder.com/600x200', alt: 'Image' },
          styles: { width: '100%', padding: '10px' }
        };
      case 'button':
        return {
          ...baseBlock,
          content: { text: 'Нажмите здесь', url: '#' },
          styles: {
            backgroundColor: '#0066ff',
            color: '#ffffff',
            padding: '12px 30px',
            borderRadius: '4px',
            textAlign: 'center'
          }
        };
      case 'divider':
        return {
          ...baseBlock,
          content: { height: 1 },
          styles: { borderColor: '#dddddd', padding: '10px 0' }
        };
      case 'spacer':
        return {
          ...baseBlock,
          content: { height: 20 },
          styles: {}
        };
      case 'social':
        return {
          ...baseBlock,
          content: {
            networks: [
              { name: 'Facebook', url: '#', icon: 'facebook' },
              { name: 'Twitter', url: '#', icon: 'twitter' },
              { name: 'Instagram', url: '#', icon: 'instagram' }
            ]
          },
          styles: { padding: '10px', textAlign: 'center' }
        };
      default:
        return baseBlock;
    }
  };

  // ==================== DRAG & DROP ====================

  const handleDragStart = (e: DragEvent, item: any) => {
    setDraggedItem(item);
    setIsDragging(true);
    e.dataTransfer.effectAllowed = 'copy';
  };

  const handleDragEnd = () => {
    setIsDragging(false);
    setDraggedItem(null);
  };

  const handleDragOver = (e: DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'copy';
  };

  const handleDropSection = (e: DragEvent, insertIndex?: number) => {
    e.preventDefault();
    if (draggedItem && draggedItem.widths) {
      const newSection = createSection(draggedItem.widths);
      addSection(newSection, insertIndex);
    }
    setDraggedItem(null);
    setIsDragging(false);
  };

  const handleDropBlock = (e: DragEvent, sectionId: string, columnId: string) => {
    e.preventDefault();
    e.stopPropagation();
    
    if (draggedItem && draggedItem.type) {
      const newBlock = createBlock(draggedItem.type);
      addBlockToColumn(sectionId, columnId, newBlock);
    }
    setDraggedItem(null);
    setIsDragging(false);
  };

  // ==================== ОПЕРАЦИИ С СЕКЦИЯМИ ====================

  const addSection = (section: EmailSection, insertIndex?: number) => {
    const newSections = [...template.sections];
    if (insertIndex !== undefined) {
      newSections.splice(insertIndex, 0, section);
    } else {
      newSections.push(section);
    }
    const newTemplate = {
      ...template,
      sections: newSections
    };
    updateTemplate(newTemplate);
  };

  const deleteSection = (sectionId: string) => {
    // Сначала сбрасываем выделение
    setSelectedElement({ type: null });
    
    // Потом удаляем секцию
    const newTemplate = {
      ...template,
      sections: template.sections.filter(s => s.id !== sectionId)
    };
    updateTemplate(newTemplate);
  };

  const moveSectionUp = (sectionId: string) => {
    const index = template.sections.findIndex(s => s.id === sectionId);
    if (index > 0) {
      const newSections = [...template.sections];
      [newSections[index - 1], newSections[index]] = [newSections[index], newSections[index - 1]];
      updateTemplate({ ...template, sections: newSections });
    }
  };

  const moveSectionDown = (sectionId: string) => {
    const index = template.sections.findIndex(s => s.id === sectionId);
    if (index < template.sections.length - 1) {
      const newSections = [...template.sections];
      [newSections[index], newSections[index + 1]] = [newSections[index + 1], newSections[index]];
      updateTemplate({ ...template, sections: newSections });
    }
  };

  const duplicateSection = (sectionId: string) => {
    const sectionToDuplicate = template.sections.find(s => s.id === sectionId);
    if (!sectionToDuplicate) return;

    // Создаем глубокую копию секции с новыми ID
    const duplicatedSection: EmailSection = {
      ...sectionToDuplicate,
      id: generateId(),
      columns: sectionToDuplicate.columns.map(column => ({
        ...column,
        id: generateId(),
        blocks: column.blocks.map(block => ({
          ...block,
          id: generateId()
        }))
      }))
    };

    // Вставляем сразу после оригинальной секции
    const index = template.sections.findIndex(s => s.id === sectionId);
    addSection(duplicatedSection, index + 1);
  };

  const updateSection = (sectionId: string, updates: Partial<EmailSection>) => {
    const newTemplate = {
      ...template,
      sections: template.sections.map(s =>
        s.id === sectionId ? { ...s, ...updates } : s
      )
    };
    updateTemplate(newTemplate);
  };

  // ==================== ОПЕРАЦИИ С КОЛОНКАМИ ====================

  const moveColumnLeft = (sectionId: string, columnId: string) => {
    const section = template.sections.find(s => s.id === sectionId);
    if (!section) return;

    const columnIndex = section.columns.findIndex(c => c.id === columnId);
    if (columnIndex <= 0) return; // Уже первая колонка

    const newColumns = [...section.columns];
    [newColumns[columnIndex - 1], newColumns[columnIndex]] = 
    [newColumns[columnIndex], newColumns[columnIndex - 1]];

    updateSection(sectionId, { columns: newColumns });
  };

  const moveColumnRight = (sectionId: string, columnId: string) => {
    const section = template.sections.find(s => s.id === sectionId);
    if (!section) return;

    const columnIndex = section.columns.findIndex(c => c.id === columnId);
    if (columnIndex >= section.columns.length - 1) return; // Уже последняя

    const newColumns = [...section.columns];
    [newColumns[columnIndex], newColumns[columnIndex + 1]] = 
    [newColumns[columnIndex + 1], newColumns[columnIndex]];

    updateSection(sectionId, { columns: newColumns });
  };

  const duplicateColumn = (sectionId: string, columnId: string) => {
    const section = template.sections.find(s => s.id === sectionId);
    if (!section) return;

    const columnToDuplicate = section.columns.find(c => c.id === columnId);
    if (!columnToDuplicate) return;

    const duplicatedColumn: EmailColumn = {
      ...columnToDuplicate,
      id: generateId(),
      blocks: columnToDuplicate.blocks.map(block => ({
        ...block,
        id: generateId()
      }))
    };

    const columnIndex = section.columns.findIndex(c => c.id === columnId);
    const newColumns = [
      ...section.columns.slice(0, columnIndex + 1),
      duplicatedColumn,
      ...section.columns.slice(columnIndex + 1)
    ];

    updateSection(sectionId, { columns: newColumns });
  };

  const deleteColumn = (sectionId: string, columnId: string) => {
    const section = template.sections.find(s => s.id === sectionId);
    if (!section || section.columns.length <= 1) return; // Минимум 1 колонка

    const columnGap = section.styles.columnGap || 10;
    
    // Находим удаляемую колонку
    const deletedColumn = section.columns.find(c => c.id === columnId);
    if (!deletedColumn) return;

    // Удаляем колонку
    const remainingColumns = section.columns.filter(c => c.id !== columnId);
    
    // Вычисляем освобождённое пространство
    const freedWidth = deletedColumn.width; // Ширина удалённой колонки
    const freedGap = columnGap; // Один gap тоже освобождается
    const totalFreedSpace = freedWidth + freedGap;
    
    // Распределяем освобождённое пространство между оставшимися колонками пропорционально
    const totalCurrentWidth = remainingColumns.reduce((sum, col) => sum + col.width, 0);
    const updatedColumns = remainingColumns.map(col => {
      const proportion = col.width / totalCurrentWidth;
      const additionalWidth = Math.round(totalFreedSpace * proportion);
      return {
        ...col,
        width: col.width + additionalWidth
      };
    });

    updateSection(sectionId, { columns: updatedColumns });
  };

  // ==================== ОПЕРАЦИИ С БЛОКАМИ ====================

  const addBlockToColumn = (sectionId: string, columnId: string, block: EmailBlock) => {
    const newTemplate = {
      ...template,
      sections: template.sections.map(section => {
        if (section.id === sectionId) {
          return {
            ...section,
            columns: section.columns.map(column => {
              if (column.id === columnId) {
                return {
                  ...column,
                  blocks: [...column.blocks, block]
                };
              }
              return column;
            })
          };
        }
        return section;
      })
    };
    updateTemplate(newTemplate);
  };

  const deleteBlock = (sectionId: string, columnId: string, blockId: string) => {
    const newTemplate = {
      ...template,
      sections: template.sections.map(section => {
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
    };
    updateTemplate(newTemplate);
    if (selectedElement.blockId === blockId) {
      setSelectedElement({ type: null });
    }
  };

  const updateBlock = (sectionId: string, columnId: string, blockId: string, updates: Partial<EmailBlock>) => {
    const newTemplate = {
      ...template,
      sections: template.sections.map(section => {
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
    };
    updateTemplate(newTemplate);
  };

  // ==================== HISTORY ====================

  const updateTemplate = (newTemplate: EmailTemplate) => {
    setTemplate(newTemplate);
    const newHistory = history.slice(0, historyIndex + 1);
    newHistory.push(newTemplate);
    setHistory(newHistory);
    setHistoryIndex(newHistory.length - 1);
  };

  const undo = () => {
    if (historyIndex > 0) {
      setHistoryIndex(historyIndex - 1);
      setTemplate(history[historyIndex - 1]);
    }
  };

  const redo = () => {
    if (historyIndex < history.length - 1) {
      setHistoryIndex(historyIndex + 1);
      setTemplate(history[historyIndex + 1]);
    }
  };

  // ==================== ЭКСПОРТ ====================

  const exportHTML = () => {
    const html = generateEmailHTML(template);
    const blob = new Blob([html], { type: 'text/html' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'email-template.html';
    a.click();
    URL.revokeObjectURL(url);
  };

  const generateEmailHTML = (template: EmailTemplate): string => {
    const sectionsHTML = template.sections.map(section => {
      const columnsHTML = section.columns.map(column => {
        const blocksHTML = column.blocks.map(block => generateBlockHTML(block)).join('');
        return `
          <td width="${column.width}%" valign="top" style="padding: 10px;">
            ${blocksHTML}
          </td>
        `;
      }).join('');
      
      return `
        <tr>
          <td style="background-color: ${section.styles.backgroundColor}; padding: ${section.styles.padding};">
            <table width="100%" cellpadding="0" cellspacing="0" border="0">
              <tr>
                ${columnsHTML}
              </tr>
            </table>
          </td>
        </tr>
      `;
    }).join('');

    return `
<!DOCTYPE html>
<html lang="ru">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Email Template</title>
</head>
<body style="margin: 0; padding: 0; background-color: ${template.globalStyles.backgroundColor}; font-family: ${template.globalStyles.fontFamily};">
  <table width="100%" cellpadding="0" cellspacing="0" border="0">
    <tr>
      <td align="${template.globalStyles.textAlign}">
        <table width="${template.globalStyles.contentWidth}" cellpadding="0" cellspacing="0" border="0" style="max-width: ${template.globalStyles.contentWidth}px; margin: 0 auto;">
          ${sectionsHTML}
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
    `.trim();
  };

  const generateBlockHTML = (block: EmailBlock): string => {
    switch (block.type) {
      case 'text':
        return `<div style="font-size: ${block.styles.fontSize}; color: ${block.styles.color}; padding: ${block.styles.padding};">${block.content.html}</div>`;
      case 'image':
        return `<img src="${block.content.url}" alt="${block.content.alt}" style="width: ${block.styles.width}; display: block; padding: ${block.styles.padding};" />`;
      case 'button':
        return `<div style="text-align: ${block.styles.textAlign}; padding: 10px;"><a href="${block.content.url}" style="display: inline-block; background-color: ${block.styles.backgroundColor}; color: ${block.styles.color}; padding: ${block.styles.padding}; border-radius: ${block.styles.borderRadius}; text-decoration: none; font-weight: bold;">${block.content.text}</a></div>`;
      case 'divider':
        return `<hr style="border: none; border-top: ${block.content.height}px solid ${block.styles.borderColor}; margin: ${block.styles.padding};" />`;
      case 'spacer':
        return `<div style="height: ${block.content.height}px;"></div>`;
      default:
        return '';
    }
  };

  const saveTemplate = () => {
    // TODO: Сохранение
    console.log('Saving template:', template);
    alert('Шаблон сохранен! (В разработке: интеграция с API)');
  };

  // ==================== RENDER ====================

  return (
    <div className="email-builder-pro">
      {/* ВЕРХНЯЯ ПАНЕЛЬ */}
      <div className="top-toolbar">
        <div className="toolbar-left">
          <h1 className="toolbar-title">📧 Email Builder Pro</h1>
        </div>
        
        <div className="toolbar-center">
          <button 
            className="toolbar-btn" 
            onClick={undo} 
            disabled={historyIndex === 0}
            title="Отменить (Ctrl+Z)"
          >
            ↶ Назад
          </button>
          <button 
            className="toolbar-btn" 
            onClick={redo} 
            disabled={historyIndex === history.length - 1}
            title="Повторить (Ctrl+Y)"
          >
            ↷ Вперед
          </button>
          
          <div className="toolbar-divider"></div>
          
          <button 
            className={`toolbar-btn ${previewMode === 'desktop' ? 'active' : ''}`}
            onClick={() => setPreviewMode('desktop')}
            title="Desktop Preview"
          >
            🖥️ Desktop
          </button>
          <button 
            className={`toolbar-btn ${previewMode === 'mobile' ? 'active' : ''}`}
            onClick={() => setPreviewMode('mobile')}
            title="Mobile Preview"
          >
            � Mobile
          </button>
        </div>
        
        <div className="toolbar-right">
          <button className="toolbar-btn" onClick={exportHTML}>
            📤 Экспорт
          </button>
          <button className="toolbar-btn toolbar-btn-primary" onClick={saveTemplate}>
            💾 Сохранить
          </button>
        </div>
      </div>

      <div className="builder-workspace">
        {/* ЛЕВАЯ ПАНЕЛЬ */}
        <div className="left-panel">
          <div className="panel-tabs">
            <button
              className={`panel-tab ${leftPanel === 'structures' ? 'active' : ''}`}
              onClick={() => setLeftPanel('structures')}
            >
              📐 Структуры
            </button>
            <button
              className={`panel-tab ${leftPanel === 'content' ? 'active' : ''}`}
              onClick={() => setLeftPanel('content')}
            >
              🧱 Контент
            </button>
          </div>

          <div className="panel-content">
            {leftPanel === 'structures' ? (
              <div className="structures-panel">
                {SECTION_LAYOUTS.map((layout, idx) => (
                  <div
                    key={idx}
                    className="structure-item"
                    draggable
                    onDragStart={(e) => handleDragStart(e, layout)}
                    onDragEnd={handleDragEnd}
                  >
                    <div className="structure-visual">
                      {layout.widths.map((width, colIdx) => (
                        <div
                          key={colIdx}
                          className="structure-col"
                          style={{ width: `${width}%` }}
                        />
                      ))}
                    </div>
                    <span className="structure-label">{layout.label}</span>
                  </div>
                ))}
              </div>
            ) : (
              <div className="content-panel">
                <div className="content-blocks">
                  {BLOCK_TYPES.map((block) => (
                    <div
                      key={block.type}
                      className="content-block"
                      draggable
                      onDragStart={(e) => handleDragStart(e, block)}
                      onDragEnd={handleDragEnd}
                    >
                      <span className="content-block-icon">{block.icon}</span>
                      <span className="content-block-label">{block.label}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* РАБОЧАЯ ОБЛАСТЬ */}
        <div className="canvas-area">
          <div 
            className="email-canvas"
            style={{
              backgroundColor: template.globalStyles.backgroundColor,
              maxWidth: `${template.globalStyles.contentWidth}px`,
              fontFamily: template.globalStyles.fontFamily
            }}
          >
            {template.sections.length === 0 ? (
              <div 
                className="canvas-empty"
                onDragOver={handleDragOver}
                onDrop={(e) => handleDropSection(e)}
              >
                <div className="empty-message">
                  <span className="empty-icon">📥</span>
                  <h3>Начните создание письма</h3>
                  <p>Перетащите структуру слева для начала работы</p>
                </div>
              </div>
            ) : (
              <>
                {template.sections.map((section, sectionIndex) => (
                  <React.Fragment key={section.id}>
                    <div
                      className={`email-section ${selectedElement.sectionId === section.id ? 'selected' : ''}`}
                      onClick={(e) => {
                        e.stopPropagation();
                        setSelectedElement({ type: 'section', sectionId: section.id });
                      }}
                      style={{
                        backgroundColor: section.styles.backgroundColor,
                        padding: section.styles.padding
                      }}
                    >
                      <div 
                        className="section-columns"
                        style={{ gap: `${section.styles.columnGap || 10}px` }}
                      >
                        {section.columns.map((column, columnIndex) => (
                          <div
                            key={column.id}
                            className="email-column"
                            style={{ width: `${column.width}px` }}
                            onDragOver={handleDragOver}
                            onDrop={(e) => handleDropBlock(e, section.id, column.id)}
                          >
                            {/* Контролы колонки */}
                            <div className="column-controls">
                              <button
                                className="column-control-btn column-move-left"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  moveColumnLeft(section.id, column.id);
                                }}
                                disabled={columnIndex === 0}
                                title="Переместить влево"
                              >
                                ⬅️
                              </button>
                              <button
                                className="column-control-btn column-move-right"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  moveColumnRight(section.id, column.id);
                                }}
                                disabled={columnIndex === section.columns.length - 1}
                                title="Переместить вправо"
                              >
                                ➡️
                              </button>
                              <button
                                className="column-control-btn column-duplicate-btn"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  duplicateColumn(section.id, column.id);
                                }}
                                title="Дублировать колонку"
                              >
                                📋
                              </button>
                              <button
                                className="column-control-btn column-delete-btn"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  deleteColumn(section.id, column.id);
                                }}
                                disabled={section.columns.length <= 1}
                                title="Удалить колонку"
                              >
                                🗑️
                              </button>
                            </div>

                            {column.blocks.length === 0 ? (
                              <div className="column-empty">
                                <span className="drop-icon">📥</span>
                                <span>Drop content here</span>
                              </div>
                            ) : (
                              column.blocks.map((block) => (
                                <div
                                  key={block.id}
                                  className={`email-block block-${block.type} ${
                                    selectedElement.blockId === block.id ? 'selected' : ''
                                  }`}
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    setSelectedElement({
                                      type: 'block',
                                      sectionId: section.id,
                                      columnId: column.id,
                                      blockId: block.id
                                    });
                                  }}
                                >
                                  <BlockRenderer block={block} />
                                </div>
                              ))
                            )}
                          </div>
                        ))}
                      </div>
                      
                      {selectedElement.sectionId === section.id && (
                        <div className="section-controls">
                          <button
                            className="section-control-btn section-move-up"
                            onClick={() => moveSectionUp(section.id)}
                            disabled={sectionIndex === 0}
                            title="Переместить вверх"
                          >
                            ⬆️
                          </button>
                          <button
                            className="section-control-btn section-move-down"
                            onClick={() => moveSectionDown(section.id)}
                            disabled={sectionIndex === template.sections.length - 1}
                            title="Переместить вниз"
                          >
                            ⬇️
                          </button>
                          <button
                            className="section-control-btn section-duplicate-btn"
                            onClick={() => duplicateSection(section.id)}
                            title="Дублировать секцию"
                          >
                            📋
                          </button>
                          <button
                            className="section-control-btn section-delete-btn"
                            onClick={() => deleteSection(section.id)}
                            title="Удалить секцию"
                          >
                            🗑️
                          </button>
                        </div>
                      )}
                    </div>
                    
                    {/* Drop zone после каждой секции - показывается только при драге структуры */}
                    {isDragging && draggedItem?.widths && (
                      <div
                        className="section-drop-zone active"
                        onDragOver={handleDragOver}
                        onDrop={(e) => handleDropSection(e, sectionIndex + 1)}
                      >
                        <div className="drop-zone-hint">
                          <span className="drop-zone-icon">➕</span>
                          <span>Перетащите структуру сюда</span>
                        </div>
                      </div>
                    )}
                  </React.Fragment>
                ))}
              </>
            )}
          </div>
        </div>

        {/* ПРАВАЯ ПАНЕЛЬ */}
        <div className="right-panel">
          <div className="panel-header">
            <h3>⚙️ Настройки</h3>
          </div>
          
          <div className="panel-content">
            {selectedElement.type === null ? (
              <GlobalSettings
                styles={template.globalStyles}
                onChange={(newStyles) => setTemplate({ ...template, globalStyles: newStyles })}
              />
            ) : selectedElement.type === 'section' ? (
              <SectionSettings
                section={template.sections.find(s => s.id === selectedElement.sectionId) as EmailSection}
                onUpdate={(updates) => updateSection(selectedElement.sectionId!, updates)}
                onDelete={() => deleteSection(selectedElement.sectionId!)}
              />
            ) : (
              <BlockSettings
                block={template.sections
                  .find(s => s.id === selectedElement.sectionId)
                  ?.columns.find(c => c.id === selectedElement.columnId)
                  ?.blocks.find(b => b.id === selectedElement.blockId) as EmailBlock}
                onUpdate={(updates) =>
                  updateBlock(
                    selectedElement.sectionId!,
                    selectedElement.columnId!,
                    selectedElement.blockId!,
                    updates
                  )
                }
                onDelete={() =>
                  deleteBlock(
                    selectedElement.sectionId!,
                    selectedElement.columnId!,
                    selectedElement.blockId!
                  )
                }
              />
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
          style={block.styles}
          dangerouslySetInnerHTML={{ __html: block.content.html || '' }}
        />
      );
    case 'image':
      return (
        <img
          src={block.content.url}
          alt={block.content.alt}
          style={{ ...block.styles, display: 'block', maxWidth: '100%' }}
        />
      );
    case 'button':
      return (
        <div style={{ textAlign: block.styles.textAlign, padding: '10px' }}>
          <a
            href={block.content.url}
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
            {block.content.text}
          </a>
        </div>
      );
    case 'divider':
      return (
        <hr
          style={{
            border: 'none',
            borderTop: `${block.content.height}px solid ${block.styles.borderColor}`,
            margin: block.styles.padding
          }}
        />
      );
    case 'spacer':
      return <div style={{ height: `${block.content.height}px` }} />;
    default:
      return <div style={block.styles}>{block.type} block</div>;
  }
};

const GlobalSettings: React.FC<{
  styles: EmailTemplate['globalStyles'];
  onChange: (styles: EmailTemplate['globalStyles']) => void;
}> = ({ styles, onChange }) => {
  return (
    <div className="settings-form">
      <h4>Глобальные настройки</h4>
      
      <div className="form-group">
        <label>Цвет фона</label>
        <input
          type="color"
          value={styles.backgroundColor}
          onChange={(e) => onChange({ ...styles, backgroundColor: e.target.value })}
        />
      </div>

      <div className="form-group">
        <label>Ширина письма (px)</label>
        <input
          type="number"
          value={styles.contentWidth}
          onChange={(e) => onChange({ ...styles, contentWidth: parseInt(e.target.value) })}
          min="400"
          max="800"
        />
      </div>

      <div className="form-group">
        <label>Выравнивание</label>
        <select
          value={styles.textAlign}
          onChange={(e) => onChange({ ...styles, textAlign: e.target.value as any })}
        >
          <option value="left">Слева</option>
          <option value="center">По центру</option>
          <option value="right">Справа</option>
        </select>
      </div>

      <div className="form-group">
        <label>
          <input
            type="checkbox"
            checked={styles.underlineLinks}
            onChange={(e) => onChange({ ...styles, underlineLinks: e.target.checked })}
          />
          Подчеркивать ссылки
        </label>
      </div>

      <div className="form-group">
        <label>
          <input
            type="checkbox"
            checked={styles.responsive}
            onChange={(e) => onChange({ ...styles, responsive: e.target.checked })}
          />
          Адаптивный дизайн
        </label>
      </div>
    </div>
  );
};

const SectionSettings: React.FC<{
  section: EmailSection;
  onUpdate: (updates: Partial<EmailSection>) => void;
  onDelete: () => void;
}> = ({ section, onUpdate, onDelete }) => {
  // Защита от undefined после удаления
  if (!section || !section.styles) {
    return (
      <div className="settings-form">
        <p style={{ color: '#9ca3af', textAlign: 'center', padding: '20px' }}>
          Секция не выбрана
        </p>
      </div>
    );
  }

  // Функция для обновления ширины колонки в пикселях с пересчётом остальных
  const handleColumnWidthChange = (columnIndex: number, newWidth: number) => {
    const updatedColumns = [...section.columns];
    const oldWidth = updatedColumns[columnIndex].width;
    const widthDiff = newWidth - oldWidth;
    
    // Обновляем ширину выбранной колонки
    updatedColumns[columnIndex] = {
      ...updatedColumns[columnIndex],
      width: Math.round(newWidth)
    };

    // Если колонок больше одной, распределяем разницу между остальными
    if (updatedColumns.length > 1) {
      const otherColumns = updatedColumns.filter((_, idx) => idx !== columnIndex);
      const totalOtherWidth = otherColumns.reduce((sum, col) => sum + col.width, 0);
      
      // Пересчитываем ширину остальных колонок пропорционально
      updatedColumns.forEach((col, idx) => {
        if (idx !== columnIndex && totalOtherWidth > 0) {
          const proportion = col.width / totalOtherWidth;
          updatedColumns[idx] = {
            ...col,
            width: Math.max(50, Math.round(col.width - (widthDiff * proportion))) // Минимум 50px
          };
        }
      });
    }

    onUpdate({ columns: updatedColumns });
  };

  // Функция для изменения отступа между колонками с пересчётом ширины колонок
  const handleColumnGapChange = (newGap: number) => {
    const oldGap = section.styles.columnGap || 10;
    const gapDiff = newGap - oldGap;
    const numColumns = section.columns.length;
    
    if (numColumns <= 1) {
      // Для одной колонки просто обновляем gap
      onUpdate({ 
        styles: { 
          ...section.styles, 
          columnGap: newGap 
        } 
      });
      return;
    }

    // Вычисляем освобождённое/занятое пространство
    const totalGapDiff = gapDiff * (numColumns - 1);
    
    // Распределяем изменение между всеми колонками пропорционально
    const updatedColumns = section.columns.map((col) => {
      const totalCurrentWidth = section.columns.reduce((sum, c) => sum + c.width, 0);
      const proportion = col.width / totalCurrentWidth;
      const widthChange = Math.round(totalGapDiff * proportion);
      
      return {
        ...col,
        width: Math.max(50, col.width - widthChange) // Минимум 50px на колонку
      };
    });

    onUpdate({ 
      columns: updatedColumns,
      styles: { 
        ...section.styles, 
        columnGap: newGap 
      } 
    });
  };

  return (
    <div className="settings-form">
      <h4>Настройки секции</h4>
      
      {/* Ширина колонок */}
      {section.columns.length > 1 && (
        <div className="form-group">
          <label>Ширина колонок (px)</label>
          {section.columns.map((column, index) => (
            <div key={column.id} style={{ marginBottom: '10px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
                <label style={{ fontSize: '12px', color: '#6b7280', margin: 0 }}>
                  Колонка {index + 1}
                </label>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <button
                    onClick={() => handleColumnWidthChange(index, column.width - 10)}
                    style={{ width: '24px', height: '24px', padding: 0, fontSize: '16px' }}
                    className="btn-secondary"
                  >
                    −
                  </button>
                  <input
                    type="number"
                    value={column.width}
                    onChange={(e) => handleColumnWidthChange(index, parseInt(e.target.value) || column.width)}
                    style={{ width: '60px', textAlign: 'center', padding: '4px' }}
                    min="50"
                    max="500"
                  />
                  <button
                    onClick={() => handleColumnWidthChange(index, column.width + 10)}
                    style={{ width: '24px', height: '24px', padding: 0, fontSize: '16px' }}
                    className="btn-secondary"
                  >
                    +
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Отступ между колонками */}
      {section.columns.length > 1 && (
        <div className="form-group">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
            <label style={{ margin: 0 }}>Отступ между колонками</label>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <button
                onClick={() => handleColumnGapChange((section.styles.columnGap || 10) - 5)}
                style={{ width: '24px', height: '24px', padding: 0, fontSize: '16px' }}
                className="btn-secondary"
                disabled={(section.styles.columnGap || 10) <= 0}
              >
                −
              </button>
              <input
                type="number"
                value={section.styles.columnGap || 10}
                onChange={(e) => handleColumnGapChange(parseInt(e.target.value) || 10)}
                style={{ width: '60px', textAlign: 'center', padding: '4px' }}
                min="0"
                max="50"
              />
              <button
                onClick={() => handleColumnGapChange((section.styles.columnGap || 10) + 5)}
                style={{ width: '24px', height: '24px', padding: 0, fontSize: '16px' }}
                className="btn-secondary"
                disabled={(section.styles.columnGap || 10) >= 50}
              >
                +
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="form-group">
        <label>Цвет фона</label>
        <input
          type="color"
          value={section.styles.backgroundColor}
          onChange={(e) =>
            onUpdate({ styles: { ...section.styles, backgroundColor: e.target.value } })
          }
        />
      </div>

      <div className="form-group">
        <label>Отступы (padding)</label>
        <input
          type="text"
          value={section.styles.padding}
          onChange={(e) =>
            onUpdate({ styles: { ...section.styles, padding: e.target.value } })
          }
          placeholder="20px 10px"
        />
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
  // Защита от undefined после удаления
  if (!block || !block.type) {
    return (
      <div className="settings-form">
        <p style={{ color: '#9ca3af', textAlign: 'center', padding: '20px' }}>
          Блок не выбран
        </p>
      </div>
    );
  }

  return (
    <div className="settings-form">
      <h4>Настройки блока: {block.type}</h4>
      
      {block.type === 'text' && (
        <div className="form-group">
          <label>Текст</label>
          <textarea
            value={block.content.html}
            onChange={(e) => onUpdate({ content: { ...block.content, html: e.target.value } })}
            rows={5}
          />
        </div>
      )}

      {block.type === 'button' && (
        <>
          <div className="form-group">
            <label>Текст кнопки</label>
            <input
              type="text"
              value={block.content.text}
              onChange={(e) => onUpdate({ content: { ...block.content, text: e.target.value } })}
            />
          </div>
          <div className="form-group">
            <label>Ссылка</label>
            <input
              type="text"
              value={block.content.url}
              onChange={(e) => onUpdate({ content: { ...block.content, url: e.target.value } })}
            />
          </div>
          <div className="form-group">
            <label>Цвет фона</label>
            <input
              type="color"
              value={block.styles.backgroundColor}
              onChange={(e) =>
                onUpdate({ styles: { ...block.styles, backgroundColor: e.target.value } })
              }
            />
          </div>
        </>
      )}

      {block.type === 'image' && (
        <div className="form-group">
          <label>URL изображения</label>
          <input
            type="text"
            value={block.content.url}
            onChange={(e) => onUpdate({ content: { ...block.content, url: e.target.value } })}
          />
        </div>
      )}

      <button className="btn-danger" onClick={onDelete}>
        🗑️ Удалить блок
      </button>
    </div>
  );
};

export default EmailBuilderPro;
