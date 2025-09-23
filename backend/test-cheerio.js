const fetch = require('node-fetch');
const cheerio = require('cheerio');

async function testCheerio() {
  try {
    console.log('=== ТЕСТ CHEERIO VS СЫРОЙ HTML ===\n');
    
    const response = await fetch('https://helloismile.com', {
      headers: { 'User-Agent': 'Mozilla/5.0' },
      timeout: 15000
    });
    const html = await response.text();
    const $ = cheerio.load(html);
    
    // Тест 1: Что видит Cheerio
    console.log('1. CHEERIO TEST:');
    const telLinks = $('a[href^="tel:"]');
    console.log('   Найдено tel: ссылок:', telLinks.length);
    
    telLinks.each((i, el) => {
      const href = $(el).attr('href');
      const text = $(el).text();
      console.log(`   ${i + 1}. href="${href}" text="${text}"`);
      
      // Пробуем парсить
      if (href && href.startsWith('tel:')) {
        let phone = href.substring(4);
        try {
          phone = decodeURIComponent(phone);
        } catch (e) {
          phone = phone.replace(/%20/g, ' ').replace(/%2B/g, '+');
        }
        let cleanPhone = phone.replace(/[^\d\+]/g, '');
        console.log(`      → Очищенный: "${cleanPhone}"`);
      }
    });
    
    // Тест 2: Сырой HTML
    console.log('\n2. СЫРОЙ HTML TEST:');
    const rawTelMatches = html.match(/href=["']tel:[^"']+["']/g);
    console.log('   Найдено в сыром HTML:', rawTelMatches ? rawTelMatches.length : 0);
    
    if (rawTelMatches) {
      rawTelMatches.slice(0, 5).forEach((match, i) => {
        console.log(`   ${i + 1}. ${match}`);
        
        // Извлекаем tel: часть
        const telPart = match.match(/tel:([^"']+)/);
        if (telPart) {
          let phone = telPart[1];
          try {
            phone = decodeURIComponent(phone);
          } catch (e) {
            phone = phone.replace(/%20/g, ' ').replace(/%2B/g, '+');
          }
          let cleanPhone = phone.replace(/[^\d\+]/g, '');
          console.log(`      → Очищенный: "${cleanPhone}"`);
        }
      });
    }
    
    // Тест 3: Прямая проверка tel:+1(718)
    console.log('\n3. ПОИСК КОНКРЕТНЫХ ПАТТЕРНОВ:');
    const pattern718 = /tel:\+1\(718\)[^"']*/g;
    const matches718 = html.match(pattern718);
    console.log('   tel:+1(718) паттерны:', matches718 ? matches718.length : 0);
    if (matches718) {
      matches718.forEach((match, i) => {
        console.log(`   ${i + 1}. ${match}`);
      });
    }
    
  } catch (error) {
    console.log('Ошибка:', error.message);
  }
}

testCheerio();