import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { statsService } from '../utils/statsService';
import '../styles/tool-pages.css';
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

  // Очистка результата при изменении входных данных или настроек
  useEffect(() => {
    setResult('');
    setCopied(false);
  }, [inputText, searchText, replaceText, caseSensitive, replaceMode]);

  const processText = (text: string): string => {
    if (!text.trim()) return '';
    if (!searchText.trim()) return text;

    let processedText = text;
    const searchTerms = searchText.split('\n').filter(term => term.trim() !== '');
    
    if (searchTerms.length === 0) {
      return text;
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
        replacement = replaceText; // Используем поле замены
        break;
    }

    for (const term of searchTerms) {
      if (term.trim()) {
        const flags = caseSensitive ? 'g' : 'gi';
        const regex = new RegExp(escapeRegExp(term.trim()), flags);
        processedText = processedText.replace(regex, replacement);
      }
    }

    return processedText;
  };

  const escapeRegExp = (string: string) => {
    return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  };

  const handleShowResult = () => {
    const processedText = processText(inputText);
    setResult(processedText);
    statsService.incrementLaunchCount('find-replace');
    setLaunchCount(prev => prev + 1);
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
        const textarea = document.querySelector('.input-textarea') as HTMLTextAreaElement;
        if (textarea) handleTextareaResize(textarea);
      }, 0);
    } catch (err) {
      console.error('Не удалось вставить текст:', err);
    }
  };

  const handleRadioClick = (clickedValue: 'empty' | 'paragraph') => {
    if (replaceMode === clickedValue) {
      setReplaceMode('custom'); // Возвращаем к обычной замене
    } else {
      setReplaceMode(clickedValue);
    }
  };

  const handleTextareaResize = (element: HTMLTextAreaElement) => {
    element.style.height = 'auto';
    element.style.height = element.scrollHeight + 'px';
  };

  const countLines = (text: string): number => {
    if (text === '') return 0;
    return text.split('\n').length;
  };

  return (
    <div className="find-replace-tool">
      {/* Header-остров инструмента */}
      <div className="tool-header-island">
        <Link to="/" className="back-button">
          <img src="/icons/arrow_left.svg" alt="" />
          Все инструменты
        </Link>
        <h1 className="tool-title">Найти и заменить</h1>
        <div className="tool-header-buttons">
          <button className="tool-header-btn counter-btn" title="Счетчик запусков">
            <img src="/icons/rocket.svg" alt="" />
            <span className="counter">{launchCount}</span>
          </button>
          <button className="tool-header-btn" title="Подсказка">
            <img src="/icons/lamp.svg" alt="" />
          </button>
          <button className="tool-header-btn" title="Сделать скриншот">
            <img src="/icons/camera.svg" alt="" />
          </button>
        </div>
      </div>

      {/* Основная рабочая область */}
      <div className="main-workspace">
        {/* Левая часть - поле ввода */}
        <div className="input-section">
          <textarea
            className="input-textarea"
            value={inputText}
            onChange={(e) => {
              setInputText(e.target.value);
              handleTextareaResize(e.target);
            }}
            placeholder="Введите или вставьте ваш текст здесь..."
          />
          <div className="input-controls">
            <button className="paste-btn" onClick={handlePaste}>
              <img src="/icons/button_paste.svg" alt="" />
              Вставить
            </button>
            <span className="char-counter">{countLines(inputText)} стр.</span>
          </div>
        </div>

        {/* Правая часть - настройки */}
        <div className="settings-section">
          {/* Поле поиска */}
          <div className="settings-group">
            <textarea
              className="filter-input"
              value={searchText}
              onChange={(e) => {
                setSearchText(e.target.value);
                handleTextareaResize(e.target);
              }}
              placeholder="Что заменить... (несколько с новой строки)"
              rows={3}
            />
          </div>

          {/* Поле замены - ВСЕГДА показываем */}
          <div className="settings-group">
            <textarea
              className="filter-input"
              value={replaceText}
              onChange={(e) => {
                setReplaceText(e.target.value);
                handleTextareaResize(e.target);
              }}
              placeholder="На что заменить..."
              rows={2}
            />
          </div>

          {/* Чекбокс учета регистра */}
          <div className="settings-group">
            <label className="checkbox-item">
              <input
                type="checkbox"
                checked={caseSensitive}
                onChange={(e) => setCaseSensitive(e.target.checked)}
              />
              С учётом регистра
            </label>
          </div>

          {/* Радио-кнопки для специальных режимов */}
          <div className="settings-group">
            <label className="radio-item">
              <input
                type="radio"
                name="replaceMode"
                value="empty"
                checked={replaceMode === 'empty'}
                onClick={() => handleRadioClick('empty')}
                onChange={() => {}}
              />
              Заменить на пустоту
            </label>
            
            <label className="radio-item">
              <input
                type="radio"
                name="replaceMode"
                value="paragraph"
                checked={replaceMode === 'paragraph'}
                onClick={() => handleRadioClick('paragraph')}
                onChange={() => {}}
              />
              Заменить на абзац
            </label>
          </div>
        </div>
      </div>

      {/* Кнопки управления */}
      <div className="control-buttons">
        <button 
          className="action-btn primary" 
          style={{ width: '445px' }} 
          onClick={handleShowResult}
          disabled={!inputText.trim() || !searchText.trim()}
        >
          Заменить
        </button>
        <button 
          className="action-btn secondary icon-left" 
          style={{ width: '445px' }} 
          onClick={handleCopy}
          disabled={!result}
        >
          <img src="/icons/button_copy.svg" alt="" />
          {copied ? 'Скопировано!' : 'Скопировать результат'}
        </button>
      </div>

      {/* Поле результата */}
      <div className="result-section">
        <textarea
          className="result-textarea"
          value={result}
          readOnly
          placeholder="Здесь будет результат"
        />
        <div className="result-controls">
          <span className="result-counter">{countLines(result)} стр.</span>
        </div>
      </div>
    </div>
  );
};

export default FindReplaceTool;