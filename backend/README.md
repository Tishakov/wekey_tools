# Wekey Tools Backend

SaaS-ready backend API для платформы Wekey Tools с поддержкой пользователей, подписок, платежей и детальной аналитики.

## 🚀 Быстрый старт

### Предварительные требования

- Node.js 16+ 
- MySQL 8.0+
- npm или yarn

### Установка

1. **Клонирование и установка зависимостей:**
```bash
cd backend
npm install
```

2. **Настройка базы данных:**
```bash
# Создайте базу данных MySQL
mysql -u root -p
CREATE DATABASE wekey_tools_dev;
exit
```

3. **Настройка переменных окружения:**

⚠️ **ВАЖНО:** Используйте `.env.local` для реальных ключей!

```bash
# Скопируйте шаблон
cp .env.example .env.local

# Отредактируйте .env.local и замените все YOUR_*_HERE на реальные значения
# .env.local автоматически игнорируется git

# Обязательно настройте:
# - DB_PASSWORD (если используете MySQL)
# - JWT_SECRET (сгенерируйте случайную строку)
# - GOOGLE_CLIENT_ID и GOOGLE_CLIENT_SECRET (для OAuth)
# - GMAIL_USER и GMAIL_PASS (для email verification)
```

📖 **Подробная инструкция:** См. `/SECURITY_QUICK_START.md` в корне проекта

4. **Запуск миграций:**
```bash
# Создание таблиц в БД
npx sequelize-cli db:migrate

# (Опционально) Заполнение тестовыми данными
npx sequelize-cli db:seed:all
```

5. **Запуск сервера:**
```bash
# Разработка
npm run dev

# Продакшн
npm start
```

Сервер будет доступен по адресу: http://localhost:3001

## 📊 API Endpoints

### Аутентификация (`/api/auth`)
- `POST /register` - Регистрация пользователя
- `POST /login` - Вход в систему  
- `POST /logout` - Выход из системы
- `GET /me` - Информация о пользователе
- `PUT /update-profile` - Обновление профиля
- `PUT /change-password` - Смена пароля
- `DELETE /delete-account` - Удаление аккаунта

### Статистика (`/api/stats`)
- `POST /increment` - Увеличить счетчик инструмента
- `GET /tool/:toolName` - Статистика конкретного инструмента
- `GET /overview` - Общая статистика
- `GET /user` - Личная статистика пользователя

### Пользователи (`/api/users`)
- `GET /profile` - Профиль пользователя
- `GET /usage-history` - История использования
- `GET /subscription` - Информация о подписке

### Админ панель (`/api/admin`)
- `GET /dashboard` - Дашборд с общей статистикой
- `GET /users` - Список пользователей
- `GET /tools-stats` - Детальная статистика инструментов
- `PUT /users/:userId/status` - Изменение статуса пользователя

## 🏗️ Архитектура

### Структура проекта
```
backend/
├── src/
│   ├── config/          # Конфигурация БД и приложения
│   ├── controllers/     # Бизнес-логика (пока не используется)
│   ├── middleware/      # Промежуточное ПО (auth, error handling)
│   ├── models/          # Модели Sequelize
│   ├── routes/          # Маршруты API
│   ├── services/        # Сервисы (пока не используется)
│   ├── utils/           # Утилиты (logger)
│   └── app.js           # Основной файл приложения
├── migrations/          # Миграции базы данных
├── seeders/            # Заполнение тестовыми данными
├── package.json
├── .env                # Переменные окружения
└── README.md
```

### Модели данных

**Users** - Пользователи системы
- Базовая информация (email, пароль, имя)
- Роли (user, admin, premium)
- Статусы (active, inactive, banned)
- Лимиты API запросов
- Настройки (язык, тема)

**ToolUsage** - Статистика использования инструментов
- Привязка к пользователю (или анонимная сессия)
- Метаданные (длина входа/выхода, время обработки)
- Технические данные (IP, User-Agent)

**Subscriptions** - Подписки пользователей
- Типы планов (free, basic, premium, enterprise)
- Лимиты и возможности
- Даты действия и продления
- Интеграция с платежными системами

**Payments** - Платежи и транзакции
- Детальная информация о платежах
- Поддержка возвратов
- Интеграция с Stripe/PayPal
- Налоги и комиссии

## 🔐 Безопасность

### Реализованные меры:
- **JWT аутентификация** с защищенными роутами
- **Bcrypt хеширование** паролей
- **Rate limiting** для предотвращения спама
- **Helmet.js** для базовой безопасности HTTP
- **Валидация входных данных** с express-validator
- **CORS настройки** для фронтенда
- **SQL injection защита** через Sequelize ORM

### Администрирование пользователей:

**⚠️ Важно при создании/обновлении пользователей:**
- Указывайте пароль в чистом виде — модель User автоматически захеширует его через bcrypt с salt=12
- Не используйте ручное хеширование в скриптах, только в модели User.js через hooks
- Для проверки паролей используйте метод `user.checkPassword(plainPassword)`

Примеры:
```javascript
// ✅ Правильно - создание пользователя
const user = await User.create({
  email: 'admin@example.com',
  password: 'admin123', // Будет автоматически захеширован
  role: 'admin'
});

// ✅ Правильно - обновление пароля
user.password = 'newPassword123'; // Будет автоматически захеширован
await user.save();

// ✅ Правильно - проверка пароля
const isValid = await user.checkPassword('admin123');
```

### API лимиты:
- **Бесплатные пользователи**: 100 запросов/день
- **Premium пользователи**: настраиваемые лимиты
- **Rate limiting**: 100 запросов/15 минут с одного IP

## 🎯 SaaS готовность

### Реализованные функции:
✅ **Многопользовательская система** с ролями  
✅ **Система подписок** с различными планами  
✅ **Детальная аналитика** использования  
✅ **API лимиты** для монетизации  
✅ **Готовность к платежным системам** (Stripe/PayPal)  
✅ **Админ панель** для управления  
✅ **Масштабируемая архитектура** с микросервисами  

### Запланированные функции:
🔄 **Email уведомления** (регистрация, платежи)  
🔄 **Интеграция с Stripe** для автоматических платежей  
🔄 **Система промокодов** и скидок  
🔄 **Экспорт данных** в различных форматах  
🔄 **Двухфакторная аутентификация**  
🔄 **Система тикетов** поддержки  

## 🚀 Деплой

### Development
```bash
npm run dev
```

### Production
```bash
# Сборка (если нужна)
npm run build

# Запуск
NODE_ENV=production npm start
```

### Docker (будет добавлен)
```bash
docker-compose up --build
```

### Переменные окружения для продакшна:
```env
NODE_ENV=production
PORT=3001
DB_HOST=your_mysql_host
DB_NAME=wekey_tools_prod
DB_USER=your_db_user  
DB_PASSWORD=your_secure_password
JWT_SECRET=your_super_secure_jwt_secret
FRONTEND_URL=https://wekey.tools
```

## 🧪 Тестирование

```bash
# Запуск тестов (будет добавлено)
npm test

# Линтинг
npm run lint
```

## 📝 Логи

Логи сохраняются в:
- Консоль (development)
- `logs/error.log` (production errors)
- `logs/combined.log` (production all logs)

## 🤝 Интеграция с Frontend

Backend полностью готов для интеграции с существующим React frontend. Нужно:

1. Обновить `src/utils/statsService.ts` для работы с API
2. Добавить новый `src/services/apiService.ts` для HTTP запросов
3. Настроить JWT токены в localStorage/cookies
4. Добавить страницы авторизации и личного кабинета

## 📞 Поддержка

При вопросах по настройке или разработке обращайтесь к документации или создавайте issues в репозитории.

---

**Версия:** 2.0.0 (security_fix_1.0 + project_refactor_1.1)  
**Статус:** ✅ Production Ready - Security Enhanced  
**Последнее обновление:** 1 октября 2025

**Изменения в v2.0:**
- ✅ Безопасная работа с API ключами (`.env.local`)
- ✅ Google OAuth полностью настроен
- ✅ Email verification через Gmail SMTP
- ✅ JWT с криптографически безопасным секретом
- ✅ Comprehensive security documentation