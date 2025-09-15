// Тест механики снятия радио-кнопок в EmptyLinesRemovalTool

let filterOption = ''; // Начальное состояние

function handleRadioClick(clickedValue) {
    console.log(`\nКлик на радио-кнопку: ${clickedValue}`);
    console.log(`Текущее состояние до клика: "${filterOption}"`);
    
    // Логика из компонента
    if (filterOption === clickedValue) {
        filterOption = ''; // Снимаем выбор если кликнули по уже выбранной радиокнопке
    } else {
        filterOption = clickedValue; // Устанавливаем новое значение
    }
    
    console.log(`Новое состояние после клика: "${filterOption}"`);
    console.log(`Радио-кнопка "removeEmpty" checked: ${filterOption === 'removeEmpty'}`);
    console.log(`Радио-кнопка "removeContains" checked: ${filterOption === 'removeContains'}`);
    console.log(`Радио-кнопка "removeNotContains" checked: ${filterOption === 'removeNotContains'}`);
    return filterOption;
}

console.log('=== ТЕСТ МЕХАНИКИ СНЯТИЯ РАДИО-КНОПОК ===');

console.log('\nНачальное состояние:');
console.log(`filterOption: "${filterOption}"`);
console.log(`Все радио-кнопки: ${filterOption === '' ? 'не выбраны' : 'одна выбрана'}`);

// Тест 1: Первый клик на "removeEmpty"
filterOption = handleRadioClick('removeEmpty');

// Тест 2: Повторный клик на "removeEmpty" (должен деактивировать)
filterOption = handleRadioClick('removeEmpty');

// Тест 3: Клик на "removeContains"
filterOption = handleRadioClick('removeContains');

// Тест 4: Клик на "removeNotContains" (должен переключиться)
filterOption = handleRadioClick('removeNotContains');

// Тест 5: Повторный клик на "removeNotContains" (должен деактивировать)
filterOption = handleRadioClick('removeNotContains');

// Тест 6: Клик на "removeContains"
filterOption = handleRadioClick('removeContains');

// Тест 7: Клик на "removeEmpty" (должен переключиться)
filterOption = handleRadioClick('removeEmpty');

// Тест 8: Повторный клик на "removeEmpty" (должен деактивировать)
filterOption = handleRadioClick('removeEmpty');

console.log('\n=== ТЕСТ ЗАВЕРШЕН ===');
console.log(`Финальное состояние: "${filterOption}"`);
console.log(`Все радио-кнопки сняты: ${filterOption === '' ? 'ДА' : 'НЕТ'}`);