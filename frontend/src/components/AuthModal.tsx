import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../contexts/AuthContext';
import './AuthModal.css';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialMode?: 'login' | 'register';
}

const AuthModal: React.FC<AuthModalProps> = ({ 
  isOpen, 
  onClose, 
  initialMode = 'login' 
}) => {
  const { t } = useTranslation();
  const { login, register, isLoading } = useAuth();
  
  const [mode, setMode] = useState<'login' | 'register'>(initialMode);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showPasswordField, setShowPasswordField] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Сброс формы при закрытии модала
  useEffect(() => {
    if (!isOpen) {
      setEmail('');
      setPassword('');
      setFirstName('');
      setLastName('');
      setError('');
      setSuccess('');
      setShowPassword(false);
      setShowPasswordField(false);
    }
  }, [isOpen]);

  // Проверка валидности email и показ поля пароля
  useEffect(() => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    const isValidEmail = emailRegex.test(email);
    
    if (mode === 'login') {
      // Для входа показываем пароль только при валидном email
      setShowPasswordField(isValidEmail);
    } else {
      // Для регистрации показываем пароль всегда
      setShowPasswordField(true);
    }
  }, [email, mode]);

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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (!email) {
      setError(t('auth.errors.emailPasswordRequired'));
      return;
    }

    // Для входа: если поле пароля не показано, просто проверяем email и показываем пароль
    if (mode === 'login' && !showPasswordField) {
      return;
    }

    if (!password) {
      setError(t('auth.errors.emailPasswordRequired'));
      return;
    }

    try {
      if (mode === 'login') {
        await login(email, password);
        setSuccess(t('auth.success.loginSuccess'));
        setTimeout(() => {
          onClose();
        }, 1000);
      } else {
        await register(email, password, firstName, lastName);
        setSuccess(t('auth.success.registerSuccess'));
        setTimeout(() => {
          onClose();
        }, 1000);
      }
    } catch (error) {
      setError(error instanceof Error ? error.message : t('auth.errors.unknownError'));
    }
  };

  // Определяем текст кнопки в зависимости от состояния
  const getSubmitButtonText = () => {
    if (isLoading) {
      return (
        <span className="auth-loading">
          <span className="auth-spinner"></span>
          {t('common.loading')}
        </span>
      );
    }

    // Для регистрации всегда показываем кнопку регистрации
    if (mode === 'register') {
      return t('auth.registerButton');
    }

    // Для входа - сначала "Продолжить", потом "Войти"
    if (!showPasswordField) {
      return t('common.continue') || 'Продолжить';
    }

    return t('auth.loginButton');
  };

  const switchMode = () => {
    setMode(mode === 'login' ? 'register' : 'login');
    setError('');
    setSuccess('');
    // Пересчитываем показ поля пароля для нового режима
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    const isValidEmail = emailRegex.test(email);
    const newMode = mode === 'login' ? 'register' : 'login';
    
    if (newMode === 'login') {
      setShowPasswordField(isValidEmail);
    } else {
      // Для регистрации всегда показываем поле пароля
      setShowPasswordField(true);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="auth-modal-overlay" onClick={onClose}>
      <div className="auth-modal" onClick={(e) => e.stopPropagation()}>
        <div className="auth-modal-header">
          <h2 className="auth-modal-title">
            {mode === 'login' ? t('auth.loginTitle') : t('auth.registerTitle')}
          </h2>
        </div>

        {/* Google Auth кнопка сверху */}
        <div style={{ padding: '0 30px 20px' }}>
          <button 
            type="button" 
            className="auth-google-btn"
            disabled
            title={t('auth.googleComingSoon')}
          >
            <svg className="auth-google-icon" viewBox="0 0 24 24">
              <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
              <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
              <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
              <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
            </svg>
            {t('auth.continueWithGoogle')}
          </button>

          {/* Разделитель "или" */}
          <div className="auth-divider">
            <span>{t('auth.orContinueWith')}</span>
          </div>
        </div>

        <form className="auth-form" onSubmit={handleSubmit}>
          {/* Поля имени для регистрации */}
          {mode === 'register' && (
            <>
              <div className="auth-field auth-register-field">
                <input
                  id="firstName"
                  type="text"
                  className="auth-input"
                  value={firstName}
                  onChange={(e) => setFirstName(e.target.value)}
                  placeholder={t('auth.firstNamePlaceholder')}
                  autoComplete="given-name"
                />
              </div>
              <div className="auth-field auth-register-field">
                <input
                  id="lastName"
                  type="text"
                  className="auth-input"
                  value={lastName}
                  onChange={(e) => setLastName(e.target.value)}
                  placeholder={t('auth.lastNamePlaceholder')}
                  autoComplete="family-name"
                />
              </div>
            </>
          )}

          {/* Email поле */}
          <div className={`auth-field ${mode === 'register' ? 'auth-register-field' : ''}`}>
            <input
              id="email"
              type="email"
              className="auth-input"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder={t('auth.emailPlaceholder')}
              required
              autoComplete="email"
            />
          </div>

          {/* Поле пароля - для входа только при валидном email, для регистрации всегда */}
          {(mode === 'register' || showPasswordField) && (
            <div className={`auth-field auth-password-field ${mode === 'register' ? 'auth-register-field' : ''} ${(mode === 'register' || showPasswordField) ? 'show' : ''}`}>
              <div className="auth-password-wrapper">
                <input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  className="auth-input"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder={t('auth.passwordPlaceholder')}
                  required
                  autoComplete={mode === 'login' ? 'current-password' : 'new-password'}
                />
                <button
                  type="button"
                  className="auth-password-toggle"
                  onClick={() => setShowPassword(!showPassword)}
                  aria-label={showPassword ? t('auth.hidePassword') : t('auth.showPassword')}
                >
                  {showPassword ? '👁️' : '👁️‍🗨️'}
                </button>
              </div>
            </div>
          )}

          {/* Сообщения об ошибках и успехе */}
          {error && (
            <div className="auth-message auth-error">
              {error}
            </div>
          )}

          {success && (
            <div className="auth-message auth-success">
              {success}
            </div>
          )}

          {/* Кнопка отправки */}
          <button 
            type="submit" 
            className="auth-submit-btn"
            disabled={isLoading || !email || (mode === 'register' ? !password : (!showPasswordField ? false : !password))}
          >
            {getSubmitButtonText()}
          </button>

          {/* Переключение между входом и регистрацией */}
          <div className="auth-switch">
            <span className="auth-switch-text">
              {mode === 'login' ? t('auth.noAccount') : t('auth.hasAccount')}
            </span>
            <button 
              type="button" 
              className="auth-switch-btn"
              onClick={switchMode}
            >
              {mode === 'login' ? t('auth.registerLink') : t('auth.loginLink')}
            </button>
          </div>

        </form>
      </div>
    </div>
  );
};

export default AuthModal;