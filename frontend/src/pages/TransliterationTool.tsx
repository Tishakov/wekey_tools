import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useLocalizedLink } from '../hooks/useLanguageFromUrl';
import SEOHead from '../components/SEOHead';
import { statsService } from '../utils/statsService';
import '../styles/tool-pages.css';
import { useAuthRequired } from '../hooks/useAuthRequired';
import { useToolWithCoins } from '../hooks/useToolWithCoins';
import AuthRequiredModal from '../components/AuthRequiredModal';
import AuthModal from '../components/AuthModal';
import './TransliterationTool.css';


const TOOL_ID = 'transliteration';
const TransliterationTool: React.FC = () => {
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
    const { executeWithCoins } = useToolWithCoins(TOOL_ID);
  const [inputText, setInputText] = useState('');
  const [outputText, setOutputText] = useState('');
  const [launchCount, setLaunchCount] = useState(0);
  
  // Состояние для чекбоксов первой группы
  const [replaceSpaces, setReplaceSpaces] = useState(false);
  const [removeQuotes, setRemoveQuotes] = useState(false);
  
  // Состояние для радио-кнопок второй группы (регистр)
  const [caseOption, setCaseOption] = useState('');
  
  // Состояние для чекбоксов третьей группы (пробелы)
  const [removeDoubleSpaces, setRemoveDoubleSpaces] = useState(false);
  const [trimEdges, setTrimEdges] = useState(false);

  // Загружаем счетчик запусков при монтировании компонента
  useEffect(() => {
    statsService.getLaunchCount(TOOL_ID).then(setLaunchCount);
  }, []);

  const handlePasteText = async () => {
    try {
      const text = await navigator.clipboard.readText();
      setInputText(text);
    } catch (err) {
      console.error('Ошибка при вставке текста:', err);
    }
  };

  const handleShowResult = async () => {
        // Проверяем авторизацию перед выполнением
        if (!requireAuth()) {
            return; // Если пользователь не авторизован, показываем модальное окно и прерываем выполнение

        }
        // Выполняем операцию с тратой коинов
        await executeWithCoins(async () => {
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
    
    // ОСНОВНАЯ ФУНКЦИЯ: Всегда применяем транслитерацию
    result = transliterate(result);
    
    // Применяем правила первой группы (чекбоксы)
    if (replaceSpaces) {
      result = result.replace(/ /g, '-');
    }
    if (removeQuotes) {
      result = result.replace(/['"]/g, '');
    }
    
    // Применяем правила второй группы (регистр)
    if (caseOption === 'lowercase') {
      result = result.toLowerCase();
    } else if (caseOption === 'uppercase') {
      result = result.toUpperCase();
    }
    
    // Применяем правила третьей группы (пробелы) - чекбоксы
    if (removeDoubleSpaces) {
      result = result.replace(/  +/g, ' ');
    }
    if (trimEdges) {
      result = result.split('\n').map(line => line.trim()).join('\n');
    }
    
    setOutputText(result);
        }, {
            inputLength: inputText ? inputText.length : 0
        });
    };

  const handleCopyResult = async () => {
    try {
      await navigator.clipboard.writeText(outputText);
    } catch (err) {
      console.error('Ошибка при копировании текста:', err);
    }
  };

  const handleRadioClick = (currentValue: string, setValue: (value: string) => void, clickedValue: string) => {
    if (currentValue === clickedValue) {
      setValue(''); // Снимаем выбор если кликнули по уже выбранной радиокнопке
    } else {
      setValue(clickedValue); // Устанавливаем новое значение
    }
  };

  const countLines = (text: string): number => {
    if (text === '') return 0;
    // Считаем количество переносов + 1 (последняя строка)
    return text.split('\n').length;
  };

  const transliterate = (text: string): string => {
    const transliterationMap: Record<string, string> = {
      'а': 'a', 'б': 'b', 'в': 'v', 'г': 'g', 'д': 'd', 'е': 'e', 'ё': 'yo',
      'ж': 'zh', 'з': 'z', 'и': 'i', 'й': 'y', 'к': 'k', 'л': 'l', 'м': 'm',
      'н': 'n', 'о': 'o', 'п': 'p', 'р': 'r', 'с': 's', 'т': 't', 'у': 'u',
      'ф': 'f', 'х': 'h', 'ц': 'ts', 'ч': 'ch', 'ш': 'sh', 'щ': 'sch',
      'ъ': '', 'ы': 'y', 'ь': '', 'э': 'e', 'ю': 'yu', 'я': 'ya',
      'А': 'A', 'Б': 'B', 'В': 'V', 'Г': 'G', 'Д': 'D', 'Е': 'E', 'Ё': 'Yo',
      'Ж': 'Zh', 'З': 'Z', 'И': 'I', 'Й': 'Y', 'К': 'K', 'Л': 'L', 'М': 'M',
      'Н': 'N', 'О': 'O', 'П': 'P', 'Р': 'R', 'С': 'S', 'Т': 'T', 'У': 'U',
      'Ф': 'F', 'Х': 'H', 'Ц': 'Ts', 'Ч': 'Ch', 'Ш': 'Sh', 'Щ': 'Sch',
      'Ъ': '', 'Ы': 'Y', 'Ь': '', 'Э': 'E', 'Ю': 'Yu', 'Я': 'Ya'
    };

    return text.split('').map(char => transliterationMap[char] || char).join('');
  };

  return (
    <div className="transliteration-tool">
      <SEOHead 
        title={t('transliterationTool.seo.title')}
        description={t('transliterationTool.seo.description')}
        keywords={t('transliterationTool.seo.keywords')}
        ogTitle={t('transliterationTool.seo.ogTitle')}
        ogDescription={t('transliterationTool.seo.ogDescription')}
      />
      {/* Header-остров инструмента */}
      <div className="tool-header-island">
        <Link to={createLink('')} className="back-button">
          <img src="/icons/arrow_left.svg" alt="" />
          {t('navigation.allTools')}
        </Link>
        <h1 className="tool-title">{t('transliterationTool.title')}</h1>
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
            placeholder={t('transliterationTool.inputPlaceholder')}
          />
          <div className="input-controls">
            <button className="paste-button" onClick={handlePasteText}>
              <img src="/icons/button_paste.svg" alt="" />
              {t('transliterationTool.buttons.paste')}
            </button>
            <span className="line-count">{countLines(inputText)} {t('transliterationTool.lineCount')}</span>
          </div>
        </div>

        {/* Правая часть - настройки */}
        <div className="settings-section">
          {/* Первая группа - чекбоксы */}
          <div className="settings-group">
            <label className="checkbox-item">
              <input
                type="checkbox"
                checked={replaceSpaces}
                onChange={(e) => setReplaceSpaces(e.target.checked)}
              />
              {t('transliterationTool.options.replaceSpaces')}
            </label>
            <label className="checkbox-item">
              <input
                type="checkbox"
                checked={removeQuotes}
                onChange={(e) => setRemoveQuotes(e.target.checked)}
              />
              {t('transliterationTool.options.removeQuotes')}
            </label>
          </div>

          {/* Вторая группа - радио для регистра */}
          <div className="settings-group">
            <label className="radio-item">
              <input
                type="radio"
                name="case"
                value="lowercase"
                checked={caseOption === 'lowercase'}
                onClick={() => handleRadioClick(caseOption, setCaseOption, 'lowercase')}
                onChange={() => {}} // Пустой onChange чтобы React не ругался
              />
              {t('transliterationTool.options.allLowercase')}
            </label>
            <label className="radio-item">
              <input
                type="radio"
                name="case"
                value="uppercase"
                checked={caseOption === 'uppercase'}
                onClick={() => handleRadioClick(caseOption, setCaseOption, 'uppercase')}
                onChange={() => {}} // Пустой onChange чтобы React не ругался
              />
              {t('transliterationTool.options.allUppercase')}
            </label>
          </div>

          {/* Третья группа - чекбоксы для пробелов */}
          <div className="settings-group">
            <label className="checkbox-item">
              <input
                type="checkbox"
                checked={removeDoubleSpaces}
                onChange={(e) => setRemoveDoubleSpaces(e.target.checked)}
              />
              {t('transliterationTool.options.removeDoubleSpaces')}
            </label>
            <label className="checkbox-item">
              <input
                type="checkbox"
                checked={trimEdges}
                onChange={(e) => setTrimEdges(e.target.checked)}
              />
              {t('transliterationTool.options.removeLeadingTrailingSpaces')}
            </label>
          </div>
        </div>
      </div>

      {/* Кнопки управления */}
      <div className="control-buttons">
        <button className="action-btn primary" style={{ width: '445px' }} onClick={handleShowResult}>
          {t('transliterationTool.buttons.showResult')}
        </button>
        <button className="action-btn secondary icon-left" style={{ width: '445px' }} onClick={handleCopyResult}>
          <img src="/icons/button_copy.svg" alt="" />
          {t('transliterationTool.buttons.copyResult')}
        </button>
      </div>

      {/* Поле результата */}
      <div className="result-section">
        <textarea
          className="result-textarea"
          value={outputText}
          readOnly
          placeholder={t('transliterationTool.resultPlaceholder')}
        />
        <div className="result-controls">
          <span className="result-counter">{countLines(outputText)} {t('transliterationTool.lineCount')}</span>
        </div>
      </div>

      {/* SEO блок */}
      <div className="seo-section">
        <h3>{t('transliterationTool.seo.whatIsTransliteration.title')}</h3>
        <p>{t('transliterationTool.seo.whatIsTransliteration.text')}</p>

        <h3>{t('transliterationTool.seo.whyNeeded.title')}</h3>
        <p>{t('transliterationTool.seo.whyNeeded.text')}</p>

        <h3>{t('transliterationTool.seo.howItWorks.title')}</h3>
        <p>{t('transliterationTool.seo.howItWorks.text')}</p>

        <h3>{t('transliterationTool.seo.whatTexts.title')}</h3>
        <p>{t('transliterationTool.seo.whatTexts.text')}</p>

        <h3>{t('transliterationTool.seo.forSpecialists.title')}</h3>
        <p>{t('transliterationTool.seo.forSpecialists.text')}</p>

        <h3>{t('transliterationTool.seo.howToUse.title')}</h3>
        <p>{t('transliterationTool.seo.howToUse.text')}</p>
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

export default TransliterationTool;
