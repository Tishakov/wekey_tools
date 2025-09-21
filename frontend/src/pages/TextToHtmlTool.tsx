import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { statsService } from '../utils/statsService';
import '../styles/tool-pages.css';
import './TextToHtmlTool.css';


const TOOL_ID = 'text-to-html';
type HtmlMode = 'paragraph' | 'line-break' | 'mixed';

const TextToHtmlTool: React.FC = () => {
    const [inputText, setInputText] = useState('');
    const [mode, setMode] = useState<HtmlMode>('paragraph');
    const [result, setResult] = useState('');
    const [copied, setCopied] = useState(false);
    const [launchCount, setLaunchCount] = useState(0);

    // Загрузка статистики запусков при монтировании
    useEffect(() => {
        statsService.getLaunchCount(TOOL_ID).then(setLaunchCount);
    }, []);

    // Очистка результата при изменении входного текста или режима
    useEffect(() => {
        setResult('');
    }, [inputText, mode]);

    // Отслеживание статистики при показе результата
    useEffect(() => {
        if (result) {
            const updateStats = async () => {
                try {
                    const newCount = await statsService.incrementAndGetCount(TOOL_ID, {
                        inputLength: inputText.length,
                        outputLength: result.length
                    });
                    setLaunchCount(newCount);
                } catch (error) {
                    console.error('Failed to update stats:', error);
                    setLaunchCount(prev => prev + 1);
                }
            };
            updateStats();
        }
    }, [result]);

    // Функция для конвертации в теги абзацев <p>
    const convertToParagraphs = (text: string): string => {
        if (!text.trim()) return '';
        
        // Разделяем текст на абзацы по двойным переносам
        const paragraphs = text.split(/\n\s*\n/);
        
        return paragraphs
            .filter(paragraph => paragraph.trim() !== '')
            .map(paragraph => `<p>${paragraph.trim()}</p>`)
            .join('\n\n'); // Добавляем пустую строку между абзацами
    };

    // Функция для конвертации в теги переносов <br>
    const convertToLineBreaks = (text: string): string => {
        if (!text.trim()) return '';
        
        // Простой подход: заменяем пустые строки на специальный маркер, 
        // затем обычные переносы, затем возвращаем маркеры
        return text
            .replace(/\n\s*\n/g, '|||EMPTY_LINE|||')  // Временный маркер для пустых строк
            .replace(/\n/g, '<br>\n')                  // Обычные переносы
            .replace(/\|\|\|EMPTY_LINE\|\|\|/g, '<br>\n<br>\n'); // Возвращаем пустые строки
    };

    // Функция для смешанной конвертации <br> and <p>
    const convertToMixed = (text: string): string => {
        if (!text.trim()) return '';
        
        // Разбиваем текст на абзацы (разделенные пустыми строками)
        const paragraphs = text.split(/\n\s*\n/);
        
        return paragraphs
            .filter(paragraph => paragraph.trim() !== '')
            .map(paragraph => {
                // Внутри каждого абзаца заменяем переносы на <br>\n с пробелом перед <br>
                const lines = paragraph.trim().replace(/\n/g, ' <br>\n');
                return `<p>${lines}</p>`;
            })
            .join('\n<br>\n'); // Разделяем абзацы тегом <br>
    };

    // Основная функция обработки текста
    const processText = (text: string): string => {
        switch (mode) {
            case 'paragraph':
                return convertToParagraphs(text);
            case 'line-break':
                return convertToLineBreaks(text);
            case 'mixed':
                return convertToMixed(text);
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
        <div className="text-to-html-tool">
            {/* Header-остров инструмента */}
            <div className="tool-header-island">
                <Link to="/" className="back-button">
                    <img src="/icons/arrow_left.svg" alt="" />
                    Все инструменты
                </Link>
                <h1 className="tool-title">Текст в HTML</h1>
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
                        <span className="line-count">{inputLines} стр.</span>
                    </div>
                </div>

                {/* Правая часть - настройки */}
                <div className="settings-section">
                    <div className="settings-group">
                        <label className="radio-item">
                            <input
                                type="radio"
                                name="mode"
                                value="paragraph"
                                checked={mode === 'paragraph'}
                                onChange={(e) => setMode(e.target.value as HtmlMode)}
                            />
                            <span className="radio-text">&lt;p&gt; - только тег абзаца</span>
                        </label>

                        <label className="radio-item">
                            <input
                                type="radio"
                                name="mode"
                                value="line-break"
                                checked={mode === 'line-break'}
                                onChange={(e) => setMode(e.target.value as HtmlMode)}
                            />
                            <span className="radio-text">&lt;br&gt; - только тег строки</span>
                        </label>

                        <label className="radio-item">
                            <input
                                type="radio"
                                name="mode"
                                value="mixed"
                                checked={mode === 'mixed'}
                                onChange={(e) => setMode(e.target.value as HtmlMode)}
                            />
                            <span className="radio-text">&lt;br&gt; and &lt;p&gt; - теги строки и абзаца</span>
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

export default TextToHtmlTool;
