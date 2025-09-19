import { baseEmoji } from './baseEmoji';
import { travelEmoji } from './travelEmoji';
import { activityEmoji } from './activityEmoji';
import { flagsEmoji } from './flagsEmoji';

// Объединяем все emoji в одну базу данных
export const emojiDatabase = [
    ...baseEmoji,
    ...travelEmoji,
    ...activityEmoji,
    ...flagsEmoji
];

export * from './baseEmoji';