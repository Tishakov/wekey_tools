import type { Tool } from '../utils/toolsConfig';

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:8880';

interface ApiTool {
  id: string;
  title: string;
  description: string;
  icon: string;
  path: string;
  category: string;
}

class ToolsService {
  private cachedTools: Tool[] | null = null;
  private lastFetch: number = 0;
  private readonly CACHE_DURATION = 5 * 60 * 1000; // 5 минут кэша

  // Получить активные инструменты из API или fallback на статический конфиг
  async getActiveTools(): Promise<Tool[]> {
    // Проверяем кэш
    const now = Date.now();
    if (this.cachedTools && (now - this.lastFetch) < this.CACHE_DURATION) {
      return this.cachedTools;
    }

    try {
      const response = await fetch(`${API_BASE}/api/tools/active`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        throw new Error('API недоступен');
      }

      const data = await response.json();
      
      if (data.success && Array.isArray(data.tools)) {
        // Преобразуем API формат в Tool формат
        const tools: Tool[] = data.tools.map((apiTool: ApiTool) => ({
          id: apiTool.id,
          title: apiTool.title,
          description: apiTool.description,
          icon: apiTool.icon,
          path: apiTool.path,
          category: apiTool.category
        }));

        // Кэшируем результат
        this.cachedTools = tools;
        this.lastFetch = now;
        
        console.log('✅ Загружены активные инструменты из API:', tools.length);
        return tools;
      } else {
        throw new Error('Неверный формат ответа API');
      }
    } catch (error) {
      console.warn('⚠️ Ошибка загрузки инструментов из API:', error);
      console.log('📦 Используется fallback на статический конфиг');
      
      // Fallback на статический импорт
      const { toolsConfig } = await import('../utils/toolsConfig');
      return toolsConfig;
    }
  }

  // Сбросить кэш (например, при изменениях в админке)
  clearCache(): void {
    this.cachedTools = null;
    this.lastFetch = 0;
  }

  // Получить инструмент по ID
  async getToolById(id: string): Promise<Tool | undefined> {
    const tools = await this.getActiveTools();
    return tools.find(tool => tool.id === id);
  }

  // Получить инструменты по категории
  async getToolsByCategory(category?: string): Promise<Tool[]> {
    const tools = await this.getActiveTools();
    if (!category) return tools;
    return tools.filter(tool => tool.category === category);
  }
}

// Экспортируем синглтон
export const toolsService = new ToolsService();

// Экспортируем и типы для удобства
export type { Tool };