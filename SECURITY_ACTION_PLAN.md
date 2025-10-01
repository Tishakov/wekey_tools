# 🔒 План действий по устранению проблемы с GitHub Secret Scanning

## 📌 Текущая ситуация

GitHub заблокировал push из-за обнаружения OpenAI API ключа в истории git.

**Обнаруженные секреты:**
- OpenAI API Key: `sk-proj-aLJl...` (в blob 44f06fb2)
- Google PageSpeed API Key
- Google OAuth Client Secret
- Gmail App Password
- JWT Secret (development)

## ✅ Что мы уже сделали

1. ✅ Создали `.env.local` файлы с реальными ключами
2. ✅ Обновили `.env` и `.env.example` - удалили реальные ключи
3. ✅ Улучшили `.gitignore` - теперь `.env.local` игнорируется
4. ✅ Создали `SECURITY_GUIDE.md` - полная документация по безопасности
5. ✅ Создали `SECURITY_QUICK_START.md` - быстрый старт
6. ✅ Закоммитили все изменения (commit: f11b25e6)

## 🎯 Следующие шаги

### Вариант 1: Использовать GitHub Secret Scanning Bypass (РЕКОМЕНДУЕТСЯ)

**Преимущества:**
- Быстро (5 минут)
- Не ломает историю git
- Не требует force push
- GitHub отметит, что вы знаете о проблеме и она решена

**Шаги:**

1. **Ротируйте все скомпрометированные ключи:**

   a) **OpenAI API Key:**
   - Перейдите: https://platform.openai.com/api-keys
   - Удалите старый ключ: `sk-proj-aLJl...`
   - Создайте новый ключ
   - Обновите `frontend/.env.local`

   b) **Google PageSpeed API Key:**
   - Перейдите: https://console.cloud.google.com/apis/credentials
   - Удалите старый ключ: `AIzaSyDr...`
   - Создайте новый ключ
   - Обновите `backend/.env.local`

   c) **Google OAuth:**
   - Не критично (client secret можно не менять, если не публиковали)
   - Но лучше пересоздать для безопасности

   d) **Gmail App Password:**
   - Перейдите: https://myaccount.google.com/apppasswords
   - Удалите старый пароль приложения
   - Создайте новый
   - Обновите `backend/.env.local`

   e) **JWT Secret:**
   - Сгенерируйте новый случайный секрет:
   ```bash
   node -e "console.log(require('crypto').randomBytes(64).toString('base64'))"
   ```
   - Обновите `backend/.env.local`

2. **Разрешите push через GitHub:**
   - Перейдите по ссылке: https://github.com/Tishakov/wekey_tools/security/secret-scanning/unblock-secret/33SuTAEV8GEjfe4YcmTnuu76bZv
   - Нажмите "Allow secret" или "Bypass protection"
   - GitHub попросит подтвердить, что:
     - ✅ Вы ротировали ключ
     - ✅ Ключ больше не используется
     - ✅ Ключ удален из текущего кода (уже сделано)

3. **Повторите push:**
   ```bash
   git push origin main
   git push origin update_4.5
   ```

**Итого времени:** ~15-20 минут

---

### Вариант 2: Очистка истории git (НЕ РЕКОМЕНДУЕТСЯ)

**Недостатки:**
- Сложно (1-2 часа)
- Перепишет ВСЮ историю git
- Потребует force push
- Сломает все существующие клоны
- Нужно уведомить всех разработчиков

**Шаги (если очень нужно):**

1. Установите BFG Repo-Cleaner или git-filter-repo
2. Создайте backup репозитория
3. Запустите очистку:
   ```bash
   # BFG
   bfg --replace-text secrets-to-remove.txt .git
   
   # или git-filter-repo
   git filter-repo --replace-text secrets-to-remove.txt
   ```
4. Проверьте результат
5. Force push:
   ```bash
   git push origin --force --all
   git push origin --force --tags
   ```

---

## 🎯 Рекомендация

**Используйте Вариант 1** - это стандартная практика:

1. Ротируйте все ключи (15 минут)
2. Разрешите push через GitHub (1 клик)
3. Сделайте push

В будущем все новые коммиты уже не будут содержать секреты благодаря:
- ✅ Обновленному `.gitignore`
- ✅ `.env.local` вместо `.env`
- ✅ Документации по безопасности

---

## 📋 Чеклист ротации ключей

### OpenAI API Key
- [ ] Удалил старый ключ из OpenAI
- [ ] Создал новый ключ
- [ ] Обновил `frontend/.env.local`
- [ ] Перезапустил frontend (`npm run dev`)
- [ ] Протестировал работу AI функций

### Google PageSpeed API Key
- [ ] Удалил старый ключ из Google Cloud
- [ ] Создал новый ключ
- [ ] Обновил `backend/.env.local`
- [ ] Перезапустил backend (`npm run dev`)
- [ ] Протестировал SEO Audit

### Google OAuth
- [ ] (Опционально) Создал новые credentials
- [ ] Обновил `backend/.env.local`
- [ ] Протестировал Google Login

### Gmail App Password
- [ ] Удалил старый app password
- [ ] Создал новый app password
- [ ] Обновил `backend/.env.local`
- [ ] Протестировал отправку email

### JWT Secret
- [ ] Сгенерировал новый случайный секрет
- [ ] Обновил `backend/.env.local`
- [ ] Перезапустил backend
- [ ] Все существующие токены инвалидированы (пользователи переавторизуются)

---

## 🚀 После успешного push

1. Проверьте GitHub Security Alerts:
   - Settings → Security → Secret scanning alerts
   - Убедитесь, что алерт закрыт

2. Добавьте документацию в README:
   - Ссылка на `SECURITY_QUICK_START.md`
   - Напоминание о настройке `.env.local`

3. Уведомите команду:
   - Все должны создать `.env.local` файлы
   - Старые `.env` больше не используются

---

## 📞 Помощь

Если возникли проблемы:
1. Проверьте документацию: `docs/SECURITY_GUIDE.md`
2. GitHub документация: https://docs.github.com/code-security/secret-scanning
3. Свяжитесь с командой

---

**Последнее обновление:** 1 октября 2025  
**Статус:** ✅ Готово к ротации ключей и push
