import fs from 'fs';
import path from 'path';

console.log('=== ПОДСЧЕТ ВОСЬМОЙ ИТЕРАЦИИ: ДОБАВЛЕНО 20 EMOJI ===\n');

// Полный список файлов включая новый medicineEmoji.ts
const emojiFiles = [
    { file: 'baseEmoji.ts', description: 'Базовые (лица, еда, природа, спорт)', changes: 'без изменений' },
    { file: 'travelEmoji.ts', description: 'Путешествия', changes: 'без изменений' },
    { file: 'activityEmoji.ts', description: 'Активности', changes: 'без изменений' },
    { file: 'flagsEmoji.ts', description: 'Флаги', changes: 'без изменений' },
    { file: 'techEmoji.ts', description: 'Технологии', changes: 'без изменений' },
    { file: 'clothesEmoji.ts', description: 'Одежда', changes: '+2 новых (сумка, кепка)' },
    { file: 'jobsEmoji.ts', description: 'Профессии', changes: '+2 новых (врач-женщина, повар-мужчина)' },
    { file: 'symbolsEmoji.ts', description: 'Символы', changes: 'без изменений' },
    { file: 'gesturesEmoji.ts', description: 'Жесты', changes: '+4 новых (🫶 сердце из рук, мир, скрещенные пальцы, указывающий палец)' },
    { file: 'musicEmoji.ts', description: 'Музыка', changes: 'без изменений' },
    { file: 'weatherEmoji.ts', description: 'Погода', changes: '+2 новых (туман, лед)' },
    { file: 'educationEmoji.ts', description: 'Образование', changes: '+4 новых (открытая книга, тетрадь, глобус, микроскоп)' },
    { file: 'transportEmoji.ts', description: 'Транспорт', changes: '+2 новых (самолет, корабль)' },
    { file: 'medicineEmoji.ts', description: 'Медицина (НОВАЯ КАТЕГОРИЯ)', changes: '+4 новых (таблетки, больница, стетоскоп, шприц)' }
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
        if (file === 'medicineEmoji.ts') {
            newEmojiCount += count; // Вся новая категория
        } else if (file === 'gesturesEmoji.ts') {
            newEmojiCount += 4; // Добавили 4 новых (было 9, стало 13)
        } else if (file === 'educationEmoji.ts') {
            newEmojiCount += 4; // Добавили 4 новых (было 5, стало 9)
        } else if (file === 'transportEmoji.ts') {
            newEmojiCount += 2; // Добавили 2 новых (было 6, стало 8)
        } else if (file === 'weatherEmoji.ts') {
            newEmojiCount += 2; // Добавили 2 новых (было 7, стало 9)
        } else if (file === 'clothesEmoji.ts') {
            newEmojiCount += 2; // Добавили 2 новых (было 9, стало 11)
        } else if (file === 'jobsEmoji.ts') {
            newEmojiCount += 2; // Добавили 2 новых (было 9, стало 11)
        }
    } catch (error) {
        console.log(`${description}: файл не найден`);
    }
});

console.log(`\n=== ИТОГИ ВОСЬМОЙ ИТЕРАЦИИ ===`);
console.log(`Общее количество emoji: ${totalEmoji}`);
console.log(`Добавлено в этой итерации: ${newEmojiCount} emoji`);
console.log(`Было перед итерацией: ${totalEmoji - newEmojiCount} emoji`);

console.log('\n=== ДЕТАЛИЗАЦИЯ ДОБАВЛЕНИЙ ===');
console.log('🆕 Новая категория "Медицина": 4 emoji');
console.log('   💊 Таблетки, 🏥 Больница, 🩺 Стетоскоп, 💉 Шприц');
console.log('🫶 Расширена "Жесты": +4 emoji (9→13) - включая обязательный 🫶');
console.log('   🫶 Сердце из рук, ✌️ Мир, 🤞 Скрещенные пальцы, 🫵 Указывающий палец');
console.log('📚 Расширена "Образование": +4 emoji (5→9)');
console.log('   📖 Открытая книга, 📓 Тетрадь, 🌍 Глобус, 🔬 Микроскоп');
console.log('🚗 Расширена "Транспорт": +2 emoji (6→8)');
console.log('   ✈️ Самолет, 🚢 Корабль');
console.log('☀️ Расширена "Погода": +2 emoji (7→9)');
console.log('   🌫️ Туман, 🧊 Лед');
console.log('👕 Расширена "Одежда": +2 emoji (9→11)');
console.log('   👜 Сумка, 🧢 Кепка');
console.log('👩‍💻 Расширена "Профессии": +2 emoji (9→11)');
console.log('   👩‍⚕️ Врач-женщина, 👨‍🍳 Повар-мужчина');

console.log(`\n✅ Общих категорий стало: ${emojiFiles.length} (было ${emojiFiles.length - 1})`);
console.log(`✅ Всего emoji: ${totalEmoji} (было ${totalEmoji - newEmojiCount}, добавлено ${newEmojiCount})`);
console.log(`✅ Особенность: включен обязательный emoji 🫶 (сердце из рук)`);
console.log(`✅ Покрыта важная сфера здравоохранения категорией "Медицина"`);