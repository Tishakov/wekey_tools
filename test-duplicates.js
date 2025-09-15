// Тест логики удаления дубликатов
const testText = 'Строка 1\nСтрока 2\nСтрока 1\nСтрока 3\nСтрока 2\nСтрока 4';

console.log('Исходный текст:');
console.log(testText);
console.log('\n=== ТЕСТЫ ===\n');

// Функция 1: removeDuplicates (оставить уникальные)
function removeDuplicates(text) {
    const lines = text.split('\n');
    const seen = new Set();
    const uniqueLines = [];
    lines.forEach(line => {
        if (!seen.has(line)) {
            seen.add(line);
            uniqueLines.push(line);
        }
    });
    return uniqueLines.join('\n');
}

console.log('1. Удалить дубликаты (оставить уникальные):');
console.log(removeDuplicates(testText));

// Функция 2: removeAllDuplicates (удалить все повторяющиеся)
function removeAllDuplicates(text) {
    const lines = text.split('\n');
    const counts = new Map();
    lines.forEach(line => {
        counts.set(line, (counts.get(line) || 0) + 1);
    });
    const uniqueLines = [];
    lines.forEach(line => {
        if (counts.get(line) === 1) {
            uniqueLines.push(line);
        }
    });
    return uniqueLines.join('\n');
}

console.log('\n2. Удалить все дубликаты (только уникальные строки):');
console.log(removeAllDuplicates(testText));

// Функция 3: removeUnique (оставить только дубликаты)
function removeUnique(text) {
    const lines = text.split('\n');
    const counts = new Map();
    lines.forEach(line => {
        counts.set(line, (counts.get(line) || 0) + 1);
    });
    const seen = new Set();
    const duplicateLines = [];
    lines.forEach(line => {
        if (counts.get(line) > 1 && !seen.has(line)) {
            seen.add(line);
            duplicateLines.push(line);
        }
    });
    return duplicateLines.join('\n');
}

console.log('\n3. Удалить уникальные (только дубликаты):');
console.log(removeUnique(testText));