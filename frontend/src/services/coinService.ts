// Сервис для работы с коинами

export interface CoinTransaction {
  id: number;
  type: 'spend' | 'earn' | 'refund' | 'admin_add' | 'admin_subtract' | 'registration_bonus';
  amount: number;
  balanceBefore: number;
  balanceAfter: number;
  toolName?: string;
  description?: string;
  createdAt: string;
}

export interface CoinBalance {
  balance: number;
  userId: number;
}

export interface SpendResponse {
  success: boolean;
  message: string;
  data: {
    transaction: CoinTransaction;
    newBalance: number;
  };
}

class CoinService {
  private API_BASE = 'http://localhost:8880/api';

  /**
   * Получить текущий баланс коинов пользователя
   */
  async getBalance(): Promise<number> {
    try {
      const token = localStorage.getItem('wekey_token');
      if (!token) {
        throw new Error('Пользователь не авторизован');
      }

      const response = await fetch(`${this.API_BASE}/coins/balance`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      const data = await response.json();
      
      if (data.success) {
        return data.data.balance;
      } else {
        throw new Error(data.message || 'Ошибка получения баланса');
      }
    } catch (error) {
      console.error('Ошибка получения баланса коинов:', error);
      throw error;
    }
  }

  /**
   * Потратить коины на использование инструмента
   */
  async spendCoins(toolName: string, amount: number = 1): Promise<SpendResponse> {
    try {
      const token = localStorage.getItem('wekey_token');
      if (!token) {
        throw new Error('Пользователь не авторизован');
      }

      const response = await fetch(`${this.API_BASE}/coins/spend`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          toolName,
          amount
        })
      });

      const data = await response.json();
      
      if (data.success) {
        return data;
      } else {
        throw new Error(data.message || 'Ошибка при трате коинов');
      }
    } catch (error) {
      console.error('Ошибка при трате коинов:', error);
      throw error;
    }
  }

  /**
   * Получить историю транзакций коинов
   */
  async getHistory(page: number = 1, limit: number = 20): Promise<{
    transactions: CoinTransaction[];
    pagination: {
      total: number;
      page: number;
      pages: number;
    };
  }> {
    try {
      const token = localStorage.getItem('wekey_token');
      if (!token) {
        throw new Error('Пользователь не авторизован');
      }

      const response = await fetch(`${this.API_BASE}/coins/history?page=${page}&limit=${limit}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      const data = await response.json();
      
      if (data.success) {
        return data.data;
      } else {
        throw new Error(data.message || 'Ошибка получения истории');
      }
    } catch (error) {
      console.error('Ошибка получения истории транзакций:', error);
      throw error;
    }
  }

  /**
   * Проверить, достаточно ли коинов для операции
   */
  async canAfford(amount: number): Promise<boolean> {
    try {
      const balance = await this.getBalance();
      return balance >= amount;
    } catch (error) {
      console.error('Ошибка проверки баланса:', error);
      return false;
    }
  }

  /**
   * Потратить коины с проверкой баланса и уведомлением пользователя
   */
  async spendCoinsWithValidation(toolName: string, amount: number = 1): Promise<{
    success: boolean;
    newBalance?: number;
    error?: string;
  }> {
    try {
      // Проверяем авторизацию
      const token = localStorage.getItem('wekey_token');
      if (!token) {
        return {
          success: false,
          error: 'Пользователь не авторизован'
        };
      }

      // Проверяем баланс
      const canAfford = await this.canAfford(amount);
      if (!canAfford) {
        return {
          success: false,
          error: 'Недостаточно коинов для использования инструмента'
        };
      }

      // Тратим коины
      const result = await this.spendCoins(toolName, amount);
      return {
        success: true,
        newBalance: result.data.newBalance
      };

    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Неизвестная ошибка'
      };
    }
  }
}

// Экспортируем единственный экземпляр сервиса
export const coinService = new CoinService();