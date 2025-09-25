import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { statsService } from '../utils/statsService';
import { useAuthRequired } from '../hooks/useAuthRequired';
import AuthRequiredModal from '../components/AuthRequiredModal';
import AuthModal from '../components/AuthModal';
import './SEOAuditProTool.css';

const TOOL_ID = 'seo-audit-pro';

const SEOAuditProTool: React.FC = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();

  // Auth Required Hook
  const {
    isAuthRequiredModalOpen,
    isAuthModalOpen,
    requireAuth,
    closeAuthRequiredModal,
    closeAuthModal,
    openAuthModal
  } = useAuthRequired();

  const [launchCount, setLaunchCount] = useState(0);

  // Загружаем статистику при инициализации
  useEffect(() => {
    statsService.getLaunchCount(TOOL_ID).then(setLaunchCount);
  }, []);

  return (
    <div className="main-content">
      <div className="seo-audit-pro-tool">
        {/* Header-остров инструмента */}
        <div className="tool-header-island">
          <button 
            className="back-button"
            onClick={() => navigate('/')}
          >
            <img src="/icons/arrow_left.svg" alt="" />
            {t('seoAuditPro.allTools')}
          </button>
          <h1 className="tool-title">{t('seoAuditPro.title')}</h1>
          <div className="tool-header-buttons">
            <button className="tool-header-btn counter-btn">
              <img src="/icons/rocket.svg" alt="" />
              <span className="counter">{launchCount}</span>
            </button>
            <button className="tool-header-btn icon-only">
              <img src="/icons/lamp.svg" alt="" />
            </button>
            <button className="tool-header-btn icon-only">
              <img src="/icons/camera.svg" alt="" />
            </button>
          </div>
        </div>

        {/* Основная рабочая область */}
        <div className="main-workspace">
          <p>Здесь будет логика инструмента "Аудит SEO PRO"</p>
        </div>

        {/* Модальные окна для авторизации */}
        <AuthRequiredModal
          isOpen={isAuthRequiredModalOpen}
          onClose={closeAuthRequiredModal}
          onLoginClick={openAuthModal}
        />

        <AuthModal
          isOpen={isAuthModalOpen}
          onClose={closeAuthModal}
          initialMode="login"
        />
      </div>
    </div>
  );
};

export default SEOAuditProTool;