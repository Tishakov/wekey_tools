// Список инструментов из модели ToolUsage
const tools = [
  'case-changer', 'remove-duplicates', 'duplicate-finder',
  'text-to-html', 'text-optimizer', 'spaces-to-paragraphs',
  'text-sorting', 'remove-empty-lines', 'transliteration',
  'minus-words', 'utm-generator', 'cross-analytics',
  'word-gluing', 'word-mixer', 'remove-line-breaks',
  'add-symbol', 'find-replace', 'text-generator',
  'synonym-generator', 'word-declension', 'text-by-columns',
  'char-counter', 'match-types', 'number-generator',
  'password-generator', 'emoji', 'site-audit', 'seo-audit', 
  'seoauditpro', 'privacy-policy-generator', 'qr-generator'
];

console.log('🔧 Подсчет инструментов на платформе:');
console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
console.log(`📊 Общее количество инструментов: ${tools.length}`);
console.log('');
console.log('📋 Список всех инструментов:');
tools.forEach((tool, index) => {
  console.log(`  ${(index + 1).toString().padStart(2)}: ${tool}`);
});

console.log('');
console.log(`✅ Правильное число для отображения: ${tools.length}`);