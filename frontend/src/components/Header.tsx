import React from 'react';
import LanguageSwitcher from './LanguageSwitcher';
import './Header.css';

const Header: React.FC = () => {
  return (
    <header className="header">
      <div className="header-content">
        <div className="header-left">
          <LanguageSwitcher />
        </div>
        
        <div className="header-right">
          {/* Здесь можно добавить другие элементы */}
        </div>
      </div>
    </header>
  );
};

export default Header;
