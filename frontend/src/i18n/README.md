# Internationalization (i18n) System

## 🌍 Supported Languages
- 🇷🇺 **Russian** (ru) - Default language
- 🇺🇦 **Ukrainian** (uk) - Full translation
- 🇺🇸 **English** (en) - International language

## 🚀 Quick Start

### Using translations in components:
```tsx
import { useTranslation } from 'react-i18next';

const MyComponent = () => {
  const { t } = useTranslation();
  
  return (
    <div>
      <h1>{t('header.title')}</h1>
      <p>{t('common.loading')}</p>
    </div>
  );
};
```

### Language switching:
The `LanguageSwitcher` component in header automatically handles language switching with localStorage persistence.

## 📁 Translation Files Structure

```
src/i18n/
├── config.ts          # i18n configuration
└── locales/
    ├── ru.json        # Russian translations
    ├── uk.json        # Ukrainian translations
    └── en.json        # English translations
```

## 🎯 Translation Keys Structure

```json
{
  "header": {
    "title": "Site title",
    "subtitle": "Site description"
  },
  "navigation": {
    "home": "Home",
    "tools": "Tools"
  },
  "language": {
    "switch": "Switch language",
    "russian": "Русский",
    "ukrainian": "Українська",
    "english": "English"
  },
  "tools": {
    "names": {
      "tool-id": "Tool Name"
    },
    "descriptions": {
      "tool-id": "Tool Description"
    },
    "categories": {
      "generators": "Generators"
    }
  },
  "common": {
    "loading": "Loading...",
    "error": "Error",
    "success": "Success",
    "save": "Save",
    "cancel": "Cancel"
  },
  "footer": {
    "allRightsReserved": "All rights reserved",
    "developedBy": "made by"
  }
}
```

## 🔧 Implemented Features

### ✅ Components with translations:
- **LanguageSwitcher** - Language dropdown in header
- **Sidebar** - Tool names translation
- **Home page** - Tool cards with translated names/descriptions
- **Layout** - Footer copyright text

### ✅ Translation helpers:
```tsx
// Get tool name with fallback
const getToolName = (toolId: string, fallbackTitle: string) => {
  const translationKey = `tools.names.${toolId}`;
  const translated = t(translationKey);
  return translated !== translationKey ? translated : fallbackTitle;
};

// Get tool description with fallback
const getToolDescription = (toolId: string, fallbackDescription: string) => {
  const translationKey = `tools.descriptions.${toolId}`;
  const translated = t(translationKey);
  return translated !== translationKey ? translated : fallbackDescription;
};
```

## 📋 Adding New Translations

### 1. Add to all locale files:
```json
// ru.json, uk.json, en.json
{
  "newSection": {
    "newKey": "Translation text"
  }
}
```

### 2. Use in component:
```tsx
const text = t('newSection.newKey');
```

### 3. For tool translations:
```json
{
  "tools": {
    "names": {
      "new-tool-id": "New Tool Name"
    },
    "descriptions": {
      "new-tool-id": "New Tool Description"
    }
  }
}
```

## 🎨 Language Switcher

The dropdown includes:
- Flag icons for visual identification
- Native language names
- Smooth animations
- Click-outside-to-close functionality
- Active language highlighting

## ⚙️ Configuration

Located in `src/i18n/config.ts`:
- **Default language**: Russian (ru)
- **Fallback language**: Russian (ru)
- **Detection order**: localStorage → browser → fallback
- **Storage**: localStorage for persistence

## 🚀 Performance

- **Lazy loading**: Ready for implementation
- **Namespace support**: Available for large applications
- **Bundle splitting**: Can be configured for production optimization

## 📱 Mobile Support

The language switcher is fully responsive with:
- Smaller buttons on mobile
- Touch-friendly dropdown
- Proper positioning and spacing

## 🔄 Auto-updates

Components automatically re-render when language changes thanks to:
- `useTranslation` hook integration
- Dependency arrays including `t` function
- React-i18next optimization

---

**Last Updated**: September 21, 2025  
**Version**: i18n_1.0  
**Status**: ✅ Production Ready