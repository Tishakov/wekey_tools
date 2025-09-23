const fetch = require('node-fetch');
const cheerio = require('cheerio');

async function debugPhones() {
  try {
    const response = await fetch('https://helloismile.com', {
      headers: { 'User-Agent': 'Mozilla/5.0' },
      timeout: 15000
    });
    const html = await response.text();
    const $ = cheerio.load(html);
    
    console.log('=== АНАЛИЗ TEL: ССЫЛОК НА HELLOISMILE.COM ===\n');
    
    // Поиск tel: ссылок через Cheerio
    const telLinks = $('a[href^="tel:"]');
    console.log('Найдено tel: ссылок через Cheerio:', telLinks.length);
    
    telLinks.each((i, el) => {
      const href = $(el).attr('href');
      const text = $(el).text().trim();
      console.log(`${i + 1}. href="${href}" text="${text}"`);
    });
    
    // Поиск tel: в сыром HTML
    console.log('\n=== ПОИСК В СЫРОМ HTML ===');
    const telRegex = /tel:[^"'\s>]+/g;
    const telMatches = html.match(telRegex);
    console.log('tel: в сыром HTML:', telMatches ? telMatches.length : 0);
    if (telMatches) {
      telMatches.forEach((match, i) => {
        console.log(`${i + 1}. ${match}`);
      });
    }
    
    // Поиск href="tel:..."
    const hrefRegex = /href=["']tel:[^"']+["']/g;
    const hrefMatches = html.match(hrefRegex);
    console.log('\nhref="tel:..." паттерны:', hrefMatches ? hrefMatches.length : 0);
    if (hrefMatches) {
      hrefMatches.forEach((match, i) => {
        console.log(`${i + 1}. ${match}`);
      });
    }
    
    // Поиск конкретных телефонов в любом виде
    console.log('\n=== ПОИСК КОНКРЕТНЫХ НОМЕРОВ ===');
    const phone1 = '734-0600';
    const phone2 = '384-8880';
    
    if (html.includes(phone1)) {
      console.log(`✅ ${phone1} найден в HTML`);
      // Найдем контекст
      const index = html.indexOf(phone1);
      const context = html.substring(index - 100, index + phone1.length + 100);
      console.log('   Контекст:', context.replace(/\s+/g, ' ').trim());
    } else {
      console.log(`❌ ${phone1} НЕ найден`);
    }
    
    if (html.includes(phone2)) {
      console.log(`✅ ${phone2} найден в HTML`);
      const index = html.indexOf(phone2);
      const context = html.substring(index - 100, index + phone2.length + 100);
      console.log('   Контекст:', context.replace(/\s+/g, ' ').trim());
    } else {
      console.log(`❌ ${phone2} НЕ найден`);
    }
    
  } catch (error) {
    console.log('Ошибка:', error.message);
  }
}

debugPhones();