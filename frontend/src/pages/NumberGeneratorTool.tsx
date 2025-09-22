import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useLocalizedLink } from '../hooks/useLanguageFromUrl';
import { statsService } from '../utils/statsService';
import SEOHead from '../components/SEOHead';
import '../styles/tool-pages.css';
import './NumberGeneratorTool.css';


const TOOL_ID = 'number-generator';
const NumberGeneratorTool: React.FC = () => {
    // Хуки
    const { t } = useTranslation();
    const { createLink } = useLocalizedLink();
    
    // Основные состояния
    const [fromNumber, setFromNumber] = useState(1);
    const [toNumber, setToNumber] = useState(100);
    const [resultCount, setResultCount] = useState(1);
    const [noRepeats, setNoRepeats] = useState(false);
    const [result, setResult] = useState('');
    const [copied, setCopied] = useState(false);
    const [launchCount, setLaunchCount] = useState(0);
    const [currentTime, setCurrentTime] = useState(new Date());
    
    // Массив уже использованных чисел для режима "без повторов"
    const [usedNumbers, setUsedNumbers] = useState<Set<number>>(new Set());

    // Загрузка статистики запусков при монтировании
    useEffect(() => {
        statsService.getLaunchCount(TOOL_ID).then(setLaunchCount);
    }, []);

    // Обновление времени каждую секунду
    useEffect(() => {
        const timer = setInterval(() => {
            setCurrentTime(new Date());
        }, 1000);

        return () => clearInterval(timer);
    }, []);

    // Очистка результата при изменении параметров
    useEffect(() => {
        setResult('');
        setCopied(false);
    }, [fromNumber, toNumber, resultCount, noRepeats]);

    // Функция генерации случайного числа в диапазоне
    const generateRandomNumber = (min: number, max: number): number => {
        return Math.floor(Math.random() * (max - min + 1)) + min;
    };

    // Основная функция генерации чисел
    const handleGenerateNumbers = async () => {
        // Увеличиваем счетчик запусков и получаем актуальное значение
        try {
            const newCount = await statsService.incrementAndGetCount(TOOL_ID);
            setLaunchCount(newCount);
        } catch (error) {
            // Если API недоступен, увеличиваем локально
            console.error('Failed to update stats:', error);
            setLaunchCount(prev => prev + 1);
        }

        const numbers: number[] = [];
        let availableNumbers = new Set<number>();
        
        // Создаем набор доступных чисел
        for (let i = fromNumber; i <= toNumber; i++) {
            availableNumbers.add(i);
        }

        // В режиме "без повторов" убираем уже использованные числа
        if (noRepeats) {
            usedNumbers.forEach(num => {
                availableNumbers.delete(num);
            });

            // Проверяем, достаточно ли уникальных чисел
            if (availableNumbers.size < resultCount) {
                setResult(`${t('numberGeneratorTool.errors.noMoreUniqueNumbers', { from: fromNumber, to: toNumber })}\n${t('numberGeneratorTool.errors.useResetButton')}`);
                return;
            }
        }

        // Генерируем числа
        const availableArray = Array.from(availableNumbers);
        
        for (let i = 0; i < resultCount; i++) {
            if (noRepeats) {
                // В режиме без повторов выбираем из доступных
                const randomIndex = Math.floor(Math.random() * availableArray.length);
                const selectedNumber = availableArray[randomIndex];
                numbers.push(selectedNumber);
                
                // Удаляем выбранное число из доступных
                availableArray.splice(randomIndex, 1);
                
                // Добавляем в использованные
                setUsedNumbers(prev => new Set([...prev, selectedNumber]));
            } else {
                // Обычная генерация с возможными повторами
                const randomNumber = generateRandomNumber(fromNumber, toNumber);
                numbers.push(randomNumber);
            }
        }

        // Форматируем результат
        setResult(numbers.join('\n'));
    };

    // Функция копирования результата
    const handleCopy = async () => {
        if (result) {
            try {
                await navigator.clipboard.writeText(result);
                setCopied(true);
                setTimeout(() => setCopied(false), 2000);
            } catch (err) {
                console.error(t('numberGeneratorTool.errors.copyError'), err);
            }
        }
    };

    // Функция сброса результата и уникальных чисел
    const handleReset = () => {
        setUsedNumbers(new Set());
        setResult('');
        setCopied(false);
    };

    // Подсчет строк в результате
    const countLines = (text: string): number => {
        if (text === '') return 0;
        return text.split('\n').length;
    };

    // Форматирование времени
    const formatTime = (date: Date): string => {
        return date.toLocaleString('ru-RU', {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
            second: '2-digit'
        });
    };

    return (
        <div className="number-generator-tool">
            <SEOHead
                title={t('numberGeneratorTool.seo.title')}
                description={t('numberGeneratorTool.seo.description')}
                keywords={t('numberGeneratorTool.seo.keywords')}
                ogTitle={t('numberGeneratorTool.seo.ogTitle')}
                ogDescription={t('numberGeneratorTool.seo.ogDescription')}
            />
            
            {/* Header инструмента */}
            <div className="tool-header-island">
                <Link to={createLink('')} className="back-button">
                    <img src="/icons/arrow_left.svg" alt="" />
                    {t('numberGeneratorTool.navigation.allTools')}
                </Link>
                <h1 className="tool-title">{t('numberGeneratorTool.title')}</h1>
                <div className="tool-header-buttons">
                    <button className="tool-header-btn counter-btn" title={t('numberGeneratorTool.tooltips.launchCounter')}>
                        <img src="/icons/rocket.svg" alt="" />
                        <span className="counter">{launchCount}</span>
                    </button>
                    <button className="tool-header-btn icon-only" title={t('numberGeneratorTool.tooltips.hint')}>
                        <img src="/icons/lamp.svg" alt="" />
                    </button>
                    <button className="tool-header-btn icon-only" title={t('numberGeneratorTool.tooltips.screenshot')}>
                        <img src="/icons/camera.svg" alt="" />
                    </button>
                </div>
            </div>

            {/* Основная рабочая область */}
            <div className="main-workspace">
                {/* Левая часть - настройки генератора */}
                <div className="settings-section">
                    {/* Первая группа: Диапазон чисел */}
                    <div className="settings-group">
                        <div className="count-slider-container">
                            <label className="slider-label">{t('numberGeneratorTool.settings.fromLabel')}</label>
                            <div className="slider-group">
                                <div className="slider-container">
                                    <input
                                        type="range"
                                        min="0"
                                        max="100"
                                        value={fromNumber}
                                        onChange={(e) => {
                                            const value = parseInt(e.target.value);
                                            setFromNumber(value);
                                            if (value > toNumber) {
                                                setToNumber(value);
                                            }
                                        }}
                                        className="count-slider"
                                    />
                                </div>
                                <input
                                    type="number"
                                    min="0"
                                    value={fromNumber}
                                    onChange={(e) => {
                                        const value = parseInt(e.target.value) || 0;
                                        setFromNumber(value);
                                        if (value > toNumber) {
                                            setToNumber(value);
                                        }
                                    }}
                                    onBlur={(e) => {
                                        const value = parseInt(e.target.value) || 0;
                                        setFromNumber(value);
                                        if (value > toNumber) {
                                            setToNumber(value);
                                        }
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

                        <div className="count-slider-container">
                            <label className="slider-label">{t('numberGeneratorTool.settings.toLabel')}</label>
                            <div className="slider-group">
                                <div className="slider-container">
                                    <input
                                        type="range"
                                        min="0"
                                        max="1000"
                                        value={toNumber}
                                        onChange={(e) => {
                                            const value = parseInt(e.target.value);
                                            setToNumber(value);
                                            if (value < fromNumber) {
                                                setFromNumber(value);
                                            }
                                        }}
                                        className="count-slider"
                                    />
                                </div>
                                <input
                                    type="number"
                                    min="0"
                                    value={toNumber}
                                    onChange={(e) => {
                                        const value = parseInt(e.target.value) || 0;
                                        setToNumber(value);
                                        if (value < fromNumber) {
                                            setFromNumber(value);
                                        }
                                    }}
                                    onBlur={(e) => {
                                        const value = parseInt(e.target.value) || 0;
                                        setToNumber(value);
                                        if (value < fromNumber) {
                                            setFromNumber(value);
                                        }
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

                    {/* Вторая группа: Количество чисел в результате */}
                    <div className="settings-group">
                        <div className="count-slider-container">
                            <label className="slider-label">{t('numberGeneratorTool.settings.countLabel')}</label>
                            <div className="slider-group">
                                <div className="slider-container">
                                    <input
                                        type="range"
                                        min="1"
                                        max="10"
                                        value={resultCount}
                                        onChange={(e) => setResultCount(parseInt(e.target.value))}
                                        className="count-slider"
                                    />
                                </div>
                                <input
                                    type="number"
                                    min="1"
                                    value={resultCount}
                                    onChange={(e) => {
                                        const value = parseInt(e.target.value) || 1;
                                        setResultCount(value);
                                    }}
                                    onBlur={(e) => {
                                        const value = parseInt(e.target.value) || 1;
                                        setResultCount(value);
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

                        {/* Чекбокс "Без повторов" и время */}
                        <div className="no-repeats-container">
                            <label className="checkbox-item">
                                <input
                                    type="checkbox"
                                    checked={noRepeats}
                                    onChange={(e) => setNoRepeats(e.target.checked)}
                                />
                                <span className="checkbox-text">{t('numberGeneratorTool.settings.noRepeats')}</span>
                            </label>
                            <div className="current-time">
                                {formatTime(currentTime)}
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
                        placeholder={t('numberGeneratorTool.result.placeholder')}
                    />
                    <div className="result-controls">
                        <span className="result-counter">{countLines(result)} {t('numberGeneratorTool.result.linesCount')}</span>
                    </div>
                </div>
            </div>

            {/* Кнопки управления */}
            <div className="control-buttons">
                <button 
                    className="action-btn primary" 
                    onClick={handleGenerateNumbers}
                >
                    {t('numberGeneratorTool.buttons.showResult')}
                </button>
                
                <div className="result-buttons">
                    <button 
                        className="action-btn secondary" 
                        onClick={handleCopy}
                        disabled={!result}
                    >
                        <img src="/icons/button_copy.svg" alt="" />
                        {copied ? t('numberGeneratorTool.buttons.copied') : t('numberGeneratorTool.buttons.copy')}
                    </button>

                    <button 
                        className="action-btn secondary" 
                        onClick={handleReset}
                    >
                        <img src="/icons/reset.svg" alt="" />
                        {t('numberGeneratorTool.buttons.reset')}
                    </button>
                </div>
            </div>

            {/* SEO секция */}
            <div className="seo-section">
                <div className="seo-content">
                    <div className="seo-item">
                        <p>{t('numberGeneratorTool.seo.toolDescription')}</p>
                    </div>
                    <div className="seo-item">
                        <h2>{t('numberGeneratorTool.seo.whatIsNumberGenerator')}</h2>
                        <p>{t('numberGeneratorTool.seo.whatIsNumberGeneratorContent')}</p>
                    </div>
                    <div className="seo-item">
                        <h2>{t('numberGeneratorTool.seo.whyNeeded')}</h2>
                        <h3>{t('numberGeneratorTool.seo.whyNeededSubtitle')}</h3>
                        <p>{t('numberGeneratorTool.seo.whyNeededContent')}</p>
                    </div>
                    <div className="seo-item">
                        <h2>{t('numberGeneratorTool.seo.howItWorks')}</h2>
                        <h3>{t('numberGeneratorTool.seo.howItWorksSubtitle')}</h3>
                        <p>{t('numberGeneratorTool.seo.howItWorksContent')}</p>
                    </div>
                    <div className="seo-item">
                        <h2>{t('numberGeneratorTool.seo.whatNumbers')}</h2>
                        <p>{t('numberGeneratorTool.seo.whatNumbersContent')}</p>
                    </div>
                    <div className="seo-item">
                        <h2>{t('numberGeneratorTool.seo.forSpecialists')}</h2>
                        <p>{t('numberGeneratorTool.seo.forSpecialistsContent')}</p>
                    </div>
                    <div className="seo-item">
                        <h2>{t('numberGeneratorTool.seo.howToUse')}</h2>
                        <p>{t('numberGeneratorTool.seo.howToUseContent')}</p>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default NumberGeneratorTool;