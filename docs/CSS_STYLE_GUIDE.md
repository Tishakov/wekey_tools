# 🎨 CSS Style Guide - Wekey Tools

Полный руководство по стилям и дизайн-системе проекта Wekey Tools.

---

## 📋 Содержание

- [Основные принципы](#основные-принципы)
- [Цветовая палитра](#цветовая-палитра)
- [Типографика](#типографика)
- [Spacing система](#spacing-система)
- [Компоненты](#компоненты)
- [Анимации](#анимации)
- [Responsive Design](#responsive-design)
- [Best Practices](#best-practices)
- [Запреты](#запреты)

---

## 🎯 Основные принципы

### 1. CSS Modules
Используем CSS Modules для изоляции стилей компонентов:

```typescript
// Component.tsx
import styles from './Component.module.css';

const Component = () => (
  <div className={styles.container}>
    <h1 className={styles.title}>Hello</h1>
  </div>
);
```

```css
/* Component.module.css */
.container {
  padding: 20px;
}

.title {
  font-size: 24px;
  color: var(--primary-color);
}
```

### 2. БЭМ методология (для сложных компонентов)
```css
/* Block */
.card { }

/* Element */
.card__header { }
.card__body { }
.card__footer { }

/* Modifier */
.card--large { }
.card--highlighted { }
```

### 3. CSS Variables
Используем CSS переменные для консистентности:

```css
:root {
  --primary-color: #5E35F2;
  --secondary-color: #F22987;
  --spacing-sm: 8px;
  --spacing-md: 16px;
  --spacing-lg: 24px;
}
```

---

## 🎨 Цветовая палитра

### Основные цвета

```css
/* Primary */
--primary-start: #5E35F2;    /* Фиолетовый */
--primary-end: #F22987;      /* Розовый */
--primary-gradient: linear-gradient(135deg, #5E35F2 0%, #F22987 100%);

/* Neutral */
--white: #FFFFFF;
--black: #000000;
--gray-50: #F9FAFB;
--gray-100: #F3F4F6;
--gray-200: #E5E7EB;
--gray-300: #D1D5DB;
--gray-400: #9CA3AF;
--gray-500: #6B7280;
--gray-600: #4B5563;
--gray-700: #374151;
--gray-800: #1F2937;
--gray-900: #111827;

/* Semantic colors */
--success: #10B981;
--warning: #F59E0B;
--error: #EF4444;
--info: #3B82F6;
```

### Использование градиентов

```css
/* Основной градиент проекта */
.gradient-primary {
  background: linear-gradient(135deg, #5E35F2 0%, #F22987 100%);
}

/* Градиент для hover эффектов */
.gradient-hover {
  background: linear-gradient(135deg, #6D42FF 0%, #FF3399 100%);
}

/* Градиент для текста */
.gradient-text {
  background: linear-gradient(135deg, #5E35F2 0%, #F22987 100%);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
}
```

### Opacity модификаторы

```css
/* Прозрачность для фонов */
--primary-10: rgba(94, 53, 242, 0.1);
--primary-20: rgba(94, 53, 242, 0.2);
--primary-30: rgba(94, 53, 242, 0.3);

/* Пример использования */
.card {
  background: var(--primary-10);
  border: 1px solid var(--primary-20);
}
```

---

## ✍️ Типографика

### Шрифты

```css
/* Основной шрифт проекта */
font-family: 'Gilroy', -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', 
             'Helvetica Neue', Arial, sans-serif;

/* Моноширинный (для кода) */
font-family: 'SF Mono', Monaco, 'Cascadia Code', 'Roboto Mono', 
             Consolas, 'Courier New', monospace;
```

### Размеры шрифтов

```css
/* Заголовки */
--font-size-h1: 48px;
--font-size-h2: 40px;
--font-size-h3: 32px;
--font-size-h4: 24px;
--font-size-h5: 20px;
--font-size-h6: 18px;

/* Body text */
--font-size-xl: 20px;
--font-size-lg: 18px;
--font-size-md: 16px;
--font-size-sm: 14px;
--font-size-xs: 12px;

/* Line heights */
--line-height-tight: 1.2;
--line-height-normal: 1.5;
--line-height-relaxed: 1.75;
```

### Веса шрифтов

```css
--font-weight-light: 300;
--font-weight-normal: 400;
--font-weight-medium: 500;
--font-weight-semibold: 600;
--font-weight-bold: 700;
--font-weight-extrabold: 800;
```

### Примеры использования

```css
.page-title {
  font-family: 'Gilroy', sans-serif;
  font-size: var(--font-size-h1);
  font-weight: var(--font-weight-bold);
  line-height: var(--line-height-tight);
  background: linear-gradient(135deg, #5E35F2 0%, #F22987 100%);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
}

.body-text {
  font-family: 'Gilroy', sans-serif;
  font-size: var(--font-size-md);
  font-weight: var(--font-weight-normal);
  line-height: var(--line-height-normal);
  color: var(--gray-700);
}
```

---

## 📏 Spacing система

### Scale (8px базовая единица)

```css
--spacing-0: 0;
--spacing-1: 4px;    /* 0.5x */
--spacing-2: 8px;    /* 1x - базовая единица */
--spacing-3: 12px;   /* 1.5x */
--spacing-4: 16px;   /* 2x */
--spacing-5: 20px;   /* 2.5x */
--spacing-6: 24px;   /* 3x */
--spacing-8: 32px;   /* 4x */
--spacing-10: 40px;  /* 5x */
--spacing-12: 48px;  /* 6x */
--spacing-16: 64px;  /* 8x */
--spacing-20: 80px;  /* 10x */
--spacing-24: 96px;  /* 12x */
```

### Использование

```css
.card {
  padding: var(--spacing-6);
  margin-bottom: var(--spacing-4);
  gap: var(--spacing-3);
}

.section {
  padding: var(--spacing-16) var(--spacing-8);
}
```

---

## 🧩 Компоненты

### Кнопки

```css
/* Base button */
.button {
  font-family: 'Gilroy', sans-serif;
  font-size: var(--font-size-md);
  font-weight: var(--font-weight-semibold);
  padding: 12px 24px;
  border-radius: 8px;
  border: none;
  cursor: pointer;
  transition: all 0.3s ease;
  outline: none;
}

/* Primary button */
.button-primary {
  background: linear-gradient(135deg, #5E35F2 0%, #F22987 100%);
  color: white;
  box-shadow: 0 4px 15px rgba(94, 53, 242, 0.3);
}

.button-primary:hover {
  transform: scale(1.02);
  box-shadow: 0 6px 20px rgba(94, 53, 242, 0.4);
}

.button-primary:active {
  transform: scale(0.98);
}

/* Secondary button */
.button-secondary {
  background: white;
  color: #5E35F2;
  border: 2px solid #5E35F2;
}

.button-secondary:hover {
  background: #5E35F2;
  color: white;
}

/* Disabled state */
.button:disabled {
  opacity: 0.5;
  cursor: not-allowed;
  transform: none !important;
}
```

### Карточки

```css
.card {
  background: white;
  border-radius: 16px;
  padding: var(--spacing-6);
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.08);
  transition: all 0.3s ease;
}

.card:hover {
  transform: translateY(-4px);
  box-shadow: 0 8px 30px rgba(0, 0, 0, 0.12);
}

/* Card с градиентной границей */
.card-gradient-border {
  position: relative;
  background: white;
  border-radius: 16px;
  padding: var(--spacing-6);
}

.card-gradient-border::before {
  content: '';
  position: absolute;
  inset: -2px;
  border-radius: 16px;
  background: linear-gradient(135deg, #5E35F2 0%, #F22987 100%);
  z-index: -1;
}
```

### Инпуты

```css
.input {
  font-family: 'Gilroy', sans-serif;
  font-size: var(--font-size-md);
  padding: 12px 16px;
  border: 2px solid var(--gray-300);
  border-radius: 8px;
  outline: none;
  transition: all 0.2s ease;
  width: 100%;
}

.input:focus {
  border-color: #5E35F2;
  box-shadow: 0 0 0 3px rgba(94, 53, 242, 0.1);
}

.input::placeholder {
  color: var(--gray-400);
}

.input:disabled {
  background: var(--gray-100);
  cursor: not-allowed;
}

/* Input с ошибкой */
.input-error {
  border-color: var(--error);
}

.input-error:focus {
  box-shadow: 0 0 0 3px rgba(239, 68, 68, 0.1);
}
```

### Модальные окна

```css
.modal-overlay {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.5);
  backdrop-filter: blur(4px);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
  animation: fadeIn 0.2s ease;
}

.modal-content {
  background: white;
  border-radius: 20px;
  padding: var(--spacing-8);
  max-width: 500px;
  width: 90%;
  max-height: 90vh;
  overflow-y: auto;
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
  animation: slideUp 0.3s ease;
}

@keyframes fadeIn {
  from { opacity: 0; }
  to { opacity: 1; }
}

@keyframes slideUp {
  from {
    opacity: 0;
    transform: translateY(20px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}
```

---

## ✨ Анимации

### Transitions

```css
/* Стандартные transitions */
--transition-fast: 0.15s ease;
--transition-base: 0.2s ease;
--transition-slow: 0.3s ease;

/* Примеры */
.element {
  transition: all var(--transition-base);
}

.element:hover {
  transform: scale(1.05);
}
```

### Keyframe анимации

```css
/* Fade In */
@keyframes fadeIn {
  from {
    opacity: 0;
  }
  to {
    opacity: 1;
  }
}

/* Slide Down */
@keyframes slideDown {
  from {
    opacity: 0;
    transform: translateY(-10px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

/* Pulse */
@keyframes pulse {
  0%, 100% {
    opacity: 1;
  }
  50% {
    opacity: 0.5;
  }
}

/* Spin (для loader'ов) */
@keyframes spin {
  from {
    transform: rotate(0deg);
  }
  to {
    transform: rotate(360deg);
  }
}

/* Использование */
.fade-in {
  animation: fadeIn 0.3s ease;
}

.loader {
  animation: spin 1s linear infinite;
}
```

---

## 📱 Responsive Design

### Breakpoints

```css
/* Mobile */
--breakpoint-xs: 375px;
--breakpoint-sm: 640px;

/* Tablet */
--breakpoint-md: 768px;
--breakpoint-lg: 1024px;

/* Desktop */
--breakpoint-xl: 1280px;
--breakpoint-2xl: 1536px;
```

### Media queries

```css
/* Mobile First подход */

/* Base styles - mobile */
.container {
  padding: var(--spacing-4);
}

/* Tablet и выше */
@media (min-width: 768px) {
  .container {
    padding: var(--spacing-6);
  }
}

/* Desktop и выше */
@media (min-width: 1024px) {
  .container {
    padding: var(--spacing-8);
    max-width: 1200px;
    margin: 0 auto;
  }
}
```

### Responsive типографика

```css
.heading {
  font-size: 24px; /* Mobile */
}

@media (min-width: 768px) {
  .heading {
    font-size: 32px; /* Tablet */
  }
}

@media (min-width: 1024px) {
  .heading {
    font-size: 48px; /* Desktop */
  }
}
```

---

## ✅ Best Practices

### 1. Используйте Flexbox и Grid

```css
/* Flexbox для layout */
.flex-container {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: var(--spacing-4);
}

/* Grid для сложных layout'ов */
.grid-container {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
  gap: var(--spacing-6);
}
```

### 2. Box-sizing

```css
/* Всегда используйте border-box */
*,
*::before,
*::after {
  box-sizing: border-box;
}
```

### 3. Избегайте !important

```css
/* ❌ ПЛОХО */
.element {
  color: red !important;
}

/* ✅ ХОРОШО - увеличьте специфичность */
.container .element {
  color: red;
}
```

### 4. Используйте семантические селекторы

```css
/* ✅ ХОРОШО */
.user-card__avatar { }
.user-card__name { }

/* ❌ ПЛОХО */
.uc-av { }
.uc-n { }
```

---

## 🚫 Запреты

### 1. НЕ используйте translateY для hover

```css
/* ❌ ЗАПРЕЩЕНО - проблемы на мобильных */
.card:hover {
  transform: translateY(-5px);
}

/* ✅ АЛЬТЕРНАТИВА */
.card:hover {
  transform: scale(1.02);
  box-shadow: 0 8px 30px rgba(0, 0, 0, 0.12);
}
```

**Причина**: На мобильных устройствах `translateY` может вызывать проблемы с производительностью и визуальные глюки.

### 2. НЕ используйте inline styles

```tsx
/* ❌ ПЛОХО */
<div style={{ color: 'red', padding: '20px' }}>

/* ✅ ХОРОШО */
<div className={styles.container}>
```

### 3. НЕ используйте пиксели для всего

```css
/* ❌ ПЛОХО */
font-size: 16px;
padding: 20px;

/* ✅ ХОРОШО */
font-size: var(--font-size-md);
padding: var(--spacing-5);
```

### 4. НЕ используйте z-index > 1000 без причины

```css
/* ❌ ПЛОХО */
.element {
  z-index: 999999;
}

/* ✅ ХОРОШО - используйте логическую систему */
--z-dropdown: 100;
--z-modal: 1000;
--z-tooltip: 1100;
```

---

## 📚 Примеры готовых компонентов

### Tool Card

```css
.tool-card {
  background: white;
  border-radius: 16px;
  padding: var(--spacing-6);
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.08);
  transition: all var(--transition-base);
  cursor: pointer;
}

.tool-card:hover {
  transform: scale(1.02);
  box-shadow: 0 6px 25px rgba(94, 53, 242, 0.15);
}

.tool-card__icon {
  width: 48px;
  height: 48px;
  background: linear-gradient(135deg, #5E35F2 0%, #F22987 100%);
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-bottom: var(--spacing-4);
}

.tool-card__title {
  font-size: var(--font-size-lg);
  font-weight: var(--font-weight-semibold);
  color: var(--gray-900);
  margin-bottom: var(--spacing-2);
}

.tool-card__description {
  font-size: var(--font-size-sm);
  color: var(--gray-600);
  line-height: var(--line-height-relaxed);
}
```

---

**Последнее обновление**: 01.10.2025  
**Версия**: 1.0
