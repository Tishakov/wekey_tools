import { useAuth } from '../contexts/AuthContext';
import { coinService } from '../services/coinService';
import { statsService } from '../utils/statsService';
import { useState, useEffect } from 'react';

/**
 * Универсальный хук для интеграции системы коинов с инструментами
 * Автоматически списывает коины и обновляет статистику при использовании инструмента
 */
export const useToolWithCoins = (toolId: string) => {
  const { user, updateUser } = useAuth();
  const [toolCost, setToolCost] = useState<number>(1);

  // Загружаем стоимость инструмента при инициализации
  useEffect(() => {
    const loadToolCost = async () => {
      try {
        const API_BASE = 'http://localhost:8880';
        const response = await fetch(`${API_BASE}/api/tools/active`);
        const data = await response.json();
        
        if (data.success && data.tools) {
          const tool = data.tools.find((t: any) => t.id === toolId);
          if (tool && tool.coinCost !== undefined) {
            setToolCost(tool.coinCost);
          }
        }
      } catch (error) {
        console.error('Error loading tool cost:', error);
        // Оставляем стоимость по умолчанию 1
      }
    };

    loadToolCost();
  }, [toolId]);

  /**
   * Выполнить действие инструмента с автоматическим списанием коинов
   * @param action - функция, которая выполняет основную логику инструмента
   * @param metadata - дополнительные данные для статистики
   * @returns объект с результатом выполнения и новым счетчиком запусков
   */
  const executeWithCoins = async (
    action: () => Promise<any> | any,
    metadata?: {
      inputLength?: number;
      outputLength?: number;
      processingTime?: number;
    }
  ): Promise<{
    success: boolean;
    error?: string;
    newLaunchCount?: number;
    result?: any;
  }> => {
    try {
      // 1. Списываем коины через наш сервис (используем динамическую стоимость)
      console.log('🪙 Spending', toolCost, 'coins for tool:', toolId);
      const coinResult = await coinService.spendCoinsWithValidation(toolId, toolCost);
      
      if (!coinResult.success) {
        return {
          success: false,
          error: coinResult.error || 'Ошибка при списании коинов'
        };
      }

      console.log('🪙 Coin spent successfully, new balance:', coinResult.newBalance);

      // 2. Обновляем баланс пользователя в контексте
      if (user && coinResult.newBalance !== undefined) {
        updateUser({ ...user, coinBalance: coinResult.newBalance });
      }

      // 3. Увеличиваем счетчик статистики
      let newLaunchCount: number;
      try {
        newLaunchCount = await statsService.incrementAndGetCount(toolId, metadata);
      } catch (error) {
        console.error('Failed to update stats:', error);
        newLaunchCount = 0; // fallback значение
      }

      // 4. Выполняем основную логику инструмента
      const result = await action();

      return {
        success: true,
        newLaunchCount,
        result
      };

    } catch (error) {
      console.error('Error in executeWithCoins:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Неизвестная ошибка'
      };
    }
  };

  return {
    executeWithCoins
  };
};