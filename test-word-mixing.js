// Тест алгоритма миксации слов для WordMixingTool

function testWordMixing() {
    console.log('=== Тестирование алгоритма миксации слов ===\n');

    // Тест 1: Базовая миксация двух списков
    console.log('Тест 1: Миксация "мама, папа" и "дома, на улице"');
    const words1 = ['мама', 'папа'];
    const words2 = ['дома', 'на улице'];
    
    let result = [];
    for (const word1 of words1) {
        for (const word2 of words2) {
            result.push(`${word1} ${word2}`);
        }
    }
    console.log('Результат:', result);
    console.log('Ожидаем: ["мама дома", "мама на улице", "папа дома", "папа на улице"]');
    console.log('');

    // Тест 2: Миксация трех списков
    console.log('Тест 2: Добавляем третий список "работает"');
    const words3 = ['работает'];
    
    let result2 = [];
    for (const combination of result) {
        for (const word3 of words3) {
            result2.push(`${combination} ${word3}`);
        }
    }
    console.log('Результат:', result2);
    console.log('Ожидаем: ["мама дома работает", "мама на улице работает", "папа дома работает", "папа на улице работает"]');
    console.log('');

    // Тест 3: Миксация четырех списков
    console.log('Тест 3: Добавляем четвертый список "хорошо, плохо"');
    const words4 = ['хорошо', 'плохо'];
    
    let result3 = [];
    for (const combination of result2) {
        for (const word4 of words4) {
            result3.push(`${combination} ${word4}`);
        }
    }
    console.log('Результат:', result3);
    console.log('Ожидаем 8 комбинаций:', result3.length);
    console.log('');

    // Тест 4: Только один список
    console.log('Тест 4: Только один список "тест"');
    const singleList = ['тест'];
    console.log('Результат:', singleList);
    console.log('');

    // Тест 5: Пустые списки между заполненными
    console.log('Тест 5: Список 1 и 3 заполнены, 2 и 4 пустые');
    const list1 = ['привет'];
    const list2 = [];
    const list3 = ['мир'];
    const list4 = [];
    
    let testResult = [...list1];
    if (list3.length > 0) {
        let newCombinations = [];
        for (const combination of testResult) {
            for (const word3 of list3) {
                newCombinations.push(`${combination} ${word3}`);
            }
        }
        testResult = newCombinations;
    }
    console.log('Результат:', testResult);
    console.log('Ожидаем: ["привет мир"]');
}

testWordMixing();