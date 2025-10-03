import React, { useState, useEffect } from 'react';
import type { DragEvent } from 'react';
import './EmailBuilderPro.css';
import * as emailTemplateService from '../../../services/emailTemplateService';

// ==================== КОНСТАНТЫ ====================

const AUTOSAVE_DELAY = 2000; // Автосохранение через 2 секунды после изменения

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
    // Background
    backgroundColor?: string;
    backgroundImage?: string;
    backgroundPosition?: 'center' | 'top' | 'bottom' | 'left' | 'right';
    backgroundSize?: 'cover' | 'contain' | 'auto';
    backgroundRepeat?: 'no-repeat' | 'repeat' | 'repeat-x' | 'repeat-y';
    backgroundType?: 'solid' | 'gradient' | 'image';
    gradient?: {
      type: 'linear' | 'radial';
      angle: number;
      colors: Array<{ color: string; position: number }>;
    };
    
    // Spacing
    padding?: string;
    paddingTop?: number;
    paddingRight?: number;
    paddingBottom?: number;
    paddingLeft?: number;
    paddingLocked?: boolean; // Для синхронизации всех padding
    margin?: string;
    marginTop?: number;
    marginBottom?: number;
    
    // Layout
    columnGap?: number; // Отступ между колонками в px
    verticalAlign?: 'top' | 'middle' | 'bottom';
    minHeight?: string;
    height?: 'auto' | string;
    
    // Border & Shadow
    borderWidth?: number;
    borderStyle?: 'none' | 'solid' | 'dashed' | 'dotted';
    borderColor?: string;
    borderRadius?: number;
    boxShadow?: string;
    
    // Mobile Responsive
    mobileReverse?: boolean;
    mobileStack?: 'none' | 'vertical';
    
    // Visibility
    visibility?: {
      desktop?: boolean;
      mobile?: boolean;
      tablet?: boolean;
    };
    
    // Responsive Breakpoints
    responsive?: {
      desktop?: {
        columnGap?: number;
        padding?: string;
        paddingTop?: number;
        paddingRight?: number;
        paddingBottom?: number;
        paddingLeft?: number;
      };
      tablet?: {
        columnGap?: number;
        padding?: string;
        paddingTop?: number;
        paddingRight?: number;
        paddingBottom?: number;
        paddingLeft?: number;
      };
      mobile?: {
        columnGap?: number;
        padding?: string;
        paddingTop?: number;
        paddingRight?: number;
        paddingBottom?: number;
        paddingLeft?: number;
      };
    };
  };
}

export interface EmailTemplate {
  sections: EmailSection[];
  globalStyles: {
    subject: string;
    preheader: string;
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
  { cols: 2, widths: [33.33, 66.67], label: '1:2 колонки' },
  { cols: 2, widths: [66.67, 33.33], label: '2:1 колонки' },
  { cols: 3, widths: [33.33, 33.33, 33.34], label: '3 колонки' },
  { cols: 4, widths: [25, 25, 25, 25], label: '4 колонки' }
];

// ==================== КОМПОНЕНТ ====================

const EmailBuilderPro: React.FC = () => {
  const [template, setTemplate] = useState<EmailTemplate>({
    sections: [],
    globalStyles: {
      subject: 'Тема письма',
      preheader: 'Краткое описание письма',
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
  const [viewMode, setViewMode] = useState<'editor' | 'html' | 'preview'>('editor');
  const [isDragging, setIsDragging] = useState(false);
  const canvasAreaRef = React.useRef<HTMLDivElement>(null);
  const autoScrollIntervalRef = React.useRef<number | null>(null);
  const editableTextRef = React.useRef<HTMLDivElement | null>(null);
  const autosaveTimerRef = React.useRef<number | null>(null);

  // Состояния для работы с сервером
  const [currentTemplateId, setCurrentTemplateId] = useState<number | null>(null);
  const [templateName, setTemplateName] = useState<string>('Новый шаблон');
  const [isSaving, setIsSaving] = useState(false);
  const [lastSaved, setLastSaved] = useState<Date | null>(null);
  const [saveError, setSaveError] = useState<string | null>(null);

  // ==================== ЗАГРУЗКА ПОСЛЕДНЕГО ШАБЛОНА ====================

  // Загрузка последнего шаблона при монтировании компонента
  useEffect(() => {
    const loadLastTemplate = async () => {
      try {
        // Получаем список шаблонов, отсортированный по дате обновления (последний первым)
        const response = await emailTemplateService.getTemplates({ limit: 1, offset: 0 });
        
        if (response.data && response.data.length > 0) {
          const lastTemplate = response.data[0];
          
          // Загружаем данные шаблона
          setCurrentTemplateId(lastTemplate.id);
          setTemplateName(lastTemplate.name);
          
          if (lastTemplate.templateData) {
            setTemplate({
              sections: lastTemplate.templateData.sections || [],
              globalStyles: lastTemplate.templateData.globalStyles || template.globalStyles
            });
          }
          
          console.log('✅ Загружен последний шаблон:', lastTemplate.name);
        }
      } catch (error: any) {
        console.error('Ошибка загрузки шаблона:', error);
        // Не показываем ошибку пользователю, просто начинаем с пустого шаблона
      }
    };

    loadLastTemplate();
  }, []); // Пустой массив зависимостей - выполнится только один раз при монтировании

  // ==================== АВТОСОХРАНЕНИЕ ====================

  // Автосохранение при изменении template
  useEffect(() => {
    // Очищаем предыдущий таймер
    if (autosaveTimerRef.current) {
      clearTimeout(autosaveTimerRef.current);
    }

    // Пропускаем первый рендер (пустой шаблон)
    if (template.sections.length === 0 && !currentTemplateId) {
      return;
    }

    // Устанавливаем новый таймер
    autosaveTimerRef.current = window.setTimeout(async () => {
      try {
        setIsSaving(true);
        setSaveError(null);

        const templateData = {
          name: templateName,
          templateData: {
            sections: template.sections,
            globalStyles: template.globalStyles
          }
        };

        if (currentTemplateId) {
          // Обновляем существующий шаблон
          await emailTemplateService.updateTemplate(currentTemplateId, templateData);
        } else {
          // Создаём новый шаблон
          const response = await emailTemplateService.createTemplate(templateData);
          setCurrentTemplateId(response.data.id);
        }

        setLastSaved(new Date());
        setIsSaving(false);
      } catch (error: any) {
        console.error('Ошибка автосохранения:', error);
        setSaveError(error.response?.data?.message || 'Ошибка сохранения');
        setIsSaving(false);
      }
    }, AUTOSAVE_DELAY);

    return () => {
      if (autosaveTimerRef.current) {
        clearTimeout(autosaveTimerRef.current);
      }
    };
  }, [template, templateName, currentTemplateId]);

  // ==================== ВСПОМОГАТЕЛЬНЫЕ ФУНКЦИИ ДЛЯ ФОРМАТИРОВАНИЯ ====================

  const applyFormatting = (command: string, value?: string) => {
    if (editableTextRef.current) {
      editableTextRef.current.focus();
      document.execCommand(command, false, value);
    }
  };

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
        // Background
        backgroundColor: '#ffffff',
        backgroundType: 'solid',
        backgroundPosition: 'center',
        backgroundSize: 'cover',
        backgroundRepeat: 'no-repeat',
        
        // Spacing
        padding: '20px 10px',
        paddingTop: 20,
        paddingRight: 10,
        paddingBottom: 20,
        paddingLeft: 10,
        paddingLocked: true,
        marginTop: 0,
        marginBottom: 0,
        
        // Layout
        columnGap: columnGap,
        verticalAlign: 'top',
        height: 'auto',
        minHeight: 'auto',
        
        // Border & Shadow
        borderWidth: 0,
        borderStyle: 'none',
        borderColor: '#e5e7eb',
        borderRadius: 0,
        boxShadow: 'none',
        
        // Mobile
        mobileReverse: false,
        mobileStack: 'vertical',
        
        // Visibility
        visibility: {
          desktop: true,
          mobile: true,
          tablet: true
        }
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
          content: { 
            text: 'Введите текст...',
            html: '<p style="margin: 0;">Введите текст...</p>' 
          },
          styles: { 
            fontSize: '16px', 
            color: '#333333', 
            paddingTop: 10,
            paddingRight: 10,
            paddingBottom: 10,
            paddingLeft: 10,
            paddingLocked: true,
            marginTop: 0,
            marginRight: 0,
            marginBottom: 0,
            marginLeft: 0,
            marginLocked: true,
            textAlign: 'left',
            fontWeight: 'normal',
            fontStyle: 'normal',
            textDecoration: 'none',
            lineHeight: '1.5'
          }
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

  const handleAutoScroll = (e: React.DragEvent) => {
    const canvasArea = canvasAreaRef.current;
    if (!canvasArea) return;

    const rect = canvasArea.getBoundingClientRect();
    const scrollThreshold = 100; // Порог в пикселях от края
    const scrollSpeed = 10; // Скорость прокрутки

    const mouseY = e.clientY;
    const distanceFromTop = mouseY - rect.top;
    const distanceFromBottom = rect.bottom - mouseY;

    // Очищаем предыдущий интервал
    if (autoScrollIntervalRef.current) {
      clearInterval(autoScrollIntervalRef.current);
      autoScrollIntervalRef.current = null;
    }

    // Скролл вверх
    if (distanceFromTop < scrollThreshold && distanceFromTop > 0) {
      autoScrollIntervalRef.current = window.setInterval(() => {
        canvasArea.scrollTop -= scrollSpeed;
      }, 20);
    }
    // Скролл вниз
    else if (distanceFromBottom < scrollThreshold && distanceFromBottom > 0) {
      autoScrollIntervalRef.current = window.setInterval(() => {
        canvasArea.scrollTop += scrollSpeed;
      }, 20);
    }
  };

  const handleDragStart = (e: DragEvent, item: any) => {
    setDraggedItem(item);
    setIsDragging(true);
    e.dataTransfer.effectAllowed = 'copy';
  };

  const handleDragEnd = () => {
    setIsDragging(false);
    setDraggedItem(null);
    // Очищаем автоскролл
    if (autoScrollIntervalRef.current) {
      clearInterval(autoScrollIntervalRef.current);
      autoScrollIntervalRef.current = null;
    }
  };

  const handleDragOver = (e: DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'copy';
    // Добавляем автоскролл
    handleAutoScroll(e as any);
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

  const moveBlockUp = (sectionId: string, columnId: string, blockId: string) => {
    const newTemplate = {
      ...template,
      sections: template.sections.map(section => {
        if (section.id === sectionId) {
          return {
            ...section,
            columns: section.columns.map(column => {
              if (column.id === columnId) {
                const blockIndex = column.blocks.findIndex(b => b.id === blockId);
                if (blockIndex > 0) {
                  const newBlocks = [...column.blocks];
                  [newBlocks[blockIndex - 1], newBlocks[blockIndex]] = [newBlocks[blockIndex], newBlocks[blockIndex - 1]];
                  return { ...column, blocks: newBlocks };
                }
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

  const moveBlockDown = (sectionId: string, columnId: string, blockId: string) => {
    const newTemplate = {
      ...template,
      sections: template.sections.map(section => {
        if (section.id === sectionId) {
          return {
            ...section,
            columns: section.columns.map(column => {
              if (column.id === columnId) {
                const blockIndex = column.blocks.findIndex(b => b.id === blockId);
                if (blockIndex >= 0 && blockIndex < column.blocks.length - 1) {
                  const newBlocks = [...column.blocks];
                  [newBlocks[blockIndex], newBlocks[blockIndex + 1]] = [newBlocks[blockIndex + 1], newBlocks[blockIndex]];
                  return { ...column, blocks: newBlocks };
                }
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

  const duplicateBlock = (sectionId: string, columnId: string, blockId: string) => {
    const newTemplate = {
      ...template,
      sections: template.sections.map(section => {
        if (section.id === sectionId) {
          return {
            ...section,
            columns: section.columns.map(column => {
              if (column.id === columnId) {
                const blockIndex = column.blocks.findIndex(b => b.id === blockId);
                if (blockIndex >= 0) {
                  const originalBlock = column.blocks[blockIndex];
                  const duplicatedBlock = {
                    ...originalBlock,
                    id: generateId()
                  };
                  const newBlocks = [...column.blocks];
                  newBlocks.splice(blockIndex + 1, 0, duplicatedBlock);
                  return { ...column, blocks: newBlocks };
                }
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
      // Генерация стилей секции для email
      const generateSectionStyle = () => {
        const styles: string[] = [];
        
        // Background
        if (section.styles.backgroundType === 'solid') {
          styles.push(`background-color: ${section.styles.backgroundColor || '#ffffff'}`);
        } else if (section.styles.backgroundType === 'gradient' && section.styles.gradient) {
          const { type, angle, colors } = section.styles.gradient;
          if (colors && colors.length > 0) {
            const gradientColors = colors.map(c => `${c.color} ${c.position}%`).join(', ');
            const gradientStyle = type === 'linear' 
              ? `linear-gradient(${angle}deg, ${gradientColors})`
              : `radial-gradient(circle, ${gradientColors})`;
            styles.push(`background: ${gradientStyle}`);
          }
        } else if (section.styles.backgroundType === 'image' && section.styles.backgroundImage) {
          styles.push(`background-image: url(${section.styles.backgroundImage})`);
          styles.push(`background-size: ${section.styles.backgroundSize || 'cover'}`);
          styles.push(`background-position: ${section.styles.backgroundPosition || 'center'}`);
          styles.push(`background-repeat: ${section.styles.backgroundRepeat || 'no-repeat'}`);
        }
        
        // Padding
        if (section.styles.paddingTop !== undefined) {
          styles.push(`padding: ${section.styles.paddingTop}px ${section.styles.paddingRight}px ${section.styles.paddingBottom}px ${section.styles.paddingLeft}px`);
        } else {
          styles.push(`padding: ${section.styles.padding || '20px 10px'}`);
        }
        
        // Margin
        if (section.styles.marginTop || section.styles.marginBottom) {
          styles.push(`margin-top: ${section.styles.marginTop || 0}px`);
          styles.push(`margin-bottom: ${section.styles.marginBottom || 0}px`);
        }
        
        // Height
        if (section.styles.minHeight && section.styles.minHeight !== 'auto') {
          styles.push(`min-height: ${section.styles.minHeight}`);
        }
        if (section.styles.height && section.styles.height !== 'auto') {
          styles.push(`height: ${section.styles.height}`);
        }
        
        // Border
        if (section.styles.borderStyle && section.styles.borderStyle !== 'none') {
          styles.push(`border: ${section.styles.borderWidth || 1}px ${section.styles.borderStyle} ${section.styles.borderColor || '#e5e7eb'}`);
        }
        if (section.styles.borderRadius) {
          styles.push(`border-radius: ${section.styles.borderRadius}px`);
        }
        if (section.styles.boxShadow && section.styles.boxShadow !== 'none') {
          styles.push(`box-shadow: ${section.styles.boxShadow}`);
        }
        
        return styles.join('; ');
      };

      const columnsHTML = section.columns.map((column, index) => {
        const blocksHTML = column.blocks.map(block => generateBlockHTML(block)).join('');
        const valign = section.styles.verticalAlign === 'middle' ? 'middle' 
          : section.styles.verticalAlign === 'bottom' ? 'bottom' 
          : 'top';
        
        return `
          <td width="${column.width}px" valign="${valign}" style="padding: ${index < section.columns.length - 1 ? `0 ${(section.styles.columnGap || 10) / 2}px 0 0` : '0'};">
            ${blocksHTML}
          </td>
        `;
      }).join('');
      
      // Visibility check
      const isVisible = section.styles.visibility?.desktop !== false;
      if (!isVisible) return '';
      
      return `
        <tr>
          <td style="${generateSectionStyle()}">
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
  <title>${template.globalStyles.subject}</title>
  <style>
    /* Mobile Responsive Styles */
    @media only screen and (max-width: 600px) {
      .mobile-stack {
        display: block !important;
        width: 100% !important;
      }
      .mobile-hide {
        display: none !important;
      }
    }
  </style>
</head>
<body style="margin: 0; padding: 0; background-color: ${template.globalStyles.backgroundColor}; font-family: ${template.globalStyles.fontFamily};">
  <!-- Preheader (скрытый текст) -->
  <div style="display: none; max-height: 0px; overflow: hidden; mso-hide: all;">
    ${template.globalStyles.preheader}
  </div>
  
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
          <button 
            className="toolbar-btn" 
            onClick={undo} 
            disabled={historyIndex === 0}
            title="Отменить (Ctrl+Z)"
          >
            ↶
          </button>
          <button 
            className="toolbar-btn" 
            onClick={redo} 
            disabled={historyIndex === history.length - 1}
            title="Повторить (Ctrl+Y)"
          >
            ↷
          </button>
          
          <div className="toolbar-divider"></div>
          
          <button 
            className={`toolbar-btn ${viewMode === 'editor' ? 'active' : ''}`}
            onClick={() => setViewMode('editor')}
            title="Режим редактора"
          >
            ✏️ Редактор
          </button>
          <button 
            className={`toolbar-btn ${viewMode === 'html' ? 'active' : ''}`}
            onClick={() => setViewMode('html')}
            title="Показать HTML код"
          >
            &lt;/&gt; HTML
          </button>
          <button 
            className={`toolbar-btn ${viewMode === 'preview' ? 'active' : ''}`}
            onClick={() => setViewMode('preview')}
            title="Предпросмотр письма"
          >
            👁️ Предпросмотр
          </button>

          <div className="toolbar-divider"></div>

          <button 
            className={`toolbar-btn ${previewMode === 'desktop' ? 'active' : ''}`}
            onClick={() => setPreviewMode('desktop')}
            title="Desktop Preview"
          >
            🖥️
          </button>
          <button 
            className={`toolbar-btn ${previewMode === 'mobile' ? 'active' : ''}`}
            onClick={() => setPreviewMode('mobile')}
            title="Mobile Preview"
          >
            📱
          </button>
        </div>
        
        <div className="toolbar-center">
          <button className="toolbar-btn" onClick={exportHTML}>
            📤 Экспорт
          </button>
        </div>
        
        <div className="toolbar-right">
          {/* Индикатор сохранения */}
          <div className="save-indicator" style={{ marginRight: '16px', display: 'flex', alignItems: 'center', gap: '30px' }}>
            {isSaving && <span style={{ color: '#667eea', fontSize: '12px' }}>💾 Сохранение...</span>}
            {!isSaving && lastSaved && (
              <span style={{ color: '#4ade80', fontSize: '12px' }}>
                ✓ Сохранено {new Date(lastSaved).toLocaleTimeString()}
              </span>
            )}
            {saveError && <span style={{ color: '#ef4444', fontSize: '12px' }}>❌ {saveError}</span>}
            
            <input
              type="text"
              className="template-name-input"
              value={templateName}
              onChange={(e) => setTemplateName(e.target.value)}
              placeholder="Название шаблона"
            />
          </div>

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
              📐 Секции
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
        <div 
          className="canvas-area" 
          ref={canvasAreaRef}
          onClick={(e) => {
            // Сброс выделения при клике на пустую область canvas-area
            if (e.target === e.currentTarget) {
              setSelectedElement({ type: null });
            }
          }}
        >
          {viewMode === 'editor' && (
            <div 
              className="email-canvas"
              onClick={(e) => {
                // Сброс выделения при клике на canvas (но не на его дочерние элементы)
                if (e.target === e.currentTarget) {
                  setSelectedElement({ type: null });
                }
              }}
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
                onClick={() => setSelectedElement({ type: null })}
              >
                <div className="empty-message">
                  <span className="empty-icon">📥</span>
                  <h3>Начните создание письма</h3>
                  <p>Перетащите секцию слева для начала работы</p>
                </div>
              </div>
            ) : (
              <>
                {/* Drop zone перед первой секцией - показывается только при драге секции */}
                {isDragging && draggedItem?.widths && (
                  <div
                    className="section-drop-zone active"
                    onDragOver={handleDragOver}
                    onDrop={(e) => handleDropSection(e, 0)}
                  >
                    <div className="drop-zone-hint">
                      <span>Перетащите секцию сюда</span>
                    </div>
                  </div>
                )}

                {template.sections.map((section, sectionIndex) => {
                  // Генерация стилей для секции
                  const generateSectionStyles = (): React.CSSProperties => {
                    const styles: React.CSSProperties = {};
                    
                    // Background
                    if (section.styles.backgroundType === 'solid') {
                      styles.backgroundColor = section.styles.backgroundColor;
                    } else if (section.styles.backgroundType === 'gradient' && section.styles.gradient) {
                      const { type, angle, colors } = section.styles.gradient;
                      if (colors && colors.length > 0) {
                        const gradientColors = colors
                          .map(c => `${c.color} ${c.position}%`)
                          .join(', ');
                        styles.background = type === 'linear' 
                          ? `linear-gradient(${angle}deg, ${gradientColors})`
                          : `radial-gradient(circle, ${gradientColors})`;
                      }
                    } else if (section.styles.backgroundType === 'image' && section.styles.backgroundImage) {
                      styles.backgroundImage = `url(${section.styles.backgroundImage})`;
                      styles.backgroundSize = section.styles.backgroundSize || 'cover';
                      styles.backgroundPosition = section.styles.backgroundPosition || 'center';
                      styles.backgroundRepeat = section.styles.backgroundRepeat || 'no-repeat';
                    }
                    
                    // Spacing
                    if (section.styles.paddingTop !== undefined) {
                      styles.paddingTop = `${section.styles.paddingTop}px`;
                      styles.paddingRight = `${section.styles.paddingRight}px`;
                      styles.paddingBottom = `${section.styles.paddingBottom}px`;
                      styles.paddingLeft = `${section.styles.paddingLeft}px`;
                    } else {
                      styles.padding = section.styles.padding;
                    }
                    
                    if (section.styles.marginTop) {
                      styles.marginTop = `${section.styles.marginTop}px`;
                    }
                    if (section.styles.marginBottom) {
                      styles.marginBottom = `${section.styles.marginBottom}px`;
                    }
                    
                    // Layout
                    if (section.styles.minHeight && section.styles.minHeight !== 'auto') {
                      styles.minHeight = section.styles.minHeight;
                    }
                    if (section.styles.height && section.styles.height !== 'auto') {
                      styles.height = section.styles.height;
                    }
                    
                    // Border
                    if (section.styles.borderStyle && section.styles.borderStyle !== 'none') {
                      styles.border = `${section.styles.borderWidth || 1}px ${section.styles.borderStyle} ${section.styles.borderColor || '#e5e7eb'}`;
                    }
                    if (section.styles.borderRadius) {
                      styles.borderRadius = `${section.styles.borderRadius}px`;
                    }
                    if (section.styles.boxShadow && section.styles.boxShadow !== 'none') {
                      styles.boxShadow = section.styles.boxShadow;
                    }
                    
                    return styles;
                  };

                  return (
                  <React.Fragment key={section.id}>
                    <div
                      className={`email-section ${selectedElement.sectionId === section.id ? 'selected' : ''}`}
                      onClick={(e) => {
                        e.stopPropagation();
                        setSelectedElement({ type: 'section', sectionId: section.id });
                      }}
                      style={generateSectionStyles()}
                    >
                      <div 
                        className="section-columns"
                        style={{ 
                          gap: `${section.styles.columnGap || 10}px`,
                          alignItems: section.styles.verticalAlign === 'middle' ? 'center' 
                            : section.styles.verticalAlign === 'bottom' ? 'flex-end' 
                            : 'flex-start'
                        }}
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
                                <span>Перетащите блок сюда</span>
                              </div>
                            ) : (
                              column.blocks.map((block, blockIndex) => (
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
                                  {/* Контролы блока */}
                                  {selectedElement.blockId === block.id && (
                                    <div className="block-controls">
                                      <button
                                        className="block-control-btn block-move-up"
                                        onClick={(e) => {
                                          e.stopPropagation();
                                          moveBlockUp(section.id, column.id, block.id);
                                        }}
                                        disabled={blockIndex === 0}
                                        title="Переместить вверх"
                                      >
                                        ⬆️
                                      </button>
                                      <button
                                        className="block-control-btn block-move-down"
                                        onClick={(e) => {
                                          e.stopPropagation();
                                          moveBlockDown(section.id, column.id, block.id);
                                        }}
                                        disabled={blockIndex === column.blocks.length - 1}
                                        title="Переместить вниз"
                                      >
                                        ⬇️
                                      </button>
                                      <button
                                        className="block-control-btn block-duplicate-btn"
                                        onClick={(e) => {
                                          e.stopPropagation();
                                          duplicateBlock(section.id, column.id, block.id);
                                        }}
                                        title="Дублировать блок"
                                      >
                                        📋
                                      </button>
                                      <button
                                        className="block-control-btn block-delete-btn"
                                        onClick={(e) => {
                                          e.stopPropagation();
                                          deleteBlock(section.id, column.id, block.id);
                                        }}
                                        title="Удалить блок"
                                      >
                                        🗑️
                                      </button>
                                    </div>
                                  )}
                                  <BlockRenderer 
                                    block={block} 
                                    isSelected={selectedElement.blockId === block.id && block.type === 'text'}
                                    onTextChange={(html) => {
                                      updateBlock(section.id, column.id, block.id, {
                                        content: { ...block.content, text: html }
                                      });
                                    }}
                                    textRef={editableTextRef}
                                  />
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

                      {/* Индикаторы видимости секции */}
                      {section.styles.visibility && (
                        section.styles.visibility.desktop === false ||
                        section.styles.visibility.tablet === false ||
                        section.styles.visibility.mobile === false
                      ) && (
                        <div className="section-visibility-indicators">
                          {section.styles.visibility.desktop === false && (
                            <div className="visibility-indicator visibility-hidden" title="Скрыто на Desktop">
                              🖥️
                            </div>
                          )}
                          {section.styles.visibility.tablet === false && (
                            <div className="visibility-indicator visibility-hidden" title="Скрыто на Tablet">
                              📱
                            </div>
                          )}
                          {section.styles.visibility.mobile === false && (
                            <div className="visibility-indicator visibility-hidden" title="Скрыто на Mobile">
                              📱
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                    
                    {/* Drop zone после каждой секции - показывается только при драге секции */}
                    {isDragging && draggedItem?.widths && (
                      <div
                        className="section-drop-zone active"
                        onDragOver={handleDragOver}
                        onDrop={(e) => handleDropSection(e, sectionIndex + 1)}
                      >
                        <div className="drop-zone-hint">
                          <span>Перетащите секцию сюда</span>
                        </div>
                      </div>
                    )}
                  </React.Fragment>
                );
                })}
              </>
            )}
          </div>
          )}
          
          {viewMode === 'html' && (
            <div className="html-view">
              <pre className="html-code">
                <code>{generateEmailHTML(template)}</code>
              </pre>
            </div>
          )}
          
          {viewMode === 'preview' && (
            <div className="preview-view">
              <iframe 
                title="Email Preview"
                srcDoc={generateEmailHTML(template)}
                style={{
                  width: '100%',
                  height: '100%',
                  border: 'none',
                  backgroundColor: 'white'
                }}
              />
            </div>
          )}
        </div>

        {/* ПРАВАЯ ПАНЕЛЬ */}
        <div className="right-panel">
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
                applyFormatting={applyFormatting}
                editableTextRef={editableTextRef}
              />
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

// ==================== ВСПОМОГАТЕЛЬНЫЕ КОМПОНЕНТЫ ====================

const BlockRenderer: React.FC<{ 
  block: EmailBlock; 
  isSelected?: boolean;
  onTextChange?: (html: string) => void;
  textRef?: React.RefObject<HTMLDivElement>;
}> = ({ block, isSelected = false, onTextChange, textRef }) => {
  switch (block.type) {
    case 'text':
      const textContent = block.content.text || 'Введите текст...';
      const commonStyles = {
        fontSize: block.styles.fontSize,
        color: block.styles.color,
        textAlign: block.styles.textAlign as any,
        fontWeight: block.styles.fontWeight,
        fontStyle: block.styles.fontStyle,
        textDecoration: block.styles.textDecoration,
        lineHeight: block.styles.lineHeight,
        paddingTop: block.styles.paddingTop ? `${block.styles.paddingTop}px` : undefined,
        paddingRight: block.styles.paddingRight ? `${block.styles.paddingRight}px` : undefined,
        paddingBottom: block.styles.paddingBottom ? `${block.styles.paddingBottom}px` : undefined,
        paddingLeft: block.styles.paddingLeft ? `${block.styles.paddingLeft}px` : undefined,
        marginTop: block.styles.marginTop ? `${block.styles.marginTop}px` : undefined,
        marginRight: block.styles.marginRight ? `${block.styles.marginRight}px` : undefined,
        marginBottom: block.styles.marginBottom ? `${block.styles.marginBottom}px` : undefined,
        marginLeft: block.styles.marginLeft ? `${block.styles.marginLeft}px` : undefined,
        outline: isSelected ? '2px solid #667eea' : 'none',
        cursor: isSelected ? 'text' : 'default'
      };
      
      if (isSelected) {
        return (
          <div
            ref={textRef}
            contentEditable={true}
            suppressContentEditableWarning
            onInput={(e) => {
              if (onTextChange) {
                onTextChange(e.currentTarget.innerHTML);
              }
            }}
            onBlur={(e) => {
              if (onTextChange) {
                onTextChange(e.currentTarget.innerHTML);
              }
            }}
            style={commonStyles}
            dangerouslySetInnerHTML={{ __html: textContent }}
          />
        );
      } else {
        return (
          <div
            style={commonStyles}
            dangerouslySetInnerHTML={{ __html: textContent }}
          />
        );
      }
    
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
      
      {/* Email Settings */}
      <div className="form-group">
        <label>Тема письма (Subject)</label>
        <input
          type="text"
          value={styles.subject}
          onChange={(e) => onChange({ ...styles, subject: e.target.value })}
          placeholder="Введите тему письма"
        />
      </div>

      <div className="form-group">
        <label>Прехедер (Preheader)</label>
        <input
          type="text"
          value={styles.preheader}
          onChange={(e) => onChange({ ...styles, preheader: e.target.value })}
          placeholder="Краткое описание (отображается в списке писем)"
        />
        <small style={{ color: '#9ca3af', fontSize: '12px', marginTop: '4px', display: 'block' }}>
          Показывается рядом с темой в почтовых клиентах
        </small>
      </div>

      <hr style={{ border: 'none', borderTop: '1px solid #2a2a2a', margin: '16px 0' }} />
      
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

      <div className="form-group form-group-checkbox">
        <label className="toggle-switch-label">
          <input
            type="checkbox"
            checked={styles.underlineLinks}
            onChange={(e) => onChange({ ...styles, underlineLinks: e.target.checked })}
          />
          <span>Подчеркивать ссылки</span>
        </label>
      </div>

      <div className="form-group form-group-checkbox">
        <label className="toggle-switch-label">
          <input
            type="checkbox"
            checked={styles.responsive}
            onChange={(e) => onChange({ ...styles, responsive: e.target.checked })}
          />
          <span>Адаптивный дизайн</span>
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
  const [activeTab, setActiveTab] = React.useState<'layout' | 'background' | 'spacing' | 'border' | 'responsive' | 'advanced'>('layout');

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
    
    updatedColumns[columnIndex] = {
      ...updatedColumns[columnIndex],
      width: Math.round(newWidth)
    };

    if (updatedColumns.length > 1) {
      const otherColumns = updatedColumns.filter((_, idx) => idx !== columnIndex);
      const totalOtherWidth = otherColumns.reduce((sum, col) => sum + col.width, 0);
      
      updatedColumns.forEach((col, idx) => {
        if (idx !== columnIndex && totalOtherWidth > 0) {
          const proportion = col.width / totalOtherWidth;
          updatedColumns[idx] = {
            ...col,
            width: Math.max(50, Math.round(col.width - (widthDiff * proportion)))
          };
        }
      });
    }

    onUpdate({ columns: updatedColumns });
  };

  // Функция для изменения отступа между колонками
  const handleColumnGapChange = (newGap: number) => {
    const oldGap = section.styles.columnGap || 10;
    const gapDiff = newGap - oldGap;
    const numColumns = section.columns.length;
    
    if (numColumns <= 1) {
      onUpdate({ 
        styles: { 
          ...section.styles, 
          columnGap: newGap 
        } 
      });
      return;
    }

    const totalGapDiff = gapDiff * (numColumns - 1);
    const updatedColumns = section.columns.map((col) => {
      const totalCurrentWidth = section.columns.reduce((sum, c) => sum + c.width, 0);
      const proportion = col.width / totalCurrentWidth;
      const widthChange = Math.round(totalGapDiff * proportion);
      
      return {
        ...col,
        width: Math.max(50, col.width - widthChange)
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

  // Функция для быстрого выравнивания колонок
  const distributeColumnsEvenly = () => {
    const totalWidth = section.columns.reduce((sum, col) => sum + col.width, 0);
    const columnGap = section.styles.columnGap || 10;
    const numColumns = section.columns.length;
    const totalGaps = (numColumns - 1) * columnGap;
    const availableWidth = totalWidth + totalGaps;
    const evenWidth = Math.floor((availableWidth - totalGaps) / numColumns);

    const updatedColumns = section.columns.map(col => ({
      ...col,
      width: evenWidth
    }));

    onUpdate({ columns: updatedColumns });
  };

  // Функция для обновления padding
  const handlePaddingChange = (side: 'top' | 'right' | 'bottom' | 'left', value: number) => {
    const styles = { ...section.styles };
    
    if (styles.paddingLocked) {
      // Обновляем все стороны
      styles.paddingTop = value;
      styles.paddingRight = value;
      styles.paddingBottom = value;
      styles.paddingLeft = value;
      styles.padding = `${value}px`;
    } else {
      // Обновляем только одну сторону
      styles[`padding${side.charAt(0).toUpperCase() + side.slice(1)}` as keyof typeof styles] = value as any;
      styles.padding = `${styles.paddingTop || 0}px ${styles.paddingRight || 0}px ${styles.paddingBottom || 0}px ${styles.paddingLeft || 0}px`;
    }
    
    onUpdate({ styles });
  };

  // Добавление градиента
  const addGradientColor = () => {
    const gradient = section.styles.gradient || {
      type: 'linear',
      angle: 90,
      colors: []
    };

    const newColor = {
      color: '#0066ff',
      position: gradient.colors.length === 0 ? 0 : 100
    };

    onUpdate({
      styles: {
        ...section.styles,
        backgroundType: 'gradient',
        gradient: {
          ...gradient,
          colors: [...gradient.colors, newColor]
        }
      }
    });
  };

  return (
    <div className="settings-form">
      <h4>⚙️ Настройки секции</h4>
      
      {/* Табы */}
      {/* Vertical Icon Navigation */}
      <div className="section-tabs-grid">
        {[
          { id: 'layout', icon: '📐', title: 'Макет' },
          { id: 'background', icon: '🎨', title: 'Фон' },
          { id: 'spacing', icon: '📏', title: 'Отступы' },
          { id: 'border', icon: '🔲', title: 'Рамка' },
          { id: 'responsive', icon: '📱', title: 'Адаптация' },
          { id: 'advanced', icon: '⚡', title: 'Ещё' }
        ].map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as any)}
            style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              padding: '12px 8px',
              border: activeTab === tab.id 
                ? '2px solid #667eea' 
                : '2px solid transparent',
              background: activeTab === tab.id 
                ? 'rgba(102, 126, 234, 0.1)' 
                : '#28282a',
              color: activeTab === tab.id ? '#667eea' : '#9ca3af',
              cursor: 'pointer',
              borderRadius: '8px',
              fontSize: '11px',
              fontWeight: activeTab === tab.id ? '600' : '500',
              transition: 'all 0.2s ease',
              gap: '4px',
              minHeight: '60px'
            }}
            onMouseEnter={(e) => {
              if (activeTab !== tab.id) {
                e.currentTarget.style.background = '#2f2f31';
                e.currentTarget.style.transform = 'translateY(-2px)';
              }
            }}
            onMouseLeave={(e) => {
              if (activeTab !== tab.id) {
                e.currentTarget.style.background = '#28282a';
                e.currentTarget.style.transform = 'translateY(0)';
              }
            }}
          >
            <span style={{ fontSize: '20px' }}>{tab.icon}</span>
            <span style={{ textAlign: 'center' }}>{tab.title}</span>
          </button>
        ))}
      </div>

      {/* LAYOUT TAB */}
      {activeTab === 'layout' && (
        <>
          {/* Ширина колонок */}
          {section.columns.length > 1 && (
            <>
              <div className="form-group">
                <label>Ширина колонок (px)</label>
                <button
                  onClick={distributeColumnsEvenly}
                  className="distribute-columns-btn"
                >
                  ⚖️ Выровнять равномерно
                </button>
                {section.columns.map((column, index) => (
                  <div key={column.id} style={{ marginBottom: '10px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
                      <label style={{ fontSize: '12px', color: '#6b7280', margin: 0 }}>
                        Колонка {index + 1}
                      </label>
                      <div className="email-builder-number-stepper">
                        <button
                          onClick={() => handleColumnWidthChange(index, column.width - 10)}
                          className="btn-secondary number-btn"
                        >
                          −
                        </button>
                        <input
                          type="number"
                          value={column.width}
                          onChange={(e) => handleColumnWidthChange(index, parseInt(e.target.value) || column.width)}
                          min="50"
                          max="500"
                        />
                        <button
                          onClick={() => handleColumnWidthChange(index, column.width + 10)}
                          className="btn-secondary number-btn"
                        >
                          +
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {/* Отступ между колонками */}
              <div className="form-group">
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                  <label style={{ margin: 0 }}>Отступ между колонками</label>
                  <div className="email-builder-number-stepper">
                    <button
                      onClick={() => handleColumnGapChange((section.styles.columnGap || 10) - 5)}
                      className="btn-secondary number-btn"
                      disabled={(section.styles.columnGap || 10) <= 0}
                    >
                      −
                    </button>
                    <input
                      type="number"
                      value={section.styles.columnGap || 10}
                      onChange={(e) => handleColumnGapChange(parseInt(e.target.value) || 10)}
                      min="0"
                      max="50"
                    />
                    <button
                      onClick={() => handleColumnGapChange((section.styles.columnGap || 10) + 5)}
                      className="btn-secondary number-btn"
                      disabled={(section.styles.columnGap || 10) >= 50}
                    >
                      +
                    </button>
                  </div>
                </div>
              </div>
            </>
          )}

          {/* Вертикальное выравнивание */}
          <div className="form-group">
            <label>Вертикальное выравнивание</label>
            <select
              value={section.styles.verticalAlign || 'top'}
              onChange={(e) => onUpdate({ styles: { ...section.styles, verticalAlign: e.target.value as any } })}
            >
              <option value="top">Сверху</option>
              <option value="middle">По центру</option>
              <option value="bottom">Снизу</option>
            </select>
          </div>

          {/* Высота */}
          <div className="form-group">
            <label>Минимальная высота</label>
            <input
              type="text"
              value={section.styles.minHeight || 'auto'}
              onChange={(e) => onUpdate({ styles: { ...section.styles, minHeight: e.target.value } })}
              placeholder="auto, 300px"
            />
          </div>

          <div className="form-group">
            <label>Высота</label>
            <input
              type="text"
              value={section.styles.height || 'auto'}
              onChange={(e) => onUpdate({ styles: { ...section.styles, height: e.target.value } })}
              placeholder="auto, 400px"
            />
          </div>
        </>
      )}

      {/* BACKGROUND TAB */}
      {activeTab === 'background' && (
        <>
          <div className="form-group">
            <label>Тип фона</label>
            <select
              value={section.styles.backgroundType || 'solid'}
              onChange={(e) => onUpdate({ styles: { ...section.styles, backgroundType: e.target.value as any } })}
            >
              <option value="solid">Сплошной цвет</option>
              <option value="gradient">Градиент</option>
              <option value="image">Изображение</option>
            </select>
          </div>

          {section.styles.backgroundType === 'solid' && (
            <div className="form-group">
              <label>Цвет фона</label>
              <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                <input
                  type="color"
                  value={section.styles.backgroundColor || '#ffffff'}
                  onChange={(e) => onUpdate({ styles: { ...section.styles, backgroundColor: e.target.value } })}
                  style={{ width: '50px', height: '40px' }}
                />
                <input
                  type="text"
                  value={section.styles.backgroundColor || '#ffffff'}
                  onChange={(e) => onUpdate({ styles: { ...section.styles, backgroundColor: e.target.value } })}
                  style={{ flex: 1 }}
                />
              </div>
            </div>
          )}

          {section.styles.backgroundType === 'gradient' && (
            <>
              <div className="form-group">
                <label>Тип градиента</label>
                <select
                  value={section.styles.gradient?.type || 'linear'}
                  onChange={(e) => onUpdate({ 
                    styles: { 
                      ...section.styles, 
                      gradient: { 
                        ...(section.styles.gradient || { colors: [], angle: 90 }), 
                        type: e.target.value as any 
                      } 
                    } 
                  })}
                >
                  <option value="linear">Линейный</option>
                  <option value="radial">Радиальный</option>
                </select>
              </div>

              {section.styles.gradient?.type === 'linear' && (
                <div className="form-group">
                  <label>Угол (градусы)</label>
                  <input
                    type="number"
                    value={section.styles.gradient?.angle || 90}
                    onChange={(e) => onUpdate({ 
                      styles: { 
                        ...section.styles, 
                        gradient: { 
                          ...(section.styles.gradient || { colors: [], type: 'linear' }), 
                          angle: parseInt(e.target.value) || 90 
                        } 
                      } 
                    })}
                    min="0"
                    max="360"
                  />
                </div>
              )}

              <div className="form-group">
                <label>Цвета градиента</label>
                {section.styles.gradient?.colors?.map((colorStop, index) => (
                  <div key={index} style={{ display: 'flex', gap: '8px', marginBottom: '8px', alignItems: 'center' }}>
                    <input
                      type="color"
                      value={colorStop.color}
                      onChange={(e) => {
                        const newColors = [...(section.styles.gradient?.colors || [])];
                        newColors[index] = { ...newColors[index], color: e.target.value };
                        onUpdate({ 
                          styles: { 
                            ...section.styles, 
                            gradient: { 
                              ...(section.styles.gradient || { type: 'linear', angle: 90 }), 
                              colors: newColors 
                            } 
                          } 
                        });
                      }}
                      style={{ width: '40px', height: '30px' }}
                    />
                    <input
                      type="number"
                      value={colorStop.position}
                      onChange={(e) => {
                        const newColors = [...(section.styles.gradient?.colors || [])];
                        newColors[index] = { ...newColors[index], position: parseInt(e.target.value) || 0 };
                        onUpdate({ 
                          styles: { 
                            ...section.styles, 
                            gradient: { 
                              ...(section.styles.gradient || { type: 'linear', angle: 90 }), 
                              colors: newColors 
                            } 
                          } 
                        });
                      }}
                      placeholder="%"
                      min="0"
                      max="100"
                      style={{ width: '60px' }}
                    />
                    <button
                      onClick={() => {
                        const newColors = (section.styles.gradient?.colors || []).filter((_, i) => i !== index);
                        onUpdate({ 
                          styles: { 
                            ...section.styles, 
                            gradient: { 
                              ...(section.styles.gradient || { type: 'linear', angle: 90 }), 
                              colors: newColors 
                            } 
                          } 
                        });
                      }}
                      style={{ padding: '4px 8px', fontSize: '12px' }}
                      className="btn-danger"
                    >
                      ✕
                    </button>
                  </div>
                ))}
                <button 
                  onClick={addGradientColor}
                  style={{ width: '100%', padding: '6px', fontSize: '12px' }}
                  className="btn-secondary"
                >
                  ➕ Добавить цвет
                </button>
              </div>
            </>
          )}

          {section.styles.backgroundType === 'image' && (
            <>
              <div className="form-group">
                <label>URL изображения</label>
                <input
                  type="text"
                  value={section.styles.backgroundImage || ''}
                  onChange={(e) => onUpdate({ styles: { ...section.styles, backgroundImage: e.target.value } })}
                  placeholder="https://example.com/image.jpg"
                />
              </div>

              <div className="form-group">
                <label>Размер</label>
                <select
                  value={section.styles.backgroundSize || 'cover'}
                  onChange={(e) => onUpdate({ styles: { ...section.styles, backgroundSize: e.target.value as any } })}
                >
                  <option value="cover">Покрыть</option>
                  <option value="contain">Вместить</option>
                  <option value="auto">Авто</option>
                </select>
              </div>

              <div className="form-group">
                <label>Позиция</label>
                <select
                  value={section.styles.backgroundPosition || 'center'}
                  onChange={(e) => onUpdate({ styles: { ...section.styles, backgroundPosition: e.target.value as any } })}
                >
                  <option value="center">По центру</option>
                  <option value="top">Сверху</option>
                  <option value="bottom">Снизу</option>
                  <option value="left">Слева</option>
                  <option value="right">Справа</option>
                </select>
              </div>

              <div className="form-group">
                <label>Повтор</label>
                <select
                  value={section.styles.backgroundRepeat || 'no-repeat'}
                  onChange={(e) => onUpdate({ styles: { ...section.styles, backgroundRepeat: e.target.value as any } })}
                >
                  <option value="no-repeat">Без повтора</option>
                  <option value="repeat">Повторять</option>
                  <option value="repeat-x">По горизонтали</option>
                  <option value="repeat-y">По вертикали</option>
                </select>
              </div>
            </>
          )}
        </>
      )}

      {/* SPACING TAB */}
      {activeTab === 'spacing' && (
        <>
          <div className="form-group">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
              <label style={{ margin: 0 }}>Внутренние отступы</label>
              <button
                onClick={() => onUpdate({ 
                  styles: { 
                    ...section.styles, 
                    paddingLocked: !section.styles.paddingLocked 
                  } 
                })}
                style={{
                  padding: '4px 8px',
                  fontSize: '12px',
                  background: section.styles.paddingLocked ? '#0066ff' : '#f3f4f6',
                  color: section.styles.paddingLocked ? 'white' : '#6b7280',
                  border: '1px solid #d1d5db',
                  borderRadius: '4px',
                  cursor: 'pointer'
                }}
                title={section.styles.paddingLocked ? 'Отвязать отступы' : 'Связать отступы'}
              >
                {section.styles.paddingLocked ? '🔒' : '🔓'}
              </button>
            </div>
            
            {['top', 'right', 'bottom', 'left'].map(side => (
              <div key={side} style={{ marginBottom: '8px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <label style={{ fontSize: '12px', color: '#6b7280', margin: 0, width: '60px' }}>
                    {side === 'top' ? 'Сверху' : side === 'right' ? 'Справа' : side === 'bottom' ? 'Снизу' : 'Слева'}
                  </label>
                  <div className="email-builder-number-stepper">
                    <button
                      onClick={() => handlePaddingChange(side as any, (section.styles[`padding${side.charAt(0).toUpperCase() + side.slice(1)}` as keyof typeof section.styles] as number || 0) - 5)}
                      className="btn-secondary number-btn"
                    >
                      −
                    </button>
                    <input
                      type="number"
                      value={section.styles[`padding${side.charAt(0).toUpperCase() + side.slice(1)}` as keyof typeof section.styles] as number || 0}
                      onChange={(e) => handlePaddingChange(side as any, parseInt(e.target.value) || 0)}
                      min="0"
                      disabled={section.styles.paddingLocked && side !== 'top'}
                    />
                    <button
                      onClick={() => handlePaddingChange(side as any, (section.styles[`padding${side.charAt(0).toUpperCase() + side.slice(1)}` as keyof typeof section.styles] as number || 0) + 5)}
                      className="btn-secondary number-btn"
                    >
                      +
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>

          <div className="form-group">
            <label>Внешние отступы</label>
            
            <div style={{ marginBottom: '8px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <label style={{ fontSize: '12px', color: '#6b7280', margin: 0, width: '60px' }}>
                  Сверху
                </label>
                <div className="email-builder-number-stepper">
                  <button
                    onClick={() => onUpdate({ styles: { ...section.styles, marginTop: (section.styles.marginTop || 0) - 5 } })}
                    className="btn-secondary number-btn"
                  >
                    −
                  </button>
                  <input
                    type="number"
                    value={section.styles.marginTop || 0}
                    onChange={(e) => onUpdate({ styles: { ...section.styles, marginTop: parseInt(e.target.value) || 0 } })}
                    min="0"
                  />
                  <button
                    onClick={() => onUpdate({ styles: { ...section.styles, marginTop: (section.styles.marginTop || 0) + 5 } })}
                    className="btn-secondary number-btn"
                  >
                    +
                  </button>
                </div>
              </div>
            </div>

            <div style={{ marginBottom: '8px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <label style={{ fontSize: '12px', color: '#6b7280', margin: 0, width: '60px' }}>
                  Снизу
                </label>
                <div className="email-builder-number-stepper">
                  <button
                    onClick={() => onUpdate({ styles: { ...section.styles, marginBottom: (section.styles.marginBottom || 0) - 5 } })}
                    className="btn-secondary number-btn"
                  >
                    −
                  </button>
                  <input
                    type="number"
                    value={section.styles.marginBottom || 0}
                    onChange={(e) => onUpdate({ styles: { ...section.styles, marginBottom: parseInt(e.target.value) || 0 } })}
                    min="0"
                  />
                  <button
                    onClick={() => onUpdate({ styles: { ...section.styles, marginBottom: (section.styles.marginBottom || 0) + 5 } })}
                    className="btn-secondary number-btn"
                  >
                    +
                  </button>
                </div>
              </div>
            </div>
          </div>
        </>
      )}

      {/* BORDER TAB */}
      {activeTab === 'border' && (
        <>
          <div className="form-group">
            <label>Стиль рамки</label>
            <select
              value={section.styles.borderStyle || 'none'}
              onChange={(e) => onUpdate({ styles: { ...section.styles, borderStyle: e.target.value as any } })}
            >
              <option value="none">Нет</option>
              <option value="solid">Сплошная</option>
              <option value="dashed">Пунктирная</option>
              <option value="dotted">Точечная</option>
            </select>
          </div>

          {section.styles.borderStyle !== 'none' && (
            <>
              <div className="form-group">
                <label>Толщина рамки (px)</label>
                <input
                  type="number"
                  value={section.styles.borderWidth || 0}
                  onChange={(e) => onUpdate({ styles: { ...section.styles, borderWidth: parseInt(e.target.value) || 0 } })}
                  min="0"
                  max="20"
                />
              </div>

              <div className="form-group">
                <label>Цвет рамки</label>
                <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                  <input
                    type="color"
                    value={section.styles.borderColor || '#e5e7eb'}
                    onChange={(e) => onUpdate({ styles: { ...section.styles, borderColor: e.target.value } })}
                    style={{ width: '50px', height: '40px' }}
                  />
                  <input
                    type="text"
                    value={section.styles.borderColor || '#e5e7eb'}
                    onChange={(e) => onUpdate({ styles: { ...section.styles, borderColor: e.target.value } })}
                    style={{ flex: 1 }}
                  />
                </div>
              </div>
            </>
          )}

          <div className="form-group">
            <label>Скругление углов (px)</label>
            <input
              type="number"
              value={section.styles.borderRadius || 0}
              onChange={(e) => onUpdate({ styles: { ...section.styles, borderRadius: parseInt(e.target.value) || 0 } })}
              min="0"
              max="50"
            />
          </div>

          <div className="form-group">
            <label>Тень (box-shadow)</label>
            <select
              value={section.styles.boxShadow || 'none'}
              onChange={(e) => onUpdate({ styles: { ...section.styles, boxShadow: e.target.value } })}
            >
              <option value="none">Нет</option>
              <option value="0 1px 3px rgba(0,0,0,0.1)">Легкая</option>
              <option value="0 4px 6px rgba(0,0,0,0.1)">Средняя</option>
              <option value="0 10px 15px rgba(0,0,0,0.1)">Сильная</option>
              <option value="0 20px 25px rgba(0,0,0,0.15)">Очень сильная</option>
            </select>
          </div>
        </>
      )}

      {/* RESPONSIVE TAB */}
      {activeTab === 'responsive' && (
        <>
          <div className="form-group">
            <label>Видимость на устройствах</label>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              <label className="toggle-switch-label">
                <input
                  type="checkbox"
                  checked={section.styles.visibility?.desktop !== false}
                  onChange={(e) => onUpdate({ 
                    styles: { 
                      ...section.styles, 
                      visibility: { 
                        ...(section.styles.visibility || {}), 
                        desktop: e.target.checked 
                      } 
                    } 
                  })}
                />
                <span>🖥️ Desktop</span>
              </label>
              <label className="toggle-switch-label">
                <input
                  type="checkbox"
                  checked={section.styles.visibility?.tablet !== false}
                  onChange={(e) => onUpdate({ 
                    styles: { 
                      ...section.styles, 
                      visibility: { 
                        ...(section.styles.visibility || {}), 
                        tablet: e.target.checked 
                      } 
                    } 
                  })}
                />
                <span>📱 Tablet</span>
              </label>
              <label className="toggle-switch-label">
                <input
                  type="checkbox"
                  checked={section.styles.visibility?.mobile !== false}
                  onChange={(e) => onUpdate({ 
                    styles: { 
                      ...section.styles, 
                      visibility: { 
                        ...(section.styles.visibility || {}), 
                        mobile: e.target.checked 
                      } 
                    } 
                  })}
                />
                <span>📱 Mobile</span>
              </label>
            </div>
          </div>

          {section.columns.length > 1 && (
            <>
              <div className="form-group">
                <label>Поведение на мобильных</label>
                <select
                  value={section.styles.mobileStack || 'vertical'}
                  onChange={(e) => onUpdate({ styles: { ...section.styles, mobileStack: e.target.value as any } })}
                >
                  <option value="none">Не складывать</option>
                  <option value="vertical">Складывать вертикально</option>
                </select>
              </div>

              <div className="form-group">
                <label className="toggle-switch-label">
                  <input
                    type="checkbox"
                    checked={section.styles.mobileReverse || false}
                    onChange={(e) => onUpdate({ styles: { ...section.styles, mobileReverse: e.target.checked } })}
                  />
                  <span>Изменить порядок на мобильных</span>
                </label>
              </div>
            </>
          )}
        </>
      )}

      {/* ADVANCED TAB */}
      {activeTab === 'advanced' && (
        <>
          <div className="form-group">
            <label>CSS класс</label>
            <input
              type="text"
              placeholder="custom-section-class"
              style={{ fontSize: '12px' }}
            />
          </div>

          <div className="form-group">
            <label>Пользовательский CSS</label>
            <textarea
              placeholder="/* Дополнительные стили */"
              rows={5}
              style={{ fontFamily: 'monospace', fontSize: '12px' }}
            />
          </div>
        </>
      )}

      <div style={{ marginTop: '20px', paddingTop: '20px', borderTop: '1px solid #e5e7eb' }}>
        <button className="btn-danger" onClick={onDelete} style={{ width: '100%' }}>
          🗑️ Удалить секцию
        </button>
      </div>
    </div>
  );
};

const BlockSettings: React.FC<{
  block: EmailBlock;
  onUpdate: (updates: Partial<EmailBlock>) => void;
  onDelete: () => void;
  applyFormatting?: (command: string, value?: string) => void;
  editableTextRef?: React.RefObject<HTMLDivElement>;
}> = ({ block, onUpdate, onDelete, applyFormatting, editableTextRef }) => {
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
      <h4>Настройки блока: {block.type === 'text' ? 'Текст' : block.type === 'button' ? 'Кнопка' : block.type === 'image' ? 'Изображение' : block.type}</h4>
      
      
      {block.type === 'text' && (
        <>
          {/* Paragraph Style */}
          <div className="form-group">
            <label>Paragraph Style</label>
            <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
              <button onClick={() => applyFormatting?.('formatBlock', 'p')} className="toolbar-style-btn" title="Параграф">P</button>
              <button onClick={() => applyFormatting?.('formatBlock', 'h1')} className="toolbar-style-btn" title="Заголовок 1">H1</button>
              <button onClick={() => applyFormatting?.('formatBlock', 'h2')} className="toolbar-style-btn" title="Заголовок 2">H2</button>
              <button onClick={() => applyFormatting?.('formatBlock', 'h3')} className="toolbar-style-btn" title="Заголовок 3">H3</button>
            </div>
          </div>

          {/* Text Style */}
          <div className="form-group">
            <label>Text Style</label>
            <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap', marginBottom: '8px' }}>
              <button onClick={() => applyFormatting?.('bold')} className="toolbar-style-btn"><strong>B</strong></button>
              <button onClick={() => applyFormatting?.('italic')} className="toolbar-style-btn"><em>I</em></button>
              <button onClick={() => applyFormatting?.('underline')} className="toolbar-style-btn"><u>U</u></button>
              <button onClick={() => applyFormatting?.('strikeThrough')} className="toolbar-style-btn"><s>S</s></button>
              <button onClick={() => applyFormatting?.('subscript')} className="toolbar-style-btn">x₂</button>
              <button onClick={() => applyFormatting?.('superscript')} className="toolbar-style-btn">x²</button>
            </div>
            <div style={{ display: 'flex', gap: '6px', alignItems: 'center' }}>
              <select 
                onChange={(e) => {
                  const size = e.target.value;
                  if (editableTextRef?.current) {
                    editableTextRef.current.focus();
                    document.execCommand('fontSize', false, '7');
                    const fontElements = document.querySelectorAll('font[size="7"]');
                    fontElements.forEach(el => {
                      const span = document.createElement('span');
                      span.style.fontSize = size + 'px';
                      span.innerHTML = el.innerHTML;
                      el.parentNode?.replaceChild(span, el);
                    });
                  }
                }}
                className="toolbar-select"
                defaultValue="14"
              >
                <option value="10">10px</option>
                <option value="12">12px</option>
                <option value="14">14px</option>
                <option value="16">16px</option>
                <option value="18">18px</option>
                <option value="20">20px</option>
                <option value="24">24px</option>
                <option value="28">28px</option>
                <option value="32">32px</option>
              </select>
              <label className="toolbar-color-btn" title="Цвет текста">
                🎨
                <input type="color" onChange={(e) => applyFormatting?.('foreColor', e.target.value)} style={{ display: 'none' }} />
              </label>
              <label className="toolbar-color-btn" title="Цвет фона">
                🖍️
                <input type="color" defaultValue="#ffff00" onChange={(e) => applyFormatting?.('backColor', e.target.value)} style={{ display: 'none' }} />
              </label>
            </div>
          </div>

          {/* Alignment */}
          <div className="form-group">
            <label>Text Alignment</label>
            <div style={{ display: 'flex', gap: '6px' }}>
              <button onClick={() => applyFormatting?.('justifyLeft')} className="toolbar-style-btn align-btn" title="По левому краю">
                <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor"><rect x="0" y="2" width="12" height="2" rx="1"/><rect x="0" y="6" width="14" height="2" rx="1"/><rect x="0" y="10" width="10" height="2" rx="1"/></svg>
              </button>
              <button onClick={() => applyFormatting?.('justifyCenter')} className="toolbar-style-btn align-btn" title="По центру">
                <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor"><rect x="2" y="2" width="12" height="2" rx="1"/><rect x="1" y="6" width="14" height="2" rx="1"/><rect x="3" y="10" width="10" height="2" rx="1"/></svg>
              </button>
              <button onClick={() => applyFormatting?.('justifyRight')} className="toolbar-style-btn align-btn" title="По правому краю">
                <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor"><rect x="4" y="2" width="12" height="2" rx="1"/><rect x="2" y="6" width="14" height="2" rx="1"/><rect x="6" y="10" width="10" height="2" rx="1"/></svg>
              </button>
              <button onClick={() => applyFormatting?.('justifyFull')} className="toolbar-style-btn align-btn" title="По ширине">
                <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor"><rect x="0" y="2" width="16" height="2" rx="1"/><rect x="0" y="6" width="16" height="2" rx="1"/><rect x="0" y="10" width="16" height="2" rx="1"/></svg>
              </button>
            </div>
          </div>

          {/* Insert */}
          <div className="form-group">
            <label>Insert</label>
            <div style={{ display: 'flex', gap: '6px' }}>
              <button onClick={() => { const url = prompt('Введите URL:'); if (url) applyFormatting?.('createLink', url); }} className="toolbar-style-btn" title="Ссылка">🔗</button>
              <button onClick={() => applyFormatting?.('insertUnorderedList')} className="toolbar-style-btn" title="Маркированный список">•</button>
              <button onClick={() => applyFormatting?.('insertOrderedList')} className="toolbar-style-btn" title="Нумерованный список">1.</button>
              <button onClick={() => { if (editableTextRef?.current) { editableTextRef.current.focus(); applyFormatting?.('removeFormat'); applyFormatting?.('unlink'); } }} className="toolbar-style-btn" title="Очистить форматирование">✂️</button>
            </div>
          </div>

          {/* Внутренние отступы */}
          <div className="form-group">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
              <label style={{ margin: 0 }}>Внутренние отступы</label>
              <button
                onClick={() => onUpdate({ 
                  styles: { 
                    ...block.styles, 
                    paddingLocked: !block.styles.paddingLocked 
                  } 
                })}
                className="spacing-lock-btn"
                title={block.styles.paddingLocked ? 'Отвязать отступы' : 'Связать отступы'}
              >
                {block.styles.paddingLocked ? '🔒' : '🔓'}
              </button>
            </div>
            
            {['top', 'right', 'bottom', 'left'].map((side) => {
              const sideNames = { top: 'Сверху', right: 'Справа', bottom: 'Снизу', left: 'Слева' };
              const propertyName = `padding${side.charAt(0).toUpperCase() + side.slice(1)}` as keyof typeof block.styles;
              const currentValue = (block.styles[propertyName] as number) || 10;

              const handleChange = (newValue: number) => {
                if (block.styles.paddingLocked) {
                  onUpdate({
                    styles: {
                      ...block.styles,
                      paddingTop: newValue,
                      paddingRight: newValue,
                      paddingBottom: newValue,
                      paddingLeft: newValue
                    }
                  });
                } else {
                  onUpdate({
                    styles: {
                      ...block.styles,
                      [propertyName]: newValue
                    }
                  });
                }
              };

              return (
                <div key={side} style={{ marginBottom: '8px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <label style={{ fontSize: '12px', color: '#6b7280', margin: 0, width: '60px' }}>
                      {sideNames[side as keyof typeof sideNames]}
                    </label>
                    <div className="email-builder-number-stepper">
                      <button
                        onClick={() => handleChange(Math.max(0, currentValue - 2))}
                        className="btn-secondary number-btn"
                      >
                        −
                      </button>
                      <input
                        type="number"
                        value={currentValue}
                        onChange={(e) => handleChange(parseInt(e.target.value) || 0)}
                        min="0"
                      />
                      <button
                        onClick={() => handleChange(currentValue + 2)}
                        className="btn-secondary number-btn"
                      >
                        +
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Внешние отступы */}
          <div className="form-group">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
              <label style={{ margin: 0 }}>Внешние отступы</label>
              <button
                onClick={() => onUpdate({ 
                  styles: { 
                    ...block.styles, 
                    marginLocked: !block.styles.marginLocked 
                  } 
                })}
                className="spacing-lock-btn"
                title={block.styles.marginLocked ? 'Отвязать отступы' : 'Связать отступы'}
              >
                {block.styles.marginLocked ? '🔒' : '🔓'}
              </button>
            </div>
            
            {['top', 'right', 'bottom', 'left'].map((side) => {
              const sideNames = { top: 'Сверху', right: 'Справа', bottom: 'Снизу', left: 'Слева' };
              const propertyName = `margin${side.charAt(0).toUpperCase() + side.slice(1)}` as keyof typeof block.styles;
              const currentValue = (block.styles[propertyName] as number) || 0;

              const handleChange = (newValue: number) => {
                if (block.styles.marginLocked) {
                  onUpdate({
                    styles: {
                      ...block.styles,
                      marginTop: newValue,
                      marginRight: newValue,
                      marginBottom: newValue,
                      marginLeft: newValue
                    }
                  });
                } else {
                  onUpdate({
                    styles: {
                      ...block.styles,
                      [propertyName]: newValue
                    }
                  });
                }
              };

              return (
                <div key={side} style={{ marginBottom: '8px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <label style={{ fontSize: '12px', color: '#6b7280', margin: 0, width: '60px' }}>
                      {sideNames[side as keyof typeof sideNames]}
                    </label>
                    <div className="email-builder-number-stepper">
                      <button
                        onClick={() => handleChange(Math.max(0, currentValue - 2))}
                        className="btn-secondary number-btn"
                      >
                        −
                      </button>
                      <input
                        type="number"
                        value={currentValue}
                        onChange={(e) => handleChange(parseInt(e.target.value) || 0)}
                        min="0"
                      />
                      <button
                        onClick={() => handleChange(currentValue + 2)}
                        className="btn-secondary number-btn"
                      >
                        +
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </>
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
