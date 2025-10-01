# 🤝 Contributing to Wekey Tools

Спасибо за интерес к улучшению Wekey Tools! Этот документ содержит рекомендации для разработчиков.

## 📋 Содержание

- [Начало работы](#начало-работы)
- [Процесс разработки](#процесс-разработки)
- [Соглашения кодирования](#соглашения-кодирования)
- [Структура проекта](#структура-проекта)
- [Тестирование](#тестирование)
- [Создание Pull Request](#создание-pull-request)

---

## 🚀 Начало работы

### Требования к окружению

- **Node.js** >= 18.0.0
- **npm** >= 8.0.0
- **Git** >= 2.30.0
- **VS Code** (рекомендуется)

### Клонирование и установка

```bash
# 1. Форкните репозиторий на GitHub

# 2. Клонируйте ваш fork
git clone https://github.com/YOUR_USERNAME/wekey_tools.git
cd wekey_tools

# 3. Добавьте upstream remote
git remote add upstream https://github.com/Tishakov/wekey_tools.git

# 4. Установите зависимости
cd backend && npm install
cd ../frontend && npm install
```

### Запуск проекта

```bash
# Terminal 1 - Backend
cd backend
node src/app.js

# Terminal 2 - Frontend
cd frontend
npm run dev
```

Откройте http://localhost:5173 в браузере.

---

## 💻 Процесс разработки

### 1. Создание новой ветки

```bash
# Обновите main ветку
git checkout main
git pull upstream main

# Создайте feature ветку
git checkout -b feature/your-feature-name
```

**Соглашение об именовании веток:**
- `feature/` - новая функциональность
- `fix/` - исправление бага
- `docs/` - обновление документации
- `refactor/` - рефакторинг кода
- `test/` - добавление тестов

### 2. Разработка

- Следуйте [соглашениям кодирования](#соглашения-кодирования)
- Пишите понятные commit сообщения
- Тестируйте изменения локально
- Обновляйте документацию при необходимости

### 3. Commit сообщения

Используйте [Conventional Commits](https://www.conventionalcommits.org/):

```
<type>(<scope>): <subject>

<body>

<footer>
```

**Типы:**
- `feat:` - новая функциональность
- `fix:` - исправление бага
- `docs:` - изменения в документации
- `style:` - форматирование, точки с запятой и т.д.
- `refactor:` - рефакторинг production кода
- `test:` - добавление тестов
- `chore:` - обновление задач сборки, настроек и т.д.

**Примеры:**
```bash
feat(auth): добавлена поддержка 2FA аутентификации

fix(tools): исправлен баг с подсчетом использований в EmojiTool

docs(readme): обновлена инструкция по установке

refactor(api): оптимизированы запросы к БД в админ-панели
```

---

## 📝 Соглашения кодирования

### TypeScript / JavaScript

#### Общие правила

```typescript
// ✅ ПРАВИЛЬНО
const userName = 'John';
const isUserActive = true;

// ❌ НЕПРАВИЛЬНО
const user_name = 'John';
const UserActive = true;
```

#### Именование

- **Переменные и функции**: `camelCase`
- **Компоненты React**: `PascalCase`
- **Константы**: `UPPER_SNAKE_CASE`
- **Приватные поля**: префикс `_`

```typescript
// Компоненты
const UserProfile = () => { };

// Функции
function calculateTotal() { }

// Константы
const MAX_RETRY_ATTEMPTS = 3;

// Приватные
class Service {
  private _connection;
}
```

#### React компоненты

```typescript
// ✅ ПРАВИЛЬНО - Функциональный компонент с типизацией
interface ButtonProps {
  label: string;
  onClick: () => void;
  disabled?: boolean;
}

const Button: React.FC<ButtonProps> = ({ label, onClick, disabled = false }) => {
  return (
    <button onClick={onClick} disabled={disabled}>
      {label}
    </button>
  );
};

export default Button;
```

#### Hooks

```typescript
// Кастомные hooks должны начинаться с 'use'
const useAuthRequired = () => {
  const { user } = useAuth();
  const [isModalOpen, setIsModalOpen] = useState(false);
  
  const requireAuth = useCallback(() => {
    if (!user) {
      setIsModalOpen(true);
      return false;
    }
    return true;
  }, [user]);
  
  return { requireAuth, isModalOpen, setIsModalOpen };
};
```

### CSS

#### Соглашения

- Используйте **CSS Modules** для изоляции стилей
- Именование классов: `kebab-case`
- Следуйте БЭМ методологии для сложных компонентов

```css
/* ✅ ПРАВИЛЬНО */
.user-profile { }
.user-profile__avatar { }
.user-profile__name--active { }

/* ❌ НЕПРАВИЛЬНО */
.UserProfile { }
.user_profile { }
```

#### Шрифты и цвета

```css
/* Используйте стандартный шрифт проекта */
font-family: 'Gilroy', -apple-system, BlinkMacSystemFont, sans-serif;

/* Используйте проектные градиенты */
background: linear-gradient(135deg, #5E35F2 0%, #F22987 100%);

/* Стандартные тени */
box-shadow: 0 4px 20px rgba(94, 53, 242, 0.15);
```

#### Запреты

```css
/* ❌ НЕ используйте translateY для анимаций */
/* Причина: проблемы с производительностью на мобильных устройствах */
transform: translateY(-5px); /* ИЗБЕГАЙТЕ */

/* ✅ Используйте альтернативы */
transform: scale(1.05);
box-shadow: 0 6px 25px rgba(94, 53, 242, 0.2);
```

### Backend (Node.js)

#### Структура контроллеров

```javascript
// controllers/exampleController.js
const Example = require('../models/Example');

exports.getExample = async (req, res) => {
  try {
    const { id } = req.params;
    const example = await Example.findByPk(id);
    
    if (!example) {
      return res.status(404).json({ error: 'Not found' });
    }
    
    res.json(example);
  } catch (error) {
    console.error('Error in getExample:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};
```

#### Обработка ошибок

```javascript
// ✅ ПРАВИЛЬНО - Всегда используйте try-catch
try {
  const result = await someAsyncOperation();
  res.json(result);
} catch (error) {
  console.error('Operation failed:', error);
  res.status(500).json({ error: 'Operation failed' });
}
```

---

## 📁 Структура проекта

### Добавление нового инструмента

1. **Создайте компонент**:
```
frontend/src/pages/YourToolName.tsx
```

2. **Добавьте переводы**:
```json
// frontend/src/i18n/locales/ru.json
{
  "tools": {
    "yourTool": {
      "title": "Название инструмента",
      "description": "Описание"
    }
  }
}
```

3. **Добавьте маршрут**:
```typescript
// frontend/src/App.tsx
import YourToolName from './pages/YourToolName';

<Route path="/your-tool" element={<YourToolName />} />
```

4. **Зарегистрируйте в БД**:
```javascript
// backend/src/scripts/addTool.js
// Добавьте запись в таблицу tools
```

### Добавление API endpoint

1. **Создайте маршрут**:
```javascript
// backend/src/routes/yourRoute.js
const express = require('express');
const router = express.Router();
const { authenticate } = require('../middleware/auth');

router.get('/', authenticate, async (req, res) => {
  // Логика
});

module.exports = router;
```

2. **Зарегистрируйте в app.js**:
```javascript
// backend/src/app.js
const yourRoute = require('./routes/yourRoute');
app.use('/api/your-route', yourRoute);
```

---

## 🧪 Тестирование

### Перед commit

```bash
# 1. Проверьте TypeScript ошибки
cd frontend
npm run build

# 2. Запустите линтер (если настроен)
npm run lint

# 3. Протестируйте функциональность вручную
# - Авторизация
# - Инструменты
# - Админ панель
```

### Тестовые данные

```javascript
// Используйте тестовый админ аккаунт
Email: admin@wekey.tools
Password: admin123
```

### Скрипты проверки

```bash
# Проверка структуры БД
node scripts/testing/check_db_structure.js

# Проверка инструментов
node scripts/testing/check-analytics.js
```

---

## 🔀 Создание Pull Request

### 1. Подготовка

```bash
# Убедитесь, что все изменения закоммичены
git status

# Обновите main ветку
git fetch upstream
git rebase upstream/main

# Запушьте изменения
git push origin feature/your-feature-name
```

### 2. Создание PR

1. Откройте GitHub и создайте Pull Request
2. Заполните шаблон PR:

```markdown
## Описание изменений
Краткое описание того, что было сделано

## Тип изменений
- [ ] Новая функциональность
- [ ] Исправление бага
- [ ] Улучшение производительности
- [ ] Рефакторинг
- [ ] Обновление документации

## Тестирование
Опишите, как были протестированы изменения

## Чеклист
- [ ] Код следует соглашениям проекта
- [ ] Обновлена документация
- [ ] Добавлены/обновлены тесты
- [ ] Локально все работает
- [ ] Нет TypeScript ошибок
```

3. Запросите review

### 3. После review

- Внесите исправления если требуется
- Отвечайте на комментарии
- После approve PR будет смержен

---

## 🐛 Сообщение о багах

### Создание Issue

Используйте следующий шаблон:

```markdown
## Описание бага
Четкое описание проблемы

## Шаги для воспроизведения
1. Перейти на '...'
2. Нажать на '...'
3. Прокрутить до '...'
4. Увидеть ошибку

## Ожидаемое поведение
Что должно было произойти

## Фактическое поведение
Что произошло на самом деле

## Скриншоты
Если применимо

## Окружение
- OS: [e.g. Windows 11]
- Browser: [e.g. Chrome 118]
- Node.js: [e.g. 18.17.0]
```

---

## 📚 Полезные ресурсы

### Документация проекта
- [README.md](README.md) - основная информация
- [PROJECT_CONTEXT.md](PROJECT_CONTEXT.md) - контекст проекта
- [CHANGELOG.md](CHANGELOG.md) - история изменений
- [DEVELOPMENT_NOTES.md](DEVELOPMENT_NOTES.md) - заметки разработки

### Внешние ресурсы
- [React Documentation](https://react.dev/)
- [TypeScript Handbook](https://www.typescriptlang.org/docs/)
- [Express.js Guide](https://expressjs.com/en/guide/routing.html)
- [Sequelize Documentation](https://sequelize.org/docs/v6/)

---

## 💬 Получение помощи

Если у вас есть вопросы:

1. Проверьте существующую документацию
2. Поищите в Issues похожие вопросы
3. Создайте новый Issue с тегом `question`
4. Свяжитесь с командой разработки

---

## 📜 Лицензия

Внося вклад в этот проект, вы соглашаетесь с тем, что ваши изменения будут лицензированы согласно лицензии проекта.

---

## 🎉 Спасибо!

Ваш вклад делает Wekey Tools лучше для всех. Спасибо, что уделили время для улучшения проекта!

---

**Последнее обновление**: 01.10.2025
