import React from 'react';
import { Link } from 'react-router-dom';
import './AdminSidebar.css';

interface AdminSidebarProps {
  activeSection: string;
  onSectionChange: (section: string) => void;
}

export interface AdminMenuItem {
  id: string;
  title: string;
  icon: string;
  path: string;
}

const AdminSidebar: React.FC<AdminSidebarProps> = ({ activeSection, onSectionChange }) => {
  const menuItems: AdminMenuItem[] = [
    {
      id: 'dashboard',
      title: 'Дашборд',
      icon: '📊',
      path: '/admin/dashboard'
    },
    {
      id: 'tools',
      title: 'Инструменты',
      icon: '🛠️',
      path: '/admin/tools'
    },
    {
      id: 'users',
      title: 'Пользователи',
      icon: '👥',
      path: '/admin/users'
    },
    {
      id: 'finance',
      title: 'Финансы',
      icon: '💰',
      path: '/admin/finance'
    },
    {
      id: 'admins',
      title: 'Администраторы',
      icon: '👨‍💼',
      path: '/admin/admins'
    },
    {
      id: 'logs',
      title: 'Логи',
      icon: '📋',
      path: '/admin/logs'
    },
    {
      id: 'integrations',
      title: 'Интеграции',
      icon: '🔗',
      path: '/admin/integrations'
    }
  ];

  return (
    <div className="admin-sidebar">
      <div className="admin-sidebar-header">
        <div className="admin-logo">
          <span className="admin-logo-icon">⚙️</span>
          <span className="admin-logo-text">Админ-панель</span>
        </div>
      </div>

      <nav className="admin-nav">
        <ul className="admin-nav-list">
          {menuItems.map((item) => (
            <li key={item.id} className="admin-nav-item">
              <Link
                to={item.path}
                className={`admin-nav-link ${activeSection === item.id ? 'active' : ''}`}
                onClick={() => onSectionChange(item.id)}
                title={item.title}
              >
                <span className="admin-nav-icon">{item.icon}</span>
                <span className="admin-nav-text">{item.title}</span>
              </Link>
            </li>
          ))}
        </ul>
      </nav>

      <div className="admin-sidebar-footer">
        <div className="admin-version">
          <span>v1.2</span>
        </div>
      </div>
    </div>
  );
};

export default AdminSidebar;