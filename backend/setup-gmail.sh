#!/bin/bash

# Скрипт для быстрой настройки Gmail SMTP

echo "🚀 Настройка Gmail SMTP для Wekey Tools"
echo "========================================"
echo ""

echo "📱 Шаг 1: Включите 2FA (двухфакторная аутентификация)"
echo "Откройте: https://myaccount.google.com/security"
echo "Включите 'Двухэтапная аутентификация' (2-Step Verification)"
echo ""

echo "🔑 Шаг 2: Создайте App Password"
echo "Откройте: https://myaccount.google.com/apppasswords"
echo "Выберите: Mail → Other (custom name) → 'Wekey Tools'"
echo "Скопируйте 16-значный пароль (например: abcd efgh ijkl mnop)"
echo ""

echo "⚙️ Шаг 3: Обновите .env файл"
echo "Файл .env уже настроен на ваш email: bohdan.tishakov@gmail.com"
echo "Нужно только заменить: GMAIL_PASS=your_app_password_here"
echo "На ваш реальный App Password из шага 2"
echo ""

echo "🧪 Шаг 4: Протестируйте настройку"
echo "После обновления пароля выполните:"
echo "  cd backend"
echo "  node test-email.js gmail bohdan.tishakov@gmail.com"
echo ""

echo "📧 Готово! После этого:"
echo "- Перезапустите сервер: npm start"
echo "- Зарегистрируйте нового пользователя"
echo "- Проверьте почту - должно прийти письмо с кодом"
echo ""

# Попытка открыть ссылки в браузере (работает на Windows/Mac/Linux)
if command -v start &> /dev/null; then
    # Windows
    echo "🌐 Открываем ссылки в браузере..."
    start "https://myaccount.google.com/security"
    sleep 2
    start "https://myaccount.google.com/apppasswords"
elif command -v open &> /dev/null; then
    # macOS
    echo "🌐 Открываем ссылки в браузере..."
    open "https://myaccount.google.com/security"
    sleep 2
    open "https://myaccount.google.com/apppasswords"
elif command -v xdg-open &> /dev/null; then
    # Linux
    echo "🌐 Открываем ссылки в браузере..."
    xdg-open "https://myaccount.google.com/security"
    sleep 2
    xdg-open "https://myaccount.google.com/apppasswords"
else
    echo "💡 Откройте ссылки вручную в браузере:"
    echo "   https://myaccount.google.com/security"
    echo "   https://myaccount.google.com/apppasswords"
fi

echo ""
echo "❓ После получения App Password:"
echo "   nano .env"
echo "   # Замените: GMAIL_PASS=your_app_password_here"
echo "   # На:      GMAIL_PASS=abcd efgh ijkl mnop"