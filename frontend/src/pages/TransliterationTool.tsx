import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { statsService } from '../utils/statsService';
import '../styles/tool-pages.css';
import './TransliterationTool.css';


const TOOL_ID = 'transliteration_tool';
const TransliterationTool: React.FC = () => {
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
      {/* Header-остров инструмента */}
      <div className="tool-header-island">
        <Link to="/" className="back-button">
          <img src="/icons/arrow_left.svg" alt="" />
          Все инструменты
        </Link>
        <h1 className="tool-title">Транслитерация</h1>
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
            <span className="line-count">{countLines(inputText)} стр.</span>
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
              Заменить пробелы на тире "-"
            </label>
            <label className="checkbox-item">
              <input
                type="checkbox"
                checked={removeQuotes}
                onChange={(e) => setRemoveQuotes(e.target.checked)}
              />
              Убрать апострофы и кавычки " ' "
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
              все буквы строчные
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
              ВСЕ БУКВЫ ПРОПИСНЫЕ
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
              Удалить двойные пробелы
            </label>
            <label className="checkbox-item">
              <input
                type="checkbox"
                checked={trimEdges}
                onChange={(e) => setTrimEdges(e.target.checked)}
              />
              Удалить пробелы в начале и в конце строк
            </label>
          </div>
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
        <h3>Что такое транслитерация?</h3>
        <p>Транслитерация — это процесс замены букв одного алфавита символами другого, при котором сохраняется звучание слова. Чаще всего речь идёт о переводе кириллических букв в латинские. Такой способ записи позволяет использовать имена, названия или целые тексты там, где кириллица недоступна или неудобна. Онлайн-сервис Wekey Tools упрощает этот процесс, автоматически конвертируя текст в транслит.</p>

        <h3>Зачем нужна транслитерация?</h3>
        <p>Транслитерация необходима в самых разных сферах. Она применяется при создании доменных имён, URL-адресов и логинов, используется в заполнении международных анкет и документов, помогает адаптировать контент для поисковых систем и социальных сетей. Для специалистов по маркетингу и SEO транслит особенно полезен: он делает ссылки понятными и читаемыми, улучшая восприятие сайта пользователями и поисковиками.</p>

        <h3>Как работает инструмент «Транслитерация»?</h3>
        <p>Инструмент Wekey Tools автоматически преобразует каждую букву кириллицы в её латинский аналог по стандартным правилам. Вам достаточно вставить текст в поле ввода и нажать кнопку «Показать результат». При необходимости можно задействовать дополнительные опции: менять регистр букв, заменять пробелы на тире, удалять лишние символы или пробелы. Но даже если не выбирать ни одного правила, инструмент всё равно выдаст корректный результат.</p>

        <h3>Какие тексты можно переводить?</h3>
        <p>Инструмент подходит для любых кириллических текстов — от отдельных слов до больших абзацев. Он одинаково корректно обрабатывает имена, фамилии, названия брендов, тексты для сайтов и рекламные материалы. При этом результат можно сразу скопировать и использовать в работе.</p>

        <h3>Чем полезна транслитерация для специалистов?</h3>
        <p>Для маркетологов, копирайтеров и SEO-специалистов транслитерация — это способ экономить время и избегать ошибок при подготовке текстов. Автоматический конвертер в Wekey Tools делает процесс максимально быстрым и удобным. Достаточно одного клика, чтобы получить латинизированный текст, готовый к использованию в URL-ах, публикациях или документах.</p>

        <h3>Как пользоваться транслитерацией онлайн?</h3>
        <p>Все просто: введите текст на кириллице, выберите нужные опции или оставьте настройки по умолчанию и нажмите «Показать результат». Сервис мгновенно преобразует ваш текст в транслит, а кнопка «Скопировать результат» позволит тут же перенести его в любое другое приложение.</p>
      </div>
    </div>
  );
};

export default TransliterationTool;
