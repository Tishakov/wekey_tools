import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { statsService } from '../utils/statsService';
import { useLocalizedLink } from '../hooks/useLanguageFromUrl';
import '../styles/tool-pages.css';
import { useAuthRequired } from '../hooks/useAuthRequired';
import AuthRequiredModal from '../components/AuthRequiredModal';
import AuthModal from '../components/AuthModal';
import './SpacesToParagraphsTool.css';


const TOOL_ID = 'spaces-to-paragraphs';
const SpacesToParagraphsTool: React.FC = () => {
    const { t } = useTranslation();

// Auth Required Hook
    const {
        isAuthRequiredModalOpen,
        isAuthModalOpen,
        requireAuth,
        closeAuthRequiredModal,
        closeAuthModal,
        openAuthModal
    } = useAuthRequired();
    const { createLink } = useLocalizedLink();
    const [inputText, setInputText] = useState('');
    const [result, setResult] = useState('');
    const [copied, setCopied] = useState(false);
    const [launchCount, setLaunchCount] = useState(0);
    
    // Состояния для чекбоксов первой группы
    const [removePunctuation, setRemovePunctuation] = useState(false);
    const [removeSpecialChars, setRemoveSpecialChars] = useState(false);
    
    // Состояние для радио-кнопок второй группы (регистр)
    const [caseOption, setCaseOption] = useState('');

    // Загрузка статистики запусков при монтировании
    useEffect(() => {
        statsService.getLaunchCount(TOOL_ID).then(setLaunchCount);
    }, []);

    // Очистка результата при изменении входного текста или настроек
    useEffect(() => {
        setResult('');
    }, [inputText, removePunctuation, removeSpecialChars, caseOption]);

    // Отслеживание статистики при показе результата
    useEffect(() => {
        if (result) {
            const updateStats = async () => {
                try {
                    const newCount = await statsService.incrementAndGetCount(TOOL_ID);
                    setLaunchCount(newCount);
                } catch (error) {
                    console.warn('Failed to update statistics:', error);
                    setLaunchCount(prev => prev + 1);
                }
            };
            updateStats();
        }
    }, [result]);

    // Функция для удаления знаков препинания
    const removePunctuationFunc = (text: string): string => {
        return text.replace(/[.!?,:;()[\]{}""''«»\-—–]/g, '');
    };

    // Функция для удаления спецсимволов
    const removeSpecialCharsFunc = (text: string): string => {
        return text.replace(/[^\w\s\u0400-\u04FF]/g, '');
    };

    // Основная функция обработки текста
    const processText = (text: string): string => {
        if (!text.trim()) return '';

        let processedText = text;

        // Применяем выбранные опции обработки
        if (removePunctuation) {
            processedText = removePunctuationFunc(processedText);
        }

        if (removeSpecialChars) {
            processedText = removeSpecialCharsFunc(processedText);
        }

        // Заменяем пробелы на переносы строк (создаем абзацы)
        processedText = processedText.replace(/\s+/g, '\n');

        // Применяем выбранный регистр
        if (caseOption === 'lowercase') {
            processedText = processedText.toLowerCase();
        } else if (caseOption === 'capitalizeEach') {
            processedText = processedText
                .split('\n')
                .map(line => line.trim())
                .filter(line => line.length > 0)
                .map(line => line.charAt(0).toUpperCase() + line.slice(1).toLowerCase())
                .join('\n');
        }

        return processedText;
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
    const handleShowResult = async () => {
        // Проверяем авторизацию перед выполнением
        if (!requireAuth()) {
            return; // Если пользователь не авторизован, показываем модальное окно и прерываем выполнение
        }

        // Увеличиваем счетчик запусков
        try {
            const newCount = await statsService.incrementAndGetCount(TOOL_ID);
            setLaunchCount(newCount);
        } catch (error) {
            console.error('Failed to update stats:', error);
            setLaunchCount(prev => prev + 1);
        }


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

    // Обработчик радио-кнопок (как в TransliterationTool)
    const handleRadioClick = (currentValue: string, setValue: (value: string) => void, clickedValue: string) => {
        if (currentValue === clickedValue) {
            setValue(''); // Снимаем выбор если кликнули по уже выбранной радиокнопке
        } else {
            setValue(clickedValue); // Устанавливаем новое значение
        }
    };

    // Подсчет строк
    const inputLines = inputText.trim() ? inputText.split('\n').length : 0;
    const resultLines = result.trim() ? result.split('\n').length : 0;

    return (
        <div className="spaces-to-paragraphs-tool">
            {/* Header-остров инструмента */}
            <div className="tool-header-island">
                <Link to={createLink('')} className="back-button">
                    <img src="/icons/arrow_left.svg" alt="" />
                    {t('spacesToParagraphs.allTools')}
                </Link>
                <h1 className="tool-title">{t('spacesToParagraphs.title')}</h1>
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
                        placeholder={t('spacesToParagraphs.inputPlaceholder')}
                        value={inputText}
                        onChange={(e) => setInputText(e.target.value)}
                    />
                    <div className="input-controls">
                        <button className="paste-button" onClick={handlePaste}>
                            <img src="/icons/button_paste.svg" alt="" />
                            {t('spacesToParagraphs.buttons.paste')}
                        </button>
                        <span className="info">{inputLines} {t('spacesToParagraphs.lineCount')}</span>
                    </div>
                </div>

                {/* Правая часть - настройки */}
                <div className="settings-section">
                    {/* Первая группа настроек */}
                    <div className="settings-group">
                        <label className="checkbox-item">
                            <input
                                type="checkbox"
                                checked={removePunctuation}
                                onChange={(e) => setRemovePunctuation(e.target.checked)}
                            />
                            <span className="checkbox-text">{t('spacesToParagraphs.settings.removePunctuation')}</span>
                        </label>

                        <label className="checkbox-item">
                            <input
                                type="checkbox"
                                checked={removeSpecialChars}
                                onChange={(e) => setRemoveSpecialChars(e.target.checked)}
                            />
                            <span className="checkbox-text">{t('spacesToParagraphs.settings.removeSpecialChars')}</span>
                        </label>
                    </div>

                    {/* Вторая группа настроек */}
                    <div className="settings-group">
                        <label className="radio-item">
                            <input
                                type="radio"
                                name="caseOption"
                                value="lowercase"
                                checked={caseOption === 'lowercase'}
                                onClick={() => handleRadioClick(caseOption, setCaseOption, 'lowercase')}
                                onChange={() => {}} // Пустой onChange чтобы React не ругался
                            />
                            <span className="checkbox-text">{t('spacesToParagraphs.settings.lowercase')}</span>
                        </label>

                        <label className="radio-item">
                            <input
                                type="radio"
                                name="caseOption"
                                value="capitalizeEach"
                                checked={caseOption === 'capitalizeEach'}
                                onClick={() => handleRadioClick(caseOption, setCaseOption, 'capitalizeEach')}
                                onChange={() => {}} // Пустой onChange чтобы React не ругался
                            />
                            <span className="checkbox-text">{t('spacesToParagraphs.settings.capitalizeEach')}</span>
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
                    {t('spacesToParagraphs.buttons.showResult')}
                </button>
                
                <button 
                    className="action-btn secondary icon-left" 
                    style={{ width: '445px' }} 
                    onClick={handleCopy}
                    disabled={!result}
                >
                    <img src="/icons/button_copy.svg" alt="" />
                    {copied ? t('spacesToParagraphs.buttons.copied') : t('spacesToParagraphs.buttons.copy')}
                </button>
            </div>

            {/* Поле результата */}
            <div className="result-section">
                <textarea
                    className="result-textarea"
                    placeholder={t('spacesToParagraphs.resultPlaceholder')}
                    value={result}
                    readOnly
                />
                <div className="result-controls">
                    <span className="result-counter">{resultLines} {t('spacesToParagraphs.lineCount')}</span>
                </div>
            </div>

            {/* SEO секция */}
            <div className="seo-section">
                <div className="seo-content">
                    <div className="seo-item">
                        <h2>{t('spacesToParagraphs.seo.whatIsSpacesToParagraphs.title')}</h2>
                        <p>{t('spacesToParagraphs.seo.whatIsSpacesToParagraphs.text')}</p>
                    </div>
                    
                    <div className="seo-item">
                        <h2>{t('spacesToParagraphs.seo.whyNeeded.title')}</h2>
                        <p>{t('spacesToParagraphs.seo.whyNeeded.text')}</p>
                    </div>
                    
                    <div className="seo-item">
                        <h2>{t('spacesToParagraphs.seo.howItWorks.title')}</h2>
                        <p>{t('spacesToParagraphs.seo.howItWorks.text')}</p>
                    </div>
                    
                    <div className="seo-item">
                        <h2>{t('spacesToParagraphs.seo.whatTexts.title')}</h2>
                        <p>{t('spacesToParagraphs.seo.whatTexts.text')}</p>
                    </div>
                    
                    <div className="seo-item">
                        <h2>{t('spacesToParagraphs.seo.forSpecialists.title')}</h2>
                        <p>{t('spacesToParagraphs.seo.forSpecialists.text')}</p>
                    </div>
                    
                    <div className="seo-item">
                        <h2>{t('spacesToParagraphs.seo.howToUse.title')}</h2>
                        <p>{t('spacesToParagraphs.seo.howToUse.text')}</p>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default SpacesToParagraphsTool;
