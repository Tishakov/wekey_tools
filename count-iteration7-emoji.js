import fs from 'fs';
import path from 'path';

console.log('=== ПОДСЧЕТ СЕДЬМОЙ ИТЕРАЦИИ: ДОБАВЛЕНО 13 EMOJI ===\n');

// Полный список файлов включая новый transportEmoji.ts
const emojiFiles = [
    { file: 'baseEmoji.ts', description: 'Базовые (лица, еда, природа, спорт)', changes: 'без изменений' },
    { file: 'travelEmoji.ts', description: 'Путешествия', changes: 'без изменений' },
    { file: 'activityEmoji.ts', description: 'Активности', changes: 'без изменений' },
    { file: 'flagsEmoji.ts', description: 'Флаги', changes: 'без изменений' },
    { file: 'techEmoji.ts', description: 'Технологии', changes: '+3 новых (мышь, клавиатура, розетка)' },
    { file: 'clothesEmoji.ts', description: 'Одежда', changes: 'без изменений' },
    { file: 'jobsEmoji.ts', description: 'Профессии', changes: 'без изменений' },
    { file: 'symbolsEmoji.ts', description: 'Символы', changes: '+2 новых (огонь, алмаз)' },
    { file: 'gesturesEmoji.ts', description: 'Жесты', changes: '+2 новых (рок знак, молитва)' },
    { file: 'musicEmoji.ts', description: 'Музыка', changes: 'без изменений' },
    { file: 'weatherEmoji.ts', description: 'Погода', changes: 'без изменений' },
    { file: 'educationEmoji.ts', description: 'Образование', changes: 'без изменений' },
    { file: 'transportEmoji.ts', description: 'Транспорт (НОВАЯ КАТЕГОРИЯ)', changes: '+6 новых (авто, автобус, трамвай, велосипед, мотоцикл, скутер)' }
];

let totalEmoji = 0;
let newEmojiCount = 0;

console.log('РАСПРЕДЕЛЕНИЕ ПО КАТЕГОРИЯМ:');
emojiFiles.forEach(({ file, description, changes }) => {
    try {
        const content = fs.readFileSync(path.join('src/data/emoji', file), 'utf8');
        const matches = content.match(/emoji: '/g);
        const count = matches ? matches.length : 0;
        console.log(`${description}: ${count} emoji`);
        
        if (changes !== 'без изменений') {
            console.log(`  └─ ${changes}`);
        }
        
        totalEmoji += count;
        
        // Подсчитываем новые emoji из этой итерации
        if (file === 'transportEmoji.ts') {
            newEmojiCount += count; // Вся новая категория
        } else if (file === 'techEmoji.ts') {
            newEmojiCount += 3; // Добавили 3 новых (было 7, стало 10)
        } else if (file === 'symbolsEmoji.ts') {
            newEmojiCount += 2; // Добавили 2 новых (было 7, стало 9)
        } else if (file === 'gesturesEmoji.ts') {
            newEmojiCount += 2; // Добавили 2 новых (было 7, стало 9)
        }
    } catch (error) {
        console.log(`${description}: файл не найден`);
    }
});

console.log(`\n=== ИТОГИ СЕДЬМОЙ ИТЕРАЦИИ ===`);
console.log(`Общее количество emoji: ${totalEmoji}`);
console.log(`Добавлено в этой итерации: ${newEmojiCount} emoji`);
console.log(`Было перед итерацией: ${totalEmoji - newEmojiCount} emoji`);

console.log('\n=== ДЕТАЛИЗАЦИЯ ДОБАВЛЕНИЙ ===');
console.log('🆕 Новая категория "Транспорт": 6 emoji');
console.log('   🚗 Машина, 🚌 Автобус, 🚊 Трамвай, 🚲 Велосипед, 🏍️ Мотоцикл, 🛵 Скутер');
console.log('📱 Расширена "Технологии": +3 emoji (7→10)');
console.log('   🖱️ Мышь, ⌨️ Клавиатура, 🔌 Розетка');
console.log('⭐ Расширена "Символы": +2 emoji (7→9)');
console.log('   🔥 Огонь, 💎 Алмаз');
console.log('👍 Расширена "Жесты": +2 emoji (7→9)');
console.log('   🤟 Рок знак, 🙏 Молитва');

console.log(`\n✅ Общих категорий стало: ${emojiFiles.length} (было ${emojiFiles.length - 1})`);
console.log(`✅ Всего emoji: ${totalEmoji} (было ${totalEmoji - newEmojiCount}, добавлено ${newEmojiCount})`);