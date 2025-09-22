import React, { createContext, useContext, useState, useEffect } from 'react';
import type { ReactNode } from 'react';

// Типы для пользователя
export interface User {
  id: number;
  email: string;
  firstName?: string;
  lastName?: string;
  role: 'user' | 'admin' | 'premium';
  language?: 'ru' | 'en' | 'uk';
  theme?: 'light' | 'dark';
  avatar?: string | null;
  createdAt?: string;
  lastLoginAt?: string;
  loginCount?: number;
  apiRequestsCount?: number;
  dailyApiLimit?: number;
}

// Интерфейс контекста
interface AuthContextType {
  user: User | null;
  token: string | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (email: string, password: string, firstName?: string, lastName?: string) => Promise<void>;
  logout: () => void;
  updateProfile: (data: Partial<User> & { currentPassword?: string; newPassword?: string }) => Promise<void>;
  updateUser: (user: User) => void;
  checkAuth: () => Promise<void>;
}

// Создание контекста
const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Провайдер контекста
interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(localStorage.getItem('wekey_token'));
  const [isLoading, setIsLoading] = useState(true);
  
  const API_BASE = 'http://localhost:8880/api';
  
  const isAuthenticated = !!user && !!token;

  // Проверка токена при загрузке
  useEffect(() => {
    if (token) {
      checkAuth();
    } else {
      setIsLoading(false);
    }
  }, []);

  // Функция проверки аутентификации
  const checkAuth = async (): Promise<void> => {
    if (!token) {
      setIsLoading(false);
      return;
    }

    try {
      const response = await fetch(`${API_BASE}/auth/profile`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        const data = await response.json();
        if (data.success && data.user) {
          setUser(data.user);
        } else {
          // Токен недействителен
          logout();
        }
      } else {
        // Токен недействителен
        logout();
      }
    } catch (error) {
      console.error('Ошибка проверки аутентификации:', error);
      logout();
    } finally {
      setIsLoading(false);
    }
  };

  // Функция входа
  const login = async (email: string, password: string): Promise<void> => {
    setIsLoading(true);
    
    try {
      // Блокируем админские аккаунты от входа через обычную форму
      if (email.includes('@wekey.tools') || email === 'admin@wekey.tools') {
        throw new Error('Административные аккаунты доступны только через /admin');
      }

      const response = await fetch(`${API_BASE}/auth/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ email, password })
      });

      const data = await response.json();

      if (response.ok && data.success) {
        const { token: newToken, user: userData } = data;
        
        // Дополнительная проверка - блокируем админов
        if (userData.role === 'admin') {
          throw new Error('Административные аккаунты доступны только через /admin');
        }
        
        // Сохраняем токен
        localStorage.setItem('wekey_token', newToken);
        setToken(newToken);
        setUser(userData);
        
        // Загружаем полный профиль пользователя
        try {
          const profileResponse = await fetch(`${API_BASE}/auth/profile`, {
            headers: {
              'Authorization': `Bearer ${newToken}`,
              'Content-Type': 'application/json'
            }
          });
          
          if (profileResponse.ok) {
            const profileData = await profileResponse.json();
            if (profileData.success && profileData.user) {
              setUser(profileData.user);
            }
          }
        } catch (profileError) {
          console.warn('Не удалось загрузить полный профиль:', profileError);
        }
      } else {
        throw new Error(data.message || 'Ошибка входа в систему');
      }
    } catch (error) {
      console.error('Ошибка входа:', error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  // Функция регистрации
  const register = async (
    email: string, 
    password: string, 
    firstName?: string, 
    lastName?: string
  ): Promise<void> => {
    setIsLoading(true);
    
    try {
      const response = await fetch(`${API_BASE}/auth/register`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ email, password, firstName, lastName })
      });

      const data = await response.json();

      if (response.ok && data.success) {
        const { token: newToken, user: userData } = data;
        
        // Сохраняем токен
        localStorage.setItem('wekey_token', newToken);
        setToken(newToken);
        setUser(userData);
      } else {
        throw new Error(data.message || 'Ошибка регистрации');
      }
    } catch (error) {
      console.error('Ошибка регистрации:', error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  // Функция обновления профиля
  const updateProfile = async (
    data: Partial<User> & { currentPassword?: string; newPassword?: string }
  ): Promise<void> => {
    if (!token) {
      throw new Error('Пользователь не авторизован');
    }

    try {
      const response = await fetch(`${API_BASE}/auth/profile`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(data)
      });

      const result = await response.json();

      if (response.ok && result.success) {
        setUser(result.user);
      } else {
        throw new Error(result.message || 'Ошибка обновления профиля');
      }
    } catch (error) {
      console.error('Ошибка обновления профиля:', error);
      throw error;
    }
  };

  // Функция выхода
  const logout = (): void => {
    localStorage.removeItem('wekey_token');
    setToken(null);
    setUser(null);
  };

  // Функция обновления пользователя
  const updateUser = (updatedUser: User): void => {
    setUser(updatedUser);
  };

  const value: AuthContextType = {
    user,
    token,
    isLoading,
    isAuthenticated,
    login,
    register,
    logout,
    updateProfile,
    updateUser,
    checkAuth
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

// Хук для использования контекста
export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export default AuthContext;