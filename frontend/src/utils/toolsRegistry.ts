// Централизованный реестр инструментов
// Связывает TOOL_ID с понятными названиями

export interface ToolInfo {
  id: string;
  name: string;
  description?: string;
}

export const TOOLS_REGISTRY: Record<string, ToolInfo> = {
  // Генераторы
  'password_generator_tool': {
    id: 'password_generator_tool',
    name: 'Генератор паролей',
    description: 'Создание безопасных паролей'
  },
  'number_generator_tool': {
    id: 'number_generator_tool', 
    name: 'Генератор чисел',
    description: 'Генерация случайных чисел'
  },
  'text_generator_tool': {
    id: 'text_generator_tool',
    name: 'Генератор текста',
    description: 'Создание текстового контента'
  },
  'synonym_generator_tool': {
    id: 'synonym_generator_tool',
    name: 'Генератор синонимов',
    description: 'Поиск синонимов к словам'
  },
  'utm_generator_tool': {
    id: 'utm_generator_tool',
    name: 'Генератор UTM-меток',
    description: 'Создание UTM-параметров для аналитики'
  },

  // Обработка текста
  'case_changer_tool': {
    id: 'case_changer_tool',
    name: 'Изменение регистра',
    description: 'Смена регистра букв в тексте'
  },
  'find_replace_tool': {
    id: 'find_replace_tool',
    name: 'Найти и заменить',
    description: 'Поиск и замена текста'
  },
  'transliteration_tool': {
    id: 'transliteration_tool',
    name: 'Транслитерация',
    description: 'Перевод кириллицы в латиницу и обратно'
  },
  'word_mixer_tool': {
    id: 'word_mixer_tool',
    name: 'Миксация слов',
    description: 'Перемешивание слов в тексте'
  },
  'word_inflection_tool': {
    id: 'word_inflection_tool',
    name: 'Склонение слов',
    description: 'Изменение форм слов'
  },
  'text_optimizer_tool': {
    id: 'text_optimizer_tool',
    name: 'Оптимизатор текста',
    description: 'Улучшение и оптимизация текста'
  },

  // Форматирование
  'text_to_html_tool': {
    id: 'text_to_html_tool',
    name: 'Текст в HTML',
    description: 'Преобразование текста в HTML-разметку'
  },
  'text_by_columns_tool': {
    id: 'text_by_columns_tool',
    name: 'Текст по столбцам',
    description: 'Разбивка текста по колонкам'
  },
  'spaces_to_paragraphs_tool': {
    id: 'spaces_to_paragraphs_tool',
    name: 'Пробелы на абзацы',
    description: 'Преобразование пробелов в абзацы'
  },

  // Очистка и удаление
  'remove_line_breaks_tool': {
    id: 'remove_line_breaks_tool',
    name: 'Удаление переносов',
    description: 'Удаление переносов строк'
  },
  'empty_lines_removal_tool': {
    id: 'empty_lines_removal_tool',
    name: 'Удаление пустых строк',
    description: 'Очистка от пустых строк'
  },
  'duplicate_removal_tool': {
    id: 'duplicate_removal_tool',
    name: 'Удаление дубликатов',
    description: 'Удаление повторяющихся строк'
  },

  // Поиск и анализ
  'duplicate_finder_tool': {
    id: 'duplicate_finder_tool',
    name: 'Поиск дубликатов',
    description: 'Поиск повторяющихся элементов'
  },
  'char_counter_tool': {
    id: 'char_counter_tool',
    name: 'Количество символов',
    description: 'Подсчет символов и слов в тексте'
  },
  'match_types_tool': {
    id: 'match_types_tool',
    name: 'Типы соответствия',
    description: 'Анализ типов соответствий'
  },

  // Редактирование
  'add_symbol_tool': {
    id: 'add_symbol_tool',
    name: 'Добавление символа',
    description: 'Добавление символов к тексту'
  },
  'word_gluing_tool': {
    id: 'word_gluing_tool',
    name: 'Склейка слов',
    description: 'Объединение слов'
  },
  'text_sorting_tool': {
    id: 'text_sorting_tool',
    name: 'Сортировка слов и строк',
    description: 'Сортировка текстового контента'
  },
  'minus_words_tool': {
    id: 'minus_words_tool',
    name: 'Обработка минус-слов',
    description: 'Работа с минус-словами'
  },

  // Специальные
  'emoji_tool': {
    id: 'emoji_tool',
    name: 'Emoji',
    description: 'Работа с эмодзи и символами'
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
  // Сначала пробуем найти по оригинальному ID
  let tool = getToolInfo(toolId);
  
  // Если не нашли, пробуем найти по нормализованному имени
  if (!tool) {
    // Преобразуем нормализованное имя обратно в ID
    // password-generator -> password_generator_tool
    const possibleId = toolId.replace(/-/g, '_') + '_tool';
    tool = getToolInfo(possibleId);
  }
  
  // Если все еще не нашли, пробуем поиск по части имени
  if (!tool) {
    const toolEntries = Object.entries(TOOLS_REGISTRY);
    const found = toolEntries.find(([id]) => {
      const normalizedId = id.replace(/_tool$/, '').replace(/_/g, '-');
      return normalizedId === toolId;
    });
    if (found) {
      tool = found[1];
    }
  }
  
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