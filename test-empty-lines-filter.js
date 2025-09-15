// Тест фильтрации пустых строк в сортировке
const testTextWithEmptyLines = `Яблоко

Банан


Арбуз

Виноград

Апельсин


`;

console.log('Исходный текст с пустыми строками:');
console.log(JSON.stringify(testTextWithEmptyLines));
console.log('Визуально:');
console.log('---');
console.log(testTextWithEmptyLines);
console.log('---');

console.log('\n=== ТЕСТ ФИЛЬТРАЦИИ ПУСТЫХ СТРОК ===\n');

// Функция фильтрации и сортировки как в компоненте
function sortTextWithFilter(text, sortOption) {
    if (!text.trim()) return '';

    // Разбиваем на строки и фильтруем пустые
    const lines = text.split('\n').filter(line => line.trim().length > 0);
    
    console.log(`Строк до фильтрации: ${text.split('\n').length}`);
    console.log(`Строк после фильтрации: ${lines.length}`);
    console.log('Отфильтрованные строки:', lines);

    switch (sortOption) {
        case 'alphabetical-asc':
            return lines.sort((a, b) => a.localeCompare(b, 'ru')).join('\n');
        case 'alphabetical-desc':
            return lines.sort((a, b) => b.localeCompare(a, 'ru')).join('\n');
        case 'length-desc':
            return lines.sort((a, b) => b.length - a.length).join('\n');
        case 'length-asc':
            return lines.sort((a, b) => a.length - b.length).join('\n');
        default:
            return lines.join('\n');
    }
}

// Тест 1: Алфавитная сортировка с фильтрацией
console.log('\n1. Алфавитная сортировка (А-Я) с фильтрацией пустых строк:');
const result1 = sortTextWithFilter(testTextWithEmptyLines, 'alphabetical-asc');
console.log('Результат:');
console.log(result1);

// Тест 2: Сортировка по длине с фильтрацией
console.log('\n2. Сортировка по длине (меньше-больше) с фильтрацией пустых строк:');
const result2 = sortTextWithFilter(testTextWithEmptyLines, 'length-asc');
console.log('Результат:');
console.log(result2);

// Тест 3: Без сортировки, только фильтрация
console.log('\n3. Только фильтрация без сортировки:');
const result3 = sortTextWithFilter(testTextWithEmptyLines, 'none');
console.log('Результат:');
console.log(result3);

console.log('\n=== ТЕСТ ЗАВЕРШЕН ===');