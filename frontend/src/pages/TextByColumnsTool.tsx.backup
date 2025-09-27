import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { statsService } from '../utils/statsService';
import { useLocalizedLink } from '../hooks/useLanguageFromUrl';
import '../styles/tool-pages.css';
import { useAuthRequired } from '../hooks/useAuthRequired';
import AuthRequiredModal from '../components/AuthRequiredModal';
import AuthModal from '../components/AuthModal';
import './TextByColumnsTool.css';


const TOOL_ID = 'text-by-columns';
const TextByColumnsTool: React.FC = () => {
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
    const [copied, setCopied] = useState<boolean[]>([false, false, false, false, false, false]);
    const [launchCount, setLaunchCount] = useState(0);
    
    // Состояние для выбора разделителя
    const [separator, setSeparator] = useState('semicolon'); // по умолчанию точка с запятой
    const [customSeparator, setCustomSeparator] = useState('');
    const [exceptions, setExceptions] = useState('');
    
    // Результаты для 6 колонок
    const [columns, setColumns] = useState<string[]>(['', '', '', '', '', '']);

    // Загрузка статистики запусков при монтировании
    useEffect(() => {
        statsService.getLaunchCount(TOOL_ID).then(setLaunchCount);
    }, []);

    // Очистка результата при изменении входных данных или настроек
    useEffect(() => {
        setColumns(['', '', '', '', '', '']);
        setCopied([false, false, false, false, false, false]);
    }, [inputText, separator, customSeparator, exceptions]);

    // Вставка из буфера
    const handlePaste = async () => {
        try {
            const text = await navigator.clipboard.readText();
            setInputText(text);
        } catch (err) {
            console.error('Ошибка при вставке:', err);
        }
    };

    // Обработчик радио-кнопок с возможностью снятия выбора
    const handleRadioClick = (currentValue: string, setValue: (value: string) => void, clickedValue: string) => {
        if (currentValue === clickedValue) {
            setValue(''); // Снимаем выбор если кликнули по уже выбранной радиокнопке
        } else {
            setValue(clickedValue); // Устанавливаем новое значение
        }
    };

    // Функция переноса готовых слов в поле исключений
    const handleTransferWords = () => {
        const currentExceptions = exceptions.trim();
        const presetWords = t('textByColumns.exceptions.presetWords');
        
        if (currentExceptions === '') {
            setExceptions(presetWords);
        } else {
            // Если уже есть исключения, добавляем новые через перенос строки
            setExceptions(currentExceptions + '\n' + presetWords);
        }
    };

    // Функция разбивки текста по столбцам
    const handleShowResult = async () => {
        // Проверяем авторизацию перед выполнением
        if (!requireAuth()) {
            return; // Если пользователь не авторизован, показываем модальное окно и прерываем выполнение

        }


        if (!inputText.trim()) {
            setColumns(['', '', '', '', '', '']);
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

        // Определяем символ разделителя
        let separatorStr = '';
        switch (separator) {
            case 'semicolon':
                separatorStr = ';';
                break;
            case 'comma':
                separatorStr = ',';
                break;
            case 'dot':
                separatorStr = '.';
                break;
            case 'space':
                separatorStr = ' ';
                break;
            case 'other':
                separatorStr = customSeparator;
                break;
            default:
                separatorStr = ';';
        }

        if (!separatorStr) {
            setColumns(['', '', '', '', '', '']);
            return;
        }

        // Разбиваем каждую строку на части и распределяем по колонкам
        const lines = inputText.split('\n').filter(line => line.trim() !== '');
        const newColumns: string[] = ['', '', '', '', '', ''];

        // Получаем список исключений (текст/символы, при наличии которых строка не разделяется)
        const exceptionList = exceptions
            .split(/[\n,]/)
            .map(item => item.trim())
            .filter(item => item.length > 0);

        lines.forEach(line => {
            // Проверяем, содержит ли строка какое-либо исключение
            const hasException = exceptionList.some(exception => 
                line.toLowerCase().includes(exception.toLowerCase())
            );

            if (hasException) {
                // Если строка содержит исключение, пропускаем её (не обрабатываем)
                return;
            } else {
                // Если исключений нет, разделяем строку по разделителю
                const parts = line.split(separatorStr).map(part => part.trim()).filter(part => part !== '');
                
                // Распределяем части по колонкам (максимум 6)
                parts.forEach((part, index) => {
                    if (index < 6) {
                        if (newColumns[index]) {
                            newColumns[index] += '\n' + part;
                        } else {
                            newColumns[index] = part;
                        }
                    }
                });
            }
        });

        setColumns(newColumns);
    };

    // Функция копирования для конкретной колонки
    const handleCopy = async (columnIndex: number) => {
        if (!columns[columnIndex]) return;
        
        try {
            await navigator.clipboard.writeText(columns[columnIndex]);
            const newCopied = [...copied];
            newCopied[columnIndex] = true;
            setCopied(newCopied);
            setTimeout(() => {
                const resetCopied = [...newCopied];
                resetCopied[columnIndex] = false;
                setCopied(resetCopied);
            }, 2000);
        } catch (err) {
            console.error('Ошибка при копировании:', err);
        }
    };

    // Подсчет строк в колонках
    const getColumnLines = (columnIndex: number) => {
        return columns[columnIndex] ? columns[columnIndex].split('\n').length : 0;
    };

    // Подсчет строк входного текста
    const inputLines = inputText.trim() ? inputText.split('\n').length : 0;

    return (
        <div className="text-by-columns-tool">
            {/* Header-остров инструмента */}
            <div className="tool-header-island">
                <Link to={createLink('')} className="back-button">
                    <img src="/icons/arrow_left.svg" alt="" />
                    {t('textByColumns.allTools')}
                </Link>
                <h1 className="tool-title">{t('textByColumns.title')}</h1>
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
                        placeholder={t('textByColumns.inputPlaceholder')}
                        value={inputText}
                        onChange={(e) => setInputText(e.target.value)}
                    />
                    <div className="input-controls">
                        <button className="paste-button" onClick={handlePaste}>
                            <img src="/icons/button_paste.svg" alt="" />
                            {t('textByColumns.buttons.paste')}
                        </button>
                        <span className="info">{inputLines} {t('textByColumns.lineCount')}</span>
                    </div>
                </div>

                {/* Правая часть - настройки */}
                <div className="settings-section">
                    {/* Разделитель */}
                    <div className="settings-group">
                        <div className="connector-label">{t('textByColumns.separator.label')}</div>
                        
                        <div className="radio-options">
                            <label className="radio-item">
                                <input
                                    type="radio"
                                    name="separator"
                                    checked={separator === 'semicolon'}
                                    onChange={() => handleRadioClick(separator, setSeparator, 'semicolon')}
                                />
                                <span className="radio-text">{t('textByColumns.separator.semicolon')}</span>
                            </label>

                            <label className="radio-item">
                                <input
                                    type="radio"
                                    name="separator"
                                    checked={separator === 'comma'}
                                    onChange={() => handleRadioClick(separator, setSeparator, 'comma')}
                                />
                                <span className="radio-text">{t('textByColumns.separator.comma')}</span>
                            </label>

                            <label className="radio-item">
                                <input
                                    type="radio"
                                    name="separator"
                                    checked={separator === 'dot'}
                                    onChange={() => handleRadioClick(separator, setSeparator, 'dot')}
                                />
                                <span className="radio-text">{t('textByColumns.separator.dot')}</span>
                            </label>

                            <label className="radio-item">
                                <input
                                    type="radio"
                                    name="separator"
                                    checked={separator === 'space'}
                                    onChange={() => handleRadioClick(separator, setSeparator, 'space')}
                                />
                                <span className="radio-text">{t('textByColumns.separator.space')}</span>
                            </label>
                        </div>
                    </div>

                    {/* Другой разделитель */}
                    <div className="settings-group">
                        <div className="custom-input-wrapper">
                            <label className="radio-item">
                                <input
                                    type="radio"
                                    name="separator"
                                    checked={separator === 'other'}
                                    onChange={() => handleRadioClick(separator, setSeparator, 'other')}
                                />
                                <span className="radio-text">{t('textByColumns.separator.other')}</span>
                            </label>
                            <input
                                type="text"
                                className="custom-input"
                                placeholder={t('textByColumns.separator.customPlaceholder')}
                                value={customSeparator}
                                onChange={(e) => setCustomSeparator(e.target.value)}
                                onFocus={() => setSeparator('other')}
                                onClick={() => setSeparator('other')}
                            />
                        </div>
                    </div>

                    {/* Блок исключений (вынесен из settings-group) */}
                    <div className="exceptions-block">
                        <div className="exceptions-fields">
                            <div className="exceptions-left">
                                <textarea
                                    className="exceptions-textarea"
                                    placeholder={t('textByColumns.exceptions.placeholder')}
                                    value={exceptions}
                                    onChange={(e) => setExceptions(e.target.value)}
                                    rows={4}
                                />
                            </div>
                            <div className="exceptions-right">
                                <textarea
                                    className="exceptions-textarea preset-words"
                                    value={t('textByColumns.exceptions.presetWords')}
                                    readOnly
                                    rows={4}
                                />
                                <button className="transfer-button" onClick={handleTransferWords}>
                                    <img src="/icons/arrow_left.svg" alt="" />
                                    {t('textByColumns.buttons.transfer')}
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Кнопка управления */}
            <div className="control-buttons">
                <button 
                    className="action-btn primary" 
                    onClick={handleShowResult}
                >
                    {t('textByColumns.buttons.showResult')}
                </button>
            </div>

            {/* Секция результатов - 6 колонок */}
            <div className="results-section">
                <div className="results-grid">
                    {columns.map((column, index) => (
                        <div key={index} className="result-column">
                            <div className="result-field">
                                <textarea
                                    className="result-textarea"
                                    placeholder={t('textByColumns.results.columnPlaceholder', { number: index + 1 })}
                                    value={column}
                                    readOnly
                                />
                                <div className="result-controls">
                                    <span className="result-counter">{getColumnLines(index)} {t('textByColumns.lineCount')}</span>
                                </div>
                            </div>
                            <button 
                                className="copy-btn-icon" 
                                onClick={() => handleCopy(index)}
                                disabled={!column}
                                title={t('textByColumns.buttons.copy')}
                            >
                                <img src="/icons/button_copy.svg" alt={t('textByColumns.buttons.copy')} />
                            </button>
                        </div>
                    ))}
                </div>
            </div>

            {/* SEO секция */}
            <div className="seo-section">
                <div className="seo-content">
                    <div className="seo-item">
                        <h2>{t('textByColumns.seo.whatIsTextByColumns.title')}</h2>
                        <p>{t('textByColumns.seo.whatIsTextByColumns.text')}</p>
                    </div>
                    
                    <div className="seo-item">
                        <h2>{t('textByColumns.seo.whyNeeded.title')}</h2>
                        <p>{t('textByColumns.seo.whyNeeded.text')}</p>
                    </div>
                    
                    <div className="seo-item">
                        <h2>{t('textByColumns.seo.howItWorks.title')}</h2>
                        <p>{t('textByColumns.seo.howItWorks.text')}</p>
                    </div>
                    
                    <div className="seo-item">
                        <h2>{t('textByColumns.seo.whatTexts.title')}</h2>
                        <p>{t('textByColumns.seo.whatTexts.text')}</p>
                    </div>
                    
                    <div className="seo-item">
                        <h2>{t('textByColumns.seo.forSpecialists.title')}</h2>
                        <p>{t('textByColumns.seo.forSpecialists.text')}</p>
                    </div>
                    
                    <div className="seo-item">
                        <h2>{t('textByColumns.seo.howToUse.title')}</h2>
                        <p>{t('textByColumns.seo.howToUse.text')}</p>
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

export default TextByColumnsTool;