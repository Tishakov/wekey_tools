import React, { useState, useEffect } from 'react';
import './CoinTransactionsRight.css';

interface CoinTransaction {
  id: number;
  type: string;
  amount: number;
  description: string;
  balanceAfter: number;
  createdAt: string;
}

interface TransactionsData {
  transactions: CoinTransaction[];
  currentBalance: number;
  pagination: {
    total: number;
    page: number;
    pages: number;
    limit: number;
  };
}

const CoinTransactionsRight: React.FC = () => {
  const [data, setData] = useState<TransactionsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [filters, setFilters] = useState({
    type: '',
    dateFrom: '',
    dateTo: ''
  });

  const fetchTransactions = async (page: number = 1) => {
    try {
      setLoading(true);
      const params = new URLSearchParams({
        page: page.toString(),
        limit: '10'
      });

      if (filters.type) params.append('type', filters.type);
      if (filters.dateFrom) params.append('dateFrom', filters.dateFrom);
      if (filters.dateTo) params.append('dateTo', filters.dateTo);

      const response = await fetch(`/api/user/coin-transactions?${params}`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('wekey_token')}`
        }
      });

      if (!response.ok) {
        throw new Error('Ошибка при загрузке транзакций');
      }

      const result = await response.json();
      setData(result.data);
    } catch (err) {
      console.error('Ошибка загрузки транзакций:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTransactions(currentPage);
  }, [currentPage, filters]);

  const getOperationIcon = (type: string) => {
    switch (type) {
      case 'registration': return '🎉';
      case 'admin_add': return '💰';
      case 'admin_subtract': return '📉';
      case 'tool_usage': return '🔧';
      case 'bonus': return '🎁';
      default: return '💰';
    }
  };

  const getOperationTitle = (type: string) => {
    switch (type) {
      case 'registration': return 'Регистрация';
      case 'admin_add': return 'Начисление администратором';
      case 'admin_subtract': return 'Списание администратором';
      case 'tool_usage': return 'Использование инструмента';
      case 'bonus': return 'Бонус';
      default: return 'Операция';
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString('ru-RU');
  };

  const formatAmount = (amount: number) => {
    return amount > 0 ? `+${amount}` : amount.toString();
  };

  return (
    <div className="coin-transactions-right">
      {/* transactions-filters */}
      <div className="transactions-filters">
        <div className="filter-row">
          <select
            value={filters.type}
            onChange={(e) => setFilters(prev => ({ ...prev, type: e.target.value }))}
            className="filter-select"
          >
            <option value="">Все типы операций</option>
            <option value="registration">Регистрация</option>
            <option value="admin_add">Начисление админом</option>
            <option value="admin_subtract">Списание админом</option>
            <option value="tool_usage">Использование инструментов</option>
            <option value="bonus">Бонусы</option>
          </select>

          <input
            type="date"
            value={filters.dateFrom}
            onChange={(e) => setFilters(prev => ({ ...prev, dateFrom: e.target.value }))}
            className="filter-date"
            placeholder="От даты"
          />

          <input
            type="date"
            value={filters.dateTo}
            onChange={(e) => setFilters(prev => ({ ...prev, dateTo: e.target.value }))}
            className="filter-date"
            placeholder="До даты"
          />

          <button
            onClick={() => setFilters({ type: '', dateFrom: '', dateTo: '' })}
            className="filter-clear"
          >
            Сбросить
          </button>
        </div>
      </div>

      {/* transactions-list */}
      <div className="transactions-list">
        {loading ? (
          <div className="loading">Загрузка транзакций...</div>
        ) : !data || data.transactions.length === 0 ? (
          <div className="no-transactions">
            <div className="no-transactions-icon">💰</div>
            <h3>Транзакции не найдены</h3>
            <p>У вас пока нет операций с коинами</p>
          </div>
        ) : (
          <div className="transaction-items">
            {data.transactions.map((transaction) => (
              <div key={transaction.id} className="transaction-item">
                <div className="transaction-icon">
                  {getOperationIcon(transaction.type)}
                </div>
                
                <div className="transaction-details">
                  <div className="transaction-title">
                    {getOperationTitle(transaction.type)}
                  </div>
                  <div className="transaction-reason">
                    {transaction.description}
                  </div>
                  <div className="transaction-date">
                    {formatDate(transaction.createdAt)}
                  </div>
                </div>
                
                <div className="transaction-amount">
                  <div className={`amount ${transaction.amount > 0 ? 'positive' : 'negative'}`}>
                    {formatAmount(transaction.amount)}
                    <img src="/icons/coin_rocket_v1.svg" alt="Коин" className="amount-coin-icon" />
                  </div>
                  <div className="balance-after">
                    Баланс: {transaction.balanceAfter}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* transactions-pagination */}
      {data && data.pagination.pages > 1 && (
        <div className="transactions-pagination">
          <button
            onClick={() => setCurrentPage(1)}
            disabled={currentPage === 1}
            className="pagination-btn"
          >
            ««
          </button>
          <button
            onClick={() => setCurrentPage(currentPage - 1)}
            disabled={currentPage === 1}
            className="pagination-btn"
          >
            «
          </button>
          
          <span className="pagination-info">
            Страница {currentPage} из {data.pagination.pages}
          </span>
          
          <button
            onClick={() => setCurrentPage(currentPage + 1)}
            disabled={currentPage === data.pagination.pages}
            className="pagination-btn"
          >
            »
          </button>
          <button
            onClick={() => setCurrentPage(data.pagination.pages)}
            disabled={currentPage === data.pagination.pages}
            className="pagination-btn"
          >
            »»
          </button>
        </div>
      )}
    </div>
  );
};

export default CoinTransactionsRight;