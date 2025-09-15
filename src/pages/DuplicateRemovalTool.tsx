import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { statsService } from '../utils/statsService';
import '../styles/tool-pages.css';
import './DuplicateRemovalTool.css';

type DuplicateMode = 'remove-duplicates' | 'remove-all-duplicates' | 'remove-unique';

const DuplicateRemovalTool: React.FC = () => {
    const [inputText, setInputText] = useState('');
    const [mode, setMode] = useState<DuplicateMode>('remove-duplicates');
    const [result, setResult] = useState('');
    const [copied, setCopied] = useState(false);

    const [launchCount, setLaunchCount] = useState(0);

    // Загрузка статистики запусков при монтировании
    useEffect(() => {
        setLaunchCount(statsService.getLaunchCount('udalenie_dublikatov'));
    }, []);

    // Очистка результата при изменении входного текста или режима
    useEffect(() => {
        setResult('');
    }, [inputText, mode]);

    // Отслеживание статистики при показе результата
    useEffect(() => {
        if (result) {
            statsService.incrementLaunchCount('udalenie_dublikatov');
        }
    }, [result]);

    // Функция для удаления дубликатов (оставить уникальные)
    const removeDuplicates = (text: string): string => {
        if (!text.trim()) return '';
        
        const lines = text.split('\n');
        const seen = new Set<string>();
        const uniqueLines: string[] = [];

        lines.forEach(line => {
            if (!seen.has(line)) {
                seen.add(line);
                uniqueLines.push(line);
            }
        });

        return uniqueLines.join('\n');
    };

    // Функция для удаления всех дубликатов (удалить все повторяющиеся)
    const removeAllDuplicates = (text: string): string => {
        if (!text.trim()) return '';
        
        const lines = text.split('\n');
        const counts = new Map<string, number>();

        // Подсчитываем количество каждой строки
        lines.forEach(line => {
            counts.set(line, (counts.get(line) || 0) + 1);
        });

        // Оставляем только строки, которые встречаются ровно один раз
        const uniqueLines: string[] = [];
        lines.forEach(line => {
            if (counts.get(line) === 1) {
                uniqueLines.push(line);
            }
        });

        return uniqueLines.join('\n');
    };

    // Функция для удаления уникальных (оставить только строки, которые имеют дубликаты)
    const removeUnique = (text: string): string => {
        if (!text.trim()) return '';
        
        const lines = text.split('\n');
        const counts = new Map<string, number>();

        // Подсчитываем количество каждой строки
        lines.forEach(line => {
            counts.set(line, (counts.get(line) || 0) + 1);
        });

        // Оставляем только строки, которые встречаются более одного раза (но по одному экземпляру)
        const seen = new Set<string>();
        const duplicateLines: string[] = [];
        
        lines.forEach(line => {
            if (counts.get(line)! > 1 && !seen.has(line)) {
                seen.add(line);
                duplicateLines.push(line);
            }
        });

        return duplicateLines.join('\n');
    };

    // Основная функция обработки текста
    const processText = (text: string): string => {
        switch (mode) {
            case 'remove-duplicates':
                return removeDuplicates(text);
            case 'remove-all-duplicates':
                return removeAllDuplicates(text);
            case 'remove-unique':
                return removeUnique(text);
            default:
                return text;
        }
    };

    // Обработчик вставки из буфера обмена
    const handlePaste = async () => {
        try {
            const text = await navigator.clipboard.readText();
            setInputText(text);
        } catch (err) {
            console.error('Ошибка при вставке:', err);
        }
    };

    // Обработчик кнопки "Показать результат"
    const handleShowResult = () => {
        const processedText = processText(inputText);
        setResult(processedText);
    };

    // Обработчик копирования
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
    const inputLines = inputText.trim() ? inputText.split('\n').length : 0;
    const resultLines = result.trim() ? result.split('\n').length : 0;

    return (
        <div className="duplicate-removal-tool">
            {/* Header-остров инструмента */}
            <div className="tool-header-island">
                <Link to="/" className="back-button">
                    <img src="/icons/arrow_left.svg" alt="" />
                    Все инструменты
                </Link>
                <h1 className="tool-title">Удаление дубликатов</h1>
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
                    <div className="settings-group">
                        <label className="radio-item">
                            <input
                                type="radio"
                                name="mode"
                                value="remove-duplicates"
                                checked={mode === 'remove-duplicates'}
                                onChange={(e) => setMode(e.target.value as DuplicateMode)}
                            />
                            <span className="radio-text">Удалить дубликаты</span>
                        </label>

                        <label className="radio-item">
                            <input
                                type="radio"
                                name="mode"
                                value="remove-all-duplicates"
                                checked={mode === 'remove-all-duplicates'}
                                onChange={(e) => setMode(e.target.value as DuplicateMode)}
                            />
                            <span className="radio-text">Удалить все дубликаты</span>
                        </label>

                        <label className="radio-item">
                            <input
                                type="radio"
                                name="mode"
                                value="remove-unique"
                                checked={mode === 'remove-unique'}
                                onChange={(e) => setMode(e.target.value as DuplicateMode)}
                            />
                            <span className="radio-text">Удалить уникальные</span>
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

export default DuplicateRemovalTool;