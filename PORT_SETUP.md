# Настройка портов Wekey Tools

## Быстрая настройка

### Бэкенд
Файл: `backend/.env`
```env
PORT=8880
```

### Фронтенд  
Файл: `frontend/.env`
```env
VITE_API_URL=http://localhost:8880
```

## Как изменить порты

1. **Изменить порт бэкенда:**
   - Откройте `backend/.env`
   - Измените `PORT=8880` на нужный порт
   - Перезапустите бэкенд: `cd backend && node src/app.js`

2. **Изменить API URL для фронтенда:**
   - Откройте `frontend/.env`
   - Измените `VITE_API_URL=http://localhost:8880` на новый URL
   - Перезапустите фронтенд: `cd frontend && npm run dev`

## Запуск серверов

```bash
# Бэкенд
cd backend
node src/app.js

# Фронтенд  
cd frontend
npm run dev
```

## Текущие настройки по умолчанию

- **Бэкенд**: http://localhost:8880
- **Фронтенд**: http://localhost:5173+ (автоматический поиск свободного порта)
- **Админ-панель**: http://localhost:5173/admin
  - Email: admin@wekey.tools
  - Пароль: admin123