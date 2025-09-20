import React, { useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import Sidebar from './Sidebar';
import Header from './Header';
import Logo from './Logo';
import analyticsService from '../services/analyticsService';
import './Layout.css';

interface LayoutProps {
  children: React.ReactNode;
}

const Layout: React.FC<LayoutProps> = ({ children }) => {
  const location = useLocation();

  // Трекинг посещения страниц
  useEffect(() => {
    const currentPage = location.pathname;
    console.log('📊 [ANALYTICS] Page view:', currentPage);
    analyticsService.trackPageView(currentPage);
  }, [location.pathname]);

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
      
      {/* Футер */}
      <div className="layout-footer">
        <a href="https://t.me/bohdan_tishakov" className="founder-button" target="_blank" rel="noopener noreferrer">
          <img src="/icons/footer_telegram.svg" alt="" />
          Основатель проекта
        </a>
        
        <div className="footer-content">
          <div className="footer-top">
            <span>made by </span>
            <a href="https://t.me/bohdan_tishakov" target="_blank" rel="noopener noreferrer">Wekey Agency</a>
          </div>
          
          <span className="footer-copyright">© 2024 Wekey Tools. Все права защищены</span>
          
          <div className="footer-links">
            <a href="#" rel="noopener noreferrer">Публичная оферта</a>
            <span>|</span>
            <a href="#" rel="noopener noreferrer">Политика конфиденциальности</a>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Layout;
