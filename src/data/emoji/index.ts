import { baseEmoji } from './baseEmoji';
import { travelEmoji } from './travelEmoji';
import { activityEmoji } from './activityEmoji';
import { flagsEmoji } from './flagsEmoji';
import { techEmoji } from './techEmoji';
import { clothesEmoji } from './clothesEmoji';
import { jobsEmoji } from './jobsEmoji';

// Объединяем все emoji в одну базу данных
export const emojiDatabase = [
    ...baseEmoji,
    ...travelEmoji,
    ...activityEmoji,
    ...flagsEmoji,
    ...techEmoji,
    ...clothesEmoji,
    ...jobsEmoji
];

export * from './baseEmoji';