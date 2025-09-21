import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import '../styles/tool-pages.css';
import './UtmGeneratorTool.css';
import { statsService } from '../utils/statsService';


const TOOL_ID = 'utm-generator';
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
    const [otherSources, setOtherSources] = useState(false);
    const [selectedSource, setSelectedSource] = useState('custom');
    const [result, setResult] = useState('');
    const [copied, setCopied] = useState(false);
    const [launchCount, setLaunchCount] = useState(0);

    // Структура источников трафика
    const trafficSources = {
        custom: {
            name: 'Свои значения',
            utm_source: '',
            utm_medium: '',
            utm_campaign: '',
            utm_content: '',
            utm_term: ''
        },
        google_ads: {
            name: 'Google ADS',
            utm_source: 'google',
            utm_medium: 'cpc',
            utm_campaign: 'google_ads_campaign',
            utm_content: 'google_ad',
            utm_term: 'keyword'
        },
        esputnik_email: {
            name: 'eSputnik Email',
            utm_source: 'esputnik',
            utm_medium: 'email',
            utm_campaign: 'email_campaign',
            utm_content: 'newsletter',
            utm_term: ''
        },
        tiktok: {
            name: 'Tik-Tok',
            utm_source: 'tiktok',
            utm_medium: 'social',
            utm_campaign: 'tiktok_campaign',
            utm_content: 'video_ad',
            utm_term: ''
        },
        facebook: {
            name: 'Facebook',
            utm_source: 'facebook',
            utm_medium: 'social',
            utm_campaign: 'facebook_campaign',
            utm_content: 'post',
            utm_term: ''
        },
        instagram: {
            name: 'Instagram',
            utm_source: 'instagram',
            utm_medium: 'social',
            utm_campaign: 'instagram_campaign',
            utm_content: 'story',
            utm_term: ''
        },
        telegram: {
            name: 'Telegram',
            utm_source: 'telegram',
            utm_medium: 'messenger',
            utm_campaign: 'telegram_campaign',
            utm_content: 'channel_post',
            utm_term: ''
        },
        viber: {
            name: 'Viber',
            utm_source: 'viber',
            utm_medium: 'messenger',
            utm_campaign: 'viber_campaign',
            utm_content: 'message',
            utm_term: ''
        }
    };

    // Загрузка статистики при монтировании компонента
    useEffect(() => {
        statsService.getLaunchCount(TOOL_ID).then(setLaunchCount);
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
        // Таблица транслитерации кириллицы в латиницу
        const transliterationMap: { [key: string]: string } = {
            'а': 'a', 'б': 'b', 'в': 'v', 'г': 'g', 'д': 'd', 'е': 'e', 'ё': 'yo', 'ж': 'zh',
            'з': 'z', 'и': 'i', 'й': 'y', 'к': 'k', 'л': 'l', 'м': 'm', 'н': 'n', 'о': 'o',
            'п': 'p', 'р': 'r', 'с': 's', 'т': 't', 'у': 'u', 'ф': 'f', 'х': 'kh', 'ц': 'ts',
            'ч': 'ch', 'ш': 'sh', 'щ': 'shch', 'ъ': '', 'ы': 'y', 'ь': '', 'э': 'e', 'ю': 'yu', 'я': 'ya',
            'А': 'A', 'Б': 'B', 'В': 'V', 'Г': 'G', 'Д': 'D', 'Е': 'E', 'Ё': 'Yo', 'Ж': 'Zh',
            'З': 'Z', 'И': 'I', 'Й': 'Y', 'К': 'K', 'Л': 'L', 'М': 'M', 'Н': 'N', 'О': 'O',
            'П': 'P', 'Р': 'R', 'С': 'S', 'Т': 'T', 'У': 'U', 'Ф': 'F', 'Х': 'Kh', 'Ц': 'Ts',
            'Ч': 'Ch', 'Ш': 'Sh', 'Щ': 'Shch', 'Ъ': '', 'Ы': 'Y', 'Ь': '', 'Э': 'E', 'Ю': 'Yu', 'Я': 'Ya',
            // Украинские символы
            'і': 'i', 'ї': 'yi', 'є': 'ye', 'ґ': 'g',
            'І': 'I', 'Ї': 'Yi', 'Є': 'Ye', 'Ґ': 'G'
        };

        return text
            .trim() // убираем пробелы в начале и конце
            .split('') // разбиваем на символы
            .map(char => transliterationMap[char] || char) // транслитерируем кириллицу
            .join('') // собираем обратно
            .toLowerCase() // приводим к нижнему регистру
            .replace(/[''""«»„"]/g, '') // удаляем апострофы и кавычки (включая разные типы кавычек)
            .replace(/[^\w\s\-\/\.]/g, '') // удаляем все спецсимволы кроме букв, цифр, пробелов, дефисов, слешей и точек
            .replace(/\s+/g, '-') // заменяем все виды пробелов (в том числе множественные) на дефис
            .replace(/-+/g, '-') // заменяем множественные дефисы на один
            .replace(/\/+/g, '/') // заменяем множественные слеши на один
            .replace(/^-+|-+$/g, ''); // убираем дефисы в начале и конце
    };

    // Функция для заполнения UTM полей при выборе источника
    const handleSourceSelect = (sourceKey: string) => {
        setSelectedSource(sourceKey);
        
        if (sourceKey === 'custom') {
            // Очищаем поля при выборе "Свои значения"
            setUtmSource('');
            setUtmMedium('');
            setUtmCampaign('');
            setUtmContent('');
            setUtmTerm('');
        } else {
            // Заполняем UTM поля значениями из выбранного источника
            const sourceData = trafficSources[sourceKey as keyof typeof trafficSources];
            setUtmSource(sourceData.utm_source);
            setUtmMedium(sourceData.utm_medium);
            setUtmCampaign(sourceData.utm_campaign);
            setUtmContent(sourceData.utm_content);
            setUtmTerm(sourceData.utm_term);
        }
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

        const utmString = params.join('&');
        
        if (noBaseUrl) {
            // Только хвост UTM
            setResult('?' + utmString);
        } else {
            // Полная ссылка с протоколом
            let url = baseUrl.trim();
            if (!url) {
                url = 'example.com';
            }
            
            // Разделяем URL на основную часть и параметры
            const [baseUrlPart, existingParams] = url.split('?');
            
            // Применяем транслитерацию только к основной части URL
            const transliteratedBase = transliterate ? transliterateText(baseUrlPart) : baseUrlPart;
            
            // Собираем финальный URL
            let finalUrl = transliteratedBase;
            if (existingParams) {
                finalUrl += '?' + existingParams + '&' + params.join('&');
            } else {
                finalUrl += '?' + params.join('&');
            }
            
            setResult(protocol + finalUrl);
        }

        // Увеличиваем счетчик запусков
        const updateStats = async () => {
            try {
                const newCount = await statsService.incrementAndGetCount(TOOL_ID);
                setLaunchCount(newCount);
            } catch (error) {
                console.warn('Failed to update statistics:', error);
                const count = await statsService.getLaunchCount(TOOL_ID);
                setLaunchCount(count);
            }
        };
        updateStats();
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
                        {/* Переключатель "Другие источники" */}
                        <div className="other-sources-toggle">
                            <div className="other-sources-block">
                                <div className="toggle-container">
                                    <span className="toggle-label">Другие источники</span>
                                    <label className="toggle-switch">
                                        <input
                                            type="checkbox"
                                            checked={otherSources}
                                            onChange={(e) => setOtherSources(e.target.checked)}
                                        />
                                        <span className="toggle-slider"></span>
                                    </label>
                                </div>
                            </div>
                        </div>

                        {/* Радиокнопки источников трафика */}
                        {otherSources && (
                            <div className="traffic-sources-grid">
                                {Object.entries(trafficSources).map(([key, source]) => (
                                    <label key={key} className="radio-item">
                                        <input
                                            type="radio"
                                            name="trafficSource"
                                            value={key}
                                            checked={selectedSource === key}
                                            onChange={() => handleSourceSelect(key)}
                                        />
                                        <span>{source.name}</span>
                                    </label>
                                ))}
                            </div>
                        )}

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
                                            placeholder="google, instagram, facebook..."
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
                        <button className="btn secondary-btn btn-with-left-icon" onClick={handleCopyResult}>
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
