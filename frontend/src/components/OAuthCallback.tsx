import React, { useEffect, useRef } from 'react';
import { useAuth } from '../contexts/AuthContext';
import GoogleAuthService from '../services/googleAuthService';

const OAuthCallback: React.FC = () => {
  const { updateUser } = useAuth();
  const hasProcessed = useRef(false);

  useEffect(() => {
    // Prevent multiple executions
    if (hasProcessed.current) {
      return;
    }
    hasProcessed.current = true;

    const handleCallback = async () => {
      console.log('🔍 OAuthCallback: Starting callback handling');
      
      const googleAuth = GoogleAuthService.getInstance();
      const { token, refreshToken, user, error } = googleAuth.handleOAuthCallback();

      if (error) {
        const errorMessage = googleAuth.getErrorMessage(error);
        console.error('❌ OAuth Error:', errorMessage);
        window.location.href = `/ru?error=${encodeURIComponent(errorMessage)}`;
        return;
      }

      if (token && user) {
        try {
          console.log('✅ Processing successful OAuth callback');
          
          // Сохраняем токены в localStorage с правильными ключами
          localStorage.setItem('wekey_token', token);
          if (refreshToken) {
            localStorage.setItem('wekey_refresh_token', refreshToken);
          }

          // Обновляем пользователя в контексте
          updateUser(user);

          console.log('✅ Google OAuth успешно завершен:', user);
          
          // Перенаправляем на главную страницу
          window.location.href = '/ru';
        } catch (error) {
          console.error('Error processing OAuth callback:', error);
          window.location.href = `/ru?error=${encodeURIComponent('Ошибка при сохранении данных авторизации')}`;
        }
      } else {
        console.error('❌ Invalid OAuth callback - missing token or user data');
        window.location.href = `/ru?error=${encodeURIComponent('Неполные данные авторизации')}`;
      }
    };

    handleCallback();
  }, []); // Empty dependency array - run only once

  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      height: '100vh',
      background: '#1C1D1F',
      color: '#BCBBBD'
    }}>
      <div style={{
        display: 'flex',
        alignItems: 'center',
        gap: '16px',
        marginBottom: '20px'
      }}>
        <div style={{
          width: '32px',
          height: '32px',
          border: '3px solid #4285F4',
          borderTop: '3px solid transparent',
          borderRadius: '50%',
          animation: 'spin 1s linear infinite'
        }}></div>
        <span style={{ fontSize: '18px', fontWeight: '500' }}>
          Завершение авторизации...
        </span>
      </div>
      <p style={{ 
        textAlign: 'center', 
        color: '#8E8E93',
        fontSize: '14px',
        maxWidth: '400px',
        lineHeight: '1.5'
      }}>
        Обрабатываем данные от Google и настраиваем ваш аккаунт.
        Пожалуйста, подождите...
      </p>
      
      <style>{`
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
};

export default OAuthCallback;