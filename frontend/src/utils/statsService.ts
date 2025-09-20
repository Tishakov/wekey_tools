import { apiService, ApiError } from '../services/apiService';
import analyticsService from '../services/analyticsService';

// Сервис для работы со статистикой инструментов
interface ToolStats {
  [toolName: string]: {
    launchCount: number;
  };
}

class StatsService {
  private static readonly STORAGE_KEY = 'wekey_tools_stats';
  private isOnline: boolean = true;

  constructor() {
    // Проверяем доступность API при инициализации
    this.checkApiAvailability();
  }

  /**
   * Проверка доступности API
   */
  private async checkApiAvailability(): Promise<void> {
    try {
      this.isOnline = await apiService.healthCheck();
    } catch {
      this.isOnline = false;
    }
  }

  /**
   * Получить все статистики из localStorage (fallback)
   */
  private getLocalStats(): ToolStats {
    try {
      const data = localStorage.getItem(StatsService.STORAGE_KEY);
      return data ? JSON.parse(data) : {};
    } catch (error) {
      console.error('Ошибка при чтении локальной статистики:', error);
      return {};
    }
  }

  /**
   * Сохранить статистики в localStorage (fallback)
   */
  private saveLocalStats(stats: ToolStats): void {
    try {
      localStorage.setItem(StatsService.STORAGE_KEY, JSON.stringify(stats));
    } catch (error) {
      console.error('Ошибка при сохранении локальной статистики:', error);
    }
  }

  /**
   * Получить количество запусков для конкретного инструмента
   */
  async getLaunchCount(toolName: string): Promise<number> {
    // Сначала пытаемся получить данные с сервера
    if (this.isOnline) {
      try {
        console.log(`🔍 [STATS] Getting launch count for: ${toolName}`);
        const response = await apiService.getToolStats(toolName);
        
        // API возвращает данные в поле data.totalUsage
        if (response.success && response.data && typeof response.data.totalUsage === 'number') {
          console.log(`📊 [STATS] Server count for ${toolName}: ${response.data.totalUsage}`);
          return response.data.totalUsage;
        }
        
        console.warn('Неожиданная структура ответа API:', response);
        return 0;
      } catch (error) {
        console.warn('Не удалось получить статистику с сервера, используем локальные данные:', error);
        this.isOnline = false;
      }
    }

    // Fallback к локальным данным
    console.log(`💾 [STATS] Using local count for: ${toolName}`);
    const localStats = this.getLocalStats();
    return localStats[toolName]?.launchCount || 0;
  }

  /**
   * Увеличить счетчик запусков для инструмента на 1 и вернуть новое значение
   */
  async incrementAndGetCount(toolName: string, metadata?: {
    inputLength?: number;
    outputLength?: number;
    processingTime?: number;
  }): Promise<number> {
    console.log('📊 [STATS] Incrementing and getting count for:', toolName);
    
    // Отправляем событие в аналитику
    analyticsService.trackToolUsage(toolName);
    
    const startTime = Date.now();

    // Локальное обновление для мгновенного отклика UI
    this.incrementLocalCount(toolName);

    // Отправка в API (если доступен) и получение нового счетчика
    if (this.isOnline) {
      try {
        const processingTime = metadata?.processingTime || (Date.now() - startTime);
        
        console.log('🌐 [STATS] Calling API to increment usage...');
        const response = await apiService.incrementToolUsage(toolName, {
          inputLength: metadata?.inputLength,
          outputLength: metadata?.outputLength,
          processingTime,
          language: this.getUserLanguage()
        });
        
        console.log('✅ [STATS] API call successful');
        
        // Возвращаем totalUsage из ответа API
        if (response.data && typeof response.data.totalUsage === 'number') {
          console.log(`🎯 [STATS] Returning server count: ${response.data.totalUsage}`);
          return response.data.totalUsage;
        }
        
        // Если в ответе нет totalUsage, делаем запрос на получение
        return await this.getLaunchCount(toolName);
        
      } catch (error) {
        console.error('❌ [STATS] Error sending stats to server:', error);
        if (error instanceof ApiError) {
          console.warn('Ошибка при отправке статистики на сервер:', error.message);
          
          // Если ошибка авторизации, переключаемся на локальный режим
          if (error.isUnauthorized() || error.isNetworkError()) {
            console.log('🔄 [STATS] Switching to offline mode');
            this.isOnline = false;
          }
        }
        
        // В случае ошибки возвращаем локальный счетчик
        return this.getLocalStats()[toolName]?.launchCount || 1;
      }
    } else {
      console.log('📴 [STATS] Offline mode - returning local count');
      return this.getLocalStats()[toolName]?.launchCount || 1;
    }
  }

  /**
   * Увеличить счетчик запусков для инструмента на 1
   */
  async incrementLaunchCount(toolName: string, metadata?: {
    inputLength?: number;
    outputLength?: number;
    processingTime?: number;
  }): Promise<void> {
    console.log('📊 [STATS] Incrementing launch count for:', toolName);
    const startTime = Date.now();

    // Локальное обновление для мгновенного отклика UI
    this.incrementLocalCount(toolName);

    // Отправка в API (если доступен)
    if (this.isOnline) {
      try {
        const processingTime = metadata?.processingTime || (Date.now() - startTime);
        
        console.log('🌐 [STATS] Calling API to increment usage...');
        await apiService.incrementToolUsage(toolName, {
          inputLength: metadata?.inputLength,
          outputLength: metadata?.outputLength,
          processingTime,
          language: this.getUserLanguage()
        });
        console.log('✅ [STATS] API call successful');
      } catch (error) {
        console.error('❌ [STATS] Error sending stats to server:', error);
        if (error instanceof ApiError) {
          console.warn('Ошибка при отправке статистики на сервер:', error.message);
          
          // Если ошибка авторизации, переключаемся на локальный режим
          if (error.isUnauthorized() || error.isNetworkError()) {
            console.log('🔄 [STATS] Switching to offline mode');
            this.isOnline = false;
          }
        }
      }
    } else {
      console.log('📴 [STATS] Offline mode - only local stats updated');
    }
  }

  /**
   * Локальное увеличение счетчика
   */
  private incrementLocalCount(toolName: string): void {
    const stats = this.getLocalStats();
    
    if (!stats[toolName]) {
      stats[toolName] = { launchCount: 0 };
    }
    
    stats[toolName].launchCount++;
    this.saveLocalStats(stats);
  }

  /**
   * Получение языка пользователя
   */
  private getUserLanguage(): string {
    // Проверяем localStorage на предмет сохраненного языка
    const savedLanguage = localStorage.getItem('userLanguage');
    if (savedLanguage && ['ru', 'ua', 'en'].includes(savedLanguage)) {
      return savedLanguage;
    }

    // Определяем по браузеру
    const browserLanguage = navigator.language.toLowerCase();
    if (browserLanguage.startsWith('ru')) return 'ru';
    if (browserLanguage.startsWith('uk')) return 'ua';
    return 'en';
  }

  /**
   * Сбросить счетчик для инструмента (для отладки, только локально)
   */
  resetLaunchCount(toolName: string): void {
    const stats = this.getLocalStats();
    
    if (stats[toolName]) {
      stats[toolName].launchCount = 0;
      this.saveLocalStats(stats);
    }
  }

  /**
   * Получить все локальные статистики (для отладки или backup)
   */
  getAllLocalStats(): ToolStats {
    return this.getLocalStats();
  }

  /**
   * Получить пользовательскую статистику с сервера
   */
  async getUserStats(): Promise<any> {
    if (!this.isOnline) {
      return {
        message: 'Статистика недоступна в офлайн режиме',
        isOffline: true
      };
    }

    try {
      const response = await apiService.getUserStats();
      return response.data;
    } catch (error) {
      console.error('Ошибка при получении пользовательской статистики:', error);
      return null;
    }
  }

  /**
   * Получить общую статистику с сервера
   */
  async getOverviewStats(): Promise<any> {
    if (!this.isOnline) {
      return {
        message: 'Статистика недоступна в офлайн режиме',
        isOffline: true
      };
    }

    try {
      const response = await apiService.getOverviewStats();
      return response.data;
    } catch (error) {
      console.error('Ошибка при получении общей статистики:', error);
      return null;
    }
  }

  /**
   * Проверить статус подключения к API
   */
  isApiOnline(): boolean {
    return this.isOnline;
  }

  /**
   * Переподключение к API
   */
  async reconnect(): Promise<boolean> {
    this.isOnline = await apiService.healthCheck();
    return this.isOnline;
  }

  /**
   * Синхронизация локальных данных с сервером (для будущего использования)
   */
  async syncWithServer(): Promise<void> {
    if (!this.isOnline) {
      console.warn('Невозможно синхронизировать: API недоступен');
      return;
    }

    // TODO: Реализовать синхронизацию локальных счетчиков с сервером
    // Это может быть полезно для пользователей, которые работали офлайн
    console.log('Синхронизация с сервером будет реализована в будущих версиях');
  }
}

// Экспортируем единственный экземпляр сервиса
export const statsService = new StatsService();