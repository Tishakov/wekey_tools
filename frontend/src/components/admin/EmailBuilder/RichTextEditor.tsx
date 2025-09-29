import React, { useState, useRef, useEffect } from 'react';
import './RichTextEditor.css';

interface RichTextEditorProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
}

const RichTextEditor: React.FC<RichTextEditorProps> = ({
  value,
  onChange,
  placeholder = 'Введите текст...'
}) => {
  const editorRef = useRef<HTMLDivElement>(null);
  const [showToolbar, setShowToolbar] = useState(false);
  const [toolbarPosition, setToolbarPosition] = useState({ top: 0, left: 0 });
  const [selectedRange, setSelectedRange] = useState<Range | null>(null);
  const [activeFormats, setActiveFormats] = useState({
    bold: false,
    italic: false,
    underline: false
  });

  // Обработка изменений текста
  const handleContentChange = () => {
    if (editorRef.current) {
      const content = editorRef.current.innerHTML;
      onChange(content);
    }
  };

  // Обработка выделения текста
  const handleSelectionChange = () => {
    const selection = window.getSelection();
    
    if (selection && selection.rangeCount > 0 && !selection.isCollapsed) {
      const range = selection.getRangeAt(0);
      const rect = range.getBoundingClientRect();
      
      // Проверяем, что выделение внутри нашего редактора
      if (editorRef.current?.contains(range.commonAncestorContainer)) {
        setSelectedRange(range);
        setToolbarPosition({
          top: rect.top - 50,
          left: rect.left + (rect.width / 2) - 100
        });
        
        // Проверяем активные форматы
        setActiveFormats({
          bold: document.queryCommandState('bold'),
          italic: document.queryCommandState('italic'),
          underline: document.queryCommandState('underline')
        });
        
        setShowToolbar(true);
      }
    } else {
      setShowToolbar(false);
      setSelectedRange(null);
    }
  };

  // Применение форматирования
  const applyFormat = (command: string, value?: string) => {
    if (selectedRange) {
      // Восстанавливаем выделение
      const selection = window.getSelection();
      if (selection) {
        selection.removeAllRanges();
        selection.addRange(selectedRange);
        
        // Применяем команду форматирования
        document.execCommand(command, false, value);
        
        // Обновляем содержимое
        handleContentChange();
        
        // Скрываем панель инструментов
        setShowToolbar(false);
        setSelectedRange(null);
      }
    }
  };

  // Создание ссылки
  const createLink = () => {
    const url = prompt('Введите URL:');
    if (url) {
      applyFormat('createLink', url);
    }
  };

  // Изменение цвета текста
  const changeTextColor = () => {
    const color = prompt('Введите цвет (например, #ff0000 или red):');
    if (color) {
      applyFormat('foreColor', color);
    }
  };

  // Обработка клавиатурных сочетаний
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.ctrlKey || e.metaKey) {
      switch (e.key) {
        case 'b':
          e.preventDefault();
          document.execCommand('bold');
          handleContentChange();
          break;
        case 'i':
          e.preventDefault();
          document.execCommand('italic');
          handleContentChange();
          break;
        case 'u':
          e.preventDefault();
          document.execCommand('underline');
          handleContentChange();
          break;
        case 'k':
          e.preventDefault();
          createLink();
          break;
      }
    }
  };

  // Обработчики событий
  useEffect(() => {
    document.addEventListener('selectionchange', handleSelectionChange);
    return () => document.removeEventListener('selectionchange', handleSelectionChange);
  }, []);

  // Синхронизация контента
  useEffect(() => {
    if (editorRef.current && editorRef.current.innerHTML !== value) {
      editorRef.current.innerHTML = value;
    }
  }, [value]);

  return (
    <div className="rich-text-editor">
      <div
        ref={editorRef}
        className="rich-text-content"
        contentEditable
        suppressContentEditableWarning={true}
        onInput={handleContentChange}
        onBlur={handleContentChange}
        onKeyDown={handleKeyDown}
        data-placeholder={placeholder}
      />
      
      {showToolbar && (
        <div 
          className="rich-text-toolbar"
          style={{
            position: 'fixed',
            top: toolbarPosition.top,
            left: toolbarPosition.left,
            zIndex: 1000
          }}
        >
          <button
            type="button"
            className={`rich-text-btn ${activeFormats.bold ? 'active' : ''}`}
            onMouseDown={(e) => e.preventDefault()}
            onClick={() => applyFormat('bold')}
            title="Жирный (Ctrl+B)"
          >
            <strong>B</strong>
          </button>
          <button
            type="button" 
            className={`rich-text-btn ${activeFormats.italic ? 'active' : ''}`}
            onMouseDown={(e) => e.preventDefault()}
            onClick={() => applyFormat('italic')}
            title="Курсив (Ctrl+I)"
          >
            <em>I</em>
          </button>
          <button
            type="button"
            className={`rich-text-btn ${activeFormats.underline ? 'active' : ''}`}
            onMouseDown={(e) => e.preventDefault()}
            onClick={() => applyFormat('underline')}
            title="Подчеркивание (Ctrl+U)"
          >
            <u>U</u>
          </button>
          <button
            type="button"
            className="rich-text-btn"
            onMouseDown={(e) => e.preventDefault()}
            onClick={createLink}
            title="Ссылка"
          >
            🔗
          </button>
          <button
            type="button"
            className="rich-text-btn"
            onMouseDown={(e) => e.preventDefault()}
            onClick={changeTextColor}
            title="Цвет текста"
          >
            🎨
          </button>
          <button
            type="button"
            className="rich-text-btn"
            onMouseDown={(e) => e.preventDefault()}
            onClick={() => applyFormat('insertUnorderedList')}
            title="Маркированный список"
          >
            • 
          </button>
          <button
            type="button"
            className="rich-text-btn"
            onMouseDown={(e) => e.preventDefault()}
            onClick={() => applyFormat('insertOrderedList')}
            title="Нумерованный список"
          >
            1.
          </button>
          <button
            type="button"
            className="rich-text-btn"
            onMouseDown={(e) => e.preventDefault()}
            onClick={() => applyFormat('removeFormat')}
            title="Убрать форматирование"
          >
            ✂️
          </button>
        </div>
      )}
    </div>
  );
};

export default RichTextEditor;