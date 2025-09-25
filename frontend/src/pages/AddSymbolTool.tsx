import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useLocalizedLink } from '../hooks/useLanguageFromUrl';
import SEOHead from '../components/SEOHead';
import { statsService } from '../utils/statsService';
import '../styles/tool-pages.css';
import { useAuthRequired } from '../hooks/useAuthRequired';
import AuthRequiredModal from '../components/AuthRequiredModal';
import AuthModal from '../components/AuthModal';
import './AddSymbolTool.css';


const TOOL_ID = 'add-symbol';
const AddSymbolTool: React.FC = () => {
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
  const [copied, setCopied] = useState(false);
  
  // Состояния для настроек
  const [symbolToAdd, setSymbolToAdd] = useState('');
  const [additionMode, setAdditionMode] = useState(''); // 'start', 'end', 'both'
  const [exceptions, setExceptions] = useState('');
  
  // Библиотека слов для исключений (та же, что в CaseChangerTool)
  const [presetWords] = useState('и\nили\nа\nс\nз\nпод\nпри\nна\nв\nо\nот\nк\nу\nпо\nза\nдля\nбез\nиз\nчерез\nмежду\nнад\nобо\nперед');

  // Загружаем счетчик запусков при монтировании компонента
  useEffect(() => {
    const loadStats = async () => {
      const count = await statsService.getLaunchCount(TOOL_ID);
      setLaunchCount(count);
    };
    loadStats();
  }, []);

  // Очистка результата при изменении входных данных или настроек
  useEffect(() => {
    setOutputText('');
    setCopied(false);
  }, [inputText, symbolToAdd, additionMode, exceptions]);

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

    if (!symbolToAdd.trim()) {
      setOutputText('');
      return;
    }

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

    // Получаем список исключений
    const exceptionList = exceptions
      .toLowerCase()
      .split(/[\n,]/)
      .map(word => word.trim())
      .filter(word => word.length > 0);

    // Обрабатываем каждую строку
    const lines = inputText.split('\n');
    const processedLines = lines.map(line => {
      if (line.trim() === '') return line; // Пустые строки не обрабатываем

      // Предобработка текста: удаляем лишние пробелы
      let cleanLine = line.trim(); // Убираем пробелы в начале и конце
      cleanLine = cleanLine.replace(/\s+/g, ' '); // Заменяем множественные пробелы на одинарные

      // Если выбран конкретный режим - обрабатываем всю строку целиком
      if (additionMode) {
        // Но сначала проверяем, есть ли слова из исключений в строке
        const lineWords = cleanLine.toLowerCase().split(/\s+/);
        const hasException = lineWords.some(word => 
          exceptionList.includes(word) // Точное совпадение целого слова
        );

        if (hasException) {
          return cleanLine; // Не добавляем символ к строкам с исключениями
        }

        switch (additionMode) {
          case 'start':
            return symbolToAdd + cleanLine;
          case 'end':
            return cleanLine + symbolToAdd;
          case 'both':
            return symbolToAdd + cleanLine + symbolToAdd;
          default:
            return cleanLine;
        }
      }

      // По умолчанию (если ничего не выбрано) - добавляем символ перед каждым словом отдельно
      const words = cleanLine.split(/\s+/);
      const wordsWithSymbol = words.map(word => {
        // Проверяем каждое слово на исключения
        const wordLower = word.toLowerCase();
        if (exceptionList.includes(wordLower)) {
          return word; // Не добавляем символ к словам-исключениям
        }
        return symbolToAdd + word; // Добавляем символ к обычным словам
      });
      return wordsWithSymbol.join(' ');
    });

    setOutputText(processedLines.join('\n'));
  };

  const handleCopyResult = async () => {
    try {
      await navigator.clipboard.writeText(outputText);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Ошибка при копировании текста:', err);
    }
  };

  const countLines = (text: string): number => {
    if (text === '') return 0;
    return text.split('\n').length;
  };

  return (
    <div className="add-symbol-tool">
      <SEOHead 
        title={t('addSymbolTool.seo.title')}
        description={t('addSymbolTool.seo.description')}
        keywords={t('addSymbolTool.seo.keywords')}
        ogTitle={t('addSymbolTool.seo.ogTitle')}
        ogDescription={t('addSymbolTool.seo.ogDescription')}
      />
      {/* Header-остров инструмента */}
      <div className="tool-header-island">
        <Link to={createLink('')} className="back-button">
          <img src="/icons/arrow_left.svg" alt="" />
          {t('navigation.allTools')}
        </Link>
        <h1 className="tool-title">{t('addSymbolTool.title')}</h1>
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
            placeholder={t('addSymbolTool.inputPlaceholder')}
          />
          <div className="input-controls">
            <button className="paste-button" onClick={handlePasteText}>
              <img src="/icons/button_paste.svg" alt="" />
              {t('addSymbolTool.buttons.paste')}
            </button>
            <span className="info">{countLines(inputText)} {t('addSymbolTool.lineCount')}</span>
          </div>
        </div>

        {/* Правая часть - настройки */}
        <div className="settings-section">
          {/* Группа 1: Поле для ввода символа */}
          <div className="settings-group">
            <input
              type="text"
              className="symbol-input"
              value={symbolToAdd}
              onChange={(e) => setSymbolToAdd(e.target.value)}
              placeholder={t('addSymbolTool.symbolPlaceholder')}
            />
          </div>

          {/* Группа 2: Радио-кнопки режима добавления */}
          <div className="settings-group">
            <label className="radio-item">
              <input
                type="radio"
                name="addition-mode"
                value="start"
                checked={additionMode === 'start'}
                onClick={() => handleRadioClick(additionMode, setAdditionMode, 'start')}
                onChange={() => {}}
              />
              {t('addSymbolTool.options.addToStart')}
            </label>
            <label className="radio-item">
              <input
                type="radio"
                name="addition-mode"
                value="end"
                checked={additionMode === 'end'}
                onClick={() => handleRadioClick(additionMode, setAdditionMode, 'end')}
                onChange={() => {}}
              />
              {t('addSymbolTool.options.addToEnd')}
            </label>
            <label className="radio-item">
              <input
                type="radio"
                name="addition-mode"
                value="both"
                checked={additionMode === 'both'}
                onClick={() => handleRadioClick(additionMode, setAdditionMode, 'both')}
                onChange={() => {}}
              />
              {t('addSymbolTool.options.addToBoth')}
            </label>
          </div>

          {/* Блок исключений (вынесен из settings-group) */}
          <div className="exceptions-block">
            <div className="exceptions-fields">
              <div className="exceptions-left">
                <textarea
                  className="exceptions-textarea"
                  value={exceptions}
                  onChange={(e) => setExceptions(e.target.value)}
                  placeholder={t('addSymbolTool.exceptionsPlaceholder')}
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
                  {t('addSymbolTool.buttons.transfer')}
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Кнопки управления */}
      <div className="control-buttons">
        <button 
          className="action-btn primary" 
          style={{ width: '445px' }} 
          onClick={handleShowResult}
          disabled={!inputText.trim() || !symbolToAdd.trim()}
        >
          {t('addSymbolTool.buttons.showResult')}
        </button>
        <button 
          className="action-btn secondary icon-left" 
          style={{ width: '445px' }} 
          onClick={handleCopyResult}
          disabled={!outputText}
        >
          <img src="/icons/button_copy.svg" alt="" />
          {copied ? t('addSymbolTool.buttons.copied') : t('addSymbolTool.buttons.copyResult')}
        </button>
      </div>

      {/* Поле результата */}
      <div className="result-section">
        <textarea
          className="result-textarea"
          value={outputText}
          readOnly
          placeholder={t('addSymbolTool.resultPlaceholder')}
        />
        <div className="result-controls">
          <span className="result-counter">{countLines(outputText)} {t('addSymbolTool.lineCount')}</span>
        </div>
      </div>

      {/* SEO блок */}
      <div className="seo-section">
        <h3>{t('addSymbolTool.seo.whatIsSymbolAdding.title')}</h3>
        <p>{t('addSymbolTool.seo.whatIsSymbolAdding.text')}</p>

        <h3>{t('addSymbolTool.seo.whyNeeded.title')}</h3>
        <p>{t('addSymbolTool.seo.whyNeeded.text')}</p>

        <h3>{t('addSymbolTool.seo.howItWorks.title')}</h3>
        <p>{t('addSymbolTool.seo.howItWorks.text')}</p>

        <h3>{t('addSymbolTool.seo.whatCanProcess.title')}</h3>
        <p>{t('addSymbolTool.seo.whatCanProcess.text')}</p>

        <h3>{t('addSymbolTool.seo.forSpecialists.title')}</h3>
        <p>{t('addSymbolTool.seo.forSpecialists.text')}</p>

        <h3>{t('addSymbolTool.seo.howToUse.title')}</h3>
        <p>{t('addSymbolTool.seo.howToUse.text')}</p>
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

export default AddSymbolTool;