import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { statsService } from '../utils/statsService';
import './FindReplaceTool.css';

const FindReplaceTool: React.FC = () => {
  const [inputText, setInputText] = useState('');
  const [searchText, setSearchText] = useState('');
  const [replaceText, setReplaceText] = useState('');
  const [result, setResult] = useState('');
  const [copied, setCopied] = useState(false);
  const [launchCount, setLaunchCount] = useState(0);
  const [caseSensitive, setCaseSensitive] = useState(false);
  const [replaceMode, setReplaceMode] = useState<'custom' | 'empty' | 'paragraph'>('custom');

  useEffect(() => {
    const count = statsService.getLaunchCount('find-replace');
    setLaunchCount(count);
  }, []);

  const handleTextareaResize = (element: HTMLTextAreaElement) => {
    element.style.height = 'auto';
    element.style.height = element.scrollHeight + 'px';
  };

  const processText = () => {
    if (!inputText.trim()) {
      setResult('');
      return;
    }

    let processedText = inputText;
    const searchTerms = searchText.split('\n').filter(term => term.trim() !== '');
    
    if (searchTerms.length === 0) {
      setResult(inputText);
      return;
    }

    let replacement = '';
    switch (replaceMode) {
      case 'empty':
        replacement = '';
        break;
      case 'paragraph':
        replacement = '\n\n';
        break;
      case 'custom':
      default:
        replacement = replaceText;
        break;
    }

    for (const term of searchTerms) {
      if (term.trim()) {
        const flags = caseSensitive ? 'g' : 'gi';
        const regex = new RegExp(escapeRegExp(term.trim()), flags);
        processedText = processedText.replace(regex, replacement);
      }
    }

    setResult(processedText);
    statsService.incrementLaunchCount('find-replace');
    setLaunchCount(prev => prev + 1);
  };

  const escapeRegExp = (string: string) => {
    return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  };

  const handleShowResult = () => {
    processText();
  };

  const handleCopy = async () => {
    if (result) {
      try {
        await navigator.clipboard.writeText(result);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      } catch (err) {
        console.error('Не удалось скопировать текст:', err);
      }
    }
  };

  const handlePaste = async () => {
    try {
      const text = await navigator.clipboard.readText();
      setInputText(text);
      setTimeout(() => {
        const textarea = document.querySelector('.input-section textarea') as HTMLTextAreaElement;
        if (textarea) handleTextareaResize(textarea);
      }, 0);
    } catch (err) {
      console.error('Не удалось вставить текст:', err);
    }
  };

  const handleRadioClick = (mode: 'custom' | 'empty' | 'paragraph') => {
    setReplaceMode(mode);
  };

  const getLineCount = (text: string) => {
    return text ? text.split('\n').length : 0;
  };

  return (
    <div className="tool-container find-replace-tool">
      {/* Шапка инструмента */}
      <div className="tool-header-island">
        <Link to="/" className="back-button">
          <img src="/icons/arrow_left.svg" alt="Назад" />
          Все инструменты
        </Link>
        <h1>Найти и заменить</h1>
        <div className="header-icons">
          <span className="launch-count">{launchCount}</span>
          <button className="icon-button">
            <img src="/icons/lamp.svg" alt="Подсказка" />
          </button>
          <button className="icon-button">
            <img src="/icons/camera.svg" alt="Скриншот" />
          </button>
        </div>
      </div>

      {/* Рабочая область */}
      <div className="main-workspace">
        <div className="input-section">
          <textarea
            value={inputText}
            onChange={(e) => {
              setInputText(e.target.value);
              handleTextareaResize(e.target);
            }}
            placeholder="Вставьте текст для обработки..."
            className="main-textarea"
          />
          <div className="input-controls">
            <button onClick={handlePaste} className="paste-button">
              <img src="/icons/button_paste.svg" alt="Вставить" />
              Вставить
            </button>
            <span className="line-count">{getLineCount(inputText)} строк</span>
          </div>
        </div>

        <div className="settings-section">
          <div className="settings-group">
            <h3>Настройки поиска и замены</h3>
            
            <div className="setting-item">
              <label>Что искать (каждая строка - отдельный поиск):</label>
              <textarea
                value={searchText}
                onChange={(e) => {
                  setSearchText(e.target.value);
                  handleTextareaResize(e.target);
                }}
                placeholder="Введите слова для поиска, каждое с новой строки"
                className="filter-input auto-resize"
              />
            </div>

            <div className="setting-item">
              <label className="checkbox-item">
                <input
                  type="checkbox"
                  checked={caseSensitive}
                  onChange={(e) => setCaseSensitive(e.target.checked)}
                />
                Учитывать регистр
              </label>
            </div>

            <div className="setting-item">
              <label>На что заменять:</label>
              
              <div className="radio-group">
                <label className="radio-item">
                  <input
                    type="radio"
                    checked={replaceMode === 'custom'}
                    onChange={() => handleRadioClick('custom')}
                  />
                  Заменить на текст:
                </label>
                
                <label className="radio-item">
                  <input
                    type="radio"
                    checked={replaceMode === 'empty'}
                    onChange={() => handleRadioClick('empty')}
                  />
                  Удалить (заменить на пустое место)
                </label>
                
                <label className="radio-item">
                  <input
                    type="radio"
                    checked={replaceMode === 'paragraph'}
                    onChange={() => handleRadioClick('paragraph')}
                  />
                  Заменить на абзац (двойной перенос строки)
                </label>
              </div>

              {replaceMode === 'custom' && (
                <textarea
                  value={replaceText}
                  onChange={(e) => {
                    setReplaceText(e.target.value);
                    handleTextareaResize(e.target);
                  }}
                  placeholder="Введите текст для замены"
                  className="filter-input auto-resize"
                />
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Кнопки управления */}
      <div className="control-buttons">
        <button 
          className="primary-button" 
          onClick={handleShowResult}
          disabled={!inputText.trim() || !searchText.trim()}
        >
          Заменить
        </button>
        <button 
          className="secondary-button" 
          onClick={handleCopy}
          disabled={!result}
        >
          <img src="/icons/button_copy.svg" alt="Копировать" />
          {copied ? 'Скопировано!' : 'Скопировать результат'}
        </button>
      </div>

      {/* Поле результата */}
      <div className="result-section">
        <textarea
          value={result}
          readOnly
          placeholder="Результат появится здесь после обработки..."
          className="result-textarea"
        />
        <div className="result-info">
          <span className="line-count">{getLineCount(result)} строк</span>
        </div>
      </div>
    </div>
  );
};

export default FindReplaceTool;