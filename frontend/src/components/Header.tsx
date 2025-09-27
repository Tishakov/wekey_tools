import React from 'react';
import LanguageSwitcher from './LanguageSwitcher';
import CoinBalance from './CoinBalance';
import UserButton from './UserButton';
import './Header.css';

const Header: React.FC = () => {
  return (
    <header className="header">
      <div className="header-content">
        <div className="header-left">
          {/* Здесь может быть логотип или другой контент */}
        </div>
        
        <div className="header-right">
          <LanguageSwitcher />
          <CoinBalance />
          <UserButton />
        </div>
      </div>
    </header>
  );
};

export default Header;
