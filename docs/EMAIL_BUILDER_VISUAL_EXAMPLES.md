# 🎨 Email Builder Pro - Визуальные примеры настроек секций

**Версия**: section_settings_2.0  
**Дата**: 2 октября 2025

---

## 📋 Содержание

1. [Основные типы секций](#основные-типы-секций)
2. [Фоны и градиенты](#фоны-и-градиенты)
3. [Рамки и тени](#рамки-и-тени)
4. [Отступы и выравнивание](#отступы-и-выравнивание)
5. [Мобильная адаптация](#мобильная-адаптация)
6. [Готовые рецепты](#готовые-рецепты)

---

## 🎯 Основные типы секций

### 1. Простая секция (базовая)

```
┌─────────────────────────────────────┐
│                                     │
│         Простой текст или           │
│         контент в секции            │
│                                     │
└─────────────────────────────────────┘
```

**Настройки:**
```typescript
{
  backgroundColor: '#ffffff',
  paddingTop: 20,
  paddingBottom: 20,
  paddingLeft: 10,
  paddingRight: 10
}
```

---

### 2. Hero секция

```
┌─────────────────────────────────────┐
│░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░│
│░░░                             ░░░░░│
│░░░    🚀 Большой заголовок    ░░░░░│
│░░░       и подзаголовок        ░░░░░│
│░░░                             ░░░░░│
│░░░         [Кнопка]            ░░░░░│
│░░░                             ░░░░░│
│░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░│
└─────────────────────────────────────┘
```

**Настройки:**
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
  paddingTop: 80,
  paddingBottom: 80,
  minHeight: '400px',
  verticalAlign: 'middle',
  borderRadius: 12
}
```

---

### 3. Карточка продукта

```
    ┌───────────────────────┐
    │                       │
    │   Заголовок продукта  │
    │                       │
    │   Описание продукта   │
    │   и характеристики    │
    │                       │
    │      [Купить]         │
    │                       │
    └───────────────────────┘
        ↓ тень
```

**Настройки:**
```typescript
{
  backgroundColor: '#ffffff',
  borderStyle: 'solid',
  borderWidth: 1,
  borderColor: '#e5e7eb',
  borderRadius: 12,
  boxShadow: '0 10px 15px rgba(0,0,0,0.1)',
  paddingLocked: true,
  paddingTop: 30,
  marginTop: 20,
  marginBottom: 20
}
```

---

## 🎨 Фоны и градиенты

### Сплошной цвет

```
┌─────────────────────────┐
│████████████████████████│  <- Один цвет
│████████████████████████│
│████  Контент здесь  ████│
│████████████████████████│
└─────────────────────────┘
```

**Настройки:**
```typescript
{
  backgroundType: 'solid',
  backgroundColor: '#667eea'
}
```

---

### Линейный градиент (горизонтальный)

```
┌─────────────────────────┐
│██████░░░░░░░░░░░░      │  <- Градиент слева направо
│██████░░░░░░░░░░░░      │     Темный → Светлый
│██████  Контент  ░░░░   │
│██████░░░░░░░░░░░░      │
└─────────────────────────┘
```

**Настройки:**
```typescript
{
  backgroundType: 'gradient',
  gradient: {
    type: 'linear',
    angle: 90,  // 0° - вверх, 90° - направо, 180° - вниз
    colors: [
      { color: '#667eea', position: 0 },
      { color: '#a8b4ff', position: 100 }
    ]
  }
}
```

---

### Линейный градиент (диагональный)

```
┌─────────────────────────┐
│██                      │
│██████░░░              │  <- Диагональ 135°
│██████░░░░░░░░░        │
│      ░░░░░░░░░░░░░    │
│            ░░░░░░░░░░ │
└─────────────────────────┘
```

**Настройки:**
```typescript
{
  gradient: {
    type: 'linear',
    angle: 135,  // Диагональ
    colors: [
      { color: '#667eea', position: 0 },
      { color: '#764ba2', position: 100 }
    ]
  }
}
```

---

### Радиальный градиент

```
┌─────────────────────────┐
│         ░░░░░░░        │
│      ░░░░░░░░░░░░░     │  <- Из центра наружу
│    ░░░░░██████░░░░░    │
│      ░░░░░░░░░░░░░     │
│         ░░░░░░░        │
└─────────────────────────┘
```

**Настройки:**
```typescript
{
  gradient: {
    type: 'radial',
    colors: [
      { color: '#667eea', position: 0 },   // Центр
      { color: '#764ba2', position: 100 }  // Края
    ]
  }
}
```

---

### Многоцветный градиент

```
┌─────────────────────────┐
│██░░░░▓▓▓▓▓▓████        │  <- 4 цвета
│██░░░░▓▓▓▓▓▓████        │
│██  Контент  ████        │
└─────────────────────────┘
```

**Настройки:**
```typescript
{
  gradient: {
    type: 'linear',
    angle: 90,
    colors: [
      { color: '#667eea', position: 0 },
      { color: '#a8b4ff', position: 33 },
      { color: '#764ba2', position: 66 },
      { color: '#f093fb', position: 100 }
    ]
  }
}
```

---

### Фоновое изображение

```
┌─────────────────────────┐
│ 🏔️ 🌲 ☁️ 🌤️         │
│                         │
│   Текст поверх          │  <- Изображение как фон
│   изображения           │
│                         │
└─────────────────────────┘
```

**Настройки:**
```typescript
{
  backgroundType: 'image',
  backgroundImage: 'https://example.com/image.jpg',
  backgroundSize: 'cover',     // Растянуть
  backgroundPosition: 'center', // По центру
  backgroundRepeat: 'no-repeat'
}
```

---

## 🔲 Рамки и тени

### Без рамки и тени (по умолчанию)

```
┌─────────────────────────┐
│                         │
│      Обычный блок       │
│                         │
└─────────────────────────┘
```

---

### Сплошная рамка

```
╔═════════════════════════╗
║                         ║
║    Блок с рамкой       ║
║                         ║
╚═════════════════════════╝
```

**Настройки:**
```typescript
{
  borderStyle: 'solid',
  borderWidth: 2,
  borderColor: '#667eea'
}
```

---

### Пунктирная рамка

```
┌ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ┐
│                         │
│   Пунктирная рамка     │
│                         │
└ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ┘
```

**Настройки:**
```typescript
{
  borderStyle: 'dashed',
  borderWidth: 2,
  borderColor: '#c5cae9'
}
```

---

### Рамка со скруглением

```
    ╭───────────────────╮
    │                   │
    │  Скругленные углы │
    │                   │
    ╰───────────────────╯
```

**Настройки:**
```typescript
{
  borderStyle: 'solid',
  borderWidth: 1,
  borderColor: '#e5e7eb',
  borderRadius: 12
}
```

---

### Легкая тень

```
┌─────────────────────────┐
│                         │
│   Блок с легкой тенью  │
│                         │
└─────────────────────────┘
  ░░░░░░░░░░░░░░░░░░░░░░░
```

**Настройки:**
```typescript
{
  boxShadow: '0 1px 3px rgba(0,0,0,0.1)'
}
```

---

### Средняя тень

```
┌─────────────────────────┐
│                         │
│  Блок со средней тенью │
│                         │
└─────────────────────────┘
   ░░░░░░░░░░░░░░░░░░░░░
    ░░░░░░░░░░░░░░░░░░░
```

**Настройки:**
```typescript
{
  boxShadow: '0 4px 6px rgba(0,0,0,0.1)'
}
```

---

### Карточка (рамка + тень + скругление)

```
    ╭───────────────────╮
    │                   │
    │  Красивая карточка│
    │                   │
    ╰───────────────────╯
      ░░░░░░░░░░░░░░░░
       ░░░░░░░░░░░░░░
```

**Настройки:**
```typescript
{
  backgroundColor: '#ffffff',
  borderStyle: 'solid',
  borderWidth: 1,
  borderColor: '#e5e7eb',
  borderRadius: 12,
  boxShadow: '0 10px 15px rgba(0,0,0,0.1)'
}
```

---

## 📏 Отступы и выравнивание

### Padding (внутренние отступы)

```
┌─────────────────────────┐
│ ↕ Top                   │ <- paddingTop
│←→ ┌───────────────┐ ←→ │ <- paddingLeft/Right
│   │   Контент     │     │
│   └───────────────┘     │
│ ↕ Bottom                │ <- paddingBottom
└─────────────────────────┘
```

**Locked режим (🔒):**
```typescript
{
  paddingLocked: true,
  paddingTop: 20,    // ← Все меняются вместе
  paddingRight: 20,
  paddingBottom: 20,
  paddingLeft: 20
}
```

**Unlocked режим (🔓):**
```typescript
{
  paddingLocked: false,
  paddingTop: 40,    // ← Можно разные
  paddingRight: 20,
  paddingBottom: 10,
  paddingLeft: 20
}
```

---

### Margin (внешние отступы)

```
      ↕ marginTop
┌─────────────────────┐
│   Секция 1          │
└─────────────────────┘
      ↕ marginBottom

      ↕ marginTop
┌─────────────────────┐
│   Секция 2          │
└─────────────────────┘
```

**Настройки:**
```typescript
{
  marginTop: 20,    // Расстояние от предыдущей
  marginBottom: 20  // Расстояние до следующей
}
```

---

### Вертикальное выравнивание (2 колонки)

**Top (по умолчанию):**
```
┌───────────┬───────────┐
│ Короткий  │ Длинный   │
│ текст     │ текст     │
│           │ еще       │
│           │ больше    │
│           │ текста    │
└───────────┴───────────┘
```

**Middle:**
```
┌───────────┬───────────┐
│           │ Длинный   │
│ Короткий  │ текст     │
│ текст     │ еще       │
│           │ больше    │
│           │ текста    │
└───────────┴───────────┘
```

**Bottom:**
```
┌───────────┬───────────┐
│           │ Длинный   │
│           │ текст     │
│           │ еще       │
│ Короткий  │ больше    │
│ текст     │ текста    │
└───────────┴───────────┘
```

**Настройки:**
```typescript
{
  verticalAlign: 'top' | 'middle' | 'bottom'
}
```

---

## 📱 Мобильная адаптация

### Desktop → Mobile (стандартное поведение)

**Desktop (2 колонки):**
```
┌──────────────┬──────────────┐
│   Текст      │  Изображение │
│              │              │
└──────────────┴──────────────┘
```

**Mobile (mobileStack: 'vertical'):**
```
┌────────────────────────────┐
│         Текст              │
│                            │
└────────────────────────────┘
┌────────────────────────────┐
│      Изображение           │
│                            │
└────────────────────────────┘
```

---

### Mobile Reverse (изменение порядка)

**Desktop:**
```
┌──────────────┬──────────────┐
│   Текст      │  Изображение │
│              │              │
└──────────────┴──────────────┘
```

**Mobile (mobileReverse: true):**
```
┌────────────────────────────┐
│      Изображение           │ <- Сначала картинка
│                            │
└────────────────────────────┘
┌────────────────────────────┐
│         Текст              │ <- Потом текст
│                            │
└────────────────────────────┘
```

**Настройки:**
```typescript
{
  mobileStack: 'vertical',
  mobileReverse: true
}
```

---

### Conditional Display (скрытие на устройствах)

**Показывать только на Desktop:**
```typescript
{
  visibility: {
    desktop: true,   // ✅ Видно
    tablet: false,   // ❌ Скрыто
    mobile: false    // ❌ Скрыто
  }
}
```

**Показывать только на Mobile:**
```typescript
{
  visibility: {
    desktop: false,  // ❌ Скрыто
    tablet: false,   // ❌ Скрыто
    mobile: true     // ✅ Видно
  }
}
```

---

## 🎯 Готовые рецепты

### 1. Промо баннер с градиентом

```
╔═══════════════════════════════════╗
║░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░║
║░░░                           ░░░░░║
║░░░   🎉 Скидка 50%!          ░░░░░║
║░░░   Только сегодня          ░░░░░║
║░░░                           ░░░░░║
║░░░      [Купить сейчас]      ░░░░░║
║░░░                           ░░░░░║
║░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░║
╚═══════════════════════════════════╝
```

```typescript
{
  backgroundType: 'gradient',
  gradient: {
    type: 'linear',
    angle: 135,
    colors: [
      { color: '#FF6B6B', position: 0 },
      { color: '#FFE66D', position: 100 }
    ]
  },
  borderStyle: 'solid',
  borderWidth: 3,
  borderColor: '#FF6B6B',
  borderRadius: 12,
  paddingTop: 40,
  paddingBottom: 40,
  marginTop: 20,
  marginBottom: 20
}
```

---

### 2. Секция с фоновым изображением

```
┌─────────────────────────────┐
│ 🏔️ 🌲 ☁️ 🌤️ 🌲 🏔️      │
│                             │
│ ┌─────────────────────┐    │
│ │  Наш новый продукт  │    │
│ │                     │    │
│ └─────────────────────┘    │
│                             │
└─────────────────────────────┘
```

```typescript
{
  backgroundType: 'image',
  backgroundImage: 'https://example.com/hero.jpg',
  backgroundSize: 'cover',
  backgroundPosition: 'center',
  paddingTop: 80,
  paddingBottom: 80,
  minHeight: '500px',
  verticalAlign: 'middle'
}
```

---

### 3. Элегантная карточка с тенью

```
      ╭─────────────────────╮
      │                     │
      │   Название товара   │
      │                     │
      │   Цена: 999₽       │
      │                     │
      │    [В корзину]     │
      │                     │
      ╰─────────────────────╯
        ░░░░░░░░░░░░░░░░
         ░░░░░░░░░░░░░░
```

```typescript
{
  backgroundColor: '#ffffff',
  borderStyle: 'solid',
  borderWidth: 1,
  borderColor: '#f0f0f0',
  borderRadius: 16,
  boxShadow: '0 20px 25px rgba(0,0,0,0.15)',
  paddingLocked: true,
  paddingTop: 40,
  marginTop: 30,
  marginBottom: 30
}
```

---

### 4. Две колонки с разделителем

```
┌──────────────────────────────┐
│          │                   │
│  Текст   │   Изображение     │
│          │                   │
│          │                   │
└──────────────────────────────┘
    ↑
  20px gap
```

```typescript
{
  columns: 2,
  columnGap: 20,
  borderStyle: 'solid',
  borderWidth: 0,  // Без внешней рамки
  verticalAlign: 'middle',
  paddingTop: 30,
  paddingBottom: 30
}
```

---

### 5. Адаптивная Hero секция

**Desktop:**
```
┌─────────────────────────────────┐
│░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░│
│░░░ [Текст]  │  [Изображение]░░░│
│░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░│
└─────────────────────────────────┘
```

**Mobile:**
```
┌───────────────────┐
│░░░░░░░░░░░░░░░░░░░│
│░░[Изображение]░░░░│
│░░░░░░░░░░░░░░░░░░░│
└───────────────────┘
┌───────────────────┐
│░░░░░░░░░░░░░░░░░░░│
│░░░░[Текст]░░░░░░░░│
│░░░░░░░░░░░░░░░░░░░│
└───────────────────┘
```

```typescript
{
  backgroundType: 'gradient',
  gradient: {
    type: 'linear',
    angle: 90,
    colors: [
      { color: '#667eea', position: 0 },
      { color: '#764ba2', position: 100 }
    ]
  },
  columns: 2,
  columnGap: 30,
  paddingTop: 60,
  paddingBottom: 60,
  minHeight: '400px',
  verticalAlign: 'middle',
  borderRadius: 12,
  
  // Мобильная адаптация
  mobileStack: 'vertical',
  mobileReverse: true,
  
  // Visibility
  visibility: {
    desktop: true,
    mobile: true,
    tablet: true
  }
}
```

---

## 💡 Советы по дизайну

### Цветовые комбинации

**Профессиональные:**
- `#667eea` + `#764ba2` - Фиолетовый градиент
- `#56ab2f` + `#a8e063` - Зеленый градиент
- `#FF6B6B` + `#FFE66D` - Теплый градиент

**Корпоративные:**
- `#0066ff` + `#ffffff` - Синий + белый
- `#2d3748` + `#edf2f7` - Темный + светлый

### Отступы

**Стандартные значения:**
- Маленькие: 10-15px
- Средние: 20-30px
- Большие: 40-60px
- Hero: 80-100px

### Тени

**Когда использовать:**
- Карточки товаров
- Модальные окна
- Акцентные блоки
- Кнопки (hover state)

**Когда НЕ использовать:**
- Фоновые секции
- Inline элементы
- В большом количестве

---

## 🎓 От простого к сложному

### Уровень 1: Новичок
```typescript
{
  backgroundColor: '#ffffff',
  paddingTop: 20,
  paddingBottom: 20
}
```

### Уровень 2: Средний
```typescript
{
  backgroundColor: '#ffffff',
  borderRadius: 8,
  boxShadow: '0 4px 6px rgba(0,0,0,0.1)',
  paddingTop: 30,
  paddingBottom: 30,
  marginTop: 20
}
```

### Уровень 3: Продвинутый
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
  borderRadius: 12,
  boxShadow: '0 10px 15px rgba(0,0,0,0.1)',
  paddingTop: 50,
  paddingBottom: 50,
  verticalAlign: 'middle'
}
```

### Уровень 4: Профи
```typescript
{
  backgroundType: 'image',
  backgroundImage: 'hero.jpg',
  backgroundSize: 'cover',
  gradient: {  // Overlay
    type: 'linear',
    angle: 180,
    colors: [
      { color: 'rgba(102, 126, 234, 0.8)', position: 0 },
      { color: 'rgba(118, 75, 162, 0.8)', position: 100 }
    ]
  },
  borderRadius: 16,
  paddingLocked: false,
  paddingTop: 80,
  paddingBottom: 100,
  minHeight: '500px',
  verticalAlign: 'middle',
  mobileStack: 'vertical',
  mobileReverse: true
}
```

---

## 📚 Дополнительные ресурсы

- **Полное руководство**: `EMAIL_BUILDER_SECTION_SETTINGS_GUIDE.md`
- **Быстрая шпаргалка**: `QUICK_EMAIL_BUILDER_SECTION_GUIDE.md`
- **Вдохновение**: Really Good Emails, Mailchimp Templates

---

**Удачи в создании красивых писем!** 💌

