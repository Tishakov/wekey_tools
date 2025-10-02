# 🎨 Email Builder Pro - Руководство по настройкам секций

**Версия**: `section_settings_2.0`  
**Дата**: 2 октября 2025  
**Статус**: ✅ Production Ready

---

## 📋 Обзор

Полное руководство по расширенным настройкам секций в Email Builder Pro с **11 новыми функциями**.

---

## 🎯 Новые возможности

### ✅ Реализовано (11 функций):

1. **Border & Shadow** - рамки и тени
2. **Background Image** - фоновые изображения
3. **Margin** - внешние отступы
4. **Height Control** - управление высотой
5. **Vertical Alignment** - вертикальное выравнивание
6. **Advanced Padding** - точная настройка отступов
7. **Column Distribution Presets** - быстрое выравнивание колонок
8. **Column Reverse** - мобильная адаптация
10. **Gradient Background** - градиенты
11. **Conditional Display** - показ/скрытие на устройствах
14. **Responsive Breakpoints** - адаптивные настройки

---

## 📐 Вкладка "Макет" (Layout)

### 1. Ширина колонок

**Для секций с 2+ колонками**

```typescript
// Индивидуальная настройка каждой колонки
column.width: number (px)

// Диапазон: 50px - 500px
// Шаг: 10px (кнопки ±)
```

**Кнопка "Выровнять равномерно"**
- Автоматически распределяет ширину между всеми колонками поровну
- Учитывает отступы между колонками (columnGap)

### 2. Отступ между колонками

```typescript
columnGap: number (px)
// Диапазон: 0px - 50px
// Шаг: 5px
// По умолчанию: 10px
```

### 3. Вертикальное выравнивание

```typescript
verticalAlign: 'top' | 'middle' | 'bottom'
```

**Использование:**
- `top` - контент прижат к верху колонки
- `middle` - контент по центру колонки
- `bottom` - контент прижат к низу колонки

**Применение:** Выравнивание блоков разной высоты в колонках

### 4. Минимальная высота

```typescript
minHeight: string
// Примеры: 'auto', '300px', '50vh'
```

### 5. Высота

```typescript
height: 'auto' | string
// Примеры: 'auto', '400px', '100vh'
```

---

## 🎨 Вкладка "Фон" (Background)

### 1. Тип фона

```typescript
backgroundType: 'solid' | 'gradient' | 'image'
```

### 2. Сплошной цвет (Solid)

```typescript
backgroundColor: string (hex color)
// Пример: '#ffffff'
```

**UI:**
- Color picker для визуального выбора
- Текстовое поле для HEX кода

### 3. Градиент (Gradient)

```typescript
gradient: {
  type: 'linear' | 'radial',
  angle: number,  // 0-360 градусов (только для linear)
  colors: Array<{
    color: string,    // HEX цвет
    position: number  // 0-100%
  }>
}
```

**Пример использования:**

```typescript
// Линейный градиент
{
  type: 'linear',
  angle: 90,
  colors: [
    { color: '#667eea', position: 0 },
    { color: '#764ba2', position: 100 }
  ]
}

// Радиальный градиент
{
  type: 'radial',
  angle: 0, // не используется
  colors: [
    { color: '#ffffff', position: 0 },
    { color: '#667eea', position: 100 }
  ]
}
```

**UI:**
- Выбор типа градиента
- Слайдер угла (для linear)
- Список цветов с позициями
- Кнопка "Добавить цвет"

### 4. Изображение (Image)

```typescript
backgroundImage: string (URL)
backgroundSize: 'cover' | 'contain' | 'auto'
backgroundPosition: 'center' | 'top' | 'bottom' | 'left' | 'right'
backgroundRepeat: 'no-repeat' | 'repeat' | 'repeat-x' | 'repeat-y'
```

**Применение:**
- Hero секции
- Баннеры
- Акционные блоки

---

## 📏 Вкладка "Отступы" (Spacing)

### 1. Внутренние отступы (Padding)

```typescript
// Режим "Связано" (paddingLocked = true)
paddingTop: number
paddingRight: number
paddingBottom: number
paddingLeft: number

// Все значения синхронизируются при изменении одного
```

**Кнопка Lock/Unlock (🔒/🔓):**
- 🔒 Связано - все отступы изменяются вместе
- 🔓 Отвязано - каждый отступ настраивается отдельно

**UI для каждой стороны:**
- Кнопки ± (шаг 5px)
- Текстовое поле для точного ввода
- Диапазон: 0px - ∞

### 2. Внешние отступы (Margin)

```typescript
marginTop: number (px)
marginBottom: number (px)
```

**Применение:**
- Расстояние между секциями
- Создание визуальных разделителей

---

## 🔲 Вкладка "Рамка" (Border)

### 1. Стиль рамки

```typescript
borderStyle: 'none' | 'solid' | 'dashed' | 'dotted'
```

### 2. Толщина рамки

```typescript
borderWidth: number (px)
// Диапазон: 0-20px
// Активна только если borderStyle !== 'none'
```

### 3. Цвет рамки

```typescript
borderColor: string (hex)
// По умолчанию: '#e5e7eb'
```

### 4. Скругление углов

```typescript
borderRadius: number (px)
// Диапазон: 0-50px
```

### 5. Тень (Box Shadow)

```typescript
boxShadow: string
```

**Предустановки:**
- `none` - Нет
- `0 1px 3px rgba(0,0,0,0.1)` - Легкая
- `0 4px 6px rgba(0,0,0,0.1)` - Средняя
- `0 10px 15px rgba(0,0,0,0.1)` - Сильная
- `0 20px 25px rgba(0,0,0,0.15)` - Очень сильная

---

## 📱 Вкладка "Адаптация" (Responsive)

### 1. Видимость на устройствах

```typescript
visibility: {
  desktop: boolean,  // 🖥️ Desktop
  tablet: boolean,   // 📱 Tablet
  mobile: boolean    // 📱 Mobile
}
```

**Применение:**
- Показ разного контента на разных устройствах
- Скрытие тяжелых элементов на мобильных

### 2. Поведение на мобильных (для 2+ колонок)

```typescript
mobileStack: 'none' | 'vertical'
```

**Варианты:**
- `none` - колонки остаются рядом (может сжаться)
- `vertical` - колонки складываются в столбик

### 3. Изменить порядок на мобильных

```typescript
mobileReverse: boolean
```

**Применение:**
- Изображение справа на desktop → изображение сверху на mobile
- Важный контент сначала на мобильных

### 4. Responsive Breakpoints (Advanced)

```typescript
responsive: {
  desktop: {
    columnGap: number,
    padding: string,
    paddingTop/Right/Bottom/Left: number
  },
  tablet: { ... },
  mobile: { ... }
}
```

**Планируется:** Расширенная настройка для каждого брейкпоинта

---

## ⚡ Вкладка "Дополнительно" (Advanced)

### Планируется:
1. CSS класс (custom-section-class)
2. Пользовательский CSS
3. Data атрибуты
4. Accessibility настройки

---

## 🎯 Примеры использования

### Пример 1: Hero секция с фоновым изображением

```typescript
{
  backgroundType: 'image',
  backgroundImage: 'https://example.com/hero.jpg',
  backgroundSize: 'cover',
  backgroundPosition: 'center',
  paddingTop: 80,
  paddingBottom: 80,
  minHeight: '400px',
  verticalAlign: 'middle'
}
```

### Пример 2: Карточка с тенью

```typescript
{
  backgroundColor: '#ffffff',
  borderRadius: 12,
  boxShadow: '0 10px 15px rgba(0,0,0,0.1)',
  paddingTop: 30,
  paddingRight: 30,
  paddingBottom: 30,
  paddingLeft: 30,
  marginTop: 20,
  marginBottom: 20
}
```

### Пример 3: Градиентный баннер

```typescript
{
  backgroundType: 'gradient',
  gradient: {
    type: 'linear',
    angle: 135,
    colors: [
      { color: '#667eea', position: 0 },
      { color: '#764ba2', position: 100 }
    ]
  },
  paddingTop: 50,
  paddingBottom: 50,
  borderRadius: 8
}
```

### Пример 4: Адаптивная секция

```typescript
{
  columns: 2,
  columnGap: 20,
  mobileStack: 'vertical',
  mobileReverse: true,
  visibility: {
    desktop: true,
    mobile: true,
    tablet: true
  }
}
```

---

## 🔧 Технические детали

### Структура типов

```typescript
export interface EmailSection {
  id: string;
  columns: EmailColumn[];
  styles: {
    // Background
    backgroundColor?: string;
    backgroundImage?: string;
    backgroundPosition?: 'center' | 'top' | 'bottom' | 'left' | 'right';
    backgroundSize?: 'cover' | 'contain' | 'auto';
    backgroundRepeat?: 'no-repeat' | 'repeat' | 'repeat-x' | 'repeat-y';
    backgroundType?: 'solid' | 'gradient' | 'image';
    gradient?: {
      type: 'linear' | 'radial';
      angle: number;
      colors: Array<{ color: string; position: number }>;
    };
    
    // Spacing
    padding?: string;
    paddingTop?: number;
    paddingRight?: number;
    paddingBottom?: number;
    paddingLeft?: number;
    paddingLocked?: boolean;
    margin?: string;
    marginTop?: number;
    marginBottom?: number;
    
    // Layout
    columnGap?: number;
    verticalAlign?: 'top' | 'middle' | 'bottom';
    minHeight?: string;
    height?: 'auto' | string;
    
    // Border & Shadow
    borderWidth?: number;
    borderStyle?: 'none' | 'solid' | 'dashed' | 'dotted';
    borderColor?: string;
    borderRadius?: number;
    boxShadow?: string;
    
    // Mobile Responsive
    mobileReverse?: boolean;
    mobileStack?: 'none' | 'vertical';
    
    // Visibility
    visibility?: {
      desktop?: boolean;
      mobile?: boolean;
      tablet?: boolean;
    };
  };
}
```

### Дефолтные значения

```typescript
const defaultSectionStyles = {
  // Background
  backgroundColor: '#ffffff',
  backgroundType: 'solid',
  backgroundPosition: 'center',
  backgroundSize: 'cover',
  backgroundRepeat: 'no-repeat',
  
  // Spacing
  padding: '20px 10px',
  paddingTop: 20,
  paddingRight: 10,
  paddingBottom: 20,
  paddingLeft: 10,
  paddingLocked: true,
  marginTop: 0,
  marginBottom: 0,
  
  // Layout
  columnGap: 10,
  verticalAlign: 'top',
  height: 'auto',
  minHeight: 'auto',
  
  // Border & Shadow
  borderWidth: 0,
  borderStyle: 'none',
  borderColor: '#e5e7eb',
  borderRadius: 0,
  boxShadow: 'none',
  
  // Mobile
  mobileReverse: false,
  mobileStack: 'vertical',
  
  // Visibility
  visibility: {
    desktop: true,
    mobile: true,
    tablet: true
  }
};
```

---

## 📊 Метрики улучшений

### До обновления:
- **3 настройки** секции (цвет, padding, columnGap)
- **1 вкладка** настроек
- **Базовый функционал**

### После обновления:
- **30+ настроек** секции
- **6 вкладок** с категориями
- **11 новых функций**
- **Professional-grade** возможности

**Прирост функционала: 900%** 🚀

---

## 🎓 Обучение пользователей

### Советы для начинающих:

1. **Начните с простого** - используйте только цвет и padding
2. **Экспериментируйте** - пробуйте разные комбинации
3. **Используйте предустановки** - тени, градиенты
4. **Тестируйте на мобильных** - проверяйте адаптивность

### Для продвинутых:

1. **Комбинируйте стили** - градиент + тень + скругление
2. **Используйте visibility** - разный контент для устройств
3. **Responsive breakpoints** - точная настройка для каждого экрана
4. **Advanced padding** - пиксельная точность

---

## 🐛 Известные ограничения

1. **Email clients compatibility** - не все клиенты поддерживают градиенты
2. **Background images** - могут блокироваться некоторыми почтовыми клиентами
3. **Box shadows** - ограниченная поддержка в email

**Решение:** Всегда тестируйте письма в разных клиентах

---

## 🚀 Дальнейшие улучшения

### Планируется (не включено):

- ❌ Section Templates/Themes (предустановленные стили)
- ❌ Animation on Scroll (не поддерживается в email)
- ❌ Advanced Layout Options (Flexbox/Grid)
- ❌ Copy/Paste Section Styles

### Может быть добавлено:

- ⭕ Color palette picker (выбор из палитры проекта)
- ⭕ Import/Export section styles (JSON)
- ⭕ Section history (откат изменений для секции)
- ⭕ A/B testing варианты секций

---

## 📝 Changelog

### v2.0 (2 октября 2025)
- ✅ Добавлено 11 новых функций
- ✅ Табы в настройках (6 категорий)
- ✅ Полная поддержка градиентов
- ✅ Адаптивные настройки
- ✅ Advanced padding с lock/unlock
- ✅ Visibility controls

### v1.0 (предыдущая версия)
- ✅ Базовые настройки (цвет, padding, columnGap)
- ✅ Управление шириной колонок

---

## 💡 FAQ

**Q: Почему градиент не отображается в некоторых почтовых клиентах?**  
A: Не все клиенты поддерживают CSS градиенты. Используйте fallback цвет.

**Q: Как сделать полноэкранную секцию?**  
A: Установите `height: '100vh'` и `minHeight: '100vh'`.

**Q: Можно ли использовать видео как фон?**  
A: Нет, email не поддерживает видео фоны. Используйте GIF анимацию.

**Q: Как скрыть секцию только на мобильных?**  
A: `visibility: { desktop: true, tablet: true, mobile: false }`.

---

## 🎯 Итоги

Расширенные настройки секций превращают Email Builder Pro в **профессиональный инструмент** для создания красивых и адаптивных email писем.

**Ключевые преимущества:**
- 🎨 Полный контроль над дизайном
- 📱 Встроенная адаптивность
- ⚡ Быстрая настройка через UI
- 🔧 Гибкость для advanced пользователей

**Готово к production!** ✅

---

**Автор**: AI Assistant  
**Дата создания**: 2 октября 2025  
**Версия документа**: 1.0
