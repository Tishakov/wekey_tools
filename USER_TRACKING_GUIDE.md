# USER TRACKING И АНАЛИТИКА - admin_1.5

## 🎯 Обзор системы User Tracking

Версия admin_1.5 включает полноценную систему отслеживания пользователей для анализа поведения и конверсии.

## 🔧 Архитектура User Tracking

### Backend компоненты:
- **`backend/src/models/Visitor.js`** - модель посетителей с UUID tracking
- **`backend/src/models/AnalyticsEvent.js`** - модель событий (page_view, tool_usage, session_start)
- **`backend/src/routes/analytics.js`** - API эндпоинты для аналитики

### Frontend компоненты:
- **`frontend/src/services/analyticsService.ts`** - сервис отправки событий
- **`frontend/src/utils/toolsRegistry.ts`** - централизованные названия инструментов
- **Auto-tracking**: каждый page view и tool usage автоматически отслеживается

## 📊 API Endpoints

### User Tracking:
```
POST /api/analytics/visitor - Синхронизация данных посетителя
POST /api/analytics/event   - Отправка событий
GET  /api/analytics/stats   - Публичная статистика
GET  /api/analytics/history - Исторические данные
```

### Админ аналитика:
```
GET /api/admin/analytics           - Основная статистика
GET /api/admin/analytics/historical - Данные для графиков
```

## 🗄️ База данных

### Таблицы User Tracking:
- **`visitors`** - основная информация о посетителях
- **`analytics_events`** - все события пользователей

### Важно:
- Используется SQLite (готовность к миграции на MySQL)
- JSON поля хранятся как TEXT с геттерами/сеттерами
- ENUM заменены на STRING для совместимости

## 🎨 Система названий инструментов

**Проблема**: Backend возвращает технические ID (`password-generator`), но нужны человеческие названия.

**Решение**: Централизованный реестр в `toolsRegistry.ts`:
```javascript
'password_generator_tool': 'Генератор паролей'
'number_generator_tool': 'Генератор чисел'
// etc...
```

## 🔍 Отслеживаемые метрики

### Посетители:
- Уникальные UUID пользователи
- Количество сессий
- Просмотренные страницы
- Использованные инструменты
- User Agent и referrer

### События:
- **page_view** - просмотр страницы
- **tool_usage** - использование инструмента
- **session_start** - начало новой сессии

### Конверсия:
- % посетителей, использовавших инструменты
- Популярные инструменты
- Динамика роста аудитории

## 🚀 Запуск и использование

### 1. Запуск серверов:
```bash
# Backend
cd backend && node src/app.js

# Frontend (новый терминал)
cd frontend && npm run dev
```

### 2. Доступные интерфейсы:
- **Frontend**: http://localhost:5173
- **Backend API**: http://localhost:8880
- **Админ-панель**: http://localhost:5173/admin
  - Логин: admin@wekey.tools
  - Пароль: admin123

### 3. Проверка работы:
```bash
curl http://localhost:8880/api/analytics/stats
```

## ⚠️ Важные особенности

### Совместимость БД:
- Сейчас: SQLite (dev режим)
- Будущее: MySQL (prod режим)
- Модели готовы к миграции

### LocalStorage tracking:
- `wekey_user_id` - UUID пользователя
- `wekey_visitor_data` - данные активности
- Автоматическая синхронизация с backend

### Терминалы и запуск:
- ⚠️ **КРИТИЧНО**: Backend блокирует терминал
- ⚠️ **НЕ ЗАПУСКАТЬ** команды в терминале с backend
- ✅ **ИСПОЛЬЗОВАТЬ** отдельные терминалы для тестирования

## 🔮 Планы развития

### Краткосрочно (оставили для потом):
- Полная миграция на MySQL
- Продвинутые отчеты в админ-панели
- Real-time аналитика

### Долгосрочно:
- Интеграция с внешними сервисами (GA4)
- A/B тестирование
- Персонализация контента

## 📈 Текущие приоритеты

Вместо углубления в аналитику сосредоточились на:
1. **Мультиязычность**
2. **Личные кабинеты пользователей**
3. **Системы оплат**
4. **SEO оптимизация**
5. **Расширение админ-панели**

---

**Обновлено**: 20.09.2025 (admin_1.5)  
**Статус**: ✅ Работает, готово к production