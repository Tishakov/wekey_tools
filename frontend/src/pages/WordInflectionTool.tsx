import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { statsService } from '../utils/statsService';
import { useLocalizedLink } from '../hooks/useLanguageFromUrl';
import { openaiService, type WordInflectionResponse } from '../services/openaiService';
import { useAuthRequired } from '../hooks/useAuthRequired';
import AuthRequiredModal from '../components/AuthRequiredModal';
import AuthModal from '../components/AuthModal';


const TOOL_ID = 'word-declension';
const WordInflectionTool: React.FC = () => {
  const { t } = useTranslation();

// Auth Required Hook
    const {
        isAuthRequiredModalOpen,
        isAuthModalOpen,
        requireAuth,
        closeAuthRequiredModal,
        closeAuthModal,
        openAuthModal
    } = useAuthRequired();
  const { createLink } = useLocalizedLink();
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
    statsService.getLaunchCount(TOOL_ID).then(setLaunchCount);
  }, []);

  // Обработка текста и генерация склонений через ChatGPT
  const generateInflections = async () => {
    // Проверяем авторизацию перед выполнением
    if (!requireAuth()) {
      return; // Если пользователь не авторизован, показываем модальное окно и прерываем выполнение
    }

    if (!inputText.trim()) {
      setResult('');
      return;
    }

    setAiError('');
    setIsGenerating(true);
    
    try {
      console.log('🤖 Generating word inflections with AI for:', inputText);
      console.log('🌐 Selected language:', selectedLanguage);
      
      const response: WordInflectionResponse = await openaiService.generateWordInflections(inputText, selectedLanguage);
      
      if (response.success && response.inflections) {
        setResult(response.inflections.join('\n'));
        console.log('✅ AI inflections generated:', response.inflections.length, 'items');
      } else {
        setAiError(response.error || t('wordInflection.ai.error'));
        console.error('❌ AI generation failed:', response.error);
      }
      
    } catch (error) {
      console.error('💥 Error during word inflection generation:', error);
      setAiError(t('wordInflection.ai.error'));
    } finally {
      setIsGenerating(false);
    }
    
    // Обновляем статистику и получаем актуальное значение
    try {
      const newCount = await statsService.incrementAndGetCount(TOOL_ID, {
        inputLength: inputText.length,
        outputLength: result.length
      });
      setLaunchCount(newCount);
    } catch (error) {
      console.error('Failed to update stats:', error);
      setLaunchCount(prev => prev + 1);
    }
  };

  // Обработка копирования
  const handleCopy = async () => {
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

  // Обработка нажатия клавиш в textarea
  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === ' ') {
      e.preventDefault(); // Предотвращаем ввод пробела
      
      // Получаем текущую позицию курсора
      const textarea = e.currentTarget;
      const cursorPosition = textarea.selectionStart;
      
      // Вставляем перенос строки вместо пробела
      const newText = inputText.slice(0, cursorPosition) + '\n' + inputText.slice(cursorPosition);
      setInputText(newText);
      
      // Устанавливаем курсор на новую позицию (после переноса строки)
      setTimeout(() => {
        textarea.setSelectionRange(cursorPosition + 1, cursorPosition + 1);
      }, 0);
    }
  };

  return (
    <div className="word-inflection-tool">
      {/* Header-остров инструмента */}
      <div className="tool-header-island">
        <Link to={createLink('')} className="back-button">
          <img src="/icons/arrow_left.svg" alt="" />
          {t('navigation.allTools')}
        </Link>
        <h1 className="tool-title">{t('wordInflection.title')}</h1>
        <div className="tool-header-buttons">
          <button className="tool-header-btn counter-btn" title={t('navigation.launchCounter')}>
            <img src="/icons/rocket.svg" alt="" />
            <span className="counter">{launchCount}</span>
          </button>
          <button className="tool-header-btn icon-only" title={t('navigation.hints')}>
            <img src="/icons/lamp.svg" alt="" />
          </button>
          <button className="tool-header-btn icon-only" title={t('navigation.screenshot')}>
            <img src="/icons/camera.svg" alt="" />
          </button>
        </div>
      </div>

      {/* Основная рабочая область */}
      <div className="main-workspace">
        {/* Левая колонка - ввод текста */}
        <div className="input-section">
          <textarea
            className="input-textarea"
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={t('wordInflection.placeholders.input')}
          />
          <div className="input-controls">
            <div className="left-controls">
              <button 
                className="paste-button"
                onClick={handlePaste}
              >
                <img src="/icons/button_paste.svg" alt="" />
                {t('wordInflection.buttons.paste')}
              </button>
              <select 
                value={selectedLanguage}
                onChange={(e) => setSelectedLanguage(e.target.value)}
                className="language-selector"
              >
                <option value="russian">{t('wordInflection.languages.russian')}</option>
                <option value="ukrainian">{t('wordInflection.languages.ukrainian')}</option>
                <option value="english">{t('wordInflection.languages.english')}</option>
              </select>
            </div>
            <div className="info">
              {getLineCount(inputText)} {t('wordInflection.counters.lines')}
            </div>
          </div>
        </div>

        {/* Правая колонка - результат */}
        <div className="result-section">
          <div className="result-textarea-container">
            <textarea
              className="result-textarea"
              value={result}
              placeholder={t('wordInflection.placeholders.result')}
              readOnly
            />
            {isGenerating && (
              <div className="ai-loading-overlay">
                <div className="loading-spinner"></div>
                <div className="loading-text">
                  <p>{t('wordInflection.ai.loading.title')}</p>
                  <p>{t('wordInflection.ai.loading.subtitle')}</p>
                  <p>{t('wordInflection.ai.loading.warning')}</p>
                </div>
              </div>
            )}
          </div>
          <div className="result-controls">
            <div className="result-counter">
              {getLineCount(result)} {t('wordInflection.counters.lines')}
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
          onClick={generateInflections}
          disabled={!inputText.trim() || isGenerating}
        >
          {isGenerating ? t('wordInflection.buttons.generating') : t('wordInflection.buttons.showResult')}
        </button>
        
        <button 
          className="action-btn secondary icon-left" 
          style={{ width: '445px' }} 
          onClick={handleCopy}
          disabled={!result}
        >
          <img src="/icons/button_copy.svg" alt="" />
          {copied ? t('wordInflection.buttons.copied') : t('wordInflection.buttons.copy')}
        </button>
      </div>

      {/* SEO секция */}
      <div className="seo-section">
        <div className="seo-content">
          <div className="seo-item">
            <p>{t('wordInflection.seo.toolDescription')}</p>
          </div>
          
          <div className="seo-item">
            <h2>{t('wordInflection.seo.whatIsWordInflection')}</h2>
            <p>{t('wordInflection.seo.whatIsWordInflectionContent')}</p>
          </div>
          
          <div className="seo-item">
            <h2>{t('wordInflection.seo.whyNeeded')}</h2>
            <h3>{t('wordInflection.seo.whyNeededSubtitle')}</h3>
            <p>{t('wordInflection.seo.whyNeededContent')}</p>
          </div>
          
          <div className="seo-item">
            <h2>{t('wordInflection.seo.howItWorks')}</h2>
            <h3>{t('wordInflection.seo.howItWorksSubtitle')}</h3>
            <p>{t('wordInflection.seo.howItWorksContent')}</p>
          </div>
          
          <div className="seo-item">
            <h2>{t('wordInflection.seo.whatWords')}</h2>
            <p>{t('wordInflection.seo.whatWordsContent')}</p>
          </div>
          
          <div className="seo-item">
            <h2>{t('wordInflection.seo.forSpecialists')}</h2>
            <p>{t('wordInflection.seo.forSpecialistsContent')}</p>
          </div>
          
          <div className="seo-item">
            <h2>{t('wordInflection.seo.howToUse')}</h2>
            <p>{t('wordInflection.seo.howToUseContent')}</p>
          </div>
        </div>
      </div>

      {/* Модальные окна для авторизации */}
      <AuthRequiredModal
        isOpen={isAuthRequiredModalOpen}
        onClose={closeAuthRequiredModal}
        onLoginClick={openAuthModal}
      />

      <AuthModal
        isOpen={isAuthModalOpen}
        onClose={closeAuthModal}
        initialMode="login"
      />
    </div>
  );
};

export default WordInflectionTool;