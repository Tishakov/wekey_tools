/**
 * Централизованный API клиент с автоматической обработкой авторизации
 * Автоматически выполняет logout при 401 ошибке
 */

export const API_BASE_URL = 'http://localhost:8880/api';

// Получение токена из localStorage
export const getAuthToken = (): string | null => {
  return localStorage.getItem('adminToken');
};

// Получение заголовков с авторизацией
export const getAuthHeaders = (): HeadersInit => {
  const token = getAuthToken();
  
  const headers: HeadersInit = {
    'Content-Type': 'application/json',
  };
  
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }
  
  return headers;
};

// Logout с перенаправлением на страницу входа
export const performLogout = (reason?: string) => {
  console.log('🚪 Performing logout:', reason || 'User action');
  
  // Очищаем все токены и данные пользователя
  localStorage.removeItem('adminToken');
  localStorage.removeItem('token');
  localStorage.removeItem('userEmail');
  localStorage.removeItem('userName');
  
  // Перенаправляем на страницу входа в админку
  window.location.href = '/admin?session=expired';
};

// Обработка ответа от API
const handleResponse = async (response: Response) => {
  // Если 401 - токен недействителен, выполняем logout
  if (response.status === 401) {
    console.error('❌ 401 Unauthorized - токен недействителен или устарел');
    performLogout('Токен недействителен или устарел');
    throw new Error('Сессия истекла. Перенаправление на страницу входа...');
  }
  
  // Если 403 - недостаточно прав
  if (response.status === 403) {
    console.error('❌ 403 Forbidden - недостаточно прав');
    throw new Error('Недостаточно прав для выполнения этого действия');
  }
  
  // Проверяем успешность запроса
  if (!response.ok) {
    let errorMessage = `HTTP ${response.status}`;
    
    try {
      const errorData = await response.json();
      errorMessage = errorData.error || errorData.message || errorMessage;
    } catch {
      errorMessage = response.statusText || errorMessage;
    }
    
    throw new Error(errorMessage);
  }
  
  // Возвращаем данные
  return response.json();
};

// Обёртка для fetch с автоматической обработкой ошибок
export const apiFetch = async (
  endpoint: string,
  options: RequestInit = {}
): Promise<any> => {
  const url = endpoint.startsWith('http') ? endpoint : `${API_BASE_URL}${endpoint}`;
  
  const config: RequestInit = {
    ...options,
    credentials: 'include',
    headers: {
      ...getAuthHeaders(),
      ...options.headers,
    },
  };
  
  try {
    const response = await fetch(url, config);
    return await handleResponse(response);
  } catch (error) {
    console.error('❌ API Error:', error);
    throw error;
  }
};

// Удобные методы для разных типов запросов
export const api = {
  get: (endpoint: string, options?: RequestInit) => 
    apiFetch(endpoint, { ...options, method: 'GET' }),
  
  post: (endpoint: string, data?: any, options?: RequestInit) => 
    apiFetch(endpoint, {
      ...options,
      method: 'POST',
      body: data ? JSON.stringify(data) : undefined,
    }),
  
  put: (endpoint: string, data?: any, options?: RequestInit) => 
    apiFetch(endpoint, {
      ...options,
      method: 'PUT',
      body: data ? JSON.stringify(data) : undefined,
    }),
  
  delete: (endpoint: string, options?: RequestInit) => 
    apiFetch(endpoint, { ...options, method: 'DELETE' }),
  
  patch: (endpoint: string, data?: any, options?: RequestInit) => 
    apiFetch(endpoint, {
      ...options,
      method: 'PATCH',
      body: data ? JSON.stringify(data) : undefined,
    }),
};

// Проверка, залогинен ли пользователь
export const isAuthenticated = (): boolean => {
  return !!getAuthToken();
};

// Проверка, является ли пользователь администратором
export const isAdmin = (): boolean => {
  // Можно расширить эту логику, проверяя роль из токена
  return isAuthenticated();
};
