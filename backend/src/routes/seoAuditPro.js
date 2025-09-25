const express = require('express');
const router = express.Router();
const GoogleSearchConsoleService = require('../services/GoogleSearchConsoleService');

// Инициализация GSC сервиса
const gscService = new GoogleSearchConsoleService();

// OAuth авторизация для GSC
router.get('/seo-audit-pro/auth', async (req, res) => {
  try {
    const authUrl = gscService.generateAuthUrl();
    res.json({
      success: true,
      authUrl: authUrl
    });
  } catch (error) {
    console.error('GSC Auth URL generation error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to generate authorization URL'
    });
  }
});

// OAuth callback для GSC обрабатывается в /auth/google/callback через oauth.js

// API endpoint для получения токенов по коду
router.post('/seo-audit-pro/exchange-token', async (req, res) => {
  try {
    const { code } = req.body;
    
    if (!code) {
      return res.status(400).json({
        success: false,
        error: 'Authorization code is required'
      });
    }

    const tokens = await gscService.getTokensFromCode(code);
    
    res.json({
      success: true,
      tokens: tokens,
      message: 'Successfully connected to Google Search Console'
    });
  } catch (error) {
    console.error('GSC token exchange error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to exchange code for tokens'
    });
  }
});

// Получение списка сайтов (GET - для демо)
router.get('/seo-audit-pro/sites', async (req, res) => {
  try {
    // Возвращаем демо-данные сайтов из GSC (включая ваш реальный сайт)
    res.json({ 
      success: true, 
      sites: [
        { siteUrl: 'https://wekey.tools/', permissionLevel: 'siteOwner' },
        { siteUrl: 'https://example.com/', permissionLevel: 'siteOwner' },
        { siteUrl: 'https://mywebsite.com/', permissionLevel: 'siteOwner' },
        { siteUrl: 'https://testsite.org/', permissionLevel: 'siteFullUser' },
        { siteUrl: 'https://blog.example.com/', permissionLevel: 'siteOwner' }
      ],
      isDemo: true
    });
  } catch (error) {
    console.error('Error fetching sites:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Failed to fetch sites'
    });
  }
});

// Получение списка сайтов (POST - с токенами)
router.post('/seo-audit-pro/sites', async (req, res) => {
  try {
    const { tokens } = req.body;

    if (!tokens) {
      return res.status(400).json({
        success: false,
        error: 'Access tokens are required'
      });
    }

    gscService.setCredentials(tokens);
    const sites = await gscService.getSites();

    res.json({
      success: true,
      sites: sites
    });
  } catch (error) {
    console.error('GSC Sites fetch error:', error);
    
    // Если API не активирован, возвращаем demo данные с предупреждением
    if (error.message && error.message.includes('API has not been used')) {
      return res.json({
        success: true,
        sites: [
          { siteUrl: 'https://wekey.tools/', permissionLevel: 'siteOwner' },
          { siteUrl: 'https://example.com/', permissionLevel: 'siteOwner' },
          { siteUrl: 'https://mywebsite.com/', permissionLevel: 'siteOwner' }
        ],
        isDemo: true,
        message: 'Search Console API не активирован. Используются демо-данные.',
        apiActivationUrl: 'https://console.developers.google.com/apis/api/searchconsole.googleapis.com/overview?project=751826217400'
      });
    }
    
    res.status(500).json({
      success: false,
      error: 'Failed to fetch sites from Google Search Console'
    });
  }
});

// SEO Audit PRO анализ (новый endpoint)
router.post('/seo-audit-pro/analyze', async (req, res) => {
  try {
    const { website, tokens, useMockData } = req.body;

    if (!website) {
      return res.status(400).json({
        success: false,
        error: 'Website URL is required'
      });
    }

    // Если есть токены и не используем демо-данные, делаем реальный анализ
    if (tokens && !useMockData) {
      try {
        const analysis = await gscService.analyzeSite(website, tokens);
        
        return res.json({
          success: true,
          analysis: analysis,
          source: 'real_gsc_data'
        });
      } catch (gscError) {
        console.error('Real GSC analysis failed:', gscError);
        // Fallback к демо-данным при ошибке
      }
    }

    // Демо-данные для тестирования
    const mockData = {
      url: website,
      period: {
        startDate: '2024-08-28',
        endDate: '2024-09-25'
      },
      gscData: {
        searchPerformance: {
          totalClicks: 1250,
          totalImpressions: 15670,
          averageCTR: 7.98,
          averagePosition: 8.4,
          queries: [
            {
              query: 'ваш основной запрос',
              clicks: 342,
              impressions: 4521,
              ctr: 7.56,
              position: 6.2
            },
            {
              query: 'второй важный запрос',
              clicks: 187,
              impressions: 2890,
              ctr: 6.47,
              position: 9.1
            },
            {
              query: 'конкурентный запрос',
              clicks: 95,
              impressions: 2340,
              ctr: 4.06,
              position: 12.3
            }
          ],
          pages: [
            {
              page: `https://${website}/`,
              clicks: 456,
              impressions: 5234,
              ctr: 8.71,
              position: 7.3
            },
            {
              page: `https://${website}/about`,
              clicks: 234,
              impressions: 3456,
              ctr: 6.77,
              position: 8.9
            }
          ],
          devices: [
            {
              device: 'MOBILE',
              clicks: 750,
              impressions: 9402,
              ctr: 7.98,
              position: 8.1
            },
            {
              device: 'DESKTOP',
              clicks: 400,
              impressions: 4890,
              ctr: 8.18,
              position: 8.6
            },
            {
              device: 'TABLET',
              clicks: 100,
              impressions: 1378,
              ctr: 7.26,
              position: 9.2
            }
          ]
        },
        indexCoverage: {
          validPages: 142,
          errorPages: 7,
          excludedPages: 23,
          warnings: 3,
          status: 'verified'
        }
      },
      overallScore: 73,
      healthStatus: 'good',
      recommendations: [
        {
          priority: 'high',
          category: 'CTR Optimization',
          title: 'Улучшите заголовки страниц с низким CTR',
          description: 'Найдено 5 страниц в TOP-10 с CTR ниже среднего',
          impact: 'Высокий - может увеличить трафик на 25-40%',
          actionSteps: [
            'Добавьте эмоциональные триггеры в title',
            'Используйте числа и скобки в заголовках',
            'Тестируйте разные варианты meta-описаний',
            'Добавьте призывы к действию в сниппеты'
          ]
        },
        {
          priority: 'high',
          category: 'Position Improvement',
          title: 'Продвиньте 8 страниц из позиций 11-20 в TOP-10',
          description: 'Эти страницы близки к первой странице результатов поиска',
          impact: 'Очень высокий - попадание в TOP-10 увеличит трафик в 3-5 раз',
          actionSteps: [
            'Расширьте контент на 500-1000 слов',
            'Добавьте FAQ секции',
            'Улучшите внутреннюю перелинковку',
            'Оптимизируйте изображения и скорость загрузки'
          ]
        },
        {
          priority: 'medium',
          category: 'Technical SEO',
          title: 'Исправьте 7 ошибок индексации',
          description: 'Google не может проиндексировать некоторые важные страницы',
          impact: 'Средний - освободит краулинговый бюджет',
          actionSteps: [
            'Проверьте robots.txt и sitemap.xml',
            'Исправьте 404 ошибки',
            'Настройте правильные редиректы',
            'Обновите внутренние ссылки'
          ]
        },
        {
          priority: 'low',
          category: 'Mobile Optimization',
          title: 'Оптимизируйте для мобильных устройств',
          description: 'Мобильный трафик составляет 60%, но показатели ниже десктопа',
          impact: 'Средний - улучшит пользовательский опыт',
          actionSteps: [
            'Проверьте мобильную версию сайта',
            'Оптимизируйте размер кнопок и форм',
            'Улучшите скорость загрузки на мобильных',
            'Протестируйте удобство навигации'
          ]
        }
      ]
    };

    // Имитируем задержку анализа
    setTimeout(() => {
      res.json({
        success: true,
        analysis: mockData,
        source: 'demo_data'
      });
    }, 3000);

  } catch (error) {
    console.error('SEO Audit PRO error:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
});

// Старый endpoint для обратной совместимости
router.post('/seo-audit-pro', async (req, res) => {
  // Перенаправляем на новый endpoint analyze
  const { website, tokens, useMockData } = req.body;
  
  if (!website) {
    return res.status(400).json({
      success: false,
      error: 'Website URL is required'
    });
  }

  // Используем демо-данные для старого endpoint
  const mockData = {
    url: website,
    gscData: {
      searchPerformance: {
        totalClicks: 1250,
        totalImpressions: 15670,
        averageCTR: 7.98,
        averagePosition: 8.4,
        queries: [
          {
            query: 'ваш основной запрос',
            clicks: 342,
            impressions: 4521,
            ctr: 7.56,
            position: 6.2
          }
        ],
        pages: [
          {
            page: `https://${website}/`,
            clicks: 456,
            impressions: 5234,
            ctr: 8.71,
            position: 7.3
          }
        ]
      }
    },
    overallScore: 73,
    healthStatus: 'good',
    recommendations: []
  };

  setTimeout(() => {
    res.json({
      success: true,
      analysis: mockData
    });
  }, 3000);
});

module.exports = router;