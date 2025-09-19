import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { statsService } from '../utils/statsService';
import '../styles/tool-pages.css';
import './MatchTypesTool.css';

const MatchTypesTool: React.FC = () => {
    const [inputText, setInputText] = useState('');
    const [outputText, setOutputText] = useState('');
    const [matchType, setMatchType] = useState('broad'); // По умолчанию "Широкое соответствие"
    const [copied, setCopied] = useState(false);
    const [launchCount, setLaunchCount] = useState(0);

    // Загрузка статистики запусков при монтировании
    useEffect(() => {
        setLaunchCount(statsService.getLaunchCount('match-types'));
    }, []);

    // Очистка результатов при изменении входных данных
    useEffect(() => {
        setOutputText('');
        setCopied(false);
    }, [inputText, matchType]);

    // Вставка из буфера
    const handlePaste = async () => {
        try {
            const text = await navigator.clipboard.readText();
            setInputText(text);
        } catch (err) {
            console.error('Ошибка при вставке:', err);
        }
    };

    // Функция обработки типов соответствия
    const handleShowResult = () => {
        if (!inputText.trim()) {
            setOutputText('');
            return;
        }

        // Увеличиваем счетчик запусков
        statsService.incrementLaunchCount('match-types');
        setLaunchCount(prev => prev + 1);

        // Разделяем на строки и фильтруем пустые
        const lines = inputText.trim().split('\n').filter(line => line.trim());
        
        const processedLines = lines.map(line => {
            let trimmedLine = line.trim();

            switch (matchType) {
                case 'broad':
                    // Широкое соответствие - удаляем спецсимволы и знаки пунктуации, оставляем буквы, цифры и пробелы
                    return trimmedLine.replace(/[^\p{L}\p{N}\s]/gu, '').replace(/\s+/g, ' ').trim();
                
                case 'phrase':
                    // Фразовое соответствие - удаляем спецсимволы, затем добавляем кавычки
                    const cleanPhrase = trimmedLine.replace(/[^\p{L}\p{N}\s]/gu, '').replace(/\s+/g, ' ').trim();
                    return `"${cleanPhrase}"`;
                
                case 'exact':
                    // Точное соответствие - удаляем спецсимволы, затем добавляем квадратные скобки
                    const cleanExact = trimmedLine.replace(/[^\p{L}\p{N}\s]/gu, '').replace(/\s+/g, ' ').trim();
                    return `[${cleanExact}]`;
                
                default:
                    return trimmedLine;
            }
        });

        setOutputText(processedLines.join('\n'));
    };

    // Функция копирования результата
    const handleCopyResult = async () => {
        if (!outputText.trim()) return;
        
        try {
            await navigator.clipboard.writeText(outputText);
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
        } catch (err) {
            console.error('Ошибка при копировании:', err);
        }
    };

    // Обработчик радиокнопок БЕЗ возможности снятия выбора
    const handleRadioChange = (value: string) => {
        setMatchType(value);
    };

    // Подсчет строк
    const countLines = (text: string): number => {
        if (!text.trim()) return 0;
        return text.trim().split('\n').length;
    };

    return (
        <div className="match-types-tool">
            {/* Header-остров инструмента */}
            <div className="tool-header-island">
                <Link to="/" className="back-button">
                    <img src="/icons/arrow_left.svg" alt="" />
                    Все инструменты
                </Link>
                <h1 className="tool-title">Типы соответствия</h1>
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
                        <span className="char-counter">{countLines(inputText)} стр.</span>
                    </div>
                </div>

                {/* Правая часть - настройки */}
                <div className="settings-section">
                    <div className="settings-group">
                        <label className="radio-item">
                            <input
                                type="radio"
                                name="match-type"
                                value="broad"
                                checked={matchType === 'broad'}
                                onChange={() => handleRadioChange('broad')}
                            />
                            <span className="radio-text">Широкое соответствие</span>
                        </label>

                        <label className="radio-item">
                            <input
                                type="radio"
                                name="match-type"
                                value="phrase"
                                checked={matchType === 'phrase'}
                                onChange={() => handleRadioChange('phrase')}
                            />
                            <span className="radio-text">Фразовое соответствие</span>
                        </label>

                        <label className="radio-item">
                            <input
                                type="radio"
                                name="match-type"
                                value="exact"
                                checked={matchType === 'exact'}
                                onChange={() => handleRadioChange('exact')}
                            />
                            <span className="radio-text">Точное соответствие</span>
                        </label>
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
                    onClick={handleCopyResult}
                    disabled={!outputText.trim()}
                >
                    <img src="/icons/button_copy.svg" alt="" />
                    {copied ? 'Скопировано!' : 'Скопировать результат'}
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

export default MatchTypesTool;