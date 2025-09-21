import React, { useEffect, useState } from 'react';
import { useLocation, Outlet } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import Sidebar from './Sidebar';
import Header from './Header';
import Logo from './Logo';
import SEOHead from './SEOHead';
import { useLanguageFromUrl } from '../hooks/useLanguageFromUrl';
import analyticsService from '../services/analyticsService';
import './Layout.css';

interface LayoutProps {
  children?: React.ReactNode;
}

const Layout: React.FC<LayoutProps> = ({ children }) => {
  const location = useLocation();
  const { t, i18n } = useTranslation();
  
  const { currentLanguage } = useLanguageFromUrl();

  // Форсируем ререндер при смене языка
  const [, forceUpdate] = useState({});
  
  useEffect(() => {
    // Форсируем ререндер при смене языка i18n
    const handleLanguageChange = () => {
      console.log('🔄 [Layout] i18n language changed to:', i18n.language);
      forceUpdate({});
    };

    i18n.on('languageChanged', handleLanguageChange);
    return () => {
      i18n.off('languageChanged', handleLanguageChange);
    };
  }, [i18n]);

  console.log('🎨 [Layout] Render:', { 
    'i18n.language': i18n.language, 
    currentLanguage,
    pathname: location.pathname,
    't(footer.developedBy)': t('footer.developedBy'),
    't(footer.allRightsReserved)': t('footer.allRightsReserved')
  });

  useEffect(() => {
    const currentPage = location.pathname;
    console.log('📊 [ANALYTICS] Page view:', currentPage);
    analyticsService.trackPageView(currentPage);
  }, [location.pathname]);

  return (
    <>
      <SEOHead />
      <div className="layout">
        <div className="layout-container">
          <div className="layout-header">
            <Logo />
            <Header />
          </div>
          
          <div className="layout-content">
            <Sidebar />
            <main className="main-content">
              {children || <Outlet />}
            </main>
          </div>
        </div>
        
        <div className="layout-footer">
          <a href="https://t.me/bohdan_tishakov" className="founder-button" target="_blank" rel="noopener noreferrer">
            <img src="/icons/footer_telegram.svg" alt="" />
            {t('footer.founder')}
          </a>
          
          <div className="footer-content">
            <div className="footer-top">
              <span>{t('footer.developedBy')} </span>
              <a href="https://t.me/bohdan_tishakov" target="_blank" rel="noopener noreferrer">Wekey Agency</a>
            </div>
            
            <span className="footer-copyright">© 2024 Wekey Tools. {t('footer.allRightsReserved')}</span>
            
            <div className="footer-links">
              <a href="#" rel="noopener noreferrer">{t('footer.publicOffer')}</a>
              <span>|</span>
              <a href="#" rel="noopener noreferrer">{t('footer.privacyPolicy')}</a>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default Layout;
