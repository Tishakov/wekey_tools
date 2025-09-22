# Руководство по развертыванию Wekey Tools с фримиум-системой

## 📋 Обзор

Данное руководство описывает процесс развертывания платформы Wekey Tools с интегрированной фримиум-моделью, включая настройку базы данных, серверов и системы аутентификации.

## 🏗️ Архитектура системы

```
┌─────────────────┐    ┌──────────────────┐    ┌─────────────────┐
│   Frontend      │    │     Backend      │    │    Database     │
│   React + Vite  │◄──►│  Node.js + JWT   │◄──►│  SQLite/MySQL   │
│   Port: 5173    │    │   Port: 8880     │    │  Auth + Stats   │
└─────────────────┘    └──────────────────┘    └─────────────────┘
         │                        │                        │
         ▼                        ▼                        ▼
┌─────────────────┐    ┌──────────────────┐    ┌─────────────────┐
│ Фримиум блокировка │    │  API Endpoints   │    │ Tool Usage Stats│
│ 24/24 инструмента │    │ /auth, /stats    │    │ User Sessions   │
│ AuthRequired Modal │    │ JWT Validation   │    │ Analytics Data  │
└─────────────────┘    └──────────────────┘    └─────────────────┘
```

## 🛠️ Системные требования

### Минимальные требования:
- **Node.js**: 18.0.0 или выше
- **npm**: 8.0.0 или выше  
- **Оперативная память**: 2GB RAM
- **Дисковое пространство**: 1GB свободного места
- **ОС**: Windows 10/11, macOS 10.15+, Ubuntu 18.04+

### Рекомендуемые требования:
- **Node.js**: 20.0.0 или выше
- **npm**: 10.0.0 или выше
- **Оперативная память**: 4GB RAM
- **Дисковое пространство**: 5GB свободного места
- **Процессор**: 2+ ядра
- **База данных**: MySQL 8.0+ (для продакшена)

## 📦 Установка и настройка

### 1. Клонирование репозитория

```bash
# Клонирование проекта
git clone https://github.com/yourusername/wekey_tools.git
cd wekey_tools

# Проверка версии (должна быть freemium_complete_1.1 или выше)
git tag --list | grep freemium
```

### 2. Настройка Backend

```bash
# Переход в папку backend
cd backend

# Установка зависимостей
npm install

# Создание файла окружения
cp .env.example .env
```

#### Конфигурация .env файла:

```bash
# backend/.env

# Основные настройки
NODE_ENV=production
PORT=8880

# JWT секретный ключ (ОБЯЗАТЕЛЬНО изменить!)
JWT_SECRET=your-super-secret-jwt-key-change-this-in-production

# База данных
DATABASE_URL=sqlite:./database.sqlite

# Для продакшена с MySQL:
# DATABASE_URL=mysql://username:password@localhost:3306/wekey_tools

# CORS настройки
FRONTEND_URL=http://localhost:5173

# Для продакшена:
# FRONTEND_URL=https://yourdomain.com

# Опциональные настройки
LOG_LEVEL=info
SESSION_TIMEOUT=604800  # 7 дней в секундах
```

### 3. Настройка Frontend

```bash
# Переход в папку frontend
cd ../frontend

# Установка зависимостей
npm install

# Создание файла окружения
cp .env.example .env
```

#### Конфигурация frontend .env:

```bash
# frontend/.env

# API базовый URL
VITE_API_BASE_URL=http://localhost:8880

# Для продакшена:
# VITE_API_BASE_URL=https://api.yourdomain.com

# Режим разработки
VITE_NODE_ENV=development

# Для продакшена:
# VITE_NODE_ENV=production
```

## 🗄️ Настройка базы данных

### SQLite (Разработка)

```bash
# Инициализация базы данных
cd backend
node src/scripts/init-database.js

# Создание таблиц аналитики
node create-analytics-tables.js

# Создание таблиц аутентификации
node src/scripts/create-auth-tables.js

# Проверка подключения
node src/scripts/test-database.js
```

### MySQL (Продакшн)

#### 1. Создание базы данных:

```sql
-- Подключение к MySQL
mysql -u root -p

-- Создание базы данных
CREATE DATABASE wekey_tools CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- Создание пользователя
CREATE USER 'wekey_user'@'localhost' IDENTIFIED BY 'secure_password';

-- Предоставление прав
GRANT ALL PRIVILEGES ON wekey_tools.* TO 'wekey_user'@'localhost';
FLUSH PRIVILEGES;
```

#### 2. Обновление конфигурации:

```bash
# backend/.env
DATABASE_URL=mysql://wekey_user:secure_password@localhost:3306/wekey_tools
```

#### 3. Миграция данных:

```bash
# Запуск миграций
cd backend
npm run migrate

# Создание первого админ пользователя
node src/scripts/create-admin-user.js
```

### Схема базы данных

```sql
-- Таблица пользователей
CREATE TABLE users (
    id INT PRIMARY KEY AUTO_INCREMENT,
    email VARCHAR(255) UNIQUE NOT NULL,
    password VARCHAR(255) NOT NULL,
    name VARCHAR(255),
    avatar VARCHAR(500),
    balance DECIMAL(10,2) DEFAULT 0.00,
    subscription_type ENUM('free', 'premium', 'enterprise') DEFAULT 'free',
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- Таблица статистики использования инструментов
CREATE TABLE tool_usage_stats (
    id INT PRIMARY KEY AUTO_INCREMENT,
    user_id INT,
    tool_name VARCHAR(100) NOT NULL,
    usage_count INT DEFAULT 0,
    last_used TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    UNIQUE KEY unique_user_tool (user_id, tool_name),
    INDEX idx_last_used (last_used),
    INDEX idx_tool_name (tool_name)
);

-- Таблица событий аналитики
CREATE TABLE analytics_events (
    id INT PRIMARY KEY AUTO_INCREMENT,
    user_uuid VARCHAR(36),
    event_type VARCHAR(50) NOT NULL,
    event_data JSON,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_user_uuid (user_uuid),
    INDEX idx_event_type (event_type),
    INDEX idx_created_at (created_at)
);
```

## 🚀 Процесс развертывания

### Разработка (Development)

```bash
# Терминал 1: Backend сервер
cd backend
npm run dev
# или
node src/app.js

# Терминал 2: Frontend сервер  
cd frontend
npm run dev

# Терминал 3: Тестирование
curl http://localhost:8880/health
curl http://localhost:8880/api/auth/validate
```

#### Проверка функциональности:

1. **Backend API**: http://localhost:8880/health
2. **Frontend**: http://localhost:5173  
3. **Админ панель**: http://localhost:5173/admin
4. **API документация**: http://localhost:8880/api/docs (если настроена)

### Продакшн (Production)

#### 1. Сборка Frontend:

```bash
cd frontend
npm run build

# Проверка сборки
npm run preview
```

#### 2. Настройка веб-сервера (Nginx):

```nginx
# /etc/nginx/sites-available/wekey-tools
server {
    listen 80;
    server_name yourdomain.com www.yourdomain.com;
    
    # Редирект на HTTPS
    return 301 https://$server_name$request_uri;
}

server {
    listen 443 ssl http2;
    server_name yourdomain.com www.yourdomain.com;
    
    # SSL сертификаты
    ssl_certificate /path/to/ssl/certificate.crt;
    ssl_certificate_key /path/to/ssl/private.key;
    
    # Безопасность SSL
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers ECDHE-RSA-AES256-GCM-SHA512:DHE-RSA-AES256-GCM-SHA512;
    ssl_prefer_server_ciphers off;
    
    # Frontend статические файлы
    location / {
        root /var/www/wekey-tools/frontend/dist;
        index index.html;
        try_files $uri $uri/ /index.html;
        
        # Кэширование статических ресурсов
        location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg)$ {
            expires 1y;
            add_header Cache-Control "public, immutable";
        }
    }
    
    # API проксирование
    location /api {
        proxy_pass http://localhost:8880;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
        
        # Таймауты
        proxy_connect_timeout 60s;
        proxy_send_timeout 60s;
        proxy_read_timeout 60s;
    }
    
    # Безопасность заголовков
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-XSS-Protection "1; mode=block" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header Referrer-Policy "no-referrer-when-downgrade" always;
    add_header Content-Security-Policy "default-src 'self' http: https: data: blob: 'unsafe-inline'" always;
}
```

#### 3. Настройка Process Manager (PM2):

```bash
# Установка PM2 глобально
npm install -g pm2

# Создание конфигурации
cd backend
```

Создать файл `ecosystem.config.js`:

```javascript
module.exports = {
  apps: [{
    name: 'wekey-tools-backend',
    script: 'src/app.js',
    cwd: '/var/www/wekey-tools/backend',
    instances: 'max',
    exec_mode: 'cluster',
    env: {
      NODE_ENV: 'production',
      PORT: 8880
    },
    env_production: {
      NODE_ENV: 'production',
      PORT: 8880
    },
    error_file: './logs/err.log',
    out_file: './logs/out.log',
    log_file: './logs/combined.log',
    time: true,
    max_memory_restart: '1G',
    restart_delay: 4000
  }]
};
```

```bash
# Запуск приложения
pm2 start ecosystem.config.js --env production

# Сохранение конфигурации
pm2 save
pm2 startup

# Мониторинг
pm2 monit
pm2 logs wekey-tools-backend
```

#### 4. Настройка SSL сертификатов (Let's Encrypt):

```bash
# Установка Certbot
sudo apt update
sudo apt install certbot python3-certbot-nginx

# Получение сертификата
sudo certbot --nginx -d yourdomain.com -d www.yourdomain.com

# Автоматическое обновление
sudo crontab -e
# Добавить строку:
0 12 * * * /usr/bin/certbot renew --quiet
```

## 🔧 Настройка мониторинга

### 1. Логирование

```bash
# Создание папки для логов
mkdir -p /var/www/wekey-tools/backend/logs

# Настройка ротации логов
sudo nano /etc/logrotate.d/wekey-tools
```

```bash
# /etc/logrotate.d/wekey-tools
/var/www/wekey-tools/backend/logs/*.log {
    daily
    missingok
    rotate 14
    compress
    delaycompress
    notifempty
    create 644 www-data www-data
    postrotate
        pm2 reload wekey-tools-backend
    endscript
}
```

### 2. Мониторинг здоровья

Создать `backend/src/scripts/health-check.js`:

```javascript
const http = require('http');

const healthCheck = () => {
  const options = {
    hostname: 'localhost',
    port: 8880,
    path: '/health',
    method: 'GET',
    timeout: 5000
  };

  const req = http.request(options, (res) => {
    if (res.statusCode === 200) {
      console.log('✅ Health check passed');
      process.exit(0);
    } else {
      console.log('❌ Health check failed');
      process.exit(1);
    }
  });

  req.on('error', (error) => {
    console.error('❌ Health check error:', error);
    process.exit(1);
  });

  req.on('timeout', () => {
    console.error('❌ Health check timeout');
    req.destroy();
    process.exit(1);
  });

  req.end();
};

healthCheck();
```

### 3. Автоматический мониторинг:

```bash
# Добавить в crontab
crontab -e
```

```bash
# Проверка каждые 5 минут
*/5 * * * * /usr/bin/node /var/www/wekey-tools/backend/src/scripts/health-check.js

# Ежедневный бэкап базы данных
0 2 * * * /var/www/wekey-tools/backend/src/scripts/backup-database.sh
```

## 🔒 Безопасность

### 1. Настройки брандмауэра:

```bash
# UFW (Ubuntu)
sudo ufw allow 22    # SSH
sudo ufw allow 80    # HTTP
sudo ufw allow 443   # HTTPS
sudo ufw deny 8880   # Закрыть прямой доступ к Backend
sudo ufw enable
```

### 2. Настройки безопасности Node.js:

```bash
# Установка helmet для безопасности
cd backend
npm install helmet cors express-rate-limit
```

Обновить `backend/src/app.js`:

```javascript
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');

// Безопасность заголовков
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: ["'self'", "'unsafe-inline'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      imgSrc: ["'self'", "data:", "https:"],
    },
  },
}));

// Ограничение частоты запросов
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 минут
  max: 100, // максимум 100 запросов с IP
  message: 'Too many requests from this IP'
});

app.use('/api', limiter);

// Специальные ограничения для аутентификации
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 5, // 5 попыток входа за 15 минут
  skipSuccessfulRequests: true
});

app.use('/api/auth/login', authLimiter);
app.use('/api/auth/register', authLimiter);
```

### 3. Обновление JWT секрета:

```bash
# Генерация крипто-стойкого ключа
node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"
```

## 📊 Тестирование развертывания

### 1. Автоматические тесты:

```bash
# Backend тесты
cd backend
npm test

# Frontend тесты  
cd frontend
npm test
```

### 2. Ручное тестирование:

```bash
# Проверка API
curl -X GET https://yourdomain.com/api/health
curl -X POST https://yourdomain.com/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"email":"test@test.com","password":"test123","name":"Test"}'

# Проверка фримиум блокировки
# 1. Открыть инструмент без авторизации
# 2. Убедиться что появляется AuthRequiredModal
# 3. Авторизоваться и проверить работу инструмента
```

### 3. Нагрузочное тестирование:

```bash
# Установка Apache Bench
sudo apt install apache2-utils

# Тестирование главной страницы
ab -n 1000 -c 10 https://yourdomain.com/

# Тестирование API
ab -n 100 -c 5 https://yourdomain.com/api/health
```

## 🔄 Резервное копирование

### 1. Скрипт бэкапа базы данных:

Создать `backend/src/scripts/backup-database.sh`:

```bash
#!/bin/bash

# Настройки
BACKUP_DIR="/var/backups/wekey-tools"
DATE=$(date +"%Y%m%d_%H%M%S")
DB_NAME="wekey_tools"

# Создание папки бэкапов
mkdir -p $BACKUP_DIR

# SQLite бэкап
if [ -f "./database.sqlite" ]; then
    cp ./database.sqlite "$BACKUP_DIR/database_$DATE.sqlite"
    echo "SQLite backup created: database_$DATE.sqlite"
fi

# MySQL бэкап
if [ ! -z "$MYSQL_PASSWORD" ]; then
    mysqldump -u $MYSQL_USER -p$MYSQL_PASSWORD $DB_NAME > "$BACKUP_DIR/mysql_$DATE.sql"
    echo "MySQL backup created: mysql_$DATE.sql"
fi

# Удаление старых бэкапов (старше 30 дней)
find $BACKUP_DIR -name "*.sqlite" -mtime +30 -delete
find $BACKUP_DIR -name "*.sql" -mtime +30 -delete

echo "Backup completed: $DATE"
```

### 2. Бэкап файлов приложения:

```bash
#!/bin/bash
# backup-files.sh

BACKUP_DIR="/var/backups/wekey-tools"
DATE=$(date +"%Y%m%d_%H%M%S")
APP_DIR="/var/www/wekey-tools"

# Создание архива приложения
tar -czf "$BACKUP_DIR/app_$DATE.tar.gz" \
    --exclude="node_modules" \
    --exclude="dist" \
    --exclude="logs" \
    --exclude="database.sqlite" \
    $APP_DIR

echo "Application backup created: app_$DATE.tar.gz"
```

## 🚀 Обновление приложения

### 1. Процедура обновления:

```bash
#!/bin/bash
# update-application.sh

echo "🚀 Начало обновления Wekey Tools..."

# Создание бэкапа
echo "📦 Создание бэкапа..."
./backup-database.sh
./backup-files.sh

# Получение обновлений
echo "⬇️ Загрузка обновлений..."
git fetch origin
git checkout main
git pull origin main

# Обновление зависимостей Backend
echo "🔧 Обновление Backend..."
cd backend
npm ci --production

# Миграции базы данных
npm run migrate

# Сборка Frontend
echo "🎨 Сборка Frontend..."
cd ../frontend
npm ci
npm run build

# Перезапуск PM2
echo "🔄 Перезапуск приложения..."
pm2 reload wekey-tools-backend

# Проверка здоровья
echo "🏥 Проверка работоспособности..."
sleep 5
node ../backend/src/scripts/health-check.js

echo "✅ Обновление завершено!"
```

## 📈 Мониторинг производительности

### 1. Настройка New Relic (опционально):

```bash
# Установка агента
cd backend
npm install newrelic

# Создание конфигурации
cp node_modules/newrelic/newrelic.js ./newrelic.js
```

### 2. Базовый мониторинг ресурсов:

```bash
# Создание скрипта мониторинга
cat > /var/www/wekey-tools/monitor.sh << 'EOF'
#!/bin/bash

echo "=== System Resources ==="
echo "CPU Usage:"
top -bn1 | grep "Cpu(s)" | awk '{print $2 + $4"%"}'

echo "Memory Usage:"
free -m | awk 'NR==2{printf "%.2f%%\n", $3*100/$2}'

echo "Disk Usage:"
df -h | awk '$NF=="/"{printf "%s\n", $5}'

echo "=== Application Status ==="
pm2 status wekey-tools-backend

echo "=== Database Connections ==="
ss -tuln | grep :3306 || echo "MySQL not detected"
ls -la backend/database.sqlite 2>/dev/null || echo "SQLite not found"

echo "=== Recent Errors ==="
tail -n 10 backend/logs/err.log 2>/dev/null || echo "No error logs"
EOF

chmod +x /var/www/wekey-tools/monitor.sh
```

## ❗ Устранение неполадок

### Типичные проблемы и решения:

#### 1. Backend не запускается:
```bash
# Проверка логов
pm2 logs wekey-tools-backend

# Проверка занятости порта
netstat -tulpn | grep :8880

# Ручной запуск для отладки
cd backend
NODE_ENV=production node src/app.js
```

#### 2. Ошибки базы данных:
```bash
# Проверка подключения к MySQL
mysql -u wekey_user -p wekey_tools

# Восстановление из бэкапа
mysql -u wekey_user -p wekey_tools < /var/backups/wekey-tools/mysql_latest.sql
```

#### 3. Проблемы с SSL:
```bash
# Проверка сертификата
openssl x509 -in /etc/letsencrypt/live/yourdomain.com/cert.pem -text -noout

# Обновление сертификата
sudo certbot renew --dry-run
```

#### 4. Фримиум система не работает:
```bash
# Проверка JWT токена
curl -H "Authorization: Bearer YOUR_TOKEN" https://yourdomain.com/api/auth/validate

# Проверка статистики инструментов
curl https://yourdomain.com/api/stats/tools
```

## 📋 Чек-лист развертывания

### Перед развертыванием:
- [ ] Обновлен JWT_SECRET в .env
- [ ] Настроены правильные URL в конфигурации
- [ ] Проведены все тесты
- [ ] Создан бэкап текущей системы
- [ ] Проверены требования к системе

### После развертывания:
- [ ] Проверен статус здоровья API
- [ ] Протестирована регистрация/авторизация
- [ ] Проверена работа всех 24 инструментов
- [ ] Протестирована фримиум блокировка
- [ ] Настроен мониторинг и алерты
- [ ] Создан первый бэкап
- [ ] Документированы пароли и ключи

---

## 🎯 Заключение

Данное руководство обеспечивает полное развертывание платформы Wekey Tools с интегрированной фримиум-системой. Следование всем шагам гарантирует стабильную и безопасную работу приложения в продакшн среде.

**Для получения поддержки**: создайте issue в репозитории или обратитесь к документации API.

**Версия руководства**: freemium_complete_1.1  
**Дата обновления**: 22.09.2025