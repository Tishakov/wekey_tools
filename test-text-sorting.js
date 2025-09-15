// Тест всех функций сортировки в инструменте "Сортировка слов и строк"
const testText = `Яблоко
Банан
Арбуз
Виноград
Апельсин
Клубника большая красивая
Слива
Груша маленькая
Мандарин
Киви очень мелкий`;

console.log('Исходный текст:');
console.log(testText);
console.log('\n=== ТЕСТЫ СОРТИРОВКИ ===\n');

const lines = testText.split('\n');

// Функция 1: Сортировка по алфавиту (А-Я)
function sortAlphabeticallyAsc(lines) {
    return [...lines].sort((a, b) => a.localeCompare(b, 'ru'));
}

console.log('1. По алфавиту (А-Я):');
console.log(sortAlphabeticallyAsc(lines).join('\n'));

// Функция 2: Сортировка по алфавиту (Я-А)
function sortAlphabeticallyDesc(lines) {
    return [...lines].sort((a, b) => b.localeCompare(a, 'ru'));
}

console.log('\n2. По алфавиту (Я-А):');
console.log(sortAlphabeticallyDesc(lines).join('\n'));

// Функция 3: Сортировка по количеству символов (больше-меньше)
function sortByLengthDesc(lines) {
    return [...lines].sort((a, b) => b.length - a.length);
}

console.log('\n3. По количеству символов (больше-меньше):');
console.log(sortByLengthDesc(lines).join('\n'));

// Функция 4: Сортировка по количеству символов (меньше-больше)
function sortByLengthAsc(lines) {
    return [...lines].sort((a, b) => a.length - b.length);
}

console.log('\n4. По количеству символов (меньше-больше):');
console.log(sortByLengthAsc(lines).join('\n'));

// Функция для подсчета слов
function countWords(line) {
    return line.trim().split(/\s+/).filter(word => word.length > 0).length;
}

// Функция 5: Сортировка по количеству слов (больше-меньше)
function sortByWordsDesc(lines) {
    return [...lines].sort((a, b) => countWords(b) - countWords(a));
}

console.log('\n5. По количеству слов (больше-меньше):');
const sortedByWordsDesc = sortByWordsDesc(lines);
sortedByWordsDesc.forEach(line => {
    console.log(`${line} (${countWords(line)} слов)`);
});

// Функция 6: Сортировка по количеству слов (меньше-больше)
function sortByWordsAsc(lines) {
    return [...lines].sort((a, b) => countWords(a) - countWords(b));
}

console.log('\n6. По количеству слов (меньше-больше):');
const sortedByWordsAsc = sortByWordsAsc(lines);
sortedByWordsAsc.forEach(line => {
    console.log(`${line} (${countWords(line)} слов)`);
});

console.log('\n=== ТЕСТ ЗАВЕРШЕН ===');