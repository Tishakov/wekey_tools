import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { statsService } from '../utils/statsService';
import { useLocalizedLink } from '../hooks/useLanguageFromUrl';
import { useAuthRequired } from '../hooks/useAuthRequired';
import AuthRequiredModal from '../components/AuthRequiredModal';
import AuthModal from '../components/AuthModal';
import '../styles/tool-pages.css';
import './PrivacyPolicyGeneratorTool.css';

const TOOL_ID = 'privacy-policy-generator';

interface FormData {
    companyName: string;
    legalAddress: string;
    phone: string;
    email: string;
    website: string;
    edrpou: string;
    director: string;
    serviceType: string;
    serviceDescription: string;
    documentType: string;
    collectsPersonalData: boolean;
    usesAnalytics: boolean;
    usesCookies: boolean;
    sendsEmails: boolean;
    sharesWithThirdParty: boolean;
}

const PrivacyPolicyGeneratorTool: React.FC = () => {
    const { t } = useTranslation();
    const { createLink } = useLocalizedLink();
    
    // Auth Required Hook
    const {
        isAuthRequiredModalOpen,
        isAuthModalOpen,
        requireAuth,
        closeAuthRequiredModal,
        closeAuthModal
    } = useAuthRequired();
    
    const [formData, setFormData] = useState<FormData>({
        companyName: '',
        legalAddress: '',
        phone: '',
        email: '',
        website: '',
        edrpou: '',
        director: '',
        serviceType: 'website',
        serviceDescription: '',
        documentType: 'both',
        collectsPersonalData: true,
        usesAnalytics: false,
        usesCookies: false,
        sendsEmails: false,
        sharesWithThirdParty: false
    });

    const [errors, setErrors] = useState<Partial<FormData>>({});
    const [isGenerating, setIsGenerating] = useState(false);
    const [result, setResult] = useState('');
    const [launchCount, setLaunchCount] = useState(0);
    const [copied, setCopied] = useState(false);

    useEffect(() => {
        statsService.getLaunchCount(TOOL_ID).then(setLaunchCount);
    }, []);

    const handleInputChange = (field: keyof FormData, value: string | boolean) => {
        setFormData(prev => ({ ...prev, [field]: value }));
        if (errors[field]) {
            setErrors(prev => ({ ...prev, [field]: undefined }));
        }
    };

    // Функция для проверки формы БЕЗ установки ошибок (для кнопки)
    const isFormValid = (): boolean => {
        return !!(
            formData.companyName.trim() &&
            formData.legalAddress.trim() &&
            formData.phone.trim() &&
            formData.email.trim() &&
            /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email) &&
            formData.website.trim() &&
            formData.edrpou.trim() &&
            formData.director.trim() &&
            formData.serviceDescription.trim()
        );
    };

    // Функция для валидации с установкой ошибок (для отправки формы)
    const validateForm = (): boolean => {
        const newErrors: Partial<FormData> = {};
        
        if (!formData.companyName.trim()) {
            newErrors.companyName = t('privacyPolicyGenerator.validation.companyNameRequired');
        }
        if (!formData.legalAddress.trim()) {
            newErrors.legalAddress = t('privacyPolicyGenerator.validation.legalAddressRequired');
        }
        if (!formData.phone.trim()) {
            newErrors.phone = t('privacyPolicyGenerator.validation.phoneRequired');
        }
        if (!formData.email.trim()) {
            newErrors.email = t('privacyPolicyGenerator.validation.emailRequired');
        } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
            newErrors.email = t('privacyPolicyGenerator.validation.emailInvalid');
        }
        if (!formData.website.trim()) {
            newErrors.website = t('privacyPolicyGenerator.validation.websiteRequired');
        }
        if (!formData.edrpou.trim()) {
            newErrors.edrpou = t('privacyPolicyGenerator.validation.edrpouRequired');
        }
        if (!formData.director.trim()) {
            newErrors.director = t('privacyPolicyGenerator.validation.directorRequired');
        }
        if (!formData.serviceDescription.trim()) {
            newErrors.serviceDescription = t('privacyPolicyGenerator.validation.serviceDescriptionRequired');
        }

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const generateDocument = (data: FormData, type: 'privacy' | 'offer'): string => {
        const currentDate = new Date().toLocaleDateString('uk-UA');
        
        if (type === 'privacy') {
            return `ПОЛІТИКА КОНФІДЕНЦІЙНОСТІ

Остання оновлення: ${currentDate}

1. ЗАГАЛЬНІ ПОЛОЖЕННЯ
1.1. Ця Політика конфіденційності визначає порядок обробки персональних даних користувачів веб-сайту ${data.website}, що належить ${data.companyName} (код ЄДРПОУ: ${data.edrpou}), за адресою: ${data.legalAddress}.

2. ВИДИ ПЕРСОНАЛЬНИХ ДАНИХ
${data.collectsPersonalData ? '- Контактна інформація (ім\'я, email, телефон)\n' : ''}
${data.usesAnalytics ? '- Дані аналітики та використання сайту\n' : ''}
${data.usesCookies ? '- Cookies та аналогічні технології\n' : ''}

3. ЦІЛІ ОБРОБКИ
- Надання послуг: ${data.serviceDescription}
- Покращення якості сервісу
${data.sendsEmails ? '- Інформування про новини та пропозиції\n' : ''}

4. ПЕРЕДАЧА ТРЕТІМ ОСОБАМ
${data.sharesWithThirdParty ? 
'Компанія може передавати дані третім особам у випадках, передбачених законодавством.' :
'Компанія не передає персональні дані третім особам.'}

КОНТАКТНА ІНФОРМАЦІЯ:
${data.companyName}
Адреса: ${data.legalAddress}
Телефон: ${data.phone}
Email: ${data.email}
Директор: ${data.director}`;
        } else {
            return `ПУБЛІЧНА ОФЕРТА

Остання оновлення: ${currentDate}

1. ЗАГАЛЬНІ ПОЛОЖЕННЯ
1.1. Цей документ є публічною офертою ${data.companyName} (код ЄДРПОУ: ${data.edrpou}), що знаходиться за адресою: ${data.legalAddress}, на надання послуг через веб-сайт ${data.website}.

2. ПРЕДМЕТ ДОГОВОРУ
2.1. Виконавець надає Замовнику послуги: ${data.serviceDescription}

3. АКЦЕПТ ОФЕРТИ
3.1. Прийняттям оферти є:
- Реєстрація на сайті
- Початок використання послуг
- Інші дії, що свідчать про згоду

4. ПРАВА ТА ОБОВ'ЯЗКИ
4.1. Виконавець зобов'язується надавати послуги якісно та в повному обсязі.
4.2. Замовник зобов'язується надавати достовірну інформацію.

5. ВАРТІСТЬ
5.1. Базові послуги надаються безкоштовно.

КОНТАКТНА ІНФОРМАЦІЯ ВИКОНАВЦЯ:
${data.companyName}
Код ЄДРПОУ: ${data.edrpou}
Адреса: ${data.legalAddress}
Телефон: ${data.phone}
Email: ${data.email}
Директор: ${data.director}`;
        }
    };

    const handleGenerate = async () => {
        if (!requireAuth()) return;
        
        if (!validateForm()) return;

        setIsGenerating(true);
        
        try {
            let documents = '';
            
            if (formData.documentType === 'privacy' || formData.documentType === 'both') {
                documents += generateDocument(formData, 'privacy');
            }
            
            if (formData.documentType === 'offer' || formData.documentType === 'both') {
                if (documents) documents += '\n\n' + '='.repeat(50) + '\n\n';
                documents += generateDocument(formData, 'offer');
            }
            
            setResult(documents);
            await statsService.incrementLaunchCount(TOOL_ID);
            setLaunchCount(prev => prev + 1);
            
        } catch (error) {
            console.error('Error generating documents:', error);
        } finally {
            setIsGenerating(false);
        }
    };

    const copyToClipboard = () => {
        navigator.clipboard.writeText(result).then(() => {
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
        });
    };

    const downloadDocument = () => {
        const blob = new Blob([result], { type: 'text/plain;charset=utf-8' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = 'legal-documents.txt';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
    };

    return (
        <div className="privacy-policy-generator-tool">
            {/* Header инструмента */}
            <div className="tool-header-island">
                <Link to={createLink('')} className="back-button">
                    <img src="/icons/arrow_left.svg" alt="" />
                    {t('common.backToTools')}
                </Link>
                <h1 className="tool-title">{t('privacyPolicyGenerator.title')}</h1>
                <div className="tool-header-buttons">
                    <button className="tool-header-btn counter-btn" title={t('common.launchCounter')}>
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
                <div className="settings-section">
                    <div className="form-container">
                        <div className="form-section">
                            <h3>{t('privacyPolicyGenerator.form.companyInfo')}</h3>
                            
                            <div className="form-grid">
                                <div className="form-group">
                                    <label>{t('privacyPolicyGenerator.form.companyName')} *</label>
                                    <input
                                        type="text"
                                        value={formData.companyName}
                                        onChange={(e) => handleInputChange('companyName', e.target.value)}
                                        placeholder={t('privacyPolicyGenerator.form.companyNamePlaceholder')}
                                        className={`form-input ${errors.companyName ? 'error' : ''}`}
                                    />
                                    {errors.companyName && <span className="error-text">{errors.companyName}</span>}
                                </div>

                                <div className="form-group">
                                    <label>{t('privacyPolicyGenerator.form.edrpou')} *</label>
                                    <input
                                        type="text"
                                        value={formData.edrpou}
                                        onChange={(e) => handleInputChange('edrpou', e.target.value)}
                                        placeholder={t('privacyPolicyGenerator.form.edrpouPlaceholder')}
                                        className={`form-input ${errors.edrpou ? 'error' : ''}`}
                                    />
                                    {errors.edrpou && <span className="error-text">{errors.edrpou}</span>}
                                </div>

                                <div className="form-group form-group-full">
                                    <label>{t('privacyPolicyGenerator.form.legalAddress')} *</label>
                                    <input
                                        type="text"
                                        value={formData.legalAddress}
                                        onChange={(e) => handleInputChange('legalAddress', e.target.value)}
                                        placeholder={t('privacyPolicyGenerator.form.legalAddressPlaceholder')}
                                        className={`form-input ${errors.legalAddress ? 'error' : ''}`}
                                    />
                                    {errors.legalAddress && <span className="error-text">{errors.legalAddress}</span>}
                                </div>

                                <div className="form-group">
                                    <label>{t('privacyPolicyGenerator.form.director')} *</label>
                                    <input
                                        type="text"
                                        value={formData.director}
                                        onChange={(e) => handleInputChange('director', e.target.value)}
                                        placeholder={t('privacyPolicyGenerator.form.directorPlaceholder')}
                                        className={`form-input ${errors.director ? 'error' : ''}`}
                                    />
                                    {errors.director && <span className="error-text">{errors.director}</span>}
                                </div>

                                <div className="form-group">
                                    <label>{t('privacyPolicyGenerator.form.phone')} *</label>
                                    <input
                                        type="tel"
                                        value={formData.phone}
                                        onChange={(e) => handleInputChange('phone', e.target.value)}
                                        placeholder={t('privacyPolicyGenerator.form.phonePlaceholder')}
                                        className={`form-input ${errors.phone ? 'error' : ''}`}
                                    />
                                    {errors.phone && <span className="error-text">{errors.phone}</span>}
                                </div>

                                <div className="form-group">
                                    <label>{t('privacyPolicyGenerator.form.email')} *</label>
                                    <input
                                        type="email"
                                        value={formData.email}
                                        onChange={(e) => handleInputChange('email', e.target.value)}
                                        placeholder={t('privacyPolicyGenerator.form.emailPlaceholder')}
                                        className={`form-input ${errors.email ? 'error' : ''}`}
                                    />
                                    {errors.email && <span className="error-text">{errors.email}</span>}
                                </div>

                                <div className="form-group">
                                    <label>{t('privacyPolicyGenerator.form.website')} *</label>
                                    <input
                                        type="url"
                                        value={formData.website}
                                        onChange={(e) => handleInputChange('website', e.target.value)}
                                        placeholder={t('privacyPolicyGenerator.form.websitePlaceholder')}
                                        className={`form-input ${errors.website ? 'error' : ''}`}
                                    />
                                    {errors.website && <span className="error-text">{errors.website}</span>}
                                </div>
                            </div>
                        </div>

                        <div className="form-section">
                            <div className="form-group">
                                <label>{t('privacyPolicyGenerator.form.serviceType')}</label>
                                <select
                                    value={formData.serviceType}
                                    onChange={(e) => handleInputChange('serviceType', e.target.value)}
                                    className="form-input"
                                >
                                    <option value="website">{t('privacyPolicyGenerator.form.serviceTypeOptions.website')}</option>
                                    <option value="ecommerce">{t('privacyPolicyGenerator.form.serviceTypeOptions.ecommerce')}</option>
                                    <option value="service">{t('privacyPolicyGenerator.form.serviceTypeOptions.service')}</option>
                                    <option value="consulting">{t('privacyPolicyGenerator.form.serviceTypeOptions.consulting')}</option>
                                    <option value="education">{t('privacyPolicyGenerator.form.serviceTypeOptions.education')}</option>
                                    <option value="other">{t('privacyPolicyGenerator.form.serviceTypeOptions.other')}</option>
                                </select>
                            </div>

                            <div className="form-group">
                                <label>{t('privacyPolicyGenerator.form.serviceDescription')} *</label>
                                <textarea
                                    value={formData.serviceDescription}
                                    onChange={(e) => handleInputChange('serviceDescription', e.target.value)}
                                    placeholder={t('privacyPolicyGenerator.form.serviceDescriptionPlaceholder')}
                                    rows={4}
                                    className={`form-input ${errors.serviceDescription ? 'error' : ''}`}
                                />
                                {errors.serviceDescription && <span className="error-text">{errors.serviceDescription}</span>}
                            </div>

                            <div className="form-group">
                                <label>{t('privacyPolicyGenerator.form.documentType')}</label>
                                <select
                                    value={formData.documentType}
                                    onChange={(e) => handleInputChange('documentType', e.target.value)}
                                    className="form-input"
                                >
                                    <option value="privacy">{t('privacyPolicyGenerator.form.documentTypeOptions.privacy')}</option>
                                    <option value="offer">{t('privacyPolicyGenerator.form.documentTypeOptions.offer')}</option>
                                    <option value="both">{t('privacyPolicyGenerator.form.documentTypeOptions.both')}</option>
                                </select>
                            </div>
                        </div>

                        <div className="form-section">
                            <h3>{t('privacyPolicyGenerator.form.dataProcessing')}</h3>
                            
                            <div className="checkbox-grid">
                                <label className="checkbox-item">
                                    <input
                                        type="checkbox"
                                        checked={formData.collectsPersonalData}
                                        onChange={(e) => handleInputChange('collectsPersonalData', e.target.checked)}
                                    />
                                    <span className="checkbox-text">{t('privacyPolicyGenerator.form.collectsPersonalData')}</span>
                                </label>

                                <label className="checkbox-item">
                                    <input
                                        type="checkbox"
                                        checked={formData.usesAnalytics}
                                        onChange={(e) => handleInputChange('usesAnalytics', e.target.checked)}
                                    />
                                    <span className="checkbox-text">{t('privacyPolicyGenerator.form.usesAnalytics')}</span>
                                </label>

                                <label className="checkbox-item">
                                    <input
                                        type="checkbox"
                                        checked={formData.usesCookies}
                                        onChange={(e) => handleInputChange('usesCookies', e.target.checked)}
                                    />
                                    <span className="checkbox-text">{t('privacyPolicyGenerator.form.usesCookies')}</span>
                                </label>

                                <label className="checkbox-item">
                                    <input
                                        type="checkbox"
                                        checked={formData.sendsEmails}
                                        onChange={(e) => handleInputChange('sendsEmails', e.target.checked)}
                                    />
                                    <span className="checkbox-text">{t('privacyPolicyGenerator.form.sendsEmails')}</span>
                                </label>

                                <label className="checkbox-item">
                                    <input
                                        type="checkbox"
                                        checked={formData.sharesWithThirdParty}
                                        onChange={(e) => handleInputChange('sharesWithThirdParty', e.target.checked)}
                                    />
                                    <span className="checkbox-text">{t('privacyPolicyGenerator.form.sharesWithThirdParty')}</span>
                                </label>
                            </div>
                        </div>

                    </div>
                </div>
            </div>

            {/* Кнопки управления */}
            <div className="control-buttons">
                <button 
                    className="action-btn primary"
                    onClick={handleGenerate}
                    disabled={isGenerating}
                >
                    {isGenerating ? t('privacyPolicyGenerator.form.generating') : t('privacyPolicyGenerator.form.generate')}
                </button>
            </div>

            {/* Секция результатов */}
            {result && (
                <div className="results-section">
                    <div className="results-workspace">
                        <div className="result-container">
                            <div className="result-header">
                                <h3>{t('common.result')}</h3>
                                <div className="result-actions">
                                    <button onClick={copyToClipboard} className="copy-button">
                                        {copied ? t('common.copied') : t('common.copy')}
                                    </button>
                                    <button onClick={downloadDocument} className="download-button">
                                        {t('common.download')}
                                    </button>
                                </div>
                            </div>
                            <div className="result-content">
                                <pre>{result}</pre>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* SEO секция */}
            <div className="seo-section">
                <div className="seo-content">
                    <div className="seo-item">
                        <h3>{t('privacyPolicyGenerator.tips.title')}</h3>
                        <ul>
                            <li>{t('privacyPolicyGenerator.tips.tip1')}</li>
                            <li>{t('privacyPolicyGenerator.tips.tip2')}</li>
                            <li>{t('privacyPolicyGenerator.tips.tip3')}</li>
                            <li>{t('privacyPolicyGenerator.tips.tip4')}</li>
                            <li>{t('privacyPolicyGenerator.tips.tip5')}</li>
                        </ul>
                    </div>
                </div>
            </div>

            <AuthRequiredModal
                isOpen={isAuthRequiredModalOpen}
                onClose={closeAuthRequiredModal}
                onLoginClick={() => {}}
            />

            <AuthModal
                isOpen={isAuthModalOpen}
                onClose={closeAuthModal}
            />
        </div>
    );
};

export default PrivacyPolicyGeneratorTool;