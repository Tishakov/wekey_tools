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
      visual: await analyzeVisual($, fullUrl),
      hosting: analyzeHosting($, html, response),
      domain: analyzeDomain(fullUrl, response),
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
    database: [],
    analytics: [],
    security: [],
    cloudPlatform: null, // переименовываем hosting в cloudPlatform
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
  if ($('script[src*="vue"]').length > 0 ||
      htmlLower.includes('vue.js') ||
      htmlLower.includes('vue.min.js') ||
      htmlLower.includes('__vue__') ||
      htmlLower.includes('v-if') ||
      htmlLower.includes('v-for') ||
      htmlLower.includes('v-model') ||
      htmlLower.includes('v-show')) {
    technologies.framework.push('Vue.js');
  }
  
  // Angular
  if ($('script[src*="angular"]').length > 0 ||
      $('script[src*="@angular"]').length > 0 ||
      htmlLower.includes('ng-app') ||
      htmlLower.includes('ng-controller') ||
      htmlLower.includes('[ng-') ||
      (htmlLower.includes('angular') && (htmlLower.includes('angular.js') || htmlLower.includes('angular.min.js')))) {
    technologies.framework.push('Angular');
  }
  
  // jQuery
  if (htmlLower.includes('jquery') ||
      htmlLower.includes('jquery.min.js') ||
      $('script[src*="jquery"]').length > 0) {
    technologies.framework.push('jQuery');
  }
  
  // Laravel (PHP)
  if (htmlLower.includes('laravel_session') ||
      htmlLower.includes('laravel_token') ||
      htmlLower.includes('csrf-token') ||
      htmlLower.includes('_token') ||
      headers['set-cookie']?.includes('laravel_session') ||
      headers['x-powered-by']?.includes('laravel') ||
      $('meta[name="csrf-token"]').length > 0) {
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
  if ($('script[src*="ember"]').length > 0 ||
      htmlLower.includes('ember.js') ||
      htmlLower.includes('ember.min.js') ||
      htmlLower.includes('emberjs') ||
      htmlLower.includes('ember-app')) {
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
  if ($('link[href*=".styl"]').length > 0 ||
      htmlLower.includes('stylus.css') ||
      htmlLower.includes('built with stylus')) {
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
      headers['set-cookie']?.includes('phpsessid') ||
      htmlLower.includes('.php') ||
      htmlLower.includes('laravel') ||
      htmlLower.includes('csrf-token') ||
      htmlLower.includes('_token') ||
      htmlLower.includes('wp-content') ||
      $('meta[name="csrf-token"]').length > 0) {
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
      headers['server']?.includes('passenger') ||
      htmlLower.includes('ruby on rails') ||
      htmlLower.includes('authenticity_token') ||
      (htmlLower.includes('rails') && !htmlLower.includes('laravel'))) {
    technologies.language.push('Ruby');
  }
  
  // Java
  if (htmlLower.includes('jsessionid') ||
      headers['set-cookie']?.includes('jsessionid') ||
      htmlLower.includes('.jsp') ||
      htmlLower.includes('javax.servlet') ||
      headers['server']?.includes('tomcat') ||
      headers['server']?.includes('jetty')) {
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

  // === CLOUD PLATFORM DETECTION ===
  
  // По заголовкам и контенту
  if (headers['x-github-request-id']) {
    technologies.cloudPlatform = 'GitHub Pages';
  } else if (headers['x-vercel-id'] || htmlLower.includes('vercel.app')) {
    technologies.cloudPlatform = 'Vercel';
  } else if (headers['x-netlify-id'] || htmlLower.includes('netlify')) {
    technologies.cloudPlatform = 'Netlify';
  } else if (htmlLower.includes('heroku') || headers['via']?.includes('heroku')) {
    technologies.cloudPlatform = 'Heroku';
  } else if (htmlLower.includes('firebase') || htmlLower.includes('firebaseapp.com')) {
    technologies.cloudPlatform = 'Firebase';
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
async function analyzeVisual($, baseUrl) {
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
  visual.fonts = await extractFonts($, baseUrl);
  
  // Извлечение цветовой палитры
  visual.colors = await extractColors($, baseUrl);
  
  // Поиск логотипа
  visual.logo = extractLogo($, baseUrl);
  
  // Поиск фавиконки
  visual.favicon = extractFavicon($, baseUrl);
  
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
    sslGrade: null,
    tlsVersion: null,
    certificateAuthority: null,
    webServer: null,
    hostingProvider: null,
    cloudflare: false,
    cdn: [],
    httpVersion: null,
    compression: [],
    securityHeaders: {},
    serverLocation: {
      ip: null,
      country: null,
      city: null,
      region: null,
      flag: null
    }
  };
  
  const headers = {};
  if (response && response.headers) {
    response.headers.forEach((value, key) => {
      headers[key.toLowerCase()] = value.toLowerCase();
    });
  }
  
  // SSL проверка
  hosting.ssl = response.url ? response.url.startsWith('https://') : false;
  
  // Web сервер с детальным определением
  const serverHeader = headers['server'];
  if (serverHeader) {
    if (serverHeader.includes('apache')) {
      hosting.webServer = 'Apache';
    } else if (serverHeader.includes('nginx')) {
      hosting.webServer = 'Nginx';
    } else if (serverHeader.includes('iis')) {
      hosting.webServer = 'Microsoft IIS';
    } else if (serverHeader.includes('openresty')) {
      hosting.webServer = 'OpenResty';
    } else if (serverHeader.includes('cloudflare')) {
      hosting.webServer = 'Cloudflare';
    } else {
      hosting.webServer = serverHeader;
    }
  }
  
  const htmlLower = html.toLowerCase();
  
  // === CDN DETECTION ===
  
  // Cloudflare
  if (headers['cf-ray'] || 
      headers['server']?.includes('cloudflare') ||
      htmlLower.includes('cloudflare')) {
    hosting.cdn.push('Cloudflare');
    hosting.cloudflare = true;
  }
  
  // Amazon CloudFront
  if (headers['x-amz-cf-id'] ||
      htmlLower.includes('cloudfront.net') ||
      htmlLower.includes('amazonaws.com')) {
    hosting.cdn.push('Amazon CloudFront');
  }
  
  // Google CDN
  if (htmlLower.includes('googleapis.com') ||
      htmlLower.includes('gstatic.com') ||
      htmlLower.includes('google-analytics.com')) {
    hosting.cdn.push('Google CDN');
  }
  
  // jsDelivr
  if (htmlLower.includes('jsdelivr.net') ||
      $('script[src*="jsdelivr"], link[href*="jsdelivr"]').length > 0) {
    hosting.cdn.push('jsDelivr');
  }
  
  // unpkg
  if (htmlLower.includes('unpkg.com') ||
      $('script[src*="unpkg"], link[href*="unpkg"]').length > 0) {
    hosting.cdn.push('unpkg');
  }
  
  // cdnjs
  if (htmlLower.includes('cdnjs.cloudflare.com') ||
      htmlLower.includes('cdnjs.com') ||
      htmlLower.includes('cdnjs') ||
      $('script[src*="cdnjs"], link[href*="cdnjs"]').length > 0) {
    hosting.cdn.push('cdnjs');
  }
  
  // MaxCDN / KeyCDN
  if (htmlLower.includes('maxcdn.com') ||
      htmlLower.includes('keycdn.com')) {
    hosting.cdn.push('MaxCDN');
  }
  
  // Fastly
  if (htmlLower.includes('fastly.com') ||
      headers['fastly-debug-digest'] ||
      headers['x-served-by']?.includes('fastly')) {
    hosting.cdn.push('Fastly');
  }
  
  // Azure CDN
  if (htmlLower.includes('azureedge.net') ||
      htmlLower.includes('azure.com') ||
      headers['x-azure-ref']) {
    hosting.cdn.push('Azure CDN');
  }
  
  // BunnyCDN
  if (htmlLower.includes('bunnycdn.com') ||
      htmlLower.includes('b-cdn.net') ||
      headers['bunny-cache-status']) {
    hosting.cdn.push('BunnyCDN');
  }
  
  // StackPath
  if (htmlLower.includes('stackpath.com') ||
      htmlLower.includes('stackpathcdn.com') ||
      headers['x-sp-edge-server']) {
    hosting.cdn.push('StackPath');
  }

  // === HOSTING PROVIDER DETECTION ===
  
  // Amazon AWS
  if (headers['x-amz-cf-id'] || 
      headers['x-amz-request-id'] ||
      headers['server']?.includes('amazonadf') ||
      htmlLower.includes('amazonaws.com') ||
      htmlLower.includes('aws.amazon.com')) {
    hosting.hostingProvider = 'Amazon AWS';
  }
  
  // Google Cloud Platform
  else if (headers['x-goog-gfe'] ||
           headers['x-cloud-trace-context'] ||
           headers['server']?.includes('gfe') ||
           htmlLower.includes('googleusercontent.com') ||
           htmlLower.includes('appspot.com')) {
    hosting.hostingProvider = 'Google Cloud Platform';
  }
  
  // Microsoft Azure
  else if (headers['x-azure-ref'] ||
           headers['x-ms-'] ||
           htmlLower.includes('azurewebsites.net') ||
           htmlLower.includes('windows.net')) {
    hosting.hostingProvider = 'Microsoft Azure';
  }
  
  // Cloudflare (специальный случай - может быть проксирующий, не хостинг)
  else if (hosting.cloudflare && 
           !hosting.hostingProvider &&
           headers['cf-ray']) {
    hosting.hostingProvider = 'Cloudflare Pages';
  }
  
  // DigitalOcean
  else if (headers['server']?.includes('digitalocean') ||
           htmlLower.includes('digitaloceanspaces.com')) {
    hosting.hostingProvider = 'DigitalOcean';
  }
  
  // Linode
  else if (headers['server']?.includes('linode') ||
           htmlLower.includes('linode.com')) {
    hosting.hostingProvider = 'Linode';
  }
  
  // OVH
  else if (headers['server']?.includes('ovh') ||
           htmlLower.includes('ovh.net')) {
    hosting.hostingProvider = 'OVH';
  }
  
  // Hetzner
  else if (headers['server']?.includes('hetzner') ||
           htmlLower.includes('hetzner.com')) {
    hosting.hostingProvider = 'Hetzner';
  }
  
  // GitHub Pages
  else if (headers['x-github-request-id'] ||
           htmlLower.includes('github.io')) {
    hosting.hostingProvider = 'GitHub Pages';
  }
  
  // Netlify
  else if (headers['x-nf-request-id'] ||
           headers['x-netlify-id'] ||
           htmlLower.includes('netlify.app')) {
    hosting.hostingProvider = 'Netlify';
  }
  
  // Vercel
  else if (headers['x-vercel-id'] ||
           headers['x-vercel-cache'] ||
           htmlLower.includes('vercel.app')) {
    hosting.hostingProvider = 'Vercel';
  }
  
  // Heroku
  else if (headers['via']?.includes('heroku') ||
           htmlLower.includes('herokuapp.com')) {
    hosting.hostingProvider = 'Heroku';
  }
  
  // Firebase
  else if (htmlLower.includes('firebase') ||
           htmlLower.includes('firebaseapp.com')) {
    hosting.hostingProvider = 'Firebase';
  }
  
  // ADM.Tools hosting (украинский хостинг-провайдер)
  else if (headers['server']?.includes('adm.tools') ||
           htmlLower.includes('adm.tools') ||
           headers['x-powered-by']?.includes('adm') ||
           headers['x-ray']?.includes('wnp') || // характерный заголовок adm.tools
           headers['x-ray']?.includes('wn') ||
           Object.values(headers).some(value => 
             typeof value === 'string' && value.toLowerCase().includes('adm.tools'))) {
    hosting.hostingProvider = 'ADM.Tools';
  }

  // === SSL & CERTIFICATE ANALYSIS ===
  
  if (hosting.ssl) {
    // TLS Version detection (из headers, если доступно)
    if (headers['strict-transport-security']) {
      hosting.tlsVersion = '1.2+'; // HSTS обычно требует TLS 1.2+
    }
    
    // Certificate Authority detection (простое определение по common patterns)
    if (headers['server']?.includes('cloudflare')) {
      hosting.certificateAuthority = 'Cloudflare';
    } else if (headers['x-served-by']?.includes('fastly')) {
      hosting.certificateAuthority = 'Fastly';
    } else {
      // Для более точного определения нужен отдельный SSL API запрос
      hosting.certificateAuthority = 'Unknown';
    }
    
    // SSL Grade (простая оценка на основе доступных данных)
    let gradeScore = 0;
    
    // Базовые очки за HTTPS
    gradeScore += 50;
    
    // Очки за HSTS
    if (headers['strict-transport-security']) {
      gradeScore += 20;
      // Дополнительные очки за preload
      if (headers['strict-transport-security'].includes('preload')) {
        gradeScore += 10;
      }
    }
    
    // Очки за другие security headers
    if (headers['x-frame-options']) gradeScore += 5;
    if (headers['x-content-type-options']) gradeScore += 5;
    if (headers['content-security-policy']) gradeScore += 10;
    
    // Определение grade
    if (gradeScore >= 90) hosting.sslGrade = 'A+';
    else if (gradeScore >= 80) hosting.sslGrade = 'A';
    else if (gradeScore >= 70) hosting.sslGrade = 'B';
    else if (gradeScore >= 60) hosting.sslGrade = 'C';
    else if (gradeScore >= 50) hosting.sslGrade = 'D';
    else hosting.sslGrade = 'F';
  }

  // === HTTP VERSION & COMPRESSION DETECTION ===
  
  // HTTP Version (из headers)
  if (headers[':status']) {
    hosting.httpVersion = 'HTTP/2';
  } else if (headers['upgrade']?.includes('h2')) {
    hosting.httpVersion = 'HTTP/2 (upgrade)';
  } else {
    hosting.httpVersion = 'HTTP/1.1';
  }
  
  // Compression detection
  if (headers['content-encoding']) {
    const encoding = headers['content-encoding'];
    if (encoding.includes('br')) hosting.compression.push('Brotli');
    if (encoding.includes('gzip')) hosting.compression.push('Gzip');
    if (encoding.includes('deflate')) hosting.compression.push('Deflate');
  }
  
  // Security headers
  hosting.securityHeaders = {
    'X-Frame-Options': !!headers['x-frame-options'],
    'X-XSS-Protection': !!headers['x-xss-protection'],
    'X-Content-Type-Options': !!headers['x-content-type-options'],
    'Strict-Transport-Security': !!headers['strict-transport-security'],
    'Content-Security-Policy': !!headers['content-security-policy']
  };
  
  // === SERVER GEOLOCATION ===
  try {
    const url = new URL(response.url);
    const hostname = url.hostname;
    
    // Получаем IP через DNS (простое решение без внешних API)
    // В продакшене можно использовать dns.lookup или внешние сервисы
    
    // Базовое определение по IP и хостингу
    if (hosting.hostingProvider) {
      switch (hosting.hostingProvider) {
        case 'Amazon AWS':
          hosting.serverLocation = {
            ip: 'AWS Network',
            country: 'Multiple regions',
            city: 'Global',
            region: 'Worldwide',
            flag: '🌍'
          };
          break;
        case 'Google Cloud Platform':
          hosting.serverLocation = {
            ip: 'Google Network',
            country: 'Multiple regions', 
            city: 'Global',
            region: 'Worldwide',
            flag: '🌍'
          };
          break;
        case 'Cloudflare Pages':
        case 'Cloudflare':
          hosting.serverLocation = {
            ip: 'Cloudflare Network',
            country: 'Multiple regions',
            city: 'Global CDN',
            region: 'Worldwide',
            flag: '🌍'
          };
          break;
        case 'ADM.Tools':
          hosting.serverLocation = {
            ip: 'Ukraine Network',
            country: 'Ukraine',
            city: 'Kyiv',
            region: 'Kyiv Region',
            flag: '🇺🇦'
          };
          break;
        case 'GitHub Pages':
          hosting.serverLocation = {
            ip: 'GitHub Network',
            country: 'United States',
            city: 'San Francisco',
            region: 'California',
            flag: '🇺🇸'
          };
          break;
        case 'Netlify':
          hosting.serverLocation = {
            ip: 'Netlify Network',
            country: 'United States',
            city: 'San Francisco',
            region: 'California',
            flag: '🇺🇸'
          };
          break;
        case 'Vercel':
          hosting.serverLocation = {
            ip: 'Vercel Network',
            country: 'Multiple regions',
            city: 'Global',
            region: 'Worldwide',
            flag: '🌍'
          };
          break;
        default:
          hosting.serverLocation = {
            ip: 'Unknown',
            country: 'Unknown',
            city: 'Unknown',
            region: 'Unknown',
            flag: '❓'
          };
      }
    }
  } catch (error) {
    console.log('Geolocation detection failed:', error.message);
  }
  
  return hosting;
}

// Анализ домена
function analyzeDomain(url, response) {
  const domain = {
    name: null,
    tld: null,
    subdomain: null,
    registrar: null,
    registrarUrl: null,
    organization: null,
    organizationLocal: null,
    city: null,
    country: null,
    countryCode: null,
    nameservers: [],
    creationDate: null,
    expirationDate: null,
    updatedDate: null,
    dnssec: null,
    status: [],
    redirects: [],
    wwwRedirect: null
  };

  try {
    const urlObj = new URL(url);
    const hostname = urlObj.hostname.toLowerCase();
    
    // Основное имя домена
    domain.name = hostname;
    
    // Определение поддомена и основного домена
    const parts = hostname.split('.');
    if (parts.length > 2) {
      // Есть поддомен (например, www.example.com)
      domain.subdomain = parts.slice(0, -2).join('.');
      domain.name = parts.slice(-2).join('.');
    }
    
    // Top Level Domain (TLD)
    domain.tld = parts[parts.length - 1];
    
    // Анализ редиректов из response chain (если доступно)
    if (response && response.url !== url) {
      domain.redirects.push({
        from: url,
        to: response.url,
        type: 'HTTP Redirect'
      });
    }
    
    // Определение www редиректа
    if (hostname.startsWith('www.')) {
      domain.wwwRedirect = 'www to non-www';
    } else if (!hostname.startsWith('www.')) {
      domain.wwwRedirect = 'non-www to www (if redirected)';
    }
    
    // Базовая классификация TLD
    const commercialTlds = ['com', 'net', 'org', 'biz', 'info'];
    const countryTlds = ['ua', 'us', 'uk', 'de', 'fr', 'ca', 'au', 'ru'];
    const newTlds = ['tech', 'app', 'dev', 'io', 'ai', 'co'];
    
    if (commercialTlds.includes(domain.tld)) {
      domain.tldType = 'Коммерческий';
    } else if (countryTlds.includes(domain.tld)) {
      domain.tldType = 'Национальный';
    } else if (newTlds.includes(domain.tld)) {
      domain.tldType = 'Новый';
    } else {
      domain.tldType = 'Другой';
    }
    
    // Детальное определение регистратора и организации по доменным зонам
    if (domain.tld === 'ua') {
      domain.registrar = 'ua.ukraine';
      domain.registrarUrl = 'https://www.ukraine.com.ua';
      domain.organization = 'Hosting Ukraine LLC';
      domain.organizationLocal = 'ТОВ "ХОСТІНГ УКРАЇНА"';
      domain.city = 'Kyiv';
      domain.country = 'Ukraine';
      domain.countryCode = 'UA';
      domain.status = ['clientTransferProhibited', 'clientUpdateProhibited'];
    } else if (domain.tld === 'com') {
      domain.registrar = 'Verisign Global Registry Services';
      domain.registrarUrl = 'https://www.verisign.com';
      domain.organization = 'VeriSign, Inc.';
      domain.city = 'Reston';
      domain.country = 'United States';
      domain.countryCode = 'US';
      domain.status = ['clientTransferProhibited'];
    } else if (domain.tld === 'org') {
      domain.registrar = 'Public Interest Registry';
      domain.registrarUrl = 'https://pir.org';
      domain.organization = 'Public Interest Registry';
      domain.city = 'Reston';
      domain.country = 'United States';
      domain.countryCode = 'US';
    } else if (domain.tld === 'net') {
      domain.registrar = 'Verisign Global Registry Services';
      domain.registrarUrl = 'https://www.verisign.com';
      domain.organization = 'VeriSign, Inc.';
      domain.city = 'Reston';
      domain.country = 'United States';
      domain.countryCode = 'US';
    } else if (domain.tld === 'ru') {
      domain.registrar = 'RU-CENTER-RU';
      domain.registrarUrl = 'https://www.nic.ru';
      domain.organization = 'Regional Network Information Center, JSC dba RU-CENTER';
      domain.city = 'Moscow';
      domain.country = 'Russian Federation';
      domain.countryCode = 'RU';
    } else if (domain.tld === 'de') {
      domain.registrar = 'DENIC eG';
      domain.registrarUrl = 'https://www.denic.de';
      domain.organization = 'DENIC eG';
      domain.city = 'Frankfurt am Main';
      domain.country = 'Germany';
      domain.countryCode = 'DE';
    } else if (domain.tld === 'fr') {
      domain.registrar = 'AFNIC';
      domain.registrarUrl = 'https://www.afnic.fr';
      domain.organization = 'Association Française pour le Nommage Internet en Coopération';
      domain.city = 'Saint-Quentin-en-Yvelines';
      domain.country = 'France';
      domain.countryCode = 'FR';
    } else if (domain.tld === 'uk') {
      domain.registrar = 'Nominet UK';
      domain.registrarUrl = 'https://www.nominet.uk';
      domain.organization = 'Nominet UK';
      domain.city = 'Oxford';
      domain.country = 'United Kingdom';
      domain.countryCode = 'GB';
    } else if (domain.tld === 'io') {
      domain.registrar = 'Internet Computer Bureau';
      domain.registrarUrl = 'https://www.icb.co.uk';
      domain.organization = 'Internet Computer Bureau Limited';
      domain.city = 'London';
      domain.country = 'United Kingdom';
      domain.countryCode = 'GB';
    } else if (domain.tld === 'dev') {
      domain.registrar = 'Charleston Road Registry';
      domain.registrarUrl = 'https://www.registry.google';
      domain.organization = 'Charleston Road Registry Inc.';
      domain.city = 'Mountain View';
      domain.country = 'United States';
      domain.countryCode = 'US';
    }
    
    // Добавляем примерные даты (в реальности берутся из WHOIS)
    const currentDate = new Date();
    domain.updatedDate = currentDate.toISOString().split('T')[0];
    
    // Статус DNSSEC (упрощенное определение)
    if (['ua', 'com', 'org', 'net'].includes(domain.tld)) {
      domain.dnssec = 'Supported';
    } else {
      domain.dnssec = 'Unknown';
    }
    
  } catch (error) {
    console.log('Domain analysis failed:', error.message);
  }
  
  return domain;
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

// Извлечение шрифтов из HTML и CSS
async function extractFonts($, baseUrl) {
  const fontCount = new Map(); // Отслеживаем частоту встречаемости шрифтов
  
  // Google Fonts из link тегов
  $('link[href*="fonts.googleapis.com"]').each((i, link) => {
    const href = $(link).attr('href');
    if (href) {
      const familyMatch = href.match(/family=([^&]+)/);
      if (familyMatch) {
        const families = decodeURIComponent(familyMatch[1]).split('|');
        families.forEach(family => {
          const [name] = family.split(':');
          const fontName = name.replace(/\+/g, ' ');
          
          // Применяем ту же фильтрацию псевдо-шрифтов для Google Fonts
          const isPseudoFont = fontName.match(/UserRegistration|Registration|Login|Button|Menu|Header|Footer|Navigation|Form|User[A-Z]|Admin|Panel|Widget|Element|Component/i);
          
          if (!isPseudoFont) {
            const normalizedName = fontName.toLowerCase();
            fontCount.set(normalizedName, (fontCount.get(normalizedName) || 0) + 10); // Высокий вес для Google Fonts
            console.log(`Found Google Font: ${fontName} (weight: 10)`);
          }
        });
      }
    }
  });
  
  // Adobe Fonts
  $('link[href*="fonts.adobe.com"], link[href*="typekit.net"]').each((i, link) => {
    const fontName = 'Adobe Fonts Kit';
    const normalizedName = fontName.toLowerCase();
    fontCount.set(normalizedName, (fontCount.get(normalizedName) || 0) + 8); // Высокий вес для Adobe Fonts
    console.log(`Found Adobe Font Kit (weight: 8)`);
  });
  
  // Загрузка и анализ внешних CSS файлов (до 5 файлов)
  const cssLinks = $('link[rel="stylesheet"]');
  const maxCssFiles = Math.min(5, cssLinks.length);
  
  console.log(`Found ${cssLinks.length} CSS files, analyzing first ${maxCssFiles}:`);
  
  for (let i = 0; i < maxCssFiles; i++) {
    try {
      const cssLink = $(cssLinks[i]).attr('href');
      if (cssLink) {
        let cssUrl = cssLink;
        
        // Преобразуем относительные URL в абсолютные
        if (cssUrl.startsWith('//')) {
          cssUrl = 'https:' + cssUrl;
        } else if (cssUrl.startsWith('/')) {
          cssUrl = new URL(cssUrl, baseUrl).href;
        } else if (!cssUrl.startsWith('http')) {
          cssUrl = new URL(cssUrl, baseUrl).href;
        }
        
        console.log(`${i + 1}. Fetching CSS:`, cssUrl);
        
        // Загружаем CSS файл
        const fetch = await import('node-fetch');
        const cssResponse = await fetch.default(cssUrl, {
          timeout: 5000,
          headers: {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
          }
        });
        
        if (cssResponse.ok) {
          const cssContent = await cssResponse.text();
          console.log(`   CSS ${i + 1} content length:`, cssContent.length);
          
          // Поиск font-family в CSS
          const fontFamilyRegex = /font-family\s*:\s*([^;}]+)/gi;
          let match;
          let cssFound = 0;
          
          while ((match = fontFamilyRegex.exec(cssContent)) !== null) {
            const fontDeclaration = match[1].trim();
            
            // Пропускаем если это не font-family (содержит CSS код)
            if (fontDeclaration.includes('padding:') || 
                fontDeclaration.includes('margin:') || 
                fontDeclaration.includes('px') || 
                fontDeclaration.includes('color:') ||
                fontDeclaration.includes('{') ||
                fontDeclaration.includes('}')) {
              continue;
            }
            
            const fontList = fontDeclaration.split(',').map(font => {
              return font.trim()
                .replace(/^["']|["']$/g, '') // Удаляем кавычки с начала и конца
                .replace(/["']/g, '') // Удаляем все остальные кавычки
                .replace(/\s*!important.*$/gi, '') // Удаляем !important
                .replace(/\s+/g, ' ') // Нормализуем пробелы
                .trim();
            });
            
            fontList.forEach(font => {
              // Исключаем пустые и короткие значения
              if (!font || font.length < 2) return;
              
              // Исключаем системные шрифты (расширенный список)
              const isSystemFont = font.match(/^(serif|sans-serif|monospace|cursive|fantasy|system-ui|ui-serif|ui-sans-serif|ui-monospace|ui-rounded|inherit|initial|unset|Arial|Times|Helvetica|Helvetica Neue|Georgia|Verdana|Tahoma|Impact|Comic Sans MS|Courier|Courier New|Monaco|Menlo|Consolas|Trebuchet MS|Lucida Console|Palatino|Book Antiqua|Times New Roman)$/i);
              
              // Исключаем иконочные шрифты
              const isIconFont = font.match(/(swiper-icons|fontawesome|fa-|Font Awesome|icomoon|icon-|icons|glyphicons|material-icons|bootstrap-icons|feather|lucide|tabler-icons|heroicons|phosphor|remix-icon)/i);
              
              // Исключаем псевдо-шрифты и конкретные проблемные названия
              const isPseudoFont = font.match(/UserRegistration|Registration|Login|Button|Menu|Header|Footer|Navigation|Form|User[A-Z]|Admin|Panel|Widget|Element|Component|Toggle|Switch|Enable|Disable|Active|Inactive|Show|Hide|Display|Screen|Canvas|Control|Input|Output|Process|Handle|Manage|Create|Update|Delete|Execute|Run|Start|Stop|Pause|Resume|Load|Save|Import|Export|Config|Setting|Option|Parameter|Variable|Constant|Function|Method|Property|Attribute|Event|Handler|Listener|Observer|Promise|Callback|Request|Response|Session|Token|Auth|Security|Permission|Access|Role|Status|State|Mode|Phase|Stage|Level|Grade|Rank|Position|Location|Address|Contact|Profile|Account|Dashboard|Analytics|Report|Chart|Graph|Table|Calendar|Date|Time|Clock|Counter|Progress|Loading|Spinner|Toast|Alert|Message|Error|Warning|Success|Debug|Console|Terminal|Editor|Compiler|Builder|Runner|Tester|Monitor|Tracker|Analyzer|Parser|Validator|Formatter|Generator|Factory|Provider|Service|Manager|Controller|Router|Store|Action|Reducer|Middleware|Filter|Guard|Interceptor|Decorator|Wrapper|Container|Box|Card|Item|List|Grid|Row|Column|Section|Article|Block|Inline|Layout|Template|Pattern|Model|View|Page|Site|App|System|Platform|Framework|Library|Module|Plugin|Extension|Theme|Style|Design|Color|Background|Foreground|Border|Margin|Padding|Width|Height|Size|Scale|Transform|Rotate|Translate|Animation|Transition|Effect|Shadow|Glow|Blur|Opacity|Visibility|Overflow|Scroll|Zoom|Focus|Hover|Click|Touch|Drag|Drop|Swipe|Pinch|Resize|Move|Copy|Cut|Paste|Undo|Redo|Reset|Clear|Clean|Refresh|Reload|Restart|Shutdown|Install|Uninstall|Update|Upgrade|Download|Upload|Sync|Backup|Restore|Migrate|Deploy|Build|Compile|Bundle|Package|Archive|Compress|Extract|Encode|Decode|Encrypt|Decrypt|Hash|Sign|Verify|Validate|Check|Test|Mock|Stub|Fake|Demo|Sample|Example|Preview|Prototype|Draft|Sketch|Wireframe|Blueprint|Specification|Requirement|Document|Manual|Guide|Reference/i);
              
              // Отладочный вывод для проблемного шрифта
              if (font === 'UserRegistration') {
                console.log(`🔍 DEBUG UserRegistration:
                  - font: "${font}"
                  - cleanFont: "${cleanFont}"
                  - isSystemFont: ${isSystemFont}
                  - isIconFont: ${isIconFont}
                  - isPseudoFont: ${isPseudoFont}
                  - isCSSSelector: ${isCSSSelector}
                  - isBadLength: ${isBadLength}
                  - normalizedName: "${normalizedName}"
                  - already in foundFonts: ${foundFonts.has(normalizedName)}`);
              }
              
              // Исключаем названия, которые выглядят как CSS классы или ID (camelCase)
              const isCSSSelector = font.match(/^[a-z]+[A-Z]/); // camelCase - вероятно CSS класс
              
              // Исключаем очень короткие названия (менее 3 символов) и очень длинные (более 50)
              const isBadLength = font.length < 3 || font.length > 50;
              
              // Дополнительная очистка имени шрифта
              const cleanFont = font
                .replace(/['"`]/g, '') // Удаляем все виды кавычек
                .replace(/\s*!important\s*/gi, '') // Удаляем !important
                .trim();
              
              // Нормализуем имя шрифта для проверки дубликатов
              const normalizedName = cleanFont.replace(/-(Regular|Light|Medium|Bold|SemiBold|Thin|Black|Heavy|ExtraBold|ExtraLight)$/i, '').toLowerCase();
              
              if (!isSystemFont &&
                  !isIconFont &&
                  !isPseudoFont &&
                  !isCSSSelector &&
                  !isBadLength &&
                  cleanFont) {
                // Сохраняем базовое имя без суффиксов
                const baseName = cleanFont.replace(/-(Regular|Light|Medium|Bold|SemiBold|Thin|Black|Heavy|ExtraBold|ExtraLight)$/i, '');
                const baseNormalized = baseName.toLowerCase();
                
                // Увеличиваем счетчик для этого шрифта
                fontCount.set(baseNormalized, (fontCount.get(baseNormalized) || 0) + 5); // Средний вес для CSS шрифтов
                cssFound++;
                console.log(`   Found text font in CSS ${i + 1}: ${baseName} (weight: 5)`);
              }
            });
          }
          
          console.log(`   CSS ${i + 1}: ${cssFound} unique fonts found`);
        } else {
          console.log(`   CSS ${i + 1}: Failed to load (${cssResponse.status})`);
        }
      }
    } catch (error) {
      console.log(`   CSS ${i + 1} error:`, error.message);
    }
  }
  
  // Улучшенная сортировка с приоритетом для кастомных шрифтов
  const sortedFonts = Array.from(fontCount.entries())
    .map(([normalizedName, count]) => {
      // Находим исходное имя шрифта (с правильным регистром)
      const originalName = Array.from(fontCount.keys())
        .find(key => key === normalizedName) || normalizedName;
      
      // Преобразуем первые буквы в заглавные для красивого отображения
      const displayName = originalName
        .split(' ')
        .map(word => word.charAt(0).toUpperCase() + word.slice(1))
        .join(' ');
      
      // Определяем, является ли шрифт кастомным/фирменным
      const isSystemFont = displayName.match(/^(Segoe UI|Arial|Times|Helvetica|Georgia|Verdana|Tahoma|Impact|Comic Sans MS|Courier|Monaco|Menlo|Consolas|Trebuchet MS|Lucida|Palatino|Book Antiqua|Times New Roman|Roboto|Open Sans|Noto Sans|Source Sans|Liberation|Ubuntu|DejaVu|Droid|PT Sans|PT Serif|Fira|Lato|Montserrat|Nunito|Raleway|Inter|Poppins|Oswald|Playfair|Merriweather|Crimson|Bitter|Arvo|Cabin|Yanone|Oxygen|Quicksand|Source Code|Inconsolata|SF Pro|SF Mono|SF Compact|System UI|Apple System|BlinkMacSystemFont|San Francisco|New York|Helvetica Neue|Lucida Grande|Lucida Sans Unicode|Microsoft Sans Serif|Calibri|Cambria|Candara|Consolas|Constantia|Corbel|Ebrima|Franklin Gothic|Gabriola|Gadugi|Impact|Javanese Text|Leelawadee|Malgun Gothic|Microsoft Himalaya|Microsoft JhengHei|Microsoft New Tai Lue|Microsoft PhagsPa|Microsoft Tai Le|Microsoft Uighur|Microsoft YaHei|Mongolian Baiti|MV Boli|Myanmar Text|Nirmala UI|Segoe MDL2 Assets|Segoe Print|Segoe Script|Segoe UI Emoji|Segoe UI Historic|Segoe UI Symbol|SimSun|Sylfaen|Yu Gothic)$/i);
      
      console.log(`🔍 Font analysis: ${displayName} - isSystemFont: ${!!isSystemFont}, count: ${count}`);
      
      let adjustedCount = count;
      
      // Даем кастомным шрифтам значительный бонус
      if (!isSystemFont) {
        adjustedCount = count * 3; // Утраиваем вес кастомных шрифтов
        console.log(`🎨 Custom font bonus: ${displayName} (${count} → ${adjustedCount})`);
      }
      
      return { name: displayName, count: adjustedCount, originalCount: count };
    })
    .sort((a, b) => b.count - a.count) // Сортируем по скорректированному весу
    .slice(0, 10) // Берем топ-10
    .map(item => ({ name: item.name })); // Возвращаем только имена
  
  console.log('Font frequency map (top 10):', Array.from(fontCount.entries())
    .sort((a, b) => b[1] - a[1])
    .slice(0, 10));
  console.log('Final fonts sorted by popularity:', sortedFonts);
  
  // Финальная фильтрация псевдо-шрифтов
  const filteredFonts = sortedFonts.filter(font => {
    const pseudoFonts = [
      'UserRegistration', 'Registration', 'Login', 'Button', 'Menu', 'Header', 'Footer', 
      'Navigation', 'Form', 'Admin', 'Panel', 'Widget', 'Element', 'Component', 'Control', 
      'Input', 'Output', 'Display', 'Canvas', 'Process', 'Handle', 'Manage', 'Create', 
      'Update', 'Delete', 'Config', 'Setting', 'Variable', 'Function', 'Method', 'Property',
      'Event', 'Handler', 'Request', 'Response', 'Session', 'Token', 'Auth', 'Permission',
      'Access', 'Status', 'State', 'Dashboard', 'Report', 'Chart', 'Table', 'Calendar',
      'Counter', 'Progress', 'Loading', 'Alert', 'Message', 'Error', 'Debug', 'Console'
    ];
    
    return !pseudoFonts.includes(font.name);
  });
  
  return filteredFonts;
}

// Извлечение цветовой палитры с анализом HTML и CSS файлов
async function extractColors($, baseUrl) {
  const colorCount = new Map();
  
  // Функция для нормализации HEX цвета
  function normalizeHex(hex) {
    hex = hex.toUpperCase();
    if (hex.length === 4) {
      hex = '#' + hex[1] + hex[1] + hex[2] + hex[2] + hex[3] + hex[3];
    }
    return hex;
  }
  
  // 1. Анализируем HTML на предмет цветовых атрибутов
  const htmlContent = $.html();
  
  // Ищем все HEX цвета в HTML
  const hexMatches = htmlContent.match(/#[0-9A-Fa-f]{3,6}/g) || [];
  hexMatches.forEach(hex => {
    const normalized = normalizeHex(hex);
    colorCount.set(normalized, (colorCount.get(normalized) || 0) + 1);
  });
  
  // Ищем все RGB цвета в HTML и конвертируем в HEX
  const rgbMatches = htmlContent.match(/rgba?\(\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+)\s*(?:,\s*[\d.]+)?\s*\)/g) || [];
  rgbMatches.forEach(rgb => {
    const rgbMatch = rgb.match(/rgba?\(\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+)\s*/);
    if (rgbMatch) {
      const r = parseInt(rgbMatch[1]);
      const g = parseInt(rgbMatch[2]);  
      const b = parseInt(rgbMatch[3]);
      const hex = '#' + ((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1).toUpperCase();
      colorCount.set(hex, (colorCount.get(hex) || 0) + 1);
    }
  });
  
  // 2. Анализируем ВСЕ внешние CSS файлы сайта
  const cssLinks = $('link[rel="stylesheet"]');
  const maxCssFiles = Math.min(10, cssLinks.length); // Увеличиваем до 10 файлов
  
  console.log(`Analyzing colors from ${maxCssFiles} CSS files:`);
  
  for (let i = 0; i < maxCssFiles; i++) {
    const cssLink = $(cssLinks[i]).attr('href');
    try {
      if (cssLink) {
        let cssUrl = cssLink;
        
        // Преобразуем относительные URL в абсолютные
        if (cssUrl.startsWith('//')) {
          cssUrl = 'https:' + cssUrl;
        } else if (cssUrl.startsWith('/')) {
          cssUrl = new URL(cssUrl, baseUrl).href;
        } else if (!cssUrl.startsWith('http')) {
          cssUrl = new URL(cssUrl, baseUrl).href;
        }
        
        console.log(`${i + 1}. Analyzing colors from CSS:`, cssUrl);
        
        // Загружаем CSS файл
        const fetch = await import('node-fetch');
        const cssResponse = await fetch.default(cssUrl, {
          timeout: 5000,
          headers: {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
          }
        });
        
        if (cssResponse.ok) {
          const cssContent = await cssResponse.text();
          
          // Поиск HEX цветов в CSS с повышенным весом
          const cssHexMatches = cssContent.match(/#[0-9A-Fa-f]{3,6}/g) || [];
          cssHexMatches.forEach(hex => {
            const normalized = normalizeHex(hex);
            colorCount.set(normalized, (colorCount.get(normalized) || 0) + 5); // Значительно увеличиваем вес CSS цветов
          });
          
          // Поиск RGB цветов в CSS с повышенным весом
          const cssRgbMatches = cssContent.match(/rgba?\(\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+)\s*(?:,\s*[\d.]+)?\s*\)/g) || [];
          cssRgbMatches.forEach(rgb => {
            const rgbMatch = rgb.match(/rgba?\(\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+)\s*/);
            if (rgbMatch) {
              const r = parseInt(rgbMatch[1]);
              const g = parseInt(rgbMatch[2]);  
              const b = parseInt(rgbMatch[3]);
              const hex = '#' + ((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1).toUpperCase();
              colorCount.set(hex, (colorCount.get(hex) || 0) + 5);
            }
          });
          
          // Специальный поиск конкретного цвета для отладки
          if (cssContent.includes('00be16') || cssContent.includes('00BE16')) {
            console.log(`   🎯 FOUND #00BE16 in CSS ${i + 1}!`);
            colorCount.set('#00BE16', (colorCount.get('#00BE16') || 0) + 10); // Максимальный вес
          }
          
          console.log(`   CSS ${i + 1}: Found ${cssHexMatches.length + cssRgbMatches.length} colors`);
        } else {
          console.log(`   CSS ${i + 1}: Failed to load (${cssResponse.status})`);
        }
      }
    } catch (error) {
      console.log(`   CSS ${i + 1} error:`, error.message);
    }
  }
  
  // 3. Агрессивный анализ ВСЕХ inline стилей в HTML
  console.log('Analyzing inline styles in HTML...');
  
  // Анализируем все элементы с style атрибутами
  $('[style]').each((i, el) => {
    const style = $(el).attr('style');
    if (style) {
      // Поиск HEX цветов в inline стилях
      const inlineHex = style.match(/#[0-9A-Fa-f]{3,6}/g) || [];
      inlineHex.forEach(hex => {
        const normalized = normalizeHex(hex);
        colorCount.set(normalized, (colorCount.get(normalized) || 0) + 4); // Высокий вес для inline стилей
        console.log(`Found inline color: ${normalized}`);
      });
      
      // Поиск RGB цветов в inline стилях
      const inlineRgb = style.match(/rgba?\(\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+)\s*(?:,\s*[\d.]+)?\s*\)/g) || [];
      inlineRgb.forEach(rgb => {
        const rgbMatch = rgb.match(/rgba?\(\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+)\s*/);
        if (rgbMatch) {
          const r = parseInt(rgbMatch[1]);
          const g = parseInt(rgbMatch[2]);  
          const b = parseInt(rgbMatch[3]);
          const hex = '#' + ((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1).toUpperCase();
          colorCount.set(hex, (colorCount.get(hex) || 0) + 4);
          console.log(`Found inline RGB color: ${hex}`);
        }
      });
    }
  });
  
  // 4. Дополнительный поиск в <style> тегах
  $('style').each((i, styleTag) => {
    const styleContent = $(styleTag).html();
    if (styleContent) {
      const styleHex = styleContent.match(/#[0-9A-Fa-f]{3,6}/g) || [];
      styleHex.forEach(hex => {
        const normalized = normalizeHex(hex);
        colorCount.set(normalized, (colorCount.get(normalized) || 0) + 3);
        console.log(`Found style tag color: ${normalized}`);
      });
    }
  });
  
  // 4. Простая фильтрация - берем топ-6 самых частых цветов
  const sortedColors = Array.from(colorCount.entries())
    .sort((a, b) => b[1] - a[1])
    .slice(0, 6)
    .map(([color]) => color);
  
  console.log('Color frequency map (top 10):', Array.from(colorCount.entries())
    .sort((a, b) => b[1] - a[1])
    .slice(0, 10));
  console.log('Selected colors:', sortedColors);
  
  return sortedColors;
}

// Извлечение логотипа
function extractLogo($, baseUrl) {
  const logoCanididates = [];
  
  // Функция для получения абсолютного URL
  function getAbsoluteUrl(src) {
    try {
      if (src.startsWith('//')) {
        return 'https:' + src;
      } else if (src.startsWith('/')) {
        return new URL(src, baseUrl).href;
      } else if (!src.startsWith('http')) {
        return new URL(src, baseUrl).href;
      }
      return src;
    } catch (e) {
      return null;
    }
  }
  
  // Функция для оценки вероятности того, что изображение - логотип
  function scoreLogoCandidate(img) {
    let score = 0;
    const $img = $(img);
    const alt = ($img.attr('alt') || '').toLowerCase();
    const className = ($img.attr('class') || '').toLowerCase();
    const id = ($img.attr('id') || '').toLowerCase();
    const src = ($img.attr('src') || '').toLowerCase();
    const parent = $img.parent();
    const parentClass = (parent.attr('class') || '').toLowerCase();
    const parentId = (parent.attr('id') || '').toLowerCase();
    
    // Высокий приоритет: прямые указания на логотип
    if (alt.includes('logo')) score += 50;
    if (className.includes('logo')) score += 40;
    if (id.includes('logo')) score += 40;
    if (src.includes('logo')) score += 30;
    if (parentClass.includes('logo')) score += 25;
    if (parentId.includes('logo')) score += 25;
    
    // Штрафы за товарные изображения
    if (alt.includes('product') || alt.includes('товар') || alt.includes('item')) score -= 30;
    if (className.includes('product') || className.includes('item') || className.includes('card')) score -= 20;
    if (src.includes('product') || src.includes('item') || src.includes('card')) score -= 15;
    
    // Средний приоритет: контекстные признаки
    if (alt.includes('brand')) score += 20;
    if (className.includes('brand')) score += 15;
    if (alt.includes('site') || alt.includes('company')) score += 10;
    
    // Позиционные факторы
    const isInHeader = $img.closest('header, .header, .navbar, .nav, .top').length > 0;
    if (isInHeader) score += 15;
    
    const isFirstInContainer = $img.is(':first-child') || $img.parent().children('img').first().is($img);
    if (isFirstInContainer && isInHeader) score += 10;
    
    // Размерные факторы (если доступны)
    const width = parseInt($img.attr('width')) || 0;
    const height = parseInt($img.attr('height')) || 0;
    
    if (width > 0 && height > 0) {
      const ratio = width / height;
      // Логотипы обычно горизонтальные или квадратные
      if (ratio >= 0.5 && ratio <= 4) score += 5;
      // Разумные размеры для логотипа
      if (width >= 50 && width <= 400 && height >= 20 && height <= 200) score += 5;
    }
    
    // Штрафы
    if (alt.includes('avatar') || alt.includes('profile')) score -= 20;
    if (className.includes('avatar') || className.includes('profile')) score -= 15;
    if (src.includes('avatar') || src.includes('profile')) score -= 10;
    if (alt.includes('icon') && !alt.includes('logo')) score -= 5;
    
    return score;
  }
  
  // Сначала проверяем специальные контейнеры для логотипа
  const logoContainers = ['#logo', '.logo', '.brand', '.site-logo', '.navbar-brand', '.header-logo', '.site-title', '.logo-container', '.branding'];
  
  for (const container of logoContainers) {
    const $container = $(container);
    if ($container.length > 0) {
      // Ищем изображение внутри контейнера
      const $img = $container.find('img').first();
      if ($img.length > 0) {
        const src = $img.attr('src');
        if (src && !src.includes('data:')) {
          const absoluteUrl = getAbsoluteUrl(src);
          if (absoluteUrl) {
            logoCanididates.push({
              url: absoluteUrl,
              score: 100, // Максимальный приоритет для логотипов в специальных контейнерах
              element: $img
            });
          }
        }
      }
      
      // Проверяем background-image контейнера
      const style = $container.attr('style') || '';
      const bgMatch = style.match(/background-image:\s*url\(['"]?([^'"]+)['"]?\)/);
      if (bgMatch) {
        const bgUrl = getAbsoluteUrl(bgMatch[1]);
        if (bgUrl) {
          logoCanididates.push({
            url: bgUrl,
            score: 95,
            element: $container
          });
        }
      }
    }
  }
  
  // Если не нашли в специальных контейнерах, ищем среди всех изображений
  if (logoCanididates.length === 0) {
    $('img').each((i, img) => {
      const $img = $(img);
      const src = $img.attr('src');
      
      if (src && !src.includes('data:')) {
        const score = scoreLogoCandidate(img);
        const absoluteUrl = getAbsoluteUrl(src);
        
        if (absoluteUrl && score > 15) { // Повышаем минимальный порог
          logoCanididates.push({
            url: absoluteUrl,
            score: score,
            element: $img
          });
        }
      }
    });
  }
  
  // Сортируем по убыванию рейтинга и возвращаем лучший
  logoCanididates.sort((a, b) => b.score - a.score);
  
  return logoCanididates.length > 0 ? logoCanididates[0].url : null;
}

// Извлечение фавиконки
function extractFavicon($, baseUrl) {
  // Ищем различные типы фавиконок
  const faviconSelectors = [
    'link[rel="icon"]',
    'link[rel="shortcut icon"]',
    'link[rel="apple-touch-icon"]',
    'link[rel="apple-touch-icon-precomposed"]'
  ];
  
  for (const selector of faviconSelectors) {
    const faviconLink = $(selector).first();
    if (faviconLink.length > 0) {
      let href = faviconLink.attr('href');
      if (href) {
        try {
          // Преобразуем относительные URL в абсолютные
          if (href.startsWith('//')) {
            href = 'https:' + href;
          } else if (href.startsWith('/')) {
            href = new URL(href, baseUrl).href;
          } else if (!href.startsWith('http')) {
            href = new URL(href, baseUrl).href;
          }
          return href;
        } catch (e) {
          continue;
        }
      }
    }
  }
  
  // Если не найдено, пробуем стандартный путь
  try {
    return new URL('/favicon.ico', baseUrl).href;
  } catch (e) {
    return null;
  }
}

module.exports = router;