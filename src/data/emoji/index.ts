import { baseEmoji } from './baseEmoji';
import { travelEmoji } from './travelEmoji';
import { activityEmoji } from './activityEmoji';
import { flagsEmoji } from './flagsEmoji';
import { techEmoji } from './techEmoji';
import { clothesEmoji } from './clothesEmoji';
import { jobsEmoji } from './jobsEmoji';
import { symbolsEmoji } from './symbolsEmoji';
import { gesturesEmoji } from './gesturesEmoji';
import { musicEmoji } from './musicEmoji';
import { weatherEmoji } from './weatherEmoji';
import { educationEmoji } from './educationEmoji';

// Объединяем все emoji в одну базу данных
export const emojiDatabase = [
    ...baseEmoji,
    ...travelEmoji,
    ...activityEmoji,
    ...flagsEmoji,
    ...techEmoji,
    ...clothesEmoji,
    ...jobsEmoji,
    ...symbolsEmoji,
    ...gesturesEmoji,
    ...musicEmoji,
    ...weatherEmoji,
    ...educationEmoji
];

export * from './baseEmoji';