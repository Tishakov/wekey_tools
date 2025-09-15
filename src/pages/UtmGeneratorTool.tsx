import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import '../styles/tool-pages.css';
import './UtmGeneratorTool.css';
import { statsService } from '../utils/statsService';

const UtmGeneratorTool: React.FC = () => {
    // Состояния компонента
    const [baseUrl, setBaseUrl] = useState('');
    const [protocol, setProtocol] = useState('https://');
    const [protocolDropdownOpen, setProtocolDropdownOpen] = useState(false);
    const [utmSource, setUtmSource] = useState('');
    const [utmMedium, setUtmMedium] = useState('');
    const [utmCampaign, setUtmCampaign] = useState('');
    const [utmContent, setUtmContent] = useState('');
    const [utmTerm, setUtmTerm] = useState('');
    const [noBaseUrl, setNoBaseUrl] = useState(false);
    const [transliterate, setTransliterate] = useState(false);
    const [result, setResult] = useState('');
    const [copied, setCopied] = useState(false);
    const [launchCount, setLaunchCount] = useState(0);

    // Загрузка статистики при монтировании компонента
    useEffect(() => {
        const count = statsService.getLaunchCount('utm_generator');
        setLaunchCount(count);
    }, []);

    // Очистка результата при изменении полей
    useEffect(() => {
        setResult('');
    }, [baseUrl, utmSource, utmMedium, utmCampaign, utmContent, utmTerm, noBaseUrl, transliterate]);

    // Функция обработки изменения URL с автоопределением протокола
    const handleUrlChange = (value: string) => {
        setBaseUrl(value);
        
        // Автоматическое определение протокола
        if (value.startsWith('https://')) {
            handleProtocolSelect('https://');
            setBaseUrl(value.substring(8));
        } else if (value.startsWith('http://')) {
            handleProtocolSelect('http://');
            setBaseUrl(value.substring(7));
        }
    };

    // Функция переключения протокола
    const handleProtocolToggle = () => {
        setProtocolDropdownOpen(!protocolDropdownOpen);
    };

    // Функция выбора протокола
    const handleProtocolSelect = (selectedProtocol: string) => {
        setProtocol(selectedProtocol);
        setProtocolDropdownOpen(false);
    };

    // Закрытие выпадающего списка при клике вне его области
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (protocolDropdownOpen) {
                const protocolSelector = document.querySelector('.protocol-selector');
                if (protocolSelector && !protocolSelector.contains(event.target as Node)) {
                    setProtocolDropdownOpen(false);
                }
            }
        };

        document.addEventListener('mousedown', handleClickOutside);
        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, [protocolDropdownOpen]);

    // Функция транслитерации
    const transliterateText = (text: string): string => {
        return text
            .trim() // убираем пробелы в начале и конце
            .toLowerCase() // приводим к нижнему регистру
            .replace(/[''""«»„"]/g, '') // удаляем апострофы и кавычки (включая разные типы кавычек)
            .replace(/[^\w\s\-\/\.]/g, '') // удаляем все спецсимволы кроме букв, цифр, пробелов, дефисов, слешей и точек
            .replace(/\s+/g, '-') // заменяем все виды пробелов (в том числе множественные) на дефис
            .replace(/-+/g, '-') // заменяем множественные дефисы на один
            .replace(/\/+/g, '/') // заменяем множественные слеши на один
            .replace(/^-+|-+$/g, ''); // убираем дефисы в начале и конце
    };

    // Обработчик показа результата
    const handleShowResult = () => {
        const params: string[] = [];
        
        // Формируем параметры UTM
        if (utmSource.trim()) {
            const value = transliterate ? transliterateText(utmSource) : utmSource;
            params.push(`utm_source=${encodeURIComponent(value)}`);
        }
        if (utmMedium.trim()) {
            const value = transliterate ? transliterateText(utmMedium) : utmMedium;
            params.push(`utm_medium=${encodeURIComponent(value)}`);
        }
        if (utmCampaign.trim()) {
            const value = transliterate ? transliterateText(utmCampaign) : utmCampaign;
            params.push(`utm_campaign=${encodeURIComponent(value)}`);
        }
        if (utmContent.trim()) {
            const value = transliterate ? transliterateText(utmContent) : utmContent;
            params.push(`utm_content=${encodeURIComponent(value)}`);
        }
        if (utmTerm.trim()) {
            const value = transliterate ? transliterateText(utmTerm) : utmTerm;
            params.push(`utm_term=${encodeURIComponent(value)}`);
        }

        // Формируем итоговый результат
        if (params.length === 0) {
            setResult('Заполните хотя бы один UTM-параметр');
            return;
        }

        const utmString = `?${params.join('&')}`;
        
        if (noBaseUrl) {
            // Только хвост UTM
            setResult(utmString);
        } else {
            // Полная ссылка с протоколом
            let url = baseUrl.trim();
            if (!url) {
                url = 'example.com';
            }
            
            // Убираем существующие параметры если есть
            const cleanUrl = url.split('?')[0];
            
            // Применяем транслитерацию к URL если включена
            const finalUrl = transliterate ? transliterateText(cleanUrl) : cleanUrl;
            
            setResult(protocol + finalUrl + utmString);
        }

        // Увеличиваем счетчик запусков
        statsService.incrementLaunchCount('utm_generator');
        const newCount = statsService.getLaunchCount('utm_generator');
        setLaunchCount(newCount);
    };

    // Обработчик копирования результата
    const handleCopyResult = async () => {
        if (!result || result === 'Заполните хотя бы один UTM-параметр') return;
        
        try {
            await navigator.clipboard.writeText(result);
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
        } catch (err) {
            console.error('Ошибка при копировании:', err);
        }
    };

    return (
        <div className="tool-page utm-generator-page">
            {/* Header-остров инструмента */}
            <div className="tool-header-island">
                <Link to="/" className="back-button">
                    <img src="/icons/arrow_left.svg" alt="" />
                    Все инструменты
                </Link>
                <h1 className="tool-title">Генератор UTM-меток</h1>
                <div className="tool-header-buttons">
                    <button className="tool-header-btn counter-btn" title="Счетчик запусков">
                        <img src="/icons/rocket.svg" alt="" />
                        <span className="counter">{launchCount}</span>
                    </button>
                    <button className="tool-header-btn icon-only" title="Подсказка">
                        <img src="/icons/lamp.svg" alt="" />
                    </button>
                    <button className="tool-header-btn icon-only" title="Скриншот">
                        <img src="/icons/camera.svg" alt="" />
                    </button>
                </div>
            </div>

            {/* Специальная структура для UTM генератора - ряды сверху вниз */}
            <div className="utm-tool-content">
                {/* Ряд 1: URL и чекбокс */}
                <div className="utm-row">
                    <div className="url-container">
                        <div className="url-input-wrapper">
                            <div className="protocol-selector">
                                <button 
                                    className="protocol-toggle"
                                    onClick={handleProtocolToggle}
                                    type="button"
                                >
                                    <span>{protocol}</span>
                                    <span className="protocol-arrow">▼</span>
                                </button>
                                {protocolDropdownOpen && (
                                    <div className="protocol-dropdown">
                                        <div 
                                            className={`protocol-option ${protocol === 'https://' ? 'selected' : ''}`}
                                            onClick={() => handleProtocolSelect('https://')}
                                        >
                                            https://
                                        </div>
                                        <div 
                                            className={`protocol-option ${protocol === 'http://' ? 'selected' : ''}`}
                                            onClick={() => handleProtocolSelect('http://')}
                                        >
                                            http://
                                        </div>
                                    </div>
                                )}
                            </div>
                            <input
                                type="text"
                                className="url-input-field"
                                placeholder="example.com"
                                value={baseUrl}
                                onChange={(e) => handleUrlChange(e.target.value)}
                            />
                        </div>
                        <div className="checkbox-container">
                            <label className="checkbox-label">
                                <input
                                    type="checkbox"
                                    checked={noBaseUrl}
                                    onChange={(e) => setNoBaseUrl(e.target.checked)}
                                />
                                <span className="checkbox-text">Без ссылки</span>
                            </label>
                        </div>
                    </div>
                </div>

                {/* Ряд 2: UTM поля */}
                <div className="utm-row">
                    <div className="utm-main-container">
                        <div className="utm-fields-container">
                            {/* Первый ряд: utm_source и utm_content */}
                            <div className="utm-fields-row">
                                <div className="utm-field">
                                    <div className="utm-field-container">
                                        <div className="utm-field-label">
                                            <span className="utm-icon">?</span>
                                            <span>utm_source</span>
                                        </div>
                                        <input
                                            type="text"
                                            className="utm-field-input"
                                            placeholder="google, yandex, facebook..."
                                            value={utmSource}
                                            onChange={(e) => setUtmSource(e.target.value)}
                                        />
                                    </div>
                                </div>
                                <div className="utm-field">
                                    <div className="utm-field-container">
                                        <div className="utm-field-label">
                                            <span className="utm-icon">?</span>
                                            <span>utm_content</span>
                                        </div>
                                        <input
                                            type="text"
                                            className="utm-field-input"
                                            placeholder="red, white, dark, big, small..."
                                            value={utmContent}
                                            onChange={(e) => setUtmContent(e.target.value)}
                                        />
                                    </div>
                                </div>
                            </div>

                            {/* Второй ряд: utm_medium и utm_term */}
                            <div className="utm-fields-row">
                                <div className="utm-field">
                                    <div className="utm-field-container">
                                        <div className="utm-field-label">
                                            <span className="utm-icon">?</span>
                                            <span>utm_medium</span>
                                        </div>
                                        <input
                                            type="text"
                                            className="utm-field-input"
                                            placeholder="cpc, email, social..."
                                            value={utmMedium}
                                            onChange={(e) => setUtmMedium(e.target.value)}
                                        />
                                    </div>
                                </div>
                                <div className="utm-field">
                                    <div className="utm-field-container">
                                        <div className="utm-field-label">
                                            <span className="utm-icon">?</span>
                                            <span>utm_term</span>
                                        </div>
                                        <input
                                            type="text"
                                            className="utm-field-input"
                                            placeholder="discount, free, webinar..."
                                            value={utmTerm}
                                            onChange={(e) => setUtmTerm(e.target.value)}
                                        />
                                    </div>
                                </div>
                            </div>

                            {/* Третий ряд: utm_campaign и чекбокс транслитерации */}
                            <div className="utm-fields-row">
                                <div className="utm-field">
                                    <div className="utm-field-container">
                                        <div className="utm-field-label">
                                            <span className="utm-icon">?</span>
                                            <span>utm_campaign</span>
                                        </div>
                                        <input
                                            type="text"
                                            className="utm-field-input"
                                            placeholder="sale, top, product..."
                                            value={utmCampaign}
                                            onChange={(e) => setUtmCampaign(e.target.value)}
                                        />
                                    </div>
                                </div>
                                <div className="utm-field">
                                    <div className="transliteration-checkbox-container">
                                        <label className="transliteration-checkbox-label">
                                            <input
                                                type="checkbox"
                                                checked={transliterate}
                                                onChange={(e) => setTransliterate(e.target.checked)}
                                            />
                                            <span className="checkbox-text">Транслитерация и оптимизация результата</span>
                                        </label>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Ряд 3: Кнопки */}
                <div className="utm-row">
                    <div className="control-buttons">
                        <button className="btn primary-btn" onClick={handleShowResult}>
                            Показать результат
                        </button>
                        <button className="btn secondary-btn" onClick={handleCopyResult}>
                            <img src="/icons/button_copy.svg" alt="" />
                            {copied ? 'Скопировано!' : 'Скопировать результат'}
                        </button>
                    </div>
                </div>

                {/* Ряд 4: Результат */}
                <div className="utm-row">
                    <div className="result-section">
                        <input
                            type="text"
                            className="result-input"
                            placeholder="Здесь будет результат"
                            value={result}
                            readOnly
                        />
                    </div>
                </div>
            </div>
        </div>
    );
};

export default UtmGeneratorTool;
