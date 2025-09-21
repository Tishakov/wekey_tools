// Утилита для работы с разделами админки

// Функция для получения названия раздела
export const getSectionTitle = (section: string): string => {
  switch (section) {
    case 'dashboard': return 'Дашборд';
    case 'tools': return 'Инструменты';
    case 'users': return 'Пользователи';
    case 'finance': return 'Финансы';
    case 'admins': return 'Администраторы';
    case 'logs': return 'Логи';
    case 'integrations': return 'Интеграции';
    default: return 'Дашборд';
  }
};

// Функция для получения активного раздела из URL
export const getActiveSectionFromUrl = (pathname: string): string => {
  if (pathname === '/admin' || pathname === '/admin/dashboard') return 'dashboard';
  if (pathname === '/admin/tools') return 'tools';
  if (pathname === '/admin/users') return 'users';
  if (pathname === '/admin/finance') return 'finance';
  if (pathname === '/admin/admins') return 'admins';
  if (pathname === '/admin/logs') return 'logs';
  if (pathname === '/admin/integrations') return 'integrations';
  return 'dashboard';
};

// Типы для разделов админки
export type AdminSection = 'dashboard' | 'tools' | 'users' | 'finance' | 'admins' | 'logs' | 'integrations';

// Список всех разделов
export const adminSections: AdminSection[] = [
  'dashboard',
  'tools', 
  'users',
  'finance',
  'admins',
  'logs',
  'integrations'
];