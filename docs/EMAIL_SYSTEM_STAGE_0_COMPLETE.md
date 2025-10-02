# ЭТАП 0: Подготовка инфраструктуры - ЗАВЕРШЕН ✅

## Дата: 01.10.2025

## Цель этапа
Подготовить базу данных и инфраструктуру для новой системы email-маркетинга с поддержкой системных писем, динамических переменных и библиотеки блоков.

---

## Выполненные задачи

### 1. ✅ Миграция базы данных

**Файл:** `backend/src/migrations/20251001-add-system-emails-support.js`

**Изменения:**
- Добавлены колонки в таблицу `newsletters`:
  - `type` (VARCHAR(50), default: 'custom') - тип письма (custom, system_welcome, system_password_reset и т.д.)
  - `isSystem` (BOOLEAN, default: false) - флаг системного письма (нельзя удалить)

- Создана таблица `email_blocks_library`:
  - `id` - ID блока
  - `name` - название блока (например, "Purple Header")
  - `type` - тип блока (header, footer, content, cta, image)
  - `content` - JSON структура блока
  - `htmlContent` - готовый HTML блока
  - `thumbnail` - превью блока
  - `createdBy` - автор блока
  - `usageCount` - счетчик использований

- Создана таблица `email_variables`:
  - `id` - ID переменной
  - `key` - ключ переменной (name, email, balance и т.д.)
  - `description` - описание переменной
  - `example` - пример значения
  - `category` - категория (user, system, custom)

**Предустановленные переменные:**
```
User variables:
- {{name}} - Полное имя пользователя
- {{firstName}} - Имя
- {{lastName}} - Фамилия
- {{email}} - Email пользователя
- {{balance}} - Баланс коинов
- {{registrationDate}} - Дата регистрации
- {{lastLoginDate}} - Последний вход
- {{coinsSpent}} - Потрачено коинов
- {{toolsUsed}} - Использовано инструментов

System variables:
- {{platformName}} - Название платформы (Wekey Tools)
- {{supportEmail}} - Email поддержки
- {{currentYear}} - Текущий год
- {{currentDate}} - Текущая дата
- {{siteUrl}} - URL сайта
```

---

### 2. ✅ Импорт системного welcome-письма

**Файл:** `backend/import-system-email.js`

**Что сделано:**
- Извлечен шаблон welcome-email из `EmailService.js`
- Сохранен в БД как системное письмо с параметрами:
  - `title`: "🎉 Добро пожаловать в Wekey Tools"
  - `subject`: "Подтвердите ваш Email - Wekey Tools"
  - `type`: "system_welcome"
  - `isSystem`: true
  - `status`: "active"

**Содержимое письма:**
- Gradient header (фиолетовый → розовый)
- Приветствие с именем: {{firstName}}
- Код подтверждения: {{verificationCode}}
- Информация о бонусных коинах: {{balance}}
- Адаптивный дизайн
- Footer с ссылками

**Используемые переменные в шаблоне:**
- `{{firstName}}` - имя пользователя
- `{{verificationCode}}` - код подтверждения
- `{{balance}}` - количество бонусных коинов
- `{{currentYear}}` - текущий год
- `{{siteUrl}}` - URL сайта

---

### 3. ✅ Обновление моделей

**Файл:** `backend/src/models/Newsletter.js`

**Добавлены поля:**
```javascript
type: {
  type: DataTypes.STRING(50),
  allowNull: false,
  defaultValue: 'custom',
  comment: 'custom, system_welcome, system_password_reset...'
},
isSystem: {
  type: DataTypes.BOOLEAN,
  allowNull: false,
  defaultValue: false,
  comment: 'Is this a system email that cannot be deleted'
}
```

---

### 4. ✅ Обновление UI (Frontend)

**Файл:** `frontend/src/components/admin/AdminNewsletters.tsx`

**Изменения:**
1. Добавлен бейдж "⚙️ Системное" для системных писем
2. Системные карточки подсвечены специальным градиентом
3. Кнопки "Дублировать" и "Удалить" скрыты для системных писем
4. Кнопка "Редактировать" доступна для всех писем

**Визуальное отличие:**
```tsx
<div className={`newsletter-card ${newsletter.isSystem ? 'system-email' : ''}`}>
  <h3>
    {newsletter.title}
    {newsletter.isSystem && (
      <span className="system-badge">⚙️ Системное</span>
    )}
  </h3>
</div>
```

**Файл:** `frontend/src/components/admin/AdminNewsletters.css`

**Добавлены стили:**
```css
.newsletter-card.system-email {
  border: 2px solid #5E35F2;
  background: linear-gradient(135deg, rgba(94, 53, 242, 0.05) 0%, rgba(242, 41, 135, 0.05) 100%);
}

.system-badge {
  background: linear-gradient(135deg, #5E35F2 0%, #F22987 100%);
  color: white;
  padding: 4px 10px;
  border-radius: 12px;
  font-size: 11px;
  font-weight: 600;
  text-transform: uppercase;
  box-shadow: 0 2px 8px rgba(94, 53, 242, 0.3);
}
```

---

### 5. ✅ TypeScript интерфейсы обновлены

**Файл:** `frontend/src/components/admin/newsletters/NewslettersList.tsx`

```typescript
interface Newsletter {
  id: number;
  title: string;
  subject: string;
  status: 'draft' | 'scheduled' | 'sent' | 'sending' | 'failed' | 'active';
  type?: string;          // NEW
  isSystem?: boolean;     // NEW
  targetAudience: string;
  createdAt: string;
  scheduledAt?: string;
  sentAt?: string;
  stats?: {
    sent: number;
    opened: number;
    clicked: number;
  };
}
```

---

## Созданные утилиты для разработки

1. **run-migration.js** - запуск миграций
2. **import-system-email.js** - импорт системных писем
3. **check-tables.js** - проверка таблиц в БД
4. **check-newsletters-schema.js** - проверка схемы newsletters
5. **check-users-schema.js** - проверка схемы Users
6. **check-admin-id.js** - поиск ID администратора
7. **check-system-email.js** - проверка системных писем
8. **test-newsletters-api.js** - тест API эндпоинта

---

## Структура базы данных (финальная)

```
newsletters
├── id (PK)
├── title
├── subject
├── content
├── htmlContent
├── type ⭐ NEW
├── isSystem ⭐ NEW
├── targetAudience
├── specificUsers (JSON)
├── segmentCriteria (JSON)
├── status
├── scheduledAt
├── sentAt
├── totalRecipients
├── sentCount
├── failedCount
├── createdBy (FK → Users)
├── createdAt
└── updatedAt

email_blocks_library ⭐ NEW
├── id (PK)
├── name
├── type
├── content (JSON)
├── htmlContent
├── thumbnail
├── createdBy (FK → Users)
├── usageCount
├── createdAt
└── updatedAt

email_variables ⭐ NEW
├── id (PK)
├── key (UNIQUE)
├── description
├── example
├── category
├── createdAt
└── updatedAt
```

---

## Результаты проверки

### База данных:
```
✅ newsletters table exists: true
✅ Column "type" exists: true
✅ Column "isSystem" exists: true
✅ email_blocks_library created
✅ email_variables created
✅ 14 variables pre-populated
```

### Данные:
```
ID: 8
Title: 🎉 Добро пожаловать в Wekey Tools
Subject: Подтвердите ваш Email - Wekey Tools
Type: system_welcome
Is System: ✅ YES
Status: active

✅ Total system emails: 1
```

---

## Следующие этапы

### ЭТАП 1: Разделение концепций + UI системных писем (3-4 часа)
- Табы: Письма | Библиотека блоков | Рассылки | Аудитории | Сценарии
- Список системных писем в разделе "Письма"
- Фильтр "Системные" / "Пользовательские"
- Редактирование системных писем

### ЭТАП 2: Динамические переменные {{name}} (2-3 часа)
- Парсинг переменных в шаблоне
- UI для вставки переменных (dropdown с подсказками)
- Подстановка значений при отправке
- Preview с тестовыми данными

### ЭТАП 3: Библиотека блоков (3-4 часа)
- UI для сохранения блоков в библиотеку
- Галерея блоков с превью
- Drag & Drop блоков из библиотеки
- Счетчик использований

### ЭТАП 4-9: Остальные фичи...

---

## Время выполнения ЭТАП 0

**Запланировано:** 2-3 часа  
**Фактически:** ~2 часа  
**Статус:** ✅ ЗАВЕРШЕН

---

## Комментарии

1. **Архитектура готова** - все базовые таблицы и связи созданы
2. **Системное письмо импортировано** - можно редактировать через админку
3. **UI обновлен** - системные письма визуально отличаются
4. **Переменные подготовлены** - 14 переменных готовы к использованию
5. **Следующий шаг** - ЭТАП 1 (разделение UI на табы)

---

## Технические детали

### Команды для запуска миграции:
```bash
cd backend
node run-migration.js
node import-system-email.js
```

### Проверка результатов:
```bash
node check-system-email.js
node check-tables.js
node check-newsletters-schema.js
```

### Запуск серверов:
```bash
# Backend
cd backend && npm start

# Frontend
cd frontend && npm run dev
```

---

**Автор:** AI Assistant + Tishakov  
**Дата:** 01.10.2025  
**Статус:** ✅ ГОТОВО К ЭТАП 1
