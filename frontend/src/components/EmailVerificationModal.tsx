import React, { useState, useEffect, useRef } from 'react';
import './EmailVerificationModal.css';

interface EmailVerificationModalProps {
  isOpen: boolean;
  onClose: () => void;
  email: string;
  onVerificationSuccess: (token: string, user: any) => void;
}

const EmailVerificationModal: React.FC<EmailVerificationModalProps> = ({
  isOpen,
  onClose,
  email,
  onVerificationSuccess
}) => {

  const [code, setCode] = useState(['', '', '', '', '', '']);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [canResend, setCanResend] = useState(false);
  const [resendCooldown, setResendCooldown] = useState(60);
  const [attemptsLeft, setAttemptsLeft] = useState(5);
  
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

  // Таймер для повторной отправки
  useEffect(() => {
    if (!canResend && resendCooldown > 0) {
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
  }, [canResend, resendCooldown]);

  // Сброс состояния при открытии модала
  useEffect(() => {
    if (isOpen) {
      setCode(['', '', '', '', '', '']);
      setError('');
      setSuccess('');
      setCanResend(false);
      setResendCooldown(60);
      setAttemptsLeft(5);
      // Фокус на первом поле
      setTimeout(() => {
        inputRefs.current[0]?.focus();
      }, 100);
    }
  }, [isOpen]);

  // Обработка ввода кода
  const handleCodeChange = (index: number, value: string) => {
    // Разрешаем только цифры
    if (!/^\d*$/.test(value)) return;

    const newCode = [...code];
    newCode[index] = value;
    setCode(newCode);

    // Автопереход к следующему полю
    if (value && index < 5) {
      inputRefs.current[index + 1]?.focus();
    }

    // Очистка ошибок при вводе
    if (error) setError('');
  };

  // Обработка клавиш
  const handleKeyDown = (index: number, e: React.KeyboardEvent) => {
    if (e.key === 'Backspace' && !code[index] && index > 0) {
      // Переход к предыдущему полю при Backspace
      inputRefs.current[index - 1]?.focus();
    } else if (e.key === 'Enter') {
      // Отправка формы при Enter
      handleVerify();
    }
  };

  // Вставка из буфера обмена
  const handlePaste = (e: React.ClipboardEvent) => {
    e.preventDefault();
    const pastedData = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 6);
    
    if (pastedData.length === 6) {
      const newCode = pastedData.split('');
      setCode(newCode);
      inputRefs.current[5]?.focus();
    }
  };

  // Подтверждение кода
  const handleVerify = async () => {
    const codeString = code.join('');
    
    if (codeString.length !== 6) {
      setError('Введите 6-значный код');
      return;
    }

    setIsLoading(true);
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
        setTimeout(() => {
          onVerificationSuccess(data.token, data.user);
          onClose();
        }, 1500);
      } else {
        setError(data.message);
        if (data.attemptsLeft !== undefined) {
          setAttemptsLeft(data.attemptsLeft);
        }
        // Очищаем код при ошибке
        setCode(['', '', '', '', '', '']);
        inputRefs.current[0]?.focus();
      }
    } catch (error) {
      setError('Ошибка подключения к серверу');
    } finally {
      setIsLoading(false);
    }
  };

  // Повторная отправка кода
  const handleResendCode = async () => {
    if (!canResend) return;

    setIsLoading(true);
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
        setCode(['', '', '', '', '', '']);
        inputRefs.current[0]?.focus();
      } else {
        setError(data.message);
      }
    } catch (error) {
      setError('Ошибка отправки кода');
    } finally {
      setIsLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="email-verification-overlay">
      <div className="email-verification-modal">
        <div className="email-verification-header">
          <button className="email-verification-close" onClick={onClose}>
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
              <path d="M18 6L6 18M6 6L18 18" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
            </svg>
          </button>
          
          <div className="email-verification-icon">
            <svg width="64" height="64" viewBox="0 0 64 64" fill="none">
              <circle cx="32" cy="32" r="32" fill="url(#emailGradient)"/>
              <path d="M16 20h32c2.2 0 4 1.8 4 4v16c0 2.2-1.8 4-4 4H16c-2.2 0-4-1.8-4-4V24c0-2.2 1.8-4 4-4z" stroke="white" strokeWidth="2" fill="none"/>
              <path d="M12 24l20 16 20-16" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              <defs>
                <linearGradient id="emailGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor="#5E35F2"/>
                  <stop offset="100%" stopColor="#F22987"/>
                </linearGradient>
              </defs>
            </svg>
          </div>
          
          <h2>Подтвердите ваш email</h2>
          <p>
            Мы отправили 6-значный код на адрес<br/>
            <strong>{email}</strong>
          </p>
        </div>

        <div className="email-verification-content">
          <div className="verification-code-input">
            {code.map((digit, index) => (
              <input
                key={index}
                ref={el => inputRefs.current[index] = el}
                type="text"
                inputMode="numeric"
                pattern="\d*"
                maxLength={1}
                value={digit}
                onChange={(e) => handleCodeChange(index, e.target.value)}
                onKeyDown={(e) => handleKeyDown(index, e)}
                onPaste={index === 0 ? handlePaste : undefined}
                className="code-digit"
                disabled={isLoading}
              />
            ))}
          </div>

          {error && (
            <div className="verification-error">
              <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
                <circle cx="10" cy="10" r="10" fill="#fee2e2"/>
                <path d="M10 6v4M10 14h.01" stroke="#dc2626" strokeWidth="2" strokeLinecap="round"/>
              </svg>
              {error}
              {attemptsLeft > 0 && attemptsLeft < 5 && (
                <span className="attempts-left">
                  (Осталось попыток: {attemptsLeft})
                </span>
              )}
            </div>
          )}

          {success && (
            <div className="verification-success">
              <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
                <circle cx="10" cy="10" r="10" fill="#dcfce7"/>
                <path d="M6 10l3 3 6-6" stroke="#16a34a" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
              {success}
            </div>
          )}

          <button 
            className="verify-button"
            onClick={handleVerify}
            disabled={isLoading || code.join('').length !== 6}
          >
            {isLoading ? (
              <>
                <div className="loading-spinner"></div>
                Проверяем...
              </>
            ) : (
              'Подтвердить email'
            )}
          </button>

          <div className="resend-section">
            <p>Не получили код?</p>
            <button 
              className={`resend-button ${!canResend ? 'disabled' : ''}`}
              onClick={handleResendCode}
              disabled={!canResend || isLoading}
            >
              {canResend ? (
                'Отправить повторно'
              ) : (
                `Повторить через ${resendCooldown}с`
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default EmailVerificationModal;