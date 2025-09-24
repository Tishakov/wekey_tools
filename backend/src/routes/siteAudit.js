const express = require('express');
const router = express.Router();
const cheerio = require('cheerio');
const fetch = require('node-fetch');

router.post('/site-audit', async (req, res) => {
  try {
    const { url } = req.body;
    if (!url) {
      return res.status(400).json({ success: false, error: 'URL is required' });
    }

    let fullUrl = url;
    if (!url.startsWith('http://') && !url.startsWith('https://')) {
      fullUrl = 'https://' + url;
    }

    const startTime = Date.now();
    const response = await fetch(fullUrl, {
      headers: { 
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
      },
      timeout: 15000
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status} - ${response.statusText}`);
    }

    const html = await response.text();
    const loadTime = Date.now() - startTime;
    const $ = cheerio.load(html);

    // Запускаем все анализы
    const auditResult = {
      url: fullUrl,
      basic: analyzeBasic($, html),
      technologies: analyzeTechnologies($, html, response),
      analytics: analyzeAnalytics($, html),
      visual: analyzeVisual($),
      hosting: analyzeHosting($, html, response),
      social: analyzeSocial($),
      contact: analyzeContact($, html, fullUrl),
      performance: analyzePerformance(html, loadTime)
    };

    res.json({ success: true, results: auditResult });

  } catch (error) {
    console.error('Site audit error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// Базовый анализ сайта
function analyzeBasic($, html) {
  const basic = {
    title: $('title').text() || 'No title found',
    description: $('meta[name="description"]').attr('content') || 'No description found',
    keywords: $('meta[name="keywords"]').attr('content') || 'No keywords found',
    lang: $('html').attr('lang') || 'Not specified',
    charset: $('meta[charset]').attr('charset') || 
             $('meta[http-equiv="Content-Type"]').attr('content')?.match(/charset=([^;]+)/)?.[1] || 
             'Not specified',
    viewport: $('meta[name="viewport"]').attr('content') || 'Not specified',
    favicon: $('link[rel*="icon"]').attr('href') || 'Not found',
    generator: $('meta[name="generator"]').attr('content') || 'Not specified',
    robots: $('meta[name="robots"]').attr('content') || 'Not specified',
    canonical: $('link[rel="canonical"]').attr('href') || 'Not specified',
    
    // Open Graph
    ogTitle: $('meta[property="og:title"]').attr('content') || 'Not specified',
    ogDescription: $('meta[property="og:description"]').attr('content') || 'Not specified',
    ogImage: $('meta[property="og:image"]').attr('content') || 'Not specified',
    ogType: $('meta[property="og:type"]').attr('content') || 'Not specified',
    ogUrl: $('meta[property="og:url"]').attr('content') || 'Not specified',
    
    // Twitter Card
    twitterCard: $('meta[name="twitter:card"]').attr('content') || 'Not specified',
    twitterTitle: $('meta[name="twitter:title"]').attr('content') || 'Not specified',
    twitterDescription: $('meta[name="twitter:description"]').attr('content') || 'Not specified',
    twitterImage: $('meta[name="twitter:image"]').attr('content') || 'Not specified',
    
    // Basic structure
    h1Count: $('h1').length,
    h2Count: $('h2').length,
    h3Count: $('h3').length,
    linksCount: $('a').length,
    internalLinksCount: $('a[href^="/"], a[href*="' + getDomainFromHtml(html) + '"]').length,
    externalLinksCount: $('a[href^="http"]:not([href*="' + getDomainFromHtml(html) + '"])').length,
    imagesCount: $('img').length,
    formsCount: $('form').length
  };
  
  return basic;
}

// Вспомогательная функция для извлечения домена
function getDomainFromHtml(html) {
  try {
    const canonicalMatch = html.match(/<link[^>]+rel=["']canonical["'][^>]*href=["']([^"']+)["']/i);
    if (canonicalMatch) {
      const url = new URL(canonicalMatch[1]);
      return url.hostname;
    }
    
    const ogUrlMatch = html.match(/<meta[^>]+property=["']og:url["'][^>]*content=["']([^"']+)["']/i);
    if (ogUrlMatch) {
      const url = new URL(ogUrlMatch[1]);
      return url.hostname;
    }
  } catch (e) {
    // Ignore parsing errors
  }
  return '';
}

// Расширенный анализ технологий (как WhatCMS)
function analyzeTechnologies($, html, response) {
  const technologies = {
    cms: null,
    cmsVersion: null,
    framework: [],
    language: [],
    cdn: [],
    webServer: null,
    database: [],
    analytics: [],
    security: [],
    hosting: null,
    cssFramework: [],
    cssPreprocessor: [],
    staticGenerator: [],
    buildTool: [],
    microFramework: [],
    ecommerce: []
  };

  const htmlLower = html.toLowerCase();
  const headers = {};
  
  // Собираем заголовки ответа
  if (response && response.headers) {
    response.headers.forEach((value, key) => {
      headers[key.toLowerCase()] = value.toLowerCase();
    });
  }

  // === CMS DETECTION ===
  
  // WordPress (самый популярный)
  if (htmlLower.includes('wp-content') || 
      htmlLower.includes('wp-includes') || 
      htmlLower.includes('/wp-admin/') ||
      htmlLower.includes('wordpress') ||
      $('meta[name="generator"]').attr('content')?.toLowerCase().includes('wordpress')) {
    
    technologies.cms = 'WordPress';
    
    // Определяем версию WordPress
    const wpVersionMeta = $('meta[name="generator"]').attr('content');
    if (wpVersionMeta) {
      const versionMatch = wpVersionMeta.match(/wordpress\s*([\d.]+)/i);
      if (versionMatch) {
        technologies.cmsVersion = versionMatch[1];
      }
    }
    
    // Дополнительная проверка в комментариях
    const versionComment = html.match(/<!--\s*wp\s*version\s*:\s*([\d.]+)\s*-->/i);
    if (versionComment) {
      technologies.cmsVersion = versionComment[1];
    }
  }
  
  // Joomla
  else if (htmlLower.includes('joomla') ||
           htmlLower.includes('/media/jui/') ||
           htmlLower.includes('com_content') ||
           htmlLower.includes('mod_') ||
           $('meta[name="generator"]').attr('content')?.toLowerCase().includes('joomla')) {
    
    technologies.cms = 'Joomla';
    
    const joomlaVersionMeta = $('meta[name="generator"]').attr('content');
    if (joomlaVersionMeta) {
      const versionMatch = joomlaVersionMeta.match(/joomla!\s*([\d.]+)/i);
      if (versionMatch) {
        technologies.cmsVersion = versionMatch[1];
      }
    }
  }
  
  // Drupal
  else if (htmlLower.includes('drupal') ||
           htmlLower.includes('/sites/all/') ||
           htmlLower.includes('/sites/default/') ||
           htmlLower.includes('drupal.js') ||
           $('meta[name="generator"]').attr('content')?.toLowerCase().includes('drupal')) {
    
    technologies.cms = 'Drupal';
    
    const drupalVersionMeta = $('meta[name="generator"]').attr('content');
    if (drupalVersionMeta) {
      const versionMatch = drupalVersionMeta.match(/drupal\s*([\d.]+)/i);
      if (versionMatch) {
        technologies.cmsVersion = versionMatch[1];
      }
    }
  }
  
  // Shopify
  else if (htmlLower.includes('shopify') ||
           htmlLower.includes('cdn.shopify.com') ||
           htmlLower.includes('shopify_stats') ||
           htmlLower.includes('shopify-analytics')) {
    technologies.cms = 'Shopify';
  }
  
  // WooCommerce (WordPress plugin, но часто основная платформа)
  if (htmlLower.includes('woocommerce') || 
      htmlLower.includes('wc-') ||
      htmlLower.includes('woocommerce-js')) {
    if (technologies.cms === 'WordPress') {
      technologies.cms = 'WooCommerce (WordPress)';
    } else {
      technologies.cms = 'WooCommerce';
    }
  }
  
  // 1C-Bitrix
  else if (htmlLower.includes('bitrix') ||
           htmlLower.includes('bx_') ||
           htmlLower.includes('/bitrix/')) {
    technologies.cms = '1C-Bitrix';
  }
  
  // Tilda
  else if (htmlLower.includes('tilda') ||
           htmlLower.includes('tildacdn.com') ||
           htmlLower.includes('tilda.cc')) {
    technologies.cms = 'Tilda';
  }
  
  // Wix
  else if (htmlLower.includes('wix.com') ||
           htmlLower.includes('_wixCIDX') ||
           htmlLower.includes('wix-code') ||
           headers['x-wix-request-id']) {
    technologies.cms = 'Wix';
  }
  
  // Squarespace
  else if (htmlLower.includes('squarespace') ||
           htmlLower.includes('squarespace.com') ||
           htmlLower.includes('sqsp.com')) {
    technologies.cms = 'Squarespace';
  }
  
  // Magento
  else if (htmlLower.includes('magento') ||
           htmlLower.includes('mage/cookies') ||
           htmlLower.includes('/skin/frontend/')) {
    technologies.cms = 'Magento';
  }
  
  // PrestaShop
  else if (htmlLower.includes('prestashop') ||
           htmlLower.includes('ps_version')) {
    technologies.cms = 'PrestaShop';
  }
  
  // OpenCart
  else if (htmlLower.includes('opencart') ||
           htmlLower.includes('catalog/view/theme/')) {
    technologies.cms = 'OpenCart';
  }
  
  // Strapi
  else if (htmlLower.includes('strapi') ||
           headers['x-powered-by']?.includes('strapi')) {
    technologies.cms = 'Strapi';
  }
  
  // Ghost
  else if (htmlLower.includes('ghost') ||
           htmlLower.includes('ghost.org') ||
           headers['x-powered-by']?.includes('ghost')) {
    technologies.cms = 'Ghost';
  }
  
  // Webflow
  else if (htmlLower.includes('webflow') ||
           htmlLower.includes('webflow.com') ||
           htmlLower.includes('webflow.css')) {
    technologies.cms = 'Webflow';
  }
  
  // Contentful
  else if (htmlLower.includes('contentful') ||
           htmlLower.includes('ctfassets.net')) {
    technologies.cms = 'Contentful';
  }
  
  // Sanity
  else if (htmlLower.includes('sanity') ||
           htmlLower.includes('sanity.io') ||
           htmlLower.includes('sanitycdn.com')) {
    technologies.cms = 'Sanity';
  }
  
  // Prismic
  else if (htmlLower.includes('prismic') ||
           htmlLower.includes('prismic.io') ||
           htmlLower.includes('prismicio.com')) {
    technologies.cms = 'Prismic';
  }
  
  // Umbraco
  else if (htmlLower.includes('umbraco') ||
           htmlLower.includes('/umbraco/')) {
    technologies.cms = 'Umbraco';
  }
  
  // TYPO3
  else if (htmlLower.includes('typo3') ||
           htmlLower.includes('typo3temp') ||
           htmlLower.includes('typo3conf')) {
    technologies.cms = 'TYPO3';
  }
  
  // Craft CMS
  else if (htmlLower.includes('craftcms') ||
           htmlLower.includes('craft cms') ||
           htmlLower.includes('cpresources')) {
    technologies.cms = 'Craft CMS';
  }

  // === E-COMMERCE PLATFORMS ===
  
  // BigCommerce
  if (htmlLower.includes('bigcommerce') ||
      htmlLower.includes('bigcommerce.com') ||
      headers['x-bc-storefront-req-id']) {
    technologies.ecommerce.push('BigCommerce');
  }
  
  // Zen Cart
  if (htmlLower.includes('zen-cart') ||
      htmlLower.includes('zencart') ||
      htmlLower.includes('zen_cart')) {
    technologies.ecommerce.push('Zen Cart');
  }
  
  // osCommerce
  if (htmlLower.includes('oscommerce') ||
      htmlLower.includes('osc_')) {
    technologies.ecommerce.push('osCommerce');
  }
  
  // CS-Cart
  if (htmlLower.includes('cs-cart') ||
      htmlLower.includes('cscart')) {
    technologies.ecommerce.push('CS-Cart');
  }

  // === FRAMEWORKS DETECTION ===
  
  // React
  if (htmlLower.includes('react') ||
      htmlLower.includes('_react') ||
      htmlLower.includes('__react') ||
      htmlLower.includes('react-dom') ||
      $('script[src*="react"]').length > 0) {
    technologies.framework.push('React');
  }
  
  // Vue.js
  if (htmlLower.includes('vue.js') ||
      htmlLower.includes('vue.min.js') ||
      htmlLower.includes('__vue__') ||
      htmlLower.includes('v-') ||
      $('script[src*="vue"]').length > 0) {
    technologies.framework.push('Vue.js');
  }
  
  // Angular
  if (htmlLower.includes('angular') ||
      htmlLower.includes('ng-') ||
      htmlLower.includes('ng2-') ||
      $('script[src*="angular"]').length > 0) {
    technologies.framework.push('Angular');
  }
  
  // jQuery
  if (htmlLower.includes('jquery') ||
      htmlLower.includes('jquery.min.js') ||
      $('script[src*="jquery"]').length > 0) {
    technologies.framework.push('jQuery');
  }
  
  // Laravel (PHP)
  if (htmlLower.includes('laravel') ||
      htmlLower.includes('laravel_session') ||
      htmlLower.includes('laravel_token')) {
    technologies.framework.push('Laravel');
  }
  
  // Next.js
  if (htmlLower.includes('next.js') ||
      htmlLower.includes('__next') ||
      htmlLower.includes('_next/static')) {
    technologies.framework.push('Next.js');
  }
  
  // Nuxt.js
  if (htmlLower.includes('nuxt') ||
      htmlLower.includes('__nuxt') ||
      htmlLower.includes('_nuxt/')) {
    technologies.framework.push('Nuxt.js');
  }
  
  // Svelte/SvelteKit
  if (htmlLower.includes('svelte') ||
      htmlLower.includes('sveltekit') ||
      $('script[src*="svelte"]').length > 0) {
    technologies.framework.push('Svelte');
  }
  
  // Alpine.js
  if (htmlLower.includes('alpine.js') ||
      htmlLower.includes('alpinejs') ||
      htmlLower.includes('x-data') ||
      $('script[src*="alpine"]').length > 0) {
    technologies.framework.push('Alpine.js');
  }
  
  // Stimulus
  if (htmlLower.includes('stimulus') ||
      htmlLower.includes('data-controller') ||
      $('script[src*="stimulus"]').length > 0) {
    technologies.framework.push('Stimulus');
  }
  
  // Lit
  if (htmlLower.includes('lit-element') ||
      htmlLower.includes('lit-html') ||
      htmlLower.includes('@lit/') ||
      $('script[src*="lit"]').length > 0) {
    technologies.framework.push('Lit');
  }
  
  // Ember.js
  if (htmlLower.includes('ember') ||
      htmlLower.includes('ember.js') ||
      $('script[src*="ember"]').length > 0) {
    technologies.framework.push('Ember.js');
  }
  
  // Backbone.js
  if (htmlLower.includes('backbone') ||
      htmlLower.includes('backbone.js') ||
      $('script[src*="backbone"]').length > 0) {
    technologies.framework.push('Backbone.js');
  }

  // === CSS FRAMEWORKS ===
  
  // Tailwind CSS (переносим Bootstrap сюда тоже)
  if (htmlLower.includes('tailwind') ||
      htmlLower.includes('tailwindcss') ||
      $('link[href*="tailwind"]').length > 0) {
    technologies.cssFramework.push('Tailwind CSS');
  }
  
  // Bootstrap (переносим из framework)
  if (htmlLower.includes('bootstrap') ||
      htmlLower.includes('bootstrap.css') ||
      htmlLower.includes('bootstrap.min.css') ||
      $('link[href*="bootstrap"]').length > 0) {
    technologies.cssFramework.push('Bootstrap');
  }
  
  // Bulma
  if (htmlLower.includes('bulma') ||
      htmlLower.includes('bulma.css') ||
      $('link[href*="bulma"]').length > 0) {
    technologies.cssFramework.push('Bulma');
  }
  
  // Foundation
  if (htmlLower.includes('foundation') ||
      htmlLower.includes('foundation.css') ||
      $('link[href*="foundation"]').length > 0) {
    technologies.cssFramework.push('Foundation');
  }
  
  // Materialize
  if (htmlLower.includes('materialize') ||
      htmlLower.includes('materialize.css') ||
      $('link[href*="materialize"]').length > 0) {
    technologies.cssFramework.push('Materialize');
  }

  // === CSS PREPROCESSORS ===
  
  // Sass/SCSS
  if (htmlLower.includes('.scss') ||
      htmlLower.includes('sass') ||
      $('link[href*=".scss"], link[href*="sass"]').length > 0) {
    technologies.cssPreprocessor.push('Sass/SCSS');
  }
  
  // Less
  if (htmlLower.includes('.less') ||
      htmlLower.includes('less.js') ||
      $('link[href*=".less"], script[src*="less"]').length > 0) {
    technologies.cssPreprocessor.push('Less');
  }
  
  // Stylus
  if (htmlLower.includes('.styl') ||
      htmlLower.includes('stylus') ||
      $('link[href*=".styl"]').length > 0) {
    technologies.cssPreprocessor.push('Stylus');
  }

  // === STATIC SITE GENERATORS ===
  
  // Gatsby
  if (htmlLower.includes('gatsby') ||
      htmlLower.includes('___gatsby') ||
      htmlLower.includes('gatsby-') ||
      $('script[src*="gatsby"]').length > 0) {
    technologies.staticGenerator.push('Gatsby');
  }
  
  // Hugo
  if (htmlLower.includes('hugo') ||
      htmlLower.includes('generated by hugo') ||
      $('meta[name="generator"][content*="Hugo"]').length > 0) {
    technologies.staticGenerator.push('Hugo');
  }
  
  // Jekyll
  if (htmlLower.includes('jekyll') ||
      htmlLower.includes('generated by jekyll') ||
      $('meta[name="generator"][content*="Jekyll"]').length > 0) {
    technologies.staticGenerator.push('Jekyll');
  }
  
  // Eleventy (11ty)
  if (htmlLower.includes('eleventy') ||
      htmlLower.includes('11ty') ||
      $('meta[name="generator"][content*="Eleventy"]').length > 0) {
    technologies.staticGenerator.push('Eleventy');
  }
  
  // Astro
  if (htmlLower.includes('astro') ||
      htmlLower.includes('astro-island') ||
      $('meta[name="generator"][content*="Astro"]').length > 0) {
    technologies.staticGenerator.push('Astro');
  }
  
  // GridSome
  if (htmlLower.includes('gridsome') ||
      $('meta[name="generator"][content*="Gridsome"]').length > 0) {
    technologies.staticGenerator.push('GridSome');
  }

  // === BUILD TOOLS ===
  
  // Webpack
  if (htmlLower.includes('webpack') ||
      htmlLower.includes('webpackJsonp') ||
      htmlLower.includes('__webpack_require__')) {
    technologies.buildTool.push('Webpack');
  }
  
  // Vite
  if (htmlLower.includes('vite') ||
      htmlLower.includes('/@vite/') ||
      htmlLower.includes('vite:')) {
    technologies.buildTool.push('Vite');
  }
  
  // Parcel
  if (htmlLower.includes('parcel') ||
      htmlLower.includes('.parcel-')) {
    technologies.buildTool.push('Parcel');
  }
  
  // Rollup
  if (htmlLower.includes('rollup') ||
      htmlLower.includes('rollupjs')) {
    technologies.buildTool.push('Rollup');
  }

  // === LANGUAGE DETECTION ===
  
  // PHP
  if (htmlLower.includes('<?php') ||
      htmlLower.includes('phpsessid') ||
      headers['x-powered-by']?.includes('php') ||
      headers['set-cookie']?.includes('phpsessid')) {
    technologies.language.push('PHP');
  }
  
  // ASP.NET
  if (htmlLower.includes('aspnet') ||
      htmlLower.includes('__viewstate') ||
      htmlLower.includes('__eventvalidation') ||
      headers['x-powered-by']?.includes('asp.net') ||
      headers['x-aspnet-version']) {
    technologies.language.push('ASP.NET');
  }
  
  // Node.js
  if (headers['x-powered-by']?.includes('express') ||
      headers['x-powered-by']?.includes('node') ||
      htmlLower.includes('node.js')) {
    technologies.language.push('Node.js');
  }
  
  // Python
  if (headers['x-powered-by']?.includes('django') ||
      headers['x-powered-by']?.includes('flask') ||
      htmlLower.includes('django') ||
      htmlLower.includes('flask')) {
    technologies.language.push('Python');
  }
  
  // Ruby
  if (headers['x-powered-by']?.includes('ruby') ||
      htmlLower.includes('rails') ||
      htmlLower.includes('ruby')) {
    technologies.language.push('Ruby');
  }
  
  // Java
  if (htmlLower.includes('jsessionid') ||
      headers['set-cookie']?.includes('jsessionid') ||
      htmlLower.includes('java') ||
      htmlLower.includes('jsp')) {
    technologies.language.push('Java');
  }
  
  // Go (Golang)
  if (headers['x-powered-by']?.includes('go') ||
      headers['server']?.includes('go') ||
      htmlLower.includes('golang')) {
    technologies.language.push('Go');
  }
  
  // Rust
  if (headers['x-powered-by']?.includes('rust') ||
      headers['server']?.includes('actix') ||
      headers['server']?.includes('warp') ||
      htmlLower.includes('rust')) {
    technologies.language.push('Rust');
  }
  
  // C#
  if (htmlLower.includes('c#') ||
      headers['x-powered-by']?.includes('c#') ||
      htmlLower.includes('.net')) {
    technologies.language.push('C#');
  }
  
  // Kotlin
  if (htmlLower.includes('kotlin') ||
      headers['x-powered-by']?.includes('kotlin')) {
    technologies.language.push('Kotlin');
  }
  
  // Swift
  if (htmlLower.includes('swift') ||
      headers['x-powered-by']?.includes('swift') ||
      headers['server']?.includes('vapor')) {
    technologies.language.push('Swift');
  }
  
  // TypeScript
  if (htmlLower.includes('typescript') ||
      htmlLower.includes('.ts') ||
      $('script[src*=".ts"]').length > 0) {
    technologies.language.push('TypeScript');
  }

  // === MICRO FRAMEWORKS ===
  
  // Express.js
  if (headers['x-powered-by']?.includes('express') ||
      htmlLower.includes('express')) {
    technologies.microFramework.push('Express.js');
  }
  
  // Fastify
  if (headers['x-powered-by']?.includes('fastify') ||
      htmlLower.includes('fastify')) {
    technologies.microFramework.push('Fastify');
  }
  
  // Django
  if (headers['x-powered-by']?.includes('django') ||
      htmlLower.includes('django') ||
      headers['set-cookie']?.includes('csrftoken')) {
    technologies.microFramework.push('Django');
  }
  
  // Flask
  if (headers['x-powered-by']?.includes('flask') ||
      htmlLower.includes('flask')) {
    technologies.microFramework.push('Flask');
  }
  
  // Spring Boot
  if (htmlLower.includes('spring') ||
      htmlLower.includes('spring-boot') ||
      headers['x-powered-by']?.includes('spring')) {
    technologies.microFramework.push('Spring Boot');
  }
  
  // Rails
  if (headers['x-powered-by']?.includes('ruby') ||
      htmlLower.includes('rails') ||
      headers['set-cookie']?.includes('_session_id')) {
    technologies.microFramework.push('Ruby on Rails');
  }

  // === DATABASE DETECTION ===
  
  // MongoDB
  if (htmlLower.includes('mongodb') ||
      htmlLower.includes('mongo') ||
      headers['x-powered-by']?.includes('mongo')) {
    technologies.database.push('MongoDB');
  }
  
  // PostgreSQL
  if (htmlLower.includes('postgresql') ||
      htmlLower.includes('postgres') ||
      headers['x-powered-by']?.includes('postgres')) {
    technologies.database.push('PostgreSQL');
  }
  
  // MySQL
  if (htmlLower.includes('mysql') ||
      headers['x-powered-by']?.includes('mysql')) {
    technologies.database.push('MySQL');
  }
  
  // Redis
  if (htmlLower.includes('redis') ||
      headers['x-powered-by']?.includes('redis')) {
    technologies.database.push('Redis');
  }

  // === CDN DETECTION ===
  
  // Cloudflare
  if (headers['cf-ray'] || 
      headers['server']?.includes('cloudflare') ||
      htmlLower.includes('cloudflare')) {
    technologies.cdn.push('Cloudflare');
  }
  
  // Amazon CloudFront
  if (headers['x-amz-cf-id'] ||
      htmlLower.includes('cloudfront.net') ||
      htmlLower.includes('amazonaws.com')) {
    technologies.cdn.push('Amazon CloudFront');
  }
  
  // Google CDN
  if (htmlLower.includes('googleapis.com') ||
      htmlLower.includes('gstatic.com') ||
      htmlLower.includes('google-analytics.com')) {
    technologies.cdn.push('Google CDN');
  }
  
  // jsDelivr
  if (htmlLower.includes('jsdelivr.net') ||
      $('script[src*="jsdelivr"], link[href*="jsdelivr"]').length > 0) {
    technologies.cdn.push('jsDelivr');
  }
  
  // unpkg
  if (htmlLower.includes('unpkg.com') ||
      $('script[src*="unpkg"], link[href*="unpkg"]').length > 0) {
    technologies.cdn.push('unpkg');
  }
  
  // MaxCDN / KeyCDN
  if (htmlLower.includes('maxcdn.com') ||
      htmlLower.includes('keycdn.com')) {
    technologies.cdn.push('MaxCDN');
  }
  
  // Fastly
  if (htmlLower.includes('fastly.com') ||
      headers['fastly-debug-digest'] ||
      headers['x-served-by']?.includes('fastly')) {
    technologies.cdn.push('Fastly');
  }
  
  // Azure CDN
  if (htmlLower.includes('azureedge.net') ||
      htmlLower.includes('azure.com') ||
      headers['x-azure-ref']) {
    technologies.cdn.push('Azure CDN');
  }
  
  // BunnyCDN
  if (htmlLower.includes('bunnycdn.com') ||
      htmlLower.includes('b-cdn.net') ||
      headers['bunny-cache-status']) {
    technologies.cdn.push('BunnyCDN');
  }
  
  // StackPath
  if (htmlLower.includes('stackpath.com') ||
      htmlLower.includes('stackpathcdn.com') ||
      headers['x-sp-edge-server']) {
    technologies.cdn.push('StackPath');
  }

  // === WEB SERVER DETECTION ===
  const serverHeader = headers['server'];
  if (serverHeader) {
    if (serverHeader.includes('apache')) {
      technologies.webServer = 'Apache';
    } else if (serverHeader.includes('nginx')) {
      technologies.webServer = 'Nginx';
    } else if (serverHeader.includes('iis')) {
      technologies.webServer = 'Microsoft IIS';
    } else if (serverHeader.includes('openresty')) {
      technologies.webServer = 'OpenResty';
    } else if (serverHeader.includes('cloudflare')) {
      technologies.webServer = 'Cloudflare';
    } else {
      technologies.webServer = serverHeader;
    }
  }

  // === HOSTING DETECTION ===
  
  // По заголовкам и контенту
  if (headers['x-github-request-id']) {
    technologies.hosting = 'GitHub Pages';
  } else if (headers['x-vercel-id'] || htmlLower.includes('vercel.app')) {
    technologies.hosting = 'Vercel';
  } else if (headers['x-netlify-id'] || htmlLower.includes('netlify')) {
    technologies.hosting = 'Netlify';
  } else if (htmlLower.includes('heroku') || headers['via']?.includes('heroku')) {
    technologies.hosting = 'Heroku';
  } else if (htmlLower.includes('firebase') || htmlLower.includes('firebaseapp.com')) {
    technologies.hosting = 'Firebase';
  }

  return technologies;
}

function analyzeAnalytics($, html) {
  const htmlLower = html.toLowerCase();
  const analytics = {};
  
  // Google Analytics
  analytics.googleAnalytics = htmlLower.includes('google-analytics.com') ||
                              htmlLower.includes('ga.js') ||
                              htmlLower.includes('analytics.js') ||
                              htmlLower.includes('gtag.js') ||
                              htmlLower.includes('ua-') ||
                              htmlLower.includes('ga-');
  
  // Google Tag Manager
  analytics.googleTagManager = htmlLower.includes('googletagmanager.com') ||
                               htmlLower.includes('gtm.js') ||
                               htmlLower.includes('gtm-');
  
  // Facebook/Meta Pixel
  analytics.facebookPixel = htmlLower.includes('facebook.net') ||
                           htmlLower.includes('fbevents.js') ||
                           htmlLower.includes('fbq(');
  analytics.metaPixel = analytics.facebookPixel;
  
  // Яндекс.Метрика
  analytics.yandexMetrica = htmlLower.includes('mc.yandex.ru') ||
                           htmlLower.includes('metrika') ||
                           htmlLower.includes('yaCounter');
  
  // Hotjar
  analytics.hotjar = htmlLower.includes('hotjar.com') ||
                     htmlLower.includes('hj(');
  
  // Microsoft Clarity
  analytics.clarity = htmlLower.includes('clarity.ms') ||
                      htmlLower.includes('microsoft/clarity');
  
  // Email Marketing
  analytics.mailchimp = htmlLower.includes('mailchimp') ||
                        htmlLower.includes('mc.us');
  analytics.convertkit = htmlLower.includes('convertkit');
  analytics.klaviyo = htmlLower.includes('klaviyo');
  
  // Live Chat
  analytics.intercom = htmlLower.includes('intercom') ||
                       htmlLower.includes('intercom.io');
  analytics.zendesk = htmlLower.includes('zendesk') ||
                      htmlLower.includes('zopim');
  analytics.tawkTo = htmlLower.includes('tawk.to');
  analytics.crisp = htmlLower.includes('crisp.chat');
  
  // A/B Testing
  analytics.optimizely = htmlLower.includes('optimizely');
  analytics.vwo = htmlLower.includes('vwo.com');
  analytics.googleOptimize = htmlLower.includes('googleoptimize');
  
  // Heatmaps
  analytics.crazyEgg = htmlLower.includes('crazyegg');
  analytics.fullstory = htmlLower.includes('fullstory');
  analytics.mouseflow = htmlLower.includes('mouseflow');
  
  return analytics;
}

// Анализ визуальных элементов
function analyzeVisual($) {
  const images = $('img');
  const visual = {
    imagesCount: images.length,
    imagesWithoutAlt: 0,
    imagesWithEmptyAlt: 0,
    cssFiles: $('link[rel="stylesheet"]').length,
    jsFiles: $('script[src]').length,
    inlineStyles: $('style').length,
    fonts: [],
    icons: [],
    videos: $('video').length,
    audio: $('audio').length,
    svgs: $('svg').length
  };
  
  // Анализ alt текстов
  images.each((i, img) => {
    const alt = $(img).attr('alt');
    if (!alt) {
      visual.imagesWithoutAlt++;
    } else if (alt.trim() === '') {
      visual.imagesWithEmptyAlt++;
    }
  });
  
  // Анализ шрифтов
  const fontSources = [];
  $('link[href*="fonts.googleapis.com"]').each((i, el) => {
    fontSources.push('Google Fonts');
  });
  $('link[href*="fonts.adobe.com"], link[href*="typekit.net"]').each((i, el) => {
    fontSources.push('Adobe Fonts');
  });
  visual.fonts = [...new Set(fontSources)];
  
  // Анализ иконок
  const iconSources = [];
  if ($('link[href*="font-awesome"], script[src*="font-awesome"]').length > 0) {
    iconSources.push('Font Awesome');
  }
  if ($('link[href*="material-icons"]').length > 0) {
    iconSources.push('Material Icons');
  }
  visual.icons = iconSources;
  
  return visual;
}

// Анализ хостинга и безопасности
function analyzeHosting($, html, response) {
  const hosting = {
    ssl: false,
    webServer: null,
    cloudflare: false,
    cdn: false,
    securityHeaders: {}
  };
  
  const headers = {};
  if (response && response.headers) {
    response.headers.forEach((value, key) => {
      headers[key.toLowerCase()] = value.toLowerCase();
    });
  }
  
  // SSL проверка
  hosting.ssl = response.url ? response.url.startsWith('https://') : false;
  
  // Web сервер
  if (headers['server']) {
    hosting.webServer = headers['server'];
  }
  
  // Cloudflare
  hosting.cloudflare = !!(headers['cf-ray'] || headers['server']?.includes('cloudflare'));
  
  // CDN
  hosting.cdn = hosting.cloudflare || 
                headers['x-amz-cf-id'] || 
                html.toLowerCase().includes('cdn.');
  
  // Security headers
  hosting.securityHeaders = {
    'X-Frame-Options': !!headers['x-frame-options'],
    'X-XSS-Protection': !!headers['x-xss-protection'],
    'X-Content-Type-Options': !!headers['x-content-type-options'],
    'Strict-Transport-Security': !!headers['strict-transport-security'],
    'Content-Security-Policy': !!headers['content-security-policy']
  };
  
  return hosting;
}

// Анализ социальных сетей
function analyzeSocial($) {
  const social = {};
  
  const socialPatterns = {
    facebook: /facebook\.com\/[^\/\s"'>]+/gi,
    instagram: /instagram\.com\/[^\/\s"'>]+/gi,
    twitter: /(twitter\.com|x\.com)\/[^\/\s"'>]+/gi,
    linkedin: /linkedin\.com\/(?:in|company)\/[^\/\s"'>]+/gi,
    youtube: /youtube\.com\/(?:channel\/|user\/|c\/|@)[^\/\s"'>]+/gi,
    telegram: /(t\.me|telegram\.me)\/[^\/\s"'>]+/gi,
    whatsapp: /wa\.me\/[^\/\s"'>]+/gi,
    viber: /viber\.click\/[^\/\s"'>]+/gi
  };
  
  const html = $.html();
  
  Object.keys(socialPatterns).forEach(platform => {
    const matches = html.match(socialPatterns[platform]);
    if (matches && matches.length > 0) {
      // Берем первую найденную ссылку
      social[platform] = matches[0].replace(/["'>]/g, '');
    }
  });
  
  return social;
}

// Анализ производительности
function analyzePerformance(html, loadTime) {
  const htmlSize = Buffer.byteLength(html, 'utf8');
  
  return {
    loadTime: loadTime,
    pageSize: htmlSize,
    pageSizeKB: Math.round(htmlSize / 1024 * 100) / 100,
    requests: 1 // Базовый HTML запрос
  };
}

function analyzeContact($, html, url) {
  const contact = { phones: [], emails: [] };
  const rawPhones = [];

  // Priority 1: tel: links (most reliable)
  const telLinks = $('a[href^="tel:"]');
  
  telLinks.each((i, el) => {
    const href = $(el).attr('href');
    
    if (href && href.startsWith('tel:')) {
      // Extract phone from tel: link
      let phone = href.substring(4); // Remove 'tel:'
      
      // Decode URL encoding
      try {
        phone = decodeURIComponent(phone);
      } catch (e) {
        // If decoding fails, do manual replacement
        phone = phone.replace(/%20/g, ' ').replace(/%2B/g, '+');
      }
      
      // Clean but preserve + for country code
      let cleanPhone = phone.replace(/[^\d\+]/g, '');
      
      if (cleanPhone.length >= 7 && cleanPhone.length <= 15) {
        rawPhones.push(cleanPhone);
      }
    }
  });

  // Priority 2: If no tel: links found, look for phone patterns in text
  if (rawPhones.length === 0) {
    // Look for well-formatted phone patterns
    const phonePatterns = [
      // International: +1 718 734 0600, +380 67 123 45 67
      /\+\d{1,4}[\s\-\(\)]?\d{2,4}[\s\-\(\)]?\d{2,4}[\s\-\(\)]?\d{2,4}/g,
      // US format: (718) 734-0600
      /\(\d{3}\)[\s\-]?\d{3}[\s\-]?\d{4}/g
    ];

    const processedHtml = html.replace(/%20/g, ' ').replace(/%2B/g, '+');
    
    phonePatterns.forEach(pattern => {
      const matches = processedHtml.match(pattern);
      if (matches) {
        matches.forEach(phone => {
          // Basic context filtering - skip obvious false positives
          const phoneIndex = processedHtml.indexOf(phone);
          const context = processedHtml.substring(Math.max(0, phoneIndex - 50), phoneIndex + phone.length + 50);
          
          // Skip if in code/CSS context
          if (context.includes('class=') || context.includes('id=') || 
              context.includes('function') || context.includes('vc_custom_')) {
            return;
          }
          
          let cleanPhone = phone.replace(/[^\d\+]/g, '');
          
          // Basic validation
          if (cleanPhone.length >= 7 && cleanPhone.length <= 15) {
            // US domestic validation
            if (!cleanPhone.startsWith('+') && cleanPhone.length === 10) {
              const areaCode = cleanPhone.substring(0, 3);
              if (areaCode.charAt(0) !== '0' && areaCode.charAt(0) !== '1') {
                rawPhones.push(cleanPhone);
              }
            }
            // International validation
            else if (cleanPhone.startsWith('+')) {
              const digits = cleanPhone.substring(1);
              if ((digits.startsWith('1') && digits.length === 11) || // US/Canada
                  (digits.startsWith('380') && digits.length === 12) || // Ukraine
                  (digits.length >= 10 && digits.length <= 13)) { // Other countries
                rawPhones.push(cleanPhone);
              }
            }
          }
        });
      }
    });
  }

  // Simple deduplication - keep full numbers
  const phoneSet = new Set();
  rawPhones.forEach(phone => {
    phoneSet.add(phone);
  });

  contact.phones = Array.from(phoneSet);
  return contact;
}

module.exports = router;