import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { statsService } from '../utils/statsService';

const SynonymGeneratorTool: React.FC = () => {
  const navigate = useNavigate();
  const [inputText, setInputText] = useState('');
  const [result, setResult] = useState('');
  const [copied, setCopied] = useState(false);
  const [launchCount, setLaunchCount] = useState(0);

  // Загружаем статистику при инициализации
  useEffect(() => {
    setLaunchCount(statsService.getLaunchCount('synonym-generator'));
  }, []);

  // Словари синонимов для разных языков
  const synonymDictionaries = {
    russian: {
      'машина': ['автомобиль', 'тачка', 'транспорт', 'авто', 'средство передвижения'],
      'дом': ['жилище', 'здание', 'строение', 'обитель', 'кров'],
      'работа': ['труд', 'деятельность', 'занятие', 'профессия', 'служба'],
      'человек': ['личность', 'индивид', 'особа', 'субъект', 'персона'],
      'красивый': ['прекрасный', 'привлекательный', 'изящный', 'великолепный', 'восхитительный'],
      'большой': ['огромный', 'крупный', 'масштабный', 'значительный', 'гигантский'],
      'маленький': ['небольшой', 'крошечный', 'миниатюрный', 'компактный', 'малый'],
      'хороший': ['отличный', 'превосходный', 'замечательный', 'прекрасный', 'качественный'],
      'плохой': ['ужасный', 'негативный', 'скверный', 'неприятный', 'отвратительный'],
      'быстрый': ['скорый', 'стремительный', 'молниеносный', 'оперативный', 'резвый'],
      'умный': ['интеллектуальный', 'сообразительный', 'смышленый', 'мудрый', 'разумный'],
      'глупый': ['неразумный', 'бестолковый', 'недалекий', 'тупой', 'несообразительный'],
      'старый': ['древний', 'пожилой', 'давний', 'прежний', 'ветхий'],
      'новый': ['свежий', 'современный', 'недавний', 'последний', 'актуальный'],
      'богатый': ['состоятельный', 'зажиточный', 'обеспеченный', 'роскошный', 'денежный'],
      'бедный': ['неимущий', 'нищий', 'малоимущий', 'нуждающийся', 'обездоленный']
    },
    ukrainian: {
      'машина': ['автомобіль', 'авто', 'транспорт', 'засіб пересування'],
      'дім': ['житло', 'будинок', 'оселя', 'будівля'],
      'робота': ['праця', 'діяльність', 'заняття', 'професія'],
      'людина': ['особа', 'індивід', 'персона', 'суб\'єкт'],
      'красивий': ['прекрасний', 'гарний', 'привабливий', 'чудовий'],
      'великий': ['величезний', 'масштабний', 'значний', 'гігантський'],
      'маленький': ['невеликий', 'крихітний', 'мініатюрний', 'малий'],
      'хороший': ['відмінний', 'прекрасний', 'чудовий', 'якісний'],
      'поганий': ['жахливий', 'негативний', 'неприємний', 'огидний'],
      'швидкий': ['скорий', 'стрімкий', 'оперативний', 'прудкий'],
      'розумний': ['інтелектуальний', 'кмітливий', 'мудрий', 'тямущий'],
      'дурний': ['нерозумний', 'безтямний', 'недалекий', 'тупий'],
      'старий': ['давній', 'літній', 'древній', 'колишній'],
      'новий': ['свіжий', 'сучасний', 'недавній', 'останній'],
      'багатий': ['заможний', 'забезпечений', 'грошовитий', 'розкішний'],
      'бідний': ['незаможний', 'малозабезпечений', 'нужденний', 'убогий']
    },
    english: {
      'dog': ['hound', 'canine', 'pooch', 'pup', 'mutt'],
      'cat': ['feline', 'kitty', 'kitten', 'tabby', 'tomcat'],
      'house': ['home', 'dwelling', 'residence', 'abode', 'domicile'],
      'car': ['automobile', 'vehicle', 'auto', 'motor', 'ride'],
      'beautiful': ['gorgeous', 'stunning', 'attractive', 'lovely', 'magnificent'],
      'big': ['large', 'huge', 'enormous', 'massive', 'gigantic'],
      'small': ['tiny', 'little', 'miniature', 'compact', 'petite'],
      'good': ['excellent', 'great', 'wonderful', 'fantastic', 'superb'],
      'bad': ['terrible', 'awful', 'horrible', 'dreadful', 'atrocious'],
      'fast': ['quick', 'rapid', 'swift', 'speedy', 'hasty'],
      'smart': ['intelligent', 'clever', 'brilliant', 'wise', 'sharp'],
      'stupid': ['dumb', 'foolish', 'idiotic', 'senseless', 'mindless'],
      'old': ['ancient', 'elderly', 'aged', 'vintage', 'antique'],
      'new': ['fresh', 'modern', 'recent', 'latest', 'contemporary'],
      'rich': ['wealthy', 'affluent', 'prosperous', 'well-off', 'loaded'],
      'poor': ['impoverished', 'needy', 'broke', 'destitute', 'penniless'],
      'happy': ['joyful', 'cheerful', 'delighted', 'pleased', 'content'],
      'sad': ['unhappy', 'sorrowful', 'melancholy', 'depressed', 'gloomy']
    }
  };

  // Определение языка слова
  const detectLanguage = (word: string): 'russian' | 'ukrainian' | 'english' => {
    // Проверяем наличие кириллических символов
    const cyrillic = /[а-яё]/i.test(word);
    const latin = /[a-z]/i.test(word);
    
    if (cyrillic) {
      // Украинские специфические буквы
      const ukrainianChars = /[іїєґ]/i.test(word);
      return ukrainianChars ? 'ukrainian' : 'russian';
    } else if (latin) {
      return 'english';
    }
    
    // По умолчанию русский для неопределенных случаев
    return 'russian';
  };

  // Поиск синонимов для слова
  const findSynonyms = (word: string): string[] => {
    const cleanWord = word.toLowerCase().trim();
    const language = detectLanguage(cleanWord);
    const dictionary = synonymDictionaries[language] as Record<string, string[]>;
    
    return dictionary[cleanWord] || [];
  };

  // Обработка текста и генерация синонимов
  const generateSynonyms = () => {
    if (!inputText.trim()) {
      setResult('');
      return;
    }

    // Разбиваем текст на слова (по пробелам и переносам строк)
    const words = inputText
      .split(/[\s\n]+/)
      .filter(word => word.trim().length > 0)
      .map(word => word.replace(/[.,!?;:]/g, '')); // Убираем знаки препинания

    const results: string[] = [];

    words.forEach(word => {
      const synonyms = findSynonyms(word);
      if (synonyms.length > 0) {
        // Добавляем каждый синоним как отдельную строку
        results.push(...synonyms);
      } else {
        // Если синонимов нет, добавляем исходное слово
        results.push(word);
      }
    });

    setResult(results.join('\n'));
    
    // Обновляем статистику
    statsService.incrementLaunchCount('synonym-generator');
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

  // Вставка из буфера обмена
  const handlePaste = async () => {
    try {
      const text = await navigator.clipboard.readText();
      setInputText(text);
    } catch (err) {
      console.error('Не удалось вставить текст:', err);
    }
  };

  // Подсчет строк
  const getLineCount = (text: string): number => {
    return text ? text.split('\n').length : 0;
  };

  return (
    <div className="synonym-generator-tool">
      <div className="tool-header-island">
        <button 
          className="back-button"
          onClick={() => navigate('/')}
        >
          <img src="/icons/arrow_left.svg" alt="←" />
          Все инструменты
        </button>
        <h1 className="tool-title">Генератор синонимов</h1>
        <div className="tool-header-buttons">
          <button className="tool-header-btn counter-btn">
            <img src="/icons/rocket.svg" alt="🚀" />
            <span className="counter">{launchCount}</span>
          </button>
          <button className="tool-header-btn icon-only">
            <img src="/icons/lamp.svg" alt="💡" />
          </button>
          <button className="tool-header-btn icon-only">
            <img src="/icons/camera.svg" alt="📷" />
          </button>
        </div>
      </div>

      <div className="main-workspace">
        {/* Левая колонка - ввод текста */}
        <div className="input-section">
          <textarea
            className="input-textarea"
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            placeholder="Введите ваш текст..."
          />
          <div className="input-controls">
            <button 
              className="paste-button"
              onClick={handlePaste}
            >
              <img src="/icons/button_paste.svg" alt="📋" />
              Вставить
            </button>
            <div className="char-counter">
              {getLineCount(inputText)} стр.
            </div>
          </div>
        </div>

        {/* Правая колонка - результат */}
        <div className="result-section">
          <textarea
            className="result-textarea"
            value={result}
            placeholder="Здесь будет результат"
            readOnly
          />
          <div className="result-controls">
            <div className="result-counter">
              {getLineCount(result)} стр.
            </div>
          </div>
        </div>
      </div>

      {/* Кнопки управления */}
      <div className="control-buttons">
        <button 
          className="action-btn primary" 
          style={{ width: '445px' }} 
          onClick={generateSynonyms}
          disabled={!inputText.trim()}
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

export default SynonymGeneratorTool;