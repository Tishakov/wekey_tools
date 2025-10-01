# 🧪 Tests Directory

Эта папка предназначена для unit и integration тестов проекта.

## 📋 Структура (планируемая)

```
tests/
├── unit/              # Unit тесты
│   ├── backend/
│   │   ├── controllers/
│   │   ├── models/
│   │   └── services/
│   └── frontend/
│       ├── components/
│       ├── hooks/
│       └── utils/
│
├── integration/       # Integration тесты
│   ├── api/
│   ├── auth/
│   └── database/
│
├── e2e/              # End-to-end тесты
│   ├── user-flows/
│   └── admin-flows/
│
├── fixtures/         # Тестовые данные
├── mocks/           # Mock объекты
└── setup/           # Настройка тестового окружения
```

---

## 🚀 Планы по тестированию

### Phase 1: Unit Tests (Priority 1)
- ✅ Установить Jest/Vitest
- ✅ Настроить test runner
- ⏳ Покрыть тестами утилиты (80%+)
- ⏳ Покрыть тестами компоненты (60%+)
- ⏳ Покрыть тестами API endpoints (70%+)

### Phase 2: Integration Tests (Priority 2)
- ⏳ Тесты аутентификации
- ⏳ Тесты работы с БД
- ⏳ Тесты API интеграций

### Phase 3: E2E Tests (Priority 3)
- ⏳ Настроить Playwright/Cypress
- ⏳ Тесты пользовательских сценариев
- ⏳ Тесты админ-панели

---

## 🛠️ Технологии

### Frontend Testing
- **Jest** или **Vitest** - test runner
- **React Testing Library** - тестирование компонентов
- **MSW** - mocking API запросов

### Backend Testing
- **Jest** - test runner
- **Supertest** - тестирование API
- **SQLite in-memory** - тестовая БД

### E2E Testing
- **Playwright** или **Cypress** - браузерное тестирование

---

## 📝 Пример структуры теста

### Unit Test (Frontend)
```typescript
// tests/unit/frontend/components/Button.test.tsx
import { render, screen, fireEvent } from '@testing-library/react';
import { Button } from '@/components/Button';

describe('Button Component', () => {
  it('should render correctly', () => {
    render(<Button label="Click me" />);
    expect(screen.getByText('Click me')).toBeInTheDocument();
  });

  it('should handle click events', () => {
    const handleClick = jest.fn();
    render(<Button label="Click me" onClick={handleClick} />);
    fireEvent.click(screen.getByText('Click me'));
    expect(handleClick).toHaveBeenCalledTimes(1);
  });
});
```

### API Test (Backend)
```javascript
// tests/integration/api/auth.test.js
const request = require('supertest');
const app = require('../../backend/src/app');

describe('Auth API', () => {
  describe('POST /api/auth/login', () => {
    it('should login with valid credentials', async () => {
      const res = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'test@example.com',
          password: 'password123'
        });
      
      expect(res.statusCode).toBe(200);
      expect(res.body).toHaveProperty('token');
    });
  });
});
```

---

## 🎯 Coverage Goals

### Минимальные требования
- **Statements**: 70%
- **Branches**: 60%
- **Functions**: 70%
- **Lines**: 70%

### Целевые показатели
- **Statements**: 80%+
- **Branches**: 70%+
- **Functions**: 80%+
- **Lines**: 80%+

---

## 🚦 CI/CD Integration

### GitHub Actions (планируется)
```yaml
# .github/workflows/test.yml
name: Tests

on: [push, pull_request]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - name: Run tests
        run: npm test
      - name: Upload coverage
        uses: codecov/codecov-action@v3
```

---

## 📊 Запуск тестов

```bash
# Все тесты
npm test

# Unit тесты
npm run test:unit

# Integration тесты
npm run test:integration

# E2E тесты
npm run test:e2e

# С coverage
npm run test:coverage

# Watch mode
npm run test:watch
```

---

## 📚 Дополнительные ресурсы

- [Jest Documentation](https://jestjs.io/)
- [React Testing Library](https://testing-library.com/react)
- [Vitest Documentation](https://vitest.dev/)
- [Playwright Documentation](https://playwright.dev/)

---

## ⚠️ Текущий статус

**🚧 В разработке**: Система тестирования находится в процессе внедрения.

Следите за обновлениями в [CHANGELOG.md](../CHANGELOG.md)

---

**Последнее обновление**: 01.10.2025  
**Статус**: 🚧 Planning Phase
