import React, { useState, useEffect, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { useAuthRequired } from '../hooks/useAuthRequired';
import AuthRequiredModal from '../components/AuthRequiredModal';
import AuthModal from '../components/AuthModal';
import './EmojiTool.css';
import '../styles/tool-pages.css';
import { EmojiImage } from '../utils/emojiUtils';
import { Link } from 'react-router-dom';
import { statsService } from '../utils/statsService';
import { emojiDatabase } from '../data/emoji/index';
import { useLocalizedLink } from '../hooks/useLanguageFromUrl';
import SEOHead from '../components/SEOHead';


const TOOL_ID = 'emoji';
const EmojiTool: React.FC = () => {
    const { t } = useTranslation();

// Auth Required Hook
    const {
        isAuthRequiredModalOpen,
        isAuthModalOpen,
        requireAuth,
        closeAuthRequiredModal,
        closeAuthModal,
        openAuthModal
    } = useAuthRequired();
    const { createLink } = useLocalizedLink();
    const [text, setText] = useState('');
    const [searchQuery, setSearchQuery] = useState('');
    const [launchCount, setLaunchCount] = useState(0);
    const [selectedCategory, setSelectedCategory] = useState<string>('all');
    const [copied, setCopied] = useState(false);
    const textareaRef = useRef<HTMLTextAreaElement>(null);

    // Категории с алфавитной сортировкой (кроме "Все")
    const categories = [
        { id: 'all', name: t('emojiTool.categories.all'), icon: '😀' },
        { id: 'activities', name: t('emojiTool.categories.activities'), icon: '⚽' },
        { id: 'animals', name: t('emojiTool.categories.animals'), icon: '🐶' },
        { id: 'gestures', name: t('emojiTool.categories.gestures'), icon: '👋' },
        { id: 'food', name: t('emojiTool.categories.food'), icon: '🍎' },
        { id: 'faces', name: t('emojiTool.categories.faces'), icon: '😍' },
        { id: 'medicine', name: t('emojiTool.categories.medicine'), icon: '💊' },
        { id: 'music', name: t('emojiTool.categories.music'), icon: '🎵' },
        { id: 'objects', name: t('emojiTool.categories.objects'), icon: '💎' },
        { id: 'clothes', name: t('emojiTool.categories.clothes'), icon: '👕' },
        { id: 'education', name: t('emojiTool.categories.education'), icon: '📚' },
        { id: 'weather', name: t('emojiTool.categories.weather'), icon: '☀️' },
        { id: 'nature', name: t('emojiTool.categories.nature'), icon: '🌟' },
        { id: 'jobs', name: t('emojiTool.categories.jobs'), icon: '👩‍💻' },
        { id: 'travel', name: t('emojiTool.categories.travel'), icon: '✈️' },
        { id: 'hearts', name: t('emojiTool.categories.hearts'), icon: '❤️' },
        { id: 'symbols', name: t('emojiTool.categories.symbols'), icon: '⭐' },
        { id: 'tech', name: t('emojiTool.categories.tech'), icon: '💻' },
        { id: 'transport', name: t('emojiTool.categories.transport'), icon: '🚗' },
        { id: 'flags', name: t('emojiTool.categories.flags'), icon: '🏁' }
    ];

    // Обновление статистики
    useEffect(() => {
        const loadStats = async () => {
            try {
                const newCount = await statsService.incrementAndGetCount(TOOL_ID);
                setLaunchCount(newCount);
            } catch (error) {
                console.warn('Failed to update statistics:', error);
                const count = await statsService.getLaunchCount(TOOL_ID);
                setLaunchCount(count);
            }
        };
        loadStats();
    }, []);

    // Фильтрация emoji по поисковому запросу и категории
    const filteredEmojis = emojiDatabase.filter((item: any) => {
        // Фильтр по категории
        if (selectedCategory !== 'all' && item.category !== selectedCategory) {
            return false;
        }
        
        // Фильтр по поиску
        if (!searchQuery) return true;
        
        const query = searchQuery.toLowerCase();
        return item.keywords.some((keyword: string) => 
            keyword.toLowerCase().includes(query)
        );
    });

    // Функции для работы с текстом
    const insertEmoji = (emoji: string) => {
        const textarea = textareaRef.current;
        if (!textarea) {
            // Fallback: добавляем в конец, если ref недоступен
            setText(prev => prev + emoji);
            return;
        }

        const startPos = textarea.selectionStart;
        const endPos = textarea.selectionEnd;
        
        setText(prev => {
            const newText = prev.slice(0, startPos) + emoji + prev.slice(endPos);
            
            // Устанавливаем курсор после вставленного эмодзи
            setTimeout(() => {
                textarea.focus();
                const newCursorPos = startPos + emoji.length;
                textarea.setSelectionRange(newCursorPos, newCursorPos);
            }, 0);
            
            return newText;
        });
    };

    // Функция копирования результата
    const handleCopy = async () => {
        // Проверяем авторизацию перед выполнением
        if (!requireAuth()) {
            return; // Если пользователь не авторизован, показываем модальное окно и прерываем выполнение
        }

        // Увеличиваем счетчик запусков
        try {
            const newCount = await statsService.incrementAndGetCount(TOOL_ID);
            setLaunchCount(newCount);
        } catch (error) {
            console.error('Failed to update stats:', error);
            setLaunchCount(prev => prev + 1);
        }


        try {
            await navigator.clipboard.writeText(text);
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
        } catch (err) {
            console.error('Ошибка копирования:', err);
        }
    };

    return (
        <div className="emoji-tool">
            <SEOHead 
                title={t('emojiTool.title')}
                description={t('emojiTool.description')}
                keywords={t('emojiTool.keywords')}
            />
            {/* Header-остров инструмента */}
            <div className="tool-header-island">
                <Link to={createLink('')} className="back-button">
                    <img src="/icons/arrow_left.svg" alt="" />
                    {t('navigation.allTools')}
                </Link>
                <h1 className="tool-title">{t('emojiTool.title')}</h1>
                <div className="tool-header-buttons">
                    <button className="tool-header-btn counter-btn" title={t('common.launchCounter')}>
                        <img src="/icons/rocket.svg" alt="" />
                        <span className="counter">{launchCount}</span>
                    </button>
                    <button className="tool-header-btn icon-only" title={t('common.hints')}>
                        <img src="/icons/lamp.svg" alt="" />
                    </button>
                    <button className="tool-header-btn icon-only" title={t('common.screenshot')}>
                        <img src="/icons/camera.svg" alt="" />
                    </button>
                </div>
            </div>

            {/* Основная рабочая область */}
            <div className="main-workspace">
                {/* Левая панель - редактор текста */}
                <div className="emoji-text-editor">
                    <textarea
                        ref={textareaRef}
                        value={text}
                        onChange={(e) => setText(e.target.value)}
                        placeholder={t('emojiTool.inputPlaceholder')}
                        className="emoji-textarea"
                    />
                    
                    {/* Кнопка копирования */}
                    <button 
                        className="action-btn secondary icon-left" 
                        style={{ width: '445px' }} 
                        onClick={handleCopy}
                    >
                        <img src="/icons/button_copy.svg" alt="" />
                        {copied ? t('common.copied') : t('emojiTool.buttons.copyResult')}
                    </button>
                </div>

                {/* Правая панель - библиотека эмодзи */}
                <div className="emoji-library">
                    <div className="emoji-library-header">
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
                    </div>

                    {/* Все эмодзи */}
                    <div className="emoji-all-section">
                        {/* Поиск эмодзи */}
                        <div className="emoji-search-container">
                            <input
                                type="text"
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                placeholder={t('emojiTool.searchPlaceholder', { count: filteredEmojis.length })}
                                className="emoji-search"
                            />
                        </div>
                        
                        <div className="emoji-grid">
                            {filteredEmojis.map((item: any, index: number) => (
                                <div
                                    key={index}
                                    className="emoji-item"
                                    onClick={() => insertEmoji(item.emoji)}
                                    title={`${item.emoji} - ${item.keywords.slice(0, 3).join(', ')}`}
                                >
                                    <EmojiImage emoji={item.emoji} size={24} />
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
        </div>
    );
};

export default EmojiTool;
