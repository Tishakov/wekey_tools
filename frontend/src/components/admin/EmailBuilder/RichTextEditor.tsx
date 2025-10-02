import React, { useState, useRef, useEffect } from 'react';
import VariableInserter from '../newsletters/VariableInserter';
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


  // Создание ссылки
  const createLink = () => {
    const url = prompt('Введите URL:');
    if (url) {
      document.execCommand('createLink', false, url);
      handleContentChange();
      editorRef.current?.focus();
    }
  };

  // Изменение цвета текста
  const changeTextColor = () => {
    const color = prompt('Введите цвет (например, #ff0000 или red):');
    if (color) {
      document.execCommand('foreColor', false, color);
      handleContentChange();
      editorRef.current?.focus();
    }
  };

  // Вставка переменной
  const handleInsertVariable = (variableKey: string) => {
    const variableText = `{{${variableKey}}}`;
    
    if (editorRef.current) {
      // Получаем текущее выделение или позицию курсора
      const selection = window.getSelection();
      if (selection && selection.rangeCount > 0) {
        const range = selection.getRangeAt(0);
        
        // Проверяем, что курсор внутри нашего редактора
        if (editorRef.current.contains(range.commonAncestorContainer)) {
          // Создаем текстовый узел с переменной
          const textNode = document.createTextNode(variableText);
          
          // Вставляем в позицию курсора
          range.deleteContents();
          range.insertNode(textNode);
          
          // Перемещаем курсор после вставленной переменной
          range.setStartAfter(textNode);
          range.setEndAfter(textNode);
          selection.removeAllRanges();
          selection.addRange(range);
          
          // Обновляем содержимое
          handleContentChange();
          
          // Фокусируем редактор
          editorRef.current.focus();
        }
      } else {
        // Если нет выделения, вставляем в конец
        const textNode = document.createTextNode(variableText);
        editorRef.current.appendChild(textNode);
        handleContentChange();
        editorRef.current.focus();
      }
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

  // Обновление активных форматов при изменении позиции курсора
  const updateActiveFormats = () => {
    setActiveFormats({
      bold: document.queryCommandState('bold'),
      italic: document.queryCommandState('italic'),
      underline: document.queryCommandState('underline')
    });
  };

  // Синхронизация контента
  useEffect(() => {
    if (editorRef.current && editorRef.current.innerHTML !== value) {
      editorRef.current.innerHTML = value;
    }
  }, [value]);

  return (
    <div className="rich-text-editor">
      {/* Постоянная панель инструментов */}
      <div className="rich-text-main-toolbar">
        <VariableInserter 
          onInsert={handleInsertVariable}
          buttonText="Переменная"
          buttonIcon="{{}}"
        />
        
        <div className="toolbar-separator"></div>
        
        {/* Форматирование текста */}
        <button
          type="button"
          className={`rich-text-btn ${activeFormats.bold ? 'active' : ''}`}
          onMouseDown={(e) => e.preventDefault()}
          onClick={() => {
            document.execCommand('bold');
            handleContentChange();
            updateActiveFormats();
            editorRef.current?.focus();
          }}
          title="Жирный (Ctrl+B)"
        >
          <strong>B</strong>
        </button>
        <button
          type="button" 
          className={`rich-text-btn ${activeFormats.italic ? 'active' : ''}`}
          onMouseDown={(e) => e.preventDefault()}
          onClick={() => {
            document.execCommand('italic');
            handleContentChange();
            updateActiveFormats();
            editorRef.current?.focus();
          }}
          title="Курсив (Ctrl+I)"
        >
          <em>I</em>
        </button>
        <button
          type="button"
          className={`rich-text-btn ${activeFormats.underline ? 'active' : ''}`}
          onMouseDown={(e) => e.preventDefault()}
          onClick={() => {
            document.execCommand('underline');
            handleContentChange();
            updateActiveFormats();
            editorRef.current?.focus();
          }}
          title="Подчеркивание (Ctrl+U)"
        >
          <u>U</u>
        </button>
        
        <div className="toolbar-separator"></div>
        
        {/* Дополнительные инструменты */}
        <button
          type="button"
          className="rich-text-btn"
          onMouseDown={(e) => e.preventDefault()}
          onClick={createLink}
          title="Ссылка (Ctrl+K)"
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
        
        <div className="toolbar-separator"></div>
        
        {/* Списки */}
        <button
          type="button"
          className="rich-text-btn"
          onMouseDown={(e) => e.preventDefault()}
          onClick={() => {
            document.execCommand('insertUnorderedList');
            handleContentChange();
            editorRef.current?.focus();
          }}
          title="Маркированный список"
        >
          • 
        </button>
        <button
          type="button"
          className="rich-text-btn"
          onMouseDown={(e) => e.preventDefault()}
          onClick={() => {
            document.execCommand('insertOrderedList');
            handleContentChange();
            editorRef.current?.focus();
          }}
          title="Нумерованный список"
        >
          1.
        </button>
        
        <div className="toolbar-separator"></div>
        
        {/* Очистка */}
        <button
          type="button"
          className="rich-text-btn"
          onMouseDown={(e) => e.preventDefault()}
          onClick={() => {
            document.execCommand('removeFormat');
            handleContentChange();
            editorRef.current?.focus();
          }}
          title="Убрать форматирование"
        >
          ✂️
        </button>
      </div>
      
      <div
        ref={editorRef}
        className="rich-text-content"
        contentEditable
        suppressContentEditableWarning={true}
        onInput={handleContentChange}
        onBlur={handleContentChange}
        onKeyDown={handleKeyDown}
        onKeyUp={updateActiveFormats}
        onMouseUp={updateActiveFormats}
        data-placeholder={placeholder}
      />
    </div>
  );
};

export default RichTextEditor;