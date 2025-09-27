import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useLocalizedLink } from '../hooks/useLanguageFromUrl';
import '../styles/tool-pages.css';
import { useAuthRequired } from '../hooks/useAuthRequired';
import { useToolWithCoins } from '../hooks/useToolWithCoins';
import AuthRequiredModal from '../components/AuthRequiredModal';
import AuthModal from '../components/AuthModal';
import './MatchTypesTool.css';


const TOOL_ID = 'match-types';
type MatchType = 'broad' | 'phrase' | 'exact';
type CaseType = 'lowercase' | 'uppercase' | 'capitalize-first' | '';

const MatchTypesTool: React.FC = () => {
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
    const [outputText, setOutputText] = useState('');
    const [matchType, setMatchType] = useState<MatchType>('broad'); // По умолчанию "Широкое соответствие"
    const [caseType, setCaseType] = useState<CaseType>(''); // По умолчанию без изменения регистра
    const [copied, setCopied] = useState(false);
    const [launchCount, setLaunchCount] = useState(0);

    // Загрузка статистики запусков при монтировании
    useEffect(() => {
        const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:8880';
        fetch(`${API_BASE}/api/stats/launch-count/${TOOL_ID}`)
            .then(res => res.json())
            .then(data => setLaunchCount(data.count))
            .catch(err => console.error('Ошибка загрузки счетчика:', err));
    }, []);

    // Очистка результатов при изменении входных данных или настроек
    useEffect(() => {
        setOutputText('');
        setCopied(false);
    }, [inputText, matchType, caseType]);

    // Вставка из буфера
    const handlePaste = async () => {
        try {
            const text = await navigator.clipboard.readText();
            setInputText(text);
        } catch (err) {
            console.error('Ошибка при вставке:', err);
        }
    };

    // Функция обработки типов соответствия
    const handleShowResult = async () => {
        // Проверяем авторизацию перед выполнением
        if (!requireAuth()) {
            return; // Если пользователь не авторизован, показываем модальное окно и прерываем выполнение

        }


        if (!inputText.trim()) {
            setOutputText('');
            return;
        }
        // Оптимистично обновляем счетчик сразу
        setLaunchCount(prev => prev + 1);

        // Выполняем операцию с тратой коинов
        const result = await executeWithCoins(async () => {

        // Разделяем на строки и фильтруем пустые
        const lines = inputText.trim().split('\n').filter(line => line.trim());
        
        const processedLines = lines.map(line => {
            let trimmedLine = line.trim();
            let result = '';

            switch (matchType) {
                case 'broad':
                    // Широкое соответствие - удаляем спецсимволы и знаки пунктуации, оставляем буквы, цифры и пробелы
                    result = trimmedLine.replace(/[^\p{L}\p{N}\s]/gu, '').replace(/\s+/g, ' ').trim();
                    break;
                
                case 'phrase':
                    // Фразовое соответствие - удаляем спецсимволы, затем добавляем кавычки
                    const cleanPhrase = trimmedLine.replace(/[^\p{L}\p{N}\s]/gu, '').replace(/\s+/g, ' ').trim();
                    result = `"${cleanPhrase}"`;
                    break;
                
                case 'exact':
                    // Точное соответствие - удаляем спецсимволы, затем добавляем квадратные скобки
                    const cleanExact = trimmedLine.replace(/[^\p{L}\p{N}\s]/gu, '').replace(/\s+/g, ' ').trim();
                    result = `[${cleanExact}]`;
                    break;
                
                default:
                    result = trimmedLine;
                    break;
            }

            // Применяем изменение регистра с учетом специальных символов
            return applyCaseChangeToContent(result, caseType);
        });

            setOutputText(processedLines.join('\n'));
            
            return {
                processedLines: processedLines.join('\n'),
                inputLength: inputText ? inputText.length : 0
            };
        }, {
            inputLength: inputText ? inputText.length : 0
        });

        // Если операция не удалась, откатываем счетчик
        if (!result) {
            setLaunchCount(prev => prev - 1);
        }
    };

    // Функция копирования результата
    const handleCopyResult = async () => {
        if (!outputText.trim()) return;
        
        try {
            await navigator.clipboard.writeText(outputText);
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
        } catch (err) {
            console.error('Ошибка при копировании:', err);
        }
    };

    // Обработчик радиокнопок БЕЗ возможности снятия выбора (для типа соответствия)
    const handleMatchTypeChange = (value: MatchType) => {
        setMatchType(value);
    };

    // Обработчик радиокнопок С возможностью снятия выбора (для регистра)
    const handleCaseTypeChange = (value: CaseType) => {
        setCaseType(currentValue => currentValue === value ? '' : value);
    };

    // Применение изменения регистра
    const applyCaseChange = (text: string, caseOption: CaseType): string => {
        if (!caseOption) return text;

        switch (caseOption) {
            case 'lowercase':
                return text.toLowerCase();
            case 'uppercase':
                return text.toUpperCase();
            case 'capitalize-first':
                return text.length > 0 ? text.charAt(0).toUpperCase() + text.slice(1).toLowerCase() : text;
            default:
                return text;
        }
    };

    // Применение изменения регистра с учетом специальных символов (скобки, кавычки)
    const applyCaseChangeToContent = (result: string, caseOption: CaseType): string => {
        if (!caseOption) return result;

        // Проверяем, есть ли квадратные скобки
        if (result.startsWith('[') && result.endsWith(']')) {
            const content = result.slice(1, -1); // Извлекаем содержимое без скобок
            const processedContent = applyCaseChange(content, caseOption);
            return `[${processedContent}]`;
        }
        
        // Проверяем, есть ли кавычки
        if (result.startsWith('"') && result.endsWith('"')) {
            const content = result.slice(1, -1); // Извлекаем содержимое без кавычек
            const processedContent = applyCaseChange(content, caseOption);
            return `"${processedContent}"`;
        }
        
        // Если нет специальных символов, применяем к всему тексту
        return applyCaseChange(result, caseOption);
    };

    // Подсчет строк
    const countLines = (text: string): number => {
        if (!text.trim()) return 0;
        return text.trim().split('\n').length;
    };

    return (
        <div className="match-types-tool">
            {/* Header-остров инструмента */}
            <div className="tool-header-island">
                <Link to={createLink('')} className="back-button">
                    <img src="/icons/arrow_left.svg" alt="" />
                    {t('matchTypes.allTools')}
                </Link>
                <h1 className="tool-title">{t('matchTypes.title')}</h1>
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
                        placeholder={t('matchTypes.inputPlaceholder')}
                        value={inputText}
                        onChange={(e) => setInputText(e.target.value)}
                    />
                    <div className="input-controls">
                        <button className="paste-button" onClick={handlePaste}>
                            <img src="/icons/button_paste.svg" alt="" />
                            {t('matchTypes.buttons.paste')}
                        </button>
                        <span className="info">{countLines(inputText)} {t('matchTypes.lineCount')}</span>
                    </div>
                </div>

                {/* Правая часть - настройки */}
                <div className="settings-section">
                    <div className="settings-group">
                        <label className="radio-item">
                            <input
                                type="radio"
                                name="match-type"
                                value="broad"
                                checked={matchType === 'broad'}
                                onChange={() => handleMatchTypeChange('broad')}
                            />
                            <span className="radio-text">{t('matchTypes.matchTypes.broad')}</span>
                        </label>

                        <label className="radio-item">
                            <input
                                type="radio"
                                name="match-type"
                                value="phrase"
                                checked={matchType === 'phrase'}
                                onChange={() => handleMatchTypeChange('phrase')}
                            />
                            <span className="radio-text">{t('matchTypes.matchTypes.phrase')}</span>
                        </label>

                        <label className="radio-item">
                            <input
                                type="radio"
                                name="match-type"
                                value="exact"
                                checked={matchType === 'exact'}
                                onChange={() => handleMatchTypeChange('exact')}
                            />
                            <span className="radio-text">{t('matchTypes.matchTypes.exact')}</span>
                        </label>
                    </div>

                    {/* Вторая группа настроек - регистр */}
                    <div className="settings-group">
                        <label className="radio-item">
                            <input
                                type="radio"
                                name="case-type"
                                value="lowercase"
                                checked={caseType === 'lowercase'}
                                onChange={() => {}} // Пустой onChange для валидности
                                onClick={() => handleCaseTypeChange('lowercase')}
                            />
                            <span className="radio-text">{t('matchTypes.caseTypes.lowercase')}</span>
                        </label>

                        <label className="radio-item">
                            <input
                                type="radio"
                                name="case-type"
                                value="uppercase"
                                checked={caseType === 'uppercase'}
                                onChange={() => {}} // Пустой onChange для валидности
                                onClick={() => handleCaseTypeChange('uppercase')}
                            />
                            <span className="radio-text">{t('matchTypes.caseTypes.uppercase')}</span>
                        </label>

                        <label className="radio-item">
                            <input
                                type="radio"
                                name="case-type"
                                value="capitalize-first"
                                checked={caseType === 'capitalize-first'}
                                onChange={() => {}} // Пустой onChange для валидности
                                onClick={() => handleCaseTypeChange('capitalize-first')}
                            />
                            <span className="radio-text">{t('matchTypes.caseTypes.capitalizeFirst')}</span>
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
                    {t('matchTypes.buttons.showResult')}
                </button>
                
                <button 
                    className="action-btn secondary icon-left" 
                    style={{ width: '445px' }} 
                    onClick={handleCopyResult}
                    disabled={!outputText.trim()}
                >
                    <img src="/icons/button_copy.svg" alt="" />
                    {copied ? t('matchTypes.buttons.copied') : t('matchTypes.buttons.copyResult')}
                </button>
            </div>

            {/* Поле результата */}
            <div className="result-section">
                <textarea
                    className="result-textarea"
                    value={outputText}
                    readOnly
                    placeholder={t('matchTypes.resultPlaceholder')}
                />
                <div className="result-controls">
                    <span className="result-counter">{countLines(outputText)} {t('matchTypes.lineCount')}</span>
                </div>
            </div>

            {/* SEO секция */}
            <div className="seo-section">
                <div className="seo-content">
                    <div className="seo-item">
                        <h2>{t('matchTypes.seo.whatAreMatchTypes.title')}</h2>
                        <p>{t('matchTypes.seo.whatAreMatchTypes.text')}</p>
                    </div>
                    
                    <div className="seo-item">
                        <h2>{t('matchTypes.seo.whyNeeded.title')}</h2>
                        <p>{t('matchTypes.seo.whyNeeded.text')}</p>
                    </div>
                    
                    <div className="seo-item">
                        <h2>{t('matchTypes.seo.howItWorks.title')}</h2>
                        <p>{t('matchTypes.seo.howItWorks.text')}</p>
                    </div>
                    
                    <div className="seo-item">
                        <h2>{t('matchTypes.seo.whatKeywords.title')}</h2>
                        <p>{t('matchTypes.seo.whatKeywords.text')}</p>
                    </div>
                    
                    <div className="seo-item">
                        <h2>{t('matchTypes.seo.forSpecialists.title')}</h2>
                        <p>{t('matchTypes.seo.forSpecialists.text')}</p>
                    </div>
                    
                    <div className="seo-item">
                        <h2>{t('matchTypes.seo.howToUse.title')}</h2>
                        <p>{t('matchTypes.seo.howToUse.text')}</p>
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

export default MatchTypesTool;