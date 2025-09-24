const express = require('express');
const router = express.Router();
const cheerio = require('cheerio');
const fetch = require('node-fetch');

// Google PageSpeed Insights API (правильный URL)
const PAGESPEED_API_URL = 'https://www.googleapis.com/pagespeedonline/v5/runPagespeed';
const GOOGLE_API_KEY = process.env.GOOGLE_PAGESPEED_API_KEY; // Добавьте ключ в .env файл

// Функция для получения PageSpeed данных с retry логикой
async function getPageSpeedData(url, waitForFullData = false) {
  console.log(`🎯 getPageSpeedData вызвана для ${url}, waitForFullData: ${waitForFullData}`);
  
  try {
    // Добавляем API ключ если доступен
    const keyParam = GOOGLE_API_KEY ? `&key=${GOOGLE_API_KEY}` : '';
    const mobileUrl = `${PAGESPEED_API_URL}?url=${encodeURIComponent(url)}&strategy=mobile&category=performance${keyParam}`;
    const desktopUrl = `${PAGESPEED_API_URL}?url=${encodeURIComponent(url)}&strategy=desktop&category=performance${keyParam}`;
    
    console.log('🚀 Начинаем получение PageSpeed данных...');
    
    // Функция для выполнения запроса с retry
    const fetchWithRetry = async (url, strategy, maxRetries = 4) => {
      for (let attempt = 1; attempt <= maxRetries; attempt++) {
        try {
          console.log(`📡 Попытка ${attempt}/${maxRetries} для ${strategy}...`);
          const response = await fetch(url, { timeout: 60000 }); // Увеличиваем timeout до 60 секунд
          if (response.ok) {
            console.log(`✅ ${strategy} данные получены успешно`);
            return response;
          } else {
            console.log(`⚠️ ${strategy} попытка ${attempt} не удалась: ${response.status}`);
          }
        } catch (error) {
          if (error.message.includes('400')) {
            console.log(`⚠️ ${strategy} попытка ${attempt} не удалась: 400 (Bad Request) - возможно, сайт недоступен или блокирует Google`);
          } else if (error.message.includes('timeout')) {
            console.log(`❌ ${strategy} попытка ${attempt} ошибка: network timeout`);
          } else {
            console.log(`❌ ${strategy} попытка ${attempt} ошибка: ${error.message}`);
          }
        }
        
        // Ждем между попытками (кроме последней)
        if (attempt < maxRetries) {
          console.log(`⏳ Ожидание 8 секунд перед следующей попыткой ${strategy}...`);
          await new Promise(resolve => setTimeout(resolve, 8000));
        }
      }
      return null;
    };
    
    // Выполняем запросы параллельно с retry
    const [mobileResponse, desktopResponse] = await Promise.allSettled([
      fetchWithRetry(mobileUrl, 'mobile'),
      fetchWithRetry(desktopUrl, 'desktop')
    ]);
    
    const results = {
      mobile: null,
      desktop: null,
      error: null,
      metadata: {
        timestamp: new Date().toISOString(),
        source: 'unknown',
        hasApiKey: !!GOOGLE_API_KEY,
        requestStatus: {
          mobile: 'pending',
          desktop: 'pending'
        }
      }
    };
    
    // Обрабатываем mobile результат
    if (mobileResponse.status === 'fulfilled' && mobileResponse.value && mobileResponse.value.ok) {
      const mobileData = await mobileResponse.value.json();
      results.mobile = extractCoreWebVitals(mobileData, 'mobile');
      results.metadata.requestStatus.mobile = 'success';
      console.log('✅ Mobile данные обработаны успешно');
    } else {
      results.metadata.requestStatus.mobile = 'failed';
      console.log('❌ Mobile данные не получены');
    }
    
    // Обрабатываем desktop результат
    if (desktopResponse.status === 'fulfilled' && desktopResponse.value && desktopResponse.value.ok) {
      const desktopData = await desktopResponse.value.json();
      results.desktop = extractCoreWebVitals(desktopData, 'desktop');
      results.metadata.requestStatus.desktop = 'success';
      console.log('✅ Desktop данные обработаны успешно');
    } else {
      results.metadata.requestStatus.desktop = 'failed';
      console.log('❌ Desktop данные не получены');
    }
    
    // Проверяем успешность получения данных
    const mobileSuccess = results.metadata.requestStatus.mobile === 'success';
    const desktopSuccess = results.metadata.requestStatus.desktop === 'success';
    
    if (waitForFullData) {
      // Режим ожидания полных данных - не используем демо-данные
      if (mobileSuccess && desktopSuccess) {
        results.metadata.source = 'google_api';
        console.log('🎉 Все PageSpeed данные получены от Google API');
      } else {
        // Если не все данные получены - возвращаем ошибку
        const missingData = [];
        if (!mobileSuccess) missingData.push('mobile');
        if (!desktopSuccess) missingData.push('desktop');
        
        console.log(`❌ Не удалось получить PageSpeed данные для: ${missingData.join(', ')}`);
        throw new Error(`Google PageSpeed API недоступен для: ${missingData.join(', ')}. Попробуйте позже.`);
      }
    } else {
      // Обычный режим - можем использовать демо-данные как fallback
      if (mobileSuccess && desktopSuccess) {
        results.metadata.source = 'google_api';
        console.log('🎉 Все PageSpeed данные получены от Google API');
      } else if (mobileSuccess || desktopSuccess) {
        // Частичный успех - добавляем недостающие данные как demo
        if (!results.mobile) {
          console.log('⚠️ Mobile PageSpeed API failed, using demo data');
          results.mobile = generateDemoWebVitals('mobile');
          results.metadata.requestStatus.mobile = 'demo';
        }
        
        if (!results.desktop) {
          console.log('⚠️ Desktop PageSpeed API failed, using demo data');
          results.desktop = generateDemoWebVitals('desktop');
          results.metadata.requestStatus.desktop = 'demo';
        }
        
        results.metadata.source = 'mixed';
        console.log('⚡ Смешанные данные: часть от Google API, часть demo');
      } else {
        // Все запросы failed - используем только demo данные
        console.log('💥 Все PageSpeed запросы не удались, используем demo данные');
        results.mobile = generateDemoWebVitals('mobile');
        results.desktop = generateDemoWebVitals('desktop');
        results.metadata.source = 'demo_data';
        results.metadata.requestStatus.mobile = 'demo';
        results.metadata.requestStatus.desktop = 'demo';
      }
    }
    
    return results;
  } catch (error) {
    console.log('PageSpeed API error:', error.message);
    
    if (waitForFullData) {
      // Если пользователь хочет ждать полные данные - пробрасываем ошибку дальше
      throw error;
    } else {
      // В режиме разработки или при явном разрешении демо-данных
      return { 
        mobile: generateDemoWebVitals('mobile'), 
        desktop: generateDemoWebVitals('desktop'), 
        error: error.message 
      };
    }
  }
}

// Извлекаем Core Web Vitals из ответа Google
function extractCoreWebVitals(data, strategy) {
  try {
    const lighthouse = data.lighthouseResult;
    const audits = lighthouse.audits;
    
    return {
      performance_score: Math.round(lighthouse.categories.performance.score * 100),
      strategy: strategy, // mobile или desktop
      timestamp: new Date().toISOString(),
      source: 'google_api',
      core_web_vitals: {
        lcp: {
          value: audits['largest-contentful-paint']?.numericValue || 0,
          score: Math.round((audits['largest-contentful-paint']?.score || 0) * 100),
          displayValue: audits['largest-contentful-paint']?.displayValue || 'N/A'
        },
        fid: {
          value: audits['max-potential-fid']?.numericValue || 0,
          score: Math.round((audits['max-potential-fid']?.score || 0) * 100),
          displayValue: audits['max-potential-fid']?.displayValue || 'N/A'
        },
        cls: {
          value: audits['cumulative-layout-shift']?.numericValue || 0,
          score: Math.round((audits['cumulative-layout-shift']?.score || 0) * 100),
          displayValue: audits['cumulative-layout-shift']?.displayValue || 'N/A'
        }
      },
      // Заменяем простые opportunities на детальные рекомендации Google PageSpeed
      googleOpportunities: extractGoogleOpportunities(data, strategy),
      diagnostics: {
        dom_size: audits['dom-size']?.numericValue || 0,
        unused_css: audits['unused-css-rules']?.details?.overallSavingsBytes || 0,
        render_blocking: audits['render-blocking-resources']?.details?.items?.length || 0
      }
    };
  } catch (error) {
    console.log('Error extracting Core Web Vitals:', error);
    return null;
  }
}

// Извлекаем детальные рекомендации Google PageSpeed для seo-audit-section карточек
function extractGoogleOpportunities(data, strategy) {
  try {
    const lighthouse = data.lighthouseResult;
    const audits = lighthouse.audits;
    const opportunities = [];

    // 1. Оптимизация изображений - детальный анализ
    if (audits['modern-image-formats'] || audits['uses-optimized-images'] || audits['uses-webp-images']) {
      const imageOptimization = {
        id: 'image-optimization',
        category: 'images',
        title: '🖼️ Оптимизация изображений',
        priority: 'high',
        savings: 0,
        items: [],
        recommendations: []
      };

      // Современные форматы изображений
      if (audits['modern-image-formats']?.details?.items) {
        const modernFormats = audits['modern-image-formats'];
        imageOptimization.savings += modernFormats.details.overallSavingsBytes || 0;
        imageOptimization.items.push(...modernFormats.details.items.map(item => ({
          type: 'modern-format',
          url: item.url || item.node?.lhId || 'Unknown',
          currentSize: item.totalBytes || 0,
          potentialSavings: item.wastedBytes || 0,
          recommendation: `Конвертировать в WebP или AVIF (экономия: ${Math.round((item.wastedBytes || 0) / 1024)}KB)`
        })));
      }

      // Оптимизированные изображения
      if (audits['uses-optimized-images']?.details?.items) {
        const optimizedImages = audits['uses-optimized-images'];
        imageOptimization.savings += optimizedImages.details.overallSavingsBytes || 0;
        imageOptimization.items.push(...optimizedImages.details.items.map(item => ({
          type: 'optimization',
          url: item.url || item.node?.lhId || 'Unknown',
          currentSize: item.totalBytes || 0,
          potentialSavings: item.wastedBytes || 0,
          recommendation: `Сжать изображение (экономия: ${Math.round((item.wastedBytes || 0) / 1024)}KB)`
        })));
      }

      // WebP формат
      if (audits['uses-webp-images']?.details?.items) {
        const webpImages = audits['uses-webp-images'];
        imageOptimization.savings += webpImages.details.overallSavingsBytes || 0;
        imageOptimization.items.push(...webpImages.details.items.map(item => ({
          type: 'webp-format',
          url: item.url || item.node?.lhId || 'Unknown',
          currentSize: item.totalBytes || 0,
          potentialSavings: item.wastedBytes || 0,
          recommendation: `Использовать WebP формат (экономия: ${Math.round((item.wastedBytes || 0) / 1024)}KB)`
        })));
      }

      if (imageOptimization.items.length > 0) {
        imageOptimization.summary = `Найдено ${imageOptimization.items.length} изображений для оптимизации`;
        imageOptimization.totalSavings = `${Math.round(imageOptimization.savings / 1024)}KB`;
        opportunities.push(imageOptimization);
      }
    }

    // 2. CSS оптимизация - детальный анализ  
    if (audits['unused-css-rules'] || audits['render-blocking-resources']) {
      const cssOptimization = {
        id: 'css-optimization',
        category: 'css',
        title: '🎨 Оптимизация CSS',
        priority: 'medium',
        savings: 0,
        items: [],
        recommendations: []
      };

      // Неиспользуемый CSS
      if (audits['unused-css-rules']?.details?.items) {
        const unusedCSS = audits['unused-css-rules'];
        cssOptimization.savings += unusedCSS.details.overallSavingsBytes || 0;
        cssOptimization.items.push(...unusedCSS.details.items.map(item => ({
          type: 'unused-css',
          url: item.url || 'Inline CSS',
          currentSize: item.totalBytes || 0,
          potentialSavings: item.wastedBytes || 0,
          wastedPercent: item.wastedPercent || 0,
          recommendation: `Удалить неиспользуемый CSS (${Math.round(item.wastedPercent || 0)}% не используется)`
        })));
      }

      // Блокирующие CSS ресурсы
      if (audits['render-blocking-resources']?.details?.items) {
        const blockingCSS = audits['render-blocking-resources'].details.items.filter(item => 
          item.url && item.url.includes('.css')
        );
        cssOptimization.items.push(...blockingCSS.map(item => ({
          type: 'render-blocking',
          url: item.url || 'Unknown CSS',
          currentSize: item.totalBytes || 0,
          potentialSavings: item.wastedMs || 0,
          recommendation: `Оптимизировать критический CSS или загружать асинхронно`
        })));
      }

      if (cssOptimization.items.length > 0) {
        cssOptimization.summary = `Найдено ${cssOptimization.items.length} CSS файлов для оптимизации`;
        cssOptimization.totalSavings = `${Math.round(cssOptimization.savings / 1024)}KB`;
        opportunities.push(cssOptimization);
      }
    }

    // 3. Производительность JavaScript
    if (audits['unused-javascript'] || audits['unminified-javascript']) {
      const jsOptimization = {
        id: 'js-optimization', 
        category: 'performance',
        title: '⚡ Оптимизация JavaScript',
        priority: 'high',
        savings: 0,
        items: [],
        recommendations: []
      };

      // Неиспользуемый JavaScript
      if (audits['unused-javascript']?.details?.items) {
        const unusedJS = audits['unused-javascript'];
        jsOptimization.savings += unusedJS.details.overallSavingsBytes || 0;
        jsOptimization.items.push(...unusedJS.details.items.map(item => ({
          type: 'unused-js',
          url: item.url || 'Inline JS',
          currentSize: item.totalBytes || 0,
          potentialSavings: item.wastedBytes || 0,
          wastedPercent: item.wastedPercent || 0,
          recommendation: `Удалить неиспользуемый JavaScript (${Math.round(item.wastedPercent || 0)}% не используется)`
        })));
      }

      // Несжатый JavaScript
      if (audits['unminified-javascript']?.details?.items) {
        const unminifiedJS = audits['unminified-javascript'];
        jsOptimization.savings += unminifiedJS.details.overallSavingsBytes || 0;
        jsOptimization.items.push(...unminifiedJS.details.items.map(item => ({
          type: 'unminified-js',
          url: item.url || 'Unknown JS',
          currentSize: item.totalBytes || 0,
          potentialSavings: item.wastedBytes || 0,
          recommendation: `Минимизировать JavaScript (экономия: ${Math.round((item.wastedBytes || 0) / 1024)}KB)`
        })));
      }

      if (jsOptimization.items.length > 0) {
        jsOptimization.summary = `Найдено ${jsOptimization.items.length} JS файлов для оптимизации`;
        jsOptimization.totalSavings = `${Math.round(jsOptimization.savings / 1024)}KB`;
        opportunities.push(jsOptimization);
      }
    }

    console.log(`📊 Извлечено ${opportunities.length} детальных рекомендаций Google PageSpeed для ${strategy}`);
    return opportunities;

  } catch (error) {
    console.log('Error extracting Google opportunities:', error);
    return [];
  }
}

// Генерируем демо Web Vitals данные для тестирования
function generateDemoWebVitals(strategy) {
  // Разные показатели для mobile и desktop
  const isMobile = strategy === 'mobile';
  
  return {
    performance_score: isMobile ? Math.floor(Math.random() * 20) + 65 : Math.floor(Math.random() * 20) + 75, // 65-84 mobile, 75-94 desktop
    strategy: strategy,
    timestamp: new Date().toISOString(),
    source: 'demo_data',
    core_web_vitals: {
      lcp: {
        value: isMobile ? Math.random() * 1000 + 2000 : Math.random() * 800 + 1200, // ms
        score: isMobile ? Math.floor(Math.random() * 30) + 60 : Math.floor(Math.random() * 30) + 70,
        displayValue: isMobile ? `${(Math.random() * 1 + 2).toFixed(1)}s` : `${(Math.random() * 0.8 + 1.2).toFixed(1)}s`
      },
      fid: {
        value: isMobile ? Math.random() * 50 + 100 : Math.random() * 30 + 80, // ms
        score: isMobile ? Math.floor(Math.random() * 25) + 65 : Math.floor(Math.random() * 25) + 75,
        displayValue: isMobile ? `${Math.floor(Math.random() * 50 + 100)}ms` : `${Math.floor(Math.random() * 30 + 80)}ms`
      },
      cls: {
        value: isMobile ? Math.random() * 0.15 + 0.1 : Math.random() * 0.1 + 0.05, 
        score: isMobile ? Math.floor(Math.random() * 20) + 70 : Math.floor(Math.random() * 20) + 80,
        displayValue: isMobile ? (Math.random() * 0.15 + 0.1).toFixed(3) : (Math.random() * 0.1 + 0.05).toFixed(3)
      }
    },
    // Демо Google рекомендации для разработки
    googleOpportunities: [
      {
        id: 'image-optimization',
        category: 'images',
        title: '🖼️ Оптимизация изображений',
        priority: 'high',
        savings: Math.floor(Math.random() * 200000) + 50000,
        summary: `Найдено ${Math.floor(Math.random() * 8) + 3} изображений для оптимизации`,
        totalSavings: `${Math.floor(Math.random() * 200) + 50}KB`,
        items: [
          {
            type: 'modern-format',
            url: 'https://cher17.fra1.cdn.digitaloceanspaces.com/public/slides/media/12407/hero-banner-main.jpg',
            currentSize: 156000,
            potentialSavings: 89000,
            recommendation: 'Конвертировать в WebP или AVIF (экономия: 89KB)'
          },
          {
            type: 'optimization',
            url: 'https://cher17.fra1.cdn.digitaloceanspaces.com/public/products/media/8945/product-catalog-image.png',
            currentSize: 245000,
            potentialSavings: 156000,
            recommendation: 'Сжать изображение (экономия: 156KB)'
          },
          {
            type: 'webp-format',
            url: 'https://cher17.fra1.cdn.digitaloceanspaces.com/public/collections/media/5623/collection-preview.jpg',
            currentSize: 89000,
            potentialSavings: 45000,
            recommendation: 'Использовать WebP формат (экономия: 45KB)'
          },
          {
            type: 'modern-format',
            url: 'https://cher17.fra1.cdn.digitaloceanspaces.com/public/banners/media/3421/sale-banner-desktop.jpg',
            currentSize: 178000,
            potentialSavings: 98000,
            recommendation: 'Конвертировать в WebP или AVIF (экономия: 98KB)'
          }
        ]
      },
      {
        id: 'css-optimization',
        category: 'css',
        title: '🎨 Оптимизация CSS',
        priority: 'medium',
        savings: Math.floor(Math.random() * 100000) + 20000,
        summary: `Найдено ${Math.floor(Math.random() * 5) + 2} CSS файлов для оптимизации`,
        totalSavings: `${Math.floor(Math.random() * 100) + 20}KB`,
        items: [
          {
            type: 'unused-css',
            url: 'https://cher17.com/assets/css/main-styles.css',
            currentSize: 89000,
            potentialSavings: 45000,
            wastedPercent: 51,
            recommendation: 'Удалить неиспользуемый CSS (51% не используется)'
          },
          {
            type: 'render-blocking',
            url: 'https://cher17.com/assets/css/bootstrap.min.css',
            currentSize: 156000,
            potentialSavings: 0,
            recommendation: 'Оптимизировать критический CSS или загружать асинхронно'
          },
          {
            type: 'unused-css',
            url: 'https://cher17.com/wp-content/themes/cher17/style.css',
            currentSize: 67000,
            potentialSavings: 32000,
            wastedPercent: 48,
            recommendation: 'Удалить неиспользуемый CSS (48% не используется)'
          }
        ]
      }
    ],
    diagnostics: {
      dom_size: Math.floor(Math.random() * 1000) + 800,
      unused_css: Math.floor(Math.random() * 50000) + 20000,
      render_blocking: Math.floor(Math.random() * 5) + 2
    }
  };
}

router.post('/seo-audit', async (req, res) => {
  try {
    const { url, waitForFullData = true } = req.body; // По умолчанию ждем полные данные
    if (!url) {
      return res.status(400).json({ success: false, error: 'URL is required' });
    }

    let fullUrl = url;
    if (!url.startsWith('http://') && !url.startsWith('https://')) {
      fullUrl = 'https://' + url;
    }
    
    console.log(`🔍 Анализ ${fullUrl} (waitForFullData: ${waitForFullData})`);

    // Параллельно запускаем все проверки включая Mobile-Friendly, SSL Labs, W3C Validator и Security Headers
    const [htmlAnalysis, pageSpeedData, robotsCheck, sslCheck, resourcesCheck, mobileCheck, sslLabsCheck, w3cCheck, securityHeadersCheck] = await Promise.allSettled([
      analyzeHTML(fullUrl),
      getPageSpeedData(fullUrl, waitForFullData), // Передаем параметр для контроля демо-данных
      checkRobotsTxt(fullUrl),
      checkSSL(fullUrl),
      checkResourcesSpeed(fullUrl),
      checkMobileFriendly(fullUrl),
      checkSSLLabs(fullUrl),
      checkW3CValidator(fullUrl),
      checkSecurityHeaders(fullUrl)
    ]);

    let seoResult = {};
    let performanceData = null;
    let robotsData = null;
    let sslData = null;
    let resourcesData = null;
    let mobileData = null;
    let sslLabsData = null;
    let w3cData = null;
    let securityHeadersData = null;

    if (htmlAnalysis.status === 'fulfilled') {
      seoResult = htmlAnalysis.value;
    } else {
      throw new Error('HTML analysis failed: ' + htmlAnalysis.reason);
    }

    if (pageSpeedData.status === 'fulfilled') {
      performanceData = pageSpeedData.value;
      console.log('✅ PageSpeed данные получены успешно');
    } else {
      console.log('❌ PageSpeed данные не удалось получить:', pageSpeedData.reason);
      
      if (waitForFullData) {
        // Если пользователь хочет ждать полные данные - возвращаем ошибку
        return res.status(503).json({
          success: false,
          error: 'Google PageSpeed API временно недоступен. Попробуйте позже.',
          details: 'Мы не показываем демо-данные. Пожалуйста, повторите запрос через несколько минут.',
          retryAfter: 60 // Рекомендуем повторить через минуту
        });
      } else {
        // В режиме разработки или при явном разрешении демо-данных
        performanceData = null;
      }
    }

    if (robotsCheck.status === 'fulfilled') {
      robotsData = robotsCheck.value;
    }

    if (sslCheck.status === 'fulfilled') {
      sslData = sslCheck.value;
    }

    if (resourcesCheck.status === 'fulfilled') {
      resourcesData = resourcesCheck.value;
    } else {
      console.error('Resources check failed:', resourcesCheck.reason);
      resourcesData = { 
        error: resourcesCheck.reason?.message || 'Unknown error',
        loadTime: null,
        issues: ['Ошибка при проверке скорости загрузки'],
        warnings: []
      };
    }

    if (mobileCheck.status === 'fulfilled') {
      mobileData = mobileCheck.value;
    } else {
      console.error('Mobile check failed:', mobileCheck.reason);
      mobileData = { 
        error: mobileCheck.reason?.message || 'Unknown error',
        isMobileFriendly: false,
        status: 'ERROR',
        issues: ['Ошибка при проверке мобильности'],
        recommendations: ['Проверьте доступность сайта']
      };
    }

    if (sslLabsCheck.status === 'fulfilled') {
      sslLabsData = sslLabsCheck.value;
    } else {
      console.error('SSL Labs check failed:', sslLabsCheck.reason);
      sslLabsData = { 
        error: sslLabsCheck.reason?.message || 'Unknown error',
        grade: null,
        hasSSL: false,
        issues: ['Ошибка при проверке SSL Labs'],
        recommendations: ['Проверьте доступность сайта']
      };
    }

    if (w3cCheck.status === 'fulfilled') {
      w3cData = w3cCheck.value;
    } else {
      console.error('W3C Validator check failed:', w3cCheck.reason);
      w3cData = { 
        error: w3cCheck.reason?.message || 'Unknown error',
        isValid: false,
        errors: [],
        warnings: [],
        issues: ['Ошибка при проверке W3C валидации'],
        recommendations: ['Проверьте доступность сайта']
      };
    }

    if (securityHeadersCheck.status === 'fulfilled') {
      securityHeadersData = securityHeadersCheck.value;
    } else {
      console.error('Security Headers check failed:', securityHeadersCheck.reason);
      securityHeadersData = { 
        error: securityHeadersCheck.reason?.message || 'Unknown error',
        grade: null,
        score: 0,
        headers: {},
        issues: ['Ошибка при проверке заголовков безопасности'],
        recommendations: ['Проверьте доступность сайта']
      };
    }

    // Проверяем sitemap после получения robots.txt
    let sitemapData = null;
    try {
      sitemapData = await checkSitemap(fullUrl, robotsData);
    } catch (error) {
      console.error('Sitemap check failed:', error);
    }

    // Объединяем данные и добавляем персонализированные рекомендации
    const enhancedResult = enhanceWithInsights(seoResult, performanceData, {
      robots: robotsData,
      sitemap: sitemapData,
      ssl: sslData,
      resources: resourcesData,
      mobile: mobileData,
      sslLabs: sslLabsData,
      w3c: w3cData,
      w3cValidator: seoResult.w3cValidator,
      securityHeaders: seoResult.securityHeaders || securityHeadersData,
      linkProfile: seoResult.linkProfile,
      sitelinks: seoResult.sitelinks
    });

    res.json({ success: true, results: enhancedResult });

  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Отдельная функция для HTML анализа
async function analyzeHTML(fullUrl) {
  const response = await fetch(fullUrl, {
    headers: { 'User-Agent': 'Mozilla/5.0' },
    timeout: 15000
  });

  if (!response.ok) {
    throw new Error('HTTP ' + response.status);
  }

  const html = await response.text();
  const $ = cheerio.load(html);

  return analyzeSEO($, html, fullUrl);
}

function analyzeSEO($, html, url) {
  const seo = {};

  // 1. Заголовки страниц
  const title = $('title').text().trim();
  seo.title = {
    content: title,
    length: title.length,
    isOptimal: title.length >= 30 && title.length <= 60
  };

  // 2. Meta описания
  const description = $('meta[name="description"]').attr('content') || '';
  seo.metaDescription = {
    content: description,
    length: description.length,
    isOptimal: description.length >= 120 && description.length <= 160
  };

  // 3. Keywords meta тег
  const keywords = $('meta[name="keywords"]').attr('content') || '';
  seo.keywords = {
    content: keywords,
    count: keywords ? keywords.split(',').map(k => k.trim()).filter(k => k).length : 0
  };

  // 4. Open Graph разметка
  seo.openGraph = {
    title: $('meta[property="og:title"]').attr('content') || '',
    description: $('meta[property="og:description"]').attr('content') || '',
    image: $('meta[property="og:image"]').attr('content') || '',
    url: $('meta[property="og:url"]').attr('content') || '',
    type: $('meta[property="og:type"]').attr('content') || '',
    siteName: $('meta[property="og:site_name"]').attr('content') || ''
  };

  // 5. Twitter Cards
  seo.twitterCard = {
    card: $('meta[name="twitter:card"]').attr('content') || '',
    title: $('meta[name="twitter:title"]').attr('content') || '',
    description: $('meta[name="twitter:description"]').attr('content') || '',
    image: $('meta[name="twitter:image"]').attr('content') || '',
    site: $('meta[name="twitter:site"]').attr('content') || ''
  };

  // 6. Расширенный анализ структурированных данных (JSON-LD + Microdata)
  console.log('🔍 Starting structured data analysis...');
  try {
    const structuredDataAnalysis = analyzeStructuredDataAdvanced($, url);
    console.log('✅ Structured data analysis completed:', structuredDataAnalysis?.count || 0, 'items');
    seo.structuredData = structuredDataAnalysis;
  } catch (error) {
    console.error('❌ Error in structured data analysis:', error);
    seo.structuredData = { count: 0, types: [], schemas: [], validation: { isValid: true, errors: [], warnings: [], recommendations: [] } };
  }

  // 7. Микроразметка (Schema.org)
  seo.microdata = {
    itemscope: $('[itemscope]').length,
    itemtype: []
  };
  
  $('[itemtype]').each((i, el) => {
    const itemtype = $(el).attr('itemtype');
    if (itemtype && !seo.microdata.itemtype.includes(itemtype)) {
      seo.microdata.itemtype.push(itemtype);
    }
  });

  // 8. Расширенный анализ заголовков H1-H6
  seo.headings = {
    h1: { count: $('h1').length, texts: [], issues: [] },
    h2: { count: $('h2').length, texts: [], issues: [] },
    h3: { count: $('h3').length, texts: [], issues: [] },
    h4: { count: $('h4').length, texts: [], issues: [] },
    h5: { count: $('h5').length, texts: [], issues: [] },
    h6: { count: $('h6').length, texts: [], issues: [] },
    structure: { isValid: true, issues: [] }
  };

  // Собираем тексты заголовков и анализируем их
  ['h1', 'h2', 'h3', 'h4', 'h5', 'h6'].forEach(tag => {
    $(tag).each((i, el) => {
      const text = $(el).text().trim();
      if (text) {
        // Берем первые 5 заголовков для отображения
        if (seo.headings[tag].texts.length < 5) {
          seo.headings[tag].texts.push({
            text: text,
            length: text.length,
            hasKeywords: title ? text.toLowerCase().includes(title.toLowerCase().split(' ')[0]) : false
          });
        }
      }
    });
    
    // Анализ проблем для каждого уровня заголовков
    if (tag === 'h1') {
      if (seo.headings.h1.count === 0) {
        seo.headings.h1.issues.push('Отсутствует H1 заголовок');
      } else if (seo.headings.h1.count > 1) {
        seo.headings.h1.issues.push(`Слишком много H1 заголовков (${seo.headings.h1.count})`);
      }
      
      // Проверка длины H1
      if (seo.headings.h1.texts.length > 0) {
        const h1Length = seo.headings.h1.texts[0].length;
        if (h1Length < 20) {
          seo.headings.h1.issues.push('H1 слишком короткий (рекомендуется 20-70 символов)');
        } else if (h1Length > 70) {
          seo.headings.h1.issues.push('H1 слишком длинный (рекомендуется 20-70 символов)');
        }
      }
    }
  });

  // Проверка иерархии заголовков
  const headingLevels = ['h1', 'h2', 'h3', 'h4', 'h5', 'h6'];
  let previousLevel = 0;
  
  for (let i = 0; i < headingLevels.length; i++) {
    const currentCount = seo.headings[headingLevels[i]].count;
    if (currentCount > 0) {
      const currentLevel = i + 1;
      if (currentLevel > previousLevel + 1 && previousLevel > 0) {
        seo.headings.structure.isValid = false;
        seo.headings.structure.issues.push(`Пропущен уровень заголовка H${previousLevel + 1} перед H${currentLevel}`);
      }
      previousLevel = currentLevel;
    }
  }

  // 9. Canonical URL
  seo.canonical = {
    url: $('link[rel="canonical"]').attr('href') || '',
    isPresent: $('link[rel="canonical"]').length > 0
  };

  // 10. Robots meta тег
  const robotsMeta = $('meta[name="robots"]').attr('content') || '';
  seo.robots = {
    content: robotsMeta,
    noindex: robotsMeta.includes('noindex'),
    nofollow: robotsMeta.includes('nofollow'),
    noarchive: robotsMeta.includes('noarchive'),
    nosnippet: robotsMeta.includes('nosnippet')
  };

  // 11. Hreflang теги
  seo.hreflang = [];
  $('link[rel="alternate"][hreflang]').each((i, el) => {
    seo.hreflang.push({
      lang: $(el).attr('hreflang'),
      href: $(el).attr('href')
    });
  });

  // 12. Sitemap обнаружение
  seo.sitemap = {
    found: false,
    urls: []
  };
  
  // Поиск ссылок на sitemap в robots.txt упоминаниях или прямых ссылках
  $('a[href*="sitemap"]').each((i, el) => {
    const href = $(el).attr('href');
    if (href && (href.includes('sitemap.xml') || href.includes('sitemap'))) {
      seo.sitemap.urls.push(href);
      seo.sitemap.found = true;
    }
  });

  // Дополнительные SEO метрики
  seo.additional = {
    viewport: $('meta[name="viewport"]').attr('content') || '',
    charset: $('meta[charset]').attr('charset') || '',
    lang: $('html').attr('lang') || '',
    favicon: $('link[rel*="icon"]').length > 0
  };

  // 13. Анализ изображений для SEO
  const images = $('img');
  seo.images = {
    total: images.length,
    withoutAlt: images.filter((i, el) => !$(el).attr('alt')).length,
    withEmptyAlt: images.filter((i, el) => $(el).attr('alt') === '').length
  };

  // 14. Анализ ссылок
  const links = $('a[href]');
  const internalLinks = [];
  const externalLinks = [];
  const navigationLinks = [];
  
  links.each((i, el) => {
    const href = $(el).attr('href');
    const linkText = $(el).text().trim();
    const parentClass = $(el).parent().attr('class') || '';
    const linkClass = $(el).attr('class') || '';
    
    if (href) {
      if (href.startsWith('http://') || href.startsWith('https://')) {
        try {
          const linkUrl = new URL(href);
          const currentUrl = new URL(url);
          if (linkUrl.hostname === currentUrl.hostname) {
            internalLinks.push({
              href: href,
              text: linkText,
              isNavigation: isNavigationLink(parentClass, linkClass, linkText)
            });
          } else {
            externalLinks.push(href);
          }
        } catch (e) {
          // Invalid URL
        }
      } else if (href.startsWith('/') || !href.includes('://')) {
        internalLinks.push({
          href: href,
          text: linkText,
          isNavigation: isNavigationLink(parentClass, linkClass, linkText)
        });
      }
    }
  });

  // Собираем навигационные ссылки
  internalLinks.forEach(link => {
    if (link.isNavigation) {
      navigationLinks.push(link);
    }
  });

  seo.links = {
    total: links.length,
    internal: internalLinks.length,
    external: externalLinks.length,
    nofollow: $('a[rel*="nofollow"]').length,
    navigation: navigationLinks
  };

  // 15. Анализ потенциала для Sitelinks
  seo.sitelinks = analyzeSitelinksPotential($, internalLinks, url);

  // 16. Детальный анализ ссылочного профиля
  seo.linkProfile = analyzeLinkProfile($, internalLinks, externalLinks, url);

  // 17. Продвинутый анализ производительности и контента
  // Улучшенный парсинг для кириллицы (украинский, русский)
  const textContent = $('body').text()
    .replace(/[\n\r\t]+/g, ' ')  // Убираем переносы
    .replace(/[^\w\sа-яёА-ЯЁ\u0400-\u04FF\u0500-\u052F]/g, ' ')  // Только буквы и кириллица
    .replace(/\s+/g, ' ')  // Множественные пробелы в один
    .trim();
  
  const words = textContent.split(' ').filter(word => word.length > 2); // Слова от 3 символов
  const wordCount = words.length;
  const htmlSize = Buffer.byteLength(html, 'utf8');
  
  seo.performance = {
    htmlSize: htmlSize,
    htmlSizeKB: Math.round(htmlSize / 1024 * 100) / 100,
    wordCount: wordCount,
    textToHtmlRatio: Math.round((textContent.length / html.length) * 100),
    title_length_score: seo.title.isOptimal ? 100 : (seo.title.length === 0 ? 0 : Math.max(0, 100 - Math.abs(45 - seo.title.length) * 2)),
    description_length_score: seo.metaDescription.isOptimal ? 100 : (seo.metaDescription.length === 0 ? 0 : Math.max(0, 100 - Math.abs(140 - seo.metaDescription.length))),
    h1_score: seo.headings.h1.count === 1 ? 100 : (seo.headings.h1.count === 0 ? 0 : 50),
    content_score: wordCount >= 300 ? 100 : Math.round((wordCount / 300) * 100),
    images_alt_score: seo.images.total === 0 ? 100 : Math.round(((seo.images.total - seo.images.withoutAlt) / seo.images.total) * 100)
  };

  // 18. Анализ ключевых слов и плотности (базовый)
  if (title && wordCount > 0) {
    const titleWords = title.toLowerCase().split(' ').filter(word => word.length > 3);
    seo.keywordAnalysis = {
      titleKeywords: titleWords.slice(0, 3),
      keywordDensity: {},
      recommendations: []
    };
    
    // Анализ плотности ключевых слов из заголовка
    titleWords.forEach(keyword => {
      const regex = new RegExp(keyword, 'gi');
      const matches = (textContent.match(regex) || []).length;
      const density = Math.round((matches / wordCount) * 10000) / 100;
      seo.keywordAnalysis.keywordDensity[keyword] = {
        count: matches,
        density: density
      };
      
      if (density < 0.5) {
        seo.keywordAnalysis.recommendations.push(`Ключевое слово "${keyword}" встречается редко (${density}%)`);
      } else if (density > 3) {
        seo.keywordAnalysis.recommendations.push(`Ключевое слово "${keyword}" может быть переспамлено (${density}%)`);
      }
    });
  }

  // 17. Технический SEO анализ
  seo.technical = {
    https: url.startsWith('https://'),
    urlStructure: {
      length: url.length,
      hasParameters: url.includes('?'),
      hasFragment: url.includes('#'),
      isClean: !url.includes('?') && !url.includes('#') && url.length < 100
    },
    pageLoadHints: {
      hasLazyLoading: $('img[loading="lazy"]').length > 0,
      hasPreconnect: $('link[rel="preconnect"]').length > 0,
      hasPrefetch: $('link[rel="prefetch"], link[rel="preload"]').length > 0,
      hasMinifiedCSS: $('link[rel="stylesheet"]').filter((i, el) => {
        const href = $(el).attr('href');
        return href && href.includes('.min.');
      }).length > 0
    }
  };

  // Schema.org валидация
  try {
    console.log('🔍 Starting Schema.org analysis...');
    seo.schemaValidation = analyzeSchemaOrg($, url);
    console.log('✅ Schema.org analysis completed:', seo.schemaValidation ? 'success' : 'empty');
  } catch (error) {
    console.error('❌ Schema.org validation error:', error.message);
    console.error('Stack:', error.stack);
    seo.schemaValidation = {
      schemas: [],
      richSnippetsOpportunities: [],
      score: 0,
      maxScore: 100,
      issues: ['Ошибка анализа Schema.org: ' + error.message],
      recommendations: ['Проверьте структурированные данные']
    };
  }

  return seo;
}

// Функция для создания персонализированных инсайтов и приоритизации
function enhanceWithInsights(seoData, performanceData, additionalData = {}) {
  const enhanced = { ...seoData };
  
  // Добавляем данные производительности
  enhanced.webVitals = performanceData;
  
  // Добавляем новые проверки
  if (additionalData.robots) {
    enhanced.robotsCheck = additionalData.robots;
  }
  
  if (additionalData.sitemap) {
    enhanced.sitemapCheck = additionalData.sitemap;
  }
  
  if (additionalData.ssl) {
    enhanced.ssl = additionalData.ssl;
  }
  
  if (additionalData.resources) {
    enhanced.resourcesSpeed = additionalData.resources;
  }

  if (additionalData.mobile) {
    enhanced.mobileFriendly = additionalData.mobile;
  }

  if (additionalData.sslLabs) {
    enhanced.sslLabs = additionalData.sslLabs;
  }

  if (additionalData.w3c) {
    enhanced.w3cValidator = additionalData.w3c;
  }

  if (additionalData.securityHeaders) {
    enhanced.securityHeaders = additionalData.securityHeaders;
  }

  // Создаем общий SEO Health Score
  enhanced.overallScore = calculateOverallScore(seoData, performanceData, { ...additionalData, schemaValidation: seoData.schemaValidation, sitelinks: seoData.sitelinks });
  
  // Генерируем персонализированные рекомендации с приоритетами
  enhanced.actionPlan = generateActionPlan(seoData, performanceData, { ...additionalData, schemaValidation: seoData.schemaValidation });
  
  // Добавляем инсайты для визуализации
  enhanced.visualData = generateVisualData(seoData, performanceData);
  
  return enhanced;
}

// Расчет общего SEO Health Score
function calculateOverallScore(seoData, performanceData, additionalData = {}) {
  const scores = {
    technical: 0,
    content: 0,
    performance: 0,
    overall: 0
  };
  
  // Technical SEO (40% веса) - Современный подход
  let technicalPoints = 0;
  
  // Базовые SEO элементы (60 баллов)
  technicalPoints += seoData.title?.isOptimal ? 15 : 0;
  technicalPoints += seoData.metaDescription?.isOptimal ? 12 : 0;
  technicalPoints += seoData.headings?.h1?.count === 1 ? 12 : 0;
  technicalPoints += seoData.technical?.https ? 8 : 0;
  technicalPoints += seoData.canonical?.isPresent ? 8 : 0;
  technicalPoints += (seoData.openGraph?.title ? 5 : 0);
  
  // Schema.org валидация (20 баллов) - Обновленная логика
  if (additionalData.schemaValidation) {
    const schemaVal = additionalData.schemaValidation;
    
    // Базовая оценка Schema.org (0-100 -> 0-15 баллов)
    technicalPoints += Math.round(schemaVal.score / 100 * 15);
    
    // Бонус за Rich Snippets возможности высокого приоритета (+5 баллов макс)
    const highPriorityOpportunities = schemaVal.richSnippetsOpportunities?.filter(opp => opp.priority === 'high')?.length || 0;
    technicalPoints += Math.min(highPriorityOpportunities * 2, 5);
  } else if (seoData.structuredData?.count > 0) {
    // Fallback для старой логики
    technicalPoints += Math.min(seoData.structuredData.count * 3, 15);
  }
  
  // W3C валидация (10 баллов)
  if (additionalData.w3cValidator) {
    const errorCount = additionalData.w3cValidator.errors?.count || 0;
    if (errorCount === 0) {
      technicalPoints += 10;
    } else if (errorCount <= 5) {
      technicalPoints += 7;
    } else if (errorCount <= 10) {
      technicalPoints += 4;
    }
    // >10 ошибок = 0 баллов
  }
  
  // Security Headers (8 баллов)
  if (additionalData.securityHeaders?.score) {
    technicalPoints += Math.round(additionalData.securityHeaders.score / 10 * 0.8);
  }
  
  // SSL Labs качество (7 баллов)
  if (additionalData.sslLabs?.grade) {
    const sslGrade = additionalData.sslLabs.grade;
    if (sslGrade === 'A+') {
      technicalPoints += 7;
    } else if (sslGrade === 'A') {
      technicalPoints += 6;
    } else if (sslGrade === 'B') {
      technicalPoints += 4;
    } else if (sslGrade === 'C') {
      technicalPoints += 2;
    }
    // D, F = 0 баллов
  }
  
  // Robots.txt + Sitemap (5 баллов)
  technicalPoints += additionalData.robots?.found ? 2.5 : 0;
  technicalPoints += additionalData.sitemap?.found ? 2.5 : 0;
  
  // Максимум Technical: 110 баллов (60 базовые + 20 Schema.org + 10 W3C + 8 Security + 7 SSL + 5 robots/sitemap)
  scores.technical = Math.min(Math.round(technicalPoints), 100);
  
  // Content Quality (30% веса) - Расширенный анализ
  let contentPoints = 0;
  
  // Объем и структура контента (50 баллов)
  const wordCount = seoData.performance?.wordCount || 0;
  if (wordCount >= 500) {
    contentPoints += 25;
  } else if (wordCount >= 300) {
    contentPoints += 20;
  } else {
    contentPoints += Math.round(wordCount / 300 * 20);
  }
  
  // Соотношение текст/HTML
  const textToHtmlRatio = seoData.performance?.textToHtmlRatio || 0;
  if (textToHtmlRatio >= 20) {
    contentPoints += 15;
  } else {
    contentPoints += Math.round(textToHtmlRatio / 20 * 15);
  }
  
  // Структура заголовков
  const hasH2 = seoData.headings?.h2?.count > 0;
  const hasH3 = seoData.headings?.h3?.count > 0;
  contentPoints += hasH2 ? 5 : 0;
  contentPoints += hasH3 ? 5 : 0;
  
  // SEO оптимизация (30 баллов)
  contentPoints += (seoData.keywordAnalysis?.titleKeywords?.length || 0) > 0 ? 15 : 0;
  
  // Alt-тексты изображений
  if (seoData.images?.total > 0) {
    const altTextCoverage = ((seoData.images.total - seoData.images.withoutAlt) / seoData.images.total) * 100;
    contentPoints += Math.round(altTextCoverage / 100 * 15);
  } else {
    contentPoints += 15;
  }
  
  // Link Profile анализ (20 баллов)
  if (additionalData.linkProfile) {
    const linkProfile = additionalData.linkProfile;
    
    // Внутренняя перелинковка
    if (linkProfile.internal?.total >= 10) {
      contentPoints += 10;
    } else {
      contentPoints += Math.round((linkProfile.internal?.total || 0) / 10 * 10);
    }
    
    // Баланс внутренних/внешних ссылок
    if (linkProfile.ratios?.internalToExternal >= 3) {
      contentPoints += 5;
    } else {
      contentPoints += Math.round((linkProfile.ratios?.internalToExternal || 0) / 3 * 5);
    }
    
    // Разнообразие anchor текстов
    if (linkProfile.ratios?.anchorDiversity >= 5) {
      contentPoints += 5;
    } else {
      contentPoints += Math.round((linkProfile.ratios?.anchorDiversity || 0) / 5 * 5);
    }
  }
  
  // Sitelinks потенциал (10 баллов)
  if (additionalData.sitelinks) {
    const sitelinksScore = additionalData.sitelinks.score || 0;
    contentPoints += Math.round(sitelinksScore / 100 * 10);
  }
  
  // Максимум Content: 130 баллов (50 контент + 30 SEO + 15 alt + 20 links + 10 структура + 10 sitelinks - урезано до 100)
  scores.content = Math.min(Math.round(contentPoints), 100);
  
  // Performance (30% веса) - Детальный анализ Core Web Vitals
  let performancePoints = 0;
  const mobileData = performanceData?.mobile;
  const desktopData = performanceData?.desktop;
  const primaryData = mobileData || desktopData; // Mobile-First приоритет
  
  if (primaryData) {
    // Core Web Vitals детально (60 баллов)
    if (primaryData.core_web_vitals) {
      const cwv = primaryData.core_web_vitals;
      
      // LCP - Largest Contentful Paint (25 баллов)
      if (cwv.lcp?.score >= 90) {
        performancePoints += 25;
      } else if (cwv.lcp?.score >= 50) {
        performancePoints += Math.round(cwv.lcp.score / 90 * 25);
      }
      
      // FCP - First Contentful Paint (20 баллов) 
      if (cwv.fcp?.score >= 90) {
        performancePoints += 20;
      } else if (cwv.fcp?.score >= 50) {
        performancePoints += Math.round(cwv.fcp.score / 90 * 20);
      }
      
      // CLS - Cumulative Layout Shift (15 баллов)
      if (cwv.cls?.score >= 90) {
        performancePoints += 15;
      } else if (cwv.cls?.score >= 50) {
        performancePoints += Math.round(cwv.cls.score / 90 * 15);
      }
    } else {
      // Fallback: если нет детальных CWV, используем общий score
      performancePoints += Math.round(primaryData.performance_score * 0.6);
    }
    
    // Overall Performance Score (30 баллов)
    performancePoints += Math.round(primaryData.performance_score * 0.3);
    
    // Mobile-Friendly (10 баллов)
    if (additionalData.mobile?.score >= 80) {
      performancePoints += 10;
    } else if (additionalData.mobile?.score >= 60) {
      performancePoints += 7;
    } else if (additionalData.mobile?.score >= 40) {
      performancePoints += 4;
    }
  } else {
    // Если PageSpeed недоступен, используем базовые метрики
    performancePoints = 50;
  }
  
  scores.performance = Math.min(Math.round(performancePoints), 100);
  
  // Общая оценка с весами
  scores.overall = Math.round(
    scores.technical * 0.4 + 
    scores.content * 0.3 + 
    scores.performance * 0.3
  );
  
  return scores;
}

// Генерация Action Plan с приоритетами
function generateActionPlan(seoData, performanceData, additionalData = {}) {
  const actions = [];
  
  // Критические проблемы (влияют на ранжирование)
  if (!seoData.title?.isOptimal) {
    actions.push({
      priority: 'critical',
      category: 'SEO',
      task: 'Оптимизировать заголовок страницы',
      description: `Текущая длина: ${seoData.title?.length || 0} символов. Рекомендуется: 30-60 символов.`,
      impact: 'high',
      effort: 'low',
      expectedImprovement: '+25-40% CTR в поиске'
    });
  }
  
  if (seoData.headings?.h1?.count !== 1) {
    actions.push({
      priority: 'critical',
      category: 'SEO',
      task: 'Исправить структуру H1',
      description: seoData.headings?.h1?.count === 0 ? 'H1 заголовок отсутствует' : `Найдено ${seoData.headings.h1.count} H1 заголовков`,
      impact: 'high',
      effort: 'low',
      expectedImprovement: '+15-25% релевантность для поисковиков'
    });
  }
  
  // Важные улучшения
  if (!seoData.metaDescription?.isOptimal) {
    actions.push({
      priority: 'important',
      category: 'SEO',
      task: 'Улучшить описание страницы',
      description: `Текущая длина: ${seoData.metaDescription?.length || 0} символов. Рекомендуется: 120-160 символов.`,
      impact: 'medium',
      effort: 'low',
      expectedImprovement: '+10-20% CTR в поиске'
    });
  }
  
  if (performanceData?.mobile?.core_web_vitals?.lcp?.score < 50) {
    actions.push({
      priority: 'important',
      category: 'Performance',
      task: 'Улучшить скорость загрузки (LCP)',
      description: `Текущий LCP: ${performanceData.mobile.core_web_vitals.lcp.displayValue}. Цель: < 2.5s`,
      impact: 'high',
      effort: 'high',
      expectedImprovement: '+10-15% ранжирование, +20% конверсия'
    });
  }
  
  if ((seoData.images?.withoutAlt || 0) > 0) {
    actions.push({
      priority: 'important',
      category: 'Accessibility',
      task: 'Добавить alt-тексты к изображениям',
      description: `${seoData.images.withoutAlt} изображений без описания из ${seoData.images.total}`,
      impact: 'medium',
      effort: 'medium',
      expectedImprovement: '+5-10% доступность и SEO'
    });
  }
  
  // Рекомендуемые улучшения на основе Schema.org валидации
  if (additionalData.schemaValidation) {
    const schemaVal = additionalData.schemaValidation;
    
    // Добавляем задачи на основе Rich Snippets возможностей
    if (schemaVal.richSnippetsOpportunities && schemaVal.richSnippetsOpportunities.length > 0) {
      // Берем топ-3 возможности с высоким приоритетом
      const topOpportunities = schemaVal.richSnippetsOpportunities
        .filter(opp => opp.priority === 'high' || opp.priority === 'medium')
        .slice(0, 3);
      
      topOpportunities.forEach(opportunity => {
        actions.push({
          priority: opportunity.priority === 'high' ? 'important' : 'recommended',
          category: 'SEO',
          task: `Добавить ${opportunity.type} schema`,
          description: opportunity.description,
          impact: opportunity.priority === 'high' ? 'high' : 'medium',
          effort: 'medium',
          expectedImprovement: opportunity.impact || '+15-30% rich snippets вероятность'
        });
      });
    }
    
    // Общая задача если Score низкий
    if (schemaVal.score < 50 && schemaVal.schemas.length === 0) {
      actions.push({
        priority: 'recommended',
        category: 'SEO',
        task: 'Внедрить базовые структурированные данные',
        description: `Текущая оценка Schema.org: ${schemaVal.score}/100. Обнаружено ${schemaVal.richSnippetsOpportunities.length} возможностей для улучшения.`,
        impact: 'medium',
        effort: 'medium',
        expectedImprovement: '+20-40% улучшение отображения в поиске'
      });
    }
  } else if ((seoData.structuredData?.count || 0) === 0) {
    // Fallback для старой логики
    actions.push({
      priority: 'recommended',
      category: 'SEO',
      task: 'Добавить структурированные данные',
      description: 'Schema.org разметка не найдена. Поможет получить rich snippets.',
      impact: 'medium',
      effort: 'medium',
      expectedImprovement: '+15-30% вероятность rich snippets'
    });
  }
  
  if (!seoData.openGraph?.title) {
    actions.push({
      priority: 'recommended',
      category: 'Social',
      task: 'Настроить карточки для соцсетей',
      description: 'Open Graph разметка отсутствует. Улучшит вид при публикации в соцсетях.',
      impact: 'low',
      effort: 'low',
      expectedImprovement: '+20-40% CTR в социальных сетях'
    });
  }

  // Новые проверки robots.txt и sitemap
  if (additionalData.robots && !additionalData.robots.found) {
    actions.push({
      priority: 'important',
      category: 'Technical',
      task: 'Создать файл robots.txt',
      description: 'Robots.txt не найден. Это важно для управления индексацией.',
      impact: 'medium',
      effort: 'low',
      expectedImprovement: '+5-10% контроль индексации'
    });
  }

  if (additionalData.robots?.issues?.length > 0) {
    actions.push({
      priority: 'recommended',
      category: 'Technical',
      task: 'Исправить ошибки в robots.txt',
      description: `Найдены проблемы: ${additionalData.robots.issues.join(', ')}`,
      impact: 'low',
      effort: 'low',
      expectedImprovement: '+3-5% SEO оптимизация'
    });
  }

  if (additionalData.sitemap && !additionalData.sitemap.found) {
    actions.push({
      priority: 'important',
      category: 'Technical',
      task: 'Создать sitemap.xml',
      description: 'Sitemap.xml не найден. Поможет поисковикам лучше индексировать сайт.',
      impact: 'medium',
      effort: 'medium',
      expectedImprovement: '+10-15% скорость индексации'
    });
  }

  if (additionalData.ssl && !additionalData.ssl.hasSSL) {
    actions.push({
      priority: 'critical',
      category: 'Security',
      task: 'Настроить HTTPS',
      description: 'Сайт не использует HTTPS. Это критично для безопасности и SEO.',
      impact: 'high',
      effort: 'high',
      expectedImprovement: '+15-25% доверие пользователей и SEO'
    });
  }

  if (additionalData.resources?.loadTime > 3000) {
    actions.push({
      priority: 'important',
      category: 'Performance',
      task: 'Оптимизировать скорость загрузки',
      description: `Время загрузки ${additionalData.resources.loadTime}ms слишком медленное.`,
      impact: 'high',
      effort: 'high',
      expectedImprovement: '+20-30% пользовательский опыт'
    });
  }

  if (additionalData.resources?.cssFiles > 10 || additionalData.resources?.jsFiles > 15) {
    actions.push({
      priority: 'recommended',
      category: 'Performance',
      task: 'Оптимизировать количество ресурсов',
      description: `Слишком много CSS/JS файлов (${additionalData.resources.cssFiles}/${additionalData.resources.jsFiles}).`,
      impact: 'medium',
      effort: 'medium',
      expectedImprovement: '+10-15% скорость загрузки'
    });
  }

  // W3C Validation проверки
  if (additionalData.w3cValidator && !additionalData.w3cValidator.isValid) {
    const errorCount = additionalData.w3cValidator.errors?.count || 0;
    if (errorCount > 0) {
      actions.push({
        priority: errorCount > 10 ? 'important' : 'recommended',
        category: 'Technical',
        task: 'Исправить ошибки HTML валидации',
        description: `Найдено ${errorCount} ошибок в HTML коде. Это может влиять на SEO.`,
        impact: errorCount > 10 ? 'medium' : 'low',
        effort: 'medium',
        expectedImprovement: '+5-10% техническое SEO'
      });
    }
  }

  // Security Headers проверки
  if (additionalData.securityHeaders && additionalData.securityHeaders.score < 70) {
    const missing = additionalData.securityHeaders.summary?.missing || 0;
    actions.push({
      priority: missing > 3 ? 'important' : 'recommended',
      category: 'Security',
      task: 'Настроить заголовки безопасности',
      description: `Отсутствует ${missing} важных заголовков безопасности. Оценка: ${additionalData.securityHeaders.score}/100`,
      impact: 'medium',
      effort: 'medium',
      expectedImprovement: '+10-15% безопасность и доверие'
    });
  }

  // Link Profile анализ
  if (additionalData.linkProfile) {
    const linkProfile = additionalData.linkProfile;
    
    // Внутренние ссылки
    if (linkProfile.internal?.total < 10) {
      actions.push({
        priority: 'important',
        category: 'SEO',
        task: 'Улучшить внутреннюю перелинковку',
        description: `Найдено только ${linkProfile.internal.total} внутренних ссылок. Рекомендуется минимум 10-15.`,
        impact: 'medium',
        effort: 'medium',
        expectedImprovement: '+10-20% внутренний PageRank'
      });
    }

    // Соотношение внутренних к внешним
    if (linkProfile.ratios?.internalToExternal < 2) {
      actions.push({
        priority: 'recommended',
        category: 'SEO',
        task: 'Оптимизировать баланс ссылок',
        description: `Соотношение внутренних к внешним ссылкам: ${linkProfile.ratios.internalToExternal}:1. Рекомендуется 3:1 или больше.`,
        impact: 'low',
        effort: 'low',
        expectedImprovement: '+5-10% распределение ссылочного веса'
      });
    }

    // Разнообразие anchor текстов
    if (linkProfile.ratios?.anchorDiversity < 5) {
      actions.push({
        priority: 'recommended',
        category: 'SEO',
        task: 'Разнообразить тексты ссылок',
        description: `Используется только ${linkProfile.ratios.anchorDiversity} разных текстов ссылок. Увеличьте разнообразие.`,
        impact: 'low',
        effort: 'low',
        expectedImprovement: '+3-7% релевантность ссылок'
      });
    }

    // Социальные сети
    if (!linkProfile.external?.social || linkProfile.external.social.length === 0) {
      actions.push({
        priority: 'recommended',
        category: 'Social',
        task: 'Добавить ссылки на социальные сети',
        description: 'Не найдено ссылок на социальные сети. Это улучшит engagement.',
        impact: 'low',
        effort: 'low',
        expectedImprovement: '+10-20% социальные сигналы'
      });
    }
  }

  // Sitelinks потенциал
  if (additionalData.sitelinks && additionalData.sitelinks.score < 70) {
    actions.push({
      priority: 'recommended',
      category: 'SEO',
      task: 'Улучшить потенциал для Sitelinks',
      description: `Текущая оценка: ${additionalData.sitelinks.score}/100. Улучшите навигацию и структуру сайта.`,
      impact: 'medium',
      effort: 'medium',
      expectedImprovement: '+20-30% вероятность получения sitelinks'
    });
  }

  // URL структура
  if (seoData.technical?.urlStructure) {
    const urlStruct = seoData.technical.urlStructure;
    if (urlStruct.length > 100) {
      actions.push({
        priority: 'recommended',
        category: 'Technical',
        task: 'Оптимизировать длину URL',
        description: `URL слишком длинный (${urlStruct.length} символов). Рекомендуется до 100 символов.`,
        impact: 'low',
        effort: 'low',
        expectedImprovement: '+3-5% удобство использования'
      });
    }
    
    if (urlStruct.hasParameters) {
      actions.push({
        priority: 'recommended',
        category: 'Technical',
        task: 'Очистить URL от параметров',
        description: 'URL содержит GET-параметры. Рассмотрите использование ЧПУ.',
        impact: 'low',
        effort: 'medium',
        expectedImprovement: '+5-8% SEO-дружественность URL'
      });
    }
  }

  // Mobile adaptivity
  if (additionalData.mobile && additionalData.mobile.score < 80) {
    actions.push({
      priority: 'critical',
      category: 'Mobile',
      task: 'Улучшить мобильную адаптивность',
      description: `Оценка мобильной версии: ${additionalData.mobile.score}/100. Mobile-first индексация критична.`,
      impact: 'high',
      effort: 'high',
      expectedImprovement: '+25-40% мобильное SEO'
    });
  }

  // Core Web Vitals детально
  if (performanceData?.mobile?.core_web_vitals) {
    const cwv = performanceData.mobile.core_web_vitals;
    
    if (cwv.fcp?.score < 50) {
      actions.push({
        priority: 'important',
        category: 'Performance',
        task: 'Улучшить First Contentful Paint',
        description: `FCP: ${cwv.fcp.displayValue}. Цель: < 1.8s для хорошего пользовательского опыта.`,
        impact: 'high',
        effort: 'high',
        expectedImprovement: '+15-25% скорость восприятия загрузки'
      });
    }

    if (cwv.cls?.score < 50) {
      actions.push({
        priority: 'important',
        category: 'Performance',
        task: 'Уменьшить сдвиг макета (CLS)',
        description: `CLS: ${cwv.cls.displayValue}. Цель: < 0.1 для стабильности макета.`,
        impact: 'medium',
        effort: 'medium',
        expectedImprovement: '+10-20% пользовательский опыт'
      });
    }
  }

  // Heading hierarchy
  if (seoData.headings) {
    const headings = seoData.headings;
    if (!headings.h2?.count || headings.h2.count === 0) {
      actions.push({
        priority: 'recommended',
        category: 'SEO',
        task: 'Добавить H2 заголовки',
        description: 'Отсутствуют H2 заголовки. Это важно для структуры контента.',
        impact: 'medium',
        effort: 'low',
        expectedImprovement: '+5-15% структурированность контента'
      });
    }
  }

  // Content length analysis
  if (seoData.content && seoData.content.textLength < 300) {
    actions.push({
      priority: 'important',
      category: 'Content',
      task: 'Увеличить объем контента',
      description: `Текста на странице: ${seoData.content.textLength} символов. Рекомендуется минимум 300-500.`,
      impact: 'medium',
      effort: 'high',
      expectedImprovement: '+15-25% релевантность для поисковых запросов'
    });
  }

  // Google PageSpeed Insights рекомендации
  if (performanceData?.mobile?.googleOpportunities || performanceData?.desktop?.googleOpportunities) {
    const opportunities = performanceData.mobile?.googleOpportunities || performanceData.desktop?.googleOpportunities || [];
    console.log(`🔍 Processing ${opportunities.length} PageSpeed opportunities for action plan`);
    
    opportunities.forEach(opportunity => {
      console.log(`📊 Opportunity: ${opportunity.category}, savings: ${opportunity.savings}KB, title: ${opportunity.title}`);
      if (opportunity.category === 'images' && opportunity.savings > 50) { // > 50KB экономии
        actions.push({
          priority: opportunity.savings > 200 ? 'critical' : 'important', // > 200KB = критично
          category: 'Performance',
          task: 'Оптимизировать изображения',
          description: `Сжатие и конвертация изображений может сэкономить ${Math.round(opportunity.savings)}KB. Найдено ${opportunity.items?.length || 0} изображений для оптимизации.`,
          impact: 'high',
          effort: 'medium',
          expectedImprovement: '+20-35% скорость загрузки страницы'
        });
      }
      
      if (opportunity.category === 'css' && opportunity.savings > 30) { // > 30KB экономии
        actions.push({
          priority: opportunity.savings > 100 ? 'important' : 'recommended', // > 100KB = важно
          category: 'Performance',
          task: 'Оптимизировать CSS файлы',
          description: `Удаление неиспользуемого CSS может сэкономить ${Math.round(opportunity.savings)}KB. Найдено ${opportunity.items?.length || 0} CSS файлов для оптимизации.`,
          impact: 'medium',
          effort: 'high',
          expectedImprovement: '+10-20% скорость первой отрисовки'
        });
      }
      
      if ((opportunity.category === 'performance' || opportunity.category === 'javascript') && opportunity.savings > 20) { // > 20KB экономии
        console.log(`🎯 JavaScript optimization found: ${opportunity.savings}KB savings, category: ${opportunity.category}`);
        actions.push({
          priority: opportunity.savings > 80 ? 'important' : 'recommended', // > 80KB = важно
          category: 'Performance', 
          task: 'Оптимизировать JavaScript файлы',
          description: `Минификация и удаление неиспользуемого JS может сэкономить ${Math.round(opportunity.savings)}KB. Найдено ${opportunity.items?.length || 0} JS файлов для оптимизации.`,
          impact: 'medium',
          effort: 'high',
          expectedImprovement: '+15-25% время интерактивности'
        });
      }
    });
  }

  // Общие рекомендации на основе оценки производительности PageSpeed
  const performanceScore = performanceData?.mobile?.performance_score || performanceData?.desktop?.performance_score;
  if (performanceScore && performanceScore < 90) {
    if (performanceScore < 50) {
      actions.push({
        priority: 'critical',
        category: 'PageSpeed Insights',
        task: 'Критически улучшить производительность',
        description: `Оценка PageSpeed: ${performanceScore}/100. Страница загружается крайне медленно и нуждается в комплексной оптимизации.`,
        impact: 'high', 
        effort: 'high',
        expectedImprovement: '+40-60% скорость загрузки и SEO'
      });
    } else if (performanceScore < 70) {
      actions.push({
        priority: 'important',
        category: 'PageSpeed Insights',
        task: 'Улучшить общую производительность',
        description: `Оценка PageSpeed: ${performanceScore}/100. Необходима оптимизация ресурсов и сервера.`,
        impact: 'high',
        effort: 'medium',
        expectedImprovement: '+25-40% общая производительность'
      });
    } else {
      actions.push({
        priority: 'recommended',
        category: 'PageSpeed Insights',
        task: 'Довести производительность до отличного уровня',
        description: `Оценка PageSpeed: ${performanceScore}/100. Близко к цели - несколько улучшений дадут отличный результат.`,
        impact: 'medium',
        effort: 'low',
        expectedImprovement: '+10-20% финальная оптимизация'
      });
    }
  }

  // Специфические Core Web Vitals рекомендации на основе PageSpeed данных
  if (performanceData?.mobile?.core_web_vitals) {
    const cwv = performanceData.mobile.core_web_vitals;
    
    // LCP детализированные рекомендации
    if (cwv.lcp?.score < 50 && cwv.lcp?.displayValue) {
      const lcpValue = parseFloat(cwv.lcp.displayValue);
      if (lcpValue > 4.0) {
        actions.push({
          priority: 'critical',
          category: 'Core Web Vitals',
          task: 'Критически улучшить LCP',
          description: `LCP ${cwv.lcp.displayValue} критически медленный. Необходимо оптимизировать главный контент и изображения.`,
          impact: 'high',
          effort: 'high',
          expectedImprovement: '+30-50% пользовательский опыт и SEO'
        });
      } else if (lcpValue > 2.5) {
        actions.push({
          priority: 'important',
          category: 'Core Web Vitals',
          task: 'Улучшить Largest Contentful Paint',
          description: `LCP ${cwv.lcp.displayValue} требует оптимизации. Цель: менее 2.5s для хорошего рейтинга.`,
          impact: 'high',
          effort: 'medium',
          expectedImprovement: '+20-30% Core Web Vitals оценка'
        });
      }
    }
    
    // FID/INP детализированные рекомендации  
    if (cwv.fid?.score < 50 || cwv.inp?.score < 50) {
      const fidValue = cwv.fid?.displayValue || cwv.inp?.displayValue;
      actions.push({
        priority: 'important',
        category: 'Core Web Vitals',
        task: 'Улучшить интерактивность страницы',
        description: `Время отклика на взаимодействие: ${fidValue}. Оптимизируйте JavaScript выполнение.`,
        impact: 'high',
        effort: 'high',
        expectedImprovement: '+25-40% интерактивность и UX'
      });
    }
    
    // CLS детализированные рекомендации
    if (cwv.cls?.score < 50) {
      const clsValue = parseFloat(cwv.cls?.displayValue || '0');
      if (clsValue > 0.25) {
        actions.push({
          priority: 'important',
          category: 'Core Web Vitals',
          task: 'Исправить нестабильность макета',
          description: `CLS ${cwv.cls.displayValue} вызывает сдвиги макета. Зафиксируйте размеры изображений и блоков.`,
          impact: 'medium',
          effort: 'medium',
          expectedImprovement: '+15-25% стабильность интерфейса'
        });
      }
    }
  }
  
  return actions.sort((a, b) => {
    const priorityOrder = { critical: 3, important: 2, recommended: 1 };
    return priorityOrder[b.priority] - priorityOrder[a.priority];
  });
}

// Генерация данных для визуализации
function generateVisualData(seoData, performanceData) {
  return {
    scoreBreakdown: {
      technical: calculateOverallScore(seoData, performanceData).technical,
      content: calculateOverallScore(seoData, performanceData).content,
      performance: calculateOverallScore(seoData, performanceData).performance
    },
    headingsChart: {
      h1: seoData.headings?.h1?.count || 0,
      h2: seoData.headings?.h2?.count || 0,
      h3: seoData.headings?.h3?.count || 0,
      h4: seoData.headings?.h4?.count || 0,
      h5: seoData.headings?.h5?.count || 0,
      h6: seoData.headings?.h6?.count || 0
    },
    contentStats: {
      wordCount: seoData.performance?.wordCount || 0,
      imagesTotal: seoData.images?.total || 0,
      imagesWithoutAlt: seoData.images?.withoutAlt || 0,
      linksInternal: seoData.links?.internal || 0,
      linksExternal: seoData.links?.external || 0
    },
    coreWebVitals: performanceData?.mobile?.core_web_vitals || null
  };
}

// === STRUCTURED DATA АНАЛИЗ ===

// Расширенный анализ структурированных данных
function analyzeStructuredDataAdvanced($, url) {
  const analysis = {
    count: 0,
    types: [],
    schemas: [],
    validation: {
      isValid: true,
      errors: [],
      warnings: [],
      recommendations: []
    },
    richSnippetsOpportunities: [],
    coverage: {
      hasJsonLd: false,
      hasMicrodata: false,
      hasRdfa: false
    }
  };

  // 1. Анализ JSON-LD
  const jsonLdData = analyzeJsonLd($);
  analysis.count += jsonLdData.count;
  analysis.types = [...analysis.types, ...jsonLdData.types];
  analysis.schemas = [...analysis.schemas, ...jsonLdData.schemas];
  analysis.coverage.hasJsonLd = jsonLdData.count > 0;

  // 2. Анализ Microdata
  const microdataData = analyzeMicrodata($);
  analysis.count += microdataData.count;
  analysis.types = [...analysis.types, ...microdataData.types];
  analysis.coverage.hasMicrodata = microdataData.count > 0;

  // 3. Анализ RDFa
  const rdfaData = analyzeRdfa($);
  analysis.coverage.hasRdfa = rdfaData.count > 0;

  // 4. Валидация схем
  validateSchemas(analysis);

  // 5. Рекомендации по Rich Snippets
  generateRichSnippetsOpportunities(analysis, $, url);

  return analysis;
}

// Анализ JSON-LD структур
function analyzeJsonLd($) {
  const jsonLdScripts = $('script[type="application/ld+json"]');
  const result = {
    count: jsonLdScripts.length,
    types: [],
    schemas: []
  };
  
  jsonLdScripts.each((i, el) => {
    try {
      const jsonContent = $(el).html();
      const data = JSON.parse(jsonContent);
      
      const schema = {
        type: data['@type'],
        context: data['@context'],
        isValid: true,
        errors: [],
        data: data
      };

      // Валидация основных полей
      if (!data['@type']) {
        schema.isValid = false;
        schema.errors.push('Отсутствует @type');
      }

      if (!data['@context']) {
        schema.isValid = false;
        schema.errors.push('Отсутствует @context');
      }

      // Специфичная валидация по типам
      validateSchemaByType(schema, data);

      if (data['@type']) {
        result.types.push(data['@type']);
      }
      
      result.schemas.push(schema);
    } catch (e) {
      result.schemas.push({
        type: 'Invalid JSON',
        isValid: false,
        errors: ['Некорректный JSON синтаксис: ' + e.message]
      });
    }
  });
  
  return result;
}

// Анализ Microdata
function analyzeMicrodata($) {
  const microdataElements = $('[itemscope]');
  const result = {
    count: microdataElements.length,
    types: []
  };
  
  microdataElements.each((i, el) => {
    const itemType = $(el).attr('itemtype');
    if (itemType) {
      const schemaType = itemType.split('/').pop();
      result.types.push(schemaType);
    }
  });
  
  return result;
}

// Анализ RDFa
function analyzeRdfa($) {
  const rdfaElements = $('[typeof], [property], [resource]');
  return {
    count: rdfaElements.length
  };
}

// Валидация схем по типу
function validateSchemaByType(schema, data) {
  const type = data['@type'];
  
  switch (type) {
    case 'Article':
      validateArticleSchema(schema, data);
      break;
    case 'Product':
      validateProductSchema(schema, data);
      break;
    case 'Organization':
      validateOrganizationSchema(schema, data);
      break;
    case 'WebSite':
      validateWebSiteSchema(schema, data);
      break;
    case 'BreadcrumbList':
      validateBreadcrumbSchema(schema, data);
      break;
    case 'FAQ':
      validateFAQSchema(schema, data);
      break;
  }
}

// Валидация Article схемы
function validateArticleSchema(schema, data) {
  const required = ['headline', 'author', 'datePublished'];
  const recommended = ['image', 'dateModified', 'publisher'];
  
  required.forEach(field => {
    if (!data[field]) {
      schema.errors.push(`Обязательное поле отсутствует: ${field}`);
    }
  });
  
  recommended.forEach(field => {
    if (!data[field]) {
      schema.warnings = schema.warnings || [];
      schema.warnings.push(`Рекомендуемое поле отсутствует: ${field}`);
    }
  });
}

// Валидация Product схемы
function validateProductSchema(schema, data) {
  const required = ['name'];
  const recommended = ['image', 'description', 'brand', 'offers'];
  
  required.forEach(field => {
    if (!data[field]) {
      schema.errors.push(`Обязательное поле отсутствует: ${field}`);
    }
  });
  
  recommended.forEach(field => {
    if (!data[field]) {
      schema.warnings = schema.warnings || [];
      schema.warnings.push(`Рекомендуемое поле отсутствует: ${field}`);
    }
  });
  
  // Валидация offers
  if (data.offers) {
    if (!data.offers.price) {
      schema.errors.push('Offers должны содержать price');
    }
    if (!data.offers.priceCurrency) {
      schema.errors.push('Offers должны содержать priceCurrency');
    }
  }
}

// Валидация Organization схемы
function validateOrganizationSchema(schema, data) {
  if (!data.name) {
    schema.errors.push('Обязательное поле отсутствует: name');
  }
  
  if (!data.url) {
    schema.warnings = schema.warnings || [];
    schema.warnings.push('Рекомендуемое поле отсутствует: url');
  }
}

// Валидация WebSite схемы
function validateWebSiteSchema(schema, data) {
  if (!data.name && !data.alternateName) {
    schema.errors.push('Должно быть указано name или alternateName');
  }
  
  if (!data.url) {
    schema.errors.push('Обязательное поле отсутствует: url');
  }
  
  // Проверка потенциала для sitelinks searchbox
  if (data.potentialAction && data.potentialAction['@type'] === 'SearchAction') {
    schema.recommendations = schema.recommendations || [];
    schema.recommendations.push('Отлично! Настроен SearchAction для поисковой строки в sitelinks');
  } else {
    schema.recommendations = schema.recommendations || [];
    schema.recommendations.push('Рассмотрите добавление SearchAction для поисковой строки Google');
  }
}

// Валидация FAQ схемы
function validateFAQSchema(schema, data) {
  if (!data.mainEntity || !Array.isArray(data.mainEntity)) {
    schema.errors.push('FAQ должен содержать массив mainEntity');
    return;
  }
  
  data.mainEntity.forEach((qa, index) => {
    if (!qa.name) {
      schema.errors.push(`Вопрос ${index + 1}: отсутствует name (текст вопроса)`);
    }
    if (!qa.acceptedAnswer || !qa.acceptedAnswer.text) {
      schema.errors.push(`Вопрос ${index + 1}: отсутствует acceptedAnswer.text`);
    }
  });
}

// Валидация BreadcrumbList схемы
function validateBreadcrumbSchema(schema, data) {
  if (!data.itemListElement || !Array.isArray(data.itemListElement)) {
    schema.errors.push('BreadcrumbList должен содержать массив itemListElement');
    return;
  }
  
  data.itemListElement.forEach((item, index) => {
    if (!item.name) {
      schema.errors.push(`Хлебная крошка ${index + 1}: отсутствует name`);
    }
    if (!item.item && index < data.itemListElement.length - 1) {
      schema.errors.push(`Хлебная крошка ${index + 1}: отсутствует item (URL)`);
    }
    if (typeof item.position !== 'number') {
      schema.errors.push(`Хлебная крошка ${index + 1}: position должно быть числом`);
    }
  });
}

// Общая валидация всех схем
function validateSchemas(analysis) {
  let totalErrors = 0;
  let totalWarnings = 0;
  
  // Детальная валидация каждой схемы
  analysis.schemas.forEach((schema, index) => {
    const validation = validateIndividualSchema(schema);
    schema.validation = validation;
    
    if (validation.errors) {
      totalErrors += validation.errors.length;
      analysis.validation.errors = [...analysis.validation.errors, ...validation.errors.map(error => ({
        schemaIndex: index,
        schemaType: schema['@type'] || schema.type || 'Unknown',
        ...error
      }))];
    }
    
    if (validation.warnings) {
      totalWarnings += validation.warnings.length;
      analysis.validation.warnings = [...analysis.validation.warnings, ...validation.warnings.map(warning => ({
        schemaIndex: index,
        schemaType: schema['@type'] || schema.type || 'Unknown',
        ...warning
      }))];
    }
  });
  
  analysis.validation.isValid = totalErrors === 0;
  analysis.validation.totalErrors = totalErrors;
  analysis.validation.totalWarnings = totalWarnings;
  analysis.validation.validSchemas = analysis.schemas.filter(s => s.validation?.isValid).length;
  
  // Расширенные рекомендации
  generateSchemaRecommendations(analysis);
}

// Валидация отдельной схемы
function validateIndividualSchema(schema) {
  const validation = {
    isValid: true,
    errors: [],
    warnings: [],
    missingProperties: [],
    recommendations: []
  };
  
  const schemaType = schema['@type'] || schema.type;
  if (!schemaType) {
    validation.errors.push({
      property: '@type',
      message: 'Отсутствует обязательное свойство @type',
      severity: 'error'
    });
    validation.isValid = false;
    return validation;
  }
  
  // Валидация по типам схем
  switch (schemaType.toLowerCase()) {
    case 'organization':
      validateOrganizationSchema(schema, validation);
      break;
    case 'website':
      validateWebsiteSchema(schema, validation);
      break;
    case 'article':
    case 'newsarticle':
    case 'blogposting':
      validateArticleSchema(schema, validation);
      break;
    case 'product':
      validateProductSchema(schema, validation);
      break;
    case 'localbusiness':
      validateLocalBusinessSchema(schema, validation);
      break;
    case 'breadcrumblist':
      validateBreadcrumbSchema(schema, validation);
      break;
    case 'faqpage':
      validateFAQSchema(schema, validation);
      break;
    case 'howto':
      validateHowToSchema(schema, validation);
      break;
    default:
      validateGenericSchema(schema, validation);
  }
  
  return validation;
}

// Генерация рекомендаций по схемам
function generateSchemaRecommendations(analysis) {
  const recommendations = [];
  
  if (analysis.count === 0) {
    recommendations.push({
      type: 'missing_schema',
      priority: 'high',
      message: 'Добавьте базовые структурированные данные (Organization, Website)',
      impact: 'Улучшение отображения в поиске на 25-40%'
    });
  }
  
  if (!analysis.coverage.hasJsonLd && analysis.coverage.hasMicrodata) {
    recommendations.push({
      type: 'format_upgrade',
      priority: 'medium',
      message: 'Переключитесь с Microdata на JSON-LD формат',
      impact: 'Более простое поддержание и лучшая совместимость'
    });
  }
  
  if (analysis.validation.totalErrors > 0) {
    recommendations.push({
      type: 'fix_errors',
      priority: 'critical',
      message: `Исправьте ${analysis.validation.totalErrors} ошибок в схемах`,
      impact: 'Неверные схемы игнорируются поисковыми системами'
    });
  }
  
  if (analysis.validation.totalWarnings > 3) {
    recommendations.push({
      type: 'optimize_schemas',
      priority: 'medium',
      message: `Оптимизируйте схемы (${analysis.validation.totalWarnings} предупреждений)`,
      impact: 'Повышение качества structured data'
    });
  }
  
  analysis.validation.recommendations = [...analysis.validation.recommendations, ...recommendations];
}

// Валидация схемы Organization
function validateOrganizationSchema(schema, validation) {
  const requiredProps = ['name', 'url'];
  const recommendedProps = ['logo', 'contactPoint', 'address', 'sameAs'];
  
  requiredProps.forEach(prop => {
    if (!schema[prop]) {
      validation.errors.push({
        property: prop,
        message: `Обязательное свойство '${prop}' отсутствует`,
        severity: 'error'
      });
      validation.isValid = false;
    }
  });
  
  recommendedProps.forEach(prop => {
    if (!schema[prop]) {
      validation.missingProperties.push(prop);
      validation.warnings.push({
        property: prop,
        message: `Рекомендуемое свойство '${prop}' отсутствует`,
        severity: 'warning',
        impact: prop === 'logo' ? 'Логотип в Knowledge Panel' : 'Дополнительная информация в поиске'
      });
    }
  });
}

// Валидация схемы Article
function validateArticleSchema(schema, validation) {
  const requiredProps = ['headline', 'author', 'datePublished'];
  const recommendedProps = ['image', 'publisher', 'dateModified', 'mainEntityOfPage'];
  
  requiredProps.forEach(prop => {
    if (!schema[prop]) {
      validation.errors.push({
        property: prop,
        message: `Обязательное свойство '${prop}' отсутствует для Article`,
        severity: 'error'
      });
      validation.isValid = false;
    }
  });
  
  // Проверка формата даты
  if (schema.datePublished && !isValidDateFormat(schema.datePublished)) {
    validation.errors.push({
      property: 'datePublished',
      message: 'Неверный формат даты (используйте ISO 8601)',
      severity: 'error'
    });
    validation.isValid = false;
  }
  
  recommendedProps.forEach(prop => {
    if (!schema[prop]) {
      validation.missingProperties.push(prop);
      validation.warnings.push({
        property: prop,
        message: `Рекомендуемое свойство '${prop}' отсутствует`,
        severity: 'warning',
        impact: prop === 'image' ? 'Изображение в результатах поиска' : 'Дополнительные метаданные'
      });
    }
  });
}

// Валидация схемы Product
function validateProductSchema(schema, validation) {
  const requiredProps = ['name'];
  const recommendedProps = ['image', 'description', 'offers', 'aggregateRating', 'brand'];
  
  requiredProps.forEach(prop => {
    if (!schema[prop]) {
      validation.errors.push({
        property: prop,
        message: `Обязательное свойство '${prop}' отсутствует для Product`,
        severity: 'error'
      });
      validation.isValid = false;
    }
  });
  
  // Специальная проверка offers
  if (schema.offers) {
    if (!schema.offers.price && !schema.offers.priceRange) {
      validation.warnings.push({
        property: 'offers.price',
        message: 'У предложения отсутствует цена',
        severity: 'warning',
        impact: 'Цена не будет отображаться в результатах поиска'
      });
    }
    
    if (!schema.offers.availability) {
      validation.warnings.push({
        property: 'offers.availability',
        message: 'Не указана доступность товара',
        severity: 'warning',
        impact: 'Статус наличия не будет показан'
      });
    }
  } else {
    validation.missingProperties.push('offers');
    validation.warnings.push({
      property: 'offers',
      message: 'Отсутствует информация о предложении (цена, наличие)',
      severity: 'warning',
      impact: 'Товар не будет показан с ценой в результатах поиска'
    });
  }
  
  recommendedProps.forEach(prop => {
    if (!schema[prop] && prop !== 'offers') {
      validation.missingProperties.push(prop);
      validation.warnings.push({
        property: prop,
        message: `Рекомендуемое свойство '${prop}' отсутствует`,
        severity: 'warning',
        impact: prop === 'aggregateRating' ? 'Звездочки рейтинга в поиске' : 'Дополнительная информация о товаре'
      });
    }
  });
}

// Валидация других типов схем (упрощенная)
function validateWebsiteSchema(schema, validation) {
  if (!schema.name && !schema.url) {
    validation.errors.push({
      property: 'name|url',
      message: 'Website схема должна содержать name или url',
      severity: 'error'
    });
    validation.isValid = false;
  }
}

function validateLocalBusinessSchema(schema, validation) {
  const requiredProps = ['name', 'address'];
  requiredProps.forEach(prop => {
    if (!schema[prop]) {
      validation.errors.push({
        property: prop,
        message: `Обязательное свойство '${prop}' отсутствует для LocalBusiness`,
        severity: 'error'
      });
      validation.isValid = false;
    }
  });
}

function validateBreadcrumbSchema(schema, validation) {
  if (!schema.itemListElement || !Array.isArray(schema.itemListElement)) {
    validation.errors.push({
      property: 'itemListElement',
      message: 'BreadcrumbList должен содержать массив itemListElement',
      severity: 'error'
    });
    validation.isValid = false;
  }
}

function validateFAQSchema(schema, validation) {
  if (!schema.mainEntity || !Array.isArray(schema.mainEntity)) {
    validation.errors.push({
      property: 'mainEntity',
      message: 'FAQPage должен содержать массив вопросов в mainEntity',
      severity: 'error'
    });
    validation.isValid = false;
  }
}

function validateHowToSchema(schema, validation) {
  if (!schema.step || !Array.isArray(schema.step)) {
    validation.errors.push({
      property: 'step',
      message: 'HowTo должен содержать массив шагов в step',
      severity: 'error'
    });
    validation.isValid = false;
  }
}

function validateGenericSchema(schema, validation) {
  // Базовая валидация для неизвестных типов
  if (!schema.name && !schema.headline && !schema.title) {
    validation.warnings.push({
      property: 'name',
      message: 'Рекомендуется добавить name, headline или title',
      severity: 'warning'
    });
  }
}

// Вспомогательная функция проверки формата даты
function isValidDateFormat(dateString) {
  const iso8601Regex = /^\d{4}-\d{2}-\d{2}(T\d{2}:\d{2}:\d{2}(\.\d{3})?([+-]\d{2}:\d{2}|Z))?$/;
  return iso8601Regex.test(dateString);
}

// Генерация возможностей для Rich Snippets
function generateRichSnippetsOpportunities(analysis, $, url) {
  const opportunities = [];
  const existingTypes = analysis.types.map(t => t.toLowerCase());
  
  // 1. Анализ FAQ возможностей
  const faqOpportunity = detectFAQOpportunity($, existingTypes);
  if (faqOpportunity) opportunities.push(faqOpportunity);
  
  // 2. Анализ HowTo возможностей  
  const howToOpportunity = detectHowToOpportunity($, existingTypes);
  if (howToOpportunity) opportunities.push(howToOpportunity);
  
  // 3. Анализ Product возможностей
  const productOpportunity = detectProductOpportunity($, existingTypes);
  if (productOpportunity) opportunities.push(productOpportunity);
  
  // 4. Анализ Article возможностей
  const articleOpportunity = detectArticleOpportunity($, existingTypes);
  if (articleOpportunity) opportunities.push(articleOpportunity);
  
  // 5. Анализ LocalBusiness возможностей
  const localBusinessOpportunity = detectLocalBusinessOpportunity($, existingTypes);
  if (localBusinessOpportunity) opportunities.push(localBusinessOpportunity);
  
  // 6. Анализ Organization/Website возможностей
  const organizationOpportunities = detectOrganizationOpportunities($, existingTypes);
  opportunities.push(...organizationOpportunities);
  
  // 7. Анализ BreadcrumbList возможностей
  const breadcrumbOpportunity = detectBreadcrumbOpportunity($, existingTypes);
  if (breadcrumbOpportunity) opportunities.push(breadcrumbOpportunity);
  
  // 8. Анализ Video возможностей
  const videoOpportunity = detectVideoOpportunity($, existingTypes);
  if (videoOpportunity) opportunities.push(videoOpportunity);
  
  // 9. Анализ Event возможностей
  const eventOpportunity = detectEventOpportunity($, existingTypes);
  if (eventOpportunity) opportunities.push(eventOpportunity);
  
  analysis.richSnippetsOpportunities = opportunities;
  
  // FAQ возможности
  const faqElements = $('details, .faq, .accordion, h3:contains("?"), h2:contains("?")');
  if (faqElements.length > 0 && !existingTypes.includes('faq')) {
    opportunities.push({
      type: 'FAQ',
      priority: 'medium',
      description: 'Превратите существующие Q&A в FAQ schema',
      expectedResult: 'Раскрывающиеся вопросы-ответы в Google'
    });
  }
  
  analysis.richSnippetsOpportunities = opportunities;
}

// Детекция FAQ возможностей
function detectFAQOpportunity($, existingTypes) {
  if (existingTypes.includes('faqpage')) return null;
  
  // Ищем паттерны FAQ
  const faqPatterns = [
    'h2:contains("?"), h3:contains("?"), h4:contains("?")', // Заголовки с вопросами
    '.faq, .faqs, .questions, .qa', // CSS классы FAQ
    '[class*="faq"], [class*="question"]', // Частичные классы
    'dt, dd' // Definition lists часто используются для FAQ
  ];
  
  let faqElements = 0;
  let questionElements = [];
  
  faqPatterns.forEach(pattern => {
    const elements = $(pattern);
    faqElements += elements.length;
    
    elements.each((i, el) => {
      const text = $(el).text().trim();
      if (text.includes('?') || text.toLowerCase().includes('как') || text.toLowerCase().includes('что')) {
        questionElements.push({
          element: el.tagName,
          text: text.substring(0, 100) + '...',
          hasAnswer: $(el).next().length > 0
        });
      }
    });
  });
  
  if (faqElements >= 3 || questionElements.length >= 2) {
    return {
      type: 'FAQPage',
      priority: 'high',
      confidence: questionElements.length >= 3 ? 'high' : 'medium',
      description: `Найдено ${questionElements.length} потенциальных вопросов. Добавьте FAQPage schema`,
      expectedResult: 'Отображение вопросов и ответов прямо в результатах поиска (Featured Snippets)',
      impact: 'CTR +30-50%, Featured Snippets вероятность +60%',
      detectedElements: questionElements.slice(0, 3),
      implementation: 'Оберните каждую пару вопрос-ответ в Question schema с acceptedAnswer'
    };
  }
  
  return null;
}

// Детекция HowTo возможностей
function detectHowToOpportunity($, existingTypes) {
  if (existingTypes.includes('howto')) return null;
  
  // Ищем пошаговые инструкции
  const howToPatterns = [
    'ol li', // Нумерованные списки
    '.step, .steps', // CSS классы шагов
    '[class*="step"]', // Частичные классы
    'h2:matches("Шаг \\d+"), h3:matches("Этап \\d+")', // Заголовки с номерами
  ];
  
  let stepElements = 0;
  let detectedSteps = [];
  
  // Проверяем нумерованные списки
  $('ol').each((i, ol) => {
    const items = $(ol).find('li');
    if (items.length >= 3) {
      stepElements += items.length;
      items.each((j, li) => {
        if (j < 3) { // Первые 3 шага для примера
          detectedSteps.push({
            stepNumber: j + 1,
            text: $(li).text().trim().substring(0, 80) + '...',
            hasImage: $(li).find('img').length > 0
          });
        }
      });
    }
  });
  
  // Проверяем заголовки с шагами
  $('h1, h2, h3, h4').each((i, el) => {
    const text = $(el).text().toLowerCase();
    if (text.includes('шаг') || text.includes('этап') || /\d+\./.test(text)) {
      stepElements++;
      if (detectedSteps.length < 3) {
        detectedSteps.push({
          stepNumber: detectedSteps.length + 1,
          text: $(el).text().trim().substring(0, 80) + '...',
          hasImage: $(el).siblings().find('img').length > 0
        });
      }
    }
  });
  
  if (stepElements >= 3) {
    return {
      type: 'HowTo',
      priority: 'high',
      confidence: stepElements >= 5 ? 'high' : 'medium',
      description: `Найдено ${stepElements} шагов инструкции. Добавьте HowTo schema`,
      expectedResult: 'Пошаговое отображение в результатах поиска с изображениями',
      impact: 'CTR +25-40%, Rich Results отображение',
      detectedSteps: detectedSteps,
      implementation: 'Создайте HowTo schema с массивом HowToStep для каждого шага'
    };
  }
  
  return null;
}

// Детекция Product возможностей
function detectProductOpportunity($, existingTypes) {
  if (existingTypes.includes('product')) return null;
  
  const productIndicators = {
    price: $('[class*="price"], .cost, .amount, [data-price]').length,
    rating: $('[class*="rating"], [class*="star"], .review-score').length,
    availability: $('[class*="stock"], [class*="available"], .in-stock, .out-of-stock').length,
    brand: $('[class*="brand"], .manufacturer').length,
    description: $('[class*="description"], .product-info').length
  };
  
  const productScore = Object.values(productIndicators).reduce((sum, count) => sum + (count > 0 ? 1 : 0), 0);
  
  if (productScore >= 2) {
    return {
      type: 'Product',
      priority: 'high',
      confidence: productScore >= 4 ? 'high' : 'medium',
      description: `Найдены элементы товара (${productScore}/5). Добавьте Product schema`,
      expectedResult: 'Цена, рейтинг, наличие и изображения в результатах поиска',
      impact: 'E-commerce CTR +40-60%, Google Shopping integration',
      detectedElements: {
        hasPrice: productIndicators.price > 0,
        hasRating: productIndicators.rating > 0,
        hasAvailability: productIndicators.availability > 0,
        hasBrand: productIndicators.brand > 0,
        hasDescription: productIndicators.description > 0
      },
      implementation: 'Добавьте Product schema с offers, aggregateRating и brand'
    };
  }
  
  return null;
}

// Детекция Article возможностей
function detectArticleOpportunity($, existingTypes) {
  if (existingTypes.includes('article') || existingTypes.includes('blogposting') || existingTypes.includes('newsarticle')) return null;
  
  const articleIndicators = {
    headline: $('h1').length > 0,
    author: $('[class*="author"], .byline, [rel="author"]').length > 0,
    publishDate: $('[datetime], [class*="date"], .published').length > 0,
    content: $('article, .content, .post-content, main').length > 0,
    image: $('img[src]').length > 0
  };
  
  const wordCount = $('body').text().trim().split(/\s+/).length;
  const isArticle = wordCount > 200 && (articleIndicators.headline || articleIndicators.content);
  
  if (isArticle) {
    return {
      type: 'Article',
      priority: 'medium',
      confidence: Object.values(articleIndicators).filter(Boolean).length >= 3 ? 'high' : 'medium',
      description: `Статья с ${wordCount} словами. Добавьте Article schema`,
      expectedResult: 'Дата публикации, автор и изображение в результатах поиска',
      impact: 'News/Blog CTR +20-35%, Google News eligibility',
      detectedElements: articleIndicators,
      implementation: 'Добавьте Article schema с headline, author, datePublished и image'
    };
  }
  
  return null;
}

// Детекция LocalBusiness возможностей
function detectLocalBusinessOpportunity($, existingTypes) {
  if (existingTypes.includes('localbusiness')) return null;
  
  const businessIndicators = {
    address: $('[class*="address"], .location, .contact-info').length > 0,
    phone: $('a[href^="tel:"], [class*="phone"], .telephone').length > 0,
    hours: $('[class*="hours"], [class*="schedule"], .opening-hours').length > 0,
    location: $('[class*="location"], [class*="map"]').length > 0
  };
  
  const businessScore = Object.values(businessIndicators).filter(Boolean).length;
  
  if (businessScore >= 2) {
    return {
      type: 'LocalBusiness',
      priority: 'high',
      confidence: businessScore >= 3 ? 'high' : 'medium',
      description: `Найдены элементы локального бизнеса (${businessScore}/4). Добавьте LocalBusiness schema`,
      expectedResult: 'Информация о бизнесе в Google Maps и локальных результатах',
      impact: 'Local SEO +50-70%, Google My Business integration',
      detectedElements: businessIndicators,
      implementation: 'Добавьте LocalBusiness schema с address, telephone и openingHours'
    };
  }
  
  return null;
}

// Детекция Organization возможностей
function detectOrganizationOpportunities($, existingTypes) {
  const opportunities = [];
  
  if (!existingTypes.includes('organization')) {
    const hasLogo = $('img[alt*="logo"], .logo img, [class*="logo"] img').length > 0;
    const hasContactInfo = $('[class*="contact"], .footer').length > 0;
    
    if (hasLogo || hasContactInfo) {
      opportunities.push({
        type: 'Organization',
        priority: 'medium',
        confidence: hasLogo && hasContactInfo ? 'high' : 'medium',
        description: 'Добавьте Organization schema для Knowledge Panel',
        expectedResult: 'Логотип и информация о компании в результатах поиска',
        impact: 'Brand recognition +30%, Knowledge Panel eligibility',
        implementation: 'Добавьте Organization schema с name, logo, url и contactPoint'
      });
    }
  }
  
  if (!existingTypes.includes('website')) {
    opportunities.push({
      type: 'WebSite',
      priority: 'low',
      confidence: 'high',
      description: 'Добавьте WebSite schema с поиском по сайту',
      expectedResult: 'Поисковая строка под результатом в Google',
      impact: 'Site search usage +40%, Brand queries boost',
      implementation: 'Добавьте WebSite schema с potentialAction SearchAction'
    });
  }
  
  return opportunities;
}

// Детекция BreadcrumbList возможностей
function detectBreadcrumbOpportunity($, existingTypes) {
  if (existingTypes.includes('breadcrumblist')) return null;
  
  const breadcrumbElements = $('nav ol, .breadcrumb, .breadcrumbs, [class*="breadcrumb"]').length;
  
  if (breadcrumbElements > 0) {
    return {
      type: 'BreadcrumbList',
      priority: 'low',
      confidence: 'high',
      description: 'Найдены хлебные крошки. Добавьте BreadcrumbList schema',
      expectedResult: 'Навигационные крошки в результатах поиска',
      impact: 'Navigation clarity +25%, SERP real estate',
      implementation: 'Добавьте BreadcrumbList schema к существующей навигации'
    };
  }
  
  return null;
}

// Детекция Video возможностей
function detectVideoOpportunity($, existingTypes) {
  if (existingTypes.includes('videoobject')) return null;
  
  const videoElements = $('video, iframe[src*="youtube"], iframe[src*="vimeo"], [class*="video"]').length;
  
  if (videoElements > 0) {
    return {
      type: 'VideoObject',
      priority: 'medium',
      confidence: 'high',
      description: `Найдено ${videoElements} видео. Добавьте VideoObject schema`,
      expectedResult: 'Превью видео с продолжительностью в результатах поиска',
      impact: 'Video CTR +50-80%, Video carousel eligibility',
      implementation: 'Добавьте VideoObject schema с name, description, thumbnailUrl и duration'
    };
  }
  
  return null;
}

// Детекция Event возможностей  
function detectEventOpportunity($, existingTypes) {
  if (existingTypes.includes('event')) return null;
  
  const eventIndicators = {
    date: $('[datetime], [class*="date"], .event-date').length > 0,
    location: $('[class*="location"], [class*="venue"], .address').length > 0,
    title: $('h1, h2').filter(function() {
      return $(this).text().toLowerCase().includes('событие') || 
             $(this).text().toLowerCase().includes('мероприятие') ||
             $(this).text().toLowerCase().includes('концерт') ||
             $(this).text().toLowerCase().includes('конференция');
    }).length > 0
  };
  
  const eventScore = Object.values(eventIndicators).filter(Boolean).length;
  
  if (eventScore >= 2) {
    return {
      type: 'Event',
      priority: 'medium',
      confidence: eventScore >= 3 ? 'high' : 'medium',
      description: `Найдены элементы события (${eventScore}/3). Добавьте Event schema`,
      expectedResult: 'Дата, время и место проведения в результатах поиска',
      impact: 'Event discovery +60%, Google Events integration',
      implementation: 'Добавьте Event schema с name, startDate, location и organizer'
    };
  }
  
  return null;  
}

// Основная функция анализа Schema.org
function analyzeSchemaOrg($, url) {
  const analysis = {
    schemas: [],
    richSnippetsOpportunities: [],
    score: 0,
    maxScore: 100,
    issues: [],
    recommendations: []
  };

  // 1. Поиск и анализ существующих схем
  const schemaScripts = $('script[type="application/ld+json"]');
  const existingTypes = [];

  schemaScripts.each((i, script) => {
    try {
      const jsonData = JSON.parse($(script).html());
      const schemas = Array.isArray(jsonData) ? jsonData : [jsonData];
      
      schemas.forEach(schema => {
        if (schema['@type']) {
          const schemaType = schema['@type'].toLowerCase();
          existingTypes.push(schemaType);
          
          const validationResult = validateIndividualSchema(schema, schemaType);
          analysis.schemas.push({
            type: schema['@type'],
            isValid: validationResult.isValid,
            errors: validationResult.errors,
            warnings: validationResult.warnings,
            missingProperties: validationResult.missingProperties,
            recommendations: validationResult.recommendations
          });
        }
      });
    } catch (e) {
      analysis.issues.push('Найдена некорректная JSON-LD схема');
    }
  });

  // 2. Анализ Microdata
  const microdataItems = $('[itemscope]');
  microdataItems.each((i, item) => {
    const itemType = $(item).attr('itemtype');
    if (itemType) {
      const schemaType = itemType.split('/').pop().toLowerCase();
      if (!existingTypes.includes(schemaType)) {
        existingTypes.push(schemaType);
        analysis.schemas.push({
          type: itemType.split('/').pop(),
          isValid: true,
          errors: [],
          warnings: ['Microdata найдена, рекомендуется JSON-LD'],
          missingProperties: [],
          recommendations: ['Рекомендуется миграция на JSON-LD для лучшей поддержки']
        });
      }
    }
  });

  // 3. Поиск возможностей Rich Snippets
  const opportunities = [];

  // FAQ возможности
  const faqOpportunity = detectFAQOpportunity($, existingTypes);
  if (faqOpportunity) opportunities.push(faqOpportunity);

  // HowTo возможности
  const howToOpportunity = detectHowToOpportunity($, existingTypes);
  if (howToOpportunity) opportunities.push(howToOpportunity);

  // Product возможности
  const productOpportunity = detectProductOpportunity($, existingTypes);
  if (productOpportunity) opportunities.push(productOpportunity);

  // Article возможности
  const articleOpportunity = detectArticleOpportunity($, existingTypes);
  if (articleOpportunity) opportunities.push(articleOpportunity);

  // LocalBusiness возможности
  const localBusinessOpportunity = detectLocalBusinessOpportunity($, existingTypes);
  if (localBusinessOpportunity) opportunities.push(localBusinessOpportunity);

  // Organization возможности
  const organizationOpportunities = detectOrganizationOpportunities($, existingTypes);
  opportunities.push(...organizationOpportunities);

  // Breadcrumb возможности
  const breadcrumbOpportunity = detectBreadcrumbOpportunity($, existingTypes);
  if (breadcrumbOpportunity) opportunities.push(breadcrumbOpportunity);

  // Video возможности
  const videoOpportunity = detectVideoOpportunity($, existingTypes);
  if (videoOpportunity) opportunities.push(videoOpportunity);

  // Event возможности
  const eventOpportunity = detectEventOpportunity($, existingTypes);
  if (eventOpportunity) opportunities.push(eventOpportunity);

  analysis.richSnippetsOpportunities = opportunities;

  // 4. Расчет общего балла
  let score = 50; // Базовый балл

  // Бонусы за существующие схемы
  analysis.schemas.forEach(schema => {
    if (schema.isValid) {
      score += 15;
    } else {
      score += 5;
    }
  });

  // Штрафы за отсутствие ключевых схем
  if (!existingTypes.includes('organization') && !existingTypes.includes('localbusiness')) {
    score -= 10;
    analysis.issues.push('Отсутствует базовая информация о компании (Organization/LocalBusiness)');
  }

  if (!existingTypes.includes('website')) {
    score -= 5;
    analysis.issues.push('Отсутствует WebSite schema для поиска по сайту');
  }

  analysis.score = Math.min(Math.max(score, 0), 100);

  // 5. Общие рекомендации
  if (analysis.schemas.length === 0) {
    analysis.recommendations.push('Добавьте структурированные данные для улучшения отображения в поиске');
  }

  if (opportunities.length > 0) {
    analysis.recommendations.push(`Обнаружено ${opportunities.length} возможностей для Rich Snippets`);
  }

  if (analysis.score < 70) {
    analysis.recommendations.push('Расширьте использование структурированных данных для лучшего SEO');
  }

  return analysis;
}

// Определение типа страницы
function detectPageType($, url) {
  // Анализируем URL
  if (url.includes('/product/') || url.includes('/shop/') || $('.price, .buy-button, .add-to-cart').length > 0) {
    return 'product';
  }
  
  if (url.includes('/blog/') || url.includes('/news/') || $('article, .post, .entry').length > 0) {
    return 'article';
  }
  
  if (url === '/' || url.endsWith('.com') || url.endsWith('.ua') || url.endsWith('.org')) {
    return 'homepage';
  }
  
  return 'page';
}

// Функция для проверки robots.txt
async function checkRobotsTxt(baseUrl) {
  try {
    const robotsUrl = new URL('/robots.txt', baseUrl).href;
    const response = await fetch(robotsUrl, {
      headers: { 'User-Agent': 'Wekey-SEO-Bot/1.0' },
      timeout: 10000
    });

    if (!response.ok) {
      return {
        found: false,
        url: robotsUrl,
        status: response.status,
        issues: ['Файл robots.txt не найден']
      };
    }

    const content = await response.text();
    const lines = content.split('\n').map(line => line.trim()).filter(line => line);
    
    const analysis = {
      found: true,
      url: robotsUrl,
      status: 200,
      size: content.length,
      lines: lines.length,
      hasUserAgent: false,
      hasDisallow: false,
      hasSitemap: false,
      issues: [],
      warnings: []
    };

    // Анализ содержимого
    lines.forEach(line => {
      const lowerLine = line.toLowerCase();
      if (lowerLine.startsWith('user-agent:')) {
        analysis.hasUserAgent = true;
      }
      if (lowerLine.startsWith('disallow:')) {
        analysis.hasDisallow = true;
      }
      if (lowerLine.startsWith('sitemap:')) {
        analysis.hasSitemap = true;
      }
    });

    // Проверки и рекомендации
    if (!analysis.hasUserAgent) {
      analysis.issues.push('Отсутствует директива User-agent');
    }
    if (!analysis.hasDisallow) {
      analysis.warnings.push('Нет правил Disallow (возможно, весь сайт открыт для индексации)');
    }
    if (!analysis.hasSitemap) {
      analysis.warnings.push('Не указан путь к sitemap.xml');
    }
    if (content.length > 500000) { // 500KB
      analysis.warnings.push('Файл robots.txt очень большой (>500KB)');
    }

    return analysis;
  } catch (error) {
    return {
      found: false,
      url: robotsUrl || `${baseUrl}/robots.txt`,
      error: error.message,
      issues: ['Ошибка при загрузке robots.txt: ' + error.message]
    };
  }
}

// Функция для проверки sitemap.xml
async function checkSitemap(baseUrl, robotsData = null) {
  const results = {
    found: false,
    urls: [],
    issues: [],
    warnings: []
  };

  const sitemapUrls = [];
  
  // Добавляем URL из robots.txt
  if (robotsData?.hasSitemap) {
    // Здесь можно парсить sitemap URLs из robots.txt
    sitemapUrls.push(new URL('/sitemap.xml', baseUrl).href);
  } else {
    // Стандартные места для sitemap
    sitemapUrls.push(
      new URL('/sitemap.xml', baseUrl).href,
      new URL('/sitemap_index.xml', baseUrl).href,
      new URL('/sitemap.txt', baseUrl).href
    );
  }

  for (const sitemapUrl of sitemapUrls) {
    try {
      const response = await fetch(sitemapUrl, {
        headers: { 'User-Agent': 'Wekey-SEO-Bot/1.0' },
        timeout: 10000
      });

      if (response.ok) {
        results.found = true;
        results.urls.push({
          url: sitemapUrl,
          status: response.status,
          size: response.headers.get('content-length') || 'unknown'
        });
        break; // Нашли первый рабочий sitemap
      }
    } catch (error) {
      // Игнорируем ошибки для отдельных sitemap URLs
    }
  }

  if (!results.found) {
    results.issues.push('Sitemap.xml не найден в стандартных местах');
  }

  return results;
}

// Функция для проверки SSL сертификата
async function checkSSL(url) {
  try {
    const urlObj = new URL(url);
    
    if (urlObj.protocol !== 'https:') {
      return {
        hasSSL: false,
        issues: ['Сайт не использует HTTPS'],
        warnings: ['Рекомендуется переход на HTTPS для безопасности и SEO']
      };
    }

    // Простая проверка доступности HTTPS
    const response = await fetch(url, {
      headers: { 'User-Agent': 'Wekey-SEO-Bot/1.0' },
      timeout: 10000
    });

    return {
      hasSSL: true,
      status: response.status,
      issues: [],
      warnings: response.status !== 200 ? [`HTTPS ответил с кодом ${response.status}`] : []
    };

  } catch (error) {
    return {
      hasSSL: url.startsWith('https://'),
      error: error.message,
      issues: ['Ошибка при проверке SSL: ' + error.message],
      warnings: []
    };
  }
}

// Функция для проверки скорости загрузки ресурсов
async function checkResourcesSpeed(url) {
  try {
    const start = Date.now();
    const response = await fetch(url, {
      headers: { 'User-Agent': 'Wekey-SEO-Bot/1.0' },
      timeout: 15000
    });
    
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`);
    }

    const loadTime = Date.now() - start;
    const html = await response.text();
    const htmlSize = Buffer.byteLength(html, 'utf8');
    
    const analysis = {
      loadTime: loadTime,
      htmlSize: htmlSize,
      htmlSizeKB: Math.round(htmlSize / 1024 * 100) / 100,
      responseStatus: response.status,
      issues: [],
      warnings: []
    };

    // Анализ времени загрузки
    if (loadTime > 3000) {
      analysis.issues.push(`Медленная загрузка HTML (${loadTime}ms > 3000ms)`);
    } else if (loadTime > 1500) {
      analysis.warnings.push(`Загрузка HTML можно ускорить (${loadTime}ms)`);
    }

    // Анализ размера HTML
    if (htmlSize > 1024 * 1024) { // > 1MB
      analysis.warnings.push(`Большой размер HTML (${analysis.htmlSizeKB}KB)`);
    }

    return analysis;
  } catch (error) {
    return {
      error: error.message,
      loadTime: null,
      issues: ['Ошибка при анализе скорости ресурсов: ' + error.message],
      warnings: []
    };
  }
}

// Google Mobile-Friendly Test API
async function checkMobileFriendly(url) {
  try {
    console.log('🔍 Checking Mobile-Friendly for:', url);
    
    // Google Mobile-Friendly Test API endpoint
    const API_URL = 'https://searchconsole.googleapis.com/v1/urlTestingTools/mobileFriendlyTest:run';
    
    const response = await fetch(API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        url: url,
        requestScreenshot: false
      }),
      timeout: 15000
    });

    if (!response.ok) {
      console.log('⚠️ Mobile-Friendly API unavailable, using fallback analysis');
      return await fallbackMobileAnalysis(url);
    }

    const data = await response.json();
    console.log('📱 Mobile-Friendly API response received');

    return {
      isMobileFriendly: data.mobileFriendliness === 'MOBILE_FRIENDLY',
      status: data.mobileFriendliness || 'UNKNOWN',
      issues: extractMobileIssues(data),
      loadingStatus: data.testStatus?.status || 'COMPLETE',
      pageLoadTime: data.testStatus?.details || null,
      resourceIssues: data.resourceIssues || [],
      recommendations: generateMobileRecommendations(data)
    };

  } catch (error) {
    console.log('⚠️ Mobile-Friendly API error:', error.message);
    return await fallbackMobileAnalysis(url);
  }
}

// Fallback mobile analysis using viewport and CSS media queries detection
async function fallbackMobileAnalysis(url) {
  try {
    const response = await fetch(url, { timeout: 10000 });
    const html = await response.text();
    const $ = cheerio.load(html);
    
    const analysis = {
      isMobileFriendly: false,
      status: 'ANALYZED_LOCALLY',
      issues: [],
      recommendations: [],
      viewport: null,
      hasMediaQueries: false
    };

    // Check viewport meta tag
    const viewport = $('meta[name="viewport"]').attr('content');
    analysis.viewport = viewport || null;
    
    if (!viewport) {
      analysis.issues.push('Отсутствует мета-тег viewport');
    } else if (viewport.includes('width=device-width')) {
      analysis.isMobileFriendly = true;
    }

    // Check for CSS media queries in <style> tags
    const styleTags = $('style').text();
    if (styleTags.includes('@media') && (styleTags.includes('max-width') || styleTags.includes('min-width'))) {
      analysis.hasMediaQueries = true;
      analysis.isMobileFriendly = true;
    }

    // Check for responsive CSS files
    const cssLinks = $('link[rel="stylesheet"]');
    cssLinks.each((i, el) => {
      const media = $(el).attr('media');
      if (media && media.includes('screen')) {
        analysis.hasMediaQueries = true;
      }
    });

    // Generate recommendations
    if (!analysis.isMobileFriendly) {
      analysis.recommendations.push('Добавьте мета-тег viewport: <meta name="viewport" content="width=device-width, initial-scale=1">');
      analysis.recommendations.push('Используйте CSS media queries для адаптивного дизайна');
      analysis.recommendations.push('Протестируйте сайт на мобильных устройствах');
    }

    if (!analysis.hasMediaQueries) {
      analysis.issues.push('Не найдены CSS media queries для адаптивности');
    }

    return analysis;
  } catch (error) {
    return {
      error: error.message,
      isMobileFriendly: false,
      status: 'ERROR',
      issues: ['Ошибка анализа мобильности: ' + error.message],
      recommendations: ['Проверьте доступность сайта']
    };
  }
}

// Extract mobile issues from Google API response
function extractMobileIssues(data) {
  const issues = [];
  
  if (data.mobileFriendlyIssues) {
    data.mobileFriendlyIssues.forEach(issue => {
      switch (issue.rule) {
        case 'MOBILE_FRIENDLY_RULE_UNSPECIFIED':
          issues.push('Неопределенная проблема мобильности');
          break;
        case 'USES_INCOMPATIBLE_PLUGINS':
          issues.push('Использует несовместимые плагины (Flash, Silverlight)');
          break;
        case 'CONFIGURE_VIEWPORT':
          issues.push('Требуется настройка viewport');
          break;
        case 'FIXED_WIDTH_VIEWPORT':
          issues.push('Фиксированная ширина viewport');
          break;
        case 'SIZE_CONTENT_TO_VIEWPORT':
          issues.push('Контент не помещается в viewport');
          break;
        case 'USE_LEGIBLE_FONT_SIZES':
          issues.push('Слишком мелкий шрифт для мобильных');
          break;
        case 'TAP_TARGETS_TOO_CLOSE':
          issues.push('Кликабельные элементы слишком близко друг к другу');
          break;
        default:
          issues.push('Проблема мобильности: ' + issue.rule);
      }
    });
  }
  
  return issues;
}

// Generate mobile recommendations
function generateMobileRecommendations(data) {
  const recommendations = [];
  
  if (data.mobileFriendliness === 'MOBILE_FRIENDLY') {
    recommendations.push('✅ Сайт корректно отображается на мобильных устройствах');
    recommendations.push('💡 Регулярно тестируйте на различных устройствах');
  } else {
    recommendations.push('📱 Оптимизируйте сайт для мобильных устройств');
    recommendations.push('🔧 Добавьте responsive дизайн с CSS media queries');
    recommendations.push('⚡ Улучшите скорость загрузки на мобильных');
  }
  
  return recommendations;
}

// Level 3 API: SSL Labs API for detailed SSL analysis
async function checkSSLLabs(url) {
  try {
    const domain = new URL(url).hostname;
    
    // SSL Labs API endpoint
    const apiUrl = `https://api.ssllabs.com/api/v3/analyze?host=${domain}&all=done&ignoreMismatch=on`;
    
    console.log(`🔍 Checking SSL Labs for: ${domain}`);
    
    const response = await fetch(apiUrl, {
      headers: {
        'User-Agent': 'WeKey Tools SEO Analyzer'
      },
      timeout: 30000
    });

    if (!response.ok) {
      throw new Error(`SSL Labs API error: ${response.status}`);
    }

    const data = await response.json();
    
    // If analysis is not ready, we might need to wait or return partial data
    if (data.status === 'IN_PROGRESS' || data.status === 'DNS') {
      return {
        status: 'IN_PROGRESS',
        grade: null,
        hasSSL: url.startsWith('https://'),
        message: 'Анализ SSL Labs в процессе',
        issues: [],
        recommendations: ['Повторите проверку через несколько минут']
      };
    }
    
    if (data.status === 'ERROR') {
      return {
        status: 'ERROR',
        grade: null,
        hasSSL: false,
        message: 'Ошибка SSL Labs анализа',
        issues: ['Не удалось проанализировать SSL сертификат'],
        recommendations: ['Проверьте доступность сайта по HTTPS']
      };
    }
    
    // Extract data from first endpoint (most common case)
    const endpoint = data.endpoints?.[0];
    if (!endpoint) {
      return {
        status: 'NO_ENDPOINTS',
        grade: null,
        hasSSL: false,
        message: 'Нет SSL endpoints',
        issues: ['SSL сертификат не найден'],
        recommendations: ['Настройте SSL сертификат для домена']
      };
    }
    
    const grade = endpoint.grade || null;
    const details = endpoint.details || {};
    
    // Analyze SSL issues
    const issues = [];
    const recommendations = [];
    
    // Grade-based analysis
    if (grade === 'A+') {
      recommendations.push('🏆 Отличная SSL конфигурация!');
    } else if (grade === 'A' || grade === 'A-') {
      recommendations.push('✅ Хорошая SSL конфигурация');
    } else if (grade === 'B') {
      issues.push('SSL конфигурация требует улучшений');
      recommendations.push('💡 Рекомендуется обновить SSL настройки');
    } else if (grade === 'C' || grade === 'D' || grade === 'F') {
      issues.push('Критические проблемы с SSL');
      recommendations.push('🔴 Необходимо срочно исправить SSL конфигурацию');
    }
    
    // Certificate analysis
    if (details.cert) {
      const cert = details.cert;
      const expiryDate = new Date(cert.notAfter);
      const now = new Date();
      const daysUntilExpiry = Math.ceil((expiryDate - now) / (1000 * 60 * 60 * 24));
      
      if (daysUntilExpiry < 30) {
        issues.push(`Сертификат истекает через ${daysUntilExpiry} дней`);
        recommendations.push('⚠️ Обновите SSL сертификат');
      } else if (daysUntilExpiry < 90) {
        recommendations.push(`ℹ️ Сертификат истекает через ${daysUntilExpiry} дней`);
      }
    }
    
    // Protocol support
    if (details.protocols) {
      const hasModernTLS = details.protocols.some(p => 
        p.version === '1.2' || p.version === '1.3'
      );
      if (!hasModernTLS) {
        issues.push('Не поддерживается современный TLS');
        recommendations.push('🔒 Включите поддержку TLS 1.2/1.3');
      }
    }
    
    return {
      status: 'READY',
      grade: grade,
      hasSSL: true,
      score: gradeToScore(grade),
      certificate: details.cert ? {
        issuer: details.cert.issuerLabel || 'Unknown',
        expiryDate: details.cert.notAfter,
        daysUntilExpiry: details.cert.notAfter ? 
          Math.ceil((new Date(details.cert.notAfter) - new Date()) / (1000 * 60 * 60 * 24)) : null
      } : null,
      protocols: details.protocols || [],
      issues: issues,
      recommendations: recommendations,
      rawData: {
        grade: grade,
        hasWarnings: endpoint.hasWarnings || false,
        isExceptional: endpoint.isExceptional || false
      }
    };
    
  } catch (error) {
    console.error('SSL Labs check error:', error);
    
    // Fallback to basic SSL check
    const hasSSL = url.startsWith('https://');
    
    return {
      status: 'FALLBACK',
      grade: null,
      hasSSL: hasSSL,
      error: error.message,
      issues: hasSSL ? [] : ['Сайт не использует HTTPS'],
      recommendations: hasSSL ? 
        ['SSL Labs анализ недоступен, но HTTPS работает'] : 
        ['Настройте HTTPS для сайта']
    };
  }
}

// Convert SSL Labs grade to numeric score
function gradeToScore(grade) {
  const gradeMap = {
    'A+': 100,
    'A': 90,
    'A-': 85,
    'B': 75,
    'C': 65,
    'D': 50,
    'F': 25
  };
  return gradeMap[grade] || 0;
}

// Level 3 API: W3C Markup Validator for HTML validation
async function checkW3CValidator(url) {
  try {
    console.log(`🔍 Checking W3C Validator for: ${url}`);
    
    // W3C Markup Validator API endpoint
    const apiUrl = `https://validator.w3.org/nu/?doc=${encodeURIComponent(url)}&out=json`;
    
    const response = await fetch(apiUrl, {
      headers: {
        'User-Agent': 'WeKey Tools SEO Analyzer'
      },
      timeout: 20000
    });

    if (!response.ok) {
      throw new Error(`W3C Validator API error: ${response.status}`);
    }

    const data = await response.json();
    
    // Analyze validation results
    const errors = data.messages?.filter(msg => msg.type === 'error') || [];
    const warnings = data.messages?.filter(msg => msg.type === 'info' || msg.type === 'warning') || [];
    
    const errorCount = errors.length;
    const warningCount = warnings.length;
    const isValid = errorCount === 0;
    
    // Generate issues and recommendations
    const issues = [];
    const recommendations = [];
    
    if (errorCount > 0) {
      issues.push(`Найдено ${errorCount} HTML ошибок`);
      if (errorCount <= 5) {
        recommendations.push('🔧 Исправьте найденные HTML ошибки для лучшего SEO');
      } else {
        recommendations.push('🚨 Критически важно исправить HTML ошибки');
      }
    } else {
      recommendations.push('✅ HTML код валиден!');
    }
    
    if (warningCount > 0) {
      recommendations.push(`ℹ️ Рассмотрите ${warningCount} предупреждений для улучшения кода`);
    }
    
    // Categorize common error types
    const errorCategories = {
      'syntax': 0,
      'accessibility': 0,
      'seo': 0,
      'structure': 0,
      'other': 0
    };
    
    errors.forEach(error => {
      const message = error.message?.toLowerCase() || '';
      if (message.includes('alt') || message.includes('aria') || message.includes('label')) {
        errorCategories.accessibility++;
      } else if (message.includes('meta') || message.includes('title') || message.includes('heading')) {
        errorCategories.seo++;
      } else if (message.includes('element') || message.includes('tag') || message.includes('attribute')) {
        errorCategories.syntax++;
      } else if (message.includes('section') || message.includes('nav') || message.includes('main')) {
        errorCategories.structure++;
      } else {
        errorCategories.other++;
      }
    });
    
    // Calculate score based on error severity
    let score = 100;
    score -= errorCount * 5; // -5 points per error
    score -= warningCount * 1; // -1 point per warning
    score = Math.max(score, 0);
    
    return {
      isValid: isValid,
      score: score,
      totalMessages: data.messages?.length || 0,
      errors: {
        count: errorCount,
        details: errors.slice(0, 10).map(err => ({
          line: err.lastLine || err.firstLine,
          column: err.lastColumn || err.firstColumn,
          message: err.message,
          extract: err.extract
        })),
        categories: errorCategories
      },
      warnings: {
        count: warningCount,
        details: warnings.slice(0, 5).map(warn => ({
          line: warn.lastLine || warn.firstLine,
          message: warn.message
        }))
      },
      issues: issues,
      recommendations: recommendations,
      summary: {
        status: isValid ? 'VALID' : 'INVALID',
        quality: score >= 90 ? 'EXCELLENT' : 
                score >= 75 ? 'GOOD' : 
                score >= 50 ? 'AVERAGE' : 'POOR'
      }
    };
    
  } catch (error) {
    console.error('W3C Validator check error:', error);
    
    return {
      isValid: false,
      score: 0,
      error: error.message,
      totalMessages: 0,
      errors: { count: 0, details: [], categories: {} },
      warnings: { count: 0, details: [] },
      issues: ['Не удалось выполнить валидацию HTML'],
      recommendations: ['Проверьте доступность сайта и повторите попытку'],
      summary: {
        status: 'ERROR',
        quality: 'UNKNOWN'
      }
    };
  }
}

// Level 3 API: SecurityHeaders.com for security headers analysis
async function checkSecurityHeaders(url) {
  try {
    const domain = new URL(url).hostname;
    
    console.log(`🛡️ Checking Security Headers for: ${domain}`);
    
    // SecurityHeaders.com API endpoint
    const apiUrl = `https://securityheaders.com/?q=${encodeURIComponent(url)}&hide=on&followRedirects=on`;
    
    // Also do direct header check as fallback
    let directHeaders = {};
    try {
      const response = await fetch(url, {
        method: 'HEAD',
        headers: {
          'User-Agent': 'WeKey Tools SEO Analyzer'
        },
        timeout: 10000
      });
      
      // Extract security-related headers
      const securityHeaderNames = [
        'strict-transport-security',
        'content-security-policy',
        'x-frame-options',
        'x-content-type-options',
        'x-xss-protection',
        'referrer-policy',
        'permissions-policy',
        'feature-policy'
      ];
      
      securityHeaderNames.forEach(headerName => {
        const headerValue = response.headers.get(headerName);
        if (headerValue) {
          directHeaders[headerName] = headerValue;
        }
      });
      
    } catch (error) {
      console.log('Direct headers check failed, using analysis only:', error.message);
    }
    
    // Analyze security headers
    const analysis = analyzeSecurityHeaders(directHeaders, url);
    
    return {
      url: url,
      grade: analysis.grade,
      score: analysis.score,
      headers: directHeaders,
      analysis: analysis.headerAnalysis,
      missing: analysis.missingHeaders,
      issues: analysis.issues,
      recommendations: analysis.recommendations,
      summary: {
        total: Object.keys(directHeaders).length,
        critical: analysis.criticalCount,
        missing: analysis.missingHeaders.length,
        status: analysis.grade ? 'ANALYZED' : 'PARTIAL'
      }
    };
    
  } catch (error) {
    console.error('Security Headers check error:', error);
    
    return {
      url: url,
      grade: null,
      score: 0,
      error: error.message,
      headers: {},
      analysis: {},
      missing: [],
      issues: ['Не удалось проверить заголовки безопасности'],
      recommendations: ['Проверьте доступность сайта и повторите попытку'],
      summary: {
        total: 0,
        critical: 0,
        missing: 0,
        status: 'ERROR'
      }
    };
  }
}

// Analyze security headers and calculate score
function analyzeSecurityHeaders(headers, url) {
  const analysis = {};
  const issues = [];
  const recommendations = [];
  const missingHeaders = [];
  let score = 0;
  let criticalCount = 0;
  
  // HSTS (HTTP Strict Transport Security)
  if (headers['strict-transport-security']) {
    analysis.hsts = {
      present: true,
      value: headers['strict-transport-security'],
      score: 20
    };
    score += 20;
    recommendations.push('✅ HSTS настроен правильно');
  } else if (url.startsWith('https://')) {
    analysis.hsts = { present: false, score: 0 };
    issues.push('Отсутствует заголовок HSTS');
    missingHeaders.push('Strict-Transport-Security');
    recommendations.push('🔒 Добавьте заголовок HSTS для принудительного HTTPS');
  }
  
  // CSP (Content Security Policy)
  if (headers['content-security-policy']) {
    analysis.csp = {
      present: true,
      value: headers['content-security-policy'],
      score: 25
    };
    score += 25;
    criticalCount++;
    recommendations.push('✅ Content Security Policy настроен');
  } else {
    analysis.csp = { present: false, score: 0 };
    issues.push('Отсутствует Content Security Policy');
    missingHeaders.push('Content-Security-Policy');
    recommendations.push('🛡️ Настройте CSP для защиты от XSS атак');
  }
  
  // X-Frame-Options
  if (headers['x-frame-options']) {
    analysis.frameOptions = {
      present: true,
      value: headers['x-frame-options'],
      score: 15
    };
    score += 15;
    recommendations.push('✅ X-Frame-Options защищает от clickjacking');
  } else {
    analysis.frameOptions = { present: false, score: 0 };
    issues.push('Отсутствует защита от clickjacking');
    missingHeaders.push('X-Frame-Options');
    recommendations.push('🔒 Добавьте X-Frame-Options: DENY или SAMEORIGIN');
  }
  
  // X-Content-Type-Options
  if (headers['x-content-type-options']) {
    analysis.contentTypeOptions = {
      present: true,
      value: headers['x-content-type-options'],
      score: 10
    };
    score += 10;
    recommendations.push('✅ X-Content-Type-Options предотвращает MIME sniffing');
  } else {
    analysis.contentTypeOptions = { present: false, score: 0 };
    issues.push('Отсутствует защита от MIME sniffing');
    missingHeaders.push('X-Content-Type-Options');
    recommendations.push('🔒 Добавьте X-Content-Type-Options: nosniff');
  }
  
  // Referrer Policy
  if (headers['referrer-policy']) {
    analysis.referrerPolicy = {
      present: true,
      value: headers['referrer-policy'],
      score: 10
    };
    score += 10;
    recommendations.push('✅ Referrer Policy настроен');
  } else {
    analysis.referrerPolicy = { present: false, score: 0 };
    missingHeaders.push('Referrer-Policy');
    recommendations.push('ℹ️ Рассмотрите настройку Referrer-Policy');
  }
  
  // Permissions Policy (Feature Policy)
  if (headers['permissions-policy'] || headers['feature-policy']) {
    analysis.permissionsPolicy = {
      present: true,
      value: headers['permissions-policy'] || headers['feature-policy'],
      score: 10
    };
    score += 10;
    recommendations.push('✅ Permissions Policy настроен');
  } else {
    analysis.permissionsPolicy = { present: false, score: 0 };
    missingHeaders.push('Permissions-Policy');
    recommendations.push('ℹ️ Настройте Permissions Policy для контроля API');
  }
  
  // X-XSS-Protection (deprecated but still relevant)
  if (headers['x-xss-protection']) {
    analysis.xssProtection = {
      present: true,
      value: headers['x-xss-protection'],
      score: 5
    };
    score += 5;
  } else {
    missingHeaders.push('X-XSS-Protection');
  }
  
  // Calculate grade based on score
  let grade = 'F';
  if (score >= 90) grade = 'A+';
  else if (score >= 80) grade = 'A';
  else if (score >= 70) grade = 'B';
  else if (score >= 60) grade = 'C';
  else if (score >= 40) grade = 'D';
  
  // Critical security issues
  if (criticalCount === 0) {
    issues.push('Критически важные заголовки безопасности отсутствуют');
    recommendations.push('🚨 Настройте базовые заголовки безопасности');
  }
  
  return {
    grade,
    score,
    headerAnalysis: analysis,
    missingHeaders,
    issues,
    recommendations,
    criticalCount
  };
}

// Функция для определения навигационных ссылок
function isNavigationLink(parentClass, linkClass, linkText) {
  const navKeywords = [
    'nav', 'menu', 'header', 'navigation', 'main-menu', 'primary-menu',
    'top-menu', 'sidebar', 'footer-menu', 'breadcrumb'
  ];
  
  const textKeywords = [
    'главная', 'о нас', 'услуги', 'продукт', 'контакты', 'блог', 'новости',
    'каталог', 'портфолио', 'проекты', 'команда', 'цены', 'отзывы',
    'home', 'about', 'services', 'products', 'contact', 'blog', 'news',
    'catalog', 'portfolio', 'projects', 'team', 'pricing', 'reviews'
  ];
  
  const classesToCheck = (parentClass + ' ' + linkClass).toLowerCase();
  const textToCheck = linkText.toLowerCase();
  
  // Проверяем классы родителя и самой ссылки
  if (navKeywords.some(keyword => classesToCheck.includes(keyword))) {
    return true;
  }
  
  // Проверяем текст ссылки
  if (textKeywords.some(keyword => textToCheck.includes(keyword))) {
    return true;
  }
  
  return false;
}

// Анализ потенциала для Google Sitelinks
function analyzeSitelinksPotential($, internalLinks, url) {
  const analysis = {
    score: 0,
    maxScore: 100,
    status: 'poor', // poor, good, excellent
    issues: [],
    recommendations: [],
    navigation: {
      hasMainMenu: false,
      menuItemsCount: 0,
      menuStructure: 'none' // none, simple, complex
    },
    urlStructure: {
      hasCleanUrls: true,
      hasLogicalHierarchy: false,
      avgUrlDepth: 0
    },
    linkingProfile: {
      internalLinksCount: internalLinks.length,
      navigationLinksCount: 0,
      topSections: []
    }
  };

  try {
    // 1. Анализ навигационной структуры
    const navElements = $('nav, .nav, .menu, .navigation, header .menu, .main-menu');
    if (navElements.length > 0) {
      analysis.navigation.hasMainMenu = true;
      analysis.score += 25;
      
      // Подсчет элементов меню
      const menuLinks = navElements.find('a').length;
      analysis.navigation.menuItemsCount = menuLinks;
      
      if (menuLinks >= 3 && menuLinks <= 8) {
        analysis.navigation.menuStructure = 'optimal';
        analysis.score += 20;
      } else if (menuLinks > 0) {
        analysis.navigation.menuStructure = 'simple';
        analysis.score += 10;
        if (menuLinks > 8) {
          analysis.issues.push('Слишком много пунктов в главном меню (рекомендуется 3-8)');
        }
      }
    } else {
      analysis.issues.push('Основное навигационное меню не обнаружено');
      analysis.recommendations.push('Добавьте четкое навигационное меню с ключевыми разделами');
    }

    // 2. Анализ структуры URL
    const urlDepths = [];
    const sections = {};
    
    internalLinks.forEach(link => {
      try {
        if (typeof link === 'object' && link.href) {
          const linkUrl = new URL(link.href, url);
          const pathname = linkUrl.pathname;
          const depth = pathname.split('/').filter(part => part.length > 0).length;
          urlDepths.push(depth);
          
          // Определяем разделы
          const firstSegment = pathname.split('/')[1];
          if (firstSegment && firstSegment !== '') {
            sections[firstSegment] = (sections[firstSegment] || 0) + 1;
          }
          
          // Подсчет навигационных ссылок
          if (link.isNavigation) {
            analysis.linkingProfile.navigationLinksCount++;
          }
        }
      } catch (e) {
        // Invalid URL
      }
    });

    // Средняя глубина URL
    if (urlDepths.length > 0) {
      analysis.urlStructure.avgUrlDepth = Math.round((urlDepths.reduce((a, b) => a + b, 0) / urlDepths.length) * 100) / 100;
      
      if (analysis.urlStructure.avgUrlDepth <= 3) {
        analysis.score += 15;
        analysis.urlStructure.hasLogicalHierarchy = true;
      } else {
        analysis.issues.push(`Средняя глубина URL слишком большая (${analysis.urlStructure.avgUrlDepth})`);
        analysis.recommendations.push('Упростите структуру URL, сделайте её более плоской');
      }
    }

    // 3. Популярные разделы (потенциальные sitelinks)
    const sortedSections = Object.entries(sections)
      .sort(([,a], [,b]) => b - a)
      .slice(0, 6)
      .map(([section, count]) => ({
        name: section,
        linkCount: count,
        urlExample: `/${section}`
      }));
    
    analysis.linkingProfile.topSections = sortedSections;

    if (sortedSections.length >= 3) {
      analysis.score += 20;
    } else {
      analysis.issues.push('Недостаточно четко выделенных разделов сайта');
      analysis.recommendations.push('Создайте логические разделы сайта с четкой навигацией');
    }

    // 4. Качество внутренней перелинковки
    const navigationRatio = analysis.linkingProfile.navigationLinksCount / Math.max(analysis.linkingProfile.internalLinksCount, 1);
    
    if (navigationRatio >= 0.1) {
      analysis.score += 10;
    } else {
      analysis.issues.push('Низкое качество внутренней перелинковки');
      analysis.recommendations.push('Улучшите внутреннюю перелинковку между разделами');
    }

    // 5. Дополнительные факторы
    const breadcrumbs = $('.breadcrumb, .breadcrumbs, nav ol').length;
    if (breadcrumbs > 0) {
      analysis.score += 10;
      analysis.recommendations.push('✅ Хлебные крошки помогают Google понять структуру сайта');
    } else {
      analysis.recommendations.push('Добавьте хлебные крошки для улучшения навигации');
    }

    // Определение итогового статуса
    if (analysis.score >= 80) {
      analysis.status = 'excellent';
    } else if (analysis.score >= 50) {
      analysis.status = 'good';
    } else {
      analysis.status = 'poor';
    }

    // Общие рекомендации
    if (analysis.status === 'excellent') {
      analysis.recommendations.push('🏆 Отличный потенциал для получения sitelinks от Google!');
    } else if (analysis.status === 'good') {
      analysis.recommendations.push('👍 Хороший потенциал, работайте над улучшениями');
    } else {
      analysis.recommendations.push('📈 Необходимо значительно улучшить структуру и навигацию');
    }

    return analysis;

  } catch (error) {
    console.error('Sitelinks analysis error:', error);
    return {
      score: 0,
      maxScore: 100,
      status: 'error',
      issues: ['Ошибка анализа потенциала sitelinks'],
      recommendations: ['Проверьте структуру сайта и навигацию'],
      navigation: { hasMainMenu: false, menuItemsCount: 0, menuStructure: 'none' },
      urlStructure: { hasCleanUrls: false, hasLogicalHierarchy: false, avgUrlDepth: 0 },
      linkingProfile: { internalLinksCount: 0, navigationLinksCount: 0, topSections: [] }
    };
  }
}

// Детальный анализ ссылочного профиля
function analyzeLinkProfile($, internalLinks, externalLinks, url) {
  const analysis = {
    score: 0,
    maxScore: 100,
    issues: [],
    recommendations: [],
    internal: {
      total: internalLinks.length,
      unique: [],
      anchorTexts: {},
      distribution: {},
      quality: 'poor' // poor, fair, good, excellent
    },
    external: {
      total: externalLinks.length,
      domains: {},
      nofollow: 0,
      dofollow: 0,
      social: [],
      quality: 'poor'
    },
    ratios: {
      internalToExternal: 0,
      nofollowRatio: 0,
      anchorDiversity: 0
    }
  };

  try {
    // 1. Анализ внутренних ссылок
    const uniqueInternalUrls = new Set();
    const anchorTexts = {};
    
    internalLinks.forEach(link => {
      if (typeof link === 'object' && link.href) {
        // Уникальные URL
        uniqueInternalUrls.add(link.href);
        
        // Анализ anchor текстов
        const anchor = link.text?.trim() || '';
        if (anchor) {
          anchorTexts[anchor] = (anchorTexts[anchor] || 0) + 1;
        }
      }
    });
    
    analysis.internal.unique = Array.from(uniqueInternalUrls);
    analysis.internal.anchorTexts = anchorTexts;
    
    // Оценка качества внутренних ссылок
    const uniqueCount = uniqueInternalUrls.size;
    const totalInternal = internalLinks.length;
    
    if (uniqueCount >= 10 && totalInternal >= 20) {
      analysis.internal.quality = 'excellent';
      analysis.score += 25;
    } else if (uniqueCount >= 5 && totalInternal >= 10) {
      analysis.internal.quality = 'good';
      analysis.score += 20;
    } else if (uniqueCount >= 3 && totalInternal >= 5) {
      analysis.internal.quality = 'fair';
      analysis.score += 10;
    } else {
      analysis.issues.push('Недостаточно внутренних ссылок для хорошей перелинковки');
      analysis.recommendations.push('Добавьте больше внутренних ссылок между страницами');
    }

    // 2. Анализ внешних ссылок
    const externalDomains = {};
    const socialDomains = ['facebook.com', 'instagram.com', 'twitter.com', 'linkedin.com', 'youtube.com', 'tiktok.com', 'telegram.org'];
    const socialLinksSet = new Set(); // Используем Set для уникальности
    let nofollowCount = 0;
    
    // Анализ nofollow/dofollow ссылок
    $('a[href]').each((i, el) => {
      const href = $(el).attr('href');
      const rel = $(el).attr('rel') || '';
      
      if (href && (href.startsWith('http://') || href.startsWith('https://'))) {
        try {
          const linkUrl = new URL(href);
          const currentUrl = new URL(url);
          
          if (linkUrl.hostname !== currentUrl.hostname) {
            // Внешняя ссылка
            const domain = linkUrl.hostname.replace('www.', '');
            externalDomains[domain] = (externalDomains[domain] || 0) + 1;
            
            if (rel.includes('nofollow')) {
              nofollowCount++;
            }
            
            // Проверка на социальные сети - добавляем в Set для уникальности
            if (socialDomains.some(social => domain.includes(social))) {
              socialLinksSet.add(domain);
            }
          }
        } catch (e) {
          // Invalid URL
        }
      }
    });
    
    analysis.external.domains = externalDomains;
    analysis.external.nofollow = nofollowCount;
    analysis.external.dofollow = analysis.external.total - nofollowCount;
    analysis.external.social = Array.from(socialLinksSet); // Преобразуем Set в массив уникальных значений
    
    // Оценка качества внешних ссылок
    const domainCount = Object.keys(externalDomains).length;
    
    if (domainCount >= 3 && analysis.external.total <= 10) {
      analysis.external.quality = 'excellent';
      analysis.score += 25;
    } else if (domainCount >= 2 && analysis.external.total <= 15) {
      analysis.external.quality = 'good';
      analysis.score += 20;
    } else if (analysis.external.total > 20) {
      analysis.external.quality = 'poor';
      analysis.issues.push('Слишком много внешних ссылок может разбавлять link juice');
      analysis.recommendations.push('Сократите количество внешних ссылок или добавьте nofollow');
    } else {
      analysis.external.quality = 'fair';
      analysis.score += 10;
    }

    // 3. Расчет соотношений
    analysis.ratios.internalToExternal = analysis.external.total > 0 ? 
      Math.round((analysis.internal.total / analysis.external.total) * 100) / 100 : 
      analysis.internal.total;
      
    analysis.ratios.nofollowRatio = analysis.external.total > 0 ? 
      Math.round((nofollowCount / analysis.external.total) * 100) : 0;
      
    analysis.ratios.anchorDiversity = Object.keys(anchorTexts).length;

    // 4. Оценка соотношений
    if (analysis.ratios.internalToExternal >= 3) {
      analysis.score += 15;
      analysis.recommendations.push('✅ Отличное соотношение внутренних к внешним ссылкам');
    } else if (analysis.ratios.internalToExternal >= 1.5) {
      analysis.score += 10;
    } else {
      analysis.issues.push('Низкое соотношение внутренних к внешним ссылкам');
      analysis.recommendations.push('Увеличьте количество внутренних ссылок');
    }

    // 5. Анализ разнообразия anchor текстов
    if (analysis.ratios.anchorDiversity >= 5) {
      analysis.score += 10;
      analysis.recommendations.push('👍 Хорошее разнообразие anchor текстов');
    } else {
      analysis.issues.push('Низкое разнообразие anchor текстов');
      analysis.recommendations.push('Варьируйте тексты ссылок для лучшего SEO');
    }

    // 6. Общие рекомендации
    if (analysis.internal.total < 5) {
      analysis.recommendations.push('🔗 Добавьте больше внутренних ссылок (рекомендуется минимум 10-15)');
    }
    
    if (analysis.ratios.nofollowRatio < 30 && analysis.external.total > 5) {
      analysis.recommendations.push('🔒 Рассмотрите добавление nofollow к некоторым внешним ссылкам');
    }
    
    if (analysis.external.social.length === 0) {
      analysis.recommendations.push('📱 Добавьте ссылки на социальные сети для лучшего engagement');
    }

    return analysis;

  } catch (error) {
    console.error('Link profile analysis error:', error);
    return {
      score: 0,
      maxScore: 100,
      issues: ['Ошибка анализа ссылочного профиля'],
      recommendations: ['Проверьте доступность страницы'],
      internal: { total: 0, unique: [], anchorTexts: {}, distribution: {}, quality: 'poor' },
      external: { total: 0, domains: {}, nofollow: 0, dofollow: 0, social: [], quality: 'poor' },
      ratios: { internalToExternal: 0, nofollowRatio: 0, anchorDiversity: 0 }
    };
  }
}

module.exports = router;