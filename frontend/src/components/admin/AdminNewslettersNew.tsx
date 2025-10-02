import React, { useState } from 'react';
import EmailTemplates from './newsletters/EmailTemplates';
import BlocksLibrary from './newsletters/BlocksLibrary';
import Campaigns from './newsletters/Campaigns';
import Audiences from './newsletters/Audiences';
import Automations from './newsletters/Automations';
import './AdminNewslettersNew.css';

type TabType = 'templates' | 'blocks' | 'campaigns' | 'audiences' | 'automations';

const AdminNewslettersNew: React.FC = () => {
  const [activeTab, setActiveTab] = useState<TabType>('templates');

  const tabs = [
    { 
      id: 'templates' as TabType, 
      label: 'Письма', 
      icon: '📧',
      description: 'Шаблоны и системные письма'
    },
    { 
      id: 'blocks' as TabType, 
      label: 'Библиотека блоков', 
      icon: '📦',
      description: 'Переиспользуемые блоки'
    },
    { 
      id: 'campaigns' as TabType, 
      label: 'Рассылки', 
      icon: '📨',
      description: 'История отправок'
    },
    { 
      id: 'audiences' as TabType, 
      label: 'Аудитории', 
      icon: '👥',
      description: 'Сегменты пользователей'
    },
    { 
      id: 'automations' as TabType, 
      label: 'Сценарии', 
      icon: '🤖',
      description: 'Автоматические рассылки'
    }
  ];

  const renderTabContent = () => {
    switch (activeTab) {
      case 'templates':
        return <EmailTemplates />;
      case 'blocks':
        return <BlocksLibrary />;
      case 'campaigns':
        return <Campaigns />;
      case 'audiences':
        return <Audiences />;
      case 'automations':
        return <Automations />;
      default:
        return <EmailTemplates />;
    }
  };

  return (
    <div className="admin-newsletters-new-container">
      {/* Header */}
      <div className="newsletters-header">
        <div className="header-content">
          <h1>📬 Email-маркетинг</h1>
          <p className="header-subtitle">
            Управление письмами, рассылками и автоматизацией
          </p>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="newsletters-tabs">
        <div className="tabs-container">
          {tabs.map(tab => (
            <button
              key={tab.id}
              className={`tab-button ${activeTab === tab.id ? 'active' : ''}`}
              onClick={() => setActiveTab(tab.id)}
            >
              <span className="tab-icon">{tab.icon}</span>
              <span className="tab-label">{tab.label}</span>
              {activeTab === tab.id && (
                <span className="tab-description">{tab.description}</span>
              )}
            </button>
          ))}
        </div>
      </div>

      {/* Tab Content */}
      <div className="tab-content">
        {renderTabContent()}
      </div>
    </div>
  );
};

export default AdminNewslettersNew;
