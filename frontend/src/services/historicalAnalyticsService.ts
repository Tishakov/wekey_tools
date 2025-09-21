/**
 * Сервис для работы с историческими аналитическими данными
 */

interface HistoricalDataPoint {
  date: string;
  visitors: number;
  toolUsers: number;
  usageCount: number;
  conversionRate: string;
}

interface HistoricalResponse {
  success: boolean;
  data: HistoricalDataPoint[];
}

class HistoricalAnalyticsService {
  private readonly API_BASE = 'http://localhost:8880';

  /**
   * Получает исторические данные за указанный период
   */
  async getHistoricalData(startDate?: string, endDate?: string, timezone?: string): Promise<HistoricalDataPoint[]> {
    try {
      const token = localStorage.getItem('adminToken');
      if (!token) {
        throw new Error('No admin token found');
      }

      // Строим URL с параметрами
      const params = new URLSearchParams();
      if (startDate) params.append('startDate', startDate);
      if (endDate) params.append('endDate', endDate);
      if (timezone) params.append('timezone', timezone);
      
      const url = `${this.API_BASE}/api/admin/analytics/historical${params.toString() ? '?' + params.toString() : ''}`;
      
      console.log('📊 [HISTORICAL] Fetching data from:', url);

      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const result: HistoricalResponse = await response.json();
      
      if (result.success) {
        console.log('✅ [HISTORICAL] Data received:', result.data.length, 'days');
        return result.data;
      } else {
        throw new Error('Failed to fetch historical data');
      }
    } catch (error) {
      console.error('❌ [HISTORICAL] Error fetching data:', error);
      return [];
    }
  }

  /**
   * Получает данные за последние N дней
   */
  async getLastNDays(days: number = 30): Promise<HistoricalDataPoint[]> {
    const endDate = new Date();
    const startDate = new Date(endDate.getTime() - (days - 1) * 24 * 60 * 60 * 1000);
    
    return this.getHistoricalData(
      startDate.toISOString().split('T')[0],
      endDate.toISOString().split('T')[0]
    );
  }

  /**
   * Получает данные за предустановленные периоды
   */
  async getDataByPeriod(period: 'today' | 'week' | 'month' | 'quarter' | 'year'): Promise<HistoricalDataPoint[]> {
    const endDate = new Date();
    let startDate: Date;

    switch (period) {
      case 'today':
        startDate = new Date(endDate);
        break;
      case 'week':
        startDate = new Date(endDate.getTime() - 6 * 24 * 60 * 60 * 1000);
        break;
      case 'month':
        startDate = new Date(endDate.getTime() - 29 * 24 * 60 * 60 * 1000);
        break;
      case 'quarter':
        startDate = new Date(endDate.getTime() - 89 * 24 * 60 * 60 * 1000);
        break;
      case 'year':
        startDate = new Date(endDate.getTime() - 364 * 24 * 60 * 60 * 1000);
        break;
    }

    return this.getHistoricalData(
      startDate.toISOString().split('T')[0],
      endDate.toISOString().split('T')[0]
    );
  }
}

// Создаем единственный экземпляр сервиса
const historicalAnalyticsService = new HistoricalAnalyticsService();

export default historicalAnalyticsService;
export type { HistoricalDataPoint };