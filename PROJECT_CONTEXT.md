# WEKEY TOOLS - Контекст проекта для ИИ-ассистента

## 🎯 ОБЗОР ПРОЕКТА
**Wekey Tools** - коллекция SEO/маркетинговых инструментов на React 19 + TypeScript + Vite
- **Домен**: https://wekey.tools (хостинг adm.tools)
- **Репозиторий**: wekey_tools (Owner: Tishakov, branch: main)
- **Структура**: Single Page Application с инструментами для работы с текстом

## 🏗️ АРХИТЕКТУРА И ТЕХНОЛОГИИ

### Основной стек:
- **React 19** + **TypeScript** + **Vite** (сборка)
- **React Router** для навигации между инструментами
- **CSS Modules** для стилизации (НЕ используем CSS-in-JS)
- **XLSX библиотека** для экспорта в Excel (Analytics Tool)

### Структура проекта:
```
src/
├── components/          # Общие компоненты (Header, Sidebar, Layout)
├── pages/              # Страницы инструментов (каждый инструмент = отдельная страница)
├── styles/             # Общие стили и шрифты
├── utils/              # Утилиты и сервисы (statsService)
└── assets/             # Статические ресурсы

public/
├── icons/              # SVG иконки инструментов
└── fonts/              # Шрифты Gilroy
```

## 🛠️ АЛГОРИТМ СОЗДАНИЯ НОВОГО ИНСТРУМЕНТА

### ШАГ 1: Структура компонента
1. **Создать файл** `src/pages/НазваниеTool.tsx`
2. **Обязательные импорты**:
   ```tsx
   import React, { useState, useEffect } from 'react';
   import { Link } from 'react-router-dom';
   import { statsService } from '../utils/statsService';
   import './НазваниеTool.css';
   ```
3. **Базовые состояния**:
   ```tsx
   const [inputText, setInputText] = useState('');
   const [result, setResult] = useState('');
   const [copied, setCopied] = useState(false);
   const [launchCount, setLaunchCount] = useState(0);
   // + специфичные для инструмента состояния
   ```

### ШАГ 2: Layout компонента (СТРОГО сверху вниз)
```tsx
<div className="tool-container">
  {/* 1. ШАПКА ИНСТРУМЕНТА */}
  <div className="tool-header-island">
    <Link to="/" className="back-button">← Все инструменты</Link>
    <h1>Название инструмента</h1>
    <div className="header-icons">
      <span className="launch-count">{launchCount}</span>
      <button className="icon-button"><img src="/icons/lamp.svg" /></button>
      <button className="icon-button"><img src="/icons/camera.svg" /></button>
    </div>
  </div>

  {/* 2. РАБОЧАЯ ОБЛАСТЬ 50/50 */}
  <div className="main-workspace">
    <div className="input-section">
      <textarea value={inputText} onChange={...} />
      <div className="input-controls">
        <button onClick={handlePaste}>📋 Вставить</button>
        <span className="line-count">{inputText.split('\n').length} строк</span>
      </div>
    </div>
    <div className="settings-section">
      <div className="settings-group">
        <h3>Настройки</h3>
        {/* Чекбоксы/радио-кнопки/настройки */}
      </div>
    </div>
  </div>

  {/* 3. КНОПКИ УПРАВЛЕНИЯ */}
  <div className="control-buttons">
    <button className="primary-button" onClick={handleShowResult}>
      Показать результат
    </button>
    <button className="secondary-button" onClick={handleCopy}>
      <img src="/icons/button_copy.svg" />
      Скопировать результат
    </button>
  </div>

  {/* 4. ПОЛЕ РЕЗУЛЬТАТА */}
  <div className="result-section">
    <textarea value={result} readOnly />
    <span className="line-count">{result.split('\n').length} строк</span>
  </div>
</div>
```

### ШАГ 3: Обязательные функции
```tsx
// Загрузка статистики
useEffect(() => {
  setLaunchCount(statsService.getLaunchCount('tool-name'));
}, []);

// Вставка из буфера
const handlePaste = async () => {
  const text = await navigator.clipboard.readText();
  setInputText(text);
};

// Основная логика + статистика
const handleShowResult = () => {
  // Логика обработки inputText
  setResult(processedText);
  statsService.incrementLaunchCount('tool-name');
  setLaunchCount(prev => prev + 1);
};

// Копирование результата
const handleCopy = async () => {
  await navigator.clipboard.writeText(result);
  setCopied(true);
  setTimeout(() => setCopied(false), 2000);
};

// Очистка результата при изменениях
useEffect(() => {
  setResult('');
}, [inputText, /* состояния настроек */]);
```

### ШАГ 4: CSS файл (минимальный)
```css
/* Создать src/pages/НазваниеTool.css */
/* Добавлять ТОЛЬКО специфичные стили */
/* НЕ использовать @import */
/* Базовые стили уже есть в tool-pages.css */

.специфичный-класс {
  /* Уникальная стилизация только если нужно */
}
```

### ШАГ 5: Интеграция в проект
1. **App.tsx** - добавить импорт и роут:
   ```tsx
   import НазваниеTool from './pages/НазваниеTool';
   
   <Route path="/tool-name" element={<НазваниеTool />} />
   ```

2. **toolsConfig.ts** - добавить конфигурацию:
   ```tsx
   {
     id: 'tool-name',
     title: 'Название инструмента',
     description: 'Описание что делает',
     icon: '/icons/tool_название.svg',
     path: '/tool-name'
   }
   ```

## 🎨 ДИЗАЙН-СИСТЕМА И UX

### Цветовая схема (темная тема):
- **Фон**: `#1E1E1E` (основной), `#252526` (поля ввода)
- **Границы**: `#333335` (основные), `#404040` (светлее)
- **Текст**: `#FFFFFF` (основной), `#BCBBBD` (вторичный)
- **Акценты**: `#0E7490` (синий), `#FFC107` (желтый)

### Кастомные курсоры:
- **Readonly элементы**: `cursor: url('/icons/lock.svg') 12 12, not-allowed`
- **lock.svg**: 24x24px с круглой подложкой #28282A без обводки

### Шрифты:
- **Основной**: Gilroy (Regular, Medium, Bold)
- **Загрузка**: `@font-face` в `src/styles/fonts.css`

### Адаптивность:
- **Desktop-first** подход
- **Минимальная ширина**: 1200px для комфортной работы
- **Мобильная версия**: упрощенный layout без сайдбара

## 🔧 СПЕЦИАЛЬНЫЕ ИНСТРУМЕНТЫ

### Analytics Tool (продвинутый):
- **Версия**: 2.1 (тег: analytics_2.1_done)
- **Особенности**: Excel экспорт, слайдеры, readonly поля
- **Библиотека**: XLSX для экспорта
- **Файл экспорта**: `analytics_result_wekey_tools_{дата}_{время}.xlsx`

### Стандартные инструменты:
- Работа с текстом (сортировка, дубликаты, регистр)
- SEO инструменты (UTM метки, минус-слова)
- Утилиты (поиск/замена, конвертация)

## 🚀 ДЕПЛОЙ И ХОСТИНГ

### Процесс обновления:
1. **Разработка** → `npm run dev` (localhost:5173)
2. **Сборка** → `npm run build` (создает папку `dist/`)
3. **Деплой** → загрузка содержимого `dist/` на adm.tools
4. **Домен**: https://wekey.tools

### Файлы .htaccess:
```apache
Options +SymLinksIfOwnerMatch
RewriteEngine On
RewriteBase /
RewriteRule ^index\.html$ - [L]
RewriteCond %{REQUEST_FILENAME} !-f
RewriteCond %{REQUEST_FILENAME} !-d
RewriteRule . /index.html [L]
```

## 📊 СТАТИСТИКА И АНАЛИТИКА

### statsService.ts:
- **Хранение**: localStorage
- **Методы**: `getLaunchCount()`, `incrementLaunchCount()`
- **Формат**: `tool-launches-{toolName}`

### Счетчики:
- Показываются в шапке каждого инструмента
- Обновляются при каждом "Показать результат"
- Сохраняются между сессиями

## 🔑 КЛЮЧЕВЫЕ ПРАВИЛА И НЮАНСЫ

### ❌ НЕ ДЕЛАТЬ:
- НЕ ставить кнопки внутри `.settings-group`
- НЕ использовать `@import` в CSS файлах
- НЕ забывать добавлять статистику запусков
- НЕ нарушать порядок элементов (шапка→рабочая область→кнопки→результат)

### ✅ ОБЯЗАТЕЛЬНО:
- Использовать правильные CSS классы из `tool-pages.css`
- Добавлять `Link` компонент для навигации "← Все инструменты"
- Включать счетчики строк в полях ввода и результата
- Очищать результат при изменении входных данных
- Обновлять `toolsConfig.ts` и `App.tsx` для новых инструментов

### 🎯 Пропорции и размеры:
- **Рабочая область**: 50% поле ввода + 50% настройки
- **Кнопки**: фиксированная ширина 445px каждая
- **Отступы**: следовать существующей сетке из tool-pages.css

## 📝 КОММИТЫ И ТЕГИ

### Соглашения о коммитах:
```
feat: краткое описание новой функции
fix: исправление бага
style: изменения стилей/UI
refactor: рефакторинг кода
```

### Теги версий:
- `analytics_X.X_done` - для Analytics Tool
- `tool-name_done` - для других инструментов
- `main_page` - изменения главной страницы

## 🎪 ГОТОВЫЕ ИНСТРУМЕНТЫ (для референса):
- **AnalyticsTool.tsx** - самый продвинутый (слайдеры, экспорт)
- **CaseChangerTool.tsx** - стандартный с радио-кнопками
- **DuplicateRemovalTool.tsx** - с чекбоксами
- **MinusWordsTool.tsx** - базовый text-processing

**Используй эти файлы как референс для понимания паттернов и стилей!**

---
*Этот документ содержит всю необходимую информацию для продолжения разработки проекта Wekey Tools. Обновляй его при добавлении новых инструментов или изменении архитектуры.*