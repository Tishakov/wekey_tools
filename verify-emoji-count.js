// Скрипт для проверки количества эмодзи после замены проблемных символов
import { emojiDatabase } from './src/data/emoji/index.js';

// Подсчитываем общее количество
const totalEmojis = emojiDatabase.length;
console.log(`Общее количество эмодзи: ${totalEmojis}`);

// Подсчитываем по категориям
const categoryCounts = {};
emojiDatabase.forEach(item => {
    if (categoryCounts[item.category]) {
        categoryCounts[item.category]++;
    } else {
        categoryCounts[item.category] = 1;
    }
});

console.log('\nКоличество по категориям:');
Object.entries(categoryCounts).sort().forEach(([category, count]) => {
    console.log(`${category}: ${count}`);
});

// Проверяем на проблемные символы
const problematicEmojis = [];
emojiDatabase.forEach((item, index) => {
    const emoji = item.emoji;
    // Проверяем на символы � или другие проблемные
    if (emoji.includes('�') || emoji.length > 4) {
        problematicEmojis.push({
            index,
            emoji,
            category: item.category,
            codePoints: [...emoji].map(c => c.codePointAt(0).toString(16)).join(' ')
        });
    }
});

if (problematicEmojis.length > 0) {
    console.log('\n⚠️ Найдены потенциально проблемные эмодзи:');
    problematicEmojis.forEach(item => {
        console.log(`${item.emoji} (${item.category}) - Unicode: ${item.codePoints}`);
    });
} else {
    console.log('\n✅ Проблемных эмодзи не найдено!');
}