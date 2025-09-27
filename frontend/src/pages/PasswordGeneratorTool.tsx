import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useToolTranslation } from '../i18n/useToolTranslation';
import { useLocalizedLink } from '../hooks/useLanguageFromUrl';
import { useAuthRequired } from '../hooks/useAuthRequired';
import { useToolWithCoins } from '../hooks/useToolWithCoins';
import AuthRequiredModal from '../components/AuthRequiredModal';
import AuthModal from '../components/AuthModal';
import '../styles/tool-pages.css';
import './PasswordGeneratorTool.css';


const TOOL_ID = 'password-generator';
const PasswordGeneratorTool: React.FC = () => {
    const { t } = useTranslation();
    const { common, passwordGenerator } = useToolTranslation();
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
    
    // Основные состояния
    const [passwordLength, setPasswordLength] = useState(12);
    const [language, setLanguage] = useState('Английский');
    const [languageDropdownOpen, setLanguageDropdownOpen] = useState(false);
    const [includeLowercase, setIncludeLowercase] = useState(false);
    const [includeUppercase, setIncludeUppercase] = useState(false);
    const [includeNumbers, setIncludeNumbers] = useState(false);
    const [includeSymbols, setIncludeSymbols] = useState(false);
    const [passwordCount, setPasswordCount] = useState(1);
    const [result, setResult] = useState('');
    const [copied, setCopied] = useState(false);
    const [launchCount, setLaunchCount] = useState(0);

    // Алфавиты для разных языков
    const alphabets = {
        'Английский': 'abcdefghijklmnopqrstuvwxyz',
        'Русский': 'абвгдежзийклмнопрстуфхцчшщъыьэюя',
        'Украинский': 'абвгґдежзиіїйклмнопрстуфхцчшщьюя'
    };

    // Символы для разных типов
    const numbers = '0123456789';
    const symbols = '!@#$%&_+-=<>?';

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

    // Закрытие дропдауна при клике вне его
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            const dropdown = document.querySelector('.password-generator-language-selector');
            if (dropdown && !dropdown.contains(event.target as Node)) {
                setLanguageDropdownOpen(false);
            }
        };

        if (languageDropdownOpen) {
            document.addEventListener('mousedown', handleClickOutside);
        }

        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, [languageDropdownOpen]);

    // Очистка результата при изменении параметров
    useEffect(() => {
        setResult('');
        setCopied(false);
    }, [passwordLength, language, includeLowercase, includeUppercase, includeNumbers, includeSymbols, passwordCount]);

    // Функция генерации одного пароля
    const generateSinglePassword = (): string => {
        let charset = '';
        let requiredChars = '';
        
        // Базовый алфавит выбранного языка
        const baseAlphabet = alphabets[language as keyof typeof alphabets];
        
        // Определяем какие символы включать и обязательные символы
        if (!includeLowercase && !includeUppercase) {
            // Если ни один чекбокс регистра не выбран, используем смешанный регистр
            charset += baseAlphabet + baseAlphabet.toUpperCase();
        } else {
            if (includeLowercase) {
                charset += baseAlphabet;
                requiredChars += baseAlphabet.charAt(Math.floor(Math.random() * baseAlphabet.length));
            }
            if (includeUppercase) {
                charset += baseAlphabet.toUpperCase();
                requiredChars += baseAlphabet.toUpperCase().charAt(Math.floor(Math.random() * baseAlphabet.toUpperCase().length));
            }
        }
        
        if (includeNumbers) {
            charset += numbers;
            requiredChars += numbers.charAt(Math.floor(Math.random() * numbers.length));
        }
        
        if (includeSymbols) {
            charset += symbols;
            requiredChars += symbols.charAt(Math.floor(Math.random() * symbols.length));
        }
        
        // Если charset пустой (теоретически не должно происходить), используем базовый алфавит
        if (!charset) {
            charset = baseAlphabet + baseAlphabet.toUpperCase();
        }
        
        let password = '';
        
        // Добавляем обязательные символы
        password += requiredChars;
        
        // Заполняем оставшуюся длину случайными символами
        for (let i = requiredChars.length; i < passwordLength; i++) {
            password += charset.charAt(Math.floor(Math.random() * charset.length));
        }
        
        // Перемешиваем пароль
        return password.split('').sort(() => Math.random() - 0.5).join('');
    };

    // Основная функция генерации паролей
    const handleGeneratePasswords = async () => {
        // Проверяем авторизацию перед выполнением
        if (!requireAuth()) {
            return; // Если пользователь не авторизован, показываем модальное окно и прерываем выполнение
        }

        // Выполняем операцию с тратой коинов
        const coinResult = await executeWithCoins(async () => {
            // Сразу обновляем счетчик в UI (оптимистично)
            setLaunchCount(prev => prev + 1);
            
            const passwords = [];
            for (let i = 0; i < passwordCount; i++) {
                passwords.push(generateSinglePassword());
            }
            
            return passwords.join('\n');
        }, {
            outputLength: passwordCount * passwordLength
        });

        if (coinResult.success) {
            setResult(coinResult.result);
            
            // Синхронизируем с реальным значением от сервера
            if (coinResult.newLaunchCount) {
                setLaunchCount(coinResult.newLaunchCount);
            }
        } else {
            // Откатываем счетчик в случае ошибки
            setLaunchCount(prev => prev - 1);
            console.error('Ошибка генерации паролей:', coinResult.error);
        }
    };

    // Функция копирования
    const handleCopy = async () => {
        if (result) {
            try {
                await navigator.clipboard.writeText(result);
                setCopied(true);
                setTimeout(() => setCopied(false), 2000);
            } catch (err) {
                console.error(passwordGenerator.copyError(), err);
            }
        }
    };

    // Функция сброса
    const handleReset = () => {
        setResult('');
        setCopied(false);
    };

    // Функция подсчета строк
    const countLines = (text: string): number => {
        if (!text.trim()) return 0;
        return text.split('\n').filter(line => line.trim()).length;
    };

    return (
        <div className="password-generator-tool">
            {/* Header инструмента */}
            <div className="tool-header-island">
                <Link to={createLink('')} className="back-button">
                    <img src="/icons/arrow_left.svg" alt="" />
                    {common.backToTools()}
                </Link>
                <h1 className="tool-title">{passwordGenerator.title()}</h1>
                <div className="tool-header-buttons">
                    <button className="tool-header-btn counter-btn" title={common.launchCounter()}>
                        <img src="/icons/rocket.svg" alt="" />
                        <span className="counter">{launchCount}</span>
                    </button>
                    <button className="tool-header-btn icon-only" title={common.hints()}>
                        <img src="/icons/lamp.svg" alt="" />
                    </button>
                    <button className="tool-header-btn icon-only" title={common.screenshot()}>
                        <img src="/icons/camera.svg" alt="" />
                    </button>
                </div>
            </div>

            {/* Основная рабочая область */}
            <div className="main-workspace">
                {/* Левая часть - настройки генератора */}
                <div className="settings-section">
                    {/* Группа 1: Длина пароля */}
                    <div className="settings-group">
                        <div className="count-slider-container">
                            <label className="slider-label">{passwordGenerator.passwordLength()}</label>
                            <div className="slider-group">
                                <div className="slider-container">
                                    <input
                                        type="range"
                                        min="1"
                                        max="100"
                                        value={passwordLength}
                                        onChange={(e) => setPasswordLength(parseInt(e.target.value))}
                                        className="count-slider"
                                    />
                                </div>
                                <input
                                    type="number"
                                    min="1"
                                    value={passwordLength}
                                    onChange={(e) => {
                                        const value = parseInt(e.target.value) || 1;
                                        setPasswordLength(value);
                                    }}
                                    onBlur={(e) => {
                                        const value = parseInt(e.target.value) || 1;
                                        setPasswordLength(value);
                                    }}
                                    onKeyDown={(e) => {
                                        if (e.key === 'Enter') {
                                            e.currentTarget.blur();
                                        }
                                    }}
                                    className="count-input"
                                />
                            </div>
                        </div>
                    </div>

                    {/* Группа 2: Язык пароля */}
                    <div className="settings-group">
                        <div className="password-generator-language-selector">
                            <label className="dropdown-label">{passwordGenerator.passwordLanguage()}</label>
                            <div className="dropdown-container">
                                <button 
                                    className="dropdown-toggle"
                                    onClick={() => setLanguageDropdownOpen(!languageDropdownOpen)}
                                    type="button"
                                >
                                    <span>
                                        {language === 'Английский' ? passwordGenerator.languages.english() :
                                         language === 'Русский' ? passwordGenerator.languages.russian() :
                                         language === 'Украинский' ? passwordGenerator.languages.ukrainian() : language}
                                    </span>
                                    <span className="dropdown-arrow">▼</span>
                                </button>
                                {languageDropdownOpen && (
                                    <div className="dropdown-menu">
                                        {[passwordGenerator.languages.english(), passwordGenerator.languages.russian(), passwordGenerator.languages.ukrainian()].map((lang, index) => {
                                            const langKeys = ['Английский', 'Русский', 'Украинский'];
                                            return (
                                                <div 
                                                    key={langKeys[index]}
                                                    className={`dropdown-option ${language === langKeys[index] ? 'selected' : ''}`}
                                                    onClick={() => {
                                                        setLanguage(langKeys[index]);
                                                        setLanguageDropdownOpen(false);
                                                    }}
                                                >
                                                    {lang}
                                                </div>
                                            );
                                        })}
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* Группа 3: Настройки символов */}
                    <div className="settings-group">
                        <div className="checkboxes-container">
                            <label className="checkbox-item">
                                <input
                                    type="checkbox"
                                    checked={includeLowercase}
                                    onChange={(e) => setIncludeLowercase(e.target.checked)}
                                />
                                <span className="checkbox-text">{passwordGenerator.includeLowercase()}</span>
                            </label>

                            <label className="checkbox-item">
                                <input
                                    type="checkbox"
                                    checked={includeUppercase}
                                    onChange={(e) => setIncludeUppercase(e.target.checked)}
                                />
                                <span className="checkbox-text">{passwordGenerator.includeUppercase()}</span>
                            </label>

                            <label className="checkbox-item">
                                <input
                                    type="checkbox"
                                    checked={includeNumbers}
                                    onChange={(e) => setIncludeNumbers(e.target.checked)}
                                />
                                <span className="checkbox-text">{passwordGenerator.includeNumbers()}</span>
                            </label>

                            <label className="checkbox-item">
                                <input
                                    type="checkbox"
                                    checked={includeSymbols}
                                    onChange={(e) => setIncludeSymbols(e.target.checked)}
                                />
                                <span className="checkbox-text">{passwordGenerator.includeSymbols()}</span>
                            </label>
                        </div>
                    </div>

                    {/* Группа 4: Количество паролей */}
                    <div className="settings-group">
                        <div className="count-slider-container">
                            <label className="slider-label">{passwordGenerator.passwordCount()}</label>
                            <div className="slider-group">
                                <div className="slider-container">
                                    <input
                                        type="range"
                                        min="1"
                                        max="10"
                                        value={passwordCount}
                                        onChange={(e) => setPasswordCount(parseInt(e.target.value))}
                                        className="count-slider"
                                    />
                                </div>
                                <input
                                    type="number"
                                    min="1"
                                    value={passwordCount}
                                    onChange={(e) => {
                                        const value = parseInt(e.target.value) || 1;
                                        setPasswordCount(value);
                                    }}
                                    onBlur={(e) => {
                                        const value = parseInt(e.target.value) || 1;
                                        setPasswordCount(value);
                                    }}
                                    onKeyDown={(e) => {
                                        if (e.key === 'Enter') {
                                            e.currentTarget.blur();
                                        }
                                    }}
                                    className="count-input"
                                />
                            </div>
                        </div>
                    </div>
                </div>

                {/* Правая часть - результат */}
                <div className="result-section">
                    <textarea
                        className="result-textarea"
                        value={result}
                        readOnly
                        placeholder={common.result()}
                    />
                    <div className="result-controls">
                        <span className="result-counter">{countLines(result)} {common.lines()}</span>
                    </div>
                </div>
            </div>

            {/* Кнопки управления */}
            <div className="control-buttons">
                <button 
                    className="action-btn primary" 
                    onClick={handleGeneratePasswords}
                >
                    {common.generate()}
                </button>
                
                <div className="result-buttons">
                    <button 
                        className="action-btn secondary" 
                        onClick={handleCopy}
                        disabled={!result}
                    >
                        <img src="/icons/button_copy.svg" alt="" />
                        {copied ? common.copied() : common.copy()}
                    </button>

                    <button 
                        className="action-btn secondary" 
                        onClick={handleReset}
                    >
                        <img src="/icons/reset.svg" alt="" />
                        {common.reset()}
                    </button>
                </div>
            </div>

            {/* SEO секция */}
            <div className="seo-section">
                <div className="seo-content">
                    <div className="seo-item">
                        <p>{t('passwordGenerator.seo.toolDescription')}</p>
                    </div>
                    <div className="seo-item">
                        <h2>{t('passwordGenerator.seo.whatIsPasswordGenerator')}</h2>
                        <p>{t('passwordGenerator.seo.whatIsPasswordGeneratorContent')}</p>
                    </div>
                    <div className="seo-item">
                        <h2>{t('passwordGenerator.seo.whyNeeded')}</h2>
                        <h3>{t('passwordGenerator.seo.whyNeededSubtitle')}</h3>
                        <p>{t('passwordGenerator.seo.whyNeededContent')}</p>
                    </div>
                    <div className="seo-item">
                        <h2>{t('passwordGenerator.seo.howItWorks')}</h2>
                        <h3>{t('passwordGenerator.seo.howItWorksSubtitle')}</h3>
                        <p>{t('passwordGenerator.seo.howItWorksContent')}</p>
                    </div>
                    <div className="seo-item">
                        <h2>{t('passwordGenerator.seo.whatPasswords')}</h2>
                        <p>{t('passwordGenerator.seo.whatPasswordsContent')}</p>
                    </div>
                    <div className="seo-item">
                        <h2>{t('passwordGenerator.seo.forSpecialists')}</h2>
                        <p>{t('passwordGenerator.seo.forSpecialistsContent')}</p>
                    </div>
                    <div className="seo-item">
                        <h2>{t('passwordGenerator.seo.howToUse')}</h2>
                        <p>{t('passwordGenerator.seo.howToUseContent')}</p>
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

export default PasswordGeneratorTool;