import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useLocalizedLink } from '../hooks/useLanguageFromUrl';
import '../styles/tool-pages.css';
import { useAuthRequired } from '../hooks/useAuthRequired';
import { useToolWithCoins } from '../hooks/useToolWithCoins';
import AuthRequiredModal from '../components/AuthRequiredModal';
import AuthModal from '../components/AuthModal';
import './WordGluingTool.css';


const TOOL_ID = 'word-gluing';
const WordGluingTool: React.FC = () => {
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
    const { executeWithCoins } = useToolWithCoins(TOOL_ID);
    const { createLink } = useLocalizedLink();
    const [inputText1, setInputText1] = useState('');
    const [inputText2, setInputText2] = useState('');
    const [result, setResult] = useState('');
    const [copied, setCopied] = useState(false);
    const [launchCount, setLaunchCount] = useState(0);
    
    // Состояние для радио-кнопок соединителей
    const [connector, setConnector] = useState('nothing'); // по умолчанию "ничего"
    const [customConnector, setCustomConnector] = useState('');

    // Загрузка статистики запусков при монтировании
    useEffect(() => {
        const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:8880';
        fetch(`${API_BASE}/api/stats/launch-count/${TOOL_ID}`)
            .then(res => res.json())
            .then(data => setLaunchCount(data.count))
            .catch(err => console.error('Ошибка загрузки счетчика:', err));
    }, []);

    // Очистка результата при изменении входных данных или настроек
    useEffect(() => {
        setResult('');
    }, [inputText1, inputText2, connector, customConnector]);

    // Функция для обмена значений между полями
    const swapValues = () => {
        const temp = inputText1;
        setInputText1(inputText2);
        setInputText2(temp);
    };

    // Вставка из буфера для первого поля
    const handlePaste1 = async () => {
        try {
            const text = await navigator.clipboard.readText();
            setInputText1(text);
        } catch (err) {
            console.error('Ошибка при вставке:', err);
        }
    };

    // Вставка из буфера для второго поля
    const handlePaste2 = async () => {
        try {
            const text = await navigator.clipboard.readText();
            setInputText2(text);
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

    // Функция склейки слов
    const handleShowResult = async () => {
        // Проверяем авторизацию перед выполнением
        if (!requireAuth()) {
            return; // Если пользователь не авторизован, показываем модальное окно и прерываем выполнение
        }

        if (!inputText1.trim() || !inputText2.trim()) {
            setResult('');
            return;
        }

        // Оптимистично обновляем счетчик сразу
        setLaunchCount(prev => prev + 1);

        // Выполняем операцию с тратой коинов
        const result = await executeWithCoins(async () => {
            const lines1 = inputText1.trim().split('\n').filter(line => line.trim());
            const lines2 = inputText2.trim().split('\n').filter(line => line.trim());
            
            // Определяем соединитель
            let connectorStr = '';
            switch (connector) {
                case 'nothing':
                    connectorStr = '';
                    break;
                case 'space':
                    connectorStr = ' ';
                    break;
                case 'comma-space':
                    connectorStr = ', ';
                    break;
                case 'dot-space':
                    connectorStr = '. ';
                    break;
                case 'semicolon':
                    connectorStr = ';';
                    break;
                case 'colon':
                    connectorStr = ':';
                    break;
                case 'dash':
                    connectorStr = '-';
                    break;
                case 'long-dash':
                    connectorStr = ' — ';
                    break;
                case 'other':
                    connectorStr = customConnector;
                    break;
                default:
                    connectorStr = '';
            }

            // Склеиваем слова
            const maxLength = Math.max(lines1.length, lines2.length);
            const resultLines: string[] = [];
            
            for (let i = 0; i < maxLength; i++) {
                const word1 = lines1[i] || '';
                const word2 = lines2[i] || '';
                
                if (word1 && word2) {
                    resultLines.push(word1 + connectorStr + word2);
                } else if (word1) {
                    resultLines.push(word1);
                } else if (word2) {
                    resultLines.push(word2);
                }
            }

            setResult(resultLines.join('\n'));
            
            return {
                result: resultLines.join('\n'),
                inputLength: inputText1.length + inputText2.length
            };
        }, {
            inputLength: inputText1.length + inputText2.length
        });

        // Если операция не удалась, откатываем счетчик
        if (!result) {
            setLaunchCount(prev => prev - 1);
        }
    };

    // Копирование результата
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
    const inputLines1 = inputText1.trim() ? inputText1.split('\n').length : 0;
    const inputLines2 = inputText2.trim() ? inputText2.split('\n').length : 0;
    const resultLines = result.trim() ? result.split('\n').length : 0;

    return (
        <div className="word-gluing-tool">
            {/* Header-остров инструмента */}
            <div className="tool-header-island">
                <Link to={createLink('')} className="back-button">
                    <img src="/icons/arrow_left.svg" alt="" />
                    {t('navigation.allTools')}
                </Link>
                <h1 className="tool-title">{t('wordGluing.title')}</h1>
                <div className="tool-header-buttons">
                    <button className="tool-header-btn counter-btn" title={t('navigation.launchCounter')}>
                        <img src="/icons/rocket.svg" alt="" />
                        <span className="counter">{launchCount}</span>
                    </button>
                    <button className="tool-header-btn icon-only" title={t('navigation.hints')}>
                        <img src="/icons/lamp.svg" alt="" />
                    </button>
                    <button className="tool-header-btn icon-only" title={t('navigation.screenshot')}>
                        <img src="/icons/camera.svg" alt="" />
                    </button>
                </div>
            </div>

            {/* Основная рабочая область */}
            <div className="main-workspace">
                {/* Левая часть - два поля ввода рядом с кнопкой обмена поверх */}
                <div className="input-section">
                    <div className="double-input">
                        <div className="input-field">
                            <textarea
                                className="input-textarea"
                                placeholder={t('wordGluing.placeholders.input1')}
                                value={inputText1}
                                onChange={(e) => setInputText1(e.target.value)}
                            />
                            <div className="input-controls">
                                <button className="paste-button" onClick={handlePaste1}>
                                    <img src="/icons/button_paste.svg" alt="" />
                                    {t('wordGluing.buttons.paste')}
                                </button>
                                <span className="line-count">{inputLines1} {t('wordGluing.counters.lines')}</span>
                            </div>
                        </div>
                        
                        <div className="input-field">
                            <textarea
                                className="input-textarea"
                                placeholder={t('wordGluing.placeholders.input2')}
                                value={inputText2}
                                onChange={(e) => setInputText2(e.target.value)}
                            />
                            <div className="input-controls">
                                <button className="paste-button" onClick={handlePaste2}>
                                    <img src="/icons/button_paste.svg" alt="" />
                                    {t('wordGluing.buttons.paste')}
                                </button>
                                <span className="line-count">{inputLines2} {t('wordGluing.counters.lines')}</span>
                            </div>
                        </div>
                        
                        {/* Кнопка обмена значений - поверх полей по центру */}
                        <div className="swap-button-container">
                            <button className="swap-button" onClick={swapValues} title={t('wordGluing.buttons.swap')}>
                                <img src="/icons/change.svg" alt={t('wordGluing.buttons.swap')} />
                            </button>
                        </div>
                    </div>
                </div>

                {/* Правая часть - настройки соединителей */}
                <div className="settings-section">
                    <div className="settings-group">
                        {/* Плашка заголовка внутри блока */}
                        <div className="connector-label">{t('wordGluing.connectors.title')}</div>
                        
                        {/* Сетка радио-кнопок 2x4 согласно скриншоту */}
                        <div className="connector-grid">
                            {/* Левая колонка */}
                            <label className="radio-item">
                                <input
                                    type="radio"
                                    name="connector"
                                    value="nothing"
                                    checked={connector === 'nothing'}
                                    onClick={() => handleRadioClick(connector, setConnector, 'nothing')}
                                    onChange={() => {}}
                                />
                                <span className="radio-text">{t('wordGluing.connectors.options.nothing')}</span>
                            </label>

                            {/* Правая колонка */}
                            <label className="radio-item">
                                <input
                                    type="radio"
                                    name="connector"
                                    value="semicolon"
                                    checked={connector === 'semicolon'}
                                    onClick={() => handleRadioClick(connector, setConnector, 'semicolon')}
                                    onChange={() => {}}
                                />
                                <span className="radio-text">{t('wordGluing.connectors.options.semicolon')}</span>
                            </label>

                            <label className="radio-item">
                                <input
                                    type="radio"
                                    name="connector"
                                    value="space"
                                    checked={connector === 'space'}
                                    onClick={() => handleRadioClick(connector, setConnector, 'space')}
                                    onChange={() => {}}
                                />
                                <span className="radio-text">{t('wordGluing.connectors.options.space')}</span>
                            </label>

                            <label className="radio-item">
                                <input
                                    type="radio"
                                    name="connector"
                                    value="colon"
                                    checked={connector === 'colon'}
                                    onClick={() => handleRadioClick(connector, setConnector, 'colon')}
                                    onChange={() => {}}
                                />
                                <span className="radio-text">{t('wordGluing.connectors.options.colon')}</span>
                            </label>

                            <label className="radio-item">
                                <input
                                    type="radio"
                                    name="connector"
                                    value="comma-space"
                                    checked={connector === 'comma-space'}
                                    onClick={() => handleRadioClick(connector, setConnector, 'comma-space')}
                                    onChange={() => {}}
                                />
                                <span className="radio-text">{t('wordGluing.connectors.options.commaSpace')}</span>
                            </label>

                            <label className="radio-item">
                                <input
                                    type="radio"
                                    name="connector"
                                    value="dash"
                                    checked={connector === 'dash'}
                                    onClick={() => handleRadioClick(connector, setConnector, 'dash')}
                                    onChange={() => {}}
                                />
                                <span className="radio-text">{t('wordGluing.connectors.options.dash')}</span>
                            </label>

                            <label className="radio-item">
                                <input
                                    type="radio"
                                    name="connector"
                                    value="dot-space"
                                    checked={connector === 'dot-space'}
                                    onClick={() => handleRadioClick(connector, setConnector, 'dot-space')}
                                    onChange={() => {}}
                                />
                                <span className="radio-text">{t('wordGluing.connectors.options.dotSpace')}</span>
                            </label>

                            <label className="radio-item">
                                <input
                                    type="radio"
                                    name="connector"
                                    value="long-dash"
                                    checked={connector === 'long-dash'}
                                    onClick={() => handleRadioClick(connector, setConnector, 'long-dash')}
                                    onChange={() => {}}
                                />
                                <span className="radio-text">{t('wordGluing.connectors.options.longDash')}</span>
                            </label>
                        </div>
                    </div>

                    {/* Отдельная settings-group для кастомного соединителя */}
                    <div className="settings-group">
                        <div className="custom-connector-group">
                            <label className="radio-item">
                                <input
                                    type="radio"
                                    name="connector"
                                    value="other"
                                    checked={connector === 'other'}
                                    onClick={() => handleRadioClick(connector, setConnector, 'other')}
                                    onChange={() => {}}
                                />
                                <span className="radio-text">{t('wordGluing.connectors.options.other')}</span>
                            </label>
                            <input
                                type="text"
                                className="custom-connector-input"
                                placeholder={t('wordGluing.connectors.customPlaceholder')}
                                value={customConnector}
                                onChange={(e) => setCustomConnector(e.target.value)}
                                onFocus={() => setConnector('other')}
                                onClick={() => setConnector('other')}
                            />
                        </div>
                    </div>
                </div>
            </div>

            {/* Кнопки управления */}
            <div className="control-buttons">
                <button 
                    className="action-btn primary" 
                    style={{ width: '445px' }} 
                    onClick={handleShowResult}
                    disabled={!inputText1.trim() || !inputText2.trim()}
                >
                    {t('wordGluing.buttons.showResult')}
                </button>
                
                <button 
                    className="action-btn secondary icon-left" 
                    style={{ width: '445px' }} 
                    onClick={handleCopy}
                    disabled={!result}
                >
                    <img src="/icons/button_copy.svg" alt="" />
                    {copied ? t('wordGluing.buttons.copied') : t('wordGluing.buttons.copy')}
                </button>
            </div>

            {/* Поле результата */}
            <div className="result-section">
                <textarea
                    className="result-textarea"
                    placeholder={t('wordGluing.placeholders.result')}
                    value={result}
                    readOnly
                />
                <div className="result-controls">
                    <span className="result-counter">{resultLines} {t('wordGluing.counters.lines')}</span>
                </div>
            </div>

            {/* SEO секция */}
            <div className="seo-section">
                <div className="seo-content">
                    <div className="seo-item">
                        <p>{t('wordGluing.seo.toolDescription')}</p>
                    </div>
                    
                    <div className="seo-item">
                        <h2>{t('wordGluing.seo.whatIsWordGluing')}</h2>
                        <p>{t('wordGluing.seo.whatIsWordGluingContent')}</p>
                    </div>
                    
                    <div className="seo-item">
                        <h2>{t('wordGluing.seo.whyNeeded')}</h2>
                        <h3>{t('wordGluing.seo.whyNeededSubtitle')}</h3>
                        <p>{t('wordGluing.seo.whyNeededContent')}</p>
                    </div>
                    
                    <div className="seo-item">
                        <h2>{t('wordGluing.seo.howItWorks')}</h2>
                        <h3>{t('wordGluing.seo.howItWorksSubtitle')}</h3>
                        <p>{t('wordGluing.seo.howItWorksContent')}</p>
                    </div>
                    
                    <div className="seo-item">
                        <h2>{t('wordGluing.seo.whatConnectors')}</h2>
                        <p>{t('wordGluing.seo.whatConnectorsContent')}</p>
                    </div>
                    
                    <div className="seo-item">
                        <h2>{t('wordGluing.seo.forSpecialists')}</h2>
                        <p>{t('wordGluing.seo.forSpecialistsContent')}</p>
                    </div>
                    
                    <div className="seo-item">
                        <h2>{t('wordGluing.seo.howToUse')}</h2>
                        <p>{t('wordGluing.seo.howToUseContent')}</p>
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

export default WordGluingTool;