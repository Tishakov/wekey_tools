// Централизованный реестр инструментов
// Связывает TOOL_ID с понятными названиями

export interface ToolInfo {
  id: string;
  name: string;
  description?: string;
}

export const TOOLS_REGISTRY: Record<string, ToolInfo> = {
  // Генераторы
  'password-generator': {
    id: 'password-generator',
    name: 'Генератор паролей',
    description: 'Создание безопасных паролей'
  },
  'number-generator': {
    id: 'number-generator', 
    name: 'Генератор чисел',
    description: 'Генерация случайных чисел'
  },
  'text-generator': {
    id: 'text-generator',
    name: 'Генератор текста',
    description: 'Создание текстового контента'
  },
  'synonym-generator': {
    id: 'synonym-generator',
    name: 'Генератор синонимов',
    description: 'Поиск синонимов к словам'
  },
  'utm-generator': {
    id: 'utm-generator',
    name: 'Генератор UTM-меток',
    description: 'Создание UTM-параметров для аналитики'
  },
  'privacy-policy-generator': {
    id: 'privacy-policy-generator',
    name: 'Политика и оферта',
    description: 'Создание политики конфиденциальности и публичной оферты'
  },
  'qr-generator': {
    id: 'qr-generator',
    name: 'Генератор QR-кодов',
    description: 'Создание QR-кодов для различных типов данных'
  },

  // Обработка текста
  'case-changer': {
    id: 'case-changer',
    name: 'Изменения регистра',
    description: 'Смена регистра букв в тексте'
  },
  'find-replace': {
    id: 'find-replace',
    name: 'Найти и заменить',
    description: 'Поиск и замена текста'
  },
  'transliteration': {
    id: 'transliteration',
    name: 'Транслитерация',
    description: 'Перевод кириллицы в латиницу и обратно'
  },
  'word-mixer': {
    id: 'word-mixer',
    name: 'Миксация слов',
    description: 'Перемешивание слов в тексте'
  },
  'word-declension': {
    id: 'word-declension',
    name: 'Склонение слов',
    description: 'Изменение форм слов'
  },
  'text-optimizer': {
    id: 'text-optimizer',
    name: 'Оптимизатор текста',
    description: 'Улучшение и оптимизация текста'
  },

  // Форматирование
  'text-to-html': {
    id: 'text-to-html',
    name: 'Текст в HTML',
    description: 'Преобразование текста в HTML-разметку'
  },
  'text-by-columns': {
    id: 'text-by-columns',
    name: 'Текст по столбцам',
    description: 'Разбивка текста по колонкам'
  },
  'spaces-to-paragraphs': {
    id: 'spaces-to-paragraphs',
    name: 'Пробелы на абзацы',
    description: 'Преобразование пробелов в абзацы'
  },

  // Очистка и удаление
  'remove-line-breaks': {
    id: 'remove-line-breaks',
    name: 'Удаление переносов',
    description: 'Удаление переносов строк'
  },
  'remove-empty-lines': {
    id: 'remove-empty-lines',
    name: 'Удаление пустых строк',
    description: 'Очистка от пустых строк'
  },
  'remove-duplicates': {
    id: 'remove-duplicates',
    name: 'Удаление дубликатов',
    description: 'Удаление повторяющихся строк'
  },

  // Поиск и анализ
  'duplicate-finder': {
    id: 'duplicate-finder',
    name: 'Поиск дубликатов',
    description: 'Поиск повторяющихся элементов'
  },
  'char-counter': {
    id: 'char-counter',
    name: 'Количество символов',
    description: 'Подсчет символов и слов в тексте'
  },
  'match-types': {
    id: 'match-types',
    name: 'Типы соответствия',
    description: 'Анализ типов соответствий'
  },

  // Редактирование
  'add-symbol': {
    id: 'add-symbol',
    name: 'Добавление символа',
    description: 'Добавление символов к тексту'
  },
  'word-gluing': {
    id: 'word-gluing',
    name: 'Склейка слов',
    description: 'Объединение слов'
  },
  'text-sorting': {
    id: 'text-sorting',
    name: 'Сортировка слов и строк',
    description: 'Сортировка текстового контента'
  },
  'minus-words': {
    id: 'minus-words',
    name: 'Обработка минус-слов',
    description: 'Работа с минус-словами'
  },

  // Специальные
  'emoji': {
    id: 'emoji',
    name: 'Эмодзи',
    description: 'Работа с эмодзи и символами'
  },
  'cross-analytics': {
    id: 'cross-analytics',
    name: 'Сквозная аналитика',
    description: 'Аналитика взаимодействий'
  },
  'site-audit': {
    id: 'site-audit',
    name: 'Аудит сайта',
    description: 'Комплексный анализ технологий и аналитики сайта'
  },
  'seo-audit-pro': {
    id: 'seo-audit-pro',
    name: 'Аудит SEO PRO',
    description: 'Продвинутый анализ SEO-оптимизации сайта с расширенными возможностями'
  }
};

/**
 * Получить информацию об инструменте по его ID
 */
export function getToolInfo(toolId: string): ToolInfo | null {
  return TOOLS_REGISTRY[toolId] || null;
}

/**
 * Получить читаемое название инструмента
 */
export function getToolName(toolId: string): string {
  const tool = getToolInfo(toolId);
  return tool ? tool.name : toolId;
}

/**
 * Получить все инструменты
 */
export function getAllTools(): ToolInfo[] {
  return Object.values(TOOLS_REGISTRY);
}

/**
 * Проверить, существует ли инструмент
 */
export function isValidToolId(toolId: string): boolean {
  return toolId in TOOLS_REGISTRY;
}