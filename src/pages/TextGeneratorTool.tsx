import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { statsService } from '../utils/statsService';
import '../styles/tool-pages.css';
import './TextGeneratorTool.css';

const TextGeneratorTool: React.FC = () => {
  // Основные состояния
  const [language, setLanguage] = useState('english');
  const [countMode, setCountMode] = useState('characters'); // 'characters' или 'words'
  const [characterCount, setCharacterCount] = useState(100);
  const [wordCount, setWordCount] = useState(50);
  const [paragraphCount, setParagraphCount] = useState(3);
  const [result, setResult] = useState('');
  const [copied, setCopied] = useState(false);
  const [launchCount, setLaunchCount] = useState(0);
  const [languageDropdownOpen, setLanguageDropdownOpen] = useState(false);

  // Опции языков
  const languageOptions = {
    english: 'Английский',
    russian: 'Русский', 
    ukrainian: 'Украинский',
    lorem: 'Lorem Ipsum'
  };

  // Загрузка статистики
  useEffect(() => {
    const count = statsService.getLaunchCount('text-generator');
    setLaunchCount(count);
  }, []);

  // Очистка результата при изменении параметров
  useEffect(() => {
    setResult('');
    setCopied(false);
  }, [language, countMode, characterCount, wordCount, paragraphCount]);

  // Закрытие dropdown при клике вне его области
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (languageDropdownOpen) {
        const dropdown = document.querySelector('.language-selector');
        if (dropdown && !dropdown.contains(event.target as Node)) {
          setLanguageDropdownOpen(false);
        }
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [languageDropdownOpen]);

  // Словари для генерации осмысленного текста
  const textDictionaries = {
    english: {
      words: [
        'business', 'development', 'marketing', 'strategy', 'innovation', 'technology', 'solution', 'product',
        'service', 'customer', 'client', 'market', 'growth', 'success', 'team', 'company', 'organization',
        'project', 'management', 'leadership', 'experience', 'quality', 'professional', 'industry', 'modern',
        'digital', 'online', 'platform', 'system', 'process', 'analysis', 'research', 'data', 'information',
        'network', 'communication', 'collaboration', 'partnership', 'opportunity', 'challenge', 'goal',
        'objective', 'result', 'performance', 'efficiency', 'effectiveness', 'improvement', 'optimization',
        'enterprise', 'corporation', 'startup', 'entrepreneur', 'venture', 'investment', 'capital', 'finance',
        'revenue', 'profit', 'budget', 'resource', 'asset', 'value', 'brand', 'reputation', 'trust',
        'competition', 'competitive', 'advantage', 'marketplace', 'consumer', 'audience', 'segment', 'niche',
        'trend', 'insight', 'intelligence', 'analytics', 'metrics', 'KPI', 'ROI', 'conversion', 'funnel',
        'engagement', 'acquisition', 'retention', 'loyalty', 'satisfaction', 'feedback', 'survey', 'review',
        'content', 'creative', 'design', 'visual', 'branding', 'identity', 'message', 'campaign', 'promotion',
        'channel', 'media', 'social', 'influencer', 'viral', 'organic', 'paid', 'advertising', 'publicity',
        'automation', 'workflow', 'integration', 'API', 'cloud', 'software', 'application', 'mobile', 'web',
        'responsive', 'user', 'interface', 'UX', 'journey', 'touchpoint', 'interaction', 'usability', 'accessibility',
        'sustainable', 'environmental', 'social', 'responsibility', 'ethics', 'compliance', 'governance', 'risk',
        'security', 'privacy', 'protection', 'encryption', 'backup', 'recovery', 'continuity', 'resilience',
        'scalable', 'flexible', 'agile', 'lean', 'iterative', 'prototype', 'testing', 'validation', 'launch'
      ],
      sentences: [
        'The modern business landscape requires innovative approaches to customer engagement.',
        'Digital transformation has become a critical factor for organizational success.',
        'Effective marketing strategies drive sustainable growth and market expansion.',
        'Technology solutions enable companies to streamline their operational processes.',
        'Professional teams collaborate to deliver high-quality products and services.',
        'Data analysis provides valuable insights for informed decision-making.',
        'Strategic partnerships create new opportunities for business development.',
        'Customer experience remains the cornerstone of competitive advantage.'
      ]
    },
    russian: {
      words: [
        'бизнес', 'развитие', 'маркетинг', 'стратегия', 'инновации', 'технологии', 'решение', 'продукт',
        'услуга', 'клиент', 'заказчик', 'рынок', 'рост', 'успех', 'команда', 'компания', 'организация',
        'проект', 'управление', 'лидерство', 'опыт', 'качество', 'профессионал', 'индустрия', 'современный',
        'цифровой', 'онлайн', 'платформа', 'система', 'процесс', 'анализ', 'исследование', 'данные',
        'информация', 'сеть', 'коммуникация', 'сотрудничество', 'партнерство', 'возможность', 'вызов',
        'цель', 'задача', 'результат', 'производительность', 'эффективность', 'улучшение', 'оптимизация',
        'предприятие', 'корпорация', 'стартап', 'предприниматель', 'инвестиции', 'капитал', 'финансы',
        'доход', 'прибыль', 'бюджет', 'ресурс', 'актив', 'ценность', 'бренд', 'репутация', 'доверие',
        'конкуренция', 'конкурентный', 'преимущество', 'рыночный', 'потребитель', 'аудитория', 'сегмент',
        'тренд', 'инсайт', 'аналитика', 'метрики', 'показатели', 'конверсия', 'воронка', 'лиды',
        'вовлечение', 'привлечение', 'удержание', 'лояльность', 'удовлетворенность', 'отзывы', 'обратная связь',
        'контент', 'креатив', 'дизайн', 'визуал', 'брендинг', 'идентичность', 'сообщение', 'кампания',
        'канал', 'медиа', 'социальный', 'инфлюенсер', 'вирусный', 'органический', 'реклама', 'продвижение',
        'автоматизация', 'процесс', 'интеграция', 'облако', 'программа', 'приложение', 'мобильный', 'веб',
        'адаптивный', 'пользователь', 'интерфейс', 'опыт', 'путешествие', 'взаимодействие', 'юзабилити',
        'устойчивый', 'экологический', 'социальный', 'ответственность', 'этика', 'соответствие', 'риск',
        'безопасность', 'конфиденциальность', 'защита', 'шифрование', 'резервный', 'восстановление',
        'масштабируемый', 'гибкий', 'методология', 'итеративный', 'прототип', 'тестирование', 'валидация'
      ],
      sentences: [
        'Современный бизнес требует инновационных подходов к взаимодействию с клиентами.',
        'Цифровая трансформация стала критическим фактором успеха организаций.',
        'Эффективные маркетинговые стратегии обеспечивают устойчивый рост и расширение рынка.',
        'Технологические решения позволяют компаниям оптимизировать операционные процессы.',
        'Профессиональные команды сотрудничают для создания качественных продуктов и услуг.',
        'Анализ данных предоставляет ценные инсайты для принятия обоснованных решений.',
        'Стратегические партнерства создают новые возможности для развития бизнеса.',
        'Клиентский опыт остается основой конкурентного преимущества.'
      ]
    },
    ukrainian: {
      words: [
        'бізнес', 'розвиток', 'маркетинг', 'стратегія', 'інновації', 'технології', 'рішення', 'продукт',
        'послуга', 'клієнт', 'замовник', 'ринок', 'зростання', 'успіх', 'команда', 'компанія', 'організація',
        'проект', 'управління', 'лідерство', 'досвід', 'якість', 'професіонал', 'індустрія', 'сучасний',
        'цифровий', 'онлайн', 'платформа', 'система', 'процес', 'аналіз', 'дослідження', 'дані',
        'інформація', 'мережа', 'комунікація', 'співпраця', 'партнерство', 'можливість', 'виклик',
        'мета', 'завдання', 'результат', 'продуктивність', 'ефективність', 'покращення', 'оптимізація',
        'підприємство', 'корпорація', 'стартап', 'підприємець', 'інвестиції', 'капітал', 'фінанси',
        'дохід', 'прибуток', 'бюджет', 'ресурс', 'актив', 'цінність', 'бренд', 'репутація', 'довіра',
        'конкуренція', 'конкурентний', 'перевага', 'ринковий', 'споживач', 'аудиторія', 'сегмент',
        'тренд', 'інсайт', 'аналітика', 'метрики', 'показники', 'конверсія', 'воронка', 'ліди',
        'залучення', 'утримання', 'лояльність', 'задоволеність', 'відгуки', 'зворотний зв\'язок',
        'контент', 'креатив', 'дизайн', 'візуал', 'брендинг', 'ідентичність', 'повідомлення', 'кампанія',
        'канал', 'медіа', 'соціальний', 'інфлюенсер', 'вірусний', 'органічний', 'реклама', 'просування',
        'автоматизація', 'процедура', 'інтеграція', 'хмара', 'програма', 'додаток', 'мобільний', 'веб',
        'адаптивний', 'користувач', 'інтерфейс', 'досвід', 'подорож', 'взаємодія', 'юзабіліті',
        'стійкий', 'екологічний', 'соціальний', 'відповідальність', 'етика', 'відповідність', 'ризик',
        'безпека', 'конфіденційність', 'захист', 'шифрування', 'резервний', 'відновлення',
        'масштабований', 'гнучкий', 'методологія', 'ітеративний', 'прототип', 'тестування', 'валідація'
      ],
      sentences: [
        'Сучасний бізнес потребує інноваційних підходів до взаємодії з клієнтами.',
        'Цифрова трансформація стала критичним фактором успіху організацій.',
        'Ефективні маркетингові стратегії забезпечують стійке зростання та розширення ринку.',
        'Технологічні рішення дозволяють компаніям оптимізувати операційні процеси.',
        'Професійні команди співпрацюють для створення якісних продуктів та послуг.',
        'Аналіз даних надає цінні інсайти для прийняття обґрунтованих рішень.',
        'Стратегічні партнерства створюють нові можливості для розвитку бізнесу.',
        'Клієнтський досвід залишається основою конкурентної переваги.'
      ]
    }
  };

  // Генерация Lorem Ipsum
  const generateLoremIpsum = (length: number, mode: string): string => {
    const loremWords = [
      'lorem', 'ipsum', 'dolor', 'sit', 'amet', 'consectetur', 'adipiscing', 'elit', 'sed', 'do',
      'eiusmod', 'tempor', 'incididunt', 'ut', 'labore', 'et', 'dolore', 'magna', 'aliqua',
      'enim', 'ad', 'minim', 'veniam', 'quis', 'nostrud', 'exercitation', 'ullamco', 'laboris',
      'nisi', 'aliquip', 'ex', 'ea', 'commodo', 'consequat', 'duis', 'aute', 'irure', 'in',
      'reprehenderit', 'voluptate', 'velit', 'esse', 'cillum', 'fugiat', 'nulla', 'pariatur',
      'excepteur', 'sint', 'occaecat', 'cupidatat', 'non', 'proident', 'sunt', 'culpa', 'qui',
      'officia', 'deserunt', 'mollit', 'anim', 'id', 'est', 'laborum'
    ];

    if (mode === 'words') {
      const words = [];
      for (let i = 0; i < length; i++) {
        words.push(loremWords[Math.floor(Math.random() * loremWords.length)]);
      }
      return words.join(' ');
    } else {
      // По символам
      let text = '';
      while (text.length < length) {
        const word = loremWords[Math.floor(Math.random() * loremWords.length)];
        if (text.length + word.length + 1 <= length) {
          text += (text ? ' ' : '') + word;
        } else {
          break;
        }
      }
      return text;
    }
  };

  // Генерация осмысленного текста
  const generateMeaningfulText = (lang: string, length: number, mode: string): string => {
    const dict = textDictionaries[lang as keyof typeof textDictionaries];
    if (!dict) return '';

    if (mode === 'words') {
      const words = [];
      for (let i = 0; i < length; i++) {
        words.push(dict.words[Math.floor(Math.random() * dict.words.length)]);
      }
      return words.join(' ');
    } else {
      // По символам - комбинируем предложения и слова
      let text = '';
      const useSentences = Math.random() > 0.5;
      
      if (useSentences && dict.sentences) {
        while (text.length < length) {
          const sentence = dict.sentences[Math.floor(Math.random() * dict.sentences.length)];
          if (text.length + sentence.length + 1 <= length) {
            text += (text ? ' ' : '') + sentence;
          } else {
            break;
          }
        }
      } else {
        while (text.length < length) {
          const word = dict.words[Math.floor(Math.random() * dict.words.length)];
          if (text.length + word.length + 1 <= length) {
            text += (text ? ' ' : '') + word;
          } else {
            break;
          }
        }
      }
      return text;
    }
  };

  // Разбивка на абзацы
  const splitIntoParagraphs = (text: string, paragraphs: number): string => {
    if (paragraphs <= 1) {
      // Если один абзац, просто делаем первую букву заглавной
      return text.charAt(0).toUpperCase() + text.slice(1);
    }
    
    const words = text.split(' ');
    const wordsPerParagraph = Math.ceil(words.length / paragraphs);
    const result = [];
    
    for (let i = 0; i < paragraphs; i++) {
      const start = i * wordsPerParagraph;
      const end = Math.min(start + wordsPerParagraph, words.length);
      const paragraphWords = words.slice(start, end);
      if (paragraphWords.length > 0) {
        let paragraph = paragraphWords.join(' ');
        // Делаем первую букву абзаца заглавной
        paragraph = paragraph.charAt(0).toUpperCase() + paragraph.slice(1);
        result.push(paragraph);
      }
    }
    
    return result.join('\n\n');
  };

  // Основная функция генерации
  const handleGenerateText = () => {
    let generatedText = '';
    const currentLength = countMode === 'characters' ? characterCount : wordCount;
    
    if (language === 'lorem') {
      generatedText = generateLoremIpsum(currentLength, countMode);
    } else {
      generatedText = generateMeaningfulText(language, currentLength, countMode);
    }
    
    // Разбиваем на абзацы
    const finalText = splitIntoParagraphs(generatedText, paragraphCount);
    setResult(finalText);
    
    // Обновляем статистику
    statsService.incrementLaunchCount('text-generator');
    setLaunchCount(prev => prev + 1);
  };

  // Копирование результата
  const handleCopy = async () => {
    if (result) {
      try {
        await navigator.clipboard.writeText(result);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      } catch (err) {
        console.error('Не удалось скопировать текст:', err);
      }
    }
  };

  // Подсчет строк
  const countLines = (text: string): number => {
    if (text === '') return 0;
    return text.split('\n').length;
  };

  return (
    <div className="text-generator-tool">
      {/* Шапка инструмента */}
      <div className="tool-header-island">
        <Link to="/" className="back-button">
          <img src="/icons/arrow_left.svg" alt="" />
          Все инструменты
        </Link>
        <h1 className="tool-title">Генератор текста</h1>
        <div className="tool-header-buttons">
          <button className="tool-header-btn counter-btn" title="Счетчик запусков">
            <img src="/icons/rocket.svg" alt="" />
            <span className="counter">{launchCount}</span>
          </button>
          <button className="tool-header-btn" title="Подсказка">
            <img src="/icons/lamp.svg" alt="" />
          </button>
          <button className="tool-header-btn" title="Сделать скриншот">
            <img src="/icons/camera.svg" alt="" />
          </button>
        </div>
      </div>

      {/* Рабочая область с особой структурой */}
      <div className="main-workspace">
        {/* Левая колонка с настройками */}
        <div className="settings-section">
          {/* Первая группа - выбор языка */}
          <div className="settings-group">
            <div className="language-selector">
              <label className="language-label">Язык текста:</label>
              <div className="dropdown-container">
                <button 
                  className="dropdown-toggle"
                  onClick={() => setLanguageDropdownOpen(!languageDropdownOpen)}
                  type="button"
                >
                  <span>{languageOptions[language as keyof typeof languageOptions]}</span>
                  <span className="dropdown-arrow">▼</span>
                </button>
                {languageDropdownOpen && (
                  <div className="dropdown-menu">
                    {Object.entries(languageOptions).map(([key, name]) => (
                      <div 
                        key={key}
                        className={`dropdown-option ${language === key ? 'selected' : ''}`}
                        onClick={() => {
                          setLanguage(key);
                          setLanguageDropdownOpen(false);
                        }}
                      >
                        {name}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Вторая группа - все остальные настройки */}
          <div className="settings-group">
            {/* Тумблер счета символов/слов */}
            <div className="count-mode-toggle">
              <div className="count-mode-block">
                <div className="toggle-container">
                  <span className="toggle-label-left">Считаем символы</span>
                  <label className="toggle-switch">
                    <input
                      type="checkbox"
                      checked={countMode === 'words'}
                      onChange={(e) => setCountMode(e.target.checked ? 'words' : 'characters')}
                    />
                    <span className="toggle-slider"></span>
                  </label>
                  <span className="toggle-label-right">Считаем слова</span>
                </div>
              </div>
            </div>

            {/* Слайдер количества символов/слов */}
            <div className="count-slider-container">
              <label className="slider-label">
                Количество {countMode === 'characters' ? 'символов' : 'слов'}:
              </label>
              <div className="slider-group">
                <div className="slider-container">
                  <input
                    type="range"
                    min={countMode === 'characters' ? 50 : 10}
                    max={countMode === 'characters' ? 2000 : 500}
                    value={countMode === 'characters' ? characterCount : wordCount}
                    onChange={(e) => {
                      if (countMode === 'characters') {
                        setCharacterCount(parseInt(e.target.value));
                      } else {
                        setWordCount(parseInt(e.target.value));
                      }
                    }}
                    className="count-slider"
                  />
                </div>
                <div className="slider-value">
                  {countMode === 'characters' ? characterCount : wordCount}
                </div>
              </div>
            </div>

            {/* Слайдер количества абзацев */}
            <div className="count-slider-container">
              <label className="slider-label">Количество абзацев:</label>
              <div className="slider-group">
                <div className="slider-container">
                  <input
                    type="range"
                    min="1"
                    max="10"
                    value={paragraphCount}
                    onChange={(e) => setParagraphCount(parseInt(e.target.value))}
                    className="count-slider"
                  />
                </div>
                <div className="slider-value">{paragraphCount}</div>
              </div>
            </div>
          </div>
        </div>

        {/* Правая колонка с полем результата */}
        <div className="result-section">
          <textarea
            className="result-textarea"
            value={result}
            readOnly
            placeholder="Здесь будет результат"
          />
          <div className="result-controls">
            <span className="result-counter">{countLines(result)} стр.</span>
          </div>
        </div>
      </div>

      {/* Кнопки управления */}
      <div className="control-buttons">
        <button 
          className="action-btn primary" 
          style={{ width: '445px' }} 
          onClick={handleGenerateText}
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
    </div>
  );
};

export default TextGeneratorTool;