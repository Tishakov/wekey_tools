import React, { useState, useRef, useEffect } from 'react';
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
  const [isClosing, setIsClosing] = useState(false);
  const [avatarError, setAvatarError] = useState(false);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

  const handleAuthClick = () => {
    if (isAuthenticated) {
      if (isDropdownOpen) {
        closeDropdown();
      } else {
        setIsDropdownOpen(true);
        setIsClosing(false);
      }
    } else {
      setIsAuthModalOpen(true);
    }
  };

  const closeDropdown = () => {
    setIsClosing(true);
    timeoutRef.current = setTimeout(() => {
      setIsDropdownOpen(false);
      setIsClosing(false);
    }, 200); // Время анимации
  };

  const handleLogout = () => {
    logout();
    closeDropdown();
  };

  // Очистка таймера при размонтировании
  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, []);

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
    const url = avatarPath.startsWith('http') ? avatarPath : `http://localhost:8880${avatarPath}`;
    return url;
  };

  const handleAvatarLoad = () => {
    setAvatarError(false);
  };

  const handleAvatarError = () => {
    setAvatarError(true);
  };

  // Сброс состояния аватара при изменении пользователя
  useEffect(() => {
    setAvatarError(false);
  }, [user?.avatar, user?.id]); // Добавляем user?.id для отслеживания смены пользователя

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
              <div className="user-btn-avatar">
                {user?.avatar ? (
                  <>
                    <img 
                      src={getAvatarUrl(user.avatar) || ''} 
                      alt="Avatar" 
                      className="user-btn-avatar-image"
                      onLoad={handleAvatarLoad}
                      onError={handleAvatarError}
                      style={{ display: avatarError ? 'none' : 'block' }}
                    />
                    {avatarError && (
                      <span>{getUserInitials()}</span>
                    )}
                  </>
                ) : (
                  <span>{getUserInitials()}</span>
                )}
              </div>
              <div className="user-btn-info">
                <span className="user-btn-name">{getUserDisplayName()}</span>
                <span className="user-btn-subtitle">Мой профиль</span>
              </div>
              <svg 
                className={`user-btn-arrow ${isDropdownOpen ? 'user-btn-arrow-up' : ''}`}
                width="16" 
                height="16" 
                viewBox="0 0 16 16"
              >
                <path d="M4 6L8 10L12 6" stroke="currentColor" strokeWidth="2" fill="none"/>
              </svg>
            </button>

            {isDropdownOpen && (
              <div className={`user-dropdown ${isClosing ? 'closing' : ''}`}>
                {/* Группа 1 */}
                <Link 
                  to={`/${lang}/profile`} 
                  className="user-dropdown-item"
                  onClick={closeDropdown}
                >
                  <svg width="22" height="22" viewBox="0 0 22 22" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M17.5407 4.45926C15.7937 2.71218 13.4707 1.75 11 1.75C8.52928 1.75 6.20633 2.71218 4.45926 4.45926C2.71218 6.20633 1.75 8.52928 1.75 11C1.75 13.4707 2.71218 15.7937 4.45926 17.5407C6.20633 19.2878 8.52928 20.25 11 20.25C13.4707 20.25 15.7937 19.2878 17.5407 17.5407C19.2878 15.7937 20.25 13.4707 20.25 11C20.25 8.52928 19.2878 6.20633 17.5407 4.45926ZM5.76455 17.2617C6.06999 14.6336 8.32956 12.6045 11 12.6045C12.4078 12.6045 13.7316 13.153 14.7273 14.1486C15.5685 14.99 16.0991 16.0885 16.2356 17.2616C14.8171 18.4496 12.9907 19.166 11 19.166C9.00931 19.166 7.18305 18.4497 5.76455 17.2617ZM11 11.4881C9.45095 11.4881 8.19053 10.2277 8.19053 8.67861C8.19053 7.12941 9.45095 5.86914 11 5.86914C12.5491 5.86914 13.8095 7.12941 13.8095 8.67861C13.8095 10.2277 12.5491 11.4881 11 11.4881ZM17.1685 16.3453C16.8923 15.2316 16.3163 14.2048 15.4937 13.3822C14.8275 12.716 14.0394 12.2162 13.1798 11.903C14.2131 11.2023 14.8935 10.0183 14.8935 8.67861C14.8935 6.53181 13.1468 4.78516 11 4.78516C8.8532 4.78516 7.10655 6.53181 7.10655 8.67861C7.10655 10.0191 7.78743 11.2034 8.82159 11.904C8.03076 12.1922 7.29893 12.6378 6.66928 13.2244C5.7575 14.0735 5.12432 15.1563 4.83075 16.3444C3.58741 14.9111 2.83398 13.0419 2.83398 11C2.83398 6.49723 6.49723 2.83398 11 2.83398C15.5028 2.83398 19.166 6.49723 19.166 11C19.166 13.0424 18.4123 14.9119 17.1685 16.3453Z" fill="currentColor"/>
                    <path d="M11 20.25C8.52924 20.25 6.20633 19.2879 4.45924 17.5408C2.71214 15.7937 1.75 13.4708 1.75 11C1.75 8.52924 2.71218 6.20637 4.45924 4.45924C6.2063 2.71211 8.52924 1.75 11 1.75C13.4708 1.75 15.7937 2.71214 17.5408 4.45924C19.2879 6.20633 20.25 8.52924 20.25 11C20.25 13.4708 19.2878 15.7936 17.5408 17.5408C15.7937 19.2879 13.4708 20.25 11 20.25ZM11 2.90625C6.53709 2.90625 2.90625 6.53709 2.90625 11C2.90625 15.4629 6.53709 19.0938 11 19.0938C15.4629 19.0938 19.0938 15.4629 19.0938 11C19.0938 6.53709 15.4629 2.90625 11 2.90625Z" fill="currentColor"/>
                  </svg>
                  Мой профиль
                </Link>
                
                <button className="user-dropdown-item">
                  <svg width="22" height="22" viewBox="0 0 22 22" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M11 2C6.03839 2 2 6.03706 2 10.9987C2 15.9603 6.03839 19.9987 11 19.9987C15.9616 19.9987 20 15.9603 20 10.9987C20 6.03706 15.9616 2 11 2ZM11.6936 3.41687C15.5803 3.76577 18.6129 7.01912 18.6129 10.9987C18.6129 14.9782 15.5803 18.2316 11.6936 18.5805V3.41687Z" fill="currentColor"/>
                  </svg>
                  Тема оформления
                </button>
                
                <div className="user-dropdown-divider"></div>
                
                {/* Группа 2 */}
                <button className="user-dropdown-item">
                  <svg width="22" height="22" viewBox="0 0 22 22" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M11 20C15.9706 20 20 15.9706 20 11C20 6.02944 15.9706 2 11 2C6.02944 2 2 6.02944 2 11C2 15.9706 6.02944 20 11 20Z" fill="#FFB800"/>
                    <path d="M11.0001 18.2004C14.9082 18.2004 18.0763 15.0322 18.0763 11.1241C18.0763 7.216 14.9082 4.04785 11.0001 4.04785C7.09197 4.04785 3.92383 7.216 3.92383 11.1241C3.92383 15.0322 7.09197 18.2004 11.0001 18.2004Z" fill="#F28A00"/>
                    <g filter="url(#filter0_i_1644_6182)">
                      <path d="M15.5946 7.2168L13.4479 15.2655H11.3188L9.97772 10.2351L9.6748 9.07345H11.3717L12.3825 12.8653L13.8904 7.2168H15.5946Z" fill="#FFB800"/>
                      <path d="M10.9102 9.07417L10.6069 10.2349L9.26424 15.2653H7.13597L6.13477 11.5095H7.83818L8.20051 12.8651L9.21133 9.07324L10.9102 9.07417Z" fill="#FFB800"/>
                    </g>
                    <defs>
                      <filter id="filter0_i_1644_6182" x="6.13477" y="7.2168" width="9.45996" height="8.10276" filterUnits="userSpaceOnUse" colorInterpolationFilters="sRGB">
                        <feFlood floodOpacity="0" result="BackgroundImageFix"/>
                        <feBlend mode="normal" in="SourceGraphic" in2="BackgroundImageFix" result="shape"/>
                        <feColorMatrix in="SourceAlpha" type="matrix" values="0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 127 0" result="hardAlpha"/>
                        <feOffset dy="0.0540541"/>
                        <feGaussianBlur stdDeviation="0.027027"/>
                        <feComposite in2="hardAlpha" operator="arithmetic" k2="-1" k3="1"/>
                        <feColorMatrix type="matrix" values="0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0.5 0"/>
                        <feBlend mode="normal" in2="shape" result="effect1_innerShadow_1644_6182"/>
                      </filter>
                    </defs>
                  </svg>
                  Мой баланс
                  <span className="balance-amount">{user?.coinBalance ?? 0}</span>
                </button>
                
                <div className="user-dropdown-divider"></div>
                
                {/* Группа 3 */}
                <button className="user-dropdown-item">
                  <svg width="22" height="22" viewBox="0 0 22 22" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M11 2.5C15.6986 2.5 19.5 6.30183 19.5 11C19.5 15.6986 15.6982 19.5 11 19.5C6.30141 19.5 2.5 15.6981 2.5 11C2.5 6.30141 6.30183 2.5 11 2.5ZM11 2.75586C6.45371 2.75586 2.75586 6.45367 2.75586 11C2.75586 15.5463 6.45371 19.2441 11 19.2441C15.5463 19.2441 19.2441 15.5463 19.2441 11C19.2441 6.45367 15.5463 2.75586 11 2.75586Z" fill="currentColor" stroke="currentColor"/>
                    <path d="M10.7334 13.8871C10.9548 13.8871 11.1455 14.0778 11.1455 14.2992C11.1455 14.5173 10.9582 14.7113 10.7334 14.7113C10.517 14.7113 10.333 14.526 10.333 14.2992C10.333 14.0693 10.5204 13.8871 10.7334 13.8871Z" fill="currentColor" stroke="currentColor"/>
                    <path d="M10.8877 6.98242C12.2428 6.98248 12.9111 7.70254 12.9111 8.4375C12.911 8.84018 12.7276 9.21355 12.4736 9.53711C12.2215 9.85829 11.9303 10.091 11.7773 10.21L11.7764 10.2109C11.4074 10.4994 11.1666 10.786 11.0391 11.1328C10.9236 11.4467 10.9209 11.7668 10.9209 12.0508C10.8858 12.0602 10.8238 12.0713 10.7217 12.0713C10.6606 12.0713 10.6202 12.0666 10.5947 12.0625C10.594 12.0594 10.5926 12.0563 10.5918 12.0527C10.5799 11.9996 10.5703 11.9135 10.5703 11.7783C10.5703 11.3469 10.6644 11.0534 10.7773 10.8457C10.8913 10.6362 11.0386 10.487 11.1875 10.3584C11.2742 10.2848 11.3701 10.2142 11.5 10.1133C11.6208 10.0194 11.7601 9.90692 11.8896 9.77832C12.1474 9.52235 12.4179 9.14995 12.418 8.63867C12.418 8.1979 12.2155 7.84436 11.8916 7.62012C11.589 7.41069 11.2114 7.33301 10.8516 7.33301C10.4859 7.33306 10.1885 7.40236 9.94336 7.53711C9.69743 7.67237 9.54479 7.85162 9.44043 7.99512C9.3972 8.05458 9.34234 8.13783 9.31934 8.1709C9.29174 8.21055 9.27332 8.2313 9.26172 8.24414C9.20414 8.24346 9.14229 8.22258 9.10352 8.19141C9.08651 8.17769 9.07517 8.16428 9.06836 8.15039C9.06196 8.13733 9.05377 8.11306 9.05371 8.07031C9.05371 7.7918 9.47099 6.98242 10.8877 6.98242Z" fill="currentColor" stroke="currentColor"/>
                  </svg>
                  Поддержка
                </button>
                
                <button className="user-dropdown-item">
                  <svg width="22" height="22" viewBox="0 0 22 22" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <mask id="mask0_1640_6108" style={{maskType:"luminance"}} maskUnits="userSpaceOnUse" x="2" y="2" width="18" height="18">
                      <path d="M2 2H20V20H2V2Z" fill="white"/>
                    </mask>
                    <g mask="url(#mask0_1640_6108)">
                      <path d="M11.0003 8.23424C9.47289 8.23424 8.23465 9.47244 8.23465 10.9999C8.23465 12.5273 9.47289 13.7655 11.0003 13.7655C12.5277 13.7655 13.7659 12.5273 13.7659 10.9999C13.7659 9.47244 12.5277 8.23424 11.0003 8.23424ZM18.7629 9.02631L18.0141 9.64274C17.1599 10.3459 17.1599 11.6538 18.0141 12.357L18.7629 12.9734C19.0282 13.1919 19.0967 13.5702 18.9249 13.8678L17.4463 16.4288C17.2744 16.7264 16.9126 16.8562 16.5907 16.7357L15.6825 16.3954C14.6464 16.0073 13.5137 16.6612 13.3318 17.7525L13.1724 18.7092C13.1159 19.0482 12.8226 19.2968 12.4789 19.2968H9.52168C9.178 19.2968 8.88465 19.0482 8.82816 18.7092L8.66869 17.7525C8.48682 16.6612 7.35412 16.0073 6.31811 16.3954L5.40988 16.7357C5.08799 16.8562 4.72612 16.7264 4.55425 16.4288L3.07568 13.8678C2.90384 13.5702 2.97235 13.1919 3.23771 12.9734L3.98654 12.357C4.84066 11.6538 4.84066 10.3459 3.98654 9.64274L3.23771 9.02631C2.97235 8.80785 2.90384 8.42957 3.07568 8.1319L4.55425 5.57095C4.72612 5.27328 5.08799 5.14348 5.40988 5.26407L6.31811 5.60431C7.35412 5.99243 8.48682 5.33849 8.66869 4.24721L8.82816 3.2905C8.88465 2.95149 9.178 2.703 9.52168 2.703H12.4789C12.8226 2.703 13.1159 2.95149 13.1724 3.2905L13.3318 4.24721C13.5137 5.33849 14.6464 5.99243 15.6825 5.60431L16.5907 5.26407C16.9126 5.14348 17.2744 5.27328 17.4463 5.57095L18.9249 8.1319C19.0967 8.42957 19.0282 8.80785 18.7629 9.02631Z" stroke="currentColor" strokeWidth="1.2" strokeMiterlimit="10" strokeLinecap="round" strokeLinejoin="round"/>
                    </g>
                  </svg>
                  Настройки
                </button>
                
                <div className="user-dropdown-divider"></div>
                
                {/* Группа 4 */}
                <button 
                  className="user-dropdown-item user-logout"
                  onClick={handleLogout}
                >
                  <svg width="22" height="22" viewBox="0 0 22 22" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M10.3315 17.9017C10.3315 18.0024 10.3513 18.1022 10.3898 18.1952C10.4283 18.2883 10.4848 18.3728 10.556 18.444C10.6272 18.5152 10.7118 18.5717 10.8048 18.6102C10.8979 18.6488 10.9976 18.6686 11.0983 18.6686H14.1657C15.1823 18.6674 16.1568 18.263 16.8756 17.5442C17.5944 16.8254 17.9988 15.8509 18 14.8343V7.16578C17.9988 6.14924 17.5944 5.17468 16.8756 4.45588C16.1568 3.73708 15.1823 3.33273 14.1657 3.33154H11.0983C10.895 3.33154 10.6999 3.41233 10.5561 3.55615C10.4123 3.69996 10.3315 3.895 10.3315 4.09838C10.3315 4.30176 10.4123 4.49681 10.5561 4.64062C10.6999 4.78443 10.895 4.86522 11.0983 4.86522H14.1657C14.7757 4.86589 15.3604 5.10848 15.7917 5.53978C16.223 5.97107 16.4656 6.55584 16.4663 7.16578V14.8343C16.4656 15.4443 16.223 16.029 15.7917 16.4603C15.3604 16.8916 14.7757 17.1342 14.1657 17.1349H11.0983C10.9976 17.1349 10.8979 17.1547 10.8048 17.1932C10.7118 17.2317 10.6272 17.2882 10.556 17.3594C10.4848 17.4306 10.4283 17.5152 10.3898 17.6082C10.3513 17.7013 10.3315 17.801 10.3315 17.9017ZM4.25583 11.2931C4.19806 11.1529 4.18301 10.9987 4.21257 10.85C4.24213 10.7013 4.31498 10.5646 4.42197 10.4572L7.48872 7.39044C7.55992 7.31924 7.64445 7.26276 7.73748 7.22423C7.83051 7.18569 7.93022 7.16586 8.03092 7.16586C8.13161 7.16586 8.23132 7.18569 8.32435 7.22423C8.41738 7.26276 8.50191 7.31924 8.57311 7.39044C8.64431 7.46165 8.70079 7.54618 8.73933 7.6392C8.77786 7.73223 8.79769 7.83194 8.79769 7.93264C8.79769 8.03333 8.77786 8.13304 8.73933 8.22607C8.70079 8.3191 8.64431 8.40363 8.57311 8.47483L6.81473 10.2332H12.632C12.8354 10.2332 13.0305 10.314 13.1743 10.4578C13.3181 10.6016 13.3989 10.7967 13.3989 11.0001C13.3989 11.2034 13.3181 11.3985 13.1743 11.5423C13.0305 11.6861 12.8354 11.7669 12.632 11.7669H6.81473L8.57311 13.5253C8.64431 13.5965 8.70079 13.681 8.73933 13.774C8.77786 13.8671 8.79769 13.9668 8.79769 14.0675C8.79769 14.1682 8.77786 14.2679 8.73933 14.3609C8.70079 14.4539 8.64431 14.5385 8.57311 14.6097C8.50191 14.6809 8.41738 14.7373 8.32435 14.7759C8.23132 14.8144 8.13161 14.8342 8.03092 14.8342C7.93022 14.8342 7.83051 14.8144 7.73748 14.7759C7.64445 14.7373 7.55992 14.6809 7.48872 14.6097L4.42197 11.5428C4.35065 11.4714 4.29419 11.3865 4.25583 11.2931Z" fill="currentColor"/>
                  </svg>
                  Выйти
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