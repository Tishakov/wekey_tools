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
- **ExcelJS библиотека** для экспорта в Excel с формулами (Analytics Tool)
- **Backdrop-filter** для современных модальных окон

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

### Современные модальные окна:
- **Backdrop blur**: `backdrop-filter: blur(4px)` для фокуса
- **Анимации**: плавные opacity переходы (300ms ease-out)
- **UX**: click-outside-to-close, ESC для закрытия
- **CSS**: `.modal-overlay` и `.modal-content` классы

### Шрифты:
- **Основной**: Gilroy (Regular, Medium, Bold)
- **Загрузка**: `@font-face` в `src/styles/fonts.css`

### Адаптивность:
- **Desktop-first** подход
- **Минимальная ширина**: 1200px для комфортной работы
- **Мобильная версия**: упрощенный layout без сайдбара

## 🔧 СПЕЦИАЛЬНЫЕ ИНСТРУМЕНТЫ

### Analytics Tool (продвинутый):
- **Версия**: 2.3 (тег: analytics_popup_done)
- **Особенности**: Excel экспорт с ФОРМУЛАМИ (не статичные значения!), слайдеры x1-x20, readonly поля, модальные окна с анимациями
- **Библиотека**: ExcelJS для экспорта с динамическими формулами
- **Модальные окна**: backdrop-filter blur, click-outside-to-close, плавные анимации
- **Файл экспорта**: `analytics_result_wekey_tools_{дата}_{время}.xlsx`
- **Ключевая особенность**: Excel содержит ФОРМУЛЫ (getExcelFormula функция), не статичные значения!

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
- НЕ делать резких анимаций в модальных окнах (пользователи не любят)
- НЕ забывать про ExcelJS ФОРМУЛЫ в Analytics Tool (не статичные значения!)

### ✅ ОБЯЗАТЕЛЬНО:
- Использовать правильные CSS классы из `tool-pages.css`
- Добавлять `Link` компонент для навигации "← Все инструменты"
- Включать счетчики строк в полях ввода и результата
- Очищать результат при изменении входных данных
- Обновлять `toolsConfig.ts` и `App.tsx` для новых инструментов
- В модальных окнах: backdrop-filter blur, click-outside-to-close
- В Analytics Tool: всегда использовать формулы, не статичные значения

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
- `analytics_2.3_done` / `analytics_popup_done` - для Analytics Tool v2.3 с модальными окнами
- `tool-name_done` - для других инструментов
- `main_page` - изменения главной страницы

### Git workflow:
```bash
# После разработки фичи
git add .
git commit -m "feat: описание изменений"
git tag -a tag_name -m "Detailed description"

# Для деплоя
npm run build
# Загрузить dist/ на хостинг
```

## 🎪 ГОТОВЫЕ ИНСТРУМЕНТЫ (для референса):
- **AnalyticsTool.tsx** - самый продвинутый (слайдеры, экспорт, модальные окна)
- **CaseChangerTool.tsx** - стандартный с радио-кнопками
- **DuplicateRemovalTool.tsx** - с чекбоксами
- **MinusWordsTool.tsx** - базовый text-processing

**Используй эти файлы как референс для понимания паттернов и стилей!**

## 🧩 КОНКРЕТНЫЕ ПАТТЕРНЫ КОДА

### ExcelJS с формулами (Analytics Tool):
```tsx
// ВАЖНО: Используем ExcelJS, НЕ XLSX!
import * as ExcelJS from 'exceljs';

// Функция генерации формул для Excel
const getExcelFormula = (row: number, column: string, baseValue: number, scaleFactor: number) => {
  const scaleCell = '$H$2'; // Ячейка с коэффициентом масштабирования
  return `${baseValue}*${scaleCell}`;
};

// При экспорте в Excel - ТОЛЬКО формулы!
worksheet.getCell(`D${row}`).value = { formula: getExcelFormula(row, 'D', calculatedValue, scaleFactor) };
```

### Модальные окна с анимациями:
```tsx
// Состояния для модального окна
const [showModal, setShowModal] = useState(false);
const [isClosing, setIsClosing] = useState(false);

// Закрытие с анимацией
const closeModal = () => {
  setIsClosing(true);
  setTimeout(() => {
    setShowModal(false);
    setIsClosing(false);
  }, 300); // Время совпадает с CSS transition
};

// Click outside to close
const handleOverlayClick = (e: React.MouseEvent) => {
  if (e.target === e.currentTarget) {
    closeModal();
  }
};

// JSX модального окна
{showModal && (
  <div 
    className={`modal-overlay ${isClosing ? 'modal-closing' : ''}`}
    onClick={handleOverlayClick}
  >
    <div className="modal-content">
      <button className="modal-close" onClick={closeModal}>×</button>
      {/* Контент модального окна */}
    </div>
  </div>
)}
```

### CSS для модальных окон:
```css
.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.5);
  backdrop-filter: blur(4px);
  opacity: 1;
  transition: opacity 0.3s ease-out;
  z-index: 1000;
}

.modal-closing {
  opacity: 0;
}

.modal-content {
  background: #1E1E1E;
  border: 1px solid #333335;
  border-radius: 12px;
  padding: 24px;
  max-width: 600px;
  margin: 50px auto;
  position: relative;
}
```

### Слайдеры с масштабированием:
```tsx
// Состояние масштабирования
const [scaleFactor, setScaleFactor] = useState(1);

// Обработчик изменения слайдера
const handleScaleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
  setScaleFactor(parseInt(e.target.value));
};

// JSX слайдера
<div className="scale-controls">
  <label>Масштабирование: x{scaleFactor}</label>
  <input
    type="range"
    min="1"
    max="20"
    value={scaleFactor}
    onChange={handleScaleChange}
    className="scale-slider"
  />
</div>
```

### Паттерн работы с readonly полями:
```tsx
// Вычисляемые поля (readonly)
const totalBudget = campaigns.reduce((sum, campaign) => {
  return sum + (campaign.budget * scaleFactor);
}, 0);

// JSX readonly поля
<input
  type="text"
  value={totalBudget.toLocaleString('ru-RU')}
  readOnly
  className="readonly-field"
  style={{ cursor: 'url("/icons/lock.svg") 12 12, not-allowed' }}
/>
```

## 🔍 ДЕБАГ И ЧАСТЫЕ ПРОБЛЕМЫ

### Проблема: Excel экспорт не работает
**Решение**: Проверь, что используешь ExcelJS, не XLSX. Формулы должны быть строками с '=' в начале.

### Проблема: Модальное окно не закрывается плавно
**Решение**: Убедись, что время setTimeout совпадает с CSS transition (300ms).

### Проблема: Readonly поля редактируются
**Решение**: Добавь `readOnly` атрибут И кастомный курсор с lock.svg.

### Проблема: Слайдер не обновляет значения
**Решение**: Проверь, что scaleFactor используется в вычислениях и есть useEffect для очистки результата.

## 🎨 ГОТОВЫЕ CSS КЛАССЫ (tool-pages.css)

Основные классы, которые уже настроены:
- `.tool-container` - основной контейнер
- `.tool-header-island` - шапка инструмента
- `.main-workspace` - рабочая область 50/50
- `.settings-group` - группа настроек
- `.control-buttons` - контейнер кнопок
- `.primary-button` / `.secondary-button` - стили кнопок
- `.result-section` - область результата
- `.readonly-field` - поля только для чтения
- `.modal-overlay` / `.modal-content` - модальные окна

**НЕ ПЕРЕОПРЕДЕЛЯЙ** эти классы в отдельных CSS файлах!

## 🎨 МЕХАНИКА ВЫДЕЛЕНИЯ ГОТОВЫХ ИНСТРУМЕНТОВ В САЙДБАРЕ

### ⚠️ ВАЖНО ДЛЯ ИИ-АССИСТЕНТА!
Когда пользователь просит "сделать название инструмента зеленым в сайдбаре" - это означает:

1. **НЕ трогать** файлы `Card.tsx` и `Card.css` (это для главной страницы!)
2. **РАБОТАТЬ ТОЛЬКО** с файлом `Sidebar.tsx`
3. **ДОБАВИТЬ** id инструмента в массив `completedTools`

### Как это работает:
```tsx
// В src/components/Sidebar.tsx уже есть готовая механика:
const completedTools = [
  'case-changer',           // Изменения регистра
  'remove-duplicates',      // Удаление дубликатов  
  'text-to-html',          // Текст в HTML
  // ... остальные готовые инструменты
  'find-replace'           // ← Добавить сюда новый инструмент
];

// CSS уже готов в Sidebar.css:
.sidebar-link.completed {
  color: #09CEA7;  /* Зеленый цвет */
  font-weight: 500;
}
```

### Пример правильного добавления:
```tsx
// ПРАВИЛЬНО - просто добавить в массив:
const completedTools = [
  // ... существующие
  'новый-инструмент'  // ← ID из toolsConfig
];

// НЕПРАВИЛЬНО - не нужно трогать Card.tsx!
```

---
*Этот документ содержит всю необходимую информацию для продолжения разработки проекта Wekey Tools. Обновляй его при добавлении новых инструментов или изменении архитектуры.*

## 📈 ТЕКУЩЕЕ СОСТОЯНИЕ ПРОЕКТА (сентябрь 2025)

### Последние релизы:
- **analytics_popup_done** (последний) - Analytics Tool 2.3 с модальными окнами и анимациями
- **analytics_2.3_done** - Analytics Tool с ExcelJS формулами
- **translit_done_1.1** - Инструмент транслитерации  
- **text_to_html_done** - Конвертация текста в HTML

### Готовность к деплою:
- ✅ Production build готов (`npm run build`)
- ✅ Dist папка с оптимизированными ассетами
- ✅ .htaccess для корректной маршрутизации
- ✅ Все анимации и модальные окна протестированы

### Следующие задачи (примеры):
- Новые SEO инструменты
- Улучшение UX существующих инструментов  
- Оптимизация производительности
- Добавление новых экспорт-форматов

**Проект стабилен и готов к расширению!**