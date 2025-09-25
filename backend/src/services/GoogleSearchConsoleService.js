const { google } = require('googleapis');
const { OAuth2Client } = require('google-auth-library');

class GoogleSearchConsoleService {
  constructor() {
    this.oauth2Client = new OAuth2Client(
      process.env.GOOGLE_CLIENT_ID,
      process.env.GOOGLE_CLIENT_SECRET,
      process.env.GOOGLE_REDIRECT_URI || 'http://localhost:8880/api/tools/seo-audit-pro/callback'
    );
    
    this.searchconsole = google.searchconsole({
      version: 'v1',
      auth: this.oauth2Client
    });
  }

  // Генерация URL для OAuth авторизации
  generateAuthUrl() {
    return this.oauth2Client.generateAuthUrl({
      access_type: 'offline',
      scope: [
        'https://www.googleapis.com/auth/webmasters.readonly',
        'https://www.googleapis.com/auth/webmasters'
      ],
      prompt: 'consent',
      state: 'gsc_auth' // Помечаем как GSC авторизацию
    });
  }

  // Обмен кода авторизации на токены
  async getTokensFromCode(code) {
    try {
      // Правильный метод для обмена кода на токены
      const { tokens } = await this.oauth2Client.getToken(code);
      this.oauth2Client.setCredentials(tokens);
      return tokens;
    } catch (error) {
      console.error('Error getting tokens:', error);
      console.error('Error details:', error);
      throw new Error('Failed to exchange authorization code for tokens');
    }
  }

  // Установка токенов для работы с API
  setCredentials(tokens) {
    this.oauth2Client.setCredentials(tokens);
  }

  // Получение списка сайтов пользователя
  async getSites() {
    try {
      const response = await this.searchconsole.sites.list();
      return response.data.siteEntry || [];
    } catch (error) {
      console.error('Error fetching sites:', error);
      throw new Error('Failed to fetch sites from Search Console');
    }
  }

  // Получение данных производительности поиска
  async getSearchPerformance(siteUrl, startDate, endDate, dimensions = ['query']) {
    try {
      const response = await this.searchconsole.searchanalytics.query({
        siteUrl: siteUrl,
        requestBody: {
          startDate: startDate,
          endDate: endDate,
          dimensions: dimensions,
          rowLimit: 1000,
          startRow: 0
        }
      });

      return response.data.rows || [];
    } catch (error) {
      console.error('Error fetching search performance:', error);
      throw new Error('Failed to fetch search performance data');
    }
  }

  // Получение данных по страницам
  async getPagePerformance(siteUrl, startDate, endDate) {
    return await this.getSearchPerformance(siteUrl, startDate, endDate, ['page']);
  }

  // Получение данных по запросам
  async getQueryPerformance(siteUrl, startDate, endDate) {
    return await this.getSearchPerformance(siteUrl, startDate, endDate, ['query']);
  }

  // Получение данных по устройствам
  async getDevicePerformance(siteUrl, startDate, endDate) {
    return await this.getSearchPerformance(siteUrl, startDate, endDate, ['device']);
  }

  // Получение данных индексации
  async getIndexCoverage(siteUrl) {
    try {
      // Search Console API v1 не предоставляет прямой доступ к данным индексации
      // Используем обходной путь через получение ошибок сайта
      const response = await this.searchconsole.sites.get({
        siteUrl: siteUrl
      });

      // Возвращаем базовую информацию о сайте
      return {
        site: response.data,
        // Для полных данных индексации потребуется использовать Web API или парсинг
        indexStatus: 'verified'
      };
    } catch (error) {
      console.error('Error fetching index coverage:', error);
      throw new Error('Failed to fetch index coverage data');
    }
  }

  // Агрегированный анализ сайта
  async analyzeSite(siteUrl, tokens) {
    try {
      this.setCredentials(tokens);

      // Устанавливаем период анализа (последние 28 дней)
      const endDate = new Date();
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - 28);

      const formatDate = (date) => date.toISOString().split('T')[0];
      const startDateStr = formatDate(startDate);
      const endDateStr = formatDate(endDate);

      // Параллельно получаем все данные
      const [
        queryData,
        pageData,
        deviceData,
        indexData
      ] = await Promise.all([
        this.getQueryPerformance(siteUrl, startDateStr, endDateStr),
        this.getPagePerformance(siteUrl, startDateStr, endDateStr),
        this.getDevicePerformance(siteUrl, startDateStr, endDateStr),
        this.getIndexCoverage(siteUrl)
      ]);

      // Агрегируем данные
      const totalClicks = queryData.reduce((sum, row) => sum + (row.clicks || 0), 0);
      const totalImpressions = queryData.reduce((sum, row) => sum + (row.impressions || 0), 0);
      const averageCTR = totalImpressions > 0 ? (totalClicks / totalImpressions) * 100 : 0;
      const averagePosition = queryData.length > 0 
        ? queryData.reduce((sum, row) => sum + (row.position || 0), 0) / queryData.length 
        : 0;

      // Формируем результат анализа
      const analysis = {
        url: siteUrl,
        period: {
          startDate: startDateStr,
          endDate: endDateStr
        },
        gscData: {
          searchPerformance: {
            totalClicks,
            totalImpressions,
            averageCTR: Math.round(averageCTR * 100) / 100,
            averagePosition: Math.round(averagePosition * 10) / 10,
            queries: queryData.slice(0, 20).map(row => ({
              query: row.keys[0],
              clicks: row.clicks || 0,
              impressions: row.impressions || 0,
              ctr: Math.round((row.ctr || 0) * 10000) / 100,
              position: Math.round((row.position || 0) * 10) / 10
            })),
            pages: pageData.slice(0, 20).map(row => ({
              page: row.keys[0],
              clicks: row.clicks || 0,
              impressions: row.impressions || 0,
              ctr: Math.round((row.ctr || 0) * 10000) / 100,
              position: Math.round((row.position || 0) * 10) / 10
            })),
            devices: deviceData.map(row => ({
              device: row.keys[0],
              clicks: row.clicks || 0,
              impressions: row.impressions || 0,
              ctr: Math.round((row.ctr || 0) * 10000) / 100,
              position: Math.round((row.position || 0) * 10) / 10
            }))
          },
          indexCoverage: {
            validPages: 0, // Потребует дополнительной реализации
            errorPages: 0,
            excludedPages: 0,
            warnings: 0,
            status: indexData.indexStatus
          }
        },
        overallScore: this.calculateHealthScore({
          totalClicks,
          totalImpressions,
          averageCTR,
          averagePosition,
          queryCount: queryData.length
        }),
        recommendations: this.generateRecommendations({
          totalClicks,
          totalImpressions,
          averageCTR,
          averagePosition,
          queries: queryData.slice(0, 20),
          pages: pageData.slice(0, 20)
        })
      };

      analysis.healthStatus = this.getHealthStatus(analysis.overallScore);

      return analysis;

    } catch (error) {
      console.error('Error analyzing site:', error);
      throw error;
    }
  }

  // Расчет общего health score
  calculateHealthScore(data) {
    let score = 0;
    let factors = 0;

    // Фактор 1: CTR (30% веса)
    if (data.averageCTR > 5) score += 30;
    else if (data.averageCTR > 3) score += 20;
    else if (data.averageCTR > 1) score += 10;
    factors++;

    // Фактор 2: Средняя позиция (25% веса)
    if (data.averagePosition <= 3) score += 25;
    else if (data.averagePosition <= 5) score += 20;
    else if (data.averagePosition <= 10) score += 15;
    else if (data.averagePosition <= 20) score += 10;
    factors++;

    // Фактор 3: Количество кликов (20% веса)
    if (data.totalClicks > 1000) score += 20;
    else if (data.totalClicks > 500) score += 15;
    else if (data.totalClicks > 100) score += 10;
    else if (data.totalClicks > 10) score += 5;
    factors++;

    // Фактор 4: Количество запросов (15% веса)
    if (data.queryCount > 100) score += 15;
    else if (data.queryCount > 50) score += 10;
    else if (data.queryCount > 20) score += 7;
    else if (data.queryCount > 5) score += 3;
    factors++;

    // Фактор 5: Показы (10% веса)
    if (data.totalImpressions > 10000) score += 10;
    else if (data.totalImpressions > 5000) score += 8;
    else if (data.totalImpressions > 1000) score += 5;
    else if (data.totalImpressions > 100) score += 2;
    factors++;

    return Math.min(100, Math.max(0, score));
  }

  // Определение статуса здоровья
  getHealthStatus(score) {
    if (score >= 80) return 'excellent';
    if (score >= 65) return 'good';
    if (score >= 45) return 'average';
    if (score >= 25) return 'poor';
    return 'critical';
  }

  // Генерация рекомендаций
  generateRecommendations(data) {
    const recommendations = [];

    // Анализ CTR
    if (data.averageCTR < 3) {
      recommendations.push({
        priority: 'high',
        category: 'CTR Optimization',
        title: 'Улучшите заголовки и описания страниц',
        description: `Ваш средний CTR составляет ${data.averageCTR}%, что ниже среднего показателя 3-5%`,
        impact: 'Высокий - напрямую влияет на трафик',
        actionSteps: [
          'Проанализируйте заголовки страниц с низким CTR',
          'Добавьте эмоциональные триггеры в title и description',
          'Используйте числа и вопросы в заголовках',
          'Тестируйте разные варианты meta-описаний'
        ]
      });
    }

    // Анализ позиций
    if (data.averagePosition > 10) {
      recommendations.push({
        priority: 'high',
        category: 'Position Improvement',
        title: 'Улучшите позиции в поиске',
        description: `Средняя позиция ${data.averagePosition} - есть потенциал для роста`,
        impact: 'Высокий - улучшение позиций значительно увеличит трафик',
        actionSteps: [
          'Оптимизируйте контент под ключевые запросы',
          'Улучшите внутреннюю перелинковку',
          'Добавьте структурированные данные',
          'Работайте над техническим SEO'
        ]
      });
    }

    // Анализ низкопроизводительных запросов
    const lowCTRQueries = data.queries.filter(q => q.ctr < 2 && q.position <= 10);
    if (lowCTRQueries.length > 0) {
      recommendations.push({
        priority: 'medium',
        category: 'Query Optimization',
        title: `Оптимизируйте ${lowCTRQueries.length} запросов с низким CTR`,
        description: 'Найдены запросы с хорошими позициями, но низкой кликабельностью',
        impact: 'Средний - быстрый способ увеличить трафик без роста позиций',
        actionSteps: [
          'Обновите title и description для этих страниц',
          'Добавьте призывы к действию',
          'Используйте эмодзи в сниппетах (где уместно)',
          'Тестируйте разные форматы заголовков'
        ]
      });
    }

    // Анализ страниц с потенциалом
    const potentialPages = data.pages.filter(p => p.position > 10 && p.position <= 20);
    if (potentialPages.length > 0) {
      recommendations.push({
        priority: 'medium',
        category: 'Content Optimization',
        title: `${potentialPages.length} страниц близки к TOP-10`,
        description: 'Эти страницы находятся на позициях 11-20 и имеют потенциал роста',
        impact: 'Высокий - попадание в TOP-10 значительно увеличит трафик',
        actionSteps: [
          'Расширьте контент на этих страницах',
          'Добавьте релевантные подзаголовки',
          'Улучшите пользовательский опыт',
          'Добавьте внутренние ссылки на эти страницы'
        ]
      });
    }

    return recommendations;
  }
}

module.exports = GoogleSearchConsoleService;