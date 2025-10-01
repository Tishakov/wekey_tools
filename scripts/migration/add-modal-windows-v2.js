const fs = require('fs');
const path = require('path');

// Список оставшихся файлов инструментов
const toolFiles = [
  'MatchTypesTool.tsx',
  'MinusWordsTool.tsx',
  'NumberGeneratorTool.tsx',
  'RemoveLineBreaksTool.tsx',
  'SpacesToParagraphsTool.tsx',
  'TextByColumnsTool.tsx',
  'TextGeneratorTool.tsx',
  'TextOptimizerTool.tsx',
  'TextSortingTool.tsx',
  'TextToHtmlTool.tsx',
  'TransliterationTool.tsx',
  'UtmGeneratorTool.tsx',
  'WordGluingTool.tsx',
  'WordMixerTool.tsx'
];

// Модальные окна для добавления
const modalWindowsCode = `
      {/* Модальные окна для авторизации */}
      <AuthRequiredModal
        isOpen={isAuthRequiredModalOpen}
        onClose={closeAuthRequiredModal}
        onLoginClick={openAuthModal}
      />

      <AuthModal
        isOpen={isAuthModalOpen}
        onClose={closeAuthModal}
        initialMode="login"
      />`;

// Функция для обработки каждого файла
function addModalWindows(fileName) {
  const filePath = path.join('frontend/src/pages', fileName);
  
  if (!fs.existsSync(filePath)) {
    console.log(`❌ Файл не найден: ${fileName}`);
    return false;
  }
  
  let content = fs.readFileSync(filePath, 'utf8');
  
  // Находим последние строки с закрывающими тегами
  // Паттерн: ищем закрывающие теги перед финальным export
  const patterns = [
    // Паттерн 1: стандартные закрывающие теги с отступами
    /(\s+<\/div>\s*<\/div>\s*)\s*(\)\s*;\s*)\s*(export default)/,
    // Паттерн 2: без отступов
    /(<\/div>\s*<\/div>\s*)\s*(\)\s*;\s*)\s*(export default)/,
    // Паттерн 3: одинарный div
    /(\s+<\/div>\s*)\s*(\)\s*;\s*)\s*(export default)/,
    // Паттерн 4: просто закрывающие скобки
    /(\s*)\s*(\)\s*;\s*)\s*(export default)/
  ];
  
  let patternFound = false;
  
  for (let i = 0; i < patterns.length; i++) {
    const pattern = patterns[i];
    if (pattern.test(content)) {
      content = content.replace(pattern, `$1${modalWindowsCode}
    </div>
$2

$3`);
      patternFound = true;
      console.log(`✅ Модальные окна добавлены в ${fileName} (паттерн ${i + 1})`);
      break;
    }
  }
  
  if (!patternFound) {
    console.log(`⚠️  Не найден подходящий паттерн в ${fileName}`);
    // Выводим последние 20 строк для анализа
    const lines = content.split('\n');
    const lastLines = lines.slice(-20);
    console.log(`Последние строки файла ${fileName}:`);
    lastLines.forEach((line, index) => {
      console.log(`${lines.length - 20 + index + 1}: ${line}`);
    });
    console.log('---\n');
    return false;
  }
  
  fs.writeFileSync(filePath, content);
  return true;
}

// Обрабатываем все файлы
console.log('🚀 Начинаем добавление модальных окон (улучшенная версия)...\n');

let successCount = 0;
let failCount = 0;

toolFiles.forEach(fileName => {
  if (addModalWindows(fileName)) {
    successCount++;
  } else {
    failCount++;
  }
});

console.log(`\n📊 Результат:`);
console.log(`✅ Успешно обработано: ${successCount} файлов`);
console.log(`❌ Ошибок: ${failCount} файлов`);

if (failCount > 0) {
  console.log('\n🔧 Файлы с ошибками требуют ручной обработки');
}