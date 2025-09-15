import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import './TransliterationTool.css';

const TransliterationTool: React.FC = () => {
  const [inputText, setInputText] = useState('');
  const [outputText, setOutputText] = useState('');
  
  // Состояние для чекбоксов первой группы
  const [replaceSpaces, setReplaceSpaces] = useState(false);
  const [removeQuotes, setRemoveQuotes] = useState(false);
  
  // Состояние для радио-кнопок второй группы (регистр)
  const [caseOption, setCaseOption] = useState('');
  
  // Состояние для чекбоксов третьей группы (пробелы)
  const [removeDoubleSpaces, setRemoveDoubleSpaces] = useState(false);
  const [trimEdges, setTrimEdges] = useState(false);

  const handlePasteText = async () => {
    try {
      const text = await navigator.clipboard.readText();
      setInputText(text);
    } catch (err) {
      console.error('Ошибка при вставке текста:', err);
    }
  };

  const handleShowResult = () => {
    let result = inputText;
    
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
          ← Все инструменты
        </Link>
        <h1 className="tool-title">Транслитерация</h1>
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
        <button className="show-result-button" onClick={handleShowResult}>
          Показать результат
        </button>
        <button className="copy-result-button" onClick={handleCopyResult}>
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
    </div>
  );
};

export default TransliterationTool;
