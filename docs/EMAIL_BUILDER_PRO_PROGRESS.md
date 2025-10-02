# 📧 Email Builder Pro - История разработки

**Последнее обновление:** 2 октября 2025  
**Текущая версия:** news_2.3  
**Статус:** 🚀 В активной разработке

---

## 📊 Текущее состояние

### ✅ Реализовано (Stage 0-2.3)

#### 🏗️ Архитектура и структура
- **Pixel-based column system** - система колонок с фиксированной шириной в пикселях (не проценты!)
- **Automatic gap redistribution** - автоматическое перераспределение отступов между колонками
- **Section-based architecture** - письма состоят из секций → колонок → блоков
- **Email canvas width**: 600px (стандарт для email)
- **Column gap**: 10px (настраиваемый)

#### 🎨 Дизайн и UI
- **Dark theme** полностью применен:
  - Панели: `#28282A`
  - Границы: `#333335`
  - Инпуты: `#1C1D1F` background, `#333335` border
  - Текст: `#e1e7ef`, `#8b92a7` (secondary)
  - Акцент: `#667eea` (фиолетовый)
  - Drop zones: `#f8f9ff` (белый, контрастный)
  - Email canvas: white (остается светлым)

- **Container styling**:
  - Height: `80vh`
  - Border radius: `15px`
  - Professional shadows и transitions

- **Toolbar** (reorganized):
  ```
  [Назад] [Вперед] | [Редактор] [HTML] [Предпросмотр] | [Desktop] [Mobile]
  Left side          Center (view modes)                  Right side
  ```
  - Назад/Вперед: только иконки, компактные
  - View modes: полные названия с активным состоянием
  - Desktop/Mobile: только иконки

#### 🎛️ Системы контролов

##### 1. Section Controls (✅ Perfect)
- **Позиция**: Слева от секции
- **Триггер**: Появляются при клике на секцию
- **Скрытие**: При клике на другую секцию/блок
- **Кнопки**: ⬆️ (move up), ⬇️ (move down), 📋 (duplicate), 🗑️ (delete)
- **Размер**: 20×20px
- **Стиль**: Вертикальная колонка, темный фон, белые иконки

##### 2. Column Controls (✅ Perfect)
- **Позиция**: Сверху колонки (`top: -28px`, centered)
- **Триггер**: Появляются при hover на колонку
- **Скрытие**: 
  - При уходе мыши с колонки
  - При выборе блока внутри колонки (`:has()` selector)
- **Кнопки**: ⬅️ (move left), ➡️ (move right), 📋 (duplicate), 🗑️ (delete)
- **Размер**: 22×22px
- **Функционал**: 
  - Удаление колонки → автоматический resize остальных колонок
  - Перемещение влево/вправо с сохранением ширин

##### 3. Block Controls (✅ Refined - news_2.3)
- **Позиция**: Сверху блока (`top: -34px`, centered)
- **Триггер**: Появляются при выборе блока (клик)
- **Скрытие**: При клике на другой блок или вне блока
- **Кнопки**: ⬆️ (move up), ⬇️ (move down), 📋 (duplicate), 🗑️ (delete)
- **Размер**: 22×22px кнопки
- **Стиль**: 
  - `width: fit-content` - компактный размер для всех блоков
  - `white-space: nowrap` - все 4 кнопки в один ряд
  - Белый фон, тень, скругленные углы сверху
- **Особенности**:
  - Одинаковая ширина для всех блоков (узких и широких)
  - Не вылезает за границы даже в узких колонках
  - Автоматически скрывает column-controls при выборе блока

#### 📐 Section Layouts

```typescript
const SECTION_LAYOUTS = [
  { id: '1col', name: 'Одна колонка', columns: [{ width: 600 }] },
  { id: '2col', name: 'Две колонки (50/50)', columns: [{ width: 295 }, { width: 295 }] },
  { id: '1:2', name: '1:2 (33/67)', columns: [{ width: 193.33 }, { width: 396.67 }] },
  { id: '2:1', name: '2:1 (67/33)', columns: [{ width: 396.67 }, { width: 193.33 }] },
  { id: '3col', name: 'Три колонки', columns: [{ width: 190 }, { width: 190 }, { width: 190 }] },
  { id: '4col', name: 'Четыре колонки', columns: [{ width: 140 }, { width: 140 }, { width: 140 }, { width: 140 }] }
];
```

#### 🖱️ Drag & Drop система

- **Auto-scroll during drag**:
  ```typescript
  const scrollThreshold = 100; // px от края
  const scrollSpeed = 10;
  ```
  - Активируется в пределах 100px от верха/низа canvas
  - Плавный скролл со скоростью 10px/20ms
  - Автоматическая очистка interval при окончании drag

- **Section drop zones**:
  - Height: `40px`
  - Background: `#f8f9ff` (белый, контрастный с темной темой)
  - Без border (чистый, минималистичный вид)
  - Transition: `all 0.3s`
  - Появляются между секциями и в начале/конце письма

- **Block drag & drop**:
  - Внутри колонок
  - Визуальная подсветка drop zone
  - Placeholder показывает будущую позицию

#### 📝 Формы и инпуты

- **Text inputs, selects, textareas**:
  ```css
  background: #1C1D1F;
  border: 1px solid #333335;
  color: #ffffff;
  border-radius: 6px;
  ```

- **Checkbox groups**:
  ```css
  .form-group-checkbox {
    background: rgba(255, 255, 255, 0.03);
    padding: 12px;
    border-radius: 8px;
  }
  
  .checkbox-label {
    display: flex;
    align-items: center;
    gap: 8px;
  }
  
  input[type="checkbox"] {
    width: 18px;
    height: 18px;
    accent-color: #667eea;
  }
  ```

#### 🔄 Hover эффекты

- **Column hover**:
  ```css
  .email-column:hover {
    border-color: rgba(102, 126, 234, 0.3);
    background: rgba(102, 126, 234, 0.05); /* Слегка заметно */
  }
  ```

- **Block selection**:
  ```css
  .email-block.selected {
    outline: 2px solid #667eea;
    outline-offset: 2px;
  }
  ```

#### 🛠️ Основной функционал

**Sections:**
- ✅ Добавление секций (6 layouts)
- ✅ Перемещение вверх/вниз
- ✅ Дублирование
- ✅ Удаление
- ✅ Drag & drop для изменения порядка

**Columns:**
- ✅ Pixel-based width system
- ✅ Automatic gap redistribution
- ✅ Перемещение влево/вправо
- ✅ Дублирование
- ✅ Удаление с auto-resize
- ✅ Визуальные контролы (22×22px)

**Blocks:**
- ✅ Добавление блоков (Text, Image, Button, Divider, Spacer)
- ✅ Перемещение вверх/вниз внутри колонки (news_2.3)
- ✅ Дублирование (news_2.3)
- ✅ Удаление (news_2.3)
- ✅ Drag & drop внутри/между колонками
- ✅ Inline editing в preview
- ✅ Rich настройки (padding, margin, colors, borders)

**Preview:**
- ✅ Live preview (Gmail-style)
- ✅ Интерактивное редактирование (клик на блок → selection)
- ✅ Preview в iframe (изоляция стилей)
- ⏳ Desktop/Mobile toggle (UI готов, функционал pending)
- ⏳ Dark mode preview (pending)

---

## 📋 Git History

### news_2.3 (02.10.2025)
**Refined block-controls: fixed positioning, made compact and adaptive**

Изменения:
- Fixed block-controls positioning to stay above blocks (`top: -34px`)
- Made block-controls compact with `fit-content` width (same size for all blocks)
- Adjusted block-controls to always show 4 buttons in one row
- Added CSS to hide column-controls when block is selected (no overlap with `:has()`)
- Increased email-column hover visibility (0.05 opacity)
- Block controls now work perfectly in all column layouts (1, 2, 3, 4 columns)

Файлы:
- `frontend/src/components/admin/EmailBuilder/EmailBuilderPro.tsx` (добавлены функции moveBlockUp, moveBlockDown, duplicateBlock)
- `frontend/src/components/admin/EmailBuilder/EmailBuilderPro.css` (стилизация block-controls)

### news_2.2 (01.10.2025)
**Section-drop-zone refinement + Renamed "Структуры" → "Секции"**

Изменения:
- Section-drop-zone сделаны компактными (40px height)
- Убрана граница, добавлен чистый белый фон (#f8f9ff)
- Переименованы "Структуры" → "Секции" во всем UI
- Улучшена видимость drop zones

### news_2.1 (ранее)
**Auto-scroll during drag & drop**

Изменения:
- Реализован автоматический скролл при drag & drop
- Threshold: 100px от края
- Scroll speed: 10px/20ms
- Плавная активация/деактивация

### news_2.0 (ранее)
**Reorganized toolbar + Dark theme application**

Изменения:
- Toolbar reorganized: Назад/Вперед слева, view modes в центре, Desktop/Mobile справа
- Применена темная тема (#28282A, #333335, #1C1D1F)
- Compact toolbar (icons only для некоторых кнопок)
- Container: 80vh, border-radius 15px
- Form inputs dark styling
- Checkbox groups unique styling

### email_2.1 (ранее)
**Pixel-based column system + Column controls**

Изменения:
- Реализована система колонок с фиксированной шириной в пикселях
- Automatic gap redistribution при изменении ширины колонок
- Column controls (⬅️➡️📋🗑️) с auto-resize при удалении
- 6 section layouts: 1col, 2col, 1:2, 2:1, 3col, 4col

---

## 🎯 Roadmap (из EMAIL_BUILDER_AUDIT_AND_ROADMAP.md)

### ✅ Completed (Stage 0-2.3)

- ✅ **Section-based architecture** (секции → колонки → блоки)
- ✅ **Pixel-based columns** с automatic gap redistribution
- ✅ **Drag & Drop** для секций и блоков
- ✅ **Auto-scroll** во время drag & drop
- ✅ **Section controls** (⬆️⬇️📋🗑️) - perfect UX
- ✅ **Column controls** (⬅️➡️📋🗑️) с auto-resize
- ✅ **Block controls** (⬆️⬇️📋🗑️) - refined positioning (news_2.3)
- ✅ **Dark theme** полностью применен
- ✅ **Rich block settings** (padding, margin, colors, borders)
- ✅ **Inline editing** в preview (клик → selection)
- ✅ **6 section layouts** (1col, 2col, 1:2, 2:1, 3col, 4col)
- ✅ **5 block types** (Text, Image, Button, Divider, Spacer)

### ⏳ In Progress

- ⏳ **Desktop/Mobile preview toggle** (UI готов, функционал нужен)
- ⏳ **Responsive design** для блоков (mobile settings)

### ❌ Pending (Priority 1 - Must Have)

1. **Загрузка изображений** ⭐⭐⭐⭐⭐
   - Выбор файла с компьютера
   - Drag & Drop файла
   - Библиотека загруженных изображений
   - API endpoint для upload
   - Preview thumbnails

2. **Выравнивание кнопок** ⭐⭐⭐
   - Left / Center / Right alignment
   - Настройка в block settings
   - HTML generation с correct alignment

3. **Больше типов блоков** ⭐⭐⭐⭐
   - Heading (H1/H2/H3 с особым стилем)
   - Social Icons (Facebook, Instagram, Twitter, LinkedIn, YouTube)
   - Video (preview + ссылка на YouTube/Vimeo)
   - HTML (произвольный HTML-код)
   - Menu (горизонтальное меню для navigation)
   - Footer (футер с контактами и unsubscribe)

### ❌ Pending (Priority 2 - Should Have)

4. **Библиотека шаблонов** ⭐⭐⭐⭐
   - Готовые секции (hero, features, testimonials, pricing, footer)
   - Полные шаблоны писем (welcome, newsletter, promo, announcement)
   - Сохранение своих секций/шаблонов
   - Preview шаблонов
   - Теги и категории

5. **Адаптивность (Mobile Responsive)** ⭐⭐⭐⭐
   - Media queries в HTML
   - Mobile settings для каждого блока
   - Desktop/Mobile preview toggle (функционал)
   - Скрытие элементов на мобильных
   - Изменение размеров текста/отступов

6. **Save/Load система** ⭐⭐⭐⭐
   - Сохранение черновиков
   - Загрузка существующих newsletters
   - Auto-save каждую минуту
   - Version history

### ❌ Pending (Priority 3 - Nice to Have)

7. **A/B тестирование** ⭐⭐⭐
   - Создание вариантов A и B
   - Split-тестирование (50/50 или custom)
   - Аналитика результатов

8. **AI-ассистент** ⭐⭐⭐
   - Генерация темы письма
   - Улучшение текста
   - Генерация полного письма по описанию

9. **Version Control** ⭐⭐⭐
   - История версий
   - Откат к предыдущей версии
   - Сравнение версий

10. **Advanced features**
    - Комментарии и коллаборация
    - Импорт/Экспорт (HTML, PDF)
    - Countdown timer block
    - QR code block
    - Dynamic content (personalization)

---

## 🐛 Known Issues

### Текущие проблемы:

1. **Desktop/Mobile toggle не функционален**
   - UI кнопки есть, но переключения view нет
   - Нужно добавить state и conditional rendering

2. **Preview не показывает mobile view**
   - Нет media queries в generated HTML
   - Нужно добавить responsive email boilerplate

3. **Нет save/load функционала**
   - Sections не сохраняются в БД
   - При перезагрузке страницы все теряется
   - Нужен API endpoint для save/load

### Исправлено (news_2.3):

- ✅ Block-controls вылезали за границы узких блоков → fixed with `width: fit-content`
- ✅ Block-controls и column-controls показывались одновременно → fixed with `:has()` selector
- ✅ Block-controls были в неправильной позиции → fixed with `top: -34px`

### Исправлено (news_2.2):

- ✅ Section-drop-zone имели polypara background → fixed with solid #f8f9ff
- ✅ Drop zones были слишком высокими → fixed with 40px height
- ✅ Название "Структуры" было неочевидным → renamed to "Секции"

---

## 📁 Файловая структура

```
frontend/src/components/admin/EmailBuilder/
├── EmailBuilderPro.tsx          (1520+ lines) - Main component
├── EmailBuilderPro.css          (990+ lines) - Styles with dark theme
├── BlockRenderer.tsx            - Renders different block types
├── VariableInserter.tsx         - Insert dynamic variables
├── types/
│   ├── section.ts               - EmailSection interface
│   ├── column.ts                - EmailColumn interface
│   └── block.ts                 - EmailBlock interface
└── [old files with .backup extension]
```

### EmailBuilderPro.tsx - Ключевые функции:

```typescript
// Section operations
const addSection = (layout: string) => {...}
const moveSection = (id: string, direction: 'up' | 'down') => {...}
const duplicateSection = (id: string) => {...}
const deleteSection = (id: string) => {...}

// Column operations
const moveColumn = (sectionId: string, columnId: string, direction: 'left' | 'right') => {...}
const duplicateColumn = (sectionId: string, columnId: string) => {...}
const deleteColumn = (sectionId: string, columnId: string) => {...}
const updateColumnWidth = (sectionId: string, columnId: string, newWidth: number) => {...}

// Block operations (news_2.3)
const moveBlockUp = (sectionId: string, columnId: string, blockId: string) => {...}
const moveBlockDown = (sectionId: string, columnId: string, blockId: string) => {...}
const duplicateBlock = (sectionId: string, columnId: string, blockId: string) => {...}
const deleteBlock = (sectionId: string, columnId: string, blockId: string) => {...}

// Drag & Drop
const handleDragStart = (e: React.DragEvent, type: string, data: any) => {...}
const handleDragEnd = (e: React.DragEvent) => {...}
const handleAutoScroll = (e: React.DragEvent) => {...}

// Selection
const setSelectedElement = (element: SelectedElement) => {...}
// SelectedElement = { sectionId?, columnId?, blockId? }
```

---

## 🔧 Технические детали

### Pixel-based Column System

```typescript
// Пример: Section с 2 колонками (50/50)
const contentWidth = 600; // px
const columnGap = 10; // px
const totalGaps = 1; // между 2 колонками

// Доступная ширина для контента
const availableWidth = contentWidth - (totalGaps * columnGap); // 590px

// Каждая колонка
const columnWidth = availableWidth / 2; // 295px

// Layout:
// [Column 295px] [Gap 10px] [Column 295px]
// Total: 600px
```

**При удалении колонки:**
```typescript
// Было: 3 колонки по 190px (600px - 20px gaps = 580px / 3)
// Удаляем 1 колонку
// Стало: 2 колонки по 295px (600px - 10px gap = 590px / 2)
// Автоматический пересчет!
```

### Control Systems Architecture

```
User Action Flow:

1. Section Controls:
   Click on section → Show section-controls on left
   Click on another section → Hide previous, show new
   Click on block → Hide section-controls

2. Column Controls:
   Hover on column → Show column-controls on top
   Mouse leaves column → Hide column-controls
   Click on block inside → Hide column-controls (via :has())

3. Block Controls:
   Click on block → Show block-controls on top
   Click outside → Hide block-controls
   Automatic: Hide column-controls when block selected
```

### CSS Tricks используемые

```css
/* Скрытие column-controls когда блок выбран */
.email-column:has(.email-block.selected) .column-controls {
  opacity: 0 !important;
  pointer-events: none;
}

/* Компактные block-controls для всех блоков */
.block-controls {
  width: fit-content; /* Не растягивается на всю ширину */
  white-space: nowrap; /* Кнопки в один ряд */
}

/* Слегка заметный hover колонок */
.email-column:hover {
  background: rgba(102, 126, 234, 0.05); /* Было 0.02 */
}
```

---

## 💡 Lessons Learned

### Что работает хорошо:

1. **Pixel-based columns** - намного логичнее чем проценты для email
2. **Automatic gap redistribution** - UX победа, пользователь не думает о math
3. **`:has()` selector** - элегантное решение для hiding column-controls
4. **`fit-content` для controls** - universal solution для разных ширин блоков
5. **Dark theme с белым canvas** - professional look, email preview остается authentic
6. **Separated control systems** - каждый уровень (section/column/block) имеет свои контролы

### Что можно улучшить:

1. **Performance** - при большом количестве блоков может тормозить
2. **Undo/Redo** - критично для хорошего UX, сейчас нет
3. **Keyboard shortcuts** - опытные пользователи хотят hotkeys
4. **Accessibility** - нужно добавить ARIA labels и keyboard navigation
5. **Mobile editing** - сейчас builder только для desktop
6. **Real-time collaboration** - было бы wow-feature

---

## 🎨 Design System

### Colors:

```css
/* Dark Theme */
--panel-bg: #28282A;
--border: #333335;
--input-bg: #1C1D1F;
--canvas-bg: #28282a;

/* Text */
--text-primary: #e1e7ef;
--text-secondary: #8b92a7;

/* Accent */
--accent: #667eea;
--accent-hover: rgba(102, 126, 234, 0.8);
--accent-subtle: rgba(102, 126, 234, 0.05);

/* Canvas */
--email-canvas-bg: white; /* Stays light! */
--drop-zone-bg: #f8f9ff;
```

### Spacing:

```css
--gap-column: 10px;
--content-width: 600px;
--toolbar-height: 56px;
--builder-height: 80vh;
```

### Typography:

```css
--font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', ...;
--font-size-base: 14px;
--font-size-small: 12px;
--font-size-large: 16px;
```

---

## 📚 Для следующего агента

### Быстрый старт:

1. **Прочитайте этот файл** - вся история здесь
2. **Прочитайте EMAIL_BUILDER_AUDIT_AND_ROADMAP.md** - полный roadmap
3. **Посмотрите EmailBuilderPro.tsx** - основной компонент (1520+ строк)
4. **Посмотрите EmailBuilderPro.css** - стили (990+ строк)

### Текущий приоритет:

1. **Загрузка изображений** (must have)
   - Создать API endpoint `/api/upload/image`
   - Добавить ImageUploader component
   - Интегрировать в Image block settings

2. **Save/Load система** (критично!)
   - Sections не сохраняются, теряются при reload
   - Нужен API endpoint для save/load
   - Auto-save каждую минуту

3. **Desktop/Mobile toggle** (UI готов)
   - Добавить state для view mode
   - Conditional rendering для mobile preview
   - Media queries в generated HTML

### Где искать код:

- **Main component**: `frontend/src/components/admin/EmailBuilder/EmailBuilderPro.tsx`
- **Styles**: `frontend/src/components/admin/EmailBuilder/EmailBuilderPro.css`
- **Types**: Inline в EmailBuilderPro.tsx (можно вынести в отдельные файлы)
- **Block renderer**: `frontend/src/components/admin/EmailBuilder/BlockRenderer.tsx`

### Как тестировать:

```bash
# Terminal 1: Backend
cd backend && node src/app.js

# Terminal 2: Frontend
cd frontend && npm run dev

# Browser:
http://localhost:5173/admin/newsletters/create
```

### Git workflow:

```bash
# Перед началом работы
git checkout main
git pull

# Создать ветку для фичи
git checkout -b feature/image-upload

# После завершения
git add -A
git commit -m "Added image upload functionality"
git tag news_2.4
git push origin feature/image-upload
```

---

**Последний коммит:** `news_2.3` (911d310a)  
**Следующая версия:** `news_2.4` (image upload или save/load)

**Вопросы?** Читайте EMAIL_BUILDER_AUDIT_AND_ROADMAP.md для деталей! 🚀
