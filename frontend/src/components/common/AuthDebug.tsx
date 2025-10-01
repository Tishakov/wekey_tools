import { useState } from 'react';
import { api, isAuthenticated, performLogout } from '../../utils/api';

/**
 * Компонент для тестирования автоматического logout при 401
 */
export const AuthDebug = () => {
  const [result, setResult] = useState<string>('');
  const [isAuth, setIsAuth] = useState(isAuthenticated());
  const [isOpen, setIsOpen] = useState(false);

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
    <>
      {/* Кнопка-триггер в виде круга */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        style={{
          position: 'fixed',
          bottom: 20,
          right: isOpen ? 420 : 20,
          width: 48,
          height: 48,
          background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
          border: 'none',
          borderRadius: '50%',
          cursor: 'pointer',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          boxShadow: isOpen 
            ? '0 8px 24px rgba(102, 126, 234, 0.4)' 
            : '0 4px 12px rgba(0,0,0,0.3)',
          zIndex: 10000,
          transition: 'all 0.4s cubic-bezier(0.34, 1.56, 0.64, 1)',
          color: '#fff',
          fontSize: 20,
          transform: isOpen ? 'rotate(180deg)' : 'rotate(0deg)',
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.transform = isOpen ? 'rotate(180deg) scale(1.15)' : 'scale(1.15)';
          e.currentTarget.style.boxShadow = '0 12px 32px rgba(102, 126, 234, 0.5)';
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.transform = isOpen ? 'rotate(180deg) scale(1)' : 'scale(1)';
          e.currentTarget.style.boxShadow = isOpen 
            ? '0 8px 24px rgba(102, 126, 234, 0.4)' 
            : '0 4px 12px rgba(0,0,0,0.3)';
        }}
        title={isOpen ? 'Скрыть debug панель' : 'Показать debug панель'}
      >
        ←
      </button>

      {/* Debug панель */}
      <div
        style={{
          position: 'fixed',
          bottom: 20,
          right: isOpen ? 20 : -400,
          background: 'linear-gradient(135deg, #1a1a1a 0%, #252525 100%)',
          color: '#fff',
          padding: 20,
          borderRadius: 12,
          boxShadow: isOpen 
            ? '0 20px 60px rgba(0,0,0,0.5), 0 0 0 1px rgba(255,255,255,0.1)' 
            : '0 8px 24px rgba(0,0,0,0.4)',
          width: 380,
          zIndex: 9999,
          transition: 'all 0.4s cubic-bezier(0.34, 1.56, 0.64, 1)',
          border: '1px solid #333',
          opacity: isOpen ? 1 : 0,
          pointerEvents: isOpen ? 'auto' : 'none',
          transform: isOpen ? 'scale(1)' : 'scale(0.95)',
        }}
      >
        <div style={{ 
          display: 'flex', 
          alignItems: 'center', 
          justifyContent: 'space-between',
          marginBottom: 15,
          animation: isOpen ? 'fadeInDown 0.5s ease-out' : 'none',
        }}>
          <h3 style={{ margin: 0, fontSize: 16, fontWeight: 600 }}>
            🔐 Auth Debug
          </h3>
          <div style={{
            width: 8,
            height: 8,
            borderRadius: '50%',
            background: isAuth ? '#4ade80' : '#f87171',
            boxShadow: isAuth 
              ? '0 0 12px #4ade80, 0 0 24px rgba(74, 222, 128, 0.3)' 
              : '0 0 12px #f87171, 0 0 24px rgba(248, 113, 113, 0.3)',
            animation: 'pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite'
          }} />
        </div>
        
        <div style={{ 
          marginBottom: 15, 
          fontSize: 13,
          padding: 12,
          background: 'rgba(42, 42, 42, 0.5)',
          borderRadius: 8,
          border: '1px solid rgba(255, 255, 255, 0.05)',
          backdropFilter: 'blur(10px)',
          animation: isOpen ? 'fadeInDown 0.6s ease-out 0.1s backwards' : 'none',
        }}>
          <strong style={{ color: '#9ca3af' }}>Статус:</strong>{' '}
          {isAuth ? (
            <span style={{ color: '#4ade80' }}>✅ Авторизован</span>
          ) : (
            <span style={{ color: '#f87171' }}>❌ Не авторизован</span>
          )}
        </div>

        <div style={{ 
          display: 'flex', 
          gap: 8, 
          marginBottom: 12, 
          flexWrap: 'wrap',
          animation: isOpen ? 'fadeInDown 0.7s ease-out 0.2s backwards' : 'none',
        }}>
          <button
            onClick={testAPI}
            style={{
              flex: 1,
              padding: '8px 14px',
              fontSize: 12,
              background: 'linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)',
              color: '#fff',
              border: 'none',
              borderRadius: 6,
              cursor: 'pointer',
              fontWeight: 500,
              transition: 'all 0.3s cubic-bezier(0.34, 1.56, 0.64, 1)',
              boxShadow: '0 2px 8px rgba(59, 130, 246, 0.2)',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.transform = 'translateY(-3px) scale(1.02)';
              e.currentTarget.style.boxShadow = '0 8px 20px rgba(59, 130, 246, 0.4)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = 'translateY(0) scale(1)';
              e.currentTarget.style.boxShadow = '0 2px 8px rgba(59, 130, 246, 0.2)';
            }}
          >
            🧪 Тест API
          </button>
          
          <button
            onClick={checkAuth}
            style={{
              flex: 1,
              padding: '8px 14px',
              fontSize: 12,
              background: 'linear-gradient(135deg, #8b5cf6 0%, #7c3aed 100%)',
              color: '#fff',
              border: 'none',
              borderRadius: 6,
              cursor: 'pointer',
              fontWeight: 500,
              transition: 'all 0.3s cubic-bezier(0.34, 1.56, 0.64, 1)',
              boxShadow: '0 2px 8px rgba(139, 92, 246, 0.2)',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.transform = 'translateY(-3px) scale(1.02)';
              e.currentTarget.style.boxShadow = '0 8px 20px rgba(139, 92, 246, 0.4)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = 'translateY(0) scale(1)';
              e.currentTarget.style.boxShadow = '0 2px 8px rgba(139, 92, 246, 0.2)';
            }}
          >
            🔄 Проверить
          </button>
        </div>

        <button
          onClick={testLogout}
          style={{
            width: '100%',
            padding: '8px 14px',
            fontSize: 12,
            background: 'linear-gradient(135deg, #ef4444 0%, #dc2626 100%)',
            color: '#fff',
            border: 'none',
            borderRadius: 6,
            cursor: 'pointer',
            fontWeight: 500,
            transition: 'all 0.3s cubic-bezier(0.34, 1.56, 0.64, 1)',
            boxShadow: '0 2px 8px rgba(239, 68, 68, 0.2)',
            animation: isOpen ? 'fadeInDown 0.8s ease-out 0.3s backwards' : 'none',
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.transform = 'translateY(-3px) scale(1.02)';
            e.currentTarget.style.boxShadow = '0 8px 20px rgba(239, 68, 68, 0.4)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.transform = 'translateY(0) scale(1)';
            e.currentTarget.style.boxShadow = '0 2px 8px rgba(239, 68, 68, 0.2)';
          }}
        >
          🚪 Logout
        </button>

        {result && (
          <div style={{
            marginTop: 12,
            padding: 12,
            background: 'rgba(42, 42, 42, 0.5)',
            borderRadius: 8,
            fontSize: 11,
            fontFamily: 'monospace',
            wordBreak: 'break-word',
            border: '1px solid rgba(255, 255, 255, 0.05)',
            backdropFilter: 'blur(10px)',
            lineHeight: 1.5,
            animation: 'bounceIn 0.6s cubic-bezier(0.34, 1.56, 0.64, 1)'
          }}>
            {result}
          </div>
        )}

        <style>{`
          @keyframes pulse {
            0%, 100% { 
              opacity: 1;
              transform: scale(1);
            }
            50% { 
              opacity: 0.6;
              transform: scale(1.1);
            }
          }
          
          @keyframes fadeInDown {
            from {
              opacity: 0;
              transform: translateY(-15px);
            }
            to {
              opacity: 1;
              transform: translateY(0);
            }
          }
          
          @keyframes bounceIn {
            0% {
              opacity: 0;
              transform: scale(0.8) translateY(10px);
            }
            50% {
              transform: scale(1.05) translateY(-2px);
            }
            70% {
              transform: scale(0.98) translateY(1px);
            }
            100% {
              opacity: 1;
              transform: scale(1) translateY(0);
            }
          }
        `}</style>
      </div>
    </>
  );
};
