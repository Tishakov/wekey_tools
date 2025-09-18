import OpenAI from 'openai';

// Интерфейсы для типизации
interface AnalyticsData {
  businessType: 'ecommerce' | 'landing';
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
    const { businessType, niche, metrics, period, currency } = data;
    
    // Определяем валютный символ и контекст страны
    const currencyInfo = {
      uah: { symbol: '₴', name: 'гривен', country: 'Украины', market: 'украинского рынка' },
      usd: { symbol: '$', name: 'долларов', country: 'США', market: 'американского рынка' },
      rub: { symbol: '₽', name: 'рублей', country: 'России', market: 'российского рынка' }
    };
    
    const currentCurrency = currencyInfo[currency];
    
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
Тип бизнеса: ${businessType === 'ecommerce' ? 'Интернет-магазин' : 'Лендинг'}
Ниша: ${niche}
Период анализа: ${period} ${period === 1 ? 'день' : period < 5 ? 'дня' : 'дней'}
Валюта: ${currentCurrency.name} (${currentCurrency.symbol})
Рынок анализа: ${currentCurrency.country}

ПОКАЗАТЕЛИ ЭФФЕКТИВНОСТИ:
${metricsText}

ЗАДАЧА: Проведи бизнес-анализ эффективности кампании с учетом специфики ${currentCurrency.market}

1. ОЦЕНКА ЭФФЕКТИВНОСТИ
- Оцени ключевые показатели: CPC, CPL, CPO, ROMI, конверсии
- Сравни с нормами для ${businessType === 'ecommerce' ? 'интернет-магазинов' : 'лендингов'} в нише "${niche}" на ${currentCurrency.market}
- Определи, какие метрики в норме, а какие критично плохие
- Оцени общую эффективность от 1 до 10

2. АНАЛИЗ ПРИБЫЛЬНОСТИ
- Проанализируй структуру затрат и доходов
- Найди главные проблемы в воронке продаж (фокус на конверсиях, а не на "потерянных клиентах")
- Определи этап с наибольшим потенциалом для роста прибыли
- Рассчитай реальную маржинальность бизнеса

3. ПЛАН УЛУЧШЕНИЙ
- Дай 3-4 конкретные рекомендации с приоритетами
- Укажи целевые показатели для каждой метрики
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
export type { AnalyticsData, AIAnalysisResponse };