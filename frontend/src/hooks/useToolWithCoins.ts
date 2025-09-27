import { useAuth } from '../contexts/AuthContext';
import { coinService } from '../services/coinService';
import { statsService } from '../utils/statsService';

/**
 * Универсальный хук для интеграции системы коинов с инструментами
 * Автоматически списывает коины и обновляет статистику при использовании инструмента
 */
export const useToolWithCoins = (toolId: string) => {
  const { user, updateUser } = useAuth();

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
      // 1. Списываем коин через наш сервис
      console.log('🪙 Spending coin for tool:', toolId);
      const coinResult = await coinService.spendCoinsWithValidation(toolId, 1);
      
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