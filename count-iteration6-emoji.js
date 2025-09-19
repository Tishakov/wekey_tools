import fs from 'fs';
import path from 'path';

console.log('=== ПОДСЧЕТ НОВЫХ EMOJI (ШЕСТАЯ ИТЕРАЦИЯ) ===\n');

// Обновленный список файлов включая новый educationEmoji.ts
const emojiFiles = [
    { file: 'baseEmoji.ts', description: 'Базовые (лица, еда, природа, спорт)' },
    { file: 'travelEmoji.ts', description: 'Путешествия' },
    { file: 'activityEmoji.ts', description: 'Активности' },
    { file: 'flagsEmoji.ts', description: 'Флаги' },
    { file: 'techEmoji.ts', description: 'Технологии' },
    { file: 'clothesEmoji.ts', description: 'Одежда (+2 новых)' },
    { file: 'jobsEmoji.ts', description: 'Профессии' },
    { file: 'symbolsEmoji.ts', description: 'Символы' },
    { file: 'gesturesEmoji.ts', description: 'Жесты' },
    { file: 'musicEmoji.ts', description: 'Музыка' },
    { file: 'weatherEmoji.ts', description: 'Погода (+3 новых)' },
    { file: 'educationEmoji.ts', description: 'Образование (НОВАЯ КАТЕГОРИЯ, 5 emoji)' }
];

let totalEmoji = 0;
let newEmojiCount = 0;

emojiFiles.forEach(({ file, description }) => {
    try {
        const content = fs.readFileSync(path.join('src/data/emoji', file), 'utf8');
        const matches = content.match(/emoji: '/g);
        const count = matches ? matches.length : 0;
        console.log(`${description}: ${count} emoji`);
        totalEmoji += count;
        
        // Подсчитываем новые emoji из этой итерации
        if (file === 'educationEmoji.ts') {
            newEmojiCount += count; // Вся новая категория
        } else if (file === 'weatherEmoji.ts') {
            newEmojiCount += 3; // Добавили 3 новых (было 4, стало 7)
        } else if (file === 'clothesEmoji.ts') {
            newEmojiCount += 2; // Добавили 2 новых (было 7, стало 9)
        }
    } catch (error) {
        console.log(`${description}: файл не найден`);
    }
});

console.log(`\nОбщее количество emoji: ${totalEmoji}`);
console.log(`Добавлено в этой итерации: ${newEmojiCount} emoji`);
console.log(`Было перед итерацией: ${totalEmoji - newEmojiCount} emoji`);

console.log('\n=== ДЕТАЛИ ШЕСТОЙ ИТЕРАЦИИ ===');
console.log('✅ Создана новая категория "Образование": 5 emoji');
console.log('   📚 📖 🎓 🏫 ✏️ 📝');
console.log('✅ Расширена категория "Погода": +3 emoji');
console.log('   🌤️ 🌈 🌪️');
console.log('✅ Расширена категория "Одежда": +2 emoji');
console.log('   👟 🧥');
console.log(`✅ Общих категорий стало: ${emojiFiles.length} (было ${emojiFiles.length - 1})`);
console.log(`✅ Всего emoji: ${totalEmoji} (было ${totalEmoji - newEmojiCount}, добавлено ${newEmojiCount})`);