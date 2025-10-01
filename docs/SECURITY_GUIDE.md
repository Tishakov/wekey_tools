# 🔒 Руководство по безопасности Wekey Tools

## 📋 Содержание

- [Управление секретами](#управление-секретами)
- [Структура environment файлов](#структура-environment-файлов)
- [API ключи и токены](#api-ключи-и-токены)
- [Безопасность базы данных](#безопасность-базы-данных)
- [Безопасность аутентификации](#безопасность-аутентификации)
- [CORS и защита от атак](#cors-и-защита-от-атак)
- [Чеклист безопасности](#чеклист-безопасности)

---

## 🔑 Управление секретами

### Правило #1: Никогда не коммитьте секреты в git!

**❌ НИКОГДА НЕ ДОБАВЛЯЙТЕ В GIT:**
- API ключи (OpenAI, Google, SendGrid, Stripe, etc.)
- Пароли баз данных
- JWT секретные ключи
- OAuth client secrets
- Email пароли
- Приватные ключи

**✅ ИСПОЛЬЗУЙТЕ:**
- `.env.local` для локальной разработки (в `.gitignore`)
- `.env.example` как шаблон (без реальных значений)
- Environment variables на сервере
- Секрет-менеджеры (AWS Secrets Manager, Azure Key Vault, etc.)

---

## 📁 Структура environment файлов

```
project/
├── backend/
│   ├── .env.example          # ✅ Шаблон (коммитится в git)
│   ├── .env.local            # ❌ Реальные ключи (НЕ коммитить!)
│   └── .env                  # ❌ НЕ использовать! Используйте .env.local
└── frontend/
    ├── .env.example          # ✅ Шаблон (коммитится в git)
    ├── .env.local            # ❌ Реальные ключи (НЕ коммитить!)
    └── .env                  # ❌ НЕ использовать! Используйте .env.local
```

### Приоритет загрузки (Node.js с dotenv):
1. `.env.local` (наивысший приоритет)
2. `.env.development.local` / `.env.production.local`
3. `.env.development` / `.env.production`
4. `.env`

---

## 🔐 API ключи и токены

### OpenAI API Key (Frontend)

**Расположение:** `frontend/.env.local`

```bash
# НЕ коммитить этот файл!
VITE_OPENAI_API_KEY=sk-proj-your-real-openai-key-here
```

**Получение ключа:**
1. Зарегистрируйтесь на https://platform.openai.com/
2. Перейдите в API Keys: https://platform.openai.com/api-keys
3. Создайте новый ключ
4. **Сразу скопируйте** (ключ показывается только один раз!)
5. Добавьте в `frontend/.env.local`

**Безопасность:**
- ⚠️ Frontend ключи видны в браузере
- 🔒 Используйте rate limiting
- 💰 Установите billing limits в OpenAI
- 🚨 Ротируйте ключи регулярно (каждые 90 дней)

---

### Google PageSpeed API Key (Backend)

**Расположение:** `backend/.env.local`

```bash
GOOGLE_PAGESPEED_API_KEY=your-google-api-key-here
```

**Получение ключа:**
1. Откройте [Google Cloud Console](https://console.cloud.google.com/)
2. Создайте проект или выберите существующий
3. APIs & Services → Enable APIs → PageSpeed Insights API
4. Credentials → Create Credentials → API Key
5. Ограничьте ключ (IP или HTTP referrer)

**Безопасность:**
- Установите квоты
- Ограничьте по IP адресу сервера
- Включите только необходимые API

---

### Google OAuth Credentials (Backend)

**Расположение:** `backend/.env.local`

```bash
GOOGLE_CLIENT_ID=your-client-id.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=your-client-secret
GOOGLE_REDIRECT_URI=http://localhost:8880/auth/google/callback
```

**Получение credentials:**
1. [Google Cloud Console](https://console.cloud.google.com/)
2. APIs & Services → Credentials
3. Create Credentials → OAuth 2.0 Client ID
4. Application type: Web application
5. Authorized redirect URIs:
   - `http://localhost:8880/auth/google/callback` (dev)
   - `https://yourdomain.com/auth/google/callback` (prod)

**Безопасность:**
- Разные credentials для dev/staging/prod
- Не делитесь Client Secret
- Регулярно проверяйте authorized apps

---

### Email Services (Backend)

#### Gmail SMTP

```bash
EMAIL_PROVIDER=gmail
GMAIL_USER=your-email@gmail.com
GMAIL_PASS=your-app-password  # НЕ обычный пароль!
```

**Получение App Password:**
1. Включите 2FA: https://myaccount.google.com/security
2. App Passwords: https://myaccount.google.com/apppasswords
3. Выберите "Mail" и "Other (Custom name)"
4. Скопируйте 16-символьный пароль

#### SendGrid API

```bash
EMAIL_PROVIDER=sendgrid
SENDGRID_API_KEY=SG.your-sendgrid-api-key
```

**Получение ключа:**
1. Зарегистрируйтесь на https://sendgrid.com/
2. Settings → API Keys → Create API Key
3. Full Access или Restricted Access
4. Сохраните ключ (показывается только один раз!)

---

### JWT Secrets (Backend)

```bash
JWT_SECRET=generate-strong-random-string-here
JWT_REFRESH_SECRET=another-strong-random-string
```

**Генерация безопасного секрета:**

```bash
# Bash/Linux/macOS:
openssl rand -base64 64

# Node.js:
node -e "console.log(require('crypto').randomBytes(64).toString('base64'))"

# PowerShell:
[Convert]::ToBase64String((1..64 | ForEach-Object { Get-Random -Minimum 0 -Maximum 256 }))
```

**Требования:**
- Минимум 32 символа
- Случайные символы
- Разные секреты для access/refresh токенов
- Разные секреты для dev/prod
- Ротация каждые 6-12 месяцев

---

### Stripe (Payments) - Будущее

```bash
STRIPE_SECRET_KEY=sk_live_your-stripe-secret-key
STRIPE_WEBHOOK_SECRET=whsec_your-webhook-secret
```

**Безопасность:**
- Используйте test keys в разработке (`sk_test_...`)
- Live keys только на production
- Webhook secrets для проверки подлинности

---

## 🗄️ Безопасность базы данных

### Пароли БД

```bash
# Development (SQLite - не требует пароля)
DB_DIALECT=sqlite
DB_STORAGE=./database.sqlite

# Production (MySQL)
DB_HOST=your-db-host.com
DB_PORT=3306
DB_NAME=wekey_tools_prod
DB_USER=wekey_admin
DB_PASSWORD=strong-random-password-here
```

**Рекомендации:**
- Сильные пароли (16+ символов)
- Разные credentials для dev/prod
- Используйте SSL/TLS соединение
- Ограничьте доступ по IP
- Регулярные бэкапы
- Не используйте root пользователя

### database.sqlite

**⚠️ ВАЖНО:** Файл `database.sqlite` содержит все данные и должен быть в `.gitignore`!

```gitignore
# Database files
*.sqlite
*.sqlite3
*.db
database.sqlite
```

---

## 👤 Безопасность аутентификации

### Хеширование паролей

✅ Используется **bcrypt** с salt rounds = 10

```javascript
// Хеширование при регистрации
const bcrypt = require('bcrypt');
const hashedPassword = await bcrypt.hash(password, 10);

// Проверка при логине
const isValid = await bcrypt.compare(password, user.password);
```

### JWT токены

**Access Token:**
- Короткий срок жизни (24 часа)
- Хранится в localStorage
- Используется для API запросов

**Refresh Token:**
- Длительный срок жизни (7 дней)
- Хранится в httpOnly cookie
- Используется для обновления access token

### Session Management

- Автоматический logout через 24 часа
- Refresh token rotation
- Черный список токенов при logout

---

## 🛡️ CORS и защита от атак

### CORS Configuration

```javascript
// backend/src/config/config.js
cors: {
  origin: process.env.FRONTEND_URL || 'http://localhost:5173',
  credentials: true,
  optionsSuccessStatus: 200
}
```

**Production:**
```bash
FRONTEND_URL=https://yourdomain.com
```

### Rate Limiting

```bash
RATE_LIMIT_WINDOW=900000  # 15 минут
RATE_LIMIT_MAX=100        # 100 запросов
```

### Защита от XSS

- Санитизация пользовательского ввода
- Content Security Policy (CSP)
- HTTP headers (helmet.js)

### Защита от SQL Injection

- ✅ Используется Sequelize ORM
- Параметризованные запросы
- Валидация входных данных

---

## ✅ Чеклист безопасности

### Перед разработкой

- [ ] Создал `backend/.env.local` из `.env.example`
- [ ] Создал `frontend/.env.local` из `.env.example`
- [ ] Заменил все `your-key-here` на реальные ключи
- [ ] Проверил, что `.env.local` в `.gitignore`
- [ ] Не коммитил реальные ключи

### Перед коммитом

- [ ] Проверил `git status` - нет ли `.env.local` файлов
- [ ] Проверил код на наличие hardcoded ключей
- [ ] Удалил console.log с чувствительными данными
- [ ] Обновил `.env.example` если добавлял новые переменные

### Перед деплоем

- [ ] Сгенерировал новый JWT_SECRET для продакшена
- [ ] Настроил environment variables на сервере
- [ ] Использую production API ключи
- [ ] CORS настроен на production домен
- [ ] Rate limiting активирован
- [ ] SSL/TLS сертификаты установлены
- [ ] Backup базы данных настроен

### Регулярное обслуживание

- [ ] Ротация API ключей каждые 90 дней
- [ ] Ротация JWT secrets каждые 6-12 месяцев
- [ ] Проверка логов на подозрительную активность
- [ ] Обновление зависимостей (`npm audit`)
- [ ] Проверка GitHub Security Alerts

---

## 🚨 Если случайно закоммитили секреты

### 1. Немедленно ротируйте все скомпрометированные ключи

- OpenAI: https://platform.openai.com/api-keys
- Google: https://console.cloud.google.com/
- SendGrid: https://app.sendgrid.com/settings/api_keys

### 2. Удалите секреты из истории git

```bash
# Используйте git-filter-repo или BFG Repo-Cleaner
# ВНИМАНИЕ: Это перезапишет историю!

# Установка git-filter-repo
pip install git-filter-repo

# Удаление файла из истории
git filter-repo --invert-paths --path backend/.env

# Force push (если работаете один или с согласия команды)
git push origin --force --all
```

### 3. Проверьте GitHub Secret Scanning

- Settings → Security → Secret scanning alerts
- Подтвердите ротацию ключей

### 4. Проинформируйте команду

- Уведомите всех разработчиков
- Обновите документацию
- Проведите аудит безопасности

---

## 📚 Дополнительные ресурсы

- [OWASP Top Ten](https://owasp.org/www-project-top-ten/)
- [Node.js Security Best Practices](https://nodejs.org/en/docs/guides/security/)
- [GitHub Secret Scanning](https://docs.github.com/en/code-security/secret-scanning)
- [dotenv-vault](https://github.com/dotenv-org/dotenv-vault) - зашифрованные .env
- [1Password for Developers](https://developer.1password.com/)

---

## 📞 Контакты

При обнаружении уязвимостей:
- Email: bohdan.tishakov@gmail.com
- Не публикуйте уязвимости публично до исправления

---

**Последнее обновление:** 1 октября 2025  
**Версия:** 1.0  
**Автор:** Wekey Tools Team
