// Сервис для работы со статистикой инструментов
interface ToolStats {
  [toolName: string]: {
    launchCount: number;
  };
}

class StatsService {
  private static readonly STORAGE_KEY = 'wekey_tools_stats';

  /**
   * Получить все статистики из хранилища
   */
  private getStats(): ToolStats {
    try {
      const data = localStorage.getItem(StatsService.STORAGE_KEY);
      return data ? JSON.parse(data) : {};
    } catch (error) {
      console.error('Ошибка при чтении статистики:', error);
      return {};
    }
  }

  /**
   * Сохранить статистики в хранилище
   */
  private saveStats(stats: ToolStats): void {
    try {
      localStorage.setItem(StatsService.STORAGE_KEY, JSON.stringify(stats));
    } catch (error) {
      console.error('Ошибка при сохранении статистики:', error);
    }
  }

  /**
   * Получить количество запусков для конкретного инструмента
   */
  getLaunchCount(toolName: string): number {
    const stats = this.getStats();
    return stats[toolName]?.launchCount || 0;
  }

  /**
   * Увеличить счетчик запусков для инструмента на 1
   */
  incrementLaunchCount(toolName: string): void {
    const stats = this.getStats();
    
    if (!stats[toolName]) {
      stats[toolName] = { launchCount: 0 };
    }
    
    stats[toolName].launchCount++;
    this.saveStats(stats);
  }

  /**
   * Сбросить счетчик для инструмента (для отладки)
   */
  resetLaunchCount(toolName: string): void {
    const stats = this.getStats();
    
    if (stats[toolName]) {
      stats[toolName].launchCount = 0;
      this.saveStats(stats);
    }
  }

  /**
   * Получить все статистики (для отладки или экспорта)
   */
  getAllStats(): ToolStats {
    return this.getStats();
  }
}

// Экспортируем единственный экземпляр сервиса
export const statsService = new StatsService();