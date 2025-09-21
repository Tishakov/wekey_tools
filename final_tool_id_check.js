#!/usr/bin/env node

// Финальная проверка соответствия всех TOOL_ID с базой данных

const fs = require('fs');
const path = require('path');

function checkAllToolIds() {
  console.log('🔍 ФИНАЛЬНАЯ ПРОВЕРКА ВСЕХ TOOL_ID\n');
  
  // ID из базы данных (из init-tools-table.js)
  const dbIds = [
    'synonym-generator', 'password-generator', 'text-generator', 'number-generator',
    'utm-generator', 'add-symbol', 'case-changer', 'char-counter', 'find-replace',
    'minus-words', 'text-optimizer', 'duplicate-finder', 'spaces-to-paragraphs',
    'cross-analytics', 'word-gluing', 'word-mixer', 'remove-line-breaks',
    'word-declension', 'text-sorting', 'text-to-html', 'transliteration',
    'remove-duplicates', 'remove-empty-lines', 'text-by-columns', 'emoji', 'match-types'
  ];
  
  console.log(`📋 ID в базе данных (${dbIds.length}):`, dbIds.sort().join(', '));
  console.log();
  
  // Читаем все файлы инструментов
  const toolsDir = './frontend/src/pages';
  const files = fs.readdirSync(toolsDir)
    .filter(file => file.endsWith('Tool.tsx'))
    .map(file => path.join(toolsDir, file));
  
  console.log(`📁 Найдено ${files.length} файлов инструментов\n`);
  
  const foundIds = [];
  const problems = [];
  
  files.forEach(filePath => {
    const fileName = path.basename(filePath);
    const content = fs.readFileSync(filePath, 'utf8');
    
    // Ищем TOOL_ID
    const match = content.match(/const TOOL_ID = '([^']+)';/);
    
    if (match) {
      const toolId = match[1];
      foundIds.push(toolId);
      
      if (dbIds.includes(toolId)) {
        console.log(`✅ ${fileName}: '${toolId}' - OK`);
      } else {
        console.log(`❌ ${fileName}: '${toolId}' - НЕ НАЙДЕН В БД!`);
        problems.push({ file: fileName, id: toolId });
      }
    } else {
      console.log(`⚠️ ${fileName}: TOOL_ID не найден`);
      problems.push({ file: fileName, id: 'НЕ НАЙДЕН' });
    }
  });
  
  console.log(`\n📊 СТАТИСТИКА:`);
  console.log(`   - Всего файлов: ${files.length}`);
  console.log(`   - Найдено ID: ${foundIds.length}`);
  console.log(`   - Проблемы: ${problems.length}`);
  
  if (problems.length > 0) {
    console.log(`\n❌ ПРОБЛЕМЫ:`);
    problems.forEach(p => console.log(`   - ${p.file}: ${p.id}`));
  }
  
  // Проверяем отсутствующие в коде ID
  const missingInCode = dbIds.filter(id => !foundIds.includes(id));
  if (missingInCode.length > 0) {
    console.log(`\n⚠️ ID ИЗ БД, НО НЕТ В КОДЕ (${missingInCode.length}):`);
    missingInCode.forEach(id => console.log(`   - ${id}`));
  }
  
  // Проверяем лишние в коде ID
  const extraInCode = foundIds.filter(id => !dbIds.includes(id));
  if (extraInCode.length > 0) {
    console.log(`\n⚠️ ID В КОДЕ, НО НЕТ В БД (${extraInCode.length}):`);
    extraInCode.forEach(id => console.log(`   - ${id}`));
  }
  
  if (problems.length === 0 && missingInCode.length === 0 && extraInCode.length === 0) {
    console.log(`\n🎉 ВСЕ PERFECT! Все TOOL_ID синхронизированы с базой данных!`);
  }
}

if (require.main === module) {
  checkAllToolIds();
}