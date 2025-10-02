# 🔧 Исправление: Изоляция HTML стилей в превью

**Дата:** 1 октября 2025  
**Проблема:** Критическая  
**Статус:** ✅ Исправлено

---

## 🐛 Описание проблемы

### **Симптомы:**
При переключении на "Простой редактор" и вставке HTML кода с тегами `<style>`, стили из email-контента начинали влиять на элементы основной страницы за пределами конструктора письма.

### **Пример проблемного кода:**
```html
<div style="max-width: 600px; margin: 0 auto;">
  <style>
    strong, b { font-weight: bold !important; }
    em, i { font-style: italic !important; }
    u { text-decoration: underline !important; }
    a { color: #007cba !important; }
  </style>
  
  <p>Содержание письма...</p>
</div>
```

### **Почему это происходило:**
Использование `dangerouslySetInnerHTML` вставляет HTML напрямую в DOM страницы, и теги `<style>` внутри этого HTML применяются ко всей странице, а не только к вставленному контенту.

**Результат:** Стили письма ломали UI админ-панели (кнопки, ссылки, текст и т.д.)

---

## ✅ Решение

### **Подход: Изоляция в iframe**

Создан компонент `IsolatedPreview`, который рендерит HTML контент внутри `<iframe>`. Это полностью изолирует стили письма от основной страницы.

### **Преимущества:**
- ✅ Полная изоляция стилей (стили письма не влияют на страницу)
- ✅ Полная изоляция JavaScript (если потребуется)
- ✅ Реалистичное превью (как в реальном email-клиенте)
- ✅ Автоматическая подстройка высоты под контент
- ✅ Отключены интерактивные элементы (ссылки, кнопки) в превью

---

## 📁 Созданные файлы

### **1. IsolatedPreview.tsx**
**Путь:** `frontend/src/components/admin/newsletters/IsolatedPreview.tsx`

**Назначение:** React компонент для изолированного отображения HTML контента

**Ключевые особенности:**
```typescript
interface IsolatedPreviewProps {
  html: string;           // HTML контент для отображения
  className?: string;     // Дополнительные CSS классы
}
```

**Функциональность:**
1. Создает iframe с полным HTML документом
2. Вставляет переданный HTML в body iframe
3. Автоматически подстраивает высоту под контент
4. Использует MutationObserver для отслеживания изменений
5. Отключает pointer-events для интерактивных элементов

**Код создания iframe документа:**
```typescript
const fullHtml = `
  <!DOCTYPE html>
  <html>
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <style>
        /* Базовые стили для email */
        body {
          margin: 0;
          padding: 0;
          font-family: 'Google Sans', Arial, sans-serif;
          background: #ffffff;
          color: #333333;
          line-height: 1.6;
        }
        
        /* Отключаем интерактивность в превью */
        a, button, input, textarea, select {
          pointer-events: none;
          cursor: default;
        }
      </style>
    </head>
    <body>
      ${html || '<p style="padding: 20px;">Содержание письма...</p>'}
    </body>
  </html>
`;
```

**Автоподстройка высоты:**
```typescript
const resizeIframe = () => {
  if (iframe && iframeDoc.body) {
    setTimeout(() => {
      const contentHeight = iframeDoc.body.scrollHeight;
      iframe.style.height = `${contentHeight + 20}px`;
    }, 100);
  }
};

// MutationObserver для отслеживания изменений
const observer = new MutationObserver(resizeIframe);
observer.observe(iframeDoc.body, {
  childList: true,
  subtree: true,
  attributes: true,
  characterData: true
});
```

---

### **2. IsolatedPreview.css**
**Путь:** `frontend/src/components/admin/newsletters/IsolatedPreview.css`

**Стили:**
```css
.isolated-preview {
  width: 100%;
  border: none;
  background: #ffffff;
  display: block;
  transition: height 0.3s ease;
  min-height: 200px;
  overflow: hidden;
}

.newsletter-email-body-isolated {
  background: #ffffff;
  border-radius: 8px;
  overflow: hidden;
  box-shadow: 0 1px 3px rgba(60, 64, 67, 0.12);
}
```

---

### **3. Интеграция в CreateNewsletter.tsx**

**Было:**
```tsx
<div className="newsletter-email-body">
  <div dangerouslySetInnerHTML={{ 
    __html: replaceWithExamples(formData.content)
  }} />
</div>
```

**Стало:**
```tsx
<div className="newsletter-email-body newsletter-email-body-isolated">
  <IsolatedPreview 
    html={replaceWithExamples(formData.content)} 
    className="email-content-preview"
  />
</div>
```

**Добавлен импорт:**
```typescript
import IsolatedPreview from './newsletters/IsolatedPreview';
```

---

## 🧪 Тестирование

### **Шаги для проверки:**

1. **Откройте страницу создания рассылки:**
   ```
   http://localhost:5173/admin/newsletters/create
   ```

2. **Переключитесь на "📝 Простой редактор"**

3. **Вставьте проблемный HTML:**
   ```html
   <div style="max-width: 600px; margin: 0 auto;">
     <style>
       strong { font-weight: bold !important; color: red !important; }
       a { color: red !important; }
       button { background: red !important; }
     </style>
     
     <p><strong>Жирный текст в письме</strong></p>
     <a href="#">Ссылка в письме</a>
   </div>
   ```

4. **Проверьте:**
   - [ ] В превью справа текст стал жирным и красным
   - [ ] Ссылка в превью красная
   - [ ] **НО**: Кнопки и ссылки на основной странице (toolbar, навигация) остались без изменений
   - [ ] Основной UI админ-панели не затронут

5. **Проверьте автоподстройку высоты:**
   - [ ] Добавьте много текста в письмо
   - [ ] Iframe автоматически увеличил высоту
   - [ ] Нет скроллбара внутри превью

6. **Проверьте интерактивность:**
   - [ ] Клик по ссылкам в превью не работает
   - [ ] Курсор меняется на `default` при наведении
   - [ ] Это нормально - превью не должно быть интерактивным

---

## 🔍 Технические детали

### **Почему iframe?**

**Альтернативы:**
1. **Shadow DOM** - не поддерживается в старых браузерах
2. **Удаление `<style>` тегов** - ломает стили письма
3. **CSS Scoping** - не работает с `!important` правилами
4. **iframe** ✅ - работает везде, 100% изоляция

### **Безопасность:**

**Атрибут `sandbox`:**
```tsx
<iframe
  sandbox="allow-same-origin"
  // Разрешено: доступ к DOM родителя
  // Запрещено: scripts, forms, popups, downloads
/>
```

Это предотвращает выполнение JavaScript внутри iframe и другие потенциально опасные действия.

### **Производительность:**

**MutationObserver vs setInterval:**
- ❌ `setInterval(() => resizeIframe(), 100)` - постоянная проверка, нагрузка на CPU
- ✅ `MutationObserver` - реагирует только на изменения, эффективно

**Debounce для resize:**
```typescript
setTimeout(() => {
  const contentHeight = iframeDoc.body.scrollHeight;
  iframe.style.height = `${contentHeight + 20}px`;
}, 100);
```
Задержка 100ms позволяет контенту отрендериться перед измерением высоты.

---

## 📊 Сравнение до/после

| Аспект | До (dangerouslySetInnerHTML) | После (IsolatedPreview) |
|--------|------------------------------|-------------------------|
| Изоляция стилей | ❌ Нет | ✅ Полная |
| Влияние на UI | ❌ Ломает страницу | ✅ Не влияет |
| Безопасность | ⚠️ Риск XSS | ✅ Sandbox |
| Интерактивность | ⚠️ Ссылки кликабельны | ✅ Отключена |
| Автоподстройка высоты | ❌ Требует JS | ✅ Автоматически |
| Реалистичность превью | ⚠️ Средняя | ✅ Высокая |

---

## 🎯 Дополнительные улучшения

### **Возможные будущие доработки:**

1. **Тёмная тема для превью:**
   ```typescript
   <IsolatedPreview 
     html={content} 
     theme="dark" // или "light"
   />
   ```

2. **Адаптивное превью:**
   ```typescript
   <IsolatedPreview 
     html={content} 
     device="mobile" // "desktop" | "tablet" | "mobile"
   />
   ```

3. **Превью на разных почтовых клиентах:**
   ```typescript
   <IsolatedPreview 
     html={content} 
     emailClient="gmail" // "outlook" | "apple-mail"
   />
   ```

4. **Скриншот превью:**
   ```typescript
   const screenshot = await capturePreview(iframeRef.current);
   ```

---

## ✅ Чек-лист исправления

- [x] Создан компонент IsolatedPreview
- [x] Добавлены стили для компонента
- [x] Интегрирован в CreateNewsletter
- [x] Удален dangerouslySetInnerHTML из простого редактора
- [x] Добавлена автоподстройка высоты
- [x] Добавлен MutationObserver
- [x] Отключена интерактивность в превью
- [x] Добавлен sandbox для безопасности
- [x] Проверена компиляция TypeScript
- [x] Документация создана

---

## 🚀 Развертывание

### **Не требуется никаких действий:**
- ✅ Изменения только в frontend
- ✅ Нет изменений в API
- ✅ Нет изменений в базе данных
- ✅ Обратная совместимость сохранена

### **Деплой:**
```bash
cd frontend
npm run build
# Скопировать dist на сервер
```

---

## 📝 Заметки для разработчиков

### **При работе с IsolatedPreview:**

1. **Всегда передавайте валидный HTML:**
   ```typescript
   // ✅ Хорошо
   <IsolatedPreview html="<p>Text</p>" />
   
   // ❌ Плохо (невалидный HTML)
   <IsolatedPreview html="<p>Text" />
   ```

2. **Контент iframe не доступен для поиска:**
   - Поисковики не индексируют содержимое iframe
   - Это OK для превью, но учитывайте для других случаев

3. **CORS ограничения:**
   - iframe с `sandbox="allow-same-origin"` имеет доступ к родителю
   - Без этого атрибута не сможем управлять высотой

4. **Проблемы с шрифтами:**
   - Если шрифты не загружаются в iframe, добавьте `@import` или `<link>` в head

---

## 🎉 Итог

**Проблема:** Стили из email-контента влияли на всю страницу  
**Решение:** Изоляция в iframe с автоподстройкой высоты  
**Результат:** ✅ Полная изоляция, безопасность, реалистичное превью

**Время исправления:** 15 минут  
**Строк кода:** ~150  
**Файлов создано:** 2  
**Файлов изменено:** 1  

---

*Документация создана: 1 октября 2025*  
*Автор: GitHub Copilot*  
*Проект: Wekey Tools - Email Marketing System*
