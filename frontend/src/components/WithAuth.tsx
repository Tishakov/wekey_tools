import React from 'react';
import { useAuthRequired } from '../hooks/useAuthRequired';
import AuthRequiredModal from './AuthRequiredModal';
import AuthModal from './AuthModal';

interface WithAuthProps {
  children: React.ReactNode;
}

/**
 * HOC компонент для добавления системы блокировки инструментов
 * Предоставляет модальные окна и хук авторизации
 */
export const WithAuth: React.FC<WithAuthProps> = ({ children }) => {
  const {
    isAuthRequiredModalOpen,
    isAuthModalOpen,
    closeAuthRequiredModal,
    closeAuthModal,
    openAuthModal
  } = useAuthRequired();

  return (
    <>
      {children}
      
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
    </>
  );
};

/**
 * Хук для использования в инструментах
 * Возвращает функцию requireAuth для проверки авторизации
 */
export { useAuthRequired };