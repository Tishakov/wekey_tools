#!/usr/bin/env node

// Скрипт для исправления TOOL_ID в файлах инструментов
// Приводит их в соответствие с ID из базы данных

const fs = require('fs');
const path = require('path');

// Маппинг старых ID на новые (соответствуют базе данных)
const idMapping = {
  'password_generator_tool': 'password-generator',
  'text_generator_tool': 'text-generator',
  'char_counter_tool': 'char-counter',
  'duplicate_finder_tool': 'duplicate-finder',
  'case_changer_tool': 'case-changer',
  'add_symbol_tool': 'add-symbol',
  'empty_lines_removal_tool': 'remove-empty-lines',
  'match_types_tool': 'match-types',
  'minus_words_tool': 'minus-words',
  'number_generator_tool': 'number-generator',
  'find_replace_tool': 'find-replace',
  'synonym_generator_tool': 'synonym-generator',
  'emoji_tool': 'emoji',
  'spaces_to_paragraphs_tool': 'spaces-to-paragraphs',
  'remove_line_breaks_tool': 'remove-line-breaks',
  'text_by_columns_tool': 'text-by-columns',
  'text_optimizer_tool': 'text-optimizer',
  'text_sorting_tool': 'text-sorting',
  'text_to_html_tool': 'text-to-html',
  'transliteration_tool': 'transliteration',
  'utm_generator_tool': 'utm-generator',
  'word_gluing_tool': 'word-gluing',
  'word_mixer_tool': 'word-mixer',
  'word_declension_tool': 'word-declension',
  'duplicate_removal_tool': 'remove-duplicates' // уже исправлен
};

function fixToolIds() {
  console.log('🔧 ИСПРАВЛЕНИЕ TOOL_ID В ФАЙЛАХ ИНСТРУМЕНТОВ\n');
  
  const toolsDir = './frontend/src/pages';
  
  if (!fs.existsSync(toolsDir)) {
    console.log('❌ Директория страниц не найдена:', toolsDir);
    return;
  }
  
  let totalChanges = 0;
  
  // Читаем все файлы инструментов
  const files = fs.readdirSync(toolsDir)
    .filter(file => file.endsWith('Tool.tsx'))
    .map(file => path.join(toolsDir, file));
  
  console.log(`📁 Найдено ${files.length} файлов инструментов\n`);
  
  files.forEach(filePath => {
    const fileName = path.basename(filePath);
    
    if (!fs.existsSync(filePath)) {
      console.log(`⚠️ Файл не найден: ${fileName}`);
      return;
    }
    
    let content = fs.readFileSync(filePath, 'utf8');
    let changesMade = false;
    
    // Ищем и заменяем TOOL_ID
    for (const [oldId, newId] of Object.entries(idMapping)) {
      const regex = new RegExp(`const TOOL_ID = '${oldId}';`, 'g');
      
      if (content.match(regex)) {
        content = content.replace(regex, `const TOOL_ID = '${newId}';`);
        console.log(`  ✏️ ${fileName}: '${oldId}' → '${newId}'`);
        changesMade = true;
        totalChanges++;
      }
    }
    
    if (changesMade) {
      fs.writeFileSync(filePath, content, 'utf8');
      console.log(`  ✅ ${fileName} сохранен\n`);
    } else {
      console.log(`  ℹ️ ${fileName}: изменений не требуется\n`);
    }
  });
  
  console.log(`🎉 Исправление завершено: ${totalChanges} изменений в ${files.length} файлах`);
  console.log('🔄 Перезагрузите страницы для применения изменений');
}

function checkMissingIds() {
  console.log('\n🔍 ПРОВЕРКА НЕДОСТАЮЩИХ ID В БАЗЕ ДАННЫХ\n');
  
  const initFile = './backend/init-tools-table.js';
  if (!fs.existsSync(initFile)) {
    console.log('⚠️ Файл init-tools-table.js не найден');
    return;
  }
  
  const content = fs.readFileSync(initFile, 'utf8');
  const existingIds = [];
  
  // Извлекаем все существующие ID из базы
  const idMatches = content.match(/id: '[^']+'/g);
  if (idMatches) {
    idMatches.forEach(match => {
      const id = match.replace("id: '", '').replace("'", '');
      existingIds.push(id);
    });
  }
  
  console.log('📋 ID в базе данных:', existingIds.sort().join(', '));
  
  // Проверяем какие ID нужны, но отсутствуют
  const neededIds = Object.values(idMapping);
  const missingIds = neededIds.filter(id => !existingIds.includes(id));
  
  if (missingIds.length > 0) {
    console.log('\\n❌ Недостающие ID в базе данных:');
    missingIds.forEach(id => console.log(`  - ${id}`));
  } else {
    console.log('\\n✅ Все необходимые ID присутствуют в базе данных');
  }
}

function main() {
  fixToolIds();
  checkMissingIds();
}

if (require.main === module) {
  main();
}

module.exports = { idMapping };