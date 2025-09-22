// Сервис для работы с Google OAuth
class GoogleAuthService {
  private static instance: GoogleAuthService;
  private baseURL: string;

  private constructor() {
    this.baseURL = import.meta.env.VITE_API_URL || 'http://localhost:8880';
  }

  public static getInstance(): GoogleAuthService {
    if (!GoogleAuthService.instance) {
      GoogleAuthService.instance = new GoogleAuthService();
    }
    return GoogleAuthService.instance;
  }

  /**
   * Инициирует Google OAuth авторизацию
   * Перенаправляет пользователя на Google
   */
  public initiateGoogleAuth(): void {
    const authURL = `${this.baseURL}/auth/google`;
    console.log('🚀 Initiating Google OAuth to:', authURL);
    
    // Пробуем несколько способов редиректа
    try {
      // Способ 1: Прямой редирект
      console.log('🔄 Attempting direct redirect...');
      window.location.href = authURL;
      
      // Если по какой-то причине редирект не сработал, пробуем через timeout
      setTimeout(() => {
        console.log('🔄 Backup redirect attempt...');
        window.location.assign(authURL);
      }, 100);
      
    } catch (error) {
      console.error('❌ Redirect failed:', error);
      // Fallback: открываем в новом окне
      window.open(authURL, '_self');
    }
  }

  /**
   * Обрабатывает callback после OAuth
   * Извлекает токены из URL параметров
   */
  public handleOAuthCallback(): {
    token: string | null;
    refreshToken: string | null;
    user: any | null;
    error: string | null;
  } {
    console.log('🔍 [GoogleAuthService] Handling OAuth callback');
    console.log('🔍 [GoogleAuthService] Current URL:', window.location.href);
    console.log('🔍 [GoogleAuthService] Search params:', window.location.search);
    console.log('🔍 [GoogleAuthService] Pathname:', window.location.pathname);
    
    const urlParams = new URLSearchParams(window.location.search);
    
    // Логируем все параметры
    console.log('🔍 [GoogleAuthService] All URL params:');
    for (const [key, value] of urlParams.entries()) {
      console.log(`  ${key}: ${value.substring(0, 50)}${value.length > 50 ? '...' : ''}`);
    }
    
    const token = urlParams.get('token');
    const refreshToken = urlParams.get('refresh');
    const userParam = urlParams.get('user');
    const error = urlParams.get('error');

    console.log('🔍 [GoogleAuthService] Extracted params:', {
      token: token ? `present (${token.length} chars)` : 'null',
      refreshToken: refreshToken ? `present (${refreshToken.length} chars)` : 'null',
      userParam: userParam ? `present (${userParam.length} chars)` : 'null',
      error: error || 'null'
    });

    let user = null;
    if (userParam) {
      try {
        user = JSON.parse(decodeURIComponent(userParam));
        console.log('✅ [GoogleAuthService] User data parsed successfully:', user);
      } catch (e) {
        console.error('❌ [GoogleAuthService] Error parsing user data:', e);
        console.log('🔍 [GoogleAuthService] Raw user param:', userParam);
      }
    }

    // НЕ ОЧИЩАЕМ URL - пусть это делает компонент после успешной обработки
    const result = { token, refreshToken, user, error };
    console.log('🔍 [GoogleAuthService] Final callback result:', result);
    
    return result;
  }

  /**
   * Проверяет статус OAuth авторизации
   */
  public async checkAuthStatus(token: string): Promise<any> {
    try {
      const response = await fetch(`${this.baseURL}/auth/status`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        throw new Error('Auth status check failed');
      }

      return await response.json();
    } catch (error) {
      console.error('Auth status check error:', error);
      throw error;
    }
  }

  /**
   * Отвязывает Google аккаунт
   */
  public async unlinkGoogleAccount(token: string): Promise<any> {
    try {
      const response = await fetch(`${this.baseURL}/auth/google/unlink`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        throw new Error('Google account unlink failed');
      }

      return await response.json();
    } catch (error) {
      console.error('Google unlink error:', error);
      throw error;
    }
  }

  /**
   * Обрабатывает ошибки OAuth
   */
  public getErrorMessage(error: string): string {
    switch (error) {
      case 'oauth_failed':
        return 'Ошибка авторизации через Google. Попробуйте еще раз.';
      case 'callback_error':
        return 'Произошла ошибка при обработке ответа от Google.';
      case 'access_denied':
        return 'Доступ запрещен. Вы отменили авторизацию.';
      default:
        return 'Произошла неизвестная ошибка при авторизации через Google.';
    }
  }

  /**
   * Проверяет, поддерживается ли Google OAuth в текущем браузере
   */
  public isSupported(): boolean {
    return typeof window !== 'undefined' && 
           typeof window.location !== 'undefined' &&
           typeof URLSearchParams !== 'undefined';
  }
}

export default GoogleAuthService;
