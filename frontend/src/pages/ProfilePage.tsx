import React from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import ProfileLayout from '../components/ProfileLayout';
import ProfileSidebar from '../components/ProfileSidebar';
import UserProfile from './UserProfile';
import './ProfilePage.css';

// Маппинг URL параметров к разделам
const sectionMapping = {
  'personal-info': 'personalInfo' as const,
  'password': 'password' as const,
  'transaction-history': 'coins' as const,
  'settings': 'settings' as const,
};

const reverseSectionMapping = {
  'personalInfo': 'personal-info',
  'password': 'password',
  'coins': 'transaction-history',
  'settings': 'settings',
};

const ProfilePage: React.FC = () => {
  const { lang } = useParams<{ lang: string }>();
  const navigate = useNavigate();
  const location = useLocation();
  
  // Получаем текущий раздел из URL
  const currentPath = location.pathname.split('/').pop() || 'personal-info';
  const activeSection = sectionMapping[currentPath as keyof typeof sectionMapping] || 'personalInfo';

  // Функция для изменения раздела через навигацию
  const handleSectionChange = (section: string) => {
    const typedSection = section as 'personalInfo' | 'password' | 'coins' | 'settings';
    const urlSection = reverseSectionMapping[typedSection];
    navigate(`/${lang}/profile/${urlSection}`);
  };

  return (
    <ProfileLayout>
      <div className="profile-page-container">
        <ProfileSidebar 
          activeSection={activeSection}
          onSectionChange={handleSectionChange}
        />
        <div className="profile-page-content">
          <UserProfile 
            activeSection={activeSection}
          />
        </div>
      </div>
    </ProfileLayout>
  );
};

export default ProfilePage;