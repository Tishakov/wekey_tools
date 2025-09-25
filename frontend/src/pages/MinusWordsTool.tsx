import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useLocalizedLink } from '../hooks/useLanguageFromUrl';
import '../styles/tool-pages.css';
import { useAuthRequired } from '../hooks/useAuthRequired';
import AuthRequiredModal from '../components/AuthRequiredModal';
import AuthModal from '../components/AuthModal';
import './MinusWordsTool.css';
import { statsService } from '../utils/statsService';


const TOOL_ID = 'minus-words';
const MinusWordsTool: React.FC = () => {
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
    // Состояния компонента
    const [inputText, setInputText] = useState('');
    const [words, setWords] = useState<string[]>([]);
    const [minusWords, setMinusWords] = useState<string[]>([]);
    const [copied, setCopied] = useState(false);
    const [launchCount, setLaunchCount] = useState(0);

    // Загрузка статистики при монтировании компонента
    useEffect(() => {
        statsService.getLaunchCount(TOOL_ID).then(setLaunchCount);
    }, []);

    // Обработчик вставки из буфера обмена
    const handlePaste = async () => {
        try {
            const text = await navigator.clipboard.readText();
            setInputText(text);
        } catch (err) {
            console.error('Ошибка при вставке:', err);
        }
    };

    // Обработчик показа результата - разбивает текст на строки и слова
    const handleShowResult = async () => {
        // Проверяем авторизацию перед выполнением
        if (!requireAuth()) {
            return; // Если пользователь не авторизован, показываем модальное окно и прерываем выполнение

        }


        if (!inputText.trim()) {
            setWords([]);
            return;
        }
        
        // Разбиваем текст на строки, затем каждую строку на слова
        const lines = inputText.split('\n');
        const processedLines: string[] = [];
        
        lines.forEach(line => {
            if (line.trim()) {
                // Обрабатываем каждую строку: убираем знаки препинания и разбиваем на слова
                const wordsInLine = line
                    .replace(/[^\u0400-\u04FF\w\s]/g, ' ')
                    .split(/\s+/)
                    .filter(word => word.trim().length > 0)
                    .map(word => word.trim());
                
                if (wordsInLine.length > 0) {
                    processedLines.push(wordsInLine.join(' '));
                }
            }
            // Убрали блок else с добавлением пустых строк
        });
        
        setWords(processedLines);
        
