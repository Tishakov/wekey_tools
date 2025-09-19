import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { statsService } from '../utils/statsService';
import '../styles/tool-pages.css';
import './TextByColumnsTool.css';

const TextByColumnsTool: React.FC = () => {
    const [inputText, setInputText] = useState('');
    const [copied, setCopied] = useState<boolean[]>([false, false, false, false, false, false]);
    const [launchCount, setLaunchCount] = useState(0);
    
    // Состояние для выбора разделителя
    const [separator, setSeparator] = useState('semicolon'); // по умолчанию точка с запятой
    const [customSeparator, setCustomSeparator] = useState('');
    const [exceptions, setExceptions] = useState('');
    
    // Результаты для 6 колонок
    const [columns, setColumns] = useState<string[]>(['', '', '', '', '', '']);

    // Загрузка статистики запусков при монтировании
    useEffect(() => {
        setLaunchCount(statsService.getLaunchCount('text-by-columns'));
    }, []);

    // Очистка результата при изменении входных данных или настроек
    useEffect(() => {
        setColumns(['', '', '', '', '', '']);
        setCopied([false, false, false, false, false, false]);
    }, [inputText, separator, customSeparator, exceptions]);

    // Вставка из буфера
    const handlePaste = async () => {
        try {
            const text = await navigator.clipboard.readText();
            setInputText(text);
        } catch (err) {
            console.error('Ошибка при вставке:', err);
        }
    };

    // Обработчик радио-кнопок с возможностью снятия выбора
    const handleRadioClick = (currentValue: string, setValue: (value: string) => void, clickedValue: string) => {
        if (currentValue === clickedValue) {
            setValue(''); // Снимаем выбор если кликнули по уже выбранной радиокнопке
        } else {
            setValue(clickedValue); // Устанавливаем новое значение
        }
    };

    // Функция переноса готовых слов в поле исключений
    const handleTransferWords = () => {
        const currentExceptions = exceptions.trim();
        const presetWords = "заголовок\nитого\nвсего\nсумма\nобщий\nфинал\nрезультат\nзаключение";
        
        if (currentExceptions === '') {
            setExceptions(presetWords);
        } else {
            // Если уже есть исключения, добавляем новые через перенос строки
            setExceptions(currentExceptions + '\n' + presetWords);
        }
    };

    // Функция разбивки текста по столбцам
    const handleShowResult = () => {
        if (!inputText.trim()) {
            setColumns(['', '', '', '', '', '']);
            return;
        }

        // Увеличиваем счетчик запусков
        statsService.incrementLaunchCount('text-by-columns');
        setLaunchCount(prev => prev + 1);

        // Определяем символ разделителя
        let separatorStr = '';
        switch (separator) {
            case 'semicolon':
                separatorStr = ';';
                break;
            case 'comma':
                separatorStr = ',';
                break;
            case 'dot':
                separatorStr = '.';
                break;
            case 'space':
                separatorStr = ' ';
                break;
            case 'other':
                separatorStr = customSeparator;
                break;
            default:
                separatorStr = ';';
        }

        if (!separatorStr) {
            setColumns(['', '', '', '', '', '']);
            return;
        }

        // Разбиваем каждую строку на части и распределяем по колонкам
        const lines = inputText.split('\n').filter(line => line.trim() !== '');
        const newColumns: string[] = ['', '', '', '', '', ''];

        lines.forEach(line => {
            const parts = line.split(separatorStr).map(part => part.trim()).filter(part => part !== '');
            
            // Распределяем части по колонкам (максимум 6)
            parts.forEach((part, index) => {
                if (index < 6) {
                    if (newColumns[index]) {
                        newColumns[index] += '\n' + part;
                    } else {
                        newColumns[index] = part;
                    }
                }
            });
        });

        setColumns(newColumns);
    };

    // Функция копирования для конкретной колонки
    const handleCopy = async (columnIndex: number) => {
        if (!columns[columnIndex]) return;
        
        try {
            await navigator.clipboard.writeText(columns[columnIndex]);
            const newCopied = [...copied];
            newCopied[columnIndex] = true;
            setCopied(newCopied);
            setTimeout(() => {
                const resetCopied = [...newCopied];
                resetCopied[columnIndex] = false;
                setCopied(resetCopied);
            }, 2000);
        } catch (err) {
            console.error('Ошибка при копировании:', err);
        }
    };

    // Подсчет строк в колонках
    const getColumnLines = (columnIndex: number) => {
        return columns[columnIndex] ? columns[columnIndex].split('\n').length : 0;
    };

    // Подсчет строк входного текста
    const inputLines = inputText.trim() ? inputText.split('\n').length : 0;

    return (
        <div className="text-by-columns-tool">
            {/* Header-остров инструмента */}
            <div className="tool-header-island">
                <Link to="/" className="back-button">
                    <img src="/icons/arrow_left.svg" alt="" />
                    Все инструменты
                </Link>
                <h1 className="tool-title">Текст по столбцам</h1>
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
                        placeholder="Введите ваш текст..."
                        value={inputText}
                        onChange={(e) => setInputText(e.target.value)}
                    />
                    <div className="input-controls">
                        <button className="paste-button" onClick={handlePaste}>
                            <img src="/icons/button_paste.svg" alt="" />
                            Вставить
                        </button>
                        <span className="char-counter">{inputLines} стр.</span>
                    </div>
                </div>

                {/* Правая часть - настройки */}
                <div className="settings-section">
                    {/* Разделитель */}
                    <div className="settings-group">
                        <div className="connector-label">Разделитель</div>
                        
                        <div className="radio-options">
                            <label className="radio-item">
                                <input
                                    type="radio"
                                    name="separator"
                                    checked={separator === 'semicolon'}
                                    onChange={() => handleRadioClick(separator, setSeparator, 'semicolon')}
                                />
                                <span className="radio-text">Точка с запятой ";"</span>
                            </label>

                            <label className="radio-item">
                                <input
                                    type="radio"
                                    name="separator"
                                    checked={separator === 'comma'}
                                    onChange={() => handleRadioClick(separator, setSeparator, 'comma')}
                                />
                                <span className="radio-text">Запятая ","</span>
                            </label>

                            <label className="radio-item">
                                <input
                                    type="radio"
                                    name="separator"
                                    checked={separator === 'dot'}
                                    onChange={() => handleRadioClick(separator, setSeparator, 'dot')}
                                />
                                <span className="radio-text">Точка "."</span>
                            </label>

                            <label className="radio-item">
                                <input
                                    type="radio"
                                    name="separator"
                                    checked={separator === 'space'}
                                    onChange={() => handleRadioClick(separator, setSeparator, 'space')}
                                />
                                <span className="radio-text">Пробел " "</span>
                            </label>
                        </div>
                    </div>

                    {/* Другой разделитель */}
                    <div className="settings-group">
                        <div className="custom-input-wrapper">
                            <label className="radio-item">
                                <input
                                    type="radio"
                                    name="separator"
                                    checked={separator === 'other'}
                                    onChange={() => handleRadioClick(separator, setSeparator, 'other')}
                                />
                                <span className="radio-text">Другой</span>
                            </label>
                            <input
                                type="text"
                                className="custom-input"
                                placeholder="Введите разделитель"
                                value={customSeparator}
                                onChange={(e) => setCustomSeparator(e.target.value)}
                                onFocus={() => setSeparator('other')}
                                onClick={() => setSeparator('other')}
                            />
                        </div>
                    </div>

                    {/* Блок исключений (вынесен из settings-group) */}
                    <div className="exceptions-block">
                        <div className="exceptions-fields">
                            <div className="exceptions-left">
                                <textarea
                                    className="exceptions-textarea"
                                    placeholder="Введите исключения - строки которые не нужно разделять на колонки..."
                                    value={exceptions}
                                    onChange={(e) => setExceptions(e.target.value)}
                                    rows={4}
                                />
                            </div>
                            <div className="exceptions-right">
                                <textarea
                                    className="exceptions-textarea preset-words"
                                    value={`заголовок
итого
всего
сумма
общий
финал
результат
заключение`}
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
                </div>
            </div>

            {/* Кнопка управления */}
            <div className="control-buttons">
                <button 
                    className="action-btn primary" 
                    onClick={handleShowResult}
                >
                    Показать результат
                </button>
            </div>

            {/* Секция результатов - 6 колонок */}
            <div className="results-section">
                <div className="results-grid">
                    {columns.map((column, index) => (
                        <div key={index} className="result-column">
                            <div className="result-field">
                                <textarea
                                    className="result-textarea"
                                    placeholder={`${index + 1}-е слово`}
                                    value={column}
                                    readOnly
                                />
                                <div className="result-controls">
                                    <span className="result-counter">{getColumnLines(index)} стр.</span>
                                </div>
                            </div>
                            <button 
                                className="copy-btn-icon" 
                                onClick={() => handleCopy(index)}
                                disabled={!column}
                                title="Скопировать"
                            >
                                <img src="/icons/button_copy.svg" alt="Копировать" />
                            </button>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
};

export default TextByColumnsTool;