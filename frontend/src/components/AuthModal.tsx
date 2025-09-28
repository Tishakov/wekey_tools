import React, { useState, useEffect, useRef } from 'react';
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
  
  const [mode, setMode] = useState<'login' | 'register' | 'verification'>(initialMode);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showPasswordField, setShowPasswordField] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  
  // Состояние для верификации email
  const [verificationCode, setVerificationCode] = useState(['', '', '', '', '', '']);
  const [verificationLoading, setVerificationLoading] = useState(false);
  const [canResend, setCanResend] = useState(false);
  const [resendCooldown, setResendCooldown] = useState(60);
  const [attemptsLeft, setAttemptsLeft] = useState(5);
  
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

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
      setMode(initialMode);
      setVerificationCode(['', '', '', '', '', '']);
      setCanResend(false);
      setResendCooldown(60);
      setAttemptsLeft(5);
    }
  }, [isOpen, initialMode]);

  // Проверка валидности email и показ поля пароля
  useEffect(() => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    const isValidEmail = emailRegex.test(email);
    
    if (mode === 'login') {
      // Для входа показываем пароль только при валидном email
      setShowPasswordField(isValidEmail);
    } else if (mode === 'register') {
      // Для регистрации показываем пароль всегда
      setShowPasswordField(true);
    }
  }, [email, mode]);

  // Таймер для повторной отправки кода верификации
  useEffect(() => {
    if (mode === 'verification' && !canResend && resendCooldown > 0) {
      const timer = setTimeout(() => {
        setResendCooldown(prev => {
          if (prev <= 1) {
            setCanResend(true);
            return 60;
          }
          return prev - 1;
        });
      }, 1000);
      return () => clearTimeout(timer);
    }
  }, [mode, canResend, resendCooldown]);

  // Фокус на первом поле кода при переходе в режим верификации
  useEffect(() => {
    if (mode === 'verification') {
      setTimeout(() => {
        inputRefs.current[0]?.focus();
      }, 100);
    }
  }, [mode]);

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
    
    // Для режима верификации вызываем отдельную функцию
    if (mode === 'verification') {
      await handleVerifyCode();
      return;
    }
  
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
        try {
          const result = await register(email, password, firstName, lastName);
          
          // Если требуется верификация email
          if (result?.requiresVerification) {
            setMode('verification');
            setVerificationCode(['', '', '', '', '', '']);
            setCanResend(false);
            setResendCooldown(60);
            setAttemptsLeft(5);
            setSuccess('Проверьте ваш email для подтверждения аккаунта');
            setError('');
          } else {
            // Обычная регистрация без верификации (например, Google)
            setSuccess(t('auth.success.registerSuccess'));
            setTimeout(() => {
              onClose();
            }, 1000);
          }
        } catch (registerError) {
          throw registerError; // Пробрасываем ошибку дальше
        }
      }
    } catch (error) {
      setError(error instanceof Error ? error.message : t('auth.errors.unknownError'));
    }
  };

  // Обработка ввода кода верификации
  const handleCodeChange = (index: number, value: string) => {
    // Разрешаем только цифры
    if (!/^\d*$/.test(value)) return;

    const newCode = [...verificationCode];
    newCode[index] = value;
    setVerificationCode(newCode);

    // Автопереход к следующему полю
    if (value && index < 5) {
      inputRefs.current[index + 1]?.focus();
    }

    // Очистка ошибок при вводе
    if (error) setError('');
  };

  // Обработка клавиш в поле кода
  const handleCodeKeyDown = (index: number, e: React.KeyboardEvent) => {
    if (e.key === 'Backspace' && !verificationCode[index] && index > 0) {
      // Переход к предыдущему полю при Backspace
      inputRefs.current[index - 1]?.focus();
    } else if (e.key === 'Enter') {
      // Отправка формы при Enter
      handleVerifyCode();
    }
  };

  // Вставка из буфера обмена
  const handleCodePaste = (e: React.ClipboardEvent) => {
    e.preventDefault();
    const pastedData = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 6);
    
    if (pastedData.length === 6) {
      const newCode = pastedData.split('');
      setVerificationCode(newCode);
      inputRefs.current[5]?.focus();
    }
  };

  // Подтверждение кода верификации
  const handleVerifyCode = async () => {
    const codeString = verificationCode.join('');
    
    if (codeString.length !== 6) {
      setError('Введите 6-значный код');
      return;
    }

    setVerificationLoading(true);
    setError('');

    try {
      const response = await fetch('http://localhost:8880/api/auth/verify-email', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email,
          code: codeString
        })
      });

      const data = await response.json();

      if (response.ok) {
        setSuccess(data.message);
        // Устанавливаем токен и перезагружаем страницу
        localStorage.setItem('wekey_token', data.token);
        setTimeout(() => {
          window.location.reload();
        }, 1500);
      } else {
        setError(data.message);
        if (data.attemptsLeft !== undefined) {
          setAttemptsLeft(data.attemptsLeft);
        }
        // Очищаем код при ошибке
        setVerificationCode(['', '', '', '', '', '']);
        inputRefs.current[0]?.focus();
      }
    } catch (error) {
      setError('Ошибка подключения к серверу');
    } finally {
      setVerificationLoading(false);
    }
  };

  // Повторная отправка кода
  const handleResendCode = async () => {
    if (!canResend) return;

    setVerificationLoading(true);
    setError('');

    try {
      const response = await fetch('http://localhost:8880/api/auth/resend-verification', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email })
      });

      const data = await response.json();

      if (response.ok) {
        setSuccess('Новый код отправлен на ваш email');
        setCanResend(false);
        setResendCooldown(60);
        setAttemptsLeft(5);
        setVerificationCode(['', '', '', '', '', '']);
        inputRefs.current[0]?.focus();
      } else {
        setError(data.message);
      }
    } catch (error) {
      setError('Ошибка отправки кода');
    } finally {
      setVerificationLoading(false);
    }
  };

  // Возврат к форме регистрации
  const handleBackToRegister = () => {
    setMode('register');
    setVerificationCode(['', '', '', '', '', '']);
    setError('');
    setSuccess('');
  };

  // Определяем текст кнопки в зависимости от состояния
  const getSubmitButtonText = () => {
    if (mode === 'verification') {
      if (verificationLoading) {
        return (
          <span className="auth-loading">
            <span className="auth-spinner"></span>
            Проверяем...
          </span>
        );
      }
      return 'Подтвердить email';
    }

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
    if (mode === 'verification') return; // Не переключаем из режима верификации
    
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
            {mode === 'verification' 
              ? 'Подтвердите ваш email' 
              : mode === 'login' 
                ? t('auth.loginTitle') 
                : t('auth.registerTitle')
            }
          </h2>
          {mode === 'verification' && (
            <p style={{ margin: '10px 0', color: '#666', fontSize: '14px', textAlign: 'center' }}>
              Мы отправили 6-значный код на адрес<br/>
              <strong>{email}</strong>
            </p>
          )}
        </div>

        {/* Верификация кода или Google Auth */}
        {mode === 'verification' ? (
          <div style={{ padding: '0 30px 20px' }}>
            <div className="verification-code-input" style={{ 
              display: 'flex', 
              gap: '8px', 
              justifyContent: 'center',
              marginBottom: '20px'
            }}>
              {verificationCode.map((digit, index) => (
                <input
                  key={index}
                  ref={el => inputRefs.current[index] = el}
                  type="text"
                  inputMode="numeric"
                  pattern="\d*"
                  maxLength={1}
                  value={digit}
                  onChange={(e) => handleCodeChange(index, e.target.value)}
                  onKeyDown={(e) => handleCodeKeyDown(index, e)}
                  onPaste={index === 0 ? handleCodePaste : undefined}
                  style={{
                    width: '45px',
                    height: '45px',
                    border: '2px solid #e1e5e9',
                    borderRadius: '8px',
                    textAlign: 'center',
                    fontSize: '18px',
                    fontWeight: '600',
                    transition: 'all 0.2s ease',
                    outline: 'none'
                  }}
                  disabled={verificationLoading}
                />
              ))}
            </div>
            
            <div className="resend-section" style={{ textAlign: 'center', marginBottom: '10px' }}>
              <p style={{ margin: '0 0 8px', fontSize: '14px', color: '#666' }}>
                Не получили код?
              </p>
              <button 
                type="button"
                onClick={handleResendCode}
                disabled={!canResend || verificationLoading}
                style={{
                  background: 'none',
                  border: 'none',
                  color: canResend ? '#5E35F2' : '#999',
                  cursor: canResend ? 'pointer' : 'not-allowed',
                  fontSize: '14px',
                  textDecoration: 'underline'
                }}
              >
                {canResend ? (
                  'Отправить повторно'
                ) : (
                  `Повторить через ${resendCooldown}с`
                )}
              </button>
            </div>

            <button 
              type="button"
              onClick={handleBackToRegister}
              style={{
                background: 'none',
                border: 'none',
                color: '#666',
                cursor: 'pointer',
                fontSize: '14px',
                textDecoration: 'underline',
                display: 'block',
                margin: '0 auto'
              }}
            >
              ← Вернуться к регистрации
            </button>
          </div>
        ) : (
          <div style={{ padding: '0 30px 20px' }}>
            {/* Заменяем кнопку на прямую ссылку */}
            <a 
              href="http://localhost:8880/auth/google"
              className="auth-google-btn"
              style={{ 
                display: 'flex', 
                alignItems: 'center', 
                justifyContent: 'center',
                textDecoration: 'none',
                gap: '8px'
              }}
              title="Войти через Google"
            >
              <svg className="auth-google-icon" viewBox="0 0 24 24">
                <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
              </svg>
              {t('auth.continueWithGoogle')}
            </a>

            {/* Разделитель "или" */}
            <div className="auth-divider">
              <span>{t('auth.orContinueWith')}</span>
            </div>
          </div>
        )}

        <form className="auth-form" onSubmit={handleSubmit}>
          {/* Поля формы только для login и register, не для verification */}
          {mode !== 'verification' && (
            <>
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
            </>
          )}

          {/* Сообщения об ошибках и успехе */}
          {error && (
            <div className="auth-message auth-error">
              {error}
              {mode === 'verification' && attemptsLeft > 0 && attemptsLeft < 5 && (
                <div style={{ fontSize: '12px', marginTop: '5px', opacity: 0.8 }}>
                  Осталось попыток: {attemptsLeft}
                </div>
              )}
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
            disabled={
              mode === 'verification' 
                ? (verificationLoading || verificationCode.join('').length !== 6)
                : (isLoading || !email || (mode === 'register' ? !password : (!showPasswordField ? false : !password)))
            }
          >
            {getSubmitButtonText()}
          </button>

          {/* Переключение между входом и регистрацией - только не в режиме верификации */}
          {mode !== 'verification' && (
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
          )}

        </form>
      </div>
    </div>
  );
};

export default AuthModal;