/**
 * Сервис аналитики для отслеживания посетителей и использования инструментов
 */

interface VisitorData {
  userId: string;
  firstVisit: string;
  lastVisit: string;
  sessionsCount: number;
  pagesViewed: string[];
  hasUsedTools: boolean;
  toolsUsed: string[];
  userAgent: string;
  referrer: string;
}

interface AnalyticsEvent {
  userId: string;
  event: 'page_view' | 'tool_usage' | 'session_start';
  data: {
    page?: string;
    tool?: string;
    timestamp: string;
    userAgent: string;
    referrer: string;
  };
}

class AnalyticsService {
  private readonly USER_ID_KEY = 'wekey_user_id';
  private readonly VISITOR_DATA_KEY = 'wekey_visitor_data';
  private readonly API_BASE = 'http://localhost:8080';
  private userId: string;
  private isInitialized = false;

  constructor() {
    this.userId = this.getOrCreateUserId();
    this.initializeVisitorData();
  }

  /**
   * Генерирует или получает существующий UUID пользователя
   */
  private getOrCreateUserId(): string {
    let userId = localStorage.getItem(this.USER_ID_KEY);
    
    if (!userId) {
      // Генерируем UUID v4
      userId = 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
        const r = Math.random() * 16 | 0;
        const v = c === 'x' ? r : (r & 0x3 | 0x8);
        return v.toString(16);
      });
      
      localStorage.setItem(this.USER_ID_KEY, userId);
      
      // Отправляем событие нового пользователя
      this.sendEvent('session_start', {
        timestamp: new Date().toISOString(),
        userAgent: navigator.userAgent,
        referrer: document.referrer
      });
    }
    
    return userId;
  }

  /**
   * Инициализирует данные посетителя
   */
  private initializeVisitorData(): void {
    const existingData = localStorage.getItem(this.VISITOR_DATA_KEY);
    let visitorData: VisitorData;

    if (existingData) {
      visitorData = JSON.parse(existingData);
      visitorData.lastVisit = new Date().toISOString();
      visitorData.sessionsCount += 1;
    } else {
      visitorData = {
        userId: this.userId,
        firstVisit: new Date().toISOString(),
        lastVisit: new Date().toISOString(),
        sessionsCount: 1,
        pagesViewed: [],
        hasUsedTools: false,
        toolsUsed: [],
        userAgent: navigator.userAgent,
        referrer: document.referrer
      };
    }

    localStorage.setItem(this.VISITOR_DATA_KEY, JSON.stringify(visitorData));
    
    // Отправляем данные на сервер
    this.syncVisitorData(visitorData);
    this.isInitialized = true;
  }

  /**
   * Отслеживает просмотр страницы
   */
  public trackPageView(page: string): void {
    if (!this.isInitialized) return;

    const visitorData = this.getVisitorData();
    if (!visitorData.pagesViewed.includes(page)) {
      visitorData.pagesViewed.push(page);
      this.updateVisitorData(visitorData);
    }

    this.sendEvent('page_view', {
      page,
      timestamp: new Date().toISOString(),
      userAgent: navigator.userAgent,
      referrer: document.referrer
    });
  }

  /**
   * Отслеживает использование инструмента
   */
  public trackToolUsage(toolId: string): void {
    if (!this.isInitialized) return;

    const visitorData = this.getVisitorData();
    
    // Отмечаем пользователя как использующего инструменты
    if (!visitorData.hasUsedTools) {
      visitorData.hasUsedTools = true;
    }

    // Добавляем инструмент в список использованных
    if (!visitorData.toolsUsed.includes(toolId)) {
      visitorData.toolsUsed.push(toolId);
    }

    this.updateVisitorData(visitorData);

    this.sendEvent('tool_usage', {
      tool: toolId,
      timestamp: new Date().toISOString(),
      userAgent: navigator.userAgent,
      referrer: document.referrer
    });
  }

  /**
   * Получает данные посетителя из localStorage
   */
  private getVisitorData(): VisitorData {
    const data = localStorage.getItem(this.VISITOR_DATA_KEY);
    if (!data) {
      throw new Error('Visitor data not found');
    }
    return JSON.parse(data);
  }

  /**
   * Обновляет данные посетителя в localStorage
   */
  private updateVisitorData(data: VisitorData): void {
    localStorage.setItem(this.VISITOR_DATA_KEY, JSON.stringify(data));
    this.syncVisitorData(data);
  }

  /**
   * Отправляет событие на сервер
   */
  private async sendEvent(event: AnalyticsEvent['event'], data: AnalyticsEvent['data']): Promise<void> {
    try {
      const eventData: AnalyticsEvent = {
        userId: this.userId,
        event,
        data
      };

      console.log('📊 [ANALYTICS] Sending event:', eventData);

      const response = await fetch(`${this.API_BASE}/api/analytics/event`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(eventData)
      });

      if (response.ok) {
        console.log('✅ [ANALYTICS] Event sent successfully');
      } else {
        console.warn('❌ [ANALYTICS] Failed to send event:', response.status, response.statusText);
      }
    } catch (error) {
      console.warn('❌ [ANALYTICS] Failed to send event:', error);
    }
  }

  /**
   * Синхронизирует данные посетителя с сервером
   */
  private async syncVisitorData(data: VisitorData): Promise<void> {
    try {
      console.log('📊 [ANALYTICS] Syncing visitor data:', data);
      
      const response = await fetch(`${this.API_BASE}/api/analytics/visitor`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data)
      });

      if (response.ok) {
        console.log('✅ [ANALYTICS] Visitor data synced successfully');
      } else {
        console.warn('❌ [ANALYTICS] Failed to sync visitor data:', response.status, response.statusText);
      }
    } catch (error) {
      console.warn('❌ [ANALYTICS] Failed to sync visitor data:', error);
    }
  }

  /**
   * Получает ID текущего пользователя
   */
  public getUserId(): string {
    return this.userId;
  }

  /**
   * Получает данные текущего посетителя
   */
  public getCurrentVisitorData(): VisitorData | null {
    return this.getVisitorData();
  }

  /**
   * Очищает все данные аналитики (для разработки)
   */
  public clearData(): void {
    localStorage.removeItem(this.USER_ID_KEY);
    localStorage.removeItem(this.VISITOR_DATA_KEY);
  }
}

// Создаем единственный экземпляр сервиса
const analyticsService = new AnalyticsService();

export default analyticsService;