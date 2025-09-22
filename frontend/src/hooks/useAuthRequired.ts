import { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';

interface UseAuthRequiredReturn {
  isAuthRequiredModalOpen: boolean;
  isAuthModalOpen: boolean;
  requireAuth: () => boolean;
  closeAuthRequiredModal: () => void;
  closeAuthModal: () => void;
  openAuthModal: () => void;
}

/**
 * Hook для проверки авторизации и управления модальными окнами
 * 
 * @returns {UseAuthRequiredReturn} Объект с состояниями и функциями
 */
export const useAuthRequired = (): UseAuthRequiredReturn => {
  const { user } = useAuth();
  const [isAuthRequiredModalOpen, setIsAuthRequiredModalOpen] = useState(false);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);

  /**
   * Проверяет авторизацию пользователя
   * 
   * @returns {boolean} true если пользователь авторизован, false если нужно показать модальное окно
   */
  const requireAuth = (): boolean => {
    if (user) {
      return true; // Пользователь авторизован - можно продолжать
    }
    
    // Пользователь не авторизован - показываем модальное окно
    setIsAuthRequiredModalOpen(true);
    return false;
  };

  /**
   * Закрывает модальное окно требования авторизации
   */
  const closeAuthRequiredModal = () => {
    setIsAuthRequiredModalOpen(false);
  };

  /**
   * Закрывает модальное окно авторизации
   */
  const closeAuthModal = () => {
    setIsAuthModalOpen(false);
  };

  /**
   * Открывает модальное окно авторизации
   * (вызывается из AuthRequiredModal при нажатии на "Войти")
   */
  const openAuthModal = () => {
    setIsAuthModalOpen(true);
  };

  return {
    isAuthRequiredModalOpen,
    isAuthModalOpen,
    requireAuth,
    closeAuthRequiredModal,
    closeAuthModal,
    openAuthModal
  };
};