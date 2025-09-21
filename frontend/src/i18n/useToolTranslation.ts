import { useTranslation } from 'react-i18next';

// Хук для работы с переводами в инструментах
export const useToolTranslation = () => {
  const { t, i18n } = useTranslation();

  // Функция для получения переведенного текста с fallback
  const getTranslated = (key: string, fallback: string = '') => {
    const translated = t(key);
    // Если перевод не найден и возвращается ключ, используем fallback
    return translated !== key ? translated : fallback;
  };

  // Сокращенные функции для общих случаев
  const common = {
    generate: () => getTranslated('common.generate', 'Генерировать'),
    copy: () => getTranslated('common.copy', 'Копировать'),
    copied: () => getTranslated('common.copied', 'Скопировано!'),
    reset: () => getTranslated('common.reset', 'Сбросить'),
    download: () => getTranslated('common.download', 'Скачать'),
    enterText: () => getTranslated('common.enter_text', 'Введите текст...'),
    result: () => getTranslated('common.result', 'Результат'),
    settings: () => getTranslated('common.settings', 'Настройки'),
    length: () => getTranslated('common.length', 'Длина'),
    count: () => getTranslated('common.count', 'Количество'),
    backToTools: () => getTranslated('common.backToTools', 'Все инструменты'),
    launchCounter: () => getTranslated('common.launchCounter', 'Счетчик запусков'),
    hints: () => getTranslated('common.hints', 'Подсказки'),
    screenshot: () => getTranslated('common.screenshot', 'Скриншот'),
    lines: () => getTranslated('common.lines', 'строк'),
    characters: () => getTranslated('common.characters', 'символов'),
    words: () => getTranslated('common.words', 'слов'),
    save: () => getTranslated('common.save', 'Сохранить'),
    cancel: () => getTranslated('common.cancel', 'Отмена'),
    clear: () => getTranslated('common.clear', 'Очистить'),
    paste: () => getTranslated('common.paste', 'Вставить'),
    upload: () => getTranslated('common.upload', 'Загрузить'),
    loading: () => getTranslated('common.loading', 'Загрузка...'),
    error: () => getTranslated('common.error', 'Ошибка'),
    success: () => getTranslated('common.success', 'Успешно')
  };

  // Функции для работы с переводами конкретных инструментов
  const passwordGenerator = {
    title: () => getTranslated('passwordGenerator.title', 'Генератор паролей'),
    passwordLength: () => getTranslated('passwordGenerator.passwordLength', 'Длина пароля:'),
    passwordLanguage: () => getTranslated('passwordGenerator.passwordLanguage', 'Язык пароля:'),
    includeLowercase: () => getTranslated('passwordGenerator.includeLowercase', 'Маленькие буквы'),
    includeUppercase: () => getTranslated('passwordGenerator.includeUppercase', 'Заглавные буквы'),
    includeNumbers: () => getTranslated('passwordGenerator.includeNumbers', 'Цифры'),
    includeSymbols: () => getTranslated('passwordGenerator.includeSymbols', 'Знаки и символы'),
    passwordCount: () => getTranslated('passwordGenerator.passwordCount', 'Количество паролей:'),
    copyError: () => getTranslated('passwordGenerator.copyError', 'Ошибка копирования:'),
    languages: {
      english: () => getTranslated('passwordGenerator.languages.english', 'Английский'),
      russian: () => getTranslated('passwordGenerator.languages.russian', 'Русский'),
      ukrainian: () => getTranslated('passwordGenerator.languages.ukrainian', 'Украинский')
    }
  };

  const textGenerator = {
    title: () => getTranslated('textGenerator.title', 'Генератор текста'),
    textLength: () => getTranslated('textGenerator.textLength', 'Длина текста:'),
    textType: () => getTranslated('textGenerator.textType', 'Тип текста:'),
    paragraphCount: () => getTranslated('textGenerator.paragraphCount', 'Количество абзацев:'),
    inputText: () => getTranslated('textGenerator.inputText', 'Введите исходный текст:'),
    types: {
      lorem: () => getTranslated('textGenerator.types.lorem', 'Lorem ipsum'),
      random: () => getTranslated('textGenerator.types.random', 'Случайный текст'),
      fish: () => getTranslated('textGenerator.types.fish', 'Рыба текст')
    }
  };

  const emojiTool = {
    title: () => getTranslated('emojiTool.title', 'Добавление эмодзи'),
    inputText: () => getTranslated('emojiTool.inputText', 'Введите текст:'),
    emojiPosition: () => getTranslated('emojiTool.emojiPosition', 'Позиция эмодзи:'),
    emojiCount: () => getTranslated('emojiTool.emojiCount', 'Количество эмодзи на слово:'),
    selectEmoji: () => getTranslated('emojiTool.selectEmoji', 'Выберите эмодзи:'),
    positions: {
      before: () => getTranslated('emojiTool.positions.before', 'Перед словом'),
      after: () => getTranslated('emojiTool.positions.after', 'После слова'),
      random: () => getTranslated('emojiTool.positions.random', 'Случайно')
    }
  };

  const caseChangerTool = {
    title: () => getTranslated('caseChangerTool.title', 'Изменение регистра'),
    inputText: () => getTranslated('caseChangerTool.inputText', 'Введите текст:'),
    options: {
      lowercase: () => getTranslated('caseChangerTool.options.lowercase', 'Нижний регистр'),
      uppercase: () => getTranslated('caseChangerTool.options.uppercase', 'Верхний регистр'),
      titleCase: () => getTranslated('caseChangerTool.options.titleCase', 'Заглавные буквы в словах'),
      sentenceCase: () => getTranslated('caseChangerTool.options.sentenceCase', 'Заглавные буквы в предложениях'),
      alternateCase: () => getTranslated('caseChangerTool.options.alternateCase', 'Переменный регистр'),
      inverseCase: () => getTranslated('caseChangerTool.options.inverseCase', 'Обратный регистр')
    }
  };

  const findReplaceTool = {
    title: () => getTranslated('findReplaceTool.title', 'Найти и заменить'),
    inputText: () => getTranslated('findReplaceTool.inputText', 'Введите текст:'),
    findText: () => getTranslated('findReplaceTool.findText', 'Найти:'),
    replaceText: () => getTranslated('findReplaceTool.replaceText', 'Заменить на:'),
    caseSensitive: () => getTranslated('findReplaceTool.caseSensitive', 'Учитывать регистр'),
    replaceAll: () => getTranslated('findReplaceTool.replaceAll', 'Заменить все'),
    matchCount: () => getTranslated('findReplaceTool.matchCount', 'Найдено совпадений:')
  };

  const letterCounterTool = {
    title: () => getTranslated('letterCounterTool.title', 'Счетчик символов'),
    inputText: () => getTranslated('letterCounterTool.inputText', 'Введите текст:'),
    charactersWithSpaces: () => getTranslated('letterCounterTool.charactersWithSpaces', 'Символов с пробелами:'),
    charactersWithoutSpaces: () => getTranslated('letterCounterTool.charactersWithoutSpaces', 'Символов без пробелов:'),
    wordsCount: () => getTranslated('letterCounterTool.wordsCount', 'Слов:'),
    linesCount: () => getTranslated('letterCounterTool.linesCount', 'Строк:'),
    paragraphsCount: () => getTranslated('letterCounterTool.paragraphsCount', 'Абзацев:')
  };

  const textSortingTool = {
    title: () => getTranslated('textSortingTool.title', 'Сортировка текста'),
    inputText: () => getTranslated('textSortingTool.inputText', 'Введите текст:'),
    sortType: () => getTranslated('textSortingTool.sortType', 'Тип сортировки:'),
    sortOptions: {
      alphabetical: () => getTranslated('textSortingTool.sortOptions.alphabetical', 'По алфавиту'),
      reverse: () => getTranslated('textSortingTool.sortOptions.reverse', 'Обратная'),
      length: () => getTranslated('textSortingTool.sortOptions.length', 'По длине'),
      random: () => getTranslated('textSortingTool.sortOptions.random', 'Случайная')
    }
  };

  const duplicateRemoverTool = {
    title: () => getTranslated('duplicateRemoverTool.title', 'Удаление дубликатов'),
    inputText: () => getTranslated('duplicateRemoverTool.inputText', 'Введите текст:'),
    duplicatesFound: () => getTranslated('duplicateRemoverTool.duplicatesFound', 'Найдено дубликатов:'),
    duplicatesRemoved: () => getTranslated('duplicateRemoverTool.duplicatesRemoved', 'Дубликаты удалены')
  };

  return {
    getTranslated,
    common,
    passwordGenerator,
    textGenerator,
    emojiTool,
    caseChangerTool,
    findReplaceTool,
    letterCounterTool,
    textSortingTool,
    duplicateRemoverTool,
    // Прямой доступ к функции перевода
    t,
    // Информация о текущем языке
    currentLanguage: i18n.language
  };
};

export default useToolTranslation;