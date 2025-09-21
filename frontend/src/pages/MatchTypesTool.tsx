import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { statsService } from '../utils/statsService';
import '../styles/tool-pages.css';
import './MatchTypesTool.css';


const TOOL_ID = 'match-types';
type MatchType = 'broad' | 'phrase' | 'exact';
type CaseType = 'lowercase' | 'uppercase' | 'capitalize-first' | '';

const MatchTypesTool: React.FC = () => {
    const [inputText, setInputText] = useState('');
    const [outputText, setOutputText] = useState('');
    const [matchType, setMatchType] = useState<MatchType>('broad'); // По умолчанию "Широкое соответствие"
    const [caseType, setCaseType] = useState<CaseType>(''); // По умолчанию без изменения регистра
    const [copied, setCopied] = useState(false);
    const [launchCount, setLaunchCount] = useState(0);

    // Загрузка статистики запусков при монтировании
    useEffect(() => {
        statsService.getLaunchCount(TOOL_ID).then(setLaunchCount);
    }, []);

    // Очистка результатов при изменении входных данных или настроек
    useEffect(() => {
        setOutputText('');
        setCopied(false);
    }, [inputText, matchType, caseType]);

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
    const handleShowResult = async () => {
        if (!inputText.trim()) {
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

        // Разделяем на строки и фильтруем пустые
        const lines = inputText.trim().split('\n').filter(line => line.trim());
        
        const processedLines = lines.map(line => {
            let trimmedLine = line.trim();
            let result = '';

            switch (matchType) {
                case 'broad':
                    // Широкое соответствие - удаляем спецсимволы и знаки пунктуации, оставляем буквы, цифры и пробелы
                    result = trimmedLine.replace(/[^\p{L}\p{N}\s]/gu, '').replace(/\s+/g, ' ').trim();
                    break;
                
                case 'phrase':
                    // Фразовое соответствие - удаляем спецсимволы, затем добавляем кавычки
                    const cleanPhrase = trimmedLine.replace(/[^\p{L}\p{N}\s]/gu, '').replace(/\s+/g, ' ').trim();
                    result = `"${cleanPhrase}"`;
                    break;
                
                case 'exact':
                    // Точное соответствие - удаляем спецсимволы, затем добавляем квадратные скобки
                    const cleanExact = trimmedLine.replace(/[^\p{L}\p{N}\s]/gu, '').replace(/\s+/g, ' ').trim();
                    result = `[${cleanExact}]`;
                    break;
                
                default:
                    result = trimmedLine;
                    break;
            }

            // Применяем изменение регистра с учетом специальных символов
            return applyCaseChangeToContent(result, caseType);
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

    // Обработчик радиокнопок БЕЗ возможности снятия выбора (для типа соответствия)
    const handleMatchTypeChange = (value: MatchType) => {
        setMatchType(value);
    };

    // Обработчик радиокнопок С возможностью снятия выбора (для регистра)
    const handleCaseTypeChange = (value: CaseType) => {
        setCaseType(currentValue => currentValue === value ? '' : value);
    };

    // Применение изменения регистра
    const applyCaseChange = (text: string, caseOption: CaseType): string => {
        if (!caseOption) return text;

        switch (caseOption) {
            case 'lowercase':
                return text.toLowerCase();
            case 'uppercase':
                return text.toUpperCase();
            case 'capitalize-first':
                return text.length > 0 ? text.charAt(0).toUpperCase() + text.slice(1).toLowerCase() : text;
            default:
                return text;
        }
    };

    // Применение изменения регистра с учетом специальных символов (скобки, кавычки)
    const applyCaseChangeToContent = (result: string, caseOption: CaseType): string => {
        if (!caseOption) return result;

        // Проверяем, есть ли квадратные скобки
        if (result.startsWith('[') && result.endsWith(']')) {
            const content = result.slice(1, -1); // Извлекаем содержимое без скобок
            const processedContent = applyCaseChange(content, caseOption);
            return `[${processedContent}]`;
        }
        
        // Проверяем, есть ли кавычки
        if (result.startsWith('"') && result.endsWith('"')) {
            const content = result.slice(1, -1); // Извлекаем содержимое без кавычек
            const processedContent = applyCaseChange(content, caseOption);
            return `"${processedContent}"`;
        }
        
        // Если нет специальных символов, применяем к всему тексту
        return applyCaseChange(result, caseOption);
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
                        <span className="info">{countLines(inputText)} стр.</span>
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
                                onChange={() => handleMatchTypeChange('broad')}
                            />
                            <span className="radio-text">Широкое соответствие</span>
                        </label>

                        <label className="radio-item">
                            <input
                                type="radio"
                                name="match-type"
                                value="phrase"
                                checked={matchType === 'phrase'}
                                onChange={() => handleMatchTypeChange('phrase')}
                            />
                            <span className="radio-text">Фразовое соответствие</span>
                        </label>

                        <label className="radio-item">
                            <input
                                type="radio"
                                name="match-type"
                                value="exact"
                                checked={matchType === 'exact'}
                                onChange={() => handleMatchTypeChange('exact')}
                            />
                            <span className="radio-text">Точное соответствие</span>
                        </label>
                    </div>

                    {/* Вторая группа настроек - регистр */}
                    <div className="settings-group">
                        <label className="radio-item">
                            <input
                                type="radio"
                                name="case-type"
                                value="lowercase"
                                checked={caseType === 'lowercase'}
                                onChange={() => {}} // Пустой onChange для валидности
                                onClick={() => handleCaseTypeChange('lowercase')}
                            />
                            <span className="radio-text">все строчные</span>
                        </label>

                        <label className="radio-item">
                            <input
                                type="radio"
                                name="case-type"
                                value="uppercase"
                                checked={caseType === 'uppercase'}
                                onChange={() => {}} // Пустой onChange для валидности
                                onClick={() => handleCaseTypeChange('uppercase')}
                            />
                            <span className="radio-text">ВСЕ ПРОПИСНЫЕ</span>
                        </label>

                        <label className="radio-item">
                            <input
                                type="radio"
                                name="case-type"
                                value="capitalize-first"
                                checked={caseType === 'capitalize-first'}
                                onChange={() => {}} // Пустой onChange для валидности
                                onClick={() => handleCaseTypeChange('capitalize-first')}
                            />
                            <span className="radio-text">Первое с заглавной</span>
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