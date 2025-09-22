import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { statsService } from '../utils/statsService';
import { openaiService, type SynonymResponse } from '../services/openaiService';


const TOOL_ID = 'synonym-generator';
const SynonymGeneratorTool: React.FC = () => {
  const { t } = useTranslation();
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
    statsService.getLaunchCount(TOOL_ID).then(setLaunchCount);
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
        setAiError(response.error || t('synonymGenerator.errors.noSynonyms'));
        console.error('❌ AI generation failed:', response.error);
      }
      
    } catch (error) {
      console.error('💥 Error during synonym generation:', error);
      setAiError(t('synonymGenerator.errors.generic'));
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
          {t('synonymGenerator.allTools')}
        </button>
        <h1 className="tool-title">{t('synonymGenerator.title')}</h1>
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
          <textarea
            className="input-textarea"
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            placeholder={t('synonymGenerator.inputPlaceholder')}
          />
          <div className="input-controls">
            <div className="left-controls">
              <button 
                className="paste-button"
                onClick={handlePaste}
              >
                <img src="/icons/button_paste.svg" alt="" />
                {t('synonymGenerator.buttons.paste')}
              </button>
              <select 
                value={selectedLanguage}
                onChange={(e) => setSelectedLanguage(e.target.value)}
                className="language-selector"
              >
                <option value="russian">{t('synonymGenerator.languages.russian')}</option>
                <option value="ukrainian">{t('synonymGenerator.languages.ukrainian')}</option>
                <option value="english">{t('synonymGenerator.languages.english')}</option>
              </select>
            </div>
            <div className="info">
              {getLineCount(inputText)} {t('synonymGenerator.lineCount')}
            </div>
          </div>
        </div>

        {/* Правая колонка - результат */}
        <div className="result-section">
          <div className="result-textarea-container">
            <textarea
              className="result-textarea"
              value={result}
              placeholder={t('synonymGenerator.resultPlaceholder')}
              readOnly
            />
            {isGenerating && (
              <div className="ai-loading-overlay">
                <div className="loading-spinner"></div>
                <div className="loading-text">
                  <p>{t('synonymGenerator.loading.title')}</p>
                  <p>{t('synonymGenerator.loading.subtitle')}</p>
                  <p>{t('synonymGenerator.loading.warning')}</p>
                </div>
              </div>
            )}
          </div>
          <div className="result-controls">
            <div className="result-counter">
              {getLineCount(result)} {t('synonymGenerator.lineCount')}
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
          {isGenerating ? t('synonymGenerator.buttons.generating') : t('synonymGenerator.buttons.showResult')}
        </button>
        
        <button 
          className="action-btn secondary icon-left" 
          style={{ width: '445px' }} 
          onClick={handleCopy}
          disabled={!result}
        >
          <img src="/icons/button_copy.svg" alt="" />
          {copied ? t('synonymGenerator.buttons.copied') : t('synonymGenerator.buttons.copy')}
        </button>
      </div>

      {/* SEO секция */}
      <div className="seo-section">
        <div className="seo-content">
          <div className="seo-item">
            <h2>{t('synonymGenerator.seo.whatIsSynonymGenerator.title')}</h2>
            <p>{t('synonymGenerator.seo.whatIsSynonymGenerator.text')}</p>
          </div>
          
          <div className="seo-item">
            <h2>{t('synonymGenerator.seo.whyNeeded.title')}</h2>
            <p>{t('synonymGenerator.seo.whyNeeded.text')}</p>
          </div>
          
          <div className="seo-item">
            <h2>{t('synonymGenerator.seo.howItWorks.title')}</h2>
            <p>{t('synonymGenerator.seo.howItWorks.text')}</p>
          </div>
          
          <div className="seo-item">
            <h2>{t('synonymGenerator.seo.whatTexts.title')}</h2>
            <p>{t('synonymGenerator.seo.whatTexts.text')}</p>
          </div>
          
          <div className="seo-item">
            <h2>{t('synonymGenerator.seo.forSpecialists.title')}</h2>
            <p>{t('synonymGenerator.seo.forSpecialists.text')}</p>
          </div>
          
          <div className="seo-item">
            <h2>{t('synonymGenerator.seo.howToUse.title')}</h2>
            <p>{t('synonymGenerator.seo.howToUse.text')}</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SynonymGeneratorTool;