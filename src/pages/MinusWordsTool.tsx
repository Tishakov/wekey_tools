import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import '../styles/tool-pages.css';
import './MinusWordsTool.css';
import { statsService } from '../utils/statsService';

const MinusWordsTool: React.FC = () => {
    // Состояния компонента
    const [inputText, setInputText] = useState('');
    const [words, setWords] = useState<string[]>([]);
    const [minusWords, setMinusWords] = useState<string[]>([]);
    const [copied, setCopied] = useState(false);
    const [launchCount, setLaunchCount] = useState(0);

    // Загрузка статистики при монтировании компонента
    useEffect(() => {
        const count = statsService.getLaunchCount('obrabotka_minus_slov');
        setLaunchCount(count);
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

    // Обработчик показа результата - разбивает текст на слова
    const handleShowResult = () => {
        if (!inputText.trim()) return;
        
        // Разбиваем текст на слова (по пробелам, табам, переносам строк и знакам препинания)
        const wordList = inputText
            .replace(/[^\w\s]/g, ' ') // Заменяем знаки препинания на пробелы
            .split(/\s+/)
            .filter(word => word.trim().length > 0)
            .map(word => word.trim());
        
        setWords(wordList);
        
        // Увеличиваем счетчик запусков
        statsService.incrementLaunchCount('obrabotka_minus_slov');
        const newCount = statsService.getLaunchCount('obrabotka_minus_slov');
        setLaunchCount(newCount);
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

    // Очистка результатов при изменении текста
    useEffect(() => {
        setWords([]);
        setMinusWords([]);
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
                {/* Левая половина - поле ввода */}
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
                        <span className="char-counter">{inputText.trim() ? inputText.split('\n').length : 0} стр.</span>
                    </div>
                </div>

                {/* Правая половина - обработка слов */}
                <div className="processing-section">
                    {words.length === 0 ? (
                        <div className="placeholder-text">
                            Здесь будут слова для обработки
                        </div>
                    ) : (
                        <div className="words-container">
                            {words.map((word, index) => (
                                <span 
                                    key={index}
                                    className={`word-item ${minusWords.includes(word) ? 'active' : ''}`}
                                    onClick={() => handleWordClick(word)}
                                >
                                    {word}
                                </span>
                            ))}
                        </div>
                    )}
                </div>
            </div>

            {/* Кнопки управления */}
            <div className="control-buttons">
                <button className="action-btn primary" onClick={handleShowResult}>
                    Показать результат
                </button>
                <button className="action-btn secondary icon-left" onClick={handleCopy}>
                    <img src="/icons/button_copy.svg" alt="" />
                    {copied ? 'Скопировано!' : 'Скопировать минус-слова'}
                </button>
            </div>

            {/* Секция минус-слов */}
            <div className="minus-words-section">
                <textarea
                    className="result-textarea"
                    placeholder="Здесь будут отобранные минус-слова"
                    value={minusWords.join('\n')}
                    readOnly
                />
                <div className="result-controls">
                    <span className="result-counter">{minusWords.length} стр.</span>
                </div>
            </div>
        </div>
    );
};

export default MinusWordsTool;
