import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { statsService } from '../utils/statsService';
import { openaiService, type TextGenerationResponse } from '../services/openaiService';
import '../styles/tool-pages.css';
import './TextGeneratorTool.css';

const TextGeneratorTool: React.FC = () => {
  // Основные состояния
  const [language, setLanguage] = useState('english');
  const [countMode, setCountMode] = useState('characters'); // 'characters' или 'words'
  const [characterCount, setCharacterCount] = useState(100);
  const [wordCount, setWordCount] = useState(50);
  const [paragraphCount, setParagraphCount] = useState(3);
  const [result, setResult] = useState('');
  const [copied, setCopied] = useState(false);
  const [launchCount, setLaunchCount] = useState(0);
  const [languageDropdownOpen, setLanguageDropdownOpen] = useState(false);
  
  // Состояния для работы с AI
  const [isGenerating, setIsGenerating] = useState(false);
  const [aiError, setAiError] = useState('');

  // Опции языков
  const languageOptions = {
    english: 'Английский',
    russian: 'Русский', 
    ukrainian: 'Украинский',
    lorem: 'Lorem Ipsum'
  };

  // Загрузка статистики
  useEffect(() => {
    const count = statsService.getLaunchCount('text-generator');
    setLaunchCount(count);
  }, []);

  // Очистка результата при изменении параметров
  useEffect(() => {
    setResult('');
    setCopied(false);
    setAiError('');
  }, [language, countMode, characterCount, wordCount, paragraphCount]);

  // Закрытие dropdown при клике вне его области
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (languageDropdownOpen) {
        const dropdown = document.querySelector('.text-generator-language-selector');
        if (dropdown && !dropdown.contains(event.target as Node)) {
          setLanguageDropdownOpen(false);
        }
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [languageDropdownOpen]);

  // Генерация Lorem Ipsum
  const generateLoremIpsum = (length: number, mode: string): string => {
    const loremWords = [
      'lorem', 'ipsum', 'dolor', 'sit', 'amet', 'consectetur', 'adipiscing', 'elit', 'sed', 'do',
      'eiusmod', 'tempor', 'incididunt', 'ut', 'labore', 'et', 'dolore', 'magna', 'aliqua',
      'enim', 'ad', 'minim', 'veniam', 'quis', 'nostrud', 'exercitation', 'ullamco', 'laboris',
      'nisi', 'aliquip', 'ex', 'ea', 'commodo', 'consequat', 'duis', 'aute', 'irure', 'in',
      'reprehenderit', 'voluptate', 'velit', 'esse', 'cillum', 'fugiat', 'nulla', 'pariatur',
      'excepteur', 'sint', 'occaecat', 'cupidatat', 'non', 'proident', 'sunt', 'culpa', 'qui',
      'officia', 'deserunt', 'mollit', 'anim', 'id', 'est', 'laborum'
    ];

    if (mode === 'words') {
      const words = [];
      for (let i = 0; i < length; i++) {
        words.push(loremWords[Math.floor(Math.random() * loremWords.length)]);
      }
      return words.join(' ');
    } else {
      // По символам
      let text = '';
      while (text.length < length) {
        const word = loremWords[Math.floor(Math.random() * loremWords.length)];
        if (text.length + word.length + 1 <= length) {
          text += (text ? ' ' : '') + word;
        } else {
          break;
        }
      }
      return text;
    }
  };

  // Разбивка на абзацы
  const splitIntoParagraphs = (text: string, paragraphs: number): string => {
    if (paragraphs <= 1) {
      // Если один абзац, просто делаем первую букву заглавной
      return text.charAt(0).toUpperCase() + text.slice(1);
    }
    
    const words = text.split(' ');
    const wordsPerParagraph = Math.ceil(words.length / paragraphs);
    const result = [];
    
    for (let i = 0; i < paragraphs; i++) {
      const start = i * wordsPerParagraph;
      const end = Math.min(start + wordsPerParagraph, words.length);
      const paragraphWords = words.slice(start, end);
      if (paragraphWords.length > 0) {
        let paragraph = paragraphWords.join(' ');
        // Делаем первую букву абзаца заглавной
        paragraph = paragraph.charAt(0).toUpperCase() + paragraph.slice(1);
        result.push(paragraph);
      }
    }
    
    return result.join('\n\n');
  };

  // Основная функция генерации с AI
  const handleGenerateText = async () => {
    setAiError('');
    setIsGenerating(true);
    
    try {
      console.log('🤖 Generating text with AI...');
      console.log('Parameters:', { language, countMode, characterCount, wordCount, paragraphCount });
      
      // Для Lorem Ipsum используем старую логику
      if (language === 'lorem') {
        let generatedText = '';
        const currentLength = countMode === 'characters' ? characterCount : wordCount;
        generatedText = generateLoremIpsum(currentLength, countMode);
        const finalText = splitIntoParagraphs(generatedText, paragraphCount);
        setResult(finalText);
      } else {
        // Для других языков используем AI
        const response: TextGenerationResponse = await openaiService.generateText(
          language,
          characterCount,
          wordCount,
          paragraphCount,
          countMode as 'characters' | 'words'
        );
        
        if (response.success && response.text) {
          setResult(response.text);
          console.log('✅ AI text generated successfully');
        } else {
          setAiError(response.error || 'Не удалось сгенерировать текст');
          console.error('❌ AI generation failed:', response.error);
        }
      }
      
    } catch (error) {
      console.error('💥 Error during text generation:', error);
      setAiError('Произошла ошибка при генерации текста');
    } finally {
      setIsGenerating(false);
      
      // Обновляем статистику
      statsService.incrementLaunchCount('text-generator');
      setLaunchCount(prev => prev + 1);
    }
  };

  // Копирование результата
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

  // Подсчет строк
  const countLines = (text: string): number => {
    if (text === '') return 0;
    return text.split('\n').length;
  };

  return (
    <div className="text-generator-tool">
      {/* Шапка инструмента */}
      <div className="tool-header-island">
        <Link to="/" className="back-button">
          <img src="/icons/arrow_left.svg" alt="" />
          Все инструменты
        </Link>
        <h1 className="tool-title">Генератор текста</h1>
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

      {/* Рабочая область с особой структурой */}
      <div className="main-workspace">
        {/* Левая колонка с настройками */}
        <div className="settings-section">
          {/* Первая группа - выбор языка */}
          <div className="settings-group">
            <div className="text-generator-language-selector">
              <label className="language-label">Язык текста:</label>
              <div className="dropdown-container">
                <button 
                  className="dropdown-toggle"
                  onClick={() => setLanguageDropdownOpen(!languageDropdownOpen)}
                  type="button"
                >
                  <span>{languageOptions[language as keyof typeof languageOptions]}</span>
                  <span className="dropdown-arrow">▼</span>
                </button>
                {languageDropdownOpen && (
                  <div className="dropdown-menu">
                    {Object.entries(languageOptions).map(([key, name]) => (
                      <div 
                        key={key}
                        className={`dropdown-option ${language === key ? 'selected' : ''}`}
                        onClick={() => {
                          setLanguage(key);
                          setLanguageDropdownOpen(false);
                        }}
                      >
                        {name}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Вторая группа - все остальные настройки */}
          <div className="settings-group">
            {/* Тумблер счета символов/слов */}
            <div className="count-mode-toggle">
              <div className="count-mode-block">
                <div className="toggle-container">
                  <span className="toggle-label-left">Считаем символы</span>
                  <label className="toggle-switch">
                    <input
                      type="checkbox"
                      checked={countMode === 'words'}
                      onChange={(e) => setCountMode(e.target.checked ? 'words' : 'characters')}
                    />
                    <span className="toggle-slider"></span>
                  </label>
                  <span className="toggle-label-right">Считаем слова</span>
                </div>
              </div>
            </div>

            {/* Слайдер количества символов/слов */}
            <div className="count-slider-container">
              <label className="slider-label">
                Количество {countMode === 'characters' ? 'символов' : 'слов'}:
              </label>
              <div className="slider-group">
                <div className="slider-container">
                  <input
                    type="range"
                    min={countMode === 'characters' ? 50 : 10}
                    max={countMode === 'characters' ? 2000 : 500}
                    value={countMode === 'characters' ? characterCount : wordCount}
                    onChange={(e) => {
                      if (countMode === 'characters') {
                        setCharacterCount(parseInt(e.target.value));
                      } else {
                        setWordCount(parseInt(e.target.value));
                      }
                    }}
                    className="count-slider"
                  />
                </div>
                <div className="slider-value">
                  {countMode === 'characters' ? characterCount : wordCount}
                </div>
              </div>
            </div>

            {/* Слайдер количества абзацев */}
            <div className="count-slider-container">
              <label className="slider-label">Количество абзацев:</label>
              <div className="slider-group">
                <div className="slider-container">
                  <input
                    type="range"
                    min="1"
                    max="10"
                    value={paragraphCount}
                    onChange={(e) => setParagraphCount(parseInt(e.target.value))}
                    className="count-slider"
                  />
                </div>
                <div className="slider-value">{paragraphCount}</div>
              </div>
            </div>
          </div>
        </div>

        {/* Правая колонка с полем результата */}
        <div className="result-section">
          <div className="result-textarea-container">
            <textarea
              className="result-textarea"
              value={result}
              readOnly
              placeholder="Здесь будет результат"
            />
            {isGenerating && (
              <div className="ai-loading-overlay">
                <div className="loading-spinner"></div>
                <div className="loading-text">
                  <p>Генерируем текст с помощью ИИ.</p>
                  <p>Это может занять до 1 минуты.</p>
                  <p>Пожалуйста, не закрывайте инструмент.</p>
                </div>
              </div>
            )}
          </div>
          <div className="result-controls">
            <span className="result-counter">{countLines(result)} стр.</span>
          </div>
        </div>
      </div>

      {/* Кнопки управления */}
      <div className="control-buttons">
        {/* Отображение ошибки AI */}
        {aiError && (
          <div style={{
            color: '#d73a49',
            fontSize: '14px',
            marginBottom: '12px',
            padding: '8px',
            backgroundColor: '#ffeaea',
            borderRadius: '4px',
            border: '1px solid #f0b4b4',
            width: '445px'
          }}>
            {aiError}
          </div>
        )}
        
        <button 
          className="action-btn primary" 
          style={{ width: '445px' }} 
          onClick={handleGenerateText}
          disabled={isGenerating}
        >
          {isGenerating ? 'Генерируем текст...' : 'Показать результат'}
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
    </div>
  );
};

export default TextGeneratorTool;