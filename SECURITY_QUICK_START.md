# 🚀 Быстрый старт с безопасностью

## ⚠️ ВАЖНО: Первый запуск проекта

После клонирования репозитория **ОБЯЗАТЕЛЬНО** настройте environment переменные:

### 1. Backend Setup

```bash
cd backend

# Скопируйте шаблон
cp .env.example .env.local

# Отредактируйте .env.local в текстовом редакторе
# Замените все YOUR_*_HERE на реальные значения
```

**Минимальные настройки для разработки:**

```bash
# backend/.env.local

# JWT Secret - сгенерируйте случайную строку:
JWT_SECRET=$(node -e "console.log(require('crypto').randomBytes(64).toString('base64'))")

# Админ пароль - придумайте свой:
ADMIN_PASSWORD=your_secure_password_123

# База данных - для разработки используйте SQLite (уже настроено)
DB_DIALECT=sqlite
```

### 2. Frontend Setup

```bash
cd frontend

# Скопируйте шаблон
cp .env.example .env.local

# Отредактируйте .env.local
```

**Получите OpenAI API ключ:**
1. Зарегистрируйтесь: https://platform.openai.com/
2. API Keys → Create new secret key
3. Скопируйте ключ и добавьте в `frontend/.env.local`:

```bash
# frontend/.env.local
VITE_OPENAI_API_KEY=sk-proj-your-real-key-here
```

### 3. Проверка безопасности

```bash
# Убедитесь, что .env.local НЕ отслеживаются git
git status

# Должно быть пусто или не должно содержать .env.local файлы
```

### 4. Запуск проекта

```bash
# Backend
cd backend
npm install
npm run dev

# Frontend (в новом терминале)
cd frontend
npm install
npm run dev
```

---

## 🔒 Что важно знать

### ✅ ЧТО МОЖНО коммитить в git:
- `.env.example` - шаблоны без реальных ключей
- `.env.local.example` - альтернативное название шаблона
- Документация (README, SECURITY_GUIDE)

### ❌ ЧТО НЕЛЬЗЯ коммитить в git:
- `.env` - если содержит реальные ключи (лучше использовать .env.local)
- `.env.local` - всегда содержит реальные ключи
- `.env.*.local` - локальные конфигурации
- `database.sqlite` - содержит пользовательские данные
- Любые файлы с паролями, API ключами, токенами

### 🛡️ Правило безопасности

**Если сомневаетесь - НЕ КОММИТЬТЕ!**

Перед каждым коммитом:
1. Проверьте `git status`
2. Проверьте `git diff`
3. Убедитесь, что нет случайно добавленных секретов

---

## 📚 Дополнительная информация

Полная документация по безопасности: [`docs/SECURITY_GUIDE.md`](docs/SECURITY_GUIDE.md)

### Быстрые ссылки:

- [Получить OpenAI API ключ](https://platform.openai.com/api-keys)
- [Настроить Google OAuth](https://console.cloud.google.com/)
- [Настроить Gmail SMTP](https://myaccount.google.com/apppasswords)
- [Генератор паролей](https://passwordsgenerator.net/)

---

## 🆘 Помощь

**Проблемы с API ключами?**
- Проверьте, что `.env.local` существует в backend/ и frontend/
- Проверьте, что ключи скопированы полностью (без пробелов)
- Перезапустите сервер после изменения .env файлов

**Случайно закоммитили секреты?**
1. Немедленно ротируйте все ключи
2. Удалите секреты из git истории
3. См. раздел "Если случайно закоммитили секреты" в `docs/SECURITY_GUIDE.md`

---

**Последнее обновление:** 1 октября 2025
