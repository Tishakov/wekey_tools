# 🚀 Wekey Tools SaaS - Система Статистики

Полная система для хранения статистики использования инструментов и управления пользователями.

## ✨ Что реализовано

### 🗄️ Backend (Node.js + Express + SQLite/MySQL)
- **API сервер** на Express.js с JWT аутентификацией
- **База данных** с 4 таблицами: Users, ToolUsage, Subscriptions, Payments
- **Безопасность**: bcrypt, rate limiting, CORS, валидация
- **Роуты**: `/api/auth`, `/api/stats`, `/api/admin`, `/api/users`
- **Логирование** Winston + детальные логи ошибок

### 📊 Frontend (React + TypeScript)
- **Гибридная система**: работает онлайн (с API) + офлайн (localStorage)
- **Админ-панель** по адресу `/admin` с авторизацией
- **Интеграция** с backend через apiService
- **TypeScript** типизация для всех API

### 🎯 Возможности системы

#### Для пользователей:
- Автоматическое отслеживание использования каждого инструмента
- Сохранение статистики в базе данных (а не localStorage)
- Поддержка анонимных пользователей
- Регистрация/авторизация для расширенных возможностей

#### Для администраторов:
- Полная статистика по всем инструментам
- Управление пользователями и подписками
- Просмотр детальной аналитики
- Система платежей (готова к интеграции)

## 🛠️ Технический стек

### Backend:
```
Node.js + Express.js
Sequelize ORM
MySQL / SQLite
JWT + bcrypt
Winston логирование
express-validator
express-rate-limit
```

### Frontend:
```
React 18
TypeScript
Vite
React Router
Fetch API
```

## 🚀 Запуск системы

### 1. Backend сервер
```bash
cd backend
npm install
npm run test-db  # Инициализация БД
npm start        # Запуск на порту 3001
```

### 2. Frontend сервер
```bash
npm install
npm run dev      # Запуск на порту 5174
```

### 3. Тестирование
```bash
# Генерация тестовых данных
node test-stats.cjs

# Или через браузер:
# http://localhost:5174/admin
```

## 🔑 Тестовые данные

### Админ-панель:
- **URL**: http://localhost:5174/admin
- **Email**: admin@wekey.tools  
- **Password**: admin123

### API тестирование:
```bash
# Health check
curl http://localhost:3001/health

# Сохранение статистики
curl -X POST http://localhost:3001/api/stats/increment \
  -H "Content-Type: application/json" \
  -d '{"toolName": "char-counter", "inputLength": 100}'

# Логин админа
curl -X POST http://localhost:3001/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email": "admin@wekey.tools", "password": "admin123"}'
```

## 📈 База данных

### SQLite (для разработки):
- Файл: `backend/database.sqlite`
- Автоматическое создание таблиц
- Тестовые данные включены

### MySQL (для продакшена):
```sql
CREATE DATABASE wekey_tools_dev;
-- Таблицы создаются автоматически через Sequelize
```

## 🔧 Структура проекта

```
wekey_tools/
├── backend/                 # Node.js API сервер
│   ├── src/
│   │   ├── routes/         # API роуты (/auth, /stats, /admin)
│   │   ├── models/         # Sequelize модели БД
│   │   ├── middleware/     # JWT, валидация, ошибки
│   │   ├── config/         # Конфигурация БД и сервера
│   │   └── utils/          # Логирование, хелперы
│   ├── test-db.js          # Скрипт инициализации БД
│   └── package.json        # Зависимости backend
├── src/                    # React frontend
│   ├── pages/AdminPanel.*  # Админ-панель
│   ├── services/
│   │   ├── apiService.ts   # API клиент
│   │   └── statsService.ts # Сервис статистики
│   └── App.tsx             # Роуты приложения
├── test-stats.cjs          # Скрипт тестирования API
├── demo-stats.html         # Демо-страница системы
└── README.md              # Документация
```

## 📊 API Endpoints

### Аутентификация (`/api/auth`)
- `POST /login` - Вход в систему
- `POST /register` - Регистрация
- `POST /logout` - Выход

### Статистика (`/api/stats`)
- `POST /increment` - Сохранить использование инструмента
- `GET /tool/:toolName` - Статистика по инструменту
- `GET /overview` - Общая статистика
- `GET /user` - Личная статистика пользователя

### Админ-панель (`/api/admin`)
- `GET /stats` - Полная статистика для админов
- `GET /users` - Управление пользователями
- `PUT /users/:id` - Изменение пользователя

## 🔮 Дальнейшее развитие

### ✅ Уже готово:
- Полная архитектура SaaS
- Backend API с аутентификацией
- Frontend интеграция
- Админ-панель
- Система безопасности
- База данных с 4 таблицами

### 🎯 Возможные улучшения:
- Интеграция Stripe для платежей
- Email уведомления (NodeMailer)
- Графики и аналитика (Chart.js)
- Экспорт данных (CSV, PDF)
- Многоязычность (i18n)
- Docker контейнеризация

## 📝 Примечания

1. **Безопасность**: Все пароли хешируются, API защищен rate limiting
2. **Масштабируемость**: Готово к переходу на MySQL и горизонтальному масштабированию  
3. **Мониторинг**: Подробные логи всех операций
4. **Тестирование**: Скрипты для проверки всех функций

---

## 🎉 Результат

Создана **полная SaaS система** для Wekey Tools с:

- ✅ Хранением статистики в базе данных (вместо localStorage)
- ✅ Админ-панелью для просмотра всех данных  
- ✅ Системой пользователей и аутентификации
- ✅ API для всех операций
- ✅ Готовностью к коммерциализации

**Запустите и протестируйте**: http://localhost:5174/admin

Данные теперь сохраняются на сервере и доступны администраторам для анализа! 📈