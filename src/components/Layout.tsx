import React from 'react';
import Sidebar from './Sidebar';
import Header from './Header';
import Logo from './Logo';
import './Layout.css';

interface LayoutProps {
  children: React.ReactNode;
}

const Layout: React.FC<LayoutProps> = ({ children }) => {
  return (
    <div className="layout">
      <div className="layout-container">
        <div className="layout-header">
          <Logo />
          <Header />
        </div>
        
        <div className="layout-content">
          <Sidebar />
          <main className="main-content">
            {children}
          </main>
        </div>
      </div>
    </div>
  );
};

export default Layout;
