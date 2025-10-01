# 🛠️ Wekey Tools - Professional Web Tools Platform

[![Version](https://img.shields.io/badge/version-1.0.0-blue.svg)](CHANGELOG.md)
[![License](https://img.shields.io/badge/license-MIT-green.svg)](LICENSE)
[![Status](https://img.shields.io/badge/status-production%20ready-success.svg)](PROJECT_CONTEXT.md)

Полнофункциональная веб-платформа с коллекцией из **26 профессиональных инструментов** для работы с текстом, SEO, аналитики, генерации данных и других бизнес-задач.

---

## ✨ Ключевые возможности

- 🔐 **Полная система аутентификации** - JWT с автоматическим refresh
- 👥 **OAuth интеграция** - вход через Google
- 🛠️ **26 профессиональных инструментов** - от генераторов до SEO анализа
- 👑 **Enterprise Admin Panel** - управление пользователями и аналитикой
- 💰 **Фримиум модель** - система монет и подписок
- 📊 **Детальная аналитика** - отслеживание использования и поведения
- 📧 **Система рассылок** - newsletter management
- 🌍 **Многоязычность** - русский, английский, украинский
- 🎨 **Современный UI** - Gilroy шрифт, градиенты, анимации

---

## 🚀 Быстрый старт

### Требования

- **Node.js** >= 18.0.0
- **npm** >= 8.0.0
- **Git**

### Установка

```bash
# 1. Клонируйте репозиторий
git clone https://github.com/Tishakov/wekey_tools.git
cd wekey_tools

# 2. Установите зависимости backend
cd backend
npm install

# 3. Установите зависимости frontend
cd ../frontend
npm install
```

### Запуск (Development)

```bash
# Terminal 1 - Backend (порт 8880)
cd backend
node src/app.js

# Terminal 2 - Frontend (порт 5173)
cd frontend
npm run dev
```

Откройте браузер: **http://localhost:5173**

---

## 📁 Структура проекта

```
wekey_tools/
├── backend/              # Node.js + Express backend
│   ├── src/
│   │   ├── app.js       # Главный файл сервера
│   │   ├── config/      # Конфигурация (БД, auth, passport)
│   │   ├── controllers/ # Бизнес-логика
│   │   ├── models/      # Sequelize модели
│   │   ├── routes/      # API endpoints
│   │   └── middleware/  # Auth, upload и др.
│   └── package.json
│
├── frontend/             # React + TypeScript + Vite
│   ├── src/
│   │   ├── App.tsx      # Главный компонент
│   │   ├── pages/       # Страницы инструментов
│   │   ├── components/  # Переиспользуемые компоненты
│   │   ├── hooks/       # Кастомные React hooks
│   │   ├── services/    # API клиенты
│   │   ├── i18n/        # Переводы (ru/en/uk)
│   │   └── contexts/    # React contexts
│   └── package.json
│
├── docs/                 # 📚 Документация (30+ файлов)
│   ├── API_DOCUMENTATION.md
│   ├── CONTRIBUTING.md
│   ├── CSS_STYLE_GUIDE.md
│   └── ...
│
├── scripts/              # Утилитные скрипты
│   ├── migration/       # Скрипты миграции
│   ├── testing/         # Тестовые скрипты
│   └── utilities/       # Bash утилиты
│
├── tests/                # 🧪 Тесты (в разработке)
│   ├── unit/
│   ├── integration/
│   └── e2e/
│
├── temp/                 # Временные файлы
├── archives/             # Архивы версий
│
├── README.md             # Этот файл
├── CHANGELOG.md          # История изменений
└── PROJECT_CONTEXT.md    # Контекст проекта
```

---

## 🛠️ Инструменты платформы

### Генераторы
- 🔐 Password Generator - генерация безопасных паролей
- 🔢 Number Generator - случайные числа
- 🆔 UUID Generator - уникальные идентификаторы
- 🎨 Color Palette Generator - цветовые палитры
- 📊 Data Generator - тестовые данные

### Текстовые инструменты
- 📝 Case Changer - изменение регистра
- 🔤 Transliteration - транслитерация текста
- 📚 Synonym Generator - синонимы
- 🔀 Word Mixer - перемешивание слов
- 📊 Text Sorting - сортировка строк

### SEO инструменты
- 🔍 **SEO Audit Pro** - профессиональный анализ с Google Search Console
- 🌐 Site Audit - базовый анализ сайта
- 📊 Website Analytics - анализ трафика

### Аналитика
- 📈 Analytics Tool - детальная аналитика
- 📊 Stats Dashboard - дашборд статистики

### Утилиты
- 🔎 Find & Replace - поиск и замена
- ✂️ Text Splitter - разделение текста
- 🧹 Duplicate Remover - удаление дубликатов
- 📏 Character Counter - подсчет символов

И еще **12+ инструментов**!

---

## 👑 Админ-панель

### Доступ (Development)
- **URL**: http://localhost:5173/admin
- **Email**: admin@wekey.tools
- **Password**: admin123

### Возможности
- 👥 **User Management** - управление пользователями
- 🛠️ **Tools Management** - статистика инструментов
- 📊 **Analytics Dashboard** - интерактивные графики
- 📧 **Newsletter Management** - система рассылок
- 📰 **News Management** - управление новостями
- ⚙️ **System Settings** - настройки платформы

---

## 🔐 Аутентификация

### Локальная регистрация
```javascript
POST /api/auth/register
{
  "email": "user@example.com",
  "password": "SecurePass123!",
  "name": "John Doe"
}
```

### OAuth (Google)
```javascript
GET /auth/google
// Редирект на Google OAuth
// Callback: /auth/google/callback
```

### Автоматический refresh токенов
Система автоматически обновляет JWT токены при истечении срока действия без прерывания пользовательского опыта.

---

## 📚 Документация

**📁 Вся документация находится в папке [`/docs`](docs/)**

### Для разработчиков
- 📖 [CONTRIBUTING.md](docs/CONTRIBUTING.md) - гайд для контрибьюторов
- 🎨 [CSS_STYLE_GUIDE.md](docs/CSS_STYLE_GUIDE.md) - CSS стандарты и дизайн-система
- 📡 [API_DOCUMENTATION.md](docs/API_DOCUMENTATION.md) - полная API документация
- 📝 [DEVELOPMENT_NOTES.md](docs/DEVELOPMENT_NOTES.md) - заметки разработки

### Для пользователей
- 🔐 [AUTHENTICATION_GUIDE.md](docs/AUTHENTICATION_GUIDE.md) - гайд по аутентификации
- 🚀 [DEPLOYMENT_GUIDE.md](docs/DEPLOYMENT_GUIDE.md) - деплой на production
- 💰 [FREEMIUM_IMPLEMENTATION_REPORT.md](docs/FREEMIUM_IMPLEMENTATION_REPORT.md) - фримиум модель

### Контекст проекта
- 🎯 [PROJECT_CONTEXT.md](PROJECT_CONTEXT.md) - полный контекст проекта
- 📋 [CHANGELOG.md](CHANGELOG.md) - история изменений
- 🔧 [PROJECT_REFACTOR_REPORT.md](docs/PROJECT_REFACTOR_REPORT.md) - отчет о рефакторинге

**📂 [Смотреть всю документацию →](docs/README.md)**

---

## 🧪 Тестирование

### Запуск тестов
```bash
# Backend тесты
cd backend
npm test

# Frontend тесты
cd frontend
npm test
```

### Тестовые скрипты
```bash
# Проверка структуры БД
node scripts/testing/check_db_structure.js

# Тест API
node scripts/testing/test_admin_login.js

# Проверка инструментов
node scripts/testing/check-analytics.js
```

---

## 🏗️ Технический стек

### Backend
- **Node.js** v18+ - runtime
- **Express** v4 - web framework
- **Sequelize** - ORM
- **SQLite** (dev) / **MySQL** (prod) - database
- **JWT** - authentication
- **Passport** - OAuth strategies
- **Axios** - HTTP client

### Frontend
- **React** v19 - UI framework
- **TypeScript** v5 - type safety
- **Vite** v5 - build tool
- **React Router** v6 - routing
- **i18next** - internationalization
- **Recharts** - data visualization
- **CSS Modules** - styling

### DevOps
- **Git** - version control
- **npm** - package management
- **Nodemon** - development server

---

## 🌍 Локализация

Поддержка 3 языков:
- 🇷🇺 Русский (основной)
- 🇬🇧 English
- 🇺🇦 Українська

```typescript
import { useTranslation } from 'react-i18next';

const Component = () => {
  const { t, i18n } = useTranslation();
  
  return <h1>{t('welcome.title')}</h1>;
};
```

---

## 🎨 Дизайн-система

### Цвета
- **Primary Gradient**: `linear-gradient(135deg, #5E35F2 0%, #F22987 100%)`
- **Typography**: Gilroy font family
- **Shadows**: `0 4px 20px rgba(94, 53, 242, 0.15)`

### Компоненты
- Buttons (primary, secondary, disabled)
- Cards (hover effects, gradient borders)
- Modals (animated, backdrop blur)
- Inputs (focus states, validation)
- Tables (sortable, filterable)

Подробнее: [CSS_STYLE_GUIDE.md](CSS_STYLE_GUIDE.md)

---

## 🤝 Контрибьюторы

Мы приветствуем вклад в развитие проекта! 

1. **Fork** репозиторий
2. Создайте **feature branch** (`git checkout -b feature/amazing-feature`)
3. **Commit** изменения (`git commit -m 'feat: add amazing feature'`)
4. **Push** в ветку (`git push origin feature/amazing-feature`)
5. Откройте **Pull Request**

Подробнее: [CONTRIBUTING.md](CONTRIBUTING.md)

---

## 📊 Статус проекта

### Current Version: `project_refactor_1.0`
- ✅ Production Ready
- ✅ Well Documented
- ✅ Enterprise Grade
- ✅ Security Enhanced

### Метрики
- 📦 **26 инструментов** готовы к использованию
- 👥 **User tracking** система работает
- 🔐 **JWT authentication** с auto-refresh
- 📊 **Admin analytics** в реальном времени
- 💰 **Freemium model** полностью интегрирована

---

## 🐛 Известные проблемы

1. ⚠️ **Backend API Issue** - Sequelize integration требует финального исправления (из newsletter_draft_fix_1.0)

Полный список: [GitHub Issues](https://github.com/Tishakov/wekey_tools/issues)

---

## 📝 Лицензия

Этот проект лицензирован под MIT License - см. файл [LICENSE](LICENSE) для деталей.

---

## 📞 Контакты

- **Email**: admin@wekey.tools
- **GitHub**: [@Tishakov](https://github.com/Tishakov)
- **Website**: http://localhost:5173 (dev)

---

## 🙏 Благодарности

Спасибо всем разработчикам open-source библиотек, которые сделали этот проект возможным!

---

**⭐ Если проект оказался полезным, поставьте звезду на GitHub!**

---

**Последнее обновление**: 01.10.2025  
**Версия**: project_refactor_1.0  
**Статус**: 🚀 Production Ready + Well Documented
