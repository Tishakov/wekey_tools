import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { statsService } from '../utils/statsService';
import '../styles/tool-pages.css';
import './PasswordGeneratorTool.css';

const PasswordGeneratorTool: React.FC = () => {
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
        setLaunchCount(statsService.getLaunchCount('password-generator'));
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
    const handleGeneratePasswords = () => {
        // Увеличиваем счетчик запусков
        statsService.incrementLaunchCount('password-generator');
        setLaunchCount(prev => prev + 1);

        const passwords = [];
        for (let i = 0; i < passwordCount; i++) {
            passwords.push(generateSinglePassword());
        }
        
        setResult(passwords.join('\n'));
    };

    // Функция копирования
    const handleCopy = async () => {
        if (result) {
            try {
                await navigator.clipboard.writeText(result);
                setCopied(true);
                setTimeout(() => setCopied(false), 2000);
            } catch (err) {
                console.error('Ошибка копирования: ', err);
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
                <Link to="/" className="back-button">
                    <img src="/icons/arrow_left.svg" alt="" />
                    Все инструменты
                </Link>
                <h1 className="tool-title">Генератор паролей</h1>
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
                {/* Левая часть - настройки генератора */}
                <div className="settings-section">
                    {/* Группа 1: Длина пароля */}
                    <div className="settings-group">
                        <div className="count-slider-container">
                            <label className="slider-label">Длина пароля:</label>
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
                            <label className="dropdown-label">Язык пароля:</label>
                            <div className="dropdown-container">
                                <button 
                                    className="dropdown-toggle"
                                    onClick={() => setLanguageDropdownOpen(!languageDropdownOpen)}
                                    type="button"
                                >
                                    <span>{language}</span>
                                    <span className="dropdown-arrow">▼</span>
                                </button>
                                {languageDropdownOpen && (
                                    <div className="dropdown-menu">
                                        {['Английский', 'Русский', 'Украинский'].map((lang) => (
                                            <div 
                                                key={lang}
                                                className={`dropdown-option ${language === lang ? 'selected' : ''}`}
                                                onClick={() => {
                                                    setLanguage(lang);
                                                    setLanguageDropdownOpen(false);
                                                }}
                                            >
                                                {lang}
                                            </div>
                                        ))}
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
                                <span className="checkbox-text">Маленькие буквы</span>
                            </label>

                            <label className="checkbox-item">
                                <input
                                    type="checkbox"
                                    checked={includeUppercase}
                                    onChange={(e) => setIncludeUppercase(e.target.checked)}
                                />
                                <span className="checkbox-text">Заглавные буквы</span>
                            </label>

                            <label className="checkbox-item">
                                <input
                                    type="checkbox"
                                    checked={includeNumbers}
                                    onChange={(e) => setIncludeNumbers(e.target.checked)}
                                />
                                <span className="checkbox-text">Цифры</span>
                            </label>

                            <label className="checkbox-item">
                                <input
                                    type="checkbox"
                                    checked={includeSymbols}
                                    onChange={(e) => setIncludeSymbols(e.target.checked)}
                                />
                                <span className="checkbox-text">Знаки и символы</span>
                            </label>
                        </div>
                    </div>

                    {/* Группа 4: Количество паролей */}
                    <div className="settings-group">
                        <div className="count-slider-container">
                            <label className="slider-label">Количество паролей:</label>
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
                        placeholder="Здесь будут результаты"
                    />
                    <div className="result-controls">
                        <span className="result-counter">{countLines(result)} стр.</span>
                    </div>
                </div>
            </div>

            {/* Кнопки управления */}
            <div className="control-buttons">
                <button 
                    className="action-btn primary" 
                    onClick={handleGeneratePasswords}
                >
                    Показать результат
                </button>
                
                <div className="result-buttons">
                    <button 
                        className="action-btn secondary" 
                        onClick={handleCopy}
                        disabled={!result}
                    >
                        <img src="/icons/button_copy.svg" alt="" />
                        {copied ? 'Скопировано!' : 'Скопировать'}
                    </button>

                    <button 
                        className="action-btn secondary" 
                        onClick={handleReset}
                    >
                        <img src="/icons/reset.svg" alt="" />
                        Сбросить
                    </button>
                </div>
            </div>
        </div>
    );
};

export default PasswordGeneratorTool;