import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { statsService } from '../utils/statsService';
import '../styles/tool-pages.css';
import './CharCounterTool.css';

interface CountStats {
  characters: number;
  charactersNoSpaces: number;
  words: number;
  numbers: number;
  digits: number;
  specialChars: number;
  paragraphs: number;
  sentences: number;
}

const CharCounterTool: React.FC = () => {
    const [inputText, setInputText] = useState('');
    const [exceptions, setExceptions] = useState('');
    const [launchCount, setLaunchCount] = useState(0);
    const [useExceptions, setUseExceptions] = useState(false); // Новое состояние для чекбокса
    const [stats, setStats] = useState<CountStats>({
        characters: 0,
        charactersNoSpaces: 0,
        words: 0,
        numbers: 0,
        digits: 0,
        specialChars: 0,
        paragraphs: 0,
        sentences: 0
    });

    // Предустановленный список исключений
    const presetExceptions = `и\nили\nа\nс\nз\nпод\nпри\nна\nв\nо\nот\nк\nу\nпо\nза\nдля\nбез\nиз\nчерез\nмежду\nнад\nобо\nперед`;

    // Загрузка статистики запусков при монтировании
    useEffect(() => {
        setLaunchCount(statsService.getLaunchCount('char-counter'));
    }, []);

    // Очистка результатов при изменении входных данных или настроек
    useEffect(() => {
        setStats({
            characters: 0,
            charactersNoSpaces: 0,
            words: 0,
            numbers: 0,
            digits: 0,
            specialChars: 0,
            paragraphs: 0,
            sentences: 0
        });
    }, [inputText, exceptions, useExceptions]);

    // Функция вставки текста из буфера
    const handlePaste = async () => {
        try {
            const text = await navigator.clipboard.readText();
            setInputText(text);
        } catch (err) {
            console.error('Ошибка при вставке текста:', err);
        }
    };

    // Функция переноса предустановленных исключений
    const handleTransferExceptions = () => {
        const currentExceptions = exceptions.trim();
        const newWords = presetExceptions;
        
        if (currentExceptions === '') {
            setExceptions(newWords);
        } else {
            setExceptions(currentExceptions + '\n' + newWords);
        }
    };

    // Основная функция подсчета статистики
    const calculateStats = () => {
        if (!inputText.trim()) {
            setStats({
                characters: 0,
                charactersNoSpaces: 0,
                words: 0,
                numbers: 0,
                digits: 0,
                specialChars: 0,
                paragraphs: 0,
                sentences: 0
            });
            return;
        }

        // Увеличиваем счетчик запусков
        statsService.incrementLaunchCount('char-counter');
        setLaunchCount(prev => prev + 1);

        // Получаем список исключений (только если включена опция)
        const exceptionList = useExceptions && exceptions
            ? exceptions
                .toLowerCase()
                .split('\n')
                .map(word => word.trim())
                .filter(word => word.length > 0)
            : [];

        let text = inputText;

        // Удаляем исключения из текста для подсчета (только если есть исключения)
        if (exceptionList.length > 0) {
            exceptionList.forEach(exception => {
                const regex = new RegExp(`\\b${exception}\\b`, 'gi');
                text = text.replace(regex, '');
            });
        }

        // Подсчет символов
        const characters = text.length;
        const charactersNoSpaces = text.replace(/\s/g, '').length;

        // Подсчет слов (разделенных пробелами, без пустых)
        const words = text.trim() === '' ? 0 : text.trim().split(/\s+/).filter(word => word.length > 0).length;

        // Подсчет чисел (целые числа)
        const numberMatches = text.match(/\b\d+\b/g);
        const numbers = numberMatches ? numberMatches.length : 0;

        // Подсчет цифр (отдельные цифры)
        const digitMatches = text.match(/\d/g);
        const digits = digitMatches ? digitMatches.length : 0;

        // Подсчет спецсимволов (все кроме букв, цифр и пробелов)
        const specialCharMatches = text.match(/[^\p{L}\p{N}\s]/gu);
        const specialChars = specialCharMatches ? specialCharMatches.length : 0;

        // Подсчет абзацев (разделенных двойными переносами или просто переносами)
        const paragraphs = text.trim() === '' ? 0 : text.trim().split(/\n\s*\n|\n/).filter(para => para.trim().length > 0).length;

        // Подсчет предложений (разделенных точками, восклицательными и вопросительными знаками)
        const sentenceMatches = text.match(/[.!?]+/g);
        const sentences = sentenceMatches ? sentenceMatches.length : 0;

        setStats({
            characters,
            charactersNoSpaces,
            words,
            numbers,
            digits,
            specialChars,
            paragraphs,
            sentences
        });
    };

    // Обработчик кнопки "Показать результат"
    const handleShowResult = () => {
        calculateStats();
    };

    // Обработчик кнопки "Скопировать результат"
    const handleCopyResult = async () => {
        const resultsText = `Символов: ${stats.characters}
Символов без пробелов: ${stats.charactersNoSpaces}
Слов: ${stats.words}
Чисел: ${stats.numbers}
Цифр: ${stats.digits}
Спецсимволов: ${stats.specialChars}
Абзацев: ${stats.paragraphs}
Предложений: ${stats.sentences}`;

        try {
            await navigator.clipboard.writeText(resultsText);
            // Здесь можно добавить уведомление об успешном копировании
        } catch (err) {
            console.error('Ошибка копирования:', err);
        }
    };

    return (
        <div className="char-counter-tool">
            {/* Header-остров инструмента */}
            <div className="tool-header-island">
                <Link to="/" className="back-button">
                    <img src="/icons/arrow_left.svg" alt="" />
                    Все инструменты
                </Link>
                <h1 className="tool-title">Количество символов</h1>
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
                        <span className="char-counter">{inputText.split('\n').filter(line => line.trim()).length} стр.</span>
                    </div>
                </div>

                {/* Правая часть - настройки и счетчики */}
                <div className="settings-section">
                    {/* Группа счетчиков */}
                    <div className="stats-group">
                        <div className="stats-grid">
                            <div className="stat-item">
                                <div className="stat-label">Символов</div>
                                <div className="stat-value">{stats.characters}</div>
                            </div>
                            <div className="stat-item">
                                <div className="stat-label">Без пробелов</div>
                                <div className="stat-value">{stats.charactersNoSpaces}</div>
                            </div>
                            <div className="stat-item">
                                <div className="stat-label">Слов</div>
                                <div className="stat-value">{stats.words}</div>
                            </div>
                            <div className="stat-item">
                                <div className="stat-label">Чисел</div>
                                <div className="stat-value">{stats.numbers}</div>
                            </div>
                            <div className="stat-item">
                                <div className="stat-label">Цифр</div>
                                <div className="stat-value">{stats.digits}</div>
                            </div>
                            <div className="stat-item">
                                <div className="stat-label">Спецсимволов</div>
                                <div className="stat-value">{stats.specialChars}</div>
                            </div>
                            <div className="stat-item">
                                <div className="stat-label">Абзацев</div>
                                <div className="stat-value">{stats.paragraphs}</div>
                            </div>
                            <div className="stat-item">
                                <div className="stat-label">Предложений</div>
                                <div className="stat-value">{stats.sentences}</div>
                            </div>
                        </div>
                    </div>

                    {/* Группа настроек */}
                    <div className="settings-group">
                        <label className="checkbox-item">
                            <input
                                type="checkbox"
                                checked={useExceptions}
                                onChange={(e) => setUseExceptions(e.target.checked)}
                            />
                            <span className="checkbox-text">Добавить исключения для подсчета</span>
                        </label>
                    </div>

                    {/* Блок исключений (показывается только при активации чекбокса) */}
                    {useExceptions && (
                        <div className="exceptions-block">
                            <div className="exceptions-fields">
                                <div className="exceptions-left">
                                    <textarea
                                        className="exceptions-textarea"
                                        placeholder="*Введите слова, через новую строку, которые НЕ нужно включать в результат:"
                                        value={exceptions}
                                        onChange={(e) => setExceptions(e.target.value)}
                                    />
                                </div>
                                <div className="exceptions-right">
                                    <textarea
                                        className="exceptions-textarea preset-words"
                                        value={`и
или
а
с
з
под
при
на
в
о
от
к
у
по
за
для
без
из
через
между
над
обо
перед`}
                                        readOnly
                                        rows={4}
                                    />
                                    <button className="transfer-button" onClick={handleTransferExceptions}>
                                        <img src="/icons/arrow_left.svg" alt="" />
                                        Перенести
                                    </button>
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            </div>

            {/* Кнопки управления */}
            <div className="control-buttons">
                <button 
                    className="action-btn primary"
                    style={{ width: '445px' }}
                    onClick={handleShowResult}
                >
                    Показать результат
                </button>
                <button 
                    className="action-btn secondary icon-left"
                    style={{ width: '445px' }}
                    onClick={handleCopyResult}
                >
                    <img src="/icons/button_copy.svg" alt="" />
                    Скопировать результат
                </button>
            </div>
        </div>
    );
};

export default CharCounterTool;
