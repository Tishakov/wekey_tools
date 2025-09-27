import React, { useState, useEffect } from 'react';
import './CoinTransactionsNew.css';

interface CoinStats {
  totalReceived: number;
  totalSpent: number;
  transactionCount: number;
}

const CoinTransactions: React.FC = () => {
  const [currentBalance, setCurrentBalance] = useState<number>(0);
  const [stats, setStats] = useState<CoinStats | null>(null);
  const [loading, setLoading] = useState(true);

  // Загрузка баланса и статистики
  const fetchData = async () => {
    try {
      setLoading(true);
      
      // Загружаем баланс
      const balanceResponse = await fetch('/api/user/coin-transactions?page=1&limit=1', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('wekey_token')}`
        }
      });

      if (balanceResponse.ok) {
        const balanceResult = await balanceResponse.json();
        setCurrentBalance(balanceResult.data?.currentBalance || 0);
      }

      // Загружаем статистику
      const statsResponse = await fetch('/api/user/coin-stats', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('wekey_token')}`
        }
      });

      if (statsResponse.ok) {
        const statsResult = await statsResponse.json();
        setStats(statsResult.data);
      }
    } catch (err) {
      console.error('Ошибка загрузки данных:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  if (loading) {
    return <div className="coin-transactions-loading">Загрузка...</div>;
  }

  return (
    <div className="coin-transactions">
      {/* Header с заголовком */}
      <div className="coin-transactions-header">
        <h2>История операций с коинами</h2>
      </div>

      {/* Текущий баланс */}
      <div className="current-balance">
        <img src="/icons/coin_rocket_v1.svg" alt="Коин" className="balance-coin-icon" />
        <span className="balance-amount">{currentBalance}</span>
        <span className="balance-label">Текущий баланс</span>
      </div>

      {/* Статистика */}
      {stats && (
        <div className="coin-stats">
          <div className="stat-card">
            <div className="stat-icon">📈</div>
            <div className="stat-info">
              <div className="stat-value">{stats.totalReceived}</div>
              <div className="stat-label">Получено</div>
            </div>
          </div>
          <div className="stat-card">
            <div className="stat-icon">📉</div>
            <div className="stat-info">
              <div className="stat-value">{stats.totalSpent}</div>
              <div className="stat-label">Потрачено</div>
            </div>
          </div>
          <div className="stat-card">
            <div className="stat-icon">🧾</div>
            <div className="stat-info">
              <div className="stat-value">{stats.transactionCount}</div>
              <div className="stat-label">Операций</div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default CoinTransactions;