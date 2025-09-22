import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { statsService } from '../utils/statsService';
import { useLocalizedLink } from '../hooks/useLanguageFromUrl';
import '../styles/tool-pages.css';
import { useAuthRequired } from '../hooks/useAuthRequired';
import AuthRequiredModal from '../components/AuthRequiredModal';
import AuthModal from '../components/AuthModal';
import './TextOptimizerTool.css';


const TOOL_ID = 'text-optimizer';
const TextOptimizerTool: React.FC = () => {
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
    const [options, setOptions] = useState<OptimizationOptions>({
        removeTrimSpaces: false,
        addNeededSpaces: false,
        replaceMultipleSpaces: false,
        fixCapitalization: false,
        createParagraphs: false,
        applyAll: false
    });

    // Состояния для чекбоксов оптимизации
interface OptimizationOptions {
    removeTrimSpaces: boolean;
    addNeededSpaces: boolean;
    replaceMultipleSpaces: boolean;
    fixCapitalization: boolean;
    createParagraphs: boolean;
    applyAll: boolean;
}

type OptimizationOption = keyof OptimizationOptions;    // Загрузка статистики запусков при монтировании
    useEffect(() => {
        statsService.getLaunchCount(TOOL_ID).then(setLaunchCount);
    }, []);

    // Очистка результата при изменении входного текста или настроек
    useEffect(() => {
        setResult('');
    }, [inputText, options]);

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

    // Функция для удаления лишних пробелов (в начале и конце строк)
    const removeTrimSpaces = (text: string): string => {
        return text.split('\n').map(line => line.trim()).join('\n');
    };

    // Функция для добавления нужных пробелов (после знаков пунктуации)
    const addNeededSpaces = (text: string): string => {
        return text
            // Добавляем пробел после знаков препинания, если его нет
            .replace(/([.!?,:;])([а-яёa-zA-ZА-ЯЁ0-9])/g, '$1 $2')
            // Добавляем пробел после скобок, если его нет
            .replace(/([)])([\wа-яёА-ЯЁ])/g, '$1 $2')
            .replace(/([\wа-яёА-ЯЁ])([(])/g, '$1 $2');
    };

    // Функция для замены множественных пробелов на одинарные
    const replaceMultipleSpaces = (text: string): string => {
        return text.replace(/[ ]{2,}/g, ' ');
    };

    // Функция для исправления регистра после знаков препинания
    const fixCapitalization = (text: string): string => {
        return text
            // Заглавная буква после точки, восклицательного или вопросительного знака
            .replace(/([.!?])\s+([а-яёa-z])/g, (_, punct, letter) => {
                return punct + ' ' + letter.toUpperCase();
            })
            // Заглавная буква в начале текста
            .replace(/^([а-яёa-z])/, (_, letter) => letter.toUpperCase());
    };

    // Функция для создания абзацев (добавление пустых строк между абзацами)
    const createParagraphs = (text: string): string => {
        return text
            // Заменяем одинарные переносы на двойные (кроме уже существующих двойных)
            .replace(/(?<!\n)\n(?!\n)/g, '\n\n');
    };

    // Основная функция оптимизации текста
    const optimizeText = (text: string): string => {
        if (!text.trim()) return '';

        let optimizedText = text;

        // Применяем выбранные оптимизации или все сразу
        if (options.applyAll || options.removeTrimSpaces) {
            optimizedText = removeTrimSpaces(optimizedText);
        }
        
        if (options.applyAll || options.addNeededSpaces) {
            optimizedText = addNeededSpaces(optimizedText);
        }
        
        if (options.applyAll || options.replaceMultipleSpaces) {
            optimizedText = replaceMultipleSpaces(optimizedText);
        }
        
        if (options.applyAll || options.fixCapitalization) {
            optimizedText = fixCapitalization(optimizedText);
        }
        
        if (options.applyAll || options.createParagraphs) {
            optimizedText = createParagraphs(optimizedText);
        }

        return optimizedText;
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


        const optimizedText = optimizeText(inputText);
        setResult(optimizedText);
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

    // Обработчик изменения чекбоксов
    const handleOptionChange = (option: OptimizationOption) => {
        if (option === 'applyAll') {
            // Если выбрано "Все вышеперечисленное", то включаем/выключаем все остальные
            const newValue = !options.applyAll;
            setOptions({
                removeTrimSpaces: newValue,
                addNeededSpaces: newValue,
                replaceMultipleSpaces: newValue,
                fixCapitalization: newValue,
                createParagraphs: newValue,
                applyAll: newValue
            });
        } else {
            // Для остальных опций просто переключаем состояние
            const newOptions = {
                ...options,
                [option]: !options[option]
            };
            
            // Проверяем, все ли опции (кроме 'applyAll') активны
            const allOptionsExceptAll = Object.entries(newOptions)
                .filter(([key]) => key !== 'applyAll')
                .every(([, value]) => value === true);
            
            // Если все опции активны, то активируем и "Все вышеперечисленное"
            newOptions.applyAll = allOptionsExceptAll;
            
            setOptions(newOptions);
        }
    };    // Подсчет строк
    const inputLines = inputText.trim() ? inputText.split('\n').length : 0;
    const resultLines = result.trim() ? result.split('\n').length : 0;

    return (
        <div className="text-optimizer-tool">
            {/* Header-остров инструмента */}
            <div className="tool-header-island">
                <Link to={createLink('')} className="back-button">
                    <img src="/icons/arrow_left.svg" alt="" />
                    {t('textOptimizer.allTools')}
                </Link>
                <h1 className="tool-title">{t('textOptimizer.title')}</h1>
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
                        placeholder={t('textOptimizer.inputPlaceholder')}
                        value={inputText}
                        onChange={(e) => setInputText(e.target.value)}
                    />
                    <div className="input-controls">
                        <button className="paste-button" onClick={handlePaste}>
                            <img src="/icons/button_paste.svg" alt="" />
                            {t('textOptimizer.buttons.paste')}
                        </button>
                        <span className="info">{inputLines} {t('textOptimizer.lineCount')}</span>
                    </div>
                </div>

                {/* Правая часть - настройки */}
                <div className="settings-section">
                    <div className="settings-group">
                        <label className="checkbox-item">
                            <input
                                type="checkbox"
                                checked={options.removeTrimSpaces}
                                onChange={() => handleOptionChange('removeTrimSpaces')}
                            />
                            <span className="checkbox-text">{t('textOptimizer.options.removeTrimSpaces')}</span>
                        </label>

                        <label className="checkbox-item">
                            <input
                                type="checkbox"
                                checked={options.addNeededSpaces}
                                onChange={() => handleOptionChange('addNeededSpaces')}
                            />
                            <span className="checkbox-text">{t('textOptimizer.options.addNeededSpaces')}</span>
                        </label>

                        <label className="checkbox-item">
                            <input
                                type="checkbox"
                                checked={options.replaceMultipleSpaces}
                                onChange={() => handleOptionChange('replaceMultipleSpaces')}
                            />
                            <span className="checkbox-text">{t('textOptimizer.options.replaceMultipleSpaces')}</span>
                        </label>

                        <label className="checkbox-item">
                            <input
                                type="checkbox"
                                checked={options.fixCapitalization}
                                onChange={() => handleOptionChange('fixCapitalization')}
                            />
                            <span className="checkbox-text">{t('textOptimizer.options.fixCapitalization')}</span>
                        </label>

                        <label className="checkbox-item">
                            <input
                                type="checkbox"
                                checked={options.createParagraphs}
                                onChange={() => handleOptionChange('createParagraphs')}
                            />
                            <span className="checkbox-text">{t('textOptimizer.options.createParagraphs')}</span>
                        </label>

                        <label className="checkbox-item">
                            <input
                                type="checkbox"
                                checked={options.applyAll}
                                onChange={() => handleOptionChange('applyAll')}
                            />
                            <span className="checkbox-text">{t('textOptimizer.options.applyAll')}</span>
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
                    disabled={!inputText.trim() || (!Object.values(options).some(Boolean))}
                >
                    {t('textOptimizer.buttons.showResult')}
                </button>
                
                <button 
                    className="action-btn secondary icon-left" 
                    style={{ width: '445px' }} 
                    onClick={handleCopy}
                    disabled={!result}
                >
                    <img src="/icons/button_copy.svg" alt="" />
                    {copied ? t('textOptimizer.buttons.copied') : t('textOptimizer.buttons.copy')}
                </button>
            </div>

            {/* Поле результата */}
            <div className="result-section">
                <textarea
                    className="result-textarea"
                    placeholder={t('textOptimizer.resultPlaceholder')}
                    value={result}
                    readOnly
                />
                <div className="result-controls">
                    <span className="result-counter">{resultLines} {t('textOptimizer.lineCount')}</span>
                </div>
            </div>

            {/* SEO блоки */}
            <div className="seo-section">
                <div className="seo-blocks">
                    <div className="seo-block">
                        <h2>{t('textOptimizer.seo.whatIsTextOptimizer')}</h2>
                        <p>{t('textOptimizer.seo.whatIsTextOptimizerContent')}</p>
                    </div>

                    <div className="seo-block">
                        <h2>{t('textOptimizer.seo.whyNeeded')}</h2>
                        <p>{t('textOptimizer.seo.whyNeededContent')}</p>
                    </div>

                    <div className="seo-block">
                        <h2>{t('textOptimizer.seo.howItWorks')}</h2>
                        <p>{t('textOptimizer.seo.howItWorksContent')}</p>
                    </div>

                    <div className="seo-block">
                        <h2>{t('textOptimizer.seo.whatTexts')}</h2>
                        <p>{t('textOptimizer.seo.whatTextsContent')}</p>
                    </div>

                    <div className="seo-block">
                        <h2>{t('textOptimizer.seo.forSpecialists')}</h2>
                        <p>{t('textOptimizer.seo.forSpecialistsContent')}</p>
                    </div>

                    <div className="seo-block">
                        <h2>{t('textOptimizer.seo.howToUse')}</h2>
                        <p>{t('textOptimizer.seo.howToUseContent')}</p>
                    </div>
                </div>
            </div>

            {/* Модальные окна для авторизации */}
            <AuthRequiredModal
                isOpen={isAuthRequiredModalOpen}
                onClose={closeAuthRequiredModal}
                onLoginClick={openAuthModal}
            />

            <AuthModal
                isOpen={isAuthModalOpen}
                onClose={closeAuthModal}
                initialMode="login"
            />
        </div>
    );
};

export default TextOptimizerTool;
