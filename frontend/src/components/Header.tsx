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
          <LanguageSwitcher />
        </div>
        
        <div className="header-right">
          <CoinBalance />
          <UserButton />
        </div>
      </div>
    </header>
  );
};

export default Header;
