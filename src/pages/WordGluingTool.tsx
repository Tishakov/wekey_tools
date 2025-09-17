import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { statsService } from '../utils/statsService';
import '../styles/tool-pages.css';
import './WordGluingTool.css';

const WordGluingTool: React.FC = () => {
    const [inputText1, setInputText1] = useState('');
    const [inputText2, setInputText2] = useState('');
    const [result, setResult] = useState('');
    const [copied, setCopied] = useState(false);
    const [launchCount, setLaunchCount] = useState(0);
    
    // Состояние для радио-кнопок соединителей
    const [connector, setConnector] = useState('nothing'); // по умолчанию "ничего"
    const [customConnector, setCustomConnector] = useState('');

    // Загрузка статистики запусков при монтировании
    useEffect(() => {
        setLaunchCount(statsService.getLaunchCount('word-gluing'));
    }, []);

    // Очистка результата при изменении входных данных или настроек
    useEffect(() => {
        setResult('');
    }, [inputText1, inputText2, connector, customConnector]);

    // Функция для обмена значений между полями
    const swapValues = () => {
        const temp = inputText1;
        setInputText1(inputText2);
        setInputText2(temp);
    };

    // Вставка из буфера для первого поля
    const handlePaste1 = async () => {
        try {
            const text = await navigator.clipboard.readText();
            setInputText1(text);
        } catch (err) {
            console.error('Ошибка при вставке:', err);
        }
    };

    // Вставка из буфера для второго поля
    const handlePaste2 = async () => {
        try {
            const text = await navigator.clipboard.readText();
            setInputText2(text);
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

    // Функция склейки слов
    const handleShowResult = () => {
        if (!inputText1.trim() || !inputText2.trim()) {
            setResult('');
            return;
        }

        const lines1 = inputText1.trim().split('\n').filter(line => line.trim());
        const lines2 = inputText2.trim().split('\n').filter(line => line.trim());
        
        // Увеличиваем счетчик запусков
        statsService.incrementLaunchCount('word-gluing');
        setLaunchCount(prev => prev + 1);

        // Определяем соединитель
        let connectorStr = '';
        switch (connector) {
            case 'nothing':
                connectorStr = '';
                break;
            case 'space':
                connectorStr = ' ';
                break;
            case 'comma-space':
                connectorStr = ', ';
                break;
            case 'dot-space':
                connectorStr = '. ';
                break;
            case 'semicolon':
                connectorStr = ';';
                break;
            case 'colon':
                connectorStr = ':';
                break;
            case 'dash':
                connectorStr = '-';
                break;
            case 'long-dash':
                connectorStr = ' — ';
                break;
            case 'other':
                connectorStr = customConnector;
                break;
            default:
                connectorStr = '';
        }

        // Склеиваем слова
        const maxLength = Math.max(lines1.length, lines2.length);
        const resultLines: string[] = [];
        
        for (let i = 0; i < maxLength; i++) {
            const word1 = lines1[i] || '';
            const word2 = lines2[i] || '';
            
            if (word1 && word2) {
                resultLines.push(word1 + connectorStr + word2);
            } else if (word1) {
                resultLines.push(word1);
            } else if (word2) {
                resultLines.push(word2);
            }
        }

        setResult(resultLines.join('\n'));
    };

    // Копирование результата
    const handleCopy = async () => {
        try {
            await navigator.clipboard.writeText(result);
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
        } catch (err) {
            console.error('Ошибка при копировании:', err);
        }
    };

    // Подсчет строк
    const inputLines1 = inputText1.trim() ? inputText1.split('\n').length : 0;
    const inputLines2 = inputText2.trim() ? inputText2.split('\n').length : 0;
    const resultLines = result.trim() ? result.split('\n').length : 0;

    return (
        <div className="word-gluing-tool">
            {/* Header-остров инструмента */}
            <div className="tool-header-island">
                <Link to="/" className="back-button">
                    <img src="/icons/arrow_left.svg" alt="" />
                    Все инструменты
                </Link>
                <h1 className="tool-title">Склейка слов</h1>
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
                {/* Левая часть - два поля ввода рядом с кнопкой обмена поверх */}
                <div className="input-section">
                    <div className="double-input">
                        <div className="input-field">
                            <textarea
                                className="input-textarea"
                                placeholder="Введите первый список слов..."
                                value={inputText1}
                                onChange={(e) => setInputText1(e.target.value)}
                            />
                            <div className="input-controls">
                                <button className="paste-button" onClick={handlePaste1}>
                                    <img src="/icons/button_paste.svg" alt="" />
                                    Вставить
                                </button>
                                <span className="char-counter">{inputLines1} стр.</span>
                            </div>
                        </div>
                        
                        <div className="input-field">
                            <textarea
                                className="input-textarea"
                                placeholder="Введите второй список слов..."
                                value={inputText2}
                                onChange={(e) => setInputText2(e.target.value)}
                            />
                            <div className="input-controls">
                                <button className="paste-button" onClick={handlePaste2}>
                                    <img src="/icons/button_paste.svg" alt="" />
                                    Вставить
                                </button>
                                <span className="char-counter">{inputLines2} стр.</span>
                            </div>
                        </div>
                        
                        {/* Кнопка обмена значений - поверх полей по центру */}
                        <div className="swap-button-container">
                            <button className="swap-button" onClick={swapValues} title="Поменять местами">
                                <img src="/icons/change.svg" alt="Поменять местами" />
                            </button>
                        </div>
                    </div>
                </div>

                {/* Правая часть - настройки соединителей */}
                <div className="settings-section">
                    <div className="settings-group">
                        {/* Плашка заголовка внутри блока */}
                        <div className="connector-label">Соединитель</div>
                        
                        {/* Сетка радио-кнопок 2x4 согласно скриншоту */}
                        <div className="connector-grid">
                            {/* Левая колонка */}
                            <label className="radio-item">
                                <input
                                    type="radio"
                                    name="connector"
                                    value="nothing"
                                    checked={connector === 'nothing'}
                                    onClick={() => handleRadioClick(connector, setConnector, 'nothing')}
                                    onChange={() => {}}
                                />
                                <span className="radio-text">Ничего</span>
                            </label>

                            {/* Правая колонка */}
                            <label className="radio-item">
                                <input
                                    type="radio"
                                    name="connector"
                                    value="semicolon"
                                    checked={connector === 'semicolon'}
                                    onClick={() => handleRadioClick(connector, setConnector, 'semicolon')}
                                    onChange={() => {}}
                                />
                                <span className="radio-text">Точка с запятой</span>
                            </label>

                            <label className="radio-item">
                                <input
                                    type="radio"
                                    name="connector"
                                    value="space"
                                    checked={connector === 'space'}
                                    onClick={() => handleRadioClick(connector, setConnector, 'space')}
                                    onChange={() => {}}
                                />
                                <span className="radio-text">Пробел</span>
                            </label>

                            <label className="radio-item">
                                <input
                                    type="radio"
                                    name="connector"
                                    value="colon"
                                    checked={connector === 'colon'}
                                    onClick={() => handleRadioClick(connector, setConnector, 'colon')}
                                    onChange={() => {}}
                                />
                                <span className="radio-text">Двоеточие</span>
                            </label>

                            <label className="radio-item">
                                <input
                                    type="radio"
                                    name="connector"
                                    value="comma-space"
                                    checked={connector === 'comma-space'}
                                    onClick={() => handleRadioClick(connector, setConnector, 'comma-space')}
                                    onChange={() => {}}
                                />
                                <span className="radio-text">Запятая+пробел</span>
                            </label>

                            <label className="radio-item">
                                <input
                                    type="radio"
                                    name="connector"
                                    value="dash"
                                    checked={connector === 'dash'}
                                    onClick={() => handleRadioClick(connector, setConnector, 'dash')}
                                    onChange={() => {}}
                                />
                                <span className="radio-text">Тире без пробела</span>
                            </label>

                            <label className="radio-item">
                                <input
                                    type="radio"
                                    name="connector"
                                    value="dot-space"
                                    checked={connector === 'dot-space'}
                                    onClick={() => handleRadioClick(connector, setConnector, 'dot-space')}
                                    onChange={() => {}}
                                />
                                <span className="radio-text">Точка+пробел</span>
                            </label>

                            <label className="radio-item">
                                <input
                                    type="radio"
                                    name="connector"
                                    value="long-dash"
                                    checked={connector === 'long-dash'}
                                    onClick={() => handleRadioClick(connector, setConnector, 'long-dash')}
                                    onChange={() => {}}
                                />
                                <span className="radio-text">Длинное тире</span>
                            </label>
                        </div>
                    </div>

                    {/* Отдельная settings-group для кастомного соединителя */}
                    <div className="settings-group">
                        <div className="custom-connector-group">
                            <label className="radio-item">
                                <input
                                    type="radio"
                                    name="connector"
                                    value="other"
                                    checked={connector === 'other'}
                                    onClick={() => handleRadioClick(connector, setConnector, 'other')}
                                    onChange={() => {}}
                                />
                                <span className="radio-text">Другой</span>
                            </label>
                            <input
                                type="text"
                                className="custom-connector-input"
                                placeholder="Введите свой"
                                value={customConnector}
                                onChange={(e) => setCustomConnector(e.target.value)}
                                onFocus={() => setConnector('other')}
                                onClick={() => setConnector('other')}
                            />
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
                    disabled={!inputText1.trim() || !inputText2.trim()}
                >
                    Показать результат
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

            {/* Поле результата */}
            <div className="result-section">
                <textarea
                    className="result-textarea"
                    placeholder="Здесь будет результат"
                    value={result}
                    readOnly
                />
                <div className="result-controls">
                    <span className="result-counter">{resultLines} стр.</span>
                </div>
            </div>
        </div>
    );
};

export default WordGluingTool;