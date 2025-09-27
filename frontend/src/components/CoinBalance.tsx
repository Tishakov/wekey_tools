import React from 'react';
import { useAuth } from '../contexts/AuthContext';
import './CoinBalance.css';

const CoinBalance: React.FC = () => {
  const { user, isAuthenticated } = useAuth();

  if (!isAuthenticated || !user) {
    return null;
  }

  return (
    <div className="coin-balance">
      <img 
        src="/icons/coin_rocket_v1.svg" 
        alt="Coins" 
        className="coin-balance-icon"
      />
      <span className="coin-balance-amount">{user.coinBalance ?? 0}</span>
    </div>
  );
};

export default CoinBalance;