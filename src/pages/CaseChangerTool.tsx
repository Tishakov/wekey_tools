import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { statsService } from '../utils/statsService';
import '../styles/tool-pages.css';
import './CaseChangerTool.css';

const CaseChangerTool: React.FC = () => {
  const [inputText, setInputText] = useState('');
  const [outputText, setOutputText] = useState('');
  const [launchCount, setLaunchCount] = useState(0);
  const [selectedCase, setSelectedCase] = useState('');
  const [exceptions, setExceptions] = useState('');
  const [presetWords] = useState('и\nили\nа\nс\nз\nпод\nпри\nна\nв\nо\nот\nк\nу\nпо\nза\nдля\nбез\nиз\nчерез\nмежду\nнад\nобо\nперед\nперед');

  // Загружаем счетчик запусков при монтировании компонента
  useEffect(() => {
    const count = statsService.getLaunchCount('case-changer');
    setLaunchCount(count);
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

  const handleShowResult = () => {
    if (!selectedCase) {
      setOutputText('');
      return;
    }

    let result = inputText;
    
    // Увеличиваем счетчик запусков
    statsService.incrementLaunchCount('case-changer');
    setLaunchCount(prev => prev + 1);
    
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
      {/* Header-остров инструмента */}
      <div className="tool-header-island">
        <Link to="/" className="back-button">
          <img src="/icons/arrow_left.svg" alt="" />
          Все инструменты
        </Link>
        <h1 className="tool-title">Изменения регистра</h1>
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
            placeholder="Введите ваш текст…"
          />
          <div className="input-controls">
            <button className="paste-button" onClick={handlePasteText}>
              <img src="/icons/button_paste.svg" alt="" />
              Вставить
            </button>
            <span className="char-counter">{countLines(inputText)} стр.</span>
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
              все строчные
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
              ВСЕ ПРОПИСНЫЕ
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
              Каждое С Заглавной*
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
              Первое с заглавной
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
              Первое с заглавной после точки и знаков !?
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
                    placeholder="*Введите слова, через новую строку, или запятую, которым НЕ нужно изменять регистр"
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
                    Перенести
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
          Показать результат
        </button>
        <button className="action-btn secondary icon-left" style={{ width: '445px' }} onClick={handleCopyResult}>
          <img src="/icons/button_copy.svg" alt="" />
          Скопировать результат
        </button>
      </div>

      {/* Поле результата */}
      <div className="result-section">
        <textarea
          className="result-textarea"
          value={outputText}
          readOnly
          placeholder="Здесь будет результат"
        />
        <div className="result-controls">
          <span className="result-counter">{countLines(outputText)} стр.</span>
        </div>
      </div>

      {/* SEO блок */}
      <div className="seo-section">
        <h3>Что такое изменение регистра текста?</h3>
        <p>Изменение регистра — это преобразование букв в тексте между строчными (маленькими) и прописными (заглавными) буквами. Этот инструмент позволяет быстро привести текст к нужному виду: сделать все буквы строчными, прописными, написать каждое слово с заглавной буквы или применить другие правила форматирования.</p>

        <h3>Зачем нужно изменение регистра?</h3>
        <p>Правильный регистр букв важен для создания качественного контента. Он улучшает читаемость текста, делает его более профессиональным и соответствующим стандартам. Изменение регистра часто требуется при подготовке заголовков, обработке данных, форматировании списков или исправлении текстов, написанных с нарушением правил.</p>

        <h3>Какие варианты изменения регистра доступны?</h3>
        <p>Инструмент поддерживает пять основных режимов: преобразование всех букв в строчные, преобразование в прописные, написание каждого слова с заглавной буквы (с возможностью указать исключения), написание только первой буквы с заглавной, а также автоматическая постановка заглавных букв после точек и восклицательных или вопросительных знаков.</p>

        <h3>Как работают исключения?</h3>
        <p>При выборе режима "Каждое С Заглавной" вы можете указать слова-исключения, которые должны остаться строчными. Это полезно для предлогов, союзов и артиклей в заголовках. Просто введите нужные слова в поле исключений — каждое с новой строки или через запятую.</p>

        <h3>Для кого полезен этот инструмент?</h3>
        <p>Инструмент будет полезен копирайтерам, редакторам, маркетологам, студентам и всем, кто работает с текстом. Он экономит время при форматировании заголовков, исправлении регистра в больших объемах текста и приведении контента к единообразному виду.</p>
      </div>
    </div>
  );
};

export default CaseChangerTool;