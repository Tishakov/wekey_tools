import React from 'react';
import LanguageSwitcher from './LanguageSwitcher';
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
          <UserButton />
        </div>
      </div>
    </header>
  );
};

export default Header;
