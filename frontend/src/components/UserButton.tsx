import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Link, useParams } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import AuthModal from './AuthModal';
import './UserButton.css';

const UserButton: React.FC = () => {
  const { t } = useTranslation();
  const { lang } = useParams<{ lang: string }>();
  const { user, isAuthenticated, logout } = useAuth();
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);

  const handleAuthClick = () => {
    if (isAuthenticated) {
      setIsDropdownOpen(!isDropdownOpen);
    } else {
      setIsAuthModalOpen(true);
    }
  };

  const handleLogout = () => {
    logout();
    setIsDropdownOpen(false);
  };

  const getUserDisplayName = () => {
    if (user?.firstName || user?.lastName) {
      return `${user.firstName || ''} ${user.lastName || ''}`.trim();
    }
    return user?.email?.split('@')[0] || t('auth.user');
  };

  const getUserInitials = () => {
    if (user?.firstName || user?.lastName) {
      const first = user.firstName?.[0] || '';
      const last = user.lastName?.[0] || '';
      return (first + last).toUpperCase();
    }
    return user?.email?.[0]?.toUpperCase() || 'U';
  };

  const getAvatarUrl = (avatarPath: string | null) => {
    if (!avatarPath) return null;
    if (avatarPath.startsWith('http')) return avatarPath;
    return `http://localhost:8880${avatarPath}`;
  };

  return (
    <>
      <div className="user-button-container">
        {isAuthenticated ? (
          <div className="user-menu">
            <button
              className="user-avatar-btn"
              onClick={handleAuthClick}
              aria-label={t('auth.userMenu')}
            >
              <div className="user-avatar">
                {user?.avatar ? (
                  <img 
                    src={getAvatarUrl(user.avatar) || ''} 
                    alt="Avatar" 
                    className="user-avatar-image"
                  />
                ) : (
                  getUserInitials()
                )}
              </div>
              <span className="user-name">{getUserDisplayName()}</span>
              <svg 
                className={`user-arrow ${isDropdownOpen ? 'user-arrow-up' : ''}`}
                width="16" 
                height="16" 
                viewBox="0 0 16 16"
              >
                <path d="M4 6L8 10L12 6" stroke="currentColor" strokeWidth="2" fill="none"/>
              </svg>
            </button>

            {isDropdownOpen && (
              <div className="user-dropdown">
                <div className="user-info">
                  <div className="user-info-name">{getUserDisplayName()}</div>
                  <div className="user-info-email">{user?.email}</div>
                  {user?.role !== 'user' && (
                    <div className="user-info-role">
                      {user?.role === 'admin' ? t('auth.adminRole') : t('auth.premiumRole')}
                    </div>
                  )}
                </div>
                
                <div className="user-dropdown-divider"></div>
                
                <Link 
                  to={`/${lang}/profile`} 
                  className="user-dropdown-item"
                  onClick={() => setIsDropdownOpen(false)}
                >
                  <svg width="16" height="16" viewBox="0 0 16 16">
                    <path d="M8 8C9.65685 8 11 6.65685 11 5C11 3.34315 9.65685 2 8 2C6.34315 2 5 3.34315 5 5C5 6.65685 6.34315 8 8 8Z" fill="currentColor"/>
                    <path d="M14 13C14 11.3431 11.3137 10 8 10C4.68629 10 2 11.3431 2 13V14H14V13Z" fill="currentColor"/>
                  </svg>
                  {t('auth.profilePage')}
                </Link>
                
                <button className="user-dropdown-item">
                  <svg width="16" height="16" viewBox="0 0 16 16">
                    <path d="M8 2L9.09 5.26L12 5L10 7.74L12 11H4L6 7.74L4 5L6.91 5.26L8 2Z" fill="currentColor"/>
                  </svg>
                  {t('auth.subscription')}
                </button>
                
                <div className="user-dropdown-divider"></div>
                
                <button 
                  className="user-dropdown-item user-logout"
                  onClick={handleLogout}
                >
                  <svg width="16" height="16" viewBox="0 0 16 16">
                    <path d="M6 14H3C2.44772 14 2 13.5523 2 13V3C2 2.44772 2.44772 2 3 2H6" stroke="currentColor" strokeWidth="1.5" fill="none"/>
                    <path d="M10 11L13 8L10 5" stroke="currentColor" strokeWidth="1.5" fill="none"/>
                    <path d="M13 8H6" stroke="currentColor" strokeWidth="1.5" fill="none"/>
                  </svg>
                  {t('auth.logout')}
                </button>
              </div>
            )}
          </div>
        ) : (
          <button
            className="login-btn"
            onClick={handleAuthClick}
          >
            <svg width="18" height="18" viewBox="0 0 18 18">
              <path d="M9 9C10.6569 9 12 7.65685 12 6C12 4.34315 10.6569 3 9 3C7.34315 3 6 4.34315 6 6C6 7.65685 7.34315 9 9 9Z" fill="currentColor"/>
              <path d="M15 14C15 12.3431 12.3137 11 9 11C5.68629 11 3 12.3431 3 14V15H15V14Z" fill="currentColor"/>
            </svg>
            {t('auth.login')}
          </button>
        )}
      </div>

      <AuthModal
        isOpen={isAuthModalOpen}
        onClose={() => setIsAuthModalOpen(false)}
        initialMode="login"
      />
    </>
  );
};

export default UserButton;