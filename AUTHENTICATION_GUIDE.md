# Руководство по системе аутентификации и авторизации

## 📋 Обзор системы

Wekey Tools использует комплексную систему аутентификации с JWT токенами и фримиум-моделью для контроля доступа к инструментам.

## 🏗️ Архитектура компонентов

### 1. Основные компоненты аутентификации

#### AuthContext
```typescript
// frontend/src/contexts/AuthContext.tsx
interface AuthContextType {
  user: User | null;
  login: (email: string, password: string) => Promise<boolean>;
  register: (userData: RegisterData) => Promise<boolean>;
  logout: () => void;
  token: string | null;
  loading: boolean;
}

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(localStorage.getItem('token'));
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (token) {
      validateToken();
    } else {
      setLoading(false);
    }
  }, []);

  const validateToken = async () => {
    try {
      const response = await fetch('/api/auth/validate', {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      if (response.ok) {
        const userData = await response.json();
        setUser(userData);
      } else {
        logout();
      }
    } catch (error) {
      console.error('Token validation failed:', error);
      logout();
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthContext.Provider value={{ user, login, register, logout, token, loading }}>
      {children}
    </AuthContext.Provider>
  );
};
```

#### useAuth Hook
```typescript
// frontend/src/hooks/useAuth.ts
export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
};
```

### 2. Фримиум компоненты

#### AuthRequiredModal
```typescript
// frontend/src/components/modals/AuthRequiredModal.tsx
interface AuthRequiredModalProps {
  isOpen: boolean;
  onClose: () => void;
  onLogin: () => void;
}

export const AuthRequiredModal: React.FC<AuthRequiredModalProps> = ({
  isOpen,
  onClose,
  onLogin
}) => {
  const { t } = useTranslation();

  return (
    <Modal isOpen={isOpen} onClose={onClose} className="auth-required-modal">
      <div className="auth-required-content">
        <div className="auth-required-header">
          <div className="auth-required-icon">🔐</div>
          <h2>{t('auth.required.title')}</h2>
        </div>

        <p className="auth-required-message">
          {t('auth.required.message')}
        </p>

        <div className="auth-required-benefits">
          <h3>{t('auth.required.benefits.title')}</h3>
          <ul>
            <li>🚀 {t('auth.required.benefits.unlimited')}</li>
            <li>📊 {t('auth.required.benefits.analytics')}</li>
            <li>💾 {t('auth.required.benefits.history')}</li>
            <li>🎨 {t('auth.required.benefits.customization')}</li>
            <li>🔒 {t('auth.required.benefits.secure')}</li>
          </ul>
        </div>

        <div className="auth-required-actions">
          <button onClick={onLogin} className="btn-primary">
            {t('auth.required.login')}
          </button>
          <button onClick={onClose} className="btn-secondary">
            {t('auth.required.cancel')}
          </button>
        </div>
      </div>
    </Modal>
  );
};
```

#### useAuthRequired Hook
```typescript
// frontend/src/hooks/useAuthRequired.ts
export const useAuthRequired = () => {
  const { user } = useAuth();
  const { setAuthModalOpen } = useModal();
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);

  const requireAuth = useCallback((callback?: () => void) => {
    if (!user) {
      setIsAuthModalOpen(true);
      return false;
    }
    
    if (callback) {
      callback();
    }
    
    return true;
  }, [user]);

  const handleLogin = () => {
    setIsAuthModalOpen(false);
    setAuthModalOpen(true);
  };

  return {
    requireAuth,
    isAuthModalOpen,
    setIsAuthModalOpen,
    handleLogin
  };
};
```

## 🔧 Backend API

### 1. Маршруты аутентификации

```javascript
// backend/src/routes/auth.js
const express = require('express');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcrypt');
const { User } = require('../models');
const router = express.Router();

// Регистрация
router.post('/register', async (req, res) => {
  try {
    const { email, password, name } = req.body;
    
    // Проверка существующего пользователя
    const existingUser = await User.findOne({ where: { email } });
    if (existingUser) {
      return res.status(400).json({ error: 'User already exists' });
    }

    // Хэширование пароля
    const saltRounds = 12;
    const hashedPassword = await bcrypt.hash(password, saltRounds);

    // Создание пользователя
    const user = await User.create({
      email,
      password: hashedPassword,
      name,
      isActive: true
    });

    // Генерация токена
    const token = jwt.sign(
      { userId: user.id, email: user.email },
      process.env.JWT_SECRET,
      { expiresIn: '7d' }
    );

    res.status(201).json({
      user: {
        id: user.id,
        email: user.email,
        name: user.name
      },
      token
    });
  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({ error: 'Registration failed' });
  }
});

// Авторизация
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    // Поиск пользователя
    const user = await User.findOne({ where: { email } });
    if (!user) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    // Проверка пароля
    const isValidPassword = await bcrypt.compare(password, user.password);
    if (!isValidPassword) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    // Генерация токена
    const token = jwt.sign(
      { userId: user.id, email: user.email },
      process.env.JWT_SECRET,
      { expiresIn: '7d' }
    );

    res.json({
      user: {
        id: user.id,
        email: user.email,
        name: user.name
      },
      token
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ error: 'Login failed' });
  }
});

// Проверка токена
router.get('/validate', authenticateToken, async (req, res) => {
  try {
    const user = await User.findByPk(req.user.userId);
    if (!user) {
      return res.status(401).json({ error: 'User not found' });
    }

    res.json({
      id: user.id,
      email: user.email,
      name: user.name
    });
  } catch (error) {
    console.error('Token validation error:', error);
    res.status(500).json({ error: 'Validation failed' });
  }
});

module.exports = router;
```

### 2. Middleware для аутентификации

```javascript
// backend/src/middleware/auth.js
const jwt = require('jsonwebtoken');
const { User } = require('../models');

const authenticateToken = async (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ error: 'Access token required' });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    
    // Проверка существования пользователя
    const user = await User.findByPk(decoded.userId);
    if (!user || !user.isActive) {
      return res.status(401).json({ error: 'Invalid token' });
    }

    req.user = decoded;
    next();
  } catch (error) {
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({ error: 'Token expired' });
    }
    return res.status(403).json({ error: 'Invalid token' });
  }
};

// Middleware для опциональной аутентификации
const optionalAuth = async (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (token) {
    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      const user = await User.findByPk(decoded.userId);
      
      if (user && user.isActive) {
        req.user = decoded;
      }
    } catch (error) {
      // Игнорируем ошибки для опциональной аутентификации
    }
  }

  next();
};

module.exports = { authenticateToken, optionalAuth };
```

## 🛠️ Интеграция в инструменты

### 1. Стандартная интеграция

```typescript
// Пример: frontend/src/components/tools/PasswordGeneratorTool.tsx
import React, { useState } from 'react';
import { useAuthRequired } from '../../hooks/useAuthRequired';
import { AuthRequiredModal } from '../modals/AuthRequiredModal';
import { statsService } from '../../services/statsService';
import { useAuth } from '../../hooks/useAuth';

export const PasswordGeneratorTool: React.FC = () => {
  const { user } = useAuth();
  const { requireAuth, isAuthModalOpen, setIsAuthModalOpen, handleLogin } = useAuthRequired();
  const [password, setPassword] = useState('');
  const [options, setOptions] = useState({
    length: 12,
    includeUppercase: true,
    includeLowercase: true,
    includeNumbers: true,
    includeSymbols: false
  });

  const generatePassword = () => {
    // Проверка авторизации
    if (!requireAuth()) return;

    // Увеличение счётчика использования
    if (user) {
      statsService.incrementToolUsage(user.id, 'password-generator');
    }

    // Логика генерации пароля
    const charset = buildCharset(options);
    const newPassword = Array.from(
      { length: options.length },
      () => charset[Math.floor(Math.random() * charset.length)]
    ).join('');

    setPassword(newPassword);
  };

  const buildCharset = (opts: typeof options): string => {
    let chars = '';
    if (opts.includeLowercase) chars += 'abcdefghijklmnopqrstuvwxyz';
    if (opts.includeUppercase) chars += 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
    if (opts.includeNumbers) chars += '0123456789';
    if (opts.includeSymbols) chars += '!@#$%^&*()_+-=[]{}|;:,.<>?';
    return chars;
  };

  return (
    <div className="password-generator-tool">
      <h2>Генератор паролей</h2>
      
      <div className="password-options">
        {/* Настройки генератора */}
      </div>

      <button onClick={generatePassword} className="btn-primary">
        Сгенерировать пароль
      </button>

      {password && (
        <div className="generated-password">
          <input type="text" value={password} readOnly />
          <button onClick={() => navigator.clipboard.writeText(password)}>
            Копировать
          </button>
        </div>
      )}

      <AuthRequiredModal
        isOpen={isAuthModalOpen}
        onClose={() => setIsAuthModalOpen(false)}
        onLogin={handleLogin}
      />
    </div>
  );
};
```

### 2. Специальная логика для EmojiTool

```typescript
// frontend/src/components/tools/EmojiTool.tsx
export const EmojiTool: React.FC = () => {
  const { user } = useAuth();
  const { requireAuth, isAuthModalOpen, setIsAuthModalOpen, handleLogin } = useAuthRequired();
  const [hasUsedEmojiInSession, setHasUsedEmojiInSession] = useState(false);

  const insertEmoji = (emoji: string) => {
    // Проверка авторизации
    if (!requireAuth()) return;

    // Увеличиваем счётчик только при первом использовании в сессии
    if (!hasUsedEmojiInSession && user) {
      statsService.incrementToolUsage(user.id, 'emoji-tool');
      setHasUsedEmojiInSession(true);
    }

    // Вставка эмодзи
    const textarea = document.getElementById('emoji-target') as HTMLTextAreaElement;
    if (textarea) {
      const start = textarea.selectionStart;
      const end = textarea.selectionEnd;
      const newValue = textarea.value.substring(0, start) + emoji + textarea.value.substring(end);
      
      textarea.value = newValue;
      textarea.focus();
      textarea.setSelectionRange(start + emoji.length, start + emoji.length);
    }
  };

  // Загрузка статистики при монтировании
  useEffect(() => {
    if (user) {
      loadUserStats();
    }
  }, [user]);

  const loadUserStats = async () => {
    try {
      const stats = await statsService.getUserToolStats(user.id, 'emoji-tool');
      // Не сбрасываем счётчик сессии при загрузке
    } catch (error) {
      console.error('Failed to load emoji tool stats:', error);
    }
  };

  return (
    <div className="emoji-tool">
      <h2>Инструмент эмодзи</h2>
      <textarea id="emoji-target" placeholder="Выберите эмодзи ниже..." />
      
      <div className="emoji-grid">
        {emojiDatabase.map((emoji, index) => (
          <button
            key={index}
            onClick={() => insertEmoji(emoji.char)}
            className="emoji-button"
            title={emoji.name}
          >
            {emoji.char}
          </button>
        ))}
      </div>

      <AuthRequiredModal
        isOpen={isAuthModalOpen}
        onClose={() => setIsAuthModalOpen(false)}
        onLogin={handleLogin}
      />
    </div>
  );
};
```

### 3. Специальная логика для AnalyticsTool

```typescript
// frontend/src/components/tools/AnalyticsTool.tsx
export const AnalyticsTool: React.FC = () => {
  const { user } = useAuth();
  const { requireAuth, isAuthModalOpen, setIsAuthModalOpen, handleLogin } = useAuthRequired();
  const [data, setData] = useState([]);
  const [analysisResult, setAnalysisResult] = useState(null);

  const handleAIAnalysis = async () => {
    // Проверка авторизации
    if (!requireAuth()) return;

    // Счётчик для AI-анализа
    if (user) {
      statsService.incrementToolUsage(user.id, 'analytics-tool');
    }

    try {
      const analysis = await openaiService.analyzeData(data);
      setAnalysisResult(analysis);
    } catch (error) {
      console.error('AI analysis failed:', error);
    }
  };

  const exportToExcel = async () => {
    // Проверка авторизации
    if (!requireAuth()) return;

    // Счётчик для экспорта (отдельный)
    if (user) {
      statsService.incrementToolUsage(user.id, 'analytics-tool');
    }

    try {
      const workbook = new ExcelJS.Workbook();
      const worksheet = workbook.addWorksheet('Analytics Data');

      // Добавление данных
      data.forEach((row, index) => {
        worksheet.addRow(row);
      });

      // Сохранение файла
      const buffer = await workbook.xlsx.writeBuffer();
      const blob = new Blob([buffer], { 
        type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' 
      });
      
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = 'analytics-data.xlsx';
      link.click();
      
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Excel export failed:', error);
    }
  };

  return (
    <div className="analytics-tool">
      <h2>Сквозная аналитика</h2>
      
      <div className="analytics-actions">
        <button onClick={exportToExcel} className="btn-primary">
          Экспорт в Excel
        </button>
        <button onClick={handleAIAnalysis} className="btn-secondary">
          AI Анализ
        </button>
      </div>

      <AuthRequiredModal
        isOpen={isAuthModalOpen}
        onClose={() => setIsAuthModalOpen(false)}
        onLogin={handleLogin}
      />
    </div>
  );
};
```

## 📊 Сервис статистики

### Frontend сервис

```typescript
// frontend/src/services/statsService.ts
export const statsService = {
  async incrementToolUsage(userId: number, toolName: string): Promise<void> {
    try {
      await fetch('/api/stats/tool-usage', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({ userId, toolName })
      });
    } catch (error) {
      console.error('Failed to track tool usage:', error);
    }
  },

  async getUserToolStats(userId: number, toolName: string): Promise<any> {
    try {
      const response = await fetch(`/api/stats/user/${userId}/tool/${toolName}`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      return await response.json();
    } catch (error) {
      console.error('Failed to load tool stats:', error);
      return null;
    }
  }
};
```

### Backend API

```javascript
// backend/src/routes/stats.js
const express = require('express');
const { ToolUsageStat } = require('../models');
const { authenticateToken } = require('../middleware/auth');
const router = express.Router();

// Увеличение счётчика использования
router.post('/tool-usage', authenticateToken, async (req, res) => {
  try {
    const { userId, toolName } = req.body;
    
    // Проверка доступа
    if (req.user.userId !== userId) {
      return res.status(403).json({ error: 'Access denied' });
    }

    const [stat, created] = await ToolUsageStat.findOrCreate({
      where: { userId, toolName },
      defaults: { usageCount: 1, lastUsed: new Date() }
    });

    if (!created) {
      stat.usageCount += 1;
      stat.lastUsed = new Date();
      await stat.save();
    }

    res.json({ success: true, usageCount: stat.usageCount });
  } catch (error) {
    console.error('Error tracking tool usage:', error);
    res.status(500).json({ error: 'Failed to track usage' });
  }
});

// Получение статистики пользователя
router.get('/user/:userId/tool/:toolName', authenticateToken, async (req, res) => {
  try {
    const { userId, toolName } = req.params;
    
    // Проверка доступа
    if (req.user.userId !== parseInt(userId)) {
      return res.status(403).json({ error: 'Access denied' });
    }

    const stat = await ToolUsageStat.findOne({
      where: { userId, toolName }
    });

    res.json(stat || { usageCount: 0, lastUsed: null });
  } catch (error) {
    console.error('Error loading tool stats:', error);
    res.status(500).json({ error: 'Failed to load stats' });
  }
});

module.exports = router;
```

## 🌐 Многоязычная поддержка

### Файлы переводов

```json
// frontend/src/i18n/locales/ru.json
{
  "auth": {
    "required": {
      "title": "Требуется авторизация",
      "message": "Чтобы пользоваться инструментами, авторизируйтесь на сайте",
      "benefits": {
        "title": "Преимущества авторизации:",
        "unlimited": "Безлимитное использование всех инструментов",
        "analytics": "Персональная аналитика и статистика",
        "history": "История использования и сохранённые результаты",
        "customization": "Персонализация интерфейса",
        "secure": "Безопасное хранение данных"
      },
      "login": "Войти",
      "cancel": "Отмена"
    }
  }
}
```

```json
// frontend/src/i18n/locales/en.json
{
  "auth": {
    "required": {
      "title": "Authorization Required",
      "message": "To use tools, please log in to the website",
      "benefits": {
        "title": "Authorization Benefits:",
        "unlimited": "Unlimited use of all tools",
        "analytics": "Personal analytics and statistics",
        "history": "Usage history and saved results",
        "customization": "Interface personalization",
        "secure": "Secure data storage"
      },
      "login": "Log In",
      "cancel": "Cancel"
    }
  }
}
```

## 🚀 Развертывание

### 1. Переменные окружения

```bash
# backend/.env
NODE_ENV=production
PORT=8880
JWT_SECRET=your-super-secret-jwt-key-here
DATABASE_URL=sqlite:./database.sqlite

# Для production с MySQL
# DATABASE_URL=mysql://user:password@localhost:3306/wekey_tools

# CORS настройки
FRONTEND_URL=http://localhost:5173
```

### 2. Настройка базы данных

```javascript
// backend/src/models/ToolUsageStat.js
const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  const ToolUsageStat = sequelize.define('ToolUsageStat', {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true
    },
    userId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: 'Users',
        key: 'id'
      }
    },
    toolName: {
      type: DataTypes.STRING,
      allowNull: false
    },
    usageCount: {
      type: DataTypes.INTEGER,
      defaultValue: 0
    },
    lastUsed: {
      type: DataTypes.DATE,
      defaultValue: DataTypes.NOW
    }
  }, {
    indexes: [
      {
        unique: true,
        fields: ['userId', 'toolName']
      },
      {
        fields: ['lastUsed']
      }
    ]
  });

  return ToolUsageStat;
};
```

### 3. Команды запуска

```bash
# Разработка
cd backend && npm run dev
cd frontend && npm run dev

# Продакшн
cd backend && npm start
cd frontend && npm run build && npm run preview
```

## 🔧 Отладка и тестирование

### Проверка токенов

```javascript
// Проверка токена в браузере
const token = localStorage.getItem('token');
if (token) {
  const payload = JSON.parse(atob(token.split('.')[1]));
  console.log('Token payload:', payload);
  console.log('Expires:', new Date(payload.exp * 1000));
}
```

### Тестирование API

```bash
# Регистрация
curl -X POST http://localhost:8880/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"test123","name":"Test User"}'

# Авторизация
curl -X POST http://localhost:8880/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"test123"}'

# Проверка токена
curl -X GET http://localhost:8880/api/auth/validate \
  -H "Authorization: Bearer YOUR_TOKEN_HERE"
```

## 📈 Мониторинг и аналитика

### Логирование использования

```javascript
// backend/src/middleware/analytics.js
const logToolUsage = (req, res, next) => {
  const originalSend = res.send;
  
  res.send = function(data) {
    // Логирование успешного использования инструмента
    if (res.statusCode === 200 && req.user) {
      console.log(`Tool usage: User ${req.user.userId} used ${req.body.toolName}`);
    }
    
    return originalSend.call(this, data);
  };
  
  next();
};
```

---

## 📝 Заключение

Система аутентификации и авторизации Wekey Tools обеспечивает:

- ✅ **Безопасность** - JWT токены с проверкой на backend
- ✅ **Удобство** - Автоматическая проверка авторизации в инструментах  
- ✅ **Гибкость** - Специальная логика для разных типов инструментов
- ✅ **Масштабируемость** - Готовность к добавлению новых инструментов
- ✅ **Аналитика** - Точный подсчёт использования для монетизации

Система готова к продакшну и дальнейшему развитию фримиум-модели.