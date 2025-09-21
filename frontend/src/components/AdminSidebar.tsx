import React from 'react';
import { Link } from 'react-router-dom';
import './AdminSidebar.css';

interface AdminSidebarProps {
  activeSection: string;
  onSectionChange: (section: string) => void;
  onLogout: () => void;
}

export interface AdminMenuItem {
  id: string;
  title: string;
  icon: string;
  path: string;
}

const AdminSidebar: React.FC<AdminSidebarProps> = ({ activeSection, onSectionChange, onLogout }) => {
  const menuItems: AdminMenuItem[] = [
    {
      id: 'dashboard',
      title: 'Дашборд',
      icon: '/icons/admin/admin_dashboard.svg',
      path: '/admin/dashboard'
    },
    {
      id: 'tools',
      title: 'Инструменты',
      icon: '/icons/admin/admin_tools.svg',
      path: '/admin/tools'
    },
    {
      id: 'users',
      title: 'Пользователи',
      icon: '/icons/admin/admin_users.svg',
      path: '/admin/users'
    },
    {
      id: 'finance',
      title: 'Финансы',
      icon: '/icons/admin/admin_money.svg',
      path: '/admin/finance'
    },
    {
      id: 'admins',
      title: 'Администраторы',
      icon: '/icons/admin/admin_admin.svg',
      path: '/admin/admins'
    },
    {
      id: 'logs',
      title: 'Логи',
      icon: '/icons/admin/admin_logs.svg',
      path: '/admin/logs'
    },
    {
      id: 'integrations',
      title: 'Интеграции',
      icon: '/icons/admin/admin_integration.svg',
      path: '/admin/integrations'
    }
  ];

  return (
    <div className="admin-sidebar">
      <div className="admin-sidebar-header">
        <div className="admin-logo">
          <img src="/icons/admin/admin_logo.svg" alt="WeKey Tools" />
        </div>
      </div>

      <div className="admin-sidebar-divider"></div>

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
                <img src={item.icon} alt={item.title} className="admin-nav-icon" />
                <span className="admin-nav-text">{item.title}</span>
              </Link>
            </li>
          ))}
        </ul>

        <div className="admin-logout-section">
          <button onClick={onLogout} className="admin-logout-button">
            <img src="/icons/admin/admin_log_out.svg" alt="Выйти" className="admin-logout-icon" />
            <span>Выйти</span>
          </button>
        </div>
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