# Google OAuth Setup для SEO Audit PRO

## Проблема
Error 403: access_denied - приложение находится в Testing mode

## Решение 1: Добавить тестового пользователя

1. Откройте [Google Cloud Console](https://console.cloud.google.com/)
2. Выберите проект "Wekey Tools"
3. Перейдите в **APIs & Services → OAuth consent screen**
4. В разделе **Test users** нажмите **ADD USERS**
5. Добавьте email: `bohdan.tishakov@gmail.com`
6. Сохраните изменения

## Решение 2: Создать новые OAuth credentials

Если не получается добавить тестового пользователя:

1. Перейдите в **APIs & Services → Credentials**
2. Нажмите **+ CREATE CREDENTIALS → OAuth client ID**
3. Выберите **Web application**
4. Имя: `SEO Audit PRO Local`
5. Authorized redirect URIs:
   ```
   http://localhost:8880/auth/google/callback
   ```
6. Скопируйте новые Client ID и Client Secret
7. Обновите .env файл

## Решение 3: Используем Internal App Type

1. В **OAuth consent screen** измените User Type на **Internal**
2. Это разрешит доступ всем пользователям вашей организации

## Текущие настройки

- Client ID: `751826217400-c9gh82tvt1r8d7mnnbsvkg7se63h1kaj.apps.googleusercontent.com`
- Redirect URI: `http://localhost:8880/auth/google/callback`
- Scopes: webmasters.readonly, webmasters

## После исправления

Протестируйте OAuth flow:
1. Откройте http://localhost:5173/seo-audit-pro
2. Нажмите "Подключить GSC"
3. Авторизуйтесь через Google
4. Выберите сайт из списка
5. Запустите анализ