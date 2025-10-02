# ЭТАП 2: Динамические переменные {{name}} - ЗАВЕРШЕН ✅

## Дата: 01.10.2025

## Цель этапа
Реализовать систему динамических переменных для персонализации email-писем с возможностью вставки {{firstName}}, {{email}}, {{balance}} и других переменных.

---

## Выполненные задачи

### 1. ✅ Backend API для переменных

**Файл:** `backend/src/controllers/emailVariablesController.js`

**Эндпоинты:**

```javascript
GET    /api/email-variables          // Получить все переменные
GET    /api/email-variables/:id      // Получить одну переменную
POST   /api/email-variables          // Создать переменную (custom)
PUT    /api/email-variables/:id      // Обновить переменную
DELETE /api/email-variables/:id      // Удалить переменную (только custom)
```

**Функции:**

1. **getAllVariables(req, res)**
   - Возвращает все переменные с группировкой по категориям
   - Фильтр по category: `?category=user|system|custom`
   - Результат: `{ variables: [], grouped: {} }`

2. **parseVariables(text)**
   - Парсит текст и находит все `{{variable}}`
   - Возвращает массив найденных переменных с индексами

3. **replaceVariables(text, userData)**
   - Заменяет переменные на реальные значения
   - Использует userData для user-переменных
   - Системные переменные берутся из `getSystemVariable()`
   - Fallback на `variable.example` если значение не найдено

4. **getSystemVariable(key)**
   - Получает значения системных переменных:
     - `platformName` → 'Wekey Tools'
     - `currentYear` → '2025'
     - `currentDate` → '01.10.2025'
     - `supportEmail` → 'support@wekey.tools'
     - `siteUrl` → 'https://wekey.tools'

---

### 2. ✅ Модель EmailVariable

**Файл:** `backend/src/models/EmailVariable.js`

**Схема:**
```javascript
{
  id: INTEGER PRIMARY KEY AUTO_INCREMENT,
  key: STRING(100) UNIQUE NOT NULL,       // 'firstName', 'balance', etc.
  description: TEXT,                       // 'Имя пользователя'
  example: STRING(255),                    // 'Иван'
  category: STRING(50) NOT NULL,          // 'user', 'system', 'custom'
  createdAt: DATE,
  updatedAt: DATE
}
```

**Индексы:**
- UNIQUE на `key`
- INDEX на `category`

---

### 3. ✅ Роуты

**Файл:** `backend/src/routes/emailVariables.js`

**Защита:** Все роуты требуют `requireAdmin` middleware

```javascript
router.get('/', emailVariablesController.getAllVariables);
router.get('/:id', emailVariablesController.getVariable);
router.post('/', emailVariablesController.createVariable);
router.put('/:id', emailVariablesController.updateVariable);
router.delete('/:id', emailVariablesController.deleteVariable);
```

**Регистрация в app.js:**
```javascript
app.use('/api/email-variables', emailVariablesRoutes);
```

---

### 4. ✅ React Hook: useEmailVariables

**Файл:** `frontend/src/hooks/useEmailVariables.ts`

**Интерфейс:**
```typescript
interface EmailVariable {
  id: number;
  key: string;
  description: string;
  example: string;
  category: 'user' | 'system' | 'custom';
}

interface GroupedVariables {
  [category: string]: EmailVariable[];
}
```

**Функции хука:**

1. **fetchVariables(category?)** - загрузка переменных
2. **getVariable(id)** - получить одну переменную
3. **createVariable(data)** - создать переменную
4. **updateVariable(id, data)** - обновить переменную
5. **deleteVariable(id)** - удалить переменную
6. **parseVariables(text)** - парсинг `{{var}}` из текста
7. **replaceWithExamples(text)** - замена на примеры
8. **replaceWithValues(text, userData)** - замена на реальные значения
9. **getUsedVariables(text)** - список используемых переменных

**State:**
```typescript
{
  variables: EmailVariable[],
  grouped: GroupedVariables,
  loading: boolean,
  error: string | null
}
```

---

### 5. ✅ Компонент VariableInserter

**Файл:** `frontend/src/components/admin/newsletters/VariableInserter.tsx`

**Props:**
```typescript
interface VariableInserterProps {
  onInsert: (variable: string) => void;
  buttonText?: string;
  buttonIcon?: string;
  position?: 'left' | 'right';
}
```

**Функциональность:**

1. **Dropdown меню** с переменными
2. **Поиск** по ключу и описанию
3. **Табы категорий:**
   - Все
   - 👤 Пользователь (user)
   - ⚙️ Система (system)
   - 🎨 Кастомные (custom)

4. **Карточка переменной:**
   ```
   ┌──────────────────────────────┐
   │ 👤 {{firstName}}             │
   │ Имя пользователя             │
   │ Пример: Иван                 │
   └──────────────────────────────┘
   ```

5. **Вставка переменной** по клику
6. **Закрытие** по клику вне
7. **Автофокус** на поле поиска
8. **Hint в footer** с подсказкой

---

### 6. ✅ Стили VariableInserter

**Файл:** `frontend/src/components/admin/newsletters/VariableInserter.css`

**Особенности:**

1. **Dropdown анимация:**
   ```css
   @keyframes dropdownSlideIn {
     from { opacity: 0; transform: translateY(-10px); }
     to { opacity: 1; transform: translateY(0); }
   }
   ```

2. **Hover эффекты:**
   - Карточки сдвигаются вправо на 4px
   - Рамка подсвечивается цветом #5E35F2
   - Плавный transition 0.2s

3. **Активная категория:**
   - Градиентный фон (фиолетовый → розовый)
   - Белый текст
   - Без рамки

4. **Кастомный скроллбар:**
   - Тонкий (6px)
   - Цвет: #333335
   - Hover: #444446

5. **Footer с подсказкой:**
   - Gradient фон rgba(94, 53, 242, 0.05)
   - Иконка 💡
   - Мелкий шрифт (11px)

---

## Предустановленные переменные (14 шт)

### 👤 USER (9 переменных):
```
{{name}}              - Полное имя пользователя    → "Иван Иванов"
{{firstName}}         - Имя                        → "Иван"
{{lastName}}          - Фамилия                    → "Иванов"
{{email}}             - Email пользователя         → "user@example.com"
{{balance}}           - Баланс коинов              → "100"
{{registrationDate}}  - Дата регистрации           → "01.10.2025"
{{lastLoginDate}}     - Последний вход             → "15.10.2025"
{{coinsSpent}}        - Потрачено коинов           → "50"
{{toolsUsed}}         - Использовано инструментов  → "5"
```

### ⚙️ SYSTEM (5 переменных):
```
{{platformName}}      - Название платформы   → "Wekey Tools"
{{supportEmail}}      - Email поддержки      → "support@wekey.tools"
{{currentYear}}       - Текущий год          → "2025"
{{currentDate}}       - Текущая дата         → "01.10.2025"
{{siteUrl}}           - URL сайта            → "https://wekey.tools"
```

---

## Примеры использования

### Frontend: Вставка переменной

```tsx
import VariableInserter from './VariableInserter';

function EmailEditor() {
  const [content, setContent] = useState('');
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const handleInsert = (variable: string) => {
    if (textareaRef.current) {
      const start = textareaRef.current.selectionStart;
      const end = textareaRef.current.selectionEnd;
      const newContent = 
        content.substring(0, start) + 
        variable + 
        content.substring(end);
      setContent(newContent);
    }
  };

  return (
    <>
      <VariableInserter 
        onInsert={handleInsert}
        buttonText="Добавить переменную"
        position="left"
      />
      <textarea ref={textareaRef} value={content} />
    </>
  );
}
```

### Backend: Замена переменных

```javascript
const emailVariablesController = require('./controllers/emailVariablesController');

async function sendEmail(template, userId) {
  const user = await User.findByPk(userId);
  
  const userData = {
    firstName: user.firstName,
    lastName: user.lastName,
    email: user.email,
    balance: user.coinBalance.toString(),
    registrationDate: formatDate(user.createdAt),
    // ... другие поля
  };
  
  const finalHTML = await emailVariablesController.replaceVariables(
    template.content,
    userData
  );
  
  // Отправка письма с finalHTML
}
```

### Hook: Парсинг и замена

```typescript
const { parseVariables, replaceWithExamples, getUsedVariables } = useEmailVariables();

// Парсинг
const vars = parseVariables(template);
// → ['firstName', 'balance', 'email']

// Замена на примеры (для preview)
const preview = replaceWithExamples(template);
// "Привет, Иван!" вместо "Привет, {{firstName}}!"

// Получить используемые переменные
const used = getUsedVariables(template);
// → [{ id: 1, key: 'firstName', description: '...', ... }]
```

---

## Структура файлов

```
backend/
├── src/
│   ├── controllers/
│   │   └── emailVariablesController.js  ⭐ Новый контроллер
│   ├── models/
│   │   └── EmailVariable.js             ⭐ Новая модель
│   ├── routes/
│   │   └── emailVariables.js            ⭐ Новые роуты
│   └── config/
│       └── database.js                  ✏️ Добавлен EmailVariable
├── test-email-variables-api.js          🧪 Тест API
├── check-email-variables.js             🧪 Проверка БД
└── ...

frontend/
├── src/
│   ├── hooks/
│   │   └── useEmailVariables.ts         ⭐ Новый hook
│   └── components/
│       └── admin/
│           └── newsletters/
│               ├── VariableInserter.tsx ⭐ Новый компонент
│               └── VariableInserter.css ⭐ Стили
└── ...
```

---

## API Примеры

### GET /api/email-variables

**Request:**
```bash
GET /api/email-variables
Authorization: Bearer <adminToken>
```

**Response:**
```json
{
  "success": true,
  "variables": [
    {
      "id": 1,
      "key": "firstName",
      "description": "Имя",
      "example": "Иван",
      "category": "user"
    },
    ...
  ],
  "grouped": {
    "user": [...],
    "system": [...],
    "custom": [...]
  }
}
```

### GET /api/email-variables?category=user

**Request:**
```bash
GET /api/email-variables?category=user
Authorization: Bearer <adminToken>
```

**Response:**
```json
{
  "success": true,
  "variables": [
    // Только user-переменные
  ],
  "grouped": {
    "user": [...]
  }
}
```

### POST /api/email-variables

**Request:**
```bash
POST /api/email-variables
Authorization: Bearer <adminToken>
Content-Type: application/json

{
  "key": "orderNumber",
  "description": "Номер заказа",
  "example": "ORD-12345",
  "category": "custom"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Переменная создана",
  "variable": {
    "id": 15,
    "key": "orderNumber",
    "description": "Номер заказа",
    "example": "ORD-12345",
    "category": "custom"
  }
}
```

---

## Интеграция в редактор писем

### Шаг 1: Добавить кнопку в toolbar

```tsx
<div className="editor-toolbar">
  <VariableInserter 
    onInsert={handleInsertVariable}
    buttonIcon="{{}}"
    buttonText="Переменная"
    position="left"
  />
  <button>Форматирование</button>
  <button>Медиа</button>
</div>
```

### Шаг 2: Обработчик вставки

```typescript
const handleInsertVariable = (variable: string) => {
  // Для textarea
  const textarea = textareaRef.current;
  if (textarea) {
    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const newContent = 
      content.substring(0, start) + 
      variable + 
      content.substring(end);
    
    setContent(newContent);
    
    // Установить курсор после переменной
    setTimeout(() => {
      textarea.selectionStart = textarea.selectionEnd = start + variable.length;
      textarea.focus();
    }, 0);
  }
  
  // Для Rich Text Editor
  if (editorRef.current) {
    editorRef.current.insertText(variable);
  }
};
```

### Шаг 3: Preview с заменой

```tsx
const { replaceWithExamples } = useEmailVariables();

function EmailPreview({ content }) {
  const previewHTML = replaceWithExamples(content);
  
  return (
    <div dangerouslySetInnerHTML={{ __html: previewHTML }} />
  );
}
```

---

## Тестирование

### Проверка БД:
```bash
node backend/check-email-variables.js
```

**Результат:**
```
📊 Email Variables in Database: 14

SYSTEM: 5 variables
USER: 9 variables
```

### Тест API (требует обновление с правильным паролем):
```bash
node backend/test-email-variables-api.js
```

---

## Следующие задачи

### Интеграция в CreateNewsletter:
1. Добавить VariableInserter в toolbar редактора
2. Обработчик вставки переменных
3. Preview с заменой на примеры
4. Подсветка переменных в редакторе

### Валидация:
1. Проверка существования переменных при сохранении
2. Предупреждение о неизвестных переменных
3. Список используемых переменных под редактором

### UI улучшения:
1. Drag & Drop переменных
2. Быстрые клавиши (Ctrl+Shift+V)
3. Подсветка синтаксиса {{var}}

---

## Время выполнения

**Запланировано:** 2-3 часа  
**Фактически:** ~2 часа  
**Статус:** ✅ ЗАВЕРШЕН

---

## Комментарии

1. **API готов** - все эндпоинты реализованы
2. **Hook полнофункционален** - парсинг, замена, фильтрация
3. **Компонент VariableInserter** - красивый dropdown с поиском
4. **14 переменных предустановлены** - готовы к использованию
5. **Следующий этап** - интеграция в редактор писем

---

**Автор:** AI Assistant + Tishakov  
**Дата:** 01.10.2025  
**Статус:** ✅ ГОТОВО К ИНТЕГРАЦИИ

---

## Демонстрация

### Variable Inserter UI:
```
┌────────────────────────────────────────┐
│ {{}} Переменная ▼                      │ ← Кнопка
└────────────────────────────────────────┘
         ↓
┌────────────────────────────────────────┐
│ 🔍 Поиск переменной...                │ ← Поиск
├────────────────────────────────────────┤
│ [Все] [👤 Пользователь] [⚙️ Система]  │ ← Табы
├────────────────────────────────────────┤
│ 👤 {{firstName}}                       │
│ Имя пользователя                       │
│ Пример: Иван                           │
├────────────────────────────────────────┤
│ 👤 {{email}}                           │
│ Email пользователя                     │
│ Пример: user@example.com               │
├────────────────────────────────────────┤
│ 💡 Переменные автоматически заменяются│ ← Подсказка
└────────────────────────────────────────┘
```
