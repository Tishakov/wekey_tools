import React, { useState, useEffect } from 'react';
import './EmojiTool.css';
import { EmojiImage } from '../utils/emojiUtils';
import { Link } from 'react-router-dom';
import { statsService } from '../utils/statsService';

interface EmojiItem {
    emoji: string;
    keywords: string[];
    category?: string;
}

const EmojiTool: React.FC = () => {
    const [text, setText] = useState('');
    const [searchQuery, setSearchQuery] = useState('');
    const [favoriteEmojis, setFavoriteEmojis] = useState<string[]>([]);
    const [copied, setCopied] = useState(false);
    const [launchCount, setLaunchCount] = useState(0);
    const [selectedCategory, setSelectedCategory] = useState<string>('all');

    // Категории emoji
    const categories = [
        { id: 'all', name: 'Все', icon: '😀' },
        { id: 'faces', name: 'Лица', icon: '😀' },
        { id: 'hearts', name: 'Сердца', icon: '❤️' },
        { id: 'animals', name: 'Животные', icon: '🐶' },
        { id: 'food', name: 'Еда', icon: '🍎' },
        { id: 'nature', name: 'Природа', icon: '🌟' },
        { id: 'objects', name: 'Объекты', icon: '🎉' }
    ];

    // Расширенная база emoji с мультиязычными названиями
    const emojiDatabase: EmojiItem[] = [
        // Сердца и любовь
        { emoji: '❤️', keywords: ['heart', 'love', 'сердце', 'любов', 'любовь', 'серце', 'кохання'], category: 'hearts' },
        { emoji: '🧡', keywords: ['orange heart', 'оранжевое сердце', 'помаранчеве серце'], category: 'hearts' },
        { emoji: '💛', keywords: ['yellow heart', 'желтое сердце', 'жовте серце'], category: 'hearts' },
        { emoji: '💚', keywords: ['green heart', 'зеленое сердце', 'зелене серце'], category: 'hearts' },
        { emoji: '💙', keywords: ['blue heart', 'синее сердце', 'синє серце'], category: 'hearts' },
        { emoji: '💜', keywords: ['purple heart', 'фиолетовое сердце', 'фіолетове серце'] },
        { emoji: '🖤', keywords: ['black heart', 'черное сердце', 'чорне серце'] },
        { emoji: '🤍', keywords: ['white heart', 'белое сердце', 'біле серце'] },
        { emoji: '🤎', keywords: ['brown heart', 'коричневое сердце', 'коричневе серце'] },
        { emoji: '💔', keywords: ['broken heart', 'разбитое сердце', 'розбите серце'] },
        { emoji: '❣️', keywords: ['heart exclamation', 'сердце восклицание', 'серце оклик'] },
        { emoji: '💕', keywords: ['two hearts', 'два сердца', 'два серця'] },
        { emoji: '💞', keywords: ['revolving hearts', 'кружащиеся сердца', 'серця що крутяться'] },
        { emoji: '💓', keywords: ['beating heart', 'бьющееся сердце', 'серце що б\'ється'] },
        { emoji: '💗', keywords: ['growing heart', 'растущее сердце', 'зростаюче серце'] },
        { emoji: '💖', keywords: ['sparkling heart', 'сверкающее сердце', 'блискуче серце'] },
        { emoji: '💘', keywords: ['heart arrow', 'сердце стрела', 'серце стріла'] },
        { emoji: '💝', keywords: ['heart gift', 'подарок сердце', 'подарунок серце'] },
        { emoji: '💟', keywords: ['heart decoration', 'украшение сердце', 'прикраса серце'] },

        // Лица - счастливые  
        { emoji: '😀', keywords: ['grinning', 'улыбка', 'посмішка', 'smile', 'happy', 'радость', 'радість'] },
        { emoji: '😃', keywords: ['grinning eyes', 'улыбка глаза', 'посмішка очі', 'smile', 'happy'] },
        { emoji: '😄', keywords: ['grinning squinting', 'улыбка прищур', 'посмішка примружені очі'] },
        { emoji: '😁', keywords: ['beaming', 'сияющая улыбка', 'сяюча посмішка'] },
        { emoji: '😆', keywords: ['squinting', 'прищуренные глаза', 'примружені очі', 'laugh', 'смех', 'сміх'] },
        { emoji: '😅', keywords: ['sweat', 'пот', 'піт', 'nervous', 'нервный', 'нервовий'] },
        { emoji: '🤣', keywords: ['rolling', 'катается', 'котиться', 'laugh', 'lol', 'лол'] },
        { emoji: '😂', keywords: ['tears joy', 'слезы радости', 'сльози радості', 'laugh', 'cry'] },
        { emoji: '🙂', keywords: ['slightly smiling', 'слегка улыбается', 'трохи посміхається'] },
        { emoji: '🙃', keywords: ['upside down', 'вверх ногами', 'догори ногами'] },
        { emoji: '😉', keywords: ['winking', 'подмигивает', 'підморгує', 'wink'] },
        { emoji: '😊', keywords: ['smiling eyes', 'улыбающиеся глаза', 'усміхнені очі'] },
        { emoji: '😇', keywords: ['angel', 'ангел', 'янгол', 'halo', 'нимб'] },

        // Лица - влюбленные
        { emoji: '🥰', keywords: ['love', 'hearts', 'влюбленный', 'закоханий', 'любовь', 'кохання'] },
        { emoji: '😍', keywords: ['heart eyes', 'глаза сердечки', 'очі серця', 'love'] },
        { emoji: '🤩', keywords: ['star eyes', 'звезды в глазах', 'зірки в очах'] },
        { emoji: '😘', keywords: ['kiss', 'поцелуй', 'поцілунок'] },
        { emoji: '😗', keywords: ['kissing', 'целует', 'цілує'] },
        { emoji: '☺️', keywords: ['smiling', 'улыбается', 'посміхається'] },
        { emoji: '😚', keywords: ['kissing closed eyes', 'целует закрытые глаза', 'цілює заплющені очі'] },
        { emoji: '😙', keywords: ['kissing smiling', 'целует улыбаясь', 'цілує посміхаючись'] },
        { emoji: '🥲', keywords: ['tear joy', 'слеза радости', 'сльоза радості'] },

        // Животные
        { emoji: '🐶', keywords: ['dog', 'собака', 'собака', 'пес', 'щенок'] },
        { emoji: '🐱', keywords: ['cat', 'кот', 'кіт', 'кошка', 'котенок'] },
        { emoji: '🐭', keywords: ['mouse', 'мышь', 'миша'] },
        { emoji: '🐹', keywords: ['hamster', 'хомяк', 'хом\'як'] },
        { emoji: '🐰', keywords: ['rabbit', 'кролик', 'кролик', 'заяц'] },
        { emoji: '🦊', keywords: ['fox', 'лиса', 'лисиця'] },
        { emoji: '🐻', keywords: ['bear', 'медведь', 'ведмідь'] },
        { emoji: '🐼', keywords: ['panda', 'панда', 'панда'] },
        { emoji: '🐯', keywords: ['tiger', 'тигр', 'тигр'] },
        { emoji: '🦁', keywords: ['lion', 'лев', 'лев'] },
        { emoji: '🐮', keywords: ['cow', 'корова', 'корова'] },
        { emoji: '🐷', keywords: ['pig', 'свинья', 'свиня'] },
        { emoji: '🐸', keywords: ['frog', 'лягушка', 'жаба'] },
        { emoji: '🐙', keywords: ['octopus', 'осьминог', 'восьминіг'] },
        { emoji: '🐵', keywords: ['monkey', 'обезьяна', 'мавпа'] },

        // Еда
        { emoji: '🍎', keywords: ['apple', 'яблоко', 'яблуко'] },
        { emoji: '🍌', keywords: ['banana', 'банан', 'банан'] },
        { emoji: '🍊', keywords: ['orange', 'апельсин', 'апельсин'] },
        { emoji: '🍋', keywords: ['lemon', 'лимон', 'лимон'] },
        { emoji: '🍇', keywords: ['grapes', 'виноград', 'виноград'] },
        { emoji: '🍓', keywords: ['strawberry', 'клубника', 'полуниця'] },
        { emoji: '🥝', keywords: ['kiwi', 'киви', 'ківі'] },
        { emoji: '🍅', keywords: ['tomato', 'помидор', 'помідор'] },
        { emoji: '🥕', keywords: ['carrot', 'морковь', 'морква'] },
        { emoji: '🌽', keywords: ['corn', 'кукуруза', 'кукурудза'] },
        { emoji: '🍞', keywords: ['bread', 'хлеб', 'хліб'] },
        { emoji: '🧀', keywords: ['cheese', 'сыр', 'сир'] },
        { emoji: '🍕', keywords: ['pizza', 'пицца', 'піца'] },
        { emoji: '🍔', keywords: ['burger', 'бургер', 'бургер'] },
        { emoji: '🌭', keywords: ['hot dog', 'хот дог', 'хот дог'] },

        // Природа и символы
        { emoji: '🌟', keywords: ['star', 'звезда', 'зірка'] },
        { emoji: '⭐', keywords: ['star', 'звезда', 'зірка'] },
        { emoji: '✨', keywords: ['sparkles', 'блестки', 'блискітки'] },
        { emoji: '🌙', keywords: ['moon', 'луна', 'місяць'] },
        { emoji: '🌞', keywords: ['sun', 'солнце', 'сонце'] },
        { emoji: '🌈', keywords: ['rainbow', 'радуга', 'веселка'] },
        { emoji: '🌸', keywords: ['cherry blossom', 'сакура', 'сакура'] },
        { emoji: '🌺', keywords: ['flower', 'цветок', 'квітка'] },
        { emoji: '🌻', keywords: ['sunflower', 'подсолнух', 'соняшник'] },
        { emoji: '🌷', keywords: ['tulip', 'тюльпан', 'тюльпан'] },
        { emoji: '🌹', keywords: ['rose', 'роза', 'троянда'] },
        { emoji: '🔥', keywords: ['fire', 'огонь', 'вогонь'] },
        { emoji: '💧', keywords: ['water', 'вода', 'вода'] },
        { emoji: '⚡', keywords: ['lightning', 'молния', 'блискавка'] },
        { emoji: '💎', keywords: ['diamond', 'алмаз', 'алмаз'] },
        { emoji: '💯', keywords: ['hundred', 'сто', 'сто'] }
    ];

    // Инициализация избранного
    useEffect(() => {
        const stored = localStorage.getItem('emoji-favorites');
        if (stored) {
            setFavoriteEmojis(JSON.parse(stored));
        }
    }, []);

    // Обновление статистики
    useEffect(() => {
        statsService.incrementLaunchCount('emoji');
        const count = statsService.getLaunchCount('emoji');
        setLaunchCount(count);
    }, []);

    // Фильтрация emoji по поисковому запросу и категории
    const filteredEmojis = emojiDatabase.filter(item => {
        // Фильтр по категории
        if (selectedCategory !== 'all' && item.category !== selectedCategory) {
            return false;
        }
        
        // Фильтр по поиску
        if (!searchQuery) return true;
        
        const query = searchQuery.toLowerCase();
        return item.keywords.some(keyword => 
            keyword.toLowerCase().includes(query)
        );
    });

    // Функции для работы с текстом
    const insertEmoji = (emoji: string) => {
        setText(prev => prev + emoji);
    };

    const clearText = () => {
        setText('');
    };

    const copyText = async () => {
        try {
            await navigator.clipboard.writeText(text);
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
        } catch (error) {
            console.error('Ошибка копирования:', error);
        }
    };

    const pasteText = async () => {
        try {
            const clipboardText = await navigator.clipboard.readText();
            setText(clipboardText);
        } catch (error) {
            console.error('Ошибка вставки:', error);
        }
    };

    // Функции для работы с избранным
    const toggleFavorite = (emoji: string) => {
        const newFavorites = favoriteEmojis.includes(emoji)
            ? favoriteEmojis.filter(e => e !== emoji)
            : [...favoriteEmojis, emoji];
        
        setFavoriteEmojis(newFavorites);
        localStorage.setItem('emoji-favorites', JSON.stringify(newFavorites));
    };

    const clearFavorites = () => {
        setFavoriteEmojis([]);
        localStorage.removeItem('emoji-favorites');
    };

    return (
        <div className="tool-page emoji-tool">
            <div className="tool-header">
                <div className="tool-header-icon">
                    <img src="/icons/tool_emoji.svg" alt="Эмодзи" />
                </div>
                <div className="tool-header-content">
                    <h1>Эмодзи</h1>
                    <p>Библиотека эмодзи для копирования и работы с текстом</p>
                    <div className="tool-stats">
                        Запусков: {launchCount}
                    </div>
                </div>
            </div>

            <div className="main-workspace">
                {/* Левая панель - редактор текста */}
                <div className="emoji-text-editor">
                    <div className="text-editor-header">
                        <h3>Редактор текста</h3>
                        <div className="text-editor-actions">
                            <button 
                                onClick={copyText} 
                                className={`action-btn copy ${copied ? 'copied' : ''}`}
                                title="Копировать текст"
                            >
                                {copied ? '✓' : '📋'}
                            </button>
                            <button 
                                onClick={pasteText} 
                                className="action-btn paste"
                                title="Вставить из буфера"
                            >
                                📄
                            </button>
                            <button 
                                onClick={clearText} 
                                className="action-btn clear"
                                title="Очистить текст"
                            >
                                🗑️
                            </button>
                        </div>
                    </div>
                    <textarea
                        value={text}
                        onChange={(e) => setText(e.target.value)}
                        placeholder="Введите текст или добавьте эмодзи..."
                        className="emoji-textarea"
                    />
                    <div className="text-stats">
                        Символов: {text.length}
                    </div>
                </div>

                {/* Правая панель - библиотека эмодзи */}
                <div className="emoji-library">
                    <div className="emoji-library-header">
                        <h3>Библиотека эмодзи</h3>
                        
                        {/* Навигация по категориям */}
                        <div className="emoji-categories">
                            {categories.map(category => (
                                <button
                                    key={category.id}
                                    className={`category-btn ${selectedCategory === category.id ? 'active' : ''}`}
                                    onClick={() => setSelectedCategory(category.id)}
                                    title={category.name}
                                >
                                    <EmojiImage emoji={category.icon} size={20} />
                                    <span>{category.name}</span>
                                </button>
                            ))}
                        </div>
                        
                        <div className="emoji-search-container">
                            <input
                                type="text"
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                placeholder="Поиск эмодзи..."
                                className="emoji-search"
                            />
                        </div>
                    </div>

                    {/* Избранные эмодзи */}
                    {favoriteEmojis.length > 0 && (
                        <div className="emoji-favorites-section">
                            <div className="favorites-header">
                                <h4>Избранные</h4>
                                <button 
                                    onClick={clearFavorites}
                                    className="clear-favorites-btn"
                                    title="Очистить избранное"
                                >
                                    🗑️
                                </button>
                            </div>
                            <div className="emoji-grid favorites-grid">
                                {favoriteEmojis.map((emoji, index) => (
                                    <div
                                        key={`fav-${index}`}
                                        className="emoji-item favorite"
                                        onClick={() => insertEmoji(emoji)}
                                        title={`Добавить ${emoji} в текст`}
                                    >
                                        <EmojiImage emoji={emoji} size={24} />
                                        <button
                                            className="favorite-btn active"
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                toggleFavorite(emoji);
                                            }}
                                            title="Убрать из избранного"
                                        >
                                            ⭐
                                        </button>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Все эмодзи */}
                    <div className="emoji-all-section">
                        <h4>Все эмодзи ({filteredEmojis.length})</h4>
                        <div className="emoji-grid">
                            {filteredEmojis.map((item, index) => (
                                <div
                                    key={index}
                                    className="emoji-item"
                                    onClick={() => insertEmoji(item.emoji)}
                                    title={`${item.emoji} - ${item.keywords.slice(0, 3).join(', ')}`}
                                >
                                    <EmojiImage emoji={item.emoji} size={24} />
                                    <button
                                        className={`favorite-btn ${favoriteEmojis.includes(item.emoji) ? 'active' : ''}`}
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            toggleFavorite(item.emoji);
                                        }}
                                        title={favoriteEmojis.includes(item.emoji) ? 'Убрать из избранного' : 'Добавить в избранное'}
                                    >
                                        {favoriteEmojis.includes(item.emoji) ? '⭐' : '☆'}
                                    </button>
                                </div>
                            ))}
                        </div>
                    </div>

                    {filteredEmojis.length === 0 && searchQuery && (
                        <div className="no-results">
                            Эмодзи не найдены. Попробуйте другой поисковый запрос.
                        </div>
                    )}
                </div>
            </div>

            <div className="tool-footer">
                <div className="navigation-hint">
                    ← Назад к <Link to="/">Главной</Link>
                </div>
                <div className="tool-description">
                    <p>
                        <strong>Эмодзи</strong> — инструмент для работы с эмодзи. 
                        Поддерживает поиск на русском, украинском и английском языках, 
                        избранные эмодзи и редактирование текста.
                    </p>
                </div>
            </div>
        </div>
    );
};

export default EmojiTool;
