const express = require('express');
const router = express.Router();
const cheerio = require('cheerio');
const fetch = require('node-fetch');

router.post('/seo-audit', async (req, res) => {
  try {
    const { url } = req.body;
    if (!url) {
      return res.status(400).json({ success: false, error: 'URL is required' });
    }

    let fullUrl = url;
    if (!url.startsWith('http://') && !url.startsWith('https://')) {
      fullUrl = 'https://' + url;
    }

    const response = await fetch(fullUrl, {
      headers: { 'User-Agent': 'Mozilla/5.0' },
      timeout: 15000
    });

    if (!response.ok) {
      throw new Error('HTTP ' + response.status);
    }

    const html = await response.text();
    const $ = cheerio.load(html);

    const seoResult = analyzeSEO($, html, fullUrl);

    res.json({ success: true, results: seoResult });

  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

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

  // 6. Структурированные данные (JSON-LD)
  const jsonLdScripts = $('script[type="application/ld+json"]');
  seo.structuredData = {
    count: jsonLdScripts.length,
    types: []
  };
  
  jsonLdScripts.each((i, el) => {
    try {
      const data = JSON.parse($(el).html());
      if (data['@type']) {
        seo.structuredData.types.push(data['@type']);
      }
    } catch (e) {
      // Ignore invalid JSON-LD
    }
  });

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
  
  links.each((i, el) => {
    const href = $(el).attr('href');
    if (href) {
      if (href.startsWith('http://') || href.startsWith('https://')) {
        try {
          const linkUrl = new URL(href);
          const currentUrl = new URL(url);
          if (linkUrl.hostname === currentUrl.hostname) {
            internalLinks.push(href);
          } else {
            externalLinks.push(href);
          }
        } catch (e) {
          // Invalid URL
        }
      } else if (href.startsWith('/') || !href.includes('://')) {
        internalLinks.push(href);
      }
    }
  });

  seo.links = {
    total: links.length,
    internal: internalLinks.length,
    external: externalLinks.length,
    nofollow: $('a[rel*="nofollow"]').length
  };

  // 15. Продвинутый анализ производительности и контента
  const textContent = $('body').text().replace(/\s+/g, ' ').trim();
  const wordCount = textContent.split(' ').filter(word => word.length > 0).length;
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

  // 16. Анализ ключевых слов и плотности (базовый)
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
      hasMinifiedCSS: $('link[rel="stylesheet"]').filter((i, el) => $(el).attr('href').includes('.min.')).length > 0
    }
  };

  return seo;
}

module.exports = router;