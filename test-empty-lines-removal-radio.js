// Тест логики инструмента "Удаление пустых строк" с радио-кнопками
const testText = `Первая строка
Вторая строка

Четвертая строка
Пятая строка с ошибкой

Седьмая строка
Восьмая строка с ошибкой

Десятая строка`;

console.log('Исходный текст:');
console.log(JSON.stringify(testText));
console.log('Визуально:');
console.log('---');
console.log(testText);
console.log('---');

console.log('\n=== ТЕСТЫ ФИЛЬТРАЦИИ С РАДИО-КНОПКАМИ ===\n');

// Функция обработки текста как в компоненте (только одна опция активна)
function processText(text, filterOption, containsFilter, notContainsFilter) {
    if (!text.trim()) return '';

    let lines = text.split('\n');

    console.log(`Строк до обработки: ${lines.length}`);
    console.log('Строки до обработки:', lines);
    console.log(`Активный фильтр: ${filterOption}`);

    // Применяем выбранный фильтр
    if (filterOption === 'removeEmpty') {
        // Удалить пустые строки
        lines = lines.filter(line => line.trim().length > 0);
        console.log(`После удаления пустых строк: ${lines.length} строк`);
        console.log('Строки:', lines);
    } else if (filterOption === 'removeContains' && containsFilter.trim()) {
        // Удалить строки, которые содержат определенный текст
        lines = lines.filter(line => !line.includes(containsFilter.trim()));
        console.log(`После удаления строк с "${containsFilter}": ${lines.length} строк`);
        console.log('Строки:', lines);
    } else if (filterOption === 'removeNotContains' && notContainsFilter.trim()) {
        // Удалить строки, которые НЕ содержат определенный текст (оставить только те, что содержат)
        lines = lines.filter(line => line.includes(notContainsFilter.trim()));
        console.log(`После удаления строк, НЕ содержащих "${notContainsFilter}": ${lines.length} строк`);
        console.log('Строки:', lines);
    }

    return lines.join('\n');
}

// Тест 1: Радио-кнопка "Удалить пустые строки"
console.log('\n1. Радио-кнопка: Удалить пустые строки');
const result1 = processText(testText, 'removeEmpty', '', '');
console.log('Результат:');
console.log(result1);

// Тест 2: Радио-кнопка "Удалить строки, которые содержат"
console.log('\n2. Радио-кнопка: Удалить строки, которые содержат "ошибкой"');
const result2 = processText(testText, 'removeContains', 'ошибкой', '');
console.log('Результат:');
console.log(result2);

// Тест 3: Радио-кнопка "Удалить строки, которые НЕ содержат"
console.log('\n3. Радио-кнопка: Удалить строки, которые НЕ содержат "строка"');
const result3 = processText(testText, 'removeNotContains', '', 'строка');
console.log('Результат:');
console.log(result3);

// Тест 4: Без выбранного фильтра
console.log('\n4. Без выбранного фильтра (должен вернуть исходный текст)');
const result4 = processText(testText, '', '', '');
console.log('Результат:');
console.log(result4);

// Тест 5: Фильтр с пустым значением
console.log('\n5. Радио-кнопка: Удалить строки, которые содержат (но поле пустое)');
const result5 = processText(testText, 'removeContains', '', '');
console.log('Результат:');
console.log(result5);

console.log('\n=== ТЕСТ ЗАВЕРШЕН ===');