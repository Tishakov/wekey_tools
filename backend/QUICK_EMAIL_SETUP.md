# 🚀 Быстрая настройка Gmail для продакшена

## ⚡ За 5 минут

### 1. Настройте Google аккаунт

1. **Включите 2FA** (двухфакторная аутентификация):
   - Перейдите: https://myaccount.google.com/security
   - Включите "2-Step Verification"

2. **Создайте App Password**:
   - Перейдите: https://myaccount.google.com/apppasswords
   - Выберите "Mail" → "Other (custom name)"
   - Введите: "Wekey Tools"
   - **Скопируйте 16-символьный пароль** (типа: abcd efgh ijkl mnop)

### 2. Обновите .env файл

```bash
# Измените эти строки в .env:
EMAIL_PROVIDER=gmail
EMAIL_FROM=your_email@gmail.com
GMAIL_USER=your_email@gmail.com
GMAIL_PASS=abcd efgh ijkl mnop
```

### 3. Перезапустите сервер

```bash
# Остановите и запустите сервер:
npm start
```

### 4. Протестируйте

```bash
# Отправьте тестовое письмо:
node test-email.js gmail your_real_email@gmail.com
```

---

## 📋 Альтернативы для разных случаев

### 🧪 Для тестирования → Mailtrap
```bash
EMAIL_PROVIDER=mailtrap
# Зарегистрируйтесь на https://mailtrap.io/
# Получите API токен и укажите в MAILTRAP_PASS
```

### 🚀 Для высоких объемов → SendGrid
```bash
EMAIL_PROVIDER=sendgrid  
# Зарегистрируйтесь на https://sendgrid.com/
# Создайте API ключ и укажите в SENDGRID_API_KEY
```

### 🛠️ Для разработки → Console
```bash
EMAIL_PROVIDER=console
# Письма выводятся в консоль сервера
```

---

## ✅ Проверка работы

После настройки:

1. **Зарегистрируйте нового пользователя** на сайте
2. **Проверьте email** - должно прийти письмо с кодом
3. **Введите код** - должна пройти верификация

Готово! 🎉