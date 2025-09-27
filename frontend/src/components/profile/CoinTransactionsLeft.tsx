import React, { useState, useEffect } from 'react';
import './CoinTransactionsLeft.css';

interface CoinStats {
  totalReceived: number;
  totalSpent: number;
  transactionCount: number;
}

const CoinTransactionsLeft: React.FC = () => {
  const [currentBalance, setCurrentBalance] = useState<number>(0);
  const [stats, setStats] = useState<CoinStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
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

    fetchData();
  }, []);

  if (loading) {
    return <div className="loading">Загрузка...</div>;
  }

  return (
    <>
      {/* coin-transactions-header */}
      <div className="coin-transactions-header">
        <h2>История операций с коинами</h2>
      </div>

      {/* current-balance */}
      <div className="current-balance">
        <div className="coin-balance-card">
          <img src="/icons/coin_rocket_v1.svg" alt="Коин" className="balance-coin-icon" />
          <div className="balance-info">
            <div className="coin-transactions-balance-amount">{currentBalance}</div>
            <div className="balance-label">Текущий баланс</div>
          </div>
        </div>
      </div>

      {/* coin-stats */}
      {stats && (
        <div className="coin-stats">
          <div className="coin-stat-card">
            <div className="stat-icon">📈</div>
            <div className="stat-content">
              <div className="coin-stat-value">{stats.totalReceived}</div>
              <div className="coin-stat-label">Получено</div>
            </div>
          </div>
          
          <div className="coin-stat-card">
            <div className="stat-icon">📉</div>
            <div className="stat-content">
              <div className="coin-stat-value">{stats.totalSpent}</div>
              <div className="coin-stat-label">Потрачено</div>
            </div>
          </div>
          
          <div className="coin-stat-card">
            <div className="stat-icon">🧾</div>
            <div className="stat-content">
              <div className="coin-stat-value">{stats.transactionCount}</div>
              <div className="coin-stat-label">Операций</div>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default CoinTransactionsLeft;