import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { statsService } from '../utils/statsService';
import { useLocalizedLink } from '../hooks/useLanguageFromUrl';
import '../styles/tool-pages.css';
import './RemoveLineBreaksTool.css';


const TOOL_ID = 'remove-line-breaks';
const RemoveLineBreaksTool: React.FC = () => {
    const { createLink } = useLocalizedLink();
    const [inputText, setInputText] = useState('');
    const [result, setResult] = useState('');
    const [copied, setCopied] = useState(false);
    const [launchCount, setLaunchCount] = useState(0);
    
    // Состояние для радио-кнопок замены переносов
    const [replacement, setReplacement] = useState('nothing'); // по умолчанию "ничего"
    const [customReplacement, setCustomReplacement] = useState('');

    // Загрузка статистики запусков при монтировании
    useEffect(() => {
        statsService.getLaunchCount(TOOL_ID).then(setLaunchCount);
    }, []);

    // Очистка результата при изменении входных данных или настроек
    useEffect(() => {
        setResult('');
        setCopied(false);
    }, [inputText, replacement, customReplacement]);

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

    // Функция удаления переносов
    const handleShowResult = async () => {
        if (!inputText.trim()) {
            setResult('');
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

        // Определяем символ замены
        let replacementStr = '';
        switch (replacement) {
            case 'nothing':
                replacementStr = '';
                break;
            case 'space':
                replacementStr = ' ';
                break;
            case 'dash':
                replacementStr = '—';
                break;
            case 'hyphen':
                replacementStr = '-';
                break;
            case 'comma-space':
                replacementStr = ', ';
                break;
            case 'dot-space':
                replacementStr = '. ';
                break;
            case 'semicolon':
                replacementStr = ';';
                break;
            case 'colon':
                replacementStr = ':';
                break;
            case 'other':
                replacementStr = customReplacement;
                break;
            default:
                replacementStr = '';
        }

        // Обрабатываем текст: убираем пустые строки и соединяем оставшиеся
        const lines = inputText.split('\n')
            .map(line => line.trim()) // Убираем пробелы в начале и конце каждой строки
            .filter(line => line.length > 0); // Убираем пустые строки

        const resultText = lines.join(replacementStr);
        setResult(resultText);
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
    const countLines = (text: string): number => {
        if (text === '') return 0;
        return text.split('\n').length;
    };

    return (
        <div className="remove-line-breaks-tool">
            {/* Header-остров инструмента */}
            <div className="tool-header-island">
                <Link to={createLink('')} className="back-button">
                    <img src="/icons/arrow_left.svg" alt="" />
                    Все инструменты
                </Link>
                <h1 className="tool-title">Удаление переносов</h1>
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
                {/* Левая часть - одно поле ввода */}
                <div className="input-section">
                    <textarea
                        className="input-textarea"
                        value={inputText}
                        onChange={(e) => setInputText(e.target.value)}
                        placeholder="Введите или вставьте ваш текст здесь..."
                    />
                    <div className="input-controls">
                        <button className="paste-button" onClick={handlePaste}>
                            <img src="/icons/button_paste.svg" alt="" />
                            Вставить
                        </button>
                        <span className="info">{countLines(inputText)} стр.</span>
                    </div>
                </div>

                {/* Правая часть - настройки замены переносов */}
                <div className="settings-section">
                    <div className="settings-group">
                        {/* Плашка заголовка внутри блока */}
                        <div className="connector-label">Заменить перенос строки</div>
                        
                        {/* Сетка радио-кнопок 2x4 */}
                        <div className="connector-grid">
                            {/* Левая колонка */}
                            <label className="radio-item">
                                <input
                                    type="radio"
                                    name="replacement"
                                    value="nothing"
                                    checked={replacement === 'nothing'}
                                    onClick={() => handleRadioClick(replacement, setReplacement, 'nothing')}
                                    onChange={() => {}}
                                />
                                <span className="radio-text">Ничего</span>
                            </label>

                            <label className="radio-item">
                                <input
                                    type="radio"
                                    name="replacement"
                                    value="space"
                                    checked={replacement === 'space'}
                                    onClick={() => handleRadioClick(replacement, setReplacement, 'space')}
                                    onChange={() => {}}
                                />
                                <span className="radio-text">Пробел</span>
                            </label>

                            <label className="radio-item">
                                <input
                                    type="radio"
                                    name="replacement"
                                    value="dash"
                                    checked={replacement === 'dash'}
                                    onClick={() => handleRadioClick(replacement, setReplacement, 'dash')}
                                    onChange={() => {}}
                                />
                                <span className="radio-text">Тире</span>
                            </label>

                            <label className="radio-item">
                                <input
                                    type="radio"
                                    name="replacement"
                                    value="hyphen"
                                    checked={replacement === 'hyphen'}
                                    onClick={() => handleRadioClick(replacement, setReplacement, 'hyphen')}
                                    onChange={() => {}}
                                />
                                <span className="radio-text">Дефис</span>
                            </label>

                            {/* Правая колонка */}
                            <label className="radio-item">
                                <input
                                    type="radio"
                                    name="replacement"
                                    value="comma-space"
                                    checked={replacement === 'comma-space'}
                                    onClick={() => handleRadioClick(replacement, setReplacement, 'comma-space')}
                                    onChange={() => {}}
                                />
                                <span className="radio-text">Запятая+пробел</span>
                            </label>

                            <label className="radio-item">
                                <input
                                    type="radio"
                                    name="replacement"
                                    value="dot-space"
                                    checked={replacement === 'dot-space'}
                                    onClick={() => handleRadioClick(replacement, setReplacement, 'dot-space')}
                                    onChange={() => {}}
                                />
                                <span className="radio-text">Точка+пробел</span>
                            </label>

                            <label className="radio-item">
                                <input
                                    type="radio"
                                    name="replacement"
                                    value="semicolon"
                                    checked={replacement === 'semicolon'}
                                    onClick={() => handleRadioClick(replacement, setReplacement, 'semicolon')}
                                    onChange={() => {}}
                                />
                                <span className="radio-text">Точка с запятой</span>
                            </label>

                            <label className="radio-item">
                                <input
                                    type="radio"
                                    name="replacement"
                                    value="colon"
                                    checked={replacement === 'colon'}
                                    onClick={() => handleRadioClick(replacement, setReplacement, 'colon')}
                                    onChange={() => {}}
                                />
                                <span className="radio-text">Двоеточие</span>
                            </label>
                        </div>
                    </div>

                    {/* Отдельная settings-group для кастомной замены */}
                    <div className="settings-group">
                        <div className="custom-connector-group">
                            <label className="radio-item">
                                <input
                                    type="radio"
                                    name="replacement"
                                    value="other"
                                    checked={replacement === 'other'}
                                    onClick={() => handleRadioClick(replacement, setReplacement, 'other')}
                                    onChange={() => {}}
                                />
                                <span className="radio-text">Другой</span>
                            </label>
                            <input
                                type="text"
                                className="custom-connector-input"
                                placeholder="Свой вариант"
                                value={customReplacement}
                                onChange={(e) => setCustomReplacement(e.target.value)}
                                onFocus={() => setReplacement('other')}
                                onClick={() => setReplacement('other')}
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
                    disabled={!inputText.trim()}
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
                    <span className="result-counter">{countLines(result)} стр.</span>
                </div>
            </div>
        </div>
    );
};

export default RemoveLineBreaksTool;