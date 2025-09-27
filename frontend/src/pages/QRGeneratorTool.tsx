import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';
import QRCode from 'qrcode';
import { useAuthRequired } from '../hooks/useAuthRequired';
import { useToolWithCoins } from '../hooks/useToolWithCoins';
import './QRGeneratorTool.css';

const TOOL_ID = 'qr-generator';

interface QRFormData {
    type: 'url' | 'text' | 'email' | 'phone' | 'wifi' | 'vcard' | 'sms';
    content: string;
    // Для разных типов
    email?: string;
    phone?: string;
    wifiSSID?: string;
    wifiPassword?: string;
    wifiSecurity?: 'WPA' | 'WEP' | 'nopass';
    // vCard данные
    vcardName?: string;
    vcardPhone?: string;
    vcardEmail?: string;
    vcardOrg?: string;
    // SMS
    smsPhone?: string;
    smsMessage?: string;
    // Кастомизация
    foregroundColor: string;
    backgroundColor: string;
    size: number;
    format: 'png' | 'svg';
}

const QRGeneratorTool: React.FC = () => {
    const { t } = useTranslation();
    const { requireAuth } = useAuthRequired();
    const { executeWithCoins } = useToolWithCoins(TOOL_ID);
    
    const [isGenerating, setIsGenerating] = useState(false);
    const [qrDataUrl, setQrDataUrl] = useState<string>('');
    const [qrSvg, setQrSvg] = useState<string>('');
    const [launchCount, setLaunchCount] = useState(0);

    const [formData, setFormData] = useState<QRFormData>({
        type: 'url',
        content: '',
        foregroundColor: '#000000',
        backgroundColor: '#ffffff',
        size: 300,
        format: 'png'
    });

    const [errors, setErrors] = useState<Record<string, string>>({});

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

    const handleInputChange = (field: keyof QRFormData, value: any) => {
        setFormData(prev => ({ ...prev, [field]: value }));
        // Очищаем ошибку при изменении поля
        if (errors[field]) {
            setErrors(prev => ({ ...prev, [field]: '' }));
        }
    };

    const validateForm = (): boolean => {
        const newErrors: Record<string, string> = {};

        // Валидация в зависимости от типа
        switch (formData.type) {
            case 'url':
                if (!formData.content.trim()) {
                    newErrors.content = t('qrGenerator.validation.urlRequired');
                } else if (!/^https?:\/\/.+/.test(formData.content)) {
                    newErrors.content = t('qrGenerator.validation.urlInvalid');
                }
                break;
            case 'text':
                if (!formData.content.trim()) {
                    newErrors.content = t('qrGenerator.validation.textRequired');
                }
                break;
            case 'email':
                if (!formData.email?.trim()) {
                    newErrors.email = t('qrGenerator.validation.emailRequired');
                } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
                    newErrors.email = t('qrGenerator.validation.emailInvalid');
                }
                break;
            case 'phone':
                if (!formData.phone?.trim()) {
                    newErrors.phone = t('qrGenerator.validation.phoneRequired');
                }
                break;
            case 'wifi':
                if (!formData.wifiSSID?.trim()) {
                    newErrors.wifiSSID = t('qrGenerator.validation.wifiSSIDRequired');
                }
                if (formData.wifiSecurity !== 'nopass' && !formData.wifiPassword?.trim()) {
                    newErrors.wifiPassword = t('qrGenerator.validation.wifiPasswordRequired');
                }
                break;
            case 'vcard':
                if (!formData.vcardName?.trim()) {
                    newErrors.vcardName = t('qrGenerator.validation.vcardNameRequired');
                }
                break;
            case 'sms':
                if (!formData.smsPhone?.trim()) {
                    newErrors.smsPhone = t('qrGenerator.validation.smsPhoneRequired');
                }
                break;
        }

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const generateQRContent = (): string => {
        switch (formData.type) {
            case 'url':
            case 'text':
                return formData.content;
            case 'email':
                return `mailto:${formData.email}`;
            case 'phone':
                return `tel:${formData.phone}`;
            case 'wifi':
                return `WIFI:T:${formData.wifiSecurity};S:${formData.wifiSSID};P:${formData.wifiPassword || ''};H:false;;`;
            case 'vcard':
                return `BEGIN:VCARD\nVERSION:3.0\nFN:${formData.vcardName}\n${formData.vcardPhone ? `TEL:${formData.vcardPhone}\n` : ''}${formData.vcardEmail ? `EMAIL:${formData.vcardEmail}\n` : ''}${formData.vcardOrg ? `ORG:${formData.vcardOrg}\n` : ''}END:VCARD`;
            case 'sms':
                return `sms:${formData.smsPhone}${formData.smsMessage ? `?body=${encodeURIComponent(formData.smsMessage)}` : ''}`;
            default:
                return formData.content;
        }
    };

    const generateQR = async () => {
        if (!validateForm()) return;

        // Проверяем авторизацию
        if (!requireAuth()) {
            return;
        }

        setIsGenerating(true);

        // Генерация с списанием коинов
        const coinResult = await executeWithCoins(async () => {
            // Сразу обновляем счетчик в UI (оптимистично)
            setLaunchCount(prev => prev + 1);
            
            const content = generateQRContent();
            
            let result = {};
            
            if (formData.format === 'png') {
                const dataUrl = await QRCode.toDataURL(content, {
                    width: formData.size,
                    margin: 2,
                    color: {
                        dark: formData.foregroundColor,
                        light: formData.backgroundColor
                    }
                });
                result = { type: 'png', data: dataUrl };
            } else {
                const svg = await QRCode.toString(content, {
                    type: 'svg',
                    width: formData.size,
                    margin: 2,
                    color: {
                        dark: formData.foregroundColor,
                        light: formData.backgroundColor
                    }
                });
                result = { type: 'svg', data: svg };
            }
            
            return result;
        }, {
            inputLength: generateQRContent().length,
            outputLength: 1
        });

        if (coinResult.success) {
            const result = coinResult.result as { type: string; data: string };
            
            if (result.type === 'png') {
                setQrDataUrl(result.data);
                setQrSvg('');
            } else {
                setQrSvg(result.data);
                setQrDataUrl('');
            }
            
            // Синхронизируем с реальным значением от сервера  
            if (coinResult.newLaunchCount) {
                setLaunchCount(coinResult.newLaunchCount);
            }
            
            console.log('QR code generated successfully with coin deduction');
        } else {
            // Откатываем счетчик в случае ошибки
            setLaunchCount(prev => prev - 1);
            console.error('Ошибка генерации QR-кода:', coinResult.error);
        }
        
        setIsGenerating(false);
    };

    const downloadQR = () => {
        if (formData.format === 'png' && qrDataUrl) {
            const link = document.createElement('a');
            link.download = `qr-code-${Date.now()}.png`;
            link.href = qrDataUrl;
            link.click();
        } else if (formData.format === 'svg' && qrSvg) {
            const blob = new Blob([qrSvg], { type: 'image/svg+xml' });
            const url = URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.download = `qr-code-${Date.now()}.svg`;
            link.href = url;
            link.click();
            URL.revokeObjectURL(url);
        }
    };

    const isFormValid = (): boolean => {
        const content = generateQRContent();
        return content.trim().length > 0;
    };



    const renderContentFields = () => {
        switch (formData.type) {
            case 'url':
                return (
                    <div className="form-group">
                        <label>{t('qrGenerator.form.url')} *</label>
                        <input
                            type="url"
                            value={formData.content}
                            onChange={(e) => handleInputChange('content', e.target.value)}
                            placeholder={t('qrGenerator.form.urlPlaceholder')}
                            className={`form-input ${errors.content ? 'error' : ''}`}
                        />
                        {errors.content && <span className="error-text">{errors.content}</span>}
                    </div>
                );
            case 'text':
                return (
                    <div className="form-group">
                        <label>{t('qrGenerator.form.text')} *</label>
                        <textarea
                            value={formData.content}
                            onChange={(e) => handleInputChange('content', e.target.value)}
                            placeholder={t('qrGenerator.form.textPlaceholder')}
                            className={`form-input ${errors.content ? 'error' : ''}`}
                            rows={3}
                        />
                        {errors.content && <span className="error-text">{errors.content}</span>}
                    </div>
                );
            case 'email':
                return (
                    <div className="form-group">
                        <label>{t('qrGenerator.form.email')} *</label>
                        <input
                            type="email"
                            value={formData.email || ''}
                            onChange={(e) => handleInputChange('email', e.target.value)}
                            placeholder={t('qrGenerator.form.emailPlaceholder')}
                            className={`form-input ${errors.email ? 'error' : ''}`}
                        />
                        {errors.email && <span className="error-text">{errors.email}</span>}
                    </div>
                );
            case 'phone':
                return (
                    <div className="form-group">
                        <label>{t('qrGenerator.form.phone')} *</label>
                        <input
                            type="tel"
                            value={formData.phone || ''}
                            onChange={(e) => handleInputChange('phone', e.target.value)}
                            placeholder={t('qrGenerator.form.phonePlaceholder')}
                            className={`form-input ${errors.phone ? 'error' : ''}`}
                        />
                        {errors.phone && <span className="error-text">{errors.phone}</span>}
                    </div>
                );
            case 'wifi':
                return (
                    <>
                        <div className="form-group">
                            <label>{t('qrGenerator.form.wifiSSID')} *</label>
                            <input
                                type="text"
                                value={formData.wifiSSID || ''}
                                onChange={(e) => handleInputChange('wifiSSID', e.target.value)}
                                placeholder={t('qrGenerator.form.wifiSSIDPlaceholder')}
                                className={`form-input ${errors.wifiSSID ? 'error' : ''}`}
                            />
                            {errors.wifiSSID && <span className="error-text">{errors.wifiSSID}</span>}
                        </div>
                        <div className="form-group">
                            <label>{t('qrGenerator.form.wifiSecurity')}</label>
                            <select
                                value={formData.wifiSecurity || 'WPA'}
                                onChange={(e) => handleInputChange('wifiSecurity', e.target.value)}
                                className="form-input"
                            >
                                <option value="WPA">WPA/WPA2</option>
                                <option value="WEP">WEP</option>
                                <option value="nopass">{t('qrGenerator.form.wifiNoPassword')}</option>
                            </select>
                        </div>
                        {formData.wifiSecurity !== 'nopass' && (
                            <div className="form-group">
                                <label>{t('qrGenerator.form.wifiPassword')} *</label>
                                <input
                                    type="password"
                                    value={formData.wifiPassword || ''}
                                    onChange={(e) => handleInputChange('wifiPassword', e.target.value)}
                                    placeholder={t('qrGenerator.form.wifiPasswordPlaceholder')}
                                    className={`form-input ${errors.wifiPassword ? 'error' : ''}`}
                                />
                                {errors.wifiPassword && <span className="error-text">{errors.wifiPassword}</span>}
                            </div>
                        )}
                    </>
                );
            case 'vcard':
                return (
                    <>
                        <div className="form-group">
                            <label>{t('qrGenerator.form.vcardName')} *</label>
                            <input
                                type="text"
                                value={formData.vcardName || ''}
                                onChange={(e) => handleInputChange('vcardName', e.target.value)}
                                placeholder={t('qrGenerator.form.vcardNamePlaceholder')}
                                className={`form-input ${errors.vcardName ? 'error' : ''}`}
                            />
                            {errors.vcardName && <span className="error-text">{errors.vcardName}</span>}
                        </div>
                        <div className="form-group">
                            <label>{t('qrGenerator.form.vcardPhone')}</label>
                            <input
                                type="tel"
                                value={formData.vcardPhone || ''}
                                onChange={(e) => handleInputChange('vcardPhone', e.target.value)}
                                placeholder={t('qrGenerator.form.vcardPhonePlaceholder')}
                                className="form-input"
                            />
                        </div>
                        <div className="form-group">
                            <label>{t('qrGenerator.form.vcardEmail')}</label>
                            <input
                                type="email"
                                value={formData.vcardEmail || ''}
                                onChange={(e) => handleInputChange('vcardEmail', e.target.value)}
                                placeholder={t('qrGenerator.form.vcardEmailPlaceholder')}
                                className="form-input"
                            />
                        </div>
                        <div className="form-group">
                            <label>{t('qrGenerator.form.vcardOrg')}</label>
                            <input
                                type="text"
                                value={formData.vcardOrg || ''}
                                onChange={(e) => handleInputChange('vcardOrg', e.target.value)}
                                placeholder={t('qrGenerator.form.vcardOrgPlaceholder')}
                                className="form-input"
                            />
                        </div>
                    </>
                );
            case 'sms':
                return (
                    <>
                        <div className="form-group">
                            <label>{t('qrGenerator.form.smsPhone')} *</label>
                            <input
                                type="tel"
                                value={formData.smsPhone || ''}
                                onChange={(e) => handleInputChange('smsPhone', e.target.value)}
                                placeholder={t('qrGenerator.form.smsPhonePlaceholder')}
                                className={`form-input ${errors.smsPhone ? 'error' : ''}`}
                            />
                            {errors.smsPhone && <span className="error-text">{errors.smsPhone}</span>}
                        </div>
                        <div className="form-group">
                            <label>{t('qrGenerator.form.smsMessage')}</label>
                            <textarea
                                value={formData.smsMessage || ''}
                                onChange={(e) => handleInputChange('smsMessage', e.target.value)}
                                placeholder={t('qrGenerator.form.smsMessagePlaceholder')}
                                className="form-input"
                                rows={2}
                            />
                        </div>
                    </>
                );
            default:
                return null;
        }
    };

    return (
        <div className="qr-generator-tool">
            {/* Header инструмента */}
            <div className="tool-header-island">
                <Link to="/" className="back-button">
                    <img src="/icons/arrow_left.svg" alt="" />
                    Все инструменты
                </Link>
                <h1 className="tool-title">{t('qrGenerator.title')}</h1>
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
                <div className="workspace-content">
                    <div className="form-and-preview">
                        {/* Форма настроек */}
                        <div className="form-section">
                            <h3>{t('qrGenerator.form.content')}</h3>
                            
                            <div className="form-group">
                                <label>{t('qrGenerator.form.type')}</label>
                                <select
                                    value={formData.type}
                                    onChange={(e) => handleInputChange('type', e.target.value)}
                                    className="form-input"
                                >
                                    <option value="url">{t('qrGenerator.form.typeOptions.url')}</option>
                                    <option value="text">{t('qrGenerator.form.typeOptions.text')}</option>
                                    <option value="email">{t('qrGenerator.form.typeOptions.email')}</option>
                                    <option value="phone">{t('qrGenerator.form.typeOptions.phone')}</option>
                                    <option value="wifi">{t('qrGenerator.form.typeOptions.wifi')}</option>
                                    <option value="vcard">{t('qrGenerator.form.typeOptions.vcard')}</option>
                                    <option value="sms">{t('qrGenerator.form.typeOptions.sms')}</option>
                                </select>
                            </div>

                            {renderContentFields()}

                            <h3>{t('qrGenerator.form.customization')}</h3>
                            
                            <div className="form-grid">
                                <div className="form-group">
                                    <label>{t('qrGenerator.form.foregroundColor')}</label>
                                    <input
                                        type="color"
                                        value={formData.foregroundColor}
                                        onChange={(e) => handleInputChange('foregroundColor', e.target.value)}
                                        className="form-input color-input"
                                    />
                                </div>

                                <div className="form-group">
                                    <label>{t('qrGenerator.form.backgroundColor')}</label>
                                    <input
                                        type="color"
                                        value={formData.backgroundColor}
                                        onChange={(e) => handleInputChange('backgroundColor', e.target.value)}
                                        className="form-input color-input"
                                    />
                                </div>

                                <div className="form-group">
                                    <label>{t('qrGenerator.form.size')}</label>
                                    <select
                                        value={formData.size}
                                        onChange={(e) => handleInputChange('size', parseInt(e.target.value))}
                                        className="form-input"
                                    >
                                        <option value={200}>200x200</option>
                                        <option value={300}>300x300</option>
                                        <option value={400}>400x400</option>
                                        <option value={500}>500x500</option>
                                        <option value={800}>800x800</option>
                                        <option value={1000}>1000x1000</option>
                                        <option value={2000}>2000x2000</option>
                                    </select>
                                </div>

                                <div className="form-group">
                                    <label>{t('qrGenerator.form.format')}</label>
                                    <select
                                        value={formData.format}
                                        onChange={(e) => handleInputChange('format', e.target.value)}
                                        className="form-input"
                                    >
                                        <option value="png">PNG</option>
                                        <option value="svg">SVG</option>
                                    </select>
                                </div>
                            </div>
                        </div>

                        {/* Превью QR-кода */}
                        <div className="preview-section">
                            <h3>{t('qrGenerator.preview.title')}</h3>
                            <div className="qr-preview">
                                {qrDataUrl && (
                                    <img 
                                        src={qrDataUrl} 
                                        alt="QR Code"
                                        className="qr-image"
                                    />
                                )}
                                {qrSvg && (
                                    <div 
                                        className="qr-svg"
                                        dangerouslySetInnerHTML={{ __html: qrSvg }}
                                    />
                                )}
                                {!qrDataUrl && !qrSvg && (
                                    <div className="qr-placeholder">
                                        <p>{t('qrGenerator.preview.placeholder')}</p>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Кнопки управления */}
            <div className="control-buttons">
                <button 
                    className="action-btn"
                    onClick={() => generateQR()}
                    disabled={isGenerating || !isFormValid()}
                >
                    {isGenerating ? (
                        <>
                            <span className="loading-spinner"></span>
                            {t('qrGenerator.generating')}
                        </>
                    ) : (
                        t('qrGenerator.generate')
                    )}
                </button>
                <button 
                    className="action-btn primary"
                    onClick={downloadQR}
                    disabled={!qrDataUrl && !qrSvg}
                >
                    {t('qrGenerator.download')} {formData.format.toUpperCase()}
                </button>
            </div>
        </div>
    );
};

export default QRGeneratorTool;