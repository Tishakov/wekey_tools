import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useLocalizedLink } from '../hooks/useLanguageFromUrl';
import { useAuthRequired } from '../hooks/useAuthRequired';
import { useToolWithCoins } from '../hooks/useToolWithCoins';
import AuthRequiredModal from '../components/AuthRequiredModal';
import AuthModal from '../components/AuthModal';
import SEOHead from '../components/SEOHead';
import '../styles/tool-pages.css';
import './DuplicateFinderTool.css';


const TOOL_ID = 'duplicate-finder';
const DuplicateFinderTool: React.FC = () => {
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
    const { executeWithCoins } = useToolWithCoins(TOOL_ID);
    
    const [inputText1, setInputText1] = useState('');
    const [inputText2, setInputText2] = useState('');
    const [caseSensitive, setCaseSensitive] = useState(false);
    const [onlyInFirst, setOnlyInFirst] = useState('');
    const [common, setCommon] = useState('');
    const [onlyInSecond, setOnlyInSecond] = useState('');
    const [copied1, setCopied1] = useState(false);
    const [copied2, setCopied2] = useState(false);
    const [copied3, setCopied3] = useState(false);
    const [launchCount, setLaunchCount] = useState(0);

    // Загрузка статистики запусков при монтировании
    useEffect(() => {
        const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:8880';
        fetch(`${API_BASE}/api/stats/launch-count/${TOOL_ID}`)
            .then(res => res.json())
            .then(data => setLaunchCount(data.count))
            .catch(err => console.error('Ошибка загрузки счетчика:', err));
    }, []);

    // Очистка результатов при изменении входных данных
    useEffect(() => {
        setOnlyInFirst('');
        setCommon('');
        setOnlyInSecond('');
    }, [inputText1, inputText2, caseSensitive]);

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

    // Функция поиска дубликатов
    const handleShowResult = async () => {
        // Проверяем авторизацию перед выполнением
        if (!requireAuth()) {
            return; // Если пользователь не авторизован, показываем модальное окно и прерываем выполнение
        }

        if (!inputText1.trim() && !inputText2.trim()) {
            setOnlyInFirst('');
            setCommon('');
            setOnlyInSecond('');
            return;
        }

        // Выполняем операцию с тратой коинов
        const result = await executeWithCoins(async () => {
            // Получаем списки слов, фильтруя пустые строки
            const list1 = inputText1.trim() 
                ? inputText1.trim().split('\n').filter(line => line.trim()).map(line => line.trim())
                : [];
            
            const list2 = inputText2.trim() 
                ? inputText2.trim().split('\n').filter(line => line.trim()).map(line => line.trim())
                : [];

            // Приводим к нужному регистру если нужно
            const processedList1 = caseSensitive ? list1 : list1.map(item => item.toLowerCase());
            const processedList2 = caseSensitive ? list2 : list2.map(item => item.toLowerCase());

            // Создаем Set'ы для быстрого поиска
            const set1 = new Set(processedList1);
            const set2 = new Set(processedList2);

            // Находим уникальные для первого списка (не пересекаются со вторым)
            const uniqueInFirst = list1.filter((item) => {
                const processedItem = caseSensitive ? item : item.toLowerCase();
                return !set2.has(processedItem);
            });

            // Находим общие (пересекающиеся)
            const commonItems = list1.filter((item) => {
                const processedItem = caseSensitive ? item : item.toLowerCase();
                return set2.has(processedItem);
            });

            // Находим уникальные для второго списка (не пересекаются с первым)
            const uniqueInSecond = list2.filter((item) => {
                const processedItem = caseSensitive ? item : item.toLowerCase();
                return !set1.has(processedItem);
            });

            // Удаляем дубликаты в каждом результирующем списке
            const uniqueFirstResult = [...new Set(uniqueInFirst)];
            const commonResult = [...new Set(commonItems)];
            const uniqueSecondResult = [...new Set(uniqueInSecond)];

            setOnlyInFirst(uniqueFirstResult.join('\n'));
            setCommon(commonResult.join('\n'));
            setOnlyInSecond(uniqueSecondResult.join('\n'));
            
            return {
                onlyInFirst: uniqueFirstResult.join('\n'),
                common: commonResult.join('\n'),
                onlyInSecond: uniqueSecondResult.join('\n'),
                inputLength: inputText1.length + inputText2.length
            };
        }, {
            inputLength: inputText1.length + inputText2.length
        });

        // Обновляем счетчик после успешного выполнения
        if (result) {
            setLaunchCount(prev => prev + 1);
        }
    };

    // Функции копирования для каждой колонки
    const handleCopy1 = async () => {
        try {
            await navigator.clipboard.writeText(onlyInFirst);
            setCopied1(true);
            setTimeout(() => setCopied1(false), 2000);
        } catch (err) {
            console.error('Ошибка при копировании:', err);
        }
    };

    const handleCopy2 = async () => {
        try {
            await navigator.clipboard.writeText(common);
            setCopied2(true);
            setTimeout(() => setCopied2(false), 2000);
        } catch (err) {
            console.error('Ошибка при копировании:', err);
        }
    };

    const handleCopy3 = async () => {
        try {
            await navigator.clipboard.writeText(onlyInSecond);
            setCopied3(true);
            setTimeout(() => setCopied3(false), 2000);
        } catch (err) {
            console.error('Ошибка при копировании:', err);
        }
    };

    // Подсчет строк
    const inputLines1 = inputText1.trim() ? inputText1.split('\n').length : 0;
    const inputLines2 = inputText2.trim() ? inputText2.split('\n').length : 0;
    const resultLines1 = onlyInFirst.trim() ? onlyInFirst.split('\n').length : 0;
    const resultLines2 = common.trim() ? common.split('\n').length : 0;
    const resultLines3 = onlyInSecond.trim() ? onlyInSecond.split('\n').length : 0;

    return (
        <div className="duplicate-finder-tool">
            <SEOHead 
                title={t('duplicateFinderTool.seo.title')}
                description={t('duplicateFinderTool.seo.description')}
                keywords={t('duplicateFinderTool.seo.keywords')}
                ogTitle={t('duplicateFinderTool.seo.ogTitle')}
                ogDescription={t('duplicateFinderTool.seo.ogDescription')}
            />
            {/* Header-остров инструмента */}
            <div className="tool-header-island">
                <Link to={createLink('')} className="back-button">
                    <img src="/icons/arrow_left.svg" alt="" />
                    {t('common.allTools')}
                </Link>
                <h1 className="tool-title">{t('duplicateFinderTool.title')}</h1>
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
                {/* Верхняя часть - два поля ввода */}
                <div className="input-section">
                    <div className="double-input">
                        <div className="input-field">
                            <textarea
                                className="input-textarea"
                                placeholder={t('duplicateFinderTool.list1Placeholder')}
                                value={inputText1}
                                onChange={(e) => setInputText1(e.target.value)}
                            />
                            <div className="input-controls">
                                <button className="paste-button" onClick={handlePaste1}>
                                    <img src="/icons/button_paste.svg" alt="" />
                                    {t('common.paste')}
                                </button>
                                <label className="checkbox-item">
                                    <input
                                        type="checkbox"
                                        checked={caseSensitive}
                                        onChange={(e) => setCaseSensitive(e.target.checked)}
                                    />
                                    <span className="checkbox-text">{t('duplicateFinderTool.caseSensitive')}</span>
                                </label>
                                <span className="info">{inputLines1} {t('common.lineCount')}</span>
                            </div>
                        </div>
                        
                        <div className="input-field">
                            <textarea
                                className="input-textarea"
                                placeholder={t('duplicateFinderTool.list2Placeholder')}
                                value={inputText2}
                                onChange={(e) => setInputText2(e.target.value)}
                            />
                            <div className="input-controls">
                                <button className="paste-button" onClick={handlePaste2}>
                                    <img src="/icons/button_paste.svg" alt="" />
                                    {t('common.paste')}
                                </button>
                                <span className="info">{inputLines2} {t('common.lineCount')}</span>
                            </div>
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
                >
                    {t('duplicateFinderTool.buttons.find')}
                </button>
                
                <button 
                    className="action-btn secondary icon-left" 
                    style={{ width: '445px' }} 
                    onClick={handleCopy2}
                    disabled={!common}
                >
                    <img src="/icons/button_copy.svg" alt="" />
                    {copied2 ? t('duplicateFinderTool.buttons.copied') : t('duplicateFinderTool.buttons.copyCommon')}
                </button>
            </div>

            {/* Три колонки результатов */}
            <div className="results-section">
                <div className="results-grid">
                    {/* Колонка 1: Не пересекаются со вторым */}
                    <div className="result-column">
                        <div className="settings-group">
                            <div className="connector-label">{t('duplicateFinderTool.results.uniqueInList1')}</div>
                            <textarea
                                className="result-textarea"
                                placeholder={t('common.resultPlaceholder')}
                                value={onlyInFirst}
                                readOnly
                            />
                            <div className="result-controls">
                                <span className="result-counter">{resultLines1} {t('duplicateFinderTool.results.elementsCount')}</span>
                            </div>
                        </div>
                        <button 
                            className="action-btn secondary icon-left" 
                            onClick={handleCopy1}
                            disabled={!onlyInFirst}
                        >
                            <img src="/icons/button_copy.svg" alt="" />
                            {copied1 ? t('duplicateFinderTool.buttons.copied') : t('duplicateFinderTool.buttons.copyUnique1')}
                        </button>
                    </div>

                    {/* Колонка 2: Общие для двух списков */}
                    <div className="result-column">
                        <div className="settings-group">
                            <div className="connector-label">{t('duplicateFinderTool.results.common')}</div>
                            <textarea
                                className="result-textarea"
                                placeholder={t('common.resultPlaceholder')}
                                value={common}
                                readOnly
                            />
                            <div className="result-controls">
                                <span className="result-counter">{resultLines2} {t('duplicateFinderTool.results.elementsCount')}</span>
                            </div>
                        </div>
                        <button 
                            className="action-btn secondary icon-left" 
                            onClick={handleCopy2}
                            disabled={!common}
                        >
                            <img src="/icons/button_copy.svg" alt="" />
                            {copied2 ? t('duplicateFinderTool.buttons.copied') : t('duplicateFinderTool.buttons.copyCommon')}
                        </button>
                    </div>

                    {/* Колонка 3: Не пересекаются с первым */}
                    <div className="result-column">
                        <div className="settings-group">
                            <div className="connector-label">{t('duplicateFinderTool.results.uniqueInList2')}</div>
                            <textarea
                                className="result-textarea"
                                placeholder={t('common.resultPlaceholder')}
                                value={onlyInSecond}
                                readOnly
                            />
                            <div className="result-controls">
                                <span className="result-counter">{resultLines3} {t('duplicateFinderTool.results.elementsCount')}</span>
                            </div>
                        </div>
                        <button 
                            className="action-btn secondary icon-left" 
                            onClick={handleCopy3}
                            disabled={!onlyInSecond}
                        >
                            <img src="/icons/button_copy.svg" alt="" />
                            {copied3 ? t('duplicateFinderTool.buttons.copied') : t('duplicateFinderTool.buttons.copyUnique2')}
                        </button>
                    </div>
                </div>
            </div>

            {/* SEO-блок с описанием возможностей инструмента */}
            <div className="seo-section">
                <h2>{t('duplicateFinderTool.seo.whatIsDuplicateFinding.title')}</h2>
                <p>{t('duplicateFinderTool.seo.whatIsDuplicateFinding.text')}</p>
                
                <h3>{t('duplicateFinderTool.seo.whenToUse.title')}</h3>
                <p>{t('duplicateFinderTool.seo.whenToUse.text')}</p>
                
                <h3>{t('duplicateFinderTool.seo.howItWorks.title')}</h3>
                <p>{t('duplicateFinderTool.seo.howItWorks.text')}</p>
                
                <h3>{t('duplicateFinderTool.seo.benefits.title')}</h3>
                <p>{t('duplicateFinderTool.seo.benefits.text')}</p>
                
                <h3>{t('duplicateFinderTool.seo.forSpecialists.title')}</h3>
                <p>{t('duplicateFinderTool.seo.forSpecialists.text')}</p>
                
                <h3>{t('duplicateFinderTool.seo.howToUse.title')}</h3>
                <p>{t('duplicateFinderTool.seo.howToUse.text')}</p>
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

export default DuplicateFinderTool;
