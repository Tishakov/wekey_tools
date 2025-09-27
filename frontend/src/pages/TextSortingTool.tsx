import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { statsService } from '../utils/statsService';
import { useLocalizedLink } from '../hooks/useLanguageFromUrl';
import '../styles/tool-pages.css';
import { useAuthRequired } from '../hooks/useAuthRequired';
import { useToolWithCoins } from '../hooks/useToolWithCoins';
import AuthRequiredModal from '../components/AuthRequiredModal';
import AuthModal from '../components/AuthModal';
import './TextSortingTool.css';


const TOOL_ID = 'text-sorting';
const TextSortingTool: React.FC = () => {
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
    const { executeWithCoins } = useToolWithCoins(TOOL_ID);
    const [inputText, setInputText] = useState('');
    const [result, setResult] = useState('');
    const [copied, setCopied] = useState(false);
    const [launchCount, setLaunchCount] = useState(0);
    
    // Состояние для радио-кнопок сортировки
    const [sortOption, setSortOption] = useState('');

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
    }, [inputText, sortOption]);

    // Статистика теперь обновляется через executeWithCoins

    // Функция сортировки по алфавиту (А-Я)
    const sortAlphabeticallyAsc = (lines: string[]): string[] => {
        return [...lines].sort((a, b) => a.localeCompare(b, 'ru'));
    };

    // Функция сортировки по алфавиту (Я-А)
    const sortAlphabeticallyDesc = (lines: string[]): string[] => {
        return [...lines].sort((a, b) => b.localeCompare(a, 'ru'));
    };

    // Функция сортировки по количеству символов (больше-меньше)
    const sortByLengthDesc = (lines: string[]): string[] => {
        return [...lines].sort((a, b) => b.length - a.length);
    };

    // Функция сортировки по количеству символов (меньше-больше)
    const sortByLengthAsc = (lines: string[]): string[] => {
        return [...lines].sort((a, b) => a.length - b.length);
    };

    // Функция подсчета слов в строке
    const countWords = (line: string): number => {
        return line.trim().split(/\s+/).filter(word => word.length > 0).length;
    };

    // Функция сортировки по количеству слов (больше-меньше)
    const sortByWordsDesc = (lines: string[]): string[] => {
        return [...lines].sort((a, b) => countWords(b) - countWords(a));
    };

    // Функция сортировки по количеству слов (меньше-больше)
    const sortByWordsAsc = (lines: string[]): string[] => {
        return [...lines].sort((a, b) => countWords(a) - countWords(b));
    };

    // Основная функция сортировки текста
    const sortText = (text: string): string => {
        if (!text.trim()) return '';

        // Разбиваем на строки и фильтруем пустые
        const lines = text.split('\n').filter(line => line.trim().length > 0);

        switch (sortOption) {
            case 'alphabetical-asc':
                return sortAlphabeticallyAsc(lines).join('\n');
            case 'alphabetical-desc':
                return sortAlphabeticallyDesc(lines).join('\n');
            case 'length-desc':
                return sortByLengthDesc(lines).join('\n');
            case 'length-asc':
                return sortByLengthAsc(lines).join('\n');
            case 'words-desc':
                return sortByWordsDesc(lines).join('\n');
            case 'words-asc':
                return sortByWordsAsc(lines).join('\n');
            default:
                return lines.join('\n'); // Если ничего не выбрано, возвращаем отфильтрованный текст
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
    const handleShowResult = async () => {
        // Проверяем авторизацию перед выполнением
        if (!requireAuth()) {
            return; // Если пользователь не авторизован, показываем модальное окно и прерываем выполнение
        }

        // Выполняем операцию с тратой коинов
        const executeResult = await executeWithCoins(async () => {
            const sortedText = sortText(inputText);
            setResult(sortedText);
            return sortedText;
        }, {
            inputLength: inputText.length
        });
        
        // Обновляем счетчик из результата executeWithCoins
        if (executeResult.success && executeResult.newLaunchCount !== undefined) {
            setLaunchCount(executeResult.newLaunchCount);
        }
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
        <div className="text-sorting-tool">
            {/* Header-остров инструмента */}
            <div className="tool-header-island">
                <Link to={createLink('')} className="back-button">
                    <img src="/icons/arrow_left.svg" alt="" />
                    {t('textSorting.allTools')}
                </Link>
                <h1 className="tool-title">{t('textSorting.title')}</h1>
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
                        placeholder={t('textSorting.inputPlaceholder')}
                        value={inputText}
                        onChange={(e) => setInputText(e.target.value)}
                    />
                    <div className="input-controls">
                        <button className="paste-button" onClick={handlePaste}>
                            <img src="/icons/button_paste.svg" alt="" />
                            {t('textSorting.buttons.paste')}
                        </button>
                        <span className="info">{inputLines} {t('textSorting.lineCount')}</span>
                    </div>
                </div>

                {/* Правая часть - настройки */}
                <div className="settings-section">
                    <div className="settings-group">
                        <label className="radio-item">
                            <input
                                type="radio"
                                name="sortOption"
                                value="alphabetical-asc"
                                checked={sortOption === 'alphabetical-asc'}
                                onClick={() => handleRadioClick(sortOption, setSortOption, 'alphabetical-asc')}
                                onChange={() => {}} // Пустой onChange чтобы React не ругался
                            />
                            <span className="checkbox-text">{t('textSorting.options.alphabeticalAsc')}</span>
                        </label>

                        <label className="radio-item">
                            <input
                                type="radio"
                                name="sortOption"
                                value="alphabetical-desc"
                                checked={sortOption === 'alphabetical-desc'}
                                onClick={() => handleRadioClick(sortOption, setSortOption, 'alphabetical-desc')}
                                onChange={() => {}} // Пустой onChange чтобы React не ругался
                            />
                            <span className="checkbox-text">{t('textSorting.options.alphabeticalDesc')}</span>
                        </label>

                        <label className="radio-item">
                            <input
                                type="radio"
                                name="sortOption"
                                value="length-desc"
                                checked={sortOption === 'length-desc'}
                                onClick={() => handleRadioClick(sortOption, setSortOption, 'length-desc')}
                                onChange={() => {}} // Пустой onChange чтобы React не ругался
                            />
                            <span className="checkbox-text">{t('textSorting.options.lengthDesc')}</span>
                        </label>

                        <label className="radio-item">
                            <input
                                type="radio"
                                name="sortOption"
                                value="length-asc"
                                checked={sortOption === 'length-asc'}
                                onClick={() => handleRadioClick(sortOption, setSortOption, 'length-asc')}
                                onChange={() => {}} // Пустой onChange чтобы React не ругался
                            />
                            <span className="checkbox-text">{t('textSorting.options.lengthAsc')}</span>
                        </label>

                        <label className="radio-item">
                            <input
                                type="radio"
                                name="sortOption"
                                value="words-desc"
                                checked={sortOption === 'words-desc'}
                                onClick={() => handleRadioClick(sortOption, setSortOption, 'words-desc')}
                                onChange={() => {}} // Пустой onChange чтобы React не ругался
                            />
                            <span className="checkbox-text">{t('textSorting.options.wordsDesc')}</span>
                        </label>

                        <label className="radio-item">
                            <input
                                type="radio"
                                name="sortOption"
                                value="words-asc"
                                checked={sortOption === 'words-asc'}
                                onClick={() => handleRadioClick(sortOption, setSortOption, 'words-asc')}
                                onChange={() => {}} // Пустой onChange чтобы React не ругался
                            />
                            <span className="checkbox-text">{t('textSorting.options.wordsAsc')}</span>
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
                    disabled={!inputText.trim() || !sortOption}
                >
                    {t('textSorting.buttons.showResult')}
                </button>
                
                <button 
                    className="action-btn secondary icon-left" 
                    style={{ width: '445px' }} 
                    onClick={handleCopy}
                    disabled={!result}
                >
                    <img src="/icons/button_copy.svg" alt="" />
                    {copied ? t('textSorting.buttons.copied') : t('textSorting.buttons.copy')}
                </button>
            </div>

            {/* Поле результата */}
            <div className="result-section">
                <textarea
                    className="result-textarea"
                    placeholder={t('textSorting.resultPlaceholder')}
                    value={result}
                    readOnly
                />
                <div className="result-controls">
                    <span className="result-counter">{resultLines} {t('textSorting.lineCount')}</span>
                </div>
            </div>

            {/* SEO блоки */}
            <div className="seo-section">
                <div className="seo-blocks">
                    <div className="seo-block">
                        <h2>{t('textSorting.seo.whatIsTextSorting')}</h2>
                        <p>{t('textSorting.seo.whatIsTextSortingContent')}</p>
                    </div>

                    <div className="seo-block">
                        <h2>{t('textSorting.seo.whyNeeded')}</h2>
                        <p>{t('textSorting.seo.whyNeededContent')}</p>
                    </div>

                    <div className="seo-block">
                        <h2>{t('textSorting.seo.howItWorks')}</h2>
                        <p>{t('textSorting.seo.howItWorksContent')}</p>
                    </div>

                    <div className="seo-block">
                        <h2>{t('textSorting.seo.whatTexts')}</h2>
                        <p>{t('textSorting.seo.whatTextsContent')}</p>
                    </div>

                    <div className="seo-block">
                        <h2>{t('textSorting.seo.forSpecialists')}</h2>
                        <p>{t('textSorting.seo.forSpecialistsContent')}</p>
                    </div>

                    <div className="seo-block">
                        <h2>{t('textSorting.seo.howToUse')}</h2>
                        <p>{t('textSorting.seo.howToUseContent')}</p>
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

export default TextSortingTool;