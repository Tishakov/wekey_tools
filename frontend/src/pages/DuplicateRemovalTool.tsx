import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { statsService } from '../utils/statsService';
import { useLocalizedLink } from '../hooks/useLanguageFromUrl';
import { useAuthRequired } from '../hooks/useAuthRequired';
import AuthRequiredModal from '../components/AuthRequiredModal';
import AuthModal from '../components/AuthModal';
import SEOHead from '../components/SEOHead';
import '../styles/tool-pages.css';
import './DuplicateRemovalTool.css';


const TOOL_ID = 'remove-duplicates';
type DuplicateMode = 'remove-duplicates' | 'remove-all-duplicates' | 'remove-unique';

const DuplicateRemovalTool: React.FC = () => {
    const { t } = useTranslation();
    const { createLink } = useLocalizedLink();
    
    // Auth Required Hook
    const {
        isAuthRequiredModalOpen,
        isAuthModalOpen,
        requireAuth,
        closeAuthRequiredModal,
        closeAuthModal,
        openAuthModal
    } = useAuthRequired();
    
    const [inputText, setInputText] = useState('');
    const [mode, setMode] = useState<DuplicateMode>('remove-duplicates');
    const [result, setResult] = useState('');
    const [copied, setCopied] = useState(false);

    const [launchCount, setLaunchCount] = useState(0);

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

    // Функция для удаления дубликатов (оставить уникальные)
    const removeDuplicates = (text: string): string => {
        if (!text.trim()) return '';
        
        const lines = text.split('\n');
        const seen = new Set<string>();
        const uniqueLines: string[] = [];

        lines.forEach(line => {
            if (!seen.has(line)) {
                seen.add(line);
                uniqueLines.push(line);
            }
        });

        return uniqueLines.join('\n');
    };

    // Функция для удаления всех дубликатов (удалить все повторяющиеся)
    const removeAllDuplicates = (text: string): string => {
        if (!text.trim()) return '';
        
        const lines = text.split('\n');
        const counts = new Map<string, number>();

        // Подсчитываем количество каждой строки
        lines.forEach(line => {
            counts.set(line, (counts.get(line) || 0) + 1);
        });

        // Оставляем только строки, которые встречаются ровно один раз
        const uniqueLines: string[] = [];
        lines.forEach(line => {
            if (counts.get(line) === 1) {
                uniqueLines.push(line);
            }
        });

        return uniqueLines.join('\n');
    };

    // Функция для удаления уникальных (оставить только строки, которые имеют дубликаты)
    const removeUnique = (text: string): string => {
        if (!text.trim()) return '';
        
        const lines = text.split('\n');
        const counts = new Map<string, number>();

        // Подсчитываем количество каждой строки
        lines.forEach(line => {
            counts.set(line, (counts.get(line) || 0) + 1);
        });

        // Оставляем только строки, которые встречаются более одного раза (но по одному экземпляру)
        const seen = new Set<string>();
        const duplicateLines: string[] = [];
        
        lines.forEach(line => {
            if (counts.get(line)! > 1 && !seen.has(line)) {
                seen.add(line);
                duplicateLines.push(line);
            }
        });

        return duplicateLines.join('\n');
    };

    // Основная функция обработки текста
    const processText = (text: string): string => {
        switch (mode) {
            case 'remove-duplicates':
                return removeDuplicates(text);
            case 'remove-all-duplicates':
                return removeAllDuplicates(text);
            case 'remove-unique':
                return removeUnique(text);
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

    // Подсчет строк
    const inputLines = inputText.trim() ? inputText.split('\n').length : 0;
    const resultLines = result.trim() ? result.split('\n').length : 0;

    return (
        <div className="duplicate-removal-tool">
            <SEOHead 
                title={t('duplicateRemoval.title')}
                description={t('duplicateRemoval.description')}
                keywords={t('duplicateRemoval.keywords')}
            />
            {/* Header-остров инструмента */}
            <div className="tool-header-island">
                <Link to={createLink('')} className="back-button">
                    <img src="/icons/arrow_left.svg" alt="" />
                    {t('common.backToTools')}
                </Link>
                <h1 className="tool-title">{t('duplicateRemoval.title')}</h1>
                <div className="tool-header-buttons">
                    <button className="tool-header-btn counter-btn" title={t('common.usageCount')}>
                        <img src="/icons/rocket.svg" alt="" />
                        <span className="counter">{launchCount}</span>
                    </button>
                    <button className="tool-header-btn icon-only" title={t('common.tips')}>
                        <img src="/icons/lamp.svg" alt="" />
                    </button>
                    <button className="tool-header-btn icon-only" title={t('common.screenshot')}>
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
                        placeholder={t('duplicateRemoval.inputPlaceholder')}
                        value={inputText}
                        onChange={(e) => setInputText(e.target.value)}
                    />
                    <div className="input-controls">
                        <button className="paste-button" onClick={handlePaste}>
                            <img src="/icons/button_paste.svg" alt="" />
                            {t('duplicateRemoval.buttons.paste')}
                        </button>
                        <span className="info">{inputLines} {t('duplicateRemoval.lineCount')}</span>
                    </div>
                </div>

                {/* Правая часть - настройки */}
                <div className="settings-section">
                    <div className="settings-group">
                        <label className="radio-item">
                            <input
                                type="radio"
                                name="mode"
                                value="remove-duplicates"
                                checked={mode === 'remove-duplicates'}
                                onChange={(e) => setMode(e.target.value as DuplicateMode)}
                            />
                            <span className="radio-text">{t('duplicateRemoval.modes.removeDuplicates')}</span>
                        </label>

                        <label className="radio-item">
                            <input
                                type="radio"
                                name="mode"
                                value="remove-all-duplicates"
                                checked={mode === 'remove-all-duplicates'}
                                onChange={(e) => setMode(e.target.value as DuplicateMode)}
                            />
                            <span className="radio-text">{t('duplicateRemoval.modes.removeAllDuplicates')}</span>
                        </label>

                        <label className="radio-item">
                            <input
                                type="radio"
                                name="mode"
                                value="remove-unique"
                                checked={mode === 'remove-unique'}
                                onChange={(e) => setMode(e.target.value as DuplicateMode)}
                            />
                            <span className="radio-text">{t('duplicateRemoval.modes.removeUnique')}</span>
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
                    {t('duplicateRemoval.buttons.showResult')}
                </button>
                
                <button 
                    className="action-btn secondary icon-left" 
                    style={{ width: '445px' }} 
                    onClick={handleCopy}
                    disabled={!result}
                >
                    <img src="/icons/button_copy.svg" alt="" />
                    {copied ? t('duplicateRemoval.buttons.copied') : t('duplicateRemoval.buttons.copyResult')}
                </button>
            </div>

            {/* Поле результата */}
            <div className="result-section">
                <textarea
                    className="result-textarea"
                    placeholder={t('duplicateRemoval.resultPlaceholder')}
                    value={result}
                    readOnly
                />
                <div className="result-controls">
                    <span className="result-counter">{resultLines} {t('duplicateRemoval.lineCount')}</span>
                </div>
            </div>

            {/* SEO блок */}
            <div className="seo-section">
                <h3>{t('duplicateRemoval.seo.whatIsDuplicateRemoval.title')}</h3>
                <p>{t('duplicateRemoval.seo.whatIsDuplicateRemoval.text')}</p>

                <h3>{t('duplicateRemoval.seo.whyNeeded.title')}</h3>
                <p>{t('duplicateRemoval.seo.whyNeeded.text')}</p>

                <h3>{t('duplicateRemoval.seo.howItWorks.title')}</h3>
                <p>{t('duplicateRemoval.seo.howItWorks.text')}</p>

                <h3>{t('duplicateRemoval.seo.whatTexts.title')}</h3>
                <p>{t('duplicateRemoval.seo.whatTexts.text')}</p>

                <h3>{t('duplicateRemoval.seo.forSpecialists.title')}</h3>
                <p>{t('duplicateRemoval.seo.forSpecialists.text')}</p>

                <h3>{t('duplicateRemoval.seo.howToUse.title')}</h3>
                <p>{t('duplicateRemoval.seo.howToUse.text')}</p>
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

export default DuplicateRemovalTool;