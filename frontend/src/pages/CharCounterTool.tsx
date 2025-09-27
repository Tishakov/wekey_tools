import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useLocalizedLink } from '../hooks/useLanguageFromUrl';
import { useAuthRequired } from '../hooks/useAuthRequired';
import { useToolWithCoins } from '../hooks/useToolWithCoins';
import AuthRequiredModal from '../components/AuthRequiredModal';
import AuthModal from '../components/AuthModal';
import '../styles/tool-pages.css';
import './CharCounterTool.css';


const TOOL_ID = 'char-counter';
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
    const { t } = useTranslation();
  const { createLink } = useLocalizedLink();
    const { executeWithCoins } = useToolWithCoins(TOOL_ID);
    
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
        const loadLaunchCount = async () => {
            try {
                const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:8880';
                const response = await fetch(`${API_BASE}/api/stats/launch-count/${TOOL_ID}`);
                const data = await response.json();
                
                if (data.success) {
                    setLaunchCount(data.count);
                } else {
                    setLaunchCount(0);
                }
            } catch (error) {
                console.error('Ошибка загрузки счетчика:', error);
                setLaunchCount(0);
            }
        };
        
        loadLaunchCount();
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
    const calculateStats = (): CountStats => {
        if (!inputText.trim()) {
            return {
                characters: 0,
                charactersNoSpaces: 0,
                words: 0,
                numbers: 0,
                digits: 0,
                specialChars: 0,
                paragraphs: 0,
                sentences: 0
            };
        }

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

        return {
            characters,
            charactersNoSpaces,
            words,
            numbers,
            digits,
            specialChars,
            paragraphs,
            sentences
        };
    };

    // Обработчик кнопки "Показать результат"
    const handleShowResult = async () => {
        // Проверяем авторизацию перед выполнением
        if (!requireAuth()) {
            return; // Если пользователь не авторизован, показываем модальное окно и прерываем выполнение
        }

        // Выполняем операцию с тратой коинов
        const coinResult = await executeWithCoins(async () => {
            // Сразу обновляем счетчик в UI (оптимистично)
            setLaunchCount(prev => prev + 1);
            
            return calculateStats();
        }, {
            inputLength: inputText.length,
            outputLength: 1
        });

        if (coinResult.success) {
            setStats(coinResult.result as CountStats);
            
            // Синхронизируем с реальным значением от сервера  
            if (coinResult.newLaunchCount) {
                setLaunchCount(coinResult.newLaunchCount);
            }
        } else {
            // Откатываем счетчик в случае ошибки
            setLaunchCount(prev => prev - 1);
            console.error('Ошибка подсчета символов:', coinResult.error);
        }
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
                <Link to={createLink('')} className="back-button">
                    <img src="/icons/arrow_left.svg" alt="" />
                    {t('navigation.allTools')}
                </Link>
                <h1 className="tool-title">{t('charCounterTool.title')}</h1>
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
                        placeholder={t('charCounterTool.inputPlaceholder')}
                        value={inputText}
                        onChange={(e) => setInputText(e.target.value)}
                    />
                    <div className="input-controls">
                        <button className="paste-button" onClick={handlePaste}>
                            <img src="/icons/button_paste.svg" alt="" />
                            Вставить
                        </button>
                        <span className="info">{inputText.split('\n').filter(line => line.trim()).length} стр.</span>
                    </div>
                </div>

                {/* Правая часть - настройки и счетчики */}
                <div className="settings-section">
                    {/* Группа счетчиков */}
                    <div className="stats-group">
                        <div className="stats-grid">
                            <div className="stat-item">
                                <div className="stat-label">{t('charCounterTool.stats.characters')}</div>
                                <div className="stat-value">{stats.characters}</div>
                            </div>
                            <div className="stat-item">
                                <div className="stat-label">{t('charCounterTool.stats.charactersNoSpaces')}</div>
                                <div className="stat-value">{stats.charactersNoSpaces}</div>
                            </div>
                            <div className="stat-item">
                                <div className="stat-label">{t('charCounterTool.stats.words')}</div>
                                <div className="stat-value">{stats.words}</div>
                            </div>
                            <div className="stat-item">
                                <div className="stat-label">{t('charCounterTool.stats.numbers')}</div>
                                <div className="stat-value">{stats.numbers}</div>
                            </div>
                            <div className="stat-item">
                                <div className="stat-label">{t('charCounterTool.stats.digits')}</div>
                                <div className="stat-value">{stats.digits}</div>
                            </div>
                            <div className="stat-item">
                                <div className="stat-label">{t('charCounterTool.stats.specialChars')}</div>
                                <div className="stat-value">{stats.specialChars}</div>
                            </div>
                            <div className="stat-item">
                                <div className="stat-label">{t('charCounterTool.stats.paragraphs')}</div>
                                <div className="stat-value">{stats.paragraphs}</div>
                            </div>
                            <div className="stat-item">
                                <div className="stat-label">{t('charCounterTool.stats.sentences')}</div>
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
                            <span className="checkbox-text">{t('charCounterTool.settings.useExceptions')}</span>
                        </label>
                    </div>

                    {/* Блок исключений (показывается только при активации чекбокса) */}
                    {useExceptions && (
                        <div className="exceptions-block">
                            <div className="exceptions-fields">
                                <div className="exceptions-left">
                                    <textarea
                                        className="exceptions-textarea"
                                        placeholder={t('charCounterTool.settings.exceptionsPlaceholder')}
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
                    {t('charCounterTool.showResultButton')}
                </button>
                <button 
                    className="action-btn secondary icon-left"
                    style={{ width: '445px' }}
                    onClick={handleCopyResult}
                >
                    <img src="/icons/button_copy.svg" alt="" />
                    {t('charCounterTool.copyButton')}
                </button>
            </div>

            {/* SEO блок */}
            <div className="seo-section">
                <div className="seo-content">
                    <div className="seo-item">
                        <p>{t('charCounterTool.seo.toolDescription')}</p>
                    </div>
                    
                    <div className="seo-item">
                        <h2>{t('charCounterTool.seo.whatIsCharCounter')}</h2>
                        <p>{t('charCounterTool.seo.whatIsCharCounterText')}</p>
                    </div>
                    
                    <div className="seo-item">
                        <h2>{t('charCounterTool.seo.whyNeededCharCounter')}</h2>
                        <p>{t('charCounterTool.seo.whyNeededCharCounterText')}</p>
                    </div>
                    
                    <div className="seo-item">
                        <h3>{t('charCounterTool.seo.howItWorks')}</h3>
                        <p>{t('charCounterTool.seo.howItWorksText')}</p>
                    </div>
                    
                    <div className="seo-item">
                        <h3>{t('charCounterTool.seo.whatExclusions')}</h3>
                        <p>{t('charCounterTool.seo.whatExclusionsText')}</p>
                    </div>
                    
                    <div className="seo-item">
                        <h3>{t('charCounterTool.seo.forSpecialists')}</h3>
                        <p>{t('charCounterTool.seo.forSpecialistsText')}</p>
                    </div>
                    
                    <div className="seo-item">
                        <h3>{t('charCounterTool.seo.howToUse')}</h3>
                        <p>{t('charCounterTool.seo.howToUseText')}</p>
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

export default CharCounterTool;
