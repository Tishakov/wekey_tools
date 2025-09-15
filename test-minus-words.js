// Тест функциональности инструмента "Обработка минус-слов"

// Тестируем логику разбиения текста на слова
function testWordSplitting() {
    console.log('=== Тест разбиения текста на слова ===');
    
    const testTexts = [
        'привет мир текст',
        'слово1   слово2\nслово3\tслово4',
        'покупка машины недорого автомобиль',
        'котенок, щенок, рыбка птичка'
    ];
    
    testTexts.forEach((text, index) => {
        console.log(`Тест ${index + 1}:`);
        console.log(`Входной текст: "${text}"`);
        
        const words = text
            .split(/\s+/)
            .filter(word => word.trim().length > 0)
            .map(word => word.trim());
            
        console.log(`Результат: [${words.join(', ')}]`);
        console.log(`Количество слов: ${words.length}`);
        console.log('---');
    });
}

// Тестируем логику управления минус-словами
function testMinusWordsLogic() {
    console.log('=== Тест логики минус-слов ===');
    
    let minusWords = [];
    const words = ['покупка', 'машины', 'недорого', 'автомобиль'];
    
    console.log('Начальные слова:', words);
    console.log('Начальные минус-слова:', minusWords);
    
    // Добавляем слова
    words.forEach(word => {
        if (!minusWords.includes(word)) {
            minusWords.push(word);
            console.log(`Добавлено: "${word}". Минус-слова: [${minusWords.join(', ')}]`);
        }
    });
    
    // Убираем слово
    const wordToRemove = 'машины';
    minusWords = minusWords.filter(w => w !== wordToRemove);
    console.log(`Убрано: "${wordToRemove}". Минус-слова: [${minusWords.join(', ')}]`);
    
    // Проверяем финальный результат
    console.log('Финальный результат для копирования:');
    console.log(minusWords.join('\n'));
}

// Тестируем корректность статистики
function testStatsService() {
    console.log('=== Тест статистики ===');
    
    // Симуляция локального хранилища для тестирования
    const mockStorage = {};
    const mockStatsService = {
        getLaunchCount: (toolName) => {
            const stats = mockStorage['wekey_tools_stats'] ? 
                JSON.parse(mockStorage['wekey_tools_stats']) : {};
            return stats[toolName]?.launchCount || 0;
        },
        incrementLaunchCount: (toolName) => {
            const stats = mockStorage['wekey_tools_stats'] ? 
                JSON.parse(mockStorage['wekey_tools_stats']) : {};
            if (!stats[toolName]) {
                stats[toolName] = { launchCount: 0 };
            }
            stats[toolName].launchCount++;
            mockStorage['wekey_tools_stats'] = JSON.stringify(stats);
        }
    };
    
    console.log('Изначальный счетчик:', mockStatsService.getLaunchCount('obrabotka_minus_slov'));
    
    // Симулируем несколько запусков
    for (let i = 1; i <= 3; i++) {
        mockStatsService.incrementLaunchCount('obrabotka_minus_slov');
        console.log(`После запуска ${i}:`, mockStatsService.getLaunchCount('obrabotka_minus_slov'));
    }
}

// Запускаем все тесты
console.log('🚀 Запуск тестов для инструмента "Обработка минус-слов"');
testWordSplitting();
testMinusWordsLogic();
testStatsService();
console.log('✅ Все тесты завершены');