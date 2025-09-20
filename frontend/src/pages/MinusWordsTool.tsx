import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import '../styles/tool-pages.css';
import './MinusWordsTool.css';
import { statsService } from '../utils/statsService';


const TOOL_ID = 'minus_words_tool';
const MinusWordsTool: React.FC = () => {
    // Состояния компонента
    const [inputText, setInputText] = useState('');
    const [words, setWords] = useState<string[]>([]);
    const [minusWords, setMinusWords] = useState<string[]>([]);
    const [copied, setCopied] = useState(false);
    const [launchCount, setLaunchCount] = useState(0);

    // Загрузка статистики при монтировании компонента
    useEffect(() => {
        statsService.getLaunchCount(TOOL_ID).then(setLaunchCount);
    }, []);

    // Обработчик вставки из буфера обмена
    const handlePaste = async () => {
        try {
            const text = await navigator.clipboard.readText();
            setInputText(text);
        } catch (err) {
            console.error('Ошибка при вставке:', err);
        }
    };

    // Обработчик показа результата - разбивает текст на строки и слова
    const handleShowResult = () => {
        if (!inputText.trim()) {
            setWords([]);
            return;
        }
        
        // Разбиваем текст на строки, затем каждую строку на слова
        const lines = inputText.split('\n');
        const processedLines: string[] = [];
        
        lines.forEach(line => {
            if (line.trim()) {
                // Обрабатываем каждую строку: убираем знаки препинания и разбиваем на слова
                const wordsInLine = line
                    .replace(/[^\u0400-\u04FF\w\s]/g, ' ')
                    .split(/\s+/)
                    .filter(word => word.trim().length > 0)
                    .map(word => word.trim());
                
                if (wordsInLine.length > 0) {
                    processedLines.push(wordsInLine.join(' '));
                }
            }
            // Убрали блок else с добавлением пустых строк
        });
        
        setWords(processedLines);
        
        // Увеличиваем счетчик запусков
        const updateStats = async () => {
            try {
                const newCount = await statsService.incrementAndGetCount(TOOL_ID);
                setLaunchCount(newCount);
            } catch (error) {
                console.warn('Failed to update statistics:', error);
                const count = await statsService.getLaunchCount(TOOL_ID);
                setLaunchCount(count);
            }
        };
        updateStats();
    };

    // Обработчик клика по слову - добавляет в минус-слова или убирает
    const handleWordClick = (word: string) => {
        setMinusWords(prev => {
            if (prev.includes(word)) {
                // Убираем слово из минус-слов
                return prev.filter(w => w !== word);
            } else {
                // Добавляем слово в минус-слова
                return [...prev, word];
            }
        });
    };

    // Обработчик удаления слова из минус-слов
    const handleRemoveMinusWord = (wordToRemove: string) => {
        setMinusWords(prev => prev.filter(word => word !== wordToRemove));
    };

    // Обработчик копирования минус-слов
    const handleCopy = async () => {
        if (minusWords.length === 0) return;
        
        try {
            const textToCopy = minusWords.join('\n');
            await navigator.clipboard.writeText(textToCopy);
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
        } catch (err) {
            console.error('Ошибка при копировании:', err);
        }
    };

    // Очистка результатов только при полной очистке текста
    useEffect(() => {
        if (inputText === '') {
            setWords([]);
            setMinusWords([]);
        }
    }, [inputText]);

    return (
        <div className="tool-page">
            {/* Header-остров инструмента */}
            <div className="tool-header-island">
                <Link to="/" className="back-button">
                    <img src="/icons/arrow_left.svg" alt="" />
                    Все инструменты
                </Link>
                <h1 className="tool-title">Обработка минус-слов</h1>
                <div className="tool-header-buttons">
                    <button className="tool-header-btn counter-btn" title="Счетчик запусков">
                        <img src="/icons/rocket.svg" alt="" />
                        <span className="counter">{launchCount}</span>
                    </button>
                    <button className="tool-header-btn icon-only" title="Подсказка">
                        <img src="/icons/lamp.svg" alt="" />
                    </button>
                    <button className="tool-header-btn icon-only" title="Снимок экрана">
                        <img src="/icons/camera.svg" alt="" />
                    </button>
                </div>
            </div>

            {/* Основная рабочая область */}
            <div className="main-workspace">
                {/* Левая половина - вертикальная структура */}
                <div className="left-column">
                    {/* Поле ввода текста */}
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
                            <span className="line-count">{inputText.trim() ? inputText.split('\n').length : 0} стр.</span>
                        </div>
                    </div>

                    {/* Кнопка "Показать результат" */}
                    <button className="show-result-btn" onClick={handleShowResult}>
                        Показать результат
                    </button>

                    {/* Поле минус-слов */}
                    <div className="minus-words-section">
                        <div className="result-textarea">
                            {minusWords.length === 0 ? (
                                <div className="placeholder">Здесь будут отобранные минус-слова</div>
                            ) : (
                                <div className="minus-words-list">
                                    {minusWords.map((word, index) => (
                                        <div key={index} className="minus-word-item">
                                            <span className="minus-word-text">{word}</span>
                                            <button 
                                                className="remove-word-btn"
                                                onClick={() => handleRemoveMinusWord(word)}
                                                title="Удалить слово"
                                            >
                                                ×
                                            </button>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Кнопка "Скопировать минус-слова" */}
                    <button className="copy-btn" onClick={handleCopy}>
                        <img src="/icons/button_copy.svg" alt="" />
                        {copied ? 'Скопировано!' : 'Скопировать минус-слова'}
                    </button>
                </div>

                {/* Правая половина - обработка слов */}
                <div className="right-column">
                    <div className="processing-section full-height">
                        {words.length === 0 ? (
                            <div className="placeholder-text">
                                Здесь будут слова для обработки
                            </div>
                        ) : (
                            <div className="words-container">
                                {words.map((line, lineIndex) => (
                                    <div key={lineIndex} className="line-container">
                                        {line ? (
                                            line.split(' ').map((word, wordIndex) => (
                                                <span 
                                                    key={`${lineIndex}-${wordIndex}`}
                                                    className={`word-item ${minusWords.includes(word) ? 'active' : ''}`}
                                                    onClick={() => handleWordClick(word)}
                                                >
                                                    {word}
                                                </span>
                                            ))
                                        ) : (
                                            <div className="empty-line">&nbsp;</div>
                                        )}
                                    </div>
                                ))}
                            </div>
                        )}
                        <div className="processing-counter">
                            <span className="result-counter">{minusWords.length} слов</span>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default MinusWordsTool;
