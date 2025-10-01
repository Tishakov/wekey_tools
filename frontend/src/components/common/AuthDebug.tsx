import { useState } from 'react';
import { api, isAuthenticated, performLogout } from '../../utils/api';

/**
 * Компонент для тестирования автоматического logout при 401
 */
export const AuthDebug = () => {
  const [result, setResult] = useState<string>('');
  const [isAuth, setIsAuth] = useState(isAuthenticated());

  const testAPI = async () => {
    try {
      setResult('Загрузка...');
      const data = await api.get('/newsletters');
      setResult(`✅ Успешно: получено ${data.newsletters?.length || 0} рассылок`);
    } catch (error: any) {
      setResult(`❌ Ошибка: ${error.message}`);
    }
  };

  const testLogout = () => {
    performLogout('Тестовый logout');
  };

  const checkAuth = () => {
    setIsAuth(isAuthenticated());
  };

  return (
    <div style={{
      position: 'fixed',
      bottom: 20,
      right: 20,
      background: '#1a1a1a',
      color: '#fff',
      padding: 20,
      borderRadius: 8,
      boxShadow: '0 4px 12px rgba(0,0,0,0.3)',
      maxWidth: 400,
      zIndex: 9999
    }}>
      <h3 style={{ margin: '0 0 15px 0', fontSize: 14 }}>🔐 Auth Debug</h3>
      
      <div style={{ marginBottom: 15, fontSize: 12 }}>
        <strong>Статус:</strong>{' '}
        {isAuth ? (
          <span style={{ color: '#4ade80' }}>✅ Авторизован</span>
        ) : (
          <span style={{ color: '#f87171' }}>❌ Не авторизован</span>
        )}
      </div>

      <div style={{ display: 'flex', gap: 8, marginBottom: 10, flexWrap: 'wrap' }}>
        <button
          onClick={testAPI}
          style={{
            padding: '6px 12px',
            fontSize: 12,
            background: '#3b82f6',
            color: '#fff',
            border: 'none',
            borderRadius: 4,
            cursor: 'pointer'
          }}
        >
          Тест API
        </button>
        
        <button
          onClick={checkAuth}
          style={{
            padding: '6px 12px',
            fontSize: 12,
            background: '#8b5cf6',
            color: '#fff',
            border: 'none',
            borderRadius: 4,
            cursor: 'pointer'
          }}
        >
          Проверить
        </button>
        
        <button
          onClick={testLogout}
          style={{
            padding: '6px 12px',
            fontSize: 12,
            background: '#ef4444',
            color: '#fff',
            border: 'none',
            borderRadius: 4,
            cursor: 'pointer'
          }}
        >
          Logout
        </button>
      </div>

      {result && (
        <div style={{
          marginTop: 10,
          padding: 10,
          background: '#2a2a2a',
          borderRadius: 4,
          fontSize: 11,
          fontFamily: 'monospace',
          wordBreak: 'break-word'
        }}>
          {result}
        </div>
      )}
    </div>
  );
};
