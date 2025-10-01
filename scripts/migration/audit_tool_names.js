#!/usr/bin/env node

// Скрипт для аудита названий инструментов из разных источников

const fs = require('fs');
const path = require('path');

// Собираем названия из разных источников
const toolNamesAudit = {
  translations: {}, // Из файлов переводов
  pages: {},        // Из h1 на страницах инструментов  
  config: {},       // Из toolsConfig.ts
  registry: {}      // Из toolsRegistry.ts
};

// 1. Читаем переводы
function readTranslations() {
  console.log('📝 Читаем переводы...');
  
  const translationFiles = [
    './frontend/src/i18n/locales/ru.json',
    './frontend/src/i18n/locales/en.json',
    './frontend/src/i18n/locales/uk.json'
  ];
  
  translationFiles.forEach(filePath => {
    if (fs.existsSync(filePath)) {
      const content = JSON.parse(fs.readFileSync(filePath, 'utf8'));
      const lang = path.basename(filePath, '.json');
      
      if (content.tools && content.tools.names) {
        toolNamesAudit.translations[lang] = content.tools.names;
      }
    }
  });
}

// 2. Читаем h1 названия со страниц инструментов
function readPageTitles() {
  console.log('📄 Читаем h1 названия со страниц...');
  
  const pagesDir = './frontend/src/pages/';
  if (!fs.existsSync(pagesDir)) return;
  
  const files = fs.readdirSync(pagesDir).filter(f => f.endsWith('Tool.tsx'));
  
  files.forEach(file => {
    const filePath = path.join(pagesDir, file);
    const content = fs.readFileSync(filePath, 'utf8');
    
    // Ищем h1 с классом tool-title
    const h1Match = content.match(/<h1[^>]*tool-title[^>]*>([^<]+)</);
    if (h1Match) {
      const toolName = file.replace('Tool.tsx', '').toLowerCase();
      // Конвертируем CamelCase в kebab-case
      const toolId = toolName.replace(/([A-Z])/g, '-$1').toLowerCase().replace(/^-/, '');
      
      toolNamesAudit.pages[toolId] = h1Match[1].trim();
    }
  });
}

// 3. Читаем toolsConfig.ts
function readToolsConfig() {
  console.log('⚙️ Читаем toolsConfig.ts...');
  
  const configPath = './frontend/src/utils/toolsConfig.ts';
  if (!fs.existsSync(configPath)) return;
  
  const content = fs.readFileSync(configPath, 'utf8');
  
  // Простой парсинг для извлечения id и title
  const toolMatches = content.match(/{\s*id:\s*'([^']+)',\s*title:\s*'([^']+)'/g);
  if (toolMatches) {
    toolMatches.forEach(match => {
      const [, id, title] = match.match(/id:\s*'([^']+)',\s*title:\s*'([^']+)'/);
      toolNamesAudit.config[id] = title;
    });
  }
}

// 4. Читаем toolsRegistry.ts
function readToolsRegistry() {
  console.log('📋 Читаем toolsRegistry.ts...');
  
  const registryPath = './frontend/src/utils/toolsRegistry.ts';
  if (!fs.existsSync(registryPath)) return;
  
  const content = fs.readFileSync(registryPath, 'utf8');
  
  // Простой парсинг для извлечения id и name
  const toolMatches = content.match(/'([^']+)':\s*{\s*id:\s*'[^']+',\s*name:\s*'([^']+)'/g);
  if (toolMatches) {
    toolMatches.forEach(match => {
      const [, id, name] = match.match(/'([^']+)':\s*{\s*id:\s*'[^']+',\s*name:\s*'([^']+)'/);
      toolNamesAudit.registry[id] = name;
    });
  }
}

// 5. Анализируем расхождения
function analyzeDiscrepancies() {
  console.log('\n🔍 АНАЛИЗ РАСХОЖДЕНИЙ:\n');
  
  // Собираем все уникальные toolId
  const allToolIds = new Set();
  Object.keys(toolNamesAudit.translations.ru || {}).forEach(id => allToolIds.add(id));
  Object.keys(toolNamesAudit.pages).forEach(id => allToolIds.add(id));
  Object.keys(toolNamesAudit.config).forEach(id => allToolIds.add(id));
  Object.keys(toolNamesAudit.registry).forEach(id => allToolIds.add(id));
  
  // Анализируем каждый инструмент
  for (const toolId of Array.from(allToolIds).sort()) {
    const ru = toolNamesAudit.translations.ru?.[toolId] || '❌ НЕТ';
    const page = toolNamesAudit.pages[toolId] || '❌ НЕТ';
    const config = toolNamesAudit.config[toolId] || '❌ НЕТ';
    const registry = toolNamesAudit.registry[toolId] || '❌ НЕТ';
    
    // Проверяем синхронизацию
    const values = [ru, page, config, registry].filter(v => v !== '❌ НЕТ');
    const isSync = values.length > 1 && values.every(v => v === values[0]);
    
    const status = isSync ? '✅' : '❌';
    
    console.log(`${status} ${toolId}`);
    console.log(`   📄 Страница:  ${page}`);
    console.log(`   🇷🇺 Перевод:   ${ru}`);
    console.log(`   ⚙️ Config:    ${config}`);
    console.log(`   📋 Registry:  ${registry}`);
    console.log('');
  }
}

// 6. Создаем рекомендации
function generateRecommendations() {
  console.log('💡 РЕКОМЕНДАЦИИ:\n');
  
  console.log('1. 📄 Использовать h1 названия со страниц как источник истины');
  console.log('2. 🔄 Обновить все переводы в соответствии с h1');
  console.log('3. ⚙️ Обновить toolsConfig.ts и toolsRegistry.ts');
  console.log('4. 🏗️ Создать единую функцию getToolName() для всех компонентов');
  console.log('5. ✅ Протестировать синхронизацию');
}

// Главная функция
function main() {
  console.log('🔍 АУДИТ НАЗВАНИЙ ИНСТРУМЕНТОВ\n');
  
  readTranslations();
  readPageTitles();
  readToolsConfig();
  readToolsRegistry();
  
  analyzeDiscrepancies();
  generateRecommendations();
  
  // Сохраняем результат для дальнейшего использования
  fs.writeFileSync('./tool_names_audit.json', JSON.stringify(toolNamesAudit, null, 2));
  console.log('\n💾 Результат сохранен в tool_names_audit.json');
}

if (require.main === module) {
  main();
}

module.exports = { toolNamesAudit };