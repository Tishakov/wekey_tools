# 🚀 Quick Start для нового агента Claude Sonnet 4.5

**Дата создания:** 2 октября 2025  
**Для:** Следующего AI агента, который продолжит работу над проектом  
**От:** Предыдущего агента (Claude Sonnet 3.5)

---

## 📚 Обязательные документы для чтения

### 1. Главный контекст проекта
**Файл:** `PROJECT_CONTEXT.md` (корень репозитория)  
**Что внутри:**
- Описание всего проекта Wekey Tools
- Текущая версия: `email_builder_pro_2.3`
- Полный tech stack
- История всех версий
- Roadmap развития

**Время чтения:** 10-15 минут

### 2. Email Builder Pro - История разработки
**Файл:** `docs/EMAIL_BUILDER_PRO_PROGRESS.md`  
**Что внутри:**
- Полная история разработки Email Builder (versions news_2.0 → news_2.3)
- Описание каждого коммита с деталями
- Архитектура системы (sections → columns → blocks)
- Triple control system (section/column/block controls)
- Pixel-based column system
- Технические детали реализации
- Known issues и их решения
- Design system (colors, spacing, typography)
- Lessons learned

**Время чтения:** 20-25 минут  
**Важность:** 🔥 КРИТИЧНО - без этого не понять текущее состояние

### 3. Email Builder - Аудит и Roadmap
**Файл:** `docs/EMAIL_BUILDER_AUDIT_AND_ROADMAP.md`  
**Что внутри:**
- Детальный аудит текущего состояния (оценка 6.5/10)
- Что работает хорошо ✅
- Критические недостатки ❌
- Полный roadmap на 6-10 недель разработки
- Приоритизация задач (Must Have / Should Have / Nice to Have)
- Конкретные рекомендации с примерами кода
- Сравнение с конкурентами (Mailchimp, Stripo, Unlayer)

**Время чтения:** 30-40 минут  
**Важность:** 🔥 КРИТИЧНО - plan действий на будущее

### 4. Документация по email системе (опционально)
**Файлы:** `docs/EMAIL_SYSTEM_STAGE_*.md`  
**Что внутри:**
- История развития email системы по стадиям (0, 1, 2, 2.5)
- Детали реализации каждой стадии
- Технические решения и проблемы

**Время чтения:** 15-20 минут на файл  
**Важность:** 🟡 Желательно, но не критично

---

## ⚡ Быстрый старт (5 минут)

### Если времени совсем мало, прочитай это:

#### 📦 Проект: Wekey Tools
- **Тип:** Платформа с профессиональными инструментами для бизнеса
- **Tech:** React 19 + TypeScript + Node.js + Express + SQLite
- **Ports:** Frontend (5173), Backend (8880)
- **Admin:** admin@wekey.tools / admin123

#### 🎯 Текущая задача: Email Builder Pro
- **Версия:** news_2.3 (git tag)
- **Статус:** 🚀 В активной разработке
- **Оценка:** 6.5/10 (базовый функционал есть, нужно много улучшений)

#### 🏗️ Архитектура Email Builder:
```
Email
└── Sections[] (6 layouts: 1col, 2col, 1:2, 2:1, 3col, 4col)
    └── Columns[] (pixel-based widths, auto gap redistribution)
        └── Blocks[] (Text, Image, Button, Divider, Spacer)
```

#### 🎛️ Системы контролов:
1. **Section Controls** - слева от секции, клик → показать
2. **Column Controls** - сверху колонки, hover → показать
3. **Block Controls** - сверху блока, клик → показать (news_2.3)

#### 🔴 Top 3 Priority (что делать дальше):
1. **Image upload** - загрузка картинок с компьютера (сейчас только URL)
2. **Save/Load system** - sections не сохраняются в БД (критично!)
3. **Button alignment** - left/center/right для кнопок

#### 📁 Где код:
- Main: `frontend/src/components/admin/EmailBuilder/EmailBuilderPro.tsx` (1520 lines)
- Styles: `frontend/src/components/admin/EmailBuilder/EmailBuilderPro.css` (990 lines)

#### 🎨 Dark Theme Colors:
```css
--panel-bg: #28282A
--border: #333335
--input-bg: #1C1D1F
--accent: #667eea
--drop-zone: #f8f9ff
```

---

## 🔥 Что нужно знать ОБЯЗАТЕЛЬНО

### 1. Pixel-based Column System (уникальная фича!)

**НЕ используем проценты!** Используем пиксели:

```typescript
const contentWidth = 600; // email standard
const columnGap = 10; // между колонками

// Для 2 колонок (50/50):
const availableWidth = 600 - (1 * 10); // 590px
const columnWidth = 590 / 2; // 295px каждая

// Layout: [295px] [gap 10px] [295px] = 600px total
```

**Почему пиксели?**
- Email клиенты (Gmail, Outlook) плохо работают с процентами
- Pixel widths более предсказуемы и стабильны
- Проще контролировать точное отображение

**Automatic Gap Redistribution:**
При удалении колонки, остальные автоматически пересчитываются:
```typescript
// Было: 3 колонки по 190px
// Удалили 1 → осталось 2 колонки
// Автоматически стали по 295px
```

### 2. Triple Control System (3 уровня контролов)

**ВАЖНО:** Каждый уровень (section/column/block) имеет СВОИ контролы!

#### Section Controls (✅ Perfect - не трогай!)
```css
.section-controls {
  position: absolute;
  left: -30px; /* Слева от секции */
  top: 50%;
  transform: translateY(-50%);
}
```
- Триггер: **Клик** на секцию
- Скрытие: Клик на другую секцию/блок
- Кнопки: ⬆️⬇️📋🗑️ (20×20px, вертикально)

#### Column Controls (✅ Perfect - не трогай!)
```css
.column-controls {
  position: absolute;
  top: -28px; /* Сверху колонки */
  left: 50%;
  transform: translateX(-50%);
}
.email-column:hover .column-controls {
  opacity: 1;
}
```
- Триггер: **Hover** на колонку
- Скрытие: 
  - Mouse leave колонки
  - Блок внутри выбран (`:has()` selector)
- Кнопки: ⬅️➡️📋🗑️ (22×22px, горизонтально)

#### Block Controls (✅ Refined in news_2.3)
```css
.block-controls {
  position: absolute;
  top: -34px; /* Сверху блока */
  left: 50%;
  transform: translateX(-50%);
  width: fit-content; /* Компактный! */
  white-space: nowrap; /* Все в один ряд */
}
.email-block.selected .block-controls {
  opacity: 1;
}
/* Скрыть column-controls когда блок выбран */
.email-column:has(.email-block.selected) .column-controls {
  opacity: 0 !important;
  pointer-events: none;
}
```
- Триггер: **Клик** на блок (только selection, НЕ hover!)
- Скрытие: Клик на другой блок/вне блока
- Кнопки: ⬆️⬇️📋🗑️ (22×22px, горизонтально)
- **Особенность:** Одинаковая ширина для всех блоков (узких и широких)

**Почему :has() для скрытия column-controls?**
```css
/* Когда внутри колонки есть выбранный блок, скрываем column-controls */
.email-column:has(.email-block.selected) .column-controls {
  opacity: 0;
}
```
Это предотвращает визуальный конфликт - user не видит 2 набора контролов одновременно!

### 3. Dark Theme Application

**ВАЖНО:** Email canvas остается БЕЛЫМ! Темными делаем только UI платформы:

```css
/* Темное */
.email-builder-pro { background: #1a1d2e; }
.top-toolbar { background: #28282A; }
.builder-sidebar { background: #28282A; }
.canvas-area { background: #28282a; }
input, select { background: #1C1D1F; border: 1px solid #333335; }

/* Светлое (email canvas) */
.email-canvas { background: white; } /* ← НЕ трогать! */
.section-drop-zone { background: #f8f9ff; } /* Белый, контраст */
```

**Почему canvas белый?**
- Email letters ВСЕГДА на белом фоне в реальных клиентах (Gmail, Outlook)
- Preview должен быть максимально authentic
- Темный canvas сбивает с толку пользователей

### 4. Section Layouts (6 вариантов)

```typescript
const SECTION_LAYOUTS = [
  { id: '1col', name: 'Одна колонка', 
    columns: [{ width: 600 }] },
  
  { id: '2col', name: 'Две колонки (50/50)', 
    columns: [{ width: 295 }, { width: 295 }] },
  
  { id: '1:2', name: '1:2 (33/67)', 
    columns: [{ width: 193.33 }, { width: 396.67 }] },
  
  { id: '2:1', name: '2:1 (67/33)', 
    columns: [{ width: 396.67 }, { width: 193.33 }] },
  
  { id: '3col', name: 'Три колонки', 
    columns: [{ width: 190 }, { width: 190 }, { width: 190 }] },
  
  { id: '4col', name: 'Четыре колонки', 
    columns: [{ width: 140 }, { width: 140 }, { width: 140 }, { width: 140 }] }
];
```

**Math для layouts:**
```
Content width: 600px
Column gap: 10px

1 col:  600px
2 col:  (600 - 10) / 2 = 295px each
1:2:    (600 - 10) * [0.33, 0.67] = [193.33px, 396.67px]
2:1:    (600 - 10) * [0.67, 0.33] = [396.67px, 193.33px]
3 col:  (600 - 20) / 3 = 190px each (2 gaps)
4 col:  (600 - 30) / 4 = 140px each (3 gaps)
```

---

## 🎯 Что делать ДАЛЬШЕ (Priority Order)

### 🔴 Priority 1: Must Have (критично!)

#### 1. Image Upload System
**Проблема:** Сейчас только URL, пользователь должен сначала загрузить на хостинг  
**Решение:** API endpoint + ImageUploader component

**План действий:**
```javascript
// 1. Backend API (backend/routes/upload.js)
const multer = require('multer');
const upload = multer({ dest: 'uploads/images/' });

router.post('/api/upload/image', upload.single('image'), (req, res) => {
  // Save file
  // Return URL
  res.json({ url: `/uploads/images/${req.file.filename}` });
});

// 2. Frontend component (ImageUploader.tsx)
<div className="image-uploader">
  <input type="file" accept="image/*" onChange={handleFileChange} />
  <button onClick={uploadImage}>📁 Загрузить</button>
  <span>или</span>
  <input type="url" placeholder="Вставить URL" value={url} />
</div>

// 3. Интеграция в Image block settings
```

**Срок:** 1-2 дня  
**Документация:** EMAIL_BUILDER_AUDIT_AND_ROADMAP.md, Section 1.3

#### 2. Save/Load System
**Проблема:** Sections не сохраняются в БД, теряются при reload страницы  
**Решение:** API endpoints + auto-save

**План действий:**
```javascript
// 1. Backend API
POST /api/newsletters/:id/sections - Save sections
GET  /api/newsletters/:id/sections - Load sections

// 2. Frontend auto-save
useEffect(() => {
  const interval = setInterval(() => {
    saveSections(template.sections);
  }, 60000); // Каждую минуту
  return () => clearInterval(interval);
}, [template.sections]);

// 3. Load on mount
useEffect(() => {
  if (id) {
    loadSections(id).then(sections => {
      setTemplate({ ...template, sections });
    });
  }
}, [id]);
```

**Срок:** 1-2 дня  
**Важность:** 🔥 КРИТИЧНО - без этого builder бесполезен!

#### 3. Button Alignment
**Проблема:** Кнопки всегда слева, нет center/right  
**Решение:** Добавить настройку alignment в block settings

**План действий:**
```typescript
// 1. Добавить в BlockSettings (case 'button'):
<div className="alignment-buttons">
  <button onClick={() => updateSettings('alignment', 'left')}>◀</button>
  <button onClick={() => updateSettings('alignment', 'center')}>●</button>
  <button onClick={() => updateSettings('alignment', 'right')}>▶</button>
</div>

// 2. Обновить HTML generator:
case 'button':
  return `
    <div style="text-align: ${block.settings.alignment || 'left'}">
      <table align="${block.settings.alignment || 'left'}">
        <tr><td><a href="${url}">${text}</a></td></tr>
      </table>
    </div>
  `;
```

**Срок:** 0.5 дня  
**Документация:** EMAIL_BUILDER_AUDIT_AND_ROADMAP.md, Section 1.4

### 🟡 Priority 2: Should Have

#### 4. More Block Types
Добавить: Heading, Social Icons, Video, HTML, Menu, Footer  
**Срок:** 3-5 дней  
**Документация:** EMAIL_BUILDER_AUDIT_AND_ROADMAP.md, Section 2.2

#### 5. Template Library
Готовые секции и полные шаблоны  
**Срок:** 5-7 дней  
**Документация:** EMAIL_BUILDER_AUDIT_AND_ROADMAP.md, Section 2.1

#### 6. Mobile Responsive
Desktop/Mobile preview toggle (UI уже есть!)  
**Срок:** 3-5 дней  
**Документация:** EMAIL_BUILDER_AUDIT_AND_ROADMAP.md, Section 3.1

### 🟢 Priority 3: Nice to Have

#### 7. A/B Testing
Создание вариантов и аналитика  
**Срок:** 5-7 дней  
**Документация:** EMAIL_BUILDER_AUDIT_AND_ROADMAP.md, Section 3.3

#### 8. AI Assistant
Генерация контента по промпту  
**Срок:** 3-5 дней  
**Документация:** EMAIL_BUILDER_AUDIT_AND_ROADMAP.md, Section 4.1

---

## 🐛 Known Issues

### Текущие проблемы (нужно исправить):

1. **Desktop/Mobile toggle не работает**
   - UI кнопки есть, но state и logic нет
   - Нужно: добавить `viewMode` state, conditional rendering

2. **Preview не responsive**
   - Нет media queries в generated HTML
   - Нужно: добавить responsive email boilerplate

3. **Sections не сохраняются**
   - При reload страницы все теряется
   - Нужно: API endpoints + auto-save (см. Priority 1.2)

### Исправлено (не ломай!):

- ✅ Block-controls вылезали за границы → fixed with `width: fit-content`
- ✅ Controls collision → fixed with `:has()` selector
- ✅ Block-controls позиция → fixed with `top: -34px`
- ✅ Drop zones background → fixed with solid #f8f9ff
- ✅ Column hover subtle → fixed with 0.05 opacity

---

## 📁 Структура кода

### Frontend главные файлы:

```
frontend/src/components/admin/EmailBuilder/
├── EmailBuilderPro.tsx          (1520+ lines) ← Main component
├── EmailBuilderPro.css          (990+ lines)  ← All styles
├── BlockRenderer.tsx            ← Renders blocks
├── VariableInserter.tsx         ← Dynamic variables
└── [old .backup files]          ← Ignore these
```

### EmailBuilderPro.tsx - Key functions:

```typescript
// ===== SECTION OPERATIONS =====
addSection(layout: string): void
moveSection(id: string, direction: 'up'|'down'): void
duplicateSection(id: string): void
deleteSection(id: string): void

// ===== COLUMN OPERATIONS =====
moveColumn(sectionId, columnId, direction: 'left'|'right'): void
duplicateColumn(sectionId, columnId): void
deleteColumn(sectionId, columnId): void
updateColumnWidth(sectionId, columnId, newWidth: number): void

// ===== BLOCK OPERATIONS (news_2.3) =====
moveBlockUp(sectionId, columnId, blockId): void
moveBlockDown(sectionId, columnId, blockId): void
duplicateBlock(sectionId, columnId, blockId): void
deleteBlock(sectionId, columnId, blockId): void

// ===== DRAG & DROP =====
handleDragStart(e, type, data): void
handleDragEnd(e): void
handleAutoScroll(e): void // Auto-scroll при приближении к краю

// ===== SELECTION =====
setSelectedElement(element: SelectedElement): void
// SelectedElement = { sectionId?, columnId?, blockId? }
```

### Где что искать:

**Если нужно изменить:**
- Стили контролов → EmailBuilderPro.css, lines ~550-700
- Logic секций → EmailBuilderPro.tsx, lines ~400-500
- Logic колонок → EmailBuilderPro.tsx, lines ~500-600
- Logic блоков → EmailBuilderPro.tsx, lines ~600-700
- Drag & Drop → EmailBuilderPro.tsx, lines ~200-300
- HTML generation → EmailBuilderPro.tsx, lines ~1200-1400
- Block rendering → BlockRenderer.tsx

---

## 🎨 Design System Reference

### Colors (Dark Theme):

```css
/* Panels & Backgrounds */
--builder-bg: #1a1d2e
--panel-bg: #28282A
--canvas-bg: #28282a
--email-canvas-bg: white /* ← Keep light! */

/* Borders & Lines */
--border: #333335
--border-hover: rgba(102, 126, 234, 0.3)

/* Inputs & Forms */
--input-bg: #1C1D1F
--input-border: #333335

/* Text */
--text-primary: #e1e7ef
--text-secondary: #8b92a7

/* Accent (Purple) */
--accent: #667eea
--accent-hover: rgba(102, 126, 234, 0.8)
--accent-subtle: rgba(102, 126, 234, 0.05)

/* Drop Zones */
--drop-zone: #f8f9ff /* White, contrast with dark */
```

### Spacing:

```css
--content-width: 600px   /* Email standard */
--column-gap: 10px       /* Between columns */
--toolbar-height: 56px   /* Top toolbar */
--builder-height: 80vh   /* Container */
--border-radius: 15px    /* Container corners */
```

### Control Sizes:

```css
/* Section Controls */
--section-control-size: 20px

/* Column Controls */
--column-control-size: 22px
--column-control-top: -28px

/* Block Controls */
--block-control-size: 22px
--block-control-top: -34px /* Slightly higher than column */
```

### Typography:

```css
--font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', ...
--font-size-base: 14px
--font-size-small: 12px
--font-size-large: 16px
```

---

## 🔧 Как запустить проект

### Быстрый запуск:

```bash
# Terminal 1: Backend
cd backend
node src/app.js
# Running on http://localhost:8880

# Terminal 2: Frontend
cd frontend
npm run dev
# Running on http://localhost:5173

# Browser:
http://localhost:5173/admin/newsletters/create
```

### Админ доступ:

```
URL: http://localhost:5173/admin
Email: admin@wekey.tools
Password: admin123
```

### Git workflow:

```bash
# Посмотреть текущие теги
git tag -l "news_*"

# Создать новый коммит с тегом
git add -A
git commit -m "Your commit message"
git tag news_2.4
git push origin main --tags
```

---

## 💡 Tips & Best Practices

### 1. Всегда читай контекст перед изменениями

```bash
# Прочитай эти файлы ПЕРЕД началом работы:
1. PROJECT_CONTEXT.md (общий контекст)
2. EMAIL_BUILDER_PRO_PROGRESS.md (история Email Builder)
3. EMAIL_BUILDER_AUDIT_AND_ROADMAP.md (план действий)
```

### 2. Проверяй существующий код

```bash
# НЕ дублируй логику! Сначала grep:
grep -r "functionName" frontend/src/

# Посмотри похожие компоненты:
# - Column controls уже работают
# - Section controls уже работают
# - Используй их как reference для новых фич
```

### 3. Тестируй в разных layouts

```bash
# При изменении controls/styles, тестируй:
- 1 column layout (широкие блоки)
- 4 column layout (узкие блоки)
- 1:2 layout (разная ширина)

# Проверяй что controls:
- Не вылезают за границы
- Центрированы правильно
- Не конфликтуют друг с другом
```

### 4. Следуй naming conventions

```typescript
// Functions:
const moveBlockUp = () => {...}        // camelCase, descriptive
const handleDragStart = () => {...}    // handle* для event handlers

// CSS classes:
.email-block                           // kebab-case
.block-controls                        // descriptive, no abbreviations
.section-drop-zone                     // clear purpose

// State:
const [selectedElement, setSelectedElement] = useState(...)
// Always pair: [value, setValue]
```

### 5. Коммиты и теги

```bash
# Коммит message format:
"Brief summary of changes

- Detailed change 1
- Detailed change 2
- Fixed: specific issue
- Added: new feature"

# Тег naming:
news_2.4  # Sequential, short, memorable
email_3.0 # Major version bump
```

### 6. CSS organization

```css
/* Group related styles together: */

/* ===== SECTION CONTROLS ===== */
.section-controls { ... }
.section-control-btn { ... }
.section-control-btn:hover { ... }

/* ===== COLUMN CONTROLS ===== */
.column-controls { ... }
.column-control-btn { ... }

/* ===== BLOCK CONTROLS ===== */
.block-controls { ... }
.block-control-btn { ... }
```

---

## 📞 Если что-то непонятно

### Где искать ответы:

1. **Архитектурные вопросы** → `EMAIL_BUILDER_AUDIT_AND_ROADMAP.md`
2. **История изменений** → `EMAIL_BUILDER_PRO_PROGRESS.md`
3. **Общий контекст** → `PROJECT_CONTEXT.md`
4. **Конкретные фичи** → `docs/EMAIL_SYSTEM_STAGE_*.md`

### Что делать если:

**"Не понимаю как работает pixel-based columns"**
→ Читай EMAIL_BUILDER_PRO_PROGRESS.md, Section "Pixel-based Column System"

**"Не понимаю почему `:has()` используется"**
→ Читай EMAIL_BUILDER_PRO_PROGRESS.md, Section "Control Systems Architecture"

**"Не понимаю roadmap"**
→ Читай EMAIL_BUILDER_AUDIT_AND_ROADMAP.md полностью (40 минут)

**"Нужен код example для новой фичи"**
→ EMAIL_BUILDER_AUDIT_AND_ROADMAP.md содержит code snippets для всех planned features

---

## 🎯 Финальный чеклист перед началом работы

### ✅ Обязательно прочитано:
- [ ] PROJECT_CONTEXT.md (15 минут)
- [ ] EMAIL_BUILDER_PRO_PROGRESS.md (25 минут)
- [ ] EMAIL_BUILDER_AUDIT_AND_ROADMAP.md (40 минут)

### ✅ Понимаю ключевые концепции:
- [ ] Pixel-based column system
- [ ] Triple control system (section/column/block)
- [ ] Dark theme application (canvas stays white!)
- [ ] 6 section layouts math
- [ ] `:has()` selector usage для control collision

### ✅ Знаю что делать дальше:
- [ ] Priority 1: Image upload, Save/Load, Button alignment
- [ ] Priority 2: More blocks, Templates, Mobile responsive
- [ ] Priority 3: A/B testing, AI assistant

### ✅ Технические детали:
- [ ] Знаю где находятся главные файлы
- [ ] Понимаю как запустить проект
- [ ] Знаю админ credentials (admin@wekey.tools / admin123)
- [ ] Понимаю git workflow (tags news_2.X)

---

## 🚀 Поехали!

Когда прочитал все документы и готов начать:

1. **Выбери задачу** из Priority 1 (рекомендую: Save/Load system - самое критичное)
2. **Создай ветку**: `git checkout -b feature/save-load-system`
3. **Изучи reference** в EMAIL_BUILDER_AUDIT_AND_ROADMAP.md для выбранной фичи
4. **Начни с малого** - сначала backend API, потом frontend integration
5. **Тестируй часто** - после каждого небольшого изменения
6. **Коммить часто** - не жди пока "все готово"
7. **Создай тег** когда фича working: `git tag news_2.4`

**Удачи!** 🎉

---

**P.S.** Если найдешь баги в существующем коде или улучшения, которые не описаны в roadmap - обнови EMAIL_BUILDER_PRO_PROGRESS.md в секции "Lessons Learned" для следующего агента!

**P.P.S.** Предыдущий агент (я) работал 2 дня над news_2.0-2.3. Много времени ушло на CSS refinement и perfect UX для controls. Результат получился хороший, но еще много работы впереди. Keep going! 💪
