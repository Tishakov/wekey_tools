import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { statsService } from '../utils/statsService';
import { openaiService, type SynonymResponse } from '../services/openaiService';

const SynonymGeneratorTool: React.FC = () => {
  const navigate = useNavigate();
  const [inputText, setInputText] = useState('');
  const [result, setResult] = useState('');
  const [copied, setCopied] = useState(false);
  const [launchCount, setLaunchCount] = useState(0);
  
  // Состояния для работы с AI API
  const [isGenerating, setIsGenerating] = useState(false);
  const [aiError, setAiError] = useState('');
  const [selectedLanguage, setSelectedLanguage] = useState('russian');

  // Загружаем статистику при инициализации
  useEffect(() => {
    setLaunchCount(statsService.getLaunchCount('synonym-generator'));
  }, []);

  // Обработка текста и генерация синонимов через ChatGPT
  const generateSynonyms = async () => {
    if (!inputText.trim()) {
      setResult('');
      return;
    }

    setAiError('');
    setIsGenerating(true);
    
    try {
      console.log('🤖 Generating synonyms with AI for:', inputText);
      console.log('🌐 Selected language:', selectedLanguage);
      
      const response: SynonymResponse = await openaiService.generateSynonyms(inputText, selectedLanguage);
      
      if (response.success && response.synonyms) {
        setResult(response.synonyms.join('\n'));
        console.log('✅ AI synonyms generated:', response.synonyms.length, 'items');
      } else {
        setAiError(response.error || 'Не удалось сгенерировать синонимы');
        console.error('❌ AI generation failed:', response.error);
      }
      
    } catch (error) {
      console.error('💥 Error during synonym generation:', error);
      setAiError('Произошла ошибка при генерации синонимов');
    } finally {
      setIsGenerating(false);
    }
    
    // Обновляем статистику
    statsService.incrementLaunchCount('synonym-generator');
    setLaunchCount(prev => prev + 1);
  };

  // Обработка копирования
  const handleCopy = () => {
    if (result) {
      navigator.clipboard.writeText(result);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  // Обработка нажатия Ctrl+V
  const handlePaste = async () => {
    try {
      const text = await navigator.clipboard.readText();
      setInputText(text);
    } catch (err) {
      console.error('Failed to read clipboard contents: ', err);
    }
  };

  // Подсчет строк
  const getLineCount = (text: string): number => {
    return text ? text.split('\n').length : 0;
  };

  return (
    <div className="synonym-generator-tool">
      {/* Header-остров инструмента */}
      <div className="tool-header-island">
        <button 
          className="back-button"
          onClick={() => navigate('/')}
        >
          <img src="/icons/arrow_left.svg" alt="" />
          Все инструменты
        </button>
        <h1 className="tool-title">Генератор синонимов</h1>
        <div className="tool-header-buttons">
          <button className="tool-header-btn counter-btn">
            <img src="/icons/rocket.svg" alt="" />
            <span className="counter">{launchCount}</span>
          </button>
          <button className="tool-header-btn icon-only">
            <img src="/icons/lamp.svg" alt="" />
          </button>
          <button className="tool-header-btn icon-only">
            <img src="/icons/camera.svg" alt="" />
          </button>
        </div>
      </div>

      {/* Основная рабочая область */}
      <div className="main-workspace">
        {/* Левая колонка - ввод текста */}
        <div className="input-section">
          {/* Select языка в правом верхнем углу textarea */}
          <select 
            value={selectedLanguage}
            onChange={(e) => setSelectedLanguage(e.target.value)}
            style={{
              position: 'absolute',
              top: '10px',
              right: '10px',
              padding: '4px 8px',
              borderRadius: '8px',
              border: '1px solid #555',
              fontSize: '14px',
              backgroundColor: '#333335',
              color: '#BCBBBD',
              outline: 'none',
              zIndex: 10,
              fontFamily: 'Gilroy, sans-serif',
              paddingRight: '24px',
              height: '35px',
              width: '110px',
              backgroundImage: `url("data:image/svg+xml,%3csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 20 20'%3e%3cpath stroke='%23BCBBBD' stroke-linecap='round' stroke-linejoin='round' stroke-width='1.5' d='m6 8 4 4 4-4'/%3e%3c/svg%3e")`,
              backgroundPosition: 'right 5px center',
              backgroundRepeat: 'no-repeat',
              backgroundSize: '16px',
              appearance: 'none',
              WebkitAppearance: 'none',
              MozAppearance: 'none'
            }}
          >
            <option value="russian">Русский</option>
            <option value="ukrainian">Українська</option>
            <option value="english">English</option>
          </select>
          
          <textarea
            className="input-textarea"
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            placeholder="Введите слова или фразы..."
            style={{ position: 'relative' }}
          />
          <div className="input-controls">
            <button 
              className="paste-button"
              onClick={handlePaste}
            >
              <img src="/icons/button_paste.svg" alt="" />
              Вставить
            </button>
            <div className="char-counter">
              {getLineCount(inputText)} стр.
            </div>
          </div>
        </div>

        {/* Правая колонка - результат */}
        <div className="result-section">
          <div className="result-textarea-container">
            <textarea
              className="result-textarea"
              value={result}
              placeholder="Здесь будет результат"
              readOnly
            />
            {isGenerating && (
              <div className="ai-loading-overlay">
                <div className="loading-spinner"></div>
                <div className="loading-text">
                  <p>Генерируем синонимы для ваших слов.</p>
                  <p>Это может занять до 1 минуты.</p>
                  <p>Пожалуйста, не закрывайте инструмент.</p>
                </div>
              </div>
            )}
          </div>
          <div className="result-controls">
            <div className="result-counter">
              {getLineCount(result)} стр.
            </div>
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
          onClick={generateSynonyms}
          disabled={!inputText.trim() || isGenerating}
        >
          {isGenerating ? 'Генерация синонимов...' : 'Показать результат'}
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

export default SynonymGeneratorTool;