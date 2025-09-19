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
   import '../styles/tool-pages.css';
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
<div className="название-tool">
  {/* 1. ШАПКА ИНСТРУМЕНТА */}
  <div className="tool-header-island">
    <Link to="/" className="back-button">
      <img src="/icons/arrow_left.svg" alt="" />
      Все инструменты
    </Link>
    <h1 className="tool-title">Название инструмента</h1>
    <div className="tool-header-buttons">
      <button className="tool-header-btn counter-btn" title="Счетчик запусков">
        <img src="/icons/rocket.svg" alt="" />
        <span className="counter">{launchCount}</span>
      </button>
      <button className="tool-header-btn" title="Подсказка">
        <img src="/icons/lamp.svg" alt="" />
      </button>
      <button className="tool-header-btn" title="Сделать скриншот">
        <img src="/icons/camera.svg" alt="" />
      </button>
    </div>
  </div>

  {/* 2. РАБОЧАЯ ОБЛАСТЬ 50/50 */}
  <div className="main-workspace">
    <div className="input-section">
      <textarea
        className="input-textarea"
        value={inputText}
        onChange={(e) => setInputText(e.target.value)}
        placeholder="Введите или вставьте ваш текст здесь..."
      />
      <div className="input-controls">
        <button className="paste-button" onClick={handlePaste}>
          <img src="/icons/button_paste.svg" alt="" />
          Вставить
        </button>
        <span className="char-counter">{countLines(inputText)} стр.</span>
      </div>
    </div>
    <div className="settings-section">
      <div className="settings-group">
        {/* Чекбоксы/радио-кнопки/настройки/поля фильтрации */}
      </div>
    </div>
  </div>

  {/* 3. КНОПКИ УПРАВЛЕНИЯ */}
  <div className="control-buttons">
    <button 
      className="action-btn primary" 
      style={{ width: '445px' }} 
      onClick={handleShowResult}
      disabled={!inputText.trim()}
    >
      Показать результат
    </button>
    <button 
      className="action-btn secondary icon-left" 
      style={{ width: '445px' }} 
      onClick={handleCopy}
      disabled={!result}
    >
      <img src="/icons/button_copy.svg" alt="" />
      {copied ? 'Скопировано!' : 'Скопировать результат'}
    </button>
  </div>

  {/* 4. ПОЛЕ РЕЗУЛЬТАТА */}
  <div className="result-section">
    <textarea
      className="result-textarea"
      value={result}
      readOnly
      placeholder="Здесь будет результат"
    />
    <div className="result-controls">
      <span className="result-counter">{countLines(result)} стр.</span>
    </div>
  </div>
</div>
```

### ШАГ 3: Обязательные функции
```tsx
// Загрузка статистики
useEffect(() => {
  const count = statsService.getLaunchCount('tool-name');
  setLaunchCount(count);
}, []);

// Вставка из буфера
const handlePaste = async () => {
  try {
    const text = await navigator.clipboard.readText();
    setInputText(text);
  } catch (err) {
    console.error('Не удалось вставить текст:', err);
  }
};

// Основная логика + статистика
const handleShowResult = () => {
  const processedText = processText(inputText);
  setResult(processedText);
  statsService.incrementLaunchCount('tool-name');
  setLaunchCount(prev => prev + 1);
};

// Копирование результата
const handleCopy = async () => {
  if (result) {
    try {
      await navigator.clipboard.writeText(result);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Не удалось скопировать текст:', err);
    }
  }
};

// Подсчет строк
const countLines = (text: string): number => {
  if (text === '') return 0;
  return text.split('\n').length;
};

// Очистка результата при изменениях
useEffect(() => {
  setResult('');
  setCopied(false);
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

   **⚠️ ВАЖНО:** Перед добавлением проверь, что `id` и `path` уникальны! Дубликаты в toolsConfig приводят к двойным записям в сайдбаре.

3. **Sidebar.tsx** - добавить в массив `completedTools`:
   ```tsx
   const completedTools = [
     // ... существующие
     'tool-name'  // ← ID из toolsConfig для зеленого цвета
   ];
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

## 🎯 СПЕЦИАЛЬНЫЕ ЭЛЕМЕНТЫ ИНТЕРФЕЙСА

### 🔍 Поля фильтрации (.filter-input)
Для инструментов с многострочным вводом настроек используются специальные поля:

```tsx
// Состояние для автоматического изменения высоты
const handleTextareaResize = (element: HTMLTextAreaElement) => {
  element.style.height = '50px'; // Возвращаем к минимальной высоте
  element.style.height = element.scrollHeight + 'px'; // Устанавливаем точную высоту содержимого
};

// JSX для поля фильтрации
<textarea
  className="filter-input"
  value={searchText}
  onChange={(e) => {
    setSearchText(e.target.value);
    handleTextareaResize(e.target);
  }}
  placeholder="Что заменить... (несколько с новой строки)"
/>
```

**⚠️ ВАЖНО:** НЕ используй HTML атрибут `rows` - он ломает автоматическое изменение высоты!

### CSS для .filter-input:
```css
/* В tool-pages.css уже есть базовые стили */
/* Для специфичных инструментов добавляй с префиксом: */
.инструмент-tool .filter-input {
  width: 100% !important;
  min-height: 50px !important;
  padding: 15px 10px 10px 14px !important;
  background-color: #1C1D1F;
  border: 1px solid #333335;
  border-radius: 8px;
  resize: none !important;
  overflow: hidden !important;
  font-size: 14px !important;
  line-height: 1.4 !important;
}
```

### 🎨 Визуальные состояния полей
```tsx
// Визуально отключенное поле
const [isDisabled, setIsDisabled] = useState(false);

<textarea
  className={`filter-input ${isDisabled ? 'visual-disabled' : ''}`}
  value={text}
  onChange={(e) => {
    if (!isDisabled) {
      setText(e.target.value);
      handleTextareaResize(e.target);
    }
  }}
  onClick={() => {
    if (isDisabled) {
      setIsDisabled(false); // Активировать поле при клике
    }
  }}
/>
```

### CSS для visual-disabled:
```css
.инструмент-tool .filter-input.visual-disabled {
  opacity: 0.5;
  background-color: #2a2b2d !important;
  color: #6b7280 !important;
  border-color: #404244 !important;
}
```

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
- НЕ создавать дубликаты в `toolsConfig.ts` - всегда проверяй уникальность `id` и `path`

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

### ❌ CSS проблемы с полями фильтрации:
**Проблема**: Поля .filter-input не автоматически изменяют высоту
**Решение**: 
1. НЕ используй HTML атрибут `rows` 
2. Используй функцию `handleTextareaResize`
3. Добавь CSS специфичность с префиксом инструмента: `.инструмент-tool .filter-input`

### ❌ Неправильные CSS классы кнопок:
**Проблема**: Кнопка "Вставить" выглядит не так, как в других инструментах
**Решение**: Используй класс `paste-button`, НЕ `paste-btn`

### ❌ Проблемы с логикой замены текста:
**Проблема**: Остаются лишние пробелы при замене "на пустоту" или "на абзац"
**Решение**: Добавь постобработку текста:
```tsx
// Для режима "пустота"
if (replaceMode === 'empty') {
  processedText = processedText.replace(/\s+/g, ' '); // Убираем множественные пробелы
  processedText = processedText.replace(/^\s+|\s+$/gm, ''); // Убираем пробелы в начале/конце строк
  processedText = processedText.replace(/^\s*$/gm, '').replace(/\n+/g, '\n'); // Убираем пустые строки
}

// Для режима "абзац"
if (replaceMode === 'paragraph') {
  processedText = processedText.replace(/\s+\n\n/g, '\n\n'); // Убираем пробелы перед абзацами
  processedText = processedText.replace(/\n\n\s+/g, '\n\n'); // Убираем пробелы после абзацев
  processedText = processedText.replace(/\n{3,}/g, '\n\n'); // Максимум 2 перевода строки
}
```

### Проблема: Excel экспорт не работает
**Решение**: Проверь, что используешь ExcelJS, не XLSX. Формулы должны быть строками с '=' в начале.

### Проблема: Модальное окно не закрывается плавно
**Решение**: Убедись, что время setTimeout совпадает с CSS transition (300ms).

### Проблема: Readonly поля редактируются
**Решение**: Добавь `readOnly` атрибут И кастомный курсор с lock.svg.

### Проблема: Слайдер не обновляет значения
**Решение**: Проверь, что scaleFactor используется в вычислениях и есть useEffect для очистки результата.

### Проблема: Дублирование инструментов в сайдбаре
**Проблема**: В сайдбаре отображается два одинаковых инструмента
**Решение**: Проверь `toolsConfig.ts` на дубликаты. Каждый `id` и `path` должен быть уникальным:
```bash
# Поиск дубликатов в toolsConfig
grep -n "id: 'tool-name'" src/utils/toolsConfig.ts
grep -n "path: '/tool-path'" src/utils/toolsConfig.ts
```
**Причина**: При добавлении нового инструмента случайно создался дубликат в массиве toolsConfig.

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

### Готовые инструменты (список для completedTools):
```tsx
const completedTools = [
  'case-changer',           // Изменения регистра
  'remove-duplicates',      // Удаление дубликатов  
  'text-to-html',          // Текст в HTML
  'text-optimizer',        // Оптимизатор текста
  'spaces-to-paragraphs',  // Пробелы на абзацы
  'text-sorting',          // Сортировка слов и строк
  'remove-empty-lines',    // Удаление пустых строк
  'transliteration',       // Транслитерация
  'minus-words',           // Обработка минус-слов
  'utm-generator',         // Генератор UTM-меток
  'cross-analytics',       // Сквозная аналитика
  'word-gluing',           // Склейка слов
  'find-replace',          // Найти и заменить
  'text-generator'         // Генератор текста с AI (НОВЫЙ!)
];
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

### 🤖 ИКОНКИ ИИ В САЙДБАРЕ

Инструменты с ИИ интеграцией отмечаются иконкой `ai_star.svg` рядом с названием:

```tsx
// Список инструментов с ИИ интеграцией
const aiTools = [
  'synonym-generator',     // Генератор синонимов
  'text-generator',        // Генератор текста  
  'cross-analytics',       // Сквозная аналитика
  'word-declension'        // Склонение слов
];
```

**Как добавить ИИ иконку:**
1. Добавить `id` инструмента в массив `aiTools` в `Sidebar.tsx`
2. Иконка автоматически появится рядом с названием
3. Tooltip: "Инструмент с ИИ интеграцией"

**CSS стили:**
- `.ai-icon` - размер 12x12px, opacity 0.8
- Hover эффект - opacity становится 1.0
- Gap 6px между текстом и иконкой
- Flexbox layout для правильного позиционирования

---
*Этот документ содержит всю необходимую информацию для продолжения разработки проекта Wekey Tools. Обновляй его при добавлении новых инструментов или изменении архитектуры.*

## 📈 ТЕКУЩЕЕ СОСТОЯНИЕ ПРОЕКТА (сентябрь 2025)

### Последние релизы:
- **generator_text_ai_1.1** (НОВЕЙШИЙ) - Генератор текста с полной GPT-4 интеграцией, продвинутой post-processing системой, умным UX
- **find_replace_done_1.2** - Инструмент "Найти и заменить" v1.2 с многострочным поиском, визуальными состояниями и корректной обработкой пробелов
- **analytics_popup_done** - Analytics Tool 2.3 с модальными окнами и анимациями
- **analytics_2.3_done** - Analytics Tool с ExcelJS формулами
- **translit_done_1.1** - Инструмент транслитерации  
- **text_to_html_done** - Конвертация текста в HTML

### 🤖 AI ИНТЕГРАЦИЯ (НОВОЕ!)

#### TextGeneratorTool.tsx - Продвинутый AI инструмент
**Версия**: 1.1 (тег: generator_text_ai_1.1)  
**Технологии**: GPT-4 ChatGPT API + продвинутая post-processing система

**🧠 Гибридный подход AI + алгоритмы:**
1. **AI генерация** - GPT-4 создает качественный контент
2. **Post-processing** - алгоритмы обеспечивают точную длину
3. **Нормализация** - исправление форматирования автоматически

**🔧 Технические особенности:**
```typescript
// Структура OpenAI сервиса
src/services/openaiService.ts
- generateText() - основной метод генерации
- trimTextToLength() / trimTextToWords() - обрезка лишнего
- extendText() - дополнение недостающего
- normalizeText() - исправление форматирования
- createTextGenerationPrompt() - умные промпты
```

**⚙️ API интеграция:**
```typescript
// Подключение OpenAI API
import OpenAI from 'openai';

// Инициализация клиента
const client = new OpenAI({
  apiKey: process.env.REACT_APP_OPENAI_API_KEY!,
  dangerouslyAllowBrowser: true
});

// Генерация с post-processing
const response = await client.chat.completions.create({
  model: 'gpt-4o',
  messages: [{ role: 'user', content: prompt }],
  max_tokens: Math.min(Math.ceil(targetCount * 1.5), 2000),
  temperature: 0.7
});
```

**🎯 Умная система ограничений:**
- **Символы**: 10-5000 (динамические лимиты)
- **Слова**: 3-500 (реалистичные ограничения)
- **Абзацы**: 1-10 с логическим расчетом максимума
- **Пороговые значения**: 250+ слов = полные 10 абзацев

**💡 UX инновации:**
```typescript
// Ручной ввод с валидацией onBlur/Enter
<input
  type="number"
  defaultValue={value}
  onBlur={(e) => {
    const clampedValue = Math.min(Math.max(parseInt(e.target.value) || 0, min), max);
    e.target.value = clampedValue.toString();
    setValue(clampedValue);
  }}
  onKeyDown={(e) => {
    if (e.key === 'Enter') {
      e.currentTarget.blur(); // Trigger onBlur
    }
  }}
/>
```

**🔄 Логика post-processing:**
```typescript
// Стратегия обработки текста
if (resultLength > targetCount) {
  // Обрезаем лишнее с сохранением структуры
  result = trimTextToLength(result, targetCount, targetParagraphs);
} else if (resultLength < targetCount * 0.8) {
  // Дополняем недостающее через AI
  result = await extendText(result, targetCount, targetParagraphs, language, countMode);
}

// Финальная нормализация
return normalizeText(result);
```

**🎨 Специальные UI элементы:**
- Комбинированные slider + input контролы
- Динамические лимиты абзацев
- Автоматическая синхронизация полей
- Улучшенный resize handle для textarea

**📝 Промпт-инжиниринг:**
```typescript
// Коэффициент 1.2 для компенсации недогенерации GPT
const prompt = `
Сгенерируй текст на ${language} языке примерно ${Math.round(targetCount * 1.2)} ${countType}.

ТРЕБОВАНИЯ:
- Примерно ${Math.round(targetCount * 1.2)} ${countType} (можно немного больше)
- ${paragraphCount} абзац${paragraphCount === 1 ? '' : 'ев'}
- Каждый абзац: примерно ${Math.round((targetCount * 1.2) / paragraphCount)} ${countType}

СТИЛЬ:
- Информативный, деловой стиль
- Связный осмысленный текст
- БЕЗ заголовков, списков, специального форматирования
- БЕЗ длинных тире, используй дефисы
- Двойной перенос между абзацами

Тема: бизнес, технологии, маркетинг.
`;
```

**🔐 Переменные окружения:**
```bash
# .env файл (НЕ коммитить!)
REACT_APP_OPENAI_API_KEY=sk-...your-key...
```

**⚠️ ВАЖНЫЕ НЮАНСЫ AI ИНТЕГРАЦИИ:**

1. **Гибридный подход ОБЯЗАТЕЛЕН** - GPT не может точно считать символы/слова в реальном времени
2. **Коэффициент 1.2** - специально запрашиваем больше, чтобы потом обрезать до точной длины
3. **Post-processing критичен** - без него точность длины ~50-80%, с ним 99%+
4. **Нормализация текста** - обязательна для исправления форматирования GPT
5. **Промпт-инжиниринг** - четкие инструкции на тему, стиль, форматирование

## ⚠️ КРИТИЧЕСКИ ВАЖНО: ПРЕДОТВРАЩЕНИЕ ДУБЛЕЙ

### Проблема дублирования инструментов:
При создании нового инструмента **ОБЯЗАТЕЛЬНО** проверить существующую структуру проекта, чтобы не создавать дубликаты уже существующих заготовок.

### АЛГОРИТМ ПРОВЕРКИ ПЕРЕД СОЗДАНИЕМ ИНСТРУМЕНТА:

1. **Проверить существующие файлы в pages/**:
   ```bash
   # Поиск существующих инструментов
   ls src/pages/ | grep -i "название_инструмента"
   # Или поиск по ключевым словам
   find src/pages/ -name "*mixer*" -o -name "*mixing*"
   ```

2. **Проверить toolsConfig.ts**:
   ```bash
   # Поиск в конфигурации
   grep -i "mixing\|mixer" src/utils/toolsConfig.ts
   ```

3. **Проверить App.tsx маршруты**:
   ```bash
   # Поиск роутов
   grep -i "word-mixer\|word-mixing" src/App.tsx
   ```

### ПРИМЕР ПРОБЛЕМЫ (случай WordMixerTool):
- ❌ **Было создано**: `WordMixingTool.tsx` с URL `/word-mixing`
- ✅ **Уже существовало**: `WordMixerTool.tsx` (заготовка) с URL `/word-mixer`
- **Результат**: дублирование в сайдбаре, конфликты в конфигурации

### ПРАВИЛЬНЫЙ ПОДХОД:
1. **Найти существующую заготовку**: `WordMixerTool.tsx`
2. **Обновить существующий файл**, а не создавать новый
3. **Использовать правильный URL**: `/word-mixer` (из существующей заготовки)
4. **Проверить, что нет дублей в toolsConfig.ts и Sidebar.tsx**

### КОМАНДЫ ДЛЯ ПРОВЕРКИ ДУБЛЕЙ:
```bash
# Проверка дублей в toolsConfig
grep -n "id.*word-mixer" src/utils/toolsConfig.ts

# Проверка дублей в Sidebar
grep -n "word-mixer" src/components/Sidebar.tsx

# Поиск всех упоминаний инструмента
grep -r "word-mixer\|word-mixing" src/ --exclude-dir=node_modules
```

### Готовность к деплою:
- ✅ Production build готов (`npm run build`)
- ✅ Dist папка с оптимизированными ассетами
- ✅ .htaccess для корректной маршрутизации
- ✅ Все анимации и модальные окна протестированы
- ✅ AI генератор текста полностью готов и протестирован
- ✅ OpenAI API интеграция работает стабильно

### Следующие задачи (примеры):
- Интеграция AI в другие инструменты (генератор синонимов, оптимизатор текста)
- Добавление других AI моделей (Claude, Gemini)
- Расширение prompt-библиотеки для разных стилей текста
- AI-powered SEO инструменты
- Система персонализации промптов

**Проект стабилен и готов к расширению с AI возможностями!**

### 📋 ГОТОВЫЕ ИНСТРУМЕНТЫ С ПОЛНОЦЕННЫМ CONTROL-BUTTONS БЛОКОМ

#### CharCounterTool.tsx - Инструмент подсчета символов (НОВЫЙ!)
**Версия**: 1.0 (готов к тегированию: char_counter_done_1.0)  
**Функциональность**: Подсчет 8 видов статистики текста + система исключений

**🔢 8 типов счетчиков:**
- Символов (общее количество)
- Символов без пробелов
- Слов (разделенных пробелами)
- Чисел (целые числа)
- Цифр (отдельные цифры)
- Спецсимволов (все кроме букв, цифр, пробелов)
- Абзацев (разделенных переносами)
- Предложений (по точкам, восклицательным и вопросительным знакам)

**🎛️ Система исключений:**
- Структура как в TextByColumnsTool
- Два поля side-by-side с кнопкой переноса
- Автоматическая фильтрация исключений при подсчете
- Regex обработка для точного удаления слов

**🎨 Layout особенности:**
```tsx
// Горизонтальная компоновка 50/50
<div className="main-workspace">
  <div className="input-section">        // 50% - поле ввода текста
    <textarea className="input-textarea" />
    <div className="input-controls">
      <button className="paste-button" />
      <span className="char-counter" />   // Счетчик строк
    </div>
  </div>
  <div className="settings-section">     // 50% - настройки и статистика
    <div className="stats-group">        // padding: 30px
      <div className="stats-grid">       // Сетка 2x4 для 8 счетчиков
        {/* 8 stat-item блоков */}
      </div>
    </div>
    <div className="exceptions-block">   // Блок исключений
      {/* Два поля + кнопка переноса */}
    </div>
  </div>
</div>
```

**🎯 Control-buttons структура:**
```tsx
// СТАНДАРТНЫЙ блок под main-workspace
<div className="control-buttons">
  <button 
    className="action-btn primary" 
    style={{ width: '445px' }}        // Фиксированная ширина
    onClick={handleShowResult}
  >
    Показать результат
  </button>
  <button 
    className="action-btn secondary icon-left" 
    style={{ width: '445px' }}        // Одинаковая ширина
    onClick={handleCopyResult}
  >
    <img src="/icons/button_copy.svg" alt="" />
    Скопировать результат
  </button>
</div>
```

**💡 Функция копирования результатов:**
```tsx
const handleCopyResult = async () => {
  const resultsText = `Символов: ${stats.characters}
Символов без пробелов: ${stats.charactersNoSpaces}
Слов: ${stats.words}
Чисел: ${stats.numbers}
Цифр: ${stats.digits}
Спецсимволов: ${stats.specialChars}
Абзацев: ${stats.paragraphs}
Предложений: ${stats.sentences}`;

  try {
    await navigator.clipboard.writeText(resultsText);
  } catch (err) {
    console.error('Ошибка копирования:', err);
  }
};
```

**⚙️ Технические особенности:**
- **Ручной подсчет**: статистика обновляется только при нажатии "Показать результат"
- **Unicode поддержка**: корректная работа с кириллицей и спецсимволами
- **Regex обработка**: точные паттерны для разных типов подсчета
- **Стандартные стили**: использует action-btn классы из tool-pages.css
- **Адаптивность**: автоматическое поведение для мобильных устройств

**🔧 Интеграция в проект:**
- ✅ App.tsx - добавлен роут `/char-counter`
- ✅ toolsConfig.ts - конфигурация с иконкой tool_kolichestvo_simvolov.svg
- ✅ Sidebar.tsx - готов к добавлению в completedTools массив
- ✅ statsService - счетчик запусков настроен

**📋 CSS структура:**
```css
/* CharCounterTool.css - МИНИМАЛЬНЫЕ специфичные стили */
.char-counter-tool .main-workspace {
  display: flex;
  gap: 20px;
  align-items: stretch;           // Равная высота секций
}

.char-counter-tool .stats-group {
  padding: 30px;                  // Увеличенный padding
}

.char-counter-tool .stats-grid {
  display: grid;
  grid-template-columns: 1fr 1fr; // Сетка 2x4
  grid-template-rows: repeat(4, 1fr);
  gap: 15px;
}

/* Остальные стили наследуются из tool-pages.css */
```

**✅ ГОТОВ К ИСПОЛЬЗОВАНИЮ:**
- Полностью функциональный инструмент
- Стандартизирован с другими инструментами
- Использует общие CSS классы из дизайн-системы
- Кнопки control-buttons с правильной шириной 445px
- Готов к тегированию и деплою

### 🎪 ГОТОВЫЕ ИНСТРУМЕНТЫ (для референса):
- **TextGeneratorTool.tsx** - НОВЕЙШИЙ! AI-powered генератор с GPT-4 интеграцией, post-processing, умным UX
- **FindReplaceTool.tsx** - многострочный поиск/замена с визуальными состояниями (версия 1.2)
- **AnalyticsTool.tsx** - самый продвинутый (слайдеры, экспорт, модальные окна)
- **CaseChangerTool.tsx** - стандартный с радио-кнопками
- **DuplicateRemovalTool.tsx** - с чекбоксами
- **TextOptimizerTool.tsx** - образец правильного использования .paste-button
- **MinusWordsTool.tsx** - базовый text-processing

**Используй эти файлы как референс для понимания паттернов и стилей!**

---
*Этот документ содержит всю необходимую информацию для продолжения разработки проекта Wekey Tools. Обновляй его при добавлении новых инструментов или изменении архитектуры.*

**Используй эти файлы как референс для понимания паттернов и стилей!**