# 📡 API Documentation - Wekey Tools

Полная документация API для платформы Wekey Tools.

**Base URL**: `http://localhost:8880`  
**API Version**: `1.0`  
**Last Updated**: 01.10.2025

---

## 📋 Содержание

- [Аутентификация](#аутентификация)
- [Пользователи](#пользователи)
- [Инструменты](#инструменты)
- [Администрирование](#администрирование)
- [Аналитика](#аналитика)
- [Финансы и монеты](#финансы-и-монеты)
- [Рассылки](#рассылки)
- [Новости](#новости)
- [SEO инструменты](#seo-инструменты)
- [Коды ошибок](#коды-ошибок)

---

## 🔐 Аутентификация

### Регистрация пользователя

**POST** `/api/auth/register`

**Описание**: Создание нового пользователя

**Request Body**:
```json
{
  "email": "user@example.com",
  "password": "SecurePass123!",
  "name": "John Doe"
}
```

**Response** (200 OK):
```json
{
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": 1,
    "email": "user@example.com",
    "name": "John Doe",
    "isActive": true,
    "createdAt": "2025-10-01T10:00:00.000Z"
  }
}
```

**Errors**:
- `400` - Validation error (email already exists)
- `500` - Server error

---

### Вход в систему

**POST** `/api/auth/login`

**Описание**: Авторизация пользователя

**Request Body**:
```json
{
  "email": "user@example.com",
  "password": "SecurePass123!"
}
```

**Response** (200 OK):
```json
{
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": 1,
    "email": "user@example.com",
    "name": "John Doe",
    "avatar": "/uploads/avatars/user1.jpg",
    "balance": 100,
    "isAdmin": false
  }
}
```

**Errors**:
- `401` - Invalid credentials
- `404` - User not found

---

### Обновление токена

**POST** `/api/auth/refresh`

**Описание**: Обновление access token через refresh token

**Headers**:
```
Authorization: Bearer <refresh_token>
```

**Response** (200 OK):
```json
{
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

**Errors**:
- `401` - Invalid or expired refresh token

---

### OAuth авторизация

**GET** `/auth/google`

**Описание**: Инициирует OAuth flow с Google

**GET** `/auth/google/callback`

**Описание**: Callback URL для Google OAuth

---

## 👤 Пользователи

### Получить текущего пользователя

**GET** `/api/users/me`

**Описание**: Получение информации о текущем авторизованном пользователе

**Headers**:
```
Authorization: Bearer <access_token>
```

**Response** (200 OK):
```json
{
  "id": 1,
  "email": "user@example.com",
  "name": "John Doe",
  "avatar": "/uploads/avatars/user1.jpg",
  "balance": 100,
  "subscription": {
    "type": "premium",
    "expiresAt": "2026-01-01T00:00:00.000Z"
  },
  "createdAt": "2025-01-01T10:00:00.000Z"
}
```

---

### Обновить профиль

**PUT** `/api/users/me`

**Headers**:
```
Authorization: Bearer <access_token>
```

**Request Body**:
```json
{
  "name": "John Smith",
  "email": "john.smith@example.com"
}
```

**Response** (200 OK):
```json
{
  "id": 1,
  "email": "john.smith@example.com",
  "name": "John Smith",
  "updatedAt": "2025-10-01T12:00:00.000Z"
}
```

---

### Загрузить аватар

**POST** `/api/users/avatar`

**Headers**:
```
Authorization: Bearer <access_token>
Content-Type: multipart/form-data
```

**Request Body** (FormData):
```
avatar: <file>
```

**Response** (200 OK):
```json
{
  "avatarUrl": "/uploads/avatars/user1_1696156800.jpg"
}
```

---

## 🛠️ Инструменты

### Получить список инструментов

**GET** `/api/tools`

**Query Parameters**:
- `category` (optional) - фильтр по категории
- `search` (optional) - поиск по названию

**Response** (200 OK):
```json
{
  "tools": [
    {
      "id": 1,
      "name": "Password Generator",
      "slug": "password-generator",
      "category": "generators",
      "usageCount": 1250,
      "isActive": true,
      "requiresAuth": false
    }
  ],
  "total": 26
}
```

---

### Увеличить счетчик использования

**POST** `/api/tools/:id/increment`

**Headers**:
```
Authorization: Bearer <access_token> (optional)
```

**Response** (200 OK):
```json
{
  "success": true,
  "toolId": 1,
  "newCount": 1251
}
```

---

### Получить статистику инструмента

**GET** `/api/tools/:id/stats`

**Headers**:
```
Authorization: Bearer <access_token>
```

**Query Parameters**:
- `period` - `day`, `week`, `month`, `year`

**Response** (200 OK):
```json
{
  "toolId": 1,
  "totalUsage": 1251,
  "periodUsage": 45,
  "uniqueUsers": 23,
  "trend": "+12%"
}
```

---

## 👑 Администрирование

### Получить статистику платформы

**GET** `/api/admin/dashboard`

**Headers**:
```
Authorization: Bearer <admin_access_token>
```

**Response** (200 OK):
```json
{
  "totalUsers": 1523,
  "activeUsers": 342,
  "totalTools": 26,
  "totalUsage": 45678,
  "revenue": {
    "today": 123.45,
    "month": 5432.10
  }
}
```

**Errors**:
- `403` - Forbidden (not admin)

---

### Получить список пользователей

**GET** `/api/admin/users`

**Headers**:
```
Authorization: Bearer <admin_access_token>
```

**Query Parameters**:
- `page` (default: 1)
- `limit` (default: 20)
- `search` (optional)
- `sortBy` (default: createdAt)
- `sortOrder` (default: DESC)

**Response** (200 OK):
```json
{
  "users": [
    {
      "id": 1,
      "email": "user@example.com",
      "name": "John Doe",
      "balance": 100,
      "isActive": true,
      "isAdmin": false,
      "lastLoginAt": "2025-10-01T10:00:00.000Z",
      "createdAt": "2025-01-01T10:00:00.000Z"
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 1523,
    "pages": 77
  }
}
```

---

### Управление пользователем

**PATCH** `/api/admin/users/:id`

**Headers**:
```
Authorization: Bearer <admin_access_token>
```

**Request Body**:
```json
{
  "isActive": false,
  "isAdmin": true,
  "balance": 500
}
```

**Response** (200 OK):
```json
{
  "success": true,
  "user": {
    "id": 1,
    "isActive": false,
    "isAdmin": true,
    "balance": 500
  }
}
```

---

## 📊 Аналитика

### Отправить событие аналитики

**POST** `/api/analytics/track`

**Request Body**:
```json
{
  "userId": "uuid-v4-string",
  "event": "tool_used",
  "toolId": 1,
  "metadata": {
    "duration": 45,
    "resultLength": 256
  }
}
```

**Response** (200 OK):
```json
{
  "success": true,
  "eventId": "evt_123456"
}
```

---

### Получить аналитику пользователя

**GET** `/api/analytics/user/:userId`

**Headers**:
```
Authorization: Bearer <access_token>
```

**Response** (200 OK):
```json
{
  "userId": "uuid-v4-string",
  "totalEvents": 234,
  "mostUsedTool": {
    "id": 1,
    "name": "Password Generator",
    "count": 45
  },
  "activityByDay": [
    {
      "date": "2025-10-01",
      "events": 12
    }
  ]
}
```

---

## 💰 Финансы и монеты

### Получить баланс

**GET** `/api/user/balance`

**Headers**:
```
Authorization: Bearer <access_token>
```

**Response** (200 OK):
```json
{
  "balance": 100,
  "currency": "coins",
  "transactions": [
    {
      "id": 1,
      "amount": 50,
      "type": "purchase",
      "description": "Premium Tool Purchase",
      "createdAt": "2025-10-01T10:00:00.000Z"
    }
  ]
}
```

---

### Добавить монеты

**POST** `/api/coins/add`

**Headers**:
```
Authorization: Bearer <access_token>
```

**Request Body**:
```json
{
  "amount": 50,
  "reason": "purchase"
}
```

**Response** (200 OK):
```json
{
  "success": true,
  "newBalance": 150,
  "transaction": {
    "id": 2,
    "amount": 50,
    "type": "credit"
  }
}
```

---

### Списать монеты

**POST** `/api/coins/deduct`

**Headers**:
```
Authorization: Bearer <access_token>
```

**Request Body**:
```json
{
  "amount": 10,
  "toolId": 1,
  "reason": "tool_usage"
}
```

**Response** (200 OK):
```json
{
  "success": true,
  "newBalance": 140,
  "transaction": {
    "id": 3,
    "amount": -10,
    "type": "debit"
  }
}
```

---

## 📧 Рассылки

### Создать рассылку

**POST** `/api/newsletters`

**Headers**:
```
Authorization: Bearer <admin_access_token>
```

**Request Body**:
```json
{
  "title": "Monthly Update",
  "subject": "Wekey Tools - October Update",
  "content": "<html>...</html>",
  "status": "draft"
}
```

**Response** (201 Created):
```json
{
  "id": 1,
  "title": "Monthly Update",
  "status": "draft",
  "createdAt": "2025-10-01T10:00:00.000Z"
}
```

---

### Получить рассылку

**GET** `/api/newsletters/:id`

**Headers**:
```
Authorization: Bearer <admin_access_token>
```

**Response** (200 OK):
```json
{
  "id": 1,
  "title": "Monthly Update",
  "subject": "Wekey Tools - October Update",
  "content": "<html>...</html>",
  "status": "draft",
  "sentAt": null,
  "recipientCount": 0,
  "createdAt": "2025-10-01T10:00:00.000Z"
}
```

---

### Отправить рассылку

**POST** `/api/newsletters/:id/send`

**Headers**:
```
Authorization: Bearer <admin_access_token>
```

**Response** (200 OK):
```json
{
  "success": true,
  "newsletterId": 1,
  "recipientCount": 1523,
  "status": "sending"
}
```

---

## 📰 Новости

### Получить список новостей

**GET** `/api/news`

**Query Parameters**:
- `page` (default: 1)
- `limit` (default: 10)
- `category` (optional)

**Response** (200 OK):
```json
{
  "news": [
    {
      "id": 1,
      "title": "New Feature Release",
      "slug": "new-feature-release",
      "excerpt": "We've added new tools...",
      "content": "<html>...</html>",
      "category": "updates",
      "imageUrl": "/uploads/news/image1.jpg",
      "publishedAt": "2025-10-01T10:00:00.000Z",
      "author": {
        "name": "Admin",
        "avatar": "/uploads/avatars/admin.jpg"
      }
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 10,
    "total": 45,
    "pages": 5
  }
}
```

---

### Создать новость

**POST** `/api/news`

**Headers**:
```
Authorization: Bearer <admin_access_token>
Content-Type: multipart/form-data
```

**Request Body** (FormData):
```
title: "New Feature Release"
content: "<html>...</html>"
category: "updates"
image: <file>
```

**Response** (201 Created):
```json
{
  "id": 1,
  "title": "New Feature Release",
  "slug": "new-feature-release",
  "publishedAt": "2025-10-01T10:00:00.000Z"
}
```

---

## 🔍 SEO инструменты

### SEO Audit Basic

**POST** `/api/tools/seo-audit`

**Request Body**:
```json
{
  "url": "https://example.com"
}
```

**Response** (200 OK):
```json
{
  "url": "https://example.com",
  "score": 85,
  "issues": [
    {
      "type": "warning",
      "message": "Missing meta description",
      "impact": "medium"
    }
  ],
  "recommendations": [
    "Add meta description",
    "Optimize images"
  ]
}
```

---

### SEO Audit Pro (Google Search Console)

**POST** `/api/tools/seo-audit-pro`

**Headers**:
```
Authorization: Bearer <access_token>
```

**Request Body**:
```json
{
  "url": "https://example.com",
  "googleAccessToken": "ya29.a0AfH6SMB..."
}
```

**Response** (200 OK):
```json
{
  "url": "https://example.com",
  "score": 92,
  "searchConsoleData": {
    "clicks": 1234,
    "impressions": 45678,
    "ctr": 2.7,
    "position": 12.3
  },
  "technicalSeo": {
    "pagespeed": 85,
    "mobileScore": 90,
    "issues": []
  },
  "recommendations": []
}
```

---

## ❗ Коды ошибок

| Код | Описание | Пример |
|-----|----------|--------|
| 200 | OK | Успешный запрос |
| 201 | Created | Ресурс создан |
| 400 | Bad Request | Неверные параметры |
| 401 | Unauthorized | Требуется авторизация |
| 403 | Forbidden | Нет прав доступа |
| 404 | Not Found | Ресурс не найден |
| 429 | Too Many Requests | Превышен лимит запросов |
| 500 | Internal Server Error | Ошибка сервера |

### Формат ошибки

```json
{
  "error": "Error message",
  "code": "ERROR_CODE",
  "details": {
    "field": "email",
    "message": "Email already exists"
  }
}
```

---

## 🔒 Безопасность

### Rate Limiting

API использует rate limiting для предотвращения злоупотреблений:

- **Публичные endpoints**: 100 запросов/минуту
- **Авторизованные endpoints**: 300 запросов/минуту
- **Admin endpoints**: 1000 запросов/минуту

### Headers безопасности

Рекомендуется использовать следующие headers:

```
Authorization: Bearer <token>
Content-Type: application/json
Accept: application/json
```

---

## 📝 Примеры использования

### cURL

```bash
# Регистрация
curl -X POST http://localhost:8880/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"Pass123!","name":"Test User"}'

# Авторизация
curl -X POST http://localhost:8880/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"Pass123!"}'

# Получить профиль
curl -X GET http://localhost:8880/api/users/me \
  -H "Authorization: Bearer YOUR_TOKEN"
```

### JavaScript (Axios)

```javascript
import axios from 'axios';

const api = axios.create({
  baseURL: 'http://localhost:8880/api',
  headers: {
    'Content-Type': 'application/json'
  }
});

// Авторизация
const login = async (email, password) => {
  const response = await api.post('/auth/login', { email, password });
  return response.data;
};

// С токеном
const getProfile = async (token) => {
  const response = await api.get('/users/me', {
    headers: { Authorization: `Bearer ${token}` }
  });
  return response.data;
};
```

---

## 🚀 Changelog

### Version 1.0 (Current)
- Базовая авторизация и регистрация
- OAuth Google integration
- 26 инструментов с API
- Админ панель
- Аналитика и статистика
- Система монет
- Рассылки и новости

---

**Последнее обновление**: 01.10.2025  
**Поддержка**: admin@wekey.tools
