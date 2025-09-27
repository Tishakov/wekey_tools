import React, { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import './CoinTransactionsList.css';

interface Transaction {
  id: number;
  description: string;
  amount: number;
  type: 'earning' | 'spending';
  createdAt: string;
}

const CoinTransactionsList: React.FC = () => {
  const { user } = useAuth();
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [filters, setFilters] = useState({
    type: 'all' as 'all' | 'earning' | 'spending',
    dateFrom: '',
    dateTo: ''
  });

  // Загрузка транзакций
  const fetchTransactions = async () => {
    if (!user) return;
    
    setLoading(true);
    try {
      const params = new URLSearchParams({
        page: currentPage.toString(),
        limit: '10'
      });
      
      if (filters.type !== 'all') {
        params.append('type', filters.type);
      }
      if (filters.dateFrom) {
        params.append('dateFrom', filters.dateFrom);
      }
      if (filters.dateTo) {
        params.append('dateTo', filters.dateTo);
      }

      const response = await fetch(`/api/user/coin-transactions?${params}`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('auth_token')}`
        }
      });

      if (response.ok) {
        const data = await response.json();
        setTransactions(data.transactions || []);
        setTotalPages(Math.ceil((data.total || 0) / 10));
      }
    } catch (error) {
      console.error('Ошибка загрузки транзакций:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTransactions();
  }, [user, currentPage, filters]);

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('ru-RU', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <div className="coin-transactions-list">
      {/* Фильтры транзакций */}
      <div className="transactions-filters">
        <div className="filter-group">
          <label>Тип операции:</label>
          <select
            value={filters.type}
            onChange={(e) => setFilters({...filters, type: e.target.value as any})}
          >
            <option value="all">Все операции</option>
            <option value="earning">Поступления</option>
            <option value="spending">Списания</option>
          </select>
        </div>
        
        <div className="filter-group">
          <label>От:</label>
          <input
            type="date"
            value={filters.dateFrom}
            onChange={(e) => setFilters({...filters, dateFrom: e.target.value})}
          />
        </div>
        
        <div className="filter-group">
          <label>До:</label>
          <input
            type="date"
            value={filters.dateTo}
            onChange={(e) => setFilters({...filters, dateTo: e.target.value})}
          />
        </div>
        
        <button 
          className="filter-reset"
          onClick={() => setFilters({ type: 'all', dateFrom: '', dateTo: '' })}
        >
          Сбросить
        </button>
      </div>

      {/* Список транзакций */}
      <div className="transactions-list">
        {loading ? (
          <div className="loading">Загрузка...</div>
        ) : transactions.length === 0 ? (
          <div className="no-transactions">
            <p>Транзакции не найдены</p>
          </div>
        ) : (
          <div className="transactions-table">
            <div className="table-header">
              <div className="col-date">Дата</div>
              <div className="col-description">Описание</div>
              <div className="col-amount">Сумма</div>
            </div>
            
            {transactions.map((transaction) => (
              <div key={transaction.id} className="table-row">
                <div className="col-date">
                  {formatDate(transaction.createdAt)}
                </div>
                <div className="col-description">
                  {transaction.description}
                </div>
                <div className={`col-amount ${transaction.type}`}>
                  {transaction.type === 'earning' ? '+' : '-'}{Math.abs(transaction.amount)}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Пагинация */}
      {totalPages > 1 && (
        <div className="transactions-pagination">
          <button
            onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
            disabled={currentPage === 1}
          >
            Назад
          </button>
          
          <div className="page-info">
            Страница {currentPage} из {totalPages}
          </div>
          
          <button
            onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
            disabled={currentPage === totalPages}
          >
            Вперед
          </button>
        </div>
      )}
    </div>
  );
};

export default CoinTransactionsList;