import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useTranslation } from 'react-i18next';
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

const UserProfile: React.FC = () => {
  const { user, updateProfile } = useAuth();
  const { t, i18n } = useTranslation();
  
  // State for active tab
  const [activeTab, setActiveTab] = useState<'profile' | 'password' | 'settings'>('profile');
  
  // State for profile editing
  const [isEditing, setIsEditing] = useState(false);
  const [profileData, setProfileData] = useState({
    firstName: user?.firstName || '',
    lastName: user?.lastName || '',
    email: user?.email || ''
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
        email: user.email || ''
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
      <div className="profile-header">
        <div className="profile-avatar">
          <span className="profile-initials">
            {(user.firstName?.[0] || '') + (user.lastName?.[0] || '')}
          </span>
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
      
      <div className="profile-content">
        <nav className="profile-tabs">
          <button 
            className={`profile-tab ${activeTab === 'profile' ? 'active' : ''}`}
            onClick={() => setActiveTab('profile')}
          >
            {t('profile.tabs.personalInfo')}
          </button>
          <button 
            className={`profile-tab ${activeTab === 'password' ? 'active' : ''}`}
            onClick={() => setActiveTab('password')}
          >
            {t('profile.tabs.password')}
          </button>
          <button 
            className={`profile-tab ${activeTab === 'settings' ? 'active' : ''}`}
            onClick={() => setActiveTab('settings')}
          >
            {t('profile.tabs.settings')}
          </button>
        </nav>
        
        <div className="profile-tab-content">
          {message && (
            <div className={`profile-message ${message.type}`}>
              {message.text}
            </div>
          )}
          
          {activeTab === 'profile' && (
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
                        email: user.email || ''
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
          
          {activeTab === 'password' && (
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
          
          {activeTab === 'settings' && (
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
  );
};

export default UserProfile;