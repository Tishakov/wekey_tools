import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useTranslation } from 'react-i18next';
import AvatarUpload from '../components/profile/AvatarUpload';
import './UserProfile.css';

interface UserSettings {
  defaultLanguage: string;
  emailNotifications: boolean;
  theme: 'light' | 'dark';
}

interface PasswordChangeData {
  currentPassword: string;
  newPassword: string;
  confirmPassword: string;
}

interface UserProfileProps {
  activeSection: 'personalInfo' | 'password' | 'settings';
}

const UserProfile: React.FC<UserProfileProps> = ({ activeSection }) => {
  const { user, updateProfile } = useAuth();
  const { t, i18n } = useTranslation();
  
  // State for profile editing
  const [isEditing, setIsEditing] = useState(false);
  const [showAvatarSection, setShowAvatarSection] = useState(false);
  const [profileData, setProfileData] = useState({
    firstName: user?.firstName || '',
    lastName: user?.lastName || '',
    email: user?.email || '',
    gender: user?.gender || '',
    birthDate: user?.birthDate || '',
    phone: user?.phone || '',
    country: user?.country || ''
  });
  
  // State for about section
  const [aboutData, setAboutData] = useState({
    bio: '',
    profession: '',
    interests: [] as string[],
    instagram: '',
    facebook: '',
    telegram: ''
  });

  // State for password change
  const [passwordData, setPasswordData] = useState<PasswordChangeData>({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });
  
  // State for user settings
  const [settings, setSettings] = useState<UserSettings>({
    defaultLanguage: i18n.language,
    emailNotifications: true,
    theme: 'dark'
  });
  
  // Loading and error states
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  
  // Initialize profile data when user changes
  useEffect(() => {
    if (user) {
      setProfileData({
        firstName: user.firstName || '',
        lastName: user.lastName || '',
        email: user.email || '',
        gender: (user as any)?.gender || '',
        birthDate: (user as any)?.birthDate || '',
        phone: (user as any)?.phone || '',
        country: (user as any)?.country || ''
      });
    }
  }, [user]);
  
  // Handle profile update
  const handleProfileSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setMessage(null);
    
    try {
      await updateProfile(profileData);
      setMessage({ type: 'success', text: t('profile.updateSuccess') });
      setIsEditing(false);
    } catch (error) {
      setMessage({ 
        type: 'error', 
        text: error instanceof Error ? error.message : t('profile.updateError') 
      });
    } finally {
      setLoading(false);
    }
  };
  
  // Handle password change
  const handlePasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setMessage(null);
    
    if (passwordData.newPassword !== passwordData.confirmPassword) {
      setMessage({ type: 'error', text: t('profile.passwordMismatch') });
      setLoading(false);
      return;
    }
    
    if (passwordData.newPassword.length < 8) {
      setMessage({ type: 'error', text: t('profile.passwordTooShort') });
      setLoading(false);
      return;
    }
    
    try {
      const response = await fetch('/api/auth/change-password', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({
          currentPassword: passwordData.currentPassword,
          newPassword: passwordData.newPassword
        })
      });
      
      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.message || t('profile.passwordChangeError'));
      }
      
      setMessage({ type: 'success', text: t('profile.passwordChanged') });
      setPasswordData({ currentPassword: '', newPassword: '', confirmPassword: '' });
    } catch (error) {
      setMessage({ 
        type: 'error', 
        text: error instanceof Error ? error.message : t('profile.passwordChangeError') 
      });
    } finally {
      setLoading(false);
    }
  };
  
  // Handle settings update
  const handleSettingsSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setMessage(null);
    
    try {
      // Update language if changed
      if (settings.defaultLanguage !== i18n.language) {
        await i18n.changeLanguage(settings.defaultLanguage);
        localStorage.setItem('preferredLanguage', settings.defaultLanguage);
      }
      
      // Save settings to backend
      const response = await fetch('/api/auth/update-settings', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify(settings)
      });
      
      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.message || t('profile.settingsUpdateError'));
      }
      
      setMessage({ type: 'success', text: t('profile.settingsUpdated') });
    } catch (error) {
      setMessage({ 
        type: 'error', 
        text: error instanceof Error ? error.message : t('profile.settingsUpdateError') 
      });
    } finally {
      setLoading(false);
    }
  };
  
  if (!user) {
    return (
      <div className="profile-container">
        <div className="profile-error">
          {t('profile.notLoggedIn')}
        </div>
      </div>
    );
  }
  
  return (
    <div className="profile-container">
      <div className="profile-left-column">
        <div className="profile-header">
          <div className="profile-header-main">
            <div 
              className="profile-avatar clickable"
              onClick={() => setShowAvatarSection(!showAvatarSection)}
            >
              {user.avatar ? (
                <img 
                  src={user.avatar.startsWith('http') ? user.avatar : `http://localhost:8880${user.avatar}`} 
                  alt="User avatar" 
                  style={{
                    width: '100%',
                    height: '100%',
                    borderRadius: '50%',
                    objectFit: 'cover'
                  }}
                />
              ) : (
                <span className="profile-initials">
                  {(user.firstName?.[0] || '') + (user.lastName?.[0] || '')}
                </span>
              )}
              <div className="avatar-edit-overlay">
                <svg width="22" height="22" viewBox="0 0 22 22" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M17.8478 6.50435H15.9696L14.9326 4.93913C14.5413 4.35217 13.8565 4 13.1522 4H8.84783C8.14348 4 7.4587 4.35217 7.06739 4.93913L6.03043 6.50435H4.15217C2.9587 6.50435 2 7.46304 2 8.65652V16.2478C2 17.4413 2.9587 18.4 4.15217 18.4H17.8478C19.0413 18.4 20 17.4413 20 16.2478V8.65652C20 7.46304 19.0413 6.50435 17.8478 6.50435ZM11 16.6391C8.31957 16.6391 6.14783 14.4674 6.14783 11.787C6.14783 9.10652 8.31957 6.95435 11 6.95435C13.6804 6.95435 15.8522 9.12609 15.8522 11.8065C15.8522 14.4674 13.6804 16.6391 11 16.6391ZM17.5739 9.53696C17.5543 9.53696 17.5348 9.53696 17.4957 9.53696H16.713C16.3609 9.51739 16.087 9.22391 16.1065 8.87174C16.1261 8.53913 16.3804 8.28478 16.713 8.26522H17.4957C17.8478 8.24565 18.1413 8.51956 18.1609 8.87174C18.1804 9.22391 17.9261 9.51739 17.5739 9.53696Z" fill="white"/>
                  <path d="M10.9998 9.10657C9.51285 9.10657 8.2998 10.3196 8.2998 11.8066C8.2998 13.2935 9.51285 14.487 10.9998 14.487C12.4868 14.487 13.6998 13.274 13.6998 11.787C13.6998 10.3 12.4868 9.10657 10.9998 9.10657Z" fill="white"/>
                </svg>
              </div>
            </div>
            <div className="profile-info">
              <h1 className="profile-name">
                {user.firstName} {user.lastName}
              </h1>
              <p className="profile-email">{user.email}</p>
              <span className={`profile-role ${user.role}`}>
                {t(`profile.role.${user.role}`)}
              </span>
            </div>
          </div>
          
          {/* Секция аватара внутри profile-header */}
          {showAvatarSection && (
            <div className="profile-avatar-section">
              <h4>Фото профиля</h4>
              <AvatarUpload />
            </div>
          )}
        </div>
        
        <div className="profile-content">
        <div className="profile-main-content">
          {message && (
            <div className={`profile-message ${message.type}`}>
              {message.text}
            </div>
          )}
          
          {activeSection === 'personalInfo' && (
            <div className="profile-section">
              <div className="section-header">
                <h2>{t('profile.personalInfo.title')}</h2>
                {!isEditing ? (
                  <button 
                    className="edit-button"
                    onClick={() => setIsEditing(true)}
                  >
                    {t('profile.edit')}
                  </button>
                ) : (
                  <button 
                    className="cancel-button"
                    onClick={() => {
                      setIsEditing(false);
                      setProfileData({
                        firstName: user.firstName || '',
                        lastName: user.lastName || '',
                        email: user.email || '',
                        gender: (user as any)?.gender || '',
                        birthDate: (user as any)?.birthDate || '',
                        phone: (user as any)?.phone || '',
                        country: (user as any)?.country || ''
                      });
                    }}
                  >
                    {t('profile.cancel')}
                  </button>
                )}
              </div>
              
              <form onSubmit={handleProfileSubmit} className="profile-form">
                <div className="form-row">
                  <div className="form-group">
                    <label>{t('profile.firstName')}</label>
                    <input
                      type="text"
                      value={profileData.firstName}
                      onChange={(e) => setProfileData({...profileData, firstName: e.target.value})}
                      disabled={!isEditing}
                      className="profile-input"
                      placeholder={t('profile.firstNamePlaceholder')}
                    />
                  </div>
                  <div className="form-group">
                    <label>{t('profile.lastName')}</label>
                    <input
                      type="text"
                      value={profileData.lastName}
                      onChange={(e) => setProfileData({...profileData, lastName: e.target.value})}
                      disabled={!isEditing}
                      className="profile-input"
                      placeholder={t('profile.lastNamePlaceholder')}
                    />
                  </div>
                </div>
                
                <div className="form-group">
                  <label>{t('profile.email')}</label>
                  <input
                    type="email"
                    value={profileData.email}
                    onChange={(e) => setProfileData({...profileData, email: e.target.value})}
                    disabled={!isEditing}
                    className="profile-input"
                    placeholder={t('profile.emailPlaceholder')}
                  />
                </div>

                <div className="form-group">
                  <label>Пол</label>
                  <select
                    value={profileData.gender}
                    onChange={(e) => setProfileData({...profileData, gender: e.target.value})}
                    disabled={!isEditing}
                    className="profile-input"
                  >
                    <option value="">Не указан</option>
                    <option value="male">Мужской</option>
                    <option value="female">Женский</option>
                    <option value="other">Другой</option>
                  </select>
                </div>

                <div className="form-group">
                  <label>Дата рождения</label>
                  <input
                    type="date"
                    value={profileData.birthDate}
                    onChange={(e) => setProfileData({...profileData, birthDate: e.target.value})}
                    disabled={!isEditing}
                    className="profile-input"
                  />
                </div>

                <div className="form-group">
                  <label>Телефон</label>
                  <input
                    type="tel"
                    value={profileData.phone}
                    onChange={(e) => setProfileData({...profileData, phone: e.target.value})}
                    disabled={!isEditing}
                    className="profile-input"
                    placeholder="+7 (999) 123-45-67"
                  />
                </div>

                <div className="form-group">
                  <label>Страна</label>
                  <input
                    type="text"
                    value={profileData.country}
                    onChange={(e) => setProfileData({...profileData, country: e.target.value})}
                    disabled={!isEditing}
                    className="profile-input"
                    placeholder="Россия"
                  />
                </div>
                
                {isEditing && (
                  <div className="form-actions">
                    <button 
                      type="submit" 
                      className="save-button"
                      disabled={loading}
                    >
                      {loading ? t('common.loading') : t('profile.save')}
                    </button>
                  </div>
                )}
              </form>
            </div>
          )}
          
          {activeSection === 'password' && (
            <div className="profile-section">
              <h2>{t('profile.password.title')}</h2>
              <form onSubmit={handlePasswordSubmit} className="profile-form">
                <div className="form-group">
                  <label>{t('profile.currentPassword')}</label>
                  <input
                    type="password"
                    value={passwordData.currentPassword}
                    onChange={(e) => setPasswordData({...passwordData, currentPassword: e.target.value})}
                    className="profile-input"
                    placeholder={t('profile.currentPasswordPlaceholder')}
                    required
                  />
                </div>
                
                <div className="form-group">
                  <label>{t('profile.newPassword')}</label>
                  <input
                    type="password"
                    value={passwordData.newPassword}
                    onChange={(e) => setPasswordData({...passwordData, newPassword: e.target.value})}
                    className="profile-input"
                    placeholder={t('profile.newPasswordPlaceholder')}
                    required
                    minLength={8}
                  />
                </div>
                
                <div className="form-group">
                  <label>{t('profile.confirmPassword')}</label>
                  <input
                    type="password"
                    value={passwordData.confirmPassword}
                    onChange={(e) => setPasswordData({...passwordData, confirmPassword: e.target.value})}
                    className="profile-input"
                    placeholder={t('profile.confirmPasswordPlaceholder')}
                    required
                  />
                </div>
                
                <div className="form-actions">
                  <button 
                    type="submit" 
                    className="save-button"
                    disabled={loading}
                  >
                    {loading ? t('common.loading') : t('profile.changePassword')}
                  </button>
                </div>
              </form>
            </div>
          )}
          
          {activeSection === 'settings' && (
            <div className="profile-section">
              <h2>{t('profile.settings.title')}</h2>
              <form onSubmit={handleSettingsSubmit} className="profile-form">
                <div className="form-group">
                  <label>{t('profile.defaultLanguage')}</label>
                  <select
                    value={settings.defaultLanguage}
                    onChange={(e) => setSettings({...settings, defaultLanguage: e.target.value})}
                    className="profile-select"
                  >
                    <option value="ru">{t('profile.languages.ru')}</option>
                    <option value="en">{t('profile.languages.en')}</option>
                    <option value="uk">{t('profile.languages.uk')}</option>
                  </select>
                </div>
                
                <div className="form-group checkbox-group">
                  <label className="checkbox-label">
                    <input
                      type="checkbox"
                      checked={settings.emailNotifications}
                      onChange={(e) => setSettings({...settings, emailNotifications: e.target.checked})}
                      className="profile-checkbox"
                    />
                    <span className="checkbox-text">{t('profile.emailNotifications')}</span>
                  </label>
                </div>
                
                <div className="form-group">
                  <label>{t('profile.theme')}</label>
                  <select
                    value={settings.theme}
                    onChange={(e) => setSettings({...settings, theme: e.target.value as 'light' | 'dark'})}
                    className="profile-select"
                  >
                    <option value="dark">{t('profile.themes.dark')}</option>
                    <option value="light">{t('profile.themes.light')}</option>
                  </select>
                </div>
                
                <div className="form-actions">
                  <button 
                    type="submit" 
                    className="save-button"
                    disabled={loading}
                  >
                    {loading ? t('common.loading') : t('profile.saveSettings')}
                  </button>
                </div>
              </form>
            </div>
          )}
        </div>
        </div>
      </div>
      
      <div className="profile-right-column">
        <div className="profile-achievements">
          <div className="achievements-header">
            <h3>🏆 Награды</h3>
          </div>
          <div className="achievements-content">
            <div className="achievement-item">
              <div className="achievement-icon">🥇</div>
              <div className="achievement-info">
                <div className="achievement-title">Первые шаги</div>
                <div className="achievement-desc">Зарегистрировались на платформе</div>
              </div>
            </div>
            <div className="achievement-item">
              <div className="achievement-icon">⚡</div>
              <div className="achievement-info">
                <div className="achievement-title">Активный пользователь</div>
                <div className="achievement-desc">Использовали 5+ инструментов</div>
              </div>
            </div>
            {/* Пока что заглушки, потом добавим логику */}
          </div>
        </div>
        
        {/* Статистика пользователя */}
        <div className="user-stats-section">
          <div className="profile-stats-grid">
            <div className="profile-stat-card">
              <div className="profile-stat-icon">🚀</div>
              <div className="profile-stat-info">
                <div className="stat-number">0</div>
                <div className="stat-label">Запусков инструментов</div>
              </div>
            </div>
            <div className="profile-stat-card">
              <div className="profile-stat-icon">🛠️</div>
              <div className="profile-stat-info">
                <div className="stat-number">0/25</div>
                <div className="stat-label">Использовано инструментов</div>
              </div>
            </div>
            <div className="profile-stat-card">
              <div className="profile-stat-icon">🪙</div>
              <div className="profile-stat-info">
                <div className="stat-number">0</div>
                <div className="stat-label">Использовано токенов</div>
              </div>
            </div>
            <div className="profile-stat-card">
              <div className="profile-stat-icon">📅</div>
              <div className="profile-stat-info">
                <div className="stat-number">0</div>
                <div className="stat-label">Дней на платформе</div>
              </div>
            </div>
          </div>
        </div>

        <div className="profile-about">
          <div className="about-header">
            <h3>📝 О себе</h3>
          </div>

          <div className="about-content">
            {/* Коротко о себе */}
            <div className="about-section">
              <label>Коротко о себе</label>
              <textarea
                value={aboutData.bio}
                onChange={(e) => setAboutData({...aboutData, bio: e.target.value})}
                className="profile-textarea"
                placeholder="Расскажите немного о себе..."
                rows={3}
              />
            </div>

            {/* Профессия */}
            <div className="about-section">
              <label>Кем работаете</label>
              <select
                value={aboutData.profession}
                onChange={(e) => setAboutData({...aboutData, profession: e.target.value})}
                className="profile-select"
              >
                <option value="">Выберите профессию</option>
                <option value="marketer">Маркетолог</option>
                <option value="seo">SEO-специалист</option>
                <option value="ppc">PPC-специалист</option>
                <option value="target">Таргетолог</option>
                <option value="smm">SMM-специалист</option>
                <option value="analytics">Аналитик</option>
                <option value="content">Контент-маркетолог</option>
                <option value="copywriter">Копирайтер</option>
                <option value="designer">Дизайнер</option>
                <option value="developer">Разработчик</option>
                <option value="manager">Менеджер проектов</option>
                <option value="other">Другое</option>
              </select>
            </div>

            {/* Интересы */}
            <div className="about-section">
              <label>Интересы</label>
              <div className="interests-selector">
                {['SEO', 'PPC', 'Аналитика', 'Контент', 'Дизайн', 'Email-маркетинг', 'Соцсети', 'E-commerce', 'Мобильный маркетинг', 'Веб-разработка', 'UX/UI', 'Автоматизация'].map((interest) => (
                  <button
                    key={interest}
                    type="button"
                    className={`interest-tag ${aboutData.interests.includes(interest) ? 'active' : ''}`}
                    onClick={() => {
                      const newInterests = aboutData.interests.includes(interest)
                        ? aboutData.interests.filter(i => i !== interest)
                        : [...aboutData.interests, interest];
                      setAboutData({...aboutData, interests: newInterests});
                    }}
                  >
                    {interest}
                  </button>
                ))}
              </div>
            </div>

            {/* Социальные сети */}
            <div className="about-section">
              <h4>Социальные сети</h4>
              <div className="social-links">
                <div className="social-input">
                  <img src="/icons/tools_instagram.svg" alt="Instagram" className="social-icon" />
                  <input
                    type="url"
                    value={aboutData.instagram}
                    onChange={(e) => setAboutData({...aboutData, instagram: e.target.value})}
                    className="profile-input"
                    placeholder="Instagram"
                  />
                </div>
                <div className="social-input">
                  <img src="/icons/tools_facebook.svg" alt="Facebook" className="social-icon" />
                  <input
                    type="url"
                    value={aboutData.facebook}
                    onChange={(e) => setAboutData({...aboutData, facebook: e.target.value})}
                    className="profile-input"
                    placeholder="Facebook"
                  />
                </div>
                <div className="social-input">
                  <img src="/icons/tools_telegram.svg" alt="Telegram" className="social-icon" />
                  <input
                    type="url"
                    value={aboutData.telegram}
                    onChange={(e) => setAboutData({...aboutData, telegram: e.target.value})}
                    className="profile-input"
                    placeholder="Telegram"
                  />
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default UserProfile;