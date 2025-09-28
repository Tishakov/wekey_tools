import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useTranslation } from 'react-i18next';
import AvatarUpload from '../components/profile/AvatarUpload';
import CoinTransactionsLeft from '../components/profile/CoinTransactionsLeft';
import CoinTransactionsRight from '../components/profile/CoinTransactionsRight';
import UserDashboard from '../components/profile/UserDashboard';
import './UserProfile.css';

// Список популярных стран
const COUNTRIES = [
  'Россия',
  'США',
  'Украина',
  'Беларусь',
  'Казахстан',
  'Узбекистан',
  'Кыргызстан',
  'Таджикистан',
  'Туркменистан',
  'Армения',
  'Азербайджан',
  'Грузия',
  'Молдова',
  'Германия',
  'Великобритания',
  'Франция',
  'Италия',
  'Испания',
  'Канада',
  'Австралия',
  'Новая Зеландия',
  'Бразилия',
  'Аргентина',
  'Чили',
  'Перу',
  'Колумбия',
  'Венесуэла',
  'Эквадор',
  'Уругвай',
  'Парагвай',
  'Боливия',
  'Мексика',
  'Коста-Рика',
  'Панама',
  'Гватемала',
  'Никарагуа',
  'Сальвадор',
  'Гондурас',
  'Белиз',
  'Доминиканская Республика',
  'Куба',
  'Ямайка',
  'Тринидад и Тобаго',
  'Барбадос',
  'Япония',
  'Китай',
  'Южная Корея',
  'КНДР',
  'Монголия',
  'Тайвань',
  'Гонконг',
  'Сингапур',
  'Малайзия',
  'Таиланд',
  'Вьетнам',
  'Лаос',
  'Камбоджа',
  'Мьянма',
  'Филиппины',
  'Индонезия',
  'Бруней',
  'Восточный Тимор',
  'Папуа-Новая Гвинея',
  'Фиджи',
  'Индия',
  'Пакистан',
  'Бангладеш',
  'Шри-Ланка',
  'Мальдивы',
  'Непал',
  'Бутан',
  'Афганистан',
  'Иран',
  'Ирак',
  'Турция',
  'Сирия',
  'Ливан',
  'Иордания',
  'Израиль',
  'Палестина',
  'Кувейт',
  'Бахрейн',
  'Катар',
  'ОАЭ',
  'Оман',
  'Йемен',
  'Саудовская Аравия',
  'Египет',
  'Ливия',
  'Тунис',
  'Алжир',
  'Марокко',
  'Судан',
  'Южный Судан',
  'Эфиопия',
  'Эритрея',
  'Джибути',
  'Сомали',
  'Кения',
  'Уганда',
  'Танзания',
  'Руанда',
  'Бурунди',
  'ДР Конго',
  'Республика Конго',
  'ЦАР',
  'Чад',
  'Камерун',
  'Экваториальная Гвинея',
  'Габон',
  'Сан-Томе и Принсипи',
  'Нигерия',
  'Нигер',
  'Мали',
  'Буркина-Фасо',
  'Кот-д\'Ивуар',
  'Либерия',
  'Сьерра-Леоне',
  'Гвинея',
  'Гвинея-Бисау',
  'Сенегал',
  'Гамбия',
  'Кабо-Верде',
  'Мавритания',
  'Того',
  'Бенин',
  'Гана',
  'ЮАР',
  'Намибия',
  'Ботсвана',
  'Зимбабве',
  'Замбия',
  'Малави',
  'Мозамбик',
  'Мадагаскар',
  'Маврикий',
  'Коморы',
  'Сейшелы',
  'Лесото',
  'Эсватини',
  'Ангола',
  'Польша',
  'Чехия',
  'Словакия',
  'Венгрия',
  'Румыния',
  'Болгария',
  'Хорватия',
  'Словения',
  'Сербия',
  'Босния и Герцеговина',
  'Черногория',
  'Северная Македония',
  'Албания',
  'Косово',
  'Эстония',
  'Латвия',
  'Литва',
  'Финляндия',
  'Швеция',
  'Норвегия',
  'Дания',
  'Исландия',
  'Ирландия',
  'Португалия',
  'Греция',
  'Кипр',
  'Мальта',
  'Люксембург',
  'Бельгия',
  'Нидерланды',
  'Австрия',
  'Швейцария',
  'Лихтенштейн',
  'Монако',
  'Андорра',
  'Сан-Марино',
  'Ватикан'
].sort();

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
  activeSection: 'dashboard' | 'personalInfo' | 'password' | 'coins' | 'settings';
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
  const [aboutMessage, setAboutMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [isEditingAbout, setIsEditingAbout] = useState(false);
  const [showAttentionAnimation, setShowAttentionAnimation] = useState(false);
  const [messagesFading] = useState({ message: false, aboutMessage: false });
  const [savedStatus, setSavedStatus] = useState({ profile: false, about: false });
  const [socialValidationErrors, setSocialValidationErrors] = useState<{
    instagram?: string;
    facebook?: string;
    telegram?: string;
  }>({});
  const [countryDropdownOpen, setCountryDropdownOpen] = useState(false);
  const [countrySearchQuery, setCountrySearchQuery] = useState('');
  
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

  // Синхронизация данных "О себе" с пользователем
  useEffect(() => {
    if (user) {
      setAboutData({
        bio: user.bio || '',
        profession: user.profession || '',
        interests: user.interests ? user.interests.split(', ').filter(i => i.trim() !== '') : [],
        instagram: convertToSimpleFormat(user.instagram || '', 'instagram'),
        facebook: convertToSimpleFormat(user.facebook || '', 'facebook'),
        telegram: convertToSimpleFormat(user.telegram || '', 'telegram')
      });
    }
  }, [user]);


  
  // Handle profile update
  const handleProfileSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setMessage(null);
    
    try {
      // Включаем текущий avatar в данные для предотвращения его потери
      const dataWithAvatar = {
        ...profileData,
        avatar: user?.avatar // Сохраняем текущий avatar
      };
      
      await updateProfile(dataWithAvatar);
      setIsEditing(false);
      
      // Показываем статус "Сохранено" на 1 секунду
      setSavedStatus(prev => ({ ...prev, profile: true }));
      setTimeout(() => {
        setSavedStatus(prev => ({ ...prev, profile: false }));
      }, 1000);
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

  // Handle about section save
  const handleAboutSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Проверяем валидацию социальных сетей
    const hasValidationErrors = Object.values(socialValidationErrors).some(error => error !== null && error !== undefined);
    if (hasValidationErrors) {
      setAboutMessage({ 
        type: 'error', 
        text: 'Исправьте ошибки в ссылках на социальные сети' 
      });
      return;
    }
    
    setLoading(true);
    setAboutMessage(null);
    
    try {
      // Отправляем данные "О себе" на сервер
      await updateProfile({
        bio: aboutData.bio,
        profession: aboutData.profession,
        interests: aboutData.interests.join(', '), // Преобразуем массив в строку
        instagram: convertToFullUrl(aboutData.instagram, 'instagram'),
        facebook: convertToFullUrl(aboutData.facebook, 'facebook'),
        telegram: convertToFullUrl(aboutData.telegram, 'telegram')
      });
      
      setIsEditingAbout(false);
      
      // Показываем статус "Сохранено" на 1 секунду
      setSavedStatus(prev => ({ ...prev, about: true }));
      setTimeout(() => {
        setSavedStatus(prev => ({ ...prev, about: false }));
      }, 1000);
    } catch (error) {
      setAboutMessage({ 
        type: 'error', 
        text: error instanceof Error ? error.message : 'Ошибка при обновлении информации' 
      });
    } finally {
      setLoading(false);
    }
  };



  // Валидация социальных сетей
  const validateSocialUrl = (url: string, platform: 'instagram' | 'facebook' | 'telegram'): string | null => {
    if (!url.trim()) return null; // Пустые поля разрешены
    
    const trimmedUrl = url.trim();
    
    // Паттерны для различных форматов
    const patterns = {
      instagram: [
        // Полные URL
        /^https?:\/\/(www\.)?(instagram\.com|instagr\.am)\/[\w\.-]+\/?$/i,
        // Упрощенные форматы
        /^(www\.)?(instagram\.com|instagr\.am)\/[\w\.-]+\/?$/i,
        /^instagram\.com\/[\w\.-]+\/?$/i,
        /^@?[\w\.-]+$/i // username или @username
      ],
      facebook: [
        // Полные URL
        /^https?:\/\/(www\.)?(facebook\.com|fb\.com)\/[\w\.-]+\/?$/i,
        // Упрощенные форматы
        /^(www\.)?(facebook\.com|fb\.com)\/[\w\.-]+\/?$/i,
        /^facebook\.com\/[\w\.-]+\/?$/i,
        /^@?[\w\.-]+$/i // username или @username
      ],
      telegram: [
        // Полные URL
        /^https?:\/\/(www\.)?(telegram\.me|t\.me)\/[\w\.-]+\/?$/i,
        // Упрощенные форматы
        /^(www\.)?(telegram\.me|t\.me)\/[\w\.-]+\/?$/i,
        /^t\.me\/[\w\.-]+\/?$/i,
        /^@[\w\.-]+$/i // @username
      ]
    };

    const isValid = patterns[platform].some(pattern => pattern.test(trimmedUrl));
    
    if (!isValid) {
      const platformMessages = {
        instagram: 'Введите username или instagram.com/username',
        facebook: 'Введите username или facebook.com/username',
        telegram: 'Введите @username или t.me/username'
      };
      return platformMessages[platform];
    }
    
    return null;
  };

  // Функция для конвертации упрощенного формата в полный URL
  const convertToFullUrl = (url: string, platform: 'instagram' | 'facebook' | 'telegram'): string => {
    if (!url.trim()) return '';
    
    const trimmedUrl = url.trim();
    
    // Если уже полный URL, возвращаем как есть
    if (trimmedUrl.startsWith('http://') || trimmedUrl.startsWith('https://')) {
      return trimmedUrl;
    }
    
    // Конвертируем упрощенные форматы
    switch (platform) {
      case 'instagram':
        if (trimmedUrl.includes('instagram.com/')) {
          return `https://${trimmedUrl}`;
        }
        // Если просто username или @username
        const instagramUsername = trimmedUrl.replace(/^@/, '');
        return `https://instagram.com/${instagramUsername}`;
        
      case 'facebook':
        if (trimmedUrl.includes('facebook.com/')) {
          return `https://${trimmedUrl}`;
        }
        // Если просто username или @username
        const facebookUsername = trimmedUrl.replace(/^@/, '');
        return `https://facebook.com/${facebookUsername}`;
        
      case 'telegram':
        if (trimmedUrl.includes('t.me/')) {
          return `https://${trimmedUrl}`;
        }
        // Если @username
        if (trimmedUrl.startsWith('@')) {
          const telegramUsername = trimmedUrl.replace(/^@/, '');
          return `https://t.me/${telegramUsername}`;
        }
        // Если просто username
        return `https://t.me/${trimmedUrl}`;
        
      default:
        return trimmedUrl;
    }
  };

  // Функция для конвертации полного URL в упрощенный формат для отображения
  const convertToSimpleFormat = (url: string, platform: 'instagram' | 'facebook' | 'telegram'): string => {
    if (!url.trim()) return '';
    
    const trimmedUrl = url.trim();
    
    try {
      switch (platform) {
        case 'instagram':
          // Убираем https://, www., оставляем instagram.com/username
          return trimmedUrl
            .replace(/^https?:\/\/(www\.)?/, '')
            .replace(/\/$/, '');
            
        case 'facebook':
          // Убираем https://, www., оставляем facebook.com/username
          return trimmedUrl
            .replace(/^https?:\/\/(www\.)?/, '')
            .replace(/\/$/, '');
            
        case 'telegram':
          // Для Telegram показываем @username если это t.me ссылка
          if (trimmedUrl.includes('t.me/')) {
            const username = trimmedUrl.replace(/^https?:\/\/(www\.)?t\.me\//, '');
            return `@${username}`;
          }
          return trimmedUrl;
          
        default:
          return trimmedUrl;
      }
    } catch {
      return trimmedUrl;
    }
  };

  const handleSocialChange = (platform: 'instagram' | 'facebook' | 'telegram', value: string) => {
    // Обновляем значение
    setAboutData(prev => ({ ...prev, [platform]: value }));
    
    // Валидируем
    const error = validateSocialUrl(value, platform);
    setSocialValidationErrors(prev => ({ 
      ...prev, 
      [platform]: error 
    }));
  };

  // Функции для работы с выпадающим списком стран
  const filteredCountries = COUNTRIES.filter(country =>
    country.toLowerCase().includes(countrySearchQuery.toLowerCase())
  );

  const handleCountrySelect = (country: string) => {
    setProfileData(prev => ({ ...prev, country }));
    setCountryDropdownOpen(false);
    setCountrySearchQuery('');
  };

  const handleCountryInputChange = (value: string) => {
    setProfileData(prev => ({ ...prev, country: value }));
    setCountrySearchQuery(value);
    setCountryDropdownOpen(true);
  };

  const handleDisabledElementClick = () => {
    if (!isEditing) {
      setShowAttentionAnimation(true);
      // Убираем анимацию через время её выполнения
      setTimeout(() => setShowAttentionAnimation(false), 600);
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
        {/* Дашборд - левая колонка */}
        {activeSection === 'dashboard' && (
          <UserDashboard column="left" />
        )}
        
        {/* Карточка профиля - только для personalInfo */}
        {activeSection === 'personalInfo' && (
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
        )}
        
        {/* Блок profile-content только для не-dashboard секций */}
        {activeSection !== 'dashboard' && (
          <div className="profile-content">
          <div className="profile-main-content">
            {message && message.type === 'error' && (
              <div className={`profile-message ${message.type} ${messagesFading.message ? 'fade-out' : ''}`}>
                {message.text}
              </div>
            )}
          

          
          {activeSection === 'personalInfo' && (
            <div className="profile-section">
              <div className="profile-section-header">
                <h2>📋 Профиль</h2>
                {!isEditing ? (
                  <button 
                    className={`profile-edit-button ${showAttentionAnimation ? 'attention' : ''} ${savedStatus.profile ? 'saved' : ''}`}
                    onClick={() => setIsEditing(true)}
                    disabled={savedStatus.profile}
                  >
                    {savedStatus.profile ? 'Сохранено' : t('profile.edit')}
                  </button>
                ) : (
                  <div className="profile-edit-buttons">
                    <button 
                      className="profile-save-button"
                      onClick={handleProfileSubmit}
                      disabled={loading}
                    >
                      {loading ? 'Сохранение...' : 'Сохранить'}
                    </button>
                    <button 
                      className="profile-cancel-button"
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
                      disabled={loading}
                    >
                      {t('profile.cancel')}
                    </button>
                  </div>
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
                      onPointerDown={!isEditing ? (e) => {
                        e.preventDefault();
                        handleDisabledElementClick();
                      } : undefined}
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
                      onPointerDown={!isEditing ? (e) => {
                        e.preventDefault();
                        handleDisabledElementClick();
                      } : undefined}
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
                    onPointerDown={!isEditing ? (e) => {
                      e.preventDefault();
                      handleDisabledElementClick();
                    } : undefined}
                  />
                </div>

                <div className="form-group">
                  <label>Пол</label>
                  <select
                    value={profileData.gender}
                    onChange={(e) => setProfileData({...profileData, gender: e.target.value})}
                    disabled={!isEditing}
                    className="profile-input"
                    onPointerDown={!isEditing ? (e) => {
                      e.preventDefault();
                      handleDisabledElementClick();
                    } : undefined}
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
                    onPointerDown={!isEditing ? (e) => {
                      e.preventDefault();
                      handleDisabledElementClick();
                    } : undefined}
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
                    placeholder="+38 066 33 74 923"
                    onPointerDown={!isEditing ? (e) => {
                      e.preventDefault();
                      handleDisabledElementClick();
                    } : undefined}
                  />
                </div>

                <div className="form-group">
                  <label>Страна</label>
                  <div className="country-selector">
                    <input
                      type="text"
                      value={profileData.country}
                      onChange={(e) => handleCountryInputChange(e.target.value)}
                      onFocus={() => setCountryDropdownOpen(true)}
                      onBlur={() => setTimeout(() => setCountryDropdownOpen(false), 200)}
                      disabled={!isEditing}
                      className="profile-input"
                      placeholder="Начните вводить название страны"
                      autoComplete="off"
                      onPointerDown={!isEditing ? (e) => {
                        e.preventDefault();
                        handleDisabledElementClick();
                      } : undefined}
                    />
                    {countryDropdownOpen && isEditing && filteredCountries.length > 0 && (
                      <div className="country-dropdown">
                        {filteredCountries.slice(0, 8).map((country) => (
                          <div
                            key={country}
                            className={`country-option ${profileData.country === country ? 'selected' : ''}`}
                            onMouseDown={() => handleCountrySelect(country)}
                          >
                            {country}
                          </div>
                        ))}
                        {filteredCountries.length > 8 && (
                          <div className="country-option-info">
                            И еще {filteredCountries.length - 8} стран...
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </div>
                
                {isEditing && (
                  <div className="form-actions">
                    <button 
                      type="submit" 
                      className="profile-save-button"
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
                    className="profile-save-button"
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
                    className="profile-save-button"
                    disabled={loading}
                  >
                    {loading ? t('common.loading') : t('profile.saveSettings')}
                  </button>
                </div>
              </form>
            </div>
          )}

        {/* Контент для coins в левой колонке */}
        {activeSection === 'coins' && (
          <CoinTransactionsLeft />
        )}

          </div>
          </div>
        )}
      </div>
      
      {/* Правая колонка с блоком "О себе" - только для personalInfo */}
      {activeSection === 'personalInfo' && (
        <div className="profile-right-column">        
        {/* Блок "О себе" - только для personalInfo */}
        <div className="profile-about">
          {aboutMessage && aboutMessage.type === 'error' && (
            <div className={`profile-message ${aboutMessage.type} ${messagesFading.aboutMessage ? 'fade-out' : ''}`}>
              {aboutMessage.text}
            </div>
          )}

          <div className="about-header">
            <h2>📝 О себе</h2>
            {!isEditingAbout ? (
              <button 
                className={`profile-edit-button ${savedStatus.about ? 'saved' : ''}`}
                onClick={() => setIsEditingAbout(true)}
                disabled={savedStatus.about}
              >
                {savedStatus.about ? 'Сохранено' : 'Редактировать'}
              </button>
            ) : (
              <div className="profile-edit-buttons">
                <button 
                  className="profile-save-button"
                  onClick={handleAboutSubmit}
                  disabled={loading}
                >
                  {loading ? 'Сохранение...' : 'Сохранить'}
                </button>
                <button 
                  className="profile-cancel-button"
                  onClick={() => setIsEditingAbout(false)}
                  disabled={loading}
                >
                  Отмена
                </button>
              </div>
            )}
          </div>

          <div className="about-content">
            {/* Коротко о себе */}
            <div className="about-section">
              <label>Коротко о себе</label>
              <textarea
                value={aboutData.bio || ''}
                onChange={isEditingAbout ? (e) => setAboutData({...aboutData, bio: e.target.value}) : undefined}
                className="profile-textarea"
                placeholder={isEditingAbout ? "Расскажите немного о себе..." : "Информация не указана"}
                rows={3}
                readOnly={!isEditingAbout}
              />
            </div>

            {/* Профессия */}
            <div className="about-section">
              <label>Кем работаете</label>
              <select
                value={aboutData.profession || ''}
                onChange={isEditingAbout ? (e) => setAboutData({...aboutData, profession: e.target.value}) : undefined}
                className="profile-select"
                disabled={!isEditingAbout}
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
                    className={`interest-tag ${aboutData.interests.includes(interest) ? 'active' : ''} ${!isEditingAbout ? 'readonly' : ''}`}
                    onClick={isEditingAbout ? () => {
                      const newInterests = aboutData.interests.includes(interest)
                        ? aboutData.interests.filter(i => i !== interest)
                        : [...aboutData.interests, interest];
                      setAboutData({...aboutData, interests: newInterests});
                    } : undefined}
                  >
                    {interest}
                  </button>
                ))}
              </div>
            </div>

            {/* Социальные сети */}
            <div className="about-section">
              <h4>Социальные сети</h4>
              <div className="profile-social-links">
                <div className="profile-social-input">
                  <img src="/icons/tools_instagram.svg" alt="Instagram" className="social-icon" />
                  <div className="social-input-wrapper">
                    <input
                      type="url"
                      value={aboutData.instagram}
                      onChange={isEditingAbout ? (e) => handleSocialChange('instagram', e.target.value) : undefined}
                      className={`profile-input ${socialValidationErrors.instagram ? 'error' : ''}`}
                      placeholder="instagram.com/username"
                      disabled={!isEditingAbout}
                    />
                    {socialValidationErrors.instagram && (
                      <div className="social-validation-error">{socialValidationErrors.instagram}</div>
                    )}
                  </div>
                </div>
                <div className="profile-social-input">
                  <img src="/icons/tools_facebook.svg" alt="Facebook" className="social-icon" />
                  <div className="social-input-wrapper">
                    <input
                      type="url"
                      value={aboutData.facebook}
                      onChange={isEditingAbout ? (e) => handleSocialChange('facebook', e.target.value) : undefined}
                      className={`profile-input ${socialValidationErrors.facebook ? 'error' : ''}`}
                      placeholder="facebook.com/username"
                      disabled={!isEditingAbout}
                    />
                    {socialValidationErrors.facebook && (
                      <div className="social-validation-error">{socialValidationErrors.facebook}</div>
                    )}
                  </div>
                </div>
                <div className="profile-social-input">
                  <img src="/icons/tools_telegram.svg" alt="Telegram" className="social-icon" />
                  <div className="social-input-wrapper">
                    <input
                      type="url"
                      value={aboutData.telegram}
                      onChange={isEditingAbout ? (e) => handleSocialChange('telegram', e.target.value) : undefined}
                      className={`profile-input ${socialValidationErrors.telegram ? 'error' : ''}`}
                      placeholder="t.me/username или @username"
                      disabled={!isEditingAbout}
                    />
                    {socialValidationErrors.telegram && (
                      <div className="social-validation-error">{socialValidationErrors.telegram}</div>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* Дублированная кнопка сохранения в нижней части формы */}
            {isEditingAbout && (
              <div className="form-actions">
                <button 
                  type="button" 
                  className="profile-save-button"
                  onClick={handleAboutSubmit}
                  disabled={loading}
                >
                  {loading ? 'Сохранение...' : 'Сохранить'}
                </button>
              </div>
            )}
          </div>
        </div>
        </div>
      )}

      {/* Правая колонка для password и settings */}
      {(activeSection === 'password' || activeSection === 'settings') && (
        <div className="profile-right-column">
          {/* Пустая правая колонка для будущего контента */}
        </div>
      )}

      {/* Правая колонка для дашборда */}
      {activeSection === 'dashboard' && (
        <div className="profile-right-column">
          <UserDashboard column="right" />
        </div>
      )}

      {/* Правая колонка для coins */}
      {activeSection === 'coins' && (
        <div className="profile-right-column">
          <CoinTransactionsRight />
        </div>
      )}
    </div>
  );
};

export default UserProfile;