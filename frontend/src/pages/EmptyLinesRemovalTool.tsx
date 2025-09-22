import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useLocalizedLink } from '../hooks/useLanguageFromUrl';
import SEOHead from '../components/SEOHead';
import { statsService } from '../utils/statsService';
import '../styles/tool-pages.css';
import './EmptyLinesRemovalTool.css';


const TOOL_ID = 'remove-empty-lines';
const EmptyLinesRemovalTool: React.FC = () => {
    const { t } = useTranslation();
  const { createLink } = useLocalizedLink();
    const [inputText, setInputText] = useState('');
    const [result, setResult] = useState('');
    const [copied, setCopied] = useState(false);
    const [launchCount, setLaunchCount] = useState(0);
    
    // Состояния для фильтрации
    const [removeEmptyLines, setRemoveEmptyLines] = useState(false);
    const [filterOption, setFilterOption] = useState('');
    
    // Состояния для полей фильтрации
    const [containsFilter, setContainsFilter] = useState('');
    const [notContainsFilter, setNotContainsFilter] = useState('');

    // Загрузка статистики запусков при монтировании
    useEffect(() => {
        const loadStats = async () => {
            try {
                const count = await statsService.getLaunchCount(TOOL_ID);
                setLaunchCount(count);
            } catch (error) {
                console.error('Ошибка загрузки статистики:', error);
                setLaunchCount(0);
            }
        };
        loadStats();
    }, []);

    // Очистка результата при изменении входного текста или настроек
    useEffect(() => {
        setResult('');
    }, [inputText, removeEmptyLines, filterOption, containsFilter, notContainsFilter]);

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

    // Основная функция обработки текста
    const processText = (text: string): string => {
        if (!text.trim()) return '';

        let lines = text.split('\n');

        // Применяем фильтры
        
        // 1. Удалить пустые строки (чекбокс)
        if (removeEmptyLines) {
            lines = lines.filter(line => line.trim().length > 0);
        }

        // 2. Применяем выбранный радио-фильтр
        if (filterOption === 'removeContains' && containsFilter.trim()) {
            // Разбиваем фильтр на отдельные слова по новой строке или запятой
            const filterWords = containsFilter
                .split(/[\n,]/)
                .map(word => word.trim())
                .filter(word => word.length > 0);
            
            // Удалить строки, которые содержат любое из указанных слов
            lines = lines.filter(line => {
                return !filterWords.some(word => line.includes(word));
            });
        } else if (filterOption === 'removeNotContains' && notContainsFilter.trim()) {
            // Разбиваем фильтр на отдельные слова по новой строке или запятой
            const filterWords = notContainsFilter
                .split(/[\n,]/)
                .map(word => word.trim())
                .filter(word => word.length > 0);
            
            // Удалить строки, которые НЕ содержат ни одного из указанных слов (оставить только те, что содержат хотя бы одно)
            lines = lines.filter(line => {
                return filterWords.some(word => line.includes(word));
            });
        }

        return lines.join('\n');
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

    // Обработчик вставки в поле "содержат"
    const handlePasteContains = async () => {
        try {
            const text = await navigator.clipboard.readText();
            setContainsFilter(text);
        } catch (err) {
            console.error('Ошибка при вставке:', err);
        }
    };

    // Обработчик вставки в поле "НЕ содержат"
    const handlePasteNotContains = async () => {
        try {
            const text = await navigator.clipboard.readText();
            setNotContainsFilter(text);
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

    // Обработчик радио-кнопок с возможностью снятия выбора (для фильтров содержания)
    const handleRadioClick = (clickedValue: string) => {
        if (filterOption === clickedValue) {
            setFilterOption(''); // Снимаем выбор если кликнули по уже выбранной радиокнопке
        } else {
            setFilterOption(clickedValue); // Устанавливаем новое значение
        }
    };

    // Подсчет строк
    const inputLines = inputText.trim() ? inputText.split('\n').length : 0;
    const resultLines = result.trim() ? result.split('\n').length : 0;

    return (
        <div className="empty-lines-removal-tool">
            <SEOHead 
                title={t('emptyLinesRemovalTool.seo.title')}
                description={t('emptyLinesRemovalTool.seo.description')}
                keywords={t('emptyLinesRemovalTool.seo.keywords')}
                ogTitle={t('emptyLinesRemovalTool.seo.ogTitle')}
                ogDescription={t('emptyLinesRemovalTool.seo.ogDescription')}
            />
            {/* Header-остров инструмента */}
            <div className="tool-header-island">
                <Link to={createLink('')} className="back-button">
                    <img src="/icons/arrow_left.svg" alt="" />
                    {t('navigation.allTools')}
                </Link>
                <h1 className="tool-title">{t('emptyLinesRemovalTool.title')}</h1>
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
                        placeholder={t('emptyLinesRemovalTool.inputPlaceholder')}
                        value={inputText}
                        onChange={(e) => setInputText(e.target.value)}
                    />
                    <div className="input-controls">
                        <button className="paste-button" onClick={handlePaste}>
                            <img src="/icons/button_paste.svg" alt="" />
                            {t('emptyLinesRemovalTool.buttons.paste')}
                        </button>
                        <span className="info">{inputLines} {t('emptyLinesRemovalTool.lineCount')}</span>
                    </div>
                </div>

                {/* Правая часть - настройки */}
                <div className="settings-section">
                    {/* Первая группа настроек */}
                    <div className="settings-group">
                        <label className="checkbox-item">
                            <input
                                type="checkbox"
                                checked={removeEmptyLines}
                                onChange={(e) => setRemoveEmptyLines(e.target.checked)}
                            />
                            <span className="checkbox-text">{t('emptyLinesRemovalTool.options.removeEmptyLines')}</span>
                        </label>
                    </div>

                    {/* Вторая группа настроек */}
                    <div className="settings-group">
                        <label className="radio-item">
                            <input
                                type="radio"
                                name="filterOption"
                                value="removeContains"
                                checked={filterOption === 'removeContains'}
                                onClick={() => handleRadioClick('removeContains')}
                                onChange={() => {}} // Пустой onChange чтобы React не ругался
                            />
                            <span className="checkbox-text">{t('emptyLinesRemovalTool.options.removeContains')}</span>
                        </label>
                        <div className="filter-controls">
                            <textarea
                                className="filter-input"
                                placeholder={t('emptyLinesRemovalTool.filterPlaceholder')}
                                value={containsFilter}
                                onChange={(e) => setContainsFilter(e.target.value)}
                                disabled={filterOption !== 'removeContains'}
                            />
                            <button 
                                className="filter-paste-button" 
                                onClick={handlePasteContains} 
                                disabled={filterOption !== 'removeContains'}
                                title={t('emptyLinesRemovalTool.buttons.paste')}
                            >
                                <img src="/icons/button_paste.svg" alt="" />
                                {t('emptyLinesRemovalTool.buttons.paste')}
                            </button>
                        </div>
                    </div>

                    {/* Третья группа настроек */}
                    <div className="settings-group">
                        <label className="radio-item">
                            <input
                                type="radio"
                                name="filterOption"
                                value="removeNotContains"
                                checked={filterOption === 'removeNotContains'}
                                onClick={() => handleRadioClick('removeNotContains')}
                                onChange={() => {}} // Пустой onChange чтобы React не ругался
                            />
                            <span className="checkbox-text">{t('emptyLinesRemovalTool.options.removeNotContains')}</span>
                        </label>
                        <div className="filter-controls">
                            <textarea
                                className="filter-input"
                                placeholder={t('emptyLinesRemovalTool.filterPlaceholder')}
                                value={notContainsFilter}
                                onChange={(e) => setNotContainsFilter(e.target.value)}
                                disabled={filterOption !== 'removeNotContains'}
                            />
                            <button 
                                className="filter-paste-button" 
                                onClick={handlePasteNotContains} 
                                disabled={filterOption !== 'removeNotContains'}
                                title={t('emptyLinesRemovalTool.buttons.paste')}
                            >
                                <img src="/icons/button_paste.svg" alt="" />
                                {t('emptyLinesRemovalTool.buttons.paste')}
                            </button>
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
                    disabled={!inputText.trim() || (!removeEmptyLines && !filterOption)}
                >
                    {t('emptyLinesRemovalTool.buttons.showResult')}
                </button>

                <button 
                    className="action-btn secondary icon-left" 
                    style={{ width: '445px' }} 
                    onClick={handleCopy}
                    disabled={!result}
                >
                    <img src="/icons/button_copy.svg" alt="" />
                    {copied ? t('emptyLinesRemovalTool.buttons.copied') : t('emptyLinesRemovalTool.buttons.copyResult')}
                </button>
            </div>

            {/* Поле результата */}
            <div className="result-section">
                <textarea
                    className="result-textarea"
                    placeholder={t('emptyLinesRemovalTool.resultPlaceholder')}
                    value={result}
                    readOnly
                />
                <div className="result-controls">
                    <span className="result-counter">{resultLines} {t('emptyLinesRemovalTool.lineCount')}</span>
                </div>
            </div>

            {/* SEO блок */}
            <div className="seo-section">
                <h3>{t('emptyLinesRemovalTool.seo.whatIsEmptyLinesRemoval.title')}</h3>
                <p>{t('emptyLinesRemovalTool.seo.whatIsEmptyLinesRemoval.text')}</p>

                <h3>{t('emptyLinesRemovalTool.seo.whyNeeded.title')}</h3>
                <p>{t('emptyLinesRemovalTool.seo.whyNeeded.text')}</p>

                <h3>{t('emptyLinesRemovalTool.seo.howItWorks.title')}</h3>
                <p>{t('emptyLinesRemovalTool.seo.howItWorks.text')}</p>

                <h3>{t('emptyLinesRemovalTool.seo.whatCanFilter.title')}</h3>
                <p>{t('emptyLinesRemovalTool.seo.whatCanFilter.text')}</p>

                <h3>{t('emptyLinesRemovalTool.seo.forSpecialists.title')}</h3>
                <p>{t('emptyLinesRemovalTool.seo.forSpecialists.text')}</p>

                <h3>{t('emptyLinesRemovalTool.seo.howToUse.title')}</h3>
                <p>{t('emptyLinesRemovalTool.seo.howToUse.text')}</p>
            </div>
        </div>
    );
};

export default EmptyLinesRemovalTool;