import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { statsService } from '../utils/statsService';
import '../styles/tool-pages.css';
import './WordMixerTool.css';


const TOOL_ID = 'word_mixer_tool';
const WordMixerTool: React.FC = () => {
    const [inputText1, setInputText1] = useState('');
    const [inputText2, setInputText2] = useState('');
    const [inputText3, setInputText3] = useState('');
    const [inputText4, setInputText4] = useState('');
    const [result, setResult] = useState('');
    const [copied, setCopied] = useState(false);
    const [launchCount, setLaunchCount] = useState(0);

    // Загрузка статистики запусков при монтировании
    useEffect(() => {
        statsService.getLaunchCount(TOOL_ID).then(setLaunchCount);
    }, []);

    // Очистка результата при изменении входных данных
    useEffect(() => {
        setResult('');
    }, [inputText1, inputText2, inputText3, inputText4]);

    // Функции для обмена значений между соседними полями
    const swapValues12 = () => {
        const temp = inputText1;
        setInputText1(inputText2);
        setInputText2(temp);
    };

    const swapValues23 = () => {
        const temp = inputText2;
        setInputText2(inputText3);
        setInputText3(temp);
    };

    const swapValues34 = () => {
        const temp = inputText3;
        setInputText3(inputText4);
        setInputText4(temp);
    };

    // Функции вставки из буфера для каждого поля
    const handlePaste1 = async () => {
        try {
            const text = await navigator.clipboard.readText();
            setInputText1(text);
        } catch (err) {
            console.error('Ошибка при вставке:', err);
        }
    };

    const handlePaste2 = async () => {
        try {
            const text = await navigator.clipboard.readText();
            setInputText2(text);
        } catch (err) {
            console.error('Ошибка при вставке:', err);
        }
    };

    const handlePaste3 = async () => {
        try {
            const text = await navigator.clipboard.readText();
            setInputText3(text);
        } catch (err) {
            console.error('Ошибка при вставке:', err);
        }
    };

    const handlePaste4 = async () => {
        try {
            const text = await navigator.clipboard.readText();
            setInputText4(text);
        } catch (err) {
            console.error('Ошибка при вставке:', err);
        }
    };

    // Функция миксации слов
    const handleShowResult = () => {
        // Получаем списки слов, фильтруя пустые строки
        const words1 = inputText1.trim() ? inputText1.trim().split('\n').filter(line => line.trim()).map(line => line.trim()) : [];
        const words2 = inputText2.trim() ? inputText2.trim().split('\n').filter(line => line.trim()).map(line => line.trim()) : [];
        const words3 = inputText3.trim() ? inputText3.trim().split('\n').filter(line => line.trim()).map(line => line.trim()) : [];
        const words4 = inputText4.trim() ? inputText4.trim().split('\n').filter(line => line.trim()).map(line => line.trim()) : [];

        // Собираем только непустые списки в правильном порядке
        const nonEmptyLists: string[][] = [];
        if (words1.length > 0) nonEmptyLists.push(words1);
        if (words2.length > 0) nonEmptyLists.push(words2);
        if (words3.length > 0) nonEmptyLists.push(words3);
        if (words4.length > 0) nonEmptyLists.push(words4);

        // Если нет непустых списков, результат пустой
        if (nonEmptyLists.length === 0) {
            setResult('');
            return;
        }

        // Увеличиваем счетчик запусков
        statsService.incrementLaunchCount(TOOL_ID);
        setLaunchCount(prev => prev + 1);

        // Алгоритм миксации: создаем все возможные комбинации и сохраняем промежуточные результаты
        let currentCombinations = nonEmptyLists[0].map(word => [word]);
        const allResults: string[] = [];

        // Если есть только один список, просто возвращаем его
        if (nonEmptyLists.length === 1) {
            setResult(currentCombinations.map(combination => combination.join(' ')).join('\n'));
            return;
        }

        // Последовательно комбинируем с каждым следующим списком
        for (let i = 1; i < nonEmptyLists.length; i++) {
            const nextList = nonEmptyLists[i];
            const newCombinations: string[][] = [];
            
            for (const combination of currentCombinations) {
                for (const word of nextList) {
                    newCombinations.push([...combination, word]);
                }
            }
            
            currentCombinations = newCombinations;
            
            // Добавляем результат этого этапа к общему результату
            const stageResults = currentCombinations.map(combination => combination.join(' '));
            allResults.push(...stageResults);
        }

        setResult(allResults.join('\n'));
    };

    // Копирование результата
    const handleCopy = async () => {
        try {
            await navigator.clipboard.writeText(result);
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
        } catch (err) {
            console.error('Ошибка при копировании:', err);
        }
    };

    // Подсчет строк
    const inputLines1 = inputText1.trim() ? inputText1.split('\n').length : 0;
    const inputLines2 = inputText2.trim() ? inputText2.split('\n').length : 0;
    const inputLines3 = inputText3.trim() ? inputText3.split('\n').length : 0;
    const inputLines4 = inputText4.trim() ? inputText4.split('\n').length : 0;
    const resultLines = result.trim() ? result.split('\n').length : 0;

    return (
        <div className="word-mixer-tool">
            {/* Header-остров инструмента */}
            <div className="tool-header-island">
                <Link to="/" className="back-button">
                    <img src="/icons/arrow_left.svg" alt="" />
                    Все инструменты
                </Link>
                <h1 className="tool-title">Миксация слов</h1>
                <div className="tool-header-buttons">
                    <button className="tool-header-btn counter-btn" title="Счетчик запусков">
                        <img src="/icons/rocket.svg" alt="" />
                        <span className="counter">{launchCount}</span>
                    </button>
                    <button className="tool-header-btn icon-only" title="Подсказки">
                        <img src="/icons/lamp.svg" alt="" />
                    </button>
                    <button className="tool-header-btn icon-only" title="Скриншот">
                        <img src="/icons/camera.svg" alt="" />
                    </button>
                </div>
            </div>

            {/* Основная рабочая область - 4 колонки с кнопками обмена */}
            <div className="main-workspace">
                <div className="quad-input">
                    {/* Колонка 1 */}
                    <div className="input-field">
                        <textarea
                            className="input-textarea"
                            placeholder="Ваш список 1..."
                            value={inputText1}
                            onChange={(e) => setInputText1(e.target.value)}
                        />
                        <div className="input-controls">
                            <button className="paste-button" onClick={handlePaste1}>
                                <img src="/icons/button_paste.svg" alt="" />
                                Вставить
                            </button>
                            <span className="info">{inputLines1} стр.</span>
                        </div>
                    </div>

                    {/* Кнопка обмена 1-2 */}
                    <div className="swap-button-container">
                        <button className="swap-button" onClick={swapValues12} title="Поменять местами">
                            <img src="/icons/change.svg" alt="Поменять местами" />
                        </button>
                    </div>

                    {/* Колонка 2 */}
                    <div className="input-field">
                        <textarea
                            className="input-textarea"
                            placeholder="Ваш список 2..."
                            value={inputText2}
                            onChange={(e) => setInputText2(e.target.value)}
                        />
                        <div className="input-controls">
                            <button className="paste-button" onClick={handlePaste2}>
                                <img src="/icons/button_paste.svg" alt="" />
                                Вставить
                            </button>
                            <span className="info">{inputLines2} стр.</span>
                        </div>
                    </div>

                    {/* Кнопка обмена 2-3 */}
                    <div className="swap-button-container">
                        <button className="swap-button" onClick={swapValues23} title="Поменять местами">
                            <img src="/icons/change.svg" alt="Поменять местами" />
                        </button>
                    </div>

                    {/* Колонка 3 */}
                    <div className="input-field">
                        <textarea
                            className="input-textarea"
                            placeholder="Ваш список 3..."
                            value={inputText3}
                            onChange={(e) => setInputText3(e.target.value)}
                        />
                        <div className="input-controls">
                            <button className="paste-button" onClick={handlePaste3}>
                                <img src="/icons/button_paste.svg" alt="" />
                                Вставить
                            </button>
                            <span className="info">{inputLines3} стр.</span>
                        </div>
                    </div>

                    {/* Кнопка обмена 3-4 */}
                    <div className="swap-button-container">
                        <button className="swap-button" onClick={swapValues34} title="Поменять местами">
                            <img src="/icons/change.svg" alt="Поменять местами" />
                        </button>
                    </div>

                    {/* Колонка 4 */}
                    <div className="input-field">
                        <textarea
                            className="input-textarea"
                            placeholder="Ваш список 4..."
                            value={inputText4}
                            onChange={(e) => setInputText4(e.target.value)}
                        />
                        <div className="input-controls">
                            <button className="paste-button" onClick={handlePaste4}>
                                <img src="/icons/button_paste.svg" alt="" />
                                Вставить
                            </button>
                            <span className="info">{inputLines4} стр.</span>
                        </div>
                    </div>
                </div>
            </div>

            {/* Кнопки управления */}
            <div className="control-buttons">
                <button 
                    className="action-btn primary" 
                    style={{ width: '445px' }} 
                    onClick={handleShowResult}
                >
                    Показать результат
                </button>
                
                <button 
                    className="action-btn secondary icon-left" 
                    style={{ width: '445px' }} 
                    onClick={handleCopy}
                    disabled={!result}
                >
                    <img src="/icons/button_copy.svg" alt="" />
                    {copied ? 'Скопировано!' : 'Скопировать результат'}
                </button>
            </div>

            {/* Поле результата */}
            <div className="result-section">
                <textarea
                    className="result-textarea"
                    placeholder="Здесь будет результат"
                    value={result}
                    readOnly
                />
                <div className="result-controls">
                    <span className="result-counter">{resultLines} стр.</span>
                </div>
            </div>
        </div>
    );
};

export default WordMixerTool;