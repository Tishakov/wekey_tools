# User Interface Components Guide - admin_users_1.2

## 🎨 Обзор системы дизайна

Руководство по компонентам пользовательского интерфейса WeKey Tools с фокусом на консистентность, профессиональный внешний вид и отличный пользовательский опыт.

## 🔧 UserButton Component - Dropdown Menu System

### Архитектура компонента
Полностью редизайненный компонент пользовательского меню в заголовке сайта с современным dropdown интерфейсом.

#### Структура файлов:
```
frontend/src/components/Header/
├── UserButton.tsx          # Основная логика компонента
└── UserButton.css          # Стили и анимации
```

### 🎯 Функциональность

#### Основные возможности:
- **6 разделов меню** с логической группировкой функций
- **Анимации открытия/закрытия** с плавными переходами
- **SVG иконки 22x22** из проектных ассетов
- **Автоматическая загрузка аватара** после авторизации
- **Адаптивный дизайн** для всех устройств

#### Структура меню:
```typescript
const menuStructure = [
  { 
    id: 'profile', 
    label: 'Мой профиль', 
    icon: 'profile.svg',
    action: () => navigate('/profile')
  },
  { 
    id: 'theme', 
    label: 'Тема оформления', 
    icon: 'theme.svg',
    action: () => toggleTheme()
  },
  { 
    id: 'balance', 
    label: 'Мой баланс', 
    icon: 'wallet.svg',
    value: user?.balance || 0,
    action: () => navigate('/balance')
  },
  { 
    id: 'support', 
    label: 'Поддержка', 
    icon: 'support.svg',
    action: () => navigate('/support')
  },
  { 
    id: 'settings', 
    label: 'Настройки', 
    icon: 'settings.svg',
    action: () => navigate('/settings')
  },
  { 
    id: 'logout', 
    label: 'Выйти', 
    icon: 'logout.svg',
    action: () => logout()
  }
];
```

### 🎨 Стили и анимации

#### CSS Keyframes:
```css
@keyframes dropdown-slide-down {
  from {
    opacity: 0;
    transform: translateY(-10px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

@keyframes dropdown-slide-up {
  from {
    opacity: 1;
    transform: translateY(0);
  }
  to {
    opacity: 0;
    transform: translateY(-10px);
  }
}
```

#### Визуальные элементы:
```css
/* Dropdown тень */
.user-dropdown {
  box-shadow: 0 8px 25px rgba(0, 0, 0, 0.15);
}

/* Баланс пользователя */
.balance-amount {
  color: #4CAF50;
  font-weight: 600;
}

/* SVG иконки */
.dropdown-item-icon {
  width: 22px;
  height: 22px;
  margin-right: 12px;
}
```

### 🔧 Техническая реализация

#### Состояние компонента:
```typescript
interface UserButtonState {
  isOpen: boolean;        // Открыт ли dropdown
  isClosing: boolean;     // Анимация закрытия
  user: User | null;      // Данные пользователя
}
```

#### Обработка анимаций:
```typescript
const closeDropdown = () => {
  setIsClosing(true);
  setTimeout(() => {
    setIsOpen(false);
    setIsClosing(false);
  }, 200); // Длительность анимации
};
```

#### Загрузка аватара:
```typescript
// В AuthContext.tsx - исправление загрузки профиля
const login = async (credentials: LoginCredentials) => {
  try {
    const response = await authAPI.login(credentials);
    localStorage.setItem('token', response.token);
    
    // КРИТИЧЕСКИ ВАЖНО: дополнительный вызов для полного профиля
    await checkAuth();
    
    return response;
  } catch (error) {
    throw error;
  }
};
```

### 📱 Адаптивность и UX

#### Поведение на мобильных устройствах:
- **Touch-friendly** размеры элементов (минимум 44px)
- **Правильное позиционирование** dropdown относительно экрана
- **Автоматическое закрытие** при клике вне области

#### Accessibility (A11Y):
- **ARIA labels** для screen readers
- **Keyboard navigation** поддержка
- **Focus management** при открытии/закрытии

## 🎨 Design System Guidelines

### Цветовая палитра:
```css
:root {
  /* Основные цвета */
  --primary-gradient: linear-gradient(135deg, #5E35F2 0%, #F22987 100%);
  --background-dark: #28282A;
  --text-primary: #BCBBBD;
  --text-secondary: #888;
  
  /* Состояния */
  --success-color: #4CAF50;
  --warning-color: #f44336;
  --hover-color: #333335;
}
```

### Типографика:
```css
/* Основной шрифт проекта */
font-family: 'Gilroy', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;

/* Размеры текста */
--text-large: 16px;      /* Заголовки меню */
--text-medium: 14px;     /* Основной текст */
--text-small: 12px;      /* Дополнительная информация */

/* Толщина шрифта */
--font-semibold: 600;    /* Важные элементы */
--font-medium: 500;      /* Обычный текст */
--font-regular: 400;     /* Вспомогательный текст */
```

### Spacing и размеры:
```css
/* Отступы */
--spacing-xs: 4px;
--spacing-sm: 8px;
--spacing-md: 12px;
--spacing-lg: 16px;
--spacing-xl: 24px;

/* Радиусы скругления */
--border-radius-sm: 6px;
--border-radius-md: 8px;
--border-radius-lg: 12px;

/* Тени */
--shadow-light: 0 2px 8px rgba(0, 0, 0, 0.1);
--shadow-medium: 0 4px 12px rgba(0, 0, 0, 0.15);
--shadow-heavy: 0 8px 25px rgba(0, 0, 0, 0.15);
```

## 🔧 Интеграция с проектом

### Использование SVG иконок:
```typescript
// Правильный путь к иконкам
const iconPath = `/icons/${iconName}`;

// Компонент иконки
<img 
  src={iconPath} 
  alt={label} 
  className="dropdown-item-icon"
  width="22" 
  height="22" 
/>
```

### Подключение к AuthContext:
```typescript
import { useAuth } from '../../contexts/AuthContext';

const UserButton: React.FC = () => {
  const { user, logout } = useAuth();
  // ... логика компонента
};
```

### CSS модули и классы:
```css
/* Семантическое именование классов */
.user-button { }              /* Основная кнопка */
.user-dropdown { }            /* Dropdown контейнер */
.dropdown-item { }            /* Элемент меню */
.dropdown-item-icon { }       /* Иконка элемента */
.balance-amount { }           /* Сумма баланса */
```

## 📊 Performance и оптимизация

### Оптимизации компонента:
- **Lazy loading** SVG иконок
- **Мемоизация** обработчиков событий
- **Debouncing** для анимаций
- **CSS transitions** вместо JavaScript анимаций

### Bundle size:
- **SVG иконки**: ~2KB общий размер
- **CSS анимации**: ~1KB дополнительного кода
- **TypeScript типы**: 0KB (компилируются)

## 🚀 Будущие улучшения

### Планируемые возможности:
- [ ] **Keyboard shortcuts** для быстрого доступа
- [ ] **Уведомления** в dropdown меню
- [ ] **Быстрые действия** без перехода на страницы
- [ ] **Кастомизация** порядка пунктов меню
- [ ] **Темная/светлая тема** переключатель
- [ ] **Статус онлайн** индикатор

### Технические улучшения:
- [ ] **Unit tests** для всех функций
- [ ] **Storybook** для документации компонентов
- [ ] **Performance monitoring** анимаций
- [ ] **A11Y audit** и улучшения

## 🔍 Troubleshooting

### Частые проблемы:

#### Аватар не загружается после логина:
```typescript
// Решение: дополнительный вызов checkAuth()
await authAPI.login(credentials);
await checkAuth(); // Получает полный профиль с аватаром
```

#### Анимация не работает:
```css
/* Проверить наличие keyframes */
@keyframes dropdown-slide-down { /* ... */ }

/* Правильное применение */
.user-dropdown.closing {
  animation: dropdown-slide-up 0.2s ease-out forwards;
}
```

#### SVG иконки не отображаются:
```typescript
// Проверить путь к файлам
const iconPath = `/icons/${iconName}`; // без src/assets
```

---

**Версия документации**: admin_users_1.2  
**Последнее обновление**: 21.09.2025  
**Статус**: ✅ Актуально и проверено  
**Автор**: Tishakov & GitHub Copilot