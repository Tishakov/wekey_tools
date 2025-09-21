#!/usr/bin/env node

// Скрипт для глобального исправления названий инструментов
// Использует h1 со страниц инструментов как источник истины

const fs = require('fs');

// Маппинг правильных названий на основе h1 заголовков страниц
const correctNames = {
  // Из аудита - h1 названия со страниц (источник истины)
  'add-symbol': 'Добавление символа',
  'case-changer': 'Изменения регистра',
  'char-counter': 'Количество символов', 
  'cross-analytics': 'Сквозная аналитика',
  'duplicate-finder': 'Поиск дубликатов',
  'remove-duplicates': 'Удаление дубликатов', // duplicateremoval
  'remove-empty-lines': 'Удаление пустых строк', // emptylinesremoval
  'emoji': 'Эмодзи',
  'find-replace': 'Найти и заменить',
  'match-types': 'Типы соответствия', // matchtypes
  'minus-words': 'Обработка минус-слов', // minuswords
  'number-generator': 'Генератор чисел',
  'password-generator': 'Генератор паролей',
  'remove-line-breaks': 'Удаление переносов', // removelinebreaks
  'spaces-to-paragraphs': 'Пробелы на абзацы', // spacestoparagraphs
  'synonym-generator': 'Генератор синонимов',
  'text-by-columns': 'Текст по столбцам', // textbycolumns
  'text-generator': 'Генератор текста',
  'text-optimizer': 'Оптимизатор текста', // textoptimizer
  'text-sorting': 'Сортировка слов и строк', // textsorting
  'text-to-html': 'Текст в HTML', // texttohtml
  'transliteration': 'Транслитерация',
  'utm-generator': 'Генератор UTM-меток', // utmgenerator
  'word-declension': 'Склонение слов', // wordinflection
  'word-gluing': 'Склейка слов', // wordgluing
  'word-mixer': 'Миксация слов' // wordmixer
};

// Английские переводы (логические)
const englishNames = {
  'add-symbol': 'Add Symbol',
  'case-changer': 'Case Changer',
  'char-counter': 'Character Counter',
  'cross-analytics': 'Cross Analytics',
  'duplicate-finder': 'Duplicate Finder',
  'remove-duplicates': 'Remove Duplicates',
  'remove-empty-lines': 'Remove Empty Lines',
  'emoji': 'Emoji',
  'find-replace': 'Find & Replace',
  'match-types': 'Match Types',
  'minus-words': 'Minus Words',
  'number-generator': 'Number Generator',
  'password-generator': 'Password Generator',
  'remove-line-breaks': 'Remove Line Breaks',
  'spaces-to-paragraphs': 'Spaces to Paragraphs',
  'synonym-generator': 'Synonym Generator',
  'text-by-columns': 'Text by Columns',
  'text-generator': 'Text Generator',
  'text-optimizer': 'Text Optimizer',
  'text-sorting': 'Text Sorting',
  'text-to-html': 'Text to HTML',
  'transliteration': 'Transliteration',
  'utm-generator': 'UTM Generator',
  'word-declension': 'Word Declension',
  'word-gluing': 'Word Gluing',
  'word-mixer': 'Word Mixer'
};

// Украинские переводы (логические)
const ukrainianNames = {
  'add-symbol': 'Додавання символу',
  'case-changer': 'Зміна регістру',
  'char-counter': 'Кількість символів',
  'cross-analytics': 'Наскрізна аналітика',
  'duplicate-finder': 'Пошук дублікатів',
  'remove-duplicates': 'Видалення дублікатів',
  'remove-empty-lines': 'Видалення порожніх рядків',
  'emoji': 'Емодзі',
  'find-replace': 'Знайти та замінити',
  'match-types': 'Типи відповідностей',
  'minus-words': 'Обробка мінус-слів',
  'number-generator': 'Генератор чисел',
  'password-generator': 'Генератор паролів',
  'remove-line-breaks': 'Видалення переносів',
  'spaces-to-paragraphs': 'Пробіли на абзаци',
  'synonym-generator': 'Генератор синонімів',
  'text-by-columns': 'Текст по колонках',
  'text-generator': 'Генератор тексту',
  'text-optimizer': 'Оптимізатор тексту',
  'text-sorting': 'Сортування слів та рядків',
  'text-to-html': 'Текст в HTML',
  'transliteration': 'Транслітерація',
  'utm-generator': 'Генератор UTM-міток',
  'word-declension': 'Відмінювання слів',
  'word-gluing': 'Склеювання слів',
  'word-mixer': 'Міксування слів'
};

function fixTranslations() {
  console.log('🔧 Исправляем переводы...\n');
  
  const files = [
    { path: './frontend/src/i18n/locales/ru.json', names: correctNames, lang: 'ru' },
    { path: './frontend/src/i18n/locales/en.json', names: englishNames, lang: 'en' },
    { path: './frontend/src/i18n/locales/uk.json', names: ukrainianNames, lang: 'uk' }
  ];
  
  files.forEach(({ path, names, lang }) => {
    if (!fs.existsSync(path)) {
      console.log(`⚠️ Файл не найден: ${path}`);
      return;
    }
    
    console.log(`📝 Обрабатываем ${lang.toUpperCase()}...`);
    
    const content = JSON.parse(fs.readFileSync(path, 'utf8'));
    let changesMade = 0;
    
    // Обновляем названия инструментов
    if (content.tools && content.tools.names) {
      for (const [toolId, correctName] of Object.entries(names)) {
        if (content.tools.names[toolId] !== correctName) {
          const oldName = content.tools.names[toolId] || '❌ НЕТ';
          content.tools.names[toolId] = correctName;
          console.log(`  ✏️ ${toolId}: "${oldName}" → "${correctName}"`);
          changesMade++;
        }
      }
    }
    
    // Сохраняем
    fs.writeFileSync(path, JSON.stringify(content, null, 2), 'utf8');
    console.log(`✅ ${lang.toUpperCase()}: ${changesMade} изменений\n`);
  });
}

function fixToolsConfig() {
  console.log('⚙️ Исправляем toolsConfig.ts...\n');
  
  const configPath = './frontend/src/utils/toolsConfig.ts';
  if (!fs.existsSync(configPath)) {
    console.log('⚠️ toolsConfig.ts не найден');
    return;
  }
  
  let content = fs.readFileSync(configPath, 'utf8');
  let changesMade = 0;
  
  // Обновляем title для каждого инструмента
  for (const [toolId, correctName] of Object.entries(correctNames)) {
    const regex = new RegExp(`(id: '${toolId}',\\s*title: ')([^']+)(')`, 'g');
    
    content = content.replace(regex, (match, p1, currentTitle, p3) => {
      if (currentTitle !== correctName) {
        console.log(`  ✏️ ${toolId}: "${currentTitle}" → "${correctName}"`);
        changesMade++;
        return p1 + correctName + p3;
      }
      return match;
    });
  }
  
  fs.writeFileSync(configPath, content, 'utf8');
  console.log(`✅ toolsConfig.ts: ${changesMade} изменений\n`);
}

function fixToolsRegistry() {
  console.log('📋 Исправляем toolsRegistry.ts...\n');
  
  const registryPath = './frontend/src/utils/toolsRegistry.ts';
  if (!fs.existsSync(registryPath)) {
    console.log('⚠️ toolsRegistry.ts не найден');
    return;
  }
  
  let content = fs.readFileSync(registryPath, 'utf8');
  let changesMade = 0;
  
  // Обновляем name для каждого инструмента
  for (const [toolId, correctName] of Object.entries(correctNames)) {
    const regex = new RegExp(`('${toolId}':\\s*{[^}]*name:\\s*')([^']+)(')`, 'g');
    
    content = content.replace(regex, (match, p1, currentName, p3) => {
      if (currentName !== correctName) {
        console.log(`  ✏️ ${toolId}: "${currentName}" → "${correctName}"`);
        changesMade++;
        return p1 + correctName + p3;
      }
      return match;
    });
  }
  
  fs.writeFileSync(registryPath, content, 'utf8');
  console.log(`✅ toolsRegistry.ts: ${changesMade} изменений\n`);
}

function main() {
  console.log('🚀 ГЛОБАЛЬНОЕ ИСПРАВЛЕНИЕ НАЗВАНИЙ ИНСТРУМЕНТОВ\n');
  console.log('📄 Источник истины: h1 заголовки со страниц инструментов\n');
  
  fixTranslations();
  fixToolsConfig();
  fixToolsRegistry();
  
  console.log('🎉 Все названия инструментов синхронизированы!');
  console.log('🔄 Перезагрузите страницы для проверки результата');
}

if (require.main === module) {
  main();
}

module.exports = { correctNames, englishNames, ukrainianNames };