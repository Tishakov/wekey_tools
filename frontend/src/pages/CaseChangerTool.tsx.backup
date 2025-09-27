import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { statsService } from '../utils/statsService';
import { useLocalizedLink } from '../hooks/useLanguageFromUrl';
import SEOHead from '../components/SEOHead';
import '../styles/tool-pages.css';
import { useAuthRequired } from '../hooks/useAuthRequired';
import AuthRequiredModal from '../components/AuthRequiredModal';
import AuthModal from '../components/AuthModal';
import './CaseChangerTool.css';


const TOOL_ID = 'case-changer';
const CaseChangerTool: React.FC = () => {
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
  const [outputText, setOutputText] = useState('');
  const [launchCount, setLaunchCount] = useState(0);
  const [selectedCase, setSelectedCase] = useState('');
  const [exceptions, setExceptions] = useState('');
  const [presetWords] = useState('и\nили\nа\nс\nз\nпод\nпри\nна\nв\nо\nот\nк\nу\nпо\nза\nдля\nбез\nиз\nчерез\nмежду\nнад\nобо\nперед\nперед');

  // Загружаем счетчик запусков при монтировании компонента
  useEffect(() => {
    const loadStats = async () => {
      const count = await statsService.getLaunchCount(TOOL_ID);
      setLaunchCount(count);
    };
    loadStats();
  }, []);

  const handlePasteText = async () => {
    try {
      const text = await navigator.clipboard.readText();
      setInputText(text);
    } catch (err) {
      console.error('Ошибка при вставке текста:', err);
    }
  };

  const handleRadioClick = (currentValue: string, setValue: (value: string) => void, clickedValue: string) => {
    if (currentValue === clickedValue) {
      setValue(''); // Снимаем выбор если кликнули по уже выбранной радиокнопке
    } else {
      setValue(clickedValue); // Устанавливаем новое значение
    }
  };

  const handleTransferWords = () => {
    // Переносим слова из готового списка в поле исключений
    const currentExceptions = exceptions.trim();
    const newWords = presetWords;
    
    if (currentExceptions === '') {
      setExceptions(newWords);
    } else {
      // Если уже есть исключения, добавляем новые через перенос строки
      setExceptions(currentExceptions + '\n' + newWords);
    }
  };

  const handleShowResult = async () => {
        // Проверяем авторизацию перед выполнением
        if (!requireAuth()) {
            return; // Если пользователь не авторизован, показываем модальное окно и прерываем выполнение
        }


    if (!selectedCase) {
      setOutputText('');
      return;
    }

    let result = inputText;
    
    // Увеличиваем счетчик запусков и получаем актуальное значение
    try {
      const newCount = await statsService.incrementAndGetCount(TOOL_ID, {
        inputLength: inputText.length
      });
      setLaunchCount(newCount);
    } catch (error) {
      console.error('Failed to update stats:', error);
      setLaunchCount(prev => prev + 1);
    }
    
    // Применяем выбранное правило изменения регистра
    switch (selectedCase) {
      case 'lowercase':
        result = result.toLowerCase();
        break;
      case 'uppercase':
        result = result.toUpperCase();
        break;
      case 'capitalize-each':
        result = capitalizeEachWord(result);
        break;
      case 'capitalize-first':
        result = capitalizeFirstLetter(result);
        break;
      case 'capitalize-after-punctuation':
        result = capitalizeAfterPunctuation(result);
        break;
      default:
        break;
    }
    
    setOutputText(result);
  };

  const capitalizeEachWord = (text: string): string => {
    // Получаем список исключений
    const exceptionList = exceptions
      .toLowerCase()
      .split('\n')
      .map(word => word.trim())
      .filter(word => word.length > 0);

    // Используем регулярное выражение для всех букв (кириллица + латиница)
    return text.replace(/[а-яёa-z]+/gi, (word) => {
      const lowerWord = word.toLowerCase();
      
      // Проверяем, есть ли слово в списке исключений
      if (exceptionList.includes(lowerWord)) {
        return lowerWord;
      }
      
      // Делаем первую букву заглавной
      return word.charAt(0).toUpperCase() + word.slice(1).toLowerCase();
    });
  };

  const capitalizeFirstLetter = (text: string): string => {
    if (text.length === 0) return text;
    return text.charAt(0).toUpperCase() + text.slice(1).toLowerCase();
  };

  const capitalizeAfterPunctuation = (text: string): string => {
    return text.replace(/(^|[.!?]\s*)([a-zа-яё])/gi, (_, punctuation, letter) => {
      return punctuation + letter.toUpperCase();
    });
  };

  const handleCopyResult = async () => {
    try {
      await navigator.clipboard.writeText(outputText);
    } catch (err) {
      console.error('Ошибка при копировании текста:', err);
    }
  };

  const countLines = (text: string): number => {
    if (text === '') return 0;
    return text.split('\n').length;
  };

  return (
    <div className="case-changer-tool">
      <SEOHead 
        title={t('caseChangerTool.title')}
        description={t('caseChangerTool.description')}
      />
      {/* Header-остров инструмента */}
      <div className="tool-header-island">
        <Link to={createLink('')} className="back-button">
          <img src="/icons/arrow_left.svg" alt="" />
          {t('navigation.allTools')}
        </Link>
        <h1 className="tool-title">{t('caseChangerTool.title')}</h1>
        <div className="tool-header-buttons">
          <button className="tool-header-btn counter-btn" title="Счетчик запусков">
            <img src="/icons/rocket.svg" alt="" />
            <span className="counter">{launchCount}</span>
          </button>
          <button className="tool-header-btn icon-only" title="Подсказки">
            <img src="/icons/lamp.svg" alt="" />
          </button>
          <button className="tool-header-btn icon-only" title="Скриншот">
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
            onChange={(e) => setInputText(e.target.value)}
            placeholder={t('caseChangerTool.inputPlaceholder')}
          />
          <div className="input-controls">
            <button className="paste-button" onClick={handlePasteText}>
              <img src="/icons/button_paste.svg" alt="" />
              {t('caseChangerTool.buttons.paste')}
            </button>
            <span className="info">{countLines(inputText)} стр.</span>
          </div>
        </div>

        {/* Правая часть - настройки */}
        <div className="settings-section">
          {/* Группа настроек регистра */}
          <div className="settings-group">
            <label className="radio-item">
              <input
                type="radio"
                name="case"
                value="lowercase"
                checked={selectedCase === 'lowercase'}
                onClick={() => handleRadioClick(selectedCase, setSelectedCase, 'lowercase')}
                onChange={() => {}} // Пустой onChange чтобы React не ругался
              />
              {t('caseChangerTool.options.lowercase')}
            </label>
            <label className="radio-item">
              <input
                type="radio"
                name="case"
                value="uppercase"
                checked={selectedCase === 'uppercase'}
                onClick={() => handleRadioClick(selectedCase, setSelectedCase, 'uppercase')}
                onChange={() => {}} // Пустой onChange чтобы React не ругался
              />
              {t('caseChangerTool.options.uppercase')}
            </label>
            <label className="radio-item">
              <input
                type="radio"
                name="case"
                value="capitalize-each"
                checked={selectedCase === 'capitalize-each'}
                onClick={() => handleRadioClick(selectedCase, setSelectedCase, 'capitalize-each')}
                onChange={() => {}} // Пустой onChange чтобы React не ругался
              />
              {t('caseChangerTool.options.capitalizeEach')}
            </label>
            <label className="radio-item">
              <input
                type="radio"
                name="case"
                value="capitalize-first"
                checked={selectedCase === 'capitalize-first'}
                onClick={() => handleRadioClick(selectedCase, setSelectedCase, 'capitalize-first')}
                onChange={() => {}} // Пустой onChange чтобы React не ругался
              />
              {t('caseChangerTool.options.capitalizeFirst')}
            </label>
            <label className="radio-item">
              <input
                type="radio"
                name="case"
                value="capitalize-after-punctuation"
                checked={selectedCase === 'capitalize-after-punctuation'}
                onClick={() => handleRadioClick(selectedCase, setSelectedCase, 'capitalize-after-punctuation')}
                onChange={() => {}} // Пустой onChange чтобы React не ругался
              />
              {t('caseChangerTool.options.capitalizeAfterPunctuation')}
            </label>
          </div>

          {/* Блок исключений (показывается только при выборе "Каждое С Заглавной") */}
          {selectedCase === 'capitalize-each' && (
            <div className="exceptions-block">
              <div className="exceptions-fields">
                <div className="exceptions-left">
                  <textarea
                    className="exceptions-textarea"
                    value={exceptions}
                    onChange={(e) => setExceptions(e.target.value)}
                    placeholder={t('caseChangerTool.exceptions.placeholder')}
                    rows={4}
                  />
                </div>
                <div className="exceptions-right">
                  <textarea
                    className="exceptions-textarea preset-words"
                    value={presetWords}
                    readOnly
                    rows={4}
                  />
                  <button className="transfer-button" onClick={handleTransferWords}>
                    <img src="/icons/arrow_left.svg" alt="" />
                    {t('caseChangerTool.exceptions.transferButton')}
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Кнопки управления */}
      <div className="control-buttons">
        <button className="action-btn primary" style={{ width: '445px' }} onClick={handleShowResult}>
          {t('caseChangerTool.buttons.showResult')}
        </button>
        <button className="action-btn secondary icon-left" style={{ width: '445px' }} onClick={handleCopyResult}>
          <img src="/icons/button_copy.svg" alt="" />
          {t('caseChangerTool.buttons.copyResult')}
        </button>
      </div>

      {/* Поле результата */}
      <div className="result-section">
        <textarea
          className="result-textarea"
          value={outputText}
          readOnly
          placeholder={t('caseChangerTool.resultPlaceholder')}
        />
        <div className="result-controls">
          <span className="result-counter">{countLines(outputText)} стр.</span>
        </div>
      </div>

      {/* SEO блок */}
      <div className="seo-section">
        <h3>{t('caseChangerTool.seo.whatIs')}</h3>
        <p>{t('caseChangerTool.seo.whatIsText')}</p>

        <h3>{t('caseChangerTool.seo.whyNeed')}</h3>
        <p>{t('caseChangerTool.seo.whyNeedText')}</p>

        <h3>{t('caseChangerTool.seo.whatOptions')}</h3>
        <p>{t('caseChangerTool.seo.whatOptionsText')}</p>

        <h3>{t('caseChangerTool.seo.howExceptions')}</h3>
        <p>{t('caseChangerTool.seo.howExceptionsText')}</p>

        <h3>{t('caseChangerTool.seo.whoUseful')}</h3>
        <p>{t('caseChangerTool.seo.whoUsefulText')}</p>
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

export default CaseChangerTool;