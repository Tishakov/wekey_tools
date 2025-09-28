# 📧 Руководство по настройке Email провайдеров

## 🔧 Быстрый старт

Измените переменную `EMAIL_PROVIDER` в файле `.env`:

```bash
# Выберите один из вариантов:
EMAIL_PROVIDER=console    # Для разработки (выводит в консоль)
EMAIL_PROVIDER=gmail      # Gmail SMTP (рекомендуется)
EMAIL_PROVIDER=mailtrap   # Mailtrap (для тестирования)
EMAIL_PROVIDER=sendgrid   # SendGrid (для высоких объемов)
```

---

## 1. 🖥️ Console (Разработка)

**Использование:** Только для разработки и отладки
**Стоимость:** Бесплатно
**Настройка:** Не требуется

```bash
EMAIL_PROVIDER=console
EMAIL_FROM=noreply@wekeytools.com
```

Письма будут выводиться в консоль сервера.

---

## 2. 📮 Gmail SMTP (Рекомендуется для продакшена)

**Использование:** Продакшн, до 500 писем в день бесплатно
**Стоимость:** Бесплатно (лимиты) / Google Workspace (платно)

### Настройка:

1. **Включите 2FA** в своем Google аккаунте
2. **Создайте App Password:**
   - Перейдите: https://myaccount.google.com/apppasswords
   - Выберите "Mail" и "Other (custom name)"
   - Введите "Wekey Tools" и скопируйте пароль

3. **Настройте .env:**
```bash
EMAIL_PROVIDER=gmail
EMAIL_FROM=your_email@gmail.com
GMAIL_USER=your_email@gmail.com
GMAIL_PASS=your_app_password_16_chars
```

### ✅ Преимущества:
- Высокая доставляемость
- Бесплатно для небольших объемов
- Простая настройка

### ⚠️ Ограничения:
- 500 писем в день (бесплатно)
- Может быть заблокирован при подозрительной активности

---

## 3. 🧪 Mailtrap (Рекомендуется для тестирования)

**Использование:** Тестирование email в development/staging
**Стоимость:** Бесплатно до 100 писем в месяц

### Настройка:

1. **Зарегистрируйтесь:** https://mailtrap.io/
2. **Создайте Inbox** в разделе "Email Testing"
3. **Скопируйте SMTP настройки**

```bash
EMAIL_PROVIDER=mailtrap
EMAIL_FROM=noreply@wekeytools.com
MAILTRAP_HOST=live.smtp.mailtrap.io
MAILTRAP_PORT=587
MAILTRAP_USER=api
MAILTRAP_PASS=your_mailtrap_api_token
```

### ✅ Преимущества:
- Письма не уходят реальным пользователям
- Удобный веб-интерфейс для просмотра
- Анализ спама и доставляемости

---

## 4. 🚀 SendGrid (Для высоких объемов)

**Использование:** Продакшн с большими объемами email
**Стоимость:** 100 писем в день бесплатно, далее от $15/месяц

### Настройка:

1. **Зарегистрируйтесь:** https://sendgrid.com/
2. **Создайте API Key:**
   - Settings → API Keys → Create API Key
   - Full Access или Mail Send

3. **Настройте .env:**
```bash
EMAIL_PROVIDER=sendgrid
EMAIL_FROM=noreply@wekeytools.com
SENDGRID_API_KEY=SG.your_sendgrid_api_key
```

### ✅ Преимущества:
- Высокая доставляемость
- Подробная аналитика
- Масштабируемость

---

## 🧪 Тестирование настройки

После настройки провайдера запустите тест:

```bash
cd backend
node -e "
const EmailService = require('./src/services/EmailService');
EmailService.sendVerificationEmail('test@example.com', '123456', 'Test User')
  .then(result => console.log('✅ Результат:', result))
  .catch(error => console.error('❌ Ошибка:', error));
"
```

---

## 🔧 Рекомендации по выбору

### Для разработки:
```bash
EMAIL_PROVIDER=console  # Быстро и просто
```

### Для тестирования:
```bash
EMAIL_PROVIDER=mailtrap  # Безопасно, не уходят письма
```

### Для продакшена (малые объемы):
```bash
EMAIL_PROVIDER=gmail     # До 500 писем в день
```

### Для продакшена (большие объемы):
```bash
EMAIL_PROVIDER=sendgrid  # Неограниченно
```

---

## 🚨 Безопасность

- **Никогда не коммитьте** реальные credentials в git
- **Используйте переменные окружения** для всех паролей
- **Gmail:** обязательно используйте App Passwords, не основной пароль
- **Ротируйте ключи** регулярно

---

## 📈 Мониторинг

Все email события логируются в консоль:
- ✅ Успешная отправка
- ❌ Ошибки отправки
- 📊 Статистика провайдера

Для продакшена рекомендуется настроить мониторинг доставляемости.