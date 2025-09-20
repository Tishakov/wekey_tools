// Сервис для работы с backend API
const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8880';

interface RequestOptions extends RequestInit {
  headers?: Record<string, string>;
}

interface ApiResponse<T = any> {
  success: boolean;
  message?: string;
  data?: T;
  token?: string; // Для аутентификации
}

interface UserData {
  email: string;
  password: string;
  firstName?: string;
  lastName?: string;
  language?: string;
}

interface ToolUsageMetadata {
  inputLength?: number;
  outputLength?: number;
  processingTime?: number;
  language?: string;
}

class ApiService {
  private baseURL: string;

  constructor() {
    this.baseURL = API_BASE_URL;
  }

  // Получение токена из localStorage
  getToken(): string | null {
    return localStorage.getItem('authToken');
  }

  // Сохранение токена
  setToken(token: string | null): void {
    if (token) {
      localStorage.setItem('authToken', token);
    } else {
      localStorage.removeItem('authToken');
    }
  }

  // Получение заголовков с токеном
  getHeaders(): Record<string, string> {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    };

    const token = this.getToken();
    if (token) {
      headers.Authorization = `Bearer ${token}`;
    }

    return headers;
  }

  // Базовый метод для HTTP запросов
  async request<T = any>(endpoint: string, options: RequestOptions = {}): Promise<ApiResponse<T>> {
    const url = `${this.baseURL}${endpoint}`; // Убираем дублирование /api
    
    const config: RequestOptions = {
      headers: this.getHeaders(),
      ...options,
    };

    try {
      const response = await fetch(url, config);
      const data = await response.json();

      if (!response.ok) {
        throw new ApiError(data.message || 'Ошибка API', response.status, data);
      }

      return data;
    } catch (error) {
      if (error instanceof ApiError) {
        throw error;
      }
      
      // Сетевые ошибки
      throw new ApiError('Ошибка сети. Проверьте подключение к интернету.', 0);
    }
  }

  // GET запрос
  async get<T = any>(endpoint: string): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint, { method: 'GET' });
  }

  // POST запрос
  async post<T = any>(endpoint: string, data?: any): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint, {
      method: 'POST',
      body: data ? JSON.stringify(data) : undefined,
    });
  }

  // PUT запрос
  async put<T = any>(endpoint: string, data?: any): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint, {
      method: 'PUT',
      body: data ? JSON.stringify(data) : undefined,
    });
  }

  // DELETE запрос
  async delete<T = any>(endpoint: string, data?: any): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint, { 
      method: 'DELETE',
      body: data ? JSON.stringify(data) : undefined,
    });
  }

  // ===================
  // АУТЕНТИФИКАЦИЯ
  // ===================

  async register(userData: UserData): Promise<ApiResponse> {
    const response = await this.post('/auth/register', userData);
    if (response.token) {
      this.setToken(response.token);
    }
    return response;
  }

  async login(email: string, password: string): Promise<ApiResponse> {
    const response = await this.post('/auth/login', { email, password });
    if (response.token) {
      this.setToken(response.token);
    }
    return response;
  }

  async logout(): Promise<void> {
    try {
      await this.post('/auth/logout');
    } finally {
      this.setToken(null);
    }
  }

  async getMe(): Promise<ApiResponse> {
    return this.get('/auth/me');
  }

  async updateProfile(profileData: Partial<UserData>): Promise<ApiResponse> {
    return this.put('/auth/update-profile', profileData);
  }

  async changePassword(passwordData: { currentPassword: string; newPassword: string; confirmPassword: string }): Promise<ApiResponse> {
    return this.put('/auth/change-password', passwordData);
  }

  async deleteAccount(password: string): Promise<ApiResponse> {
    const response = await this.delete('/auth/delete-account', { password });
    this.setToken(null);
    return response;
  }

  // ===================
  // СТАТИСТИКА
  // ===================

  async incrementToolUsage(toolName: string, metadata: ToolUsageMetadata = {}): Promise<ApiResponse> {
    const data = {
      toolName,
      toolId: toolName, // Отправляем и toolName и toolId для совместимости
      inputLength: metadata.inputLength,
      outputLength: metadata.outputLength,
      processingTime: metadata.processingTime,
      language: metadata.language || 'ru',
      sessionId: this.getSessionId()
    };

    console.log('🚀 [API] Sending stats increment for:', toolName, data);
    const result = await this.post('/api/stats/increment', data);
    console.log('✅ [API] Stats increment response:', result);
    return result;
  }

  async getToolStats(toolName: string): Promise<ApiResponse> {
    return this.get(`/api/stats/tool/${toolName}`);
  }

  async getOverviewStats(): Promise<ApiResponse> {
    return this.get('/stats/overview');
  }

  async getUserStats(): Promise<ApiResponse> {
    return this.get('/stats/user');
  }

  // ===================
  // ПОЛЬЗОВАТЕЛЬ
  // ===================

  async getUserProfile(): Promise<ApiResponse> {
    return this.get('/users/profile');
  }

  async getUserUsageHistory(page = 1, limit = 20): Promise<ApiResponse> {
    return this.get(`/users/usage-history?page=${page}&limit=${limit}`);
  }

  async getUserSubscription(): Promise<ApiResponse> {
    return this.get('/users/subscription');
  }

  // ===================
  // АДМИН (только для админов)
  // ===================

  async getAdminDashboard(): Promise<ApiResponse> {
    return this.get('/admin/dashboard');
  }

  async getAdminUsers(page = 1, limit = 20, filters: Record<string, string> = {}): Promise<ApiResponse> {
    const params = new URLSearchParams({
      page: page.toString(),
      limit: limit.toString(),
      ...filters
    });
    return this.get(`/admin/users?${params}`);
  }

  async getAdminToolsStats(timeframe = '30d'): Promise<ApiResponse> {
    return this.get(`/admin/tools-stats?timeframe=${timeframe}`);
  }

  async updateUserStatus(userId: string, status: string): Promise<ApiResponse> {
    return this.put(`/admin/users/${userId}/status`, { status });
  }

  // ===================
  // УТИЛИТЫ
  // ===================

  // Генерация или получение session ID для анонимных пользователей
  getSessionId(): string {
    let sessionId = localStorage.getItem('sessionId');
    if (!sessionId) {
      sessionId = this.generateUUID();
      localStorage.setItem('sessionId', sessionId);
    }
    return sessionId;
  }

  // Простая генерация UUID v4
  generateUUID(): string {
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
      const r = Math.random() * 16 | 0;
      const v = c === 'x' ? r : (r & 0x3 | 0x8);
      return v.toString(16);
    });
  }

  // Проверка авторизации
  isAuthenticated(): boolean {
    return !!this.getToken();
  }

  // Проверка доступности API
  async healthCheck(): Promise<boolean> {
    try {
      const response = await fetch(`${this.baseURL}/health`);
      return response.ok;
    } catch {
      return false;
    }
  }
}

// Класс для ошибок API
class ApiError extends Error {
  public status: number;
  public data: any;

  constructor(message: string, status: number, data: any = null) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.data = data;
  }

  // Проверка типов ошибок
  isNetworkError(): boolean {
    return this.status === 0;
  }

  isUnauthorized(): boolean {
    return this.status === 401;
  }

  isForbidden(): boolean {
    return this.status === 403;
  }

  isNotFound(): boolean {
    return this.status === 404;
  }

  isRateLimited(): boolean {
    return this.status === 429;
  }

  isServerError(): boolean {
    return this.status >= 500;
  }
}

// Создание единственного экземпляра сервиса
export const apiService = new ApiService();
export { ApiError };
export type { ApiResponse, UserData, ToolUsageMetadata };