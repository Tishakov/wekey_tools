import React, { useState } from 'react';
import ProfileLayout from '../components/ProfileLayout';
import ProfileSidebar from '../components/ProfileSidebar';
import UserProfile from './UserProfile';
import './ProfilePage.css';

const ProfilePage: React.FC = () => {
  const [activeSection, setActiveSection] = useState<'personalInfo' | 'password' | 'coins' | 'settings'>('personalInfo');

  return (
    <ProfileLayout>
      <div className="profile-page-container">
        <ProfileSidebar 
          activeSection={activeSection}
          onSectionChange={(section) => setActiveSection(section as 'personalInfo' | 'password' | 'coins' | 'settings')}
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