import OpenAI from 'openai';

// Интерфейсы для типизации
interface AnalyticsData {
  businessType: 'ecommerce' | 'landing' | 'instagram';
  landingType: 'ecommerce' | 'landing' | 'instagram';
  businessModel: 'product' | 'service';
  trafficSource: 'google-search' | 'google-shopping' | 'meta' | 'tiktok' | 'email';
  niche: string;
  metrics: Record<string, number | string>;
  period: number;
  currency: 'uah' | 'usd' | 'rub';
}

interface AIAnalysisResponse {
  success: boolean;
  analysis?: string;
  error?: string;
}

interface SynonymResponse {
  success: boolean;
  synonyms?: string[];
  error?: string;
}

interface WordInflectionResponse {
  success: boolean;
  inflections?: string[];
  error?: string;
}

interface TextGenerationResponse {
  success: boolean;
  text?: string;
  error?: string;
}

class OpenAIService {
  private client: OpenAI | null = null;
  private isInitialized = false;

  constructor() {
    console.log('🔧 Initializing OpenAI service...');
    
    try {
      // Проверяем наличие API ключа
      const apiKey = import.meta.env.VITE_OPENAI_API_KEY;
      
      console.log('🔑 API Key found:', apiKey ? 'Yes' : 'No');
      console.log('🔑 API Key length:', apiKey ? apiKey.length : 0);
      
      if (!apiKey) {
        console.warn('⚠️ OpenAI API key not found in environment variables');
        return;
      }

      this.client = new OpenAI({
        apiKey: apiKey,
        dangerouslyAllowBrowser: true // Разрешаем использование в браузере
      });
      
      this.isInitialized = true;
      console.log('✅ OpenAI service initialized successfully');
    } catch (error) {
      console.error('❌ Failed to initialize OpenAI client:', error);
    }
  }

  /**
   * Проверяет, инициализирован ли сервис
   */
  public isReady(): boolean {
    return this.isInitialized && this.client !== null;
  }

  /**
   * Создает промпт для анализа аналитических данных
   */
  private createAnalysisPrompt(data: AnalyticsData): string {
    const { landingType, businessModel, trafficSource, niche, metrics, period, currency } = data;
    
    // Определяем валютный символ и контекст страны
    const currencyInfo = {
      uah: { symbol: '₴', name: 'гривен', country: 'Украины', market: 'украинского рынка' },
      usd: { symbol: '$', name: 'долларов', country: 'США', market: 'американского рынка' },
      rub: { symbol: '₽', name: 'рублей', country: 'России', market: 'российского рынка' }
    };
    
    const currentCurrency = currencyInfo[currency];
    
    // Переводим значения для отображения
    const landingTypeNames = {
      'ecommerce': 'Интернет-магазин',
      'landing': 'Лендинг',
      'instagram': 'Instagram Direct'
    };
    
    const businessModelNames = {
      'product': 'Продажа товара',
      'service': 'Оказание услуг'
    };
    
    const trafficSourceNames = {
      'google-search': 'Поиск Google ADS',
      'google-shopping': 'Shopping Google ADS',
      'meta': 'Meta ADS',
      'tiktok': 'Tik-Tok ADS',
      'email': 'Email рассылка'
    };
    
    // Форматируем метрики для отправки
    const metricsText = Object.entries(metrics)
      .map(([key, value]) => {
        // Переводим ключи метрик на русский
        const metricNames: Record<string, string> = {
          clicks: 'Клики',
          impressions: 'Показы', 
          ctr: 'CTR (%)',
          cpc: `CPC (стоимость клика, ${currentCurrency.name})`,
          adCost: `Затраты на рекламу (${currentCurrency.name})`,
          cr1: 'CR1 - конверсия сайта (%)',
          leads: 'Количество лидов',
          cpl: `CPL (стоимость лида, ${currentCurrency.name})`,
          cr2: 'CR2 - из лида в продажу (%)',
          sales: 'Количество продаж',
          cpo: `CPO (стоимость продажи, ${currentCurrency.name})`,
          aov: `AOV (средний чек, ${currentCurrency.name})`,
          revenue: `Валовой доход (${currentCurrency.name})`,
          marginPercent: 'Маржинальность (%)',
          marginPerUnit: `Маржа с одной продажи (${currentCurrency.name})`,
          totalMargin: `Общая маржа (${currentCurrency.name})`,
          netProfit: `Чистая прибыль (${currentCurrency.name})`,
          netProfitPerUnit: `Чистая прибыль с одной (${currentCurrency.name})`,
          romi: 'ROMI (%)',
          roas: 'ROAS (коэффициент)',
          drr: 'ДРР (%)',
          iccr: 'ICCR (%)',
          cpm: `CPM (${currentCurrency.name})`
        };

        const metricName = metricNames[key] || key;
        
        // Рассчитываем значения за период для метрик, которые масштабируются
        const scalableMetrics = ['clicks', 'impressions', 'adCost', 'leads', 'sales', 'revenue', 'totalMargin', 'netProfit'];
        
        if (scalableMetrics.includes(key)) {
          const dailyValue = typeof value === 'string' ? parseFloat(value) || 0 : value;
          const periodValue = Math.round(dailyValue * period);
          return `${metricName}: ${dailyValue} (за день) / ${periodValue} (за ${period} дней)`;
        } else {
          return `${metricName}: ${value}`;
        }
      })
      .join('\n');

    return `
Ты - эксперт по интернет-маркетингу и аналитике с 10+ лет опыта. Проанализируй данные рекламной кампании и дай практические рекомендации.

ДАННЫЕ КАМПАНИИ:
Точка входа: ${landingTypeNames[landingType]}
Тип бизнеса: ${businessModelNames[businessModel]}
Источник трафика: ${trafficSourceNames[trafficSource]}
Ниша: ${niche}
Период анализа: ${period} ${period === 1 ? 'день' : period < 5 ? 'дня' : 'дней'}
Валюта: ${currentCurrency.name} (${currentCurrency.symbol})
Рынок анализа: ${currentCurrency.country}

ПОКАЗАТЕЛИ ЭФФЕКТИВНОСТИ:
${metricsText}

ЗАДАЧА: Проведи бизнес-анализ эффективности кампании с учетом специфики ${currentCurrency.market}, особенностей точки входа "${landingTypeNames[landingType]}", типа бизнеса "${businessModelNames[businessModel]}" и источника трафика "${trafficSourceNames[trafficSource]}"

1. ОЦЕНКА ЭФФЕКТИВНОСТИ
- Оцени ключевые показатели: CPC, CPL, CPO, ROMI, конверсии
- Сравни с нормами для ${businessModelNames[businessModel]} через ${landingTypeNames[landingType]} в нише "${niche}" на ${currentCurrency.market}
- Учти специфику источника трафика "${trafficSourceNames[trafficSource]}" при оценке показателей
- Определи, какие метрики в норме, а какие критично плохие
- Оцени общую эффективность от 1 до 10

2. АНАЛИЗ ПРИБЫЛЬНОСТИ
- Проанализируй структуру затрат и доходов с учетом особенностей ${trafficSourceNames[trafficSource]}
- Найди главные проблемы в воронке продаж (фокус на конверсиях, а не на "потерянных клиентах")
- Определи этап с наибольшим потенциалом для роста прибыли
- Рассчитай реальную маржинальность бизнеса

3. ПЛАН УЛУЧШЕНИЙ
- Дай 3-4 конкретные рекомендации с приоритетами, специфичными для ${trafficSourceNames[trafficSource]} и ${landingTypeNames[landingType]}
- Укажи целевые показатели для каждой метрики с учетом особенностей канала
- Рассчитай потенциальный рост прибыли от изменений
- Учти особенности и тренды ${currentCurrency.market}
4. ФИНАНСОВЫЙ ПРОГНОЗ
- Спрогнозируй результаты после внедрения рекомендаций
- Рассчитай конкретные суммы в ${currentCurrency.name}: на сколько тысяч увеличится доход, прибыль
- Укажи персонализированные цифры: "В вашем случае вы сможете увеличить доход на X тысяч ${currentCurrency.name}"
- Дай прогноз на 1 и 3 месяца с конкретными суммами

5. ЧЕКЛИСТ ДЕЙСТВИЙ ДЛЯ МАРКЕТОЛОГА
В конце анализа добавь раздел "ЧЕКЛИСТ ДЕЙСТВИЙ ДЛЯ МАРКЕТОЛОГА":
- Создай список из 5-7 максимально конкретных задач
- Каждая задача должна содержать конкретные цифры и методы: "Увеличить показатель X с Y до Z за счет действий A, B, C"
- Формат: простые пункты БЕЗ пустых строк между ними, цельный список
- Избегай общих фраз типа "оптимизировать страницы" - указывай конкретные метрики и способы
- Пример формата: "Повысить конверсию с 2% до 4% через A/B тестирование заголовков и кнопок"

СТИЛЬ ОТВЕТА: 
- Делай анализ персонализированным: "В вашем случае", "Для вашего бизнеса", "Вам стоит"
- Включай конкретные суммы в ${currentCurrency.name}, а не только проценты
- Фокусируйся на прибыли, затратах и конверсиях
- НЕ используй markdown форматирование и НЕ оставляй пустые строки в чеклисте
- Объем: 900-1300 слов
`;
  }

  /**
   * Получает анализ от ИИ для аналитических данных
   */
  public async getAnalysis(data: AnalyticsData): Promise<AIAnalysisResponse> {
    console.log('🚀 Starting AI analysis with data:', data);
    
    if (!this.isReady()) {
      console.error('❌ OpenAI service not ready');
      return {
        success: false,
        error: 'OpenAI сервис не инициализирован. Проверьте API ключ.'
      };
    }

    try {
      const prompt = this.createAnalysisPrompt(data);
      console.log('📝 Generated prompt:', prompt);
      
      console.log('🔄 Sending request to OpenAI...');
      const response = await this.client!.chat.completions.create({
        model: 'gpt-4o',
        messages: [
          {
            role: 'user',
            content: prompt
          }
        ],
        max_tokens: 2000,
        temperature: 0.7,
        stream: false
      });

      console.log('✅ Received response from OpenAI:', response);
      const analysis = response.choices[0]?.message?.content;
      
      if (!analysis) {
        console.error('❌ No analysis content in response');
        return {
          success: false,
          error: 'Не удалось получить ответ от ИИ'
        };
      }

      console.log('🎉 Analysis successful, length:', analysis.length);
      return {
        success: true,
        analysis: analysis.trim()
      };

    } catch (error: any) {
      console.error('💥 OpenAI API error:', error);
      
      // Обработка специфичных ошибок
      if (error.code === 'insufficient_quota') {
        return {
          success: false,
          error: 'Превышена квота API. Пожалуйста, проверьте настройки биллинга в OpenAI.'
        };
      }
      
      if (error.code === 'invalid_api_key') {
        return {
          success: false,
          error: 'Неверный API ключ OpenAI.'
        };
      }

      if (error.code === 'rate_limit_exceeded') {
        return {
          success: false,
          error: 'Превышен лимит запросов. Попробуйте через несколько минут.'
        };
      }

      return {
        success: false,
        error: `Ошибка при запросе к ИИ: ${error.message || 'Неизвестная ошибка'}`
      };
    }
  }

  /**
   * Генерация синонимов для слов и фраз
   */
  public async generateSynonyms(inputText: string, language: string = 'russian'): Promise<SynonymResponse> {
    console.log('🔤 Starting synonym generation...');
    
    if (!this.isReady()) {
      console.error('❌ OpenAI service not initialized');
      return {
        success: false,
        error: 'Сервис OpenAI не инициализирован. Проверьте настройки API ключа.'
      };
    }

    if (!inputText.trim()) {
      return {
        success: false,
        error: 'Введите текст для генерации синонимов'
      };
    }

    try {
      console.log('📝 Input text for synonyms:', inputText.slice(0, 100) + '...');
      
      const prompt = this.createSynonymPrompt(inputText.trim(), language);
      console.log('🤖 ChatGPT Prompt:', prompt);
      
      const response = await this.client!.chat.completions.create({
        model: 'gpt-4o',
        messages: [
          {
            role: 'user',
            content: prompt
          }
        ],
        max_tokens: 1000,
        temperature: 0.7
      });

      const content = response.choices[0]?.message?.content;
      
      if (!content) {
        throw new Error('Пустой ответ от ИИ');
      }

      console.log('✅ Raw AI response:', content.slice(0, 200) + '...');
      
      // Парсим ответ - ожидаем список синонимов, каждый с новой строки
      const synonyms = content
        .split('\n')
        .map(line => line.trim())
        .filter(line => line.length > 0)
        .map(line => line.replace(/^[-•\d\.]\s*/, '')) // Убираем маркеры списков
        .filter(synonym => synonym.length > 0);

      console.log('📝 Parsed synonyms:', synonyms.slice(0, 10), `(${synonyms.length} total)`);

      return {
        success: true,
        synonyms: synonyms
      };

    } catch (error: any) {
      console.error('💥 Error generating synonyms:', error);
      
      return {
        success: false,
        error: `Ошибка при генерации синонимов: ${error.message || 'Неизвестная ошибка'}`
      };
    }
  }

  /**
   * Создает промпт для генерации синонимов
   */
  private createSynonymPrompt(inputText: string, language: string = 'russian'): string {
    const languageNames = {
      'russian': 'русском',
      'ukrainian': 'украинском', 
      'english': 'английском'
    };
    
    const targetLanguage = languageNames[language as keyof typeof languageNames] || 'русском';
    
    return `
Ты - эксперт по лингвистике и семантике слов. Твоя задача - сгенерировать качественные синонимы для данного текста ИСКЛЮЧИТЕЛЬНО на ${targetLanguage} языке.

ВХОДНОЙ ТЕКСТ: "${inputText}"

ПРАВИЛА:
1. Если это отдельные слова - дай 5-10 синонимов для каждого слова
2. Если это фразы или предложения - дай 3-7 альтернативных вариантов формулировки
3. ВСЕ синонимы должны быть СТРОГО на ${targetLanguage} языке
4. Синонимы должны быть точными по смыслу и стилистически подходящими
5. Избегай редких архаизмов, используй современные слова
6. Для маркетинговых и деловых терминов предлагай профессиональные альтернативы

ФОРМАТ ОТВЕТА:
- Каждый синоним с новой строки
- БЕЗ нумерации, маркеров или дополнительных символов
- Только готовые к использованию варианты
- НЕ объясняй и НЕ комментируй

Теперь сгенерируй синонимы для: "${inputText}"
`.trim();
  }

  /**
   * Генерация склонений слов по падежам
   */
  public async generateWordInflections(inputText: string, language: string = 'russian'): Promise<WordInflectionResponse> {
    console.log('📝 Starting word inflection generation...');
    
    if (!this.isReady()) {
      console.error('❌ OpenAI service not initialized');
      return {
        success: false,
        error: 'Сервис OpenAI не инициализирован. Проверьте настройки API ключа.'
      };
    }

    if (!inputText.trim()) {
      return {
        success: false,
        error: 'Введите слова для склонения'
      };
    }

    try {
      console.log('📝 Input text for inflections:', inputText.slice(0, 100) + '...');
      
      const prompt = this.createInflectionPrompt(inputText.trim(), language);
      console.log('🤖 ChatGPT Prompt:', prompt);
      
      const response = await this.client!.chat.completions.create({
        model: 'gpt-4o',
        messages: [
          {
            role: 'user',
            content: prompt
          }
        ],
        max_tokens: 2000,
        temperature: 0.3
      });

      const content = response.choices[0]?.message?.content;
      
      if (!content) {
        throw new Error('Пустой ответ от ИИ');
      }

      console.log('✅ Raw AI response:', content.slice(0, 200) + '...');
      
      // Парсим ответ - ожидаем склонения, каждое с новой строки
      const rawInflections = content
        .split('\n')
        .map(line => line.trim())
        .filter(line => line.length > 0)
        .map(line => line.replace(/^[-•\d\.]\s*/, '')) // Убираем маркеры списков
        .filter(inflection => inflection.length > 0);

      // Убираем дубликаты, сохраняя порядок
      const inflections = rawInflections.filter((item, index) => rawInflections.indexOf(item) === index);

      console.log('📝 Parsed inflections:', inflections.slice(0, 10), `(${inflections.length} total, removed ${rawInflections.length - inflections.length} duplicates)`);

      return {
        success: true,
        inflections: inflections
      };

    } catch (error: any) {
      console.error('💥 Error generating word inflections:', error);
      
      return {
        success: false,
        error: `Ошибка при склонении слов: ${error.message || 'Неизвестная ошибка'}`
      };
    }
  }

  /**
   * Создает промпт для склонения слов
   */
  private createInflectionPrompt(inputText: string, language: string = 'russian'): string {
    const languageNames = {
      'russian': 'русском',
      'ukrainian': 'украинском', 
      'english': 'английском'
    };
    
    const targetLanguage = languageNames[language as keyof typeof languageNames] || 'русском';
    
    return `
Ты - эксперт по склонению слов на ${targetLanguage} языке. Твоя задача - просклонять данные слова по всем падежам и числам.

ВХОДНЫЕ СЛОВА: "${inputText}"

ВАЖНЫЕ ПРАВИЛА:
1. ВСЕГДА начинай с исходного слова, которое дал пользователь
2. Если слово не склоняется (как "фото", "кафе", "метро"), напиши только исходное слово и больше ничего
3. Для прилагательных и наречий склоняй как прилагательное в любом роде
4. Если дано наречие (например, "дешево"), сначала покажи само наречие, потом все формы соответствующего прилагательного
5. Для существительных показывай все падежи в единственном и множественном числе
6. Для глаголов показывай формы времени и лица
7. НЕ пиши названия падежей, времен или чисел - только сами формы слов
8. Каждая форма на отдельной строке
9. НЕ повторяй одинаковые формы - каждая форма должна быть уникальной
10. ВСЕ формы должны быть на ${targetLanguage} языке

ФОРМАТ ОТВЕТА:
- Первой строкой - исходное слово как есть (строчными буквами)
- Затем все УНИКАЛЬНЫЕ формы склонения
- БЕЗ указания падежей, чисел, времен
- БЕЗ объяснений и комментариев
- БЕЗ повторов одинаковых форм
- Разделяй разные слова пустой строкой

Пример для "дом":
дом
дома
дому
домом
доме
домов
домам
домами
домах

Пример для "фото" (несклоняемое):
фото

Пример для "дешево" (наречие):
дешево
дешевый
дешевого
дешевому
дешевым
дешевом
дешевые
дешевых
дешевым
дешевыми

Теперь просклоняй: "${inputText}"
`.trim();
  }

  /**
   * Генерирует текст с помощью ChatGPT
   */
  public async generateText(
    language: string,
    characterCount: number,
    wordCount: number,
    paragraphCount: number,
    countMode: 'characters' | 'words'
  ): Promise<TextGenerationResponse> {
    if (!this.isReady()) {
      return {
        success: false,
        error: 'OpenAI сервис не инициализирован. Проверьте API ключ.'
      };
    }

    try {
      const prompt = this.createTextGenerationPrompt(language, characterCount, wordCount, paragraphCount, countMode);
      console.log('🤖 Generating text with prompt length:', prompt.length);
      console.log('📝 Full prompt for text generation:');
      console.log('==================================================');
      console.log(prompt);
      console.log('==================================================');
      console.log('🔧 Generation parameters:', {
        language,
        characterCount,
        wordCount,
        paragraphCount,
        countMode,
        maxTokens: countMode === 'characters' ? Math.min(Math.ceil(characterCount * 1.5), 4000) : Math.min(Math.ceil(wordCount * 2), 4000)
      });

      const response = await this.client!.chat.completions.create({
        model: 'gpt-4o',
        messages: [
          {
            role: 'user',
            content: prompt
          }
        ],
        max_tokens: countMode === 'characters' ? Math.min(Math.ceil(characterCount * 1.5), 4000) : Math.min(Math.ceil(wordCount * 2), 4000),
        temperature: 0.8
      });

      const generatedText = response.choices[0]?.message?.content?.trim();

      console.log('📤 API Response received:');
      console.log('💬 Generated text length:', generatedText?.length || 0);
      console.log('📄 Generated text preview (first 200 chars):', generatedText?.substring(0, 200) + (generatedText && generatedText.length > 200 ? '...' : ''));

      if (!generatedText) {
        return {
          success: false,
          error: 'Не удалось сгенерировать текст'
        };
      }

      // Обрезаем текст до нужной длины если он превышает лимит
      let finalText = generatedText;
      if (countMode === 'characters') {
        if (generatedText.length > characterCount) {
          finalText = this.trimTextToLength(generatedText, characterCount, paragraphCount);
          console.log('✂️ Text trimmed from', generatedText.length, 'to', finalText.length, 'characters');
        } else if (generatedText.length < characterCount * 0.8) {
          // Если текста слишком мало (меньше 80% от нужного), запрашиваем дополнение
          console.log('📝 Text too short, requesting extension...');
          finalText = await this.extendText(generatedText, characterCount, paragraphCount, language, 'characters');
        }
      } else if (countMode === 'words') {
        const actualWordCount = generatedText.split(/\s+/).length;
        if (actualWordCount > wordCount) {
          finalText = this.trimTextToWords(generatedText, wordCount, paragraphCount);
          console.log('✂️ Text trimmed to', wordCount, 'words');
        } else if (actualWordCount < wordCount * 0.8) {
          // Если слов слишком мало (меньше 80% от нужного), запрашиваем дополнение
          console.log('📝 Text too short, requesting extension...');
          finalText = await this.extendText(generatedText, wordCount, paragraphCount, language, 'words');
        }
      }

      console.log('✅ Final text length:', finalText.length);

      return {
        success: true,
        text: this.normalizeText(finalText)
      };

    } catch (error: any) {
      console.error('❌ Text generation error:', error);
      
      let errorMessage = 'Произошла ошибка при генерации текста';
      
      if (error.response?.status === 401) {
        errorMessage = 'Ошибка авторизации API. Проверьте API ключ OpenAI.';
      } else if (error.response?.status === 429) {
        errorMessage = 'Превышен лимит запросов. Попробуйте позже.';
      } else if (error.message) {
        errorMessage = `Ошибка: ${error.message}`;
      }

      return {
        success: false,
        error: errorMessage
      };
    }
  }

  /**
   * Нормализует текст: исправляет пунктуацию, переносы строк и заглавные буквы
   */
  private normalizeText(text: string): string {
    let normalized = text;

    // 1. Нормализуем пробелы внутри строк, но сохраняем структуру абзацев
    normalized = normalized.replace(/[ \t]+/g, ' '); // Заменяем множественные пробелы на одиночные
    
    // 2. Нормализуем разделители абзацев - заменяем любые варианты на двойной перенос
    normalized = normalized.replace(/\n\s*\n+/g, '\n\n');
    
    // 3. Разбиваем на абзацы
    const paragraphs = normalized.split('\n\n').filter(p => p.trim());
    
    // 4. Обрабатываем каждый абзац отдельно
    const processedParagraphs = paragraphs.map(paragraph => {
      let cleaned = paragraph.trim();
      
      // Убираем одиночные переносы строк внутри абзаца (склеиваем строки)
      cleaned = cleaned.replace(/\n+/g, ' ');
      
      // Убираем лишние пробелы
      cleaned = cleaned.replace(/\s+/g, ' ');
      
      // Исправляем заглавную букву в начале абзаца
      if (cleaned.length > 0) {
        cleaned = cleaned.charAt(0).toUpperCase() + cleaned.slice(1);
      }
      
      // Добавляем точку в конце абзаца, если её нет и абзац не пустой
      if (cleaned.length > 0 && !/[.!?]$/.test(cleaned)) {
        cleaned += '.';
      }
      
      return cleaned;
    }).filter(p => p.length > 0); // Убираем пустые абзацы
    
    // 5. Соединяем абзацы обратно
    return processedParagraphs.join('\n\n');
  }

  /**
   * Дополняет короткий текст до нужной длины
   */
  private async extendText(
    originalText: string, 
    targetCount: number, 
    targetParagraphs: number, 
    language: string, 
    countMode: 'characters' | 'words'
  ): Promise<string> {
    try {
      const currentLength = countMode === 'characters' ? originalText.length : originalText.split(/\s+/).length;
      const needed = targetCount - currentLength;
      
      const extendPrompt = `
Продолжи этот текст на ${language === 'english' ? 'английском' : language === 'russian' ? 'русском' : 'украинском'} языке.

ИСХОДНЫЙ ТЕКСТ:
${originalText}

ЗАДАЧА:
- Добавь еще примерно ${needed} ${countMode === 'characters' ? 'символов' : 'слов'}
- Продолжи в том же стиле и тематике
- БЕЗ повторений уже написанного
- Логично дополни существующие абзацы или добавь новые
- Сохрани структуру с двойными переносами между абзацами

Продолжи текст:
`.trim();

      const response = await this.client!.chat.completions.create({
        model: 'gpt-4o',
        messages: [{ role: 'user', content: extendPrompt }],
        max_tokens: Math.min(Math.ceil(needed * 2), 1000),
        temperature: 0.7
      });

      const extension = response.choices[0]?.message?.content?.trim();
      if (extension) {
        const combinedText = originalText + '\n\n' + extension;
        console.log('📝 Text extended from', currentLength, 'to', countMode === 'characters' ? combinedText.length : combinedText.split(/\s+/).length);
        
        // Обрезаем до точной длины если получилось слишком много
        if (countMode === 'characters' && combinedText.length > targetCount) {
          return this.trimTextToLength(combinedText, targetCount, targetParagraphs);
        } else if (countMode === 'words') {
          const wordCount = combinedText.split(/\s+/).length;
          if (wordCount > targetCount) {
            return this.trimTextToWords(combinedText, targetCount, targetParagraphs);
          }
        }
        
        return combinedText;
      }
    } catch (error) {
      console.error('❌ Error extending text:', error);
    }
    
    // Если дополнение не удалось, возвращаем исходный текст
    return originalText;
  }

  /**
   * Обрезает текст до нужного количества символов с сохранением структуры абзацев
   */
  private trimTextToLength(text: string, maxLength: number, targetParagraphs: number): string {
    const paragraphs = text.split('\n\n');
    const charsPerParagraph = Math.floor(maxLength / targetParagraphs);
    
    const trimmedParagraphs: string[] = [];
    let remainingChars = maxLength;
    
    for (let i = 0; i < Math.min(paragraphs.length, targetParagraphs); i++) {
      let paragraph = paragraphs[i].trim();
      
      if (remainingChars <= 0) break;
      
      if (paragraph.length > charsPerParagraph && remainingChars > charsPerParagraph) {
        // Обрезаем по последнему полному слову
        paragraph = paragraph.substring(0, charsPerParagraph);
        const lastSpaceIndex = paragraph.lastIndexOf(' ');
        if (lastSpaceIndex > 0) {
          paragraph = paragraph.substring(0, lastSpaceIndex);
        }
      } else if (paragraph.length > remainingChars) {
        // Обрезаем до оставшихся символов
        paragraph = paragraph.substring(0, remainingChars);
        const lastSpaceIndex = paragraph.lastIndexOf(' ');
        if (lastSpaceIndex > 0) {
          paragraph = paragraph.substring(0, lastSpaceIndex);
        }
      }
      
      if (paragraph.length > 0) {
        trimmedParagraphs.push(paragraph);
        remainingChars -= paragraph.length + 2; // +2 для \n\n
      }
    }
    
    return trimmedParagraphs.join('\n\n');
  }

  /**
   * Обрезает текст до нужного количества слов с сохранением структуры абзацев
   */
  private trimTextToWords(text: string, maxWords: number, targetParagraphs: number): string {
    const paragraphs = text.split('\n\n');
    const wordsPerParagraph = Math.floor(maxWords / targetParagraphs);
    
    const trimmedParagraphs: string[] = [];
    let remainingWords = maxWords;
    
    for (let i = 0; i < Math.min(paragraphs.length, targetParagraphs); i++) {
      const paragraph = paragraphs[i].trim();
      const words = paragraph.split(/\s+/);
      
      if (remainingWords <= 0) break;
      
      const wordsToTake = Math.min(words.length, Math.min(wordsPerParagraph, remainingWords));
      const trimmedParagraph = words.slice(0, wordsToTake).join(' ');
      
      if (trimmedParagraph.length > 0) {
        trimmedParagraphs.push(trimmedParagraph);
        remainingWords -= wordsToTake;
      }
    }
    
    return trimmedParagraphs.join('\n\n');
  }

  /**
   * Создает промпт для генерации текста
   */
  private createTextGenerationPrompt(
    language: string,
    characterCount: number,
    wordCount: number,
    paragraphCount: number,
    countMode: 'characters' | 'words'
  ): string {
    const languageMap: Record<string, string> = {
      'russian': 'русском',
      'ukrainian': 'украинском', 
      'english': 'английском'
    };

    const targetLanguage = languageMap[language] || 'русском';
    const targetCount = countMode === 'characters' ? characterCount : wordCount;
    const countType = countMode === 'characters' ? 'символов' : 'слов';

    return `
Сгенерируй текст на ${targetLanguage} языке примерно ${Math.round(targetCount * 1.2)} ${countType}.

ТРЕБОВАНИЯ:
- Примерно ${Math.round(targetCount * 1.2)} ${countType} (можно немного больше)
- ${paragraphCount} абзац${paragraphCount === 1 ? '' : paragraphCount < 5 ? 'а' : 'ев'}
- Каждый абзац: примерно ${Math.round((targetCount * 1.2) / paragraphCount)} ${countType}

СТИЛЬ:
- Информативный, деловой стиль
- Связный осмысленный текст
- БЕЗ заголовков, списков, специального форматирования
- БЕЗ длинных тире, используй дефисы
- Двойной перенос между абзацами

Тема: бизнес, технологии, маркетинг.

Генерируй текст:
`.trim();
  }

  /**
   * Тестовый метод для проверки подключения
   */
  public async testConnection(): Promise<boolean> {
    if (!this.isReady()) {
      return false;
    }

    try {
      const response = await this.client!.chat.completions.create({
        model: 'gpt-4o',
        messages: [
          {
            role: 'user',
            content: 'Ответь одним словом: "Работает"'
          }
        ],
        max_tokens: 10
      });

      return response.choices[0]?.message?.content?.includes('Работает') || false;
    } catch (error) {
      console.error('Connection test failed:', error);
      return false;
    }
  }
}

// Экспортируем единственный экземпляр сервиса
export const openaiService = new OpenAIService();
export type { AnalyticsData, AIAnalysisResponse, SynonymResponse, WordInflectionResponse, TextGenerationResponse };