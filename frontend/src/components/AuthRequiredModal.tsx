import React, { useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import './AuthRequiredModal.css';

interface AuthRequiredModalProps {
  isOpen: boolean;
  onClose: () => void;
  onLoginClick: () => void;
}

const AuthRequiredModal: React.FC<AuthRequiredModalProps> = ({ 
  isOpen, 
  onClose, 
  onLoginClick 
}) => {
  const { t } = useTranslation();

  // Закрытие модала по Escape
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener('keydown', handleEscape);
      document.body.style.overflow = 'hidden';
    }

    return () => {
      document.removeEventListener('keydown', handleEscape);
      document.body.style.overflow = 'unset';
    };
  }, [isOpen, onClose]);

  const handleLoginClick = () => {
    onClose(); // Закрываем это модальное окно
    onLoginClick(); // Открываем окно авторизации
  };

  if (!isOpen) return null;

  return (
    <div className="auth-required-modal-overlay" onClick={onClose}>
      <div className="auth-required-modal" onClick={(e) => e.stopPropagation()}>
        <div className="auth-required-modal-content">
          {/* Иконка замка */}
          <div className="auth-required-icon">
            <svg width="64" height="64" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M18 8H17V6C17 3.24 14.76 1 12 1S7 3.24 7 6V8H6C4.9 8 4 8.9 4 10V20C4 21.1 4.9 22 6 22H18C19.1 22 20 21.1 20 20V10C20 8.9 19.1 8 18 8ZM9 6C9 4.34 10.34 3 12 3S15 4.34 15 6V8H9V6ZM18 20H6V10H18V20ZM12 17C13.1 17 14 16.1 14 15S13.1 13 12 13S10 13.9 10 15S10.9 17 12 17Z" fill="currentColor"/>
            </svg>
          </div>

          {/* Заголовок */}
          <h2 className="auth-required-title">
            {t('authRequired.title')}
          </h2>

          {/* Описание */}
          <p className="auth-required-description">
            {t('authRequired.description')}
          </p>

          {/* Преимущества авторизации */}
          <div className="auth-required-benefits">
            <div className="auth-required-benefit">
              <span className="auth-required-benefit-icon">✨</span>
              <span>{t('authRequired.benefit1')}</span>
            </div>
            <div className="auth-required-benefit">
              <span className="auth-required-benefit-icon">💾</span>
              <span>{t('authRequired.benefit2')}</span>
            </div>
            <div className="auth-required-benefit">
              <span className="auth-required-benefit-icon">📊</span>
              <span>{t('authRequired.benefit3')}</span>
            </div>
          </div>

          {/* Кнопки */}
          <div className="auth-required-actions">
            <button 
              className="auth-required-login-btn"
              onClick={handleLoginClick}
            >
              {t('authRequired.loginButton')}
            </button>
            <button 
              className="auth-required-cancel-btn"
              onClick={onClose}
            >
              {t('authRequired.cancelButton')}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AuthRequiredModal;